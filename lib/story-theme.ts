import type { CSSProperties } from "react";
import type { ClientHighlightColor } from "@/lib/clients";
import { HIGHLIGHT_COLOR_HEX, reportAccent } from "@/lib/report-story";

export type StoryTheme = {
  id: string;
  mode: "dark" | "light";
  bg: string;
  fg: string;
  accent: string;
  muted: string;
  soft: string;
  faint: string;
  surface: string;
  surfaceHover: string;
  border: string;
  headingFont: string;
  bodyFont: string;
  fontsHref?: string;
  eyebrow: "display" | "label";
  eyebrowColor?: string;
  button: "md" | "pill";
  mapEmpty?: string;
  mapStroke?: string;
};

const INHERIT = "inherit";

function darkTheme(accent: string): StoryTheme {
  return {
    id: "default",
    mode: "dark",
    bg: "#0a0e1a",
    fg: "#ffffff",
    accent,
    muted: "rgba(255,255,255,0.7)",
    soft: "rgba(255,255,255,0.6)",
    faint: "rgba(255,255,255,0.45)",
    surface: "rgba(255,255,255,0.1)",
    surfaceHover: "rgba(255,255,255,0.15)",
    border: "rgba(255,255,255,0.15)",
    headingFont: INHERIT,
    bodyFont: INHERIT,
    eyebrow: "display",
    button: "md",
  };
}

/** Hilltop Bar & Grill — cream, slab headlines, tavern red. */
const HILLTOP_THEME: StoryTheme = {
  id: "hilltop",
  mode: "light",
  bg: "#e6e2c0",
  fg: "#111111",
  accent: "#9B2323",
  muted: "rgba(17,17,17,0.62)",
  soft: "rgba(17,17,17,0.55)",
  faint: "rgba(17,17,17,0.4)",
  surface: "rgba(155,35,35,0.1)",
  surfaceHover: "rgba(155,35,35,0.18)",
  border: "rgba(17,17,17,0.16)",
  headingFont: '"Roboto Slab", ui-serif, Georgia, serif',
  bodyFont: '"Poppins", ui-sans-serif, system-ui, sans-serif',
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&family=Roboto+Slab:wght@400;600;700&display=swap",
  eyebrow: "label",
  button: "pill",
  mapEmpty: "#d4cfa8",
  mapStroke: "#c9c395",
};

/** Bayerkohler, Ltd. — white, navy + sky blue from the mark. */
const BAYERKOHLER_THEME: StoryTheme = {
  id: "bayerkohler",
  mode: "light",
  bg: "#ffffff",
  fg: "#205080",
  accent: "#205080",
  muted: "rgba(32,80,128,0.72)",
  soft: "rgba(32,80,128,0.62)",
  faint: "rgba(32,80,128,0.45)",
  surface: "rgba(104,168,216,0.16)",
  surfaceHover: "rgba(104,168,216,0.26)",
  border: "rgba(104,168,216,0.55)",
  headingFont: '"Libre Baskerville", ui-serif, Georgia, serif',
  bodyFont: '"Source Sans 3", ui-sans-serif, system-ui, sans-serif',
  fontsHref:
    "https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Source+Sans+3:wght@400;500;600;700&display=swap",
  eyebrow: "label",
  eyebrowColor: "#68A8D8",
  button: "md",
  mapEmpty: "#e7f2fa",
  mapStroke: "#c5dced",
};

/** cleaniacs — white, navy + sky from the shield mark. */
const CLEANIACS_THEME: StoryTheme = {
  id: "cleaniacs",
  mode: "light",
  bg: "#ffffff",
  fg: "#203878",
  accent: "#06b6d4",
  muted: "rgba(32,56,120,0.72)",
  soft: "rgba(32,56,120,0.62)",
  faint: "rgba(32,56,120,0.42)",
  surface: "rgba(6,182,212,0.1)",
  surfaceHover: "rgba(6,182,212,0.18)",
  border: "rgba(64,152,208,0.4)",
  headingFont: INHERIT,
  bodyFont: INHERIT,
  eyebrow: "label",
  eyebrowColor: "#4098d0",
  button: "md",
  mapEmpty: "#e8f6fb",
  mapStroke: "#c5e4f0",
};

const STORY_THEMES: Record<string, StoryTheme> = {
  "hilltop-hanover": HILLTOP_THEME,
  bayerkohler: BAYERKOHLER_THEME,
  cleaniacs: CLEANIACS_THEME,
};

export function storyThemeFor(report: {
  slug: string;
  highlightColor: ClientHighlightColor;
}): StoryTheme {
  return STORY_THEMES[report.slug] || darkTheme(reportAccent(report.highlightColor));
}

export function storyThemeVars(theme: StoryTheme): CSSProperties {
  return {
    backgroundColor: theme.bg,
    color: theme.fg,
    fontFamily: theme.bodyFont === INHERIT ? undefined : theme.bodyFont,
    "--mybiz-bg": theme.bg,
    "--mybiz-fg": theme.fg,
    "--mybiz-accent": theme.accent,
    "--mybiz-muted": theme.muted,
    "--mybiz-soft": theme.soft,
    "--mybiz-faint": theme.faint,
    "--mybiz-surface": theme.surface,
    "--mybiz-surface-hover": theme.surfaceHover,
    "--mybiz-border": theme.border,
    "--mybiz-heading": theme.headingFont,
    "--mybiz-body": theme.bodyFont,
  } as CSSProperties;
}

export function isMetalAccent(accent: string) {
  return accent.toLowerCase() === HIGHLIGHT_COLOR_HEX.gold;
}
