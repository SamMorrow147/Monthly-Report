"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MonthlyReport } from "@/lib/reports";
import {
  busiestDay,
  formatChangeVs,
  formatCount,
  formatDayLabel,
  monthlyReportPath,
  myBusinessPath,
  olderMonthLabel,
  previousMonthLabel,
  rankedPages,
  reportAccent,
  storyChapters,
  topChannel,
  topCity,
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
  const olderMonth = olderMonthLabel(report);
  const pages = rankedPages(report, 5);
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
        root.scrollTo({ top: target, behavior: reduced ? "auto" : "smooth" });
        window.setTimeout(() => {
          animatingRef.current = false;
        }, 500);
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
      if (animatingRef.current) return;
      if (scrollQuiet) window.clearTimeout(scrollQuiet);
      scrollQuiet = window.setTimeout(snapNearest, 90);
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
              olderMonth={olderMonth}
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
          overscroll-behavior-y: contain;
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
          overflow: visible;
        }
        .mybiz-visit-depth.is-drag {
          cursor: grabbing;
        }
        .mybiz-visit-item {
          position: absolute;
          left: 50%;
          top: 50%;
          text-align: center;
          will-change: transform, opacity, filter;
          pointer-events: none;
          white-space: nowrap;
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

function Chevron({ dir }: { dir: "up" | "down" }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {dir === "up" ? (
        <path d="M6 15l6-6 6 6" />
      ) : (
        <path d="M6 9l6 6 6-6" />
      )}
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
      className={`text-xs sm:text-sm uppercase tracking-[0.32em] font-semibold ${className}`}
      style={{ color: accent }}
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
  olderMonth,
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
  olderMonth: string;
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
      hideMark={brandedOpen}
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
        olderMonth={olderMonth}
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
      />
    );
  }
  if (id === "busiest" && busy) {
    return frame(
      <BusiestChapter busy={busy} active={active} />,
      <Reveal active={active}>
        <Eyebrow accent={accent} className="mb-2">
          Your busiest day
        </Eyebrow>
      </Reveal>
    );
  }
  if (id === "pages") {
    return frame(
      <PagesChapter pages={pages} accent={accent} active={active} />
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
          size="hero"
          onDark
          className="mx-auto mb-6"
        />
      </Reveal>
      <Reveal active={active} delay={80}>
        <Eyebrow accent={accent}>My Business</Eyebrow>
      </Reveal>
      <Reveal active={active} delay={140}>
        <h1 className="text-6xl sm:text-8xl font-semibold tracking-tight leading-[1.05]">
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

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}

function visitPose(
  t: number,
  fromX: number,
  toX: number,
  fromScale: number,
  toScale: number,
  fromOp: number,
  toOp: number,
  fromBlur: number,
  toBlur: number
) {
  return {
    transform: `translate(-50%, -50%) translateX(${lerp(fromX, toX, t)}vw) scale(${lerp(fromScale, toScale, t)})`,
    opacity: lerp(fromOp, toOp, t),
    filter: `blur(${lerp(fromBlur, toBlur, t)}px)`,
  };
}

function VisitDepthStrip({
  current,
  previous,
  currentLabel,
  previousLabel,
  olderLabel,
  accent,
  active,
  visitDragRef,
}: {
  current: number;
  previous: number;
  currentLabel: string;
  previousLabel: string;
  olderLabel: string;
  accent: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
}) {
  const reduced = usePrefersReducedMotion();
  const stageRef = useRef<HTMLDivElement>(null);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const dragRef = useRef<{
    x: number;
    start: number;
    lastX: number;
    vel: number;
    moved: boolean;
  } | null>(null);
  const [dragging, setDragging] = useState(false);

  const apply = (next: number) => {
    const n = Math.max(0, Math.min(1, next));
    tRef.current = n;
    setT(n);
  };

  useEffect(() => {
    if (!active) apply(0);
  }, [active]);

  useEffect(() => {
    const root = stageRef.current;
    if (!root || reduced) return;

    const onWheel = (e: WheelEvent) => {
      const dx = e.shiftKey ? e.deltaY : e.deltaX;
      if (!e.shiftKey && Math.abs(e.deltaX) < 1 && Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        return;
      }
      if (Math.abs(dx) < 0.4) return;
      e.preventDefault();
      e.stopPropagation();
      apply(tRef.current + dx / 160);
    };

    root.addEventListener("wheel", onWheel, { passive: false });
    return () => root.removeEventListener("wheel", onWheel);
  }, [reduced]);

  if (reduced) {
    return (
      <AnimatedCount
        value={current}
        active={active}
        className="block text-8xl sm:text-[10rem] font-semibold tabular-nums tracking-tight leading-none"
        style={{ color: accent }}
      />
    );
  }

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = {
      x: e.clientX,
      start: tRef.current,
      lastX: e.clientX,
      vel: 0,
      moved: false,
    };
    visitDragRef.current = true;
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 4) drag.moved = true;
    drag.vel = e.clientX - drag.lastX;
    drag.lastX = e.clientX;
    const width = Math.max(280, e.currentTarget.clientWidth);
    apply(drag.start - dx / (width * 0.18));
  };

  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    dragRef.current = null;
    visitDragRef.current = false;
    setDragging(false);
    if (!drag) return;
    if (!drag.moved) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      if (x < 0.38) apply(1);
      else if (x > 0.62) apply(0);
      else apply(tRef.current > 0.4 ? 1 : 0);
      return;
    }
    if (drag.vel < -5) apply(1);
    else if (drag.vel > 5) apply(0);
    else apply(tRef.current > 0.35 ? 1 : 0);
  };

  const ease = dragging
    ? "none"
    : "transform 0.5s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.45s ease, filter 0.45s ease";
  const older = visitPose(t, -48, -20, 0.26, 0.46, 0.22, 0.4, 1.8, 0.6);
  const prev = visitPose(t, -28, 4, 0.42, 1, 0.36, 1, 0.55, 0);
  const curr = visitPose(t, 8, 46, 1, 0.4, 1, 0.26, 0, 0.6);

  return (
    <div
      ref={stageRef}
      className={`mybiz-visit-depth h-52 sm:h-72${dragging ? " is-drag" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      {olderLabel ? (
        <div
          className="mybiz-visit-item text-white"
          style={{
            ...older,
            zIndex: 0,
            transition: ease,
          }}
        >
          <span className="block text-8xl sm:text-[10rem] font-semibold tracking-tight leading-none text-white/80">
            {olderLabel}
          </span>
        </div>
      ) : null}
      <div
        className="mybiz-visit-item text-white"
        style={{
          ...prev,
          zIndex: t >= 0.5 ? 2 : 1,
          transition: ease,
        }}
      >
        <AnimatedCount
          value={previous}
          active={active}
          delay={240}
          className="block text-8xl sm:text-[10rem] font-semibold tabular-nums tracking-tight leading-none"
        />
        <p className="mt-3 text-xl sm:text-2xl text-white/70">{previousLabel}</p>
      </div>
      <div
        className="mybiz-visit-item"
        style={{
          ...curr,
          zIndex: t < 0.5 ? 2 : 1,
          color: accent,
          transition: ease,
        }}
      >
        <AnimatedCount
          value={current}
          active={active}
          className="block text-8xl sm:text-[10rem] font-semibold tabular-nums tracking-tight leading-none"
          style={{ color: accent }}
        />
        <p className="mt-3 text-xl sm:text-2xl text-white/45">{currentLabel}</p>
      </div>
    </div>
  );
}

function VisitsChapter({
  report,
  accent,
  prevMonth,
  olderMonth,
  active,
  visitDragRef,
}: {
  report: MonthlyReport;
  accent: string;
  prevMonth: string;
  olderMonth: string;
  active: boolean;
  visitDragRef: React.MutableRefObject<boolean>;
}) {
  const thisMonth = report.monthLabel.replace(/\s+\d+$/, "");
  const hasPrev = Number.isFinite(report.summary.prevSessions);

  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>Visits</Eyebrow>
      </Reveal>
      {hasPrev ? (
        <VisitDepthStrip
          current={report.summary.sessions}
          previous={report.summary.prevSessions}
          currentLabel={thisMonth}
          previousLabel={prevMonth}
          olderLabel={olderMonth}
          accent={accent}
          active={active}
          visitDragRef={visitDragRef}
        />
      ) : (
        <AnimatedCount
          value={report.summary.sessions}
          active={active}
          className="block text-8xl sm:text-[10rem] font-semibold tabular-nums tracking-tight leading-none"
          style={{ color: accent }}
        />
      )}
      <Reveal active={active} delay={220}>
        <ChangeLine
          change={report.summary.sessionsChange}
          prevMonth={prevMonth}
          active={active}
          className="mt-8 text-2xl sm:text-3xl text-white/70"
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
}: {
  report: MonthlyReport;
  accent: string;
  prevMonth: string;
  active: boolean;
}) {
  const newUsers = useCountUp(report.summary.newUsers, active, { delay: 280 });
  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>People</Eyebrow>
      </Reveal>
      <AnimatedCount
        value={report.summary.users}
        active={active}
        className="block text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none"
      />
      <Reveal active={active} delay={180}>
        <p className="mt-6 text-2xl sm:text-3xl text-white/70">
          people came to the site
        </p>
      </Reveal>
      <Reveal active={active} delay={280}>
        <p
          className="mt-4 text-lg sm:text-2xl text-white/50"
          aria-label={`${formatCount(report.summary.newUsers)} were new · ${formatChangeVs(report.summary.newUsersChange, prevMonth)}`}
        >
          <span aria-hidden>
            {formatCount(Math.round(newUsers))} were new ·{" "}
          </span>
          <ChangeLine
            change={report.summary.newUsersChange}
            prevMonth={prevMonth}
            active={active}
            as="span"
          />
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
}: {
  report: MonthlyReport;
  accent: string;
  prevMonth: string;
  active: boolean;
}) {
  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>Attention</Eyebrow>
      </Reveal>
      <AnimatedDuration
        seconds={report.summary.avgSessionDuration}
        active={active}
        className="block text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none"
        style={{ color: accent }}
      />
      <Reveal active={active} delay={180}>
        <p className="mt-6 text-2xl sm:text-3xl text-white/70">
          average time on the site
        </p>
      </Reveal>
      <Reveal active={active} delay={260}>
        <ChangeLine
          change={report.summary.avgSessionDurationChange}
          prevMonth={prevMonth}
          active={active}
          className="mt-4 text-lg sm:text-2xl text-white/50"
        />
      </Reveal>
      <Reveal active={active} delay={340}>
        <p className="mt-3 text-lg sm:text-2xl text-white/50">
          <AnimatedPercent rate={report.summary.engagementRate} active={active} />{" "}
          of visits stayed engaged
        </p>
      </Reveal>
    </>
  );
}

function BusiestChapter({
  busy,
  active,
}: {
  busy: NonNullable<ReturnType<typeof busiestDay>>;
  active: boolean;
}) {
  return (
    <>
      <Reveal active={active} delay={80}>
        <p className="text-5xl sm:text-7xl font-semibold tracking-tight leading-tight">
          {formatDayLabel(busy.date)}
        </p>
      </Reveal>
      <Reveal active={active} delay={180}>
        <p className="mt-6 text-2xl sm:text-3xl text-white/70">
          <AnimatedCount value={busy.sessions} active={active} /> visits that day
        </p>
      </Reveal>
    </>
  );
}

function PagesChapter({
  pages,
  accent,
  active,
}: {
  pages: ReturnType<typeof rankedPages>;
  accent: string;
  active: boolean;
}) {
  return (
    <>
      <Reveal active={active}>
        <Eyebrow accent={accent}>Top pages</Eyebrow>
      </Reveal>
      <ol className="space-y-5 max-w-xl mx-auto">
        {pages.map((page, i) => (
          <Reveal
            key={`${page.path}-${i}`}
            as="li"
            active={active}
            delay={90 * i}
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
            <span className="text-base sm:text-xl tabular-nums text-white/45 shrink-0">
              <AnimatedCount
                value={page.views || page.sessions}
                active={active}
                delay={120 + 90 * i}
              />
            </span>
          </Reveal>
        ))}
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
        <Eyebrow accent={accent}>Where they came from</Eyebrow>
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
        <Eyebrow accent={accent}>Time on the work</Eyebrow>
      </Reveal>
      <AnimatedHours
        value={report.hours as number}
        active={active}
        className="block text-8xl sm:text-[9rem] font-semibold tabular-nums tracking-tight leading-none"
        style={{ color: accent }}
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
        <Eyebrow accent={accent}>Notes</Eyebrow>
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
          size="lg"
          onDark
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
