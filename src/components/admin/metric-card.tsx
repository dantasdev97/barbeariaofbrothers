import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint?: string;
  className?: string;
};

export function MetricCard({ icon: Icon, label, value, hint, className }: Props) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/10 bg-bg-surface p-5",
        className,
      )}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </span>
        <Icon className="h-4 w-4 text-brand" />
      </div>
      <div className="mt-3 font-heading text-3xl font-bold">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
