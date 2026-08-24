import {
  getClientByName,
  getClientByPropertyId,
  getClientBySlug,
  type GA4Client,
} from "@/lib/clients";

const SIZE_CLASS = {
  sm: "h-8 w-8",
  md: "h-12 w-12",
  lg: "h-20 w-20",
  hero: "h-28 w-28 sm:h-40 sm:w-40",
} as const;

export function ClientLogo({
  slug,
  propertyId,
  client,
  clientName,
  size = "md",
  onDark = false,
  className = "",
}: {
  slug?: string;
  propertyId?: string;
  client?: GA4Client;
  clientName?: string;
  size?: keyof typeof SIZE_CLASS;
  onDark?: boolean;
  className?: string;
}) {
  const resolved =
    client ||
    (slug ? getClientBySlug(slug) : undefined) ||
    (propertyId ? getClientByPropertyId(propertyId) : undefined) ||
    (clientName ? getClientByName(clientName) : undefined);
  if (!resolved?.logo) return null;

  const label = clientName || resolved.clientName;

  if (onDark) {
    return (
      <span
        role="img"
        aria-label={label}
        className={`${SIZE_CLASS[size]} inline-block ${className}`}
        style={{
          backgroundColor: "#fff",
          WebkitMaskImage: `url(${resolved.logo})`,
          maskImage: `url(${resolved.logo})`,
          WebkitMaskRepeat: "no-repeat",
          maskRepeat: "no-repeat",
          WebkitMaskPosition: "center",
          maskPosition: "center",
          WebkitMaskSize: "contain",
          maskSize: "contain",
        }}
      />
    );
  }

  return (
    // Regular img so public-site can copy this without next/image config.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolved.logo}
      alt={label}
      className={`${SIZE_CLASS[size]} object-contain ${className}`}
    />
  );
}
