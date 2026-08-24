"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MonthlyReport, MonthlyReportSessionPoint } from "@/lib/reports";
import {
  busiestDay,
  formatCount,
  formatDayLabel,
  formatDuration,
  monthlyReportPath,
  myBusinessPath,
  previousMonthLabel,
  otherPages,
  orderedArtistPages,
  hasArtistRoster,
  rankedPages,
  peopleMonths,
  durationMonths,
  busiestMonths,
  HIGHLIGHT_COLOR_HEX,
  percentChange,
  reportAccent,
  storyChapters,
  topChannel,
  topCity,
  visitMonths,
} from "@/lib/report-story";
import { VisitorMap } from "@/components/reports/VisitorMap";
import {
  AnimatedCount,
  AnimatedDuration,
  AnimatedHours,
  AnimatedPercent,
  ChangeLine,
  ChapterMark,
  LoadBar,
  Reveal,
  useCountUp,
  usePrefersReducedMotion,
} from "@/components/reports/MyBusinessMotion";
import { ClientLogo } from "@/components/ClientLogo";
import { getClientBySlug } from "@/lib/clients";
import { motion, type PanInfo } from "framer-motion";

function isMetalAccent(accent: string) {
  return accent.toLowerCase() === HIGHLIGHT_COLOR_HEX.gold;
}

function accentTextStyle(accent: string): React.CSSProperties {
  return isMetalAccent(accent) ? {} : { color: accent };
}

function withMetal(accent: string, className: string) {
  return isMetalAccent(accent) ? `${className} mybiz-metal` : className;
}

function isAppleBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS =
    /iP(ad|hone|od)/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const safari = /^((?!chrome|android|crios|fxios).)*safari/i.test(ua);
  return iOS || safari;
}

