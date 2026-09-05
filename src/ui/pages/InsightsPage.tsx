import { useMemo, useState } from "react";
import { useStore } from "../../core/store/useStore";
import {
  getWeekInsight,
  getWeekTrend,
  analyzeSleep,
  analyzeConsumption,
  generateAdvice,
  type TrendPoint,
} from "../../core/insights";
import { WeekPicker } from "../components/WeekPicker";

const MOOD_ICON: Record<string, string> = {
  happy: "/ip/moods/mood-happy.png",
  calm: "/ip/moods/mood-calm.png",
  sad: "/ip/moods/mood-sad.png",
  angry: "/ip/moods/mood-angry.png",
  tired: "/ip/moods/mood-tired.png",
};

function DeltaTag({ value, unit = "%" }: { value: number | null; unit?: string }) {
  if (value === null) return <p className="text-xs text-cream-400">-</p>;
  const up = value >= 0;
  const color = up ? "text-sage-600" : "text-red-500";
  const arrow = up ? "↑" : "↓";
  return (
    <p className={`text-xs ${color}`}>
      {arrow} {Math.abs(value)}
      {unit}
    </p>
  );
}

export function InsightsPage() {
  useStore((s) => s.data.todos);
  useStore((s) => s.data.sleepRecords);
  useStore((s) => s.data.moodRecords);
  useStore((s) => s.data.transactions);
  useStore((s) => s.data.budgets);

  // 当前选中周（锚点，任意日期），默认本周
  const [weekAnchor, setWeekAnchor] = useState<Date>(new Date());
  const now = weekAnchor;
  const insight = useMemo(
    () => getWeekInsight(useStore.getState().data, now),
    [now]
  );
  const trend = useMemo(() => getWeekTrend(useStore.getState().data, now), [now]);
  const sleep = useMemo(() => analyzeSleep(useStore.getState().data, now), [now]);
  const consumption = useMemo(() => analyzeConsumption(useStore.getState().data, now), [now]);
  const advice = useMemo(() => generateAdvice(useStore.getState().data, now), [now]);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-wide text-[#4A3B2A]">
        洞察 <span className="sparkle">✨</span>
      </h1>
        {/* 时间筛选：页面右上角，周历逐周选择 */}
        <WeekPicker value={weekAnchor} onChange={setWeekAnchor} />
      </div>

      {/* 周洞察 */}
      <div className="mb-4 warm rounded-warm bg-white/70 p-4">
        <div className="grid grid-cols-3 gap-2">
          <div className="warm rounded-warm bg-cream-100/50 p-3 text-center">
            <p className="text-xs text-cream-600">完成任务</p>
            <p className="mt-1 text-lg font-bold">{insight.current.completedTodos}</p>
            <DeltaTag value={insight.delta.completedTodos} />
          </div>
          <div className="warm rounded-warm bg-cream-100/50 p-3 text-center">
            <p className="text-xs text-cream-600">睡眠平均</p>
            <p className="mt-1 text-lg font-bold">
              {insight.current.sleepAvg !== null ? (
                <>{insight.current.sleepAvg}<span className="text-xs">h</span></>
              ) : (
                "—"
              )}
            </p>
            <DeltaTag value={insight.delta.sleepAvg} unit="h" />
          </div>
          <div className="warm rounded-warm bg-cream-100/50 p-3 text-center">
            <p className="text-xs text-cream-600">周消费</p>
            <p className="mt-1 text-lg font-bold">¥{insight.current.weeklyExpense.toFixed(0)}</p>
            <DeltaTag value={insight.delta.weeklyExpense} />
          </div>
        </div>
      </div>

      {/* 睡眠与心情趋势 */}
      <div className="mb-4 warm rounded-warm bg-white/70 p-4">
        <h2 className="mb-3 text-sm font-medium text-cream-800">😴 睡眠与心情趋势（近7天）</h2>
        {trend.every((t) => t.sleepHours === null && t.mood === null) ? (
          <p className="py-6 text-center text-xs text-cream-400">暂无睡眠与心情记录</p>
        ) : (
          <SleepMoodTrend data={trend} />
        )}
        <p className="mt-2 text-center text-xs text-cream-400">
          浅紫线=睡眠时长(h)，表情=当日心情
        </p>
      </div>

      {/* 洞察分析 */}
      <div className="mb-4 warm rounded-warm bg-white/70 p-4">
        <h2 className="mb-3 text-sm font-medium text-cream-800">🔍 洞察分析</h2>
        <div className="mb-3 warm rounded-warm bg-sage-50 p-3">
          <p className="text-xs text-sage-700">睡眠分析</p>
          {sleep.status === "unknown" ? (
            <p className="mt-1 text-sm text-cream-700">本周还没有睡眠记录，点击右上角「记录睡眠」开始吧 🌙</p>
          ) : sleep.status === "good" ? (
            <p className="mt-1 text-sm text-cream-700">
              本周平均 {sleep.avgHours}h，达到建议 8h，睡眠状态良好，继续保持！😊
            </p>
          ) : (
            <p className="mt-1 text-sm text-cream-700">
              本周平均 {sleep.avgHours}h，略低于建议 8h（少 {sleep.gap}h）。试试固定入睡时间，让身体满电出发 🌙
            </p>
          )}
        </div>
        <div className="warm rounded-warm bg-cream-100/50 p-3">
          <p className="text-xs text-cream-600">消费分析</p>
          {consumption.categories.length === 0 ? (
            <p className="mt-1 text-sm text-cream-700">本周暂无消费记录。</p>
          ) : (
            <>
              <p className="mt-1 text-sm text-cream-700">
                本周支出 ¥{consumption.total.toFixed(0)}，主要花在「{consumption.topCategory?.category}」
                ¥{consumption.topCategory?.amount.toFixed(0)}（{consumption.topCategory?.percent}%）
                {consumption.overBudget
                  ? `，已超预算 ¥${consumption.budgetTotal?.toFixed(0)} ⚠️`
                  : "，预算控制良好 👍"}
              </p>
              <div className="mt-2 flex h-2 overflow-hidden rounded-full">
                {consumption.categories.map((c) => (
                  <div
                    key={c.category}
                    className="h-2"
                    style={{
                      width: `${c.percent}%`,
                      background: ["#dca874", "#9fbf97", "#e9c79c", "#b87642", "#c7d9c1", "#784b31"][
                        consumption.categories.indexOf(c) % 6
                      ],
                    }}
                  />
                ))}
              </div>
              <p className="mt-1 text-[10px] text-cream-400">
                {consumption.categories.map((c) => `${c.category}${c.percent}%`).join(" · ")}
              </p>
            </>
          )}
        </div>
      </div>

      {/* 本周建议 */}
      <div className="warm rounded-warm bg-gradient-to-br from-sage-100 to-cream-100 p-4">
        <h2 className="mb-2 text-sm font-medium text-sage-800">💡 {advice.title}</h2>
        <ul className="space-y-2 text-sm text-cream-800">
          {advice.items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}

/**
 * 睡眠与心情趋势图
 * 浅紫色折线 = 睡眠时长(h)，上方表情 = 当日心情
 */
function SleepMoodTrend({ data }: { data: TrendPoint[] }) {
  const W = 340;
  const H = 150;
  const padX = 8;
  const padTop = 6;
  const padBottom = 24;

  const hasSleep = data.some((t) => t.sleepHours !== null);

  if (!hasSleep) {
    // 只有心情记录，无睡眠：仅显示表情行
    return (
      <div className="flex items-end justify-between gap-1" style={{ height: H }}>
        {data.map((t) => (
          <div key={t.date} className="flex flex-1 flex-col items-center">
            <div className="mb-1 h-6 w-6">
              {t.mood ? (
                <img
                  src={MOOD_ICON[t.mood]}
                  alt={t.mood}
                  className="h-full w-full object-contain"
                  draggable={false}
                />
              ) : null}
            </div>
            <div className="mt-1 text-[10px] text-cream-500">{t.weekday}</div>
          </div>
        ))}
      </div>
    );
  }

  const maxHours = 10;
  const minHours = Math.max(
    0,
    Math.min(...data.map((t) => (t.sleepHours === null ? 999 : t.sleepHours))) - 1
  );
  const maxV = Math.max(...data.map((t) => t.sleepHours ?? 0), 1);
  const range = Math.max(maxV - minHours, 1);

  const innerW = W - padX * 2;
  const innerH = H - padTop - padBottom;
  const step = data.length > 1 ? innerW / (data.length - 1) : 0;

  const xOf = (i: number) => padX + i * step;
  const yOf = (hours: number) =>
    padTop + innerH - ((hours - minHours) / range) * innerH;

  // 折线点（仅睡眠数据存在）
  const linePoints = data
    .map((t, i) =>
      t.sleepHours !== null ? `${xOf(i)},${yOf(t.sleepHours)}` : null
    )
    .filter((p): p is string => p !== null);

  // 面积填充
  const areaPoints =
    data.length > 0
      ? `${padX},${padTop + innerH} ${linePoints.join(" ")} ${padX + innerW},${padTop + innerH}`
      : "";

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="睡眠趋势图">
        {/* 网格线 */}
        {[0, 0.25, 0.5, 0.75, 1].map((r) => {
          const y = padTop + innerH - r * innerH;
          return (
            <line
              key={r}
              x1={padX}
              y1={y}
              x2={padX + innerW}
              y2={y}
              stroke="#F2EAF0"
              strokeWidth="1"
              strokeDasharray="3 4"
            />
          );
        })}
        {/* 浅紫色面积填充 */}
        <polygon points={areaPoints} fill="rgba(216,196,232,0.15)" stroke="none" />
        {/* 浅紫色睡眠折线 */}
        <polyline
          points={linePoints.join(" ")}
          fill="none"
          stroke="#C8B0E0"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 数据点 */}
        {data.map((t, i) =>
          t.sleepHours !== null ? (
            <circle
              key={t.date}
              cx={xOf(i)}
              cy={yOf(t.sleepHours)}
              r="3"
              fill="#C8B0E0"
              stroke="#fff"
              strokeWidth="1"
            />
          ) : null
        )}
        {/* 心情表情：放在每个拐点上方 */}
        {data.map((t, i) =>
          t.mood ? (
            <image
              key={`mood-${t.date}`}
              href={MOOD_ICON[t.mood]}
              x={xOf(i) - 10}
              y={
                t.sleepHours !== null
                  ? yOf(t.sleepHours) - 22 // 有睡眠：放在拐点上方
                  : padTop - 4 // 无睡眠：放在顶部
              }
              width="20"
              height="20"
            />
          ) : null
        )}
        {/* 星期标注 */}
        {data.map((t, i) => (
          <text
            key={`w-${t.date}`}
            x={xOf(i)}
            y={H - 6}
            textAnchor="middle"
            fontSize="10"
            fill="#C4B5A5"
          >
            {t.weekday}
          </text>
        ))}
      </svg>
    </div>
  );
}
