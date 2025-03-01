import dotenv from "dotenv";
dotenv.config();

// const ARBITRUM_RPC_URL = process.env.ARB_RPC_URL;
// const BASE_RPC_URL = process.env.BASE_RPC_URL;


// export const RPC_CONFIGS = {
//   42161: ARBITRUM_RPC_URL,
//   8453: BASE_RPC_URL,
// };

// export const CHAIN_SLUGS = {
//   42161: "arbitrum-mainnet",
//   8453: "base-mainnet",
// };
export const CHAINS = {
  42161: { name: "arbitrum-mainnet", rpcUrl: process.env.ARB_RPC_URL },
  8453: { name: "base-mainnet", rpcUrl: process.env.BASE_RPC_URL },
};



export const ERC20_ABI = [
  "function balanceOf(address owner) view returns (uint256)",
  "function totalSupply() view returns (uint256)",
  "function name() view returns (string)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function transfer(address to, uint amount) returns (bool)",
  "function approve(address _spender, uint256 _value) returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint amount)",
];
