"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

interface Project {
  id: string;
  jobType: string;
  stage: string;
  address: string;
  value: number | null;
  assignedUser: { name: string } | null;
}

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  notes: string;
  createdAt: string;
  projects: Project[];
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/contacts/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setContact(data);
        setForm({ name: data.name, phone: data.phone, email: data.email, notes: data.notes });
        setLoading(false);
      })
      .catch(() => router.push("/contacts"));
  }, [params.id, router]);

  const handleSave = async () => {
    setSaving(true);
    const res = await fetch(`/api/contacts/${params.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      const updated = await res.json();
      setContact((c) => c ? { ...c, ...updated } : c);
      setEditing(false);
    }
    setSaving(false);
  };

  if (loading || !contact) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500 font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <button
        onClick={() => router.push("/contacts")}
        className="text-xs font-mono text-zinc-500 hover:text-brand-400 transition-colors mb-4 inline-block"
      >
        &larr; Contacts
      </button>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-500/15 flex items-center justify-center">
            <span className="text-lg font-syne font-bold text-brand-400">
              {contact.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h1 className="text-2xl font-syne font-bold text-white">{contact.name}</h1>
            <p className="text-sm text-zinc-500 font-mono">{contact.email || contact.phone}</p>
          </div>
        </div>
        <button
          onClick={() => setEditing(!editing)}
          className="text-xs font-mono text-brand-400 hover:text-brand-300 transition-colors"
        >
          {editing ? "Cancel" : "Edit"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Info card */}
        <div
          className="lg:col-span-1 rounded-xl border border-zinc-800/80 p-5"
          style={{ backgroundColor: "#161617" }}
        >
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Contact Info
          </h2>
          {editing ? (
            <div className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Name"
              />
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Phone"
              />
              <input
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500"
                placeholder="Email"
              />
              <textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500 resize-none"
                placeholder="Notes"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              <div>
                <span className="text-zinc-600 text-xs font-mono">Phone</span>
                <p className="text-zinc-300">
                  <a href={`tel:${contact.phone.replace(/\D/g, "")}`} className="text-brand-400 hover:text-brand-300">
                    {contact.phone}
                  </a>
                </p>
              </div>
              {contact.email && (
                <div>
                  <span className="text-zinc-600 text-xs font-mono">Email</span>
                  <p className="text-zinc-300">
                    <a href={`mailto:${contact.email}`} className="text-brand-400 hover:text-brand-300">
                      {contact.email}
                    </a>
                  </p>
                </div>
              )}
              <div>
                <span className="text-zinc-600 text-xs font-mono">Source</span>
                <p className="text-zinc-300">{contact.source}</p>
              </div>
              <div>
                <span className="text-zinc-600 text-xs font-mono">Added</span>
                <p className="text-zinc-300">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </p>
              </div>
              {contact.notes && (
                <div>
                  <span className="text-zinc-600 text-xs font-mono">Notes</span>
                  <p className="text-zinc-400 whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Projects */}
        <div
          className="lg:col-span-2 rounded-xl border border-zinc-800/80 p-5"
          style={{ backgroundColor: "#161617" }}
        >
          <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
            Projects ({contact.projects.length})
          </h2>
          {contact.projects.length === 0 ? (
            <p className="text-sm text-zinc-600 py-6 text-center">
              No projects linked to this contact yet.
            </p>
          ) : (
            <div className="space-y-2">
              {contact.projects.map((p) => (
                <Link
                  key={p.id}
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-800 p-3 hover:border-zinc-600 transition-colors"
                  style={{ backgroundColor: "#1c1c1e" }}
                >
                  <div>
                    <p className="text-sm text-zinc-200 font-medium">{p.jobType}</p>
                    <p className="text-xs text-zinc-500">
                      {p.stage} {p.address ? `· ${p.address}` : ""}
                    </p>
                  </div>
                  {p.value != null && p.value > 0 && (
                    <span className="text-sm font-mono text-brand-400">
                      ${p.value.toLocaleString()}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
