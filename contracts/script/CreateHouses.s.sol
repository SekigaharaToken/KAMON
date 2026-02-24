// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";

/**
 * Create 5 House NFTs on the real Mint Club V2 Bond contract (Base Sepolia).
 *
 * Uses the deployed MockERC20 ($SEKI) as the reserve token.
 * Each House gets a flat bonding curve: 1000 NFTs at 10 SEKI each.
 *
 * Usage:
 *   cd contracts
 *   forge script script/CreateHouses.s.sol \
 *     --rpc-url https://sepolia.base.org \
 *     --private-key $OPERATOR_PRIVATE_KEY \
 *     --broadcast
 */

interface IMintClubBond {
    struct MultiTokenParams {
        string name;
        string symbol;
        string uri;
    }

    struct BondParams {
        uint16 mintRoyalty;
        uint16 burnRoyalty;
        address reserveToken;
        uint128 maxSupply;
        uint128[] stepRanges;
        uint128[] stepPrices;
    }

    function createMultiToken(
        MultiTokenParams calldata tp,
        BondParams calldata bp
    ) external payable returns (address);

    function creationFee() external view returns (uint256);
}

contract CreateHouses is Script {
    // Mint Club V2 Bond on Base Sepolia
    address constant BOND = 0x5dfA75b0185efBaEF286E80B847ce84ff8a62C2d;
    // MockERC20 $SEKI deployed in Step 2
    address constant SEKI = 0xbF051B2Dd76bA0F6eD82b03897C49d67922ca1e7;

    function run() external {
        uint256 deployerKey = vm.envUint("OPERATOR_PRIVATE_KEY");
        IMintClubBond bond = IMintClubBond(BOND);

        // Check creation fee (expected 0 on Sepolia)
        uint256 fee = bond.creationFee();
        console.log("Creation fee: %d wei", fee);

        // Flat bonding curve: 1000 NFTs max, 10 SEKI each
        uint128[] memory stepRanges = new uint128[](1);
        stepRanges[0] = 1000;

        uint128[] memory stepPrices = new uint128[](1);
        stepPrices[0] = 10 ether; // 10 SEKI (18 decimals)

        IMintClubBond.BondParams memory bp = IMintClubBond.BondParams({
            mintRoyalty: 300,  // 3%
            burnRoyalty: 300,  // 3%
            reserveToken: SEKI,
            maxSupply: 1000,
            stepRanges: stepRanges,
            stepPrices: stepPrices
        });

        // House names, symbols, and placeholder URIs
        string[5] memory names  = ["House Honoo", "House Mizu", "House Mori", "House Tsuchi", "House Kaze"];
        string[5] memory symbols = ["HONOO", "MIZU", "MORI", "TSUCHI", "KAZE"];
        string[5] memory uris = [
            "https://kamon.seki.gg/meta/honoo.json",
            "https://kamon.seki.gg/meta/mizu.json",
            "https://kamon.seki.gg/meta/mori.json",
            "https://kamon.seki.gg/meta/tsuchi.json",
            "https://kamon.seki.gg/meta/kaze.json"
        ];

        vm.startBroadcast(deployerKey);

        address[5] memory houses;
        for (uint256 i = 0; i < 5; i++) {
            IMintClubBond.MultiTokenParams memory tp = IMintClubBond.MultiTokenParams({
                name: names[i],
                symbol: symbols[i],
                uri: uris[i]
            });

            houses[i] = bond.createMultiToken{value: fee}(tp, bp);
            console.log("%s = %s", symbols[i], houses[i]);
        }

        vm.stopBroadcast();

        console.log("=== HOUSE NFT ADDRESSES ===");
        console.log("VITE_HOUSE_FIRE_ADDRESS=%s",   houses[0]);
        console.log("VITE_HOUSE_WATER_ADDRESS=%s",  houses[1]);
        console.log("VITE_HOUSE_FOREST_ADDRESS=%s", houses[2]);
        console.log("VITE_HOUSE_EARTH_ADDRESS=%s",  houses[3]);
        console.log("VITE_HOUSE_WIND_ADDRESS=%s",   houses[4]);
        console.log("=== END ===");
    }
}
