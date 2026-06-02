import { useMemo } from "react";
import { Download } from "lucide-react";
import { Button } from "../ui/button";
import type { EventApplication, Post } from "../../../lib/types";
import { mergeEventFormConfig } from "../../../utils/eventApplication";
import { buildResponseRows, toCsv } from "../../../utils/eventResponseExport";

interface Props {
  event: Post | null;
  applications: EventApplication[];
}

const sanitizeFileName = (name: string): string =>
  name.replace(/[\\/:*?"<>|]/g, "_").slice(0, 60) || "행사";

const fileDateStamp = (): string => {
  const now = new Date();
  return `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
};

export function EventResponsesView({ event, applications }: Props) {
  const border    = "var(--color-border-soft)";
  const textMain  = "var(--color-text-primary)";
  const textMuted = "var(--color-text-muted)";
  const labelBg   = "var(--color-surface-subtle)";

  const questions = useMemo(() => mergeEventFormConfig(event?.event_form_config).customQuestions, [event]);
  const { headers, rows } = useMemo(() => buildResponseRows(applications, questions), [applications, questions]);

  if (!event) {
    return (
      <div style={{ color: textMuted, padding: "40px 0", textAlign: "center" }}>
        상단에서 행사를 선택하면 응답 데이터를 표로 조회할 수 있습니다.
      </div>
    );
  }

  const handleDownload = () => {
    const csv = toCsv(headers, rows);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `${sanitizeFileName(event.title)}_응답_${fileDateStamp()}.csv`;
    document.body.appendChild(anchor);
    anchor.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      anchor.remove();
    }, 0);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
        <strong style={{ color: textMain, fontSize: 16 }}>{event.title} · 응답 {rows.length}건</strong>
        <div className="flex flex-col items-end gap-1">
          <Button variant="outline" disabled={rows.length === 0} onClick={handleDownload}>
            <Download size={16} /> CSV 다운로드
          </Button>
          <p className="m-0 text-right text-xs" style={{ color: textMuted }}>
            엑셀 텍스트 마법사: 구분 기호로 분리됨 · 쉼표 · 일반
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <div style={{ color: textMuted, padding: "32px 0", textAlign: "center" }}>이 행사에 접수된 신청이 없습니다.</div>
      ) : (
        <div style={{ overflowX: "auto", border: `1px solid ${border}`, borderRadius: 12 }}>
          <table style={{ borderCollapse: "collapse", width: "100%", fontSize: 13 }}>
            <thead>
              <tr>
                {headers.map(header => (
                  <th key={header} style={{ position: "sticky", top: 0, background: labelBg, color: textMain, textAlign: "left", padding: "10px 12px", borderBottom: `1px solid ${border}`, whiteSpace: "nowrap", fontWeight: 700 }}>{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} title={cell || undefined} style={{ padding: "10px 12px", borderBottom: `1px solid ${border}`, color: textMuted, verticalAlign: "top" }}>
                      <span style={{ display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", maxWidth: 240, height: 36, lineHeight: "18px", wordBreak: "break-word" }}>{cell || "–"}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default EventResponsesView;
