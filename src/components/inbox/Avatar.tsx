export function Avatar({ name, color, size = 36 }: { name: string; color: string; size?: number }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return (
    <div
      className="flex items-center justify-center rounded-full font-medium text-[13px] shrink-0 shadow-inner"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, color-mix(in oklab, ${color} 60%, black))`,
        color: "white",
      }}
      aria-hidden
    >
      {initials}
    </div>
  );
}
