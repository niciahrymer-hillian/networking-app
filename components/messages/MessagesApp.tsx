"use client";
// The messaging area: conversation list (left) + open thread (right). Threads
// live-poll every few seconds. Supports DMs, group rooms (with admin controls:
// rename, add/remove, delegate admin), shared posts, and per-message reactions.

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { REACTIONS } from "@/lib/reactions";

type Person = { id: string; username: string; name: string | null; headshotUrl: string | null; isAdmin?: boolean };
type Summary = { id: string; isGroup: boolean; title: string; avatar: string | null; memberCount: number; lastMessage: { preview: string; when: string } | null };
type SharedPost = { id: string; content: string; mediaUrl: string | null; mediaType: string | null; linkUrl: string | null; author: Person };
type Msg = { id: string; senderId: string; sender: Person; body: string | null; createdAt: string; reactions: { emoji: string; count: number }[]; myReaction: string | null; sharedPost: SharedPost | null };
type Thread = { id: string; isGroup: boolean; name: string | null; title: string; viewerIsAdmin: boolean; participants: Person[]; messages: Msg[] };

const getJSON = (url: string) => fetch(url).then((r) => r.json()).catch(() => null);
const postJSON = (url: string, body: unknown, method = "POST") =>
  fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json()).catch(() => null);

