import { useEffect } from 'react';

const ANIMATED = '.animate-fade-in-up, .animate-scale-in, .animate-fade-in, .animate-slide-in-right, [data-reveal]';
const TILT = '[data-tilt]';

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Site-wide motion layer:
 * - Entrance animations (`animate-*` classes, `[data-reveal]`) wait until the
 *   element scrolls into view instead of all firing on page load.
 * - `[data-tilt]` cards lean towards the pointer on devices with a mouse.
 * New elements (e.g. cards rendered after data loads) are picked up
 * automatically via a MutationObserver.
 */
export function useCinematicEffects() {
  useEffect(() => {
    if (prefersReducedMotion()) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.remove('reveal-wait');
          entry.target.classList.add('is-revealed');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );

    const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    const tilted = new WeakSet<Element>();

    const onTiltMove = (e: PointerEvent) => {
      const el = e.currentTarget as HTMLElement;
      const r = el.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      el.style.transform = `perspective(900px) rotateX(${(-y * 6).toFixed(2)}deg) rotateY(${(x * 8).toFixed(2)}deg) translateY(-6px)`;
      el.style.setProperty('--glare-x', `${((x + 0.5) * 100).toFixed(1)}%`);
      el.style.setProperty('--glare-y', `${((y + 0.5) * 100).toFixed(1)}%`);
    };
    const onTiltLeave = (e: PointerEvent) => {
      (e.currentTarget as HTMLElement).style.transform = '';
    };

    const register = (root: ParentNode) => {
      const viewportBottom = window.innerHeight;
      root.querySelectorAll(ANIMATED).forEach((el) => {
        if (el.classList.contains('is-revealed') || el.classList.contains('reveal-wait')) return;
        // Only hold back elements that start below the fold.
        if (el.getBoundingClientRect().top > viewportBottom * 0.92) {
          el.classList.add('reveal-wait');
          io.observe(el);
        } else {
          el.classList.add('is-revealed');
        }
      });
      if (finePointer) {
        root.querySelectorAll(TILT).forEach((el) => {
          if (tilted.has(el)) return;
          tilted.add(el);
          el.classList.add('tilt-card');
          el.addEventListener('pointermove', onTiltMove as EventListener);
          el.addEventListener('pointerleave', onTiltLeave as EventListener);
        });
      }
    };

    register(document);

    let queued = false;
    const mo = new MutationObserver(() => {
      if (queued) return;
      queued = true;
      requestAnimationFrame(() => {
        queued = false;
        register(document);
      });
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}

/** Scroll to in-page anchors like `#about` after a route switch re-renders the page. */
export function useAnchorScroll() {
  useEffect(() => {
    // Content above the target (e.g. equipment cards from the database) can finish loading
    // after we scrolled and push the target down. Re-align for a few seconds unless the
    // visitor starts scrolling themselves.
    let stopKeeping: (() => void) | null = null;
    const keepInView = (el: HTMLElement) => {
      stopKeeping?.();
      let lastTop = el.getBoundingClientRect().top + window.scrollY;
      const realign = () => {
        const top = el.getBoundingClientRect().top + window.scrollY;
        if (Math.abs(top - lastTop) > 4) {
          lastTop = top;
          el.scrollIntoView({ behavior: 'auto', block: 'start' });
        }
      };
      const ro = new ResizeObserver(realign);
      ro.observe(document.body);
      const userScroll = () => stop();
      const timer = window.setTimeout(() => stop(), 4000);
      const stop = () => {
        ro.disconnect();
        window.clearTimeout(timer);
        window.removeEventListener('wheel', userScroll);
        window.removeEventListener('touchstart', userScroll);
        window.removeEventListener('keydown', userScroll);
        stopKeeping = null;
      };
      window.addEventListener('wheel', userScroll, { passive: true });
      window.addEventListener('touchstart', userScroll, { passive: true });
      window.addEventListener('keydown', userScroll);
      stopKeeping = stop;
    };

    const scrollToAnchor = () => {
      const hash = window.location.hash;
      if (!hash || hash.startsWith('#/') || hash === '#') return;
      let tries = 0;
      const attempt = () => {
        const el = document.getElementById(decodeURIComponent(hash.slice(1)));
        if (el) {
          el.scrollIntoView({ behavior: prefersReducedMotion() ? 'auto' : 'smooth', block: 'start' });
          keepInView(el);
        } else if (tries++ < 20) {
          setTimeout(attempt, 50);
        }
      };
      attempt();
    };
    scrollToAnchor();
    window.addEventListener('hashchange', scrollToAnchor);
    return () => {
      window.removeEventListener('hashchange', scrollToAnchor);
      stopKeeping?.();
    };
  }, []);
}
