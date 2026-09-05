import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, Trash2, Wallet, FileText, BarChart3, Target, Settings } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  addTransaction,
  updateTransaction,
  deleteTransaction,
  getRemainingBudget,
  setBudget,
  getBudget,
} from "../../core/store/transactions";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import { BackButton } from "../components/BackButton";
import { SearchInput } from "../components/SearchInput";
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
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<"" | TransactionType>("");
  const [filterCategory, setFilterCategory] = useState<
    "" | TransactionCategory
  >("");
  const [filterMonth, setFilterMonth] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);

  const filtered = transactions.filter((t) => {
    if (search && !(t.remark ?? "").includes(search)) return false;
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

  // 当前月剩余预算
  const currentMonth = todayDate().slice(0, 7);
  const remaining = getRemainingBudget(currentMonth);

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
        <div className="flex items-center gap-2">
          <BackButton to="/record" />
          <h1 className="text-2xl font-bold text-cream-900">记账</h1>
        </div>
        <Button onClick={handleAdd} variant="icon" aria-label="新增">
          <Plus size={16} />
        </Button>
      </div>

      {/* 账单 / 支出 / 本月预算（同一行） */}
      <div className="mb-4 grid grid-cols-3 gap-2">
        <Link
          to="/record/transactions/bill"
          className="glass-card group flex flex-col items-center justify-center gap-1 p-3 transition-all hover:shadow-soft hover:-translate-y-px"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-rose-50">
            <FileText size={17} className="text-[#C47A6A]" />
          </div>
          <p className="text-xs font-semibold text-[#4A3B2A]">账单</p>
        </Link>
        <Link
          to="/record/transactions/expense"
          className="glass-card group flex flex-col items-center justify-center gap-1 p-3 transition-all hover:shadow-soft hover:-translate-y-px"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-blue-50">
            <BarChart3 size={17} className="text-[#5A7890]" />
          </div>
          <p className="text-xs font-semibold text-[#4A3B2A]">支出</p>
        </Link>
        <BudgetCard
          budget={remaining.budget}
          spent={remaining.spent}
          remaining={remaining.remaining}
        />
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
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <SearchInput
          placeholder="搜索备注"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-36"
          aria-label="搜索备注"
        />
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

function BudgetCard({
  budget,
  spent,
  remaining,
}: {
  budget?: number;
  spent: number;
  remaining: number;
}) {
  const [open, setOpen] = useState(false);
  const [total, setTotal] = useState("");
  const [saved, setSaved] = useState(false);
  const month = todayDate().slice(0, 7);
  const existing = getBudget(month);

  const handleSave = async () => {
    const num = Number(total);
    if (!total || isNaN(num) || num < 0) return;
    await setBudget({
      month,
      total: Math.round(num * 100) / 100,
      byCategory: existing?.byCategory,
    });
    setTotal("");
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
    setOpen(false);
  };

  return (
    <div className="glass-card relative flex flex-col items-center justify-center gap-1 p-3">
      <div className="flex items-center gap-1">
        <Target size={14} className="text-[#5A7890]" />
        <p className="text-xs font-semibold text-[#4A3B2A]">本月预算</p>
        {/* 设置预算按钮 */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex h-5 w-5 items-center justify-center rounded-full text-[#9B8B7B] transition-colors hover:bg-cream-100 hover:text-[#5A7890]"
          aria-label="设置月预算"
        >
          <Settings size={12} />
        </button>
      </div>
      {/* 剩余金额：已设置显示具体金额，未设置显示短横杠 */}
      <p
        className={`text-sm font-bold ${
          budget
            ? remaining >= 0
              ? "text-sage-600"
              : "text-[#E07A6A]"
            : "text-[#C4B5A5]"
        }`}
      >
        {budget ? `¥${Math.abs(remaining).toFixed(2)}` : "—"}
      </p>
      <p className="text-[10px] text-[#9B8B7B]">
        {budget ? (remaining >= 0 ? "剩余" : "超支") : "未设置"}
      </p>

      {/* 编辑预算输入（弹层） */}
      {open && (
        <div className="absolute left-1/2 top-full z-20 mt-2 w-56 -translate-x-1/2 glass-modal !rounded-[14px] p-3">
          <p className="mb-2 text-xs font-medium text-[#4A3B2A]">
            设置本月预算
          </p>
          <div className="flex items-end gap-2">
            <Input
              label="总预算"
              type="number"
              step="0.01"
              min="0"
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              placeholder={existing?.total ? String(existing.total) : "0.00"}
              className="w-28"
            />
            <Button size="sm" onClick={handleSave}>
              保存
            </Button>
          </div>
          {saved && <p className="mt-1 text-xs text-sage-600">✓ 已保存</p>}
        </div>
      )}
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
