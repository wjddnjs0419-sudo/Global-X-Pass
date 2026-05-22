export interface ChangguProgramTimelinePhase {
  year: string;
  solidColor: string;
  gradient: string;
  label: string;
  desc: string;
  bullets: string[];
}

export const CHANGGU_PROGRAM_TIMELINE_COPY = {
  title: "Around X 창구 프로그램",
  subtitle: "당신의 기업이 글로벌 시장에서 PLAY 될 때까지 함께합니다.",
};

export const CHANGGU_PROGRAM_TIMELINE_PHASES: ChangguProgramTimelinePhase[] = [
  {
    year: "2019",
    solidColor: "#4377F1",
    gradient: "linear-gradient(135deg, #4377F1 0%, #16DBBB 100%)",
    label: "프로그램 런칭",
    desc: "1기 모집 시작",
    bullets: [
      "구글플레이 공식 파트너십 체결",
      "스타트업 30개사 1기 선발",
      "글로벌 마케팅 컨설팅 론칭",
      "교육 · 멘토링 프로그램 시작",
    ],
  },
  {
    year: "2021",
    solidColor: "#18A343",
    gradient: "linear-gradient(135deg, #18A343 0%, #37AD9A 100%)",
    label: "혜택 확대",
    desc: "지원 규모 대폭 증가",
    bullets: [
      "참여사 100개사 돌파",
      "글로벌 진출 지원 프로그램 신설",
      "구글 전문가 1:1 멘토링 강화",
      "교육 커리큘럼 전면 개편",
    ],
  },
  {
    year: "2023",
    solidColor: "#FBBC05",
    gradient: "linear-gradient(135deg, #FFEE56 0%, #FFC2B4 100%)",
    label: "400개 돌파",
    desc: "누적 참여 기업 기록",
    bullets: [
      "누적 400개 참여사 기록 달성",
      "IR 피칭 데이 정례화",
      "해외 파트너십 다각화",
      "네트워킹 커뮤니티 플랫폼 확장",
    ],
  },
  {
    year: "2026",
    solidColor: "#EA4335",
    gradient: "linear-gradient(135deg, #FF4340 0%, #FF7C44 100%)",
    label: "8기 오픈",
    desc: "포털 및 신규 모집",
    bullets: [
      "디지털 포털 플랫폼 구축",
      "AI · 글로벌 특화 트랙 신설",
      "100개사 신규 모집",
      "창업 생태계 협력 확대",
    ],
  },
];
