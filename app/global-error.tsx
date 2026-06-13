"use client";
// Last-resort error boundary for failures in the root layout itself. It replaces
// the entire document, so it must render its own <html>/<body>.

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", display: "flex", minHeight: "100vh", alignItems: "center", justifyContent: "center", margin: 0, background: "#f6fbf8", color: "#0f172a" }}>
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <p style={{ fontSize: "3rem", margin: 0 }}>⚠️</p>
          <h1 style={{ fontSize: "1.25rem", fontWeight: 700 }}>The app hit a snag</h1>
          <p style={{ color: "#64748b", fontSize: "0.875rem" }}>Please reload the page.</p>
          <button onClick={() => reset()} style={{ marginTop: "1rem", background: "#059669", color: "#fff", border: 0, borderRadius: "0.75rem", padding: "0.625rem 1.25rem", fontWeight: 600, cursor: "pointer" }}>
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
