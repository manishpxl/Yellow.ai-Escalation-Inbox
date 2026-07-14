import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/inbox/types";

const styles: Record<Conversation["priority"], string> = {
  urgent:
    "bg-[color-mix(in_oklab,var(--danger)_18%,transparent)] text-[var(--danger)] border-[color-mix(in_oklab,var(--danger)_40%,transparent)]",
  high: "bg-[color-mix(in_oklab,var(--ember)_15%,transparent)] text-ember border-[color-mix(in_oklab,var(--ember)_35%,transparent)]",
  normal:
    "bg-[color-mix(in_oklab,var(--info)_12%,transparent)] text-[var(--info)] border-[color-mix(in_oklab,var(--info)_30%,transparent)]",
  low: "bg-muted text-muted-foreground border-border",
};

export function PriorityDot({ priority }: { priority: Conversation["priority"] }) {
  const c: Record<Conversation["priority"], string> = {
    urgent: "bg-[var(--danger)]",
    high: "bg-[var(--ember)]",
    normal: "bg-[var(--info)]",
    low: "bg-muted-foreground/60",
  };
  return (
    <span
      className={cn("inline-block h-2 w-2 rounded-full", c[priority])}
      style={
        priority === "urgent" ? { animation: "pulse-dot 1.6s ease-in-out infinite" } : undefined
      }
      aria-label={`${priority} priority`}
    />
  );
}

export function PriorityBadge({ priority }: { priority: Conversation["priority"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10.5px] font-medium uppercase tracking-wider",
        styles[priority],
      )}
    >
      <PriorityDot priority={priority} />
      {priority}
    </span>
  );
}
