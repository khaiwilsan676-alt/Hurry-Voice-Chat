import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Ensures that any user ID or Firebase UID is formatted as a numeric Account ID.
 * If the input is already a purely numeric string, it returns it as is.
 * Otherwise, it deterministically hashes the alphanumeric UID into an 8-digit numeric ID.
 */
export function getNumericAccountId(idInput?: any, fallbackUid?: string): string {
  if (idInput !== null && idInput !== undefined) {
    const strVal = String(idInput).trim();
    if (strVal && /^\d+$/.test(strVal)) {
      return strVal;
    }
  }

  const rawCandidate = String(fallbackUid || idInput || '').trim();
  if (!rawCandidate || rawCandidate === 'guest') {
    return '10000000';
  }

  let hash = 0;
  for (let i = 0; i < rawCandidate.length; i++) {
    hash = (hash << 5) - hash + rawCandidate.charCodeAt(i);
    hash |= 0;
  }

  const positiveHash = Math.abs(hash);
  const numericId = 10000000 + (positiveHash % 89999999);
  return String(numericId);
}
