"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MonthlyReport } from "@/lib/reports";
import {
  busiestDay,
  formatChangeVs,
  formatCount,
  formatDayLabel,
  formatDuration,
  formatPercent,
  monthlyReportPath,
  myBusinessPath,
  previousMonthLabel,
  rankedPages,
  reportAccent,
  storyChapters,
  topChannel,
  topCity,
} from "@/lib/report-story";
import { VisitorMap } from "@/components/reports/VisitorMap";

export function MyBusinessScroll({ report }: { report: MonthlyReport }) {
  const accent = reportAccent(report.highlightColor);
  const chapters = useMemo(() => storyChapters(report), [report]);
  const prevMonth = previousMonthLabel(report);
  const pages = rankedPages(report, 5);
  const busy = busiestDay(report);
  const channel = topChannel(report);
  const city = topCity(report);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);

  const goTo = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const root = scrollerRef.current;
    if (!root) return;
    const next = Math.max(0, Math.min(chapters.length - 1, index));
    indexRef.current = next;
    setActive(next);
    root.scrollTo({ top: next * root.clientHeight, behavior });
  }, [chapters.length]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let animating = false;
    let gestureLocked = false;
    let wheelQuiet: number | null = null;
    let touchStartY = 0;
    let unlockTimer: number | null = null;

    const releaseAfter = (ms: number) => {
      if (unlockTimer) window.clearTimeout(unlockTimer);
      unlockTimer = window.setTimeout(() => {
        animating = false;
      }, ms);
    };

    const step = (dir: 1 | -1) => {
      if (animating) return;
      const next = indexRef.current + dir;
      if (next < 0 || next >= chapters.length) return;
      animating = true;
      goTo(next, reduced ? "auto" : "smooth");
      releaseAfter(reduced ? 80 : 820);
    };

    const onWheel = (e: WheelEvent) => {
      if (reduced) return;
      e.preventDefault();
      if (animating || gestureLocked) return;
      if (Math.abs(e.deltaY) < 10) return;

      gestureLocked = true;
      step(e.deltaY > 0 ? 1 : -1);

      if (wheelQuiet) window.clearTimeout(wheelQuiet);
      wheelQuiet = window.setTimeout(() => {
        gestureLocked = false;
      }, 220);
    };

    const onWheelKeepLock = (e: WheelEvent) => {
      if (reduced) return;
      if (!gestureLocked) return;
      e.preventDefault();
      if (wheelQuiet) window.clearTimeout(wheelQuiet);
      wheelQuiet = window.setTimeout(() => {
        gestureLocked = false;
      }, 220);
    };

    const handleWheel = (e: WheelEvent) => {
      if (gestureLocked || animating) onWheelKeepLock(e);
      else onWheel(e);
    };

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "PageDown" || e.key === " ") {
        e.preventDefault();
        step(1);
      }
      if (e.key === "ArrowUp" || e.key === "PageUp") {
        e.preventDefault();
        step(-1);
      }
    };

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY;
    };

    const onTouchMove = (e: TouchEvent) => {
      if (reduced) return;
      e.preventDefault();
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (reduced) return;
      const dy = touchStartY - e.changedTouches[0].clientY;
      if (Math.abs(dy) < 48) {
        goTo(indexRef.current, "auto");
        return;
      }
      step(dy > 0 ? 1 : -1);
    };

    const onResize = () => {
      goTo(indexRef.current, "auto");
    };

    root.addEventListener("wheel", handleWheel, { passive: false });
    root.addEventListener("touchstart", onTouchStart, { passive: true });
    root.addEventListener("touchmove", onTouchMove, { passive: false });
    root.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = prevOverflow;
      if (wheelQuiet) window.clearTimeout(wheelQuiet);
      if (unlockTimer) window.clearTimeout(unlockTimer);
      root.removeEventListener("wheel", handleWheel);
      root.removeEventListener("touchstart", onTouchStart);
      root.removeEventListener("touchmove", onTouchMove);
      root.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", onResize);
    };
  }, [chapters.length, goTo]);

  async function handleCopy() {
    if (typeof window === "undefined") return;
    const url = `${window.location.origin}${myBusinessPath(report.shareToken)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="fixed inset-0 bg-[#0a0e1a] text-white">
      <div
        ref={scrollerRef}
        className="mybiz-scroller h-[100dvh] overflow-y-auto overscroll-none"
      >
        {chapters.map((chapter, index) => (
          <section
            key={chapter.id}
            data-chapter={chapter.id}
            data-chapter-index={index}
            className="relative h-[100dvh] w-full flex flex-col items-center justify-center px-6 sm:px-10"
          >
            <ChapterBody
              id={chapter.id}
              report={report}
              accent={accent}
              prevMonth={prevMonth}
              pages={pages}
              busy={busy}
              channel={channel}
              city={city}
              copied={copied}
              onCopy={handleCopy}
            />
            {index < chapters.length - 1 && (
              <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
                <span className="text-[11px] uppercase tracking-[0.24em] text-white/35">
                  Scroll
                </span>
              </div>
            )}
          </section>
        ))}
      </div>

      <nav
        aria-label="Sections"
        className="hidden sm:flex flex-col gap-2.5 absolute right-5 top-1/2 -translate-y-1/2 z-10"
      >
        {chapters.map((chapter, index) => (
          <button
            key={chapter.id}
            type="button"
            aria-label={`Go to ${chapter.id}`}
            onClick={() => goTo(index)}
            className="w-2.5 h-2.5 rounded-full transition-all"
            style={{
              backgroundColor: index === active ? accent : "rgba(255,255,255,0.25)",
              transform: index === active ? "scale(1.25)" : "scale(1)",
            }}
          />
        ))}
      </nav>

      <style jsx global>{`
        .mybiz-scroller {
          scrollbar-width: none;
        }
        .mybiz-scroller::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}

