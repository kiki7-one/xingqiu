import { useState } from "react";
import { useStore } from "../../core/store/useStore";
import { getDB } from "../../core/db";
import { createInitialData } from "../../core/db/initialData";
import { Button } from "../components/Button";
import { BackButton } from "../components/BackButton";

export function BackupPage() {
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const data = useStore((s) => s.data);

  const handleBackup = async () => {
    setError("");
    try {
      const json = JSON.stringify(data, null, 2);
      const blob = new Blob([json], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kiki-backup-${new Date().toISOString().slice(0, 10)}.kikibak`;
      a.click();
      URL.revokeObjectURL(url);
      setMsg("备份已下载");
      setTimeout(() => setMsg(""), 2000);
    } catch (e) {
      setError("备份失败");
    }
  };

  const handleRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setError("");
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!confirm("恢复将覆盖当前数据，确定继续？")) return;
      await getDB().import(parsed);
      await useStore.getState().load();
      setMsg("恢复成功");
      setTimeout(() => setMsg(""), 2000);
    } catch (err) {
      setError("文件格式错误，恢复失败");
    }
    e.target.value = "";
  };

  const handleClear = async () => {
    setError("");
    if (!window.confirm("确定清空全部数据吗？此操作不可恢复。")) return;
    try {
      await useStore.getState().replace(createInitialData());
      setMsg("数据已清空");
      setTimeout(() => window.location.reload(), 800);
    } catch (err) {
      setError("清空失败");
    }
  };

  return (
    <div className="p-6">
      <div className="mb-4 flex items-center gap-2">
        <BackButton to="/me" />
        <h1 className="text-2xl font-bold text-cream-900">备份与恢复</h1>
      </div>
      <div className="space-y-4">
        <div className="rounded-warm bg-white/70 p-4">
          <h2 className="mb-2 text-sm font-medium text-cream-800">立即备份</h2>
          <p className="mb-3 text-xs text-cream-500">导出全部数据为 .kikibak 文件</p>
          <Button onClick={handleBackup}>立即备份</Button>
        </div>

        <div className="rounded-warm bg-white/70 p-4">
          <h2 className="mb-2 text-sm font-medium text-cream-800">恢复数据</h2>
          <p className="mb-3 text-xs text-cream-500">选择 .kikibak 文件恢复（恢复前自动备份当前数据）</p>
          <input
            type="file"
            accept=".kikibak,.json"
            onChange={handleRestore}
            className="text-sm text-cream-700"
            aria-label="选择备份文件"
          />
        </div>

        <div className="rounded-warm bg-white/70 p-4">
          <h2 className="mb-2 text-sm font-medium text-cream-800">清空数据</h2>
          <p className="mb-3 text-xs text-cream-500">清空全部记录（待办、记账、日记等），恢复为初始空白状态</p>
          <Button variant="secondary" onClick={handleClear}>
            清空数据
          </Button>
        </div>

        <div className="rounded-warm bg-white/70 p-4">
          <h2 className="mb-2 text-sm font-medium text-cream-800">自动备份</h2>
          <p className="text-xs text-cream-500">
            当前设置：{data.settings.autoBackup.enabled ? "已开启" : "已关闭"}，频率：{data.settings.autoBackup.frequency}
          </p>
        </div>

        {msg && <p className="text-sm text-sage-600">{msg}</p>}
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    </div>
  );
}
