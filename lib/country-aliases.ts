/**
 * GA4 returns country names in its own style. The world-atlas TopoJSON
 * (Natural Earth) sometimes uses different names for the same country.
 * Map GA4 -> TopoJSON names here for the cases that don't already match
 * exactly. Anything not listed falls through to a direct match by name.
 */
const GA4_TO_TOPOJSON: Record<string, string> = {
  "United States": "United States of America",
  Russia: "Russian Federation", // GA4 sometimes uses either form
  "Czech Republic": "Czechia",
  "Czech Republic (Czechia)": "Czechia",
  "Ivory Coast": "Côte d'Ivoire",
  Tanzania: "United Republic of Tanzania",
  "Republic of the Congo": "Republic of Congo",
  "Democratic Republic of the Congo": "Dem. Rep. Congo",
  Macedonia: "North Macedonia",
  "Western Sahara": "W. Sahara",
  "Dominican Republic": "Dominican Rep.",
  "Bosnia and Herzegovina": "Bosnia and Herz.",
  "Central African Republic": "Central African Rep.",
  "South Sudan": "S. Sudan",
  "Falkland Islands (Malvinas)": "Falkland Is.",
  Eswatini: "eSwatini",
  Myanmar: "Myanmar",
  "United Kingdom": "United Kingdom",
  "South Korea": "South Korea",
  "North Korea": "North Korea",
  Burma: "Myanmar",
  Vatican: "Vatican",
};

/**
 * Normalize a country name for fuzzy comparison: lowercase, drop diacritics,
 * collapse whitespace, strip "the ", "of ", and trailing parenthetical bits.
 */
function normalize(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .replace(/[.,']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Returns true if the GA4 country name maps to this TopoJSON geography name. */
export function matchCountry(ga4Name: string, geoName: string): boolean {
  if (!ga4Name || !geoName) return false;
  const aliased = GA4_TO_TOPOJSON[ga4Name];
  if (aliased && aliased === geoName) return true;
  return normalize(ga4Name) === normalize(geoName);
}
