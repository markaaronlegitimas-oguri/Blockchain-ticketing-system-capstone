import { screen } from '@testing-library/react';
import DashboardPage from './DashboardPage';
import { FakeAuth, fakeAuth, jsonResponse, renderScreen } from '../../test-utils';

const mocks = vi.hoisted(() => ({ auth: null as unknown as FakeAuth }));
vi.mock('../auth/AuthContext', () => ({ useAuth: () => mocks.auth }));

afterEach(() => vi.unstubAllGlobals());

const summary = {
  generatedAt: '2026-10-27T08:00:00Z',
  totals: { ticketsSold: 2, checkedIn: 1, revenueEth: 0.02, activeHolds: 0, checkInRate: 50 },
  events: [
    {
      id: 'e1',
      name: 'Test Concert',
      ticketPriceEth: 0.01,
      sold: 2,
      checkedIn: 1,
      revenueEth: 0.02,
      sessions: [
        {
          id: 's1',
          name: 'Opening Night',
          startsAt: '2026-12-01T11:00:00Z',
          slots: [{ id: 'sl1', name: 'General Admission', capacity: 50, confirmed: 2, pending: 0, available: 48 }],
        },
      ],
    },
  ],
};

describe('DashboardPage', () => {
  it('asks visitors to log in', () => {
    mocks.auth = fakeAuth(null);
    renderScreen(<DashboardPage />);
    expect(screen.getByText(/log in to view the dashboard/i)).toBeInTheDocument();
  });

  it('is not available to attendees', () => {
    mocks.auth = fakeAuth('attendee');
    renderScreen(<DashboardPage />);
    expect(screen.getByText(/only available to organizer, staff and admin/i)).toBeInTheDocument();
  });

  it('shows live totals and tier availability to an organizer', async () => {
    mocks.auth = fakeAuth('organizer');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(summary)));
    renderScreen(<DashboardPage />);

    expect(await screen.findByText('Test Concert')).toBeInTheDocument();
    expect(screen.getByText('Tickets sold')).toBeInTheDocument();
    expect(screen.getByText('1 (50%)')).toBeInTheDocument();
    expect(screen.getByText(/48 left of 50/)).toBeInTheDocument();
    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('tells the user when the session expired', async () => {
    mocks.auth = fakeAuth('organizer');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Invalid or expired token.' }, 401)));
    renderScreen(<DashboardPage />);

    expect(await screen.findByText(/session expired/i)).toBeInTheDocument();
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });
});
