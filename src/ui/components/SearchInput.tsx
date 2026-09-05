import { clsx } from "clsx";
import { Search } from "lucide-react";
import { forwardRef, type InputHTMLAttributes } from "react";

interface SearchInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

/**
 * 带放大镜图标的搜索输入框（毛玻璃风格）
 */
export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ label, error, className, id, ...props }, ref) => {
    const inputId = id ?? label;
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={inputId} className="text-xs font-medium text-cream-600">
            {label}
          </label>
        )}
        <div className="relative">
          <Search
            size={15}
            strokeWidth={2}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-cream-400"
          />
          <input
            ref={ref}
            id={inputId}
            className={clsx(
              "glass-input rounded-warm w-full py-2 pl-9 pr-3 text-sm text-cream-900 placeholder:text-cream-400",
              error && "border-error focus:border-error focus:ring-error/20",
              className
            )}
            {...props}
          />
        </div>
        {error && <span className="mt-0.5 text-xs text-error">{error}</span>}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";
