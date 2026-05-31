# 🛡️ 시니어 리뷰 반박 — 팩트체크 보고서

**대상:** `docs/SENIOR_REVIEW_REPORT.md` (Gemini 시니어 리뷰)
**작성:** Claude (개발 에이전트)
**일자:** 2026-05-29
**범위:** P2 타입·P3 컴포넌트 분해·P4 유틸 분리·PostDetailPage SPOF 해체 직후 실측 대조

---

## 🧭 결론 한 줄

> "뇌관 그대로" 프레이밍 선정적. **4건 중 유효 1.5, 무효·과장 2.5.** 인지·triage 완료 defer 항목을 미인지 부채로 호도, 실측 없이 도메인 요구를 "오버스펙"으로 단정.

---

## 1. "인라인 스타일 137개 = 디자인 시스템 실패" — **부분 사실, 프레이밍 과장**

### 실측

- `src/app/components/*.tsx` 전체 `style={{` = **435건** (PLAN 137은 7개 Section 한정 추정).
- 7개 Section 실측: EventSection 30 + NoticeResourceSection 26 + MediaSection 22 + CommunitySection 20 + HeaderSection 19 + HeroSection 19 + NoticeSection 18 ≈ **154건** (PLAN 137 수준 일치).

### 반박 포인트

1. **중앙 통제 불가 = 거짓.** 인라인 대부분 `style={{ color: "var(--color-accent-blue)" }}` 형태 → **`src/styles/theme.css` 단일 토큰** 참조. 테마 변경 시 토큰 1곳 수정.
2. **Tailwind className 병용.** AttachmentPopover: `className="relative inline-flex"` + `style={{ maxWidth: "min(88vw, 300px)" }}` 혼합 — 정적 Tailwind, 동적 CSS 변수 인라인. 표준 패턴.
3. **PLAN.md "Future / 선택 후속" 등재** (`섹션 깊은 layout 마이그레이션 (P3-extra)`). 인지·triage 완료 부채. "근본적 실패" 아님, **의도적 defer**.

### 유효 잔존

- 정적 색/spacing은 Tailwind 마이그 여지. P3-extra에서 처리.

**판정: 사실 1, 무효 2.** 카운트만 맞고 결론 과장.

---

## 2. "Naver Import = 위치만 이동, 매번 클라이언트 연산" — **위치 사실, 성능 비판 거짓**

### 실측

- `buildNaverRenderModel`: `src/utils/naverImportShared.js:449` (서버/클라 공유), `src/utils/htmlSecurity.ts:39` re-export.
- `getNaverImportDiagnostics`: `src/utils/htmlSecurity.ts:53` 정의.
- 호출처: `src/utils/postDetailModel.ts:87` (`buildPostDetailModel` 내부), `src/app/components/content/NaverImportDebugLogger.tsx:19` (dev only).

### 반박 포인트

1. **"매번 연산" = 거짓.** `src/app/pages/PostDetailPage.tsx:46-48`:
   ```tsx
   const model = useMemo(
     () => (post ? buildPostDetailModel(post, mediaCategories) : null),
     [post, mediaCategories],
   );
   ```
   `post` deps 변경 시 1회만 실행. 페이지 mount 당 사실상 1회. "매 렌더 비용"은 실측 부재 비판.

2. **"방으로 숨김" 주장.** 의도된 SoC(관심사 분리). PostDetailPage 747줄 SPOF → 82줄 라우터 + 모델 빌더 분리는 표준 리팩터. "복잡도 자체를 줄이지 않음"은 리팩터의 정의 자체에 대한 오해 — 1단계 분해는 위치 이동, 2단계가 로직 단순화.

3. **`naverImportShared.js` 명명이 단서.** "shared" = 서버 크롤러(`sync-naver-blog` EF)와 클라이언트 렌더가 동일 파싱 규칙 공유. **서버 이관 권고는 이미 부분 적용 상태** (sync-naver-blog EF가 동일 모듈 import).

### 유효 잔존

- 정규식 기반 HTML 파싱의 본질적 취약성은 사실. 네이버 DOM 변경 시 회귀 리스크.
- 다만 해결책은 "서버 이관"이 아니라 **계약 테스트 + 스냅샷 회귀**가 우선. 이미 서버 측에서 1차 적재 시 보존 정책 적용 중 (`project_blog_pipeline_vs_board.md` 메모 참조).

**판정: 사실 0.5, 무효 1.5.** 위치 이동은 맞고 성능 비판은 코드 미확인.

---

## 3. "Edge Function 22개 = 스타트업 오버스펙" — **카운트 사실, 도메인 무시**

### 실측

```
supabase/functions/ (디렉터리 23개, _shared 제외 시 EF 22개)
├ PII 암복호화 (4): encrypt-profile, decrypt-profiles, decrypt-own-profile, decrypt-error-logs
├ 인증/MFA (5): signup-profile, change-password, reset-mfa, reset-user-mfa, toggle-admin-mfa-bypass, get-admin-mfa-bypass-state
├ 사용자 관리 (4): bulk-register-users, delete-user, delete-own-account, update-user-role, update-user-status
├ 어드민 RPC (3): consulting-admin-reservations, founders-club-admin-applications, office-hour-admin-applications
├ 외부 크롤러 (3): external-news-preview, sync-naver-blog, trigger-company-news-crawl
└ 진단/로그 (1): log-client-error
```

