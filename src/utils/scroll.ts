/** A scrollable region: either `window`/document scrolling, or an element with its own scrollbox. */
export type ScrollableTarget = HTMLElement | Window;

function metrics(target: ScrollableTarget): { scrollTop: number; scrollHeight: number; clientHeight: number } {
  if (target instanceof Window) {
    const doc = document.documentElement;
    return { scrollTop: window.scrollY, scrollHeight: doc.scrollHeight, clientHeight: window.innerHeight };
  }
  return { scrollTop: target.scrollTop, scrollHeight: target.scrollHeight, clientHeight: target.clientHeight };
}

/** Pixels between the current scroll position and the top edge. */
export function distanceFromTop(target: ScrollableTarget): number {
  return metrics(target).scrollTop;
}

/** Pixels between the current scroll position and the bottom edge. */
export function distanceFromBottom(target: ScrollableTarget): number {
  const { scrollTop, scrollHeight, clientHeight } = metrics(target);
  return scrollHeight - scrollTop - clientHeight;
}

/** Scrolls `target` to its top or bottom edge, honoring `prefers-reduced-motion`. */
export function scrollToEdge(target: ScrollableTarget, edge: "top" | "bottom"): void {
  const behavior: ScrollBehavior = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? "instant"
    : "smooth";
  const top = edge === "top" ? 0 : metrics(target).scrollHeight;
  if (target instanceof Window) {
    window.scrollTo({ top, behavior });
  } else {
    target.scrollTo({ top, behavior });
  }
}
