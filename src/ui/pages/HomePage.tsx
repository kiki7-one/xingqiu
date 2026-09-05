import { useMemo, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Check, Flower2 } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import { getTodayTodos, completeTodo } from "../../core/store/todos";
import { getAllQuotes, getAllFlowers } from "../../core/content/library";
import { getQuoteOfDay } from "../../core/content/rotation";
import { setMoodForDate, getMoodByDate } from "../../core/store/mood";
import { getExerciseMinutes } from "../../core/store/exercise";
import { getSleepByDate } from "../../core/store/sleep";
import { Modal } from "../components/Modal";
import type { Mood } from "../../core/types";

/**
 * 根据当前时间返回打招呼用语
 */
function getGreeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h >= 5 && h < 12) return "早上好呀～";
  if (h >= 12 && h < 14) return "中午好呀～";
  if (h >= 14 && h < 18) return "下午好呀～";
  return "晚上好呀～";
}

/** 今日心情选项（使用图片替代 emoji） */
const MOOD_OPTIONS: { value: Mood; icon: string; label: string }[] = [
  { value: "happy", icon: "/ip/moods/mood-happy.png", label: "开心" },
  { value: "calm", icon: "/ip/moods/mood-calm.png", label: "平静" },
  { value: "tired", icon: "/ip/moods/mood-tired.png", label: "疲惫" },
  { value: "sad", icon: "/ip/moods/mood-sad.png", label: "难过" },
  { value: "angry", icon: "/ip/moods/mood-angry.png", label: "生气" },
];

