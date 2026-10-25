import assert from 'node:assert/strict';

import { affiliateConfigFrom, affiliateUrl } from './affiliate.ts';
import { canonicalLink, classify, stableId } from './classify.ts';
import { isLikelyCounterfeit } from './counterfeit.ts';
import { boxFromVertices, intersectionOverUnion, piecesFromVision } from './garments.ts';
import { lensItemsFrom, type LensItem } from './lens.ts';
import { median, parsePrice } from './money.ts';
import { availabilityFromHtml } from './stock.ts';

// MARK: garments

const vertices = (x1: number, y1: number, x2: number, y2: number) => [
  { x: x1, y: y1 },
  { x: x2, y: y1 },
  { x: x2, y: y2 },
  { x: x1, y: y2 },
];

Deno.test('boxFromVertices treats missing coordinates as 0', () => {
  const box = boxFromVertices([{ y: 0.1 }, { x: 0.5, y: 0.1 }, { x: 0.5, y: 0.6 }, { y: 0.6 }]);
  assert.deepEqual(box, { x: 0, y: 0.1, width: 0.5, height: 0.5 });
});

Deno.test('piecesFromVision keeps clothing, drops people and low scores, orders top to bottom', () => {
  const pieces = piecesFromVision(
    [
      { name: 'Person', score: 0.98, boundingPoly: { normalizedVertices: vertices(0.1, 0, 0.9, 1) } },
      { name: 'Pants', score: 0.9, boundingPoly: { normalizedVertices: vertices(0.3, 0.45, 0.7, 0.8) } },
      { name: 'Top', score: 0.85, boundingPoly: { normalizedVertices: vertices(0.25, 0.15, 0.75, 0.45) } },
      { name: 'Hat', score: 0.3, boundingPoly: { normalizedVertices: vertices(0.4, 0, 0.6, 0.1) } },
    ],
    { padding: 0 },
  );
  assert.deepEqual(
    pieces.map((piece) => piece.label),
    ['Top', 'Pants'],
  );
  assert.equal(pieces[0]?.category, 'top');
});

Deno.test('piecesFromVision merges two shoes into one pair', () => {
  const pieces = piecesFromVision(
    [
      { name: 'Shoe', score: 0.8, boundingPoly: { normalizedVertices: vertices(0.3, 0.85, 0.45, 0.95) } },
      { name: 'Shoe', score: 0.7, boundingPoly: { normalizedVertices: vertices(0.55, 0.86, 0.7, 0.96) } },
    ],
    { padding: 0 },
  );
  assert.equal(pieces.length, 1);
  assert.equal(pieces[0]?.label, 'Shoes');
  const box = pieces[0]?.box;
  assert.ok(box && Math.abs(box.x - 0.3) < 1e-9 && Math.abs(box.x + box.width - 0.7) < 1e-9);
});

Deno.test('piecesFromVision removes overlapping duplicates of the same category', () => {
  const pieces = piecesFromVision(
    [
      { name: 'Top', score: 0.9, boundingPoly: { normalizedVertices: vertices(0.2, 0.1, 0.8, 0.4) } },
      { name: 'Shirt', score: 0.6, boundingPoly: { normalizedVertices: vertices(0.22, 0.12, 0.8, 0.42) } },
    ],
    { padding: 0 },
  );
  assert.equal(pieces.length, 1);
});

Deno.test('intersectionOverUnion of identical boxes is 1', () => {
  const box = { x: 0.1, y: 0.1, width: 0.5, height: 0.5 };
  assert.equal(intersectionOverUnion(box, box), 1);
});

// MARK: money

Deno.test('parsePrice reads strings, numbers, and objects', () => {
  assert.deepEqual(parsePrice('$24.99*', undefined), { cents: 2499, currency: 'USD' });
  assert.deepEqual(parsePrice('$1,249.00', undefined), { cents: 124900, currency: 'USD' });
  assert.deepEqual(parsePrice('$48', 48), { cents: 4800, currency: 'USD' });
  assert.deepEqual(parsePrice({ value: '€20', extracted_value: 20, currency: '€' }, undefined), {
    cents: 2000,
    currency: 'EUR',
  });
  assert.equal(parsePrice('Free', undefined), null);
  assert.equal(parsePrice(undefined, undefined), null);
});

Deno.test('median handles odd and even counts', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([1, 2, 3, 4]), 3);
  assert.equal(median([]), null);
});

// MARK: counterfeit filter

Deno.test('counterfeit filter blocks fake marketplaces and cheap luxury listings', () => {
  const base = { link: 'https://www.amazon.com/p/1', source: 'Amazon', priceCents: 3000 };
  assert.equal(isLikelyCounterfeit({ ...base, title: 'Ribbed square neck bodysuit' }), false);
  assert.equal(isLikelyCounterfeit({ ...base, title: 'Chanel style quilted bag' }), true);
  assert.equal(isLikelyCounterfeit({ ...base, title: 'Quilted bag 1:1 mirror quality' }), true);
  assert.equal(
    isLikelyCounterfeit({ title: 'Mini bag', source: 'DHgate', link: 'https://www.dhgate.com/x', priceCents: 2000 }),
    true,
  );
  assert.equal(
    isLikelyCounterfeit({
      title: 'Prada Re-Edition nylon bag',
      source: 'Nordstrom',
      link: 'https://www.nordstrom.com/s/prada',
      priceCents: 189000,
    }),
    false,
  );
  // "Dior" inside another word is not a brand mention.
  assert.equal(isLikelyCounterfeit({ ...base, title: 'Indoor lounge set' }), false);
});