export function MyBusinessScroll({ report }: { report: MonthlyReport }) {
  const accent = reportAccent(report.highlightColor);
  const chapters = useMemo(() => storyChapters(report), [report]);
  const prevMonth = previousMonthLabel(report);
  const pages = hasArtistRoster(report)
    ? otherPages(report, 5)
    : rankedPages(report, 5);
  const busy = busiestDay(report);
  const channel = topChannel(report);
  const city = topCity(report);

  const scrollerRef = useRef<HTMLDivElement>(null);
  const indexRef = useRef(0);
  const animatingRef = useRef(false);
  const appleRef = useRef(false);
  const visitDragRef = useRef(false);
  const [active, setActive] = useState(0);
  const [copied, setCopied] = useState(false);
  const [apple, setApple] = useState(false);

  const goTo = useCallback((index: number, behavior: ScrollBehavior = "smooth") => {
    const root = scrollerRef.current;
    if (!root) return;
    const next = Math.max(0, Math.min(chapters.length - 1, index));
    indexRef.current = next;
    setActive(next);
    animatingRef.current = true;
    const motion = appleRef.current && behavior === "smooth" ? "auto" : behavior;
    root.scrollTo({ top: next * root.clientHeight, behavior: motion });
    window.setTimeout(() => {
      animatingRef.current = false;
    }, motion === "auto" ? 50 : 700);
  }, [chapters.length]);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) return;

    appleRef.current = isAppleBrowser();
    setApple(appleRef.current);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let gestureLocked = false;
    let wheelQuiet: number | null = null;
    let scrollQuiet: number | null = null;

    const step = (dir: 1 | -1) => {
      if (animatingRef.current) return;
      const next = indexRef.current + dir;
      if (next < 0 || next >= chapters.length) return;
      goTo(next, reduced ? "auto" : "smooth");
    };

    const snapNearest = () => {
      if (animatingRef.current) return;
      const idx = Math.round(root.scrollTop / Math.max(1, root.clientHeight));
      const next = Math.max(0, Math.min(chapters.length - 1, idx));
      const target = next * root.clientHeight;
      indexRef.current = next;
      setActive(next);
      if (Math.abs(root.scrollTop - target) > 12) {
        animatingRef.current = true;
        root.scrollTo({ top: target, behavior: "auto" });
        window.setTimeout(() => {
          animatingRef.current = false;
        }, 50);
      }
    };

    const onWheel = (e: WheelEvent) => {
      if (reduced || appleRef.current) return;
      const overDepth =
        e.target instanceof Element &&
        e.target.closest(".mybiz-visit-depth");
      if (
        visitDragRef.current ||
        (overDepth && Math.abs(e.deltaX) >= Math.abs(e.deltaY) - 2)
      ) {
        return;
      }
      e.preventDefault();
      if (animatingRef.current || gestureLocked) {
        if (wheelQuiet) window.clearTimeout(wheelQuiet);
        wheelQuiet = window.setTimeout(() => {
          gestureLocked = false;
        }, 220);
        return;
      }
      if (Math.abs(e.deltaY) < 10) return;
      gestureLocked = true;
      step(e.deltaY > 0 ? 1 : -1);
      wheelQuiet = window.setTimeout(() => {
        gestureLocked = false;
      }, 220);
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

    const onScroll = () => {
      const idx = Math.round(root.scrollTop / Math.max(1, root.clientHeight));
      const next = Math.max(0, Math.min(chapters.length - 1, idx));
      if (next !== indexRef.current) {
        indexRef.current = next;
        setActive(next);
      }
      if (appleRef.current || animatingRef.current) return;
      if (scrollQuiet) window.clearTimeout(scrollQuiet);
      scrollQuiet = window.setTimeout(snapNearest, 140);
    };

    const onResize = () => {
      goTo(indexRef.current, "auto");
    };

    if (!appleRef.current) {
      root.addEventListener("wheel", onWheel, { passive: false });
    }
    root.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", onResize);

    return () => {
      document.body.style.overflow = prevOverflow;
      if (wheelQuiet) window.clearTimeout(wheelQuiet);
      if (scrollQuiet) window.clearTimeout(scrollQuiet);
      root.removeEventListener("wheel", onWheel);
      root.removeEventListener("scroll", onScroll);
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
        className={`mybiz-scroller h-[100dvh] overflow-y-auto${
          apple ? " mybiz-scroller-apple" : ""
        }`}
      >
        {chapters.map((chapter, index) => (
          <section
            key={chapter.id}
            data-chapter={chapter.id}
            data-chapter-index={index}
            className="relative h-[100dvh] w-full flex flex-col items-center justify-center px-6 sm:px-10 mybiz-section"
          >
            <ChapterBody
              id={chapter.id}
              active={index === active}
              report={report}
              accent={accent}
              prevMonth={prevMonth}
              pages={pages}
              busy={busy}
              channel={channel}
              city={city}
              copied={copied}
              onCopy={handleCopy}
              visitDragRef={visitDragRef}
            />
          </section>
        ))}
      </div>

      {active > 0 && (
        <button
          type="button"
          aria-label="Previous section"
          onClick={() => goTo(active - 1)}
          className="absolute top-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-white/70 hover:text-white"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15">
            <Chevron dir="up" />
          </span>
        </button>
      )}

      {active < chapters.length - 1 && (
        <button
          type="button"
          aria-label="Next section"
          onClick={() => goTo(active + 1)}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1 text-white/70 hover:text-white"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/15">
            <Chevron dir="down" />
          </span>
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/40">
            Scroll
          </span>
        </button>
      )}

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
          -webkit-overflow-scrolling: touch;
          overscroll-behavior-y: none;
          overflow-x: hidden;
        }
        .mybiz-scroller::-webkit-scrollbar {
          display: none;
        }
        .mybiz-scroller-apple {
          scroll-snap-type: y mandatory;
        }
        .mybiz-scroller-apple .mybiz-section {
          scroll-snap-align: start;
          scroll-snap-stop: always;
        }
        .mybiz-visit-depth {
          position: relative;
          width: 100vw;
          margin-left: calc(50% - 50vw);
          touch-action: none;
          cursor: grab;
          user-select: none;
          overflow: hidden;
        }
        .mybiz-visit-depth.is-drag {
          cursor: grabbing;
        }
        .mybiz-map-shell {
          pointer-events: auto;
        }
        .mybiz-map-shell .mybiz-map-bleed {
          -webkit-mask-image: radial-gradient(
            ellipse 130% 118% at 50% 52%,
            #000 72%,
            rgba(0, 0, 0, 0.9) 92%,
            transparent 100%
          );
                  mask-image: radial-gradient(
            ellipse 130% 118% at 50% 52%,
            #000 72%,
            rgba(0, 0, 0, 0.9) 92%,
            transparent 100%
          );
        }
        .mybiz-map-shell .mybiz-map-bleed svg {
          display: block;
          width: 100%;
          height: auto;
        }
        .mybiz-mark {
          overflow: visible;
        }
        .mybiz-metal {
          background-image: linear-gradient(
            165deg,
            #fff6d0 0%,
            #ffe9a0 16%,
            #f0c75e 34%,
            #d4af37 52%,
            #8a6a14 70%,
            #e8c84a 86%,
            #b8922a 100%
          );
          -webkit-background-clip: text;
          background-clip: text;
          color: transparent;
          -webkit-text-fill-color: transparent;
        }
        .mybiz-mark.is-play .mybiz-mark-core {
          animation: mybiz-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mybiz-mark.is-play .mybiz-ring {
          transform-box: fill-box;
          transform-origin: center;
          animation: mybiz-ring 1.8s ease-out infinite;
        }
        .mybiz-mark.is-play .mybiz-ring.r2 { animation-delay: 0.25s; }
        .mybiz-mark.is-play .mybiz-ring.r3 { animation-delay: 0.5s; }
        .mybiz-mark.is-play .mybiz-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: mybiz-pop 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mybiz-mark.is-play .mybiz-pop {
          transform-box: fill-box;
          transform-origin: center;
          animation: mybiz-pop 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mybiz-mark.is-play .mybiz-pop.d2 { animation-delay: 0.1s; }
        .mybiz-mark.is-play .mybiz-pop.d3 { animation-delay: 0.2s; }
        .mybiz-mark.is-play .mybiz-pop.d4 { animation-delay: 0.3s; }
        .mybiz-mark.is-play .mybiz-pop.d5 { animation-delay: 0.4s; }
        .mybiz-mark.is-play .mybiz-pop.d6 { animation-delay: 0.5s; }
        .mybiz-mark.is-play .mybiz-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: mybiz-pulse 1.2s ease-in-out infinite;
        }
        .mybiz-mark.is-play .mybiz-arc {
          stroke-dasharray: 188;
          stroke-dashoffset: 188;
          animation: mybiz-draw 1.15s cubic-bezier(0.22, 1, 0.36, 1) 0.1s forwards;
        }
        .mybiz-mark.is-play .mybiz-page {
          animation: mybiz-rise 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mybiz-mark.is-play .mybiz-page.p2 { animation-delay: 0.1s; }
        .mybiz-mark.is-play .mybiz-page.p3 { animation-delay: 0.2s; }
        .mybiz-mark.is-play .mybiz-bar {
          transform-box: fill-box;
          transform-origin: bottom center;
          animation: mybiz-grow-y 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mybiz-mark.is-play .mybiz-bar.b2 { animation-delay: 0.1s; }
        .mybiz-mark.is-play .mybiz-bar.b3 { animation-delay: 0.2s; }
        .mybiz-mark.is-play .mybiz-pin {
          transform-box: fill-box;
          transform-origin: bottom center;
          animation: mybiz-drop 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mybiz-mark.is-play .mybiz-hand {
          transform-box: fill-box;
          transform-origin: 56px 56px;
          animation: mybiz-sweep 1.2s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .mybiz-mark.is-play .mybiz-line {
          stroke-dasharray: 60;
          stroke-dashoffset: 60;
          animation: mybiz-draw 0.7s ease forwards;
        }
        .mybiz-mark.is-play .mybiz-line.l2 { animation-delay: 0.12s; }
        .mybiz-mark.is-play .mybiz-line.l3 { animation-delay: 0.24s; }
        .mybiz-mark.is-play .mybiz-check {
          stroke-dasharray: 50;
          stroke-dashoffset: 50;
          animation: mybiz-draw 0.7s cubic-bezier(0.22, 1, 0.36, 1) 0.15s forwards;
        }
        .mybiz-visits-mark.is-play .mybiz-click-cursor {
          transform-origin: 2px 2px;
          animation: mybiz-cursor-click 2.2s ease-in-out infinite;
        }
        .mybiz-visits-mark.is-play .mybiz-click-btn {
          transform-origin: center;
          animation: mybiz-btn-press 2.2s ease-in-out infinite;
        }
        .mybiz-visits-mark.is-play .mybiz-click-ring {
          transform-origin: center;
          animation: mybiz-click-ripple 2.2s ease-out infinite;
        }
        @keyframes mybiz-cursor-click {
          0% { transform: translate(28px, 32px); }
          38% { transform: translate(0, 0); }
          46% { transform: translate(1px, 3px); }
          56% { transform: translate(0, 0); }
          100% { transform: translate(0, 0); }
        }
        @keyframes mybiz-btn-press {
          0%, 40% { transform: scale(1); }
          46% { transform: scale(0.94); }
          58%, 100% { transform: scale(1); }
        }
        @keyframes mybiz-click-ripple {
          0%, 42% { transform: scale(0.25); opacity: 0; }
          46% { opacity: 0.85; }
          78% { transform: scale(8); opacity: 0; }
          100% { opacity: 0; }
        }
        @keyframes mybiz-pop {
          from { transform: scale(0.55); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        @keyframes mybiz-ring {
          0% { transform: scale(0.7); opacity: 0.55; }
          100% { transform: scale(1.2); opacity: 0; }
        }
        @keyframes mybiz-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.18); opacity: 0.75; }
        }
        @keyframes mybiz-draw {
          to { stroke-dashoffset: 0; }
        }
        @keyframes mybiz-rise {
          from { transform: translateY(10px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes mybiz-grow-y {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes mybiz-drop {
          from { transform: translateY(-16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes mybiz-sweep {
          from { transform: rotate(-90deg); }
          to { transform: rotate(270deg); }
        }
        @media (prefers-reduced-motion: reduce) {
          .mybiz-mark * {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

function Chevron({
  dir,
  className = "h-[22px] w-[22px]",
}: {
  dir: "up" | "down" | "left" | "right";
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      {dir === "up" && <path d="M6 15l6-6 6 6" />}
      {dir === "down" && <path d="M6 9l6 6 6-6" />}
      {dir === "left" && <path d="M15 6l-6 6 6 6" />}
      {dir === "right" && <path d="M9 6l6 6-6 6" />}
    </svg>
  );
}

function ChapterFrame({
  id,
  accent,
  active,
  beforeMark,
  hideMark,
  children,
}: {
  id: string;
  accent: string;
  active: boolean;
  beforeMark?: React.ReactNode;
  hideMark?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`w-full mx-auto flex flex-col items-center text-center overflow-visible ${
        id === "visits" ? "max-w-none" : "max-w-3xl"
      }`}
    >
      {beforeMark}
      {!hideMark && <ChapterMark id={id} accent={accent} active={active} />}
      <div className="w-full">{children}</div>
    </div>
  );
}

function Eyebrow({
  children,
  accent,
  className = "mb-5",
}: {
  children: string;
  accent: string;
  className?: string;
}) {
  return (
    <p
      className={withMetal(
        accent,
        `text-2xl sm:text-4xl font-semibold tracking-tight ${className}`
      )}
      style={accentTextStyle(accent)}
    >
      {children}
    </p>
  );
}

function ChapterBody({
  id,
  active,
  report,
  accent,
  prevMonth,
  pages,
  busy,
  channel,
  city,
  copied,
  onCopy,
  visitDragRef,
}: {
  id: string;
  active: boolean;
  report: MonthlyReport;
  accent: string;
  prevMonth: string;
  pages: ReturnType<typeof rankedPages>;
  busy: ReturnType<typeof busiestDay>;
  channel: ReturnType<typeof topChannel>;
  city: ReturnType<typeof topCity>;
  copied: boolean;
  onCopy: () => void;
  visitDragRef: React.MutableRefObject<boolean>;
}) {
  const brandedOpen =
    (id === "open" || id === "close") &&
    Boolean(getClientBySlug(report.slug)?.logo);
  const frame = (child: React.ReactNode, beforeMark?: React.ReactNode) => (
    <ChapterFrame
      id={id}
      accent={accent}
      active={active}
      beforeMark={beforeMark}
      hideMark={
        brandedOpen || id === "artists" || id === "busiest" || id === "pages"
      }
    >
      {child}
    </ChapterFrame>
  );

  if (id === "open") {
    return frame(<OpenChapter report={report} accent={accent} active={active} />);
  }
  if (id === "visits") {
    return frame(
      <VisitsChapter
        report={report}
        accent={accent}
        prevMonth={prevMonth}
        active={active}
        visitDragRef={visitDragRef}
      />
    );
  }
  if (id === "people") {
    return frame(
      <PeopleChapter
        report={report}
        accent={accent}
        prevMonth={prevMonth}
        active={active}
        visitDragRef={visitDragRef}
      />
    );
  }
  if (id === "attention") {
    return frame(
      <AttentionChapter
        report={report}
        accent={accent}
        prevMonth={prevMonth}
        active={active}
        visitDragRef={visitDragRef}
      />
    );
  }
  if (id === "busiest" && busy) {
    return frame(
      <BusiestChapter
        report={report}
        busy={busy}
        accent={accent}
        active={active}
        visitDragRef={visitDragRef}
      />
    );
  }
  if (id === "artists") {
    return frame(
      <ArtistChapter
        report={report}
        accent={accent}
        active={active}
        visitDragRef={visitDragRef}
      />
    );
  }
  if (id === "pages") {
    return frame(
      <PagesChapter
        pages={pages}
        accent={accent}
        active={active}
        title={hasArtistRoster(report) ? "Other page visits" : "Most visited pages"}
        months={visitMonths(report)}
        visitDragRef={visitDragRef}
      />
    );
  }
  if (id === "channels") {
    return frame(
      <ChannelsChapter
        report={report}
        channel={channel}
        accent={accent}
        active={active}
      />
    );
  }
  if (id === "geography") {
    return frame(
      <GeographyChapter
        report={report}
        city={city}
        accent={accent}
        active={active}
      />
    );
  }
  if (id === "hours" && typeof report.hours === "number") {
    return frame(
      <HoursChapter report={report} accent={accent} active={active} />
    );
  }
  if (id === "notes" && report.highlights && report.highlights.length > 0) {
    return frame(
      <NotesChapter notes={report.highlights} accent={accent} active={active} />
    );
  }
  if (id === "close") {
    return frame(
      <CloseChapter
        report={report}
        accent={accent}
        active={active}
        copied={copied}
        onCopy={onCopy}
      />
    );
  }

  return null;
}

function OpenChapter({
  report,
  accent,
  active,
}: {
  report: MonthlyReport;
  accent: string;
  active: boolean;
}) {
  return (
    <>
      <Reveal active={active}>
        <ClientLogo
          slug={report.slug}
          clientName={report.clientName}
          size={report.slug === "ink-kings" ? "display" : "hero"}
          onDark
          metallic={isMetalAccent(accent)}
          fill={isMetalAccent(accent) ? HIGHLIGHT_COLOR_HEX.gold : undefined}
          className="mx-auto mb-6"
        />
      </Reveal>
      <Reveal active={active} delay={80}>
        <Eyebrow accent={accent}>My Business</Eyebrow>
      </Reveal>
      <Reveal active={active} delay={140}>
        <h1
          className={withMetal(
            accent,
            "text-6xl sm:text-8xl font-semibold tracking-tight leading-[1.05]"
          )}
          style={accentTextStyle(accent)}
        >
          {report.clientName}
        </h1>
      </Reveal>
      <Reveal active={active} delay={180}>
        <p className="mt-6 text-2xl sm:text-4xl text-white/60">
          {report.monthLabel}
        </p>
      </Reveal>
      <Reveal active={active} delay={280}>
        <p className="mt-8 text-xl sm:text-3xl text-white/80">
          Your {report.monthLabel.replace(/\s+\d+$/, "")} on the web.
        </p>
      </Reveal>
    </>
  );
}

const visitSpring = { type: "spring" as const, stiffness: 420, damping: 38, mass: 0.7 };

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function visitPose(offset: number) {
  const dist = Math.min(Math.abs(offset), 3);
  const stops = [
    { s: 1, o: 1 },
    { s: 0.42, o: 0.38 },
    { s: 0.26, o: 0.2 },
    { s: 0.16, o: 0.1 },
  ];
  const i = Math.min(Math.floor(dist), 2);
  const t = dist - i;
  return {
    x: `${-offset * 28}vw`,
    scale: lerp(stops[i].s, stops[i + 1].s, t),
    opacity: lerp(stops[i].o, stops[i + 1].o, t),
  };
}

type DepthItem = {
  key: string;
  label: string;
  display: string;
  photo?: string;
};

function StoryDepthStrip({
  items,
  accent,
  active,
  visitDragRef,
  onFocusIndex,
  valueClass = "text-8xl sm:text-[10rem]",
  heightClass = "h-52 sm:h-72",
}: {
  items: DepthItem[];
  accent: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
  onFocusIndex?: (index: number) => void;
  valueClass?: string;
  heightClass?: string;
}) {
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);
  const progressRef = useRef(0);
  const startRef = useRef(0);
  const last = Math.max(0, items.length - 1);
  const [dragging, setDragging] = useState(false);

  const apply = (next: number) => {
    const n = Math.max(0, Math.min(last, next));
    progressRef.current = n;
    setProgress(n);
  };

  const go = (next: number) => apply(Math.round(next));

  useEffect(() => {
    if (!active) apply(0);
  }, [active, last]);

  const page = Math.round(progress);
  useEffect(() => {
    onFocusIndex?.(page);
  }, [page, onFocusIndex]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || reduced) return;

    const onWheel = (e: WheelEvent) => {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      if (!e.shiftKey && Math.abs(e.deltaX) < 8 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        return;
      }
      if (Math.abs(dx) < 8) return;
      e.preventDefault();
      e.stopPropagation();
      go(progressRef.current + (dx > 0 ? 1 : -1));
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [reduced, last]);

  const countClass = `font-semibold tabular-nums tracking-tight leading-none ${valueClass}`;

  if (reduced) {
    const current = items[0];
    return (
      <div className="flex items-center justify-center gap-5">
        {current?.photo && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={current.photo}
            alt=""
            className="h-20 w-20 sm:h-28 sm:w-28 rounded-full object-cover object-top"
          />
        )}
        <span
          className={withMetal(accent, countClass)}
          style={accentTextStyle(accent)}
        >
          {current?.display || "0"}
        </span>
      </div>
    );
  }

  const stepPx = () => Math.max(140, window.innerWidth * 0.28);

  const onPanStart = () => {
    startRef.current = progressRef.current;
    visitDragRef.current = true;
    setDragging(true);
  };

  const onPan = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    apply(startRef.current + info.offset.x / stepPx());
  };

  const onPanEnd = (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    visitDragRef.current = false;
    setDragging(false);
    const projected =
      startRef.current + info.offset.x / stepPx() + info.velocity.x / 1400;
    go(projected);
  };

  return (
    <div
      ref={stageRef}
      className={`mybiz-visit-depth ${heightClass}${dragging ? " is-drag" : ""}`}
    >
      <motion.div
        className="absolute inset-0"
        onPanStart={onPanStart}
        onPan={onPan}
        onPanEnd={onPanEnd}
      >
        {items.map((item, index) => {
          const offset = index - progress;
          const focusedHere = Math.abs(offset) < 0.45;
          return (
            <div
              key={item.key}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <motion.div
                className="text-center"
                initial={false}
                animate={visitPose(offset)}
                transition={dragging ? { duration: 0 } : visitSpring}
                style={{
                  zIndex: 10 - Math.round(Math.abs(offset)),
                  visibility: Math.abs(offset) > 2.6 ? "hidden" : "visible",
                }}
              >
                <div className="flex items-center justify-center gap-4 sm:gap-6">
                  {item.photo && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photo}
                      alt=""
                      className="h-16 w-16 sm:h-24 sm:w-24 rounded-full object-cover object-top shrink-0"
                    />
                  )}
                  <span
                    className={withMetal(accent, countClass)}
                    style={accentTextStyle(accent)}
                  >
                    {item.display}
                  </span>
                </div>
                {item.label ? (
                  <p
                    className={`mt-3 text-xl sm:text-2xl ${
                      focusedHere ? "text-white/70" : "text-white/45"
                    }`}
                  >
                    {item.label}
                  </p>
                ) : null}
              </motion.div>
            </div>
          );
        })}
      </motion.div>

      {page < last && (
        <button
          type="button"
          aria-label="See previous"
          onClick={() => go(page + 1)}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute left-2 sm:left-10 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15"
        >
          <Chevron dir="left" className="h-4 w-4 sm:h-[22px] sm:w-[22px]" />
        </button>
      )}
      {page > 0 && (
        <button
          type="button"
          aria-label="See next"
          onClick={() => go(page - 1)}
          onPointerDown={(e) => e.stopPropagation()}
          className="absolute right-2 sm:right-10 top-1/2 -translate-y-1/2 z-20 flex h-8 w-8 sm:h-11 sm:w-11 items-center justify-center rounded-full bg-white/10 border border-white/15 text-white/80 hover:text-white hover:bg-white/15"
        >
          <Chevron dir="right" className="h-4 w-4 sm:h-[22px] sm:w-[22px]" />
        </button>
      )}
    </div>
  );
}

function MonthChangeLine({
  months,
  focus,
  value,
  active,
  fallbackChange,
  fallbackPrev,
}: {
  months: MonthlyReportSessionPoint[];
  focus: number;
  value: (month: MonthlyReportSessionPoint) => number;
  active: boolean;
  fallbackChange: number;
  fallbackPrev: string;
}) {
  const index = Math.min(focus, Math.max(0, months.length - 1));
  const focused = months[index];
  const older = months[index + 1];
  const change = older
    ? percentChange(value(focused), value(older))
    : fallbackChange;

  if (older) {
    return (
      <ChangeLine
        key={`${focused?.month}-${older.month}`}
        change={change}
        prevMonth={older.label}
        active={active}
        className="mt-8 text-2xl sm:text-3xl text-white/70"
      />
    );
  }
  if (months.length > 1) {
    return (
      <p className="mt-8 text-2xl sm:text-3xl text-white/70">
        the earliest month we have
      </p>
    );
  }
  return (
    <ChangeLine
      change={fallbackChange}
      prevMonth={fallbackPrev}
      active={active}
      className="mt-8 text-2xl sm:text-3xl text-white/70"
    />
  );
}

function MonthSwitcher({
  months,
  accent,
  active,
  visitDragRef,
  onFocusIndex,
}: {
  months: Array<{ month: string; label: string }>;
  accent: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
  onFocusIndex?: (index: number) => void;
}) {
  if (months.length < 2) return null;
  return (
    <StoryDepthStrip
      items={months.map((item) => ({
        key: item.month,
        label: "",
        display: item.label,
      }))}
      accent={accent}
      active={active}
      visitDragRef={visitDragRef}
      onFocusIndex={onFocusIndex}
      valueClass="text-3xl sm:text-5xl"
      heightClass="h-16 sm:h-24"
    />
  );
}

function VisitDepthStrip({
  months,
  accent,
  active,
  visitDragRef,
  onFocusIndex,
}: {
  months: ReturnType<typeof visitMonths>;
  accent: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
  onFocusIndex?: (index: number) => void;
}) {
  return (
    <StoryDepthStrip
      items={months.map((item) => ({
        key: item.month,
        label: item.label,
        display: formatCount(item.sessions),
      }))}
      accent={accent}
      active={active}
      visitDragRef={visitDragRef}
      onFocusIndex={onFocusIndex}
    />
  );
}

function VisitsChapter({
  report,
  accent,
  prevMonth,
  active,
  visitDragRef,
}: {
  report: MonthlyReport;
  accent: string;
  prevMonth: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
}) {
  const months = visitMonths(report);
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (!active) setFocus(0);
  }, [active]);

  return (
    <>
      {months.length > 1 ? (
        <VisitDepthStrip
          months={months}
          accent={accent}
          active={active}
          visitDragRef={visitDragRef}
          onFocusIndex={setFocus}
        />
      ) : (
        <AnimatedCount
          value={report.summary.sessions}
          active={active}
          className={withMetal(
            accent,
            "block text-8xl sm:text-[10rem] font-semibold tabular-nums tracking-tight leading-none"
          )}
          style={accentTextStyle(accent)}
        />
      )}
      <Reveal active={active} delay={220}>
        <MonthChangeLine
          months={months}
          focus={focus}
          value={(month) => month.sessions}
          active={active}
          fallbackChange={report.summary.sessionsChange}
          fallbackPrev={prevMonth}
        />
      </Reveal>
    </>
  );
}

function PeopleChapter({
  report,
  accent,
  prevMonth,
  active,
  visitDragRef,
}: {
  report: MonthlyReport;
  accent: string;
  prevMonth: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
}) {
  const months = peopleMonths(report);
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (!active) setFocus(0);
  }, [active]);

  const focused = months[Math.min(focus, Math.max(0, months.length - 1))];
  const newUsers = focused?.newUsers ?? report.summary.newUsers;

  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>Unique visitors</Eyebrow>
      </Reveal>
      {months.length > 1 ? (
        <StoryDepthStrip
          items={months.map((item) => ({
            key: item.month,
            label: item.label,
            display: formatCount(item.users || 0),
          }))}
          accent={accent}
          active={active}
          visitDragRef={visitDragRef}
          onFocusIndex={setFocus}
        />
      ) : (
        <AnimatedCount
          value={report.summary.users}
          active={active}
          className={withMetal(
            accent,
            "block text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none"
          )}
          style={accentTextStyle(accent)}
        />
      )}
      <Reveal active={active} delay={180}>
        <p className="mt-2 text-2xl sm:text-3xl text-white/70">
          people who came to the site
        </p>
      </Reveal>
      <Reveal active={active} delay={220}>
        <MonthChangeLine
          months={months}
          focus={focus}
          value={(month) => month.users || 0}
          active={active}
          fallbackChange={report.summary.usersChange}
          fallbackPrev={prevMonth}
        />
      </Reveal>
      <Reveal active={active} delay={280}>
        <p className="mt-4 text-lg sm:text-2xl text-white/50">
          {formatCount(newUsers)} were new unique visitors
        </p>
      </Reveal>
    </>
  );
}

function AttentionChapter({
  report,
  accent,
  prevMonth,
  active,
  visitDragRef,
}: {
  report: MonthlyReport;
  accent: string;
  prevMonth: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
}) {
  const months = durationMonths(report);
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (!active) setFocus(0);
  }, [active]);

  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>Average time on site</Eyebrow>
      </Reveal>
      {months.length > 1 ? (
        <StoryDepthStrip
          items={months.map((item) => ({
            key: item.month,
            label: item.label,
            display: formatDuration(item.avgSessionDuration || 0),
          }))}
          accent={accent}
          active={active}
          visitDragRef={visitDragRef}
          onFocusIndex={setFocus}
        />
      ) : (
        <AnimatedDuration
          seconds={report.summary.avgSessionDuration}
          active={active}
          className={withMetal(
            accent,
            "block text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none"
          )}
          style={accentTextStyle(accent)}
        />
      )}
      <Reveal active={active} delay={180}>
        <p className="mt-2 text-2xl sm:text-3xl text-white/70">
          how long a typical visit lasted
        </p>
      </Reveal>
      <Reveal active={active} delay={220}>
        <MonthChangeLine
          months={months}
          focus={focus}
          value={(month) => month.avgSessionDuration || 0}
          active={active}
          fallbackChange={report.summary.avgSessionDurationChange}
          fallbackPrev={prevMonth}
        />
      </Reveal>
      {focus === 0 && (
        <Reveal active={active} delay={340}>
          <p className="mt-3 text-lg sm:text-2xl text-white/50">
            <AnimatedPercent rate={report.summary.engagementRate} active={active} />{" "}
            of visits stayed engaged
          </p>
        </Reveal>
      )}
    </>
  );
}

