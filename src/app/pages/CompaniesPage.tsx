import { useState, useEffect } from "react";
import { useSearchParams } from "react-router";
import { Globe, X } from "lucide-react";
import { LAYERS } from "../../lib/layers";
import { PageShell } from "../components/PageShell";
import { BoardAccessGate } from "../components/BoardAccessGate";
import { SearchInput } from "../components/SearchInput";
import { supabase } from "../../lib/supabaseClient";
import { LoadingSpinner, ErrorMessage } from "../components/LoadingSpinner";
import { getMutedLabelStyle, getStatusPillStyle, getFilterTabStyle } from "../components/contentListStyles";
import type { Company } from "../../lib/types";
import { AppPagination } from "../components/AppPagination";
import { useTheme } from "../ThemeContext";
import { useAuthGate } from "../../hooks/useAuthGate";
import { useBoardCategoryLabel, useBoardCategoryDescription } from "../BoardCategoriesContext";

const PAGE_SIZE = 20;


export function CompaniesPage() {
  const { isDark } = useTheme();
  const boardTitle = useBoardCategoryLabel("companies", "참여 기업");
  const boardSubtitle = useBoardCategoryDescription("companies", "Google for Startups 프로그램에 참여한 기업들을 만나보세요.");
  const { isAuthed, requireAuth, redirectToLogin } = useAuthGate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [query, setQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [activeYear, setActiveYear] = useState<number | null>(null);
  const [activeProgram, setActiveProgram] = useState<string | null>(null);

  const detailSlug = searchParams.get("detail");
  const detailCompany = detailSlug && !loading ? (companies.find(c => c.slug === detailSlug) ?? null) : null;
  const detailNotFound = !loading && !!detailSlug && !detailCompany;

  // gated: 목록은 공개, 기업 상세(?detail=)는 로그인 필요. URL 직접 접근도 차단.
  useEffect(() => {
    if (detailSlug && isAuthed === false) redirectToLogin();
  }, [detailSlug, isAuthed, redirectToLogin]);

  useEffect(() => {
    const fetchCompanies = async () => {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("status", "published")
        .order("name", { ascending: true });
      if (error) setError(true);
      else setCompanies(data || []);
      setLoading(false);
    };
    fetchCompanies();
  }, []);

  useEffect(() => {
    if (!detailSlug) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setSearchParams({}); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [detailSlug, setSearchParams]);

  const years = [...new Set(companies.map((c) => c.participation_year).filter((y): y is number => y !== null))].sort((a, b) => b - a);

  const filtered = companies.filter((c) => {
    if (activeProgram !== null && c.program_name !== activeProgram) return false;
    if (activeYear !== null && c.participation_year !== activeYear) return false;
    if (query.trim()) {
      const q = query.toLowerCase();
      if (!c.name.toLowerCase().includes(q) && !c.industry.toLowerCase().includes(q) && !(c.participation_year ? String(c.participation_year).includes(q) : false)) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
  };

  const handleYearFilter = (year: number | null) => {
    setActiveYear(year);
    setCurrentPage(1);
  };

  const handleProgramFilter = (program: string | null) => {
    setActiveProgram(program);
    setCurrentPage(1);
  };

  const closeModal = () => setSearchParams({});

  return (
    <BoardAccessGate category="companies">
    <PageShell
      title={boardTitle}
      subtitle={boardSubtitle}
    >
      <div className="max-w-[1100px] mx-auto pb-[100px]">
        {/* 검색창 */}
        <SearchInput
          value={query}
          onChange={handleQueryChange}
          placeholder="기업명 또는 분야로 검색"
          className="mb-5"
        />

        {/* 프로그램명 필터 */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 10 }}>
          <button type="button" onClick={() => handleProgramFilter(null)} style={getFilterTabStyle(isDark, activeProgram === null)}>
            전체
          </button>
          {[...new Set(companies.map((c) => c.program_name))].sort().map((p) => (
            <button key={p} type="button" onClick={() => handleProgramFilter(p)} style={getFilterTabStyle(isDark, activeProgram === p)}>
              {p}
            </button>
          ))}
        </div>

        {/* 년도 필터 */}
        {years.length > 0 && (
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 32 }}>
            <button type="button" onClick={() => handleYearFilter(null)} style={getFilterTabStyle(isDark, activeYear === null)}>
              전체
            </button>
            {years.map((y) => (
              <button key={y} type="button" onClick={() => handleYearFilter(y)} style={getFilterTabStyle(isDark, activeYear === y)}>
                {y}
              </button>
            ))}
          </div>
        )}

        {/* 컨텐츠 영역 */}
        {loading ? (
          <LoadingSpinner />
        ) : error ? (
          <ErrorMessage />
        ) : filtered.length === 0 ? (
          <p className="text-center py-[100px] text-[15px]" style={{ color: "var(--color-text-muted)" }}>
            {query ? `"${query}"에 해당하는 기업이 없습니다.` : "등록된 참여 기업이 없습니다."}
          </p>
        ) : (
          <>
            <p className="mb-5 text-[13px]" style={{ color: "var(--color-text-muted)" }}>
              총 {filtered.length}개 기업
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {paged.map((company) => (
                <CompanyCard
                  key={company.id}
                  company={company}
                  onClick={() => requireAuth(() => setSearchParams({ detail: company.slug }))}
                />
              ))}
            </div>
            <AppPagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} className="mt-10" />
          </>
        )}
      </div>

      {/* 기업 상세 모달 (로그인 사용자만) */}
      {detailSlug && isAuthed && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--color-backdrop)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: LAYERS.modal, padding: 20 }}
          onClick={closeModal}
        >
          <div
            style={{ background: "var(--color-bg-elevated)", border: "1px solid var(--color-border-soft)", borderRadius: 24, padding: "36px 32px", width: "100%", maxWidth: 560, boxShadow: "var(--shadow-dialog)", maxHeight: "85vh", overflowY: "auto" }}
            onClick={e => e.stopPropagation()}
          >
            {loading ? (
              <LoadingSpinner />
            ) : detailNotFound ? (
              <div style={{ textAlign: "center", padding: "24px 0" }}>
                <p style={{ color: "var(--color-text-muted)", marginBottom: 20 }}>해당 기업 정보를 찾을 수 없습니다.</p>
                <button
                  type="button"
                  onClick={closeModal}
                  style={{ padding: "10px 24px", borderRadius: 12, border: "none", background: "var(--color-accent-blue)", color: "var(--color-on-primary)", fontWeight: 700, cursor: "pointer" }}
                >
                  닫기
                </button>
              </div>
            ) : detailCompany ? (
              <CompanyModal company={detailCompany} onClose={closeModal} />
            ) : null}
          </div>
        </div>
      )}
    </PageShell>
    </BoardAccessGate>
  );
}

