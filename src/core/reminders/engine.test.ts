import { describe, it, expect, beforeEach } from "vitest";
import {
  scanReminders,
  isWithinDedupWindow,
  isInQuietHours,
  isReminderTypeEnabled,
  markTriggered,
  clearTriggered,
} from "./engine";
import { createInitialData } from "../db/initialData";
import { useStore } from "../store/useStore";
import type { KikiData, ReminderSettings } from "../types";

const defaultSettings = (): ReminderSettings =>
  createInitialData().settings.reminders;
const makeData = (o: Partial<KikiData> = {}): KikiData => ({
  ...createInitialData(),
  ...o,
});

describe("isWithinDedupWindow", () => {
  const now = new Date("2026-08-26T12:00:00Z");
  it("无上次触发返回 false", () => {
    expect(isWithinDedupWindow(undefined, now, 24)).toBe(false);
  });
  it("24h 内返回 true", () => {
    expect(isWithinDedupWindow("2026-08-26T10:00:00Z", now, 24)).toBe(true);
  });
  it("超过 24h 返回 false", () => {
    expect(isWithinDedupWindow("2026-08-25T10:00:00Z", now, 24)).toBe(false);
  });
});

describe("isInQuietHours", () => {
  it("未启用返回 false", () => {
    const s = defaultSettings();
    s.quietHours.enabled = false;
    expect(isInQuietHours(new Date("2026-08-26T23:00:00"), s)).toBe(false);
  });
  it("跨日 22:00-08:00 夜间触发", () => {
    const s = defaultSettings();
    s.quietHours.enabled = true;
    expect(isInQuietHours(new Date("2026-08-26T23:00:00"), s)).toBe(true);
    expect(isInQuietHours(new Date("2026-08-26T07:00:00"), s)).toBe(true);
  });
  it("白天不触发", () => {
    const s = defaultSettings();
    s.quietHours.enabled = true;
    expect(isInQuietHours(new Date("2026-08-26T12:00:00"), s)).toBe(false);
  });
});

describe("isReminderTypeEnabled", () => {
  it("全局关闭返回 false", () => {
    const s = defaultSettings();
    s.globalEnabled = false;
    expect(isReminderTypeEnabled(s, "restock")).toBe(false);
  });
  it("perType 显式 false 关闭", () => {
    const s = defaultSettings();
    s.perType.restock = false;
    expect(isReminderTypeEnabled(s, "restock")).toBe(false);
  });
  it("未设置视为启用", () => {
    expect(isReminderTypeEnabled(defaultSettings(), "vaccine")).toBe(true);
  });
});

describe("scanReminders", () => {
  beforeEach(() => {
    clearTriggered();
    useStore.setState({ data: createInitialData() });
  });

  it("全局关闭返回空", () => {
    const s = defaultSettings();
    s.globalEnabled = false;
    expect(
      scanReminders(makeData(), new Date("2026-08-26T12:00:00Z"), s)
    ).toEqual([]);
  });

  it("免打扰时段返回空", () => {
    const s = defaultSettings();
    s.quietHours.enabled = true;
    expect(
      scanReminders(makeData(), new Date("2026-08-26T23:00:00"), s)
    ).toEqual([]);
  });

  it("补货提醒：库存 ≤ 阈值", () => {
    const s = defaultSettings();
    const data = makeData({
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
    });
    const r = scanReminders(data, new Date("2026-08-26T12:00:00Z"), s);
    expect(r.find((x) => x.kind === "restock")).toBeTruthy();
  });

  it("补货提醒 24h 去重", () => {
    const s = defaultSettings();
    const data = makeData({
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
    });
    const now = new Date("2026-08-26T12:00:00Z");
    const first = scanReminders(data, now, s);
    expect(first.length).toBe(1);
    markTriggered(first[0].id, now);
    const second = scanReminders(data, new Date("2026-08-26T13:00:00Z"), s);
    expect(second.find((x) => x.kind === "restock")).toBeUndefined();
  });

  it("宠物疫苗提前 7 天提醒", () => {
    const s = defaultSettings();
    const data = makeData({
      pets: [
        {
          id: "p1",
          name: "团子",
          species: "cat",
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
        },
      ],
      petReminders: [
        {
          id: "r1",
          petId: "p1",
          type: "vaccine",
          title: "猫三联",
          nextDate: "2026-09-02T00:00:00Z",
          enabled: true,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
        },
      ],
    });
    const r = scanReminders(data, new Date("2026-08-26T00:00:00Z"), s);
    const v = r.find((x) => x.kind === "vaccine");
    expect(v).toBeTruthy();
    expect(v!.body).toContain("7 天");
  });

  it("宠物疫苗当天到期", () => {
    const s = defaultSettings();
    const data = makeData({
      pets: [
        {
          id: "p1",
          name: "团子",
          species: "cat",
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
        },
      ],
      petReminders: [
        {
          id: "r1",
          petId: "p1",
          type: "vaccine",
          title: "猫三联",
          nextDate: "2026-08-26T00:00:00Z",
          enabled: true,
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
        },
      ],
    });
    const r = scanReminders(data, new Date("2026-08-26T00:00:00Z"), s);
    const v = r.find((x) => x.kind === "vaccine");
    expect(v).toBeTruthy();
    expect(v!.body).toContain("今天到期");
  });

  it("粮食不足提醒", () => {
    const s = defaultSettings();
    const data = makeData({
      pets: [
        {
          id: "p1",
          name: "团子",
          species: "cat",
          createdAt: "2026-08-01T00:00:00Z",
          updatedAt: "2026-08-01T00:00:00Z",
        },
      ],
      petFoods: [
        {
          id: "f1",
          petId: "p1",
          totalWeight: 1,
          dailyConsumption: 200,
          recordDate: "2026-08-20T00:00:00Z",
          createdAt: "2026-08-20T00:00:00Z",
          updatedAt: "2026-08-20T00:00:00Z",
        },
      ],
    });
    const r = scanReminders(data, new Date("2026-08-26T00:00:00Z"), s);
    const f = r.find((x) => x.kind === "food_low");
    expect(f).toBeTruthy();
    expect(f!.title).toContain("粮食");
  });
});
