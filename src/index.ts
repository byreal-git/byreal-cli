/**
 * Byreal CLI - AI-friendly CLI for Byreal CLMM DEX on Solana
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { VERSION, CLI_NAME, LOGO, EXPERIMENTAL_WARNING } from './core/constants.js';
import { createPoolsCommand } from './cli/commands/pools.js';
import { createTokensCommand } from './cli/commands/tokens.js';
import { createOverviewCommand } from './cli/commands/overview.js';
import { createSkillCommand } from './cli/commands/skill.js';
import { createCatalogCommand } from './cli/commands/catalog.js';

// ============================================
// Main Program
// ============================================

const program = new Command();

program
  .name(CLI_NAME)
  .description('AI-friendly CLI for Byreal CLMM DEX on Solana')
  .version(VERSION, '-v, --version', 'Output the version number')
  .option('-o, --output <format>', 'Output format (json, table)', 'table')
  .option('--quiet', 'Suppress non-essential output')
  .option('--verbose', 'Show detailed logs')
  .option('--debug', 'Show debug information')
  .addHelpText('before', chalk.cyan(LOGO) + chalk.yellow(EXPERIMENTAL_WARNING))
  .hook('preAction', (thisCommand) => {
    const opts = thisCommand.opts();
    if (opts.debug) {
      process.env.DEBUG = 'true';
    }
  });

// ============================================
// Register Commands
// ============================================

program.addCommand(createPoolsCommand());
program.addCommand(createTokensCommand());
program.addCommand(createOverviewCommand());
program.addCommand(createSkillCommand());
program.addCommand(createCatalogCommand());

// ============================================
// Error Handling
// ============================================

program.showHelpAfterError('(add --help for additional information)');

// Handle unknown commands
program.on('command:*', () => {
  console.error(chalk.red(`\nError: Unknown command "${program.args.join(' ')}"`));
  console.log();
  program.outputHelp();
  process.exit(1);
});

// ============================================
// Parse and Execute
// ============================================

async function main() {
  try {
    await program.parseAsync(process.argv);
  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
      if (process.env.DEBUG) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}

main();
