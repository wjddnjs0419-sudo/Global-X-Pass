import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_FILE = path.join(ROOT, "src/generated/architectureMap.json");

const SCAN_ROOTS = [
  path.join(ROOT, "src"),
  path.join(ROOT, "supabase/functions"),
];

const CLUSTERS = [
  {
    id: "entry",
    label: "Entry",
    displayLabel: "앱 출입구",
    description: "사이트가 처음 켜지고 전역 설정을 연결하는 시작점입니다.",
    color: "blue",
    keywords: ["시작", "앱", "부트스트랩", "provider"],
  },
  {
    id: "routes",
    label: "Routes",
    displayLabel: "길 안내판",
    description: "URL별 화면과 보호 라우트 흐름을 연결합니다.",
    color: "green",
    keywords: ["라우트", "경로", "페이지 이동", "권한"],
  },
  {
    id: "pages",
    label: "Pages",
    displayLabel: "방문자 화면",
    description: "사용자와 운영자가 실제로 방문하는 페이지 단위 화면입니다.",
    color: "green",
    keywords: ["페이지", "공지", "뉴스", "행사", "신청", "프로필", "블로그"],
  },
  {
    id: "components",
    label: "Components",
    displayLabel: "화면 부품",
    description: "여러 페이지에서 재사용되는 섹션과 UI 조각입니다.",
    color: "purple",
    keywords: ["컴포넌트", "섹션", "버튼", "모달", "헤더", "푸터"],
  },
  {
    id: "admin",
    label: "Admin",
    displayLabel: "운영자 도구",
    description: "관리자가 게시물, 사용자, 프로그램을 운영하는 화면입니다.",
    color: "red",
    keywords: ["관리자", "운영", "대시보드", "사용자", "게시물", "승인"],
  },
  {
    id: "hooks",
    label: "Hooks",
    displayLabel: "상태 센서",
    description: "로그인, 추적, 자동 로그아웃 같은 화면 공통 상태를 관리합니다.",
    color: "blue",
    keywords: ["hook", "상태", "세션", "로그인", "추적"],
  },
  {
    id: "utils",
    label: "Utils",
    displayLabel: "계산 도구함",
    description: "날짜, 파일명, 신청 상태 같은 도메인 값을 계산합니다.",
    color: "yellow",
    keywords: ["유틸", "계산", "파일", "신청", "변환"],
  },
  {
    id: "lib",
    label: "Lib",
    displayLabel: "공용 연결부",
    description: "Supabase 클라이언트, 타입, 로깅처럼 앱 전역 연결을 담당합니다.",
    color: "blue",
    keywords: ["supabase", "타입", "로그", "연결", "클라이언트"],
  },
  {
    id: "edge",
    label: "Edge Functions",
    displayLabel: "서버 작업실",
    description: "브라우저가 직접 하면 위험한 관리자/PII 작업을 서버에서 처리합니다.",
    color: "red",
    keywords: ["edge", "서버", "암호화", "복호화", "권한", "PII"],
  },
  {
    id: "data",
    label: "Data",
    displayLabel: "데이터 보관소",
    description: "자동 분류되지 않은 데이터 연결 및 보조 파일 묶음입니다.",
    color: "yellow",
    keywords: ["데이터", "저장", "모델", "상수"],
  },
];

const FEATURE_TAGS = [
  ["auth", /AuthRoute|AdminRoute|LoginPage|SignupPage|MyPage|useAdmin|change-password|update-user-role|decrypt-own-profile/i],
  ["events", /EventsPage|EventApplicationPage|EventSection|AdminEventManagement|eventApplication/i],
  ["consulting", /ConsultingPage|ConsultingBookingModal|AdminConsultingManagement|consulting/i],
  ["founders", /FoundersClubPage|AdminFoundersClubManagement|founders-club/i],
  ["admin", /Admin|admin/i],
  ["pii", /decrypt|encrypt|profile|PII/i],
  ["media", /Media|media/i],
  ["posts", /Post|Notice|Resource|Blog|Faq|News/i],
];