function CompanyCard({ company, onClick }: { company: Company; onClick: () => void }) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="company-card flex flex-col gap-3 rounded-2xl p-6 cursor-pointer transition-all duration-200 ease-out hover:-translate-y-1"
      style={{
        background: "var(--color-surface-card)",
        border: "1px solid var(--color-border-soft)",
        boxShadow: "var(--shadow-card-rest)",
      }}
    >
      {/* 메타 배지 */}
      {company.participation_year && (
        <div className="flex flex-wrap gap-2">
          <span style={getMutedLabelStyle()}>
            {company.participation_year}
          </span>
          <span style={getStatusPillStyle("var(--color-accent-blue)")}>
            {company.program_name}
          </span>
        </div>
      )}

      {/* 기업명 */}
      <h2
        className="m-0 text-[17px] font-bold leading-tight"
        style={{ color: "var(--color-text-primary)" }}
      >
        {company.name}
      </h2>

      {/* 설명 요약 */}
      {company.description && (
        <p
          className="m-0 text-[13px] leading-relaxed line-clamp-3"
          style={{ color: "var(--color-text-secondary)" }}
        >
          {company.description}
        </p>
      )}

      {/* 더보기 화살표 */}
      <div className="mt-auto flex items-center gap-1 pt-2" style={{ color: "var(--color-accent-blue)" }}>
        <span className="text-[12px] font-semibold">자세히 보기</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </div>
    </div>
  );
}

function CompanyModal({ company, onClose }: { company: Company; onClose: () => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* 헤더: 배지 + 기업명 + 닫기 */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <span style={company.industry ? getStatusPillStyle("var(--color-accent-blue)") : getMutedLabelStyle()}>
              {company.industry || "분야 미입력"}
            </span>
          </div>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "var(--color-text-primary)", lineHeight: 1.3 }}>
            {company.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: 4, flexShrink: 0 }}
          aria-label="닫기"
        >
          <X size={20} />
        </button>
      </div>

      {/* 구분선 */}
      <div style={{ height: "1px", background: "var(--color-border-soft)" }} />

      {/* 참여 정보 */}
      <section>
        <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          참여 정보
        </h3>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "var(--color-text-secondary)" }}>
          {company.participation_year ? `${company.participation_year}년 행사 참여 기업` : "참여 년도 정보가 없습니다."}
        </p>
      </section>

      <section>
        <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          소개
        </h3>
        <p style={{ margin: 0, fontSize: 15, lineHeight: 1.7, color: "var(--color-text-secondary)", whiteSpace: "pre-wrap" }}>
          {company.description || "소개 정보가 없습니다."}
        </p>
      </section>

      {/* 웹사이트 */}
      <section>
        <h3 style={{ margin: "0 0 10px", fontSize: 12, fontWeight: 700, color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          웹사이트
        </h3>
        {company.website_url ? (
          <a
            href={company.website_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 15, color: "var(--color-accent-blue)", textDecoration: "none" }}
          >
            <Globe size={15} style={{ flexShrink: 0 }} />
            {company.website_url}
          </a>
        ) : (
          <p style={{ margin: 0, fontSize: 15, color: "var(--color-text-muted)" }}>미입력</p>
        )}
      </section>
    </div>
  );
}
