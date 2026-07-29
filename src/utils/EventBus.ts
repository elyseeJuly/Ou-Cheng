// ============================================================
// 偶成 (Ou Cheng) v0.5.1 — 强类型全局事件总线
// ============================================================

export interface AppEvents {
  TRIGGER_BURST: { shapeType: string };
  SETTINGS_HAPTICS: { on: boolean };
  SETTINGS_BEAT_TICK_HAPTICS: { on: boolean };
  BEAT_TICK: void;
  CHARGE_UPDATE: { chargeLevel: number };
  CHARGE_RELEASE: void;
}

type EventCallback<T> = (data: T) => void;

class EventBusClass {
  private listeners = new Map<keyof AppEvents, Set<EventCallback<unknown>>>();

  on<K extends keyof AppEvents>(event: K, callback: EventCallback<AppEvents[K]>): () => void {
    const callbacks = this.listeners.get(event) ?? new Set<EventCallback<unknown>>();
    callbacks.add(callback as EventCallback<unknown>);
    this.listeners.set(event, callbacks);
    return () => this.off(event, callback);
  }

  off<K extends keyof AppEvents>(event: K, callback: EventCallback<AppEvents[K]>): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    callbacks.delete(callback as EventCallback<unknown>);
    if (callbacks.size === 0) this.listeners.delete(event);
  }

  emit<K extends keyof AppEvents>(
    event: K,
    ...args: AppEvents[K] extends void ? [data?: undefined] : [data: AppEvents[K]]
  ): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    const payload = args[0];
    callbacks.forEach(cb => {
      try {
        cb(payload);
      } catch (error) {
        console.error(`Error in EventBus listener for ${String(event)}:`, error);
      }
    });
  }
}

export const EventBus = new EventBusClass();
