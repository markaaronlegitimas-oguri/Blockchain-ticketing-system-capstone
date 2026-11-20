import React, { useEffect, useState } from 'react';
import { Alert, Box, Chip, Skeleton, Typography } from '@mui/material';
import { ethers } from 'ethers';
import EventCard from './EventCard';
import { useEvents } from './useEvents';
import { usePurchase } from './usePurchase';
import { useWallet } from '../wallet/WalletProvider';
import ConnectPrompt from '../wallet/ConnectPrompt';
import { formatEth } from '../../lib/format';

const EventsPage: React.FC = () => {
  const { events, loading, error, reload } = useEvents();
  const { buy, buyingTierId, notice, clearNotice } = usePurchase(() => reload(true));
  const { contract, isConnected } = useWallet();
  const [onchainPrices, setOnchainPrices] = useState<string[] | null>(null);

  // The contract decides what each tier really costs.
  useEffect(() => {
    if (!contract) {
      setOnchainPrices(null);
      return;
    }
    let cancelled = false;
    contract
      .getTierPrices()
      .then((wei: ethers.BigNumber[]) => {
        if (!cancelled) setOnchainPrices(wei.map((w) => ethers.utils.formatEther(w)));
      })
      .catch(() => {
        if (!cancelled) setOnchainPrices(null);
      });
    return () => {
      cancelled = true;
    };
  }, [contract]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4">Upcoming events</Typography>
          <Typography color="text.secondary">
            Every ticket is issued on the blockchain and checked at the gate with a one-time QR code.
          </Typography>
        </Box>
       {onchainPrices && (
          <Chip
            color="secondary"
            variant="outlined"
            label={`On-chain: General ${formatEth(onchainPrices[0])} · Premium ${formatEth(onchainPrices[1])} · VIP ${formatEth(onchainPrices[2])} + gas`}
          />
        )}
      </Box>

      {!isConnected && <ConnectPrompt />}

      {notice && (
        <Alert severity={notice.severity} onClose={clearNotice}>
          {notice.text}
        </Alert>
      )}

      {loading && (
        <>
          <Skeleton variant="rounded" height={200} />
          <Skeleton variant="rounded" height={200} />
        </>
      )}

      {error && <Alert severity="error">Could not load events: {error}</Alert>}

      {!loading && !error && events.length === 0 && <Alert severity="info">No events available yet.</Alert>}

      {events.map((event) => (
        <EventCard key={event.id} event={event} buyingTierId={buyingTierId} onBuy={buy} />
      ))}
    </Box>
  );
};

export default EventsPage;
