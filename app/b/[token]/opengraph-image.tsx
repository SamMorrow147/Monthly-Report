import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { getReportByToken } from "@/lib/reports";
import { getClientBySlug } from "@/lib/clients";
import { monthInReview, reportAccent } from "@/lib/report-story";

export const runtime = "nodejs";
export const alt = "Monthly in Review";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image({
  params,
}: {
  params: { token: string };
}) {
  const report = await getReportByToken(params.token);
  const review = report ? monthInReview(report) : "In Review";
  const name = report?.clientName || "My Business";
  const accent = reportAccent(report?.highlightColor || "blue");
  const client = report ? getClientBySlug(report.slug) : undefined;

  let logoSrc: string | null = null;
  if (client?.logo) {
    try {
      const file = await readFile(join(process.cwd(), "public", client.logo));
      logoSrc = `data:image/png;base64,${file.toString("base64")}`;
    } catch {
      logoSrc = null;
    }
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0e1a",
        }}
      >
        {logoSrc ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 240,
              height: 240,
              borderRadius: 36,
              background: "#fff",
              marginBottom: 40,
            }}
          >
            <img
              src={logoSrc}
              alt=""
              width={180}
              height={180}
              style={{ objectFit: "contain" }}
            />
          </div>
        ) : null}
        <div
          style={{
            fontSize: 72,
            fontWeight: 700,
            color: accent,
            letterSpacing: -1.5,
          }}
        >
          {review}
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: 32,
            color: "rgba(255,255,255,0.7)",
          }}
        >
          {name}
        </div>
      </div>
    ),
    { ...size }
  );
}
