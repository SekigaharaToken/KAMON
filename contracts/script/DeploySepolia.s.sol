// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MockERC20.sol";

/**
 * Deploy MockERC20 ($SEKI) to Base Sepolia.
 *
 * The real $SEKI token doesn't exist on Sepolia yet, so we deploy a
 * MockERC20 as the reserve token for Mint Club V2 bonding curves.
 *
 * Usage:
 *   cd contracts
 *   forge script script/DeploySepolia.s.sol \
 *     --rpc-url https://sepolia.base.org \
 *     --private-key $OPERATOR_PRIVATE_KEY \
 *     --broadcast
 */
contract DeploySepolia is Script {
    function run() external {
        uint256 deployerKey = vm.envUint("OPERATOR_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        vm.startBroadcast(deployerKey);

        MockERC20 seki = new MockERC20("Sekigahara", "SEKI");
        seki.mint(deployer, 1_000_000 ether);

        vm.stopBroadcast();

        console.log("=== BASE SEPOLIA DEPLOYMENT ===");
        console.log("VITE_SEKI_TOKEN_ADDRESS=%s", address(seki));
        console.log("Deployer: %s", deployer);
        console.log("SEKI balance: 1,000,000");
        console.log("=== END ===");
    }
}
