/**
 * Single source of truth for user-facing brand strings in the web UI.
 *
 * Env-overridable at build time via Vite:
 *   VITE_CYBERNETICS_BRAND        — full display name (default: "Cybernetics Agent")
 *   VITE_CYBERNETICS_BRAND_SHORT  — single-word form (default: "Cybernetics")
 */

export const BRAND_NAME: string =
  (import.meta.env.VITE_CYBERNETICS_BRAND as string | undefined) ??
  "Cybernetics Agent";

export const BRAND_SHORT: string =
  (import.meta.env.VITE_CYBERNETICS_BRAND_SHORT as string | undefined) ??
  "Cybernetics";
