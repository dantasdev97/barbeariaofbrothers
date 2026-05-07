import { Suspense } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getAllUnits } from "@/lib/data";
import { UnitPicker } from "@/components/public/unit-picker";

export default async function HomePage() {
  // If the user already has a unit cookie pointing to an active slug, skip the picker.
  const cookieStore = await cookies();
  const cookieSlug = cookieStore.get("unit_slug")?.value;

  return (
    <Suspense fallback={<PickerSkeleton />}>
      <PickerLoader cookieSlug={cookieSlug} />
    </Suspense>
  );
}

async function PickerLoader({ cookieSlug }: { cookieSlug?: string }) {
  const units = await getAllUnits();

  if (cookieSlug && units.some((u) => u.slug === cookieSlug)) {
    redirect(`/${cookieSlug}`);
  }

  return <UnitPicker units={units} />;
}

function PickerSkeleton() {
  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background">
      <div className="h-12 w-12 animate-pulse rounded-full bg-brand/30" />
    </div>
  );
}