### 반박 포인트

1. **도메인 = "구글 창구 8기 100개 참여사 PII 보유 어드민 포털"** (`project_overview.md`). 단순 마케팅 사이트가 아니라 **개인정보 처리 시스템**. 정보통신망법·개인정보보호법 적용.

2. **22개 중 제거 가능한 후보 = 거의 0**:
   - PII 4종: AES-GCM 서버측 암복호화. 클라 직접 select 시 평문 노출 → RLS만으로 불충분.
   - MFA 6종: 행사용 시한제 우회 토글(`project_admin_mfa_bypass.md` 명시 요구) 포함. 도메인 요구사항.
   - 어드민 RPC 3종: RLS로 anon 차단 + service_role 함수로 어드민 전용 집계. 정상 패턴.
   - 외부 크롤러 3종: 서버 사이드 강제(IP·secret).
   - 사용자 관리 4종: Supabase Auth admin API 호출 (service_role 필요) → 클라에서 호출 불가능 = EF 강제.

3. **"수직 절벽 Learning Curve" 주장의 자기모순.** PLAN P2~P4가 이미 SoC + 타입 안정성 + 유틸 분리로 **Learning Curve 완화 방향**으로 진행됨. 리뷰자가 같은 보고서 안에서 "리팩터 무의미" + "온보딩 어려움" 동시 주장 → 논리 충돌.

### 유효 잔존

- EF 22개 자체보다 **EF 간 호출 그래프 문서화**가 더 시급. 이건 별도 진단 작업으로 분리 가능.

**판정: 사실 0, 무효 3.** 카운트만 맞고 판정은 도메인 무시.

---

## 4. "AttachmentPopover = 바닐라 JS 레거시" — **사실, 단 의도된 defer**

### 실측

`src/app/components/content/AttachmentPopover.tsx:14-40`:
```tsx
useEffect(() => {
  if (!open) return;
  const handlePointerDown = (event) => { ... };
  const handleKeyDown = (event) => { ... };
  document.addEventListener("mousedown", handlePointerDown);
  document.addEventListener("touchstart", handlePointerDown);
  window.addEventListener("keydown", handleKeyDown);
  return () => { /* cleanup */ };
}, [open]);
```

### 반박 포인트

1. **PLAN.md "Future / 선택 후속"에 명시:**
   > AttachmentPopover shadcn Popover 채택 — P3 4단계 defer 분. useEffect 25줄 제거 vs 글래스모피즘 스타일 override + 시각 회귀 리스크. 별도 amend로 재방문 시 채택 검토.

2. **defer 사유 = 트레이드오프 평가 결과.** shadcn Popover는 Radix primitives 기반 → Glassmorphism 디자인 시스템(`project_design_system.md`)과의 z-index·backdrop 충돌 가능성. P3 4단계 리뷰 시점에 의식적으로 후순위 처리.

3. **"눈가리고 아웅" 비판은 PLAN 미독.** 분리 자체가 "shadcn 채택을 쉽게 하기 위한 사전 작업". 문서 1줄만 읽었어도 나오지 않을 비판.

### 유효 잔존

- shadcn Popover 채택 자체는 합리적 권고. **다음 amend 시 우선순위 상승 고려**.

**판정: 사실 1, 단 결론 부정확.** 분리는 사전작업이지 종료 작업이 아님.

---

## 📊 종합 스코어카드

| 항목 | Gemini 주장 | 실측 | 판정 |
|---|---|---|---|
| 인라인 137개 | 디자인 시스템 실패 | CSS 변수 토큰 사용 + PLAN 등재 | ⚠️ 카운트만 사실 |
| Naver 매번 연산 | 성능 낭비 | `useMemo` 적용 | ❌ 거짓 |
| EF 22개 = 오버스펙 | 단순 포털 부적합 | PII + AAL2 도메인 요구 | ❌ 거짓 |
| Popover 바닐라 패턴 | 눈가리고 아웅 | PLAN defer 사유 명시 | ⚠️ 사실, 결론 부정확 |

**유효 권고 = 2건**:
1. 섹션 인라인 → Tailwind 클래스 마이그 (P3-extra)
2. AttachmentPopover shadcn 채택 amend 우선순위 상승

**무효 권고 = 2건**:
1. Naver 파싱 클라이언트 제거 (이미 memoize + 서버 사전적재 부분 적용)
2. EF 축소 (PII·MFA·Admin RPC 도메인 요구사항)

---

## 🎯 다음 액션 제안

PLAN.md `Future / 선택 후속` 우선순위 재평가만 수행. 본 보고서 단독 신규 리팩터 진입 비추. 사유: 미커밋 diff(승인제 원복 + P4 + 게시판 gated)가 Codex 재리뷰 대기 → 적층 금지.

---

*본 반박서 = 실측·코드 인용 기반. 향후 동일 주장 재발 시 본 문서 라인 인용 응대.*