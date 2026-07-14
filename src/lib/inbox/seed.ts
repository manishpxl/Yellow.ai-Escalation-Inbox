import type { Conversation, EscalationReason, Priority } from "./types";

const now = Date.now();
const min = 60_000;
const hr = 60 * min;

const t = (ms: number) => new Date(now + ms).toISOString();

const colors = [
  "#e85d3a",
  "#c9a84c",
  "#5cbdb9",
  "#c17c74",
  "#a78bfa",
  "#73ffb8",
  "#f0d78c",
  "#ee5a70",
];

interface Seed {
  name: string;
  email: string;
  company?: string;
  tier: Conversation["customer"]["tier"];
  subject: string;
  preview: string;
  channel: Conversation["channel"];
  priority: Priority;
  sentiment: Conversation["sentiment"];
  reason: EscalationReason;
  csat?: number;
  slaMinutes: number; // relative to now, negative = breached
  escalatedMinAgo: number;
  tags: string[];
  thread: { author: "customer" | "ai" | "agent" | "system"; body: string; minAgo: number }[];
  status?: Conversation["status"];
}

const seeds: Seed[] = [
  {
    name: "Priya Raghavan",
    email: "priya.raghavan@tataneu.in",
    company: "Tata Neu Logistics",
    tier: "enterprise",
    subject: "Charged twice for annual renewal",
    preview: "I've been billed $2,400 twice this morning and my finance team is asking questions…",
    channel: "email",
    priority: "urgent",
    sentiment: "angry",
    reason: "angry_customer",
    csat: 1,
    slaMinutes: -12,
    escalatedMinAgo: 34,
    tags: ["billing", "duplicate-charge"],
    thread: [
      {
        author: "customer",
        body: "Hi, I just noticed TWO charges of $2,400 on my card within 3 minutes. This is unacceptable — please fix now.",
        minAgo: 42,
      },
      {
        author: "ai",
        body: "I understand your concern about the duplicate charge. I've located both transactions. Let me connect you with a specialist who can process the refund.",
        minAgo: 40,
      },
      { author: "customer", body: "I don't want to wait. My CFO is on my back.", minAgo: 36 },
      {
        author: "system",
        body: "Escalated to human — reason: angry customer, low CSAT (1/5)",
        minAgo: 34,
      },
    ],
  },
  {
    name: "Aarav Sharma",
    email: "aarav.sharma@zerodhalabs.in",
    company: "Zerodha Labs",
    tier: "pro",
    subject: "SSO login loop after SAML config change",
    preview: "Since your update this morning our whole engineering team can't sign in…",
    channel: "webchat",
    priority: "urgent",
    sentiment: "frustrated",
    reason: "ai_uncertain",
    slaMinutes: 8,
    escalatedMinAgo: 18,
    tags: ["auth", "sso", "outage-risk"],
    thread: [
      { author: "customer", body: "Our SSO is looping. 40 engineers locked out.", minAgo: 22 },
      {
        author: "ai",
        body: "I'm checking your SAML config. Can you confirm your IdP is Okta?",
        minAgo: 21,
      },
      { author: "customer", body: "Yes. Nothing changed on our side.", minAgo: 20 },
      {
        author: "ai",
        body: "I'm not able to safely diagnose this without production access. Routing to a human specialist.",
        minAgo: 18,
      },
    ],
  },
  {
    name: "Ananya Iyer",
    email: "ananya@nykaabloom.in",
    company: "Nykaa Bloom",
    tier: "pro",
    subject: "Cancel subscription — moving to competitor",
    preview: "I've decided to switch. Please make cancellation quick.",
    channel: "email",
    priority: "high",
    sentiment: "neutral",
    reason: "low_csat",
    csat: 2,
    slaMinutes: 45,
    escalatedMinAgo: 12,
    tags: ["churn-risk", "retention"],
    thread: [
      { author: "customer", body: "Please cancel my subscription effective today.", minAgo: 15 },
      {
        author: "ai",
        body: "I'm sorry to see you go. Before I process this, can I ask what led to the decision?",
        minAgo: 14,
      },
      { author: "customer", body: "Just moving on. Please just cancel.", minAgo: 12 },
    ],
  },
  {
    name: "Karthik Subramanian",
    email: "karthik.s@quicksilver.in",
    tier: "free",
    subject: "How do I export my chat history?",
    preview: "I looked in settings but can't find the option.",
    channel: "webchat",
    priority: "low",
    sentiment: "neutral",
    reason: "ai_uncertain",
    slaMinutes: 240,
    escalatedMinAgo: 4,
    tags: ["how-to"],
    thread: [
      { author: "customer", body: "Where do I export chats?", minAgo: 5 },
      {
        author: "ai",
        body: "I'm not 100% sure on the exact path for your plan. Let me get a teammate to confirm.",
        minAgo: 4,
      },
    ],
  },
  {
    name: "Meera Nair",
    email: "meera.nair@flipkartretail.in",
    company: "Flipkart Retail",
    tier: "enterprise",
    subject: "API rate limits blocking our launch",
    preview: "We're launching in 3 hours and hitting 429s constantly…",
    channel: "email",
    priority: "urgent",
    sentiment: "frustrated",
    reason: "vip_customer",
    slaMinutes: -3,
    escalatedMinAgo: 22,
    tags: ["api", "launch-blocker", "vip"],
    thread: [
      {
        author: "customer",
        body: "We're launching at 3pm PT and hitting 429s. Can you bump our rate limit to 500 rps?",
        minAgo: 25,
      },
      {
        author: "ai",
        body: "That requires approval from a human account manager. I've flagged it as urgent.",
        minAgo: 22,
      },
    ],
  },
  {
    name: "Vikram Malhotra",
    email: "vikram.m@razorpay.in",
    company: "Razorpay",
    tier: "pro",
    subject: "Webhook signature verification failing",
    preview: "All webhooks are returning 401 since 8am UTC.",
    channel: "email",
    priority: "high",
    sentiment: "frustrated",
    reason: "policy_edge_case",
    slaMinutes: 22,
    escalatedMinAgo: 15,
    tags: ["webhooks", "integration"],
    thread: [
      { author: "customer", body: "Every webhook 401s. Signature check breaking.", minAgo: 18 },
      {
        author: "ai",
        body: "Checked — your signing secret rotated on Jul 12. Please update your endpoint config.",
        minAgo: 17,
      },
      { author: "customer", body: "We never rotated. Something on your end.", minAgo: 15 },
    ],
  },
  {
    name: "Ishaan Kapoor",
    email: "ishaan@swiggy.in",
    company: "Swiggy",
    tier: "pro",
    subject: "Refund for accidental purchase",
    preview: "My cat walked on the keyboard and bought the Team plan…",
    channel: "whatsapp",
    priority: "normal",
    sentiment: "positive",
    reason: "policy_edge_case",
    slaMinutes: 60,
    escalatedMinAgo: 7,
    tags: ["refund", "billing"],
    thread: [
      {
        author: "customer",
        body: "My cat literally upgraded me to Team. Any way to refund? 😅",
        minAgo: 10,
      },
      {
        author: "ai",
        body: "Ha! Refunds within 24h are usually fine, but I'll let a human confirm.",
        minAgo: 7,
      },
    ],
  },
  {
    name: "Neha Bhat",
    email: "neha.bhat@jswsteel.in",
    company: "JSW Steel",
    tier: "enterprise",
    subject: "Data residency — EU-only guarantee",
    preview: "Our procurement team needs written confirmation of EU data residency.",
    channel: "email",
    priority: "normal",
    sentiment: "neutral",
    reason: "policy_edge_case",
    slaMinutes: 120,
    escalatedMinAgo: 40,
    tags: ["compliance", "procurement"],
    thread: [
      {
        author: "customer",
        body: "Need written confirmation all our data stays in the EU.",
        minAgo: 41,
      },
      {
        author: "ai",
        body: "I can share our DPA. For a signed letter, routing to a human.",
        minAgo: 40,
      },
    ],
  },
  {
    name: "Rohan Mehta",
    email: "rohan@saffronbox.in",
    tier: "free",
    subject: "Third time asking about mobile app",
    preview: "This is my third message this week about the Android build crashing…",
    channel: "instagram",
    priority: "high",
    sentiment: "frustrated",
    reason: "repeat_contact",
    csat: 2,
    slaMinutes: 15,
    escalatedMinAgo: 9,
    tags: ["mobile", "repeat", "android"],
    thread: [
      {
        author: "customer",
        body: "3rd time asking — Android app still crashes on launch.",
        minAgo: 12,
      },
      {
        author: "ai",
        body: "I see previous tickets #4421, #4489. Flagging for engineering follow-up.",
        minAgo: 9,
      },
    ],
  },
  {
    name: "Kavya Reddy",
    email: "kavya.reddy@myntrastudio.in",
    company: "Myntra Studio",
    tier: "pro",
    subject: "Invoice missing VAT number",
    preview: "Our accountant needs the invoice reissued with our VAT ID.",
    channel: "email",
    priority: "normal",
    sentiment: "neutral",
    reason: "ai_uncertain",
    slaMinutes: 180,
    escalatedMinAgo: 28,
    tags: ["billing", "invoice"],
    thread: [
      {
        author: "customer",
        body: "Please reissue July invoice with VAT FR23 456789012.",
        minAgo: 30,
      },
      { author: "ai", body: "I can't modify past invoices — routing to billing.", minAgo: 28 },
    ],
  },
  {
    name: "Aditya Chaudhary",
    email: "aditya@zomato.in",
    company: "Zomato",
    tier: "pro",
    subject: "Voice bot mispronouncing our brand",
    preview: "It keeps saying 'zoh-MAH-toh' instead of 'zoh-MAA-toh'.",
    channel: "voice",
    priority: "low",
    sentiment: "positive",
    reason: "ai_uncertain",
    slaMinutes: 300,
    escalatedMinAgo: 55,
    tags: ["voice", "tuning"],
    thread: [
      {
        author: "customer",
        body: "Small thing — voice bot pronounces our brand wrong. Any way to add a phonetic hint?",
        minAgo: 56,
      },
      {
        author: "ai",
        body: "Great question — there is, but I want a human to walk you through the SSML overrides.",
        minAgo: 55,
      },
    ],
  },
  {
    name: "Siddharth Rao",
    email: "siddharth.rao@phonepe.in",
    company: "PhonePe",
    tier: "enterprise",
    subject: "SLA breach compensation request",
    preview: "Outage on Jul 11 lasted 47 minutes — requesting SLA credit.",
    channel: "email",
    priority: "high",
    sentiment: "frustrated",
    reason: "vip_customer",
    slaMinutes: 30,
    escalatedMinAgo: 65,
    tags: ["sla", "credit-request", "vip"],
    thread: [
      {
        author: "customer",
        body: "You had a 47-min outage. Per contract, we're owed 10% monthly credit.",
        minAgo: 66,
      },
      {
        author: "ai",
        body: "I've verified the outage window. Credit calculation needs human approval.",
        minAgo: 65,
      },
    ],
  },
];

export const seedConversations: Conversation[] = seeds.map((s, i) => {
  const messages = s.thread.map((m, j) => ({
    id: `msg_${i}_${j}`,
    author: m.author,
    authorName:
      m.author === "customer"
        ? s.name
        : m.author === "ai"
          ? "Yellow.ai Agent"
          : m.author === "agent"
            ? "You"
            : "System",
    body: m.body,
    at: t(-m.minAgo * min),
  }));
  return {
    id: `conv_${String(i + 1).padStart(3, "0")}`,
    customer: {
      name: s.name,
      email: s.email,
      company: s.company,
      tier: s.tier,
      avatarColor: colors[i % colors.length],
    },
    subject: s.subject,
    preview: s.preview,
    channel: s.channel,
    status: s.status ?? "open",
    priority: s.priority,
    sentiment: s.sentiment,
    reason: s.reason,
    csat: s.csat,
    slaDueAt: t(s.slaMinutes * min),
    escalatedAt: t(-s.escalatedMinAgo * min),
    lastMessageAt: messages[messages.length - 1].at,
    messages,
    tags: s.tags,
    unread: i < 6,
  };
});

export { hr, min };