/** YYYY-MM-DD（本地时区） */
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function HomePage() {
  const todos = useStore((s) => s.data.todos);
  const moodRecords = useStore((s) => s.data.moodRecords);
  useStore((s) => s.data.exerciseRecords);
  useStore((s) => s.data.sleepRecords);
  useStore((s) => s.data.transactions);
  const overridesQ = useStore((s) => s.data.contentOverrides.quotes);
  const overridesF = useStore((s) => s.data.contentOverrides.flowers);

  const todayTodos = useMemo(() => getTodayTodos(new Date()), [todos]);
  const quote = useMemo(
    () => getQuoteOfDay(new Date(), getAllQuotes(overridesQ)),
    [overridesQ]
  );
  // 首页固定展示飞燕草（用户提供的花图）
  const flower = useMemo(
    () => getAllFlowers(overridesF).find((f) => f.id === "f33") ?? null,
    [overridesF]
  );
  const greeting = useMemo(() => getGreeting(new Date()), []);

  const today = todayStr();
  const todayMood = useMemo(
    () => getMoodByDate(today),
    [moodRecords, today]
  );
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [flowerModalOpen, setFlowerModalOpen] = useState(false);

  // 今日概览：运动（时长） / 睡眠 / 消费
  const exerciseMinutes = getExerciseMinutes(today);
  const sleepToday = getSleepByDate(today);
  const todayExpense = useStore
    .getState()
    .data.transactions.filter(
      (t) => t.type === "expense" && t.date === today
    )
    .reduce((a, t) => a + t.amount, 0);

  useEffect(() => {
    setSelectedMood(todayMood ?? null);
  }, [todayMood]);

  // 拆分未完成与已完成（未完成突出展示，已完成置灰弱化）
  const pendingTodos = todayTodos.filter((t) => !t.isCompleted);

  const handleComplete = async (id: string) => {
    await completeTodo(id);
  };

  const handleSelectMood = async (mood: Mood) => {
    setSelectedMood(mood);
    await setMoodForDate(today, mood);
  };

  return (
    <div className="p-6">
      {/* 打招呼 + 每日语录 + 飞燕草（右侧背景融合） */}
      <div className="mb-5 glass-card animate-fade-in-up relative overflow-hidden">
        {/* 飞燕草作为右侧背景，融合卡片底色 */}
        <div
          className="absolute inset-y-0 right-0 w-[140px] bg-no-repeat bg-contain bg-right"
          style={{
            backgroundImage: "url(/flowers/delphinium.jpg)",
            maskImage:
              "linear-gradient(to left, rgba(0,0,0,0.85), rgba(0,0,0,0) 85%)",
            WebkitMaskImage:
              "linear-gradient(to left, rgba(0,0,0,0.85), rgba(0,0,0,0) 85%)",
          }}
        />
        {/* 前景内容 */}
        <div className="relative z-10 p-5">
          <h1 className="text-2xl font-bold tracking-tight text-[#4A3B2A]">{greeting}</h1>
          {quote && (
            <Link
              to="/insights/quotes"
              className="mt-2 block max-w-[280px]"
            >
              <p className="text-sm leading-relaxed text-[#6B5D4D] italic">
                "{quote.text}"
              </p>
            </Link>
          )}
          {flower && (
            <button
              type="button"
              onClick={() => setFlowerModalOpen(true)}
              className="mt-3 inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-full bg-cream-50/90 px-3 py-1.5 text-xs transition-all hover:bg-cream-100 hover:shadow-soft"
              aria-label="查看花语详情"
            >
              <span>🌼</span>
              <span className="font-semibold tracking-wide text-[#4A3B2A]">{flower.name}</span>
              <span className="text-[#C4B5A5]">·</span>
              <span className="tracking-wide text-[#8C7B66]">{flower.meaning}</span>
            </button>
          )}
        </div>
      </div>

      {/* 每日花语弹窗 */}
      {flower && (
        <Modal
          open={flowerModalOpen}
          onClose={() => setFlowerModalOpen(false)}
          title="每日花语"
        >
          <div className="flex flex-col items-center gap-4 py-2">
            {/* 花的图片 */}
            <div className="flex h-44 w-full items-center justify-center rounded-[16px] bg-gradient-to-br from-cream-50 to-cream-100">
              <img
                src="/flowers/delphinium.jpg"
                alt={flower.name}
                className="h-40 w-auto object-contain drop-shadow-sm"
                draggable={false}
              />
            </div>
            {/* 花的名称 */}
            <h3 className="text-xl font-bold tracking-wide text-[#4A3B2A]">
              {flower.name}
            </h3>
            {/* 花语 */}
            <div className="rounded-full bg-accent-pink/20 px-4 py-2">
              <p className="text-sm font-medium tracking-wide text-[#C47A6A]">
                {flower.meaning}
              </p>
            </div>
            {/* 养护小贴士（如有） */}
            {flower.careTips && (
              <p className="mt-1 text-center text-xs leading-relaxed text-[#9B8B7B]">
                💧 {flower.careTips}
              </p>
            )}
          </div>
        </Modal>
      )}

      {/* 今日待办 */}
      <div className="mb-4 glass-card !p-4 animate-fade-in-up" style={{ animationDelay: "0.05s" }}>
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-cream-800">
            <Check size={16} className="text-sage-500" /> 今日待办
          </h2>
          <Link to="/plan/todos" className="text-xs text-sage-500 hover:text-sage-600 transition-colors">
            全部 →
          </Link>
        </div>
        {pendingTodos.length === 0 ? (
          <p className="text-xs text-cream-500">今日没有未完成的待办 🎉</p>
        ) : (
          <ul className="space-y-1">
            {/* 仅展示未完成待办 */}
            {pendingTodos.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <button
                  onClick={() => handleComplete(t.id)}
                  className="rounded-full border border-cream-400 p-1 text-cream-500 hover:bg-cream-100 hover:text-cream-600"
                  aria-label={`完成${t.title}`}
                >
                  <Check size={12} />
                </button>
                <span className="text-sm font-medium text-cream-900">
                  {t.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* 今日概览 */}
      <div className="mb-4 glass-card !p-4 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
        <h2 className="mb-3 text-sm font-semibold text-cream-800">📋 今日概览</h2>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-warm bg-white/40 p-3 text-center transition-colors hover:bg-white/60">
            <p className="text-xs text-cream-600">运动</p>
            <p className="mt-1 text-sm font-bold text-cream-900">
              {exerciseMinutes > 0
                ? `${Math.floor(exerciseMinutes / 60)}h${exerciseMinutes % 60}m`
                : "—"}
            </p>
          </div>
          <div className="rounded-warm bg-white/40 p-3 text-center transition-colors hover:bg-white/60">
            <p className="text-xs text-cream-600">睡眠</p>
            <p className="mt-1 text-sm font-bold text-cream-900">
              {sleepToday ? `${sleepToday.hours}h` : "—"}
            </p>
          </div>
          <div className="rounded-warm bg-white/40 p-3 text-center transition-colors hover:bg-white/60">
            <p className="text-xs text-cream-600">消费</p>
            <p className="mt-1 text-sm font-bold text-cream-900">
              {todayExpense > 0 ? `¥${todayExpense.toFixed(0)}` : "—"}
            </p>
          </div>
        </div>
      </div>

      {/* 今日心情 */}
      <div className="glass-card !p-4 animate-fade-in-up" style={{ animationDelay: "0.15s" }}>
        <p className="mb-3 text-sm font-semibold text-cream-800">今天心情怎么样呀 ✨</p>
        <div className="flex justify-between">
          {MOOD_OPTIONS.map((m) => {
            const active = selectedMood === m.value;
            return (
              <button
                key={m.value}
                onClick={() => handleSelectMood(m.value)}
                className={`flex flex-col items-center gap-1 rounded-warm px-2 py-1.5 transition-all ${
                  active ? "bg-cream-100 ring-1 ring-cream-300" : "hover:bg-cream-50"
                }`}
                aria-label={`选择心情${m.label}`}
                aria-pressed={active}
              >
                <img
                  src={m.icon}
                  alt={m.label}
                  className={`h-8 w-8 object-contain transition-transform ${active ? "scale-110" : ""}`}
                  draggable={false}
                />
                <span
                  className={`text-xs ${active ? "text-cream-900 font-medium" : "text-cream-500"}`}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
