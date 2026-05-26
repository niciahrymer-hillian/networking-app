"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Profile = {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  isQREnabled: boolean;
  isOwner: boolean;
  user: {
    id: string;
    username: string;
    email: string | null;
  } | null;
  createdAt: string;
};

export default function AdminProfilesClient() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [togglingQR, setTogglingQR] = useState<string | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  async function fetchProfiles() {
    try {
      const res = await fetch("/api/admin/profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteProfile(id: string) {
    if (!confirm("Are you sure you want to delete this profile?")) return;

    setDeleting(id);
    try {
      const res = await fetch(`/api/admin/profiles/${id}`, { method: "DELETE" });
      if (res.ok) {
        setProfiles((prev) => prev.filter((p) => p.id !== id));
      } else {
        alert("Failed to delete profile");
      }
    } catch (error) {
      alert("Failed to delete profile");
    } finally {
      setDeleting(null);
    }
  }

  async function toggleQR(id: string) {
    setTogglingQR(id);
    try {
      const res = await fetch(`/api/admin/profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isQREnabled: undefined }), // toggle
      });
      if (res.ok) {
        const updated = await res.json();
        setProfiles((prev) =>
          prev.map((p) => (p.id === id ? { ...p, isQREnabled: updated.isQREnabled } : p))
        );
      } else {
        alert("Failed to toggle QR status");
      }
    } catch (error) {
      alert("Failed to toggle QR status");
    } finally {
      setTogglingQR(null);
    }
  }

  if (loading) {
    return <div className="text-center text-white/60">Loading profiles...</div>;
  }

  if (profiles.length === 0) {
    return <div className="text-center text-white/60">No profiles found.</div>;
  }

  return (
    <div className="space-y-4">
      {profiles.map((profile) => (
        <div
          key={profile.id}
          className="bg-white/5 border border-white/10 rounded-2xl p-4"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-white">{profile.name}</p>
                  {profile.isOwner && (
                    <span className="text-xs px-2 py-1 bg-indigo-500/20 text-indigo-200 rounded">
                      Owner
                    </span>
                  )}
                </div>
                <p className="text-xs text-white/40 font-mono mb-2">
                  Slug: {profile.slug}
                </p>
                <p className="text-xs text-white/50 mb-2">
                  {profile.user ? `Owner: ${profile.user.username}` : "No owner"}
                </p>
                <p className="text-xs text-white/40">
                  {profile.email || "No email"} · Created{" "}
                  {new Date(profile.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <button
                onClick={() => toggleQR(profile.id)}
                disabled={togglingQR === profile.id}
                className={`flex-1 text-sm font-medium px-3 py-2 rounded-lg transition-colors ${
                  profile.isQREnabled
                    ? "bg-green-600/20 text-green-200 hover:bg-green-600/30"
                    : "bg-red-600/20 text-red-200 hover:bg-red-600/30"
                } disabled:opacity-50`}
              >
                {togglingQR === profile.id
                  ? "Toggling..."
                  : profile.isQREnabled
                  ? "✓ QR Enabled"
                  : "✗ QR Disabled"}
              </button>

              <Link
                href={`/p/${profile.slug}`}
                target="_blank"
                className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-indigo-600/20 text-indigo-200 hover:bg-indigo-600/30 transition-colors text-center"
              >
                View public
              </Link>

              <button
                onClick={() => deleteProfile(profile.id)}
                disabled={deleting === profile.id}
                className="flex-1 text-sm font-medium px-3 py-2 rounded-lg bg-red-600/20 text-red-200 hover:bg-red-600/30 transition-colors disabled:opacity-50"
              >
                {deleting === profile.id ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
