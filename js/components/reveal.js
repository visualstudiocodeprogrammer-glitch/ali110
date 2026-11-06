import { $$ } from '../util.js';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let io;

/** Gentle fade-in for .reveal blocks as they enter the viewport. */
export function observeReveals(root = document) {
  const targets = $$('.reveal:not(.is-visible)', root);
  if (!targets.length) return;
  if (reduced() || !('IntersectionObserver' in window)) {
    targets.forEach((n) => n.classList.add('is-visible'));
    return;
  }
  io ??= new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    }
  }, { rootMargin: '0px 0px -6% 0px' });
  targets.forEach((n) => io.observe(n));
}
