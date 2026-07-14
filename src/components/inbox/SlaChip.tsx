import { cn } from "@/lib/utils";
import { slaLabel } from "@/lib/inbox/utils";
import { Clock } from "lucide-react";

export function SlaChip({ slaDueAt, dense }: { slaDueAt: string; dense?: boolean }) {
  const { label, tone } = slaLabel(slaDueAt);
  const toneClass =
    tone === "danger"
      ? "text-[var(--danger)] bg-[color-mix(in_oklab,var(--danger)_15%,transparent)] border-[color-mix(in_oklab,var(--danger)_35%,transparent)]"
      : tone === "warning"
        ? "text-[var(--warning)] bg-[color-mix(in_oklab,var(--warning)_12%,transparent)] border-[color-mix(in_oklab,var(--warning)_30%,transparent)]"
        : "text-muted-foreground bg-muted/50 border-border";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md border font-medium tabular-nums",
        dense ? "px-1.5 py-0.5 text-[10.5px]" : "px-2 py-0.5 text-xs",
        toneClass,
      )}
    >
      <Clock className={dense ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {label}
    </span>
  );
}
