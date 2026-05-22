import { useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
  submitLabel?: string;
  autoFocus?: boolean;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "검색",
  onSubmit,
  submitLabel = "검색",
  autoFocus,
  className = "",
}: SearchInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 ${className}`}
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-border-soft)",
        boxShadow: "var(--shadow-card-rest)",
      }}
    >
      <Search size={16} style={{ flexShrink: 0, color: "var(--color-text-muted)" }} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && onSubmit) onSubmit(); }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="flex-1 bg-transparent text-[14px] outline-none border-none"
        style={{ color: "var(--color-text-primary)" }}
      />
      {value && (
        <button
          type="button"
          onClick={() => { onChange(""); inputRef.current?.focus(); }}
          className="p-1 rounded-lg border-none bg-transparent cursor-pointer transition-opacity hover:opacity-70"
          aria-label="검색어 초기화"
        >
          <X size={14} style={{ color: "var(--color-text-muted)" }} />
        </button>
      )}
      {onSubmit && (
        <button
          type="button"
          onClick={onSubmit}
          className="px-4 py-2 rounded-xl border-none text-[13px] font-bold cursor-pointer flex-shrink-0"
          style={{ background: "var(--color-accent-blue)", color: "var(--color-on-primary)" }}
        >
          {submitLabel}
        </button>
      )}
    </div>
  );
}
