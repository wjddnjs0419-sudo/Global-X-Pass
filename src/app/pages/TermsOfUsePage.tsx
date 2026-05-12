import { Badge } from "../components/ui/badge";
import { PageShell } from "../components/PageShell";
import { CONTACT_EMAIL } from "../constants/contact";

const sections = [
  {
    title: "제1조 목적",
    body: [
      "본 약관은 Global X Pass가 제공하는 웹사이트, 프로그램 신청, 자료 열람, 1:1 컨설팅 예약, Founder's Club 신청 등 서비스 이용과 관련하여 이용자와 운영자 사이의 권리, 의무 및 책임사항을 정하는 것을 목적으로 합니다.",
    ],
  },
  {
    title: "제2조 서비스의 제공",
    body: [
      "Global X Pass는 스타트업 및 글로벌 진출 관련 정보, 공지, 행사, 자료, 컨설팅 예약, 커뮤니티 프로그램 신청 기능을 제공합니다.",
      "서비스의 일부 기능은 로그인한 회원 또는 특정 권한을 가진 참여사 담당자에게만 제공될 수 있습니다.",
    ],
  },
  {
    title: "제3조 회원가입 및 계정 관리",
    body: [
      "이용자는 정확한 정보를 바탕으로 회원가입을 신청해야 하며, 타인의 정보를 사용하거나 허위 정보를 입력해서는 안 됩니다.",
      "이용자는 본인의 계정과 비밀번호를 안전하게 관리할 책임이 있으며, 계정 도용이나 무단 사용을 알게 된 경우 즉시 운영자에게 알려야 합니다.",
    ],
  },
  {
    title: "제4조 이용자의 의무",
    body: [
      "이용자는 관계 법령, 본 약관, 서비스 안내사항을 준수해야 합니다.",
      "서비스 운영을 방해하거나, 타인의 개인정보를 침해하거나, 허위 신청 및 부정한 방법으로 프로그램 참여 기회를 얻는 행위는 금지됩니다.",
    ],
  },
  {
    title: "제5조 프로그램 신청 및 취소",
    body: [
      "행사, 컨설팅, Founder's Club 등 프로그램 신청은 각 프로그램의 모집 상태, 정원, 운영 정책에 따라 승인 또는 거절될 수 있습니다.",
      "이용자는 서비스 내 제공되는 취소 기능 또는 운영자 문의를 통해 신청 취소를 요청할 수 있으며, 취소 가능 범위는 프로그램별 운영 기준에 따릅니다.",
    ],
  },
  {
    title: "제6조 게시물 및 자료 이용",
    body: [
      "서비스에서 제공하는 게시물, 자료, 이미지, 다운로드 파일은 안내된 목적 범위 내에서 이용해야 합니다.",
      "운영자의 사전 동의 없이 자료를 무단 복제, 배포, 상업적으로 이용하거나 제3자의 권리를 침해하는 방식으로 사용할 수 없습니다.",
    ],
  },
  {
    title: "제7조 서비스의 변경 및 중단",
    body: [
      "운영자는 서비스 개선, 보안 점검, 시스템 유지보수, 프로그램 운영 사정에 따라 서비스의 전부 또는 일부를 변경하거나 일시 중단할 수 있습니다.",
      "중요한 변경 또는 장기간 중단이 예정된 경우 가능한 범위에서 사전에 안내합니다.",
    ],
  },
  {
    title: "제8조 개인정보 보호",
    body: [
      "운영자는 개인정보 보호 관련 법령을 준수하며, 개인정보 처리에 관한 세부 사항은 개인정보처리방침에 따릅니다.",
    ],
  },
  {
    title: "제9조 책임 제한",
    body: [
      "운영자는 천재지변, 통신 장애, 외부 서비스 장애, 이용자의 귀책 사유 등 운영자가 통제하기 어려운 사유로 발생한 서비스 이용 장애에 대해 책임을 지지 않을 수 있습니다.",
      "이용자가 본 약관을 위반하여 발생한 손해 또는 분쟁에 대해서는 해당 이용자가 책임을 부담합니다.",
    ],
  },
  {
    title: "제10조 문의 및 약관 변경",
    body: [
      `서비스 이용과 관련한 문의는 ${CONTACT_EMAIL}로 접수할 수 있습니다.`,
      "본 약관은 서비스 정책 및 관계 법령 변경에 따라 개정될 수 있으며, 중요한 변경 사항은 서비스 내 공지 등을 통해 안내합니다.",
      "시행일: 2026년 5월 4일",
    ],
  },
];

export function TermsOfUsePage() {
  return (
    <PageShell title="이용약관" subtitle="Global X Pass 서비스 이용 기준과 회원의 권리 및 의무를 안내합니다." accentColor="var(--color-accent-ncf)">
      <div className="max-w-[900px] mx-auto pb-[80px]">
        <div className="rounded-[20px] px-6 py-6 sm:px-8 sm:py-8 mb-4" style={{ background: "var(--color-accent-ncf-soft-bg)", border: "1px solid var(--color-accent-ncf-border)" }}>
          <Badge variant="green" shape="pill" showDot>TERMS</Badge>
          <p className="m-0 mt-4 text-[14px] leading-[1.8]" style={{ color: "var(--color-text-muted)" }}>
            본 약관은 Global X Pass 웹사이트와 프로그램 운영에 적용되는 기본 이용 조건입니다. 개별 프로그램에서 별도 안내한 운영 기준이 있는 경우 해당 안내가 함께 적용될 수 있습니다.
          </p>
        </div>

        <div className="rounded-[20px] px-6 py-7 sm:px-8 sm:py-8" style={{ background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)" }}>
          {sections.map((section) => (
            <section key={section.title} className="mb-7 last:mb-0">
              <h2 className="m-0 mb-2 text-[15px] font-extrabold leading-[1.45]" style={{ color: "var(--color-text-primary)" }}>
                {section.title}
              </h2>
              <div className="flex flex-col gap-2">
                {section.body.map((paragraph) => (
                  <p key={paragraph} className="m-0 text-[13px] leading-[1.75]" style={{ color: "var(--color-text-muted)" }}>
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
