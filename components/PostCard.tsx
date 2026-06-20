// PostCard — renders a single feed post (caption + media + link + tags) as a card.
// Shared by the connections feed (/feed) and the member profile (/u/[username]),
// so both render rich posts identically. Pure presentational server component.
//
// When `author` is provided (the multi-author feed), a header with the headshot
// circle + name links to that member's profile. On a single-member profile the
// header is omitted (the page already shows who it is) and only a timestamp shows.

import Link from "next/link";
import PostReactions, { type ReactionCount } from "@/components/PostReactions";
import PostComments from "@/components/PostComments";
import ShareToDM from "@/components/ShareToDM";

export type FeedPost = {
  id: string;
  content: string;
  mediaUrl: string | null;
  mediaType: string | null;
  linkUrl: string | null;
  tags: string | null; // JSON array string
  createdAt: Date | string;
};

export type PostAuthor = {
  username: string;
  name: string | null;
  headshotUrl: string | null;
};

// Pull a YouTube video id out of the common URL shapes so we can embed it.
export function youTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

// Tags are stored as a JSON string array; parse defensively.
export function parseTags(json: string | null): string[] {
  if (!json) return [];
  try {
    const t = JSON.parse(json);
    return Array.isArray(t) ? t.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export default function PostCard({
  post, author, reactions = [], viewerReaction = null, commentCount = 0,
}: {
  post: FeedPost;
  author?: PostAuthor | null;
  reactions?: ReactionCount[];
  viewerReaction?: string | null;
  commentCount?: number;
}) {
  const tags = parseTags(post.tags);
  const yt = post.linkUrl ? youTubeId(post.linkUrl) : null;
  const when = new Date(post.createdAt).toLocaleString();
  const displayName = author?.name ?? (author ? `@${author.username}` : "");

  return (
    <article className="bg-surface ring-1 ring-line shadow-sm rounded-2xl p-4">
      {author ? (
        <div className="flex items-center gap-3 mb-2">
          <Link href={`/u/${author.username}`} className="shrink-0">
            {author.headshotUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={author.headshotUrl} alt={displayName} className="w-9 h-9 rounded-full object-cover ring-1 ring-line" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-sm font-bold">
                {displayName.replace(/^@/, "").charAt(0).toUpperCase()}
              </div>
            )}
          </Link>
          <div className="min-w-0">
            <Link href={`/u/${author.username}`} className="text-sm font-semibold text-foreground hover:text-emerald-700">
              {displayName}
            </Link>
            <p className="text-xs text-muted">{when}</p>
          </div>
        </div>
      ) : (
        <p className="text-xs text-muted mb-2">{when}</p>
      )}

      {post.content && (
        <p className="text-sm text-body whitespace-pre-wrap leading-relaxed">{post.content}</p>
      )}

      {post.mediaUrl && post.mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mediaUrl} alt="" className="mt-3 w-full rounded-xl object-cover ring-1 ring-line" />
      )}
      {post.mediaUrl && post.mediaType === "video" && (
        <video src={post.mediaUrl} controls className="mt-3 w-full rounded-xl" />
      )}
      {post.mediaUrl && post.mediaType === "audio" && (
        <audio src={post.mediaUrl} controls className="mt-3 w-full" />
      )}

      {yt ? (
        <div className="mt-3 aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${yt}`}
            title="YouTube video"
            className="h-full w-full rounded-xl"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      ) : (
        post.linkUrl && (
          <a
            href={post.linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 block truncate text-sm text-emerald-700 dark:text-emerald-300 hover:underline"
          >
            🔗 {post.linkUrl}
          </a>
        )
      )}

      {tags.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Link
              key={t}
              href={`/feed?tag=${encodeURIComponent(t)}`}
              className="rounded-full bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              #{t}
            </Link>
          ))}
        </div>
      )}

      <PostReactions postId={post.id} counts={reactions} mine={viewerReaction} />
      <div className="flex items-start gap-1">
        <div className="min-w-0 flex-1"><PostComments postId={post.id} initialCount={commentCount} /></div>
        <ShareToDM postId={post.id} />
      </div>
    </article>
  );
}
