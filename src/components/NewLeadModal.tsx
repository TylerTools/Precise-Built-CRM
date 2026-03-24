"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Props {
  open: boolean;
  onClose: () => void;
}

const JOB_TYPES = [
  "Kitchen Remodel",
  "Bathroom Remodel",
  "Full Home Renovation",
  "Addition",
  "Deck / Patio",
  "Flooring",
  "Painting",
  "Roofing",
  "Custom Build",
  "Other",
];

export default function NewLeadModal({ open, onClose }: Props) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    jobType: "Kitchen Remodel",
    value: "",
    notes: "",
  });

  const set = (field: string, value: string) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Client name and phone are required.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      // 1. Create contact
      const contactRes = await fetch("/api/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          email: form.email.trim(),
          source: "manual",
          status: "new",
          notes: "",
        }),
      });

      if (!contactRes.ok) {
        const err = await contactRes.json();
        throw new Error(err.error || "Failed to create contact");
      }

      const contact = await contactRes.json();

      // 2. Create project
      const projectRes = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          jobType: form.jobType,
          address: form.address.trim(),
          value: form.value || null,
          scope: form.notes.trim(),
        }),
      });

      if (!projectRes.ok) {
        const err = await projectRes.json();
        throw new Error(err.error || "Failed to create project");
      }

      const project = await projectRes.json();

      // Reset form & navigate
      setForm({ name: "", phone: "", email: "", address: "", jobType: "Kitchen Remodel", value: "", notes: "" });
      onClose();
      router.push(`/projects/${project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg rounded-2xl border border-zinc-800 p-6 shadow-2xl"
        style={{ backgroundColor: "#161617" }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-syne font-bold text-white">New Lead</h2>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {error && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Client Name */}
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
              Client Name *
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              placeholder="John Smith"
            />
          </div>

          {/* Phone + Email row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                Phone *
              </label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => set("email", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
                placeholder="john@email.com"
              />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
              Address
            </label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              placeholder="123 Main St, City, ST"
            />
          </div>

          {/* Project Type + Value row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                Project Type
              </label>
              <select
                value={form.jobType}
                onChange={(e) => set("jobType", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-200 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
                Estimated Value
              </label>
              <input
                type="number"
                value={form.value}
                onChange={(e) => set("value", e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 font-mono"
                placeholder="25000"
                min="0"
                step="100"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1.5">
              Notes
            </label>
            <textarea
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-3 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500 resize-none"
              placeholder="Initial scope, special requirements, etc."
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm text-zinc-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Creating..." : "Create Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
