import { logError } from "./errorLogger";

const INTERACTIVE_SELECTOR = [
  "a[href]",
  "button",
  "input",
  "select",
  "textarea",
  "[role='button']",
  "[data-monitor-action]",
].join(",");

const MIN_TARGET_SIZE = 24;
const SCAN_DELAY_MS = 450;
const ACTION_SETTLE_MS = 1500;

function isVisible(element: Element, rect: DOMRect) {
  const style = window.getComputedStyle(element);
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.visibility !== "hidden" &&
    style.display !== "none" &&
    style.pointerEvents !== "none"
  );
}

function reportUxIssue(message: string, context: Record<string, unknown>) {
  void logError("root-layout", new Error(message), {
    severity: "low",
    context: {
      kind: "ux-health",
      path: window.location.pathname,
      ...context,
    },
  });
}

function scanLayoutHealth() {
  const root = document.documentElement;
  const viewportWidth = root.clientWidth;
  const overflow = root.scrollWidth - viewportWidth;

  if (overflow > 4) {
    reportUxIssue("UX layout issue: horizontal page overflow", {
      overflow,
      scrollWidth: root.scrollWidth,
      viewportWidth,
    });
  }

  const interactive = Array.from(document.querySelectorAll(INTERACTIVE_SELECTOR)).slice(0, 220);
  for (const element of interactive) {
    const rect = element.getBoundingClientRect();
    if (!isVisible(element, rect)) continue;

    const label =
      element.getAttribute("aria-label") ||
      element.textContent?.trim().slice(0, 80) ||
      element.getAttribute("href") ||
      element.tagName.toLowerCase();

    if (rect.right > viewportWidth + 2 || rect.left < -2) {
      reportUxIssue("UX layout issue: interactive element outside viewport", {
        label,
        tag: element.tagName.toLowerCase(),
        left: Math.round(rect.left),
        right: Math.round(rect.right),
        viewportWidth,
      });
      return;
    }

    if (rect.width < MIN_TARGET_SIZE || rect.height < MIN_TARGET_SIZE) {
      reportUxIssue("UX layout issue: interactive target is very small", {
        label,
        tag: element.tagName.toLowerCase(),
        width: Math.round(rect.width),
        height: Math.round(rect.height),
      });
      return;
    }
  }
}

export function installUxHealthChecks() {
  if (typeof window === "undefined") return () => {};

  let timer: ReturnType<typeof setTimeout> | null = null;
  let mutationVersion = 0;
  const schedule = () => {
    mutationVersion += 1;
    if (timer) clearTimeout(timer);
    timer = setTimeout(scanLayoutHealth, SCAN_DELAY_MS);
  };

  const onClick = (event: MouseEvent) => {
    const target = event.target instanceof Element
      ? event.target.closest("[data-monitor-action]")
      : null;
    if (!target) return;

    const action = target.getAttribute("data-monitor-action") || "unknown-action";
    const beforeUrl = window.location.href;
    const beforeMutation = mutationVersion;

    window.setTimeout(() => {
      const activeModal = document.querySelector("[role='dialog'], [data-state='open']");
      const changed =
        window.location.href !== beforeUrl ||
        mutationVersion !== beforeMutation ||
        Boolean(activeModal);

      if (!changed) {
        reportUxIssue("UX action issue: monitored action produced no visible change", {
          action,
          tag: target.tagName.toLowerCase(),
          label: target.textContent?.trim().slice(0, 80) || target.getAttribute("aria-label"),
        });
      }
    }, ACTION_SETTLE_MS);
  };

  const observer = new MutationObserver(schedule);
  observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  window.addEventListener("resize", schedule);
  window.addEventListener("load", schedule);
  document.addEventListener("click", onClick, true);
  schedule();

  return () => {
    if (timer) clearTimeout(timer);
    observer.disconnect();
    window.removeEventListener("resize", schedule);
    window.removeEventListener("load", schedule);
    document.removeEventListener("click", onClick, true);
  };
}
