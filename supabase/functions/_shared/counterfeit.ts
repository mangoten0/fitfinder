/**
 * Keeps fakes out of results. A dupe is a different product with a similar look from a real
 * retailer. A counterfeit copies the brand. We never show counterfeits.
 */

/** Marketplaces where copied-logo listings are common and returns are unreliable. */
const BLOCKED_SOURCES = [
  'dhgate',
  'aliexpress',
  'alibaba',
  'wish.com',
  '1688',
  'taobao',
  'joom',
  'made-in-china',
];

/** Luxury houses whose names show up on fakes. */
const LUXURY_BRANDS = [
  'chanel',
  'gucci',
  'prada',
  'louis vuitton',
  'dior',
  'hermes',
  'hermès',
  'balenciaga',
  'saint laurent',
  'ysl',
  'celine',
  'céline',
  'bottega veneta',
  'miu miu',
  'fendi',
  'burberry',
  'versace',
  'givenchy',
  'loewe',
  'valentino',
  'moncler',
  'goyard',
  'cartier',
  'van cleef',
  'chloé',
  'chloe',
];

/** Retailers and authenticated resellers that legitimately sell luxury pieces. */
const AUTHORIZED_SOURCES = [
  'nordstrom',
  'saks',
  'neiman',
  'bergdorf',
  'bloomingdale',
  'net-a-porter',
  'mytheresa',
  'ssense',
  'farfetch',
  'matchesfashion',
  'harrods',
  'selfridges',
  'luisaviaroma',
  'shopbop',
  'revolve',
  'fwrd',
  'browns',
  'therealreal',
  'the realreal',
  'vestiaire',
  'fashionphile',
  'rebag',
];

const FAKE_WORDS = /\b(replica|reps?|1:1|mirror quality|aaa\+?|top quality copy|super fake)\b/i;

/** Below this, a luxury-brand listing from an unauthorized seller is treated as fake. */
const LUXURY_FLOOR_CENTS = 15_000;

function hostOf(link: string): string {
  try {
    return new URL(link).hostname.toLowerCase();
  } catch {
    return '';
  }
}

function mentionsBrand(title: string): string | null {
  const lower = title.toLowerCase();
  for (const brand of LUXURY_BRANDS) {
    const pattern = new RegExp(`(^|[^a-z])${brand.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}([^a-z]|$)`);
    if (pattern.test(lower)) return brand;
  }
  return null;
}

export type ListingForCheck = {
  title: string;
  source: string;
  link: string;
  priceCents: number | null;
};

export function isLikelyCounterfeit({ title, source, link, priceCents }: ListingForCheck): boolean {
  const host = hostOf(link);
  const sourceLower = source.toLowerCase();
  const where = `${host} ${sourceLower}`;

  if (BLOCKED_SOURCES.some((blocked) => where.includes(blocked))) return true;
  if (FAKE_WORDS.test(title)) return true;

  const brand = mentionsBrand(title);
  if (!brand) return false;

  const compactBrand = brand.replace(/[^a-z]/g, '');
  const sellsItself = host.replace(/[^a-z]/g, '').includes(compactBrand);
  const authorized = AUTHORIZED_SOURCES.some((retailer) => where.includes(retailer));
  if (sellsItself || authorized) return false;

  return priceCents === null || priceCents < LUXURY_FLOOR_CENTS;
}
