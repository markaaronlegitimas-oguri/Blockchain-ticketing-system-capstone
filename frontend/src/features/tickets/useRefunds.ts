import { useCallback, useState } from 'react';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../auth/AuthContext';
import { useWallet } from '../wallet/WalletProvider';
import type { Notice } from '../events/usePurchase';

type TxLike = { hash: string; wait: () => Promise<unknown> };

/** Cancel / refund / withdraw actions on the smart contract, mirrored in the database. */
export function useRefunds(onDone?: () => void) {
  const { accessToken } = useAuth();
  const { contract } = useWallet();
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const run = useCallback(
    async (send: () => Promise<TxLike>, syncPath: string | null, successText: string) => {
      setNotice(null);
      if (!contract || !accessToken) {
        setNotice({ severity: 'warning', text: 'Please log in and connect your wallet on the Sepolia network first.' });
        return;
      }
      let txHash: string | null = null;
      setBusy(true);
      try {
        const tx = await send();
        txHash = tx.hash;
        await tx.wait();
        if (syncPath) {
          await apiRequest(syncPath, { method: 'POST', token: accessToken, body: { txHash } });
        }
        setNotice({ severity: 'success', text: successText });
        onDone?.();
      } catch (e: any) {
        if (e?.code === 4001 || e?.code === 'ACTION_REJECTED') {
          setNotice({ severity: 'info', text: 'Cancelled in MetaMask.' });
        } else if (txHash) {
          setNotice({
            severity: 'error',
            text: `The blockchain transaction went through (${txHash}) but updating the system failed: ${e?.message}. Keep this transaction hash.`,
          });
        } else {
          setNotice({ severity: 'error', text: e?.reason || e?.data?.message || e?.message || 'The action failed' });
        }
      } finally {
        setBusy(false);
      }
    },
    [accessToken, contract, onDone]
  );

  const c: any = contract;
  return {
    busy,
    notice,
    clearNotice: () => setNotice(null),
    claimRefund: (ticketId: number) =>
      run(() => c.claimEventRefund(ticketId), '/tickets/sync-refund', 'Refund claimed. The ticket price was returned to your wallet.'),
    cancelTicket: (ticketId: number) =>
      run(() => c.cancelTicket(ticketId), '/tickets/sync-refund', 'Ticket cancelled. The ticket price was returned to your wallet.'),
    cancelEvent: () =>
      run(() => c.cancelEvent(), '/tickets/sync-event-cancel', 'Event cancelled. Ticket holders were notified and can claim refunds.'),
    withdrawProceeds: () =>
      run(() => c.withdrawProceeds(), null, 'Proceeds withdrawn to the organizer wallet.'),
  };
}