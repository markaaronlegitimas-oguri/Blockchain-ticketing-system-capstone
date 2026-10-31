import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ethers } from 'ethers';
import abi from '../../lib/chain/EventTicket.json';
import { CONTRACT_ADDRESS } from '../../lib/env';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

interface WalletSession {
  account: string;
  chainId: number;
  balance: string;
  contract: ethers.Contract | null;
  isOrganizer: boolean;
}

export interface WalletValue {
  account: string | null;
  chainId: number | null;
  balance: string;
  contract: ethers.Contract | null;
  /** True when the connected wallet deployed the ticket contract. */
  isOrganizer: boolean;
  isConnected: boolean;
  connecting: boolean;
  error: string | null;
  connect: () => Promise<void>;
}

const WalletContext = createContext<WalletValue>({
  account: null,
  chainId: null,
  balance: '0',
  contract: null,
  isOrganizer: false,
  isConnected: false,
  connecting: false,
  error: null,
  connect: async () => {},
});

/** Reads the wallet state from MetaMask. With askUser=false it never opens a popup. */
async function readSession(eth: any, askUser: boolean): Promise<WalletSession | null> {
  const accounts: string[] = await eth.request({
    method: askUser ? 'eth_requestAccounts' : 'eth_accounts',
  });
  if (!accounts || accounts.length === 0) return null;

  const provider = new ethers.providers.Web3Provider(eth);
  const signer = provider.getSigner();
  const account = await signer.getAddress();
  const [network, wei] = await Promise.all([provider.getNetwork(), provider.getBalance(account)]);

  let contract: ethers.Contract | null = null;
  let isOrganizer = false;
  if (CONTRACT_ADDRESS && (await provider.getCode(CONTRACT_ADDRESS)) !== '0x') {
    contract = new ethers.Contract(CONTRACT_ADDRESS, abi as unknown as ethers.ContractInterface, signer);
    try {
      const organizer: string = await contract.organizer();
      isOrganizer = organizer.toLowerCase() === account.toLowerCase();
    } catch {
      isOrganizer = false;
    }
  }

  return {
    account,
    chainId: network.chainId,
    balance: ethers.utils.formatEther(wei),
    contract,
    isOrganizer,
  };
}

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { accessToken } = useAuth();
  const [session, setSession] = useState<WalletSession | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const linkedKey = useRef<string | null>(null);

  const refresh = useCallback(async (askUser: boolean) => {
    const eth = window.ethereum;
    if (!eth) {
      if (askUser) setError('MetaMask is not installed in this browser.');
      return;
    }
    if (askUser) setConnecting(true);
    try {
      const next = await readSession(eth, askUser);
      setSession(next);
      if (!CONTRACT_ADDRESS) {
        setError('The ticket contract address is not configured (VITE_CONTRACT_ADDRESS).');
      } else if (next && !next.contract) {
        setError('The ticket contract was not found on this network. Switch MetaMask to Sepolia.');
      } else {
        setError(null);
      }
    } catch (e: any) {
      setSession(null);
      setError(e?.code === 4001 ? 'Wallet connection was cancelled.' : e?.message || 'Could not connect the wallet.');
    } finally {
      setConnecting(false);
    }
  }, []);

  const connect = useCallback(() => refresh(true), [refresh]);

  // Pick up an already-authorised wallet and follow account / network changes.
  useEffect(() => {
    const eth = window.ethereum;
    if (!eth) return;
    refresh(false);
    const onAccountsChanged = () => refresh(false);
    const onChainChanged = () => window.location.reload();
    eth.on?.('accountsChanged', onAccountsChanged);
    eth.on?.('chainChanged', onChainChanged);
    return () => {
      eth.removeListener?.('accountsChanged', onAccountsChanged);
      eth.removeListener?.('chainChanged', onChainChanged);
    };
  }, [refresh]);

  // Tell the backend which wallet belongs to the logged-in user (once per wallet + login).
  useEffect(() => {
    if (!session?.account || !accessToken) return;
    const key = `${session.account}:${accessToken}`;
    if (linkedKey.current === key) return;
    linkedKey.current = key;
    apiRequest('/auth/link-wallet', {
      method: 'POST',
      token: accessToken,
      body: { walletAddress: session.account },
    }).catch((err) => console.warn('Could not link wallet:', err.message));
  }, [session?.account, accessToken]);

  const value = useMemo<WalletValue>(
    () => ({
      account: session?.account ?? null,
      chainId: session?.chainId ?? null,
      balance: session?.balance ?? '0',
      contract: session?.contract ?? null,
      isOrganizer: session?.isOrganizer ?? false,
      isConnected: !!session,
      connecting,
      error,
      connect,
    }),
    [session, connecting, error, connect]
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
};

export const useWallet = () => useContext(WalletContext);
