import dotenv from "dotenv";
dotenv.config();
const ZERO_EX_API_KEY = process.env.ZERO_EX_API_KEY;
const ONE_INCH_API_KEY = process.env.ONE_INCH_API_KEY;
export const ETH_ADDRESS = "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE";
export const CHAINS = {
  42161: { name: "arbitrum-mainnet", rpcUrl: process.env.ARB_RPC_URL },
  8453: { name: "base-mainnet", rpcUrl: process.env.BASE_RPC_URL },
};
export const MAX_RETRIES = 3; 
export const ZERO_EX_PRICE_URL = "https://api.0x.org/swap/permit2/price?";

export const ZERO_EX_API_HEADER = {
  "Content-Type": "application/json",
  "0x-api-key": `${ZERO_EX_API_KEY}`,
  "0x-version": "v2",
};

export const ONE_INCH_QUOTE_URL ="https://api.1inch.dev/swap/v6.0/{chain}/quote?";
export const ONE_INCH_HEADER = { Authorization: `Bearer ${ONE_INCH_API_KEY}` };
export const ONE_INCH_BALANCE_URL = "https://api.1inch.dev/balance/v1.2";
export const ONE_INCH_CROSS_CHAIN_URL="https://api.1inch.dev/fusion-plus/quoter/v1.0/quote/receive?"

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
