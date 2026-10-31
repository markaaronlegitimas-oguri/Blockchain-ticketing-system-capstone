import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TransferDialog from './TransferDialog';
import { renderScreen } from '../../test-utils';

// all lower-case addresses carry no checksum, so they are always accepted
const VALID = '0xf08d1234567890abcdef1234567890abcdef1234';
// same address with wrong upper/lower-case letters: the checksum no longer matches
const BAD_CHECKSUM = '0xF08D1234567890abcdef1234567890abcdef1234';

function setup(props: Partial<React.ComponentProps<typeof TransferDialog>> = {}) {
  const onConfirm = vi.fn();
  renderScreen(
    <TransferDialog open ticketId={3} busy={false} error={null} onClose={() => {}} onConfirm={onConfirm} {...props} />
  );
  return { onConfirm };
}

describe('TransferDialog', () => {
  it('keeps the Transfer button disabled until the address is valid', async () => {
    setup();
    const button = screen.getByRole('button', { name: 'Transfer' });
    expect(button).toBeDisabled();

    await userEvent.type(screen.getByLabelText(/recipient wallet address/i), 'not-an-address');
    expect(button).toBeDisabled();
  });

  it('rejects an address whose checksum is wrong', async () => {
    setup();
    await userEvent.type(screen.getByLabelText(/recipient wallet address/i), BAD_CHECKSUM);
    expect(screen.getByRole('button', { name: 'Transfer' })).toBeDisabled();
  });

  it('confirms with the trimmed recipient address', async () => {
    const { onConfirm } = setup();
    await userEvent.type(screen.getByLabelText(/recipient wallet address/i), `  ${VALID}  `);
    await userEvent.click(screen.getByRole('button', { name: 'Transfer' }));
    expect(onConfirm).toHaveBeenCalledWith(VALID);
  });

  it('shows an error from the transfer attempt', () => {
    setup({ error: 'insufficient funds for gas' });
    expect(screen.getByText('insufficient funds for gas')).toBeInTheDocument();
  });
});
