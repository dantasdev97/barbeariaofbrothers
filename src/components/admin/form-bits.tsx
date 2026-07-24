"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Section({
  icon,
  title,
  description,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-border bg-bg-surface p-5">
      <div className="mb-4 flex items-center gap-2">
        {icon}
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      {description && (
        <p className="-mt-2 mb-4 text-xs text-muted-foreground">{description}</p>
      )}
      <div className="space-y-4">{children}</div>
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  children,
}: {
  id?: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-sm font-medium">
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: React.ReactNode;
  description?: React.ReactNode;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2",
          checked ? "bg-brand" : "bg-border",
        )}
      >
        <span
          className={cn(
            "absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-4" : "translate-x-0",
          )}
        />
      </button>
      <span>
        <span className="font-medium text-foreground">{label}</span>
        {description && (
          <span className="block text-xs text-muted-foreground">{description}</span>
        )}
      </span>
    </label>
  );
}

export function CharCounter({
  value,
  min,
  max,
}: {
  value: string;
  min?: number;
  max: number;
}) {
  const len = value.length;
  const ok = len >= (min ?? 0) && len <= max;
  return (
    <span
      className={cn(
        "text-right text-xs",
        len === 0 ? "text-muted-foreground" : ok ? "text-green-600" : "text-amber-600",
      )}
    >
      {len}
      {min ? `/${min}–${max}` : `/${max}`}
      {len > 0 && (ok ? " · ideal" : len > max ? " · longo" : " · curto")}
    </span>
  );
}
