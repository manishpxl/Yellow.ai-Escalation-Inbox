// Mock API — simulates network with 200–500ms latency.
// One write path (sendReply) can fail on demand for demo/testing.
import { seedConversations } from "./seed";
import type { Conversation, Message, Status } from "./types";

let store: Conversation[] = structuredClone(seedConversations);
let failNextReply = false;

const delay = (min = 200, max = 500) =>
  new Promise((res) => setTimeout(res, Math.floor(min + Math.random() * (max - min))));

export const inboxApi = {
  async list(): Promise<Conversation[]> {
    await delay();
    return structuredClone(store);
  },
  async get(id: string): Promise<Conversation | undefined> {
    await delay(120, 260);
    const c = store.find((x) => x.id === id);
    return c ? structuredClone(c) : undefined;
  },
  async sendReply(id: string, body: string): Promise<Conversation> {
    await delay(300, 550);
    if (failNextReply) {
      failNextReply = false;
      throw new Error("Network hiccup — message not delivered. Please retry.");
    }
    const c = store.find((x) => x.id === id);
    if (!c) throw new Error("Conversation not found");
    const msg: Message = {
      id: `msg_${Date.now()}`,
      author: "agent",
      authorName: "You",
      body,
      at: new Date().toISOString(),
    };
    c.messages.push(msg);
    c.lastMessageAt = msg.at;
    c.unread = false;
    return structuredClone(c);
  },
  async setStatus(id: string, status: Status): Promise<Conversation> {
    await delay(180, 320);
    const c = store.find((x) => x.id === id);
    if (!c) throw new Error("Conversation not found");
    c.status = status;
    if (status === "resolved") c.unread = false;
    return structuredClone(c);
  },
  async markRead(id: string): Promise<void> {
    await delay(80, 160);
    const c = store.find((x) => x.id === id);
    if (c) c.unread = false;
  },
  armFailure() {
    failNextReply = true;
  },
  isFailureArmed() {
    return failNextReply;
  },
  reset() {
    store = structuredClone(seedConversations);
    failNextReply = false;
  },
};
