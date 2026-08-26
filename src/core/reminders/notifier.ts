/**
 * 本地通知封装
 * - 网页形态：浏览器 Notification API
 * - App 形态（Electron）：后续 M5 整合时接入 Electron Notification
 */
import type { ReminderResult } from "./engine";

export interface Notifier {
  requestPermission(): Promise<boolean>;
  getPermission(): NotificationPermission | "unsupported";
  notify(title: string, body?: string): boolean;
  notifyReminders(results: ReminderResult[]): number;
}

export class BrowserNotifier implements Notifier {
  requestPermission(): Promise<boolean> {
    if (typeof Notification === "undefined") return Promise.resolve(false);
    if (Notification.permission === "granted") return Promise.resolve(true);
    return Notification.requestPermission().then((p) => p === "granted");
  }

  getPermission(): NotificationPermission | "unsupported" {
    if (typeof Notification === "undefined") return "unsupported";
    return Notification.permission;
  }

  notify(title: string, body?: string): boolean {
    if (typeof Notification === "undefined") return false;
    if (Notification.permission !== "granted") return false;
    try {
      new Notification(title, { body });
      return true;
    } catch {
      return false;
    }
  }

  notifyReminders(results: ReminderResult[]): number {
    let sent = 0;
    for (const r of results) {
      if (this.notify(r.title, r.body)) sent++;
    }
    return sent;
  }
}

export class MockNotifier implements Notifier {
  public permission: NotificationPermission = "granted";
  public sent: { title: string; body?: string }[] = [];

  requestPermission(): Promise<boolean> {
    return Promise.resolve(this.permission === "granted");
  }
  getPermission(): NotificationPermission | "unsupported" {
    return this.permission;
  }
  notify(title: string, body?: string): boolean {
    if (this.permission !== "granted") return false;
    this.sent.push({ title, body });
    return true;
  }
  notifyReminders(results: ReminderResult[]): number {
    let sent = 0;
    for (const r of results) {
      if (this.notify(r.title, r.body)) sent++;
    }
    return sent;
  }
  reset(): void {
    this.sent = [];
  }
}

let notifierInstance: Notifier | null = null;

export function getNotifier(): Notifier {
  if (!notifierInstance) {
    notifierInstance = new BrowserNotifier();
  }
  return notifierInstance;
}

export function setNotifier(n: Notifier): void {
  notifierInstance = n;
}
