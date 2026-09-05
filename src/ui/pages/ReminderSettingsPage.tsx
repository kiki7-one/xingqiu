import { useState } from "react";
import { useStore } from "../../core/store/useStore";
import { mutateField } from "../../core/store/useStore";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { BackButton } from "../components/BackButton";

export function ReminderSettingsPage() {
  const settings = useStore((s) => s.data.settings.reminders);
  const [msg, setMsg] = useState("");

  const toggleGlobal = async () => {
    await mutateField("settings", (s) => ({
      ...s,
      reminders: { ...s.reminders, globalEnabled: !s.reminders.globalEnabled },
    }));
  };

  const toggleQuiet = async () => {
    await mutateField("settings", (s) => ({
      ...s,
      reminders: {
        ...s.reminders,
        quietHours: { ...s.reminders.quietHours, enabled: !s.reminders.quietHours.enabled },
      },
    }));
  };

  const setQuietTime = async (field: "start" | "end", value: string) => {
    await mutateField("settings", (s) => ({
      ...s,
      reminders: {
        ...s.reminders,
        quietHours: { ...s.reminders.quietHours, [field]: value },
      },
    }));
  };

  const setDedup = async (hours: number) => {
    await mutateField("settings", (s) => ({
      ...s,
      reminders: { ...s.reminders, deduplicationHours: hours },
    }));
  };

  const toggleType = async (type: string) => {
    const perType = { ...settings.perType };
    perType[type as keyof typeof perType] = perType[type as keyof typeof perType] === false ? undefined : false;
    await mutateField("settings", (s) => ({
      ...s,
      reminders: { ...s.reminders, perType },
    }));
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <BackButton to="/me" />
        <h1 className="text-2xl font-bold text-cream-900">提醒设置</h1>
      </div>
      <div className="space-y-4">
        <div className="rounded-warm bg-white/70 p-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-cream-800">全局提醒</span>
            <input type="checkbox" checked={settings.globalEnabled} onChange={toggleGlobal} />
          </label>
        </div>

        <div className="rounded-warm bg-white/70 p-4">
          <label className="flex items-center justify-between">
            <span className="text-sm text-cream-800">免打扰时段</span>
            <input type="checkbox" checked={settings.quietHours.enabled} onChange={toggleQuiet} />
          </label>
          {settings.quietHours.enabled && (
            <div className="mt-3 flex gap-2">
              <Input label="开始" type="time" value={settings.quietHours.start} onChange={(e) => setQuietTime("start", e.target.value)} />
              <Input label="结束" type="time" value={settings.quietHours.end} onChange={(e) => setQuietTime("end", e.target.value)} />
            </div>
          )}
        </div>

        <div className="rounded-warm bg-white/70 p-4">
          <Input label="去重小时数" type="number" min="1" max="168" value={settings.deduplicationHours} onChange={(e) => setDedup(Number(e.target.value))} />
        </div>

        <div className="rounded-warm bg-white/70 p-4">
          <h2 className="mb-2 text-sm font-medium text-cream-800">各类提醒开关</h2>
          <div className="space-y-2">
            {["restock", "vaccine", "deworming", "food_low", "todo"].map((t) => (
              <label key={t} className="flex items-center justify-between text-sm text-cream-800">
                <span>{t}</span>
                <input
                  type="checkbox"
                  checked={settings.perType[t as keyof typeof settings.perType] !== false}
                  onChange={() => toggleType(t)}
                />
              </label>
            ))}
          </div>
        </div>
      </div>
      {msg && <p className="mt-2 text-xs text-sage-600">{msg}</p>}
    </div>
  );
}
