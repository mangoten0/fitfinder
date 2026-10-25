import type { ViewStyle } from 'react-native';

import type { Palette } from './palette';

/**
 * Box shadows for rectangular things (slider thumb, raised segment). Two layers: a tight contact
 * shadow plus a soft ambient one. Stickers use their own hard offset shadow instead (see Sticker).
 */
export type Elevation = 'flat' | 'raised' | 'floating';

export function elevation(level: Elevation, palette: Palette, isDark: boolean): ViewStyle {
  const rgb = palette.shadowRGB;
  // Shadows barely register on dark backgrounds, so they get stronger there.
  const k = isDark ? 2.2 : 1;
  switch (level) {
    case 'flat':
      return {};
    case 'raised':
      return {
        boxShadow: `0 1px 2px rgba(${rgb}, ${0.06 * k}), 0 4px 10px rgba(${rgb}, ${0.08 * k})`,
      };
    case 'floating':
      return {
        boxShadow: `0 2px 4px rgba(${rgb}, ${0.08 * k}), 0 14px 28px rgba(${rgb}, ${0.16 * k})`,
      };
  }
}
