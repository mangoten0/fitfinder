import { money, savings } from '@/models/money';
import type { MatchResult, Product } from '@/models/product';

/** Sample results for the design system screen. Real results come from search in Phase 2. */
const original = money(4800);

const exact: Product = {
  id: 'preview-exact',
  title: 'Contour squareneck bodysuit',
  retailer: 'Aritzia',
  category: 'top',
  price: original,
  imageUrl: null,
  productUrl: 'https://example.com/products/exact',
};

const dupe: Product = {
  id: 'preview-dupe-1',
  title: 'Ribbed square neck bodysuit',
  retailer: 'H&M',
  category: 'top',
  price: money(1800),
  imageUrl: null,
  productUrl: 'https://example.com/products/dupe-1',
};

const secondDupe: Product = {
  id: 'preview-dupe-2',
  title: 'Seamless squareneck top',
  retailer: 'Abercrombie & Fitch',
  category: 'top',
  price: money(3500),
  imageUrl: null,
  productUrl: 'https://example.com/products/dupe-2',
};

const alternative: Product = {
  id: 'preview-alternative',
  title: 'Scoop neck rib tank',
  retailer: 'Zara',
  category: 'top',
  price: money(2590),
  imageUrl: null,
  productUrl: 'https://example.com/products/alternative',
};

export const previewResults: MatchResult[] = [
  { product: exact, kind: 'exact', savings: null, availability: 'in_stock' },
  { product: dupe, kind: 'dupe', savings: savings(dupe.price, original), availability: 'in_stock' },
  {
    product: secondDupe,
    kind: 'dupe',
    savings: savings(secondDupe.price, original),
    availability: 'unknown',
  },
  { product: alternative, kind: 'alternative', savings: null, availability: 'in_stock' },
];
