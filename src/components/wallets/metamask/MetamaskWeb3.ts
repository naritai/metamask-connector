import { MetaMaskInpageProvider } from '@metamask/providers';
import Web3 from 'web3';
import { tokenABI } from '../../../lib/tokenABI';
import { ChainOptions, TokenBalance, WalletState } from './types';
import { formatBalance } from '../../../utils';
import { BSC_ID, CHAINS_CONFIGS, METAMASK_ERRORS } from './constants';

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
  chainId: '',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Callback = (args: any) => any;

export class MetamaskWeb3 {
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
    try {
      await this.raw_ethereum.request({
        method: 'wallet_requestPermissions',
        params: [
          {
            eth_accounts: {},
          },
        ],
      });
    } catch {
      throw new Error('User rejected wallet connection');
    }

    return true;
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
      // await this.ensureBinanceSmartChainUsed();
      const accs = accounts || (await this.getAccounts());

      if (!accs.length) {
        return wallet;
      }

      const walletAddress = accs[0];
      const walletBalace = await this.getWalletBalance(walletAddress);
      const tokenBalances = await this.getTokenBalances(walletAddress);
      const chainId = (await this.getChainId()) as string;

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
    return formatBalance(this.provider.utils.fromWei(nativeBalance, 'ether'));
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
      result.balance = formatBalance(balance as unknown as string);
    } catch (err) {
      // probably there's something wrong with network
      console.error(err);
    }

    return result;
  }

  async getChainId(): Promise<unknown> {
    let chainId = null;

    try {
      chainId = await this.raw_ethereum.request({
        method: 'eth_chainId',
      });
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

  async ensureBinanceSmartChainUsed(): Promise<boolean> {
    try {
      const chainId = await this.getChainId();
      if (chainId !== BSC_ID) {
        await this.switchToChain(BSC_ID);
      }
    } catch (err) {
      throw new Error('User rejected switching chain');
    }

    return true;
  }

  async switchToChain(chainId: string): Promise<boolean> {
    let success = false;

    try {
      await this.raw_ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }],
      });

      success = true;
    } catch (switchError) {
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      if (switchError!.code === METAMASK_ERRORS.CHAIN_NOT_ADDED) {
        const chainOptions: ChainOptions =
          CHAINS_CONFIGS[chainId as keyof typeof CHAINS_CONFIGS];
        success = await this.addNewChain(chainOptions);
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        throw new Error('User rejected switching chain');
      }
    }

    return success;
  }

  async addNewChain(options: ChainOptions): Promise<boolean> {
    let success = false;

    try {
      await this.raw_ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [options],
      });

      success = true;
    } catch (error) {
      throw new Error('user rejected to adding new chain to the metamask....');
    }

    return success;
  }
}
