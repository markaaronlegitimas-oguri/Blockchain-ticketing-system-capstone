import { useCallback, useState } from 'react';
import { apiRequest, ApiError } from '../../lib/api';
import { purchaseTicketOnChain } from '../../lib/chain/purchaseTicket';
import { useAuth } from '../auth/AuthContext';
import { useWallet } from '../wallet/WalletProvider';

export interface Notice {
  severity: 'success' | 'error' | 'warning' | 'info';
  text: string;
}

/**
 * The purchase flow:
 *  1. reserve the tier for 10 minutes,
 *  2. pay on-chain with MetaMask,
 *  3. let the backend verify the transaction and record the ticket,
 *  4. confirm the reservation.
 */
export function usePurchase(onPurchased: () => void) {
  const { accessToken, isAuthenticated } = useAuth();
  const { contract, isConnected } = useWallet();
  const [buyingTierId, setBuyingTierId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const buy = useCallback(
    async (tierId: string) => {
      setNotice(null);
      if (!isAuthenticated || !accessToken) {
        setNotice({ severity: 'warning', text: 'Please log in first (Log in / Register at the top).' });
        return;
      }
      if (!isConnected || !contract) {
        setNotice({ severity: 'warning', text: 'Please connect your wallet on the Sepolia network first.' });
        return;
      }

      let txHash: string | null = null;
      setBuyingTierId(tierId);
      try {
        const { booking } = await apiRequest(`/slots/${tierId}/book`, { method: 'POST', token: accessToken });

        const paid = await purchaseTicketOnChain(contract);
        txHash = paid.txHash;

        const { ticket } = await apiRequest('/tickets/verify-purchase', {
          method: 'POST',
          token: accessToken,
          body: { txHash, bookingId: booking.id },
        });

        await apiRequest(`/bookings/${booking.id}/confirm`, {
          method: 'POST',
          token: accessToken,
          body: { ticketId: ticket.id },
        });

        setNotice({ severity: 'success', text: 'Ticket purchased. Open My tickets to see it and show your entry QR.' });
        onPurchased();
      } catch (e: any) {
        if (e?.code === 4001 || e?.code === 'ACTION_REJECTED') {
          setNotice({ severity: 'info', text: 'Purchase cancelled in MetaMask.' });
        } else if (e instanceof ApiError && e.status === 401) {
          setNotice({ severity: 'warning', text: e.message });
        } else if (txHash) {
          setNotice({
            severity: 'error',
            text: `Payment went through (transaction ${txHash}) but recording it failed: ${e.message}. Do not buy again; keep this transaction hash.`,
          });
        } else {
          setNotice({ severity: 'error', text: e?.reason || e?.message || 'Purchase failed' });
        }
      } finally {
        setBuyingTierId(null);
      }
    },
    [accessToken, contract, isAuthenticated, isConnected, onPurchased]
  );

  return { buy, buyingTierId, notice, clearNotice: () => setNotice(null) };
}
