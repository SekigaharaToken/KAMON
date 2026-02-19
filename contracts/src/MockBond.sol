// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./MockERC20.sol";
import "./MockMultiToken.sol";

/**
 * Simplified Mint Club V2 Bond mock for local development.
 *
 * Implements an exponential bonding curve with 500 price variation intervals:
 *   step = floor(supply / STEP_SIZE)
 *   price(supply) = INITIAL_PRICE * e^(ln(FINAL/INITIAL) * step / (NUM_STEPS - 1))
 *
 * Parameters:
 *   - Edition size:  1000
 *   - Price steps:   500  (price changes every 2 mints)
 *   - Initial price: 1 $SEKI
 *   - Final price:   100 $SEKI
 *
 * No royalties, no creation fee — just core mint/burn mechanics.
 */
contract MockBond {
    /// Initial mint price (10 SEKI)
    uint256 public constant INITIAL_PRICE = 10 ether;
    /// Final mint price (100 SEKI)
    uint256 public constant FINAL_PRICE = 100 ether;
    /// Max supply per House
    uint256 public constant MAX_SUPPLY = 1000;
    /// Number of price variation intervals
    uint256 public constant NUM_STEPS = 500;
    /// NFTs per price step (1000 / 500 = 2)
    uint256 public constant STEP_SIZE = MAX_SUPPLY / NUM_STEPS;

    /// ln(10) * 1e18 = ln(FINAL_PRICE / INITIAL_PRICE) * 1e18
    uint256 internal constant LN_PRICE_RATIO = 2_302_585_092_994_045_684;
    /// ln(2) * 1e18
    uint256 internal constant LN2 = 693_147_180_559_945_309;
    /// Fixed-point scale
    uint256 internal constant SCALE = 1e18;

    struct TokenBond {
        address creator;
        uint16 mintRoyalty;
        uint16 burnRoyalty;
        uint40 createdAt;
        address reserveToken;
        uint256 reserveBalance;
    }

    mapping(address => TokenBond) public tokenBond;
    mapping(address => bool) public exists;
    address[] public tokens;

    event TokenCreated(address indexed token, address indexed reserveToken, string symbol);
    event Mint(address indexed token, address indexed to, uint256 amount, uint256 cost);
    event Burn(address indexed token, address indexed from, uint256 amount, uint256 refund);

    /**
     * Create a new ERC-1155 House NFT with a bonding curve.
     */
    function createMultiToken(
        string memory _name,
        string memory _symbol,
        address _reserveToken
    ) external returns (address) {
        MockMultiToken token = new MockMultiToken();
        token.init(_name, _symbol, address(this));

        address tokenAddr = address(token);
        exists[tokenAddr] = true;
        tokens.push(tokenAddr);

        tokenBond[tokenAddr] = TokenBond({
            creator: msg.sender,
            mintRoyalty: 0,
            burnRoyalty: 0,
            createdAt: uint40(block.timestamp),
            reserveToken: _reserveToken,
            reserveBalance: 0
        });

        emit TokenCreated(tokenAddr, _reserveToken, _symbol);
        return tokenAddr;
    }

    /**
     * Buy NFTs along the bonding curve.
     */
    function mint(
        address token,
        uint256 amount,
        uint256 maxReserveAmount,
        address receiver
    ) external returns (uint256) {
        require(exists[token], "MockBond: unknown token");

        uint256 supply = MockMultiToken(token).totalSupply();
        uint256 cost = _getCostForMint(supply, amount);
        require(cost <= maxReserveAmount, "MockBond: slippage");

        address reserveToken = tokenBond[token].reserveToken;
        MockERC20(reserveToken).transferFrom(msg.sender, address(this), cost);
        tokenBond[token].reserveBalance += cost;

        MockMultiToken(token).mintByBond(receiver, amount);

        emit Mint(token, receiver, amount, cost);
        return cost;
    }

    /**
     * Sell NFTs back to the bonding curve.
     */
    function burn(
        address token,
        uint256 amount,
        uint256 minRefund,
        address receiver
    ) external returns (uint256) {
        require(exists[token], "MockBond: unknown token");

        uint256 supply = MockMultiToken(token).totalSupply();
        uint256 refund = _getRefundForBurn(supply, amount);
        require(refund >= minRefund, "MockBond: slippage");

        MockMultiToken(token).burnByBond(msg.sender, amount);

        address reserveToken = tokenBond[token].reserveToken;
        tokenBond[token].reserveBalance -= refund;
        MockERC20(reserveToken).transfer(receiver, refund);

        emit Burn(token, msg.sender, amount, refund);
        return refund;
    }

    // --- View functions matching Mint Club SDK expectations ---

    function getReserveForToken(address token, uint256 amount)
        external view returns (uint256 reserveAmount, uint256 royalty)
    {
        uint256 supply = MockMultiToken(token).totalSupply();
        return (_getCostForMint(supply, amount), 0);
    }

    function getRefundForTokens(address token, uint256 amount)
        external view returns (uint256 refundAmount, uint256 royalty)
    {
        uint256 supply = MockMultiToken(token).totalSupply();
        return (_getRefundForBurn(supply, amount), 0);
    }

    function priceForNextMint(address token) external view returns (uint128) {
        uint256 supply = MockMultiToken(token).totalSupply();
        return uint128(_priceAt(supply));
    }

    function maxSupply(address /* token */) external pure returns (uint128) {
        return uint128(MAX_SUPPLY);
    }

    // --- Exponential pricing ---

    /**
     * Price at a given supply level.
     *
     *   step = floor(supply / STEP_SIZE)
     *   price = INITIAL_PRICE * e^(LN_PRICE_RATIO * step / (NUM_STEPS - 1))
     *
     * supply=0   -> step=0   -> 1 SEKI
     * supply=999 -> step=499 -> 100 SEKI
     */
    function _priceAt(uint256 supply) internal pure returns (uint256) {
        if (supply >= MAX_SUPPLY) return FINAL_PRICE;

        uint256 step = supply / STEP_SIZE;
        if (step == 0) return INITIAL_PRICE;

        // exponent = LN_PRICE_RATIO * step / (NUM_STEPS - 1)
        uint256 exponent = (LN_PRICE_RATIO * step) / (NUM_STEPS - 1);

        // price = INITIAL_PRICE * exp(exponent)
        uint256 expVal = _expScaled(exponent);
        return (INITIAL_PRICE * expVal) / SCALE;
    }

    function _getCostForMint(uint256 currentSupply, uint256 amount) internal pure returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < amount; i++) {
            total += _priceAt(currentSupply + i);
        }
        return total;
    }

    function _getRefundForBurn(uint256 currentSupply, uint256 amount) internal pure returns (uint256) {
        uint256 total = 0;
        for (uint256 i = 0; i < amount; i++) {
            total += _priceAt(currentSupply - 1 - i);
        }
        return total;
    }

    // --- Fixed-point exponential ---

    /**
     * @dev Compute e^(x / SCALE) * SCALE for x >= 0.
     *
     * Decomposes x = n * ln(2) + r, where r is in [0, ln(2)), then:
     *   exp(x) = 2^n * exp(r)
     *
     * exp(r) is computed via Taylor series:
     *   exp(r) = 1 + r + r^2/2! + r^3/3! + ...
     *
     * Since r < ln(2) ≈ 0.693, the series converges in ~12 terms.
     */
    function _expScaled(uint256 x) internal pure returns (uint256) {
        if (x == 0) return SCALE;

        // Decompose: n = floor(x / ln2), r = x mod ln2
        uint256 n = x / LN2;
        uint256 r = x - (n * LN2);

        // Taylor series for exp(r/SCALE) in fixed-point:
        // sum = SCALE + r + r*r/(2*SCALE) + r*r*r/(6*SCALE^2) + ...
        // Iterative: term_k = term_{k-1} * r / (k * SCALE)
        uint256 term = SCALE;
        uint256 sum = term;

        term = (term * r) / (1 * SCALE);
        sum += term;
        term = (term * r) / (2 * SCALE);
        sum += term;
        term = (term * r) / (3 * SCALE);
        sum += term;
        term = (term * r) / (4 * SCALE);
        sum += term;
        term = (term * r) / (5 * SCALE);
        sum += term;
        term = (term * r) / (6 * SCALE);
        sum += term;
        term = (term * r) / (7 * SCALE);
        sum += term;
        term = (term * r) / (8 * SCALE);
        sum += term;
        term = (term * r) / (9 * SCALE);
        sum += term;
        term = (term * r) / (10 * SCALE);
        sum += term;
        term = (term * r) / (11 * SCALE);
        sum += term;
        term = (term * r) / (12 * SCALE);
        sum += term;

        // Multiply by 2^n
        return sum << n;
    }
}
