/**
 * Helpers to turn raw GA4 page rows into something humans actually read.
 *
 * GA4 typically gives us:
 *   pageTitle: "Twisted Pin Branding | Clubhaus Agency | Minneapolis…"
 *   pagePath:  "/projects/twisted-pin-branding/12345"
 *
 * Reports and dashboards should show "Twisted Pin Branding", with the raw
 * path as small contextual subtitle.
 */

const TITLE_SEPARATORS = [" | ", " — ", " – ", " · ", " - "];

/**
 * If the title looks like "Page Name | Brand", drop the brand. We split on
 * the LAST separator (brands usually appear last). For the plain hyphen
 * ` - ` we only strip if the right side looks like a brand: 3+ alphabetic
 * chars, no slashes / numbers, to avoid butchering legitimate hyphenated
 * page names ("Q1 2026 - Sales Recap").
 */
function stripBrandSuffix(title: string): string {
  for (const sep of TITLE_SEPARATORS) {
    const idx = title.lastIndexOf(sep);
    if (idx === -1) continue;
    const left = title.slice(0, idx).trim();
    const right = title.slice(idx + sep.length).trim();
    if (!left || !right) continue;
    if (sep === " - ") {
      const isBrandLike =
        /^[A-Za-z][A-Za-z0-9 &.,'’]{2,}$/.test(right) && !/\d/.test(right);
      if (!isBrandLike) continue;
    }
    return left;
  }
  return title.trim();
}

/**
 * Build a human label from a URL path: drop query/hash, pull the last
 * non-numeric segment, replace separators with spaces, and title-case.
 */
export function friendlyFromPath(rawPath: string): string {
  if (!rawPath) return "Page";

  let p = rawPath.split("?")[0].split("#")[0];
  if (p === "/" || p === "") return "Home";
  if (p.endsWith("/")) p = p.slice(0, -1);

  const segments = p.split("/").filter(Boolean);
  // Prefer the last segment that isn't all digits (IDs).
  let label: string | undefined;
  for (let i = segments.length - 1; i >= 0; i--) {
    const seg = decodeURIComponent(segments[i]);
    if (!/^\d+$/.test(seg)) {
      label = seg;
      break;
    }
  }
  if (!label) label = decodeURIComponent(segments[segments.length - 1] || "");

  label = label.replace(/[-_]+/g, " ").replace(/\s+/g, " ").trim();
  if (!label) return "Page";

  // Title-case while preserving small words and acronyms.
  const SMALL = new Set([
    "a",
    "an",
    "and",
    "as",
    "at",
    "but",
    "by",
    "for",
    "in",
    "of",
    "on",
    "or",
    "the",
    "to",
    "vs",
    "via",
  ]);
  return label
    .split(" ")
    .map((word, i) => {
      if (word.length >= 2 && word === word.toUpperCase()) return word; // keep acronyms
      const lower = word.toLowerCase();
      if (i !== 0 && SMALL.has(lower)) return lower;
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(" ");
}

/**
 * Turn a (title, path) GA4 row into a clean, human label.
 *  - Uses the page title with the brand suffix stripped, when present.
 *  - Falls back to a humanized version of the URL path.
 */
export function prettifyPageTitle(
  title: string | undefined | null,
  path: string
): string {
  const raw = (title || "").trim();
  if (!raw || raw === path || raw.startsWith("/")) {
    return friendlyFromPath(path);
  }
  const cleaned = stripBrandSuffix(raw);
  return cleaned || friendlyFromPath(path);
}
