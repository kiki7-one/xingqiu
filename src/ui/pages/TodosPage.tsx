import { useState, useEffect } from "react";
import { Plus, Check, Trash2 } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import { addTodo, completeTodo, uncompleteTodo, deleteTodo } from "../../core/store/todos";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import type { TodoPriority, RepeatRule } from "../../core/types";

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

export function TodosPage() {
  const todos = useStore((s) =>
    s.data.todos
      .filter((t) => !t.isCompleted)
      .sort((a, b) => (a.deadline ?? "").localeCompare(b.deadline ?? ""))
  );
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cream-900">待办</h1>
        <Button onClick={() => setModalOpen(true)} size="sm">
          <Plus size={16} className="mr-1" /> 新增
        </Button>
      </div>

      {todos.length === 0 ? (
        <Empty message="暂无待办" hint="点击右上角新增任务" />
      ) : (
        <ul className="space-y-2">
          {todos.map((todo) => (
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
                <span className="text-sm text-cream-900">{todo.title}</span>
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
        </ul>
      )}

      <TodoFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
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
