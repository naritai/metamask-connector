import { MetamaskWallet } from '../../components/wallets/metamask/MetamaskWallet';
import { MetamaskProvider } from '../../components/wallets/metamask/useMetaMask';
import './App.css';

function App() {
  return (
    <main className="main-container">
      <MetamaskProvider>
        <MetamaskWallet />
      </MetamaskProvider>
    </main>
  );
}

export default App;
