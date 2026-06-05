# RESULT: insight 카드뉴스 슬라이더(PDF 좌우 스와이프) — 2026-06-05

## 배경
- 목표: insight 마켓/테크/CEO(=report/issue-paper/trend-report) 게시물의 PDF를 인스타처럼 좌우 스와이프 카드뉴스로 표시.
- 기존 파일 최소 수정 + 신규 컴포넌트 추가 원칙.

## 구현
- **패키지**: react-pdf 10.4.1 + swiper 12.2.0 설치(peer dep 충돌 없음). pdfjs-dist 5.4.296은 react-pdf 번들 사용(별도 설치 X). worker = `new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url)`.
- **신규 `src/app/components/insight/CardNewsSlider.tsx` + `.css`**: Document/Page 렌더 + Swiper(Navigation/Pagination(fraction)/Keyboard/A11y), 레이지(현재±1만 렌더), 스켈레톤·에러+재시도. props `category`=실제 MediaCategoryId. usage 주석 포함.
- **상세 연결 `PortraitMediaPostView`**: 카드뉴스(포트레이트 + PDF 첨부)면 좌측 표지 슬롯 대신 **본문 단일 컬럼에 크게(680px)** 슬라이더. 비카드뉴스는 기존 2단 유지. `isPdf` 헬퍼 추가(utils/file.ts). PDF 판별 = model.files(이미지 제외 첨부)에서 .pdf.
- **어드민 `AdminPostCreate`**: "상세 좌측 표지 비율(540:675/1:1)" 컨트롤 제거 + 섹션을 "목록 썸네일 이미지"로 리라벨. 업로드+목록 썸네일 편집기는 **유지**(목록 썸네일이 표지 이미지를 소스로 크롭하므로 업로드 제거 불가).
- **vite.config manualChunks**: pdf/swiper 전용 **지연 청크** 분리(vendor 88kB 유지, pdf 459kB·swiper 103kB는 카드뉴스 진입 시에만 로드).
- **레이아웃 다듬기**: 본문을 슬라이더 위로 이동 / 흰 카드 프레임(배경·그림자·테두리) 제거→transparent / autoHeight 재측정(onRenderSuccess→updateAutoHeight) / 본문 `.ql-editor` 전역 min-height(400px) → `.card-news-body .ql-editor {min-height:0!important}`(index.css)로 빈 공간 제거.

## Verification Matrix
| Change | Checks | Result |
|---|---|---|
| 컴포넌트/연결 | tsc·eslint·vitest(134)·build | 통과 |
| 청크 분리 | pdf/swiper 지연, vendor 정상 | 통과 |
| min-height 오버라이드 | 빌드 CSS에 `.card-news-body .ql-editor{min-height:0!important}` 확인 | 통과 |
| 실제 화면(빈 공간/흰 띠) | 시각 확인 | **미확정 — 사용자 확인 대기** |

## 교훈
- `vite build`가 변경 직후 `html-inline-proxy` 오류로 간헐 실패 → `node_modules/.vite`+`dist` 삭제 후 재빌드로 해소(OneDrive 파일 잠금 추정).
- Tailwind v4 임의 변형(`[&_.ql-editor]:min-h-0`)은 dev JIT가 HMR 중 즉시 생성 못 해 dev 화면 미반영 가능 → **정적 CSS 규칙**으로 작성해야 안정적.
- 카드뉴스 위 흰 띠는 PDF 첫 페이지 자체의 상단 마진(파일 내부) → CSS로 제거 불가.
- 카드뉴스 미표시 시 점검: tags가 report/issue-paper/trend-report 인지 **+** PDF 첨부 존재 여부(둘 다여야 슬라이더 렌더).
