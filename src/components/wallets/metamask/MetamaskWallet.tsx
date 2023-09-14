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
    return tokens.map(({ token, balance }) => {
      return (
        <ul key={token}>
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
        <div>Address: {address}</div>
        <div>Balance: {balance}</div>
        <div>Chain ID: {String(chainId)}</div>
        <ul>{mapBalances(tokens)}</ul>
      </div>
    );
  };

  const connectButton = <button onClick={connect}>Connect Metamask</button>;
  const disconnectButton = (
    <button onClick={disconnect}>Disconnect Metamask</button>
  );

  return (
    <div>
      {isConnected ? disconnectButton : connectButton}
      {error ? errorMessage : null}
      {isConnecting ? 'loading...' : walletInfo()}
    </div>
  );
};
