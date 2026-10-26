/**
 * One decision about motion for the whole site, made before first paint by the boot script in
 * app/layout.tsx and stored on <html data-motion="full|reduced">. Staff choose the style in the
 * content manager (Animations): Automatic follows each visitor's device setting (on Windows:
 * Settings → Accessibility → Visual effects → Animation effects), or Full / Calm for everyone.
 *
 * Calm keeps gentle fades, colour changes and button feedback; parallax, scroll-scrubbing,
 * pointer depth, tilting and large movement are switched off.
 */
/** True when the site should use its calm, reduced-motion variant. */
export function isReduced(): boolean {
  if (typeof document === "undefined") return false;
  const m = document.documentElement.dataset.motion;
  if (m === "reduced") return true;
  if (m === "full") return false;
  return typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/** Inline boot snippet (runs in <head> before paint); `mode` comes from the content manager. */
export const motionBootScript = (mode: "auto" | "full" | "calm" = "auto") =>
  `(function(){try{var d=document.documentElement;var r=${mode === "full" ? "false" : mode === "calm" ? "true" : "window.matchMedia('(prefers-reduced-motion: reduce)').matches"};d.setAttribute('data-motion',r?'reduced':'full');d.classList.add('motion-pending');setTimeout(function(){if(!window.__motionReady)d.classList.remove('motion-pending')},2500)}catch(e){}})();`;
