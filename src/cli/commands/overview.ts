/**
 * Overview command implementation
 */

import { Command } from 'commander';
import { api } from '../../api/endpoints.js';
import {
  output,
  outputError,
  outputOverviewTable,
} from '../output/formatters.js';
import type { OutputFormat } from '../../core/types.js';

// ============================================
// Overview Command
// ============================================

async function showOverview(globalOptions: { output: OutputFormat }): Promise<void> {
  const startTime = Date.now();

  const result = await api.getGlobalOverview();

  if (!result.ok) {
    outputError(result.error, globalOptions.output);
    process.exit(1);
  }

  output(
    result.value,
    globalOptions.output,
    outputOverviewTable,
    startTime
  );
}

// ============================================
// Create Overview Command
// ============================================

export function createOverviewCommand(): Command {
  const overview = new Command('overview')
    .description('Show global DEX statistics (use -o json for JSON output)')
    .action(async (options: unknown, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals();
      await showOverview({ output: globalOptions.output || 'table' });
    });

  return overview;
}
