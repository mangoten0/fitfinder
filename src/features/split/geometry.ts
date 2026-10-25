/** Plain rectangle in screen points. */
export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** A box inside a photo, as fractions of the photo's width and height (0 to 1). */
export type NormalizedBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/** Where an image of the given size lands when fitted inside `frame` without cropping. */
export function containRect(frame: Rect, imageWidth: number, imageHeight: number): Rect {
  if (imageWidth <= 0 || imageHeight <= 0) return frame;
  const scale = Math.min(frame.width / imageWidth, frame.height / imageHeight);
  const width = imageWidth * scale;
  const height = imageHeight * scale;
  return {
    x: frame.x + (frame.width - width) / 2,
    y: frame.y + (frame.height - height) / 2,
    width,
    height,
  };
}

/** Screen rect of a piece, given where the photo is drawn on screen. */
export function pieceRect(imageRect: Rect, box: NormalizedBox): Rect {
  return {
    x: imageRect.x + box.x * imageRect.width,
    y: imageRect.y + box.y * imageRect.height,
    width: box.width * imageRect.width,
    height: box.height * imageRect.height,
  };
}

/** Fits a rect of the given aspect ratio inside `cell`, centered, using `fill` of the cell. */
function fitInCell(cell: Rect, aspect: number, fill: number): Rect {
  const maxWidth = cell.width * fill;
  const maxHeight = cell.height * fill;
  let width = maxWidth;
  let height = width / aspect;
  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspect;
  }
  return {
    x: cell.x + (cell.width - width) / 2,
    y: cell.y + (cell.height - height) / 2,
    width,
    height,
  };
}

/**
 * Where each piece lands in the tray: a grid of up to two columns, each piece fitted into its
 * cell with its real proportions. A lone item on the last row is centered.
 */
export function trayLayout(area: Rect, aspects: number[], gap: number): Rect[] {
  const count = aspects.length;
  if (count === 0) return [];
  const columns = count === 1 ? 1 : 2;
  const rows = Math.ceil(count / columns);
  const cellWidth = (area.width - gap * (columns - 1)) / columns;
  const cellHeight = (area.height - gap * (rows - 1)) / rows;

  return aspects.map((aspect, index) => {
    const row = Math.floor(index / columns);
    const column = index % columns;
    const itemsInRow = Math.min(columns, count - row * columns);
    const rowOffset = itemsInRow < columns ? (cellWidth + gap) / 2 : 0;
    const cell: Rect = {
      x: area.x + column * (cellWidth + gap) + rowOffset,
      y: area.y + row * (cellHeight + gap),
      width: cellWidth,
      height: cellHeight,
    };
    return fitInCell(cell, aspect, 0.82);
  });
}
