import { useState, useMemo, useEffect } from "react";
import { Heart, ChevronLeft, ChevronRight } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  favoriteFlower,
  unfavoriteFlower,
  isFlowerFavorited,
} from "../../core/store/flowers";
import { getAllFlowers } from "../../core/content/library";
import { getFlowerOfDay } from "../../core/content/rotation";
import { Empty } from "../components/Empty";
import type { Flower } from "../../core/types";

export function FlowersPage() {
  const overrides = useStore((s) => s.data.contentOverrides.flowers);
  const allFlowers = useMemo(() => getAllFlowers(overrides), [overrides]);
  const [today, setToday] = useState<Flower | null>(null);
  const [historyIndex, setHistoryIndex] = useState(0);
  useStore((s) => s.data.flowerFavorites.length);

  useEffect(() => {
    const f = getFlowerOfDay(new Date(), allFlowers);
    setToday(f);
  }, [allFlowers]);

  const current = allFlowers[historyIndex] ?? today;
  const favorited = current ? isFlowerFavorited(current.id) : false;

  const handlePrev = () => {
    if (historyIndex > 0) setHistoryIndex(historyIndex - 1);
  };
  const handleNext = () => {
    if (historyIndex < allFlowers.length - 1) setHistoryIndex(historyIndex + 1);
  };
  const handleFavorite = async () => {
    if (!current) return;
    if (favorited) {
      await unfavoriteFlower(current.id);
    } else {
      await favoriteFlower(current.id, current.name);
    }
  };

  if (!current) {
    return (
      <div className="p-6">
        <h1 className="mb-4 text-2xl font-bold text-cream-900">每日花语</h1>
        <Empty message="暂无花语" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">每日花语</h1>
      <div className="rounded-warm bg-gradient-to-br from-sage-50 to-cream-50 p-6">
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={historyIndex === 0}
            className="rounded-full p-2 text-cream-600 hover:bg-cream-100 disabled:opacity-30"
            aria-label="上一条花语"
          >
            <ChevronLeft size={20} />
          </button>
          <h2 className="text-xl font-semibold text-cream-900">{current.name}</h2>
          <button
            onClick={handleNext}
            disabled={historyIndex >= allFlowers.length - 1}
            className="rounded-full p-2 text-cream-600 hover:bg-cream-100 disabled:opacity-30"
            aria-label="下一条花语"
          >
            <ChevronRight size={20} />
          </button>
        </div>
        {current.imageUrl && (
          <div className="mt-4 flex justify-center">
            <img src={current.imageUrl} alt={current.name} className="max-h-48 rounded-warm object-cover" />
          </div>
        )}
        <div className="mt-4">
          <p className="text-sm text-cream-600">花语</p>
          <p className="mt-1 text-base text-cream-900">{current.meaning}</p>
        </div>
        {current.careTips && (
          <div className="mt-3">
            <p className="text-sm text-cream-600">养护小贴士</p>
            <p className="mt-1 text-sm text-cream-700">{current.careTips}</p>
          </div>
        )}
        <button
          onClick={handleFavorite}
          className={`mt-4 flex items-center gap-1 rounded-warm px-3 py-1.5 text-sm ${
            favorited ? "bg-red-100 text-red-600" : "bg-white/70 text-cream-700 hover:bg-cream-100"
          }`}
          aria-label={favorited ? "取消收藏" : "收藏花语"}
        >
          <Heart size={16} fill={favorited ? "currentColor" : "none"} />
          {favorited ? "已收藏" : "收藏"}
        </button>
      </div>
    </div>
  );
}
