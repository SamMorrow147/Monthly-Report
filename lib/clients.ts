export type ClientHighlightColor =
  | "blue"
  | "orange"
  | "green"
  | "brown"
  | "red-brown"
  | "yellow"
  | "light-blue"
  | "purple"
  | "teal"
  | "indigo"
  | "cyan"
  | "black"
  | "gold"
  | "pink"
  | "navy";

export type ClientLogoTreatment = "color" | "invert-on-dark";
export type ClientLogoShape = "mark" | "wordmark";

export type GA4Client = {
  clientName: string;
  propertyId: string;
  highlightColor: ClientHighlightColor;
  /** Stable URL-safe slug for the client portal at /c/[slug] */
  slug: string;
  /** Public path to the client mark, e.g. /logos/cleaniacs.png */
  logo?: string;
  /** Black-only marks need invert-on-dark so they stay visible on dark UIs. */
  logoTreatment?: ClientLogoTreatment;
  /** Horizontal wordmarks need width, not a square crop. */
  logoShape?: ClientLogoShape;
};

export const GA4_CLIENTS_ROW_1: GA4Client[] = [
  { clientName: "Clubhaus Agency", propertyId: "309170366", highlightColor: "blue", slug: "clubhaus" },
  { clientName: "Pints and Paddle", propertyId: "346788360", highlightColor: "green", slug: "pints-and-paddle" },
  { clientName: "Experience Maple Grove", propertyId: "342306161", highlightColor: "orange", slug: "experience-maple-grove" },
  { clientName: "Hilltop Hanover", propertyId: "519865623", highlightColor: "brown", slug: "hilltop-hanover", logo: "/logos/hilltop-hanover.png" },
  { clientName: "Ink Kings", propertyId: "527348475", highlightColor: "gold", slug: "ink-kings", logo: "/logos/ink-kings.png", logoTreatment: "invert-on-dark" },
  { clientName: "TCFF", propertyId: "370970067", highlightColor: "teal", slug: "tcff" },
];

export const GA4_CLIENTS_ROW_2: GA4Client[] = [
  { clientName: "Bayerkohler", propertyId: "427362273", highlightColor: "light-blue", slug: "bayerkohler", logo: "/logos/bayerkohler.png", logoShape: "wordmark" },
  { clientName: "cleaniacs", propertyId: "519854014", highlightColor: "light-blue", slug: "cleaniacs", logo: "/logos/cleaniacs.png" },
  { clientName: "GAC", propertyId: "519869355", highlightColor: "indigo", slug: "gac", logo: "/logos/gac.png", logoShape: "wordmark" },
  { clientName: "Mains'l", propertyId: "381995271", highlightColor: "cyan", slug: "mainsl", logo: "/logos/mainsl.png", logoShape: "wordmark" },
  { clientName: "Cold Culture", propertyId: "524005835", highlightColor: "green", slug: "cold-culture" },
  { clientName: "No Words", propertyId: "525434558", highlightColor: "orange", slug: "no-words" },
  { clientName: "Open Door Health Center", propertyId: "528710135", highlightColor: "indigo", slug: "open-door-health" },
  { clientName: "Lake Link", propertyId: "537302129", highlightColor: "cyan", slug: "lake-link" },
  { clientName: "Lavish Ladies Lawn Care", propertyId: "537288495", highlightColor: "pink", slug: "lavish-ladies-lawn-care" },
  { clientName: "Hedine Jewelry", propertyId: "549979956", highlightColor: "navy", slug: "hedine-jewelry" },
];

export const GA4_CLIENTS_ALL: GA4Client[] = [
  ...GA4_CLIENTS_ROW_1,
  ...GA4_CLIENTS_ROW_2,
];

export function getClientByPropertyId(propertyId: string): GA4Client | undefined {
  return GA4_CLIENTS_ALL.find((c) => c.propertyId === propertyId);
}

export function getClientBySlug(slug: string): GA4Client | undefined {
  return GA4_CLIENTS_ALL.find((c) => c.slug === slug);
}

export function getClientByName(clientName: string): GA4Client | undefined {
  return GA4_CLIENTS_ALL.find((c) => c.clientName === clientName);
}

/**
 * Maps a client slug to the env var name holding their portal password.
 * Example: "pints-and-paddle" -> "CLIENT_PASSWORD_PINTS_AND_PADDLE"
 */
export function clientPasswordEnvKey(slug: string): string {
  return `CLIENT_PASSWORD_${slug.toUpperCase().replace(/-/g, "_")}`;
}
