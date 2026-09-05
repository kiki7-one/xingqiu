import { NavLink } from "react-router-dom";
import { clsx } from "clsx";

const tabs = [
  { to: "/", label: "首页", icon: "/ip/dimoo/nav/nav-home.png", end: true },
  { to: "/plan/todos", label: "计划", icon: "/ip/dimoo/nav/nav-plan.png", end: false },
  { to: "/record", label: "记录", icon: "/ip/dimoo/nav/nav-record.png", end: false },
  { to: "/insights", label: "洞察", icon: "/ip/dimoo/nav/nav-insights.png", end: false },
  { to: "/me", label: "我的", icon: "/ip/dimoo/nav/nav-me.png", end: false },
];

export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 overflow-y-auto">{children}</main>
      {/* 底部导航栏 · Dimoo 角色 */}
      <nav className="glass-tabbar flex items-stretch border-t px-1 pb-[env(safe-area-inset-bottom)]">
        {tabs.map((tab) => {
          return (
            <NavLink
              key={tab.to}
              to={tab.to}
              end={tab.end}
              className={({ isActive }) =>
                clsx(
                  "relative flex flex-1 flex-col items-center gap-0.5 py-1.5 transition-all duration-200",
                  isActive ? "text-cream-900" : "text-cream-500"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className={clsx(
                      "relative h-9 w-9 transition-all duration-300",
                      isActive && "scale-110 -translate-y-1"
                    )}
                  >
                    <img
                      src={tab.icon}
                      alt=""
                      className={clsx(
                        "h-full w-full object-contain transition-all duration-300",
                        isActive
                          ? "opacity-100 drop-shadow-md"
                          : "opacity-50 grayscale-[0.15]"
                      )}
                      draggable={false}
                    />
                    {isActive && (
                      <span className="absolute -bottom-1 left-1/2 h-1 w-4 -translate-x-1/2 rounded-full bg-gradient-to-r from-accent-pink/70 to-accent-lavender/70" />
                    )}
                  </div>
                  <span
                    className={clsx(
                      "text-[10px] font-medium leading-none tracking-wide",
                      isActive ? "text-cream-800" : "text-cream-500"
                    )}
                  >
                    {tab.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>
    </div>
  );
}
