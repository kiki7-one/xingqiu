import { clsx } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "icon";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-gradient-to-br from-cream-500 to-cream-600 text-white shadow-soft hover:shadow-glass hover:-translate-y-px active:translate-y-0",
  secondary:
    "bg-cream-100/80 text-cream-800 border border-cream-200/60 hover:bg-cream-200/70",
  ghost: "text-cream-700 hover:bg-cream-100/60",
  danger:
    "bg-gradient-to-br from-error to-[#C07080] text-white shadow-soft hover:opacity-90",
  // 圆形描边按钮：无深色填充，仅边框 + 加号图标
  icon:
    "flex items-center justify-center rounded-full border-[1.5px] border-cream-300 bg-white text-cream-600 hover:border-cream-400 hover:text-cream-700 hover:bg-cream-50 active:scale-95",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  full?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  full = false,
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={clsx(
        "transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:active:scale-100",
        variant === "icon"
          ? "h-9 w-9 rounded-full"
          : "rounded-warm",
        variantClasses[variant],
        variant !== "icon" && size === "sm" && "px-3 py-1.5 text-xs",
        variant !== "icon" && size === "md" && "px-4 py-2 text-sm",
        variant !== "icon" && size === "lg" && "px-6 py-2.5 text-base",
        full && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
