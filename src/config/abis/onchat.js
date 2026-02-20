/**
 * OnChat ABI — subset for KAMON scoring queries.
 * Full contract: 0x898D291C2160A9CB110398e9dF3693b7f2c4af2D (Base)
 * Source: github.com/sebayaki/onchat
 */
export const onchatAbi = [
  {
    type: "event",
    name: "MessageSent",
    inputs: [
      { name: "slugHash", type: "bytes32", indexed: true },
      { name: "sender", type: "address", indexed: true },
      { name: "messageIndex", type: "uint256", indexed: true },
      { name: "content", type: "string", indexed: false },
    ],
  },
  {
    type: "function",
    name: "getMessageCount",
    inputs: [{ name: "slugHash", type: "bytes32" }],
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "computeSlugHash",
    inputs: [{ name: "slug", type: "string" }],
    outputs: [{ name: "", type: "bytes32" }],
    stateMutability: "pure",
  },
  {
    type: "function",
    name: "getChannel",
    inputs: [{ name: "slugHash", type: "bytes32" }],
    outputs: [
      {
        name: "info",
        type: "tuple",
        components: [
          { name: "slugHash", type: "bytes32" },
          { name: "slug", type: "string" },
          { name: "owner", type: "address" },
          { name: "createdAt", type: "uint40" },
          { name: "memberCount", type: "uint256" },
          { name: "messageCount", type: "uint256" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "isMember",
    inputs: [
      { name: "slugHash", type: "bytes32" },
      { name: "user", type: "address" },
    ],
    outputs: [{ name: "", type: "bool" }],
    stateMutability: "view",
  },
];
