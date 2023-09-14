export enum AccountType {
  METAMASK = 'METAMASK',
  WALLET_CONNECT = 'WALLET_CONNECT',
}

export interface TokenBalance {
  token: string;
  balance: number;
  decimals?: number;
}

export interface WalletState {
  address: string;
  balance: string;
  tokens: TokenBalance[];
  chainId: bigint | null;
}

// CHAIN TYPES
export interface ChainCurrency {
  name: string;
  symbol: string;
  decimals: number;
}

export interface ChainOptions {
  chainId: string;
  chainName: string;
  rpcUrls: string[];
  blockExplorerUrls: string[];
  nativeCurrency: ChainCurrency;
}
