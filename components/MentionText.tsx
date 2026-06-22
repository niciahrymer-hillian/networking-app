// Renders text with @username mentions turned into links to /u/<username>.
// Used for post bodies and comments. Works in both server and client components.
import Link from "next/link";

// Usernames are lowercase [a-z0-9_]{3,30}; accept any case when typed, link lowercased.
const MENTION_RE = /@([a-zA-Z0-9_]{3,30})/g;

export default function MentionText({ text, className }: { text: string; className?: string }) {
  const nodes: React.ReactNode[] = [];
  const re = new RegExp(MENTION_RE); // fresh instance — avoids shared lastIndex state
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    const handle = m[1];
    nodes.push(
      <Link key={key++} href={`/u/${handle.toLowerCase()}`} className="font-medium text-emerald-700 dark:text-emerald-300 hover:underline">
        @{handle}
      </Link>
    );
    last = m.index + m[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return <span className={className}>{nodes}</span>;
}
