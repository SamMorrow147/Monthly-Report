import type { ClientHighlightColor } from "@/lib/clients";
import type {
  MonthlyReport,
  MonthlyReportChannel,
  MonthlyReportCity,
  MonthlyReportDailyPoint,
  MonthlyReportSessionPoint,
  MonthlyReportTopPage,
} from "@/lib/reports";
import { prettifyPageTitle } from "@/lib/page-names";

export const HIGHLIGHT_COLOR_HEX: Record<ClientHighlightColor, string> = {
  blue: "#2563eb",
  orange: "#ea580c",
  green: "#16a34a",
  brown: "#92400e",
  "red-brown": "#7f1d1d",
  yellow: "#ca8a04",
  "light-blue": "#06b6d4",
  purple: "#7c3aed",
  teal: "#0d9488",
  indigo: "#4f46e5",
  cyan: "#0891b2",
  black: "#171717",
  gold: "#d4af37",
  pink: "#db2777",
  navy: "#1e3a8a",
};

export function reportAccent(color: ClientHighlightColor): string {
  return HIGHLIGHT_COLOR_HEX[color] || "#2563eb";
}

export function monthInReview(report: { monthLabel: string }): string {
  const month = report.monthLabel.replace(/\s+\d+$/, "").trim();
  return `${month} in Review`;
}

export function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

export function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

export function formatPercent(rate: number): string {
  return Math.round(rate * 100) + "%";
}

export function percentChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function visitMonths(report: MonthlyReport): MonthlyReportSessionPoint[] {
  if (report.sessionHistory && report.sessionHistory.length > 0) {
    return report.sessionHistory
      .filter((point) => point.sessions > 0)
      .slice(0, 12);
  }
  const current: MonthlyReportSessionPoint = {
    month: report.month,
    label: report.monthLabel.replace(/\s+\d+$/, ""),
    sessions: report.summary.sessions,
  };
  if (!Number.isFinite(report.summary.prevSessions)) return [current];
  return [
    current,
    {
      month: report.range.prevStartDate.slice(0, 7),
      label: previousMonthLabel(report),
      sessions: report.summary.prevSessions,
    },
  ];
}

export function peopleMonths(report: MonthlyReport): MonthlyReportSessionPoint[] {
  if (report.sessionHistory?.some((point) => typeof point.users === "number")) {
    return report.sessionHistory
      .filter((point) => (point.users || 0) > 0)
      .slice(0, 12);
  }
  const current: MonthlyReportSessionPoint = {
    month: report.month,
    label: report.monthLabel.replace(/\s+\d+$/, ""),
    sessions: report.summary.sessions,
    users: report.summary.users,
    newUsers: report.summary.newUsers,
  };
  if (!Number.isFinite(report.summary.prevUsers)) return [current];
  return [
    current,
    {
      month: report.range.prevStartDate.slice(0, 7),
      label: previousMonthLabel(report),
      sessions: report.summary.prevSessions,
      users: report.summary.prevUsers,
      newUsers: report.summary.prevNewUsers,
    },
  ];
}

export function durationMonths(report: MonthlyReport): MonthlyReportSessionPoint[] {
  if (
    report.sessionHistory?.some(
      (point) => typeof point.avgSessionDuration === "number"
    )
  ) {
    return report.sessionHistory
      .filter((point) => (point.avgSessionDuration || 0) > 0)
      .slice(0, 12);
  }
  const current: MonthlyReportSessionPoint = {
    month: report.month,
    label: report.monthLabel.replace(/\s+\d+$/, ""),
    sessions: report.summary.sessions,
    avgSessionDuration: report.summary.avgSessionDuration,
  };
  if (!Number.isFinite(report.summary.prevAvgSessionDuration)) return [current];
  return [
    current,
    {
      month: report.range.prevStartDate.slice(0, 7),
      label: previousMonthLabel(report),
      sessions: report.summary.prevSessions,
      avgSessionDuration: report.summary.prevAvgSessionDuration,
    },
  ];
}

export function busiestMonths(report: MonthlyReport): MonthlyReportSessionPoint[] {
  if (report.sessionHistory?.some((point) => point.busiestDate)) {
    return report.sessionHistory
      .filter((point) => point.busiestDate && (point.busiestSessions || 0) > 0)
      .slice(0, 12);
  }
  const busy = busiestDay(report);
  if (!busy) return [];
  return [
    {
      month: report.month,
      label: report.monthLabel.replace(/\s+\d+$/, ""),
      sessions: busy.sessions,
      busiestDate: busy.date,
      busiestSessions: busy.sessions,
    },
  ];
}

export function previousMonthLabel(report: MonthlyReport): string {
  const iso = report.range.prevStartDate;
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return "the previous month";
  return d.toLocaleString("en-US", { month: "long" });
}

export function formatChangeVs(change: number, prevLabel: string): string {
  if (!Number.isFinite(change) || Math.abs(change) < 0.1) {
    return `about the same as ${prevLabel}`;
  }
  if (change > 0) return `up ${change.toFixed(1)}% from ${prevLabel}`;
  return `down ${Math.abs(change).toFixed(1)}% from ${prevLabel}`;
}

export function busiestDay(
  report: MonthlyReport
): MonthlyReportDailyPoint | null {
  let best: MonthlyReportDailyPoint | null = null;
  for (const point of report.daily) {
    if (!point.sessions) continue;
    if (!best || point.sessions > best.sessions) best = point;
  }
  return best;
}

export function formatDayLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });
}

