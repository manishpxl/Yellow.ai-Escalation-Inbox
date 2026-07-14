import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/inbox/types";
import { Inbox, AlertTriangle, Clock3, CheckCircle2, Filter } from "lucide-react";
import yellowAiLogo from "@/assets/yellow-ai-logo.jpg.asset.json";

export type Filter = "all" | "urgent" | "sla-risk" | "unread" | "resolved" | "snoozed";

interface Counts {
  all: number;
  urgent: number;
  slaRisk: number;
  unread: number;
  resolved: number;
  snoozed: number;
}

interface Props {
  filter: Filter;
  onFilter: (f: Filter) => void;
  counts: Counts;
  onArmFailure: () => void;
  failureArmed: boolean;
  className?: string;
}

export function InboxSidebar({
  filter,
  onFilter,
  counts,
  onArmFailure,
  failureArmed,
  className,
}: Props) {
  const items: {
    key: Filter;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count: number;
    tone?: "ember" | "danger";
  }[] = [
    { key: "all", label: "All open", icon: Inbox, count: counts.all },
    { key: "urgent", label: "Urgent", icon: AlertTriangle, count: counts.urgent, tone: "danger" },
    { key: "sla-risk", label: "SLA risk", icon: Clock3, count: counts.slaRisk, tone: "ember" },
    { key: "unread", label: "Unread", icon: Filter, count: counts.unread },
    { key: "snoozed", label: "Snoozed", icon: Clock3, count: counts.snoozed },
    { key: "resolved", label: "Resolved", icon: CheckCircle2, count: counts.resolved },
  ];

  return (
    <aside
      className={cn(
        "w-[220px] shrink-0 border-r border-border bg-surface/50 flex flex-col h-full",
        className,
      )}
    >
      <div className="px-4 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-md overflow-hidden bg-white flex items-center justify-center shrink-0">
            <img src={yellowAiLogo.url} alt="Yellow.ai" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="text-[13px] font-semibold leading-tight">Yellow.ai</div>
            <div className="text-[10.5px] text-muted-foreground leading-tight">
              Escalation inbox
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto py-3">
        <div className="px-3 mb-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
          Views
        </div>
        <ul className="space-y-0.5 px-2">
          {items.map((it) => {
            const active = filter === it.key;
            return (
              <li key={it.key}>
                <button
                  onClick={() => onFilter(it.key)}
                  className={cn(
                    "w-full flex items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                    active
                      ? "bg-surface-2 text-foreground"
                      : "text-foreground/70 hover:bg-surface-2/70 hover:text-foreground",
                  )}
                >
                  <it.icon
                    className={cn(
                      "h-3.5 w-3.5 shrink-0",
                      it.tone === "ember" && "text-ember",
                      it.tone === "danger" && "text-[var(--danger)]",
                    )}
                  />
                  <span className="flex-1 text-left">{it.label}</span>
                  {it.count > 0 && (
                    <span
                      className={cn(
                        "text-[10.5px] tabular-nums font-medium px-1.5 rounded",
                        active ? "bg-ember/20 text-ember" : "text-muted-foreground",
                      )}
                    >
                      {it.count}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="border-t border-border p-3 space-y-2">
        <button
          onClick={onArmFailure}
          className={cn(
            "w-full text-left text-[11px] rounded-md border px-2.5 py-2 transition-colors",
            failureArmed
              ? "border-[var(--danger)]/50 bg-[color-mix(in_oklab,var(--danger)_10%,transparent)] text-[var(--danger)]"
              : "border-border text-muted-foreground hover:text-foreground hover:border-ember/40",
          )}
          title="Simulate a failure on the next reply for demo/testing"
        >
          <div className="flex items-center gap-1.5 font-medium">
            <AlertTriangle className="h-3 w-3" />
            {failureArmed ? "Next reply will fail" : "Arm failure (next reply)"}
          </div>
          <div className="text-[10.5px] opacity-80 mt-0.5">
            {failureArmed ? "Click Send to see the retry flow" : "Test the error + retry path"}
          </div>
        </button>
        <div className="text-[10.5px] text-muted-foreground/80 leading-relaxed">
          <div className="flex justify-between">
            <span>Navigate</span>
            <span>
              <kbd>J</kbd> <kbd>K</kbd>
            </span>
          </div>
          <div className="flex justify-between mt-1">
            <span>Reply</span>
            <kbd>R</kbd>
          </div>
          <div className="flex justify-between mt-1">
            <span>Resolve</span>
            <kbd>E</kbd>
          </div>
          <div className="flex justify-between mt-1">
            <span>Snooze</span>
            <kbd>S</kbd>
          </div>
        </div>
      </div>
    </aside>
  );
}
