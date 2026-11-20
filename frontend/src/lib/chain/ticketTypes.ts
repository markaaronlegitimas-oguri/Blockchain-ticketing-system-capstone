export enum TicketStatus {
  Unsold = 0,
  Sold = 1,
  Used = 2,
  Cancelled = 3,
  Refunded = 4,
}

export enum Tier {
  General = 0,
  Premium = 1,
  VIP = 2,
}

export const TIER_NAMES = ['General', 'Premium', 'VIP'];
const TIER_CODES = ['GEN', 'PRE', 'VIP'];

export const seatLabel = (tier: number, seat: number) =>
  `${TIER_CODES[tier] ?? '???'}-${String(seat).padStart(2, '0')}`;

export interface Ticket {
  id: number;
  status: TicketStatus;
  tier?: Tier;
  seat?: number;
  seatLabel?: string;
  // Optional: filled in later from Supabase (sessions), not from the blockchain
  eventName?: string;
  sessionDate?: string;
}