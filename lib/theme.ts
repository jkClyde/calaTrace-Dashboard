// Mirrors constants/theme.ts from the CalaTrace mobile app.
// If the mobile app's palette changes, update it there first, then mirror here.

export const colors = {
  background: "#F8FAF5",
  backgroundDark: "#081126",
  foreground: "#081126",
  card: "#EEF2EC",
  muted: "#f6eecf",
  mutedForeground: "rgba(0, 0, 0, 0.6)",
  primary: "#081126",
  primaryDark: "#0F5132",
  accent: "#5FAE3E",
  border: "rgba(0, 0, 0, 0.1)",
  success: "#16a34a",
  warning: "#E0A33C",
  destructive: "#D14B4B",
  subscription: "#8fd1bd",
  text: "#0F5132",
  white: "#ffffff",
  branding: "#1B7A47",
} as const;

export type BatchStage = "harvested" | "consolidated" | "in_transit" | "received" | "rejected";

// Matches stageColors in the mobile app's theme file.
export const stageColors: Record<BatchStage, string> = {
  harvested: colors.accent,
  consolidated: colors.subscription,
  in_transit: colors.warning,
  received: colors.success,
  rejected: colors.destructive,
};
