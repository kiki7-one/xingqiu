import { useState, useEffect } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  addExercise,
  deleteExercise,
  getExercisesByDate,
  getExerciseMinutes,
} from "../../core/store/exercise";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { BackButton } from "../components/BackButton";
import type { ExerciseType } from "../../core/types";

const EXERCISE_OPTIONS: { value: ExerciseType; label: string }[] = [
  { value: "walk", label: "🚶 散步" },
  { value: "run", label: "🏃 跑步" },
  { value: "bike", label: "🚴 骑行" },
  { value: "swim", label: "🏊 游泳" },
  { value: "yoga", label: "🧘 瑜伽" },
  { value: "fitness", label: "🏋️ 健身" },
  { value: "badminton", label: "🏸 羽毛球" },
  { value: "basketball", label: "🏀 篮球" },
  { value: "hike", label: "⛰️ 爬山" },
  { value: "other", label: "✨ 其他" },
];

const EXERCISE_LABEL: Record<ExerciseType, string> = {
  walk: "散步",
  run: "跑步",
  bike: "骑行",
  swim: "游泳",
  yoga: "瑜伽",
  fitness: "健身",
  badminton: "羽毛球",
  basketball: "篮球",
  hike: "爬山",
  other: "其他",
};

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function SportsPage() {
  useStore((s) => s.data.exerciseRecords);
  const [date, setDate] = useState(todayStr());
  const [modalOpen, setModalOpen] = useState(false);

  const records = getExercisesByDate(date);
  const totalMinutes = getExerciseMinutes(date);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BackButton to="/record" />
          <h1 className="text-2xl font-bold text-cream-900">运动</h1>
        </div>
        <Button variant="icon" onClick={() => setModalOpen(true)} aria-label="新增">
          <Plus size={18} />
        </Button>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <Input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="w-40"
          aria-label="选择日期"
        />
        {totalMinutes > 0 && (
          <span className="text-sm text-cream-600">
            {`当日运动 ${Math.floor(totalMinutes / 60)}h${totalMinutes % 60}m`}
          </span>
        )}
      </div>

      {records.length === 0 ? (
        <Empty message="当日暂无运动记录" hint="点击右上角记录今天的运动" />
      ) : (
        <ul className="space-y-2">
          {records.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-3 rounded-warm bg-white/70 p-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-warm bg-cream-100 text-cream-600">
                {EXERCISE_OPTIONS.find((o) => o.value === r.type)?.label?.[0] ?? "🏃"}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-cream-900">
                  {EXERCISE_LABEL[r.type]}
                </p>
                <p className="text-xs text-cream-500">
                  {`${Math.floor(r.duration / 60)}h${r.duration % 60}m`}
                  {r.remark ? ` · ${r.remark}` : ""}
                </p>
              </div>
              <button
                onClick={() => deleteExercise(r.id)}
                className="text-red-400 hover:text-red-600"
                aria-label={`删除${EXERCISE_LABEL[r.type]}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}

      <AddExerciseModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        date={date}
      />
    </div>
  );
}

function AddExerciseModal({
  open,
  onClose,
  date,
}: {
  open: boolean;
  onClose: () => void;
  date: string;
}) {
  const [type, setType] = useState<ExerciseType>("walk");
  const [duration, setDuration] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setType("walk");
    setDuration("");
    setRemark("");
    setError("");
  }, [open]);

  const handleSubmit = async () => {
    const d = Number(duration);
    if (!duration || isNaN(d) || d <= 0) {
      setError("请输入有效的运动时长（分钟）");
      return;
    }
    await addExercise({
      date,
      type,
      duration: Math.round(d),
      remark: remark.trim() || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="记录运动"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit}>保存</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Select
          label="运动类型"
          value={type}
          onChange={(e) => setType(e.target.value as ExerciseType)}
          options={EXERCISE_OPTIONS}
        />
        <Input
          label="时长（分钟）"
          type="number"
          min="1"
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
          error={error ? error : undefined}
          placeholder="如 30"
        />
        <Textarea
          label="备注"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
          placeholder="可选，如：傍晚公园散步"
        />
      </div>
    </Modal>
  );
}
