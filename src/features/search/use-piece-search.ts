import { useEffect, useState } from 'react';

import type { DetectedPiece, SourcePhoto } from '@/features/split/detection';
import { messageFor } from '@/lib/backend';

import { searchPiece, type PieceSearchResult } from './search-piece';

export type PieceSearchState =
  | { status: 'loading' }
  | { status: 'done'; data: PieceSearchResult }
  | { status: 'error'; message: string };

/**
 * Runs the search for a piece when the results screen opens, and again on retry.
 * Pass null while the screen's params are invalid.
 */
export function usePieceSearch(
  photo: SourcePhoto | null,
  piece: Pick<DetectedPiece, 'category' | 'box'> | null,
) {
  const [state, setState] = useState<PieceSearchState>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);

  // Primitive keys so a new params object with the same values doesn't search twice.
  const photoKey = photo ? `${photo.uri}|${photo.width}|${photo.height}` : null;
  const pieceKey = piece ? `${piece.category}|${JSON.stringify(piece.box)}` : null;

  useEffect(() => {
    if (!photo || !piece) return;
    let cancelled = false;
    searchPiece(photo, piece)
      .then((data) => {
        if (!cancelled) setState({ status: 'done', data });
      })
      .catch((error: unknown) => {
        if (!cancelled) setState({ status: 'error', message: messageFor(error) });
      });
    return () => {
      cancelled = true;
    };
    // photo and piece are represented by their keys.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [photoKey, pieceKey, attempt]);

  function retry() {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  }

  return { state, retry };
}
