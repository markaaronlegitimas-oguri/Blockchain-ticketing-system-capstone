import React from 'react';
import { Alert, Button } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useWallet } from './WalletProvider';

/** Shown on pages that need a wallet when none is connected. */
const ConnectPrompt: React.FC<{ message?: string }> = ({
  message = 'Connect your MetaMask wallet (Sepolia network) to continue.',
}) => {
  const { connect, connecting, error } = useWallet();
  return (
    <Alert
      severity={error ? 'warning' : 'info'}
      action={
        <Button
          color="inherit"
          size="small"
          startIcon={<AccountBalanceWalletIcon />}
          onClick={connect}
          disabled={connecting}
        >
          {connecting ? 'Connecting…' : 'Connect wallet'}
        </Button>
      }
    >
      {error ?? message}
    </Alert>
  );
};

export default ConnectPrompt;
