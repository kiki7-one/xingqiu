import { useState, useEffect } from "react";
import { Plus, ShoppingCart, Trash2, Check, ExternalLink } from "lucide-react";
import { useStore } from "../../core/store/useStore";
import {
  addShoppingItem,
  markShoppingItemPurchased,
  removeShoppingItem,
  addConsumptionRecord,
} from "../../core/store/items";
import {
  jumpToEcommerce,
  isOnline,
  ECOMMERCE_LABEL,
  type EcommercePlatform,
} from "../../core/utils/ecommerce";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { Modal } from "../components/Modal";
import { Empty } from "../components/Empty";

const PLATFORMS: EcommercePlatform[] = ["taobao", "jd", "pinduoduo"];

export function ShoppingListPage() {
  const shoppingList = useStore((s) =>
    [...s.data.shoppingList].sort((a, b) =>
      a.createdAt.localeCompare(b.createdAt)
    )
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [purchaseModal, setPurchaseModal] = useState<{
    id: string;
    name: string;
    suggestedQty?: number;
  } | null>(null);

  const pending = shoppingList.filter((s) => s.status === "pending");
  const purchased = shoppingList.filter((s) => s.status === "purchased");

  const handleAdd = () => setModalOpen(true);

  const handlePurchaseClick = (id: string, name: string, qty?: number) => {
    setPurchaseModal({ id, name, suggestedQty: qty });
  };

  const handleRemove = async (id: string) => {
    await removeShoppingItem(id);
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-cream-900">购物清单</h1>
        <Button onClick={handleAdd} size="sm">
          <Plus size={16} className="mr-1" /> 添加
        </Button>
      </div>

      {shoppingList.length === 0 ? (
        <Empty
          icon={<ShoppingCart size={48} />}
          message="购物清单是空的"
          hint="补货提醒会自动加入，也可手动添加"
        />
      ) : (
        <div className="space-y-4">
          {pending.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-cream-800">
                {`待购（${pending.length}）`}
              </h2>
              <ul className="space-y-2">
                {pending.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-warm bg-white/70 p-3"
                  >
                    <button
                      onClick={() =>
                        handlePurchaseClick(item.id, item.name, item.quantity)
                      }
                      className="rounded-full border border-cream-300 p-1 text-cream-400 hover:bg-cream-100"
                      aria-label={`标记${item.name}已购`}
                    >
                      <Check size={16} />
                    </button>
                    <div className="flex-1">
                      <span className="text-sm text-cream-900">
                        {item.name}
                      </span>
                      {item.quantity && (
                        <span className="ml-2 text-xs text-cream-500">
                          {`x${item.quantity}`}
                        </span>
                      )}
                      <span
                        className={`ml-2 rounded px-1.5 py-0.5 text-xs ${
                          item.source === "reminder"
                            ? "bg-orange-100 text-orange-600"
                            : "bg-cream-100 text-cream-600"
                        }`}
                      >
                        {item.source === "reminder" ? "补货" : "手动"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      {PLATFORMS.map((p) => {
                        const online = isOnline();
                        return (
                          <button
                            key={p}
                            onClick={() => jumpToEcommerce(p, item.name)}
                            disabled={!online}
                            className={`flex items-center gap-0.5 rounded px-1.5 py-1 text-xs ${
                              online
                                ? "bg-cream-100 text-cream-700 hover:bg-cream-200"
                                : "cursor-not-allowed bg-cream-50 text-cream-300"
                            }`}
                            title={
                              online
                                ? `去${ECOMMERCE_LABEL[p]}搜索`
                                : "需联网访问"
                            }
                            aria-label={`去${ECOMMERCE_LABEL[p]}搜索${item.name}`}
                          >
                            <ExternalLink size={12} />
                            {ECOMMERCE_LABEL[p]}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => handleRemove(item.id)}
                        className="text-red-400 hover:text-red-600"
                        aria-label={`删除${item.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {purchased.length > 0 && (
            <div>
              <h2 className="mb-2 text-sm font-medium text-cream-400">
                {`已购（${purchased.length}）`}
              </h2>
              <ul className="space-y-2">
                {purchased.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 rounded-warm bg-white/40 p-3"
                  >
                    <Check size={16} className="text-sage-500" />
                    <div className="flex-1">
                      <span className="text-sm text-cream-500 line-through">
                        {item.name}
                      </span>
                      {item.purchasedQuantity && (
                        <span className="ml-2 text-xs text-cream-400">
                          {`实购 x${item.purchasedQuantity}`}
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="text-red-300 hover:text-red-500"
                      aria-label={`删除${item.name}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <AddShoppingItemModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <PurchaseModal
        data={purchaseModal}
        onClose={() => setPurchaseModal(null)}
      />
    </div>
  );
}

function AddShoppingItemModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setQuantity("");
    setError("");
  }, [open]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError("物品名称不能为空");
      return;
    }
    await addShoppingItem({
      name: name.trim(),
      quantity: quantity ? Number(quantity) : undefined,
      source: "manual",
    });
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="添加到购物清单"
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
          label="物品名称"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={error ? error : undefined}
          placeholder="如：牛奶"
        />
        <Input
          label="数量（可选）"
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="建议购买数量"
        />
      </div>
    </Modal>
  );
}

function PurchaseModal({
  data,
  onClose,
}: {
  data: { id: string; name: string; suggestedQty?: number } | null;
  onClose: () => void;
}) {
  const [actualQty, setActualQty] = useState("");
  const [writeBack, setWriteBack] = useState(true);

  useEffect(() => {
    if (data) {
      setActualQty(data.suggestedQty ? String(data.suggestedQty) : "1");
      setWriteBack(true);
    }
  }, [data]);

  const handleConfirm = async () => {
    if (!data) return;
    const qty = Number(actualQty) || 0;
    await markShoppingItemPurchased(data.id, qty > 0 ? qty : undefined);

    // 若勾选回写库存，查找同名物品并补充库存
    if (writeBack && qty > 0) {
      const { useStore } = await import("../../core/store/useStore");
      const items = useStore.getState().data.items;
      const matched = items.find(
        (it) => !it.isDeleted && it.name === data.name
      );
      if (matched) {
        await addConsumptionRecord({
          itemId: matched.id,
          quantity: qty,
          recordTime: new Date().toISOString(),
        });
      }
    }
    onClose();
  };

  return (
    <Modal
      open={!!data}
      onClose={onClose}
      title={data ? `标记已购：${data.name}` : ""}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleConfirm}>确认</Button>
        </>
      }
    >
      <div className="space-y-3">
        <Input
          label="实际购买数量"
          type="number"
          min="0"
          value={actualQty}
          onChange={(e) => setActualQty(e.target.value)}
        />
        <label className="flex items-center gap-2 text-sm text-cream-800">
          <input
            type="checkbox"
            checked={writeBack}
            onChange={(e) => setWriteBack(e.target.checked)}
          />
          同步补充库存（若存在同名物品）
        </label>
      </div>
    </Modal>
  );
}
