/**
 * Setup command - interactive first-time wallet configuration
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as readline from 'node:readline';
import { Command } from 'commander';
import type { GlobalOptions } from '../../core/types.js';
import { BYREAL_KEYS_DIR, DEFAULT_CONFIG, FILE_PERMISSIONS, LOGO, EXPERIMENTAL_WARNING } from '../../core/constants.js';
import {
  resolveAddress,
  hasKeypairSource,
  parsePrivateKeyInput,
  ensureConfigDir,
  setFilePermissions,
  getKeysDir,
  loadConfig,
  saveConfig,
} from '../../auth/index.js';
import chalk from 'chalk';
import { outputError } from '../output/formatters.js';

// ============================================
// Interactive Prompt Helpers
// ============================================

/** Normal prompt via readline (input is visible) */
function ask(question: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function askYN(question: string, defaultYes: boolean): Promise<boolean> {
  const hint = defaultYes ? 'Y/n' : 'y/N';
  return ask(`${question} [${hint}] `).then(input => {
    const lower = input.toLowerCase();
    if (lower === 'y' || lower === 'yes') return true;
    if (lower === 'n' || lower === 'no') return false;
    return defaultYes;
  });
}

/** Secret prompt — no readline, raw mode, no echo */
function askSecret(question: string): Promise<string> {
  return new Promise(resolve => {
    process.stderr.write(question);

    if (typeof process.stdin.setRawMode !== 'function') {
      // Not a TTY (piped input) — fall back to readline
      const rl = readline.createInterface({ input: process.stdin, output: process.stderr });
      rl.question('', answer => {
        rl.close();
        resolve(answer.trim());
      });
      return;
    }

    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf-8');

    let input = '';
    const onData = (ch: string) => {
      for (const c of ch) {
        if (c === '\n' || c === '\r') {
          process.stderr.write('\n');
          done();
          resolve(input.trim());
          return;
        }
        if (c === '\x7f' || c === '\b') {
          input = input.slice(0, -1);
        } else if (c === '\x03') {
          // Ctrl+C
          done();
          process.exit(130);
        } else {
          input += c;
        }
      }
    };

    const done = () => {
      process.stdin.removeListener('data', onData);
      process.stdin.setRawMode(false);
      process.stdin.pause();
    };

    process.stdin.on('data', onData);
  });
}

// ============================================
// Setup Command
// ============================================

export function createSetupCommand(): Command {
  return new Command('setup')
    .description('Interactive first-time setup')
    .action(async (_options: unknown, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals() as GlobalOptions;

      if (globalOptions.nonInteractive) {
        console.error('Setup requires interactive mode. Remove --non-interactive flag.');
        process.exit(1);
      }

      // Show banner
      console.error(chalk.cyan(LOGO) + chalk.yellow(EXPERIMENTAL_WARNING));

      // Check if already configured
      if (hasKeypairSource()) {
        const addr = resolveAddress();
        if (addr.ok) {
          console.error(`\nWallet already configured: ${addr.value.address}\n`);
          const reconfig = await askYN('Reconfigure wallet?', false);
          if (!reconfig) return;
        }
      }

      // Prompt for private key (hidden input)
      console.error('');
      const keyInput = await askSecret('Paste your private key (JSON byte array or Base58): ');
      const parseResult = parsePrivateKeyInput(keyInput);

      if (!parseResult.ok) {
        outputError(parseResult.error.toJSON(), globalOptions.output);
        process.exit(1);
      }

      // Write to ~/.config/byreal/keys/id.json
      ensureConfigDir(BYREAL_KEYS_DIR);
      const destPath = path.join(getKeysDir(), 'id.json');
      fs.writeFileSync(destPath, JSON.stringify(Array.from(parseResult.value)));
      setFilePermissions(destPath, FILE_PERMISSIONS);

      // Save keypair_path to config
      const configResult = loadConfig();
      const config = configResult.ok ? configResult.value : { ...DEFAULT_CONFIG };
      config.keypair_path = '~/.config/byreal/keys/id.json';
      saveConfig(config);

      // Show confirmation
      const address = resolveAddress();
      console.error(`\n  Wallet configured`);
      console.error(`    Address: ${address.ok ? address.value.address : 'unknown'}`);
      console.error(`    Keypair: ~/.config/byreal/keys/id.json`);

      console.error('\n  Setup complete!\n');
      console.error('  Next steps:');
      console.error('    byreal-cli wallet balance    Check your balance');
      console.error('    byreal-cli pools list        Browse liquidity pools');
      console.error('    byreal-cli config list       View all settings\n');
    });
}
