import { useEffect, useRef, useState } from "react";
import { getDownloadUrl, getFileNameFromUrl } from "../../../utils/file";

type AttachmentPopoverProps = {
  files: string[];
};

export function AttachmentPopover({ files }: AttachmentPopoverProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const fileCount = files.length;
  const firstFileName = getFileNameFromUrl(files[0] ?? "", "첨부파일");

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("touchstart", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("touchstart", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  if (fileCount === 0) return null;

  if (fileCount === 1) {
    return (
      <div ref={rootRef} className="relative inline-flex" style={{ maxWidth: "min(88vw, 300px)" }}>
        <a
          href={getDownloadUrl(files[0])}
          download={firstFileName}
          target="_blank"
          rel="noreferrer"
          title={firstFileName}
          className="inline-flex items-center gap-2 no-underline text-[13px] font-bold leading-[1.4]"
          style={{ color: "var(--color-accent-blue)" }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span className="overflow-hidden text-ellipsis whitespace-nowrap">{firstFileName}</span>
        </a>
      </div>
    );
  }

  return (
    <div ref={rootRef} className="relative inline-flex" style={{ maxWidth: "min(88vw, 320px)" }}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`첨부파일 ${fileCount}개 ${open ? "닫기" : "열기"}`}
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-2 cursor-pointer text-[13px] font-bold leading-[1.4] p-0 border-0 bg-transparent"
        style={{ color: "var(--color-accent-blue)" }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span className="overflow-hidden text-ellipsis whitespace-nowrap">첨부파일 {fileCount}개</span>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="transition-transform duration-150 ease-out"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`첨부파일 ${fileCount}개`}
          className="absolute right-0 overflow-hidden rounded-[var(--radius-lg)] border border-soft z-30"
          style={{
            top: "calc(100% + 10px)",
            width: "min(92vw, 380px)",
            maxHeight: "min(64vh, calc(100dvh - 132px))",
            background: "color-mix(in srgb, var(--color-surface-card) 94%, transparent)",
            boxShadow: "0 22px 42px rgba(15, 23, 42, 0.16)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
          }}
        >
          <div className="flex items-center justify-between gap-3 px-4 pt-[14px] pb-[10px] border-b border-soft">
            <div className="min-w-0">
              <p className="text-ink m-0 text-sm font-extrabold">첨부파일</p>
              <p className="text-ink-muted mt-1 mb-0 text-xs">{fileCount}개 항목</p>
            </div>
            <button
              type="button"
              aria-label="첨부파일 패널 닫기"
              onClick={() => setOpen(false)}
              className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-soft bg-transparent text-ink-muted cursor-pointer shrink-0"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="overflow-y-auto px-4 pt-2 pb-[14px]" style={{ maxHeight: "calc(min(64vh, calc(100dvh - 132px)) - 54px)" }}>
            <div className="flex flex-col gap-3">
              {files.map((url, idx) => (
                <a
                  key={`${url}-${idx}`}
                  href={getDownloadUrl(url)}
                  download={getFileNameFromUrl(url, "첨부파일")}
                  target="_blank"
                  rel="noreferrer"
                  title={getFileNameFromUrl(url, "첨부파일")}
                  className="flex flex-col items-stretch w-full min-w-0 no-underline pt-[9px] pb-[7px]"
                  style={{ gap: "7px", color: "var(--color-accent-blue)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-semibold leading-[1.45]" style={{ fontSize: 12.5 }}>
                      {getFileNameFromUrl(url, "첨부파일")}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    className="h-0.5 w-full rounded-full"
                    style={{
                      background: "linear-gradient(90deg, color-mix(in srgb, var(--color-accent-blue) 38%, transparent) 0%, color-mix(in srgb, var(--color-accent-blue) 10%, transparent) 78%, transparent 100%)",
                    }}
                  />
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
