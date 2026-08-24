import fs from "fs/promises";
import path from "path";
import { randomBytes } from "crypto";
import type { ClientHighlightColor } from "@/lib/clients";

export const REPORTS_DIR = path.join(process.cwd(), "data", "reports");

export type MonthlyReportSummary = {
  sessions: number;
  prevSessions: number;
  sessionsChange: number;
  users: number;
  prevUsers: number;
  usersChange: number;
  newUsers: number;
  prevNewUsers: number;
  newUsersChange: number;
  pageViews: number;
  prevPageViews: number;
  pageViewsChange: number;
  avgSessionDuration: number;
  prevAvgSessionDuration: number;
  avgSessionDurationChange: number;
  bounceRate: number;
  prevBounceRate: number;
  bounceRateChange: number;
  engagementRate: number;
  prevEngagementRate: number;
  engagementRateChange: number;
  conversions: number;
  prevConversions: number;
  conversionsChange: number;
};

export type MonthlyReportDailyPoint = {
  date: string;
  sessions: number;
  users: number;
  pageViews: number;
};

export type MonthlyReportTopPage = {
  path: string;
  title: string;
  views: number;
  sessions: number;
  avgDuration: number;
};

export type MonthlyReportChannel = {
  channel: string;
  sessions: number;
  users: number;
  percentage: number;
};

export type MonthlyReportDevice = {
  device: string;
  sessions: number;
  percentage: number;
};

export type MonthlyReportCountry = {
  country: string;
  sessions: number;
  percentage: number;
};

export type MonthlyReportCity = {
  city: string;
  country: string;
  sessions: number;
};

export type MonthlyReportReferrer = {
  source: string;
  sessions: number;
};

export type MonthlyReportRegion = {
  /** First-level subdivision (US state, Canadian province, etc.) as returned by GA4. */
  region: string;
  country: string;
  sessions: number;
};

export type MonthlyReportSessionPoint = {
  /** YYYY-MM */
  month: string;
  /** Month name only, e.g. "July". */
  label: string;
  sessions: number;
};

export type MonthlyReport = {
  /**
   * Schema version. Bump when adding required fields.
   *  - 1: original (no `regions`).
   *  - 2: adds `regions` for state-level choropleth maps.
   *  - 3: adds optional `sessionHistory` (up to 12 months).
   */
  schemaVersion: 1 | 2 | 3;
  slug: string;
  propertyId: string;
  clientName: string;
  highlightColor: ClientHighlightColor;
  /** YYYY-MM. The report's calendar month. */
  month: string;
  /** Pretty label, e.g. "April 2026". */
  monthLabel: string;
  /** ISO timestamp when this snapshot was generated. */
  generatedAt: string;
  /** Date bounds actually used when querying GA4. */
  range: {
    startDate: string;
    endDate: string;
    prevStartDate: string;
    prevEndDate: string;
  };
  /** Unguessable share token used as the public URL slug at /r/<token>. */
  shareToken: string;
  summary: MonthlyReportSummary;
  daily: MonthlyReportDailyPoint[];
  topPages: MonthlyReportTopPage[];
  channels: MonthlyReportChannel[];
  devices: MonthlyReportDevice[];
  countries: MonthlyReportCountry[];
  cities: MonthlyReportCity[];
  /** First-level subdivisions (US states, Canadian provinces, etc.). Added in schemaVersion 2. */
  regions?: MonthlyReportRegion[];
  referrers: MonthlyReportReferrer[];
  /** Up to 12 calendar months of sessions, newest first. Added in schemaVersion 3. */
  sessionHistory?: MonthlyReportSessionPoint[];
  /** Hours billed for this client in this month, if available from Sheets. */
  hours?: number;
  /** Optional agency commentary surfaced at the top of the report. Edit by hand in the JSON. */
  highlights?: string[];
};

export function generateShareToken(): string {
  return randomBytes(16).toString("base64url");
}

export function monthLabel(month: string): string {
  const [y, m] = month.split("-").map(Number);
  if (!y || !m) return month;
  return new Date(y, m - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function isValidMonth(month: string): boolean {
  return /^\d{4}-(0[1-9]|1[0-2])$/.test(month);
}

export function reportFilePath(slug: string, month: string): string {
  return path.join(REPORTS_DIR, slug, `${month}.json`);
}

async function readReportFile(file: string): Promise<MonthlyReport | null> {
  try {
    const raw = await fs.readFile(file, "utf8");
    return JSON.parse(raw) as MonthlyReport;
  } catch {
    return null;
  }
}

export async function getReport(
  slug: string,
  month: string
): Promise<MonthlyReport | null> {
  return readReportFile(reportFilePath(slug, month));
}

export async function getLatestReportForSlug(
  slug: string
): Promise<MonthlyReport | null> {
  const reports = await listReportsForSlug(slug);
  return reports[0] ?? null;
}

export async function listReportsForSlug(
  slug: string
): Promise<MonthlyReport[]> {
  try {
    const dir = path.join(REPORTS_DIR, slug);
    const entries = await fs.readdir(dir);
    const files = entries.filter((f) => f.endsWith(".json")).sort().reverse();
    const reports: MonthlyReport[] = [];
    for (const file of files) {
      const r = await readReportFile(path.join(dir, file));
      if (r) reports.push(r);
    }
    return reports;
  } catch {
    return [];
  }
}

// Token lookup is cached for the lifetime of the serverless cold start.
// Since each new report is committed to git and triggers a fresh Vercel
// deploy (new cold start), this cache is effectively always fresh in prod.
let tokenIndexCache: Map<string, { slug: string; month: string }> | null = null;

async function buildTokenIndex(): Promise<
  Map<string, { slug: string; month: string }>
> {
  const index = new Map<string, { slug: string; month: string }>();
  let slugDirs: string[] = [];
  try {
    const entries = await fs.readdir(REPORTS_DIR, { withFileTypes: true });
    slugDirs = entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return index;
  }

  for (const slug of slugDirs) {
    let files: string[] = [];
    try {
      files = (await fs.readdir(path.join(REPORTS_DIR, slug))).filter((f) =>
        f.endsWith(".json")
      );
    } catch {
      continue;
    }
    for (const file of files) {
      const r = await readReportFile(path.join(REPORTS_DIR, slug, file));
      if (r?.shareToken) index.set(r.shareToken, { slug, month: r.month });
    }
  }
  return index;
}

export async function getReportByToken(
  token: string
): Promise<MonthlyReport | null> {
  if (!tokenIndexCache) tokenIndexCache = await buildTokenIndex();
  const found = tokenIndexCache.get(token);
  if (!found) return null;
  return getReport(found.slug, found.month);
}

/** Reset the in-memory token index. Useful for tests / local dev after writing a new report. */
export function clearReportCache(): void {
  tokenIndexCache = null;
}
