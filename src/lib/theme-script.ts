/**
 * SPEC Phase 0 — "The theme toggle must not flash on load: inline a tiny script
 * in <head> that reads the stored preference before first paint."
 *
 * This runs synchronously before the body paints. It must stay dependency-free,
 * must never throw (private browsing can make localStorage throw on access),
 * and must stay small enough to inline without a nonce debate later.
 */
export const THEME_STORAGE_KEY = "writer-site-theme";

export const themeScript = `(function(){try{var t=localStorage.getItem("${THEME_STORAGE_KEY}");if(t==="light"||t==="dark"){document.documentElement.setAttribute("data-theme",t)}}catch(e){}})();`;

export type Theme = "light" | "dark";
