import {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { WalletState } from './types';
import { MetamaskWeb3 } from './MetamaskWeb3';
import detectEthereumProvider from '@metamask/detect-provider';
import { useLocalStorage } from 'usehooks-ts';
import { METAMASK_KEY } from './constants';

interface MetaMaskContextData {
  wallet: WalletState;
  hasProvider: boolean;
  error: boolean;
  errorMessage: string;
  isConnecting: boolean;
  isConnected: boolean;
  connect: () => void;
  disconnect: () => void;
  clearError: () => void;
}

const MetamaskContext = createContext<MetaMaskContextData>(
  {} as MetaMaskContextData
);

const defaultWalletState: WalletState = {
  address: '',
  balance: '',
  tokens: [],
  chainId: '',
};

const metamaskConfig = {
  tokens: [
    {
      contractAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
      token: 'USDT',
    },
  ],
};

interface MetamaskProviderProps {
  children: ReactNode;
}

export const MetamaskProvider = ({ children }: MetamaskProviderProps) => {
  const [detected, setDetected] = useState(false);
  const [provider, setProvider] = useState<MetamaskWeb3>();
  const [wallet, setWallet] = useState(defaultWalletState);

  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useLocalStorage(METAMASK_KEY, false);
  const [errorMessage, setErrorMessage] = useState('');

  const clearError = () => setErrorMessage('');

  const _updateWallet = useCallback(
    async (accounts?: string[]) => {
      if (provider) {
        const walletData = await provider.getWalletData(accounts);
        setWallet(walletData);
      }
    },
    [provider]
  );

  const updateWalletAndAccounts = useCallback(
    () => _updateWallet(),
    [_updateWallet]
  );
  const updateWallet = useCallback(
    (accounts: string[]) => _updateWallet(accounts),
    [_updateWallet]
  );

  // detect & save provider wrapper
  useEffect(() => {
    const detectProvider = async () => {
      const detected = await detectEthereumProvider({ silent: true });
      if (detected) {
        setProvider(new MetamaskWeb3(window.ethereum, metamaskConfig));
      }
      setDetected(Boolean(detected));
    };

    detectProvider();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // preload data for the first time & subscribe to events
  useEffect(() => {
    const preload = async () => {
      if (detected && provider) {
        try {
          // user wasn't disconnected from prev page load
          if (isConnected) {
            // await provider.ensureBinanceSmartChainUsed();
            const walletData = await provider.getWalletData();
            setWallet(walletData);
          }
          provider.subscribe('accountsChanged', updateWallet);
          provider.subscribe('chainChanged', updateWalletAndAccounts);
        } catch {
          setErrorMessage('User rejected connection.');
          disconnect();
        }
      }
    };

    preload();

    return () => provider?.unsubscribeAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detected, provider]);

  const connect = async () => {
    if (!provider) {
      return;
    }

    setIsConnecting(true);
    clearError();

    try {
      // await provider.ensureBinanceSmartChainUsed();
      await provider.connect();
      const accounts = await provider.getAccounts();

      updateWallet(accounts);
      setIsConnected(true);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch {
      setErrorMessage('User rejected connection.');
    }

    setIsConnecting(false);
  };

  const disconnect = async () => {
    setIsConnected(false);
    window.location.reload();
  };

  return (
    <MetamaskContext.Provider
      value={{
        wallet,
        hasProvider: !!provider,
        error: !!errorMessage,
        errorMessage,
        isConnecting,
        isConnected,
        connect,
        disconnect,
        clearError,
      }}
    >
      {children}
    </MetamaskContext.Provider>
  );
};

export const useMetaMask = () => {
  const context = useContext(MetamaskContext);

  if (context === undefined) {
    throw new Error(
      'useMetaMask must be used within a "MetaMaskContextProvider"'
    );
  }

  return context;
};
