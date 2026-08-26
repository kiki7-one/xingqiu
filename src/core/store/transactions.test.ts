import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { setupTestDB, loadStore, cleanupTestDB, resetStore } from "../../test/dbHelper";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  setBudget,
  getBudget,
  getMonthlyStats,
  isOverBudget,
} from "../../core/store/transactions";
import { useStore } from "../../core/store/useStore";

describe("transactions store", () => {
  let filePath: string;

  beforeEach(async () => {
    ({ filePath } = setupTestDB());
    resetStore();
    await loadStore();
  });

  afterEach(async () => {
    await cleanupTestDB(filePath);
  });

  it("addTransaction 增加交易", async () => {
    const tx = await addTransaction({
      type: "expense",
      amount: 25.5,
      category: "food",
      date: "2026-08-26",
    });
    expect(tx.amount).toBe(25.5);
    expect(useStore.getState().data.transactions.length).toBe(1);
  });

  it("getMonthlyStats 月度统计", async () => {
    await addTransaction({
      type: "income",
      amount: 5000,
      category: "other",
      date: "2026-08-01",
    });
    await addTransaction({
      type: "expense",
      amount: 100,
      category: "food",
      date: "2026-08-15",
    });
    await addTransaction({
      type: "expense",
      amount: 50,
      category: "transport",
      date: "2026-08-20",
    });
    // 其他月份不应计入
    await addTransaction({
      type: "expense",
      amount: 200,
      category: "food",
      date: "2026-07-15",
    });

    const stats = getMonthlyStats("2026-08");
    expect(stats.income).toBe(5000);
    expect(stats.expense).toBe(150);
    expect(stats.net).toBe(4850);
    expect(stats.byCategory.food).toBe(100);
    expect(stats.byCategory.transport).toBe(50);
  });

  it("setBudget + getBudget + isOverBudget", async () => {
    await setBudget({ month: "2026-08", total: 200 });
    const budget = getBudget("2026-08");
    expect(budget?.total).toBe(200);

    await addTransaction({
      type: "expense",
      amount: 100,
      category: "food",
      date: "2026-08-01",
    });
    expect(isOverBudget("2026-08").over).toBe(false);

    await addTransaction({
      type: "expense",
      amount: 150,
      category: "food",
      date: "2026-08-15",
    });
    expect(isOverBudget("2026-08").over).toBe(true);
  });

  it("isOverBudget 无预算返回 false", () => {
    expect(isOverBudget("2026-09").over).toBe(false);
  });
});
