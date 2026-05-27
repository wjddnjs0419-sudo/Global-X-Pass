import type { OfficeHourApplicationStatus } from "../../lib/types";

/** '2026-06-01' → '2026년 6월' */
export function formatOfficeHourMonth(periodMonth: string): string {
  const [year, month] = periodMonth.split("-");
  return `${year}년 ${parseInt(month, 10)}월`;
}

export const OFFICE_HOUR_STATUS_LABEL: Record<OfficeHourApplicationStatus, string> = {
  pending: "매칭 대기",
  matched: "매칭 완료",
  completed: "상담 완료",
  cancelled: "신청 취소",
  rejected: "신청 반려",
};

/** 상태 배지 색상 (CSS 변수). label과 함께 단일 진실원천으로 사용. */
export const OFFICE_HOUR_STATUS_COLOR: Record<OfficeHourApplicationStatus, string> = {
  pending: "var(--color-brand-yellow)",
  matched: "var(--color-accent-green)",
  completed: "var(--color-accent-blue)",
  cancelled: "var(--color-neutral)",
  rejected: "var(--color-brand-red)",
};

/** 임의 status 문자열을 받아 라벨/색상 설정을 반환. 미지 상태는 원문 + muted. */
export function getOfficeHourStatusConfig(status: string): { label: string; color: string } {
  const key = status as OfficeHourApplicationStatus;
  return {
    label: OFFICE_HOUR_STATUS_LABEL[key] ?? status,
    color: OFFICE_HOUR_STATUS_COLOR[key] ?? "var(--color-text-muted)",
  };
}
