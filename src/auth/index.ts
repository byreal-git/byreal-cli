/**
 * Auth module exports
 */

export {
  expandTilde,
  fileExists,
  checkFilePermissions,
  setFilePermissions,
  ensureConfigDir,
  validateKeypairFile,
  parsePrivateKeyInput,
} from './security.js';

export {
  getConfigDir,
  getConfigPath,
  getKeysDir,
  configExists,
  loadConfig,
  saveConfig,
  getConfigValue,
  setConfigValue,
  deleteConfig,
  deleteKeypairConfig,
} from './config.js';

export {
  resolveKeypair,
  resolveAddress,
  hasKeypairSource,
} from './keypair.js';

export type { ResolvedKeypair } from './keypair.js';
