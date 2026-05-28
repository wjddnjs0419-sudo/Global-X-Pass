import { useEffect, useRef, useState } from "react";
import { getFileNameFromUrl } from "../../../utils/file";

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
      <div ref={rootRef} style={{ position: "relative", display: "inline-flex", maxWidth: "min(88vw, 300px)" }}>
        <a
          href={files[0]}
          target="_blank"
          rel="noreferrer"
          title={firstFileName}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "var(--space-xs)",
            textDecoration: "none",
            fontSize: 13,
            fontWeight: 700,
            color: "var(--color-accent-blue)",
            lineHeight: 1.4,
          }}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{firstFileName}</span>
        </a>
      </div>
    );
  }

  return (
    <div ref={rootRef} style={{ position: "relative", display: "inline-flex", maxWidth: "min(88vw, 320px)" }}>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`첨부파일 ${fileCount}개 ${open ? "닫기" : "열기"}`}
        onClick={() => setOpen((prev) => !prev)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "var(--space-xs)",
          color: "var(--color-accent-blue)",
          cursor: "pointer",
          fontSize: 13,
          fontWeight: 700,
          lineHeight: 1.4,
          padding: 0,
          border: "none",
          background: "transparent",
        }}
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>첨부파일 {fileCount}개</span>
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 160ms ease" }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label={`첨부파일 ${fileCount}개`}
          style={{
            position: "absolute",
            top: "calc(100% + 10px)",
            right: 0,
            width: "min(92vw, 380px)",
            maxHeight: "min(64vh, calc(100dvh - 132px))",
            overflow: "hidden",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border-soft)",
            background: "color-mix(in srgb, var(--color-surface-card) 88%, transparent)",
            boxShadow: "0 22px 42px rgba(15, 23, 42, 0.16)",
            backdropFilter: "blur(22px)",
            WebkitBackdropFilter: "blur(22px)",
            zIndex: 30,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-sm)",
              padding: "14px 16px 10px",
              borderBottom: "1px solid var(--color-border-soft)",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 800, color: "var(--color-text-primary)" }}>첨부파일</p>
              <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>{fileCount}개 항목</p>
            </div>
            <button
              type="button"
              aria-label="첨부파일 패널 닫기"
              onClick={() => setOpen(false)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 999,
                border: "1px solid var(--color-border-soft)",
                background: "transparent",
                color: "var(--color-text-muted)",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div style={{ maxHeight: "calc(min(64vh, calc(100dvh - 132px)) - 54px)", overflowY: "auto", padding: "8px 16px 14px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-sm)" }}>
              {files.map((url, idx) => (
                <a
                  key={`${url}-${idx}`}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  title={getFileNameFromUrl(url, "첨부파일")}
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "stretch",
                    gap: "7px",
                    width: "100%",
                    minWidth: 0,
                    padding: "9px 0 7px",
                    textDecoration: "none",
                    color: "var(--color-accent-blue)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-sm)", minWidth: 0 }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0 }}>
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span style={{ minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: 12.5, fontWeight: 600, lineHeight: 1.45 }}>
                      {getFileNameFromUrl(url, "첨부파일")}
                    </span>
                  </div>
                  <div
                    aria-hidden="true"
                    style={{
                      height: 2,
                      width: "100%",
                      borderRadius: 999,
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
