"use client";

import { useState } from "react";

interface NewLeadModalProps {
  open: boolean;
  onClose: () => void;
}

export default function NewLeadModal({ open, onClose }: NewLeadModalProps) {
  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    source: "other",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    const res = await fetch("/api/contacts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ name: "", phone: "", email: "", source: "other", notes: "" });
      onClose();
    }
    setSaving(false);
  };

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/60"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-2xl"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-syne font-bold text-white">New Lead</h2>
            <button
              onClick={onClose}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Name *
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setForm({ ...form, name: e.target.value })
                }
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, phone: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, email: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Source
              </label>
              <select
                value={form.source}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setForm({ ...form, source: e.target.value })
                }
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
              >
                <option value="other">Other</option>
                <option value="referral">Referral</option>
                <option value="website">Website</option>
                <option value="google">Google</option>
                <option value="social">Social Media</option>
                <option value="repeat">Repeat Client</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                Notes
              </label>
              <textarea
                value={form.notes}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setForm({ ...form, notes: e.target.value })
                }
                rows={3}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y"
              />
            </div>
            <button
              type="submit"
              disabled={saving || !form.name.trim()}
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
