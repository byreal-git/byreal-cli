/**
 * Pools command implementation
 * 参数参考：PoolInfoListReq (poolInfoListReq.ts)
 */

import { Command } from 'commander';
import { api } from '../../api/endpoints.js';
import { DEFAULTS } from '../../core/constants.js';
import {
  output,
  outputError,
  outputPoolsTable,
  outputPoolDetail,
  outputKlineChart,
} from '../output/formatters.js';
import type { OutputFormat, PoolListParams, PoolSortField, KlineInterval } from '../../core/types.js';

// ============================================
// List Pools Command
// ============================================

interface ListPoolsOptions {
  sortField?: PoolSortField;
  sortType?: 'asc' | 'desc';
  page?: string;
  pageSize?: string;
  category?: string;
}

async function listPools(options: ListPoolsOptions, globalOptions: { output: OutputFormat }): Promise<void> {
  const startTime = Date.now();

  const params: PoolListParams = {
    sortField: options.sortField,
    sortType: options.sortType,
    page: options.page ? parseInt(options.page, 10) : 1,
    pageSize: options.pageSize ? parseInt(options.pageSize, 10) : DEFAULTS.LIST_LIMIT,
    category: options.category,
  };

  const result = await api.listPools(params);

  if (!result.ok) {
    outputError(result.error, globalOptions.output);
    process.exit(1);
  }

  const { pools, total, page, pageSize } = result.value;

  output(
    { pools, total, page, pageSize },
    globalOptions.output,
    (data) => outputPoolsTable(data.pools, data.total),
    startTime
  );
}

// ============================================
// Get Pool Info Command
// ============================================

async function getPoolInfo(poolId: string, globalOptions: { output: OutputFormat }): Promise<void> {
  const startTime = Date.now();

  const result = await api.getPoolInfo(poolId);

  if (!result.ok) {
    if (result.error.code === 'POOL_NOT_FOUND') {
      outputError(result.error, globalOptions.output);
    } else {
      outputError(result.error, globalOptions.output);
    }
    process.exit(1);
  }

  output(
    result.value,
    globalOptions.output,
    (pool) => outputPoolDetail(pool),
    startTime
  );
}

// ============================================
// Create Pools Command
// ============================================

export function createPoolsCommand(): Command {
  const pools = new Command('pools')
    .description('Manage and query liquidity pools');

  // List subcommand (default)
  pools
    .command('list', { isDefault: true })
    .description('List available pools (use -o json for JSON output)')
    .option('--sort-field <field>', 'Sort by field: tvl, volumeUsd24h, feeUsd24h, apr24h', 'tvl')
    .option('--sort-type <type>', 'Sort order: asc, desc', 'desc')
    .option('--page <n>', 'Page number', '1')
    .option('--page-size <n>', 'Results per page', String(DEFAULTS.LIST_LIMIT))
    .option('--category <cat>', 'Pool category: 1=stable, 2=xStocks, 4=launchpad, 16=normal')
    .action(async (options: ListPoolsOptions, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals();
      await listPools(options, { output: globalOptions.output || 'table' });
    });

  // Info subcommand
  pools
    .command('info <pool-id>')
    .description('Get detailed information about a pool (use -o json for JSON output)')
    .action(async (poolId: string, _options: unknown, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals();
      await getPoolInfo(poolId, { output: globalOptions.output || 'table' });
    });

  // Klines subcommand
  pools
    .command('klines <pool-id>')
    .description('Get K-line data for a pool (use -o json for JSON output)')
    .option('--token <address>', 'Token mint address (auto-detects base token if not provided)')
    .option('--interval <type>', 'K-line interval: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 12h, 1d', '1h')
    .option('--start <timestamp>', 'Start time (seconds since epoch)')
    .option('--end <timestamp>', 'End time (seconds since epoch, default: now)')
    .action(async (
      poolId: string,
      options: { token?: string; interval: string; start?: string; end?: string },
      cmd: Command
    ) => {
      const globalOptions = cmd.optsWithGlobals();
      const startTime = Date.now();

      // 如果没有提供 token，从池子信息中获取 base token
      let tokenAddress = options.token;
      if (!tokenAddress) {
        const poolResult = await api.getPoolInfo(poolId);
        if (!poolResult.ok) {
          outputError(poolResult.error, globalOptions.output || 'table');
          process.exit(1);
        }
        tokenAddress = poolResult.value.token_a.mint;
      }

      const endTime = options.end ? parseInt(options.end, 10) : Math.floor(Date.now() / 1000);

      // 根据 interval 计算默认时间跨度，确保至少 60 根 K 线
      const intervalSeconds: Record<string, number> = {
        '1m': 60,
        '3m': 3 * 60,
        '5m': 5 * 60,
        '15m': 15 * 60,
        '30m': 30 * 60,
        '1h': 60 * 60,
        '4h': 4 * 60 * 60,
        '12h': 12 * 60 * 60,
        '1d': 24 * 60 * 60,
      };
      const minCandles = 60;
      const intervalSec = intervalSeconds[options.interval] || 60 * 60;
      const defaultTimeRange = intervalSec * minCandles;

      const klineStartTime = options.start
        ? parseInt(options.start, 10)
        : endTime - defaultTimeRange;

      const result = await api.getKlines({
        poolAddress: poolId,
        tokenAddress,
        klineType: options.interval as KlineInterval,
        startTime: klineStartTime,
        endTime,
      });

      if (!result.ok) {
        outputError(result.error, globalOptions.output || 'table');
        process.exit(1);
      }

      output(
        { klines: result.value, pool_id: poolId, token: tokenAddress },
        globalOptions.output || 'table',
        (data) => outputKlineChart(data.klines, data.pool_id, data.token),
        startTime
      );
    });

  return pools;
}
