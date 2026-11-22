import React, { useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';
import { TicketStatus } from '../../lib/chain/ticketTypes';
import { useContractState } from './useContractState';
import { useRefunds } from './useRefunds';

interface RefundButtonProps {
  ticketId: number;
  status: TicketStatus;
}

const RefundButton: React.FC<RefundButtonProps> = ({ ticketId, status }) => {
  const { state } = useContractState();
  const { busy, notice, clearNotice, claimRefund, cancelTicket } = useRefunds(() =>
    setTimeout(() => window.location.reload(), 1500)
  );
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (status !== TicketStatus.Sold || !state) return null;
  const ended = Date.now() / 1000 >= state.eventEnd;

  return (
    <>
      {state.eventCancelled ? (
        <Button variant="contained" color="warning" disabled={busy} onClick={() => claimRefund(ticketId)}>
          {busy ? 'Claiming...' : 'Claim refund'}
        </Button>
      ) : (
        !ended && (
          <Button variant="outlined" color="error" disabled={busy} onClick={() => setConfirmOpen(true)}>
            Cancel ticket
          </Button>
        )
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Cancel ticket #{ticketId}?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            The ticket price is returned to your wallet and the ticket can no longer be used. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Keep ticket</Button>
          <Button
            color="error"
            onClick={() => {
              setConfirmOpen(false);
              cancelTicket(ticketId);
            }}
          >
            Cancel and refund
          </Button>
        </DialogActions>
      </Dialog>

      {notice && (
        <Alert severity={notice.severity} onClose={clearNotice} sx={{ width: '100%' }}>
          {notice.text}
        </Alert>
      )}
    </>
  );
};

export default RefundButton;