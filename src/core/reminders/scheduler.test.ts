import { describe, it, expect, beforeEach } from "vitest";
import { ReminderScheduler, setScheduler } from "./scheduler";
import { MockNotifier, setNotifier } from "./notifier";
import { clearTriggered } from "./engine";
import { useStore } from "../store/useStore";
import { createInitialData } from "../db/initialData";

describe("ReminderScheduler", () => {
  let scheduler: ReminderScheduler;
  let notifier: MockNotifier;

  beforeEach(() => {
    clearTriggered();
    notifier = new MockNotifier();
    setNotifier(notifier);
    scheduler = new ReminderScheduler();
    useStore.setState({ data: createInitialData() });
  });

  it("runOnce 无提醒时返回空且不通知", () => {
    const results = scheduler.runOnce(new Date("2026-08-26T12:00:00Z"));
    expect(results).toEqual([]);
    expect(notifier.sent.length).toBe(0);
  });

  it("runOnce 有补货提醒时发送通知", () => {
    useStore.setState({
      data: {
        ...createInitialData(),
        items: [
          {
            id: "i1",
            name: "纸巾",
            category: "daily",
            stock: 1,
            unit: "包",
            threshold: 3,
            createdAt: "2026-08-01T00:00:00Z",
            updatedAt: "2026-08-01T00:00:00Z",
          },
        ],
      },
    });
    const results = scheduler.runOnce(new Date("2026-08-26T12:00:00Z"));
    expect(results.length).toBe(1);
    expect(notifier.sent.length).toBe(1);
    expect(notifier.sent[0].title).toContain("纸巾");
  });

  it("runOnce 去重：再次扫描不重复通知", () => {
    useStore.setState({
      data: {
        ...createInitialData(),
        items: [
          {
            id: "i1",
            name: "纸巾",
            category: "daily",
            stock: 1,
            unit: "包",
            threshold: 3,
            createdAt: "2026-08-01T00:00:00Z",
            updatedAt: "2026-08-01T00:00:00Z",
          },
        ],
      },
    });
    const now = new Date("2026-08-26T12:00:00Z");
    scheduler.runOnce(now);
    expect(notifier.sent.length).toBe(1);
    scheduler.runOnce(new Date("2026-08-26T13:00:00Z"));
    expect(notifier.sent.length).toBe(1);
  });

  it("start/stop 不抛错", () => {
    scheduler.start(1000);
    scheduler.stop();
  });

  it("setScheduler 注入后可用", () => {
    setScheduler(scheduler);
    expect(scheduler).toBeTruthy();
  });
});
