# Byreal CLI - Project Rules

## Display Rules

- **Never abbreviate on-chain addresses**: In both table and JSON output, always display Solana mint / pool / position addresses in full. Never truncate with `...`.

## Commit Convention

- All commit messages must be in English
- Use conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`

## Architecture

- `src/cli/` — Command definitions and output formatting
- `src/core/` — Types, constants, API client
- `src/sdk/` — On-chain interaction (Solana RPC, transaction building)
- `src/libs/` — Vendored libraries (CLMM SDK)
- `skills/` — AI skill definition for LLM integration
