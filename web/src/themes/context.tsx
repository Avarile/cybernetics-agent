import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { BUILTIN_THEMES, defaultTheme } from "./presets";
import {
  FONT_CHOICES,
  THEME_DEFAULT_FONT_ID,
  getFontChoice,
  type FontChoice,
} from "./fonts";
import type {
  DashboardTheme,
  ThemeDensity,
  ThemeLayout,
  ThemeListEntry,
  ThemeTypography,
} from "./types";
import { api } from "@/lib/api";

const STORAGE_KEY = "hermes-dashboard-theme";
const FONT_STORAGE_KEY = "hermes-dashboard-font";

const THEME_NAME_ALIASES: Record<string, string> = {
  "lens-5i": "nous-blue",
};

function migrateThemeName(name: string): string {
  return THEME_NAME_ALIASES[name] ?? name;
}

const INJECTED_FONT_URLS = new Set<string>();

const DENSITY_MULTIPLIERS: Record<ThemeDensity, string> = {
  compact: "0.85",
  comfortable: "1",
  spacious: "1.2",
};

function typographyVars(typo: ThemeTypography): Record<string, string> {
  return {
    "--theme-font-sans": typo.fontSans,
    "--theme-font-mono": typo.fontMono,
    "--theme-font-display": typo.fontDisplay ?? typo.fontSans,
    "--theme-base-size": typo.baseSize,
    "--theme-line-height": typo.lineHeight,
    "--theme-letter-spacing": typo.letterSpacing,
  };
}

function layoutVars(layout: ThemeLayout): Record<string, string> {
  return {
    "--radius": layout.radius,
    "--theme-radius": layout.radius,
    "--theme-spacing-mul": DENSITY_MULTIPLIERS[layout.density] ?? "1",
    "--theme-density": layout.density,
  };
}

function injectFontStylesheet(url: string | undefined) {
  if (!url || typeof document === "undefined") return;
  if (INJECTED_FONT_URLS.has(url)) return;
  const existing = document.querySelector<HTMLLinkElement>(
    `link[rel="stylesheet"][href="${CSS.escape(url)}"]`,
  );
  if (existing) {
    INJECTED_FONT_URLS.add(url);
    return;
  }
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = url;
  link.setAttribute("data-hermes-theme-font", "true");
  document.head.appendChild(link);
  INJECTED_FONT_URLS.add(url);
}

let _ACTIVE_FONT_OVERRIDE: string = THEME_DEFAULT_FONT_ID;

function applyFontOverride(fontId: string | undefined) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const choice: FontChoice | undefined = getFontChoice(fontId);
  if (!choice) {
    root.style.removeProperty("--theme-font-override-sans");
    return;
  }
  injectFontStylesheet(choice.fontUrl);
  root.style.setProperty("--theme-font-override-sans", choice.stack);
  root.style.setProperty("--theme-font-sans", choice.stack);
  root.style.setProperty("--theme-font-display", choice.stack);
}