function AnimationSlot() {
  return (
    <div
      aria-hidden
      className="h-28 sm:h-36 w-full flex items-center justify-center mb-8"
    >
      <div className="h-20 w-20 sm:h-28 sm:w-28 rounded-full border border-dashed border-white/15" />
    </div>
  );
}

function ChapterFrame({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col items-center text-center">
      <AnimationSlot />
      <div className="w-full">{children}</div>
    </div>
  );
}

function Eyebrow({ children, accent }: { children: string; accent: string }) {
  return (
    <p
      className="text-xs sm:text-sm uppercase tracking-[0.32em] font-semibold mb-5"
      style={{ color: accent }}
    >
      {children}
    </p>
  );
}

function ChapterBody({
  id,
  report,
  accent,
  prevMonth,
  pages,
  busy,
  channel,
  city,
  copied,
  onCopy,
}: {
  id: string;
  report: MonthlyReport;
  accent: string;
  prevMonth: string;
  pages: ReturnType<typeof rankedPages>;
  busy: ReturnType<typeof busiestDay>;
  channel: ReturnType<typeof topChannel>;
  city: ReturnType<typeof topCity>;
  copied: boolean;
  onCopy: () => void;
}) {
  const { summary } = report;

  if (id === "open") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>My Business</Eyebrow>
        <h1 className="text-6xl sm:text-8xl font-semibold tracking-tight leading-[1.05]">
          {report.clientName}
        </h1>
        <p className="mt-6 text-2xl sm:text-4xl text-white/60">
          {report.monthLabel}
        </p>
        <p className="mt-8 text-xl sm:text-3xl text-white/80">
          Your {report.monthLabel.replace(/\s+\d+$/, "")} on the web.
        </p>
      </ChapterFrame>
    );
  }

  if (id === "visits") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>Visits</Eyebrow>
        <p
          className="text-8xl sm:text-[10rem] font-semibold tabular-nums tracking-tight leading-none"
          style={{ color: accent }}
        >
          {formatCount(summary.sessions)}
        </p>
        <p className="mt-8 text-2xl sm:text-3xl text-white/70">
          {formatChangeVs(summary.sessionsChange, prevMonth)}
        </p>
      </ChapterFrame>
    );
  }

  if (id === "people") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>People</Eyebrow>
        <p className="text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none">
          {formatCount(summary.users)}
        </p>
        <p className="mt-6 text-2xl sm:text-3xl text-white/70">
          people came to the site
        </p>
        <p className="mt-4 text-lg sm:text-2xl text-white/50">
          {formatCount(summary.newUsers)} were new ·{" "}
          {formatChangeVs(summary.newUsersChange, prevMonth)}
        </p>
      </ChapterFrame>
    );
  }

  if (id === "attention") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>Attention</Eyebrow>
        <p
          className="text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none"
          style={{ color: accent }}
        >
          {formatDuration(summary.avgSessionDuration)}
        </p>
        <p className="mt-6 text-2xl sm:text-3xl text-white/70">
          average time on the site
        </p>
        <p className="mt-4 text-lg sm:text-2xl text-white/50">
          {formatChangeVs(summary.avgSessionDurationChange, prevMonth)}
        </p>
        <p className="mt-3 text-lg sm:text-2xl text-white/50">
          {formatPercent(summary.engagementRate)} of visits stayed engaged
        </p>
      </ChapterFrame>
    );
  }

  if (id === "busiest" && busy) {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>Busiest day</Eyebrow>
        <p className="text-5xl sm:text-7xl font-semibold tracking-tight leading-tight">
          {formatDayLabel(busy.date)}
        </p>
        <p className="mt-6 text-2xl sm:text-3xl text-white/70">
          {formatCount(busy.sessions)} visits that day
        </p>
      </ChapterFrame>
    );
  }

  if (id === "pages") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>Top pages</Eyebrow>
        <ol className="space-y-5 max-w-xl mx-auto">
          {pages.map((page, i) => (
            <li
              key={`${page.path}-${i}`}
              className="flex items-baseline justify-center gap-4"
            >
              <span
                className="text-base sm:text-lg tabular-nums w-6 shrink-0"
                style={{ color: accent }}
              >
                {i + 1}
              </span>
              <span className="text-xl sm:text-3xl font-medium truncate">
                {page.label}
              </span>
            </li>
          ))}
        </ol>
      </ChapterFrame>
    );
  }

  if (id === "channels") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>How they found you</Eyebrow>
        {channel && (
          <p className="text-2xl sm:text-4xl text-white/80 mb-10">
            Mostly {channel.channel.toLowerCase()}
          </p>
        )}
        <ul className="space-y-5 max-w-md mx-auto w-full text-left">
          {report.channels
            .filter((c) => c.sessions > 0)
            .slice(0, 5)
            .map((c) => (
              <li key={c.channel}>
                <div className="flex items-baseline justify-between gap-4 text-lg sm:text-xl">
                  <span>{c.channel}</span>
                  <span className="tabular-nums text-white/50">
                    {c.percentage}%
                  </span>
                </div>
                <div className="mt-2 h-1.5 rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(100, c.percentage)}%`,
                      backgroundColor: accent,
                    }}
                  />
                </div>
              </li>
            ))}
        </ul>
      </ChapterFrame>
    );
  }

  if (id === "geography") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>Where they came from</Eyebrow>
        {city && (
          <p className="text-5xl sm:text-7xl font-semibold tracking-tight mb-3">
            {city.city}
          </p>
        )}
        {city && (
          <p className="text-lg sm:text-2xl text-white/55 mb-6">
            {formatCount(city.sessions)} visits from {city.city}
            {city.country ? `, ${city.country}` : ""}
          </p>
        )}
        <div className="h-[28vh] sm:h-[32vh] min-h-[180px] w-full rounded-2xl overflow-hidden bg-white/[0.03] border border-white/10">
          <VisitorMap
            countries={report.countries}
            regions={report.regions || []}
            accent={accent}
            isDark
          />
        </div>
      </ChapterFrame>
    );
  }

  if (id === "hours" && typeof report.hours === "number") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>Time on the work</Eyebrow>
        <p
          className="text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none"
          style={{ color: accent }}
        >
          {report.hours.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        </p>
        <p className="mt-6 text-2xl sm:text-3xl text-white/70">
          hours we spent on this site in{" "}
          {report.monthLabel.replace(/\s+\d+$/, "")}
        </p>
      </ChapterFrame>
    );
  }

  if (id === "notes" && report.highlights && report.highlights.length > 0) {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>Notes</Eyebrow>
        <ul className="space-y-5 max-w-xl mx-auto">
          {report.highlights.map((note, i) => (
            <li key={i} className="text-xl sm:text-2xl text-white/85">
              {note}
            </li>
          ))}
        </ul>
      </ChapterFrame>
    );
  }

  if (id === "close") {
    return (
      <ChapterFrame>
        <Eyebrow accent={accent}>My Business</Eyebrow>
        <h2 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-tight">
          That was {report.monthLabel.replace(/\s+\d+$/, "")}.
        </h2>
        <p className="mt-6 text-2xl sm:text-3xl text-white/65">
          {formatCount(summary.sessions)} visits · {formatCount(summary.users)}{" "}
          people
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCopy}
            className="text-sm sm:text-base font-semibold px-5 py-3 rounded-md text-white"
            style={{ backgroundColor: accent }}
          >
            {copied ? "Link copied" : "Copy this link"}
          </button>
          <a
            href={monthlyReportPath(report.shareToken)}
            className="text-sm sm:text-base font-medium px-5 py-3 rounded-md text-white/70 hover:text-white bg-white/10"
          >
            Full monthly report
          </a>
        </div>
      </ChapterFrame>
    );
  }

  return null;
}
