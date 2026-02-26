// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {SchemaResolver} from "@eas/resolver/SchemaResolver.sol";
import {IEAS, Attestation} from "@eas/IEAS.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

interface IERC1155Balance {
    function balanceOf(address account, uint256 id) external view returns (uint256);
}

/// @title HouseResolver
/// @notice EAS schema resolver that enforces single-house membership per wallet.
///         Verifies NFT ownership on attest and stores wallet -> houseId mapping.
contract HouseResolver is SchemaResolver, Ownable {
    // --- Custom Errors ---
    error InvalidHouseId(uint8 houseId);
    error AlreadyMember(address wallet, uint8 currentHouse);
    error NoNFTBalance(address wallet, uint8 houseId);
    error HouseTokenExists(uint8 houseId);
    error HouseTokenNotSet(uint8 houseId);
    error FidAlreadyRegistered(uint256 fid, address existingWallet);
    error InvalidFid(uint256 fid);

    // --- Storage ---
    mapping(address => uint8) public memberHouse;
    mapping(address => bytes32) public memberAttestationUID;
    mapping(uint8 => address) public houseTokens;
    mapping(uint256 => address) public fidWallet;
    uint8 public houseCount;

    // --- Events ---
    event HouseJoined(address indexed wallet, uint8 indexed houseId, uint256 fid, bytes32 attestationUID);
    event HouseLeft(address indexed wallet, uint8 indexed houseId, uint256 fid, bytes32 attestationUID);
    event HouseTokenAdded(uint8 indexed houseId, address tokenAddress);
    event HouseTokenRemoved(uint8 indexed houseId, address previousAddress);
    event HouseTokenUpdated(uint8 indexed houseId, address previousAddress, address newAddress);

    /// @param eas The global EAS contract address.
    /// @param initialOwner The initial contract owner (receives admin rights).
    /// @param houseTokenAddresses Ordered array of 5 House NFT (ERC-1155) addresses.
    ///        Index 0 = houseId 1 (honoo), index 1 = houseId 2 (mizu), etc.
    constructor(
        IEAS eas,
        address initialOwner,
        address[5] memory houseTokenAddresses
    ) SchemaResolver(eas) Ownable(initialOwner) {
        for (uint8 i = 0; i < 5; i++) {
            uint8 houseId = i + 1;
            houseTokens[houseId] = houseTokenAddresses[i];
            emit HouseTokenAdded(houseId, houseTokenAddresses[i]);
        }
        houseCount = 5;
    }

    // --- Owner-only admin functions ---

    /// @notice Register a new House token address.
    function addHouseToken(uint8 houseId, address tokenAddress) external onlyOwner {
        if (houseTokens[houseId] != address(0)) revert HouseTokenExists(houseId);
        houseTokens[houseId] = tokenAddress;
        houseCount++;
        emit HouseTokenAdded(houseId, tokenAddress);
    }

    /// @notice Remove a House token address.
    function removeHouseToken(uint8 houseId) external onlyOwner {
        address prev = houseTokens[houseId];
        if (prev == address(0)) revert HouseTokenNotSet(houseId);
        delete houseTokens[houseId];
        houseCount--;
        emit HouseTokenRemoved(houseId, prev);
    }

    /// @notice Update a House token address.
    function updateHouseToken(uint8 houseId, address newAddress) external onlyOwner {
        address prev = houseTokens[houseId];
        if (prev == address(0)) revert HouseTokenNotSet(houseId);
        houseTokens[houseId] = newAddress;
        emit HouseTokenUpdated(houseId, prev, newAddress);
    }

    // --- SchemaResolver overrides ---

    /// @notice Called by EAS on attest. Validates single-house membership and NFT ownership.
    function onAttest(
        Attestation calldata attestation,
        uint256 /* value */
    ) internal override returns (bool) {
        (uint8 houseId, uint256 fid) = abi.decode(attestation.data, (uint8, uint256));
        address wallet = attestation.recipient;

        // Validate houseId
        if (houseId == 0 || houseTokens[houseId] == address(0)) {
            revert InvalidHouseId(houseId);
        }

        // Validate FID
        if (fid == 0) {
            revert InvalidFid(fid);
        }

        // Reject if FID already registered to a different wallet
        address existingWallet = fidWallet[fid];
        if (existingWallet != address(0) && existingWallet != wallet) {
            revert FidAlreadyRegistered(fid, existingWallet);
        }

        // Reject if wallet already has a house (must revoke first)
        if (memberHouse[wallet] != 0) {
            revert AlreadyMember(wallet, memberHouse[wallet]);
        }

        // Verify NFT ownership (ERC-1155 token ID is always 0)
        uint256 balance = IERC1155Balance(houseTokens[houseId]).balanceOf(wallet, 0);
        if (balance == 0) {
            revert NoNFTBalance(wallet, houseId);
        }

        // Store membership
        memberHouse[wallet] = houseId;
        memberAttestationUID[wallet] = attestation.uid;
        fidWallet[fid] = wallet;

        emit HouseJoined(wallet, houseId, fid, attestation.uid);
        return true;
    }

    /// @notice Called by EAS on revoke. Clears house membership.
    function onRevoke(
        Attestation calldata attestation,
        uint256 /* value */
    ) internal override returns (bool) {
        (uint8 houseId, uint256 fid) = abi.decode(attestation.data, (uint8, uint256));
        address wallet = attestation.recipient;

        delete memberHouse[wallet];
        delete memberAttestationUID[wallet];

        // Clear FID mapping only if it still points to this wallet
        if (fidWallet[fid] == wallet) {
            delete fidWallet[fid];
        }

        emit HouseLeft(wallet, houseId, fid, attestation.uid);
        return true;
    }

    // --- View functions ---

    /// @notice Get the house a wallet belongs to. Returns 0 if none.
    function getHouse(address wallet) external view returns (uint8) {
        return memberHouse[wallet];
    }

    /// @notice Check if a wallet holds NFTs from multiple houses.
    ///         Loops through all registered house tokens and counts balanceOf > 0.
    function isMultiHouseHolder(address wallet) external view returns (bool) {
        uint8 count = 0;
        for (uint8 i = 1; i <= 255; i++) {
            address token = houseTokens[i];
            if (token == address(0)) {
                // Skip gaps but don't break — there might be higher IDs
                if (i > houseCount + 5) break; // safety bound
                continue;
            }
            try IERC1155Balance(token).balanceOf(wallet, 0) returns (uint256 bal) {
                if (bal > 0) count++;
                if (count > 1) return true;
            } catch {
                continue;
            }
        }
        return false;
    }

    /// @notice Get the attestation UID for a wallet's membership.
    function getAttestationUID(address wallet) external view returns (bytes32) {
        return memberAttestationUID[wallet];
    }

    /// @notice Get the ERC-1155 token address for a given houseId.
    function getHouseToken(uint8 houseId) external view returns (address) {
        return houseTokens[houseId];
    }

    /// @notice Get the wallet address registered for a given FID. Returns zero if none.
    function getWalletByFid(uint256 fid) external view returns (address) {
        return fidWallet[fid];
    }
}
