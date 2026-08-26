import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Check, BookOpen, Flower2 } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import { getTodayTodos, completeTodo } from "../../core/store/todos";
import { getAllQuotes, getAllFlowers } from "../../core/content/library";
import { getQuoteOfDay, getFlowerOfDay } from "../../core/content/rotation";

export function HomePage() {
  const todos = useStore((s) => s.data.todos);
  const overridesQ = useStore((s) => s.data.contentOverrides.quotes);
  const overridesF = useStore((s) => s.data.contentOverrides.flowers);

  const todayTodos = useMemo(() => getTodayTodos(new Date()), [todos]);
  const quote = useMemo(
    () => getQuoteOfDay(new Date(), getAllQuotes(overridesQ)),
    [overridesQ]
  );
  const flower = useMemo(
    () => getFlowerOfDay(new Date(), getAllFlowers(overridesF)),
    [overridesF]
  );

  const handleComplete = async (id: string) => {
    await completeTodo(id);
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">今日概览</h1>

      <div className="mb-4 rounded-warm bg-white/70 p-4">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="flex items-center gap-1 text-sm font-medium text-cream-800">
            <Check size={16} className="text-cream-600" /> 今日待办
          </h2>
          <Link to="/plan/todos" className="text-xs text-cream-600 underline">
            全部
          </Link>
        </div>
        {todayTodos.length === 0 ? (
          <p className="text-xs text-cream-500">今日暂无待办</p>
        ) : (
          <ul className="space-y-1">
            {todayTodos.slice(0, 5).map((t) => (
              <li key={t.id} className="flex items-center gap-2">
                <button
                  onClick={() => handleComplete(t.id)}
                  className="rounded-full border border-cream-300 p-1 text-cream-400 hover:bg-cream-100"
                  aria-label={`完成${t.title}`}
                >
                  <Check size={12} />
                </button>
                <span className="text-sm text-cream-900">{t.title}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {quote && (
        <Link
          to="/discover/quotes"
          className="mb-4 block rounded-warm bg-gradient-to-br from-cream-100 to-cream-50 p-4"
        >
          <div className="mb-1 flex items-center gap-1 text-xs text-cream-600">
            <BookOpen size={14} /> 每日语录
          </div>
          <p className="text-sm leading-relaxed text-cream-900">{quote.text}</p>
        </Link>
      )}

      {flower && (
        <Link
          to="/discover/flowers"
          className="mb-4 block rounded-warm bg-gradient-to-br from-sage-50 to-cream-50 p-4"
        >
          <div className="mb-1 flex items-center gap-1 text-xs text-cream-600">
            <Flower2 size={14} /> 每日花语
          </div>
          <p className="text-sm font-medium text-cream-900">{flower.name}</p>
          <p className="mt-0.5 text-xs text-cream-600">{flower.meaning}</p>
        </Link>
      )}

      <div className="grid grid-cols-2 gap-2">
        <Link to="/record/items" className="rounded-warm bg-white/70 p-3 text-center text-sm text-cream-700 hover:bg-cream-100">
          物品
        </Link>
        <Link to="/record/pets" className="rounded-warm bg-white/70 p-3 text-center text-sm text-cream-700 hover:bg-cream-100">
          宠物
        </Link>
        <Link to="/record/transactions" className="rounded-warm bg-white/70 p-3 text-center text-sm text-cream-700 hover:bg-cream-100">
          记账
        </Link>
        <Link to="/record/diaries" className="rounded-warm bg-white/70 p-3 text-center text-sm text-cream-700 hover:bg-cream-100">
          日记
        </Link>
      </div>
    </div>
  );
}