// MARK: lens parsing

Deno.test('lensItemsFrom cleans items and reads stock flags', () => {
  const items = lensItemsFrom(
    {
      exact_matches: [
        {
          title: '  Contour   bodysuit ',
          link: 'https://www.aritzia.com/p/contour',
          source: 'Aritzia',
          price: '$48.00',
          extracted_price: 48,
          in_stock: true,
          thumbnail: 'https://img.example.com/a.jpg',
        },
        { title: 'No link' },
        { title: 'Insecure', link: 'http://example.com/x' },
        { title: 'Gone', link: 'https://shop.example.com/y', out_of_stock: true },
      ],
    },
    'exact_matches',
  );
  assert.equal(items.length, 2);
  assert.equal(items[0]?.title, 'Contour bodysuit');
  assert.deepEqual(items[0]?.price, { cents: 4800, currency: 'USD' });
  assert.equal(items[0]?.inStock, true);
  assert.equal(items[1]?.inStock, false);
  assert.equal(items[1]?.source, 'shop.example.com');
});

// MARK: classification

const item = (title: string, link: string, cents: number | null, source = 'Store'): LensItem => ({
  title,
  link,
  source,
  imageUrl: null,
  price: cents === null ? null : { cents, currency: 'USD' },
  inStock: null,
});

Deno.test('classify finds the exact item, cheaper dupes, and alternatives', () => {
  const { candidates, referencePrice } = classify(
    [item('Contour bodysuit', 'https://aritzia.com/contour', 4800, 'Aritzia')],
    [
      item('Contour bodysuit', 'https://aritzia.com/contour?utm=1', 4800, 'Aritzia'),
      item('Rib bodysuit', 'https://hm.com/rib', 1800, 'H&M'),
      item('Seamless top', 'https://abercrombie.com/seamless', 3500, 'Abercrombie'),
      item('Square neck top', 'https://zara.com/sq', 4500, 'Zara'),
      item('Luxe bodysuit', 'https://store.com/luxe', null),
      item('Chanel inspired top', 'https://cheap.com/c', 1200),
    ],
  );
  assert.deepEqual(referencePrice, { cents: 4800, currency: 'USD' });
  assert.deepEqual(
    candidates.map((candidate) => [candidate.kind, candidate.item.title]),
    [
      ['exact', 'Contour bodysuit'],
      ['dupe', 'Rib bodysuit'],
      ['dupe', 'Seamless top'],
      ['alternative', 'Square neck top'],
    ],
  );
  assert.deepEqual(candidates[1]?.savings, { cents: 3000, currency: 'USD' });
});

Deno.test('classify without an exact match uses the typical price and claims no savings', () => {
  const { candidates, referencePrice } = classify(
    [],
    [
      item('A', 'https://a.com/1', 6000),
      item('B', 'https://b.com/1', 5000),
      item('C', 'https://c.com/1', 2000),
    ],
  );
  assert.deepEqual(referencePrice, { cents: 5000, currency: 'USD' });
  const dupe = candidates.find((candidate) => candidate.kind === 'dupe');
  assert.equal(dupe?.item.title, 'C');
  assert.equal(dupe?.savings, null);
});

Deno.test('canonicalLink ignores tracking parameters and www', () => {
  assert.equal(canonicalLink('https://www.zara.com/p/1/?utm_source=x'), canonicalLink('https://zara.com/p/1'));
  assert.equal(stableId('abc'), stableId('abc'));
});

// MARK: stock

Deno.test('availabilityFromHtml reads schema.org and meta tags', () => {
  assert.equal(availabilityFromHtml('{"@type":"Offer","availability":"https://schema.org/InStock"}'), 'in_stock');
  assert.equal(availabilityFromHtml('{"availability":"http://schema.org/OutOfStock"}'), 'sold_out');
  assert.equal(
    availabilityFromHtml('<meta property="product:availability" content="out of stock">'),
    'sold_out',
  );
  assert.equal(availabilityFromHtml('<html>nothing here</html>'), 'unknown');
  // Some sizes in stock means the item is in stock.
  assert.equal(
    availabilityFromHtml('"availability":"OutOfStock" ... "availability":"InStock"'),
    'in_stock',
  );
});

// MARK: affiliate

Deno.test('affiliate links wrap the store URL only when configured', () => {
  const url = 'https://www.zara.com/p/1?x=1';
  assert.equal(affiliateUrl(url, affiliateConfigFrom(undefined, undefined)), url);
  assert.equal(affiliateUrl(url, affiliateConfigFrom('skimlinks', '')), url);
  assert.equal(
    affiliateUrl(url, affiliateConfigFrom('Skimlinks', '12345X678')),
    `https://go.skimresources.com/?id=12345X678&xs=1&url=${encodeURIComponent(url)}`,
  );
  assert.equal(
    affiliateUrl(url, affiliateConfigFrom('sovrn', 'abc')),
    `https://redirect.viglink.com/?key=abc&u=${encodeURIComponent(url)}`,
  );
});
