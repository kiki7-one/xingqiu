import { useState, useEffect } from "react";
import { Plus, Check, Trash2, History } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  addTodo,
  completeTodo,
  deleteTodo,
  getTodosByDate,
  getAllCompletedTodos,
} from "../../core/store/todos";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import type { Todo, TodoPriority, RepeatRule } from "../../core/types";

const PRIORITY_OPTIONS: { value: TodoPriority; label: string }[] = [
  { value: "high", label: "高" },
  { value: "medium", label: "中" },
  { value: "low", label: "低" },
];

const PRIORITY_LABEL: Record<TodoPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

const REPEAT_OPTIONS: { value: RepeatRule; label: string }[] = [
  { value: "none", label: "不重复" },
  { value: "daily", label: "每日" },
  { value: "weekly", label: "每周" },
  { value: "monthly", label: "每月" },
];

const WEEK_CN = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];

/** YYYY-MM-DD */
function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 生成本周（周一~周日）日期数组
 */
function getWeekDates(anchor: Date = new Date()): Date[] {
  const day = anchor.getDay(); // 0=周日
  // 周一为一周起始：偏移 = (day + 6) % 7
  const mondayOffset = (day + 6) % 7;
  const monday = new Date(anchor);
  monday.setDate(anchor.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

export function TodosPage() {
  // 订阅 todos 数组引用，任何 CRUD/完成操作都会触发重渲染
  useStore((s) => s.data.todos);
  const [weekStart, setWeekStart] = useState<Date>(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [doneModalOpen, setDoneModalOpen] = useState(false);

  const weekDates = getWeekDates(weekStart);
  const selectedStr = toDateStr(selectedDate);
  const todayStr = toDateStr(new Date());

  const { pending, done } = getTodosByDate(selectedStr);

  const handleSelectDate = (d: Date) => {
    setSelectedDate(d);
  };

  const isSelected = (d: Date) => toDateStr(d) === selectedStr;
  const isToday = (d: Date) => toDateStr(d) === todayStr;

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cream-900">待办</h1>
        <Button onClick={() => setModalOpen(true)} variant="icon" aria-label="新增">
          <Plus size={16} />
        </Button>
      </div>

      {/* 周视图日历 */}
      <div className="mb-4 rounded-warm bg-white/70 p-3">
        <div className="mb-2 flex items-center justify-between">
          <button
            onClick={() => {
              const prev = new Date(weekStart);
              prev.setDate(prev.getDate() - 7);
              setWeekStart(prev);
            }}
            className="rounded p-1 text-cream-500 hover:bg-cream-100"
            aria-label="上一周"
          >
            ‹
          </button>
          <span className="text-sm font-medium text-cream-800">
            {`${toDateStr(weekDates[0]).slice(5)} ~ ${toDateStr(weekDates[6]).slice(5)}`}
          </span>
          <button
            onClick={() => {
              const next = new Date(weekStart);
              next.setDate(next.getDate() + 7);
              setWeekStart(next);
            }}
            className="rounded p-1 text-cream-500 hover:bg-cream-100"
            aria-label="下一周"
          >
            ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {weekDates.map((d) => {
            const str = toDateStr(d);
            const selected = isSelected(d);
            const today = isToday(d);
            return (
              <button
                key={str}
                onClick={() => handleSelectDate(d)}
                className={`flex flex-col items-center gap-0.5 rounded-warm py-2 text-xs transition-colors ${
                  selected
                    ? "bg-cream-500 text-white"
                    : today
                      ? "bg-cream-100 text-cream-800"
                      : "text-cream-600 hover:bg-cream-100"
                }`}
                aria-label={`选择${str}`}
                aria-current={selected ? "date" : undefined}
              >
                <span>{WEEK_CN[d.getDay()]}</span>
                <span className="text-sm font-medium">{d.getDate()}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 待办列表 */}
      {pending.length === 0 && done.length === 0 ? (
        <Empty message={`${selectedStr} 暂无待办`} hint="点击右上角新增任务" />
      ) : (
        <ul className="space-y-2">
          {pending.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-warm bg-white/70 p-3"
            >
              <button
                onClick={() => completeTodo(todo.id)}
                className="rounded-full border border-cream-300 p-1 text-cream-400 hover:bg-cream-100"
                aria-label={`完成${todo.title}`}
              >
                <Check size={16} />
              </button>
              <div className="flex-1">
                <span className="text-sm font-medium text-cream-900">
                  {todo.title}
                </span>
                <div className="mt-0.5 flex gap-2 text-xs text-cream-500">
                  <span>优先级: {PRIORITY_LABEL[todo.priority]}</span>
                  {todo.deadline && <span>截止: {todo.deadline.slice(0, 10)}</span>}
                  {todo.repeatRule !== "none" && (
                    <span>
                      重复:{" "}
                      {REPEAT_OPTIONS.find((o) => o.value === todo.repeatRule)?.label}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => {
                  if (confirm("确定删除该任务？")) deleteTodo(todo.id);
                }}
                className="text-red-400 hover:text-red-600"
                aria-label={`删除${todo.title}`}
              >
                <Trash2 size={16} />
              </button>
            </li>
          ))}

          {/* 已完成：置灰弱化 */}
          {done.map((todo) => (
            <li
              key={todo.id}
              className="flex items-center gap-3 rounded-warm bg-white/40 p-3 opacity-50"
            >
              <span className="rounded-full border border-cream-200 p-1 text-cream-400">
                <Check size={16} />
              </span>
              <div className="flex-1">
                <span className="text-sm text-cream-500 line-through">
                  {todo.title}
                </span>
                <div className="mt-0.5 flex gap-2 text-xs text-cream-400">
                  {todo.completedAt && <span>完成于: {todo.completedAt.slice(0, 10)}</span>}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* 已完成入口 */}
      <div className="mt-6 flex justify-center">
        <Button variant="ghost" onClick={() => setDoneModalOpen(true)}>
          <History size={16} className="mr-1" /> 已完成
        </Button>
      </div>

      <TodoFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
      <CompletedModal open={doneModalOpen} onClose={() => setDoneModalOpen(false)} />
    </div>
  );
}

function CompletedModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  useStore((s) => s.data.todos);
  const completed = getAllCompletedTodos();
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="已完成的待办"
      footer={
        <Button variant="ghost" onClick={onClose}>
          关闭
        </Button>
      }
    >
      {completed.length === 0 ? (
        <Empty message="还没有已完成的待办" />
      ) : (
        <ul className="space-y-2">
          {completed.map((todo) => (
            <li key={todo.id} className="rounded-warm bg-white/70 p-3">
              <p className="text-sm text-cream-500 line-through">{todo.title}</p>
              <p className="mt-0.5 text-xs text-cream-400">
                {todo.completedAt
                  ? `完成于 ${todo.completedAt.slice(0, 10)}`
                  : "已完成"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  );
}

function TodoFormModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [priority, setPriority] = useState<TodoPriority>("medium");
  const [deadline, setDeadline] = useState("");
  const [repeatRule, setRepeatRule] = useState<RepeatRule>("none");
  const [category, setCategory] = useState("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setPriority("medium");
    setDeadline("");
    setRepeatRule("none");
    setCategory("");
    setRemark("");
    setError("");
  }, [open]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("任务标题不能为空");
      return;
    }
    await addTodo({
      title: title.trim(),
      priority,
      deadline: deadline ? new Date(deadline).toISOString() : undefined,
      repeatRule,
      category: category || undefined,
      remark: remark || undefined,
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="新增待办"
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
        <Input
          label="标题"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          error={error && !title ? error : undefined}
        />
        <Select
          label="优先级"
          value={priority}
          onChange={(e) => setPriority(e.target.value as TodoPriority)}
          options={PRIORITY_OPTIONS}
        />
        <Input
          label="截止时间"
          type="datetime-local"
          value={deadline}
          onChange={(e) => setDeadline(e.target.value)}
        />
        <Select
          label="重复"
          value={repeatRule}
          onChange={(e) => setRepeatRule(e.target.value as RepeatRule)}
          options={REPEAT_OPTIONS}
        />
        <Input
          label="分类"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        />
        <Textarea
          label="备注"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
        />
      </div>
    </Modal>
  );
}
