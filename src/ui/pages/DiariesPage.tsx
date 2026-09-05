import { useState, useMemo } from "react";
import { Plus, BookHeart } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import { searchDiaries } from "../../core/store/diaries";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Empty } from "../components/Empty";
import { BackButton } from "../components/BackButton";
import { DiaryEditor } from "./DiaryEditor";
import type { Diary, Mood, Weather } from "../../core/types";

const MOOD_LABEL: Record<Mood, string> = {
  happy: "😊 开心",
  calm: "😌 平静",
  sad: "😢 难过",
  angry: "😠 愤怒",
  tired: "😴 疲惫",
};

const WEATHER_LABEL: Record<Weather, string> = {
  sunny: "☀️ 晴",
  cloudy: "⛅ 多云",
  rainy: "🌧️ 雨",
  snowy: "❄️ 雪",
  overcast: "☁️ 阴",
};

export function DiariesPage() {
  const diaries = useStore((s) => s.data.diaries);
  const [keyword, setKeyword] = useState("");
  const [tag, setTag] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Diary | null>(null);

  // 收集所有标签用于筛选提示
  const allTags = useMemo(() => {
    const set = new Set<string>();
    diaries.forEach((d) => {
      if (!d.isDeleted) (d.tags ?? []).forEach((t) => set.add(t));
    });
    return Array.from(set);
  }, [diaries]);

  const filtered = useMemo(() => {
    return searchDiaries({
      keyword: keyword || undefined,
      tag: tag || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  }, [diaries, keyword, tag, startDate, endDate]);

  const handleAdd = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const handleEdit = (diary: Diary) => {
    setEditing(diary);
    setEditorOpen(true);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/record" />
          <h1 className="text-2xl font-bold text-cream-900">日记</h1>
        </div>
        <Button onClick={handleAdd} variant="icon" aria-label="新增">
          <Plus size={16} />
        </Button>
      </div>

      {/* 搜索区：关键词 + 标签 + 时间区间（同一行） */}
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-warm bg-white/60 p-3">
        <Input
          placeholder="搜索关键词"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          className="w-32"
          aria-label="搜索关键词"
        />
        <Input
          placeholder="标签"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="w-24"
          list="diary-tags"
          aria-label="按标签筛选"
        />
        {allTags.length > 0 && (
          <datalist id="diary-tags">
            {allTags.map((t) => (
              <option key={t} value={t} />
            ))}
          </datalist>
        )}
        <Input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="w-36"
          aria-label="开始日期"
        />
        <span className="text-cream-400">~</span>
        <Input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="w-36"
          aria-label="结束日期"
        />
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={<BookHeart size={48} />}
          message={diaries.length === 0 ? "还没有日记" : "没有匹配的日记"}
          hint={
            diaries.length === 0
              ? "点击右上角写下第一篇日记"
              : "试试调整搜索条件"
          }
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((d) => (
            <li key={d.id} className="rounded-warm bg-white/70 p-3 shadow-sm">
              <button
                onClick={() => handleEdit(d)}
                className="block w-full text-left"
                aria-label={`编辑${d.date}的日记`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-cream-900">
                    {d.date}
                  </span>
                  <div className="flex gap-2 text-xs">
                    {d.mood && (
                      <span>{MOOD_LABEL[d.mood]}</span>
                    )}
                    {d.weather && (
                      <span>{WEATHER_LABEL[d.weather]}</span>
                    )}
                  </div>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-cream-700">
                  {d.content}
                </p>
                {d.tags && d.tags.length > 0 && (
                  <div className="mt-1 flex flex-wrap gap-1">
                    {d.tags.map((t) => (
                      <span
                        key={t}
                        className="rounded bg-cream-100 px-1.5 py-0.5 text-xs text-cream-600"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      <DiaryEditor
        open={editorOpen}
        onClose={() => setEditorOpen(false)}
        editing={editing}
      />
    </div>
  );
}
