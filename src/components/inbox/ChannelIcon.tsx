import { MessageSquare, Mail, Phone, Instagram } from "lucide-react";
import type { Conversation } from "@/lib/inbox/types";

export function ChannelIcon({
  channel,
  className,
}: {
  channel: Conversation["channel"];
  className?: string;
}) {
  const Icon =
    channel === "email"
      ? Mail
      : channel === "voice"
        ? Phone
        : channel === "instagram"
          ? Instagram
          : MessageSquare;
  return <Icon className={className} aria-label={channel} />;
}
