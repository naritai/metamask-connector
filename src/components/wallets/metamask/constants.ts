export const BSC_ID = '0x38';

const binanceSmartChain = {
  chainId: BSC_ID,
  chainName: 'Smart Chain',
  rpcUrls: ['https://bsc-dataseed.binance.org/'],
  blockExplorerUrls: ['https://bscscan.com'],
  nativeCurrency: {
    name: 'BNB',
    symbol: 'BNB',
    decimals: 18,
  },
};

export const CHAINS_CONFIGS = {
  '0x38': binanceSmartChain,
};

export const METAMASK_ERRORS = {
  CHAIN_NOT_ADDED: 4902,
};

export const ERRORS = {
  NO_PROVIDER_MSG:
    'To be able to connect your wallet, you have to install Metamask extension first.',
};

export const METAMASK_KEY = 'METAMASK_KEY';
