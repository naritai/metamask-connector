import { MetaMaskInpageProvider } from '@metamask/providers';
import Web3 from 'web3';
import { tokenABI } from '../../../lib/tokenABI';
import { TokenBalance, WalletState } from './types';

interface TokenConfig {
  contractAddress: string;
  token: string;
}

interface Config {
  tokens: TokenConfig[];
}

const defaultWalletState: WalletState = {
  address: '',
  balance: '',
  tokens: [],
  chainId: null,
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (args: any) => any;

export class MetamaskWeb3Wrapper {
  private raw_ethereum: MetaMaskInpageProvider;
  private provider: Web3;
  private accounts: string[] = [];
  private config: Config;

  constructor(ethereum: MetaMaskInpageProvider, config: Config) {
    this.config = config;
    this.raw_ethereum = ethereum;
    this.provider = new Web3(this.raw_ethereum);
  }

  async connect(): Promise<boolean> {
    let success = true;
    try {
      await this.provider.eth.requestAccounts();
    } catch {
      success = false;
    }
    return success;
  }

  async getAccounts(): Promise<string[]> {
    try {
      this.accounts = await this.provider.eth.getAccounts();
    } catch (error) {
      console.error('Cannot get accounts of metamask wallet');
    }
    return this.accounts;
  }

  async getWalletData(accounts?: string[]): Promise<WalletState> {
    let wallet = defaultWalletState;

    try {
      const accs = accounts || (await this.getAccounts());

      if (!accs.length) {
        return wallet;
      }

      const walletAddress = accs[0];
      const walletBalace = await this.getWalletBalance(walletAddress);
      const tokenBalances = await this.getTokenBalances(walletAddress);
      const chainId = await this.getChainId();

      wallet = {
        address: walletAddress,
        balance: walletBalace,
        tokens: tokenBalances,
        chainId,
      };
    } catch (err) {
      console.error(err);
    }

    return wallet;
  }

  async getWalletBalance(walletAdress: string): Promise<string> {
    const nativeBalance = await this.provider.eth.getBalance(walletAdress);
    return this.provider.utils.fromWei(nativeBalance, 'ether');
  }

  async getTokenBalances(walletAddress: string): Promise<TokenBalance[]> {
    const { tokens } = this.config;

    const tokenBalances = await Promise.all(
      tokens.map(
        async (token: TokenConfig) =>
          await this.getTokenBalance(token, walletAddress)
      )
    );

    return tokenBalances;
  }

  async getTokenBalance(
    token: TokenConfig,
    walletAddress: string
  ): Promise<TokenBalance> {
    const result: TokenBalance = {} as TokenBalance;

    try {
      const tokenInst = new this.provider.eth.Contract(
        tokenABI,
        token.contractAddress
      );

      const balance = await tokenInst.methods
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .balanceOf(walletAddress)
        .call();

      result.token = token.token;
      result.balance = balance as unknown as number;
    } catch (err) {
      // probably there's something wrong with network
      console.error(err);
    }

    return result;
  }

  async getChainId(): Promise<bigint | null> {
    let chainId = null;

    try {
      chainId = await this.provider.eth.getChainId();
    } catch (err) {
      console.error(err);
    }

    return chainId;
  }

  subscribe(event: string, callback: Callback): void {
    this.raw_ethereum.on(event, callback);
  }

  unsubscribe(event: string, callback: Callback): void {
    this.raw_ethereum.removeListener(event, callback);
  }

  unsubscribeAll(): void {
    this.raw_ethereum.removeAllListeners();
  }

  // async switchToChain(chainId: string): Promise<boolean> {
  //   let success = false;

  //   try {
  //     await this.provider.request({
  //       method: 'wallet_switchEthereumChain',
  //       params: [{ chainId }],
  //     });

  //     success = true;
  //   } catch (switchError) {
  //     // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  //     // @ts-ignore
  //     if (switchError!.code === METAMASK_ERRORS.CHAIN_NOT_ADDED) {
  //       const chainOptions: ChainOptions =
  //         CHAINS_CONFIGS[chainId as keyof typeof CHAINS_CONFIGS];
  //       success = await this.addNewChain(chainOptions);
  //     }
  //   }

  //   return success;
  // }

  // async addNewChain(options: ChainOptions): Promise<boolean> {
  //   let success = false;

  //   try {
  //     await this.provider.request({
  //       method: 'wallet_addEthereumChain',
  //       params: [options],
  //     });

  //     success = true;
  //   } catch (error) {
  //     // save message and push it as a snakkbar
  //     console.log('Cannot add new chain to the metamask wallet....');
  //   }

  //   return success;
  // }
}
