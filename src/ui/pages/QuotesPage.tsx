import { useState, useMemo, useEffect } from "react";
import { Heart, RefreshCw, Bookmark } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  favoriteQuote,
  unfavoriteQuote,
  isQuoteFavorited,
  getFavoriteQuotes,
} from "../../core/store/quotes";
import { getAllQuotes } from "../../core/content/library";
import { getQuoteOfDay, getRandomQuote } from "../../core/content/rotation";
import { Button } from "../components/Button";
import { Empty } from "../components/Empty";
import { BackButton } from "../components/BackButton";
import type { Quote } from "../../core/types";

const CATEGORY_LABEL: Record<string, string> = {
  motivational: "励志",
  healing: "治愈",
  love: "爱情",
  friendship: "友情",
};

export function QuotesPage() {
  const overrides = useStore((s) => s.data.contentOverrides.quotes);
  const allQuotes = useMemo(() => getAllQuotes(overrides), [overrides]);
  const [today, setToday] = useState<Quote | null>(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const [showFavorites, setShowFavorites] = useState(false);
  useStore((s) => s.data.quoteFavorites.length);

  useEffect(() => {
    if (refreshCount === 0) {
      setToday(getQuoteOfDay(new Date(), allQuotes));
    }
  }, [allQuotes, refreshCount]);

  const favorited = today ? isQuoteFavorited(today.id) : false;

  const handleRefresh = () => {
    if (refreshCount >= 3) return;
    const next = getRandomQuote(allQuotes, today?.id);
    if (next) {
      setToday(next);
      setRefreshCount((c) => c + 1);
    }
  };

  const handleFavorite = async () => {
    if (!today) return;
    if (favorited) {
      await unfavoriteQuote(today.id);
    } else {
      await favoriteQuote(today.id, today.text, today.category);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/insights" />
          <h1 className="text-2xl font-bold text-cream-900">每日语录</h1>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setShowFavorites(true)}>
          <Bookmark size={16} className="mr-1" /> 收藏
        </Button>
      </div>

      {today ? (
        <div className="rounded-warm bg-gradient-to-br from-cream-100 to-cream-50 p-6">
          <span className="rounded bg-cream-200 px-2 py-0.5 text-xs text-cream-700">
            {CATEGORY_LABEL[today.category] ?? today.category}
          </span>
          <p className="mt-4 text-lg leading-relaxed text-cream-900">
            {today.text}
          </p>
          <div className="mt-6 flex gap-2">
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-1 rounded-warm px-3 py-1.5 text-sm ${
                favorited
                  ? "bg-red-100 text-red-600"
                  : "bg-white/70 text-cream-700 hover:bg-cream-100"
              }`}
              aria-label={favorited ? "取消收藏" : "收藏语录"}
            >
              <Heart size={16} fill={favorited ? "currentColor" : "none"} />
              {favorited ? "已收藏" : "收藏"}
            </button>
            <button
              onClick={handleRefresh}
              disabled={refreshCount >= 3}
              className={`flex items-center gap-1 rounded-warm px-3 py-1.5 text-sm ${
                refreshCount >= 3
                  ? "cursor-not-allowed bg-cream-50 text-cream-300"
                  : "bg-white/70 text-cream-700 hover:bg-cream-100"
              }`}
              aria-label="换一条"
            >
              <RefreshCw size={16} />
              {`换一条（${refreshCount}/3）`}
            </button>
          </div>
        </div>
      ) : (
        <Empty message="暂无语录" />
      )}

      <FavoritesModal open={showFavorites} onClose={() => setShowFavorites(false)} />
    </div>
  );
}

function FavoritesModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const favorites = getFavoriteQuotes();
  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center bg-black/30 sm:items-center ${
        open ? "" : "hidden"
      }`}
      onClick={onClose}
    >
      <div
        className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-t-warm bg-cream-50 p-5 sm:rounded-warm"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-cream-900">我的收藏</h2>
          <button onClick={onClose} className="text-cream-500">
            关闭
          </button>
        </div>
        {favorites.length === 0 ? (
          <Empty message="还没有收藏语录" />
        ) : (
          <ul className="space-y-2">
            {favorites.map((f) => (
              <li key={f.id} className="rounded-warm bg-white/70 p-3">
                <p className="text-sm text-cream-800">{f.text}</p>
                {f.category && (
                  <span className="mt-1 inline-block rounded bg-cream-100 px-1.5 py-0.5 text-xs text-cream-600">
                    {CATEGORY_LABEL[f.category] ?? f.category}
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
