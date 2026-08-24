import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReportByToken } from "@/lib/reports";
import { monthInReview } from "@/lib/report-story";
import { MyBusinessScroll } from "@/components/reports/MyBusinessScroll";

export const dynamic = "force-dynamic";

function siteUrl(): string {
  const host =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (host) return `https://${host.replace(/^https?:\/\//, "")}`;
  return "http://localhost:3001";
}

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const report = await getReportByToken(params.token);
  if (!report) {
    return { title: "My Business not found" };
  }
  const review = monthInReview(report);
  const description = `${report.clientName} on the web in ${report.monthLabel}.`;
  return {
    metadataBase: new URL(siteUrl()),
    title: `${report.clientName} — ${review}`,
    description,
    robots: { index: false, follow: false },
    openGraph: {
      title: review,
      description,
      siteName: report.clientName,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: review,
      description,
    },
  };
}

export default async function MyBusinessPublicPage({
  params,
}: {
  params: { token: string };
}) {
  const report = await getReportByToken(params.token);
  if (!report) notFound();
  return <MyBusinessScroll report={report} />;
}
