import { useState, useMemo } from "react";
import { useStore } from "../../core/store/useStore";
import {
  getMonthlyStats,
  getYearlyStats,
} from "../../core/store/transactions";
import { BackButton } from "../components/BackButton";
import { Empty } from "../components/Empty";
import { todayDate } from "../../core/utils/id";
import type { TransactionCategory } from "../../core/types";

const CATEGORY_LABEL: Record<TransactionCategory, string> = {
  food: "餐饮",
  transport: "交通",
  pet: "宠物",
  daily: "日用",
  entertainment: "娱乐",
  other: "其他",
};

const CATEGORY_OPTIONS: TransactionCategory[] = [
  "food",
  "transport",
  "pet",
  "daily",
  "entertainment",
  "other",
];

type Mode = "month" | "year";

export function BillPage() {
  const [mode, setMode] = useState<Mode>("month");
  const [month, setMonth] = useState(todayDate().slice(0, 7));
  const [year, setYear] = useState(todayDate().slice(0, 4));

  const transactions = useStore((s) => s.data.transactions);

  const monthStats = useMemo(() => getMonthlyStats(month), [month, transactions]);
  const yearStats = useMemo(() => getYearlyStats(year), [year, transactions]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/record/transactions" />
          <h1 className="text-2xl font-bold tracking-wide text-[#4A3B2A]">
            账单 <span className="sparkle">✨</span>
          </h1>
        </div>
      </div>

      {/* 模式切换 + 时间筛选 */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1 rounded-full bg-cream-100 p-1">
          <button
            type="button"
            onClick={() => setMode("month")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "month"
                ? "bg-white text-cream-900 shadow-sm"
                : "text-cream-500 hover:text-cream-700"
            }`}
            aria-pressed={mode === "month"}
          >
            月账单
          </button>
          <button
            type="button"
            onClick={() => setMode("year")}
            className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
              mode === "year"
                ? "bg-white text-cream-900 shadow-sm"
                : "text-cream-500 hover:text-cream-700"
            }`}
            aria-pressed={mode === "year"}
          >
            年账单
          </button>
        </div>
        {mode === "month" ? (
          <input
            type="month"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className="glass-input rounded-warm px-3 py-1.5 text-sm"
            aria-label="选择月份"
          />
        ) : (
          <input
            type="number"
            value={year}
            onChange={(e) => e.target.value && setYear(e.target.value)}
            className="glass-input rounded-warm px-3 py-1.5 text-sm"
            min="2000"
            max="2100"
            aria-label="选择年份"
          />
        )}
      </div>

      {mode === "month" ? (
        <MonthBill month={month} stats={monthStats} />
      ) : (
        <YearBill year={year} stats={yearStats} />
      )}
    </div>
  );
}

function MonthBill({
  month,
  stats,
}: {
  month: string;
  stats: { income: number; expense: number; net: number; byCategory: Partial<Record<TransactionCategory, number>> };
}) {
  const hasData = stats.expense > 0 || stats.income > 0;
  if (!hasData) {
    return (
      <Empty
        message="本月暂无账单数据"
        hint="去记录几笔收支试试"
      />
    );
  }
  return (
    <div className="space-y-4">
      {/* 月度汇总 */}
      <div className="glass-card p-4">
        <p className="mb-3 text-sm font-semibold text-[#4A3B2A]">
          {month} 月账单
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-[#9B8B7B]">收入</p>
            <p className="mt-1 text-sm font-semibold text-sage-600">
              ¥{stats.income.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B8B7B]">支出</p>
            <p className="mt-1 text-sm font-semibold text-[#E07A6A]">
              ¥{stats.expense.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B8B7B]">结余</p>
            <p
              className={`mt-1 text-sm font-semibold ${
                stats.net >= 0 ? "text-[#4A3B2A]" : "text-[#E07A6A]"
              }`}
            >
              ¥{stats.net.toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      {/* 分类明细表 */}
      <div className="glass-card p-4">
        <p className="mb-3 text-sm font-semibold text-[#4A3B2A]">分类明细</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-left text-xs text-[#9B8B7B]">
              <th className="pb-2 font-medium">分类</th>
              <th className="pb-2 text-right font-medium">支出</th>
              <th className="pb-2 text-right font-medium">占比</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORY_OPTIONS.map((cat) => {
              const amount = stats.byCategory[cat] ?? 0;
              const percent =
                stats.expense > 0 ? Math.round((amount / stats.expense) * 100) : 0;
              return (
                <tr key={cat} className="border-b border-cream-100 last:border-0">
                  <td className="py-2.5 text-[#4A3B2A]">{CATEGORY_LABEL[cat]}</td>
                  <td className="py-2.5 text-right text-[#6B5D4D]">
                    {amount > 0 ? `¥${amount.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-2.5 text-right text-[#9B8B7B]">
                    {amount > 0 ? `${percent}%` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function YearBill({
  year,
  stats,
}: {
  year: string;
  stats: {
    income: number;
    expense: number;
    byMonth: Partial<Record<string, { income: number; expense: number }>>;
  };
}) {
  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, "0")}`
  );
  const hasData = stats.expense > 0 || stats.income > 0;
  if (!hasData) {
    return <Empty message={`${year} 年暂无账单数据`} />;
  }
  return (
    <div className="space-y-4">
      <div className="glass-card p-4">
        <p className="mb-3 text-sm font-semibold text-[#4A3B2A]">
          {year} 年账单
        </p>
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-[#9B8B7B]">总收入</p>
            <p className="mt-1 text-sm font-semibold text-sage-600">
              ¥{stats.income.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B8B7B]">总支出</p>
            <p className="mt-1 text-sm font-semibold text-[#E07A6A]">
              ¥{stats.expense.toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B8B7B]">结余</p>
            <p
              className={`mt-1 text-sm font-semibold ${
                stats.income - stats.expense >= 0
                  ? "text-[#4A3B2A]"
                  : "text-[#E07A6A]"
              }`}
            >
              ¥{(stats.income - stats.expense).toFixed(2)}
            </p>
          </div>
        </div>
      </div>

      <div className="glass-card p-4">
        <p className="mb-3 text-sm font-semibold text-[#4A3B2A]">每月明细</p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-cream-200 text-left text-xs text-[#9B8B7B]">
              <th className="pb-2 font-medium">月份</th>
              <th className="pb-2 text-right font-medium">收入</th>
              <th className="pb-2 text-right font-medium">支出</th>
              <th className="pb-2 text-right font-medium">结余</th>
            </tr>
          </thead>
          <tbody>
            {months.map((m) => {
              const s = stats.byMonth[m];
              const income = s?.income ?? 0;
              const expense = s?.expense ?? 0;
              const net = income - expense;
              const hasMonth = income > 0 || expense > 0;
              return (
                <tr
                  key={m}
                  className="border-b border-cream-100 last:border-0"
                >
                  <td className="py-2.5 text-[#4A3B2A]">{m}</td>
                  <td className="py-2.5 text-right text-sage-600">
                    {hasMonth ? `¥${income.toFixed(2)}` : "—"}
                  </td>
                  <td className="py-2.5 text-right text-[#E07A6A]">
                    {hasMonth ? `¥${expense.toFixed(2)}` : "—"}
                  </td>
                  <td
                    className={`py-2.5 text-right ${
                      hasMonth
                        ? net >= 0
                          ? "text-[#4A3B2A]"
                          : "text-[#E07A6A]"
                        : "text-[#C4B5A5]"
                    }`}
                  >
                    {hasMonth ? `¥${net.toFixed(2)}` : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