function BusiestChapter({
  report,
  busy,
  accent,
  active,
  visitDragRef,
}: {
  report: MonthlyReport;
  busy: NonNullable<ReturnType<typeof busiestDay>>;
  accent: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
}) {
  const months = busiestMonths(report);
  const [focus, setFocus] = useState(0);

  useEffect(() => {
    if (!active) setFocus(0);
  }, [active]);

  const focused = months[Math.min(focus, Math.max(0, months.length - 1))];
  const visits = focused?.busiestSessions ?? busy.sessions;

  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>Your busiest day</Eyebrow>
      </Reveal>
      {months.length > 1 ? (
        <StoryDepthStrip
          items={months.map((item) => ({
            key: item.month,
            label: item.label,
            display: formatDayLabel(item.busiestDate || ""),
          }))}
          accent={accent}
          active={active}
          visitDragRef={visitDragRef}
          onFocusIndex={setFocus}
          valueClass="text-6xl sm:text-8xl"
        />
      ) : (
        <Reveal active={active} delay={80}>
          <p
            className={withMetal(
              accent,
              "text-6xl sm:text-8xl font-semibold tracking-tight leading-tight"
            )}
            style={accentTextStyle(accent)}
          >
            {formatDayLabel(busy.date)}
          </p>
        </Reveal>
      )}
      <Reveal active={active} delay={180}>
        <p className="mt-2 text-2xl sm:text-3xl text-white/70">
          <AnimatedCount
            key={focused?.month || busy.date}
            value={visits}
            active={active}
          />{" "}
          visits that day
        </p>
      </Reveal>
      {months.length > 1 && (
        <Reveal active={active} delay={220}>
          <MonthChangeLine
            months={months}
            focus={focus}
            value={(month) => month.busiestSessions || 0}
            active={active}
            fallbackChange={0}
            fallbackPrev={focused?.label || ""}
          />
        </Reveal>
      )}
    </>
  );
}

