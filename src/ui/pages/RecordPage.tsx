import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { ItemsPage } from "./ItemsPage";
import { PetsPage } from "./PetsPage";
import { TransactionsPage } from "./TransactionsPage";
import { DiariesPage } from "./DiariesPage";
import { SportsPage } from "./SportsPage";
import { SleepPage } from "./SleepPage";
import { BillPage } from "./BillPage";
import { ExpensePage } from "./ExpensePage";

const RECORD_ENTRIES = [
  {
    to: "items",
    label: "物品",
    desc: "管理物品档案与库存",
    icon: "/ip/dimoo/icons/icon-items.png",
    color: "bg-orange-50",
  },
  {
    to: "pets",
    label: "宠物",
    desc: "宠物档案、提醒与粮食",
    icon: "/ip/dimoo/icons/icon-pets.png",
    color: "bg-pink-50",
  },
  {
    to: "transactions",
    label: "记账",
    desc: "收支记录与预算统计",
    icon: "/ip/dimoo/icons/icon-transactions.png",
    color: "bg-yellow-50",
  },
  {
    to: "diaries",
    label: "日记",
    desc: "记录每日生活",
    icon: "/ip/dimoo/icons/icon-diary.png",
    color: "bg-purple-50",
  },
  {
    to: "sports",
    label: "运动",
    desc: "记录运动与时长",
    icon: "/ip/dimoo/icons/icon-sports.png",
    color: "bg-green-50",
  },
  {
    to: "sleep",
    label: "睡眠",
    desc: "记录睡眠时长",
    icon: "/ip/dimoo/icons/icon-sleep.png",
    color: "bg-indigo-50",
  },
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
        <Route path="transactions/bill" element={<BillPage />} />
        <Route path="transactions/expense" element={<ExpensePage />} />
        <Route path="diaries" element={<DiariesPage />} />
        <Route path="sports" element={<SportsPage />} />
        <Route path="sleep" element={<SleepPage />} />
      </Routes>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-5 text-2xl font-bold tracking-wide">
        记录 <span className="sparkle">✨</span>
      </h1>
      <ul className="space-y-2.5">
        {RECORD_ENTRIES.map((entry) => (
          <li key={entry.to}>
            <Link
              to={entry.to}
              className="group glass-card !rounded-[16px] flex items-center gap-3.5 p-3.5 transition-all duration-200 hover:shadow-soft hover:-translate-y-px"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${entry.color}`}
              >
                <img
                  src={entry.icon}
                  alt=""
                  className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
                  draggable={false}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold tracking-wide text-[#4A3B2A]">
                  {entry.label}
                </p>
                <p className="mt-0.5 text-xs tracking-wide text-[#8C7B66]">
                  {entry.desc}
                </p>
              </div>
              <ChevronRight
                size={18}
                className="shrink-0 text-[#C4B5A5] transition-transform group-hover:translate-x-0.5"
              />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
