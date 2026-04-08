import { useCallback, useEffect, useRef } from "react";

function isElementInViewport(el: Element): boolean {
  const rect = el.getBoundingClientRect();
  return (
    rect.top < (window.innerHeight || document.documentElement.clientHeight) + 50 &&
    rect.bottom > -50
  );
}

function revealVisibleElements(container: HTMLElement) {
  const fadeElements = container.querySelectorAll(".fade-up:not(.visible)");
  fadeElements.forEach((child) => {
    if (isElementInViewport(child)) {
      child.classList.add("visible");
    }
  });
}

export function useScrollReveal() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);

  const setupObservers = useCallback((el: HTMLDivElement) => {
    // Clean up previous observers
    cleanupRef.current?.();

    // Initial reveal with staggered timers
    const timers = [0, 100, 300, 600, 1000].map((delay) =>
      setTimeout(() => revealVisibleElements(el), delay)
    );

    // Scroll handler
    const onScroll = () => {
      requestAnimationFrame(() => revealVisibleElements(el));
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Resize handler
    const onResize = () => {
      requestAnimationFrame(() => revealVisibleElements(el));
    };
    window.addEventListener("resize", onResize, { passive: true });

    // MutationObserver for dynamic content (tRPC data loads)
    const mutationObserver = new MutationObserver(() => {
      requestAnimationFrame(() => revealVisibleElements(el));
      // Also schedule a delayed check for any layout shifts
      setTimeout(() => revealVisibleElements(el), 100);
    });
    mutationObserver.observe(el, { childList: true, subtree: true });

    cleanupRef.current = () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      mutationObserver.disconnect();
    };
  }, []);

  // Use a callback ref so it fires when the DOM element is actually mounted
  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      containerRef.current = node;
      if (node) {
        setupObservers(node);
      } else {
        cleanupRef.current?.();
        cleanupRef.current = null;
      }
    },
    [setupObservers]
  );

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupRef.current?.();
    };
  }, []);

  return ref;
}
