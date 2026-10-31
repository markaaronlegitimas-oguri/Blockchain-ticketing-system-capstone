import { useCallback, useEffect, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { formatDateTime } from '../../lib/format';
import { Ticket, TicketStatus } from '../../lib/chain/ticketTypes';
import { useAuth } from '../auth/AuthContext';
import { useWallet } from '../wallet/WalletProvider';

interface TicketDetail {
  onchainTicketId: number;
  eventName: string | null;
  sessionDate: string | null;
}

/**
 * Ownership and status come from the blockchain (the source of truth).
 * Event name and session date come from the database and are merged in when the user is logged in.
 */
export function useMyTickets() {
  const { contract, account } = useWallet();
  const { accessToken } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!contract || !account) return;
    setLoading(true);
    setError(null);
    try {
      const ids = await contract.getTicketsOwnedBy(account);
      const owned: Ticket[] = await Promise.all(
        ids.map(async (raw: any) => {
          const id = Number(raw.toString());
          const onchain = await contract.getTicket(id);
          return { id, status: Number(onchain.status) as TicketStatus };
        })
      );

      if (accessToken) {
        try {
          const { tickets: details } = await apiRequest<{ tickets: TicketDetail[] }>('/tickets/my-tickets', {
            token: accessToken,
          });
          const byId = new Map(details.map((d) => [d.onchainTicketId, d]));
          for (const ticket of owned) {
            const detail = byId.get(ticket.id);
            if (detail) {
              ticket.eventName = detail.eventName ?? undefined;
              ticket.sessionDate = detail.sessionDate ? formatDateTime(detail.sessionDate) : undefined;
            }
          }
        } catch (e) {
          console.warn('Could not load event details for tickets:', e);
        }
      }

      setTickets(owned);
    } catch (e: any) {
      setError(e?.message || 'Could not read your tickets from the blockchain');
      setTickets([]);
    } finally {
      setLoading(false);
    }
  }, [contract, account, accessToken]);

  useEffect(() => {
    refresh();
    if (!contract?.filters?.TicketTransferred) return;
    const filter = contract.filters.TicketTransferred();
    contract.on(filter, refresh);
    return () => {
      contract.off(filter, refresh);
    };
  }, [contract, refresh]);

  return { tickets, loading, error, refresh };
}
