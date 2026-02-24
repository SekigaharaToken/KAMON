// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IEAS, AttestationRequest, AttestationRequestData, RevocationRequest, RevocationRequestData} from "@eas/IEAS.sol";
import {EAS} from "@eas/EAS.sol";
import {SchemaRegistry, ISchemaRegistry} from "@eas/SchemaRegistry.sol";
import {ISchemaResolver} from "@eas/resolver/ISchemaResolver.sol";
import {HouseResolver} from "../src/HouseResolver.sol";
import {MockMultiToken} from "../src/MockMultiToken.sol";

contract HouseResolverTest is Test {
    EAS public eas;
    SchemaRegistry public schemaRegistry;
    HouseResolver public resolver;
    bytes32 public schemaUID;

    MockMultiToken[5] public tokens;
    address public owner = address(0xABCD);
    address public alice = address(0x1);
    address public bob = address(0x2);
    // Bond address for minting NFTs
    address public bond = address(0xB0BD);

    function setUp() public {
        // Deploy EAS infrastructure
        schemaRegistry = new SchemaRegistry();
        eas = new EAS(ISchemaRegistry(address(schemaRegistry)));

        // Deploy 5 House NFT tokens
        address[5] memory tokenAddrs;
        for (uint8 i = 0; i < 5; i++) {
            tokens[i] = new MockMultiToken();
            tokens[i].init(
                string(abi.encodePacked("House ", vm.toString(i + 1))),
                string(abi.encodePacked("H", vm.toString(i + 1))),
                bond
            );
            tokenAddrs[i] = address(tokens[i]);
        }

        // Deploy HouseResolver
        resolver = new HouseResolver(IEAS(address(eas)), owner, tokenAddrs);

        // Register schema
        schemaUID = schemaRegistry.register(
            "uint8 houseId",
            ISchemaResolver(address(resolver)),
            true
        );
    }

    // --- Helper functions ---

    function _mintNFT(address wallet, uint8 tokenIndex) internal {
        vm.prank(bond);
        tokens[tokenIndex].mintByBond(wallet, 1);
    }

    function _burnNFT(address wallet, uint8 tokenIndex) internal {
        vm.prank(bond);
        tokens[tokenIndex].burnByBond(wallet, 1);
    }

    function _attest(address wallet, uint8 houseId) internal returns (bytes32) {
        return eas.attest(
            AttestationRequest({
                schema: schemaUID,
                data: AttestationRequestData({
                    recipient: wallet,
                    expirationTime: 0,
                    revocable: true,
                    refUID: bytes32(0),
                    data: abi.encode(houseId),
                    value: 0
                })
            })
        );
    }

    function _revoke(bytes32 uid, uint8 /* houseId */) internal {
        eas.revoke(
            RevocationRequest({
                schema: schemaUID,
                data: RevocationRequestData({
                    uid: uid,
                    value: 0
                })
            })
        );
    }

    // --- Attest tests ---

    function test_attest_success() public {
        _mintNFT(alice, 0); // House 1 (honoo)
        bytes32 uid = _attest(alice, 1);

        assertEq(resolver.memberHouse(alice), 1);
        assertEq(resolver.memberAttestationUID(alice), uid);
        assertEq(resolver.getHouse(alice), 1);
        assertEq(resolver.getAttestationUID(alice), uid);
    }

    function test_attest_emits_HouseJoined() public {
        _mintNFT(alice, 2); // House 3 (mori)

        vm.expectEmit(true, true, false, false);
        emit HouseResolver.HouseJoined(alice, 3, bytes32(0));

        _attest(alice, 3);
    }

    function test_attest_rejects_houseId_zero() public {
        _mintNFT(alice, 0);

        vm.expectRevert(abi.encodeWithSelector(HouseResolver.InvalidHouseId.selector, 0));
        _attest(alice, 0);
    }

    function test_attest_rejects_nonexistent_houseId() public {
        vm.expectRevert(abi.encodeWithSelector(HouseResolver.InvalidHouseId.selector, 99));
        _attest(alice, 99);
    }

    function test_attest_rejects_duplicate_membership() public {
        _mintNFT(alice, 0);
        _attest(alice, 1);

        // Try to join house 2 without revoking first
        _mintNFT(alice, 1);
        vm.expectRevert(abi.encodeWithSelector(HouseResolver.AlreadyMember.selector, alice, 1));
        _attest(alice, 2);
    }

    function test_attest_rejects_no_nft_balance() public {
        // Alice has no NFT for house 1
        vm.expectRevert(abi.encodeWithSelector(HouseResolver.NoNFTBalance.selector, alice, 1));
        _attest(alice, 1);
    }

    // --- Revoke tests ---

    function test_revoke_clears_mapping() public {
        _mintNFT(alice, 0);
        bytes32 uid = _attest(alice, 1);

        assertEq(resolver.memberHouse(alice), 1);

        _revoke(uid, 1);

        assertEq(resolver.memberHouse(alice), 0);
        assertEq(resolver.memberAttestationUID(alice), bytes32(0));
    }

    function test_revoke_emits_HouseLeft() public {
        _mintNFT(alice, 0);
        bytes32 uid = _attest(alice, 1);

        vm.expectEmit(true, true, false, false);
        emit HouseResolver.HouseLeft(alice, 1, bytes32(0));

        _revoke(uid, 1);
    }

    function test_reattest_after_revoke() public {
        // Join house 1
        _mintNFT(alice, 0);
        bytes32 uid1 = _attest(alice, 1);

        // Leave house 1
        _revoke(uid1, 1);
        assertEq(resolver.memberHouse(alice), 0);

        // Join house 3
        _mintNFT(alice, 2);
        bytes32 uid2 = _attest(alice, 3);

        assertEq(resolver.memberHouse(alice), 3);
        assertEq(resolver.memberAttestationUID(alice), uid2);
    }

    // --- isMultiHouseHolder tests ---

    function test_isMultiHouseHolder_false_for_single_house() public {
        _mintNFT(alice, 0);
        assertFalse(resolver.isMultiHouseHolder(alice));
    }

    function test_isMultiHouseHolder_true_for_two_houses() public {
        _mintNFT(alice, 0); // House 1
        _mintNFT(alice, 1); // House 2
        assertTrue(resolver.isMultiHouseHolder(alice));
    }

    function test_isMultiHouseHolder_false_for_no_houses() public {
        assertFalse(resolver.isMultiHouseHolder(alice));
    }

    // --- Admin function tests ---

    function test_addHouseToken() public {
        MockMultiToken newToken = new MockMultiToken();
        newToken.init("House 6", "H6", bond);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit HouseResolver.HouseTokenAdded(6, address(newToken));
        resolver.addHouseToken(6, address(newToken));

        assertEq(resolver.getHouseToken(6), address(newToken));
        assertEq(resolver.houseCount(), 6);
    }

    function test_addHouseToken_rejects_existing() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(HouseResolver.HouseTokenExists.selector, 1));
        resolver.addHouseToken(1, address(0x999));
    }

    function test_removeHouseToken() public {
        address prevAddr = resolver.getHouseToken(5);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit HouseResolver.HouseTokenRemoved(5, prevAddr);
        resolver.removeHouseToken(5);

        assertEq(resolver.getHouseToken(5), address(0));
        assertEq(resolver.houseCount(), 4);
    }

    function test_removeHouseToken_rejects_nonexistent() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(HouseResolver.HouseTokenNotSet.selector, 99));
        resolver.removeHouseToken(99);
    }

    function test_updateHouseToken() public {
        address prevAddr = resolver.getHouseToken(1);
        address newAddr = address(0x999);

        vm.prank(owner);
        vm.expectEmit(true, false, false, true);
        emit HouseResolver.HouseTokenUpdated(1, prevAddr, newAddr);
        resolver.updateHouseToken(1, newAddr);

        assertEq(resolver.getHouseToken(1), newAddr);
    }

    function test_updateHouseToken_rejects_nonexistent() public {
        vm.prank(owner);
        vm.expectRevert(abi.encodeWithSelector(HouseResolver.HouseTokenNotSet.selector, 99));
        resolver.updateHouseToken(99, address(0x999));
    }

    function test_nonOwner_cannot_call_admin() public {
        vm.prank(alice);
        vm.expectRevert();
        resolver.addHouseToken(6, address(0x999));

        vm.prank(alice);
        vm.expectRevert();
        resolver.removeHouseToken(1);

        vm.prank(alice);
        vm.expectRevert();
        resolver.updateHouseToken(1, address(0x999));
    }

    // --- Ownership transfer test ---

    function test_ownership_transfer() public {
        assertEq(resolver.owner(), owner);

        vm.prank(owner);
        resolver.transferOwnership(bob);

        assertEq(resolver.owner(), bob);

        // Old owner can no longer call admin
        vm.prank(owner);
        vm.expectRevert();
        resolver.addHouseToken(6, address(0x999));

        // New owner can
        MockMultiToken newToken = new MockMultiToken();
        newToken.init("House 6", "H6", bond);
        vm.prank(bob);
        resolver.addHouseToken(6, address(newToken));
        assertEq(resolver.getHouseToken(6), address(newToken));
    }

    // --- Constructor tests ---

    function test_constructor_sets_initial_tokens() public {
        for (uint8 i = 1; i <= 5; i++) {
            assertEq(resolver.getHouseToken(i), address(tokens[i - 1]));
        }
        assertEq(resolver.houseCount(), 5);
    }
}
