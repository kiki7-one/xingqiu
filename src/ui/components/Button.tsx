import { clsx } from "clsx";
import { clsx as _ } from "clsx";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";

const variantClasses: Record<Variant, string> = {
  primary: "bg-cream-500 text-white hover:bg-cream-600",
  secondary: "bg-cream-100 text-cream-800 hover:bg-cream-200",
  ghost: "text-cream-700 hover:bg-cream-100",
  danger: "bg-red-500 text-white hover:bg-red-600",
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
        "rounded-warm transition-colors disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        size === "sm" && "px-3 py-1 text-sm",
        size === "md" && "px-4 py-2 text-sm",
        size === "lg" && "px-5 py-2.5 text-base",
        full && "w-full",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
