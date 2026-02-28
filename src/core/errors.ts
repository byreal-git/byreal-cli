/**
 * Error definitions for Byreal CLI
 */

import type { CliError, ErrorType, ErrorSuggestion } from './types.js';

// ============================================
// Error Codes
// ============================================

export const ErrorCodes = {
  // Validation errors
  INVALID_PARAMETER: 'INVALID_PARAMETER',
  INVALID_RANGE: 'INVALID_RANGE',
  MISSING_REQUIRED: 'MISSING_REQUIRED',

  // Business errors
  POOL_NOT_FOUND: 'POOL_NOT_FOUND',
  TOKEN_NOT_FOUND: 'TOKEN_NOT_FOUND',
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  SLIPPAGE_EXCEEDED: 'SLIPPAGE_EXCEEDED',
  POSITION_NOT_FOUND: 'POSITION_NOT_FOUND',

  // Auth errors
  KEYPAIR_NOT_FOUND: 'KEYPAIR_NOT_FOUND',
  INVALID_KEYPAIR: 'INVALID_KEYPAIR',
  PERMISSION_DENIED: 'PERMISSION_DENIED',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  TIMEOUT: 'TIMEOUT',

  // System errors
  RPC_ERROR: 'RPC_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

// ============================================
// Error Class
// ============================================

export class ByrealError extends Error implements CliError {
  code: ErrorCode;
  type: ErrorType;
  details?: Record<string, unknown>;
  suggestions?: ErrorSuggestion[];
  retryable: boolean;

  constructor(options: {
    code: ErrorCode;
    type: ErrorType;
    message: string;
    details?: Record<string, unknown>;
    suggestions?: ErrorSuggestion[];
    retryable?: boolean;
  }) {
    super(options.message);
    this.name = 'ByrealError';
    this.code = options.code;
    this.type = options.type;
    this.details = options.details;
    this.suggestions = options.suggestions;
    this.retryable = options.retryable ?? false;
  }

  toJSON(): CliError {
    return {
      code: this.code,
      type: this.type,
      message: this.message,
      details: this.details,
      suggestions: this.suggestions,
      retryable: this.retryable,
    };
  }
}

// ============================================
// Error Factory Functions
// ============================================

export function poolNotFoundError(poolId: string): ByrealError {
  return new ByrealError({
    code: ErrorCodes.POOL_NOT_FOUND,
    type: 'BUSINESS',
    message: `Pool not found: ${poolId}`,
    details: { pool_id: poolId },
    suggestions: [
      {
        action: 'list',
        description: 'List available pools',
        command: 'byreal-cli pools list -o json',
      },
    ],
    retryable: false,
  });
}

export function tokenNotFoundError(mint: string): ByrealError {
  return new ByrealError({
    code: ErrorCodes.TOKEN_NOT_FOUND,
    type: 'BUSINESS',
    message: `Token not found: ${mint}`,
    details: { mint },
    suggestions: [
      {
        action: 'list',
        description: 'List available tokens',
        command: 'byreal-cli tokens list -o json',
      },
    ],
    retryable: false,
  });
}

export function networkError(message: string, details?: Record<string, unknown>): ByrealError {
  return new ByrealError({
    code: ErrorCodes.NETWORK_ERROR,
    type: 'NETWORK',
    message: `Network error: ${message}`,
    details,
    retryable: true,
  });
}

export function apiError(message: string, statusCode?: number): ByrealError {
  return new ByrealError({
    code: ErrorCodes.API_ERROR,
    type: 'NETWORK',
    message: `API error: ${message}`,
    details: statusCode ? { status_code: statusCode } : undefined,
    retryable: statusCode ? statusCode >= 500 : false,
  });
}

export function validationError(message: string, field?: string): ByrealError {
  return new ByrealError({
    code: ErrorCodes.INVALID_PARAMETER,
    type: 'VALIDATION',
    message: message,
    details: field ? { field } : undefined,
    retryable: false,
  });
}

export function keypairNotFoundError(): ByrealError {
  return new ByrealError({
    code: ErrorCodes.KEYPAIR_NOT_FOUND,
    type: 'AUTH',
    message: 'No keypair found. Please configure a wallet.',
    suggestions: [
      {
        action: 'set',
        description: 'Set keypair path',
        command: 'byreal-cli wallet set --keypair-path ~/.config/solana/id.json',
      },
      {
        action: 'env',
        description: 'Or set BYREAL_PRIVATE_KEY environment variable',
      },
    ],
    retryable: false,
  });
}

// ============================================
// Error Formatting
// ============================================

export function formatErrorForOutput(error: ByrealError | Error): {
  success: false;
  error: CliError;
} {
  if (error instanceof ByrealError) {
    return {
      success: false,
      error: error.toJSON(),
    };
  }

  // Convert unknown errors
  return {
    success: false,
    error: {
      code: ErrorCodes.UNKNOWN_ERROR,
      type: 'SYSTEM',
      message: error.message || 'An unknown error occurred',
      retryable: false,
    },
  };
}
