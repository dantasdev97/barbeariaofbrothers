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
        "rounded-xl border border-white/10 bg-bg-surface p-6 hover:border-brand/30 hover:shadow-lg hover:shadow-brand/10 transition-all duration-300",
        className,
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
          {label}
        </span>
        <div className="p-2 rounded-lg bg-brand/10">
          <Icon className="h-5 w-5 text-brand" />
        </div>
      </div>
      <div className="font-heading text-4xl font-bold text-foreground">{value}</div>
      {hint && <p className="mt-2 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
