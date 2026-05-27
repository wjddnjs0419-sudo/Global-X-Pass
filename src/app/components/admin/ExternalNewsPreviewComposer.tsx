import { useEffect, useMemo, useState } from "react";
import { PencilLine, Plus, RefreshCw, Trash2 } from "lucide-react";
import { supabase, supabaseUrl } from "../../../lib/supabaseClient";
import type { ExternalNewsItem, ExternalNewsPreviewResult } from "../../../lib/types";
import { AdminConfirmModal } from "./AdminConfirmModal";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { ExternalNewsDraftEditor } from "./ExternalNewsDraftEditor";
import { ExternalNewsPreviewCard } from "./ExternalNewsPreviewCard";
import type { ExternalNewsDraftValues } from "./externalNewsTypes";

interface ExternalNewsPreviewComposerProps {
  editingItem: ExternalNewsItem | null;
  onCancelEditing: () => void;
  onSaved: () => Promise<void> | void;
}

function toDateInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function defaultDraft(): ExternalNewsDraftValues {
  return {
    title: "",
    summary: "",
    source_name: "",
    external_url: "",
    published_date: toDateInputValue(new Date().toISOString()),
    status: "draft",
  };
}

function normalizeUrl(value: string): string {
  const raw = value.trim();
  if (!raw) {
    throw new Error("링크를 입력해 주세요.");
  }

  const candidate = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  const url = new URL(candidate);
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("external_url은 http 또는 https 링크여야 합니다.");
  }
  return url.toString();
}

async function invokePreview(url: string): Promise<{ data: ExternalNewsPreviewResult | null; error: string | null }> {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token ?? null;

  const response = await fetch(new URL("/functions/v1/external-news-preview", supabaseUrl).toString(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify({ url }),
  });

  const rawText = await response.text();
  let parsed: { error?: string } & Partial<ExternalNewsPreviewResult> = {};
  if (rawText) {
    try {
      parsed = JSON.parse(rawText) as typeof parsed;
    } catch {
      parsed = { error: rawText };
    }
  }

  if (!response.ok) {
    const detail = parsed.error ?? rawText.trim();
    return {
      data: null,
      error: detail ? `미리보기 실패 (${response.status}): ${detail}` : `미리보기 실패 (${response.status})`,
    };
  }

  if (!parsed.canonical_url || !parsed.title || !parsed.source_name) {
    return {
      data: null,
      error: "미리보기 응답이 올바르지 않습니다.",
    };
  }

  return { data: parsed as ExternalNewsPreviewResult, error: null };
}

function seedPreview(item: ExternalNewsItem): ExternalNewsPreviewResult {
  return {
    input_url: item.external_url,
    canonical_url: item.external_url,
    title: item.title,
    summary: item.summary,
    source_name: item.source_name,
    published_at: item.published_at,
    warnings: [],
    field_sources: {
      title: "저장된 값",
      summary: "저장된 값",
      source_name: "저장된 값",
      published_at: "저장된 값",
    },
  };
}

