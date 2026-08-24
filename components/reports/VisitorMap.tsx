"use client";

import { useMemo, useState } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { matchCountry } from "@/lib/country-aliases";

const WORLD_TOPOJSON = "/maps/world-countries-110m.json";
const US_TOPOJSON = "/maps/us-states-10m.json";

type Country = { country: string; sessions: number; percentage?: number };
type Region = { region: string; country: string; sessions: number };

type View = "world" | "us";

/** Linear single-hue scale: 0 -> baseFill, max -> accent. Returns hex. */
function colorScale(
  value: number,
  max: number,
  accent: string,
  isDark: boolean,
  flush = false
) {
  if (!value || !max) {
    if (flush) return "#243044";
    return isDark ? "#1f2937" : "#f3f4f6";
  }
  // Clamp + ease so big single-country numbers don't visually flatten the rest.
  const t = Math.min(1, Math.pow(value / max, 0.55));
  const base = flush
    ? [36, 48, 68]
    : isDark
    ? [31, 41, 55]
    : [243, 244, 246];
  const a = hexToRgb(accent);
  const r = Math.round(base[0] + (a[0] - base[0]) * t);
  const g = Math.round(base[1] + (a[1] - base[1]) * t);
  const b = Math.round(base[2] + (a[2] - base[2]) * t);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): [number, number, number] {
  let h = hex.replace("#", "");
  if (h.length === 3) {
    h = h
      .split("")
      .map((c) => c + c)
      .join("");
  }
  const num = parseInt(h, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export function VisitorMap({
  countries,
  regions = [],
  accent,
  isDark = false,
  defaultView,
  flush = false,
}: {
  countries: Country[];
  regions?: Region[];
  accent: string;
  isDark?: boolean;
  defaultView?: View;
  /** Bleed into a dark page — no card, no hard edges. */
  flush?: boolean;
}) {
  const hasRegions = regions.length > 0;
  const [view, setView] = useState<View>(
    defaultView ?? (hasRegions ? "us" : "world")
  );

  const totalCountrySessions = useMemo(
    () => countries.reduce((s, c) => s + c.sessions, 0),
    [countries]
  );
  const totalRegionSessions = useMemo(
    () => regions.reduce((s, r) => s + r.sessions, 0),
    [regions]
  );

  const maxCountry = useMemo(
    () => Math.max(1, ...countries.map((c) => c.sessions)),
    [countries]
  );
  const maxRegion = useMemo(
    () => Math.max(1, ...regions.map((r) => r.sessions)),
    [regions]
  );

  const usRegions = useMemo(
    () =>
      regions.filter(
        (r) => !r.country || r.country === "United States" || r.country === "USA"
      ),
    [regions]
  );

  function lookupCountrySessions(geoName: string): number {
    const found = countries.find((c) => matchCountry(c.country, geoName));
    return found?.sessions || 0;
  }
  function lookupRegionSessions(stateName: string): number {
    const found = usRegions.find(
      (r) => r.region.toLowerCase() === stateName.toLowerCase()
    );
    return found?.sessions || 0;
  }

  const stroke = flush ? "#252d40" : isDark ? "#0a0e1a" : "#ffffff";

  return (
    <div className={flush ? "relative space-y-2" : "space-y-3"}>
      {/* View toggle */}
      <div
        className={`flex items-center gap-3 flex-wrap ${
          flush ? "justify-center" : "justify-between"
        }`}
      >
        {!flush && (
          <div
            className={`text-xs uppercase font-semibold tracking-wider ${
              isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            Visitors map
          </div>
        )}
        <div
          className={`no-print flex items-center gap-1 ${
            flush
              ? ""
              : `p-1 rounded-lg ${isDark ? "bg-clubhaus-blue-900" : "bg-gray-100"}`
          }`}
          role="tablist"
        >
          {(["world", "us"] as View[]).map((v) => {
            const active = view === v;
            const label = v === "world" ? "World" : "United States";
            const disabled = v === "us" && !hasRegions;
            return (
              <button
                key={v}
                onClick={() => !disabled && setView(v)}
                disabled={disabled}
                role="tab"
                aria-selected={active}
                className={`text-xs font-medium px-3 py-1.5 rounded-md transition-colors ${
                  active
                    ? flush
                      ? "text-white"
                      : isDark
                      ? "bg-clubhaus-blue-700 text-white"
                      : "bg-white text-gray-900 shadow-sm"
                    : disabled
                    ? isDark
                      ? "text-gray-600 cursor-not-allowed"
                      : "text-gray-400 cursor-not-allowed"
                    : isDark
                    ? "text-gray-400 hover:text-gray-200"
                    : "text-gray-600 hover:text-gray-900"
                }`}
                style={active ? { color: accent } : undefined}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Map */}
      <div
        className={
          flush
            ? "mybiz-map-bleed overflow-visible"
            : `rounded-lg overflow-hidden ${
                isDark ? "bg-clubhaus-blue-950" : "bg-gray-50"
              }`
        }
      >
        {view === "world" ? (
          <ComposableMap
            projection="geoEqualEarth"
            projectionConfig={{ scale: 145 }}
            width={900}
            height={420}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={WORLD_TOPOJSON}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name: string = geo.properties.name;
                  const sessions = lookupCountrySessions(name);
                  const pct = totalCountrySessions
                    ? (sessions / totalCountrySessions) * 100
                    : 0;
                  const tip = sessions
                    ? `${name} — ${sessions.toLocaleString()} sessions (${pct.toFixed(
                        1
                      )}%)`
                    : `${name} — no sessions`;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={colorScale(sessions, maxCountry, accent, isDark, flush)}
                      stroke={stroke}
                      strokeWidth={0.4}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", opacity: 0.85 },
                        pressed: { outline: "none" },
                      }}
                    >
                      <title>{tip}</title>
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        ) : (
          <ComposableMap
            projection="geoAlbersUsa"
            projectionConfig={{ scale: 1000 }}
            width={900}
            height={520}
            style={{ width: "100%", height: "auto" }}
          >
            <Geographies geography={US_TOPOJSON}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const name: string = geo.properties.name;
                  const sessions = lookupRegionSessions(name);
                  const pct = totalRegionSessions
                    ? (sessions / totalRegionSessions) * 100
                    : 0;
                  const tip = sessions
                    ? `${name} — ${sessions.toLocaleString()} sessions (${pct.toFixed(
                        1
                      )}%)`
                    : `${name} — no sessions`;
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={colorScale(sessions, maxRegion, accent, isDark, flush)}
                      stroke={stroke}
                      strokeWidth={0.5}
                      style={{
                        default: { outline: "none" },
                        hover: { outline: "none", opacity: 0.85 },
                        pressed: { outline: "none" },
                      }}
                    >
                      <title>{tip}</title>
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
        )}
      </div>

      {/* Legend / empty state */}
      <div
        className={`flex items-center gap-3 flex-wrap ${
          flush ? "justify-center opacity-60" : "justify-between"
        }`}
      >
        {view === "us" && !hasRegions ? (
          <p
            className={`text-[11px] ${
              isDark ? "text-gray-500" : "text-gray-500"
            }`}
          >
            No state-level data captured for this period.
          </p>
        ) : (
          <p
            className={`text-[11px] ${
              isDark ? "text-gray-500" : "text-gray-500"
            }`}
          >
            Shaded by sessions
            {view === "world"
              ? ` · ${countries.length} countries`
              : ` · ${usRegions.length} states`}
            . Hover for details.
          </p>
        )}
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            less
          </span>
          <div
            className="h-2 w-32 rounded-full"
            style={{
              background: `linear-gradient(90deg, ${
                isDark ? "#1f2937" : "#f3f4f6"
              }, ${accent})`,
            }}
          />
          <span
            className={`text-[10px] ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            more
          </span>
        </div>
      </div>
    </div>
  );
}
