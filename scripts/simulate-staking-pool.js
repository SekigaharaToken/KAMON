#!/usr/bin/env node
/**
 * Simulate staking pool creation on Base mainnet.
 * Read-only — queries on-chain values and prints the createPool parameters.
 *
 * Usage: node scripts/simulate-staking-pool.js
 */

import { mintclub } from "mint.club-v2-sdk";
import { createPublicClient, http, formatUnits, parseUnits } from "viem";
import { base } from "viem/chains";

// Token addresses on Base mainnet
const SEKI = "0x6ABF95F802119c8e46c5DB4a21E22Ef7298e1DA4";
const DOJO = "0x6edb6D582B5CFaB335Ec45384F3Ff18C1c4Fc22d";

// Season 1: Mar 4 2026 00:00 UTC → May 27 2026 00:00 UTC (12 weeks)
const REWARD_STARTS_AT = Math.floor(new Date("2026-03-04T00:00:00Z").getTime() / 1000);
const REWARD_DURATION = 604800 * 12; // 12 weeks in seconds
const REWARD_AMOUNT = parseUnits("500000", 18); // 500k $DOJO

const client = createPublicClient({ chain: base, transport: http() });

// Configure SDK with public client
mintclub.withPublicClient(client);

async function main() {
  console.log("=== Staking Pool Simulation (Base Mainnet) ===\n");

  // 1. Check creation fee
  const stake = mintclub.network("base").stake;
  const creationFee = await stake.getCreationFee();
  console.log(`Creation fee: ${formatUnits(creationFee, 18)} ETH (${creationFee} wei)`);

  // 2. Check max reward duration
  const maxDuration = await stake.getMaxRewardDuration();
  const minDuration = await stake.getMinRewardDuration();
  console.log(`Min reward duration: ${Number(minDuration)} seconds (${Number(minDuration) / 604800} weeks)`);
  console.log(`Max reward duration: ${Number(maxDuration)} seconds (${Number(maxDuration) / 604800} weeks)`);
  console.log(`Our reward duration: ${REWARD_DURATION} seconds (12 weeks)`);

  if (BigInt(REWARD_DURATION) > maxDuration) {
    console.error("\n!! 12 weeks EXCEEDS max reward duration! Reduce duration.");
    process.exit(1);
  }
  if (BigInt(REWARD_DURATION) < minDuration) {
    console.error("\n!! 12 weeks is BELOW min reward duration!");
    process.exit(1);
  }
  console.log("  ✓ Duration is within protocol limits\n");

  // 3. Check current pool count
  const poolCount = await stake.getPoolCount();
  console.log(`Current pool count: ${poolCount}`);
  console.log(`New pool will be ID: ${poolCount}\n`);

  // 4. Print createPool parameters
  console.log("=== createPool Parameters ===");
  console.log(`  stakingToken:        ${SEKI} ($SEKI)`);
  console.log(`  isStakingTokenERC20: true`);
  console.log(`  rewardToken:         ${DOJO} ($DOJO)`);
  console.log(`  rewardAmount:        ${REWARD_AMOUNT} (${formatUnits(REWARD_AMOUNT, 18)} $DOJO)`);
  console.log(`  rewardStartsAt:      ${REWARD_STARTS_AT} (${new Date(REWARD_STARTS_AT * 1000).toISOString()})`);
  console.log(`  rewardDuration:      ${REWARD_DURATION} (12 weeks)`);
  console.log(`  creationFee (value): ${creationFee} wei`);

  console.log("\n=== Pre-flight Checklist ===");
  console.log(`  [ ] Operator wallet has ${formatUnits(creationFee, 18)} ETH for creation fee`);
  console.log(`  [ ] Operator wallet has 500,000 $DOJO to fund rewards`);
  console.log(`  [ ] Operator wallet has approved Stake contract to spend $DOJO`);
  console.log(`\n=== END ===`);
}

main().catch((err) => {
  console.error("Simulation failed:", err.message);
  process.exit(1);
});
