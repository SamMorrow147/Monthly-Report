import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReportByToken } from "@/lib/reports";
import { MonthlyReportView } from "./MonthlyReportView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: { token: string };
}): Promise<Metadata> {
  const report = await getReportByToken(params.token);
  if (!report) {
    return { title: "Report not found" };
  }
  return {
    title: `${report.clientName} — ${report.monthLabel} Report`,
    description: `Monthly analytics report for ${report.clientName} (${report.monthLabel}).`,
    robots: { index: false, follow: false },
  };
}

export default async function PublicReportPage({
  params,
}: {
  params: { token: string };
}) {
  const report = await getReportByToken(params.token);
  if (!report) notFound();
  return <MonthlyReportView report={report} />;
}