const KNOWN_NODE_IDS = new Map([
  ["src/main.tsx", "main"],
  ["src/app/App.tsx", "app"],
  ["src/app/routes.tsx", "routes"],
  ["src/app/components/RootLayout.tsx", "root-layout"],
  ["src/app/ThemeContext.tsx", "theme-ctx"],
  ["src/app/LanguageContext.tsx", "lang-ctx"],
  ["src/app/components/AuthRoute.tsx", "auth-route"],
  ["src/app/components/AdminRoute.tsx", "admin-route"],
  ["src/app/components/ErrorBoundary.tsx", "error-boundary"],
  ["src/app/components/HomePage.tsx", "home-page"],
  ["src/app/pages/EventsPage.tsx", "events-page"],
  ["src/app/pages/NoticePage.tsx", "notice-page"],
  ["src/app/pages/PostDetailPage.tsx", "post-detail"],
  ["src/app/pages/LoginPage.tsx", "login-page"],
  ["src/app/pages/SignupPage.tsx", "signup-page"],
  ["src/app/pages/EventApplicationPage.tsx", "event-apply"],
  ["src/app/pages/ConsultingPage.tsx", "consulting-page"],
  ["src/app/pages/FoundersClubPage.tsx", "founders-club"],
  ["src/app/pages/MyPage.tsx", "mypage"],
  ["src/app/pages/AdminPage.tsx", "admin-page"],
  ["src/app/components/HeaderSection.tsx", "header-section"],
  ["src/app/components/PageShell.tsx", "page-shell"],
  ["src/app/components/ConsultingBookingModal.tsx", "consulting-modal"],
  ["src/hooks/useAdmin.ts", "use-admin"],
  ["src/hooks/useTracker.ts", "use-tracker"],
  ["src/hooks/useIdleLogout.ts", "use-idle"],
  ["src/lib/supabaseClient.ts", "supabase-client"],
  ["src/lib/types.ts", "types"],
  ["src/utils/eventApplication.ts", "event-utils"],
  ["src/utils/htmlSecurity.ts", "html-security"],
  ["src/app/components/admin/AdminEventManagement.tsx", "admin-events-mgmt"],
  ["src/app/components/admin/AdminConsultingManagement.tsx", "admin-consulting-mgmt"],
  ["src/app/components/admin/AdminFoundersClubManagement.tsx", "admin-founders-mgmt"],
  ["supabase/functions/_shared/adminAuth.ts", "ef-admin-auth"],
  ["supabase/functions/signup-profile/index.ts", "ef-signup"],
  ["supabase/functions/encrypt-profile/index.ts", "ef-encrypt"],
  ["supabase/functions/decrypt-profiles/index.ts", "ef-decrypt"],
  ["supabase/functions/decrypt-own-profile/index.ts", "ef-decrypt-own"],
  ["supabase/functions/delete-user/index.ts", "ef-delete"],
  ["supabase/functions/update-user-role/index.ts", "ef-update-role"],
  ["supabase/functions/bulk-register-users/index.ts", "ef-bulk"],
  ["supabase/functions/consulting-admin-reservations/index.ts", "ef-consulting"],
  ["supabase/functions/founders-club-admin-applications/index.ts", "ef-founders"],
  ["supabase/functions/sync-naver-blog/index.ts", "ef-blog-sync"],
  ["supabase/functions/change-password/index.ts", "ef-change-password"],
]);

function toPosix(value) {
  return value.split(path.sep).join("/");
}

function rel(file) {
  return toPosix(path.relative(ROOT, file));
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name === "dist" || entry.name === "generated") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, output);
    } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith(".d.ts")) {
      output.push(full);
    }
  }
  return output;
}

