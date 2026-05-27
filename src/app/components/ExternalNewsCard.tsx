import { ExternalLink } from "lucide-react";
import type { ExternalNewsItem } from "../../lib/types";
import { Badge } from "./ui/badge";

function formatPublishedDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

interface ExternalNewsCardProps {
  item: Pick<ExternalNewsItem, "title" | "summary" | "source_name" | "external_url" | "published_at">;
}

export function ExternalNewsCard({ item }: ExternalNewsCardProps) {
  return (
    <a
      href={item.external_url}
      target="_blank"
      rel="noreferrer"
      className="rounded-[20px] overflow-hidden block no-underline transition-all duration-200 ease-out hover:-translate-y-0.5"
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-border-soft)",
      }}
    >
      <div className="p-4 sm:p-5 flex flex-col gap-2">
        <div className="flex items-start gap-2 flex-wrap">
          <Badge variant="blue" shape="pill" className="mt-[3px]">
            {item.source_name}
          </Badge>
          <h2
            className="m-0 font-extrabold leading-snug line-clamp-2"
            style={{ fontSize: "clamp(16px, 2vw, 19px)", color: "var(--color-text-primary)" }}
          >
            {item.title}
          </h2>
        </div>

        {item.summary && (
          <p
            className="m-0 text-[14px] leading-relaxed line-clamp-2"
            style={{ color: "var(--color-text-muted)" }}
          >
            {item.summary}
          </p>
        )}

        <div className="flex items-center gap-3 mt-auto pt-1 flex-wrap">
          <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
            {formatPublishedDate(item.published_at)}
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-bold" style={{ color: "var(--color-accent-blue)" }}>
            원문 보기 <ExternalLink size={12} />
          </span>
        </div>
      </div>
    </a>
  );
}
