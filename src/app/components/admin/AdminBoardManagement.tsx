import { useCallback, useEffect, useState } from "react";
import { Lock } from "lucide-react";
import { supabase } from "../../../lib/supabaseClient";
import { useTheme } from "../../ThemeContext";
import type { BoardAccessLevel, PostCategory } from "../../../lib/types";
import { interpretCategoryUpdate } from "../../../utils/categoryUpdate";

type DraftMap = Record<string, { label: string; description: string }>;

const ACCESS_LEVELS: { value: BoardAccessLevel; label: string; desc: string; color: string }[] = [
  { value: "public",  label: "전체 공개",   desc: "목록·상세 모두 공개",            color: "#16a34a" },
  { value: "gated",   label: "상세 로그인", desc: "목록은 공개, 상세·신청은 로그인", color: "#d97706" },
  { value: "private", label: "전체 비공개", desc: "페이지 진입부터 로그인 필요",      color: "#dc2626" },
];

const getAccessMeta = (level: BoardAccessLevel) =>
  ACCESS_LEVELS.find((a) => a.value === level) ?? ACCESS_LEVELS[2];

export default function AdminBoardManagement() {
  const { isDark } = useTheme();

  const [categories, setCategories] = useState<PostCategory[]>([]);
  const [drafts, setDrafts] = useState<DraftMap>({});
  const [savingId, setSavingId] = useState<string | null>(null);
  const [toggledId, setToggledId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ id: string; type: "success" | "error"; text: string } | null>(null);

  const card     = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border   = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "rgba(10,16,32,0.88)";
  const textMuted= isDark ? "rgba(255,255,255,0.45)" : "rgba(10,16,32,0.45)";
  const inputBg  = isDark ? "rgba(255,255,255,0.04)" : "#fff";
  const skBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)";

  const inputStyle: React.CSSProperties = {
    padding: "10px 14px",
    borderRadius: 10,
    background: inputBg,
    border: `1px solid ${border}`,
    color: textMain,
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
    fontFamily: "inherit",
    fontSize: 14,
  };

  const getLockedInputStyle = (disabled: boolean): React.CSSProperties => ({
    ...inputStyle,
    background: disabled ? (isDark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.03)") : inputBg,
    opacity: disabled ? 0.68 : 1,
    cursor: disabled ? "not-allowed" : "text",
  });

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("post_categories")
      .select("*")
      .order("sort_order", { ascending: true });
    if (!error && data) {
      const list = data as PostCategory[];
      setCategories(list);
      setDrafts((prev) => {
        const next: DraftMap = { ...prev };
        list.forEach((c) => {
          if (!next[c.id]) next[c.id] = { label: c.label, description: c.description ?? "" };
        });
        return next;
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
    const ch = supabase
      .channel("realtime-post-categories-admin")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_categories" },
        () => fetchCategories()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [fetchCategories]);

  const updateDraft = (id: string, patch: Partial<{ label: string; description: string }>) => {
    setDrafts((prev) => ({ ...prev, [id]: { ...prev[id], ...patch } }));
  };

  const isDirty = (cat: PostCategory) => {
    const d = drafts[cat.id];
    if (!d) return false;
    return d.label.trim() !== cat.label || (d.description ?? "") !== (cat.description ?? "");
  };

  const showStatus = (id: string, type: "success" | "error", text: string) => {
    setStatusMessage({ id, type, text });
    window.setTimeout(() => {
      setStatusMessage((prev) => (prev && prev.id === id ? null : prev));
    }, 3000);
  };

  const saveMeta = async (cat: PostCategory) => {
    const draft = drafts[cat.id];
    if (!draft) return;
    const label = draft.label.trim();
    if (!label) {
      showStatus(cat.id, "error", "라벨은 비울 수 없습니다.");
      return;
    }
    setSavingId(cat.id);
    try {
      const { data, error } = await supabase
        .from("post_categories")
        .update({ label, description: draft.description.trim() || null })
        .eq("id", cat.id)
        .select("id");
      const result = interpretCategoryUpdate({ data, error });
      if (!result.ok) {
        showStatus(cat.id, "error", `저장 실패: ${result.errorText}`);
      } else {
        showStatus(cat.id, "success", "저장되었습니다.");
      }
    } finally {
      // 예외가 throw돼도 loading 상태가 고착되지 않도록 finally 에서 해제한다.
      setSavingId(null);
    }
  };

  const updateAccessLevel = async (cat: PostCategory, level: BoardAccessLevel) => {
    if (cat.is_locked || cat.access_level === level) return;
    setToggledId(cat.id);
    try {
      const { data, error } = await supabase
        .from("post_categories")
        .update({ access_level: level })
        .eq("id", cat.id)
        .select("id");
      const result = interpretCategoryUpdate({ data, error });
      if (!result.ok) {
        showStatus(cat.id, "error", `접근 설정 변경 실패: ${result.errorText}`);
      } else {
        // 낙관적 반영: Realtime 수신 전에도 뱃지·버튼이 즉시 갱신되도록 로컬 상태를 갱신한다.
        // is_public 은 DB 트리거(access_level <> 'private')와 동일하게 맞춘다.
        setCategories((prev) =>
          prev.map((c) =>
            c.id === cat.id ? { ...c, access_level: level, is_public: level !== "private" } : c
          )
        );
        showStatus(cat.id, "success", `'${getAccessMeta(level).label}'(으)로 변경했습니다.`);
      }
    } finally {
      // 예외가 throw돼도 loading 상태가 고착되지 않도록 finally 에서 해제한다.
      setToggledId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} style={{ height: 110, borderRadius: 16, background: skBg, animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
      <header>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: textMain }}>게시판 관리</h1>
        <p style={{ margin: "6px 0 0", fontSize: 13, color: textMuted, lineHeight: 1.55 }}>
          각 게시판·페이지의 라벨·설명·접근 권한을 설정합니다.
          <strong style={{ color: textMain }}> 전체 공개</strong>(목록·상세 모두 공개) /
          <strong style={{ color: textMain }}> 상세 로그인</strong>(목록은 공개, 상세·신청은 로그인) /
          <strong style={{ color: textMain }}> 전체 비공개</strong>(진입부터 로그인) 중 선택합니다.
          잠금(<Lock size={11} style={{ display: "inline", verticalAlign: "middle" }} />) 게시판은 변경할 수 없습니다.
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {categories.map((cat) => {
          const draft = drafts[cat.id] ?? { label: cat.label, description: cat.description ?? "" };
          const dirty = isDirty(cat);
          const saving = savingId === cat.id;
          const toggling = toggledId === cat.id;
          const status = statusMessage?.id === cat.id ? statusMessage : null;
          const accessMeta = getAccessMeta(cat.access_level);

          return (
            <div
              key={cat.id}
              style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 16,
                padding: 18,
                display: "flex",
                flexDirection: "column",
                gap: 14,
                opacity: cat.is_locked ? 0.78 : 1,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <code style={{ fontSize: 12, fontWeight: 700, color: textMuted, padding: "3px 8px", borderRadius: 6, background: inputBg, border: `1px solid ${border}` }}>
                  {cat.id}
                </code>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: "3px 9px",
                    borderRadius: 999,
                    background: `${accessMeta.color}22`,
                    color: accessMeta.color,
                  }}
                >
                  {accessMeta.label}
                </span>
                {cat.kind === "page" && (
                  <span style={{ fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999, background: "rgba(99,102,241,0.14)", color: "#6366f1" }}>
                    특수 페이지
                  </span>
                )}
                {cat.is_locked && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 11, fontWeight: 800, padding: "3px 9px", borderRadius: 999, background: "rgba(15,23,42,0.08)", color: textMuted }}>
                    <Lock size={11} /> 잠김
                  </span>
                )}
                <div style={{ marginLeft: "auto", display: "inline-flex", gap: 6, flexWrap: "wrap" }}>
                  {ACCESS_LEVELS.map((opt) => {
                    const active = cat.access_level === opt.value;
                    // 게시물 게시판(board)도 'gated' 허용: 목록은 list_public_post_previews RPC(본문 500자 미리보기)로
                    // 공개하고, 본문 직접 조회는 RLS(access_level='public' 만 anon)로 차단, 상세는 로그인 게이트로 처리한다.
                    const disabled = cat.is_locked || toggling;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => updateAccessLevel(cat, opt.value)}
                        disabled={disabled}
                        title={opt.desc}
                        style={{
                          padding: "7px 12px",
                          fontSize: 12.5,
                          fontWeight: 700,
                          borderRadius: 9,
                          border: `1px solid ${active ? opt.color : border}`,
                          background: active ? `${opt.color}1a` : "transparent",
                          color: active ? opt.color : textMuted,
                          cursor: disabled ? "not-allowed" : "pointer",
                          opacity: cat.is_locked && !active ? 0.4 : 1,
                          fontFamily: "inherit",
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 240px) 1fr", gap: 10 }}>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>라벨</span>
                  <input
                    type="text"
                    value={draft.label}
                    onChange={(e) => updateDraft(cat.id, { label: e.target.value })}
                    disabled={cat.is_locked}
                    style={getLockedInputStyle(cat.is_locked)}
                    maxLength={40}
                  />
                </label>
                <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: textMuted, textTransform: "uppercase", letterSpacing: "0.06em" }}>설명</span>
                  <input
                    type="text"
                    value={draft.description}
                    onChange={(e) => updateDraft(cat.id, { description: e.target.value })}
                    disabled={cat.is_locked}
                    style={getLockedInputStyle(cat.is_locked)}
                    placeholder="간단한 설명(선택)"
                    maxLength={120}
                  />
                </label>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => saveMeta(cat)}
                  disabled={cat.is_locked || !dirty || saving}
                  style={{
                    padding: "8px 14px",
                    fontSize: 13,
                    fontWeight: 700,
                    borderRadius: 10,
                    border: `1px solid ${border}`,
                    background: cat.is_locked ? inputBg : dirty ? "var(--color-accent-blue)" : "transparent",
                    color: cat.is_locked ? textMuted : dirty ? "#fff" : textMuted,
                    cursor: cat.is_locked || !dirty || saving ? "not-allowed" : "pointer",
                    opacity: cat.is_locked ? 0.75 : 1,
                    fontFamily: "inherit",
                  }}
                >
                  {cat.is_locked ? "잠금됨" : saving ? "저장 중…" : "라벨/설명 저장"}
                </button>
                {status && (
                  <span style={{ fontSize: 12, fontWeight: 700, color: status.type === "success" ? "#16a34a" : "#dc2626" }}>
                    {status.text}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
