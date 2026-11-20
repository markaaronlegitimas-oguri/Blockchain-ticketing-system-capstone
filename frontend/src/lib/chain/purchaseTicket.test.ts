import { purchaseTicketOnChain } from './purchaseTicket';
import { TicketStatus } from './ticketTypes';

const ticket = (id: number, status: TicketStatus, tier = 0) => ({
  id: { toString: () => String(id) },
  status,
  tier,
});

const PRICES = ['10000000000000000', '20000000000000000', '30000000000000000'];

function fakeContract(overrides: Record<string, unknown> = {}) {
  return {
    getTierPrices: vi.fn().mockResolvedValue(PRICES),
    getAllTickets: vi.fn().mockResolvedValue([ticket(0, TicketStatus.Sold), ticket(1, TicketStatus.Unsold)]),
    getTicket: vi.fn().mockResolvedValue({ status: TicketStatus.Sold }),
    purchaseTicket: vi.fn().mockResolvedValue({ hash: '0xabc', wait: vi.fn().mockResolvedValue({}) }),
    ...overrides,
  } as any;
}

describe('purchaseTicketOnChain', () => {
  it('buys the first unsold General ticket and pays the General price', async () => {
    const contract = fakeContract();
    const result = await purchaseTicketOnChain(contract, 0);
    expect(result).toEqual({ txHash: '0xabc', ticketId: 1 });
    expect(contract.purchaseTicket).toHaveBeenCalledWith(1, { value: PRICES[0] });
  });

  it('buys a VIP ticket at the VIP price', async () => {
    const contract = fakeContract({
      getAllTickets: vi.fn().mockResolvedValue([ticket(0, TicketStatus.Unsold, 0), ticket(5, TicketStatus.Unsold, 2)]),
    });
    const result = await purchaseTicketOnChain(contract, 2);
    expect(result).toEqual({ txHash: '0xabc', ticketId: 5 });
    expect(contract.purchaseTicket).toHaveBeenCalledWith(5, { value: PRICES[2] });
  });

  it('ignores unsold tickets of other tiers', async () => {
    const contract = fakeContract({
      getAllTickets: vi.fn().mockResolvedValue([ticket(0, TicketStatus.Unsold, 0)]),
    });
    await expect(purchaseTicketOnChain(contract, 2)).rejects.toThrow(/sold out/i);
    expect(contract.purchaseTicket).not.toHaveBeenCalled();
  });

  it('fails clearly when everything is sold out', async () => {
    const contract = fakeContract({ getAllTickets: vi.fn().mockResolvedValue([ticket(0, TicketStatus.Sold)]) });
    await expect(purchaseTicketOnChain(contract, 0)).rejects.toThrow(/sold out/i);
    expect(contract.purchaseTicket).not.toHaveBeenCalled();
  });

  it('stops immediately when the user rejects the MetaMask prompt', async () => {
    const contract = fakeContract({
      getAllTickets: vi.fn().mockResolvedValue([ticket(1, TicketStatus.Unsold), ticket(2, TicketStatus.Unsold)]),
      purchaseTicket: vi.fn().mockRejectedValue({ code: 4001 }),
    });
    await expect(purchaseTicketOnChain(contract, 0)).rejects.toEqual({ code: 4001 });
    expect(contract.purchaseTicket).toHaveBeenCalledTimes(1);
  });

  it('tries the next ticket when someone else bought the first one', async () => {
    const purchase = vi
      .fn()
      .mockRejectedValueOnce(new Error('already sold'))
      .mockResolvedValueOnce({ hash: '0xdef', wait: vi.fn().mockResolvedValue({}) });
    const contract = fakeContract({
      getAllTickets: vi.fn().mockResolvedValue([ticket(1, TicketStatus.Unsold), ticket(2, TicketStatus.Unsold)]),
      purchaseTicket: purchase,
      getTicket: vi.fn().mockResolvedValue({ status: TicketStatus.Sold }),
    });
    const result = await purchaseTicketOnChain(contract, 0);
    expect(result).toEqual({ txHash: '0xdef', ticketId: 2 });
  });
});