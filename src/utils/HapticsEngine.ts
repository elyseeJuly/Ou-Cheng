import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { EventBus } from './EventBus';
import { getSettings } from '../services/storageService';

const isNative = (): boolean => {
  return typeof window !== 'undefined' && Boolean(window.Capacitor?.isNativePlatform());
};

const SHAPE_HAPTICS: Record<string, [number, string, number][]> = {
  peony:         [[0, 'heavy', 1.0]],
  dahlia:        [[0, 'heavy', 0.9]],
  chrysanthemum: [[0, 'medium', 0.8], [80, 'light', 0.4]],
  willow:        [[0, 'heavy', 1.0], [200, 'light', 0.5], [450, 'light', 0.3], [750, 'light', 0.15]],
  brocade:       [[0, 'heavy', 1.0], [250, 'light', 0.4], [550, 'light', 0.2]],
  starburst:     [[0, 'rigid', 1.0]],
  spider:        [[0, 'rigid', 0.9], [60, 'light', 0.3]],
  crossette:     [[0, 'medium', 0.9], [300, 'light', 0.5], [340, 'light', 0.5], [380, 'light', 0.5]],
  saturn:        [[0, 'medium', 0.7]],
  pearl:         [[0, 'light', 0.5], [90, 'light', 0.5], [180, 'light', 0.5]],
  dud:           [],
  _default:      [[0, 'medium', 0.8]],
};

async function playPattern(pattern: [number, string, number][]) {
  if (!isNative()) {
    // Web Fallback: vibration if supported
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      if (pattern.length > 0) {
        // Vibrate 40ms to simulate tactile feedback
        navigator.vibrate(40);
      }
    }
    return;
  }

  for (const [delay, style] of pattern) {
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    try {
      const capStyle =
        style === 'rigid' ? ImpactStyle.Heavy :
        style === 'heavy' ? ImpactStyle.Heavy :
        style === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
      await Haptics.impact({ style: capStyle });
    } catch (e) {
      console.warn('Failed to play native haptic impact:', e);
    }
  }
}

export function initHaptics() {
  // Sync state from settings on startup
  const settings = getSettings();
  let enabled = settings.hapticsEnabled !== false;
  let beatTickEnabled = settings.beatTickHapticsEnabled === true;

  EventBus.on('SETTINGS_HAPTICS', ({ on }: { on: boolean }) => {
    enabled = on;
  });
  EventBus.on('SETTINGS_BEAT_TICK_HAPTICS', ({ on }: { on: boolean }) => {
    beatTickEnabled = on;
  });

  EventBus.on('BEAT_TICK', () => {
    if (enabled && beatTickEnabled) {
      if (isNative()) {
        Haptics.impact({ style: ImpactStyle.Light }).catch(() => {});
      } else if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate(10);
      }
    }
  });

  EventBus.on('TRIGGER_BURST', (d: { shapeType: string }) => {
    if (!enabled) return;
    const pattern = SHAPE_HAPTICS[d.shapeType] ?? SHAPE_HAPTICS._default;
    playPattern(pattern);
  });

  let chargeTimer: ReturnType<typeof setInterval> | null = null;
  EventBus.on('CHARGE_UPDATE', ({ chargeLevel }: { chargeLevel: number }) => {
    if (!enabled) return;
    if (!chargeTimer) {
      chargeTimer = setInterval(() => {
        if (isNative()) {
          Haptics.selectionChanged().catch(() => {});
        }
      }, Math.max(40, 160 - chargeLevel * 120));
    }
  });

  EventBus.on('CHARGE_RELEASE', () => {
    if (chargeTimer) {
      clearInterval(chargeTimer);
      chargeTimer = null;
    }
  });
}
