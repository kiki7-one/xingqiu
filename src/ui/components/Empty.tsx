import { clsx } from "clsx";
import { type ReactNode } from "react";

interface EmptyProps {
  icon?: ReactNode;
  message: string;
  hint?: string;
  className?: string;
}

/**
 * 空状态组件 — 支持自定义图标（可传入 Dimoo IP 图片）
 */
export function Empty({ icon, message, hint, className }: EmptyProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-3 py-12 text-center",
        className
      )}
    >
      {icon && (
        <div className="text-cream-300 animate-gentle-pulse">{icon}</div>
      )}
      <p className="text-sm font-medium text-cream-700">{message}</p>
      {hint && (
        <p className="max-w-[220px] text-xs leading-relaxed text-cream-400">
          {hint}
        </p>
      )}
    </div>
  );
}
