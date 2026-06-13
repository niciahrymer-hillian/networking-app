// Global loading fallback shown while a server segment streams in.
export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center text-muted">
      <div className="flex items-center gap-2 text-sm">
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.2s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500 [animation-delay:-0.1s]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-emerald-500" />
      </div>
    </div>
  );
}
