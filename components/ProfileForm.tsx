"use client";
// Shared profile form — used by both /profiles/new and /profiles/[id]/edit.
// Handles text fields, custom link rows, and file uploads (headshot + PDF business card).
// WHY: A single reusable form avoids duplicating validation and upload logic.

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export interface ProfileFormData {
  id?: string;
  name: string;
  email: string;
  phone: string;
  headline: string;
  about: string;
  headshotUrl: string;
  pdfUrl: string;
  linkedinUrl: string;
  githubUrl: string;
  links: { label: string; url: string }[];
}

interface Props {
  initial?: ProfileFormData; // pre-populated for edit mode
}

const EMPTY: ProfileFormData = {
  name: "", email: "", phone: "", headline: "", about: "",
  headshotUrl: "", pdfUrl: "", linkedinUrl: "", githubUrl: "", links: [],
};

export default function ProfileForm({ initial }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<ProfileFormData>(initial ?? EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploadingHeadshot, setUploadingHeadshot] = useState(false);
  const [uploadingPdf, setUploadingPdf] = useState(false);
  const [error, setError] = useState("");
  const headshotRef = useRef<HTMLInputElement>(null);
  const pdfRef = useRef<HTMLInputElement>(null);

  const isEdit = !!initial?.id;

  function set(field: keyof ProfileFormData, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function setLink(index: number, field: "label" | "url", value: string) {
    setForm((f) => {
      const links = [...f.links];
      links[index] = { ...links[index], [field]: value };
      return { ...f, links };
    });
  }

  function addLink() {
    setForm((f) => ({ ...f, links: [...f.links, { label: "", url: "" }] }));
  }

  function removeLink(index: number) {
    setForm((f) => ({ ...f, links: f.links.filter((_, i) => i !== index) }));
  }

  // Upload a file immediately on selection and store the returned URL in form state
  async function handleFileUpload(
    file: File,
    field: "headshotUrl" | "pdfUrl",
    setUploading: (v: boolean) => void
  ) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (res.ok) {
      setForm((f) => ({ ...f, [field]: data.url }));
    } else {
      setError(data.error ?? "Upload failed");
    }
    setUploading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = isEdit ? `/api/profiles/${initial!.id}` : "/api/profiles";
    const method = isEdit ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    if (res.ok) {
      router.push("/");
      router.refresh();
    } else {
      const data = await res.json();
      setError(data.error ?? "Failed to save");
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* === Headshot === */}
      <section>
        <label className="block text-sm font-medium text-slate-700 mb-2">Headshot</label>
        <div className="flex items-center gap-4">
          {form.headshotUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={form.headshotUrl}
              alt="Headshot preview"
              className="w-16 h-16 rounded-full object-cover ring-1 ring-emerald-900/10"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-300 text-2xl">
              👤
            </div>
          )}
          <div>
            <button
              type="button"
              onClick={() => headshotRef.current?.click()}
              className="text-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors"
              disabled={uploadingHeadshot}
            >
              {uploadingHeadshot ? "Uploading…" : form.headshotUrl ? "Change photo" : "Upload photo"}
            </button>
            <input
              ref={headshotRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileUpload(file, "headshotUrl", setUploadingHeadshot);
              }}
            />
          </div>
        </div>
      </section>

      {/* === Core info === */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="Name *" value={form.name} onChange={(v) => set("name", v)} required placeholder="Jane Smith" />
        <Field label="Email" value={form.email} onChange={(v) => set("email", v)} type="email" placeholder="jane@example.com" />
        <Field label="Phone" value={form.phone} onChange={(v) => set("phone", v)} placeholder="+1 555 000 0000" />
        <Field label="Headline" value={form.headline} onChange={(v) => set("headline", v)} placeholder="Senior Engineer @ Acme" />
      </section>

      {/* === About === */}
      <section>
        <label className="block text-sm font-medium text-slate-700 mb-2">About</label>
        <textarea
          value={form.about}
          onChange={(e) => set("about", e.target.value)}
          rows={4}
          placeholder="Paste LinkedIn about section or write a short bio…"
          className="w-full bg-white border border-slate-300 rounded-lg px-4 py-3 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition resize-none"
        />
      </section>

      {/* === Social links === */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Field label="LinkedIn URL" value={form.linkedinUrl} onChange={(v) => set("linkedinUrl", v)} placeholder="https://linkedin.com/in/…" />
        <Field label="GitHub URL" value={form.githubUrl} onChange={(v) => set("githubUrl", v)} placeholder="https://github.com/…" />
      </section>

      {/* === Custom links === */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">Additional links</label>
          <button type="button" onClick={addLink} className="text-xs font-medium text-emerald-700 hover:text-emerald-600">
            + Add link
          </button>
        </div>
        {form.links.map((link, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              value={link.label}
              onChange={(e) => setLink(i, "label", e.target.value)}
              placeholder="Label (e.g. Portfolio)"
              className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <input
              value={link.url}
              onChange={(e) => setLink(i, "url", e.target.value)}
              placeholder="https://…"
              className="flex-[2] bg-white border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
            />
            <button
              type="button"
              onClick={() => removeLink(i)}
              className="text-slate-300 hover:text-red-500 transition-colors px-2"
              aria-label="Remove"
            >
              ✕
            </button>
          </div>
        ))}
      </section>

      {/* === PDF Business Card === */}
      <section>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Business card PDF{" "}
          <span className="text-slate-400 font-normal">(front = page 1, back = page 2)</span>
        </label>
        <div className="flex items-center gap-4">
          {form.pdfUrl && (
            <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full">
              PDF uploaded ✓
            </span>
          )}
          <button
            type="button"
            onClick={() => pdfRef.current?.click()}
            disabled={uploadingPdf}
            className="text-sm border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg transition-colors"
          >
            {uploadingPdf ? "Uploading…" : form.pdfUrl ? "Replace PDF" : "Upload PDF"}
          </button>
          <input
            ref={pdfRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileUpload(file, "pdfUrl", setUploadingPdf);
            }}
          />
        </div>
      </section>

      {/* === Submit === */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploadingHeadshot || uploadingPdf}
          className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl shadow-sm shadow-emerald-600/20 transition-colors"
        >
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create profile"}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="text-slate-500 hover:text-slate-800 px-4 py-3 transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

// Reusable text input field
function Field({
  label, value, onChange, type = "text", placeholder, required,
}: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full bg-white border border-slate-300 rounded-lg px-4 py-2.5 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition"
      />
    </div>
  );
}
