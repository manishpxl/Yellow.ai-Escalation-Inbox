import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { Conversation } from "@/lib/inbox/types";
import { inboxApi } from "@/lib/inbox/api";
import { slaMinutesLeft, sortForTriage } from "@/lib/inbox/utils";
import { InboxSidebar, type Filter } from "@/components/inbox/InboxSidebar";
import { ConversationCard } from "@/components/inbox/ConversationCard";
import { ConversationDetail } from "@/components/inbox/ConversationDetail";
import { Search, Inbox as InboxIcon, Loader2, Menu, ArrowLeft } from "lucide-react";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Yellow.ai — Escalation Inbox for CX Agents" },
      {
        name: "description",
        content:
          "A purpose-built triage inbox that helps Yellow.ai CX agents find the conversation that needs them right now — and act on it in seconds.",
      },
      { property: "og:title", content: "Yellow.ai — Escalation Inbox for CX Agents" },
      {
        property: "og:description",
        content:
          "A purpose-built triage inbox that helps Yellow.ai CX agents find the conversation that needs them right now — and act on it in seconds.",
      },
    ],
  }),
  component: InboxPage,
});

function InboxPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => inboxApi.list(),
  });

  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [failureArmed, setFailureArmed] = useState(false);
  const [focusReplyKey, setFocusReplyKey] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // On mobile, list and detail are stacked — this tracks which one is visible.
  const [mobileView, setMobileView] = useState<"list" | "detail">("list");

  const counts = useMemo(() => {
    const list = data ?? [];
    const open = list.filter((c) => c.status === "open");
    return {
      all: open.length,
      urgent: open.filter((c) => c.priority === "urgent").length,
      slaRisk: open.filter((c) => slaMinutesLeft(c.slaDueAt) < 60).length,
      unread: open.filter((c) => c.unread).length,
      resolved: list.filter((c) => c.status === "resolved").length,
      snoozed: list.filter((c) => c.status === "snoozed").length,
    };
  }, [data]);

  const visible = useMemo(() => {
    let list = data ?? [];
    switch (filter) {
      case "all":
        list = list.filter((c) => c.status === "open");
        break;
      case "urgent":
        list = list.filter((c) => c.status === "open" && c.priority === "urgent");
        break;
      case "sla-risk":
        list = list.filter((c) => c.status === "open" && slaMinutesLeft(c.slaDueAt) < 60);
        break;
      case "unread":
        list = list.filter((c) => c.status === "open" && c.unread);
        break;
      case "resolved":
        list = list.filter((c) => c.status === "resolved");
        break;
      case "snoozed":
        list = list.filter((c) => c.status === "snoozed");
        break;
    }
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (c) =>
          c.customer.name.toLowerCase().includes(q) ||
          c.subject.toLowerCase().includes(q) ||
          c.preview.toLowerCase().includes(q) ||
          c.customer.company?.toLowerCase().includes(q) ||
          c.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }
    return sortForTriage(list);
  }, [data, filter, query]);

  // Auto-select first when list changes and nothing selected (or selection out of view)
  useEffect(() => {
    if (visible.length === 0) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !visible.some((c) => c.id === selectedId)) {
      setSelectedId(visible[0].id);
    }
  }, [visible, selectedId]);

  const selected = useMemo(
    () => (data ?? []).find((c) => c.id === selectedId) ?? null,
    [data, selectedId],
  );

  // Mark read on select
  useEffect(() => {
    if (!selected || !selected.unread) return;
    inboxApi.markRead(selected.id).then(() => {
      qc.setQueryData<Conversation[]>(["conversations"], (prev) =>
        prev?.map((c) => (c.id === selected.id ? { ...c, unread: false } : c)),
      );
    });
  }, [selected, qc]);

  const updateConversation = useCallback(
    (next: Conversation) => {
      qc.setQueryData<Conversation[]>(["conversations"], (prev) =>
        prev?.map((c) => (c.id === next.id ? next : c)),
      );
    },
    [qc],
  );

  const gotoNext = useCallback(() => {
    if (!selectedId) return;
    const openList = sortForTriage(
      (data ?? []).filter((c) => c.status === "open" && c.id !== selectedId),
    );
    if (openList[0]) setSelectedId(openList[0].id);
  }, [data, selectedId]);

  const armFailure = () => {
    inboxApi.armFailure();
    setFailureArmed(true);
    toast("Failure armed", {
      description: "Your next reply will fail so you can test the retry flow.",
    });
  };

  // Keep failure indicator in sync after each send
  useEffect(() => {
    const id = setInterval(() => setFailureArmed(inboxApi.isFailureArmed()), 500);
    return () => clearInterval(id);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = visible.findIndex((c) => c.id === selectedId);
      switch (e.key.toLowerCase()) {
        case "j":
          if (idx < visible.length - 1) setSelectedId(visible[idx + 1].id);
          e.preventDefault();
          break;
        case "k":
          if (idx > 0) setSelectedId(visible[idx - 1].id);
          e.preventDefault();
          break;
        case "r":
          setFocusReplyKey((k) => k + 1);
          e.preventDefault();
          break;
        case "e":
          if (selected?.status === "open") {
            inboxApi.setStatus(selected.id, "resolved").then((c) => {
              updateConversation(c);
              toast.success(`Resolved · ${c.customer.name}`);
              gotoNext();
            });
          }
          e.preventDefault();
          break;
        case "s":
          if (selected?.status === "open") {
            inboxApi.setStatus(selected.id, "snoozed").then((c) => {
              updateConversation(c);
              toast.success(`Snoozed · ${c.customer.name}`);
              gotoNext();
            });
          }
          e.preventDefault();
          break;
        case "/":
          document.getElementById("inbox-search")?.focus();
          e.preventDefault();
          break;
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, selectedId, selected, gotoNext, updateConversation]);

  const sidebar = (
    <InboxSidebar
      filter={filter}
      onFilter={(f) => {
        setFilter(f);
        setSidebarOpen(false);
      }}
      counts={counts}
      onArmFailure={armFailure}
      failureArmed={failureArmed}
    />
  );

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setMobileView("detail");
  };

  return (
    <div className="h-dvh flex overflow-hidden bg-background text-foreground">
      {/* Sidebar — permanent on md+, drawer on mobile */}
      <div className="hidden md:flex">{sidebar}</div>

      <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="p-0 w-[240px] md:hidden">
          <SheetTitle className="sr-only">Inbox filters</SheetTitle>
          <SheetDescription className="sr-only">Switch between escalation queues.</SheetDescription>
          {sidebar}
        </SheetContent>
      </Sheet>

      {/* List column */}
      <section
        className={cn(
          "w-full md:w-[380px] md:shrink-0 border-r border-border flex flex-col min-h-0",
          mobileView === "detail" && "hidden md:flex",
        )}
      >
        <div className="px-4 py-3 border-b border-border bg-surface/40 backdrop-blur">
          <div className="flex items-center gap-2 mb-2.5">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="md:hidden inline-flex h-8 w-8 items-center justify-center rounded-md border border-border text-muted-foreground hover:text-foreground hover:border-ember/40"
              aria-label="Open filters"
            >
              <Menu className="h-4 w-4" />
            </button>
            <h1 className="text-[14px] font-semibold capitalize">
              {filter === "sla-risk" ? "SLA risk" : filter === "all" ? "All open" : filter}
              <span className="ml-2 text-muted-foreground font-normal">{visible.length}</span>
            </h1>
            {isFetching && (
              <Loader2 className="ml-auto h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
            <input
              id="inbox-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name, subject, tag…"
              aria-label="Search conversations"
              className="w-full bg-surface-2 border border-border rounded-md pl-8 pr-10 py-1.5 text-[12.5px] placeholder:text-muted-foreground/60 focus:outline-none focus:border-ember/50"
            />
            <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline-flex">/</kbd>
          </div>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto">
          {isLoading && <ListSkeleton />}
          {isError && <ErrorState onRetry={() => refetch()} />}
          {!isLoading && !isError && visible.length === 0 && <EmptyState filter={filter} />}
          {!isLoading && !isError && visible.length > 0 && (
            <ul className="divide-y divide-border/60">
              {visible.map((c) => (
                <li key={c.id}>
                  <ConversationCard
                    conversation={c}
                    active={c.id === selectedId}
                    onSelect={() => handleSelect(c.id)}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* Detail column */}
      <section
        className={cn("flex-1 min-w-0 flex flex-col", mobileView === "list" && "hidden md:flex")}
      >
        <div className="md:hidden border-b border-border bg-surface/40 backdrop-blur px-3 py-2">
          <button
            type="button"
            onClick={() => setMobileView("list")}
            className="inline-flex items-center gap-1.5 text-[12.5px] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to inbox
          </button>
        </div>
        <div className="flex-1 min-h-0">
          {selected ? (
            <ConversationDetail
              conversation={selected}
              onUpdate={updateConversation}
              onNext={gotoNext}
              focusReplyKey={focusReplyKey}
            />
          ) : (
            <NoSelectionState />
          )}
        </div>
      </section>
    </div>
  );
}

function ListSkeleton() {
  return (
    <ul className="divide-y divide-border/60">
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="px-4 py-3 flex gap-3">
          <div className="h-9 w-9 rounded-full bg-surface-2 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-2/5 bg-surface-2 rounded animate-pulse" />
            <div className="h-3 w-3/5 bg-surface-2 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-surface-2/70 rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function EmptyState({ filter }: { filter: Filter }) {
  const copy =
    filter === "resolved"
      ? {
          title: "Nothing resolved yet",
          body: "Resolved conversations will land here so you can look back at your shift.",
        }
      : filter === "snoozed"
        ? { title: "Nothing snoozed", body: "Buy yourself time on a conversation with " }
        : filter === "urgent"
          ? {
              title: "No urgent escalations",
              body: "Great — nothing on fire right now. Enjoy the calm.",
            }
          : { title: "Inbox zero", body: "You're all caught up. Time for a coffee." };
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="h-11 w-11 rounded-full bg-ember/15 flex items-center justify-center mb-3">
        <InboxIcon className="h-5 w-5 text-ember" />
      </div>
      <div className="text-[14px] font-medium text-foreground mb-1">{copy.title}</div>
      <div className="text-[12px] text-muted-foreground max-w-[260px]">
        {copy.body}
        {filter === "snoozed" && <kbd>S</kbd>}
      </div>
    </div>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center px-8 py-16 text-center">
      <div className="text-[14px] font-medium text-foreground mb-1">Couldn't load your inbox</div>
      <div className="text-[12px] text-muted-foreground max-w-[260px] mb-4">
        Something got in the way. Try again — your queue is safe.
      </div>
      <button
        onClick={onRetry}
        className="rounded-md bg-ember text-ember-foreground px-3 py-1.5 text-[12.5px] font-medium hover:brightness-110"
      >
        Retry
      </button>
    </div>
  );
}

function NoSelectionState() {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center px-8">
      <div className="h-14 w-14 rounded-full bg-ember/15 flex items-center justify-center mb-4">
        <InboxIcon className="h-6 w-6 text-ember" />
      </div>
      <div className="text-[15px] font-medium mb-1">Pick a conversation to triage</div>
      <div className="text-[12.5px] text-muted-foreground max-w-[320px]">
        Sorted by SLA risk and priority — the one at the top is the one that needs you first.
      </div>
    </div>
  );
}
