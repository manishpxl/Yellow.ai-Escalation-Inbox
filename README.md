# Yellow.ai — Conversation Inbox

> Frontend Engineer Intern Assignment · A keyboard-first triage inbox that helps CX agents handle AI-escalated conversations.

**Live Demo:** _add your deployment URL here_

---

## Overview

Yellow.ai's AI agents handle most customer conversations end-to-end. When something goes wrong — an angry customer, a low CSAT score, a policy edge case, or the bot itself flagging low confidence — the conversation is **escalated to a human agent**.

This project is the workspace those humans open first thing in the morning. It answers three questions in one glance:

1. **What should I work on first?** (most urgent, closest to breaching SLA)
2. **What happened before I got here?** (full history, who said what, why the AI gave up)
3. **What do I do next?** (reply, resolve, snooze, reopen — as fast as my fingers move)

---

## Business Problem

CX teams live in their inbox for 8 hours a day. When escalation volume spikes, the bottleneck is rarely typing — it's **triage**. Agents waste time deciding which ticket matters most, hunting for context, and reaching for the mouse to click Resolve. Every second lost to UI friction is a second added to a customer's wait.

The brief was to design and build a purpose-built inbox that removes that friction — so an agent's attention goes to the conversation, not the tool.

---

## Solution

A three-pane inbox with an opinionated sort model and full keyboard control:

- The top of the list is always the right conversation to pick — no thinking required.
- Every conversation surfaces its **escalation reason** upfront, so agents know why the AI handed off before opening the thread.
- Every action an agent takes 100 times a day (`next`, `reply`, `resolve`, `snooze`, `search`) has a single-key shortcut.
- Failure modes (network drops mid-reply) are handled with a toast + retry, not a broken UI.

---

## Product Thinking

| Decision                                                    | Rationale                                                                                                                |
| ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Triage-first sort** (SLA breach → priority → soonest due) | Cognitive load belongs on the customer, not the queue.                                                                   |
| **Three-pane layout** (filters · list · detail)             | Standard mental model from Front, Linear, Superhuman — zero learning curve.                                              |
| **Keyboard-first UX**                                       | 8h/day tools that require a mouse kill throughput.                                                                       |
| **Escalation reason as a first-class field**                | The whole point of this inbox is answering "why did the AI hand off?" — never make an agent open the thread to find out. |
| **Three-tone SLA chip** (Overdue / Warning / OK)            | Peripheral-vision signal. Colour + label + icon = accessible triple redundancy.                                          |
| **Distinct message bubbles for AI vs. Agent vs. Customer**  | Scanning a long thread must be instant; typography alone isn't enough.                                                   |
| **Failable write path** ("Arm failure" demo)                | Honest UX. Show the error + retry flow, don't pretend the network never drops.                                           |
| **Indian customer names + local brands in seed data**       | Contextually appropriate for a Yellow.ai (India-HQ) audience.                                                            |

---

## Features

- Sorted queue: SLA breach → priority → due-soonest
- 12 realistic seeded escalations across billing, SSO, VIP, policy, refund scenarios
- Filters: All open · Urgent · SLA risk · Unread · Snoozed · Resolved (live counts)
- Search across customer name, subject, preview, company, tags
- Full-thread view with distinct bubbles for AI / Customer / Agent
- Actions: Reply, Resolve, Snooze, Reopen — all keyboard-accessible
- Canned reply templates
- Loading skeletons, empty states, error retry
- Simulated network latency (200–500 ms) via mock API
- Armable failure path to demonstrate error + retry UX
- Responsive: three-pane on desktop, drawer-sidebar + stacked list/detail on mobile
- Dark, high-contrast UI with semantic design tokens
- 404 + error boundaries

### Keyboard Shortcuts

| Key                | Action                       |
| ------------------ | ---------------------------- |
| `J` / `K`          | Next / previous conversation |
| `R`                | Focus reply composer         |
| `E`                | Resolve current conversation |
| `S`                | Snooze current conversation  |
| `/`                | Focus search                 |
| `⌘ / Ctrl + Enter` | Send reply                   |

---

## Tech Stack

| Layer         | Choice                                             |
| ------------- | -------------------------------------------------- |
| Framework     | TanStack Start v1 (React 19 + Vite 7)              |
| Routing       | TanStack Router (file-based, type-safe)            |
| Data fetching | TanStack Query                                     |
| Language      | TypeScript (strict)                                |
| Styling       | Tailwind CSS v4 with a custom OKLCH token palette  |
| UI primitives | Radix UI (via shadcn/ui — `sheet`, `sonner`)       |
| Icons         | lucide-react                                       |
| Toasts        | Sonner                                             |
| Validation    | Zod                                                |
| State         | Local React state — no Redux/Zustand at this scope |

No backend was required by the brief. Data lives in an in-memory mock API written with the same shape as a real REST client, so it can be swapped 1:1 later.

---

## Folder Structure

```
src/
├── routes/
│   ├── __root.tsx              App shell, <head>, providers, error boundaries
│   └── index.tsx               Main inbox page — layout, keyboard, state
│
├── components/
│   ├── inbox/                  Feature components
│   │   ├── InboxSidebar.tsx
│   │   ├── ConversationCard.tsx
│   │   ├── ConversationDetail.tsx
│   │   ├── PriorityBadge.tsx
│   │   ├── SlaChip.tsx
│   │   ├── ChannelIcon.tsx
│   │   └── Avatar.tsx
│   └── ui/                     shadcn primitives (sheet, sonner)
│
├── lib/
│   ├── inbox/
│   │   ├── types.ts            Domain models
│   │   ├── seed.ts             Realistic seeded conversations
│   │   ├── api.ts              Mock API (list / get / sendReply / setStatus)
│   │   └── utils.ts            sortForTriage, slaLabel, relativeTime
│   ├── utils.ts                cn() className helper
│   ├── error-capture.ts        SSR error-recovery helper
│   └── error-page.ts           SSR fallback HTML
│
├── router.tsx                  QueryClient + router bootstrap
├── server.ts                   SSR entry with error wrapping
├── start.ts                    Start middleware
└── styles.css                  Design tokens
```

