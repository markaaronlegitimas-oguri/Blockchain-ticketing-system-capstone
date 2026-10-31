export function shortAddress(address?: string | null): string {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** "0.0359" style amount with the unit, trimming useless trailing zeros. */
export function formatEth(value: string | number, maxDecimals = 4): string {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0 ETH';
  const text = n.toFixed(maxDecimals).replace(/\.?0+$/, '');
  return `${text === '' ? '0' : text} ETH`;
}

export function formatDateTime(iso?: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}