function timeAgo(d: string) {
  const s = Math.floor((Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(d).toLocaleDateString();
}

function Avatar({ p, size = "h-9 w-9" }: { p: { name: string | null; username: string; headshotUrl: string | null }; size?: string }) {
  const label = p.name ?? `@${p.username}`;
  return p.headshotUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={p.headshotUrl} alt={label} className={`${size} shrink-0 rounded-full object-cover ring-1 ring-line`} />
  ) : (
    <div className={`${size} shrink-0 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-sm font-bold text-emerald-700 dark:text-emerald-300`}>
      {label.replace(/^@/, "").charAt(0).toUpperCase()}
    </div>
  );
}

export default function MessagesApp({ meId, initialConversationId }: { meId: string; initialConversationId: string | null }) {
  const [conversations, setConversations] = useState<Summary[]>([]);
  const [selected, setSelected] = useState<string | null>(initialConversationId);
  const [showNew, setShowNew] = useState(false);

  const loadList = useCallback(async () => {
    const r = await getJSON("/api/conversations");
    if (r?.conversations) setConversations(r.conversations);
  }, []);

  useEffect(() => {
    loadList();
    const t = setInterval(loadList, 8000);
    return () => clearInterval(t);
  }, [loadList]);

  return (
    <div className="grid h-[70vh] grid-cols-1 gap-0 overflow-hidden rounded-2xl ring-1 ring-line bg-surface sm:grid-cols-[18rem_1fr]">
      {/* Conversation list */}
      <aside className={`flex flex-col border-r border-line ${selected ? "hidden sm:flex" : "flex"}`}>
        <div className="flex items-center justify-between border-b border-line px-4 py-3">
          <p className="font-semibold">Chats</p>
          <button onClick={() => setShowNew(true)} className="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-emerald-500">＋ New</button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <p className="p-4 text-sm text-muted">No conversations yet. Start one with a connection.</p>
          ) : conversations.map((c) => (
            <button key={c.id} onClick={() => setSelected(c.id)} className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-elevated ${selected === c.id ? "bg-elevated" : ""}`}>
              {c.isGroup ? (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300">👥</div>
              ) : (
                <Avatar p={{ name: c.title, username: c.title, headshotUrl: c.avatar }} />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{c.title}{c.isGroup ? ` · ${c.memberCount}` : ""}</p>
                <p className="truncate text-xs text-muted">{c.lastMessage?.preview ?? "No messages yet"}</p>
              </div>
            </button>
          ))}
        </div>
      </aside>

      {/* Thread */}
      <section className={`min-w-0 ${selected ? "flex" : "hidden sm:flex"} flex-col`}>
        {selected ? (
          <ChatThread key={selected} conversationId={selected} meId={meId} onBack={() => setSelected(null)} onChange={loadList} />
        ) : (
          <div className="flex flex-1 items-center justify-center p-6 text-center text-sm text-muted">Select a conversation, or start a new one.</div>
        )}
      </section>

      {showNew && <NewChatModal onClose={() => setShowNew(false)} onCreated={(id) => { setShowNew(false); setSelected(id); loadList(); }} />}
    </div>
  );
}

function ChatThread({ conversationId, meId, onBack, onChange }: { conversationId: string; meId: string; onBack: () => void; onChange: () => void }) {
  const [thread, setThread] = useState<Thread | null>(null);
  const [draft, setDraft] = useState("");
  const [reactingTo, setReactingTo] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const load = useCallback(async () => {
    const r = await getJSON(`/api/conversations/${conversationId}`);
    if (r?.id) setThread(r);
  }, [conversationId]);

  useEffect(() => {
    load();
    const t = setInterval(load, 4000); // live polling
    return () => clearInterval(t);
  }, [load]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    await postJSON(`/api/conversations/${conversationId}/messages`, { body });
    await load();
    onChange();
  }
  async function react(mid: string, emoji: string) {
    setReactingTo(null);
    await postJSON(`/api/conversations/${conversationId}/messages/${mid}/react`, { emoji });
    await load();
  }

  if (!thread) return <div className="flex flex-1 items-center justify-center text-sm text-muted">Loading…</div>;

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-line px-4 py-3">
        <button onClick={onBack} className="text-muted sm:hidden">←</button>
        <p className="min-w-0 flex-1 truncate font-semibold">{thread.title}{thread.isGroup ? ` · ${thread.participants.length}` : ""}</p>
        {thread.isGroup && (
          <button onClick={() => setShowSettings((s) => !s)} className="rounded-lg px-2 py-1 text-sm text-muted hover:bg-elevated" title="Group settings">⚙︎</button>
        )}
      </div>

      {thread.isGroup && showSettings && <GroupSettings thread={thread} onClose={() => setShowSettings(false)} reload={() => { load(); onChange(); }} />}

      {/* Messages */}
      <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-4 py-3">
        {thread.messages.map((m) => {
          const mine = m.senderId === meId;
          return (
            <div key={m.id} className={`flex gap-2 ${mine ? "flex-row-reverse" : ""}`}>
              {!mine && <Avatar p={m.sender} size="h-7 w-7" />}
              <div className={`group relative max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                {!mine && thread.isGroup && <span className="px-1 text-[11px] text-muted">{m.sender.name ?? `@${m.sender.username}`}</span>}
                <div className={`rounded-2xl px-3 py-2 text-sm ${mine ? "bg-emerald-600 text-white" : "bg-elevated text-body"}`}>
                  {m.sharedPost && <SharedPostCard post={m.sharedPost} onTint={mine} />}
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                </div>
                <div className="flex items-center gap-1 px-1">
                  <span className="text-[10px] text-muted">{timeAgo(m.createdAt)}</span>
                  <button onClick={() => setReactingTo(reactingTo === m.id ? null : m.id)} className="text-[11px] text-muted opacity-0 transition-opacity hover:text-body group-hover:opacity-100">😊</button>
                  {m.reactions.length > 0 && (
                    <span className="rounded-full bg-surface px-1.5 text-[11px] ring-1 ring-line">{m.reactions.map((r) => r.emoji).join("")} {m.reactions.reduce((n, r) => n + r.count, 0)}</span>
                  )}
                </div>
                {reactingTo === m.id && (
                  <div className="absolute bottom-full z-10 mb-1 flex gap-0.5 rounded-full bg-surface p-1 shadow-lg ring-1 ring-line">
                    {REACTIONS.map((r) => (
                      <button key={r.emoji} onClick={() => react(m.id, r.emoji)} className={`rounded-full px-1 text-lg hover:scale-125 ${m.myReaction === r.emoji ? "bg-emerald-50 dark:bg-emerald-500/10" : ""}`}>{r.emoji}</button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {thread.messages.length === 0 && <p className="m-auto text-sm text-muted">Say hello 👋</p>}
      </div>

      {/* Composer */}
      <div className="flex gap-2 border-t border-line p-3">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message…"
          className="flex-1 rounded-full bg-elevated px-4 py-2 text-sm text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
        <button onClick={send} disabled={!draft.trim()} className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-500">Send</button>
      </div>
    </>
  );
}

function SharedPostCard({ post, onTint }: { post: SharedPost; onTint: boolean }) {
  return (
    <Link href={`/u/${post.author.username}`} className={`mb-1 block rounded-xl p-2 ring-1 ${onTint ? "bg-white/15 ring-white/20" : "bg-surface ring-line"}`}>
      <div className="flex items-center gap-1.5">
        <Avatar p={post.author} size="h-5 w-5" />
        <span className="text-xs font-semibold">{post.author.name ?? `@${post.author.username}`}</span>
      </div>
      <p className={`mt-1 line-clamp-3 text-xs ${onTint ? "text-white/90" : "text-body"}`}>{post.content}</p>
      {post.mediaUrl && post.mediaType === "image" && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.mediaUrl} alt="" className="mt-1 h-20 w-full rounded-lg object-cover" />
      )}
    </Link>
  );
}

function GroupSettings({ thread, onClose, reload }: { thread: Thread; onClose: () => void; reload: () => void }) {
  const [name, setName] = useState(thread.name ?? "");
  const [connections, setConnections] = useState<Person[]>([]);
  const memberIds = new Set(thread.participants.map((p) => p.id));

  useEffect(() => { getJSON("/api/network").then((r) => r?.connections && setConnections(r.connections)); }, []);

  const patch = async (action: string, extra: object = {}) => { await postJSON(`/api/conversations/${thread.id}`, { action, ...extra }, "PATCH"); reload(); };
  const addable = connections.filter((c) => !memberIds.has(c.id));

  return (
    <div className="border-b border-line bg-elevated/50 px-4 py-3 text-sm">
      <div className="mb-2 flex items-center justify-between">
        <p className="font-semibold">Group settings {thread.viewerIsAdmin ? "" : "(admin only)"}</p>
        <button onClick={onClose} className="text-muted">✕</button>
      </div>
      {thread.viewerIsAdmin && (
        <div className="mb-3 flex gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} className="flex-1 rounded-lg bg-surface px-3 py-1.5 ring-1 ring-line focus:outline-none" placeholder="Room name" />
          <button onClick={() => patch("rename", { name })} className="rounded-lg bg-emerald-600 px-3 text-xs font-medium text-white hover:bg-emerald-500">Rename</button>
        </div>
      )}
      <p className="mb-1 text-xs font-medium text-muted">Members</p>
      <div className="space-y-1">
        {thread.participants.map((p) => (
          <div key={p.id} className="flex items-center gap-2">
            <Avatar p={p} size="h-6 w-6" />
            <span className="min-w-0 flex-1 truncate text-xs">{p.name ?? `@${p.username}`}{p.isAdmin ? " · admin" : ""}</span>
            {thread.viewerIsAdmin && !p.isAdmin && (
              <>
                <button onClick={() => patch("setAdmin", { userId: p.id })} className="text-[11px] text-emerald-700 hover:underline">Make admin</button>
                <button onClick={() => patch("removeMember", { userId: p.id })} className="text-[11px] text-red-600 hover:underline">Remove</button>
              </>
            )}
          </div>
        ))}
      </div>
      {thread.viewerIsAdmin && addable.length > 0 && (
        <>
          <p className="mb-1 mt-3 text-xs font-medium text-muted">Add a connection</p>
          <div className="flex flex-wrap gap-1">
            {addable.slice(0, 12).map((c) => (
              <button key={c.id} onClick={() => patch("addMembers", { userIds: [c.id] })} className="rounded-full bg-surface px-2 py-1 text-[11px] ring-1 ring-line hover:bg-elevated">＋ {c.name ?? `@${c.username}`}</button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function NewChatModal({ onClose, onCreated }: { onClose: () => void; onCreated: (id: string) => void }) {
  const [connections, setConnections] = useState<Person[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { getJSON("/api/network").then((r) => r?.connections && setConnections(r.connections)); }, []);
  const toggle = (id: string) => setPicked((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const isGroup = picked.size > 1;

  async function create() {
    if (picked.size === 0 || busy) return;
    setBusy(true);
    const r = await postJSON("/api/conversations", { userIds: [...picked], isGroup, name: isGroup ? groupName : undefined });
    setBusy(false);
    if (r?.id) onCreated(r.id);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl bg-surface p-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <p className="mb-3 font-semibold">New message</p>
        {isGroup && (
          <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Group name" className="mb-3 w-full rounded-lg bg-elevated px-3 py-2 text-sm ring-1 ring-line focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        )}
        <div className="max-h-72 space-y-1 overflow-y-auto">
          {connections.length === 0 ? (
            <p className="text-sm text-muted">No connections yet — connect with people to message them.</p>
          ) : connections.map((c) => (
            <button key={c.id} onClick={() => toggle(c.id)} className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-elevated ${picked.has(c.id) ? "bg-emerald-50 dark:bg-emerald-500/10" : ""}`}>
              <Avatar p={c} size="h-7 w-7" />
              <span className="min-w-0 flex-1 truncate text-sm">{c.name ?? `@${c.username}`}</span>
              {picked.has(c.id) && <span className="text-emerald-600">✓</span>}
            </button>
          ))}
        </div>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={onClose} className="px-3 py-1.5 text-sm text-muted">Cancel</button>
          <button onClick={create} disabled={picked.size === 0 || busy} className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white disabled:opacity-50 hover:bg-emerald-500">
            {isGroup ? "Create group" : "Message"}
          </button>
        </div>
      </div>
    </div>
  );
}
