import React, { useState } from 'react';
import { Box, Button, Card, Chip, Typography } from '@mui/material';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import { Ticket, TicketStatus } from '../../lib/chain/ticketTypes';
import TicketQrDialog from './TicketQrDialog';

interface TicketCardProps {
  ticket: Ticket;
  onTransfer: (ticketId: number) => void;
}

const STATUS: Record<number, { label: string; color: 'success' | 'default' | 'error' | 'warning'; band: string }> = {
  [TicketStatus.Unsold]: { label: 'Unsold', color: 'default', band: 'grey.500' },
  [TicketStatus.Sold]: { label: 'Valid', color: 'success', band: 'success.main' },
  [TicketStatus.Used]: { label: 'Used', color: 'default', band: 'grey.500' },
  [TicketStatus.Cancelled]: { label: 'Cancelled', color: 'error', band: 'error.main' },
  [TicketStatus.Refunded]: { label: 'Refunded', color: 'warning', band: 'warning.main' },
};

const TicketCard: React.FC<TicketCardProps> = ({ ticket, onTransfer }) => {
  const [qrOpen, setQrOpen] = useState(false);
  const status = STATUS[ticket.status] ?? { label: 'Unknown', color: 'default' as const, band: 'grey.500' };
  const active = ticket.status === TicketStatus.Sold;

  return (
    <Card sx={{ display: 'flex', opacity: active ? 1 : 0.75 }}>
      <Box sx={{ width: 10, flexShrink: 0, bgcolor: status.band }} />
      <Box sx={{ p: 2.5, flexGrow: 1, display: 'flex', flexDirection: 'column', gap: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="h6" sx={{ lineHeight: 1.25 }}>
            {ticket.eventName ?? `Ticket #${ticket.id}`}
          </Typography>
          <Chip size="small" color={status.color} label={status.label} />
        </Box>
        {ticket.sessionDate && (
          <Typography variant="body2" color="text.secondary">
            {ticket.sessionDate}
          </Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          Ticket number {ticket.id}
        </Typography>

        {active && (
          <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
            <Button variant="contained" startIcon={<QrCode2Icon />} onClick={() => setQrOpen(true)}>
              Show QR
            </Button>
            <Button variant="outlined" startIcon={<SwapHorizIcon />} onClick={() => onTransfer(ticket.id)}>
              Transfer
            </Button>
          </Box>
        )}
      </Box>

      <TicketQrDialog open={qrOpen} onClose={() => setQrOpen(false)} ticketId={ticket.id} eventName={ticket.eventName} />
    </Card>
  );
};

export default TicketCard;
