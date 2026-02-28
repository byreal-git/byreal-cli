/**
 * Keypair resolution for Byreal CLI
 * 2-layer priority: CLI flag → config file
 */

import * as fs from 'node:fs';
import { Keypair, PublicKey } from '@solana/web3.js';
import { ok, err } from '../core/types.js';
import type { Result, KeySourceInfo } from '../core/types.js';
import { ByrealError, invalidKeypairError, walletNotConfiguredError } from '../core/errors.js';
import { KEY_SOURCE_LABELS, FILE_PERMISSIONS } from '../core/constants.js';
import { expandTilde, checkFilePermissions } from './security.js';
import { loadConfig } from './config.js';

// ============================================
// Types
// ============================================

export interface ResolvedKeypair {
  keypair: Keypair;
  publicKey: PublicKey;
  address: string;
  source: KeySourceInfo;
}

// ============================================
// Keypair Loading
// ============================================

function loadKeypairFromFile(filePath: string): Result<Keypair, ByrealError> {
  const expanded = expandTilde(filePath);

  if (!fs.existsSync(expanded)) {
    return err(invalidKeypairError('File not found', filePath));
  }

  // Check permissions (warn but don't block unless world-readable)
  const permCheck = checkFilePermissions(filePath, FILE_PERMISSIONS);
  if (!permCheck.ok) return permCheck;

  try {
    const content = fs.readFileSync(expanded, 'utf-8');
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed) || parsed.length !== 64) {
      return err(invalidKeypairError('Expected a 64-byte JSON array', filePath));
    }

    const keypair = Keypair.fromSecretKey(Uint8Array.from(parsed));
    return ok(keypair);
  } catch (e) {
    if (e instanceof ByrealError) return err(e);
    if (e instanceof SyntaxError) {
      return err(invalidKeypairError('Invalid JSON format', filePath));
    }
    return err(invalidKeypairError(`Failed to read: ${(e as Error).message}`, filePath));
  }
}

// ============================================
// Resolution Chain
// ============================================

/**
 * Resolve keypair using 2-layer priority:
 * 1. --keypair-path CLI flag
 * 2. Config file keypair_path
 */
export function resolveKeypair(
  cliPath?: string,
): Result<ResolvedKeypair, ByrealError> {
  // Layer 1: CLI flag
  if (cliPath) {
    const result = loadKeypairFromFile(cliPath);
    if (!result.ok) return result;

    const keypair = result.value;
    return ok({
      keypair,
      publicKey: keypair.publicKey,
      address: keypair.publicKey.toBase58(),
      source: {
        source: 'cli-flag',
        label: KEY_SOURCE_LABELS['cli-flag'],
        path: cliPath,
      },
    });
  }

  // Layer 2: Config file
  const configResult = loadConfig();
  if (configResult.ok) {
    const config = configResult.value;

    if (config.keypair_path) {
      const result = loadKeypairFromFile(config.keypair_path);
      if (!result.ok) return result;

      const keypair = result.value;
      return ok({
        keypair,
        publicKey: keypair.publicKey,
        address: keypair.publicKey.toBase58(),
        source: {
          source: 'config',
          label: KEY_SOURCE_LABELS['config'],
          path: config.keypair_path,
        },
      });
    }
  }

  // No keypair found
  return err(walletNotConfiguredError());
}

/** Resolve only the address without loading the full keypair */
export function resolveAddress(
  cliPath?: string,
): Result<{ address: string; source: KeySourceInfo }, ByrealError> {
  const result = resolveKeypair(cliPath);
  if (!result.ok) return result;

  return ok({
    address: result.value.address,
    source: result.value.source,
  });
}

/** Check if any keypair source is available */
export function hasKeypairSource(cliPath?: string): boolean {
  const result = resolveKeypair(cliPath);
  return result.ok;
}
