# RESULT: HWP/HWPX 첨부 지원 — 2026-06-05

## 배경
- 목표: 게시물 첨부파일에 한글(HWP) + 최신 HWPX 포맷 업로드 가능하게.
- 증상: `.hwp`는 이미 프론트 허용목록·accept·버킷 MIME에 등록돼 **선택은 되나 업로드가 실패**.
- 근본 원인: 문서 업로드 지점(`AdminPostCreate` uploadFile)이 `upload(fileName, f)`에 **contentType 미지정** → HWP는 브라우저 `file.type`이 빈 문자열이라 `application/octet-stream`으로 올라가고, documents 버킷 `allowed_mime_types`(`application/x-hwp`만)가 이를 거부.

## 구현
- **`src/utils/file.ts`**:
  - `DOCUMENT_EXTENSIONS`·`DOCUMENT_UPLOAD_ACCEPT`에 `.hwpx` 추가.
  - `ALLOWED_DOCUMENT_MIME_TYPES`에 HWP/HWPX 변종 추가(`application/haansoft-hwp`, `application/vnd.hancom.hwp`, `application/hwp+zip`, `application/vnd.hancom.hwpx`).
  - 신규 `DOCUMENT_EXTENSION_MIME`(확장자→정규 MIME) + `getDocumentContentType(file)` 헬퍼: 확장자 기준 정규 MIME 우선, 없으면 `file.type`, 그래도 없으면 octet-stream.
  - 신규 `getDownloadUrl(url)` 헬퍼: 공개 URL에 `?download=<원본파일명>` 부착(다운로드 시 확장자·파일명 보존).
- **`src/app/components/admin/AdminPostCreate.tsx`**: 업로드 시 문서를 **정규 MIME으로 `new File([f], f.name, { type })` 재래핑** 후 업로드. (supabase-js가 Blob의 contentType 옵션을 무시하고 `File.type`을 쓰는 함정 회피.)
- **`src/app/components/content/AttachmentPopover.tsx`** · **`src/app/pages/ResourcesPage.tsx`**: 다운로드 링크/트리거를 `getDownloadUrl(url)` 사용으로 변경(+`download` 속성은 동일출처 폴백).
- **신규 마이그레이션 `supabase/migrations/20260605120000_documents_bucket_hwpx.sql`**: documents 버킷 `allowed_mime_types`에 HWP/HWPX 변종 추가(`ON CONFLICT DO UPDATE`).
- **`scripts/create_bucket.mjs`**: 동일 MIME 변종 추가(생성/갱신 스크립트 일관성).

## Verification Matrix
| Change | Checks | Result |
|---|---|---|
| 전체 코드 | `tsc --noEmit` | 통과 |
| 업로드 MIME | 로컬 업로드 후 객체 Content-Type=`application/x-hwp` | 통과(실측) |
| 다운로드 | `?download` GET 시 `Content-Disposition: attachment; filename=<원본.hwp>` | 통과(실측) |
| 로컬 버킷 MIME 확장 | docker psql로 `UPDATE storage.buckets` 직접 적용 | 통과(로컬만) |
| prod 버킷 MIME 확장 | 마이그레이션 SQL 작성 | **prod push 대기(배포 시)** |

## 교훈
- HWP/HWPX는 OS 등록 MIME이 없어 브라우저 `file.type`이 빈 문자열·`application/haansoft-hwp` 등으로 제각각 → **업로드 시 정규 MIME으로 `new File()` 재래핑**해야 공개 버킷 MIME 검증 통과.
- **supabase-js 함정**: `storage.upload(path, File, { contentType })`에서 body가 `File`/`Blob`이면 **contentType 옵션을 무시**하고 내부 FormData가 `File.type`을 멀티파트 MIME으로 전송. → 옵션이 아니라 **File 자체의 type을 바꿔야** 함.
- **다운로드 함정**: `<a download>`/`link.download`은 **교차 출처(Supabase 도메인)에서 무시**되어 객체 키(확장자 없음)로 저장됨 → HWP가 "다른 형식"으로 보임. **Supabase `?download=<파일명>` 쿼리**로 서버가 `Content-Disposition: attachment`를 내려야 확장자 보존.
- 클라 `accept`/허용목록은 우회 가능 → **버킷 `allowed_mime_types`가 최종 방어선**. 둘을 같은 MIME 집합으로 맞춰야 함.
- 배포 시 documents 버킷 정책 갱신을 위해 `db:push:prod` 필수(코드만 배포하면 prod에선 HWPX가 여전히 버킷에서 거부됨). 로컬은 이번 세션에 직접 `UPDATE`로 패치 완료.
