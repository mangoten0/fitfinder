import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

/**
 * Haptics are reserved for meaningful moments: a piece lifting or landing, a value snapping to a
 * new step, an order succeeding or failing. Ordinary button taps stay silent.
 * The OS mutes these automatically when the user turns system haptics off.
 */
export type HapticKind = 'select' | 'lift' | 'land' | 'success' | 'warning' | 'error';

export const hapticKinds: HapticKind[] = ['select', 'lift', 'land', 'success', 'warning', 'error'];

export function haptic(kind: HapticKind): void {
  if (Platform.OS === 'web') return;

  let pending: Promise<void>;
  switch (kind) {
    case 'select':
      pending = Haptics.selectionAsync();
      break;
    case 'lift':
      pending = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Rigid);
      break;
    case 'land':
      pending = Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
      break;
    case 'success':
      pending = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      break;
    case 'warning':
      pending = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      break;
    case 'error':
      pending = Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      break;
  }
  // A haptic that fails to fire is never worth surfacing to the user.
  pending.catch(() => undefined);
}
