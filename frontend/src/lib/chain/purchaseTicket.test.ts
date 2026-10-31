import { purchaseTicketOnChain } from './purchaseTicket';
import { TicketStatus } from './ticketTypes';

const ticket = (id: number, status: TicketStatus) => ({ id: { toString: () => String(id) }, status });

function fakeContract(overrides: Record<string, unknown> = {}) {
  return {
    ticketPrice: vi.fn().mockResolvedValue('10000000000000000'),
    getAllTickets: vi.fn().mockResolvedValue([ticket(0, TicketStatus.Sold), ticket(1, TicketStatus.Unsold)]),
    getTicket: vi.fn().mockResolvedValue({ status: TicketStatus.Sold }),
    purchaseTicket: vi.fn().mockResolvedValue({ hash: '0xabc', wait: vi.fn().mockResolvedValue({}) }),
    ...overrides,
  } as any;
}

describe('purchaseTicketOnChain', () => {
  it('buys the first unsold ticket and pays the on-chain price', async () => {
    const contract = fakeContract();
    const result = await purchaseTicketOnChain(contract);
    expect(result).toEqual({ txHash: '0xabc', ticketId: 1 });
    expect(contract.purchaseTicket).toHaveBeenCalledWith(1, { value: '10000000000000000' });
  });

  it('fails clearly when everything is sold out', async () => {
    const contract = fakeContract({ getAllTickets: vi.fn().mockResolvedValue([ticket(0, TicketStatus.Sold)]) });
    await expect(purchaseTicketOnChain(contract)).rejects.toThrow(/sold out/i);
    expect(contract.purchaseTicket).not.toHaveBeenCalled();
  });

  it('stops immediately when the user rejects the MetaMask prompt', async () => {
    const contract = fakeContract({
      getAllTickets: vi.fn().mockResolvedValue([ticket(1, TicketStatus.Unsold), ticket(2, TicketStatus.Unsold)]),
      purchaseTicket: vi.fn().mockRejectedValue({ code: 4001 }),
    });
    await expect(purchaseTicketOnChain(contract)).rejects.toEqual({ code: 4001 });
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
    const result = await purchaseTicketOnChain(contract);
    expect(result).toEqual({ txHash: '0xdef', ticketId: 2 });
  });
});
