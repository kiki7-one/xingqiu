import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { clsx } from "clsx";

interface BackButtonProps {
  to?: string;
  className?: string;
  label?: string;
}

/**
 * 返回按钮：仅展示左箭头圆圈图标（Dimoo 风格）
 */
export function BackButton({ to, className, label = "返回" }: BackButtonProps) {
  const classes = clsx(
    "flex h-9 w-9 items-center justify-center rounded-full text-cream-600 transition-all duration-200",
    "hover:bg-cream-100/80 hover:text-cream-800 active:scale-95",
    className
  );
  if (to) {
    return (
      <Link to={to} className={classes} aria-label={label}>
        <ChevronLeft size={20} strokeWidth={2} />
      </Link>
    );
  }
  return (
    <button
      type="button"
      onClick={() => window.history.back()}
      className={classes}
      aria-label={label}
    >
      <ChevronLeft size={20} strokeWidth={2} />
    </button>
  );
}
