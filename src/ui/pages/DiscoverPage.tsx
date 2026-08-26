import { Routes, Route, Link, useLocation } from "react-router-dom";
import { BookOpen, Flower2, ChevronRight } from "lucide-react";
import { QuotesPage } from "./QuotesPage";
import { FlowersPage } from "./FlowersPage";

const ENTRIES = [
  { to: "quotes", label: "每日语录", desc: "一句温暖的话", icon: BookOpen },
  { to: "flowers", label: "每日花语", desc: "一花一世界", icon: Flower2 },
];

export function DiscoverPage() {
  const location = useLocation();
  const isRoot = location.pathname === "/discover";
  if (!isRoot) {
    return (
      <Routes>
        <Route path="quotes" element={<QuotesPage />} />
        <Route path="flowers" element={<FlowersPage />} />
      </Routes>
    );
  }
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">发现</h1>
      <ul className="space-y-2">
        {ENTRIES.map((e) => {
          const Icon = e.icon;
          return (
            <li key={e.to}>
              <Link to={e.to} className="flex items-center gap-3 rounded-warm bg-white/70 p-3 hover:bg-cream-100">
                <div className="flex h-10 w-10 items-center justify-center rounded-warm bg-cream-100">
                  <Icon size={20} className="text-cream-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-cream-900">{e.label}</p>
                  <p className="text-xs text-cream-500">{e.desc}</p>
                </div>
                <ChevronRight size={18} className="text-cream-400" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
