import { useState } from "react";
import { useStore } from "../../core/store/useStore";
import { enablePrivacyLock, disablePrivacyLock } from "../../core/store/privacy";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

export function PrivacyPage() {
  const enabled = useStore((s) => s.data.settings.privacy.enabled);
  const protectedModules = useStore((s) => s.data.settings.privacy.protectedModules);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");

  const handleEnable = async () => {
    setError("");
    setMsg("");
    if (password.length < 4) {
      setError("密码至少 4 位");
      return;
    }
    if (password !== confirm) {
      setError("两次密码不一致");
      return;
    }
    await enablePrivacyLock(password);
    setPassword("");
    setConfirm("");
    setMsg("隐私锁已开启");
    setTimeout(() => setMsg(""), 1500);
  };

  const handleDisable = async () => {
    await disablePrivacyLock();
    setMsg("隐私锁已关闭");
    setTimeout(() => setMsg(""), 1500);
  };

  const toggleModule = (m: string) => {
    // 简化：直接在 UI 层切换，实际应通过 store
    const next = protectedModules.includes(m)
      ? protectedModules.filter((x) => x !== m)
      : [...protectedModules, m];
    useStore.getState().data.settings.privacy.protectedModules = next;
    useStore.setState({ data: { ...useStore.getState().data } });
  };

  return (
    <div className="p-6">
      <h1 className="mb-4 text-2xl font-bold text-cream-900">隐私锁</h1>
      <div className="space-y-4">
        <div className="rounded-warm bg-white/70 p-4">
          <p className="mb-2 text-sm text-cream-700">
            状态：<span className={enabled ? "text-sage-600 font-medium" : "text-cream-500"}>{enabled ? "已开启" : "未开启"}</span>
          </p>
          {enabled ? (
            <Button variant="danger" onClick={handleDisable}>关闭隐私锁</Button>
          ) : (
            <div className="space-y-3">
              <Input label="设置密码" type="password" value={password} onChange={(e) => setPassword(e.target.value)} error={error ? error : undefined} />
              <Input label="确认密码" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              <Button onClick={handleEnable}>开启隐私锁</Button>
            </div>
          )}
          {msg && <p className="mt-2 text-xs text-sage-600">{msg}</p>}
        </div>

        <div className="rounded-warm bg-white/70 p-4">
          <h2 className="mb-2 text-sm font-medium text-cream-800">保护模块</h2>
          <p className="mb-2 text-xs text-cream-500">以下模块进入前需解锁</p>
          <div className="space-y-2">
            {["diary", "transaction", "pet"].map((m) => (
              <label key={m} className="flex items-center gap-2 text-sm text-cream-800">
                <input
                  type="checkbox"
                  checked={protectedModules.includes(m)}
                  onChange={() => toggleModule(m)}
                />
                {m === "diary" ? "日记" : m === "transaction" ? "记账" : "宠物"}
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
