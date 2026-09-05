import { mutateField, withBase, touch } from "./useStore";
import { useStore } from "./useStore";
import type {
  Transaction,
  TransactionType,
  TransactionCategory,
  Budget,
} from "../types";

export async function addTransaction(
  input: Omit<Transaction, "id" | "createdAt" | "updatedAt">
): Promise<Transaction> {
  const tx = withBase(input);
  await mutateField("transactions", (arr) => [...arr, tx]);
  return tx;
}

export async function updateTransaction(
  id: string,
  patch: Partial<Transaction>
): Promise<void> {
  await mutateField("transactions", (arr) =>
    arr.map((t) => (t.id === id ? touch({ ...t, ...patch }) : t))
  );
}

export async function deleteTransaction(id: string): Promise<void> {
  await mutateField("transactions", (arr) => arr.filter((t) => t.id !== id));
}

// ============ 预算 ============

export async function setBudget(budget: Budget): Promise<void> {
  const existing = useStore.getState().data.budgets;
  const idx = existing.findIndex((b) => b.month === budget.month);
  if (idx >= 0) {
    const next = [...existing];
    next[idx] = budget;
    await mutateField("budgets", () => next);
  } else {
    await mutateField("budgets", (arr) => [...arr, budget]);
  }
}

export function getBudget(month: string): Budget | undefined {
  return useStore.getState().data.budgets.find((b) => b.month === month);
}

// ============ 统计 ============

export interface MonthlyStats {
  month: string;
  income: number;
  expense: number;
  net: number;
  byCategory: Partial<Record<TransactionCategory, number>>;
}

export interface DailyExpense {
  date: string; // YYYY-MM-DD
  amount: number;
}

export interface YearlyStats {
  year: string;
  income: number;
  expense: number;
  byMonth: Partial<Record<string, { income: number; expense: number }>>;
}

export interface CategoryRank {
  category: TransactionCategory;
  amount: number;
  percent: number;
}

/**
 * 获取某月每日支出曲线
 */
export function getDailyExpenses(month: string): DailyExpense[] {
  const map: Record<string, number> = {};
  const txs = useStore.getState().data.transactions.filter(
    (t) => t.type === "expense" && t.date.slice(0, 7) === month
  );
  for (const t of txs) {
    map[t.date] = (map[t.date] ?? 0) + t.amount;
  }
  return Object.keys(map)
    .sort()
    .map((date) => ({ date, amount: Math.round(map[date] * 100) / 100 }));
}

/**
 * 获取某月分类支出排行榜（降序）
 */
export function getCategoryRanks(month: string): CategoryRank[] {
  const stats = getMonthlyStats(month);
  const total = stats.expense;
  const ranks: CategoryRank[] = Object.entries(stats.byCategory)
    .filter(([, v]) => v > 0)
    .map(([category, amount]) => ({
      category: category as TransactionCategory,
      amount: Math.round(amount * 100) / 100,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);
  return ranks;
}

/**
 * 获取某年收支统计（含每月明细）
 */
export function getYearlyStats(year: string): YearlyStats {
  const stats: YearlyStats = { year, income: 0, expense: 0, byMonth: {} };
  const txs = useStore.getState().data.transactions.filter(
    (t) => t.date.slice(0, 4) === year
  );
  for (const t of txs) {
    const m = t.date.slice(0, 7);
    const month = stats.byMonth[m] ?? { income: 0, expense: 0 };
    if (t.type === "income") {
      stats.income += t.amount;
      month.income += t.amount;
    } else {
      stats.expense += t.amount;
      month.expense += t.amount;
    }
    stats.byMonth[m] = month;
  }
  return stats;
}

/**
 * 获取某月剩余预算（总预算 - 当月支出）
 */
export function getRemainingBudget(month: string): {
  budget?: number;
  spent: number;
  remaining: number;
} {
  const budget = getBudget(month);
  const stats = getMonthlyStats(month);
  const spent = stats.expense;
  if (!budget?.total) {
    return { spent, remaining: spent };
  }
  return {
    budget: budget.total,
    spent,
    remaining: Math.round((budget.total - spent) * 100) / 100,
  };
}

export function getMonthlyStats(month: string): MonthlyStats {
  const txs = useStore.getState().data.transactions.filter(
    (t) => t.date.slice(0, 7) === month
  );
  const stats: MonthlyStats = {
    month,
    income: 0,
    expense: 0,
    net: 0,
    byCategory: {},
  };
  for (const t of txs) {
    if (t.type === "income") {
      stats.income += t.amount;
    } else {
      stats.expense += t.amount;
      stats.byCategory[t.category] =
        (stats.byCategory[t.category] ?? 0) + t.amount;
    }
  }
  stats.net = stats.income - stats.expense;
  return stats;
}

/**
 * 判断预算是否超支
 */
export function isOverBudget(month: string): {
  over: boolean;
  total?: number;
  expense: number;
} {
  const budget = getBudget(month);
  const stats = getMonthlyStats(month);
  if (!budget?.total) {
    return { over: false, expense: stats.expense };
  }
  return {
    over: stats.expense > budget.total,
    total: budget.total,
    expense: stats.expense,
  };
}
