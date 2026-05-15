type ExplainInput = {
  message: string;
  stack?: string | null;
};

type NodeLabel = {
  label: string;
};

type ExplainResult = {
  meaning: string;
  impact: string;
  likely: string;
  action: string;
};

export function explainError(log: ExplainInput, node?: NodeLabel): ExplainResult {
  const message = log.message.toLowerCase();
  const stack = log.stack ?? "";
  const readProp = log.message.match(
    /Cannot read properties of (null|undefined) \(reading '([^']+)'\)/,
  );

  if (readProp) {
    const [, target, property] = readProp;
    return {
      meaning: `값이 ${target === "null" ? "비어 있는 null" : "정의되지 않은 undefined"} 상태인데 '${property}' 속성을 읽으려 했습니다.`,
      impact: node
        ? `${node.label} 화면 조각이 멈추거나 사용자가 진행 중이던 동작이 끊길 수 있습니다.`
        : "해당 화면 조각이 멈추거나 진행 중이던 동작이 끊길 수 있습니다.",
      likely: node
        ? `${node.label} 내부에서 비동기 상태, ref, DOM 요소, 조회 결과 중 하나가 사라진 뒤에도 이전 값이 있다고 가정했을 가능성이 큽니다.`
        : "비동기 상태, ref, DOM 요소, 조회 결과 중 하나가 사라진 뒤에도 이전 값이 있다고 가정했을 가능성이 큽니다.",
      action: stack
        ? "stack의 첫 번째 앱 파일/라인에서 optional guard 또는 로컬 스냅샷을 둬야 합니다."
        : "에러가 난 파일에서 null/undefined guard를 추가해야 합니다.",
    };
  }

  if (message.includes("realtime subscription")) {
    return {
      meaning: "Supabase Realtime 채널 구독이 정상적으로 열리지 않았습니다.",
      impact:
        "운영 화면에서 최신 에러나 신청/프로필 변경이 즉시 갱신되지 않을 수 있습니다.",
      likely:
        "원격 프로젝트의 Realtime publication, 로그인 세션/AAL 상태, 네트워크 WebSocket 연결 중 하나가 맞지 않을 수 있습니다.",
      action:
        "`error_logs` 초기 조회가 되는지 먼저 보고, Supabase Realtime 설정과 브라우저 Network의 WebSocket 응답을 확인하세요.",
    };
  }

  if (message.includes("ux layout issue")) {
    return {
      meaning:
        "런타임 UX 헬스체크가 레이아웃 또는 클릭 영역 문제 후보를 발견했습니다.",
      impact:
        "특정 화면 폭에서 버튼을 누르기 어렵거나 내용이 화면 밖으로 밀릴 수 있습니다.",
      likely:
        "화면 밖으로 나간 요소, 24px 미만의 작은 interactive target, 가로 overflow 같은 접근성/사용성 이슈일 가능성이 있습니다.",
      action:
        "로그 context의 label, tag, width, height, viewport 값을 기준으로 해당 요소의 최소 클릭 영역과 배치를 확인하세요.",
    };
  }

  if (message.includes("ux action issue")) {
    return {
      meaning:
        "관측 대상으로 지정한 버튼을 눌렀지만 화면 변화가 감지되지 않았습니다.",
      impact: "사용자 입장에서는 버튼이 눌리지 않은 것처럼 느껴질 수 있습니다.",
      likely:
        "버튼이 이미 선택된 상태였거나, 클릭 후 URL/DOM/dialog 변화가 없어 무반응 후보로 기록됐을 수 있습니다.",
      action:
        "context의 action 값을 기준으로 실제 의도한 상태 변화가 있는지 확인하고, 정상 무변화 동작이면 관측 제외를 검토하세요.",
    };
  }

  if (message.includes("failed to fetch") || message.includes("networkerror")) {
    return {
      meaning:
        "브라우저가 API 또는 정적 리소스 요청을 완료하지 못했습니다.",
      impact:
        "목록, 신청, 저장 같은 데이터 의존 기능이 비어 보이거나 실패할 수 있습니다.",
      likely:
        "네트워크, CORS, Supabase 함수 배포 상태, 환경변수 URL 중 하나가 원인일 수 있습니다.",
      action: "Network 탭의 실패 요청 URL과 status를 먼저 확인하세요.",
    };
  }

  if (
    message.includes("permission denied") ||
    message.includes("42501") ||
    message.includes("rls")
  ) {
    return {
      meaning: "Supabase 권한 또는 RLS 정책이 요청을 거부했습니다.",
      impact:
        "사용자가 데이터를 보거나 저장하지 못하고, 관리자 기능은 빈 목록처럼 보일 수 있습니다.",
      likely:
        "로그인 role, MFA AAL2, `public.is_admin()` 조건, GRANT 중 하나가 맞지 않을 수 있습니다.",
      action: "해당 테이블 정책명과 호출 계정의 role/AAL 상태를 확인하세요.",
    };
  }

  if (message.includes("is not a function")) {
    return {
      meaning: "함수라고 생각한 값이 실제로는 함수가 아닙니다.",
      impact: "해당 버튼, 화면 로딩, 저장 흐름이 즉시 중단될 수 있습니다.",
      likely:
        "import/export 형태 불일치, optional 값 미검사, 외부 라이브러리 API 변경 가능성이 있습니다.",
      action:
        "stack 첫 줄의 호출부에서 해당 값의 타입과 import 방식을 확인하세요.",
    };
  }

  return {
    meaning: "아직 분류 규칙이 없는 에러입니다.",
    impact:
      "반복되면 사용자가 특정 화면이나 기능을 안정적으로 사용하지 못할 수 있습니다.",
    likely:
      "message와 stack 첫 번째 앱 파일을 기준으로 원인을 좁혀야 합니다.",
    action:
      "반복 발생하면 이 에러 패턴을 `explainError()`에 추가해 운영 설명을 보강하세요.",
  };
}
