import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { execFileSync } from 'child_process';

const root = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(root, '..');

async function readText(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
}

function git(args) {
  // { ok, out } — 실패(비-0 종료/미설치)면 ok:false, out:null
  try {
    const out = execFileSync('git', args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return { ok: true, out };
  } catch {
    return { ok: false, out: null };
  }
}

function gitSyncStatus() {
  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']);
  if (!branch.ok) return null; // git repo 아님 또는 git 미설치

  // upstream(@{u}) 설정 여부 먼저 확인 — 없으면 behind/ahead 계산 불가
  const upstream = git(['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const hasUpstream = upstream.ok && !!upstream.out;

  // 원격 갱신 fetch (네트워크 없거나 권한 실패 시 ok:false)
  const fetched = hasUpstream ? git(['fetch', '--quiet']).ok : false;

  const porcelain = git(['status', '--porcelain']);
  const dirtyFiles = porcelain.out ? porcelain.out.split('\n').filter(Boolean) : [];
  const lockDirty = dirtyFiles.some((line) => line.endsWith('package-lock.json'));
  const nonLockDirty = dirtyFiles.filter((line) => !line.endsWith('package-lock.json'));

  // upstream 자체가 없으면 비교 불가 → unknown
  if (!hasUpstream) {
    return { branch: branch.out, state: 'unknown', reason: 'upstream 미설정', dirtyFiles, nonLockDirty, lockDirty };
  }

  // upstream 있으면 behind/ahead 계산 (fetch 실패 시 마지막 fetch 기준 = stale)
  const behindR = git(['rev-list', '--count', 'HEAD..@{u}']);
  const aheadR = git(['rev-list', '--count', '@{u}..HEAD']);
  if (!behindR.ok || !aheadR.ok) {
    // rev-list 실패 → 0/0 오판 방지, unknown 처리
    return { branch: branch.out, state: 'unknown', reason: 'rev-list 실패', dirtyFiles, nonLockDirty, lockDirty };
  }
  const behind = Number(behindR.out);
  const ahead = Number(aheadR.out);

  let state;
  if (behind === 0 && ahead === 0) state = 'in-sync';
  else if (behind > 0 && ahead === 0) state = 'behind-only';
  else if (behind === 0 && ahead > 0) state = 'ahead-only';
  else state = 'diverged';

  return { branch: branch.out, state, behind, ahead, stale: !fetched, dirtyFiles, nonLockDirty, lockDirty };
}

function extractHeadings(text) {
  if (!text) return [];
  return text
    .split(/\r?\n/)
    .filter((line) => /^#{2,3}\s/.test(line))
    .map((line) => line.trim());
}

function extractSection(text, sectionTitle) {
  if (!text) return null;
  const lines = text.split(/\r?\n/);
  const startIndex = lines.findIndex((line) => line.trim() === sectionTitle);
  if (startIndex === -1) return null;
  const sectionLines = [];
  for (let i = startIndex + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (/^##\s/.test(line)) break;
    sectionLines.push(line);
  }
  return sectionLines.join('\n').trim();
}

async function main() {
  const docFiles = [
    'docs/AGENT_RULES.md',
    'docs/AGENT_ANTI_PATTERNS.md',
    'PLAN.md',
    'RESULT.md',
  ].map((relative) => join(repoRoot, relative));

  const [agentRules, agentAnti, planMd, resultMd] = await Promise.all(
    docFiles.map((file) => readText(file)),
  );

  console.log('=== CLAUDE BOOTSTRAP SUMMARY ===\n');

  console.log('0. Git Sync (멀티 환경 — 맥 ↔ 윈도우)');
  console.log('----------------------------------------');
  const sync = gitSyncStatus();
  if (!sync) {
    console.log('  (git 정보 없음 — repo 아님 또는 git 미설치)');
  } else {
    if (sync.state === 'unknown') {
      console.log(`branch: ${sync.branch} | state: unknown (${sync.reason})`);
      console.log('⚠️ 원격 대비 상태 확인 불가 — upstream 설정 후 수동으로 `git status` 확인.');
    } else {
      const staleNote = sync.stale ? ' (⚠️ fetch 실패 — 마지막 fetch 기준 stale)' : '';
      console.log(`branch: ${sync.branch} | state: ${sync.state} | behind: ${sync.behind} | ahead: ${sync.ahead}${staleNote}`);
      if (sync.state === 'in-sync') {
        console.log('✅ 원격과 동기화됨.');
      } else if (sync.state === 'behind-only') {
        console.log(`⚠️ 로컬이 원격보다 ${sync.behind}커밋 뒤처짐 → 작업 전 \`git pull --ff-only\` 먼저 실행.`);
      } else if (sync.state === 'ahead-only') {
        console.log(`ℹ️ 로컬이 원격보다 ${sync.ahead}커밋 앞섬 → 푸시 대기 중(정상).`);
      } else {
        console.log(`⚠️ 발산: 뒤처짐 ${sync.behind} / 앞섬 ${sync.ahead} — \`--ff-only\` 불가. rebase/merge로 수동 해결 필요.`);
      }
    }
    if (sync.lockDirty) {
      console.log('⚠️ package-lock.json 변경됨 — 이 머신이 윈도우가 아니면 커밋 금지(`git checkout -- package-lock.json`). lock은 윈도우만 관리.');
    }
    if (sync.nonLockDirty.length > 0) {
      console.log(`작업트리 실제 작업분 ${sync.nonLockDirty.length}건 (lock 제외).`);
    }
  }
  console.log('');

  console.log('1. Search Docs');
  console.log('----------------');
  console.log('docs/AGENT_RULES.md headings:');
  extractHeadings(agentRules).forEach((heading) => console.log(`- ${heading}`));
  console.log('');
  console.log('docs/AGENT_ANTI_PATTERNS.md headings:');
  extractHeadings(agentAnti).forEach((heading) => console.log(`- ${heading}`));
  console.log('');

  console.log('2. Recent Context Summary');
  console.log('--------------------------');
  console.log('PLAN.md - ## In Progress section');
  console.log(extractSection(planMd, '## In Progress') || '  (section not found)');
  console.log('');
  console.log('RESULT.md - full content');
  console.log(resultMd ? resultMd.trim() : '  (file not found or empty)');
  console.log('');

  console.log('3. Targeted Read');
  console.log('------------------');
  console.log('Use the headings above to locate current rules and priorities.');
  console.log('Focus first on In Progress items and latest RESULT summary.');
}

main().catch((error) => {
  console.error('Bootstrap script failed:', error);
  process.exit(1);
});
