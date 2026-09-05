import { useState, useMemo } from "react";
import { useStore } from "../../core/store/useStore";
import {
  getDailyExpenses,
  getCategoryRanks,
  getYearlyStats,
  getMonthlyStats,
  type DailyExpense,
  type CategoryRank,
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

const CATEGORY_COLOR: Record<TransactionCategory, string> = {
  food: "#F5B89A",
  transport: "#B8D4E8",
  pet: "#D8C8E8",
  daily: "#FCE192",
  entertainment: "#C8D8C0",
  other: "#D8D0C8",
};

type Mode = "month" | "year";

export function ExpensePage() {
  const [mode, setMode] = useState<Mode>("month");
  const [month, setMonth] = useState(todayDate().slice(0, 7));
  const [year, setYear] = useState(todayDate().slice(0, 4));

  const transactions = useStore((s) => s.data.transactions);

  const daily = useMemo(
    () => (mode === "month" ? getDailyExpenses(month) : []),
    [month, mode, transactions]
  );
  const ranks = useMemo(
    () => (mode === "month" ? getCategoryRanks(month) : []),
    [month, mode, transactions]
  );
  const monthStats = useMemo(
    () => getMonthlyStats(month),
    [month, transactions]
  );
  const yearStats = useMemo(() => getYearlyStats(year), [year, transactions]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/record/transactions" />
          <h1 className="text-2xl font-bold tracking-wide text-[#4A3B2A]">
            支出 <span className="sparkle">✨</span>
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
            按日
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
            按月
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

      {/* 汇总 */}
      <div className="mb-4 glass-card p-4">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <p className="text-xs text-[#9B8B7B]">总支出</p>
            <p className="mt-1 text-sm font-semibold text-[#E07A6A]">
              ¥
              {(
                mode === "month" ? monthStats.expense : yearStats.expense
              ).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B8B7B]">平均/天</p>
            <p className="mt-1 text-sm font-semibold text-[#6B5D4D]">
              {mode === "month"
                ? (monthStats.expense / new Date(month + "-01").getDate()).toFixed(2)
                : (yearStats.expense / 12).toFixed(2)}
            </p>
          </div>
          <div>
            <p className="text-xs text-[#9B8B7B]">总笔数</p>
            <p className="mt-1 text-sm font-semibold text-[#4A3B2A]">
              {mode === "month"
                ? daily.reduce((acc, d) => acc + countForDay(d), 0)
                : transactions.filter(
                    (t) => t.type === "expense" && t.date.startsWith(year)
                  ).length}
            </p>
          </div>
        </div>
      </div>

      {mode === "month" ? (
        <>
          <MonthlyExpense daily={daily} />
          <CategoryRanking ranks={ranks} month={month} />
        </>
      ) : (
        <YearlyExpense year={year} />
      )}
    </div>
  );
}

function countForDay(d: DailyExpense): number {
  return d.amount > 0 ? 1 : 0;
}

function MonthlyExpense({ daily }: { daily: DailyExpense[] }) {
  const hasData = daily.length > 0;
  return (
    <div className="mb-4 glass-card p-4">
      <p className="mb-3 text-sm font-semibold text-[#4A3B2A]">每日支出曲线</p>
      {!hasData ? (
        <Empty message="本月暂无支出数据" hint="去记录一笔支出吧" />
      ) : (
        <ExpenseChart data={daily} />
      )}
    </div>
  );
}

function ExpenseChart({ data }: { data: DailyExpense[] }) {
  const W = 320;
  const H = 140;
  const pad = 8;

  if (data.length === 0) return null;

  const maxAmount = Math.max(...data.map((d) => d.amount), 1);
  const maxDay = data[data.length - 1].date; // 数据已按日期排序
  const maxDayNum = Number(maxDay.slice(8, 10));

  // 构造当月每天（含 0 支出日期，用于完整展示曲线）
  const points: { date: string; amount: number }[] = [];
  for (let day = 1; day <= maxDayNum; day++) {
    const dateStr = `${maxDay.slice(0, 8)}${String(day).padStart(2, "0")}`;
    const found = data.find((d) => d.date === dateStr);
    points.push({ date: dateStr, amount: found?.amount ?? 0 });
  }

  const step = points.length > 1 ? (W - pad * 2) / (points.length - 1) : 0;
  const coord = (i: number, amount: number) => ({
    x: pad + i * step,
    y: H - pad - (amount / maxAmount) * (H - pad * 2),
  });

  const linePoints = points
    .map((p, i) => `${coord(i, p.amount).x},${coord(i, p.amount).y}`)
    .join(" ");

  const areaPoints = `${pad},${H - pad} ${linePoints} ${W - pad},${H - pad}`;

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="每日支出曲线图">
        {/* 网格线 */}
        {[0.25, 0.5, 0.75, 1].map((r) => {
          const y = H - pad - r * (H - pad * 2);
          return (
            <line
              key={r}
              x1={pad}
              y1={y}
              x2={W - pad}
              y2={y}
              stroke="#F0E8DE"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          );
        })}
        {/* 面积填充 */}
        <polygon
          points={areaPoints}
          fill="rgba(245,184,154,0.15)"
          stroke="none"
        />
        {/* 曲线 */}
        <polyline
          points={linePoints}
          fill="none"
          stroke="#F5B89A"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 数据点 */}
        {points.map((p, i) =>
          p.amount > 0 ? (
            <circle
              key={p.date}
              cx={coord(i, p.amount).x}
              cy={coord(i, p.amount).y}
              r="2.5"
              fill="#E89B7A"
            />
          ) : null
        )}
      </svg>
      {/* 横轴日期标注 */}
      <div className="mt-1 flex justify-between text-[10px] text-[#C4B5A5]">
        <span>{points[0]?.date.slice(5)}</span>
        <span>{points[Math.floor(points.length / 2)]?.date.slice(5)}</span>
        <span>{points[points.length - 1]?.date.slice(5)}</span>
      </div>
    </div>
  );
}

