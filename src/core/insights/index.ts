/**
 * 洞察分析核心逻辑（纯函数，可测试）
 * 周定义：周一至周日
 */
import type {
  KikiData,
  Todo,
  SleepRecord,
  MoodRecord,
  Transaction,
} from "../types";

// ============ 日期工具 ============

/** YYYY-MM-DD（本地时区） */
export function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 获取某天所在周的周一（本地） */
export function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0=周日
  const offset = (day + 6) % 7; // 周一=0
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** 周区间 [start, end) */
export function weekRange(anchor: Date): { start: Date; end: Date; startStr: string; endStr: string } {
  const start = getMonday(anchor);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return {
    start,
    end,
    startStr: toDateStr(start),
    endStr: toDateStr(end),
  };
}

/** 判断 ISO 日期字符串是否落在 [startStr, endStr) 区间 */
export function inRange(dateStr: string | undefined, startStr: string, endStr: string): boolean {
  if (!dateStr) return false;
  const d = dateStr.slice(0, 10);
  return d >= startStr && d < endStr;
}

/** 本地 ISO 日期转 YYYY-MM-DD */
function toLocalDate(iso: string): string {
  const d = new Date(iso);
  return toDateStr(d);
}

// ============ 周洞察统计 ============

export interface WeekStats {
  /** 完成任务数（本周，按 completedAt） */
  completedTodos: number;
  /** 睡眠平均（小时） */
  sleepAvg: number | null;
  /** 周消费（支出合计） */
  weeklyExpense: number;
  /** 本周记录睡眠天数 */
  sleepDays: number;
}

export interface WeekInsight {
  weekStart: string;
  weekEnd: string;
  current: WeekStats;
  previous: WeekStats;
  /** 环比变化率，null 表示无上期数据 */
  delta: {
    completedTodos: number | null;
    sleepAvg: number | null;
    weeklyExpense: number | null;
  };
}

/** 周期模式 */
export type PeriodMode = "thisWeek" | "lastWeek" | "last7days";

/** 计算某周期的 [startStr, endStr) 区间 */
function periodRange(mode: PeriodMode, now: Date): { startStr: string; endStr: string } {
  if (mode === "lastWeek") {
    const anchor = new Date(getMonday(now));
    anchor.setDate(anchor.getDate() - 7);
    return weekRange(anchor);
  }
  if (mode === "last7days") {
    const end = new Date(now);
    end.setDate(end.getDate() - 7);
    return {
      startStr: toDateStr(end),
      endStr: toDateStr(now),
    };
  }
  // thisWeek
  return weekRange(now);
}

/** 统计某区间内的完成/睡眠/消费 */
function statPeriod(data: KikiData, startStr: string, endStr: string): WeekStats {
  const completedTodos = data.todos.filter((t: Todo) =>
    inRange(t.completedAt ? toLocalDate(t.completedAt) : undefined, startStr, endStr)
  ).length;

  const sleepRecords = data.sleepRecords.filter((s: SleepRecord) =>
    inRange(s.date, startStr, endStr)
  );
  const sleepAvg =
    sleepRecords.length > 0
      ? Math.round((sleepRecords.reduce((a, s) => a + s.hours, 0) / sleepRecords.length) * 10) / 10
      : null;
  const sleepDays = sleepRecords.length;

  const weeklyExpense = Math.round(
    data.transactions
      .filter(
        (t: Transaction) =>
          t.type === "expense" && inRange(t.date, startStr, endStr)
      )
      .reduce((a, t) => a + t.amount, 0) * 100
  ) / 100;

  return { completedTodos, sleepAvg, weeklyExpense, sleepDays };
}

/** 计算上一周期的 [startStr, endStr) 区间 */
function previousPeriodRange(mode: PeriodMode, now: Date): { startStr: string; endStr: string } {
  if (mode === "last7days") {
    const end = new Date(now);
    end.setDate(end.getDate() - 14);
    const start = new Date(now);
    start.setDate(start.getDate() - 7);
    return { startStr: toDateStr(end), endStr: toDateStr(start) };
  }
  // 上周：本周区间的周一再往前推 7 天
  const anchor = new Date(getMonday(now));
  anchor.setDate(anchor.getDate() - 7);
  return weekRange(anchor);
}

/** 计算环比变化率（%），当前=上期则 0，无上期则 null */
function deltaRate(current: number, previous: number | null): number | null {
  if (previous === null || previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

/** 获取周期洞察（含环比） */
export function getWeekInsight(
  data: KikiData,
  now: Date = new Date(),
  mode: PeriodMode = "thisWeek"
): WeekInsight {
  const { startStr, endStr } = periodRange(mode, now);
  const prev = previousPeriodRange(mode, now);

  const current = statPeriod(data, startStr, endStr);
  const previous = statPeriod(data, prev.startStr, prev.endStr);

  return {
    weekStart: startStr,
    weekEnd: endStr,
    current,
    previous,
    delta: {
      completedTodos: deltaRate(current.completedTodos, previous.completedTodos),
      sleepAvg:
        current.sleepAvg !== null && previous.sleepAvg !== null
          ? deltaRate(current.sleepAvg, previous.sleepAvg)
          : null,
      weeklyExpense: deltaRate(current.weeklyExpense, previous.weeklyExpense),
    },
  };
}

// ============ 趋势（近 7 天） ============

export interface TrendPoint {
  date: string; // YYYY-MM-DD
  weekday: string;
  sleepHours: number | null;
  mood: string | null; // Mood 值
}

const WEEKDAY_CN = ["日", "一", "二", "三", "四", "五", "六"];

/** 获取近 7 天睡眠与心情趋势 */
export function getWeekTrend(data: KikiData, now: Date = new Date()): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = toDateStr(d);

    const sleep = data.sleepRecords.find((s) => s.date === dateStr);
    const mood = data.moodRecords.find((m) => m.date === dateStr);
    points.push({
      date: dateStr,
      weekday: WEEKDAY_CN[d.getDay()],
      sleepHours: sleep ? sleep.hours : null,
      mood: mood ? mood.mood : null,
    });
  }
  return points;
}

