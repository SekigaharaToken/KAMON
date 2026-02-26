# CLAUDE.md — KAMON

## Quick Start

**KAMON** is a House (clan) identity system with competitive leaderboards and staking rewards. 5 elemental Houses compete for seasonal dominance by staking $SEKI and earning leaderboard points.

```bash
npm install
npm run dev              # Local dev server
npm run dev:testnet      # Base Sepolia (VITE_CHAIN_ID=84532)
npm run build            # Production build
npm run lint             # ESLint (flat config)
npm run test             # Vitest (all tests)
npm run test:watch       # Vitest watch mode
```

**Before building, read:**

1. **ProjectRequirementsDoc.md** — Full feature spec, seasonal structure (12 weeks + 1 cooldown), reward mechanics
2. **DataSchema.md** — Mint Club contracts, EAS integration, environment variables, pre-deployment checklist
3. **FrontendGuidelines.md** — Design direction (belligerent feudal), component structure, accessibility
4. **ColorSystem.md** — 8-color palette, House themes, CSS variable setup, House context provider

## Tech Stack

Inherits from AMATERASU:

- React 19 + Vite
- Tailwind CSS + shadcn/ui
- wagmi v2 + viem
- RainbowKit (custom SIWF modal)
- TanStack Query for onchain reads
- i18n (EN, JA, KR)

**KAMON-specific**:

- Mint Club V2 SDK for House NFTs (ERC-1155) + staking pools
- EAS (Ethereum Attestation Service) for House membership attestation + DOJO streak reads
- HouseResolver V2 contract (Foundry, in `contracts/`)
- Generative SVG for Kamon renderer

## Coding Standards

**See FrontendGuidelines.md for component structure, UI patterns, animations, accessibility.**

**Inherit from AMATERASU**:

- JavaScript (no TypeScript unless package requires it)
- ES modules only
- Functional components, one per file
- Tailwind + shadcn/ui, no CSS files
- TanStack Query for onchain reads (no useEffect fetching)
- i18n for all user-facing strings
- wagmi/viem (never ethers.js)

**KAMON-specific**:

- **House color context**: Apply `house-{fire|water|forest|earth|wind}` class to `<html>` on House selection. See ColorSystem.md section 5 for implementation.
- **Leaderboard scoring** (client-side, 15-min refresh): `Activity_Score = (DOJO × 0.40) + (Staking × 0.30) + (OnChat × 0.30)`. Store in localStorage under `kamon_leaderboard_cache`.
- **Mint Club SDK**: Use for House NFTs (buy/sell), staking (deposit/withdraw/claim), and seasonal airdrops. **Gotcha**: SDK methods are `.buy()` / `.sell()`, NOT `.mint()` / `.burn()` — the Bond contract uses mint/burn internally but the SDK wraps them differently.
- **EAS membership**: HouseResolver V2 enforces single-house per wallet AND per FID. Attestation data encodes `(uint8 houseId, uint256 fid)`. Frontend passes FID from FarcasterProvider to `attestHouse()`.
- **EAS reads**: Query DojoResolver directly for DOJO streaks. Cache 30s via TanStack Query.
- **House metadata**: Centralize in `src/config/houses.js` (symbols, colors, description keys, bonding curve addresses).

## File Structure (Key Directories)

```zsh
contracts/
├── src/HouseResolver.sol      # EAS resolver: single-house + FID uniqueness
├── test/HouseResolver.t.sol   # Foundry tests
└── script/DeployHouseResolver.s.sol
src/
├── config/houses.js           # House metadata (centralizes all House data)
├── config/contracts.js        # Contract addresses (EAS, resolver, schema)
├── config/abis/               # ABI arrays for houseResolver, eas
├── context/HouseContext.jsx   # House selection + theme application
├── context/FarcasterProvider.jsx # Farcaster auth + MiniApp FID merging
├── hooks/useHouse.js          # Current House state
├── hooks/useHouseNFT.js       # Mint Club NFT buy/sell (+ local dev bypass)
├── hooks/useHouseMembership.js # EAS attest/revoke + FID lookup
├── hooks/useTransactionStepper.js # Multi-step transaction state machine
├── hooks/useLeaderboard.js    # Leaderboard scoring logic
├── hooks/useEASStreaks.js     # DOJO streak reads
├── components/house/          # House selector, JoinStepper, AbdicateStepper
├── components/staking/        # Staking pool UI
├── components/leaderboard/    # Leaderboard display
├── components/ui/stepper.jsx  # Reusable transaction stepper UI
├── lib/scoring.js             # Score computation (40/30/30 formula)
└── styles/house-themes.css    # House color overrides (CSS classes)
```

See DataSchema.md section 9 for full data flow diagram.

## Environment Variables

**See DataSchema.md section 10 for complete env schema with descriptions.**

```text
VITE_WALLETCONNECT_PROJECT_ID=
VITE_SEKI_TOKEN_ADDRESS=
VITE_DOJO_TOKEN_ADDRESS=
VITE_DOJO_RESOLVER_ADDRESS=
VITE_DOJO_SCHEMA_UID=
VITE_EAS_ADDRESS=
VITE_HOUSE_RESOLVER_ADDRESS=
VITE_HOUSE_SCHEMA_UID=
VITE_HOUSE_FIRE_ADDRESS=
VITE_HOUSE_WATER_ADDRESS=
VITE_HOUSE_FOREST_ADDRESS=
VITE_HOUSE_EARTH_ADDRESS=
VITE_HOUSE_WIND_ADDRESS=
VITE_STAKING_POOL_ADDRESS=
```

## Hard Rules

**Inherit from AMATERASU** (do not use ethers.js, create CSS files, hardcode colors, fetch in useEffect, use localStorage for critical state, build persistent backend, skip i18n, deploy without walkaway test, use non-lowercase hex).

**KAMON-Specific**:

- **Do NOT** fetch leaderboard from backend. Compute client-side, cache in browser localStorage (15-min TTL).
- **Do NOT** break House color theme. Apply CSS class to `<html>` immediately on House selection (see ColorSystem.md).
- **Do NOT** use fixed reward amounts. Streaming is continuous; users can stake/unstake/claim anytime.
- **Do NOT** assume weekly distributions. Rewards are seasonal (once at week 12 EOD, not weekly).
- **Do NOT** query OnChat without fallback. If transaction query fails, degrade to 40% DOJO + 60% staking scoring.
- **Do NOT** change House mid-component. House selection is discrete; use HouseContext to coordinate state.
- **Do NOT** hardcode House data. Centralize metadata (colors, symbols, descriptions, addresses) in `src/config/houses.js` with i18n keys.

## Storage Keys

- `kamon:selected_house` — localStorage, House selection (persists on reload)
- `kamon:house_theme` — localStorage, applied CSS class
- `kamon:farcaster_profile` — sessionStorage, Farcaster auth profile
- `kamon_leaderboard_cache` — localStorage, scores + TTL (15 min)

Inherit from AMATERASU:

- `amaterasu:immutable:*` — localStorage (onchain cache)
