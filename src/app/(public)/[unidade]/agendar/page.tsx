import { redirect } from "next/navigation";
import { getUnitBySlug } from "@/lib/data";

export const metadata = { robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AgendarRedirect({
  params,
}: {
  params: Promise<{ unidade: string }>;
}) {
  const { unidade } = await params;
  const unit = await getUnitBySlug(unidade);
  if (unit?.buk_url) redirect(unit.buk_url);
  redirect(`/${unidade}`);
}
