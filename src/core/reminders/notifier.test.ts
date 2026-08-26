import { describe, it, expect, beforeEach } from "vitest";
import { MockNotifier, setNotifier, getNotifier } from "./notifier";
import type { ReminderResult } from "./engine";

describe("MockNotifier", () => {
  let n: MockNotifier;

  beforeEach(() => {
    n = new MockNotifier();
  });

  it("默认权限 granted", () => {
    expect(n.getPermission()).toBe("granted");
  });

  it("requestPermission granted 返回 true", async () => {
    expect(await n.requestPermission()).toBe(true);
  });

  it("权限 denied 时 requestPermission 返回 false", async () => {
    n.permission = "denied";
    expect(await n.requestPermission()).toBe(false);
  });

  it("notify 记录发送", () => {
    const ok = n.notify("标题", "正文");
    expect(ok).toBe(true);
    expect(n.sent.length).toBe(1);
    expect(n.sent[0].title).toBe("标题");
  });

  it("权限 denied 时 notify 返回 false 不记录", () => {
    n.permission = "denied";
    expect(n.notify("标题")).toBe(false);
    expect(n.sent.length).toBe(0);
  });

  it("notifyReminders 批量发送", () => {
    const results: ReminderResult[] = [
      { id: "1", kind: "restock", title: "补货", body: "纸巾不足", relatedId: "i1", triggeredAt: "2026-08-26T00:00:00Z" },
      { id: "2", kind: "vaccine", title: "疫苗", body: "猫三联到期", relatedId: "r1", triggeredAt: "2026-08-26T00:00:00Z" },
    ];
    expect(n.notifyReminders(results)).toBe(2);
    expect(n.sent.length).toBe(2);
  });

  it("reset 清空记录", () => {
    n.notify("a");
    n.reset();
    expect(n.sent.length).toBe(0);
  });
});

describe("setNotifier / getNotifier", () => {
  it("注入后 getNotifier 返回注入实例", () => {
    const mock = new MockNotifier();
    setNotifier(mock);
    expect(getNotifier()).toBe(mock);
  });
});
