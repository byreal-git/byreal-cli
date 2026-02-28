/**
 * Security utilities for Byreal CLI
 * File permissions, path expansion, keypair validation
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import bs58 from 'bs58';
import { Keypair } from '@solana/web3.js';
import { ok, err } from '../core/types.js';
import type { Result } from '../core/types.js';
import { ByrealError, invalidKeypairError, permissionError } from '../core/errors.js';
import { DIR_PERMISSIONS, FILE_PERMISSIONS } from '../core/constants.js';

// ============================================
// Path Utilities
// ============================================

/** Expand ~ to os.homedir() */
export function expandTilde(filePath: string): string {
  if (filePath.startsWith('~/') || filePath === '~') {
    return path.join(os.homedir(), filePath.slice(1));
  }
  return filePath;
}

/** Check if file exists (with tilde expansion) */
export function fileExists(filePath: string): boolean {
  try {
    fs.accessSync(expandTilde(filePath), fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

// ============================================
// Permission Checks
// ============================================

/** Check file permissions (Unix only, skipped on non-Unix) */
export function checkFilePermissions(
  filePath: string,
  expectedMode: number,
): Result<void, ByrealError> {
  // Skip permission checks on non-Unix platforms
  if (process.platform === 'win32') {
    return ok(undefined);
  }

  const expanded = expandTilde(filePath);
  try {
    const stat = fs.statSync(expanded);
    const actualMode = stat.mode & 0o777;

    // Block if world-readable (others can read)
    if (actualMode & 0o004) {
      return err(
        permissionError(filePath, expectedMode.toString(8), actualMode.toString(8)),
      );
    }

    // Warn if group-readable but don't block
    if (actualMode & 0o040) {
      process.stderr.write(
        `Warning: ${filePath} has group-readable permissions (${actualMode.toString(8)}). Consider: chmod ${expectedMode.toString(8)} ${filePath}\n`,
      );
    }

    return ok(undefined);
  } catch {
    // If we can't stat, it's fine - the file might not exist yet
    return ok(undefined);
  }
}

/** Set file permissions */
export function setFilePermissions(filePath: string, mode: number): void {
  if (process.platform === 'win32') return;
  const expanded = expandTilde(filePath);
  fs.chmodSync(expanded, mode);
}

/** Ensure config directory exists with proper permissions */
export function ensureConfigDir(dirPath: string): void {
  const expanded = expandTilde(dirPath);
  fs.mkdirSync(expanded, { recursive: true, mode: DIR_PERMISSIONS });
  // Explicitly set permissions (mkdirSync mode is affected by umask)
  if (process.platform !== 'win32') {
    fs.chmodSync(expanded, DIR_PERMISSIONS);
  }
}

// ============================================
// Keypair Validation
// ============================================

/** Validate a Solana keypair file format (64-byte number array). Does NOT retain the key. */
export function validateKeypairFile(filePath: string): Result<void, ByrealError> {
  const expanded = expandTilde(filePath);

  // Check file exists
  if (!fs.existsSync(expanded)) {
    return err(invalidKeypairError('File not found', filePath));
  }

  // Check permissions
  const permCheck = checkFilePermissions(filePath, FILE_PERMISSIONS);
  if (!permCheck.ok) {
    return permCheck;
  }

  // Read and validate format
  try {
    const content = fs.readFileSync(expanded, 'utf-8');
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      return err(invalidKeypairError('Expected a JSON array of numbers', filePath));
    }

    if (parsed.length !== 64) {
      return err(invalidKeypairError(`Expected 64 bytes, got ${parsed.length}`, filePath));
    }

    for (let i = 0; i < parsed.length; i++) {
      if (typeof parsed[i] !== 'number' || parsed[i] < 0 || parsed[i] > 255 || !Number.isInteger(parsed[i])) {
        return err(invalidKeypairError(`Invalid byte value at index ${i}`, filePath));
      }
    }

    return ok(undefined);
  } catch (e) {
    if (e instanceof SyntaxError) {
      return err(invalidKeypairError('Invalid JSON format', filePath));
    }
    return err(invalidKeypairError(`Failed to read file: ${(e as Error).message}`, filePath));
  }
}

// ============================================
// Private Key Input Parsing
// ============================================

/** Parse user-provided private key input (JSON byte array or Base58 string) */
export function parsePrivateKeyInput(input: string): Result<Uint8Array, ByrealError> {
  const trimmed = input.trim();

  if (!trimmed) {
    return err(invalidKeypairError('Empty input'));
  }

  let bytes: Uint8Array;

  if (trimmed.startsWith('[')) {
    // JSON byte array format: [174,47,154,...]
    try {
      const parsed = JSON.parse(trimmed);

      if (!Array.isArray(parsed)) {
        return err(invalidKeypairError('Expected a JSON array of numbers'));
      }

      if (parsed.length !== 64) {
        return err(invalidKeypairError(`Expected 64 bytes, got ${parsed.length}`));
      }

      for (let i = 0; i < parsed.length; i++) {
        if (typeof parsed[i] !== 'number' || parsed[i] < 0 || parsed[i] > 255 || !Number.isInteger(parsed[i])) {
          return err(invalidKeypairError(`Invalid byte value at index ${i}`));
        }
      }

      bytes = Uint8Array.from(parsed);
    } catch (e) {
      if (e instanceof ByrealError) return err(e);
      return err(invalidKeypairError('Invalid JSON format'));
    }
  } else {
    // Base58 format
    try {
      bytes = bs58.decode(trimmed);
    } catch {
      return err(invalidKeypairError('Invalid Base58 string'));
    }

    if (bytes.length !== 64) {
      return err(invalidKeypairError(`Expected 64 bytes after Base58 decode, got ${bytes.length}`));
    }
  }

  // Validate the keypair is usable
  try {
    Keypair.fromSecretKey(bytes);
  } catch {
    return err(invalidKeypairError('Invalid keypair: secret key does not produce a valid key pair'));
  }

  return ok(bytes);
}
