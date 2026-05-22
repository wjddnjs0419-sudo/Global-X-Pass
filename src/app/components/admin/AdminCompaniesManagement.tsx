import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
import { SearchInput } from "../SearchInput";
import { getStatusPillStyle } from "../contentListStyles";
import { AppPagination } from "../AppPagination";
import type { Company } from "../../../lib/types";

const PAGE_SIZE = 20;
const CSV_TEMPLATE_HEADERS = "name,program_name,industry,participation_year,description,website_url";
const CSV_TEMPLATE_EXAMPLE = '"기업명 예시","창구 프로그램","AI/소프트웨어","2026","기업 설명을 입력하세요","https://example.com"';
const PARTICIPATION_YEAR_MIN = 2000;
const PARTICIPATION_YEAR_MAX = 2100;

type CompanyForm = {
  name: string;
  slug: string;
  program_name: string;
  industry: string;
  participation_year: string;
  description: string;
  website_url: string;
  status: "published" | "draft";
};

const emptyForm: CompanyForm = {
  name: "",
  slug: "",
  program_name: "창구 프로그램",
  industry: "",
  participation_year: "",
  description: "",
  website_url: "",
  status: "published",
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s가-힣ㄱ-ㅎㅏ-ㅣ-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseCsvRow(line: string): string[] {
  const fields: string[] = [];
  let i = 0;
  while (i < line.length) {
    if (line[i] === '"') {
      let field = "";
      i++;
      while (i < line.length) {
        if (line[i] === '"') {
          if (i + 1 < line.length && line[i + 1] === '"') { field += '"'; i += 2; }
          else { i++; break; }
        } else { field += line[i++]; }
      }
      if (line[i] === ',') i++;
      fields.push(field);
    } else {
      const end = line.indexOf(',', i);
      if (end === -1) { fields.push(line.slice(i)); break; }
      fields.push(line.slice(i, end));
      i = end + 1;
    }
  }
  return fields;
}

function parseParticipationYear(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!/^\d{4}$/.test(trimmed)) return Number.NaN;
  const year = Number(trimmed);
  if (year < PARTICIPATION_YEAR_MIN || year > PARTICIPATION_YEAR_MAX) return Number.NaN;
  return year;
}

function parseCsv(text: string): { name: string; program_name: string; industry: string; participation_year: string; description: string; website_url: string }[] {
  const lines = text.split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = parseCsvRow(lines[0]).map((h) => h.trim().toLowerCase());
  const idx = (key: string) => headers.indexOf(key);
  const result: { name: string; program_name: string; industry: string; participation_year: string; description: string; website_url: string }[] = [];
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const vals = parseCsvRow(line);
    const name = (vals[idx("name")] ?? "").trim();
    if (!name) continue;
    result.push({
      name,
      program_name: (vals[idx("program_name")] ?? "").trim() || "창구 프로그램",
      industry: (vals[idx("industry")] ?? "").trim(),
      participation_year: (vals[idx("participation_year")] ?? "").trim(),
      description: (vals[idx("description")] ?? "").trim(),
      website_url: (vals[idx("website_url")] ?? "").trim(),
    });
  }
  return result;
}

