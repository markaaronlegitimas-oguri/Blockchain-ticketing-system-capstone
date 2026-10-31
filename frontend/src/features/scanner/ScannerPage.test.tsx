import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ScannerPage from './ScannerPage';
import { FakeAuth, fakeAuth, jsonResponse, renderScreen } from '../../test-utils';

const mocks = vi.hoisted(() => ({ auth: null as unknown as FakeAuth }));
vi.mock('../auth/AuthContext', () => ({ useAuth: () => mocks.auth }));
vi.mock('html5-qrcode', () => ({ Html5Qrcode: vi.fn() }));

afterEach(() => vi.unstubAllGlobals());

async function checkIn(code: string) {
  await userEvent.type(screen.getByLabelText(/ticket qr code text/i), code);
  await userEvent.click(screen.getByRole('button', { name: 'Check in' }));
}

describe('ScannerPage', () => {
  it('asks visitors to log in', () => {
    mocks.auth = fakeAuth(null);
    renderScreen(<ScannerPage />);
    expect(screen.getByText(/log in as staff/i)).toBeInTheDocument();
  });

  it('is not available to attendees', () => {
    mocks.auth = fakeAuth('attendee');
    renderScreen(<ScannerPage />);
    expect(screen.getByText(/only available to staff and admin/i)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument();
  });

  it('approves entry when the backend accepts the ticket', async () => {
    mocks.auth = fakeAuth('staff');
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({ ticket: { onchain_ticket_id: 7 } }));
    vi.stubGlobal('fetch', fetchMock);
    renderScreen(<ScannerPage />);

    await checkIn('TICKET-7-abc');

    expect(await screen.findByText(/entry approved/i)).toBeInTheDocument();
    expect(screen.getByText(/ticket #7/i)).toBeInTheDocument();
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toMatch(/\/tickets\/check-in$/);
    expect(options.headers.Authorization).toBe('Bearer token-123');
    expect(JSON.parse(options.body)).toEqual({ qrCode: 'TICKET-7-abc' });
  });

  it('denies entry when the ticket was already used', async () => {
    mocks.auth = fakeAuth('staff');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Ticket already checked in' }, 409)));
    renderScreen(<ScannerPage />);

    await checkIn('TICKET-7-abc');

    expect(await screen.findByText(/entry denied.*already checked in/i)).toBeInTheDocument();
  });

  it('denies entry for an unknown code', async () => {
    mocks.auth = fakeAuth('staff');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({ error: 'Ticket not found' }, 404)));
    renderScreen(<ScannerPage />);

    await checkIn('nonsense');

    expect(await screen.findByText(/entry denied.*not found/i)).toBeInTheDocument();
  });
});
