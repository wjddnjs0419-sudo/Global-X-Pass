import { Plus, X } from "lucide-react";
import type { CSSProperties } from "react";
import type { EventCustomQuestion, EventFormConfig } from "../../../lib/types";
import { cleanEventFormConfig, mergeEventFormConfig } from "../../../utils/eventApplication";
import { Button } from "../ui/button";

interface EventFormConfigEditorProps {
  value: EventFormConfig | null | undefined;
  onChange: (next: EventFormConfig) => void;
}

const createCustomQuestion = (): EventCustomQuestion => ({
  id: `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  label: "새 질문",
  type: "short_text",
  required: false,
});

export function EventFormConfigEditor({ value, onChange }: EventFormConfigEditorProps) {
  const config = mergeEventFormConfig(value);

  const updateConfig = (patch: Partial<EventFormConfig>) => {
    onChange(cleanEventFormConfig({ ...config, ...patch }));
  };

  const updateQuestion = (id: string, patch: Partial<EventCustomQuestion>) => {
    updateConfig({
      customQuestions: config.customQuestions.map(question =>
        question.id === id ? { ...question, ...patch } : question
      ),
    });
  };

  const insertQuestion = (index: number) => {
    const next = [...config.customQuestions];
    next.splice(index, 0, createCustomQuestion());
    updateConfig({ customQuestions: next });
  };

  const removeQuestion = (id: string) => {
    updateConfig({ customQuestions: config.customQuestions.filter(question => question.id !== id) });
  };

  const updateInterestOption = (index: number, value: string) => {
    updateConfig({
      interestOptions: config.interestOptions.map((item, itemIndex) => itemIndex === index ? value : item),
    });
  };

  const addInterestOption = () => {
    updateConfig({ interestOptions: [...config.interestOptions, "새 선택지"] });
  };

  const removeInterestOption = (index: number) => {
    updateConfig({ interestOptions: config.interestOptions.filter((_, itemIndex) => itemIndex !== index) });
  };

  const groupStyle: CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    padding: "16px 18px",
    background: "var(--color-surface-subtle)",
    border: "1px solid var(--color-border-subtle)",
    borderRadius: 14,
  };
  const titleStyle: CSSProperties = {
    margin: 0,
    color: "var(--color-text-primary)",
    fontSize: 14,
    fontWeight: 800,
  };
  const inputStyle: CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-field-bg)",
    color: "var(--color-text-primary)",
    outline: "none",
    fontSize: 13,
    boxSizing: "border-box",
  };
  const rowStyle: CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-field-bg)",
  };
  const deleteButtonStyle: CSSProperties = {
    width: 30,
    height: 30,
    borderRadius: "50%",
    border: "none",
    background: "var(--color-danger-soft-bg)",
    color: "var(--color-brand-red)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    flex: "0 0 auto",
  };
  const addButtonStyle: CSSProperties = {
    width: 34,
    height: 34,
    borderRadius: "50%",
    border: "1px solid var(--color-border-soft)",
    background: "var(--color-field-bg)",
    color: "var(--color-accent-blue)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
  };

  return (
    <section style={{ display: "flex", flexDirection: "column", gap: 14, padding: "16px 18px", background: "var(--color-surface-card)", border: "1px solid var(--color-border-soft)", borderRadius: 16 }}>
      <div>
        <h4 style={{ margin: 0, color: "var(--color-text-primary)", fontSize: 16, fontWeight: 850 }}>행사 신청서 설정</h4>
        <p style={{ margin: "6px 0 0", color: "var(--color-text-muted)", fontSize: 12, lineHeight: 1.5 }}>
          행사 신청 페이지에 표시되는 문구와 질문을 관리합니다.
        </p>
      </div>

      <div style={groupStyle}>
        <p style={titleStyle}>신청서 안내</p>
        <textarea
          style={{ ...inputStyle, minHeight: 78, resize: "vertical" }}
          value={config.intro}
          onChange={event => updateConfig({ intro: event.currentTarget.value })}
          placeholder="폼 안내 문구"
        />
      </div>

      <div style={groupStyle}>
        <p style={titleStyle}>1. 참가자 기본 정보</p>
        <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
          <input style={inputStyle} value={config.companyTechLabel} onChange={event => updateConfig({ companyTechLabel: event.currentTarget.value })} placeholder="기업명/기술분야 질문" />
          <input style={inputStyle} value={config.nameLabel} onChange={event => updateConfig({ nameLabel: event.currentTarget.value })} placeholder="성함 질문" />
          <input style={inputStyle} value={config.positionLabel} onChange={event => updateConfig({ positionLabel: event.currentTarget.value })} placeholder="직책 질문" />
          <input style={inputStyle} value={config.emailLabel} onChange={event => updateConfig({ emailLabel: event.currentTarget.value })} placeholder="이메일 질문" />
          <input style={inputStyle} value={config.phoneLabel} onChange={event => updateConfig({ phoneLabel: event.currentTarget.value })} placeholder="연락처 질문" />
        </div>
      </div>

      <div style={groupStyle}>
        <p style={titleStyle}>2. 관심 분야 & 참여 목적</p>
        <input style={inputStyle} value={config.expectationLabel} onChange={event => updateConfig({ expectationLabel: event.currentTarget.value })} placeholder="참여 목적 질문" />
        <input style={inputStyle} value={config.interestsLabel} onChange={event => updateConfig({ interestsLabel: event.currentTarget.value })} placeholder="관심 분야 질문" />
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {config.interestOptions.map((option, index) => (
            <div key={`${option}-${index}`} style={rowStyle}>
              <input
                style={{ ...inputStyle, flex: 1, padding: "8px 10px" }}
                value={option}
                onChange={event => updateInterestOption(index, event.currentTarget.value)}
                placeholder="선택지 이름"
              />
              <button type="button" aria-label="관심 분야 선택지 삭제" onClick={() => removeInterestOption(index)} style={deleteButtonStyle}>
                <X size={15} />
              </button>
            </div>
          ))}
          <button type="button" aria-label="관심 분야 선택지 추가" onClick={addInterestOption} style={{ ...addButtonStyle, alignSelf: "center" }}>
            <Plus size={17} />
          </button>
        </div>
      </div>

      <div style={groupStyle}>
        <p style={titleStyle}>3. 사전 질문</p>
        <input style={inputStyle} value={config.speakerQuestionLabel} onChange={event => updateConfig({ speakerQuestionLabel: event.currentTarget.value })} placeholder="사전 질문 문구" />
      </div>

      <div style={groupStyle}>
        <p style={titleStyle}>4. 추가 질문</p>
        <button type="button" aria-label="첫 번째 추가 질문 추가" onClick={() => insertQuestion(0)} style={{ ...addButtonStyle, alignSelf: "center" }}>
          <Plus size={17} />
        </button>
        {config.customQuestions.map((question, index) => (
          <div key={question.id} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ position: "relative", padding: "14px 46px 14px 14px", borderRadius: 12, border: "1px solid var(--color-border-soft)", background: "var(--color-field-bg)", display: "grid", gap: 10 }}>
              <button type="button" aria-label="폼 질문 삭제" onClick={() => removeQuestion(question.id)} style={{ ...deleteButtonStyle, position: "absolute", top: 10, right: 10 }}>
                <X size={15} />
              </button>
              <input style={inputStyle} value={question.label} onChange={event => updateQuestion(question.id, { label: event.currentTarget.value })} placeholder="질문 문구" />
              <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 10 }}>
                <select style={inputStyle} value={question.type} onChange={event => updateQuestion(question.id, { type: event.currentTarget.value as EventCustomQuestion["type"] })}>
                  <option value="short_text">짧은 답변</option>
                  <option value="long_text">긴 답변</option>
                </select>
                <label style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--color-text-primary)", fontSize: 13, fontWeight: 700 }}>
                  <input type="checkbox" checked={question.required} onChange={event => updateQuestion(question.id, { required: event.currentTarget.checked })} />
                  필수 질문
                </label>
              </div>
            </div>
            <button type="button" aria-label={`${index + 2}번째 추가 질문 추가`} onClick={() => insertQuestion(index + 1)} style={{ ...addButtonStyle, alignSelf: "center" }}>
              <Plus size={17} />
            </button>
          </div>
        ))}
      </div>

      <div style={groupStyle}>
        <p style={titleStyle}>5. 개인정보 동의 및 완료 안내</p>
        <textarea style={{ ...inputStyle, minHeight: 68, resize: "vertical" }} value={config.privacyConsentLabel} onChange={event => updateConfig({ privacyConsentLabel: event.currentTarget.value })} placeholder="개인정보 동의 문구" />
        <input style={inputStyle} value={config.completionTitle} onChange={event => updateConfig({ completionTitle: event.currentTarget.value })} placeholder="완료 제목" />
        <textarea style={{ ...inputStyle, minHeight: 68, resize: "vertical" }} value={config.completionMessage} onChange={event => updateConfig({ completionMessage: event.currentTarget.value })} placeholder="완료 안내" />
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button type="button" variant="outline" onClick={() => onChange(cleanEventFormConfig(null))}>
          기본 문구로 되돌리기
        </Button>
      </div>
    </section>
  );
}

export default EventFormConfigEditor;
