"use client";

import { useState } from "react";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
  userId: string;
}

export default function ChangePasswordModal({ open, onClose, userId }: ChangePasswordModalProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setSaving(true);
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to change password");
      setSaving(false);
      return;
    }
    setSaving(false);
    setSuccess(true);
    setTimeout(() => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <>
      <div className="fixed inset-0 z-[70] bg-black/60" onClick={onClose} />
      <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm p-6 shadow-2xl"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
        >
          <h2 className="text-lg font-syne font-bold text-white mb-4">Change Password</h2>
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
              {error}
            </div>
          )}
          {success ? (
            <div className="text-sm text-emerald-400 font-mono py-4">Password changed successfully.</div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCurrentPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]" autoFocus />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]" />
              </div>
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setConfirmPassword(e.target.value)} className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]" />
              </div>
              <button type="submit" disabled={saving} className="w-full bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors disabled:opacity-50">
                {saving ? "Saving..." : "Change Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </>
  );
}
