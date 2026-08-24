"use client";

import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import type { ClientHighlightColor } from "@/lib/clients";
import type { MonthlyReport } from "@/lib/reports";
import { prettifyPageTitle } from "@/lib/page-names";
import { VisitorMap } from "@/components/reports/VisitorMap";
import { ClientLogo } from "@/components/ClientLogo";

const HIGHLIGHT_COLOR_HEX: Record<ClientHighlightColor, string> = {
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

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 10_000) return (n / 1_000).toFixed(1) + "k";
  return n.toLocaleString();
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds < 1) return "0s";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  if (m === 0) return `${s}s`;
  return `${m}m ${s}s`;
}

function formatPercent(rate: number): string {
  return (rate * 100).toFixed(1) + "%";
}

function formatDateLabel(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function MonthlyReportView({ report }: { report: MonthlyReport }) {
  const accent = HIGHLIGHT_COLOR_HEX[report.highlightColor] || "#2563eb";
  const [copied, setCopied] = useState(false);

  const channelColors = useMemo(
    () => [
      accent,
      "#7c3aed",
      "#16a34a",
      "#ea580c",
      "#0891b2",
      "#ca8a04",
      "#db2777",
      "#64748b",
    ],
    [accent]
  );

  function handlePrint() {
    if (typeof window !== "undefined") window.print();
  }

  async function handleCopyLink() {
    if (typeof window === "undefined") return;
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 report-root">
      {/* Print + brand styles */}
      <style jsx global>{`
        .report-root {
          font-family: var(--font-inter, ui-sans-serif, system-ui, sans-serif);
        }
        @media print {
          .no-print {
            display: none !important;
          }
          .report-root {
            background: #fff !important;
          }
          .report-card {
            box-shadow: none !important;
            border-color: #e5e7eb !important;
            break-inside: avoid;
            page-break-inside: avoid;
          }
          .report-section {
            break-inside: avoid;
            page-break-inside: avoid;
          }
          /* Path subtitle is useful on-screen but eats space in print. */
          .page-path {
            display: none !important;
          }
          @page {
            margin: 0.5in;
          }
        }
      `}</style>

      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-[1100px] mx-auto px-6 py-6 flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="h-10 w-1.5 rounded-sm" style={{ backgroundColor: accent }} />
            <ClientLogo slug={report.slug} clientName={report.clientName} size="md" />
            <div>
              <div className="text-[11px] uppercase font-semibold tracking-wider text-gray-500">
                Monthly Report
              </div>
              <h1
                className="text-3xl font-bold leading-tight"
                style={{ color: accent }}
              >
                {report.clientName}
              </h1>
              <p className="text-sm text-gray-600 mt-0.5">
                {report.monthLabel} · {report.range.startDate} → {report.range.endDate}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 no-print">
            <a
              href={`/b/${report.shareToken}`}
              className="text-xs font-medium px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              My Business
            </a>
            <button
              onClick={handleCopyLink}
              className="text-xs font-medium px-3 py-2 rounded-md bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
            >
              {copied ? "Link copied ✓" : "Copy share link"}
            </button>
            <button
              onClick={handlePrint}
              className="text-xs font-semibold px-3 py-2 rounded-md text-white transition-colors"
              style={{ backgroundColor: accent }}
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-[1100px] mx-auto px-6 py-8 space-y-6">
        {/* Highlights */}
        {report.highlights && report.highlights.length > 0 && (
          <section className="report-section report-card rounded-xl p-6 bg-white border border-gray-200 shadow-sm">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-gray-600 mb-3">
              Highlights
            </h2>
            <ul className="space-y-2">
              {report.highlights.map((h, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-800">
                  <span
                    className="mt-2 h-1.5 w-1.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: accent }}
                  />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* KPI grid */}
        <section className="report-section grid grid-cols-2 md:grid-cols-4 gap-3">
          <Kpi
            label="Sessions"
            value={formatNumber(report.summary.sessions)}
            change={report.summary.sessionsChange}
          />
          <Kpi
            label="Users"
            value={formatNumber(report.summary.users)}
            change={report.summary.usersChange}
          />
          <Kpi
            label="New users"
            value={formatNumber(report.summary.newUsers)}
            change={report.summary.newUsersChange}
          />
          <Kpi
            label="Page views"
            value={formatNumber(report.summary.pageViews)}
            change={report.summary.pageViewsChange}
          />
          <Kpi
            label="Avg. session"
            value={formatDuration(report.summary.avgSessionDuration)}
            change={report.summary.avgSessionDurationChange}
          />
          <Kpi
            label="Engagement"
            value={formatPercent(report.summary.engagementRate)}
            change={report.summary.engagementRateChange}
          />
          <Kpi
            label="Conversions"
            value={formatNumber(report.summary.conversions)}
            change={report.summary.conversionsChange}
          />
          <Kpi
            label="Hours worked"
            value={
              typeof report.hours === "number"
                ? report.hours.toLocaleString(undefined, {
                    maximumFractionDigits: 1,
                  }) + " hrs"
                : "—"
            }
            muted={typeof report.hours !== "number"}
          />
        </section>

        {/* Daily traffic chart */}
        <section className="report-section report-card rounded-xl p-5 bg-white border border-gray-200 shadow-sm">
          <div className="flex items-baseline justify-between mb-3">
            <h2 className="text-xs uppercase font-semibold tracking-wider text-gray-600">
              Daily traffic
            </h2>
            <p className="text-[11px] text-gray-500">
              {report.range.startDate} → {report.range.endDate}
            </p>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={report.daily}
                margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="reportTrafficFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={accent} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  stroke="#9ca3af"
                  fontSize={10}
                  tickFormatter={formatDateLabel}
                  tickLine={false}
                />
                <YAxis
                  stroke="#9ca3af"
                  fontSize={10}
                  tickLine={false}
                  width={40}
                  tickFormatter={(v) =>
                    typeof v === "number" && v >= 1000
                      ? `${(v / 1000).toFixed(1)}k`
                      : String(v)
                  }
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                  labelFormatter={(label) => formatDateLabel(label as string)}
                  formatter={(val: number, name: string) => [
                    val.toLocaleString(),
                    name === "sessions"
                      ? "Sessions"
                      : name === "users"
                      ? "Users"
                      : "Page views",
                  ]}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke={accent}
                  strokeWidth={2.5}
                  fill="url(#reportTrafficFill)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Channels + Devices */}
        <section className="report-section grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card title="Traffic channels">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={report.channels}
                      dataKey="sessions"
                      nameKey="channel"
                      innerRadius={50}
                      outerRadius={85}
                      paddingAngle={2}
                      stroke="#ffffff"
                      strokeWidth={2}
                    >
                      {report.channels.map((_, i) => (
                        <Cell
                          key={i}
                          fill={channelColors[i % channelColors.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e5e7eb",
                        borderRadius: 8,
                        fontSize: 12,
                      }}
                      formatter={(val: number) => [
                        val.toLocaleString() + " sessions",
                        "",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5">
                {report.channels.slice(0, 6).map((c, i) => (
                  <div
                    key={c.channel}
                    className="flex items-center gap-2 text-xs"
                  >
                    <span
                      className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                      style={{
                        backgroundColor:
                          channelColors[i % channelColors.length],
                      }}
                    />
                    <span className="truncate flex-1 text-gray-700">
                      {c.channel}
                    </span>
                    <span className="tabular-nums text-gray-500">
                      {c.percentage}%
                    </span>
                    <span className="tabular-nums font-semibold w-16 text-right text-gray-900">
                      {formatNumber(c.sessions)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card title="Devices">
            <div className="space-y-3">
              {report.devices.map((d) => (
                <div key={d.device}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="capitalize font-medium text-gray-700">
                      {d.device}
                    </span>
                    <span className="tabular-nums text-gray-500">
                      {formatNumber(d.sessions)} ({d.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden bg-gray-100">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${d.percentage}%`,
                        backgroundColor: accent,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Top pages */}
        <Card title="Top pages">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] uppercase tracking-wider text-gray-500">
                  <th className="text-left py-2 font-semibold">Path</th>
                  <th className="text-right py-2 font-semibold w-24">Views</th>
                  <th className="text-right py-2 font-semibold w-24">Sessions</th>
                  <th className="text-right py-2 font-semibold w-28">
                    Avg. duration
                  </th>
                </tr>
              </thead>
              <tbody>
                {report.topPages.map((p, i) => {
                  const friendly = prettifyPageTitle(p.title, p.path);
                  return (
                  <tr key={i} className="border-t border-gray-100">
                    <td className="py-2 pr-3">
                      <div
                        className="truncate max-w-[600px] font-medium text-gray-900"
                        title={p.title || p.path}
                      >
                        {friendly}
                      </div>
                      <div
                        className="truncate max-w-[600px] text-[11px] text-gray-500 page-path"
                        title={p.path}
                      >
                        {p.path}
                      </div>
                    </td>
                    <td
                      className="text-right tabular-nums font-semibold py-2"
                      style={{ color: accent }}
                    >
                      {p.views.toLocaleString()}
                    </td>
                    <td className="text-right tabular-nums py-2 text-gray-600">
                      {p.sessions.toLocaleString()}
                    </td>
                    <td className="text-right tabular-nums py-2 text-gray-600">
                      {formatDuration(p.avgDuration)}
                    </td>
                  </tr>
                  );
                })}
                {report.topPages.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      No page data captured for this month.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Visitors map */}
        <section className="report-section report-card rounded-xl p-5 bg-white border border-gray-200 shadow-sm">
          <VisitorMap
            countries={report.countries}
            regions={report.regions || []}
            accent={accent}
          />
        </section>

        {/* Geo + Referrers */}
        <section className="report-section grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card title="Top countries">
            <ListBars
              rows={report.countries.map((c) => ({
                label: c.country,
                value: c.sessions,
                pct: c.percentage,
              }))}
              accent={accent}
            />
          </Card>
          <Card title="Top cities">
            <div className="space-y-1.5">
              {report.cities.slice(0, 8).map((c, i) => (
                <div
                  key={`${c.city}-${i}`}
                  className="flex items-center justify-between text-xs"
                >
                  <span className="truncate text-gray-700">
                    {c.city || "(unknown)"}
                    {c.country && (
                      <span className="text-gray-400">
                        {" · "}
                        {c.country}
                      </span>
                    )}
                  </span>
                  <span className="tabular-nums font-semibold text-gray-900">
                    {formatNumber(c.sessions)}
                  </span>
                </div>
              ))}
              {report.cities.length === 0 && (
                <div className="text-center text-xs text-gray-500 py-4">
                  No city data.
                </div>
              )}
            </div>
          </Card>
          <Card title="Top sources">
            <ListBars
              rows={report.referrers.map((r) => ({
                label: r.source,
                value: r.sessions,
              }))}
              accent={accent}
            />
          </Card>
        </section>

        <footer className="pt-4 pb-2 text-center text-[11px] text-gray-400">
          Report generated {new Date(report.generatedAt).toLocaleDateString(
            "en-US",
            { month: "long", day: "numeric", year: "numeric" }
          )}{" "}
          · Powered by Clubhaus Agency
        </footer>
      </main>
    </div>
  );
}

function Kpi({
  label,
  value,
  change,
  muted = false,
}: {
  label: string;
  value: string;
  change?: number;
  muted?: boolean;
}) {
  const hasChange = typeof change === "number" && !muted;
  const positive = hasChange && change! > 0;
  const negative = hasChange && change! < 0;
  const changeColor =
    !hasChange || Math.abs(change!) < 0.1
      ? "text-gray-400"
      : positive
      ? "text-emerald-600"
      : negative
      ? "text-rose-600"
      : "text-gray-400";
  const arrow = positive ? "▲" : negative ? "▼" : "·";

  return (
    <div className="report-card rounded-lg p-3 bg-white border border-gray-200 shadow-sm">
      <div className="text-[10px] uppercase font-semibold tracking-wider text-gray-500">
        {label}
      </div>
      <div
        className={`text-2xl font-bold tabular-nums leading-tight mt-1 ${
          muted ? "text-gray-400" : "text-gray-900"
        }`}
      >
        {value}
      </div>
      {hasChange && (
        <div className={`text-[11px] mt-0.5 tabular-nums ${changeColor}`}>
          {arrow} {Math.abs(change!).toFixed(1)}%{" "}
          <span className="text-gray-400">vs prev.</span>
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="report-card rounded-xl p-5 bg-white border border-gray-200 shadow-sm">
      <h2 className="text-xs uppercase font-semibold tracking-wider text-gray-600 mb-3">
        {title}
      </h2>
      {children}
    </section>
  );
}

function ListBars({
  rows,
  accent,
}: {
  rows: Array<{ label: string; value: number; pct?: number }>;
  accent: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2">
      {rows.slice(0, 8).map((r, i) => {
        const pct = (r.value / max) * 100;
        return (
          <div key={`${r.label}-${i}`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="truncate text-gray-700">
                {r.label || "(unknown)"}
              </span>
              <span className="tabular-nums font-semibold flex-shrink-0 ml-2 text-gray-900">
                {formatNumber(r.value)}
                {r.pct !== undefined && (
                  <span className="ml-1 font-normal text-gray-500">
                    ({r.pct}%)
                  </span>
                )}
              </span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden bg-gray-100">
              <div
                className="h-full rounded-full"
                style={{ width: `${pct}%`, backgroundColor: accent }}
              />
            </div>
          </div>
        );
      })}
      {rows.length === 0 && (
        <div className="text-center text-xs text-gray-500 py-4">
          No data captured.
        </div>
      )}
    </div>
  );
}
