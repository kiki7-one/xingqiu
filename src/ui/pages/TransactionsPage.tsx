import { useState, useEffect } from "react";
import { Plus, Trash2, Wallet } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
} from "../../core/store/transactions";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { todayDate } from "../../core/utils/id";
import type {
  Transaction,
  TransactionType,
  TransactionCategory,
} from "../../core/types";

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: "expense", label: "支出" },
  { value: "income", label: "收入" },
];

const CATEGORY_OPTIONS: {
  value: TransactionCategory;
  label: string;
}[] = [
  { value: "food", label: "餐饮" },
  { value: "transport", label: "交通" },
  { value: "pet", label: "宠物" },
  { value: "daily", label: "日用" },
  { value: "entertainment", label: "娱乐" },
  { value: "other", label: "其他" },
];

const CATEGORY_LABEL: Record<TransactionCategory, string> = {
  food: "餐饮",
  transport: "交通",
  pet: "宠物",
  daily: "日用",
  entertainment: "娱乐",
  other: "其他",
};

export function TransactionsPage() {
  const transactions = useStore((s) =>
    [...s.data.transactions].sort((a, b) => b.date.localeCompare(a.date))
  );
  const [filterType, setFilterType] = useState<"" | TransactionType>("");
  const [filterCategory, setFilterCategory] = useState<
    "" | TransactionCategory
  >("");
  const [filterMonth, setFilterMonth] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = transactions.filter((t) => {
    if (filterType && t.type !== filterType) return false;
    if (filterCategory && t.category !== filterCategory) return false;
    if (filterMonth && !t.date.startsWith(filterMonth)) return false;
    return true;
  });

  // 当前筛选范围的收支合计
  const summary = filtered.reduce(
    (acc, t) => {
      if (t.type === "income") acc.income += t.amount;
      else acc.expense += t.amount;
      return acc;
    },
    { income: 0, expense: 0 }
  );
  const net = summary.income - summary.expense;

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (tx: Transaction) => {
    setEditing(tx);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定删除该记录吗？")) {
      await deleteTransaction(id);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cream-900">记账</h1>
        <Button onClick={handleAdd} size="sm">
          <Plus size={16} className="mr-1" /> 新增
        </Button>
      </div>

      {/* 收支合计 */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-warm bg-white/70 p-3 text-center">
          <p className="text-xs text-cream-600">收入</p>
          <p className="mt-1 text-sm font-medium text-sage-600">
            ¥{summary.income.toFixed(2)}
          </p>
        </div>
        <div className="rounded-warm bg-white/70 p-3 text-center">
          <p className="text-xs text-cream-600">支出</p>
          <p className="mt-1 text-sm font-medium text-red-500">
            ¥{summary.expense.toFixed(2)}
          </p>
        </div>
        <div className="rounded-warm bg-white/70 p-3 text-center">
          <p className="text-xs text-cream-600">结余</p>
          <p
            className={`mt-1 text-sm font-medium ${
              net >= 0 ? "text-cream-800" : "text-red-500"
            }`}
          >
            ¥{net.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 筛选 */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Select
          aria-label="按类型筛选"
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as "" | TransactionType)}
          options={[
            { value: "", label: "全部类型" },
            ...TYPE_OPTIONS,
          ]}
          className="w-28"
        />
        <Select
          aria-label="按分类筛选"
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(e.target.value as "" | TransactionCategory)
          }
          options={[
            { value: "", label: "全部分类" },
            ...CATEGORY_OPTIONS,
          ]}
          className="w-28"
        />
        <Input
          type="month"
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="w-36"
          aria-label="按月份筛选"
        />
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={<Wallet size={48} />}
          message="还没有记账记录"
          hint="点击右上角新增第一笔账目"
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((tx) => (
            <li
              key={tx.id}
              className="rounded-warm bg-white/70 p-3 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <button
                  onClick={() => handleEdit(tx)}
                  className="flex-1 text-left"
                  aria-label={`编辑${tx.remark || CATEGORY_LABEL[tx.category]}`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-1.5 py-0.5 text-xs ${
                        tx.type === "income"
                          ? "bg-sage-100 text-sage-700"
                          : "bg-red-100 text-red-600"
                      }`}
                    >
                      {tx.type === "income" ? "收入" : "支出"}
                    </span>
                    <span className="text-xs text-cream-600">
                      {CATEGORY_LABEL[tx.category]}
                    </span>
                    <span className="text-xs text-cream-400">{tx.date}</span>
                  </div>
                  <p
                    className={`mt-1 text-sm font-medium ${
                      tx.type === "income"
                        ? "text-sage-600"
                        : "text-cream-900"
                    }`}
                  >
                    {tx.type === "income" ? "+" : "-"}¥{tx.amount.toFixed(2)}
                  </p>
                  {tx.remark && (
                    <p className="mt-0.5 text-xs text-cream-500">{tx.remark}</p>
                  )}
                </button>
                <button
                  onClick={() => handleDelete(tx.id)}
                  className="ml-2 text-red-400 hover:text-red-600"
                  aria-label={`删除${tx.remark || CATEGORY_LABEL[tx.category]}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <TransactionFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  );
}

function TransactionFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Transaction | null;
}) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<TransactionCategory>("food");
  const [date, setDate] = useState(todayDate());
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setType(editing.type);
      setAmount(String(editing.amount));
      setCategory(editing.category);
      setDate(editing.date);
      setRemark(editing.remark ?? "");
    } else {
      setType("expense");
      setAmount("");
      setCategory("food");
      setDate(todayDate());
      setRemark("");
    }
    setError("");
  }, [open, editing]);

  const handleSubmit = async () => {
    const numAmount = Number(amount);
    if (!amount.trim() || isNaN(numAmount)) {
      setError("请输入有效金额");
      return;
    }
    if (numAmount <= 0) {
      setError("金额必须大于 0");
      return;
    }
    if (!date) {
      setError("请选择日期");
      return;
    }
    setError("");
    const payload = {
      type,
      amount: Math.round(numAmount * 100) / 100, // 保留两位小数
      category,
      date,
      remark: remark.trim() || undefined,
    };
    if (editing) {
      await updateTransaction(editing.id, payload);
    } else {
      await addTransaction(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "编辑账目" : "新增账目"}
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
          label="类型"
          value={type}
          onChange={(e) => setType(e.target.value as TransactionType)}
          options={TYPE_OPTIONS}
        />
        <Input
          label="金额"
          type="number"
          step="0.01"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          error={error ? error : undefined}
          placeholder="0.00"
        />
        <Select
          label="分类"
          value={category}
          onChange={(e) => setCategory(e.target.value as TransactionCategory)}
          options={CATEGORY_OPTIONS}
        />
        <Input
          label="日期"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <Textarea
          label="备注"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          rows={2}
          maxLength={50}
          placeholder="可选，最多 50 字"
        />
      </div>
    </Modal>
  );
}
