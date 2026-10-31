// Which parts of the app each role may use. The backend enforces the same rules;
// this only decides what the interface shows.
export const canViewDashboard = (role?: string | null) =>
  role === 'organizer' || role === 'staff' || role === 'admin';

export const canScanTickets = (role?: string | null) => role === 'staff' || role === 'admin';

export const canAnnounce = (role?: string | null) => role === 'organizer' || role === 'admin';
