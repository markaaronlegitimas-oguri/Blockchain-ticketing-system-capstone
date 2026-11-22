import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Box, Chip, Skeleton, Typography } from '@mui/material';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';

type SeatStatus = 'available' | 'reserved' | 'sold' | 'used' | 'cancelled' | 'refunded';

interface Seat { seat: number; ticketId: number; status: SeatStatus }
interface TierMap { slotId: string; name: string; tier: number; price: number | string; capacity: number; seats: Seat[] }

const COLORS: Record<SeatStatus, string> = {
  available: 'success.main',
  reserved: 'warning.main',
  sold: 'primary.main',
  used: 'grey.600',
  cancelled: 'error.main',
  refunded: 'error.light',
};
const LABELS: Record<SeatStatus, string> = {
  available: 'Available',
  reserved: 'Reserved (being paid)',
  sold: 'Sold',
  used: 'Checked in',
  cancelled: 'Cancelled',
  refunded: 'Refunded',
};

interface SeatMapProps {
  sessionId: string;
  autoRefreshMs?: number;
}

const SeatMap: React.FC<SeatMapProps> = ({ sessionId, autoRefreshMs }) => {
  const { accessToken, isAuthenticated } = useAuth();
  const [tiers, setTiers] = useState<TierMap[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res: any = await apiRequest(`/sessions/${sessionId}/seat-map`, { method: 'GET', token: accessToken });
      setTiers(res.tiers);
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? 'Could not load the seat map');
    }
  }, [sessionId, accessToken]);

  useEffect(() => {
    load();
    if (!autoRefreshMs) return;
    const timer = setInterval(load, autoRefreshMs);
    return () => clearInterval(timer);
  }, [load, autoRefreshMs]);

  if (!isAuthenticated) return <Alert severity="info">Log in to see the seat map.</Alert>;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!tiers) return <Skeleton variant="rounded" height={160} />;

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <Box sx={{ textAlign: 'center', py: 0.5, borderRadius: 1, bgcolor: 'action.hover' }}>
        <Typography variant="overline">Stage</Typography>
      </Box>

      {tiers.map((t) => (
        <Box key={t.slotId}>
          <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
            {t.name} · {t.price} ETH · {t.seats.filter((s) => s.status === 'available').length} of {t.capacity} available
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(34px, 1fr))', gap: 0.5 }}>
            {t.seats.map((s) => (
              <Box
                key={s.ticketId}
                title={`${t.name} seat ${s.seat}: ${LABELS[s.status]}`}
                sx={{ bgcolor: COLORS[s.status], color: '#fff', fontSize: 11, textAlign: 'center', borderRadius: 0.5, py: 0.5 }}
              >
                {s.seat}
              </Box>
            ))}
          </Box>
        </Box>
      ))}

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
        {(Object.keys(LABELS) as SeatStatus[]).map((k) => (
          <Chip key={k} size="small" label={LABELS[k]} sx={{ bgcolor: COLORS[k], color: '#fff' }} />
        ))}
      </Box>
    </Box>
  );
};

export default SeatMap;