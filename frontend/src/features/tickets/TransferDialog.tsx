import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, TextField } from '@mui/material';

interface TransferDialogProps {
  open: boolean;
  ticketId: number | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onConfirm: (recipient: string) => void;
}

const TransferDialog: React.FC<TransferDialogProps> = ({ open, ticketId, busy, error, onClose, onConfirm }) => {
  const [recipient, setRecipient] = useState('');
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setRecipient('');
      setTouched(false);
    }
  }, [open]);

  const valid = ethers.utils.isAddress(recipient.trim());
  const showInvalid = touched && recipient.trim() !== '' && !valid;

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Transfer ticket #{ticketId}</DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ mb: 2 }}>
          Enter the wallet address of the new owner. The transfer is recorded on the blockchain and cannot be undone.
        </DialogContentText>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <TextField
          autoFocus
          fullWidth
          label="Recipient wallet address"
          placeholder="0x…"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          onBlur={() => setTouched(true)}
          error={showInvalid}
          helperText={showInvalid ? 'This is not a valid Ethereum address.' : ' '}
          disabled={busy}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button variant="contained" onClick={() => onConfirm(recipient.trim())} disabled={!valid || busy}>
          {busy ? 'Waiting for confirmation…' : 'Transfer'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransferDialog;