export default function AdminCompaniesManagement() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CompanyForm>(emptyForm);
  const [showForm, setShowForm] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Company | null>(null);
  const [deleting, setDeleting] = useState(false);

  const [showCsvUpload, setShowCsvUpload] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [csvResult, setCsvResult] = useState<{ inserted: number; skipped: number } | null>(null);
  const [csvError, setCsvError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const card = "var(--color-surface-card)";
  const border = "var(--color-border-soft)";
  const deleteBg = "var(--color-danger-soft-bg)";
  const deleteBorder = "var(--color-danger-soft-border)";
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 13px",
    borderRadius: 10,
    border: `1px solid ${border}`,
    background: "var(--color-field-bg)",
    color: "var(--color-text-primary)",
    fontSize: 14,
    outline: "none",
    boxSizing: "border-box",
  };
  const labelStyle: React.CSSProperties = {
    fontSize: 13,
    fontWeight: 700,
    color: "var(--color-text-secondary)",
    marginBottom: 6,
    display: "block",
  };

  const fetchCompanies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("companies")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) setError("기업 목록을 불러오지 못했습니다.");
    else setCompanies(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchCompanies(); }, []);

  const openCreate = () => {
    setShowCsvUpload(false);
    setCsvFile(null);
    setCsvResult(null);
    setCsvError(null);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setShowForm(true);
  };

  const openCsvUpload = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
    setCsvFile(null);
    setCsvResult(null);
    setCsvError(null);
    setShowCsvUpload(true);
  };

  const closeCsvUpload = () => {
    setShowCsvUpload(false);
    setCsvFile(null);
    setCsvResult(null);
    setCsvError(null);
  };

  const handleCsvUpload = async () => {
    if (!csvFile) return;
    setUploading(true);
    setCsvError(null);
    setCsvResult(null);

    const text = await csvFile.text();
    const parsed = parseCsv(text);

    if (parsed.length === 0) {
      setCsvError("파싱된 유효한 행이 없습니다. 헤더(name, program_name, industry, participation_year, description, website_url)를 확인해주세요.");
      setUploading(false);
      return;
    }

    const invalidYearRows = parsed
      .map((r, index) => ({ rowNumber: index + 2, year: parseParticipationYear(r.participation_year) }))
      .filter((r) => Number.isNaN(r.year));

    if (invalidYearRows.length > 0) {
      setCsvError(`참여 년도는 ${PARTICIPATION_YEAR_MIN}-${PARTICIPATION_YEAR_MAX} 사이의 4자리 연도여야 합니다. 오류 행: ${invalidYearRows.map((r) => r.rowNumber).join(", ")}`);
      setUploading(false);
      return;
    }

    const rows = parsed.map((r) => ({
      name: r.name,
      slug: slugify(r.name),
      program_name: r.program_name,
      industry: r.industry,
      participation_year: parseParticipationYear(r.participation_year),
      description: r.description,
      website_url: r.website_url,
      status: "published" as const,
      updated_at: new Date().toISOString(),
    }));

    const { data, error: insertError } = await supabase
      .from("companies")
      .upsert(rows, { onConflict: "slug", ignoreDuplicates: true })
      .select("id");

    if (insertError) {
      setCsvError(insertError.message);
      setUploading(false);
      return;
    }

    const inserted = data?.length ?? 0;
    const skipped = rows.length - inserted;
    setCsvResult({ inserted, skipped });
    setUploading(false);
    await fetchCompanies();
  };

  const openEdit = (c: Company) => {
    setEditingId(c.id);
    setForm({
      name: c.name,
      slug: c.slug,
      program_name: c.program_name,
      industry: c.industry,
      participation_year: c.participation_year ? String(c.participation_year) : "",
      description: c.description,
      website_url: c.website_url,
      status: c.status,
    });
    setError(null);
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const handleNameChange = (value: string) => {
    setForm((prev) => ({
      ...prev,
      name: value,
      slug: editingId ? prev.slug : slugify(value),
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("기업명을 입력해주세요."); return; }
    if (!form.slug.trim()) { setError("슬러그를 입력해주세요."); return; }
    const participationYear = parseParticipationYear(form.participation_year);
    if (Number.isNaN(participationYear)) {
      setError(`참여 년도는 ${PARTICIPATION_YEAR_MIN}-${PARTICIPATION_YEAR_MAX} 사이의 4자리 연도로 입력해주세요.`);
      return;
    }

    setSaving(true);
    setError(null);

    const payload = {
      name: form.name.trim(),
      slug: form.slug.trim(),
      program_name: form.program_name.trim() || "창구 프로그램",
      industry: form.industry.trim(),
      participation_year: participationYear,
      description: form.description.trim(),
      website_url: form.website_url.trim(),
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    if (editingId) {
      const { error } = await supabase
        .from("companies")
        .update(payload)
        .eq("id", editingId);
      if (error) { setError(error.message); setSaving(false); return; }
    } else {
      const { error } = await supabase.from("companies").insert(payload);
      if (error) { setError(error.message); setSaving(false); return; }
    }

    setSaving(false);
    cancelForm();
    await fetchCompanies();
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const { error } = await supabase.from("companies").delete().eq("id", deleteTarget.id);
    if (error) setError(error.message);
    setDeleting(false);
    setDeleteTarget(null);
    await fetchCompanies();
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const downloadCsvTemplate = () => {
    const content = `${CSV_TEMPLATE_HEADERS}\n${CSV_TEMPLATE_EXAMPLE}\n`;
    const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "companies-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const filtered = searchQuery.trim()
    ? companies.filter((c) => {
        const normalizedQuery = searchQuery.toLowerCase();
        return (
          c.name.toLowerCase().includes(normalizedQuery) ||
          c.industry.toLowerCase().includes(normalizedQuery) ||
          (c.participation_year ? String(c.participation_year).includes(normalizedQuery) : false)
        );
      })
    : companies;

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* 헤더 */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "var(--color-text-primary)" }}>참여 기업 관리</h2>
          <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--color-text-muted)" }}>
            기업을 등록하면 /companies 페이지에 카드로 노출됩니다.
          </p>
        </div>
        {!showForm && !showCsvUpload && (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button"
              onClick={openCsvUpload}
              style={{
                padding: "10px 18px",
                borderRadius: 12,
                border: `1px solid ${border}`,
                background: "transparent",
                color: "var(--color-text-secondary)",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
              CSV 업로드
            </button>
            <button
              type="button"
              onClick={openCreate}
              style={{
                padding: "10px 20px",
                borderRadius: 12,
                border: "none",
                background: "var(--color-accent-blue)",
                color: "var(--color-on-primary)",
                fontWeight: 700,
                fontSize: 14,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              기업 등록
            </button>
          </div>
        )}
      </div>

      {/* CSV 업로드 섹션 */}
      {showCsvUpload && (
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 16,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--color-text-primary)" }}>
            CSV 일괄 업로드
          </h3>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)", lineHeight: 1.6 }}>
              헤더: <code style={{ fontSize: 12, background: "var(--color-surface-subtle)", padding: "2px 6px", borderRadius: 4 }}>name,program_name,industry,participation_year,description,website_url</code>
              &nbsp;— slug는 자동 생성, 중복 slug는 skip됩니다.
            </p>
            <button
              type="button"
              onClick={downloadCsvTemplate}
              style={{
                padding: "7px 14px",
                borderRadius: 9,
                border: `1px solid ${border}`,
                background: "transparent",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
                fontSize: 12,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              양식 다운로드
            </button>
          </div>

          {/* 파일 선택 */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <label
              style={{
                padding: "9px 16px",
                borderRadius: 10,
                border: `1px solid ${border}`,
                background: "transparent",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
                fontSize: 13,
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                whiteSpace: "nowrap",
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              파일 선택
              <input
                type="file"
                accept=".csv,text/csv"
                style={{ display: "none" }}
                onChange={(e) => {
                  const f = e.target.files?.[0] ?? null;
                  setCsvFile(f);
                  setCsvResult(null);
                  setCsvError(null);
                }}
              />
            </label>
            <span style={{ fontSize: 13, color: csvFile ? "var(--color-text-primary)" : "var(--color-text-muted)" }}>
              {csvFile ? csvFile.name : "선택된 파일 없음"}
            </span>
          </div>

          {/* 결과 / 오류 */}
          {csvResult && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-accent-green)" }}>
              ✅ {csvResult.inserted}개 등록 완료
              {csvResult.skipped > 0 && `, ${csvResult.skipped}개 중복 skip`}
            </p>
          )}
          {csvError && (
            <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: "var(--color-brand-red)" }}>{csvError}</p>
          )}

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={closeCsvUpload}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: `1px solid ${border}`,
                background: "transparent",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              닫기
            </button>
            <button
              type="button"
              onClick={handleCsvUpload}
              disabled={!csvFile || uploading}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: !csvFile || uploading ? "var(--color-text-muted)" : "var(--color-accent-blue)",
                color: "var(--color-on-primary)",
                fontWeight: 700,
                fontSize: 14,
                cursor: !csvFile || uploading ? "not-allowed" : "pointer",
              }}
            >
              {uploading ? "업로드 중…" : "업로드"}
            </button>
          </div>
        </div>
      )}

      {/* 등록/수정 폼 */}
      {showForm && (
        <div
          style={{
            background: card,
            border: `1px solid ${border}`,
            borderRadius: 16,
            padding: "24px 28px",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: "var(--color-text-primary)" }}>
            {editingId ? "기업 정보 수정" : "새 기업 등록"}
          </h3>

          {/* 기업명 */}
          <div>
            <label style={labelStyle}>기업명 <span style={{ color: "var(--color-brand-red)" }}>*</span></label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="예: 삼성전자"
              style={inputStyle}
            />
          </div>

          {/* 슬러그 */}
          <div>
            <label style={labelStyle}>슬러그 (URL용) <span style={{ color: "var(--color-brand-red)" }}>*</span></label>
            <input
              type="text"
              value={form.slug}
              onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
              placeholder="예: samsung-electronics"
              style={inputStyle}
            />
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
              기업명 입력 시 자동 생성됩니다. /companies/{form.slug || "slug"} 경로로 사용됩니다.
            </p>
          </div>

          {/* 프로그램명 */}
          <div>
            <label style={labelStyle}>프로그램명</label>
            <input
              type="text"
              value={form.program_name}
              onChange={(e) => setForm((p) => ({ ...p, program_name: e.target.value }))}
              placeholder="예: 창구 프로그램"
              style={inputStyle}
            />
          </div>

          {/* 분야 */}
          <div>
            <label style={labelStyle}>분야</label>
            <input
              type="text"
              value={form.industry}
              onChange={(e) => setForm((p) => ({ ...p, industry: e.target.value }))}
              placeholder="예: 핀테크, AI, 바이오헬스"
              style={inputStyle}
            />
          </div>

          {/* 참여 년도 */}
          <div>
            <label style={labelStyle}>참여 년도</label>
            <input
              type="number"
              min={PARTICIPATION_YEAR_MIN}
              max={PARTICIPATION_YEAR_MAX}
              value={form.participation_year}
              onChange={(e) => setForm((p) => ({ ...p, participation_year: e.target.value }))}
              placeholder="예: 2026"
              style={inputStyle}
            />
            <p style={{ margin: "5px 0 0", fontSize: 12, color: "var(--color-text-muted)" }}>
              공개 카드와 상세 모달에 “2026년 참여” 형식으로 표시됩니다.
            </p>
          </div>

          {/* 설명 */}
          <div>
            <label style={labelStyle}>설명</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="기업 소개를 입력하세요."
              rows={4}
              style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }}
            />
          </div>

          {/* 웹사이트 */}
          <div>
            <label style={labelStyle}>웹사이트 주소</label>
            <input
              type="url"
              value={form.website_url}
              onChange={(e) => setForm((p) => ({ ...p, website_url: e.target.value }))}
              placeholder="https://example.com"
              style={inputStyle}
            />
          </div>

          {/* 공개 여부 */}
          <div>
            <label style={labelStyle}>공개 여부</label>
            <div style={{ display: "flex", gap: 10 }}>
              {(["published", "draft"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, status: s }))}
                  style={{
                    padding: "8px 16px",
                    borderRadius: 10,
                    border: `1px solid ${form.status === s ? "var(--color-accent-blue)" : border}`,
                    background: form.status === s ? "var(--color-accent-blue-soft-bg)" : "transparent",
                    color: form.status === s ? "var(--color-accent-blue)" : "var(--color-text-muted)",
                    fontWeight: form.status === s ? 700 : 500,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  {s === "published" ? "공개" : "비공개"}
                </button>
              ))}
            </div>
          </div>

          {/* 에러 메시지 */}
          {error && (
            <p style={{ margin: 0, fontSize: 13, color: "var(--color-brand-red)", fontWeight: 600 }}>{error}</p>
          )}

          {/* 버튼 */}
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={cancelForm}
              style={{
                padding: "10px 18px",
                borderRadius: 10,
                border: `1px solid ${border}`,
                background: "transparent",
                color: "var(--color-text-secondary)",
                fontWeight: 600,
                fontSize: 14,
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "none",
                background: saving ? "var(--color-text-muted)" : "var(--color-accent-blue)",
                color: "var(--color-on-primary)",
                fontWeight: 700,
                fontSize: 14,
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "저장 중…" : editingId ? "수정 완료" : "등록"}
            </button>
          </div>
        </div>
      )}

      {/* 검색 박스 */}
      {!loading && companies.length > 0 && (
        <SearchInput
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="기업명 또는 분야 검색…"
          className="max-w-[360px]"
        />
      )}

      {/* 목록 */}
      {loading ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: 14 }}>불러오는 중…</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "var(--color-text-muted)", fontSize: 14, textAlign: "center", padding: "60px 0" }}>
          {searchQuery ? `"${searchQuery}"에 해당하는 기업이 없습니다.` : "등록된 참여 기업이 없습니다."}
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <p style={{ margin: 0, fontSize: 13, color: "var(--color-text-muted)" }}>
            {searchQuery ? `${filtered.length}개 검색됨 (전체 ${companies.length}개)` : `전체 ${companies.length}개`}
          </p>
          {paged.map((c) => (
            <div
              key={c.id}
              style={{
                background: card,
                border: `1px solid ${border}`,
                borderRadius: 14,
                padding: "16px 20px",
                display: "flex",
                alignItems: "center",
                gap: 16,
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: "var(--color-text-primary)" }}>
                    {c.name}
                  </span>
                  <span style={getStatusPillStyle(c.status === "published" ? "var(--color-accent-green)" : "var(--color-neutral)")}>
                    {c.status === "published" ? "공개" : "비공개"}
                  </span>
                </div>
                <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                  {c.participation_year && (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
                      {c.participation_year}년 참여
                    </span>
                  )}
                  {c.industry && (
                    <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>{c.industry}</span>
                  )}
                  <span style={{ fontSize: 12, color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                    /{c.slug}
                  </span>
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => openEdit(c)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    border: `1px solid ${border}`,
                    background: "transparent",
                    color: "var(--color-text-secondary)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  수정
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(c)}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 9,
                    border: `1px solid ${deleteBorder}`,
                    background: deleteBg,
                    color: "var(--color-brand-red)",
                    fontWeight: 600,
                    fontSize: 13,
                    cursor: "pointer",
                  }}
                >
                  삭제
                </button>
              </div>
            </div>
          ))}
          <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-4" />
        </div>
      )}

      {/* 삭제 확인 모달 */}
      {deleteTarget && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "var(--color-backdrop)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "var(--color-bg-elevated)",
              border: `1px solid ${border}`,
              borderRadius: 20,
              padding: "32px 36px",
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
            }}
          >
            <p style={{ margin: "0 0 8px", fontSize: 16, fontWeight: 800, color: "var(--color-text-primary)" }}>
              기업 삭제
            </p>
            <p style={{ margin: "0 0 24px", fontSize: 14, color: "var(--color-text-secondary)", lineHeight: 1.6 }}>
              <strong>{deleteTarget.name}</strong>을(를) 삭제하시겠습니까?<br />이 작업은 되돌릴 수 없습니다.
            </p>
            <div style={{ display: "flex", gap: 10, justifyContent: "center" }}>
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: `1px solid ${border}`,
                  background: "transparent",
                  color: "var(--color-text-secondary)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "pointer",
                }}
              >
                취소
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleting}
                style={{
                  padding: "10px 20px",
                  borderRadius: 10,
                  border: "none",
                  background: deleting ? "var(--color-neutral)" : "var(--color-brand-red)",
                  color: "var(--color-on-primary)",
                  fontWeight: 700,
                  fontSize: 14,
                  cursor: deleting ? "not-allowed" : "pointer",
                }}
              >
                {deleting ? "삭제 중…" : "삭제"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
