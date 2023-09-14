import { formatAddress, formatChainAsNum } from '../../../utils';
import { TokenBalance } from './types';
import { useMetaMask } from './useMetaMask';

export const MetamaskWallet = () => {
  const {
    connect,
    disconnect,
    isConnected,
    wallet,
    isConnecting,
    error,
    errorMessage,
  } = useMetaMask();

  const { chainId, tokens, address, balance } = wallet;

  const mapBalances = (tokens: TokenBalance[]) => {
    return tokens.map(({ token, balance }, index) => {
      return (
        <ul key={token || index}>
          <li>Token: {token}</li>
          <li>Balance: {balance}</li>
        </ul>
      );
    });
  };

  const walletInfo = () => {
    return (
      <div>
        <h2>Wallet Info:</h2>
        <div>Chain ID: {formatChainAsNum(chainId)}</div>
        <div>Address: {formatAddress(address)}</div>
        <div>Balance: {balance}</div>
        {mapBalances(tokens)}
      </div>
    );
  };

  const connectButton = (
    <button onClick={connect}>
      {isConnecting ? 'loading...' : 'Connect Metamask'}
    </button>
  );
  const disconnectButton = (
    <button onClick={disconnect}>Disconnect Metamask</button>
  );

  return (
    <div>
      {isConnected ? disconnectButton : connectButton}
      {isConnected && walletInfo()}
      {error ? errorMessage : null}
    </div>
  );
};
