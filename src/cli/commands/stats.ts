/**
 * Stats command - show CLI download statistics from GitHub Releases + npm Registry
 */

import { Command } from "commander";
import chalk from "chalk";
import { GITHUB_REPO } from "../../core/constants.js";
import { outputJson } from "../output/formatters.js";

interface NpmDownloads {
  total: number;
  period: string;
}

const NPM_PACKAGE = "@byreal-io/byreal-cli";

// ============================================
// Fetch Stats
// ============================================

function fetchGitHubDownloads(): number | null {
  try {
    const { execSync } = require("child_process");
    const result = execSync(
      `curl -sf -H "Accept: application/vnd.github.v3+json" "https://api.github.com/repos/${GITHUB_REPO}/releases"`,
      { timeout: 10000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const releases = JSON.parse(result) as Array<{
      assets: Array<{ download_count: number }>;
    }>;

    return releases.reduce(
      (total, release) =>
        total +
        release.assets.reduce((sum, asset) => sum + asset.download_count, 0),
      0,
    );
  } catch {
    return null;
  }
}

function fetchNpmDownloads(): NpmDownloads | null {
  try {
    const { execSync } = require("child_process");
    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const startDate = "2026-01-01";
    const result = execSync(
      `curl -sf "https://api.npmjs.org/downloads/point/${startDate}:${today}/${encodeURIComponent(NPM_PACKAGE)}"`,
      { timeout: 10000, encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] },
    );
    const data = JSON.parse(result) as {
      downloads: number;
      start: string;
      end: string;
    };
    return { total: data.downloads, period: `${data.start} ~ ${data.end}` };
  } catch {
    return null;
  }
}

// ============================================
// Create Stats Command
// ============================================

export function createStatsCommand(): Command {
  return new Command("stats")
    .description("Show CLI download statistics from GitHub Releases and npm")
    .action((_options: Record<string, unknown>, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals();
      const outputFormat = globalOptions.output || "table";
      const startTime = Date.now();

      const githubTotal = fetchGitHubDownloads();
      const npmStats = fetchNpmDownloads();

      if (githubTotal === null && !npmStats) {
        if (outputFormat === "json") {
          console.log(
            JSON.stringify(
              {
                success: false,
                error: {
                  code: "FETCH_FAILED",
                  type: "NETWORK",
                  message: "Failed to fetch download statistics",
                  suggestions: [
                    {
                      action: "retry",
                      description:
                        "Check your network connection and try again",
                    },
                  ],
                },
              },
              null,
              2,
            ),
          );
        } else {
          console.error(chalk.red("Failed to fetch download statistics."));
          console.error(
            chalk.gray("Check your network connection and try again."),
          );
        }
        return;
      }

      const ghTotal = githubTotal ?? 0;
      const npmTotal = npmStats?.total ?? 0;
      const totalDownloads = ghTotal + npmTotal;

      if (outputFormat === "json") {
        const jsonData: Record<string, unknown> = {
          totalDownloads,
          github: {
            downloads: ghTotal,
          },
          npm: {
            downloads: npmTotal,
            ...(npmStats ? { period: npmStats.period } : {}),
          },
        };
        outputJson(jsonData, startTime);
        return;
      }

      // Table output
      console.log(chalk.white.bold("\nNPM Registry"));
      if (npmStats) {
        console.log(chalk.gray(`  Period: ${npmStats.period}`));
        console.log(chalk.gray(`  Downloads: ${npmTotal}`));
      } else {
        console.log(chalk.gray("  Not yet published or no downloads"));
      }

      console.log(chalk.white.bold("\nGitHub Releases"));
      if (githubTotal !== null) {
        console.log(chalk.gray(`  Downloads: ${ghTotal}`));
      } else {
        console.log(chalk.gray("  Unavailable"));
      }

      console.log(chalk.cyan.bold(`\nTotal Downloads: ${totalDownloads}`));
      const parts: string[] = [];
      if (npmTotal > 0) parts.push(`NPM ${npmTotal}`);
      if (ghTotal > 0) parts.push(`GitHub ${ghTotal}`);
      if (parts.length === 2) {
        console.log(chalk.gray(`  (${parts.join(" + ")})`));
      }
      console.log();
    });
}