export function topChannel(report: MonthlyReport): MonthlyReportChannel | null {
  const first = report.channels.find((c) => c.sessions > 0);
  return first ?? null;
}

export function topCity(report: MonthlyReport): MonthlyReportCity | null {
  for (const city of report.cities) {
    if (!city.sessions) continue;
    const name = (city.city || "").trim();
    if (!name || name === "(not set)" || name === "(other)") continue;
    return city;
  }
  return null;
}

export function rankedPages(
  report: MonthlyReport,
  limit = 5
): Array<MonthlyReportTopPage & { label: string }> {
  return report.topPages
    .filter((p) => p.views > 0 || p.sessions > 0)
    .slice(0, limit)
    .map((p) => ({
      ...p,
      label: prettifyPageTitle(p.title, p.path),
    }));
}

function isMissingPage(page: MonthlyReportTopPage): boolean {
  return /404|this page could not be found/i.test(page.title || "");
}

export function isArtistPortfolioPath(path: string): boolean {
  return /^\/portfolio(\/|$)/i.test(path);
}

function stripStudioSuffix(label: string): string {
  return label
    .replace(/\s*\|\s*Ink Kings Tattoo/gi, "")
    .replace(/\s*[—–-]\s*Portfolio\b.*/i, "")
    .trim();
}

export function artistPages(
  report: MonthlyReport
): Array<MonthlyReportTopPage & { label: string }> {
  return report.topPages
    .filter(
      (p) =>
        isArtistPortfolioPath(p.path) &&
        !isMissingPage(p) &&
        (p.views > 0 || p.sessions > 0)
    )
    .sort((a, b) => (b.views || b.sessions) - (a.views || a.sessions))
    .map((p) => ({
      ...p,
      label: stripStudioSuffix(prettifyPageTitle(p.title, p.path)) || p.title,
    }));
}

export function otherPages(
  report: MonthlyReport,
  limit = 5
): Array<MonthlyReportTopPage & { label: string }> {
  return report.topPages
    .filter(
      (p) =>
        !isArtistPortfolioPath(p.path) &&
        !isMissingPage(p) &&
        (p.views > 0 || p.sessions > 0)
    )
    .slice(0, limit)
    .map((p) => ({
      ...p,
      label:
        p.path === "/"
          ? "Home"
          : stripStudioSuffix(prettifyPageTitle(p.title, p.path)) ||
            prettifyPageTitle(p.title, p.path),
    }));
}

export function hasArtistRoster(report: MonthlyReport): boolean {
  return report.slug === "ink-kings" && artistPages(report).length >= 2;
}

export const INK_KINGS_ARTISTS = [
  { id: "steve", name: "Steve", photo: "/artists/ink-kings/steve.png", path: "/portfolio/steve" },
  { id: "hunter", name: "Hunter", photo: "/artists/ink-kings/hunter.png", path: "/portfolio/hunter" },
  { id: "austin", name: "Austin", photo: "/artists/ink-kings/austin.png", path: "/portfolio/austin" },
  { id: "nick", name: "Nick", photo: "/artists/ink-kings/nick.png", path: "/portfolio/nick" },
  { id: "john", name: "John", photo: "/artists/ink-kings/john.png", path: "/portfolio/john" },
  { id: "breaelle", name: "Breaelle", photo: "/artists/ink-kings/breaelle.png", path: "/portfolio/breaelle" },
] as const;

export function orderedArtistPages(report: MonthlyReport) {
  const byPath = new Map(
    artistPages(report).map((page) => [page.path.replace(/\/$/, ""), page])
  );
  return INK_KINGS_ARTISTS.map((artist) => {
    const page = byPath.get(artist.path);
    return {
      ...artist,
      views: page?.views || 0,
      sessions: page?.sessions || 0,
      label: artist.name,
    };
  });
}

export type StoryChapterId =
  | "open"
  | "visits"
  | "people"
  | "attention"
  | "busiest"
  | "artists"
  | "pages"
  | "channels"
  | "geography"
  | "hours"
  | "notes"
  | "close";

export type StoryChapter = { id: StoryChapterId };

export function storyChapters(report: MonthlyReport): StoryChapter[] {
  const chapters: StoryChapter[] = [{ id: "open" }, { id: "visits" }];

  if (report.summary.users > 0 || report.summary.newUsers > 0) {
    chapters.push({ id: "people" });
  }
  if (
    report.summary.avgSessionDuration > 0 ||
    report.summary.engagementRate > 0
  ) {
    chapters.push({ id: "attention" });
  }
  if (busiestDay(report)) chapters.push({ id: "busiest" });
  if (hasArtistRoster(report)) {
    chapters.push({ id: "artists" });
    if (otherPages(report).length > 0) chapters.push({ id: "pages" });
  } else if (rankedPages(report).length > 1) {
    chapters.push({ id: "pages" });
  }
  if (report.channels.some((c) => c.sessions > 0)) {
    chapters.push({ id: "channels" });
  }
  if (
    topCity(report) ||
    report.countries.some((c) => c.sessions > 0) ||
    (report.regions && report.regions.some((r) => r.sessions > 0))
  ) {
    chapters.push({ id: "geography" });
  }
  if (typeof report.hours === "number") chapters.push({ id: "hours" });
  if (report.highlights && report.highlights.length > 0) {
    chapters.push({ id: "notes" });
  }

  chapters.push({ id: "close" });
  return chapters;
}

export function myBusinessPath(token: string): string {
  return `/b/${token}`;
}

export function monthlyReportPath(token: string): string {
  return `/r/${token}`;
}
