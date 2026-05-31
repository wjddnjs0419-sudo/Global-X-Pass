import fs from 'fs';
import path from 'path';

const PLAN_PATH = 'PLAN.md';
const RESULT_PATH = 'RESULT.md';
const ARCHIVE_PATH = 'RESULT_ARCHIVE.md';

function compactPlan() {
  if (!fs.existsSync(PLAN_PATH)) return;
  const content = fs.readFileSync(PLAN_PATH, 'utf8');
  const lines = content.split('\n');
  
  const doneStartIndex = lines.findIndex(l => l.startsWith('## Done'));
  const futureStartIndex = lines.findIndex(l => l.startsWith('## Future'));
  
  if (doneStartIndex === -1) return;
  
  const header = lines.slice(0, doneStartIndex + 1);
  const doneSection = lines.slice(doneStartIndex + 1, futureStartIndex !== -1 ? futureStartIndex : lines.length);
  const footer = futureStartIndex !== -1 ? lines.slice(futureStartIndex) : [];
  
  // [Done] 항목 필터링 및 압축
  const doneItems = doneSection
    .filter(l => l.trim().startsWith('- [Done]'))
    .map(l => l.split('—')[0].trim() + ' — 압축됨. 상세 RESULT_ARCHIVE.md.')
    .slice(0, 10); // 최신 10개만 유지
    
  const newContent = [...header, '', ...doneItems, '', ...footer].join('\n').replace(/\n{3,}/g, '\n\n');
  fs.writeFileSync(PLAN_PATH, newContent);
  console.log('✅ PLAN.md 압축 완료 (최신 10개 유지)');
}

function archiveResult() {
  if (!fs.existsSync(RESULT_PATH)) return;
  const resultMsg = fs.readFileSync(RESULT_PATH, 'utf8');
  
  // 최신 작업(첫 번째 섹션)과 과거 작업 분리
  const sections = resultMsg.split('\n---').map(s => s.trim()).filter(Boolean);
  if (sections.length <= 1) return;
  
  const latest = sections[0];
  const oldies = sections.slice(1).join('\n\n---\n\n');
  
  // 아카이브에 과거 내역 추가
  if (fs.existsSync(ARCHIVE_PATH)) {
    const archive = fs.readFileSync(ARCHIVE_PATH, 'utf8');
    fs.writeFileSync(ARCHIVE_PATH, oldies + '\n\n---\n\n' + archive);
  } else {
    fs.writeFileSync(ARCHIVE_PATH, oldies);
  }
  
  // RESULT.md에는 최신 것만 남김
  fs.writeFileSync(RESULT_PATH, latest + '\n');
  console.log('✅ RESULT.md 아카이빙 완료 (과거 내역 RESULT_ARCHIVE.md로 이관)');
}

try {
  compactPlan();
  archiveResult();
} catch (err) {
  console.error('❌ 문서 정리 중 오류 발생:', err.message);
  process.exit(1);
}
