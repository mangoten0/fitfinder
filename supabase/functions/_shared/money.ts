import type { MoneyDTO } from './types.ts';

const SYMBOLS: [string, string][] = [
  ['US$', 'USD'],
  ['CA$', 'CAD'],
  ['A$', 'AUD'],
  ['$', 'USD'],
  ['€', 'EUR'],
  ['£', 'GBP'],
];

function centsFrom(value: number): number | null {
  if (!Number.isFinite(value) || value <= 0 || value > 100_000) return null;
  return Math.round(value * 100);
}

function currencyFrom(text: string, fallback: string): string {
  const trimmed = text.trim();
  for (const [symbol, code] of SYMBOLS) {
    if (trimmed.startsWith(symbol) || trimmed.includes(symbol)) return code;
  }
  const code = /\b([A-Z]{3})\b/.exec(trimmed)?.[1];
  return code ?? fallback;
}

/**
 * Reads a price from the shapes search results use: a number, a "$24.99*" string, or an object
 * like { value: "$24.99", extracted_value: 24.99, currency: "$" }. Returns null when there's no
 * usable price.
 */
export function parsePrice(price: unknown, extracted: unknown, fallbackCurrency = 'USD'): MoneyDTO | null {
  if (price && typeof price === 'object') {
    const object = price as { value?: unknown; extracted_value?: unknown; currency?: unknown };
    const currencyText =
      typeof object.currency === 'string'
        ? object.currency
        : typeof object.value === 'string'
          ? object.value
          : '';
    return parsePrice(
      typeof object.value === 'string' ? object.value : null,
      object.extracted_value,
      currencyFrom(currencyText, fallbackCurrency),
    );
  }

  const text = typeof price === 'string' ? price : '';
  const currency = text ? currencyFrom(text, fallbackCurrency) : fallbackCurrency;

  if (typeof extracted === 'number') {
    const cents = centsFrom(extracted);
    return cents === null ? null : { cents, currency };
  }

  const numeric = /(\d{1,3}(?:,\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/.exec(text)?.[1];
  if (!numeric) return null;
  const cents = centsFrom(Number(numeric.replace(/,/g, '')));
  return cents === null ? null : { cents, currency };
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? Math.round(((sorted[middle - 1] ?? 0) + (sorted[middle] ?? 0)) / 2)
    : (sorted[middle] ?? null);
}
