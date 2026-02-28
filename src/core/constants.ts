/**
 * Constants for Byreal CLI
 */

// ============================================
// Version
// ============================================

export const VERSION = '0.1.0';
export const CLI_NAME = 'byreal-cli';

// ============================================
// API Configuration
// ============================================

export const API_BASE_URL = process.env.BYREAL_API_URL || 'https://api2.byreal.io';

export const API_ENDPOINTS = {
  // Pool endpoints (参考 dex.ts 端点配置)
  POOLS_LIST: '/byreal/api/dex/v2/pools/info/list',
  POOL_DETAILS: '/byreal/api/dex/v2/pools/details',
  POOL_KLINES: '/byreal/api/dex/v2/kline/query-ui',  // 后端已返回 uiPrice

  // Token endpoints (参考 dex.ts 端点配置)
  TOKENS_LIST: '/byreal/api/dex/v2/mint/list',
  TOKEN_PRICE: '/byreal/api/dex/v2/mint/price',

  // Overview
  OVERVIEW_GLOBAL: '/byreal/api/dex/v2/overview/global',

  // Swap endpoints
  SWAP_QUOTE: '/byreal/api/router/v1/router-service/swap',
  SWAP_EXECUTE_AMM: '/byreal/api/dex/v2/send-swap-tx',
  SWAP_EXECUTE_RFQ: '/byreal/api/rfq/v1/swap',
} as const;

// ============================================
// Solana Configuration
// ============================================

export const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
export const SOLANA_CLUSTER = process.env.SOLANA_CLUSTER || 'mainnet-beta';

// ============================================
// Config Paths
// ============================================

export const CONFIG_DIR = '~/.config/byreal';
export const CONFIG_FILE = 'config.json';
export const DEFAULT_SOLANA_KEYPAIR = '~/.config/solana/id.json';

// ============================================
// Defaults
// ============================================

export const DEFAULTS = {
  OUTPUT_FORMAT: 'table' as const,
  LIST_LIMIT: 20,
  MAX_LIST_LIMIT: 100,
  SLIPPAGE_BPS: 50,
  MAX_SLIPPAGE_BPS: 500,
  PRIORITY_FEE_MICRO_LAMPORTS: 50000,
  REQUEST_TIMEOUT_MS: 30000,
  AUTO_CONFIRM_THRESHOLD_USD: 10,
} as const;

// ============================================
// Table Configuration
// ============================================

export const TABLE_CHARS = {
  top: '',
  'top-mid': '',
  'top-left': '',
  'top-right': '',
  bottom: '',
  'bottom-mid': '',
  'bottom-left': '',
  'bottom-right': '',
  left: '',
  'left-mid': '',
  mid: '',
  'mid-mid': '',
  right: '',
  'right-mid': '',
  middle: ' ',
} as const;

// ============================================
// ASCII Art
// ============================================

export const LOGO = `
╔══════════════════════════════════════════════════════════╗
║                                                          ║
║   ██████╗ ██╗   ██╗██████╗ ███████╗ █████╗ ██╗           ║
║   ██╔══██╗╚██╗ ██╔╝██╔══██╗██╔════╝██╔══██╗██║           ║
║   ██████╔╝ ╚████╔╝ ██████╔╝█████╗  ███████║██║           ║
║   ██╔══██╗  ╚██╔╝  ██╔══██╗██╔══╝  ██╔══██║██║           ║
║   ██████╔╝   ██║   ██║  ██║███████╗██║  ██║███████╗      ║
║   ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝╚══════╝      ║
║                                                          ║
║   CLMM DEX on Solana                                     ║
║   https://byreal.io                                      ║
║                                                          ║
╚══════════════════════════════════════════════════════════╝
`;

export const EXPERIMENTAL_WARNING = `
⚠️  WARNING: This CLI is experimental and under active development.
    Use at your own risk. Always verify transactions before confirming.
`;
