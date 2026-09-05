import { Routes, Route, Link, useLocation } from "react-router-dom";
import { ChevronRight, Settings } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import { ProfilePage } from "./ProfilePage";
import { PrivacyPage } from "./PrivacyPage";
import { ReminderSettingsPage } from "./ReminderSettingsPage";
import { BackupPage } from "./BackupPage";

const ENTRIES = [
  {
    to: "privacy",
    label: "隐私锁",
    desc: "密码保护隐私板块",
    icon: "/ip/dimoo/icons/icon-privacy.png",
    color: "bg-amber-50",
  },
  {
    to: "reminders",
    label: "提醒设置",
    desc: "全局开关、免打扰时段",
    icon: "/ip/dimoo/nav/nav-plan.png",
    color: "bg-sky-50",
  },
  {
    to: "backup",
    label: "备份与恢复",
    desc: "导出/导入数据",
    icon: "/ip/dimoo/icons/icon-stats.png",
    color: "bg-emerald-50",
  },
];

export function MePage() {
  const location = useLocation();
  const profile = useStore((s) => s.data.profile);
  const isRoot = location.pathname === "/me";
  if (!isRoot) {
    return (
      <Routes>
        <Route path="profile" element={<ProfilePage />} />
        <Route path="privacy" element={<PrivacyPage />} />
        <Route path="reminders" element={<ReminderSettingsPage />} />
        <Route path="backup" element={<BackupPage />} />
      </Routes>
    );
  }
  const nickname = profile.nickname || "未设置昵称";

  return (
    <div className="p-6">
      {/* 顶部用户信息卡片 */}
      <div className="mb-5 glass-card !rounded-[20px] flex items-center gap-4 p-4">
        {profile.avatar ? (
          <img
            src={profile.avatar}
            alt="头像"
            className="h-14 w-14 rounded-full object-cover ring-2 ring-white/60 shadow-soft"
          />
        ) : (
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-accent-pink/30 to-accent-lavender/30 ring-2 ring-white/60 shadow-soft">
            <img
              src="/ip/dimoo/nav/nav-me.png"
              alt=""
              className="h-12 w-12 object-contain"
              draggable={false}
            />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-base font-bold tracking-wide text-[#4A3B2A]">{nickname}</p>
          <p className="mt-0.5 text-xs tracking-wide text-[#9B8B7B]">
            {profile.gender === "female"
              ? "女生"
              : profile.gender === "male"
                ? "男生"
                : "欢迎使用 kiki 星球 ✨"}
          </p>
        </div>
        <Link
          to="profile"
          aria-label="修改个人资料"
          className="flex h-9 w-9 items-center justify-center rounded-full text-[#8C7B66] transition-colors hover:bg-white/70 hover:text-[#4A3B2A]"
        >
          <Settings size={20} strokeWidth={1.8} />
        </Link>
      </div>

      {/* 功能列表 */}
      <h2 className="section-title mb-3">
        更多功能 <span className="sparkle">✨</span>
      </h2>
      <ul className="space-y-2.5">
        {ENTRIES.map((e) => (
          <li key={e.to}>
            <Link
              to={e.to}
              className="group glass-card !rounded-[16px] flex items-center gap-3.5 p-3.5 transition-all duration-200 hover:shadow-soft hover:-translate-y-px"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] ${e.color}`}
              >
                <img
                  src={e.icon}
                  alt=""
                  className="h-9 w-9 object-contain transition-transform duration-300 group-hover:scale-110"
                  draggable={false}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold tracking-wide text-[#4A3B2A]">
                  {e.label}
                </p>
                <p className="mt-0.5 text-xs tracking-wide text-[#8C7B66]">
                  {e.desc}
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
