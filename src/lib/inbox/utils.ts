import type { Conversation, Priority } from "./types";

export const priorityRank: Record<Priority, number> = {
  urgent: 0,
  high: 1,
  normal: 2,
  low: 3,
};

export function slaMinutesLeft(iso: string): number {
  return Math.round((new Date(iso).getTime() - Date.now()) / 60000);
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const abs = Math.abs(diff);
  const past = diff >= 0;
  const min = 60_000;
  const hr = 60 * min;
  const day = 24 * hr;
  let val: string;
  if (abs < min) val = "just now";
  else if (abs < hr) val = `${Math.round(abs / min)}m`;
  else if (abs < day) val = `${Math.round(abs / hr)}h`;
  else val = `${Math.round(abs / day)}d`;
  if (val === "just now") return val;
  return past ? `${val} ago` : `in ${val}`;
}

export function slaLabel(iso: string): { label: string; tone: "danger" | "warning" | "ok" } {
  const m = slaMinutesLeft(iso);
  if (m < 0) return { label: `Overdue ${Math.abs(m)}m`, tone: "danger" };
  if (m < 15) return { label: `Due in ${m}m`, tone: "danger" };
  if (m < 60) return { label: `Due in ${m}m`, tone: "warning" };
  if (m < 120) return { label: `Due in ${Math.round(m / 60)}h`, tone: "warning" };
  return { label: `Due in ${Math.round(m / 60)}h`, tone: "ok" };
}

export function sortForTriage(list: Conversation[]): Conversation[] {
  return [...list].sort((a, b) => {
    // Open first
    if (a.status !== b.status) {
      if (a.status === "open") return -1;
      if (b.status === "open") return 1;
    }
    // SLA overdue first
    const am = slaMinutesLeft(a.slaDueAt);
    const bm = slaMinutesLeft(b.slaDueAt);
    const aOver = am < 0;
    const bOver = bm < 0;
    if (aOver !== bOver) return aOver ? -1 : 1;
    // Priority
    const pr = priorityRank[a.priority] - priorityRank[b.priority];
    if (pr !== 0) return pr;
    // Then SLA soonest
    return am - bm;
  });
}

export function reasonLabel(r: Conversation["reason"]): string {
  return {
    low_csat: "Low CSAT",
    angry_customer: "Angry customer",
    ai_uncertain: "AI uncertain",
    policy_edge_case: "Policy edge case",
    vip_customer: "VIP customer",
    repeat_contact: "Repeat contact",
  }[r];
}

export function channelLabel(c: Conversation["channel"]): string {
  return {
    webchat: "Web chat",
    whatsapp: "WhatsApp",
    email: "Email",
    instagram: "Instagram",
    voice: "Voice",
  }[c];
}
