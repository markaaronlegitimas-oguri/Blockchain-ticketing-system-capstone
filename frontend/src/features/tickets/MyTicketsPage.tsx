import React, { useState } from 'react';
import { Alert, Box, Skeleton, Typography } from '@mui/material';
import TicketCard from './TicketCard';
import TransferDialog from './TransferDialog';
import { useMyTickets } from './useMyTickets';
import { useAuth } from '../auth/AuthContext';
import { useWallet } from '../wallet/WalletProvider';
import ConnectPrompt from '../wallet/ConnectPrompt';
import { syncTransfer } from '../../lib/chain/syncTransfer';
import { TicketStatus } from '../../lib/chain/ticketTypes';

const MyTicketsPage: React.FC = () => {
  const { isConnected, contract } = useWallet();
  const { accessToken } = useAuth();
  const { tickets, loading, error, refresh } = useMyTickets();

  const [transferId, setTransferId] = useState<number | null>(null);
  const [transferBusy, setTransferBusy] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const closeTransfer = () => {
    setTransferId(null);
    setTransferError(null);
  };

  const confirmTransfer = async (recipient: string) => {
    if (!contract || transferId === null) return;
    const ticket = tickets.find((t) => t.id === transferId);
    if (ticket?.status !== TicketStatus.Sold) {
      setTransferError('Only valid, unused tickets can be transferred.');
      return;
    }

    setTransferBusy(true);
    setTransferError(null);
    try {
      const tx = await contract.transferTicket(transferId, recipient);
      await tx.wait();

      // Keep the database in step with the blockchain. A failure here is not fatal:
      // the transfer already happened on-chain.
      if (accessToken) {
        try {
          await syncTransfer(tx.hash, accessToken);
        } catch (e) {
          console.warn('Ownership sync failed:', e);
        }
      }

      setNotice(`Ticket #${transferId} was transferred.`);
      closeTransfer();
      refresh();
    } catch (e: any) {
      setTransferError(e?.reason || e?.message || 'The transfer failed.');
    } finally {
      setTransferBusy(false);
    }
  };

  if (!isConnected) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Typography variant="h4">My tickets</Typography>
        <ConnectPrompt message="Connect your wallet to see the tickets you own." />
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box>
        <Typography variant="h4">My tickets</Typography>
        <Typography color="text.secondary">Tickets held by your connected wallet.</Typography>
      </Box>

      {notice && (
        <Alert severity="success" onClose={() => setNotice(null)}>
          {notice}
        </Alert>
      )}
      {error && <Alert severity="error">{error}</Alert>}

      {loading && <Skeleton variant="rounded" height={160} />}

      {!loading && !error && tickets.length === 0 && (
        <Alert severity="info">You do not own any tickets yet. Buy one from the Events page.</Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 3 }}>
        {tickets.map((ticket) => (
          <TicketCard key={ticket.id} ticket={ticket} onTransfer={setTransferId} />
        ))}
      </Box>

      <TransferDialog
        open={transferId !== null}
        ticketId={transferId}
        busy={transferBusy}
        error={transferError}
        onClose={closeTransfer}
        onConfirm={confirmTransfer}
      />
    </Box>
  );
};

export default MyTicketsPage;
