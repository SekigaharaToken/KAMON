// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * Simplified OnChat mock for local Anvil development.
 *
 * Implements the subset of OnChat that KAMON's scoring pipeline queries:
 *   - Channel creation and membership
 *   - Message sending with indexed events
 *   - Message count reads
 *
 * No fees, no moderation, no banning — just core messaging.
 */
contract MockOnChat {
    struct Channel {
        bytes32 slugHash;
        string slug;
        address owner;
        uint40 createdAt;
        uint256 memberCount;
        uint256 messageCount;
    }

    event MessageSent(
        bytes32 indexed slugHash,
        address indexed sender,
        uint256 indexed messageIndex,
        string content
    );

    /// slugHash => Channel
    mapping(bytes32 => Channel) private channels;

    /// slugHash => user => isMember
    mapping(bytes32 => mapping(address => bool)) private members;

    /// Whether a channel exists
    mapping(bytes32 => bool) private channelExists;

    /**
     * Create a new channel. Creator is auto-joined.
     */
    function createChannel(string calldata slug) external {
        bytes32 slugHash = keccak256(abi.encodePacked(slug));
        require(!channelExists[slugHash], "Channel already exists");

        channelExists[slugHash] = true;
        channels[slugHash] = Channel({
            slugHash: slugHash,
            slug: slug,
            owner: msg.sender,
            createdAt: uint40(block.timestamp),
            memberCount: 1,
            messageCount: 0
        });
        members[slugHash][msg.sender] = true;
    }

    /**
     * Join a channel.
     */
    function joinChannel(bytes32 slugHash) external {
        require(channelExists[slugHash], "Channel does not exist");
        require(!members[slugHash][msg.sender], "Already a member");

        members[slugHash][msg.sender] = true;
        channels[slugHash].memberCount++;
    }

    /**
     * Send a message to a channel. Sender must be a member.
     * Emits MessageSent with indexed slugHash, sender, and messageIndex.
     */
    function sendMessage(bytes32 slugHash, string calldata content) external {
        require(channelExists[slugHash], "Channel does not exist");
        require(members[slugHash][msg.sender], "Not a member");

        uint256 idx = channels[slugHash].messageCount;
        channels[slugHash].messageCount++;

        emit MessageSent(slugHash, msg.sender, idx, content);
    }

    /**
     * Get total message count for a channel.
     */
    function getMessageCount(bytes32 slugHash) external view returns (uint256) {
        return channels[slugHash].messageCount;
    }

    /**
     * Compute the keccak256 hash of a channel slug.
     */
    function computeSlugHash(string calldata slug) external pure returns (bytes32) {
        return keccak256(abi.encodePacked(slug));
    }

    /**
     * Check if a user is a member of a channel.
     */
    function isMember(bytes32 slugHash, address user) external view returns (bool) {
        return members[slugHash][user];
    }

    /**
     * Get channel info.
     */
    function getChannel(bytes32 slugHash) external view returns (Channel memory info) {
        require(channelExists[slugHash], "Channel does not exist");
        return channels[slugHash];
    }
}
