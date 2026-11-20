import { ethers } from 'ethers';
import { TicketStatus } from './ticketTypes';

export interface PurchaseResult {
  txHash: string;
  ticketId: number;
}

/** Buys the next unsold ticket of the chosen tier (0 = General, 1 = Premium, 2 = VIP). */
export async function purchaseTicketOnChain(
  contract: ethers.Contract,
  tier: number
): Promise<PurchaseResult> {
  const prices = await contract.getTierPrices();
  const price = prices[tier];
  const all = await contract.getAllTickets();

  const available: number[] = all
    .filter((t: any) => Number(t.status) === TicketStatus.Unsold && Number(t.tier) === tier)
    .map((t: any) => Number(t.id.toString()));

  if (available.length === 0) {
    throw new Error('Sold out: no tickets are available in this tier');
  }

  let lastError: unknown = null;
  for (const ticketId of available) {
    try {
      const tx = await contract.purchaseTicket(ticketId, { value: price });
      await tx.wait();
      return { txHash: tx.hash, ticketId };
    } catch (err: any) {
      if (err?.code === 4001 || err?.code === 'ACTION_REJECTED') throw err;
      const t = await contract.getTicket(ticketId);
      if (Number(t.status) === TicketStatus.Unsold) throw err;
      lastError = err;
    }
  }
  throw lastError ?? new Error('Could not purchase a ticket');
}