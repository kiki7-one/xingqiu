import { useState, useEffect } from "react";
import { Plus, Search, Package } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  addItem,
  updateItem,
  deleteItem,
  addConsumptionRecord,
} from "../../core/store/items";
import { Button } from "../components/Button";
import { Input, Textarea } from "../components/Input";
import { Select } from "../components/Select";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";
import type { Item, ItemCategory } from "../../core/types";

const CATEGORIES: { value: ItemCategory; label: string }[] = [
  { value: "daily", label: "日用" },
  { value: "food", label: "食品" },
  { value: "cleaning", label: "清洁" },
  { value: "personal_care", label: "个护" },
  { value: "pet_supplies", label: "宠物用品" },
  { value: "other", label: "其他" },
];

const CATEGORY_LABEL: Record<ItemCategory, string> = {
  daily: "日用",
  food: "食品",
  cleaning: "清洁",
  personal_care: "个护",
  pet_supplies: "宠物用品",
  other: "其他",
};

export function ItemsPage() {
  const items = useStore((s) => s.data.items.filter((i) => !i.isDeleted));
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState<"" | ItemCategory>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);

  const filtered = items.filter((it) => {
    if (search && !it.name.includes(search)) return false;
    if (filterCategory && it.category !== filterCategory) return false;
    return true;
  });

  const handleAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };

  const handleEdit = (item: Item) => {
    setEditing(item);
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm("确定删除该物品吗？")) {
      await deleteItem(id);
    }
  };

  const handleQuickConsume = async (item: Item, amount: number) => {
    await addConsumptionRecord({
      itemId: item.id,
      quantity: amount,
      recordTime: new Date().toISOString(),
    });
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cream-900">物品</h1>
        <Button onClick={handleAdd} size="sm">
          <Plus size={16} className="mr-1" /> 新增
        </Button>
      </div>

      <div className="mb-4 flex gap-2">
        <Input
          placeholder="搜索物品名称"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
        <Select
          value={filterCategory}
          onChange={(e) =>
            setFilterCategory(e.target.value as "" | ItemCategory)
          }
          options={[{ value: "", label: "全部分类" }, ...CATEGORIES]}
          className="w-32"
        />
      </div>

      {filtered.length === 0 ? (
        <Empty
          icon={<Package size={48} />}
          message="还没有物品记录"
          hint="点击右上角新增你的第一件物品"
        />
      ) : (
        <ul className="space-y-2">
          {filtered.map((item) => {
            const lowStock =
              item.threshold != null && item.stock <= item.threshold;
            return (
              <li
                key={item.id}
                className="rounded-warm bg-white/70 p-3 shadow-sm"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-cream-900">
                        {item.name}
                      </span>
                      {lowStock && (
                        <span className="rounded bg-orange-100 px-1.5 py-0.5 text-xs text-orange-600">
                          ⚠️ 需补货
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-cream-600">
                      {CATEGORY_LABEL[item.category]} · {item.stock}
                      {item.unit}
                      {item.location ? ` · ${item.location}` : ""}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleQuickConsume(item, -1)}
                      className="rounded bg-cream-100 px-2 py-1 text-sm text-cream-700 hover:bg-cream-200"
                      aria-label={`消耗${item.name}`}
                    >
                      −
                    </button>
                    <button
                      onClick={() => handleQuickConsume(item, 1)}
                      className="rounded bg-cream-100 px-2 py-1 text-sm text-cream-700 hover:bg-cream-200"
                      aria-label={`补充${item.name}`}
                    >
                      +
                    </button>
                    <button
                      onClick={() => handleEdit(item)}
                      className="rounded bg-cream-100 px-2 py-1 text-sm text-cream-700 hover:bg-cream-200"
                      aria-label={`编辑${item.name}`}
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="rounded bg-red-100 px-2 py-1 text-sm text-red-600 hover:bg-red-200"
                      aria-label={`删除${item.name}`}
                    >
                      删除
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <ItemFormModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        editing={editing}
      />
    </div>
  );
}

function ItemFormModal({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: Item | null;
}) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ItemCategory>("daily");
  const [stock, setStock] = useState(0);
  const [unit, setUnit] = useState("件");
  const [location, setLocation] = useState("");
  const [threshold, setThreshold] = useState<number | "">("");
  const [remark, setRemark] = useState("");
  const [error, setError] = useState("");

  // 当 modal 打开或 editing 改变时同步表单
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setStock(editing.stock);
      setUnit(editing.unit);
      setLocation(editing.location ?? "");
      setThreshold(editing.threshold ?? "");
      setRemark(editing.remark ?? "");
    } else {
      setName("");
      setCategory("daily");
      setStock(0);
      setUnit("件");
      setLocation("");
      setThreshold("");
      setRemark("");
    }
    setError("");
  }, [open, editing]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("物品名称不能为空");
      return;
    }
    if (stock < 0) {
      setError("库存不能小于 0");
      return;
    }
    const payload = {
      name: name.trim(),
      category,
      stock,
      unit,
      location: location || undefined,
      threshold: threshold === "" ? undefined : Number(threshold),
      remark: remark || undefined,
    };
    if (editing) {
      await updateItem(editing.id, payload);
    } else {
      await addItem(payload);
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "编辑物品" : "新增物品"}
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
          label="名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error && !name ? error : undefined}
          placeholder="如：纸巾"
        />
        <Select
          label="分类"
          value={category}
          onChange={(e) => setCategory(e.target.value as ItemCategory)}
          options={CATEGORIES}
        />
        <div className="flex gap-2">
          <Input
            label="库存数量"
            type="number"
            value={stock}
            onChange={(e) => setStock(Number(e.target.value))}
            className="flex-1"
          />
          <Input
            label="单位"
            value={unit}
            onChange={(e) => setUnit(e.target.value)}
            className="w-24"
          />
        </div>
        <Input
          label="存放位置"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="如：厨房柜子"
        />
        <Input
          label="预警阈值"
          type="number"
          value={threshold}
          onChange={(e) =>
            setThreshold(
              e.target.value === "" ? "" : Number(e.target.value)
            )
          }
          placeholder="低于此值提醒补货"
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
