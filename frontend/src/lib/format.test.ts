import { formatDateTime, formatEth, shortAddress } from './format';

describe('shortAddress', () => {
  it('shortens a wallet address', () => {
    expect(shortAddress('0xF08D1234567890abcdef1234567890abcdef1234')).toBe('0xF08D…1234');
  });
  it('returns an empty string when there is no address', () => {
    expect(shortAddress(null)).toBe('');
    expect(shortAddress(undefined)).toBe('');
  });
});

describe('formatEth', () => {
  it('trims trailing zeros and adds the unit', () => {
    expect(formatEth('0.0100')).toBe('0.01 ETH');
    expect(formatEth(0.0359549220525)).toBe('0.036 ETH');
  });
  it('handles whole numbers and invalid input', () => {
    expect(formatEth(2)).toBe('2 ETH');
    expect(formatEth('not a number')).toBe('0 ETH');
  });
});

describe('formatDateTime', () => {
  it('returns an empty string for missing or invalid dates', () => {
    expect(formatDateTime(null)).toBe('');
    expect(formatDateTime('garbage')).toBe('');
  });
  it('formats a valid ISO date', () => {
    expect(formatDateTime('2026-12-01T11:00:00Z')).toMatch(/2026/);
  });
});
