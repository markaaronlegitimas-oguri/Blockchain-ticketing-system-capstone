import { screen } from '@testing-library/react';
import NavLinks from './NavLinks';
import { FakeAuth, fakeAuth, renderScreen } from '../test-utils';

const mocks = vi.hoisted(() => ({ auth: null as unknown as FakeAuth }));
vi.mock('../features/auth/AuthContext', () => ({ useAuth: () => mocks.auth }));

describe('NavLinks', () => {
  it('shows only Events and My tickets to a visitor', () => {
    mocks.auth = fakeAuth(null);
    renderScreen(<NavLinks />);
    expect(screen.getByRole('link', { name: 'Events' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'My tickets' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Scanner' })).not.toBeInTheDocument();
  });

  it('shows the Dashboard but not the Scanner to an organizer', () => {
    mocks.auth = fakeAuth('organizer');
    renderScreen(<NavLinks />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Scanner' })).not.toBeInTheDocument();
  });

  it('shows both the Dashboard and the Scanner to staff', () => {
    mocks.auth = fakeAuth('staff');
    renderScreen(<NavLinks />);
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Scanner' })).toBeInTheDocument();
  });
});
