import { Routes, Route, Link, useLocation } from "react-router-dom";
import {
  Package,
  Cat,
  Wallet,
  BookHeart,
  ShoppingCart,
  TrendingUp,
  ChevronRight,
} from "lucide-react";
import { ItemsPage } from "./ItemsPage";
import { PetsPage } from "./PetsPage";
import { TransactionsPage } from "./TransactionsPage";
import { StatsPage } from "./StatsPage";
import { DiariesPage } from "./DiariesPage";
import { ShoppingListPage } from "./ShoppingListPage";

const RECORD_ENTRIES = [
  { to: "items", label: "物品", desc: "管理物品档案与库存", icon: Package },
  { to: "pets", label: "宠物", desc: "宠物档案、提醒与粮食", icon: Cat },
  { to: "transactions", label: "记账", desc: "收支记录与预算统计", icon: Wallet },
  { to: "stats", label: "统计", desc: "月度预算与分类图表", icon: TrendingUp },
  { to: "diaries", label: "日记", desc: "记录每日生活", icon: BookHeart },
  { to: "shopping", label: "购物清单", desc: "补货提醒与手动添加", icon: ShoppingCart },
];

export function RecordPage() {
  const location = useLocation();
  const isRoot = location.pathname === "/record";

  if (!isRoot) {
    return (
      <Routes>
        <Route path="items" element={<ItemsPage />} />
        <Route path="pets" element={<PetsPage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="stats" element={<StatsPage />} />
        <Route path="diaries" element={<DiariesPage />} />
        <Route path="shopping" element={<ShoppingListPage />} />
      </Routes>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">记录</h1>
      <ul className="space-y-2">
        {RECORD_ENTRIES.map((entry) => {
          const Icon = entry.icon;
          return (
            <li key={entry.to}>
              <Link
                to={entry.to}
                className="flex items-center gap-3 rounded-warm bg-white/70 p-3 transition-colors hover:bg-cream-100"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-warm bg-cream-100">
                  <Icon size={20} className="text-cream-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-cream-900">
                    {entry.label}
                  </p>
                  <p className="text-xs text-cream-500">{entry.desc}</p>
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
