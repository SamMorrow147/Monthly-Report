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
  display: "h-44 w-44 sm:h-64 sm:w-64",
} as const;

const METAL_GOLD =
  "linear-gradient(165deg, #fff6d0 0%, #ffe9a0 16%, #f0c75e 34%, #d4af37 52%, #8a6a14 70%, #e8c84a 86%, #b8922a 100%)";

export function ClientLogo({
  slug,
  propertyId,
  client,
  clientName,
  size = "md",
  onDark = false,
  fill,
  metallic = false,
  className = "",
}: {
  slug?: string;
  propertyId?: string;
  client?: GA4Client;
  clientName?: string;
  size?: keyof typeof SIZE_CLASS;
  onDark?: boolean;
  fill?: string;
  metallic?: boolean;
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
          backgroundColor: fill || "#fff",
          backgroundImage: metallic ? METAL_GOLD : undefined,
          backgroundSize: metallic ? "100% 100%" : undefined,
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
