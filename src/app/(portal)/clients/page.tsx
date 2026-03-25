"use client";

import { useEffect, useState } from "react";
import { STAGE_MAP } from "@/lib/stages";
import type { StageKey } from "@/lib/stages";

interface ContactProject {
  id: string;
  jobType: string;
  stage: string;
  value: number | null;
  address: string;
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
  projects: ContactProject[];
}

export default function ClientsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Contact | null>(null);
  const [editForm, setEditForm] = useState({ name: "", phone: "", email: "", notes: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setContacts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const openDetail = (c: Contact) => {
    setSelected(c);
    setEditForm({ name: c.name, phone: c.phone, email: c.email, notes: c.notes });
  };

  const saveContact = async () => {
    if (!selected) return;
    setSaving(true);
    await fetch("/api/contacts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: selected.id, ...editForm }),
    });
    setSaving(false);
    // Refresh
    const res = await fetch("/api/contacts");
    const data = await res.json();
    if (Array.isArray(data)) {
      setContacts(data);
      const updated = data.find((c: Contact) => c.id === selected.id);
      if (updated) setSelected(updated);
    }
  };

  const totalValue = (c: Contact) =>
    c.projects.reduce((sum, p) => sum + (p.value || 0), 0);

  const stageName = (stageKey: string) => {
    const s = STAGE_MAP[stageKey as StageKey];
    return s ? s.shortLabel : stageKey;
  };

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white">Clients</h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
        <input
          type="text"
          placeholder="Search by name, phone, email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300 w-full sm:w-72 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
        />
      </div>

      <div className="flex gap-6">
        {/* Contacts list */}
        <div className={`flex-1 min-w-0 ${selected ? "hidden lg:block" : ""}`}>
          {loading ? (
            <div className="text-sm text-zinc-600 text-center py-8">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="text-sm text-zinc-600 text-center py-8">No contacts found.</div>
          ) : (
            <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 overflow-hidden">
              {filtered.map((c) => (
                <button
                  key={c.id}
                  onClick={() => openDetail(c)}
                  className={`w-full text-left px-5 py-4 border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors ${
                    selected?.id === c.id ? "bg-zinc-800/40" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-zinc-200 truncate">{c.name}</p>
                      <p className="text-xs text-zinc-500 font-mono truncate">
                        {c.email} {c.phone ? `· ${c.phone}` : ""}
                      </p>
                    </div>
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs font-mono text-zinc-400">
                        {c.projects.length} project{c.projects.length !== 1 ? "s" : ""}
                      </p>
                      {totalValue(c) > 0 && (
                        <p className="text-xs font-mono text-zinc-500">
                          ${totalValue(c).toLocaleString()}
                        </p>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-full lg:w-96 shrink-0">
            <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-syne font-bold text-white">{selected.name}</h2>
                <button
                  onClick={() => setSelected(null)}
                  className="text-zinc-500 hover:text-white text-xs font-mono lg:hidden"
                >
                  Close
                </button>
              </div>

              {/* Editable fields */}
              <div className="space-y-3 mb-6">
                <div>
                  <label className="text-xs font-mono text-zinc-600 uppercase block mb-1">Name</label>
                  <input
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-600 uppercase block mb-1">Phone</label>
                  <input
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-600 uppercase block mb-1">Email</label>
                  <input
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-600 uppercase block mb-1">Notes</label>
                  <textarea
                    value={editForm.notes}
                    onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y"
                  />
                </div>
                <button
                  onClick={saveContact}
                  disabled={saving}
                  className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors disabled:opacity-50 w-full"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              </div>

              {/* Projects */}
              <div className="border-t border-zinc-800 pt-4">
                <h3 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
                  Projects ({selected.projects.length})
                </h3>
                {selected.projects.length === 0 ? (
                  <p className="text-xs text-zinc-600">No projects linked.</p>
                ) : (
                  <div className="space-y-2">
                    {selected.projects.map((p) => (
                      <a
                        key={p.id}
                        href={`/projects/${p.id}`}
                        className="block bg-zinc-900/50 rounded-lg p-3 hover:bg-zinc-900 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-zinc-300">{p.jobType}</p>
                            <p className="text-xs text-zinc-500">{p.address}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-xs font-mono text-zinc-400">
                              {stageName(p.stage)}
                            </span>
                            {p.value != null && p.value > 0 && (
                              <p className="text-xs font-mono text-zinc-500">
                                ${p.value.toLocaleString()}
                              </p>
                            )}
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                {totalValue(selected) > 0 && (
                  <div className="mt-3 pt-3 border-t border-zinc-800 flex justify-between">
                    <span className="text-xs font-mono text-zinc-500 uppercase">Total Value</span>
                    <span className="text-sm font-mono text-white font-semibold">
                      ${totalValue(selected).toLocaleString()}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
