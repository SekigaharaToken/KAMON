export const houseResolverAbi = [
  {
    name: "getHouse",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "uint8" }],
  },
  {
    name: "isMultiHouseHolder",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "bool" }],
  },
  {
    name: "getAttestationUID",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "wallet", type: "address" }],
    outputs: [{ name: "", type: "bytes32" }],
  },
  {
    name: "getHouseToken",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "houseId", type: "uint8" }],
    outputs: [{ name: "", type: "address" }],
  },
  {
    name: "getWalletByFid",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "fid", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
];
