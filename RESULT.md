# RESULT: 행사 목록 썸네일 2버그 수정 (2026-05-28)

## 현재 상태

- **증상**: ①`/events`(EventsPage) 카드에서 대표 썸네일 이미지가 영역 밖으로 거대하게 표시되고 카드 높이가 비정상적으로 커짐. ②어드민 게시물 작성에서 행사 대표 썸네일에 이미지를 업로드하면 하단 "별도 첨부파일" 목록에 자동으로 추가되고 `image_url`에도 중복 적재됨.
- **결과**: 두 버그 모두 events 카테고리 전용 문제로 진단·수정. Codex 2회 리뷰(1차 needs-fix → 재작업 → 2차 SAFE-TO-COMMIT).

## 변경 내용

| 대상 | 변경 |
|---|---|
| `EventsPage.tsx` 썸네일 컨테이너 | 데스크톱 `sm:h-auto sm:self-stretch` flex 행에서 img `height:100%`가 부모 높이 미확정 → 원본 비율로 펼쳐져 카드 높이를 폭발시키던 순환 의존 해소. 컨테이너 `relative overflow-hidden` + img `absolute inset-0`로 전환(절대배치라 부모 높이 산정서 제외). object-cover/crop transform은 overflow로 클립 |
| `AdminPostCreate.tsx` 썸네일↔첨부 분리 | 근본 원인: `onCropApply`가 업로드 썸네일 파일을 `pendingThumbnailFile`(전용) **+** `files[]`(첨부)에 이중 보관 → 저장 시 events 분기가 `files` 전체를 `image_url`로 올려 중복. `files[]` push 제거 + `thumbnailFromUploadRef`로 standalone(에디터 직접 업로드)/candidate(기존 첨부 선택) 출처 구분 |
| ↳ `[files]` 이펙트 | `pendingThumbnailFile` clear 조건에 `!thumbnailFromUploadRef.current` 추가 → standalone 썸네일은 첨부 변경에도 유지, candidate만 첨부 제거 시 해제 |
| ↳ `onCropApply` | file 있으면 ref=true(standalone), `fileObjectUrls`서 찾으면 ref=false(candidate), 못 찾으면(applied 재크롭) 기존 `pendingThumbnailFile` 유지 |
| ↳ `onChange` | candidate면 ref=false, 해제/dataUrl이면 null+ref=false, blob standalone 적용 url은 직전 `onCropApply` 결과 유지 |
| ↳ 저장 업로드 가드 | `if (pendingThumbnailFile && supportsFinalThumbnail)` → 미지원 카테고리 전환 시 orphan storage 업로드 방지 |

## 검증 결과

- 인사이트(media)/news/events-archive는 영향 없음 분석 완료 — media는 컨테이너 `aspectRatio`로 높이 확정(이슈1 무관) + `cropOutputMode="dataUrl"`이라 events 전용 `onCropApply` files-push 경로 미진입(이슈2 무관).
- `npm run validate` ✅ ×2 (tsc + eslint --max-warnings=0 + vite build + 프론트 시크릿 23개).
- Codex 리뷰: 1차 Change1 safe / Change2 needs-fix(4건: standalone 소스 유실·blob URL이 thumbnail_url 저장·재크롭 복구 불가·미지원 orphan). 재작업 후 2차 **4건 전부 RESOLVED, 신규 회귀 없음, SAFE-TO-COMMIT**.

## 미실행 / 후속

- **브라우저 smoke 미실행**: 실제 `/events` 카드 렌더 + 어드민 행사 썸네일 업로드→첨부 비추가→저장→재편집 육안 확인 권장.
- 본 커밋에 이전 세션 누적 미커밋분이 함께 포함됨(사용자 지시: 전체 누적분 신규 커밋).
