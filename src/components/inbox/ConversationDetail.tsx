import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import type { Conversation } from "@/lib/inbox/types";
import { inboxApi } from "@/lib/inbox/api";
import { Avatar } from "./Avatar";
import { PriorityBadge } from "./PriorityBadge";
import { SlaChip } from "./SlaChip";
import { ChannelIcon } from "./ChannelIcon";
import { relativeTime, reasonLabel, channelLabel } from "@/lib/inbox/utils";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Clock3,
  Sparkles,
  Send,
  AlertTriangle,
  Building2,
  Mail as MailIcon,
  Tag,
  RefreshCw,
  Loader2,
  MessageSquareReply,
} from "lucide-react";

interface Props {
  conversation: Conversation;
  onUpdate: (c: Conversation) => void;
  onNext: () => void;
  focusReplyKey: number;
}

const canned = [
  "Thanks for flagging this — I'm looking into it now and will have an answer within the hour.",
  "I've escalated this internally and will follow up as soon as I hear back.",
  "Sincere apologies for the trouble. I've processed the refund and you should see it within 3–5 business days.",
];

export function ConversationDetail({ conversation: c, onUpdate, onNext, focusReplyKey }: Props) {
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [busy, setBusy] = useState<null | "resolve" | "snooze" | "reopen">(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => setDraft(""), [c.id]);

  useEffect(() => {
    if (focusReplyKey > 0) textareaRef.current?.focus();
  }, [focusReplyKey]);

  async function send() {
    const body = draft.trim();
    if (!body || sending) return;
    setSending(true);
    try {
      const next = await inboxApi.sendReply(c.id, body);
      onUpdate(next);
      setDraft("");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      toast.error("Couldn't send reply", {
        description: msg,
        action: {
          label: "Retry",
          onClick: () => send(),
        },
      });
    } finally {
      setSending(false);
    }
  }

  async function setStatus(status: Conversation["status"], key: "resolve" | "snooze" | "reopen") {
    setBusy(key);
    try {
      const next = await inboxApi.setStatus(c.id, status);
      onUpdate(next);
      const verb =
        status === "resolved" ? "Resolved" : status === "snoozed" ? "Snoozed" : "Reopened";
      toast.success(`${verb} · ${c.customer.name}`, {
        description: status === "resolved" ? "Moved to next conversation." : undefined,
      });
      if (status !== "open") onNext();
    } catch (e) {
      toast.error("Action failed");
    } finally {
      setBusy(null);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <header className="px-6 py-4 border-b border-border bg-surface/60 backdrop-blur">
        <div className="flex items-start gap-4">
          <Avatar name={c.customer.name} color={c.customer.avatarColor} size={44} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h2 className="text-[15px] font-semibold text-foreground truncate">
                {c.customer.name}
              </h2>
              <span
                className={cn(
                  "text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded",
                  c.customer.tier === "enterprise" && "bg-ember/15 text-ember",
                  c.customer.tier === "pro" && "bg-info/15 text-[var(--info)]",
                  c.customer.tier === "free" && "bg-muted text-muted-foreground",
                )}
              >
                {c.customer.tier}
              </span>
              <PriorityBadge priority={c.priority} />
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <MailIcon className="h-3 w-3" />
                {c.customer.email}
              </span>
              {c.customer.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="h-3 w-3" />
                  {c.customer.company}
                </span>
              )}
              <span className="flex items-center gap-1">
                <ChannelIcon channel={c.channel} className="h-3 w-3" />
                {channelLabel(c.channel)}
              </span>
            </div>
          </div>
          <SlaChip slaDueAt={c.slaDueAt} />
        </div>

        <div className="mt-3 pt-3 border-t border-border/60 flex items-start gap-6">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-foreground/90 mb-1">{c.subject}</div>
            <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground flex-wrap">
              <span className="flex items-center gap-1 text-ember">
                <Sparkles className="h-3 w-3" /> Escalated: {reasonLabel(c.reason)}
              </span>
              {typeof c.csat === "number" && (
                <span className="flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> CSAT {c.csat}/5
                </span>
              )}
              <span>{relativeTime(c.escalatedAt)}</span>
              {c.tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 rounded-md bg-muted/60 px-1.5 py-0.5 text-muted-foreground"
                >
                  <Tag className="h-2.5 w-2.5" />
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            {c.status === "open" ? (
              <>
                <ActionBtn
                  onClick={() => setStatus("snoozed", "snooze")}
                  busy={busy === "snooze"}
                  icon={Clock3}
                  label="Snooze"
                  shortcut="S"
                />
                <ActionBtn
                  onClick={() => setStatus("resolved", "resolve")}
                  busy={busy === "resolve"}
                  icon={CheckCircle2}
                  label="Resolve"
                  shortcut="E"
                  primary
                />
              </>
            ) : (
              <ActionBtn
                onClick={() => setStatus("open", "reopen")}
                busy={busy === "reopen"}
                icon={RefreshCw}
                label="Reopen"
              />
            )}
          </div>
        </div>
      </header>

      {/* Thread */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 space-y-4">
        {c.messages.map((m) => (
          <MessageBubble
            key={m.id}
            m={m}
            customerColor={c.customer.avatarColor}
            customerName={c.customer.name}
          />
        ))}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-surface/40 backdrop-blur px-6 py-4">
        {c.status !== "open" && (
          <div className="mb-2 text-[11.5px] text-muted-foreground flex items-center gap-1.5">
            <RefreshCw className="h-3 w-3" /> This conversation is {c.status}. Reopen to reply.
          </div>
        )}
        <div className="flex gap-2 flex-wrap mb-2">
          {canned.map((t, i) => (
            <button
              key={i}
              onClick={() => setDraft(t)}
              disabled={c.status !== "open"}
              className="text-[11px] text-muted-foreground hover:text-foreground border border-border hover:border-ember/50 rounded-md px-2 py-1 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <MessageSquareReply className="h-3 w-3 inline mr-1" />
              Template {i + 1}
            </button>
          ))}
        </div>
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKey}
            disabled={c.status !== "open" || sending}
            placeholder={
              c.status === "open"
                ? "Reply to " + c.customer.name.split(" ")[0] + "…  (⌘/Ctrl + Enter to send)"
                : ""
            }
            rows={3}
            className={cn(
              "w-full resize-none bg-surface-2 border border-border rounded-lg px-3 py-2.5 pr-28 text-sm",
              "placeholder:text-muted-foreground/60",
              "focus:outline-none focus:border-ember/60 focus:ring-2 focus:ring-ember/20",
              "disabled:opacity-50 disabled:cursor-not-allowed",
            )}
          />
          <button
            onClick={send}
            disabled={!draft.trim() || sending || c.status !== "open"}
            className={cn(
              "absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12.5px] font-medium",
              "bg-ember text-ember-foreground hover:brightness-110 transition",
              "disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:brightness-100",
            )}
          >
            {sending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Send className="h-3.5 w-3.5" />
            )}
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

function ActionBtn({
  onClick,
  busy,
  icon: Icon,
  label,
  shortcut,
  primary,
}: {
  onClick: () => void;
  busy?: boolean;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  shortcut?: string;
  primary?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition",
        primary
          ? "bg-ember text-ember-foreground hover:brightness-110"
          : "border border-border text-foreground/85 hover:bg-surface-2 hover:border-ember/40",
        "disabled:opacity-50",
      )}
    >
      {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />}
      {label}
      {shortcut && <kbd className="ml-1">{shortcut}</kbd>}
    </button>
  );
}

