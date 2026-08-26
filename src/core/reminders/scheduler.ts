/**
 * 提醒调度器
 * 网页形态：页面打开时扫描 + setInterval 定时扫描
 */
import { scanReminders, markTriggered, type ReminderResult } from "./engine";
import { getNotifier } from "./notifier";
import { useStore } from "../store/useStore";

export interface Scheduler {
  start(intervalMs?: number): void;
  stop(): void;
  runOnce(now?: Date): ReminderResult[];
}

export class ReminderScheduler implements Scheduler {
  private timer: ReturnType<typeof setInterval> | null = null;
  private intervalMs: number;

  constructor(intervalMs: number = 5 * 60 * 1000) {
    this.intervalMs = intervalMs;
  }

  start(intervalMs?: number): void {
    if (intervalMs) this.intervalMs = intervalMs;
    if (this.timer) return;
    this.runOnce();
    this.timer = setInterval(() => this.runOnce(), this.intervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  runOnce(now: Date = new Date()): ReminderResult[] {
    const { data } = useStore.getState();
    const settings = data.settings.reminders;
    const results = scanReminders(data, now, settings);
    if (results.length > 0) {
      for (const r of results) {
        markTriggered(r.id, now);
      }
      getNotifier().notifyReminders(results);
    }
    return results;
  }
}

let schedulerInstance: Scheduler | null = null;

export function getScheduler(): Scheduler {
  if (!schedulerInstance) {
    schedulerInstance = new ReminderScheduler();
  }
  return schedulerInstance;
}

export function setScheduler(s: Scheduler): void {
  schedulerInstance = s;
}
