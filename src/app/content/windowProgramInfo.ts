export type WindowProgramDescriptionSegment = {
  text: string;
  emphasis?: boolean;
};

export const WINDOW_PROGRAM_INFO = {
  label: { ko: "PROGRAM INFO", en: "PROGRAM INFO" },
  title: {
    ko: ["Around X", "창구 프로그램"],
    en: ["Around X", "ChangGoo Program"],
  },
  description: {
    ko: [
      { text: "넥스트챌린지와 구글플레이, 중소벤처기업부, 창업진흥원이 공동 운영하는 " },
      { text: "대한민국 대표 앱·게임 스타트업 액셀러레이팅 프로그램", emphasis: true },
      { text: "입니다. 잠재력 있는 기업을 발굴하여 글로벌 성공 스토리를 함께 만들어가는데 기여하겠습니다." },
    ],
    en: [
      { text: "It is " },
      { text: "Korea's representative app/game startup accelerating program", emphasis: true },
      { text: " co-operated by Next Challenge, Google Play, the Ministry of SMEs and Startups, and KISED. We will contribute to creating global success stories together by discovering companies with potential." },
    ],
  } satisfies Record<"ko" | "en", WindowProgramDescriptionSegment[]>,
  hint: {
    ko: "중앙 코어를 클릭해 프로그램 정보 보기",
    en: "Click the central core to view program info",
  },
};
