// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Mock DojoResolver for local development.
 * Returns configurable streak data per address.
 * Owner can set streaks for any address.
 */
contract MockDojoResolver {
    struct StreakData {
        uint256 currentStreak;
        uint256 longestStreak;
        uint256 lastCheckIn;
    }

    mapping(address => StreakData) internal _streaks;

    /// Set streak data for a user (dev helper)
    function setStreak(
        address user,
        uint256 _currentStreak,
        uint256 _longestStreak,
        uint256 _lastCheckIn
    ) external {
        _streaks[user] = StreakData(_currentStreak, _longestStreak, _lastCheckIn);
    }

    /// Batch set for convenience
    function setStreakBatch(
        address[] calldata users,
        uint256[] calldata currentStreaks,
        uint256[] calldata longestStreaks,
        uint256[] calldata lastCheckIns
    ) external {
        for (uint256 i = 0; i < users.length; i++) {
            _streaks[users[i]] = StreakData(
                currentStreaks[i],
                longestStreaks[i],
                lastCheckIns[i]
            );
        }
    }

    function currentStreak(address user) external view returns (uint256) {
        return _streaks[user].currentStreak;
    }

    function longestStreak(address user) external view returns (uint256) {
        return _streaks[user].longestStreak;
    }

    function lastCheckIn(address user) external view returns (uint256) {
        return _streaks[user].lastCheckIn;
    }
}
