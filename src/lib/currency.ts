/**
 * Centralized Nigerian Currency Formatter (₦ / NGN)
 * 
 * Strict formatting invariant:
 * Display the Nigerian Naira sign `₦` across all financial ledgers, fees, admissions, and tuition modules.
 * Fall back to `NGN` where the symbol is explicitly requested or for plain text / export exports.
 */

export const NAIRA_SYMBOL = '₦';
export const NAIRA_CODE = 'NGN';

export function formatNaira(
  amount: number | null | undefined,
  useCode: boolean = false
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return useCode ? `${NAIRA_CODE} 0.00` : `${NAIRA_SYMBOL}0.00`;
  }

  const formatted = Number(amount).toLocaleString('en-NG', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return useCode ? `${NAIRA_CODE} ${formatted}` : `${NAIRA_SYMBOL}${formatted}`;
}

/**
 * Clean currency string to numeric value
 */
export function parseNaira(value: string): number {
  if (!value) return 0;
  const cleaned = value.replace(/[^\d.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}