function CategoryRanking({
  ranks,
  month,
}: {
  ranks: CategoryRank[];
  month: string;
}) {
  if (ranks.length === 0) {
    return (
      <div className="glass-card p-4">
        <p className="mb-3 text-sm font-semibold text-[#4A3B2A]">
          分类支出排行榜
        </p>
        <Empty message="暂无支出数据" />
      </div>
    );
  }
  const total = ranks.reduce((acc, r) => acc + r.amount, 0);
  const max = ranks[0].amount;
  return (
    <div className="glass-card p-4">
      <p className="mb-3 text-sm font-semibold text-[#4A3B2A]">
        分类支出排行榜
        <span className="ml-2 text-xs font-normal text-[#9B8B7B]">
          {month}
        </span>
      </p>
      <ul className="space-y-3">
        {ranks.map((r, i) => (
          <li key={r.category}>
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <span className="inline-flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-semibold text-white" style={{ background: CATEGORY_COLOR[r.category] }}>
                  {i + 1}
                </span>
                <span className="font-medium text-[#4A3B2A]">
                  {CATEGORY_LABEL[r.category]}
                </span>
              </span>
              <span className="text-[#6B5D4D]">
                ¥{r.amount.toFixed(2)}
                <span className="ml-1 text-[#C4B5A5]">({r.percent}%)</span>
              </span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-cream-100">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(r.amount / max) * 100}%`,
                  background: CATEGORY_COLOR[r.category],
                }}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-cream-100 pt-2 text-xs text-[#9B8B7B]">
        合计支出：¥{total.toFixed(2)}
      </p>
    </div>
  );
}

function YearlyExpense({ year }: { year: string }) {
  const transactions = useStore((s) => s.data.transactions);
  const yearStats = useMemo(() => getYearlyStats(year), [year, transactions]);

  const months = Array.from({ length: 12 }, (_, i) =>
    `${year}-${String(i + 1).padStart(2, "0")}`
  );
  const data = months
    .map((m) => ({
      month: m,
      amount: yearStats.byMonth[m]?.expense ?? 0,
    }))
    .filter((d) => d.amount > 0);

  const hasData = data.length > 0;
  return (
    <div className="glass-card p-4">
      <p className="mb-3 text-sm font-semibold text-[#4A3B2A]">
        {year} 每月支出曲线
      </p>
      {!hasData ? (
        <Empty message={`${year} 年暂无支出数据`} />
      ) : (
        <>
          <MonthlyBarChart data={data} />
          <div className="mt-4 space-y-2">
            {data
              .slice()
              .sort((a, b) => b.amount - a.amount)
              .map((d, i) => (
                <div
                  key={d.month}
                  className="flex items-center justify-between rounded-lg bg-cream-50 px-3 py-2 text-xs"
                >
                  <span className="font-medium text-[#4A3B2A]">
                    {d.month}
                  </span>
                  <span className="text-[#E07A6A]">
                    ¥{d.amount.toFixed(2)}
                  </span>
                </div>
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function MonthlyBarChart({
  data,
}: {
  data: { month: string; amount: number }[];
}) {
  const W = 320;
  const H = 150;
  const pad = 8;
  if (data.length === 0) return null;
  const max = Math.max(...data.map((d) => d.amount), 1);
  const barW = (W - pad * 2) / data.length;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="每月支出柱状图">
      {[0.25, 0.5, 0.75, 1].map((r) => (
        <line
          key={r}
          x1={pad}
          y1={H - pad - r * (H - pad * 2)}
          x2={W - pad}
          y2={H - pad - r * (H - pad * 2)}
          stroke="#F0E8DE"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
      ))}
      {data.map((d, i) => {
        const h = (d.amount / max) * (H - pad * 2);
        const x = pad + i * barW + barW * 0.2;
        const y = H - pad - h;
        return (
          <rect
            key={d.month}
            x={x}
            y={y}
            width={barW * 0.6}
            height={h}
            rx="3"
            fill="rgba(245,184,154,0.85)"
          />
        );
      })}
    </svg>
  );
}
