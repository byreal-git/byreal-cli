/**
 * Update command - check for and install updates
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { execSync } from 'child_process';
import { VERSION } from '../../core/constants.js';
import { checkForUpdate, INSTALL_COMMAND } from '../../core/update-check.js';

// ============================================
// Create Update Command
// ============================================

export function createUpdateCommand(): Command {
  const update = new Command('update')
    .description('Check for and install CLI updates');

  // check subcommand
  update
    .command('check')
    .description('Check for available updates')
    .action((_options: unknown, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals();
      const result = checkForUpdate(true);

      if (globalOptions.output === 'json') {
        console.log(JSON.stringify({
          success: true,
          meta: { timestamp: new Date().toISOString(), version: VERSION },
          data: {
            currentVersion: VERSION,
            latestVersion: result?.latestVersion ?? VERSION,
            updateAvailable: result?.updateAvailable ?? false,
            installCommand: INSTALL_COMMAND,
          },
        }, null, 2));
        return;
      }

      if (!result) {
        console.log(chalk.yellow('Could not check for updates (no releases found or network error).'));
        console.log(chalk.gray(`Current version: ${VERSION}`));
        return;
      }

      if (result.updateAvailable) {
        console.log(chalk.green(`Update available: ${result.currentVersion} → ${result.latestVersion}`));
        console.log(chalk.gray(`Run: ${INSTALL_COMMAND}`));
      } else {
        console.log(chalk.green(`Already up to date (v${VERSION})`));
      }
    });

  // install subcommand
  update
    .command('install')
    .description('Install the latest version')
    .action(() => {
      console.log(chalk.cyan(`Installing latest version from GitHub...`));
      console.log(chalk.gray(`> ${INSTALL_COMMAND}\n`));

      try {
        execSync(INSTALL_COMMAND, { stdio: 'inherit' });
        console.log(chalk.green('\nUpdate complete!'));
      } catch {
        console.error(chalk.red('\nUpdate failed. Try running manually:'));
        console.error(chalk.gray(`  ${INSTALL_COMMAND}`));
        process.exit(1);
      }
    });

  return update;
}