function applyTheme(theme: DashboardTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  // Color writes (palette, overrides, series, assets, component styles,
  // customCSS, layout variants) are intentionally skipped: index.css
  // governs the light theme. Only typography + layout + font override +
  // terminal background propagate from the active theme.
  const vars = {
    ...typographyVars(theme.typography),
    ...layoutVars(theme.layout),
  };
  for (const [k, v] of Object.entries(vars)) {
    root.style.setProperty(k, v);
  }

  injectFontStylesheet(theme.typography.fontUrl);

  root.style.setProperty(
    "--theme-terminal-background",
    theme.terminalBackground ?? "#000000",
  );

  applyFontOverride(_ACTIVE_FONT_OVERRIDE);
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [themeName, setThemeName] = useState<string>(() => {
    if (typeof window === "undefined") return "default";
    const stored = window.localStorage.getItem(STORAGE_KEY) ?? "default";
    const migrated = migrateThemeName(stored);
    if (migrated !== stored) {
      window.localStorage.setItem(STORAGE_KEY, migrated);
    }
    return migrated;
  });

  const [availableThemes, setAvailableThemes] = useState<ThemeListEntry[]>(() =>
    Object.values(BUILTIN_THEMES).map((t) => ({
      name: t.name,
      label: t.label,
      description: t.description,
    })),
  );

  const [userThemeDefs, setUserThemeDefs] = useState<
    Record<string, DashboardTheme>
  >({});

  const [fontId, setFontId] = useState<string>(() => {
    if (typeof window === "undefined") return THEME_DEFAULT_FONT_ID;
    const stored = window.localStorage.getItem(FONT_STORAGE_KEY);
    const valid = stored && getFontChoice(stored) ? stored : THEME_DEFAULT_FONT_ID;
    _ACTIVE_FONT_OVERRIDE = valid;
    return valid;
  });

  const resolveTheme = useCallback(
    (name: string): DashboardTheme => {
      return (
        BUILTIN_THEMES[name] ??
        userThemeDefs[name] ??
        defaultTheme
      );
    },
    [userThemeDefs],
  );

  useEffect(() => {
    _ACTIVE_FONT_OVERRIDE = fontId;
    applyTheme(resolveTheme(themeName));
  }, [themeName, resolveTheme, fontId]);

  useEffect(() => {
    let cancelled = false;
    api
      .getThemes()
      .then((resp) => {
        if (cancelled) return;
        if (resp.themes?.length) {
          setAvailableThemes(
            resp.themes.map((t) => ({
              name: t.name,
              label: t.label,
              description: t.description,
              definition: t.definition,
            })),
          );
          const defs: Record<string, DashboardTheme> = {};
          for (const entry of resp.themes) {
            if (entry.definition) {
              defs[entry.name] = entry.definition;
            }
          }
          if (Object.keys(defs).length > 0) setUserThemeDefs(defs);
        }
        if (resp.active) {
          const migratedActive = migrateThemeName(resp.active);
          if (migratedActive !== themeName) {
            setThemeName(migratedActive);
            window.localStorage.setItem(STORAGE_KEY, migratedActive);
          }
          if (migratedActive !== resp.active) {
            api.setTheme(migratedActive).catch(() => {});
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    api
      .getFontPref()
      .then((resp) => {
        if (cancelled) return;
        const serverId =
          resp?.font && getFontChoice(resp.font) ? resp.font : THEME_DEFAULT_FONT_ID;
        if (serverId !== fontId) {
          setFontId(serverId);
          if (typeof window !== "undefined") {
            window.localStorage.setItem(FONT_STORAGE_KEY, serverId);
          }
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setTheme = useCallback(
    (name: string) => {
      const knownNames = new Set<string>([
        ...Object.keys(BUILTIN_THEMES),
        ...availableThemes.map((t) => t.name),
        ...Object.keys(userThemeDefs),
      ]);
      const next = knownNames.has(name) ? name : "default";
      setThemeName(next);
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, next);
      }
      api.setTheme(next).catch(() => {});
    },
    [availableThemes, userThemeDefs],
  );

  const setFont = useCallback((id: string) => {
    const next = getFontChoice(id) ? id : THEME_DEFAULT_FONT_ID;
    setFontId(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(FONT_STORAGE_KEY, next);
    }
    api.setFontPref(next).catch(() => {});
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme: resolveTheme(themeName),
      themeName,
      availableThemes,
      setTheme,
      fontId,
      fontChoices: FONT_CHOICES,
      setFont,
    }),
    [themeName, availableThemes, setTheme, resolveTheme, fontId, setFont],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: defaultTheme,
  themeName: "default",
  availableThemes: Object.values(BUILTIN_THEMES).map((t) => ({
    name: t.name,
    label: t.label,
    description: t.description,
  })),
  setTheme: () => {},
  fontId: THEME_DEFAULT_FONT_ID,
  fontChoices: FONT_CHOICES,
  setFont: () => {},
});

interface ThemeContextValue {
  availableThemes: ThemeListEntry[];
  setTheme: (name: string) => void;
  theme: DashboardTheme;
  themeName: string;
  fontId: string;
  fontChoices: FontChoice[];
  setFont: (id: string) => void;
}
