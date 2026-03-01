---
name: byreal-cli
description: "Byreal DEX (Solana) all-in-one CLI: query pools/tokens/TVL, analyze pool APR & risk, open/close/claim CLMM positions, token swap, wallet & balance management. Use when user mentions Byreal, LP, liquidity, pools, DeFi positions, token swap, or Solana DEX operations."
---

# Byreal LP Management

## Get Full Documentation

Always run these commands first to get complete, up-to-date documentation:

```bash
# Complete documentation (commands, parameters, workflows, constraints)
byreal-cli skill

# Structured capability discovery (all capabilities with params)
byreal-cli catalog list -o json

# Detailed parameter info for a specific capability
byreal-cli catalog show <capability-id> -o json
```

If `byreal-cli` is not installed globally, use `npx`:

```bash
npx @byreal/byreal-cli@latest skill
```

## Setup

```bash
npm install -g @byreal/byreal-cli
```

## Output Format Rule (CRITICAL)

- **`-o json`**: Use ONLY when you need to parse the result for further logic (e.g., extract pool address, compare values, feed into next command).
- **No `-o json`** (default table/chart): Use when the user wants to **see** results. The CLI has built-in tables, charts, and K-line visualizations — do NOT re-implement them. Just run the command and let the user read the output.

**Rule of thumb**: If the user says "show me", "look at", "check", "how is" → **omit `-o json`**. If you need the data for a subsequent step → use `-o json`.

## Quick Reference

Commands below show `-o json` for reference. **Omit `-o json` when displaying results to the user.**

| User Intent | Command |
|-------------|---------|
| List pools | `byreal-cli pools list` |
| Top APR pools | `byreal-cli pools list --sort-field apr24h` |
| Pool details | `byreal-cli pools info <pool-id>` |
| Pool analysis | `byreal-cli pools analyze <pool-id>` |
| K-line / price trend | `byreal-cli pools klines <pool-id>` |
| Global stats | `byreal-cli overview` |
| Search tokens | `byreal-cli tokens list --search <address>` |
| Wallet address | `byreal-cli wallet address` |
| Wallet balance | `byreal-cli wallet balance` |
| Set keypair | `byreal-cli wallet set <keypair-path>` |
| Config list | `byreal-cli config list` |
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

## Key Workflows

**Investment Opportunities**: `pools list` → pick top candidates → **`pools analyze` each** (do NOT skip analyze — it provides APR, risk, range analysis that `pools list` doesn't have) → recommend with reasoning.

**Opening a Position (by USD)**: `pools analyze` → choose range → `positions open --amount-usd <usd> --dry-run` (CLI auto-calculates token split) → if insufficient balance, swap from ANY token → `--confirm`.

**Opening a Position (by token)**: `pools analyze` → choose range → `wallet balance` (check ALL tokens) → swap if needed (source can be **ANY token**: SOL, USDC, USDT, etc.) → `positions open --base MintA --amount <amt> --dry-run` → `--confirm`.

**Insufficient Balance**: Check `wallet balance` for ALL available tokens. Swap from whichever token has the highest balance — not just the pool's own tokens. SOL → any token is always an option.

## Risk Mapping

| User Expression | Range | Tick Range | Notes |
|-----------------|-------|------------|-------|
| "Conservative" | ±30% | ±1500 | Low maintenance |
| "Balanced" | ±15% | ±750 | Moderate |
| "Aggressive" | ±5% | ±250 | High yield, needs rebalance |

## Wallet Check

Before executing any command that requires a wallet (swap, positions, wallet balance, etc.), **always check wallet configuration first**:

```bash
byreal-cli wallet address
```

- If it returns an address → wallet is configured, proceed.
- If it returns `WALLET_NOT_CONFIGURED` → tell the user to run `byreal-cli setup` first.

Do NOT attempt wallet-required operations without confirming the wallet is configured.

## Hard Constraints

1. **`-o json` only for parsing** — when showing results to the user, **omit it** and let the CLI's built-in tables/charts render directly. Never fetch JSON then re-draw charts yourself.
2. **Never truncate on-chain data** — always display the FULL string for: transaction signatures (txid), mint addresses, pool addresses, NFT addresses, wallet addresses. Never use `xxx...yyy` abbreviation.
3. **Never display private keys** - use keypair paths only
4. **Preview first** with `--dry-run`, then `--confirm`
5. **Large amounts (>$1000)** require explicit confirmation
6. **High slippage (>200 bps)** must warn user
7. **Check wallet before write ops** — run `wallet address` before any wallet-required command
