"use client";

import { useEffect, useState } from "react";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", role: "tech", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchMembers = () => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleInvite = async () => {
    setError("");
    if (!form.name || !form.email || !form.password) {
      setError("All fields are required.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/users/invite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to invite user");
      setSubmitting(false);
      return;
    }
    setForm({ name: "", email: "", role: "tech", password: "" });
    setShowModal(false);
    setSubmitting(false);
    fetchMembers();
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "admin": return "Admin";
      case "manager": return "Manager";
      case "tech": return "Technician";
      default: return role;
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "admin": return "bg-[#c47a4f]/20 text-[#c47a4f]";
      case "manager": return "bg-blue-500/20 text-blue-400";
      default: return "bg-zinc-700/50 text-zinc-400";
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white">Team</h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            Manage team members and invitations
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
        >
          Invite Member
        </button>
      </div>

      {/* Team table */}
      <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3">
                Name
              </th>
              <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3">
                Email
              </th>
              <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3">
                Role
              </th>
              <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3">
                Joined
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-600">
                  Loading...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-sm text-zinc-600">
                  No team members yet.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3 text-sm text-zinc-200 font-medium">
                    {m.name}
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-400 font-mono">
                    {m.email}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${roleBadgeColor(m.role)}`}>
                      {roleLabel(m.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-500 font-mono">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showModal && (
        <>
          <div
            className="fixed inset-0 bg-black/60 z-50"
            onClick={() => setShowModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#0e0e0f] border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
              <h2 className="text-lg font-syne font-bold text-white mb-4">
                Invite Team Member
              </h2>

              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Full name"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="user@company.com"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                    Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  >
                    <option value="admin">Admin</option>
                    <option value="manager">Manager</option>
                    <option value="tech">Technician</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                    Temporary Password
                  </label>
                  <input
                    type="text"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="Temp password for first login"
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowModal(false)}
                  className="text-sm font-mono text-zinc-400 hover:text-white px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleInvite}
                  disabled={submitting}
                  className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
                >
                  {submitting ? "Inviting..." : "Send Invite"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
