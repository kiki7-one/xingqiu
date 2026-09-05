import { useState } from "react";
import { Moon, Plus } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import { setSleepForDate, getAllSleepRecords } from "../../core/store/sleep";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { BackButton } from "../components/BackButton";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SleepPage() {
  useStore((s) => s.data.sleepRecords);
  const [modalOpen, setModalOpen] = useState(false);

  const records = [...getAllSleepRecords()].sort((a, b) =>
    b.date.localeCompare(a.date)
  );

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/record" />
          <h1 className="text-2xl font-bold text-cream-900">睡眠</h1>
        </div>
        <Button variant="icon" onClick={() => setModalOpen(true)} aria-label="新增">
          <Plus size={18} />
        </Button>
      </div>

      {records.length === 0 ? (
        <Empty icon={<Moon size={48} />} message="还没有睡眠记录" hint="点击右上角记录今晚的睡眠时长" />
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-warm bg-white/70 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-warm bg-cream-100 text-cream-600">
                <Moon size={20} />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cream-900">{r.date}</p>
                <p className="text-xs text-cream-500">
                  {`${r.hours}h`}
                  {r.sleepTime && r.wakeTime ? ` · ${r.sleepTime}~${r.wakeTime}` : ""}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      <SleepModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}

function SleepModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [date, setDate] = useState(todayStr());
  const [hours, setHours] = useState("8");
  const [sleepTime, setSleepTime] = useState("");
  const [wakeTime, setWakeTime] = useState("");
  const [error, setError] = useState("");

  const handleSave = async () => {
    const h = Number(hours);
    if (!hours || isNaN(h) || h <= 0 || h > 24) {
      setError("请输入 1-24 的睡眠时长");
      return;
    }
    await setSleepForDate(date, Math.round(h * 10) / 10, {
      sleepTime: sleepTime || undefined,
      wakeTime: wakeTime || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="记录睡眠"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input label="日期" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        <Input
          label="睡眠时长（小时）"
          type="number"
          step="0.5"
          min="1"
          max="24"
          value={hours}
          onChange={(e) => setHours(e.target.value)}
          error={error ? error : undefined}
          placeholder="如 8"
        />
        <div className="flex gap-2">
          <Input label="入睡时间" type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)} className="flex-1" />
          <Input label="起床时间" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} className="flex-1" />
        </div>
      </div>
    </Modal>
  );
}
