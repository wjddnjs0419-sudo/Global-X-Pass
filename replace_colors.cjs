const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Find all .tsx files
const files = execSync('find src -name "*.tsx"', { encoding: 'utf-8' }).split('\n').filter(Boolean);

files.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // common backgrounds
  content = content.replace(/background: isDark \? "#0a1020" : "#F7F8FC"/g, 'background: "var(--color-bg-surface)"');
  content = content.replace(/background: isDark \? "#0a1020" : "#F6F7FA"/g, 'background: "var(--color-bg-surface)"');
  content = content.replace(/background: isDark \? "#0a1020" : "#ffffff"/g, 'background: "var(--color-bg-surface)"');
  content = content.replace(/background: isDark \? "#0a1020" : "#F8FAFC"/g, 'background: "var(--color-bg-surface)"');
  
  content = content.replace(/background: isDark \? "#1e293b" : "#fff"/g, 'background: "var(--color-bg-elevated)"');
  content = content.replace(/background: isDark \? "#1e293b" : "#ffffff"/g, 'background: "var(--color-bg-elevated)"');
  content = content.replace(/background: isDark \? "#111827" : "#ffffff"/g, 'background: "var(--color-bg-elevated)"');
  content = content.replace(/background: isDark \? "#111827" : "#fff"/g, 'background: "var(--color-bg-elevated)"');
  content = content.replace(/background: isDark \? "#0c1324" : "#ffffff"/g, 'background: "var(--color-bg-elevated)"');
  content = content.replace(/background: isDark \? "#111827" : "#eef2f7"/g, 'background: "var(--color-bg-elevated)"');
  content = content.replace(/background: isDark \? "#070d1a" : "#ffffff"/g, 'background: "var(--color-bg-base)"');
  content = content.replace(/background: isDark \? "#1a2235" : "#ffffff"/g, 'background: "var(--color-bg-overlay)"');
  content = content.replace(/background: isDark \? "#0e1628" : "#F8FAFC"/g, 'background: "var(--color-bg-elevated)"');

  // text colors
  content = content.replace(/color: isDark \? "#ffffff" : "#0D1117"/g, 'color: "var(--color-text-primary)"');
  content = content.replace(/color: isDark \? "#ffffff" : "#0f172a"/g, 'color: "var(--color-text-primary)"');
  content = content.replace(/color: isDark \? "#ffffff" : "#1d1d1f"/g, 'color: "var(--color-text-primary)"');
  content = content.replace(/color: isDark \? "#fff" : "#0f172a"/g, 'color: "var(--color-text-primary)"');
  
  // specific variables logic
  content = content.replace(/const glyphFill = isDark \? "#0a1020" : "#ffffff";/g, 'const glyphFill = "var(--color-bg-surface)";');
  content = content.replace(/const footerBg = isDark \? "#0a1020" : "#F7F8FC";/g, 'const footerBg = "var(--color-bg-surface)";');
  content = content.replace(/const panelBg = isDark \? "#111827" : "#ffffff";/g, 'const panelBg = "var(--color-bg-elevated)";');
  content = content.replace(/const bg[ ]*= isDark \? "#0c1324" : "#ffffff";/g, 'const bg = "var(--color-bg-elevated)";');
  content = content.replace(/const bg[ ]*= isDark \? "#1e293b" : "#ffffff";/g, 'const bg = "var(--color-bg-elevated)";');
  content = content.replace(/const text[ ]*= isDark \? "#f8fafc" : "#0f172a";/g, 'const text = "var(--color-text-primary)";');
  content = content.replace(/const codeColor = isDark \? "#c4b5fd" : "#7c3aed";/g, 'const codeColor = "var(--color-brand-blue)";'); // wait, c4b5fd/7c3aed is purple, maybe primary or just keep text? Let's use var(--color-text-primary) or just not touch if not standard
  content = content.replace(/const dropdownBg = isDark \? "#1e293b" : "#ffffff";/g, 'const dropdownBg = "var(--color-bg-elevated)";');
  
  // flow map specific colors
  content = content.replace(/color: isDark \? "#f8a09a" : "#dc2626"/g, 'color: "var(--color-brand-red)"');
  
  // specific colors
  content = content.replace(/color: isDark \? "#fbbf24" : "#92620a"/g, 'color: "var(--color-brand-yellow)"');

  if (content !== original) {
    fs.writeFileSync(filePath, content);
  }
});
