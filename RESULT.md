# RESULT: 인사이트/참여기업 메뉴 개편 + 필터 개선 (2026-05-26)

## 현재 상태

Resources·Around X 메뉴 구조 개편 및 인사이트 필터 라벨 변경, 참여기업 program_name 컬럼 추가가 완료됐다.

## 변경 내용

| 대상 | 변경 |
|---|---|
| `src/app/pages/MediaPage.tsx` | title `"미디어"` → `"인사이트"`, subtitle 업데이트 |
| `src/app/constants/mediaCategories.ts` | defaultLabel: 리포트→마켓, 이슈페이퍼→테크, 트렌드리포트→CEO |
| Supabase `media_category_labels` | DB 라벨도 동일하게 UPDATE |
| `src/app/navigation/mainMenu.ts` | Resources에서 참여기업 제거 → Around X 마지막(핀칸티에리 아래)으로 이동 |
| `src/app/pages/CompaniesPage.tsx` | 프로그램명·년도 필터 버튼 추가, 카드 배지 `company.program_name` variable 참조 |
| `src/lib/types.ts` | Company에 `program_name: string` 추가 |
| Supabase `companies` | `program_name TEXT NOT NULL DEFAULT '창구 프로그램'` 컬럼 추가 마이그레이션 |
| `src/app/components/admin/AdminCompaniesManagement.tsx` | CSV 헤더·파서·폼·payload 전부 `program_name` 반영 |

## 검증 결과

- `npm run validate` (tsc + eslint + vite build + secret scan) ✅
- Supabase migration `add_program_name_to_companies` 적용 ✅
- DB `media_category_labels` UPDATE ✅
