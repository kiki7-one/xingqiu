import { Routes, Route, Link, useLocation } from "react-router-dom";
import { CalendarCheck, ChevronRight } from "lucide-react";
import { TodosPage } from "./TodosPage";

const PLAN_ENTRIES = [
  { to: "todos", label: "待办", desc: "每日任务与重复提醒" },
];

export function PlanPage() {
  const location = useLocation();
  const isRoot = location.pathname === "/plan";

  if (!isRoot) {
    return (
      <Routes>
        <Route path="todos" element={<TodosPage />} />
      </Routes>
    );
  }

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">计划</h1>
      <ul className="space-y-2">
        {PLAN_ENTRIES.map((entry) => (
          <li key={entry.to}>
            <Link
              to={entry.to}
              className="flex items-center gap-3 rounded-warm bg-white/70 p-3 transition-colors hover:bg-cream-100"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-warm bg-cream-100">
                <CalendarCheck size={20} className="text-cream-600" />
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
        ))}
      </ul>
    </div>
  );
}