// ============ 洞察分析 ============

/** 睡眠建议时长（小时） */
export const RECOMMENDED_SLEEP = 8;

export interface SleepAnalysis {
  avgHours: number | null;
  daysRecorded: number;
  status: "good" | "insufficient" | "unknown";
  gap: number; // 与建议时长的差距（正数=不足）
  bestDay: { date: string; hours: number } | null;
}

/** 睡眠分析（本周） */
export function analyzeSleep(data: KikiData, now: Date = new Date()): SleepAnalysis {
  const { startStr, endStr } = weekRange(now);
  const records = data.sleepRecords.filter((s) => inRange(s.date, startStr, endStr));
  if (records.length === 0) {
    return { avgHours: null, daysRecorded: 0, status: "unknown", gap: 0, bestDay: null };
  }
  const avg = Math.round((records.reduce((a, s) => a + s.hours, 0) / records.length) * 10) / 10;
  const gap = Math.round((RECOMMENDED_SLEEP - avg) * 10) / 10;
  const bestDay = records.reduce((a, b) => (b.hours > a.hours ? b : a));
  return {
    avgHours: avg,
    daysRecorded: records.length,
    status: avg >= RECOMMENDED_SLEEP ? "good" : "insufficient",
    gap,
    bestDay: { date: bestDay.date, hours: bestDay.hours },
  };
}

export interface ConsumptionAnalysis {
  total: number;
  topCategory: { category: string; amount: number; percent: number } | null;
  categories: { category: string; amount: number; percent: number }[];
  /** 是否超支（有预算且支出>预算） */
  overBudget: boolean;
  budgetTotal: number | null;
}

const CATEGORY_CN: Record<string, string> = {
  food: "餐饮",
  transport: "交通",
  pet: "宠物",
  daily: "日用",
  entertainment: "娱乐",
  other: "其他",
};

/** 消费分析（本周，分类占比 + 是否超预算） */
export function analyzeConsumption(data: KikiData, now: Date = new Date()): ConsumptionAnalysis {
  const { startStr, endStr } = weekRange(now);
  const month = now.getFullYear() + "-" + String(now.getMonth() + 1).padStart(2, "0");
  const budget = data.budgets.find((b) => b.month === month);

  const expenses = data.transactions.filter(
    (t) => t.type === "expense" && inRange(t.date, startStr, endStr)
  );
  const total = Math.round(expenses.reduce((a, t) => a + t.amount, 0) * 100) / 100;

  const byCat = new Map<string, number>();
  expenses.forEach((t) => {
    byCat.set(t.category, (byCat.get(t.category) ?? 0) + t.amount);
  });

  const categories = Array.from(byCat.entries())
    .map(([cat, amount]) => ({
      category: CATEGORY_CN[cat] ?? cat,
      amount: Math.round(amount * 100) / 100,
      percent: total > 0 ? Math.round((amount / total) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  const topCategory = categories[0] ?? null;
  const budgetTotal = budget?.total ?? null;
  const overBudget = budgetTotal !== null && total > budgetTotal;

  return { total, topCategory, categories, overBudget, budgetTotal };
}

// ============ 本周建议 ============

export interface WeekAdvice {
  title: string;
  items: string[];
}

/** 生成本周正向建议（基于数据） */
export function generateAdvice(
  data: KikiData,
  now: Date = new Date()
): WeekAdvice {
  const sleep = analyzeSleep(data, now);
  const consumption = analyzeConsumption(data, now);
  const insight = getWeekInsight(data, now);
  const items: string[] = [];

  // 睡眠建议
  if (sleep.status === "insufficient") {
    items.push("本周睡眠略低于建议值，试试去公园散散步、深呼吸，给大脑充氧放松一下～");
  } else if (sleep.status === "good") {
    items.push("本周睡眠充足，状态在线！继续保持规律作息，元气满满迎接每一天 ✨");
  } else {
    items.push("记录一下睡眠时长吧，坚持每晚 8 小时，让身体满电出发 ⚡");
  }

  // 运动/户外建议（正向引导）
  items.push("周末去户外走走吧，去公园吸氧、晒晒太阳，让心情和身体一起充电 🌳");

  // 消费建议
  if (consumption.topCategory) {
    items.push(
      `本周消费主要在「${consumption.topCategory.category}」，合理规划一下，把钱花在刀刃上～`
    );
  } else {
    items.push("本周还没有支出记录，保持理性消费，也别忘了偶尔奖励自己 🎁");
  }

  // 待办完成建议
  if (insight.current.completedTodos > 0) {
    items.push(`本周已顺利完成 ${insight.current.completedTodos} 个任务，超棒的，继续加油！💪`);
  } else {
    items.push("还没开始记录任务？列个小清单，完成第一个任务会很有成就感 ✅");
  }

  return { title: "本周建议", items };
}
