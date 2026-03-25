"use client";

import { useState } from "react";

interface MeetingSchedulerProps {
  open: boolean;
  onClose: () => void;
  projectId: string;
  stage: string;
  defaultTitle: string;
  clientEmail: string;
  onCreated?: () => void;
}

interface MeetingResult {
  id: string;
  googleEventUrl: string | null;
}

export default function MeetingScheduler({
  open,
  onClose,
  projectId,
  stage,
  defaultTitle,
  clientEmail,
  onCreated,
}: MeetingSchedulerProps) {
  const [form, setForm] = useState({
    title: defaultTitle,
    date: "",
    time: "09:00",
    duration: 60,
    notes: "",
    attendees: clientEmail,
  });
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<MeetingResult | null>(null);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.date || !form.time) return;
    setSaving(true);

    const scheduledAt = new Date(`${form.date}T${form.time}`).toISOString();
    const attendeeList = form.attendees
      .split(",")
      .map((e: string) => e.trim())
      .filter(Boolean);

    const res = await fetch(`/api/projects/${projectId}/meetings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage,
        title: form.title,
        scheduledAt,
        duration: form.duration,
        notes: form.notes,
        attendees: attendeeList,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      setResult(data);
      onCreated?.();
    }
    setSaving(false);
  };

  const handleClose = () => {
    setResult(null);
    setForm({
      title: defaultTitle,
      date: "",
      time: "09:00",
      duration: 60,
      notes: "",
      attendees: clientEmail,
    });
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/60" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-6 shadow-2xl"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-syne font-bold text-white">
              Schedule Meeting
            </h2>
            <button
              onClick={handleClose}
              className="text-zinc-500 hover:text-white transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {result ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-400 font-mono text-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Meeting scheduled
              </div>
              {result.googleEventUrl && (
                <a
                  href={result.googleEventUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 border border-zinc-700 rounded-lg px-4 py-2 transition-colors"
                >
                  View in Google Calendar
                </a>
              )}
              <button
                onClick={handleClose}
                className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Done
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, title: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, date: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                    Time *
                  </label>
                  <input
                    type="time"
                    value={form.time}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm({ ...form, time: e.target.value })
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  Duration
                </label>
                <select
                  value={form.duration}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                    setForm({ ...form, duration: parseInt(e.target.value) })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                >
                  <option value={30}>30 minutes</option>
                  <option value={60}>1 hour</option>
                  <option value={120}>2 hours</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  Attendees (comma-separated emails)
                </label>
                <input
                  type="text"
                  value={form.attendees}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm({ ...form, attendees: e.target.value })
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                />
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
                disabled={saving || !form.date}
                className="w-full bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-syne font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50"
              >
                {saving ? "Scheduling..." : "Schedule Meeting"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
