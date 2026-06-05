import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const root = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(root, '..');

async function readText(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch {
    return null;
  }
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
