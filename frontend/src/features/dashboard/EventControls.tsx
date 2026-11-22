import React, { useState } from 'react';
import {
  Alert, Box, Button, Card, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography,
} from '@mui/material';
import { useContractState } from '../tickets/useContractState';
import { useRefunds } from '../tickets/useRefunds';

/** Event status, Cancel event and Withdraw proceeds. Only shown when the organizer wallet is connected. */
const EventControls: React.FC = () => {
  const { state, reload } = useContractState();
  const { busy, notice, clearNotice, cancelEvent, withdrawProceeds } = useRefunds(reload);
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!state || !state.isOrganizer) return null;
  const ended = Date.now() / 1000 >= state.eventEnd;
  const canWithdraw = ended && !state.eventCancelled && !state.proceedsWithdrawn && Number(state.heldFunds) > 0;

  return (
    <Card sx={{ p: 2.5, mb: 3, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6">Event controls</Typography>
        <Chip
          color={state.eventCancelled ? 'error' : 'success'}
          label={state.eventCancelled ? 'Cancelled' : 'Active'}
          size="small"
        />
      </Box>
      <Typography variant="body2" color="text.secondary">
        Payments held by the contract: {state.heldFunds} ETH · Event ends: {new Date(state.eventEnd * 1000).toLocaleString()}
      </Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        <Button variant="outlined" color="error" disabled={busy || state.eventCancelled} onClick={() => setConfirmOpen(true)}>
          Cancel event
        </Button>
        <Button variant="contained" disabled={busy || !canWithdraw} onClick={() => withdrawProceeds()}>
          Withdraw proceeds
        </Button>
      </Box>
      <Typography variant="caption" color="text.secondary">
        Proceeds can be withdrawn only after the event ends and only if it was not cancelled.
      </Typography>

      {notice && (
        <Alert severity={notice.severity} onClose={clearNotice}>
          {notice.text}
        </Alert>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Cancel this event?</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ticket sales, transfers and check-in stop for everyone, and ticket holders can claim refunds from the
            payments held by the contract. This cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Keep event</Button>
          <Button
            color="error"
            onClick={() => {
              setConfirmOpen(false);
              cancelEvent();
            }}
          >
            Cancel event
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default EventControls;