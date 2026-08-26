import { clsx } from "clsx";
import { type ReactNode } from "react";

interface EmptyProps {
  icon?: ReactNode;
  message: string;
  hint?: string;
  className?: string;
}

export function Empty({ icon, message, hint, className }: EmptyProps) {
  return (
    <div
      className={clsx(
        "flex flex-col items-center justify-center gap-2 py-10 text-center",
        className
      )}
    >
      {icon && <div className="text-cream-300">{icon}</div>}
      <p className="text-sm text-cream-700">{message}</p>
      {hint && <p className="text-xs text-cream-400">{hint}</p>}
    </div>
  );
}
