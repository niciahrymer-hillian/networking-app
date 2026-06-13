// Shared reaction set for posts (and, later, messages). LinkedIn-style: a small
// fixed palette of emoji a user can pick from — one reaction per user per post.

export const REACTIONS = [
  { emoji: "👍", label: "Like" },
  { emoji: "❤️", label: "Love" },
  { emoji: "🎉", label: "Celebrate" },
  { emoji: "💡", label: "Insightful" },
  { emoji: "👏", label: "Clap" },
  { emoji: "😂", label: "Funny" },
] as const;

export const REACTION_EMOJIS = REACTIONS.map((r) => r.emoji);

export function isValidReaction(emoji: string): boolean {
  return (REACTION_EMOJIS as readonly string[]).includes(emoji);
}
