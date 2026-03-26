"use client";

import { useState, useEffect, useRef } from "react";

interface ContactResult {
  id: string;
  name: string;
  phone: string;
  email: string;
}

interface NewLeadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewLeadModal({ open, onClose }: NewLeadModalProps) {
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "other",
    jobType: "",
    address: "",
    value: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  // Existing client search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<ContactResult[]>([]);
  const [selectedContact, setSelectedContact] = useState<ContactResult | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) {
      setMode("new");
      setForm({ name: "", phone: "", email: "", source: "other", jobType: "", address: "", value: "", notes: "" });
      setSearchQuery("");
      setSearchResults([]);
      setSelectedContact(null);
    }
  }, [open]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetch(`/api/contacts?search=${encodeURIComponent(searchQuery)}`)
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setSearchResults(data);
            setShowDropdown(true);
          }
        })
        .catch(() => {});
    }, 300);
  }, [searchQuery]);

  if (!open) return null;

  const selectContact = (c: ContactResult) => {
    setSelectedContact(c);
    setForm((prev) => ({ ...prev, name: c.name, phone: c.phone, email: c.email }));
    setSearchQuery(c.name);
    setShowDropdown(false);
  };

  const clearSelection = () => {
    setSelectedContact(null);
    setSearchQuery("");
    setForm((prev) => ({ ...prev, name: "", phone: "", email: "" }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.address.trim()) return;
    if (mode === "new" && !form.name.trim()) return;
    if (mode === "existing" && !selectedContact) return;
    setSaving(true);

    let contactId: string;

    if (mode === "existing" && selectedContact) {
      contactId = selectedContact.id;
    } else {
      const contactRes = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          email: form.email,
          source: form.source,
          notes: form.notes,
        }),
      });
      if (!contactRes.ok) {
        setSaving(false);
        return;
      }
      const contact = await contactRes.json();
      contactId = contact.id;
    }

    await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contactId,
        jobType: form.jobType || "General",
        address: form.address,
        value: form.value || null,
      }),
    });

    setForm({ name: "", phone: "", email: "", source: "other", jobType: "", address: "", value: "", notes: "" });
    setSelectedContact(null);
    setSearchQuery("");
    onClose();
    setSaving(false);
  };

  const canSubmit = mode === "existing"
    ? !!selectedContact && !!form.address.trim()
    : !!form.name.trim() && !!form.address.trim();

  const inputClass = "w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]";
  const readOnlyClass = "w-full bg-zinc-800/50 border border-zinc-700/50 rounded-lg px-3 py-2 text-sm text-zinc-400 cursor-not-allowed";

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-syne font-bold text-white">New Lead</h2>
            <button onClick={onClose} className="text-zinc-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Client mode toggle */}
          <div className="flex rounded-lg border border-zinc-700 overflow-hidden mb-5">
            <button
              type="button"
              onClick={() => { setMode("new"); clearSelection(); }}
              className={`flex-1 text-xs font-mono py-2 transition-colors ${
                mode === "new" ? "bg-[#c47a4f] text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              New Client
            </button>
            <button
              type="button"
              onClick={() => setMode("existing")}
              className={`flex-1 text-xs font-mono py-2 transition-colors ${
                mode === "existing" ? "bg-[#c47a4f] text-white" : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Existing Client
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === "existing" ? (
              <>
                {/* Search for existing client */}
                {selectedContact ? (
                  <div className="bg-zinc-800/50 border border-zinc-700 rounded-lg p-3 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-zinc-200 font-medium">{selectedContact.name}</span>
                      <div className="flex items-center gap-2">
                        <a
                          href={`/clients`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-mono text-[#c47a4f] hover:text-[#d89a6f]"
                        >
                          View Client
                        </a>
                        <button type="button" onClick={clearSelection} className="text-xs text-zinc-500 hover:text-red-400">
                          Change
                        </button>
                      </div>
                    </div>
                    {selectedContact.phone && <p className="text-xs text-zinc-500 font-mono">{selectedContact.phone}</p>}
                    {selectedContact.email && <p className="text-xs text-zinc-500 font-mono">{selectedContact.email}</p>}
                  </div>
                ) : (
                  <div className="relative">
                    <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Search Client *</label>
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
                      placeholder="Type name, email, or phone..."
                      className={inputClass}
                      autoFocus
                    />
                    {showDropdown && searchResults.length > 0 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                        {searchResults.map((c) => (
                          <button
                            key={c.id}
                            type="button"
                            onClick={() => selectContact(c)}
                            className="w-full text-left px-3 py-2 hover:bg-zinc-700/50 transition-colors border-b border-zinc-800/50 last:border-0"
                          >
                            <span className="text-sm text-zinc-200 block">{c.name}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">
                              {c.phone}{c.phone && c.email ? " · " : ""}{c.email}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                    {showDropdown && searchResults.length === 0 && searchQuery.length >= 2 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-10 px-3 py-3 text-xs text-zinc-500">
                        No clients found
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <>
                {/* New client fields */}
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Name *</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Phone</label>
                    <input type="tel" value={form.phone} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Email</label>
                    <input type="email" value={form.email} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, email: e.target.value })} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Source</label>
                  <select value={form.source} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, source: e.target.value })} className={inputClass}>
                    <option value="other">Other</option>
                    <option value="referral">Referral</option>
                    <option value="website">Website</option>
                    <option value="google">Google</option>
                    <option value="social">Social Media</option>
                    <option value="repeat">Repeat Client</option>
                  </select>
                </div>
              </>
            )}

            {/* Project fields — always shown */}
            <div>
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Project Type</label>
              <input type="text" value={form.jobType} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, jobType: e.target.value })} placeholder="Kitchen Remodel, Bathroom, etc." className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Project Address *</label>
              <input type="text" value={form.address} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, address: e.target.value })} placeholder="123 Main St, Sarasota FL" className={inputClass} />
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Estimated Value</label>
              <input type="number" value={form.value} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, value: e.target.value })} placeholder="25000" className={inputClass} />
            </div>
            {mode === "new" && (
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Notes</label>
                <textarea value={form.notes} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, notes: e.target.value })} rows={3} className={`${inputClass} font-mono resize-y`} />
              </div>
            )}
            <button
              type="submit"
              disabled={saving || !canSubmit}
              className="w-full bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-syne font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Add Lead"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
