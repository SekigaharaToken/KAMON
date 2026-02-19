// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Minimal ERC-1155 mock for Mint Club House NFTs.
 * Token ID is always 0 (matching Mint Club behavior).
 * Only the bond contract can mint/burn.
 */
contract MockMultiToken {
    string public name;
    string public symbol;
    address public bond;
    uint256 public totalSupply;

    mapping(address => uint256) internal _balances;
    mapping(address => mapping(address => bool)) public isApprovedForAll;

    event TransferSingle(
        address indexed operator,
        address indexed from,
        address indexed to,
        uint256 id,
        uint256 value
    );
    event ApprovalForAll(address indexed account, address indexed operator, bool approved);

    modifier onlyBond() {
        require(msg.sender == bond, "MockMultiToken: only bond");
        _;
    }

    function init(string memory _name, string memory _symbol, address _bond) external {
        require(bond == address(0), "already initialized");
        name = _name;
        symbol = _symbol;
        bond = _bond;
    }

    function decimals() external pure returns (uint8) {
        return 0;
    }

    function balanceOf(address account, uint256 /* id */) external view returns (uint256) {
        return _balances[account];
    }

    function setApprovalForAll(address operator, bool approved) external {
        isApprovedForAll[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function mintByBond(address to, uint256 amount) external onlyBond {
        _balances[to] += amount;
        totalSupply += amount;
        emit TransferSingle(msg.sender, address(0), to, 0, amount);
    }

    function burnByBond(address from, uint256 amount) external onlyBond {
        require(_balances[from] >= amount, "MockMultiToken: balance");
        _balances[from] -= amount;
        totalSupply -= amount;
        emit TransferSingle(msg.sender, from, address(0), 0, amount);
    }

    /// ERC-1155 receiver check (for staking contract compatibility)
    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return interfaceId == 0xd9b67a26 // ERC-1155
            || interfaceId == 0x01ffc9a7; // ERC-165
    }
}
