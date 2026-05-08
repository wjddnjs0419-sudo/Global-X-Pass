import { Badge } from "../components/ui/badge";
import { PageShell } from "../components/PageShell";
import { CONTACT_EMAIL } from "../constants/contact";
import { useTheme } from "../ThemeContext";

const sections = [
  {
    title: "1. 개인정보의 처리 목적",
    body: [
      "Global X Pass는 회원 가입 및 계정 관리, 프로그램 신청과 운영, 1:1 컨설팅 예약, Founder's Club 신청, 행사 안내와 신청 관리, 자료 제공, 문의 응대, 서비스 보안 및 이용 통계 관리를 위해 개인정보를 처리합니다.",
      "처리 목적이 변경되는 경우 관련 법령에 따라 필요한 조치를 이행하고, 본 개인정보처리방침을 통해 안내합니다.",
    ],
  },
  {
    title: "2. 처리하는 개인정보 항목",
    body: [
      "회원 가입 및 계정 관리: 이름, 이메일, 연락처, 소속, 회원 구분, 인증 관련 식별자",
      "프로그램 신청 및 예약: 신청자 이름, 이메일, 연락처, 소속, 직책, 신청 답변, 예약 내용, 신청 상태",
      "서비스 운영 및 보안: 접속 경로, 페이지 조회 기록, 브라우저/기기 정보, 활동 로그, 부정 이용 방지를 위한 최소한의 기술 정보",
    ],
  },
  {
    title: "3. 개인정보의 보유 및 이용기간",
    body: [
      "개인정보는 수집 및 이용 목적이 달성되면 지체 없이 파기하는 것을 원칙으로 합니다.",
      "다만 회원 관리, 프로그램 운영 기록, 분쟁 대응, 관계 법령상 보존 의무가 필요한 경우 해당 목적에 필요한 기간 동안 보관할 수 있습니다.",
      "회원 탈퇴 또는 삭제 요청이 접수된 경우 관련 법령 및 내부 처리 절차에 따라 보관 필요성을 확인한 뒤 파기 또는 분리 보관합니다.",
    ],
  },
  {
    title: "4. 개인정보의 제3자 제공 및 처리위탁",
    body: [
      "Global X Pass는 정보주체의 동의가 있거나 법령에 특별한 규정이 있는 경우를 제외하고 개인정보를 외부에 제공하지 않습니다.",
      "서비스 운영을 위해 Supabase의 인증, 데이터베이스, 스토리지, Edge Function 기능을 사용하며, 클라우드 인프라와 보안 운영 범위 내에서 개인정보 처리가 이루어질 수 있습니다.",
      "향후 별도 수탁사 또는 제3자 제공이 필요한 경우 제공받는 자, 목적, 항목, 보유기간을 사전에 안내합니다.",
    ],
  },
  {
    title: "5. 개인정보의 안전성 확보 조치",
    body: [
      "회원의 이름, 이메일, 연락처는 AES-256-GCM 방식으로 암호화하여 저장하며, 암호화된 값은 `enc:v1` 형식으로 관리합니다.",
      "관리자 기능은 역할 권한과 MFA 인증 상태를 기준으로 제한되며, 민감한 조회 및 관리 작업은 Supabase Edge Function과 데이터베이스 RLS 정책을 통해 통제합니다.",
      "관리자 활동, 페이지 조회, 인증 상태 등 보안상 필요한 기록은 접근 제한과 최소 권한 원칙에 따라 관리합니다.",
    ],
  },
  {
    title: "6. 정보주체의 권리와 행사 방법",
    body: [
      "정보주체는 본인의 개인정보에 대해 열람, 정정, 삭제, 처리정지, 동의 철회를 요청할 수 있습니다.",
      "서비스 내 마이페이지에서 확인 가능한 정보는 직접 확인할 수 있으며, 추가 요청은 아래 문의 이메일로 접수할 수 있습니다.",
      "Global X Pass는 요청자의 본인 여부를 확인한 뒤 관련 법령에 따라 지체 없이 처리합니다.",
    ],
  },
  {
    title: "7. 개인정보 자동 수집 장치",
    body: [
      "서비스 품질 개선, 보안 점검, 페이지 조회 통계를 위해 브라우저 환경에서 필요한 최소한의 이용 기록이 저장될 수 있습니다.",
      "동일 경로 반복 조회는 일정 시간 동안 제한하여 불필요한 기록 생성을 줄이고 있습니다.",
    ],
  },
  {
    title: "8. 개인정보 보호책임자 및 문의",
    body: [
      "개인정보 처리와 관련한 문의, 열람 및 삭제 요청, 불만 처리는 Global X Pass 운영 담당자에게 문의할 수 있습니다.",
      `문의 이메일: ${CONTACT_EMAIL}`,
    ],
  },
  {
    title: "9. 권익침해 구제",
    body: [
      "개인정보 침해에 대한 신고나 상담이 필요한 경우 개인정보침해 신고센터, 개인정보분쟁조정위원회 등 관계 기관을 통해 도움을 받을 수 있습니다.",
    ],
  },
  {
    title: "10. 개인정보처리방침의 변경",
    body: [
      "본 방침은 서비스 정책, 개인정보 처리 방식, 관계 법령 변경에 따라 개정될 수 있으며, 중요한 변경이 있는 경우 서비스 내 공지 등을 통해 안내합니다.",
      "시행일: 2026년 5월 4일",
    ],
  },
];

export function PrivacyPolicyPage() {
  const { isDark } = useTheme();
  const card = isDark ? "rgba(255,255,255,0.04)" : "#ffffff";
  const border = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
  const textMain = isDark ? "rgba(255,255,255,0.92)" : "#0f172a";
  const textMuted = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.58)";
  const noteBg = isDark ? "rgba(67,119,241,0.10)" : "rgba(67,119,241,0.06)";

  return (
    <PageShell title="개인정보처리방침" subtitle="Global X Pass의 개인정보 처리 기준과 보호 조치를 안내합니다." accentColor="#4377F1">
      <div className="max-w-[900px] mx-auto pb-[80px]">
        <div className="rounded-[20px] px-6 py-6 sm:px-8 sm:py-8 mb-4" style={{ background: noteBg, border: `1px solid ${isDark ? "rgba(67,119,241,0.24)" : "rgba(67,119,241,0.18)"}` }}>
          <Badge variant="blue" shape="pill" showDot>PRIVACY</Badge>
          <p className="m-0 mt-4 text-[14px] leading-[1.8]" style={{ color: textMuted }}>
            본 개인정보처리방침은 Global X Pass 서비스 운영 현황을 기준으로 작성되었습니다. 실제 운영 전 개인정보 보호책임자, 수탁사, 법정 보유기간 등 확정 정보가 있는 경우 최신 내용으로 보완해야 합니다.
          </p>
        </div>

        <div className="rounded-[20px] px-6 py-7 sm:px-8 sm:py-8" style={{ background: card, border: `1px solid ${border}` }}>
          {sections.map((section) => (
            <section key={section.title} className="mb-7 last:mb-0">
              <h2 className="m-0 mb-2 text-[15px] font-extrabold leading-[1.45]" style={{ color: textMain }}>
                {section.title}
              </h2>
              <div className="flex flex-col gap-2">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="m-0 text-[13px] leading-[1.75]" style={{ color: textMuted }}>
                    {paragraph}
                  </p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
