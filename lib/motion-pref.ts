/**
 * One decision about motion for the whole site, made before first paint by the boot script in
 * app/layout.tsx and stored on <html data-motion="full|reduced">.
 *
 *  - "auto" (default) follows the device setting. On Windows that is Settings → Accessibility →
 *    Visual effects → Animation effects; on iPhone/Mac it's "Reduce Motion".
 *  - Visitors can override it with the Animations switch in the footer ("on" / "off").
 *
 * Reduced motion keeps the site calm rather than lifeless: gentle fades, colour changes and button
 * feedback stay; parallax, scroll-scrubbing, pointer depth, tilting and large movement are switched off.
 */
export const MOTION_KEY = "cm-motion";
export type MotionSetting = "auto" | "on" | "off";

export function motionSetting(): MotionSetting {
  try {
    const v = localStorage.getItem(MOTION_KEY);
    return v === "on" || v === "off" ? v : "auto";
  } catch {
    return "auto";
  }
}

/** True when the site should use its calm, reduced-motion variant. */
export function isReduced(): boolean {
  if (typeof document === "undefined") return false;
  const m = document.documentElement.dataset.motion;
  if (m === "reduced") return true;
  if (m === "full") return false;
  const s = motionSetting();
  return s === "off" || (s === "auto" && typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches);
}

export function setMotionSetting(s: MotionSetting) {
  try {
    if (s === "auto") localStorage.removeItem(MOTION_KEY);
    else localStorage.setItem(MOTION_KEY, s);
  } catch { /* storage blocked: the choice lasts until reload */ }
}

/**
 * Inline boot snippet (runs in <head> before paint). `mode` and `allowChoice` come from the content
 * manager (Animations). A visitor's own choice only counts while the footer switch is shown.
 */
export const motionBootScript = (mode: "auto" | "full" | "calm" = "auto", allowChoice = true) =>
  `(function(){try{var d=document.documentElement,o=null;${allowChoice ? `try{o=localStorage.getItem('${MOTION_KEY}')}catch(e){}` : ""}var os=window.matchMedia('(prefers-reduced-motion: reduce)').matches;var r=o==='off'?true:o==='on'?false:${mode === "full" ? "false" : mode === "calm" ? "true" : "os"};d.setAttribute('data-motion',r?'reduced':'full');d.classList.add('motion-pending');setTimeout(function(){if(!window.__motionReady)d.classList.remove('motion-pending')},2500)}catch(e){}})();`;
