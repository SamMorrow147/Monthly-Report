"use client";

import { useEffect, useRef, useState } from "react";
import { formatCount, formatDuration } from "@/lib/report-story";

function easeOutCubic(t: number) {
  return 1 - Math.pow(1 - t, 3);
}

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return reduced;
}

export function useCountUp(
  target: number,
  active: boolean,
  opts?: { duration?: number; delay?: number }
): number {
  const reduced = usePrefersReducedMotion();
  const safeTarget = Number.isFinite(target) ? target : 0;
  const [value, setValue] = useState(safeTarget);
  const cfg = useRef({
    delay: opts?.delay ?? 140,
    duration:
      opts?.duration ??
      Math.min(1400, Math.max(800, 520 + Math.abs(safeTarget) * 5)),
    reduced,
  });
  cfg.current.delay = opts?.delay ?? 140;
  cfg.current.duration =
    opts?.duration ??
    Math.min(1400, Math.max(800, 520 + Math.abs(safeTarget) * 5));
  cfg.current.reduced = reduced;

  useEffect(() => {
    if (!active || cfg.current.reduced) {
      setValue(safeTarget);
      return;
    }

    const { delay, duration } = cfg.current;
    setValue(0);
    const started = performance.now();
    const tick = () => {
      const elapsed = performance.now() - started - delay;
      if (elapsed < 0) return;
      const t = Math.min(1, elapsed / duration);
      setValue(safeTarget * easeOutCubic(t));
      if (t >= 1) window.clearInterval(id);
    };
    const id = window.setInterval(tick, 16);
    const end = window.setTimeout(() => {
      window.clearInterval(id);
      setValue(safeTarget);
    }, delay + duration + 40);

    return () => {
      window.clearInterval(id);
      window.clearTimeout(end);
    };
  }, [active, safeTarget]);

  return value;
}

export function AnimatedCount({
  value,
  active,
  className,
  style,
  delay,
}: {
  value: number;
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
  delay?: number;
}) {
  const live = useCountUp(value, active, { delay });
  const shown = formatCount(Math.round(live));
  return (
    <span className={className} style={style} aria-label={formatCount(value)}>
      <span aria-hidden>{shown}</span>
    </span>
  );
}

export function AnimatedDuration({
  seconds,
  active,
  className,
  style,
}: {
  seconds: number;
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const live = useCountUp(seconds, active);
  const label = formatDuration(seconds);
  return (
    <span className={className} style={style} aria-label={label}>
      <span aria-hidden>{formatDuration(live)}</span>
    </span>
  );
}

export function AnimatedPercent({
  rate,
  active,
  className,
}: {
  rate: number;
  active: boolean;
  className?: string;
}) {
  const target = Math.round(rate * 100);
  const live = useCountUp(target, active, { delay: 280 });
  return (
    <span className={className} aria-label={`${target}%`}>
      <span aria-hidden>{Math.round(live)}%</span>
    </span>
  );
}

export function AnimatedHours({
  value,
  active,
  className,
  style,
}: {
  value: number;
  active: boolean;
  className?: string;
  style?: React.CSSProperties;
}) {
  const decimals = value % 1 === 0 ? 0 : 1;
  const live = useCountUp(value, active);
  const format = (n: number) =>
    n.toLocaleString(undefined, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    });
  return (
    <span className={className} style={style} aria-label={format(value)}>
      <span aria-hidden>{format(live)}</span>
    </span>
  );
}

export function ChangeLine({
  change,
  prevMonth,
  active,
  className,
  as: Tag = "p",
}: {
  change: number;
  prevMonth: string;
  active: boolean;
  className?: string;
  as?: "p" | "span";
}) {
  const live = useCountUp(Math.abs(change), active, { delay: 360, duration: 900 });
  if (!Number.isFinite(change) || Math.abs(change) < 0.1) {
    return <Tag className={className}>{`about the same as ${prevMonth}`}</Tag>;
  }
  const dir = change > 0 ? "up" : "down";
  return (
    <Tag
      className={className}
      aria-label={`${dir} ${Math.abs(change).toFixed(1)}% from ${prevMonth}`}
    >
      <span aria-hidden>
        {dir} {live.toFixed(1)}% from {prevMonth}
      </span>
    </Tag>
  );
}

