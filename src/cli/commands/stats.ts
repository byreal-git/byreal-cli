/**
 * Stats command - show CLI download statistics from GitHub Releases
 */

import { Command } from 'commander';
import chalk from 'chalk';
import Table from 'cli-table3';
import { GITHUB_REPO, TABLE_CHARS } from '../../core/constants.js';
import { outputJson } from '../output/formatters.js';

// ============================================
// Types
// ============================================

interface ReleaseStats {
  version: string;
  publishedAt: string;
  downloads: number;
}

// ============================================
// Fetch Release Stats
// ============================================

function fetchReleaseStats(): ReleaseStats[] | null {
  try {
    const { execSync } = require('child_process');
    const result = execSync(
      `curl -sf -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/${GITHUB_REPO}/releases"`,
      { timeout: 10000, encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const releases = JSON.parse(result) as Array<{
      tag_name: string;
      published_at: string;
      assets: Array<{ download_count: number }>;
    }>;

    return releases.map((release) => ({
      version: release.tag_name,
      publishedAt: release.published_at.slice(0, 10),
      downloads: release.assets.reduce((sum, asset) => sum + asset.download_count, 0),
    }));
  } catch {
    return null;
  }
}

// ============================================
// Create Stats Command
// ============================================

export function createStatsCommand(): Command {
  return new Command('stats')
    .description('Show CLI download statistics from GitHub Releases')
    .option('--detail', 'Show per-version download breakdown')
    .action((options: { detail?: boolean }, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals();
      const outputFormat = globalOptions.output || 'table';
      const startTime = Date.now();

      const stats = fetchReleaseStats();

      if (!stats) {
        if (outputFormat === 'json') {
          console.log(JSON.stringify({
            success: false,
            error: {
              code: 'FETCH_FAILED',
              type: 'NETWORK',
              message: 'Failed to fetch release statistics from GitHub',
              suggestions: [
                { action: 'retry', description: 'Check your network connection and try again' },
              ],
            },
          }, null, 2));
        } else {
          console.error(chalk.red('Failed to fetch release statistics from GitHub.'));
          console.error(chalk.gray('Check your network connection and try again.'));
        }
        return;
      }

      const totalDownloads = stats.reduce((sum, r) => sum + r.downloads, 0);

      if (outputFormat === 'json') {
        if (options.detail) {
          outputJson({ totalDownloads, releases: stats }, startTime);
        } else {
          outputJson({ totalDownloads }, startTime);
        }
        return;
      }

      // Table output
      if (options.detail) {
        const table = new Table({
          head: [chalk.cyan.bold('Version'), chalk.cyan.bold('Published'), chalk.cyan.bold('Downloads')],
          chars: TABLE_CHARS,
          style: { head: [], border: [], 'padding-left': 1, 'padding-right': 1 },
        });

        for (const release of stats) {
          table.push([
            chalk.white(release.version),
            chalk.gray(release.publishedAt),
            String(release.downloads),
          ]);
        }

        console.log(table.toString());
        console.log(chalk.cyan.bold(`\nTotal: ${totalDownloads}`));
      } else {
        console.log(chalk.cyan.bold(`Total Downloads: ${totalDownloads}`));
      }
    });
}
