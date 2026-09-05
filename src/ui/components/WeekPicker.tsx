import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";
import { clsx } from "clsx";

/** YYYY-MM-DD（本地时区） */
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** 获取某天所在周的周一（周一为一周起点） */
function getMonday(date: Date): Date {
  const d = new Date(date);
  const offset = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - offset);
  d.setHours(0, 0, 0, 0);
  return d;
}

interface WeekPickerProps {
  /** 当前选中周内任意一天 */
  value: Date;
  onChange: (anchor: Date) => void;
  /** 是否禁用跳到未来周（默认允许） */
  disableFuture?: boolean;
  className?: string;
}

/**
 * 周选择器：可逐周前后切换，也可通过日历直接跳转到某一周
 * Dimoo 治愈风 — 柔和圆角 + 毛玻璃效果
 */
export function WeekPicker({ value, onChange, disableFuture = false, className }: WeekPickerProps) {
  const monday = getMonday(value);
  const sunday = new Date(monday);
  sunday.setDate(sunday.getDate() + 6);

  const handlePrev = () => {
    const next = new Date(monday);
    next.setDate(next.getDate() - 7);
    onChange(next);
  };
  const handleNext = () => {
    const next = new Date(monday);
    next.setDate(next.getDate() + 7);
    if (disableFuture && next > new Date()) return;
    onChange(next);
  };
  const handlePick = (val: string) => {
    if (!val) return;
    const [y, m, d] = val.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    onChange(date);
  };

  const today = new Date();
  today.setHours(23, 59, 59, 999);
  const isCurrentWeek = toDateStr(getMonday(today)) === toDateStr(monday);
  const canNext = !disableFuture || monday < getMonday(today);

  return (
    <div
      className={clsx(
        "glass-card !shadow-none !py-1.5 !px-2.5 inline-flex items-center gap-1",
        className
      )}
    >
      <button
        type="button"
        onClick={handlePrev}
        className="flex h-7 w-7 items-center justify-center rounded-full text-cream-500 transition-colors hover:bg-cream-100 hover:text-cream-700 active:scale-95"
        aria-label="上一周"
      >
        <ChevronLeft size={16} strokeWidth={2} />
      </button>
      <label className="flex cursor-pointer items-center gap-1.5 rounded-lg px-1 py-0.5 text-xs font-medium text-cream-700">
        <Calendar size={14} className="text-cream-400" />
        <span className="whitespace-nowrap tabular-nums">
          {toDateStr(monday).slice(5)} ~ {toDateStr(sunday).slice(5)}
          {isCurrentWeek ? " · 本周" : ""}
        </span>
        <input
          type="date"
          value={toDateStr(value)}
          onChange={(e) => handlePick(e.target.value)}
          className="absolute h-0 w-0 opacity-0"
          aria-label="选择一周"
        />
      </label>
      <button
        type="button"
        onClick={handleNext}
        disabled={!canNext}
        className="flex h-7 w-7 items-center justify-center rounded-full text-cream-500 transition-colors hover:bg-cream-100 hover:text-cream-700 disabled:opacity-30 active:scale-95"
        aria-label="下一周"
      >
        <ChevronRight size={16} strokeWidth={2} />
      </button>
    </div>
  );
}
