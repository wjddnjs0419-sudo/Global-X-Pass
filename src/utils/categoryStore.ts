const DEFAULT_PRESETS = ["네트워킹","피칭","투자","글로벌","교육","IR","멘토링","데모데이","창업","커뮤니티","기술","정책","뉴스"];
const HIDDEN_KEY = "ncf_hidden_tags";
const CUSTOM_KEY = "ncf_custom_tags";

function loadJSON(key: string): string[] {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
}

export function getActivePresets(): string[] {
  const hidden = loadJSON(HIDDEN_KEY);
  const custom = loadJSON(CUSTOM_KEY);
  return [
    ...DEFAULT_PRESETS.filter(t => !hidden.includes(t)),
    ...custom.filter(t => !hidden.includes(t) && !DEFAULT_PRESETS.includes(t)),
  ];
}

export function getHiddenCategories(): string[] {
  return loadJSON(HIDDEN_KEY);
}

export function addCategory(tag: string): void {
  const hidden = loadJSON(HIDDEN_KEY);
  if (hidden.includes(tag)) {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify(hidden.filter((t: string) => t !== tag)));
  }
  if (!DEFAULT_PRESETS.includes(tag)) {
    const custom = loadJSON(CUSTOM_KEY);
    if (!custom.includes(tag)) {
      localStorage.setItem(CUSTOM_KEY, JSON.stringify([...custom, tag]));
    }
  }
}

export function deleteCategory(tag: string): void {
  const hidden = loadJSON(HIDDEN_KEY);
  if (!hidden.includes(tag)) {
    localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hidden, tag]));
  }
}
