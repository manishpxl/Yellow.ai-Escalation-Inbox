import { cn } from "@/lib/utils";
import type { Conversation } from "@/lib/inbox/types";
import { Avatar } from "./Avatar";
import { PriorityDot } from "./PriorityBadge";
import { ChannelIcon } from "./ChannelIcon";
import { SlaChip } from "./SlaChip";
import { relativeTime, reasonLabel } from "@/lib/inbox/utils";
import { Sparkles } from "lucide-react";

interface Props {
  conversation: Conversation;
  active: boolean;
  onSelect: () => void;
}

export function ConversationCard({ conversation: c, active, onSelect }: Props) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "group w-full text-left px-4 py-3 border-l-2 transition-colors relative",
        "hover:bg-surface-2/60 focus:outline-none focus-visible:bg-surface-2",
        active ? "bg-surface-2 border-l-[var(--ember)]" : "border-l-transparent",
        c.status === "resolved" && "opacity-55",
      )}
      aria-current={active}
    >
      <div className="flex gap-3">
        <div className="relative">
          <Avatar name={c.customer.name} color={c.customer.avatarColor} size={36} />
          {c.unread && (
            <span className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-ember ring-2 ring-surface" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <PriorityDot priority={c.priority} />
            <span
              className={cn(
                "truncate text-sm",
                c.unread ? "font-semibold text-foreground" : "font-medium text-foreground/85",
              )}
            >
              {c.customer.name}
            </span>
            {c.customer.tier === "enterprise" && (
              <span className="text-[9.5px] font-semibold tracking-wider uppercase text-ember">
                Ent
              </span>
            )}
            <span className="ml-auto text-[11px] text-muted-foreground tabular-nums shrink-0">
              {relativeTime(c.lastMessageAt)}
            </span>
          </div>
          <div
            className={cn(
              "text-[13px] truncate mb-1",
              c.unread ? "text-foreground/90" : "text-foreground/70",
            )}
          >
            {c.subject}
          </div>
          <div className="text-[12px] text-muted-foreground line-clamp-1 mb-2">{c.preview}</div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <SlaChip slaDueAt={c.slaDueAt} dense />
            <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground border border-border rounded-md px-1.5 py-0.5">
              <ChannelIcon channel={c.channel} className="h-3 w-3" />
            </span>
            <span className="inline-flex items-center gap-1 text-[10.5px] text-muted-foreground rounded-md">
              <Sparkles className="h-3 w-3 text-ember/80" />
              {reasonLabel(c.reason)}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
