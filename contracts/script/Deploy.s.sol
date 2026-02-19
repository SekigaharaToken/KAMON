// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";
import "../src/MockBond.sol";
import "../src/MockDojoResolver.sol";

/**
 * Deploy all mock contracts for local Anvil development.
 *
 * Creates:
 *   - MockERC20 ($SEKI) — reserve token for bonding curves
 *   - MockERC20 ($DOJO) — reward token for staking
 *   - MockBond — bonding curve factory
 *   - 5 House NFTs (via MockBond.createMultiToken)
 *   - MockDojoResolver — DOJO streak oracle
 *
 * Mints 100,000 $SEKI to the deployer (Anvil account 0).
 * Sets initial streaks for Anvil accounts 0-4.
 *
 * Usage:
 *   forge script script/Deploy.s.sol --rpc-url http://localhost:8545 --broadcast
 */
contract DeployLocal is Script {
    function run() external {
        // Anvil default private key (account 0)
        uint256 deployerKey = 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80;
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        // --- Tokens ---
        MockERC20 seki = new MockERC20("Sekigahara", "SEKI");
        MockERC20 dojo = new MockERC20("Dojo Token", "DOJO");

        // Mint tokens to deployer
        seki.mint(deployer, 100_000 ether);
        dojo.mint(deployer, 1_000_000 ether);

        // Also mint to Anvil accounts 1-4 for multi-user testing
        for (uint256 i = 1; i <= 4; i++) {
            address acc = vm.addr(uint256(keccak256(abi.encodePacked(i))));
            // Use Anvil's known accounts instead
        }
        // Anvil accounts 1-9
        address[9] memory anvilAccounts = [
            0x70997970C51812dc3A010C7d01b50e0d17dc79C8,
            0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC,
            0x90F79bf6EB2c4f870365E785982E1f101E93b906,
            0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65,
            0x9965507D1a55bcC2695C58ba16FB37d819B0A4dc,
            0x976EA74026E726554dB657fA54763abd0C3a0aa9,
            0x14DC79964da2C08DDA4Ab80c26Daf6C8e9E9EB93,
            0x23618e81E3f5cdF7f54C3d65f7FBc0aBf5B21E8f,
            0xa0Ee7A142d267C1f36714E4a8F75612F20a79720
        ];
        for (uint256 i = 0; i < 9; i++) {
            seki.mint(anvilAccounts[i], 10_000 ether);
        }

        // --- Bond (factory) ---
        MockBond bond = new MockBond();

        // --- 5 House NFTs ---
        address honoo = bond.createMultiToken("House Honoo", "HONOO", address(seki));
        address mizu  = bond.createMultiToken("House Mizu",  "MIZU",  address(seki));
        address mori  = bond.createMultiToken("House Mori",  "MORI",  address(seki));
        address tsuchi = bond.createMultiToken("House Tsuchi","TSUCHI", address(seki));
        address kaze  = bond.createMultiToken("House Kaze",  "KAZE",  address(seki));

        // --- DojoResolver ---
        MockDojoResolver resolver = new MockDojoResolver();

        // Set some test streak data for deployer
        resolver.setStreak(deployer, 15, 22, block.timestamp - 3600);

        // Set streaks for a few Anvil accounts
        resolver.setStreak(anvilAccounts[0], 7,  12, block.timestamp - 7200);
        resolver.setStreak(anvilAccounts[1], 30, 30, block.timestamp - 1800);
        resolver.setStreak(anvilAccounts[2], 3,  10, block.timestamp - 86400); // at risk (>23h)

        vm.stopBroadcast();

        // --- Output addresses for .env.local ---
        console.log("=== LOCAL DEV ADDRESSES ===");
        console.log("VITE_SEKI_TOKEN_ADDRESS=%s", address(seki));
        console.log("VITE_DOJO_TOKEN_ADDRESS=%s", address(dojo));
        console.log("VITE_HOUSE_FIRE_ADDRESS=%s",  honoo);
        console.log("VITE_HOUSE_WATER_ADDRESS=%s", mizu);
        console.log("VITE_HOUSE_FOREST_ADDRESS=%s", mori);
        console.log("VITE_HOUSE_EARTH_ADDRESS=%s", tsuchi);
        console.log("VITE_HOUSE_WIND_ADDRESS=%s",  kaze);
        console.log("VITE_DOJO_RESOLVER_ADDRESS=%s", address(resolver));
        console.log("VITE_MOCK_BOND_ADDRESS=%s", address(bond));
        console.log("=== END ===");
    }
}
