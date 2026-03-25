"use client";

const COLORS = [
  "bg-blue-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-cyan-600",
  "bg-indigo-600",
];

const SIZES = {
  sm: "w-8 h-8 text-xs",
  md: "w-10 h-10 text-sm",
  lg: "w-16 h-16 text-xl",
};

interface AvatarProps {
  name: string;
  profileImage?: string | null;
  size?: "sm" | "md" | "lg";
}

export default function Avatar({ name, profileImage, size = "md" }: AvatarProps) {
  if (profileImage) {
    return (
      <img
        src={profileImage}
        alt={name}
        className={`${SIZES[size]} rounded-full object-cover shrink-0`}
      />
    );
  }

  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colorIdx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length;

  return (
    <div
      className={`${SIZES[size]} ${COLORS[colorIdx]} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}
    >
      {initials}
    </div>
  );
}
