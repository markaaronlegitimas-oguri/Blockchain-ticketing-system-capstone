import { canAnnounce, canScanTickets, canViewDashboard } from './roles';

describe('role rules', () => {
  it('lets organizer, staff and admin view the dashboard, but not attendees', () => {
    expect(canViewDashboard('organizer')).toBe(true);
    expect(canViewDashboard('staff')).toBe(true);
    expect(canViewDashboard('admin')).toBe(true);
    expect(canViewDashboard('attendee')).toBe(false);
    expect(canViewDashboard(undefined)).toBe(false);
  });

  it('lets only staff and admin scan tickets', () => {
    expect(canScanTickets('staff')).toBe(true);
    expect(canScanTickets('admin')).toBe(true);
    expect(canScanTickets('organizer')).toBe(false);
    expect(canScanTickets('attendee')).toBe(false);
  });

  it('lets only organizer and admin send announcements', () => {
    expect(canAnnounce('organizer')).toBe(true);
    expect(canAnnounce('admin')).toBe(true);
    expect(canAnnounce('staff')).toBe(false);
  });
});
