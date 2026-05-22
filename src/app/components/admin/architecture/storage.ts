import { FLOATING_BELL_MARGIN, FLOATING_BELL_SIZE, INBOX_BELL_POSITION_STORAGE_KEY, INBOX_STORAGE_KEY, MAP_SNAPSHOT_STORAGE_KEY } from "./constants";
import type { ArchitectureMap, FloatingAnchorPosition } from "./types";

export function readStoredInboxState() {
  if (typeof window === "undefined") return { readIds: new Set<string>(), hiddenIds: new Set<string>() };
  try {
    const raw = window.localStorage.getItem(INBOX_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) as { readIds?: string[]; hiddenIds?: string[] } : {};
    return {
      readIds: new Set(parsed.readIds ?? []),
      hiddenIds: new Set(parsed.hiddenIds ?? []),
    };
  } catch {
    return { readIds: new Set<string>(), hiddenIds: new Set<string>() };
  }
}

export function writeStoredInboxState(readIds: Set<string>, hiddenIds: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INBOX_STORAGE_KEY, JSON.stringify({
    readIds: Array.from(readIds),
    hiddenIds: Array.from(hiddenIds),
  }));
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

export function getDefaultFloatingBellPosition(viewport: FloatingAnchorPosition): FloatingAnchorPosition {
  return {
    x: Math.max(FLOATING_BELL_MARGIN, viewport.x - FLOATING_BELL_MARGIN - FLOATING_BELL_SIZE),
    y: Math.max(FLOATING_BELL_MARGIN, viewport.y - FLOATING_BELL_MARGIN - FLOATING_BELL_SIZE),
  };
}

export function clampFloatingBellPosition(position: FloatingAnchorPosition, viewport: FloatingAnchorPosition): FloatingAnchorPosition {
  const maxX = Math.max(FLOATING_BELL_MARGIN, viewport.x - FLOATING_BELL_MARGIN - FLOATING_BELL_SIZE);
  const maxY = Math.max(FLOATING_BELL_MARGIN, viewport.y - FLOATING_BELL_MARGIN - FLOATING_BELL_SIZE);
  return {
    x: clamp(position.x, FLOATING_BELL_MARGIN, maxX),
    y: clamp(position.y, FLOATING_BELL_MARGIN, maxY),
  };
}

export function readStoredBellPosition() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(INBOX_BELL_POSITION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<FloatingAnchorPosition>;
    return typeof parsed.x === "number" && typeof parsed.y === "number"
      ? { x: parsed.x, y: parsed.y }
      : null;
  } catch {
    return null;
  }
}

export function writeStoredBellPosition(position: FloatingAnchorPosition) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(INBOX_BELL_POSITION_STORAGE_KEY, JSON.stringify(position));
}

export function readStoredMapSnapshot(): ArchitectureMap | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(MAP_SNAPSHOT_STORAGE_KEY);
    return raw ? JSON.parse(raw) as ArchitectureMap : null;
  } catch {
    return null;
  }
}

export function writeStoredMapSnapshot(data: ArchitectureMap) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(MAP_SNAPSHOT_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // Snapshot persistence is only a local convenience for the private app.
  }
}
