export function normalizePhoneDigits(phone?: string | null): string {
  return (phone || '').replace(/\D/g, '');
}

/**
 * Matches two phone numbers tolerantly across whitespace/formatting and
 * local vs country-code prefixes (when the normalized digits suffix is >= 10).
 */
export function phonesMatch(a?: string | null, b?: string | null): boolean {
  const cleanA = (a || '').trim().toLowerCase();
  const cleanB = (b || '').trim().toLowerCase();
  if (!cleanA || !cleanB) return false;
  if (cleanA === cleanB) return true;

  const digitsA = normalizePhoneDigits(cleanA);
  const digitsB = normalizePhoneDigits(cleanB);
  if (!digitsA || !digitsB) return false;
  if (digitsA === digitsB) return true;

  const minLen = Math.min(digitsA.length, digitsB.length);
  if (minLen >= 10) {
    return digitsA.endsWith(digitsB) || digitsB.endsWith(digitsA);
  }
  return false;
}
