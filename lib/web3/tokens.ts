export const TOKENS = {
  USDC: {
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48" as `0x${string}`,
    decimals: 6,
    symbol: "USDC" as const,
  },
  USDT: {
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7" as `0x${string}`,
    decimals: 6,
    symbol: "USDT" as const,
  },
  SPH: {
    address: (process.env.NEXT_PUBLIC_SOPHO_TOKEN_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    decimals: 18,
    symbol: "SPH" as const,
  },
} as const;

// Sepolia testnet tokens (for testing)
export const SEPOLIA_TOKENS = {
  USDC: {
    address: "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238" as `0x${string}`,
    decimals: 6,
    symbol: "USDC" as const,
  },
  SPH: {
    // This will be set after you deploy SophoToken to Sepolia
    address: (process.env.NEXT_PUBLIC_SOPHO_TOKEN_ADDRESS ||
      "0x0000000000000000000000000000000000000000") as `0x${string}`,
    decimals: 18,
    symbol: "SPH" as const,
  },
} as const;

export const STORE_WALLET = (process.env.NEXT_PUBLIC_STORE_WALLET_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const ESCROW_CONTRACT = (process.env
  .NEXT_PUBLIC_ESCROW_CONTRACT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;

export const SOPHO_NFT_CONTRACT = (process.env
  .NEXT_PUBLIC_SOPHO_NFT_ADDRESS ||
  "0x0000000000000000000000000000000000000000") as `0x${string}`;
