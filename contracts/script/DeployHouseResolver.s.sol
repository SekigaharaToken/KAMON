// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IEAS} from "@eas/IEAS.sol";
import {ISchemaRegistry, ISchemaResolver} from "@eas/ISchemaRegistry.sol";
import {HouseResolver} from "../src/HouseResolver.sol";

/**
 * Deploy HouseResolver and register the "uint8 houseId" schema with EAS.
 *
 * Base Mainnet deployment — uses Trezor hardware wallet.
 *
 * Usage:
 *   cd contracts
 *   forge script script/DeployHouseResolver.s.sol \
 *     --rpc-url https://mainnet.base.org \
 *     --trezor \
 *     --broadcast
 */
contract DeployHouseResolver is Script {
    // EAS predeploy on OP Stack chains (Base, Base Sepolia)
    address constant EAS_ADDRESS = 0x4200000000000000000000000000000000000021;
    address constant SCHEMA_REGISTRY = 0x4200000000000000000000000000000000000020;

    // House NFT addresses on Base Mainnet (created via Mint Club V2)
    address constant HOUSE_HONOO  = 0xED6AB904F80fF15935691E28829585a2A765d5a0;
    address constant HOUSE_MIZU   = 0xd887d2cB840Fa108e3f6512e25fdeA4eA6D81230;
    address constant HOUSE_MORI   = 0x920946f6194B3ec01d8e33a3C56Ea308a15a9e42;
    address constant HOUSE_TSUCHI = 0xB0F78cCa90Bf496dd40FeBd294aBF9FC43ef41b8;
    address constant HOUSE_KAZE   = 0x2953Cdbd9D7e6228f1872d151310f79FA2051702;

    function run() external {
        address[5] memory houseTokens = [
            HOUSE_HONOO,
            HOUSE_MIZU,
            HOUSE_MORI,
            HOUSE_TSUCHI,
            HOUSE_KAZE
        ];

        vm.startBroadcast();

        // 1. Deploy HouseResolver
        HouseResolver resolver = new HouseResolver(
            IEAS(EAS_ADDRESS),
            msg.sender,
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

        console.log("=== ADD TO VERCEL ENV ===");
        console.log("VITE_HOUSE_RESOLVER_ADDRESS=%s", address(resolver));
        console.log("VITE_HOUSE_SCHEMA_UID=");
        console.logBytes32(schemaUID);
        console.log("=== END ===");
    }
}
