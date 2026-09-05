import { describe, it, expect } from "vitest";
import {
  toDateStr,
  getMonday,
  weekRange,
  getWeekInsight,
  getWeekTrend,
  analyzeSleep,
  analyzeConsumption,
  generateAdvice,
} from "./index";
import { createInitialData } from "../db/initialData";
import type { KikiData } from "../types";

// 测试固定锚点：2026-08-26 是周三
const NOW = new Date("2026-08-26T12:00:00Z");

function baseData(): KikiData {
  const d = createInitialData();
  return { ...d, sleepRecords: [], moodRecords: [], todos: [], transactions: [] };
}

describe("weekRange", () => {
  it("getMonday of wednesday is monday", () => {
    expect(toDateStr(getMonday(NOW))).toBe("2026-08-24");
  });
  it("weekRange covers monday to sunday", () => {
    const { startStr, endStr } = weekRange(NOW);
    expect(startStr).toBe("2026-08-24");
    expect(endStr).toBe("2026-08-31");
  });
  it("sunday belongs to previous week", () => {
    const sunday = new Date("2026-08-23T12:00:00Z");
    expect(weekRange(sunday).startStr).toBe("2026-08-17");
  });
});

describe("getWeekInsight", () => {
  it("empty data all zero", () => {
    const insight = getWeekInsight(baseData(), NOW);
    expect(insight.current.completedTodos).toBe(0);
    expect(insight.current.sleepAvg).toBeNull();
    expect(insight.current.weeklyExpense).toBe(0);
  });
  it("counts completed todos this week", () => {
    const data = baseData();
    data.todos = [
      { id: "a", title: "a", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-25T10:00:00Z", createdAt: "", updatedAt: "" },
      { id: "b", title: "b", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-20T10:00:00Z", createdAt: "", updatedAt: "" },
    ];
    expect(getWeekInsight(data, NOW).current.completedTodos).toBe(1);
  });
  it("sleep avg and expense", () => {
    const data = baseData();
    data.sleepRecords = [
      { id: "s1", date: "2026-08-24", hours: 8, createdAt: "", updatedAt: "" },
      { id: "s2", date: "2026-08-25", hours: 6, createdAt: "", updatedAt: "" },
    ];
    data.transactions = [
      { id: "t1", type: "expense", amount: 50, category: "food", date: "2026-08-25", createdAt: "", updatedAt: "" },
      { id: "t2", type: "income", amount: 1000, category: "other", date: "2026-08-25", createdAt: "", updatedAt: "" },
    ];
    const insight = getWeekInsight(data, NOW);
    expect(insight.current.sleepAvg).toBe(7);
    expect(insight.current.sleepDays).toBe(2);
    expect(insight.current.weeklyExpense).toBe(50);
  });
  it("delta compares with previous week", () => {
    const data = baseData();
    data.todos = [
      { id: "w1", title: "w1", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-25T10:00:00Z", createdAt: "", updatedAt: "" },
      { id: "w2", title: "w2", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-26T10:00:00Z", createdAt: "", updatedAt: "" },
      { id: "w3", title: "w3", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-24T10:00:00Z", createdAt: "", updatedAt: "" },
      { id: "p1", title: "p1", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-20T10:00:00Z", createdAt: "", updatedAt: "" },
    ];
    const insight = getWeekInsight(data, NOW);
    expect(insight.current.completedTodos).toBe(3);
    expect(insight.previous.completedTodos).toBe(1);
    expect(insight.delta.completedTodos).toBe(200);
  });

  it("lastWeek mode covers previous week", () => {
    const data = baseData();
    // 上周：8/17-8/23 完成任务
    data.todos = [
      { id: "p1", title: "p1", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-20T10:00:00Z", createdAt: "", updatedAt: "" },
      { id: "p2", title: "p2", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-22T10:00:00Z", createdAt: "", updatedAt: "" },
    ];
    const insight = getWeekInsight(data, NOW, "lastWeek");
    expect(insight.current.completedTodos).toBe(2);
    expect(insight.weekStart).toBe("2026-08-17");
    expect(insight.weekEnd).toBe("2026-08-24");
  });

  it("last7days mode covers last 7 days", () => {
    const data = baseData();
    // 8/20 在本周 but 不在 last7days 范围（last7days: 8/19-8/26）
    data.todos = [
      { id: "a1", title: "a1", priority: "medium", repeatRule: "none", isCompleted: true, completedAt: "2026-08-25T10:00:00Z", createdAt: "", updatedAt: "" },
    ];
    const insight = getWeekInsight(data, NOW, "last7days");
    expect(insight.current.completedTodos).toBe(1);
  });
});

describe("getWeekTrend", () => {
  it("returns 7 points in order with data", () => {
    const data = baseData();
    data.sleepRecords = [
      { id: "s1", date: "2026-08-26", hours: 8, createdAt: "", updatedAt: "" },
    ];
    data.moodRecords = [
      { id: "m1", date: "2026-08-26", mood: "happy", createdAt: "", updatedAt: "" },
    ];
    const trend = getWeekTrend(data, NOW);
    expect(trend.length).toBe(7);
    expect(trend[0].date).toBe("2026-08-20");
    expect(trend[6].date).toBe("2026-08-26");
    expect(trend[6].sleepHours).toBe(8);
    expect(trend[6].mood).toBe("happy");
    expect(trend[0].mood).toBeNull();
  });
});

describe("analyzeSleep", () => {
  it("unknown when no records", () => {
    expect(analyzeSleep(baseData(), NOW).status).toBe("unknown");
  });
  it("good when avg >= 8", () => {
    const data = baseData();
    data.sleepRecords = [
      { id: "s1", date: "2026-08-24", hours: 8.5, createdAt: "", updatedAt: "" },
      { id: "s2", date: "2026-08-25", hours: 7.5, createdAt: "", updatedAt: "" },
    ];
    const a = analyzeSleep(data, NOW);
    expect(a.avgHours).toBe(8);
    expect(a.status).toBe("good");
    expect(a.bestDay?.hours).toBe(8.5);
  });
  it("insufficient when avg < 8", () => {
    const data = baseData();
    data.sleepRecords = [
      { id: "s1", date: "2026-08-24", hours: 6, createdAt: "", updatedAt: "" },
    ];
    const a = analyzeSleep(data, NOW);
    expect(a.status).toBe("insufficient");
    expect(a.gap).toBe(2);
  });
});

describe("analyzeConsumption", () => {
  it("empty consumption", () => {
    const c = analyzeConsumption(baseData(), NOW);
    expect(c.total).toBe(0);
    expect(c.topCategory).toBeNull();
  });
  it("top category and percents", () => {
    const data = baseData();
    data.transactions = [
      { id: "t1", type: "expense", amount: 60, category: "food", date: "2026-08-25", createdAt: "", updatedAt: "" },
      { id: "t2", type: "expense", amount: 40, category: "transport", date: "2026-08-26", createdAt: "", updatedAt: "" },
    ];
    const c = analyzeConsumption(data, NOW);
    expect(c.total).toBe(100);
    expect(c.topCategory?.category).toBe("餐饮");
    expect(c.topCategory?.percent).toBe(60);
    expect(c.categories.length).toBe(2);
  });
  it("over budget when exceeds", () => {
    const data = baseData();
    data.transactions = [
      { id: "t1", type: "expense", amount: 300, category: "food", date: "2026-08-25", createdAt: "", updatedAt: "" },
    ];
    data.budgets = [{ month: "2026-08", total: 200 }];
    const c = analyzeConsumption(data, NOW);
    expect(c.overBudget).toBe(true);
    expect(c.budgetTotal).toBe(200);
  });
});

describe("generateAdvice", () => {
  it("returns advice items with positive tone", () => {
    const data = baseData();
    const advice = generateAdvice(data, NOW);
    expect(advice.title).toBe("本周建议");
    expect(advice.items.length).toBeGreaterThanOrEqual(2);
    expect(advice.items.join("")).toContain("公园");
  });

  it("includes outdoor suggestion always", () => {
    const advice = generateAdvice(baseData(), NOW);
    expect(advice.items.some((i) => i.includes("户外") || i.includes("公园"))).toBe(true);
  });
});
