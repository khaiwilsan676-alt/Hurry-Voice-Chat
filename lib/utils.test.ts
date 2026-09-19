import { describe, it, expect } from 'vitest';
import { getNumericAccountId } from './utils';

describe('getNumericAccountId', () => {
  it('returns purely numeric strings as is', () => {
    expect(getNumericAccountId('12345678')).toBe('12345678');
    expect(getNumericAccountId(41710423)).toBe('41710423');
  });

  it('prioritizes valid numeric idInput over fallbackUid', () => {
    expect(getNumericAccountId('98765432', 'firebase_uid_123')).toBe('98765432');
  });

  it('converts alphanumeric Firebase UIDs to 8-digit numeric IDs', () => {
    const res1 = getNumericAccountId('abc123FirebaseUid');
    expect(res1).toMatch(/^\d{8}$/);

    const res2 = getNumericAccountId('abc123FirebaseUid');
    expect(res1).toBe(res2); // Deterministic
  });

  it('handles null, undefined, guest, and empty strings gracefully', () => {
    expect(getNumericAccountId(null)).toBe('10000000');
    expect(getNumericAccountId(undefined)).toBe('10000000');
    expect(getNumericAccountId('guest')).toBe('10000000');
    expect(getNumericAccountId('')).toBe('10000000');
  });
});