function ArtistChapter({
  report,
  accent,
  active,
  visitDragRef,
}: {
  report: MonthlyReport;
  accent: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
}) {
  const months = visitMonths(report);
  const [focus, setFocus] = useState(0);
  const artists = orderedArtistPages(report);

  useEffect(() => {
    if (!active) setFocus(0);
  }, [active]);

  const month = months[Math.min(focus, Math.max(0, months.length - 1))];
  const canSwipe = months.some((item) => item.artistViews);
  const views = month?.artistViews;

  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent} className="mb-2">
          Artist Page Visits
        </Eyebrow>
      </Reveal>
      {canSwipe && (
        <MonthSwitcher
          months={months}
          accent={accent}
          active={active}
          visitDragRef={visitDragRef}
          onFocusIndex={setFocus}
        />
      )}
      <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:gap-x-8 sm:gap-y-8 w-full max-w-lg mx-auto mt-4">
        {artists.map((artist) => (
          <div key={artist.id} className="flex flex-col items-center text-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={artist.photo}
              alt=""
              className="h-14 w-14 sm:h-20 sm:w-20 rounded-full object-cover object-top"
            />
            <span
              className={withMetal(
                accent,
                "mt-2 text-2xl sm:text-4xl font-semibold tabular-nums leading-none"
              )}
              style={accentTextStyle(accent)}
            >
              {formatCount(
                views?.[artist.id] ?? (focus === 0 ? artist.views : 0)
              )}
            </span>
            <span className="mt-1.5 text-sm sm:text-base text-white/65">
              {artist.name}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}

function PagesChapter({
  pages,
  accent,
  active,
  title = "Most visited pages",
  months,
  visitDragRef,
}: {
  pages: ReturnType<typeof rankedPages>;
  accent: string;
  active: boolean;
  title?: string;
  months?: ReturnType<typeof visitMonths>;
  visitDragRef?: React.MutableRefObject<boolean>;
}) {
  const [focus, setFocus] = useState(0);
  const history =
    months && months.some((item) => item.pageViews) && months.length > 1
      ? months
      : [];

  useEffect(() => {
    if (!active) setFocus(0);
  }, [active]);

  const month = history[Math.min(focus, Math.max(0, history.length - 1))];

  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent} className="mb-2">
          {title}
        </Eyebrow>
      </Reveal>
      {history.length > 1 && visitDragRef && (
        <MonthSwitcher
          months={history}
          accent={accent}
          active={active}
          visitDragRef={visitDragRef}
          onFocusIndex={setFocus}
        />
      )}
      <ol className="space-y-4 sm:space-y-5 w-full max-w-xl mx-auto mt-4">
        {pages.map((page, i) => {
          const path = page.path.replace(/\/$/, "") || "/";
          const views =
            month?.pageViews?.[path] ??
            month?.pageViews?.[page.path] ??
            (focus === 0 || history.length < 2
              ? page.views || page.sessions
              : 0);
          return (
            <Reveal
              key={`${page.path}-${i}`}
              as="li"
              active={active}
              delay={90 * i}
              className="flex items-baseline justify-between gap-4 text-left"
            >
              <span className="text-xl sm:text-3xl font-medium min-w-0">
                {page.label}
              </span>
              <span
                className={withMetal(
                  accent,
                  "text-xl sm:text-3xl tabular-nums shrink-0 font-semibold"
                )}
                style={accentTextStyle(accent)}
              >
                {formatCount(views)}
              </span>
            </Reveal>
          );
        })}
      </ol>
    </>
  );
}

