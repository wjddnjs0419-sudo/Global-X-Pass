// npm run sync — 맥/윈도우 공용 원클릭 동기화.
// 1) 원격 최신 pull  2) 의존성 설치  3) 맥이면 lock 변경분 정리  4) 한글 안내.
// 비개발자 인수자가 "작업 전 npm run sync 한 줄"만 기억하면 되도록 설계.
import { execFileSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
// lock은 윈도우만 커밋·관리. 그 외 머신(맥·리눅스)은 lock 변경분을 항상 버린다.
const isLockOwner = process.platform === 'win32';

// 출력 캡처용 (실패해도 throw 안 함)
function capture(cmd, args) {
  try {
    const out = execFileSync(cmd, args, {
      cwd: repoRoot,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return { ok: true, out };
  } catch {
    return { ok: false, out: null };
  }
}

// 사용자에게 진행 상황을 그대로 보여주는 실행 (stdio 상속)
function run(cmd, args) {
  const res = spawnSync(cmd, args, { cwd: repoRoot, stdio: 'inherit', shell: false });
  return res.status === 0;
}

function line(msg) {
  console.log(msg);
}

// package-lock.json 변경분이 있으면 버린다 (lock 비관리 머신 전용).
// { changed: 변경 있었나, ok: checkout 성공했나 } 반환. 변경 없으면 ok:true.
function discardLockChanges() {
  const changed = (capture('git', ['status', '--porcelain', 'package-lock.json']).out ?? '') !== '';
  if (!changed) return { changed: false, ok: true };
  const res = capture('git', ['checkout', '--', 'package-lock.json']);
  return { changed: true, ok: res.ok };
}

function main() {
  line('🔄 동기화 시작 — 원격 최신 내용을 받아옵니다.\n');

  // 0. git repo 확인
  if (!capture('git', ['rev-parse', '--is-inside-work-tree']).ok) {
    line('❌ git 저장소가 아닙니다. 프로젝트 폴더 안에서 실행하세요.');
    process.exit(1);
  }

  // 1. lock 비관리 머신이면 시작 전 lock noise를 먼저 정리 → dirty 판정을 깨끗하게.
  //    (윈도우는 lock을 직접 관리하므로 정리하지 않고 아래 dirty 검사에 포함시킨다.)
  if (!isLockOwner) {
    const r = discardLockChanges();
    if (r.changed && !r.ok) {
      line('⚠️ package-lock.json 자동 정리 실패 — `git checkout -- package-lock.json` 수동 실행 후 재시도.\n');
      process.exit(1);
    }
  }

  // 2. 미커밋 변경분 점검 (lock 포함). 비관리 머신은 1단계로 lock 이미 정리됨.
  const porcelain = capture('git', ['status', '--porcelain']).out ?? '';
  const dirty = porcelain ? porcelain.split('\n').filter(Boolean) : [];
  if (dirty.length > 0) {
    line(`⚠️ 저장 안 한 변경분이 ${dirty.length}건 있습니다.`);
    line('   pull 전에 먼저 커밋하거나 정리하세요. (충돌 방지)');
    line('   변경 목록은 `git status` 로 확인.\n');
    process.exit(1);
  }

  // 2. 원격 최신 받기 (fast-forward만 — 안전)
  line('① 원격 변경 받기 (git pull)...');
  const pulled = run('git', ['pull', '--ff-only']);
  if (!pulled) {
    line('\n❌ pull 실패. 아래 중 하나일 수 있습니다:');
    line('   • 로그인 만료 → `gh auth login` 다시 실행 (또는 인증 점검)');
    line('   • 인터넷 연결 없음 → 연결 확인 후 재시도');
    line('   • 내 커밋과 원격이 갈라짐(diverged) → 도움 요청 (자동 병합 안 함)');
    process.exit(1);
  }
  line('   ✅ 받기 완료.\n');

  // 3. 의존성 설치 (lock/패키지 바뀌었을 수 있으니 항상)
  line('② 부품 설치 (npm install)...');
  const installed = run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['install']);
  if (!installed) {
    line('\n❌ npm install 실패. 위 메시지를 확인하세요.');
    process.exit(1);
  }
  line('   ✅ 설치 완료.\n');

  // 4. 비관리 머신이면 install이 만든 lock 변경분 되돌림 (lock은 윈도우만 관리 — 충돌 방지).
  if (!isLockOwner) {
    const r = discardLockChanges();
    if (r.changed && r.ok) {
      line('③ package-lock.json 변경분 자동 정리 — lock은 윈도우만 관리.\n');
    } else if (r.changed && !r.ok) {
      line('⚠️ package-lock.json 자동 정리 실패 — `git checkout -- package-lock.json` 수동 실행 필요.\n');
    }
  }

  line('✅ 동기화 끝. 이제 작업을 시작하세요.');
}

main();
