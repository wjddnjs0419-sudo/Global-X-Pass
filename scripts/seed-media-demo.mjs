import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, "..");

function readEnv() {
  const raw = readFileSync(path.join(ROOT, ".env"), "utf8");
  const env = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const [key, ...rest] = trimmed.split("=");
    env[key.trim()] = rest.join("=").trim();
  }
  return env;
}

const env = readEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const coverFiles = {
  red: "media-cover-red.png",
  blue: "media-cover-blue.png",
  mint: "media-cover-mint.png",
  purple: "media-cover-purple.png",
  yellow: "media-cover-yellow.png",
};

const coverSourceFiles = {
  red: "media-cover-red.png",
  blue: "media-cover-blue.png",
  mint: "media-cover-mint.png",
  purple: "media-cover-purple.png",
  yellow: "media-cover-yellow.png",
};

const youtubeThumb = (id) => `https://img.youtube.com/vi/${id}/hqdefault.jpg`;
const createdAt = (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString();

function mediaMeta(externalUrl) {
  const encoded = Buffer.from(encodeURIComponent(JSON.stringify({ externalUrl }))).toString("base64");
  return `<!--GXP_MEDIA_META:${encoded}-->`;
}

function body(text) {
  return `<p>${text}</p>`;
}

function externalBody(url, text) {
  return `${mediaMeta(url)}${body(text)}`;
}

async function uploadCoverImages() {
  const urls = {};
  for (const [key, targetName] of Object.entries(coverFiles)) {
    const sourceFile = coverSourceFiles[key];
    const bytes = readFileSync(path.join(ROOT, "src", "imports", sourceFile));
    const storagePath = `media-demo/${targetName}`;
    const { error } = await supabase.storage
      .from("images")
      .upload(storagePath, bytes, { contentType: "image/png", upsert: true });
    if (error) throw new Error(`Failed to upload ${targetName}: ${error.message}`);
    urls[key] = supabase.storage.from("images").getPublicUrl(storagePath).data.publicUrl;
  }
  return urls;
}

function makeRows(covers) {
  return [
    {
      id: "11111111-1111-4111-8111-111111111111",
      title: "2026 글로벌 앱 마켓 진출 리포트",
      content: body("글로벌 앱 시장 진출을 준비하는 스타트업을 위해 지역별 성장률, 카테고리별 기회, 초기 진입 전략을 정리한 자체 제작 리포트입니다."),
      category: "media",
      image_url: covers.red,
      created_at: createdAt(2),
      views: 0,
      tags: "report",
    },
    {
      id: "11111111-1111-4111-8111-111111111112",
      title: "미국 소재 한국계 스타트업 맵",
      content: body("미국 주요 도시에서 활동하는 한국계 스타트업의 산업군, 투자 단계, 성장 흐름을 한눈에 볼 수 있도록 정리한 발간물입니다."),
      category: "media",
      image_url: covers.blue,
      created_at: createdAt(6),
      views: 0,
      tags: "report",
    },
    {
      id: "11111111-1111-4111-8111-111111111113",
      title: "창업기업 지원제도의 의의와 쟁점",
      content: body("국내외 창업 지원제도의 변화와 쟁점을 짚고, 글로벌 진출 기업에게 필요한 정책적 지원 방향을 분석합니다."),
      category: "media",
      image_url: covers.mint,
      created_at: createdAt(10),
      views: 0,
      tags: "issue-paper",
    },
    {
      id: "11111111-1111-4111-8111-111111111114",
      title: "Startup Boards & Gender Diversity",
      content: body("스타트업 이사회 구성과 다양성이 기업 성장, 투자 유치, 글로벌 확장 의사결정에 미치는 영향을 살펴봅니다."),
      category: "media",
      image_url: covers.yellow,
      created_at: createdAt(14),
      views: 0,
      tags: "issue-paper",
    },
    {
      id: "11111111-1111-4111-8111-111111111115",
      title: "AI Native 팀의 제품 출시 방식",
      content: body("AI 도구를 전제로 일하는 초기 팀들이 제품 검증, 고객 인터뷰, 릴리즈 주기를 어떻게 바꾸고 있는지 정리했습니다."),
      category: "media",
      image_url: covers.purple,
      created_at: createdAt(18),
      views: 0,
      tags: "trend-report",
    },
    {
      id: "11111111-1111-4111-8111-111111111116",
      title: "글로벌 B2B SaaS 세일즈 전환 흐름",
      content: body("엔터프라이즈 구매 여정이 길어지는 환경에서 초기 SaaS 팀이 시도할 수 있는 파이프라인 설계와 시장 진입 방식을 다룹니다."),
      category: "media",
      image_url: covers.red,
      created_at: createdAt(23),
      views: 0,
      tags: "trend-report",
    },
    {
      id: "11111111-1111-4111-8111-111111111117",
      title: "창업자의 첫 글로벌 고객 만들기",
      content: externalBody("https://youtu.be/0kOOJf5IQHQ", "첫 해외 고객을 만나기 전 준비해야 할 시장 가설, 콜드 아웃리치, 파일럿 제안서의 구조를 이야기합니다."),
      category: "media",
      image_url: youtubeThumb("0kOOJf5IQHQ"),
      created_at: createdAt(28),
      views: 0,
      tags: "podcast",
    },
    {
      id: "11111111-1111-4111-8111-111111111118",
      title: "투자자 미팅 전 반드시 점검할 것들",
      content: externalBody("https://youtu.be/JQfGT39QHeM", "피치덱보다 먼저 정리해야 하는 숫자, 팀 내 의사결정, 후속 커뮤니케이션 리듬을 실전 사례 중심으로 다룹니다."),
      category: "media",
      image_url: youtubeThumb("JQfGT39QHeM"),
      created_at: createdAt(31),
      views: 0,
      tags: "podcast",
    },
    {
      id: "11111111-1111-4111-8111-111111111119",
      title: "Global X Pass 미디어 영상 01",
      content: externalBody("https://youtu.be/0kOOJf5IQHQ", "사용자가 수집한 YouTube 링크를 기반으로 미디어 페이지의 영상 카드 배치를 확인하기 위한 샘플 콘텐츠입니다."),
      category: "media",
      image_url: youtubeThumb("0kOOJf5IQHQ"),
      created_at: createdAt(34),
      views: 0,
      tags: "video",
    },
    {
      id: "11111111-1111-4111-8111-111111111120",
      title: "Global X Pass 미디어 영상 02",
      content: externalBody("https://youtu.be/JQfGT39QHeM", "영상 콘텐츠가 여러 개 있을 때 필터와 카드 밀도가 자연스럽게 보이는지 확인하기 위한 샘플 게시물입니다."),
      category: "media",
      image_url: youtubeThumb("JQfGT39QHeM"),
      created_at: createdAt(38),
      views: 0,
      tags: "video",
    },
    {
      id: "11111111-1111-4111-8111-111111111121",
      title: "Global X Pass 미디어 영상 03",
      content: externalBody("https://youtu.be/rkxbFbBBOGs", "YouTube 썸네일 비율과 영상형 카드 배치를 확인하기 위한 샘플 콘텐츠입니다."),
      category: "media",
      image_url: youtubeThumb("rkxbFbBBOGs"),
      created_at: createdAt(42),
      views: 0,
      tags: "video",
    },
    {
      id: "11111111-1111-4111-8111-111111111122",
      title: "Global X Pass 미디어 영상 04",
      content: externalBody("https://youtu.be/H2woET-bLgs", "미디어 페이지의 영상 필터, 재생 pill, 카드 CTA 문구를 함께 검토하기 위한 샘플 콘텐츠입니다."),
      category: "media",
      image_url: youtubeThumb("H2woET-bLgs"),
      created_at: createdAt(47),
      views: 0,
      tags: "video",
    },
    {
      id: "11111111-1111-4111-8111-111111111123",
      title: "How Great Leaders Inspire Action | Simon Sinek | TED",
      content: externalBody("https://www.youtube.com/watch?v=qp0HIF3SfI4", "리더가 사람을 움직이는 방식과 Why에서 출발하는 메시지 구조를 살펴보는 TED Talks 인터뷰형 영상 샘플입니다."),
      category: "media",
      image_url: youtubeThumb("qp0HIF3SfI4"),
      created_at: createdAt(51),
      views: 0,
      tags: "interview",
    },
    {
      id: "11111111-1111-4111-8111-111111111124",
      title: "Do Schools Kill Creativity? | Sir Ken Robinson | TED",
      content: externalBody("https://www.youtube.com/watch?v=iG9CE55wbtY", "창의성, 교육, 문제 해결 방식에 대한 관점을 넓혀주는 TED Talks 인터뷰형 영상 샘플입니다."),
      category: "media",
      image_url: youtubeThumb("iG9CE55wbtY"),
      created_at: createdAt(56),
      views: 0,
      tags: "interview",
    },
    {
      id: "11111111-1111-4111-8111-111111111125",
      title: "The Single Biggest Reason Why Startups Succeed | Bill Gross | TED",
      content: externalBody("https://www.youtube.com/watch?v=bNpx7gpSqbY", "스타트업 성공 요인을 데이터로 비교하며 타이밍, 팀, 아이디어의 관계를 설명하는 TED Talks 영상 샘플입니다."),
      category: "media",
      image_url: youtubeThumb("bNpx7gpSqbY"),
      created_at: createdAt(60),
      views: 0,
      tags: "interview",
    },
  ];
}

async function main() {
  const covers = await uploadCoverImages();
  const rows = makeRows(covers);
  const titles = rows.map((row) => row.title);

  const { error: deleteError } = await supabase
    .from("posts")
    .delete()
    .eq("category", "media")
    .in("title", titles);
  if (deleteError) throw new Error(`Failed to remove old demo rows: ${deleteError.message}`);

  const { error: insertError } = await supabase.from("posts").insert(rows);
  if (insertError) throw new Error(`Failed to insert media demo rows: ${insertError.message}`);

  console.log(`Seeded ${rows.length} media posts.`);
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
