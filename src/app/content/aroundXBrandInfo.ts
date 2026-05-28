import logoImg from "../../imports/around-x-logo-rgb.png";

export type AroundXBrandText = {
  ko: string;
  en: string;
};

export type AroundXBrandValue = {
  title: AroundXBrandText;
  description: AroundXBrandText;
};

export const AROUND_X_BRAND_INFO = {
  logo: {
    src: logoImg,
    alt: {
      ko: "Around X 로고",
      en: "Around X logo",
    },
  },
  slogan: {
    ko: "경계를 넘어, 새로운 미래를 열다.",
    en: "Crossing borders, Creating Futures.",
  },
  description: {
    ko: "Around X는 글로벌 지향성, 협업, 연결, 확장성을 담아낸 브랜드입니다.\n사람과 조직, 기회와 시장을 유기적으로 잇고 더 넓은 가능성으로 확장합니다.",
    en: "Around X visualizes global orientation, collaboration, connection, and scalability. It links people, organizations, opportunities, and markets into a broader future of growth.",
  },
  values: [
    {
      title: {
        ko: "글로벌 지향성",
        en: "Global Orientation",
      },
      description: {
        ko: "국경을 넘어 시장과 파트너를 연결합니다.",
        en: "We connect markets and partners across borders.",
      },
    },
    {
      title: {
        ko: "협업",
        en: "Collaboration",
      },
      description: {
        ko: "기관, 파트너, 기업이 함께 실행하는 구조를 만듭니다.",
        en: "We build structures where institutions, partners, and companies move together.",
      },
    },
    {
      title: {
        ko: "연결",
        en: "Connection",
      },
      description: {
        ko: "사람과 자원, 기회를 자연스럽게 이어 줍니다.",
        en: "We connect people, resources, and opportunities with clarity.",
      },
    },
    {
      title: {
        ko: "확장성",
        en: "Scalability",
      },
      description: {
        ko: "작은 시작을 지속 가능한 성장으로 확장합니다.",
        en: "We turn a small start into sustainable growth.",
      },
    },
  ] satisfies readonly AroundXBrandValue[],
} as const;