function MessageBubble({
  m,
  customerColor,
  customerName,
}: {
  m: Conversation["messages"][number];
  customerColor: string;
  customerName: string;
}) {
  if (m.author === "system") {
    return (
      <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
        <div className="h-px flex-1 bg-border" />
        <span>{m.body}</span>
        <span>· {relativeTime(m.at)}</span>
        <div className="h-px flex-1 bg-border" />
      </div>
    );
  }

  const isCustomer = m.author === "customer";
  const isAgent = m.author === "agent";
  const isAI = m.author === "ai";

  return (
    <div className={cn("flex gap-3", isAgent && "flex-row-reverse")}>
      {isCustomer ? (
        <Avatar name={customerName} color={customerColor} size={30} />
      ) : (
        <div
          className={cn(
            "flex items-center justify-center rounded-full shrink-0 h-[30px] w-[30px] text-[11px] font-semibold",
            isAI ? "bg-ember/20 text-ember" : "bg-foreground/10 text-foreground/80",
          )}
        >
          {isAI ? <Sparkles className="h-3.5 w-3.5" /> : "You"}
        </div>
      )}
      <div className={cn("max-w-[75%] min-w-0", isAgent && "items-end flex flex-col")}>
        <div className="flex items-center gap-2 mb-1 text-[11px] text-muted-foreground">
          <span className={cn("font-medium", isAI && "text-ember")}>{m.authorName}</span>
          <span>· {relativeTime(m.at)}</span>
        </div>
        <div
          className={cn(
            "rounded-lg px-3.5 py-2.5 text-[13.5px] leading-relaxed border",
            isCustomer && "bg-surface-2 border-border text-foreground/95",
            isAI && "bg-ember/5 border-ember/25 text-foreground/90",
            isAgent && "bg-foreground/10 border-foreground/15 text-foreground",
          )}
        >
          {m.body}
        </div>
      </div>
    </div>
  );
}
