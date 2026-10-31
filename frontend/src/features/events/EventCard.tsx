import React from 'react';
import { Box, Button, Card, Chip, Divider, LinearProgress, Typography } from '@mui/material';
import { EventItem, Tier } from './types';
import { formatDateTime, formatEth } from '../../lib/format';

interface EventCardProps {
  event: EventItem;
  buyingTierId: string | null;
  onBuy: (tierId: string) => void;
}

function availabilityLabel(tier: Tier): { text: string; soldOut: boolean } {
  if (tier.available === null) return { text: 'Availability unknown', soldOut: false };
  if (tier.available <= 0) return { text: 'Sold out', soldOut: true };
  return { text: `${tier.available} of ${tier.capacity} left`, soldOut: false };
}

const TierRow: React.FC<{ tier: Tier; busy: boolean; locked: boolean; onBuy: () => void }> = ({
  tier,
  busy,
  locked,
  onBuy,
}) => {
  const { text, soldOut } = availabilityLabel(tier);
  const taken = tier.available === null ? 0 : tier.capacity - tier.available;
  const percent = tier.capacity > 0 ? Math.min((taken / tier.capacity) * 100, 100) : 0;

  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr auto' }, gap: 2, alignItems: 'center', py: 1.5 }}>
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Typography sx={{ fontWeight: 600 }}>{tier.slot_name}</Typography>
          <Chip size="small" variant="outlined" label={formatEth(tier.price)} />
          <Typography variant="body2" color={soldOut ? 'error' : 'text.secondary'}>
            {text}
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={percent}
          color={soldOut ? 'error' : 'secondary'}
          sx={{ mt: 1, height: 6, borderRadius: 3 }}
        />
      </Box>
      <Button variant="contained" color="secondary" disabled={soldOut || locked} onClick={onBuy}>
        {busy ? 'Processing…' : 'Buy ticket'}
      </Button>
    </Box>
  );
};

const EventCard: React.FC<EventCardProps> = ({ event, buyingTierId, onBuy }) => (
  <Card>
    <Box
      sx={{
        p: 3,
        color: '#fff',
        background: 'linear-gradient(120deg, #3b45c4 0%, #d6004f 100%)',
      }}
    >
      <Typography variant="h5">{event.name ?? event.title ?? 'Event'}</Typography>
      {event.description && (
        <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
          {event.description}
        </Typography>
      )}
    </Box>

    <Box sx={{ px: 3, py: 1 }}>
      {event.sessions.length === 0 && (
        <Typography color="text.secondary" sx={{ py: 2 }}>
          No sessions scheduled yet.
        </Typography>
      )}
      {event.sessions.map((session, index) => (
        <Box key={session.id}>
          {index > 0 && <Divider />}
          <Box sx={{ pt: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              {session.session_name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {formatDateTime(session.starts_at)}
            </Typography>
          </Box>
          {session.slots.map((tier) => (
            <TierRow
              key={tier.id}
              tier={tier}
              busy={buyingTierId === tier.id}
              locked={buyingTierId !== null}
              onBuy={() => onBuy(tier.id)}
            />
          ))}
        </Box>
      ))}
    </Box>
  </Card>
);

export default EventCard;
