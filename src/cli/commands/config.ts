/**
 * Config command - view and modify CLI configuration
 */

import { Command } from 'commander';
import type { GlobalOptions } from '../../core/types.js';
import {
  loadConfig,
  getConfigValue,
  setConfigValue,
} from '../../auth/index.js';
import {
  outputJson,
  outputError,
  outputConfigList,
  outputConfigValue,
} from '../output/formatters.js';

// ============================================
// Create Config Command
// ============================================

export function createConfigCommand(): Command {
  const config = new Command('config')
    .description('View and modify CLI configuration');

  // config list (default)
  config
    .command('list', { isDefault: true })
    .description('List all configuration values')
    .action((_options: unknown, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals() as GlobalOptions;
      const startTime = Date.now();

      const result = loadConfig();
      if (!result.ok) {
        outputError(result.error.toJSON(), globalOptions.output);
        process.exit(1);
      }

      if (globalOptions.output === 'json') {
        outputJson(result.value, startTime);
      } else {
        outputConfigList(result.value);
      }
    });

  // config get <key>
  config
    .command('get <key>')
    .description('Get a configuration value (dot-path)')
    .action((key: string, _options: unknown, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals() as GlobalOptions;
      const startTime = Date.now();

      const result = getConfigValue(key);
      if (!result.ok) {
        outputError(result.error.toJSON(), globalOptions.output);
        process.exit(1);
      }

      if (globalOptions.output === 'json') {
        outputJson({ key, value: result.value }, startTime);
      } else {
        outputConfigValue(key, result.value);
      }
    });

  // config set <key> <value>
  config
    .command('set <key> <value>')
    .description('Set a configuration value (with validation)')
    .action((key: string, value: string, _options: unknown, cmd: Command) => {
      const globalOptions = cmd.optsWithGlobals() as GlobalOptions;
      const startTime = Date.now();

      const result = setConfigValue(key, value);
      if (!result.ok) {
        outputError(result.error.toJSON(), globalOptions.output);
        process.exit(1);
      }

      if (globalOptions.output === 'json') {
        outputJson({ key, value, updated: true }, startTime);
      } else {
        console.log(`\nConfiguration updated: ${key} = ${value}`);
      }
    });

  return config;
}
