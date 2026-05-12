"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export type WizardStep = {
  id: string;
  title: string;
  subtitle?: string;
};

export function Stepper({
  steps,
  current,
  onStepClick,
}: {
  steps: WizardStep[];
  current: number;
  onStepClick?: (index: number) => void;
}) {
  return (
    <ol className="flex items-start gap-1 sm:gap-2">
      {steps.map((step, i) => {
        const done = i < current;
        const active = i === current;
        const clickable = onStepClick && i <= current;
        return (
          <li key={step.id} className="flex flex-1 flex-col items-center text-center">
            <div className="flex w-full items-center">
              <span className={cn("h-px flex-1", i === 0 ? "opacity-0" : done || active ? "bg-brand" : "bg-border")} />
              <button
                type="button"
                onClick={clickable ? () => onStepClick(i) : undefined}
                aria-current={active ? "step" : undefined}
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold transition-colors",
                  active && "bg-brand text-primary-foreground ring-4 ring-brand/15",
                  done && "bg-brand text-primary-foreground",
                  !active && !done && "bg-muted text-muted-foreground",
                  clickable && "cursor-pointer",
                )}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </button>
              <span className={cn("h-px flex-1", i === steps.length - 1 ? "opacity-0" : done ? "bg-brand" : "bg-border")} />
            </div>
            <div className="mt-2 px-1">
              <div className={cn("text-xs font-semibold leading-tight", active ? "text-foreground" : "text-muted-foreground")}>
                {step.title}
              </div>
              {step.subtitle && (
                <div className="mt-0.5 hidden text-[11px] leading-tight text-muted-foreground sm:block">
                  {step.subtitle}
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
