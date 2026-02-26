/**
 * Strips all non-digit characters from a string.
 */
function digits(value: string): string {
  return value.replace(/\D/g, '');
}

/**
 * Auto-formats a raw input string as a US phone number: (XXX) XXX-XXXX.
 * Strips non-digits first, then applies progressive formatting.
 */
export function formatPhone(value: string): string {
  const d = digits(value).slice(0, 10);
  if (d.length === 0) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

/**
 * Returns true if the value contains exactly 10 digits (valid US phone).
 */
export function isValidUSPhone(value: string): boolean {
  return digits(value).length === 10;
}
