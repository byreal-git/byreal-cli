/**
 * Skill command - outputs full documentation for AI consumption
 * 参数与前端 API 保持一致
 */

import { Command } from 'commander';
import { VERSION } from '../../core/constants.js';

// ============================================
// Full SKILL Documentation
// ============================================

const SKILL_DOC = `# Byreal CLI - Full Documentation (v${VERSION})

## Overview

Byreal CLI is an AI-friendly tool for managing CLMM liquidity positions on Byreal DEX (Solana).

## Setup

\`\`\`bash
# First-time installation (run once per session)
npm install -g @byreal/byreal-cli

# Verify installation
byreal-cli --version
\`\`\`

## Quick Reference

**Important**: Use \`-o json\` to get structured JSON output for programmatic/LLM consumption. Without \`-o json\`, output is human-readable (tables, charts).

| User Intent | Command |
|-------------|---------|
| List pools | \`byreal-cli pools list -o json\` |
| Pool details | \`byreal-cli pools info <pool-id> -o json\` |
| List tokens | \`byreal-cli tokens list -o json\` |
| Global stats | \`byreal-cli overview -o json\` |
| K-line data | \`byreal-cli pools klines <pool-id> -o json\` |

## Commands

### pools list
Query available liquidity pools with sorting and filtering.

\`\`\`bash
byreal-cli pools list [options]

Options:
  --sort-field <field>  Sort by: tvl, volumeUsd24h, feeUsd24h, apr24h (default: tvl)
  --sort-type <type>    Sort order: asc, desc (default: desc)
  --page <n>            Page number (default: 1)
  --page-size <n>       Results per page (default: 20)
  --category <cat>      Pool category: 1=stable, 2=xStocks, 4=launchpad, 16=normal
  -o, --output <fmt>    Output format: json, table (default: table)
\`\`\`

Examples:
\`\`\`bash
# Top pools by TVL
byreal-cli pools list --sort-field tvl --page-size 10 -o json

# Top pools by APR
byreal-cli pools list --sort-field apr24h -o json

# Stable pools only
byreal-cli pools list --category 1 -o json
\`\`\`

### pools info
Get detailed information about a specific pool.

\`\`\`bash
byreal-cli pools info <pool-id> -o json
\`\`\`

### pools klines
Get K-line (OHLCV) data for a pool.

\`\`\`bash
byreal-cli pools klines <pool-id> [options]

Options:
  --token <address>     Token mint address (auto-detects base token if not provided)
  --interval <type>     K-line interval: 1m, 3m, 5m, 15m, 30m, 1h, 4h, 12h, 1d (default: 1h)
  --start <timestamp>   Start time (seconds since epoch)
  --end <timestamp>     End time (seconds since epoch, default: now)
\`\`\`

Examples:
\`\`\`bash
# Auto-detect base token
byreal-cli pools klines 86zmTi...xVkt --interval 1h -o json

# Specify token explicitly
byreal-cli pools klines 86zmTi...xVkt --token D6xWgR...pump --interval 15m -o json
\`\`\`

### tokens list
Query available tokens with search and sorting.

\`\`\`bash
byreal-cli tokens list [options]

Options:
  --search <keyword>    Search by token address (full address only, symbol search not supported)
  --sort-field <field>  Sort by: tvl, volumeUsd24h, price, priceChange24h, apr24h (default: volumeUsd24h)
  --sort <order>        Sort order: asc, desc (default: desc)
  --page <n>            Page number (default: 1)
  --page-size <n>       Results per page (default: 50)
  --category <cat>      Token category filter
  -o, --output <fmt>    Output format: json, table
\`\`\`

Examples:
\`\`\`bash
# Search by token address
byreal-cli tokens list --search EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v -o json

# Top tokens by volume
byreal-cli tokens list --sort-field volumeUsd24h -o json
\`\`\`

### overview
Get global DEX statistics.

\`\`\`bash
byreal-cli overview -o json
\`\`\`

Response includes:
- TVL and 24h change
- Volume (24h and all-time)
- Fees (24h and all-time)

## Output Format

All commands support \`-o json\` for structured output:

\`\`\`json
{
  "success": true,
  "meta": {
    "timestamp": "2026-02-28T10:30:00Z",
    "version": "${VERSION}",
    "execution_time_ms": 245
  },
  "data": { ... }
}
\`\`\`

Error responses:
\`\`\`json
{
  "success": false,
  "error": {
    "code": "POOL_NOT_FOUND",
    "type": "BUSINESS",
    "message": "Pool not found: xxx",
    "suggestions": [
      {
        "action": "list",
        "description": "List available pools",
        "command": "byreal-cli pools list -o json"
      }
    ]
  }
}
\`\`\`

## Capability Discovery

Use \`byreal-cli catalog\` to discover capabilities:

\`\`\`bash
# List all capabilities
byreal-cli catalog list -o json

# Search capabilities
byreal-cli catalog search pool

# Show capability details with full parameter info
byreal-cli catalog show dex.pool.list -o json
\`\`\`

| Capability ID | Description |
|---------------|-------------|
| dex.pool.list | Query pool list with sorting/filtering |
| dex.pool.info | Get pool details |
| dex.pool.klines | Get K-line data |
| dex.token.list | Query tokens with search |
| dex.overview.global | Global statistics |

## Global Options

| Option | Description |
|--------|-------------|
| -o, --output | Output format: json, table |
| --quiet | Suppress non-essential output |
| --verbose | Show detailed logs |
| --debug | Show debug information |
| -v, --version | Show version |
| -h, --help | Show help |

## Hard Constraints (Do NOT violate)

1. **Always use -o json** when processing data programmatically
2. **Never request or display private keys** - use keypair file paths only
3. **For write operations**: Always preview with --dry-run first, then --confirm
4. **Large amounts (> $10,000)**: Require explicit user confirmation
5. **High slippage (> 200 bps)**: Warn user before proceeding

## Error Handling

When an error occurs, check \`error.suggestions\` for recovery actions:

- \`POOL_NOT_FOUND\` → List available pools
- \`INSUFFICIENT_BALANCE\` → Suggest Swap or reduce amount
- \`NETWORK_ERROR\` → Retry (error is retryable)

## Sort Fields Reference

### Pool Sort Fields (--sort-field)
| Field | Description |
|-------|-------------|
| tvl | Total Value Locked (USD) |
| volumeUsd24h | 24-hour trading volume |
| feeUsd24h | 24-hour fee revenue |
| apr24h | 24-hour APR |

### Token Sort Fields (--sort-field)
| Field | Description |
|-------|-------------|
| tvl | Total Value Locked |
| volumeUsd24h | 24-hour trading volume |
| price | Current price (USD) |
| priceChange24h | 24-hour price change % |
| apr24h | 24-hour APR |

## Pool Categories

| Category | Description |
|----------|-------------|
| 1 | Stable pools (e.g., USDC/USDT) |
| 2 | xStocks pools |
| 4 | Launchpad/Reset pools |
| 16 | Normal pools |
`;

// ============================================
// Create Skill Command
// ============================================

export function createSkillCommand(): Command {
  const skill = new Command('skill')
    .description('Output full documentation for AI consumption')
    .action(() => {
      console.log(SKILL_DOC);
    });

  return skill;
}
