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
