import type { DetectedPieceDTO, GarmentCategory, NormalizedBox } from './types.ts';

/** One object from Google Vision's OBJECT_LOCALIZATION response. */
export type VisionObject = {
  name?: unknown;
  score?: unknown;
  boundingPoly?: { normalizedVertices?: unknown };
};

type Garment = { category: GarmentCategory; label: string };

/**
 * Vision object names (lowercased) that are clothing, and what the app calls them.
 * Anything not listed (Person, Furniture, ...) is ignored.
 */
const GARMENTS: Record<string, Garment> = {
  top: { category: 'top', label: 'Top' },
  shirt: { category: 'top', label: 'Top' },
  't-shirt': { category: 'top', label: 'Top' },
  blouse: { category: 'top', label: 'Top' },
  sweater: { category: 'top', label: 'Sweater' },
  'tank top': { category: 'top', label: 'Top' },
  pants: { category: 'bottom', label: 'Pants' },
  jeans: { category: 'bottom', label: 'Jeans' },
  shorts: { category: 'bottom', label: 'Shorts' },
  skirt: { category: 'bottom', label: 'Skirt' },
  miniskirt: { category: 'bottom', label: 'Skirt' },
  dress: { category: 'dress', label: 'Dress' },
  jacket: { category: 'outerwear', label: 'Jacket' },
  coat: { category: 'outerwear', label: 'Coat' },
  outerwear: { category: 'outerwear', label: 'Jacket' },
  suit: { category: 'outerwear', label: 'Blazer' },
  shoe: { category: 'shoes', label: 'Shoes' },
  footwear: { category: 'shoes', label: 'Shoes' },
  boot: { category: 'shoes', label: 'Boots' },
  'high heels': { category: 'shoes', label: 'Heels' },
  sneakers: { category: 'shoes', label: 'Sneakers' },
  sandal: { category: 'shoes', label: 'Sandals' },
  handbag: { category: 'bag', label: 'Bag' },
  bag: { category: 'bag', label: 'Bag' },
  purse: { category: 'bag', label: 'Bag' },
  backpack: { category: 'bag', label: 'Backpack' },
  'luggage & bags': { category: 'bag', label: 'Bag' },
  sunglasses: { category: 'accessory', label: 'Sunglasses' },
  glasses: { category: 'accessory', label: 'Glasses' },
  hat: { category: 'accessory', label: 'Hat' },
  'sun hat': { category: 'accessory', label: 'Hat' },
  fedora: { category: 'accessory', label: 'Hat' },
  scarf: { category: 'accessory', label: 'Scarf' },
  belt: { category: 'accessory', label: 'Belt' },
  watch: { category: 'accessory', label: 'Watch' },
  necklace: { category: 'accessory', label: 'Necklace' },
  earrings: { category: 'accessory', label: 'Earrings' },
  jewelry: { category: 'accessory', label: 'Jewelry' },
};

type Candidate = Garment & { box: NormalizedBox; score: number };

const clamp01 = (value: number) => Math.min(1, Math.max(0, value));

/** Bounding box from Vision's vertices. Vision omits coordinates that are 0, so missing means 0. */
export function boxFromVertices(vertices: unknown): NormalizedBox | null {
  if (!Array.isArray(vertices) || vertices.length === 0) return null;
  const xs: number[] = [];
  const ys: number[] = [];
  for (const vertex of vertices) {
    const point = (vertex ?? {}) as { x?: unknown; y?: unknown };
    xs.push(typeof point.x === 'number' ? clamp01(point.x) : 0);
    ys.push(typeof point.y === 'number' ? clamp01(point.y) : 0);
  }
  const x = Math.min(...xs);
  const y = Math.min(...ys);
  const width = Math.max(...xs) - x;
  const height = Math.max(...ys) - y;
  if (width <= 0.01 || height <= 0.01) return null;
  return { x, y, width, height };
}

export function intersectionOverUnion(a: NormalizedBox, b: NormalizedBox): number {
  const left = Math.max(a.x, b.x);
  const top = Math.max(a.y, b.y);
  const right = Math.min(a.x + a.width, b.x + b.width);
  const bottom = Math.min(a.y + a.height, b.y + b.height);
  const intersection = Math.max(0, right - left) * Math.max(0, bottom - top);
  const union = a.width * a.height + b.width * b.height - intersection;
  return union > 0 ? intersection / union : 0;
}

function unionBox(a: NormalizedBox, b: NormalizedBox): NormalizedBox {
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/** Grow a box a little so cutouts don't clip the edges of the garment. */
function pad(box: NormalizedBox, amount: number): NormalizedBox {
  const x = clamp01(box.x - amount);
  const y = clamp01(box.y - amount);
  return {
    x,
    y,
    width: clamp01(box.x + box.width + amount) - x,
    height: clamp01(box.y + box.height + amount) - y,
  };
}

type Options = {
  minScore?: number;
  maxPieces?: number;
  padding?: number;
};

/**
 * Turns Vision's objects into the pieces the app shows:
 * clothing only, confident only, shoes merged into one pair, overlapping duplicates removed,
 * ordered top to bottom the way an outfit reads.
 */
export function piecesFromVision(
  objects: VisionObject[],
  { minScore = 0.5, maxPieces = 5, padding = 0.02 }: Options = {},
): DetectedPieceDTO[] {
  const candidates: Candidate[] = [];
  for (const object of objects) {
    if (typeof object.name !== 'string' || typeof object.score !== 'number') continue;
    if (object.score < minScore) continue;
    const garment = GARMENTS[object.name.trim().toLowerCase()];
    if (!garment) continue;
    const box = boxFromVertices(object.boundingPoly?.normalizedVertices);
    if (!box) continue;
    candidates.push({ ...garment, box, score: object.score });
  }

  // Shoes come back one per foot. Show them as one pair.
  const shoes = candidates.filter((candidate) => candidate.category === 'shoes');
  const others = candidates.filter((candidate) => candidate.category !== 'shoes');
  const merged: Candidate[] = [...others];
  if (shoes.length > 0) {
    const best = shoes.reduce((a, b) => (b.score > a.score ? b : a));
    merged.push({
      ...best,
      box: shoes.map((shoe) => shoe.box).reduce(unionBox),
      score: best.score,
    });
  }

  // Same category, mostly the same spot: keep the more confident one.
  merged.sort((a, b) => b.score - a.score);
  const kept: Candidate[] = [];
  for (const candidate of merged) {
    const duplicate = kept.some(
      (existing) =>
        existing.category === candidate.category &&
        intersectionOverUnion(existing.box, candidate.box) > 0.4,
    );
    if (!duplicate) kept.push(candidate);
  }

  const chosen = kept.slice(0, maxPieces);
  chosen.sort((a, b) => a.box.y + a.box.height / 2 - (b.box.y + b.box.height / 2));

  const labelCounts = new Map<string, number>();
  return chosen.map((candidate, index) => {
    const seen = (labelCounts.get(candidate.label) ?? 0) + 1;
    labelCounts.set(candidate.label, seen);
    return {
      id: `${candidate.category}-${index}`,
      category: candidate.category,
      label: seen > 1 ? `${candidate.label} ${seen}` : candidate.label,
      box: pad(candidate.box, padding),
      score: Math.round(candidate.score * 100) / 100,
    };
  });
}