---

## Project Architecture

**Separation of concerns**

- `lib/inbox/*` is pure data + logic. Zero React, easy to unit test, easy to swap for a real backend.
- `components/inbox/*` are dumb presentational components. Props in, JSX out.
- `routes/index.tsx` is the only stateful piece. It owns selection, filter, search, and keyboard shortcuts.

**Data flow**

1. `routes/index.tsx` fetches the list via `useQuery(['conversations'], inboxApi.list)`.
2. That list is filtered (by sidebar filter + search) and sorted through `sortForTriage()` before being handed to the list column.
3. The selected conversation is derived (`useMemo`) from the cache — never fetched separately.
4. Actions (`sendReply`, `setStatus`, `markRead`) call the mock API and update the query cache via `queryClient.setQueryData` — optimistic, no refetch needed.
5. Failures throw; the composer catches, shows a Sonner toast with a `Retry` action, and re-invokes the same handler.

**Why not MSW?**

The mock lives directly in `src/lib/inbox/api.ts` as a plain module with the same shape as a REST client (`list()`, `get()`, `sendReply()`, `setStatus()`). Swapping in a real API later means editing one file — no service-worker plumbing needed for a take-home assignment.

---

## UI / UX Decisions

- **Warm charcoal + ember palette** — deliberately avoids the default slate/indigo look of AI-generated dark UIs.
- **Ember is used sparingly** — only for actionable urgency, so it retains signal value.
- **Priority dot** on every list row for peripheral-vision scanning; **animated pulse** on `urgent`.
- **SLA chip** encodes state three ways (colour, icon, label) for accessibility.
- **AI messages** get a subtle ember tint so agents can visually skip them when re-reading.
- **Tabular numerals** on timestamps, counts, and SLA timers so numbers don't jitter.
- **Sticky reply composer** — never scrolls out of reach.

---

## Accessibility

- Semantic landmarks (`<aside>`, `<section>`, `<header>`, `<main>` equivalents).
- All interactive elements are `<button>` — full keyboard + assistive-tech support.
- Icon-only buttons carry `aria-label`.
- `aria-current` marks the selected conversation.
- Focus-visible states on every actionable element.
- Colour never carries meaning alone (SLA, priority, tier are all label + colour + icon).
- All text meets WCAG AA contrast against its background.
- Uses `h-dvh` (not `h-screen`) so mobile browser chrome doesn't clip layout.

---

## Responsiveness

- **Desktop (md+):** classic three-pane layout — sidebar, list, detail.
- **Tablet & mobile:** sidebar collapses to a slide-over drawer (Radix Dialog via shadcn Sheet), triggered by a hamburger in the list header. List and detail stack — selecting a conversation swaps to the detail view; a "Back to inbox" affordance returns to the list.
- Uses `100dvh` to avoid mobile viewport clipping.

---

## Performance Optimizations

- All derivations (`counts`, `visible`, `selected`) are memoized with `useMemo`.
- Event handlers passed to children are wrapped in `useCallback` to keep child re-renders stable.
- Selection derived from cached data — no extra network round trip.
- Optimistic cache updates via `setQueryData`; no refetch after write.
- Sidebar is a single component instance reused between the drawer and the desktop rail.

---

## Trade-offs (Intentionally Omitted)

- **Authentication** — no user model; the brief was a single-agent workspace.
- **Real backend** — mock API only; swappable via the shared interface.
- **WebSockets / realtime** — new escalations would require a server. Out of scope.
- **Push / desktop notifications** — same reason.
- **Persistence** — state resets on reload (in-memory store).
- **Automated tests** — the sort model in `lib/inbox/utils.ts` is pure and easily unit-testable with Vitest; skipped for brevity.

---

## Future Improvements

- Persistence (`localStorage` or real backend)
- Agent assignment + "assigned to me" filter
- Bulk actions (multi-select resolve/snooze)
- Realtime updates (WebSocket / SSE)
- Undo toast after Resolve/Snooze
- Reply templates managed from settings
- Vitest for `utils.ts`, Playwright for keyboard flow

---

## Installation

```bash
# Prerequisites: Node 20+ and bun (or npm/pnpm)
bun install
bun dev          # http://localhost:8080

bun run build    # Production build
bun run preview  # Preview the production build
bun run lint     # ESLint
bun run format   # Prettier
```

---

## Environment Variables

None. The app runs entirely on client-side mock data.

---

## Time Spent

~7 hours end-to-end: 1h brief + sort model, 1h design tokens, 3h components + routing, 1h keyboard + error paths, 1h responsive + polish.

---

## Screenshots

_Add screenshots of the desktop and mobile layouts here._

- `docs/screenshot-desktop.png`
- `docs/screenshot-mobile.png`

---

## Author

**Manish Kumar** — Frontend Engineer Internship Assignment

- GitHub: _add link_
- LinkedIn: _add link_

Built for the Yellow.ai Frontend Engineer Intern take-home.