function ChannelPercent({
  percent,
  active,
  delay,
}: {
  percent: number;
  active: boolean;
  delay: number;
}) {
  const live = useCountUp(percent, active, { delay, duration: 900 });
  return (
    <span aria-label={`${percent}%`}>
      <span aria-hidden>{Math.round(live)}%</span>
    </span>
  );
}

function ChannelsChapter({
  report,
  channel,
  accent,
  active,
}: {
  report: MonthlyReport;
  channel: ReturnType<typeof topChannel>;
  accent: string;
  active: boolean;
}) {
  const rows = report.channels.filter((c) => c.sessions > 0).slice(0, 5);
  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>How they found you</Eyebrow>
      </Reveal>
      {channel && (
        <Reveal active={active} delay={80}>
          <p className="text-2xl sm:text-4xl text-white/80 mb-10">
            Mostly {channel.channel.toLowerCase()}
          </p>
        </Reveal>
      )}
      <ul className="space-y-5 max-w-md mx-auto w-full text-left">
        {rows.map((c, i) => (
          <Reveal key={c.channel} as="li" active={active} delay={90 * i}>
            <div className="flex items-baseline justify-between gap-4 text-lg sm:text-xl">
              <span>{c.channel}</span>
              <span className="tabular-nums text-white/50">
                <ChannelPercent
                  percent={c.percentage}
                  active={active}
                  delay={140 + 90 * i}
                />
              </span>
            </div>
            <LoadBar
              percent={c.percentage}
              accent={accent}
              active={active}
              delay={140 + 90 * i}
            />
          </Reveal>
        ))}
      </ul>
    </>
  );
}

