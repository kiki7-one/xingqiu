import { NavLink } from "react-router-dom";
import {
  Home,
  Notebook,
  CalendarCheck,
  Sparkles,
  User,
} from "lucide-react";
import { clsx } from "clsx";

const tabs = [
  { to: "/", label: "首页", icon: Home, end: true },
  { to: "/record", label: "记录", icon: Notebook, end: false },
  { to: "/plan", label: "计划", icon: CalendarCheck, end: false },
  { to: "/discover", label: "发现", icon: Sparkles, end: false },
  { to: "/me", label: "我的", icon: User, end: false },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>
      <nav className="flex items-stretch border-t border-cream-200 bg-cream-50/95 backdrop-blur">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs transition-colors",
                  isActive
                    ? "text-cream-900 font-medium"
                    : "text-cream-700 hover:text-cream-900"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon
                    size={22}
                    className={isActive ? "text-cream-600" : "text-cream-400"}
                  />
                  <span>{tab.label}</span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
