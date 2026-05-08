import { useState } from "react";
import { useTheme } from "../../ThemeContext";

type Filter = "all" | "s01" | "s02" | "s03" | "s04" | "s05" | "s06";

export function AdminFlowMap() {
  const { isDark } = useTheme();
  const [active, setActive] = useState<Filter>("all");

  const textMain  = isDark ? "rgba(255,255,255,0.92)" : "#111827";
  const textMuted = isDark ? "rgba(255,255,255,0.45)" : "#6b7280";
  const border    = isDark ? "rgba(255,255,255,0.08)" : "#e5e7eb";
  const cardBg    = isDark ? "rgba(255,255,255,0.04)" : "#fafafa";
  const filterBg  = isDark ? "rgba(255,255,255,0.03)" : "#f9fafb";
  const connectorColor = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
  const secItemBg = isDark ? "rgba(168,85,247,0.06)" : "#fdfcff";
  const secBorder = isDark ? "rgba(168,85,247,0.2)"  : "#e9d5ff";
  const codeBg    = isDark ? "rgba(168,85,247,0.15)" : "#f5f3ff";
  const codeColor = "var(--color-brand-blue)";

  const N = (type: "user" | "admin" | "sys" | "ok" | "sec") => {
    const map = {
      user:  { bg: isDark ? "rgba(67,119,241,0.15)"  : "#eff6ff", bd: isDark ? "rgba(67,119,241,0.35)"  : "#bfdbfe", cl: isDark ? "#93b4f8" : "#1d4ed8" },
      admin: { bg: isDark ? "rgba(234,67,53,0.13)"   : "#fef2f2", bd: isDark ? "rgba(234,67,53,0.32)"   : "#fecaca", cl: isDark ? "#f8a09a" : "#dc2626" },
      sys:   { bg: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb", bd: isDark ? "rgba(255,255,255,0.12)" : "#e5e7eb", cl: textMuted },
      ok:    { bg: isDark ? "rgba(24,163,67,0.12)"   : "#f0fdf4", bd: isDark ? "rgba(24,163,67,0.30)"   : "#bbf7d0", cl: isDark ? "#86efac" : "#15803d" },
      sec:   { bg: isDark ? "rgba(168,85,247,0.12)"  : "#faf5ff", bd: isDark ? "rgba(168,85,247,0.30)"  : "#e9d5ff", cl: isDark ? "#c4b5fd" : "#7c3aed" },
    }[type];
    return {
      display: "inline-flex" as const, alignItems: "center", padding: "8px 14px",
      borderRadius: 8, fontSize: 13, fontWeight: 600, border: `1px solid ${map.bd}`,
      background: map.bg, color: map.cl, whiteSpace: "nowrap" as const,
    };
  };

  const dot = (type: "user" | "admin" | "sys" | "ok" | "sec") => {
    const map = {
      user:  { bg: isDark ? "rgba(67,119,241,0.15)"  : "#eff6ff", bd: isDark ? "#93b4f8" : "#93c5fd", cl: isDark ? "#93b4f8" : "#2563eb" },
      admin: { bg: isDark ? "rgba(234,67,53,0.13)"   : "#fef2f2", bd: isDark ? "#f8a09a" : "#fca5a5", cl: isDark ? "#f8a09a" : "#dc2626" },
      sys:   { bg: isDark ? "rgba(255,255,255,0.05)" : "#f9fafb", bd: isDark ? "rgba(255,255,255,0.2)": "#d1d5db", cl: textMuted },
      ok:    { bg: isDark ? "rgba(24,163,67,0.12)"   : "#f0fdf4", bd: isDark ? "#86efac" : "#86efac",  cl: isDark ? "#86efac" : "#15803d" },
      sec:   { bg: isDark ? "rgba(168,85,247,0.12)"  : "#faf5ff", bd: isDark ? "#c4b5fd" : "#c4b5fd",  cl: isDark ? "#c4b5fd" : "#7c3aed" },
    }[type];
    return {
      width: 26, height: 26, borderRadius: "99px", border: `1.5px solid ${map.bd}`,
      display: "flex", alignItems: "center", justifyContent: "center",
      fontSize: 10, fontWeight: 800, flexShrink: 0, marginTop: 2,
      background: map.bg, color: map.cl,
    };
  };

  const arr  = <span style={{ color: textMuted, padding: "0 6px", userSelect: "none" as const }}>→</span>;
  const conn = <div style={{ width: 1, height: 12, background: connectorColor, marginLeft: 12 }} />;

  const Step = ({ type, actor, desc, sub }: { type: "user"|"admin"|"sys"|"ok"|"sec"; actor: string; desc: string; sub?: string }) => (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
      <div style={dot(type)}>{type === "ok" ? "✓" : type[0].toUpperCase()}</div>
      <div style={{ flex: 1, paddingBottom: 14 }}>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase" as const, marginBottom: 3, color: dot(type).color }}>{actor}</div>
        <div style={{ fontSize: 13, fontWeight: 500, color: textMain }}>{desc}</div>
        {sub && <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );

  const Card = ({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) => (
    <div style={{ background: cardBg, border: `1px solid ${border}`, borderRadius: 12, padding: 24, ...style }}>{children}</div>
  );

  const SectionWrap = ({ id, title, num, children }: { id: Filter; title: string; num: string; children: React.ReactNode }) => {
    if (active !== "all" && active !== id) return null;
    return (
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 20 }}>
          <span style={{ fontSize: 11, color: textMuted, fontWeight: 600 }}>{num}</span>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.08em", color: textMain }}>{title}</h3>
          <div style={{ flex: 1, height: 1, background: border }} />
        </div>
        {children}
      </div>
    );
  };

  const Code = ({ children }: { children: React.ReactNode }) => (
    <code style={{ fontFamily: `"SF Mono", monospace`, fontSize: 11, color: codeColor, background: codeBg, padding: "2px 6px", borderRadius: 4 }}>{children}</code>
  );

  const filters: { id: Filter; label: string }[] = [
    { id: "all",  label: "전체" },
    { id: "s01",  label: "01  접속 및 권한 분기" },
    { id: "s02",  label: "02  핵심 기능 흐름" },
    { id: "s03",  label: "03  어드민 대시보드" },
    { id: "s04",  label: "04  보안 구조" },
    { id: "s05",  label: "05  실시간 동기화" },
    { id: "s06",  label: "06  PII 처리 흐름" },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <h3 style={{ fontSize: 22, fontWeight: 800, color: textMain, marginBottom: 8 }}>서비스 흐름도</h3>
      <p style={{ fontSize: 13, color: textMuted, marginBottom: 28 }}>기능 흐름 및 보안 구조 · 어드민 전용</p>

      {/* 범례 */}
      <div style={{ display: "flex", gap: 20, flexWrap: "wrap", marginBottom: 20 }}>
        {[
          { color: "#2563eb", label: "참여사 행동" },
          { color: "#dc2626", label: "어드민 행동" },
          { color: textMuted, label: "시스템 자동 처리" },
          { color: "#15803d", label: "완료" },
          { color: "#7c3aed", label: "보안 검사" },
        ].map(l => (
          <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 7, fontSize: 12, color: textMuted }}>
            <div style={{ width: 24, height: 3, borderRadius: 2, background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {/* 필터 바 */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: 14, background: filterBg, border: `1px solid ${border}`, borderRadius: 12, marginBottom: 40 }}>
        {filters.map(f => (
          <button
            key={f.id}
            onClick={() => setActive(f.id)}
            style={{
              padding: "8px 16px", borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: "pointer",
              fontFamily: "inherit", transition: "all 0.15s",
              background: active === f.id ? (isDark ? "rgba(255,255,255,0.92)" : "#111827") : "transparent",
              color: active === f.id ? (isDark ? "#111827" : "#fff") : textMuted,
              border: active === f.id ? "none" : `1px solid ${border}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* 01 — 접속 및 권한 분기 */}
      <SectionWrap id="s01" num="01" title="접속 및 권한 분기">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 24 }}>
              <div style={N("user")}>사이트 접속</div>{arr}
              <div style={N("user")}>이메일 + 비밀번호 로그인</div>{arr}
              <div style={N("sec")}>아이디 · 비밀번호 검증</div>{arr}
              <div style={N("sys")}>profiles.role 조회</div>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "admin",      type: "admin" as const, text: "어드민 대시보드 + 모든 페이지 접근 (MFA 인증 후)" },
                { label: "participant",type: "user"  as const, text: "일반 페이지 + 사업비 자료실 (/expenses)" },
                { label: "user",       type: "sys"   as const, text: "일반 페이지 (공지 · 컨설팅 · Founder's Club)" },
                { label: "비로그인",   type: "sys"   as const, text: "메인 페이지 · 공개 공지만 열람" },
              ].map(r => (
                <div key={r.label} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: textMuted, width: 80, textAlign: "right", flexShrink: 0 }}>{r.label}</span>
                  <div style={N(r.type)}>{r.text}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* 어드민 MFA 분기 상세 */}
          <Card style={{ borderColor: secBorder, background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 14 }}>어드민 로그인 MFA 분기 상세</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>MFA 등록 완료된 어드민</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Step type="sec" actor="시스템" desc="listFactors() — verified TOTP 확인" sub="aal2 미달성 시 OTP 챌린지 화면 표시" />
                  {conn}
                  <Step type="admin" actor="어드민" desc="인증 앱의 6자리 TOTP 코드 입력" />
                  {conn}
                  <Step type="sec" actor="시스템" desc="mfa.challenge() + mfa.verify() 검증" sub="is_admin() — aal2 세션 필수 확인" />
                  {conn}
                  <Step type="ok" actor="완료" desc="aal2 세션 확립 → 어드민 대시보드 이동" />
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: textMuted, marginBottom: 10, textTransform: "uppercase" as const, letterSpacing: "0.05em" }}>MFA 미등록 어드민</div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <Step type="sec" actor="시스템" desc="listFactors() — verified 팩터 없음 감지" sub="sessionStorage에 mfa_setup_required 플래그 저장" />
                  {conn}
                  <Step type="sys" actor="시스템" desc="/mypage 강제 이동" sub="어드민 대시보드 접근 불가" />
                  {conn}
                  <Step type="admin" actor="어드민" desc="MyPage에서 TOTP 인증 앱 등록" sub="QR 코드 스캔 → 6자리 코드 확인" />
                  {conn}
                  <Step type="ok" actor="완료" desc="MFA 등록 완료 → 다음 로그인부터 OTP 요구" />
                </div>
              </div>
            </div>
          </Card>
        </div>
      </SectionWrap>

      {/* 02 — 핵심 기능 흐름 */}
      <SectionWrap id="s02" num="02" title="핵심 기능 흐름">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>

          {/* 공지·행사 */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>공지 · 행사 확인</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Step type="admin" actor="어드민" desc="게시물 작성 및 카테고리 지정" sub="공지 / 행사 / 미디어 / 커뮤니티 / FAQ" />
              {conn}
              <Step type="sys" actor="시스템" desc="카테고리별 섹션에 자동 노출" sub="posts 테이블 → 각 섹션 컴포넌트" />
              {conn}
              <Step type="user" actor="참여사" desc="공지 확인 및 상세 열람" sub="한국어 / 영어 전환 가능" />
              {conn}
              <Step type="ok" actor="완료" desc="조회수 +1 기록" sub="30분 내 재방문은 중복 집계 안 함" />
            </div>
          </Card>

          {/* 컨설팅 예약 */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>컨설팅 예약</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Step type="admin" actor="어드민" desc="전문가 등록" sub="법률 / 글로벌 / 기술 분야" />
              {conn}
              <Step type="admin" actor="어드민" desc="슬롯 추가" sub="날짜 · 시간 · 소요 시간 설정" />
              {conn}
              <Step type="user" actor="참여사" desc="전문가 목록 확인 후 시간대 선택" />
              {conn}
              <Step type="user" actor="참여사" desc="신청 사유 작성 후 제출" />
              {conn}
              <Step type="sys" actor="시스템" desc="중복 예약 차단" sub="슬롯당 1건만 허용 (DB UNIQUE 제약)" />
              {conn}
              <Step type="admin" actor="어드민" desc="예약 확정 또는 거절" />
              {conn}
              <Step type="ok" actor="완료" desc='슬롯 상태 → "예약됨" 전환' />
            </div>
          </Card>

          {/* Founder's Club */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>Founder's Club</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Step type="admin" actor="어드민" desc="세션 개설" sub="주제 · 날짜 · 시간 · 최대 정원 (최대 10명)" />
              {conn}
              <Step type="user" actor="참여사" desc="모집 중 세션 확인 및 신청" sub="진행 바로 잔여 자리 시각 표시" />
              {conn}
              <Step type="sys" actor="시스템" desc="중복 신청 차단" sub="동일 사용자 · 동일 세션 재신청 불가" />
              {conn}
              <Step type="admin" actor="어드민" desc="신청자 수락 또는 거절" />
              {conn}
              <Step type="sys" actor="시스템" desc="수락 인원 = 정원 도달 시 자동 마감" sub='status → "closed" 전환' />
              {conn}
              <Step type="ok" actor="완료" desc="수락된 참여자 목록 확정" />
            </div>
          </Card>

          {/* 행사 참가 신청 */}
          <Card>
            <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>행사 참가 신청</div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <Step type="user" actor="참여사" desc="행사 목록에서 신청하기 클릭" sub="/events/:id/apply 진입" />
              {conn}
              <Step type="user" actor="참여사" desc="행사 신청 폼 작성 및 제출" sub="기본 정보 + 추가 질문 + 동의 항목" />
              {conn}
              <Step type="sys" actor="시스템" desc="중복 신청 차단" sub="(post_id, user_id) UNIQUE 제약" />
              {conn}
              <Step type="admin" actor="어드민" desc="행사 관리 탭에서 승인/거절 처리" sub="대기 신청 목록에서 상태 변경" />
              {conn}
              <Step type="sys" actor="시스템" desc="승인 인원 기준 잔여석 자동 계산" sub="capacity - accepted_count → slots_remaining" />
              {conn}
              <Step type="ok" actor="완료" desc="MyPage에서 신청 상태 확인" sub="필요 시 사용자 취소 및 관리자 상태 보정 가능" />
            </div>
          </Card>
        </div>
      </SectionWrap>

      {/* 03 — 어드민 대시보드 구조 */}
      <SectionWrap id="s03" num="03" title="어드민 대시보드 구조">
        <Card>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 10 }}>
            {[
              { title: "대시보드",        desc: "방문자 수\n게시물 통계\n가입자 추이" },
              { title: "회원 관리",        desc: "역할 변경\n(비밀번호 재확인 필요)\n본인 계정 수정 불가" },
              { title: "게시물 작성",      desc: "공지 · 행사 등\n이미지 업로드\n한/영 입력" },
              { title: "게시물 관리",      desc: "수정 · 삭제\n카테고리 · 상태\n변경" },
              { title: "컨설팅 관리",      desc: "전문가 등록\n슬롯 추가\n예약 승인" },
              { title: "Founder's Club",  desc: "세션 개설\n신청자\n수락 / 거절" },
            ].map(t => (
              <div key={t.title} style={{ border: `1px solid ${border}`, borderRadius: 10, padding: "16px 10px", textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: textMain, marginBottom: 8 }}>{t.title}</div>
                <div style={{ fontSize: 11, color: textMuted, lineHeight: 1.7, whiteSpace: "pre-line" }}>{t.desc}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: "12px 16px", background: isDark ? "rgba(234,67,53,0.08)" : "#fef2f2", border: `1px solid ${isDark ? "rgba(234,67,53,0.2)" : "#fecaca"}`, borderRadius: 8, fontSize: 12, color: "var(--color-brand-red)" }}>
            <strong>회원 관리 — 역할 변경 보안:</strong> admin 역할 부여·박탈 시 현재 어드민 비밀번호 재확인 필요. 어드민 본인 계정의 역할은 UI와 로직 양쪽에서 수정 차단됨.
          </div>
        </Card>
      </SectionWrap>

      {/* 04 — 보안 구조 */}
      <SectionWrap id="s04" num="04" title="보안 구조">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>라우트 보호 (Frontend Gate)</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              <Code>/admin</Code> 경로는 <Code>AdminRoute</Code> 컴포넌트가 감싸고 있어, admin이 아닌 사용자가 URL을 직접 입력해도 메인 페이지(/)로 강제 이동됩니다.<br /><br />
              <Code>/expenses</Code>는 페이지 진입 후 DB에서 role을 직접 조회해 participant 또는 admin이 아니면 접근을 차단합니다.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>데이터베이스 RLS (Row Level Security)</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              Supabase의 RLS 정책으로 DB 레벨에서 접근을 이중 차단합니다. 프론트엔드를 우회하더라도 데이터를 읽거나 쓸 수 없습니다.<br /><br />
              어드민 쓰기 작업은 DB 내 <Code>is_admin()</Code> 함수로 검증합니다. MFA 등록 어드민은 <Code>aal2</Code> 세션이 없으면 is_admin() 검증 불통과. profiles는 본인 행만 조회 가능.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>회원 PII 암호화 (AES-256-GCM)</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              <Code>profiles.name</Code> · <Code>email</Code> · <Code>phone</Code> 은 AES-256-GCM으로 암호화되어 DB에 저장됩니다.<br /><br />
              저장 형식: <Code>enc:v1:{"<iv>"}:{"<ciphertext>"}:{"<authtag>"}</Code><br /><br />
              복호화는 반드시 Edge Function을 통해 서버 측에서 수행됩니다. 클라이언트에서 암호화 키에 직접 접근할 수 없습니다.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>어드민 MFA 강제 (TOTP 2단계 인증)</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              어드민 계정은 반드시 TOTP 인증 앱을 등록해야 합니다. 미등록 시 로그인 후 <Code>/mypage</Code>로 강제 이동되어 등록 전까지 어드민 대시보드에 접근할 수 없습니다.<br /><br />
              로그인 후 <Code>listFactors()</Code>로 등록 여부 확인 → <Code>aal2</Code> 세션 미달성 시 OTP 입력 화면 표시.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>역할 변경 비밀번호 재확인</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              admin 역할 부여·박탈 시 현재 어드민의 비밀번호를 모달로 재확인합니다.<br /><br />
              검증은 no-op 스토리지 임시 클라이언트(<Code>persistSession: false</Code>)로 수행 — 기존 <Code>aal2</Code> 세션을 절대 덮어쓰지 않습니다. 어드민 본인 계정 역할 수정은 UI + 로직 양쪽에서 차단됩니다.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>XSS 방지 (Cross-Site Scripting)</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              게시물 본문 렌더링 전 항상 <Code>DOMPurify.sanitize()</Code>를 통과시켜 악성 스크립트 삽입을 방지합니다.<br /><br />
              적용 위치: PostDetailPage, FaqPage
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>자동 로그아웃 (Idle + Stale Session)</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              <strong>유휴 로그아웃 (2단계):</strong> <Code>useIdleLogout</Code> 훅이 모든 페이지에서 실행. 28분 무활동 → 경고 모달 표시 → 2분 추가 무활동 → 자동 세션 종료 + 로그인 페이지 황색 배너 표시.<br /><br />
              <strong>브라우저 닫기 세션:</strong> <Code>pagehide</Code> · <Code>beforeunload</Code> 이벤트로 종료 시각을 <Code>gxp_last_active</Code>(localStorage)에 기록. 다음 접속 시 30분 초과 경과 확인 후 자동 로그아웃.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>이중 예약 방지 (DB Constraint)</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              <Code>consulting_reservations.slot_id</Code>에 UNIQUE 제약 — 슬롯당 1건만 허용.<br /><br />
              Founder's Club도 <Code>(session_id, user_id)</Code> 조합 UNIQUE 제약으로 중복 신청 차단.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>스토리지 버킷 강화</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              <Code>images</Code> 버킷에 서버 레벨 제한 적용: 파일 크기 10MB 이하, MIME 타입 <Code>image/*</Code> 허용 (SVG 제외).<br /><br />
              클라이언트 측 검사(<Code>accept="image/*"</Code>)만으로는 우회 가능하므로, 서버 버킷 정책이 최종 방어선 역할을 합니다.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>조회수 보호 + page_views 레이트 리밋</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              게시물 상세 조회수는 <Code>increment_view_count(row_id, visitor_id)</Code> RPC와 <Code>post_view_events</Code> 기록을 통해 사용자/게시물 기준 30분 쿨다운을 적용합니다.<br /><br />
              DB 트리거로 동일 <Code>visitor_id</Code>에서 분당 최대 10건 제한 — DoS 방어.<br /><br />
              RLS 정책으로 추가 검증: 경로는 <Code>/</Code>로 시작해야 하고 512자 이하, User-Agent 1000자 이하.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>어드민 권한 분리 (Least Privilege)</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              프론트엔드 라우트 차단 + Supabase RLS + <Code>is_admin()</Code> DB 함수 + MFA <Code>aal2</Code> 세션 요구, 네 겹 보호.<br /><br />
              CSV 어드민 일괄 가져오기: 화이트리스트 필드만 허용(id, name, email, phone, company, role), UUID 필수, 대량 upsert 전 수동 확인 단계.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>관리자 Edge Function 게이트</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              service role을 사용하는 관리자 함수는 공통 <Code>requireVerifiedAdmin()</Code>을 통해 호출자 JWT를 검증합니다.<br /><br />
              내부에서 <Code>public.is_admin()</Code> RPC를 사용해 DB RLS와 동일한 기준(역할 + MFA <Code>aal2</Code>)으로 통과 여부를 판단합니다.<br /><br />
              대상 함수: <Code>decrypt-profiles</Code>, <Code>delete-user</Code>, <Code>bulk-register-users</Code>.
            </div>
          </div>

          <div style={{ border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 8 }}>Edge Function CORS 화이트리스트</div>
            <div style={{ fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151", lineHeight: 1.7 }}>
              Edge Function은 허용된 origin에서만 브라우저 호출을 수락합니다.<br /><br />
              허용 주소: <Code>https://globalxpass.com</Code>, <Code>https://google-play-changgoo-program.netlify.app</Code>, <Code>localhost/127.0.0.1</Code> Vite 개발 주소.<br /><br />
              배포 도메인 변경 시 CORS 목록 갱신 + 함수 재배포가 필요합니다.
            </div>
          </div>

          {/* 보안 흐름 요약 - 전체 폭 */}
          <div style={{ gridColumn: "1 / -1", border: `1px solid ${secBorder}`, borderRadius: 10, padding: "18px 20px", background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 12 }}>보안 검사 흐름 요약</div>
            <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
              <div style={N("user")}>사용자 요청</div>{arr}
              <div style={N("sec")}>Frontend Route Guard</div>{arr}
              <div style={N("sec")}>Supabase Auth 세션 확인</div>{arr}
              <div style={N("sec")}>MFA aal2 검증 (어드민)</div>{arr}
              <div style={N("sec")}>RLS 정책 (DB 레벨)</div>{arr}
              <div style={N("sec")}>is_admin() 검증 (쓰기 시)</div>{arr}
              <div style={N("ok")}>응답 반환</div>
            </div>
            <div style={{ marginTop: 10, fontSize: 11, color: textMuted }}>
              어느 단계에서든 검증 실패 시 요청이 거부됩니다. 프론트엔드 우회만으로는 데이터에 접근할 수 없습니다. 어드민은 MFA aal2 세션 없이 is_admin() 통과 불가.
            </div>
          </div>
        </div>
      </SectionWrap>

      {/* 05 — 실시간 동기화 */}
      <SectionWrap id="s05" num="05" title="실시간 동기화">
        <Card>
          <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 6 }}>
            <div style={N("user")}>신규 회원 가입</div>{arr}
            <div style={N("sys")}>Supabase Realtime — profiles 테이블 변경 감지</div>{arr}
            <div style={N("sec")}>decrypt-profiles Edge Function 재호출</div>{arr}
            <div style={N("admin")}>어드민 회원 목록 자동 갱신 (복호화된 PII)</div>{arr}
            <div style={N("ok")}>새로고침 없이 반영</div>
          </div>
          <div style={{ marginTop: 14, fontSize: 12, color: textMuted, borderTop: `1px solid ${border}`, paddingTop: 12 }}>
            profiles 변경(가입·역할 수정·정보 변경) 발생 시 Realtime 이벤트가 트리거되고, 어드민 대시보드는 <Code>decrypt-profiles</Code> Edge Function을 재호출하여 복호화된 최신 회원 목록을 표시합니다.<br /><br />
            컨설팅 예약 · Founder's Club 신청은 어드민이 해당 탭 진입 시 최신 데이터를 새로 불러옵니다.
          </div>
        </Card>
      </SectionWrap>

      {/* 06 — PII 처리 흐름 */}
      <SectionWrap id="s06" num="06" title="PII 처리 흐름">
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>

            {/* 회원가입 암호화 */}
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>회원가입 → PII 암호화</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Step type="user" actor="사용자" desc="회원가입 폼 제출" sub="name · email · phone · password" />
                {conn}
                <Step type="sys" actor="시스템" desc="supabase.auth.signUp()" sub="auth.users 행 생성" />
                {conn}
                <Step type="sys" actor="시스템" desc="handle_new_user DB 트리거 실행" sub="profiles 행 평문으로 삽입" />
                {conn}
                <Step type="sec" actor="Edge Fn" desc="encrypt-profile 호출" sub="AES-256-GCM으로 name·email·phone 암호화" />
                {conn}
                <Step type="sec" actor="시스템" desc="암호화 결과 분기 처리" sub="성공: enc:v1 저장 / 실패: 경고 노출 후 운영 점검 필요" />
              </div>
            </Card>

            {/* 어드민 회원 조회 */}
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>어드민 회원 목록 조회</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Step type="admin" actor="어드민" desc="어드민 대시보드 회원 관리 탭 접근" />
                {conn}
                <Step type="sec" actor="시스템" desc="JWT 검증 + is_admin() 확인" sub="aal2 세션 필수" />
                {conn}
                <Step type="sec" actor="Edge Fn" desc="decrypt-profiles 호출" sub="service role로 전체 profiles 조회" />
                {conn}
                <Step type="sys" actor="Edge Fn" desc="ENCRYPTION_SECRET_KEY로 복호화" sub="SHA-256(secret) → 32-byte AES 키" />
                {conn}
                <Step type="ok" actor="완료" desc="복호화된 회원 목록 JSON 반환" sub="name·email·phone 평문 표시" />
              </div>
            </Card>

            {/* 본인 프로필 조회 */}
            <Card>
              <div style={{ fontSize: 12, fontWeight: 700, color: textMuted, marginBottom: 16, paddingBottom: 12, borderBottom: `1px solid ${border}` }}>본인 프로필 조회 (MyPage)</div>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <Step type="user" actor="사용자" desc="MyPage 접근 (로그인 필요)" />
                {conn}
                <Step type="sec" actor="시스템" desc="JWT에서 user_id 추출" sub="본인 행만 접근 가능" />
                {conn}
                <Step type="sec" actor="Edge Fn" desc="decrypt-own-profile 호출" sub="관리자 권한 불필요 — 본인 행만 복호화" />
                {conn}
                <Step type="sys" actor="Edge Fn" desc="service role로 본인 row만 조회 후 복호화" />
                {conn}
                <Step type="ok" actor="완료" desc="복호화된 본인 프로필 JSON 반환" sub="이름·이메일·전화번호 평문 표시" />
              </div>
            </Card>
          </div>

          {/* 암호화 기술 상세 */}
          <Card style={{ borderColor: secBorder, background: secItemBg }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: codeColor, marginBottom: 12 }}>암호화 기술 상세</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, fontSize: 12, color: isDark ? "rgba(255,255,255,0.6)" : "#374151" }}>
              <div>
                <div style={{ fontWeight: 700, color: textMain, marginBottom: 6 }}>알고리즘</div>
                AES-256-GCM<br />(인증 암호화 + 무결성 검증)
              </div>
              <div>
                <div style={{ fontWeight: 700, color: textMain, marginBottom: 6 }}>키 유도</div>
                SHA-256(<Code>ENCRYPTION_SECRET_KEY</Code>)<br />→ 32-byte AES 키
              </div>
              <div>
                <div style={{ fontWeight: 700, color: textMain, marginBottom: 6 }}>저장 형식</div>
                <Code>enc:v1:{"<iv_hex>"}:{"<ciphertext_hex>"}:{"<authtag_hex>"}</Code><br />prefix 없으면 평문으로 처리
              </div>
              <div>
                <div style={{ fontWeight: 700, color: textMain, marginBottom: 6 }}>런타임</div>
                Edge Functions: Deno (Web Crypto API)<br />마이그레이션 스크립트: Node.js
              </div>
            </div>
          </Card>
        </div>
      </SectionWrap>

    </div>
  );
}
