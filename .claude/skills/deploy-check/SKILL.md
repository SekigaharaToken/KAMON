---
name: deploy-check
description: Verify deployment prerequisites — env vars, ABI consistency, schema UIDs, and contract readiness
disable-model-invocation: true
---

# Deploy Check

Run pre-deployment verification for KAMON. Check all required environment variables, contract configuration, and build health before deploying.

## Checklist

### 1. Environment Variables
Read `.env.testnet` (or the target env file) and verify ALL of these are set and non-empty:

| Variable | Purpose |
|----------|---------|
| `VITE_WALLETCONNECT_PROJECT_ID` | WalletConnect project ID |
| `VITE_EAS_ADDRESS` | EAS contract address |
| `VITE_HOUSE_RESOLVER_ADDRESS` | HouseResolver V2 address |
| `VITE_HOUSE_SCHEMA_UID` | EAS schema UID for `(uint8 houseId, uint256 fid)` |
| `VITE_SEKI_TOKEN_ADDRESS` | $SEKI token address |
| `VITE_DOJO_TOKEN_ADDRESS` | $DOJO token address |
| `VITE_DOJO_RESOLVER_ADDRESS` | DOJO streak resolver |
| `VITE_DOJO_SCHEMA_UID` | DOJO schema UID |
| `VITE_HOUSE_FIRE_ADDRESS` | House Honoo NFT address |
| `VITE_HOUSE_WATER_ADDRESS` | House Mizu NFT address |
| `VITE_HOUSE_FOREST_ADDRESS` | House Mori NFT address |
| `VITE_HOUSE_EARTH_ADDRESS` | House Tsuchi NFT address |
| `VITE_HOUSE_WIND_ADDRESS` | House Kaze NFT address |
| `VITE_STAKING_POOL_ADDRESS` | Staking pool address |

Report any missing or empty variables.

### 2. ABI Consistency
Verify that `src/config/abis/houseResolver.js` includes these functions (matching HouseResolver V2):
- `getHouse(address) -> uint8`
- `isMultiHouseHolder(address) -> bool`
- `getAttestationUID(address) -> bytes32`
- `getHouseToken(uint8) -> address`
- `getWalletByFid(uint256) -> address`

### 3. Build Check
Run `npm run build` and verify it completes without errors.

### 4. Lint Check
Run `npm run lint` and verify zero errors.

### 5. Test Suite
Run `npm test` and verify all tests pass.

### 6. Version Check
Read `package.json` version and report it. Confirm it was bumped if contract changes were made.

## Output
Present results as a checklist with pass/fail for each item. If any check fails, clearly state what needs to be fixed before deploying.
