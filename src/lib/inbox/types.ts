// Mock domain types for The Conversation Inbox
export type Priority = "urgent" | "high" | "normal" | "low";
export type Status = "open" | "snoozed" | "resolved";
export type Channel = "webchat" | "whatsapp" | "email" | "instagram" | "voice";
export type Sentiment = "angry" | "frustrated" | "neutral" | "positive";
export type EscalationReason =
  | "low_csat"
  | "angry_customer"
  | "ai_uncertain"
  | "policy_edge_case"
  | "vip_customer"
  | "repeat_contact";

export interface Message {
  id: string;
  author: "customer" | "ai" | "agent" | "system";
  authorName: string;
  body: string;
  at: string; // ISO
}

export interface Conversation {
  id: string;
  customer: {
    name: string;
    email: string;
    company?: string;
    tier: "free" | "pro" | "enterprise";
    avatarColor: string;
  };
  subject: string;
  preview: string;
  channel: Channel;
  status: Status;
  priority: Priority;
  sentiment: Sentiment;
  reason: EscalationReason;
  csat?: number; // 1-5
  slaDueAt: string; // ISO
  escalatedAt: string;
  lastMessageAt: string;
  messages: Message[];
  assignee?: string;
  tags: string[];
  unread: boolean;
}