function GeographyChapter({
  report,
  city,
  accent,
  active,
}: {
  report: MonthlyReport;
  city: ReturnType<typeof topCity>;
  accent: string;
  active: boolean;
}) {
  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>Where visitors came from</Eyebrow>
      </Reveal>
      {city && (
        <Reveal active={active} delay={80}>
          <p className="text-5xl sm:text-7xl font-semibold tracking-tight mb-3">
            {city.city}
          </p>
        </Reveal>
      )}
      {city && (
        <Reveal active={active} delay={160}>
          <p className="text-lg sm:text-2xl text-white/55 mb-6">
            <AnimatedCount value={city.sessions} active={active} delay={160} />{" "}
            visits from {city.city}
            {city.country ? `, ${city.country}` : ""}
          </p>
        </Reveal>
      )}
      <Reveal active={active} delay={240} className="w-full">
        <div className="relative w-[min(100vw,56rem)] max-w-none left-1/2 -translate-x-1/2 mybiz-map-shell">
          <VisitorMap
            countries={report.countries}
            regions={report.regions || []}
            accent={accent}
            isDark
            flush
            defaultView="us"
          />
        </div>
      </Reveal>
    </>
  );
}

function HoursChapter({
  report,
  accent,
  active,
}: {
  report: MonthlyReport;
  accent: string;
  active: boolean;
}) {
  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>Hours on this site</Eyebrow>
      </Reveal>
      <AnimatedHours
        value={report.hours as number}
        active={active}
        className={withMetal(
          accent,
          "block text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none"
        )}
        style={accentTextStyle(accent)}
      />
      <Reveal active={active} delay={200}>
        <p className="mt-6 text-2xl sm:text-3xl text-white/70">
          hours we spent on this site in{" "}
          {report.monthLabel.replace(/\s+\d+$/, "")}
        </p>
      </Reveal>
    </>
  );
}

