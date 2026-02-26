// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IEAS} from "@eas/IEAS.sol";
import {ISchemaRegistry, ISchemaResolver} from "@eas/ISchemaRegistry.sol";
import {HouseResolver} from "../src/HouseResolver.sol";

/**
 * Deploy HouseResolver and register the "uint8 houseId" schema with EAS.
 *
 * Requires env vars:
 *   OPERATOR_PRIVATE_KEY — deployer & initial owner
 *   VITE_HOUSE_FIRE_ADDRESS   — House Honoo ERC-1155
 *   VITE_HOUSE_WATER_ADDRESS  — House Mizu ERC-1155
 *   VITE_HOUSE_FOREST_ADDRESS — House Mori ERC-1155
 *   VITE_HOUSE_EARTH_ADDRESS  — House Tsuchi ERC-1155
 *   VITE_HOUSE_WIND_ADDRESS   — House Kaze ERC-1155
 *
 * Usage:
 *   cd contracts
 *   forge script script/DeployHouseResolver.s.sol \
 *     --rpc-url base_sepolia --broadcast
 */
contract DeployHouseResolver is Script {
    // EAS predeploy on OP Stack chains (Base, Base Sepolia)
    address constant EAS_ADDRESS = 0x4200000000000000000000000000000000000021;
    address constant SCHEMA_REGISTRY = 0x4200000000000000000000000000000000000020;

    function run() external {
        uint256 deployerKey = vm.envUint("OPERATOR_PRIVATE_KEY");
        address deployer = vm.addr(deployerKey);

        address[5] memory houseTokens = [
            vm.envAddress("VITE_HOUSE_FIRE_ADDRESS"),
            vm.envAddress("VITE_HOUSE_WATER_ADDRESS"),
            vm.envAddress("VITE_HOUSE_FOREST_ADDRESS"),
            vm.envAddress("VITE_HOUSE_EARTH_ADDRESS"),
            vm.envAddress("VITE_HOUSE_WIND_ADDRESS")
        ];

        vm.startBroadcast(deployerKey);

        // 1. Deploy HouseResolver
        HouseResolver resolver = new HouseResolver(
            IEAS(EAS_ADDRESS),
            deployer,
            houseTokens
        );
        console.log("HouseResolver deployed at: %s", address(resolver));

        // 2. Register schema with resolver
        ISchemaRegistry registry = ISchemaRegistry(SCHEMA_REGISTRY);
        bytes32 schemaUID = registry.register(
            "uint8 houseId",
            ISchemaResolver(address(resolver)),
            true // revocable
        );
        console.log("Schema UID:");
        console.logBytes32(schemaUID);

        vm.stopBroadcast();

        console.log("=== ADD TO .env.testnet ===");
        console.log("VITE_HOUSE_RESOLVER_ADDRESS=%s", address(resolver));
        console.log("VITE_HOUSE_SCHEMA_UID=");
        console.logBytes32(schemaUID);
        console.log("=== END ===");
    }
}
