---
name: byreal-lp
description: "Manage CLMM liquidity positions on Byreal DEX (Solana). Use when user mentions LP, liquidity, pools, yield farming, or DeFi positions on Byreal/Solana."
---

# Byreal LP Management

## Get Full Documentation

```bash
npx @byreal/byreal-cli@latest skill
```

## Setup

```bash
npm install -g @byreal/byreal-cli
```

## Quick Reference

**Note**: Use `-o json` for structured JSON output (for LLM/programmatic use). Without it, output is human-readable (tables, charts).

| User Intent | Command |
|-------------|---------|
| List pools | `byreal-cli pools list -o json` |
| Top APR pools | `byreal-cli pools list --sort-field apr24h -o json` |
| Pool details | `byreal-cli pools info <pool-id> -o json` |
| Global stats | `byreal-cli overview -o json` |
| Search tokens | `byreal-cli tokens list --search <address> -o json` |
| K-line data | `byreal-cli pools klines <pool-id> -o json` |
| Wallet address | `byreal-cli wallet address -o json` |
| Wallet balance | `byreal-cli wallet balance -o json` |
| Set keypair | `byreal-cli wallet set <keypair-path>` |
| Config list | `byreal-cli config list -o json` |
| First-time setup | `byreal-cli setup` |
| Find capability | `byreal-cli catalog show dex.pool.list -o json` |

## Key Parameters

### Pools
- `--sort-field`: tvl, volumeUsd24h, feeUsd24h, apr24h
- `--sort-type`: asc, desc
- `--page`, `--page-size`: Pagination
- `--category`: 1=stable, 2=xStocks, 4=launchpad, 16=normal

### Tokens
- `--search`: Search by token address (full address only)
- `--sort-field`: tvl, volumeUsd24h, price, priceChange24h, apr24h
- `--sort`: asc, desc

## Risk Mapping

| User Expression | Range | Tick Range | Notes |
|-----------------|-------|------------|-------|
| "Conservative" | ±30% | ±1500 | Low maintenance |
| "Balanced" | ±15% | ±750 | Moderate |
| "Aggressive" | ±5% | ±250 | High yield, needs rebalance |

## Hard Constraints

1. **Always use `-o json`** for AI processing
2. **Never display private keys** - use keypair paths only
3. **Preview first** with `--dry-run`, then `--confirm`
4. **Large amounts (>$1000)** require explicit confirmation
5. **High slippage (>200 bps)** must warn user