function nodeIdFor(relativePath) {
  return KNOWN_NODE_IDS.get(relativePath) ?? relativePath
    .replace(/\.(tsx|ts)$/, "")
    .replace(/\/index$/, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

function labelFor(relativePath) {
  if (relativePath.endsWith("/index.ts")) {
    const parts = relativePath.split("/");
    return parts.slice(-2).join("/");
  }
  return relativePath.split("/").at(-1) ?? relativePath;
}

function clusterFor(relativePath) {
  if (relativePath === "src/main.tsx" || relativePath === "src/app/App.tsx") return "entry";
  if (relativePath === "src/app/routes.tsx") return "routes";
  if (relativePath.startsWith("src/app/pages/")) return "pages";
  if (relativePath.startsWith("src/app/components/admin/")) return "admin";
  if (relativePath.startsWith("src/app/components/")) return "components";
  if (relativePath.startsWith("src/hooks/")) return "hooks";
  if (relativePath.startsWith("src/utils/") || relativePath.startsWith("src/app/utils/")) return "utils";
  if (relativePath.startsWith("src/lib/")) return "lib";
  if (relativePath.startsWith("supabase/functions/")) return "edge";
  return "data";
}

function readJSDoc(sourceText) {
  const header = sourceText.slice(0, 1800);
  const match = header.match(/\/\*\*([\s\S]*?)\*\//);
  const tags = {};
  if (!match) return tags;
  for (const rawLine of match[1].split("\n")) {
    const line = rawLine.replace(/^\s*\*\s?/, "").trim();
    const tag = line.match(/^@(\w+)\s*(.*)$/);
    if (!tag) continue;
    const [, key, value] = tag;
    if (key === "notes") {
      tags.notes = [...(tags.notes ?? []), value];
    } else if (key === "tag") {
      tags.tag = value.split(/\s+/).filter(Boolean);
    } else if (key === "critical") {
      tags.critical = true;
    } else {
      tags[key] = value;
    }
  }
  return tags;
}

function firstExportLine(sourceFile) {
  for (const statement of sourceFile.statements) {
    if (statement.modifiers?.some((m) => m.kind === ts.SyntaxKind.ExportKeyword)) {
      return sourceFile.getLineAndCharacterOfPosition(statement.pos).line + 1;
    }
  }
  return 1;
}

function inferTags(relativePath, label, jsdocTags) {
  const tags = new Set(["overview", "all", ...(jsdocTags.tag ?? [])]);
  const haystack = `${relativePath} ${label}`;
  for (const [tag, pattern] of FEATURE_TAGS) {
    if (pattern.test(haystack)) tags.add(tag);
  }
  return [...tags];
}

function inferRole(relativePath, cluster) {
  if (cluster === "entry") return "애플리케이션을 부트스트랩하고 전역 provider와 router를 연결합니다.";
  if (cluster === "routes") return "React Router 경로와 보호 라우트 구성을 정의합니다.";
  if (cluster === "pages") return "사용자가 직접 방문하는 페이지 단위 화면입니다.";
  if (cluster === "admin") return "관리자 대시보드의 특정 운영 기능을 담당합니다.";
  if (cluster === "edge") return "Supabase Edge Function 런타임에서 서버 권한 작업을 처리합니다.";
  if (cluster === "hooks") return "컴포넌트에서 재사용하는 상태와 부수효과 로직입니다.";
  if (cluster === "lib") return "앱 전역에서 공유하는 클라이언트 또는 타입 기반 모듈입니다.";
  if (cluster === "utils") return "도메인 값을 계산하거나 변환하는 순수 보조 모듈입니다.";
  return "UI를 구성하는 재사용 컴포넌트입니다.";
}

function inferPlain(relativePath, cluster) {
  if (cluster === "edge") return "브라우저가 직접 할 수 없는 민감한 서버 작업을 대신 수행하는 파일입니다.";
  if (cluster === "admin") return "운영자가 데이터를 확인하고 처리하는 관리자 화면의 일부입니다.";
  if (cluster === "pages") return "사이트 방문자가 실제로 보는 한 화면입니다.";
  return `${relativePath} 파일이 앱의 한 부분을 담당합니다.`;
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;
  const fromDir = path.dirname(fromFile);
  const base = specifier.startsWith("@/")
    ? path.join(ROOT, "src", specifier.slice(2))
    : path.resolve(fromDir, specifier);
  const candidates = [
    base,
    `${base}.ts`,
    `${base}.tsx`,
    path.join(base, "index.ts"),
    path.join(base, "index.tsx"),
  ];
  return candidates.find((candidate) => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null;
}

function importsFor(file, sourceFile) {
  const imports = [];
  sourceFile.forEachChild((node) => {
    if (ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const resolved = resolveImport(file, node.moduleSpecifier.text);
      if (resolved) imports.push(resolved);
    }
    if (
      ts.isCallExpression(node) &&
      node.expression.kind === ts.SyntaxKind.ImportKeyword &&
      node.arguments.length === 1 &&
      ts.isStringLiteral(node.arguments[0])
    ) {
      const resolved = resolveImport(file, node.arguments[0].text);
      if (resolved) imports.push(resolved);
    }
  });
  return imports;
}

export function generateArchitectureMap(options = {}) {
  const files = SCAN_ROOTS.flatMap((root) => walk(root)).sort();
  const fileSet = new Set(files.map(rel));
  const parsed = files.map((file) => {
    const sourceText = fs.readFileSync(file, "utf8");
    const sourceFile = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true);
    const relativePath = rel(file);
    const cluster = clusterFor(relativePath);
    const jsdoc = readJSDoc(sourceText);
    const id = nodeIdFor(relativePath);
    const label = labelFor(relativePath);
    const line = firstExportLine(sourceFile);
    return {
      file,
      relativePath,
      sourceFile,
      id,
      cluster: jsdoc.cluster || cluster,
      label,
      line,
      role: jsdoc.role || inferRole(relativePath, cluster),
      plain: jsdoc.plain || inferPlain(relativePath, cluster),
      notes: jsdoc.notes || [
        `line:${line}, first exported symbol or module entry`,
        `cluster:${jsdoc.cluster || cluster}`,
      ],
      critical: Boolean(jsdoc.critical || ["main", "app", "routes", "root-layout", "supabase-client"].includes(id)),
      tag: inferTags(relativePath, label, jsdoc),
    };
  });

  const byFile = new Map(parsed.map((item) => [item.file, item]));
  const incoming = new Map(parsed.map((item) => [item.id, 0]));
  const edges = [];
  for (const item of parsed) {
    for (const importedFile of importsFor(item.file, item.sourceFile)) {
      const target = byFile.get(importedFile);
      if (!target) continue;
      incoming.set(target.id, (incoming.get(target.id) ?? 0) + 1);
      edges.push({
        from: item.id,
        to: target.id,
        kind: item.critical && target.critical ? "critical" : "normal",
        label: "import",
        tag: Array.from(new Set(["all", ...item.tag.filter((tag) => target.tag.includes(tag))])),
      });
    }
  }

  const entryIds = new Set(["main", "app", "routes"]);
  const nodes = parsed.map((item) => ({
    id: item.id,
    cluster: item.cluster,
    label: item.label,
    sub: incoming.get(item.id) === 0 && !entryIds.has(item.id) ? "DEAD, zero importers" : item.relativePath,
    path: `${item.relativePath}:${item.line}`,
    role: item.role,
    plain: item.plain,
    notes: item.notes,
    tag: item.tag,
    critical: item.critical,
    dead: incoming.get(item.id) === 0 && !entryIds.has(item.id),
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    roots: SCAN_ROOTS.map((root) => rel(root)).filter((root) => root && fileSet),
    clusters: CLUSTERS,
    nodes,
    edges,
  };

  if (options.write !== false) {
    fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
    fs.writeFileSync(OUT_FILE, `${JSON.stringify(output, null, 2)}\n`);
  }

  return output;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const map = generateArchitectureMap();
  console.log(`Generated ${rel(OUT_FILE)} (${map.nodes.length} nodes, ${map.edges.length} edges)`);
}