export function ExternalNewsPreviewComposer({
  editingItem,
  onCancelEditing,
  onSaved,
}: ExternalNewsPreviewComposerProps) {
  const [urlInput, setUrlInput] = useState("");
  const [draft, setDraft] = useState<ExternalNewsDraftValues>(defaultDraft());
  const [preview, setPreview] = useState<ExternalNewsPreviewResult | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | null>(null);
  const [publishModalOpen, setPublishModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(editingItem);
  const isPublished = draft.status === "published";

  const headerLabel = useMemo(() => {
    if (isEditing) return "수정 중";
    if (recordId) return "초안";
    return "새 작성";
  }, [isEditing, recordId]);

  const resetToNew = () => {
    setUrlInput("");
    setDraft(defaultDraft());
    setPreview(null);
    setPreviewError(null);
    setActionError(null);
    setRecordId(null);
    setPublishModalOpen(false);
    setDeleteModalOpen(false);
    onCancelEditing();
  };

  useEffect(() => {
    if (!editingItem) {
      setUrlInput("");
      setDraft(defaultDraft());
      setPreview(null);
      setPreviewError(null);
      setActionError(null);
      setRecordId(null);
      setPublishModalOpen(false);
      setDeleteModalOpen(false);
      return;
    }

    const nextDraft: ExternalNewsDraftValues = {
      title: editingItem.title,
      summary: editingItem.summary ?? "",
      source_name: editingItem.source_name,
      external_url: editingItem.external_url,
      published_date: toDateInputValue(editingItem.published_at),
      status: editingItem.status,
    };

    setUrlInput(editingItem.external_url);
    setDraft(nextDraft);
    setPreview(seedPreview(editingItem));
    setPreviewError(null);
    setActionError(null);
    setRecordId(editingItem.id);
    setPublishModalOpen(false);
    setDeleteModalOpen(false);
  }, [editingItem]);

  const handlePreview = async () => {
    const rawUrl = urlInput.trim();
    if (!rawUrl) {
      setPreviewError("링크를 입력해 주세요.");
      return;
    }

    let normalizedUrl: string;
    try {
      normalizedUrl = normalizeUrl(rawUrl);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : "유효한 링크를 입력해 주세요.");
      return;
    }

    setPreviewLoading(true);
    setPreviewError(null);
    setActionError(null);

    const { data, error } = await invokePreview(normalizedUrl);

    setPreviewLoading(false);

    if (error || !data) {
      setPreviewError(error ?? "미리보기를 생성하지 못했습니다.");
      return;
    }

    setPreview(data);
    setUrlInput(data.canonical_url);
    setDraft((prev) => ({
      ...prev,
      title: data.title,
      summary: data.summary ?? "",
      source_name: data.source_name,
      external_url: data.canonical_url,
      published_date: toDateInputValue(data.published_at),
    }));
  };

  const validateDraft = () => {
    const title = draft.title.trim();
    const sourceName = draft.source_name.trim();
    const urlValue = draft.external_url.trim();
    const dateValue = draft.published_date.trim();

    if (!title) return "제목을 입력해 주세요.";
    if (!sourceName) return "출처를 입력해 주세요.";
    if (!urlValue) return "원문 링크를 입력해 주세요.";
    if (!dateValue) return "발행일을 입력해 주세요.";

    try {
      normalizeUrl(urlValue);
    } catch (error) {
      return error instanceof Error ? error.message : "유효한 링크를 입력해 주세요.";
    }

    return null;
  };

  const persistDraft = async (nextStatus: ExternalNewsDraftValues["status"] = draft.status) => {
    const validation = validateDraft();
    if (validation) {
      setActionError(validation);
      return false;
    }

    setSaving(true);
    setActionError(null);

    const payload = {
      title: draft.title.trim(),
      summary: draft.summary.trim() || null,
      source_name: draft.source_name.trim(),
      external_url: normalizeUrl(draft.external_url.trim()),
      published_at: new Date(`${draft.published_date}T12:00:00`).toISOString(),
      status: nextStatus,
    };

    const query = recordId
      ? supabase.from("external_news_items").update(payload).eq("id", recordId)
      : supabase.from("external_news_items").insert(payload);

    const { data, error } = await query.select("id, status").single();
    setSaving(false);

    if (error || !data?.id) {
      setActionError(error?.message ?? "저장하지 못했습니다.");
      return false;
    }

    setRecordId(data.id);
    setDraft((prev) => ({ ...prev, status: data.status as ExternalNewsDraftValues["status"] }));
    await onSaved();
    return true;
  };

  const handleSave = async () => {
    await persistDraft(draft.status);
  };

  const handlePublish = async () => {
    const ok = await persistDraft("published");
    if (ok) {
      setPublishModalOpen(false);
    }
  };

  const handleDelete = async () => {
    if (!recordId) return;

    setSaving(true);
    setActionError(null);
    const { error } = await supabase.from("external_news_items").delete().eq("id", recordId);
    setSaving(false);
    setDeleteModalOpen(false);

    if (error) {
      setActionError(error.message);
      return;
    }

    resetToNew();
    await onSaved();
  };

  const linkPlaceholder = isEditing ? "수정할 기사 링크를 다시 붙여 넣어 주세요." : "기사 링크를 붙여 넣어 주세요.";

  return (
    <div className="rounded-[24px] p-5 sm:p-6 flex flex-col gap-5" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)" }}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="m-0 text-[24px] font-extrabold" style={{ color: "var(--color-text-primary)" }}>
              언론보도 작성
            </h2>
            <Badge variant={isPublished ? "green" : "blue"} shape="pill">
              {headerLabel}
            </Badge>
          </div>
          <p className="mt-1 mb-0 text-[13px] leading-relaxed" style={{ color: "var(--color-text-muted)" }}>
            링크를 먼저 읽어 미리보기를 만들고, 수정한 뒤 초안 저장과 게시 승인을 분리합니다.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button type="button" variant="outline" size="sm" onClick={handlePreview} disabled={previewLoading}>
            <RefreshCw size={14} />
            {previewLoading ? "미리보기 중..." : "미리보기 생성"}
          </Button>
          {isEditing ? (
            <Button type="button" variant="ghost" size="sm" onClick={resetToNew}>
              새 초안 작성
            </Button>
          ) : (
            <Button type="button" variant="ghost" size="sm" onClick={handlePreview}>
              <Plus size={14} />
              링크 다시 읽기
            </Button>
          )}
        </div>
      </div>

      {previewError && (
        <div
          className="rounded-[16px] p-4"
          style={{
            background: "var(--color-danger-soft-bg)",
            border: "1px solid var(--color-danger-soft-border)",
            color: "var(--color-brand-red)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {previewError}
        </div>
      )}

      {actionError && (
        <div
          className="rounded-[16px] p-4"
          style={{
            background: "var(--color-danger-soft-bg)",
            border: "1px solid var(--color-danger-soft-border)",
            color: "var(--color-brand-red)",
            fontSize: 14,
            lineHeight: 1.6,
          }}
        >
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-5 items-start">
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-[11px] font-bold uppercase tracking-[0.06em]" style={{ color: "var(--color-text-muted)" }}>
              기사 링크
            </span>
            <input
              type="url"
              value={urlInput}
              onChange={(event) => {
                const nextValue = event.currentTarget.value;
                setUrlInput(nextValue);
                setDraft((prev) => ({ ...prev, external_url: nextValue }));
                setPreviewError(null);
                setActionError(null);
              }}
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "var(--color-field-bg)",
                border: "1px solid var(--color-border-soft)",
                color: "var(--color-text-primary)",
                outline: "none",
                width: "100%",
                boxSizing: "border-box",
                fontFamily: "inherit",
                fontSize: 14,
              }}
              placeholder={linkPlaceholder}
            />
          </label>

          <ExternalNewsPreviewCard
            preview={preview}
            draft={draft}
            loading={previewLoading}
            error={previewError}
          />
        </div>

        <ExternalNewsDraftEditor draft={draft} onChange={(patch) => setDraft((prev) => ({ ...prev, ...patch }))} />
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" shape="pill">
            저장 상태: {draft.status === "published" ? "게시됨" : "초안"}
          </Badge>
          {recordId && (
            <span className="text-[12px] font-medium" style={{ color: "var(--color-text-muted)" }}>
              기존 항목을 편집 중입니다.
            </span>
          )}
        </div>

        <div className="flex gap-2 flex-wrap sm:justify-end">
          <Button type="button" variant="outline" size="sm" onClick={isEditing ? resetToNew : () => {
            setUrlInput("");
            setDraft(defaultDraft());
            setPreview(null);
            setPreviewError(null);
            setActionError(null);
          }}>
            초기화
          </Button>
          <Button type="button" size="sm" onClick={() => { void handleSave(); }} disabled={saving}>
            {recordId ? <PencilLine size={14} /> : <Plus size={14} />}
            {recordId ? "수정 저장" : "초안 저장"}
          </Button>
          {recordId && draft.status === "draft" && (
            <Button type="button" variant="purple" size="sm" onClick={() => setPublishModalOpen(true)} disabled={saving}>
              게시 승인
            </Button>
          )}
          {recordId && (
            <Button type="button" variant="destructive" size="sm" onClick={() => setDeleteModalOpen(true)} disabled={saving}>
              <Trash2 size={14} />
              삭제
            </Button>
          )}
        </div>
      </div>

      {publishModalOpen && (
        <AdminConfirmModal
          title="언론보도 게시 승인"
          description="현재 초안을 게시 상태로 전환할까요? 게시되면 뉴스 페이지의 언론보도 탭에 노출됩니다."
          confirmLabel="게시 승인"
          loading={saving}
          onConfirm={() => { void handlePublish(); }}
          onCancel={() => setPublishModalOpen(false)}
        />
      )}

      {deleteModalOpen && (
        <AdminConfirmModal
          title="언론보도 삭제"
          description="이 항목을 삭제할까요? 이 작업은 되돌릴 수 없습니다."
          confirmLabel="삭제"
          tone="danger"
          loading={saving}
          onConfirm={() => { void handleDelete(); }}
          onCancel={() => setDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
