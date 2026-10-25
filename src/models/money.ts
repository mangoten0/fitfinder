/**
 * A price, stored as whole cents so math never drifts the way floating point does.
 * 4800 means $48.00.
 */
export type Money = {
  cents: number;
  currency: string;
};

export function money(cents: number, currency = 'USD'): Money {
  return { cents: Math.round(cents), currency };
}

/** "$48" for whole amounts, "$25.90" otherwise, in the phone's locale. */
export function formatMoney({ cents, currency }: Money): string {
  const fractionDigits = cents % 100 === 0 ? 0 : 2;
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(cents / 100);
}

/** How much cheaper `price` is than `reference`. Null when it isn't cheaper or currencies differ. */
export function savings(price: Money, reference: Money): Money | null {
  if (price.currency !== reference.currency || price.cents >= reference.cents) return null;
  return money(reference.cents - price.cents, price.currency);
}