export function Reveal({
  active,
  delay = 0,
  children,
  className = "",
  as: Tag = "div",
}: {
  active: boolean;
  delay?: number;
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const reduced = usePrefersReducedMotion();
  const [shown, setShown] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    if (!active) return;
    setSeen(true);
    setShown(false);
    const raf = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const on = reduced || shown || (!active && seen);
  return (
    <Tag
      className={className}
      style={{
        opacity: on ? 1 : 0,
        transform: reduced || on ? "none" : "translateY(16px)",
        transition: reduced
          ? "none"
          : `opacity 0.55s ease ${delay}ms, transform 0.55s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
      }}
    >
      {children}
    </Tag>
  );
}

export function LoadBar({
  percent,
  accent,
  active,
  delay = 0,
}: {
  percent: number;
  accent: string;
  active: boolean;
  delay?: number;
}) {
  const reduced = usePrefersReducedMotion();
  const width = Math.min(100, Math.max(0, percent));
  const [fill, setFill] = useState(false);
  const seenRef = useRef(false);

  useEffect(() => {
    if (!active) {
      if (seenRef.current) setFill(true);
      return;
    }
    seenRef.current = true;
    setFill(false);
    const raf = requestAnimationFrame(() => setFill(true));
    return () => cancelAnimationFrame(raf);
  }, [active]);

  const grown = reduced || fill;
  return (
    <div
      className="mt-2 h-1.5 rounded-full overflow-hidden"
      style={{ background: "var(--mybiz-surface)" }}
    >
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          backgroundColor: accent,
          transform: grown ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left center",
          transition: reduced
            ? "none"
            : `transform 0.95s cubic-bezier(0.22, 1, 0.36, 1) ${delay}ms`,
        }}
      />
    </div>
  );
}

export function ChapterMark({
  id,
  accent,
  active,
}: {
  id: string;
  accent: string;
  active: boolean;
}) {
  const reduced = usePrefersReducedMotion();
  const play = active && !reduced;
  const [gen, setGen] = useState(active ? 1 : 0);
  const wasActive = useRef(active);

  useEffect(() => {
    if (active && !wasActive.current) setGen((g) => g + 1);
    wasActive.current = active;
  }, [active]);

  if (id === "visits") {
    return (
      <div
        aria-hidden
        className="h-36 sm:h-48 w-full flex items-center justify-center mb-6 overflow-visible"
      >
        <div
          key={gen}
          className={`mybiz-mark mybiz-visits-mark relative overflow-visible${
            play ? " is-play" : ""
          }`}
        >
          <div
            className="mybiz-click-btn relative flex items-center justify-center rounded-2xl border-[2.5px] px-10 py-5 sm:px-16 sm:py-7"
            style={{
              borderColor: accent,
              backgroundColor: `${accent}33`,
            }}
          >
            <span
              className={`mybiz-heading text-2xl sm:text-4xl font-semibold tracking-tight whitespace-nowrap${
                accent.toLowerCase() === "#d4af37" ? " mybiz-metal" : ""
              }`}
              style={accent.toLowerCase() === "#d4af37" ? undefined : { color: accent }}
            >
              Total visits
            </span>
            <span
              className="mybiz-click-ring pointer-events-none absolute right-6 bottom-3 h-5 w-5 rounded-full border-2"
              style={{ borderColor: accent }}
            />
          </div>
          <svg
            className="mybiz-click-cursor pointer-events-none absolute right-4 bottom-1 overflow-visible"
            width="32"
            height="40"
            viewBox="0 0 32 40"
          >
            <path
              d="M2 0l3.2 30 8.4-7.4 6 14.4 7.2-3-6-14.6 10.8-1.8z"
              fill="var(--mybiz-fg)"
              stroke={accent}
              strokeWidth="1.6"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="h-28 sm:h-36 w-full flex items-center justify-center mb-8"
    >
      <svg
        key={gen}
        width="112"
        height="112"
        viewBox="0 0 112 112"
        className={`mybiz-mark${play ? ` is-play mybiz-mark-${id}` : ""}`}
      >
        {id === "open" && (
          <>
            <circle cx="56" cy="56" r="10" fill={accent} className="mybiz-mark-core" />
            <circle cx="56" cy="56" r="22" fill="none" stroke={accent} strokeWidth="1.5" className="mybiz-ring r1" />
            <circle cx="56" cy="56" r="34" fill="none" stroke={accent} strokeWidth="1.25" className="mybiz-ring r2" />
            <circle cx="56" cy="56" r="46" fill="none" stroke={accent} strokeWidth="1" className="mybiz-ring r3" />
          </>
        )}
        {id === "people" && (
          <>
            <circle cx="40" cy="50" r="16" fill={accent} fillOpacity="0.85" className="mybiz-pop d1" />
            <circle cx="72" cy="50" r="16" fill={accent} fillOpacity="0.55" className="mybiz-pop d2" />
            <circle cx="56" cy="68" r="16" fill={accent} fillOpacity="0.7" className="mybiz-pop d3" />
          </>
        )}
        {id === "attention" && (
          <>
            <circle cx="56" cy="56" r="30" fill="none" stroke="var(--mybiz-fg)" strokeOpacity="0.15" strokeWidth="4" />
            <circle
              cx="56"
              cy="56"
              r="30"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
              className="mybiz-arc"
              transform="rotate(-90 56 56)"
            />
            <circle cx="56" cy="56" r="4" fill={accent} className="mybiz-mark-core" />
          </>
        )}
        {id === "busiest" && (
          <>
            <rect x="28" y="30" width="56" height="54" rx="8" fill="none" stroke="var(--mybiz-fg)" strokeOpacity="0.28" strokeWidth="2" className="mybiz-pop" />
            <rect x="28" y="30" width="56" height="14" rx="8" fill={accent} fillOpacity="0.85" className="mybiz-pop" />
            <rect x="48" y="54" width="16" height="16" rx="3" fill={accent} className="mybiz-pulse" />
          </>
        )}
        {id === "artists" && (
          <>
            <circle cx="32" cy="40" r="9" fill={accent} fillOpacity="0.95" className="mybiz-pop d1" />
            <circle cx="56" cy="40" r="9" fill={accent} fillOpacity="0.8" className="mybiz-pop d2" />
            <circle cx="80" cy="40" r="9" fill={accent} fillOpacity="0.65" className="mybiz-pop d3" />
            <circle cx="32" cy="68" r="9" fill={accent} fillOpacity="0.8" className="mybiz-pop d4" />
            <circle cx="56" cy="68" r="9" fill={accent} fillOpacity="0.65" className="mybiz-pop d5" />
            <circle cx="80" cy="68" r="9" fill={accent} fillOpacity="0.5" className="mybiz-pop d6" />
          </>
        )}
        {id === "pages" && (
          <>
            <rect x="40" y="28" width="40" height="50" rx="6" fill="none" stroke={accent} strokeWidth="2" className="mybiz-page p1" />
            <rect x="34" y="34" width="40" height="50" rx="6" fill="none" stroke={accent} strokeOpacity="0.65" strokeWidth="2" className="mybiz-page p2" />
            <rect x="28" y="40" width="40" height="50" rx="6" fill={accent} fillOpacity="0.18" stroke={accent} strokeWidth="2" className="mybiz-page p3" />
          </>
        )}
        {id === "channels" && (
          <>
            <rect x="28" y="58" width="14" height="26" rx="4" fill={accent} fillOpacity="0.45" className="mybiz-bar b1" />
            <rect x="49" y="42" width="14" height="42" rx="4" fill={accent} fillOpacity="0.7" className="mybiz-bar b2" />
            <rect x="70" y="28" width="14" height="56" rx="4" fill={accent} className="mybiz-bar b3" />
          </>
        )}
        {id === "geography" && (
          <>
            <circle cx="56" cy="56" r="30" fill="none" stroke="var(--mybiz-fg)" strokeOpacity="0.18" strokeWidth="2" />
            <circle cx="56" cy="56" r="18" fill="none" stroke={accent} strokeOpacity="0.45" strokeWidth="1.5" className="mybiz-ring r1" />
            <path
              d="M56 34c-8.8 0-16 7-16 15.6 0 11.4 16 26.4 16 26.4s16-15 16-26.4C72 41 64.8 34 56 34z"
              fill={accent}
              className="mybiz-pin"
            />
            <circle cx="56" cy="49" r="5" fill="var(--mybiz-bg)" />
          </>
        )}
        {id === "hours" && (
          <>
            <circle cx="56" cy="56" r="30" fill="none" stroke="var(--mybiz-fg)" strokeOpacity="0.2" strokeWidth="3" />
            <circle cx="56" cy="56" r="3.5" fill={accent} />
            <line x1="56" y1="56" x2="56" y2="36" stroke={accent} strokeWidth="3" strokeLinecap="round" className="mybiz-hand" />
          </>
        )}
        {id === "notes" && (
          <>
            <line x1="30" y1="40" x2="82" y2="40" stroke={accent} strokeWidth="3" strokeLinecap="round" className="mybiz-line l1" />
            <line x1="30" y1="56" x2="74" y2="56" stroke={accent} strokeOpacity="0.7" strokeWidth="3" strokeLinecap="round" className="mybiz-line l2" />
            <line x1="30" y1="72" x2="64" y2="72" stroke={accent} strokeOpacity="0.45" strokeWidth="3" strokeLinecap="round" className="mybiz-line l3" />
          </>
        )}
        {id === "close" && (
          <>
            <circle cx="56" cy="56" r="30" fill="none" stroke={accent} strokeWidth="3" className="mybiz-pop" />
            <path
              d="M40 58l10 10 22-24"
              fill="none"
              stroke={accent}
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mybiz-check"
            />
          </>
        )}
      </svg>
    </div>
  );
}
