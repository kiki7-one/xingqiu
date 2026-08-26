import { useState, useMemo } from "react";
import { PieChart as PieChartIcon, TrendingUp } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  setBudget,
  getBudget,
  getMonthlyStats,
  isOverBudget,
} from "../../core/store/transactions";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
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

export function StatsPage() {
  const [month, setMonth] = useState(todayDate().slice(0, 7));

  // 订阅 store 数据引用，确保 transactions/budgets 变化时重算
  const transactions = useStore((s) => s.data.transactions);
  const budgets = useStore((s) => s.data.budgets);

  const stats = useMemo(
    () => getMonthlyStats(month),
    [month, transactions]
  );
  const budget = useMemo(
    () => getBudget(month),
    [month, budgets]
  );
  const over = useMemo(
    () => isOverBudget(month),
    [month, transactions, budgets]
  );

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">统计</h1>

      <div className="mb-4 flex items-center gap-2">
        <Input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="w-40"
          aria-label="选择月份"
        />
      </div>

      {/* 月度概览 */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-warm bg-white/70 p-3 text-center">
          <p className="text-xs text-cream-600">收入</p>
          <p className="mt-1 text-sm font-medium text-sage-600">
            {`¥${stats.income.toFixed(2)}`}
          </p>
        </div>
        <div className="rounded-warm bg-white/70 p-3 text-center">
          <p className="text-xs text-cream-600">支出</p>
          <p className="mt-1 text-sm font-medium text-red-500">
            {`¥${stats.expense.toFixed(2)}`}
          </p>
        </div>
        <div className="rounded-warm bg-white/70 p-3 text-center">
          <p className="text-xs text-cream-600">结余</p>
          <p
            className={`mt-1 text-sm font-medium ${
              stats.net >= 0 ? "text-cream-800" : "text-red-500"
            }`}
          >
            {`¥${stats.net.toFixed(2)}`}
          </p>
        </div>
      </div>

      {/* 超支提醒 */}
      {over.over && budget?.total && (
        <div className="mb-4 rounded-warm bg-red-50 p-3 text-sm text-red-600">
          {`⚠️ 本月支出 ¥${over.expense.toFixed(2)} 已超出预算 ¥${budget.total.toFixed(2)}，超支 ¥${(over.expense - budget.total).toFixed(2)}`}
        </div>
      )}

      {/* 分类支出统计 */}
      <div className="mb-6 rounded-warm bg-white/70 p-4">
        <div className="mb-3 flex items-center gap-2">
          <PieChartIcon size={18} className="text-cream-600" />
          <h2 className="text-sm font-medium text-cream-800">分类支出</h2>
        </div>
        {Object.keys(stats.byCategory).length === 0 ? (
          <Empty message="本月暂无支出数据" />
        ) : (
          <ul className="space-y-2">
            {CATEGORY_OPTIONS.filter(
              (c) => stats.byCategory[c] != null && stats.byCategory[c]! > 0
            ).map((cat) => {
              const amount = stats.byCategory[cat]!;
              const percent =
                stats.expense > 0
                  ? Math.round((amount / stats.expense) * 100)
                  : 0;
              return (
                <li key={cat}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="text-cream-700">
                      {CATEGORY_LABEL[cat]}
                    </span>
                    <span className="text-cream-600">
                      {`¥${amount.toFixed(2)} (${percent}%)`}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-cream-100">
                    <div
                      className="h-full rounded-full bg-cream-400"
                      style={{ width: `${percent}%` }}
                      role="progressbar"
                      aria-valuenow={percent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label={`${CATEGORY_LABEL[cat]}占比`}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* 预算设置 */}
      <BudgetSetting month={month} />
    </div>
  );
}

function BudgetSetting({ month }: { month: string }) {
  const [total, setTotal] = useState("");
  const [saved, setSaved] = useState(false);
  const existing = getBudget(month);

  return (
    <div className="rounded-warm bg-white/70 p-4">
      <div className="mb-3 flex items-center gap-2">
        <TrendingUp size={18} className="text-cream-600" />
        <h2 className="text-sm font-medium text-cream-800">
          {month} 月度预算
        </h2>
      </div>

      {existing?.total != null && (
        <p className="mb-2 text-xs text-cream-600">
          当前预算：¥{existing.total.toFixed(2)}
        </p>
      )}

      <div className="flex items-end gap-2">
        <Input
          label="总预算"
          type="number"
          step="0.01"
          min="0"
          value={total}
          onChange={(e) => setTotal(e.target.value)}
          placeholder={existing?.total ? String(existing.total) : "0.00"}
          className="w-40"
        />
        <Button
          onClick={async () => {
            const num = Number(total);
            if (!total || isNaN(num) || num < 0) return;
            await setBudget({
              month,
              total: Math.round(num * 100) / 100,
              byCategory: existing?.byCategory,
            });
            setTotal("");
            setSaved(true);
            setTimeout(() => setSaved(false), 1500);
          }}
          size="md"
        >
          保存
        </Button>
      </div>
      {saved && (
        <p className="mt-2 text-xs text-sage-600">✓ 预算已保存</p>
      )}
    </div>
  );
}
