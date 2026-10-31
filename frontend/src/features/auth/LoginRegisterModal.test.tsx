import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginRegisterModal from './LoginRegisterModal';
import { FakeAuth, fakeAuth, renderScreen } from '../../test-utils';

const mocks = vi.hoisted(() => ({ auth: null as unknown as FakeAuth }));
vi.mock('./AuthContext', () => ({ useAuth: () => mocks.auth }));

describe('LoginRegisterModal', () => {
  it('logs the user in with the entered credentials and closes', async () => {
    mocks.auth = fakeAuth(null);
    const onClose = vi.fn();
    renderScreen(<LoginRegisterModal open onClose={onClose} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'secret123');
    await userEvent.click(screen.getByRole('button', { name: 'Log In' }));

    await waitFor(() => expect(mocks.auth.login).toHaveBeenCalledWith('test@example.com', 'secret123'));
    expect(onClose).toHaveBeenCalled();
  });

  it('asks for a full name on the Register tab', async () => {
    mocks.auth = fakeAuth(null);
    renderScreen(<LoginRegisterModal open onClose={() => {}} />);
    expect(screen.queryByLabelText(/full name/i)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: 'Register' }));
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
  });

  it('shows the error when login fails', async () => {
    mocks.auth = fakeAuth(null);
    mocks.auth.login.mockRejectedValue(new Error('Invalid credentials'));
    renderScreen(<LoginRegisterModal open onClose={() => {}} />);

    await userEvent.type(screen.getByLabelText(/email/i), 'a@b.com');
    await userEvent.type(screen.getByLabelText(/password/i), 'wrong');
    await userEvent.click(screen.getByRole('button', { name: 'Log In' }));

    expect(await screen.findByText('Invalid credentials')).toBeInTheDocument();
  });
});
