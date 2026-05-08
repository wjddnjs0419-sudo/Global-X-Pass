export interface ConsultingCategory {
  id: string;
  label: string;
  display_order: number;
}

export const CONSULTING_CATEGORIES_TABLE = "consulting_categories";

export const DEFAULT_CONSULTING_CATEGORIES: ConsultingCategory[] = [
  { id: "legal",  label: "법률/특허/회계", display_order: 0 },
  { id: "global", label: "글로벌 진출",    display_order: 1 },
  { id: "tech",   label: "기술 자문",      display_order: 2 },
];

export function getConsultingCategoryLabel(id: string, categories: ConsultingCategory[]): string {
  return categories.find(c => c.id === id)?.label ?? id;
}

export function generateConsultingCategoryId(): string {
  return "c_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 6);
}
