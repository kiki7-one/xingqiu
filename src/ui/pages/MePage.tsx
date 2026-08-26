import { Routes, Route, Link, useLocation } from "react-router-dom";
import { User, Lock, Bell, Database, ChevronRight } from "lucide-react";
import { ProfilePage } from "./ProfilePage";
import { PrivacyPage } from "./PrivacyPage";
import { ReminderSettingsPage } from "./ReminderSettingsPage";
import { BackupPage } from "./BackupPage";

const ENTRIES = [
  { to: "profile", label: "个人资料", desc: "昵称、头像、性别、生日", icon: User },
  { to: "privacy", label: "隐私锁", desc: "密码保护隐私板块", icon: Lock },
  { to: "reminders", label: "提醒设置", desc: "全局开关、免打扰时段", icon: Bell },
  { to: "backup", label: "备份与恢复", desc: "导出/导入数据", icon: Database },
];

export function MePage() {
  const location = useLocation();
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
  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">我的</h1>
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
