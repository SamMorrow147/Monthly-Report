import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReportByToken } from "@/lib/reports";
import { MyBusinessScroll } from "@/components/reports/MyBusinessScroll";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const report = await getReportByToken(params.token);
  if (!report) {
    return { title: "My Business not found" };
  }
  return {
    title: `${report.clientName} — ${report.monthLabel}`,
    description: `${report.clientName} on the web in ${report.monthLabel}.`,
    robots: { index: false, follow: false },
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
