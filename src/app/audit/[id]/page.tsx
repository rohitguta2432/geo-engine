import { notFound } from "next/navigation";
import { AuditDashboard } from "@/components/audit-dashboard";
import { getAuditView } from "@/lib/audit/view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function AuditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const view = getAuditView(id);
  if (!view) notFound();
  return <AuditDashboard initial={view} />;
}