function NotesChapter({
  notes,
  accent,
  active,
}: {
  notes: string[];
  accent: string;
  active: boolean;
}) {
  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>A few notes</Eyebrow>
      </Reveal>
      <ul className="space-y-5 max-w-xl mx-auto">
        {notes.map((note, i) => (
          <Reveal
            key={i}
            as="li"
            active={active}
            delay={110 * i}
            className="text-xl sm:text-2xl text-white/85"
          >
            {note}
          </Reveal>
        ))}
      </ul>
    </>
  );
}

function CloseChapter({
  report,
  accent,
  active,
  copied,
  onCopy,
}: {
  report: MonthlyReport;
  accent: string;
  active: boolean;
  copied: boolean;
  onCopy: () => void;
}) {
  return (
    <>
      <Reveal active={active}>
        <ClientLogo
          slug={report.slug}
          clientName={report.clientName}
          size={report.slug === "ink-kings" ? "hero" : "lg"}
          onDark
          metallic={isMetalAccent(accent)}
          fill={isMetalAccent(accent) ? HIGHLIGHT_COLOR_HEX.gold : undefined}
          className="mx-auto mb-6"
        />
      </Reveal>
      <Reveal active={active} delay={80}>
        <Eyebrow accent={accent}>My Business</Eyebrow>
      </Reveal>
      <Reveal active={active} delay={140}>
        <h2 className="text-5xl sm:text-7xl font-semibold tracking-tight leading-tight">
          That was {report.monthLabel.replace(/\s+\d+$/, "")}.
        </h2>
      </Reveal>
      <Reveal active={active} delay={180}>
        <p className="mt-6 text-2xl sm:text-3xl text-white/65">
          <AnimatedCount value={report.summary.sessions} active={active} /> visits
          · <AnimatedCount value={report.summary.users} active={active} delay={220} />{" "}
          people
        </p>
      </Reveal>
      <Reveal active={active} delay={280}>
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
      </Reveal>
    </>
  );
}
