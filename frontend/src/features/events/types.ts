export interface Tier {
  id: string;
  slot_name: string;
  price: number | string;
  capacity: number;
  /** Seats left, or null when the backend could not work it out. */
  available: number | null;
}

export interface Session {
  id: string;
  session_name: string;
  starts_at: string;
  ends_at: string | null;
  slots: Tier[];
}

export interface EventItem {
  id: string;
  name?: string;
  title?: string;
  description?: string;
  sessions: Session[];
}
