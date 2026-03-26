"use client";

import { useEffect, useState, useCallback } from "react";
import MessagesDrawer from "@/components/MessagesDrawer";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  phone: string | null;
  profileImage: string | null;
  displayName: string | null;
  createdAt: string;
}

interface CurrentUser {
  userId: string;
  role: string;
}

const ROLE_HIERARCHY: Record<string, number> = {
  owner: 5,
  admin: 4,
  manager: 3,
  tech: 2,
  client: 1,
};

function InitialsAvatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    "bg-blue-600", "bg-emerald-600", "bg-violet-600",
    "bg-amber-600", "bg-rose-600", "bg-cyan-600", "bg-indigo-600",
  ];
  const colorIdx = name.split("").reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;

  const sizes = { sm: "w-8 h-8 text-xs", md: "w-10 h-10 text-sm", lg: "w-16 h-16 text-xl" };

  return (
    <div className={`${sizes[size]} ${colors[colorIdx]} rounded-full flex items-center justify-center text-white font-semibold shrink-0`}>
      {initials}
    </div>
  );
}

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState<TeamMember | null>(null);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [form, setForm] = useState({ name: "", email: "", role: "tech", password: "" });
  const [editForm, setEditForm] = useState({ name: "", email: "", role: "", phone: "", profileImage: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showMessages, setShowMessages] = useState(false);
  const [messageUserId, setMessageUserId] = useState<string | null>(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetSuccess, setResetSuccess] = useState(false);

  const fetchMembers = useCallback(() => {
    fetch("/api/users")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setMembers(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchMembers();
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user) setCurrentUser({ userId: data.user.id || data.user.userId, role: data.user.role });
      })
      .catch(() => {});
  }, [fetchMembers]);

  const canManage = currentUser
    ? ROLE_HIERARCHY[currentUser.role] >= ROLE_HIERARCHY.admin
    : false;

  const canEditMember = (member: TeamMember) => {
    if (!currentUser) return false;
    if (currentUser.userId === member.id) return true;
    const myRank = ROLE_HIERARCHY[currentUser.role] || 0;
    const theirRank = ROLE_HIERARCHY[member.role] || 0;
    return myRank > theirRank;
  };

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
    setShowInviteModal(false);
    setSubmitting(false);
    fetchMembers();
  };

  const handleEdit = async () => {
    if (!editingMember) return;
    setError("");
    setSubmitting(true);
    const res = await fetch(`/api/users/${editingMember.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to update user");
      setSubmitting(false);
      return;
    }
    setEditingMember(null);
    setSubmitting(false);
    fetchMembers();
  };

  const handleDelete = async (member: TeamMember) => {
    if (member.role === "owner") return;
    if (!confirm(`Delete ${member.name}? This cannot be undone.`)) return;
    const res = await fetch(`/api/users/${member.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to delete user");
      return;
    }
    fetchMembers();
  };

  const handleTransferOwnership = async (targetId: string) => {
    if (!confirm("Transfer ownership? You will be demoted to Admin.")) return;
    const res = await fetch("/api/users/transfer-ownership", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: targetId }),
    });
    if (!res.ok) {
      const data = await res.json();
      alert(data.error || "Failed to transfer ownership");
      return;
    }
    window.location.reload();
  };

  const handleProfileImageUpload = async (file: File, userId: string) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", "profile");
    const uploadRes = await fetch("/api/upload", { method: "POST", body: formData });
    if (!uploadRes.ok) return;
    const { url } = await uploadRes.json();
    await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileImage: url }),
    });
    fetchMembers();
  };

  const openEdit = (m: TeamMember) => {
    setEditForm({ name: m.name, email: m.email, role: m.role, phone: m.phone || "", profileImage: m.profileImage || "" });
    setEditingMember(m);
    setError("");
  };

  const roleLabel = (role: string) => {
    switch (role) {
      case "owner": return "Owner";
      case "admin": return "Admin";
      case "manager": return "Manager";
      case "tech": return "Technician";
      case "client": return "Client";
      default: return role;
    }
  };

  const roleBadgeColor = (role: string) => {
    switch (role) {
      case "owner": return "bg-[#c47a4f]/20 text-[#c47a4f] border border-[#c47a4f]/30";
      case "admin": return "bg-[#c47a4f]/15 text-[#c47a4f]";
      case "manager": return "bg-blue-500/20 text-blue-400";
      case "client": return "bg-emerald-500/20 text-emerald-400";
      default: return "bg-zinc-700/50 text-zinc-400";
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white">Team</h1>
          <p className="text-sm text-zinc-500 font-mono mt-1">
            {members.length} member{members.length !== 1 ? "s" : ""}
          </p>
        </div>
        {canManage && (
          <button
            onClick={() => { setShowInviteModal(true); setError(""); }}
            className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors"
          >
            Invite Member
          </button>
        )}
      </div>

      {/* Team table */}
      <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3">
                Member
              </th>
              <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3 hidden sm:table-cell">
                Email
              </th>
              <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3">
                Role
              </th>
              <th className="text-left text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3 hidden md:table-cell">
                Joined
              </th>
              {canManage && (
                <th className="text-right text-xs font-mono text-zinc-500 uppercase tracking-wider px-5 py-3">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-600">
                  Loading...
                </td>
              </tr>
            ) : members.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-sm text-zinc-600">
                  No team members yet.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30 transition-colors">
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setShowProfileModal(m)}
                      className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
                    >
                      {m.profileImage ? (
                        <img src={m.profileImage} alt={m.name} className="w-10 h-10 rounded-full object-cover shrink-0" />
                      ) : (
                        <InitialsAvatar name={m.name} />
                      )}
                      <span className="text-sm text-zinc-200 font-medium">{m.name}</span>
                    </button>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-400 font-mono hidden sm:table-cell">
                    {m.email}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${roleBadgeColor(m.role)}`}>
                      {roleLabel(m.role)}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-zinc-500 font-mono hidden md:table-cell">
                    {new Date(m.createdAt).toLocaleDateString()}
                  </td>
                  {canManage && (
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {currentUser && m.id !== currentUser.userId && (
                          <button
                            onClick={() => { setMessageUserId(m.id); setShowMessages(true); }}
                            className="text-xs font-mono text-zinc-500 hover:text-[#c47a4f] transition-colors"
                          >
                            Message
                          </button>
                        )}
                        {canEditMember(m) && (
                          <button
                            onClick={() => openEdit(m)}
                            className="text-xs font-mono text-zinc-500 hover:text-[#c47a4f] transition-colors"
                          >
                            Edit
                          </button>
                        )}
                        {m.role !== "owner" && canEditMember(m) && (
                          <button
                            onClick={() => handleDelete(m)}
                            className="text-xs font-mono text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                        {currentUser?.role === "owner" && m.role !== "owner" && (
                          <button
                            onClick={() => handleTransferOwnership(m.id)}
                            className="text-xs font-mono text-zinc-600 hover:text-amber-400 transition-colors"
                          >
                            Transfer
                          </button>
                        )}
                      </div>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <Modal onClose={() => setShowInviteModal(false)} title="Invite Team Member">
          {error && <ErrorBox message={error} />}
          <div className="space-y-4">
            <Field label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} placeholder="Full name" />
            <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} placeholder="user@company.com" type="email" />
            <div>
              <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Role</label>
              <select
                value={form.role}
                onChange={(e) => setForm({ ...form, role: e.target.value })}
                className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
              >
                <option value="admin">Admin</option>
                <option value="manager">Manager</option>
                <option value="tech">Technician</option>
                <option value="client">Client</option>
              </select>
            </div>
            <Field label="Temporary Password" value={form.password} onChange={(v) => setForm({ ...form, password: v })} placeholder="Temp password for first login" />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setShowInviteModal(false)} className="text-sm font-mono text-zinc-400 hover:text-white px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button onClick={handleInvite} disabled={submitting} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
              {submitting ? "Inviting..." : "Send Invite"}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Modal */}
      {editingMember && (
        <Modal onClose={() => setEditingMember(null)} title={`Edit ${editingMember.name}`}>
          {error && <ErrorBox message={error} />}
          {/* Profile Picture Upload */}
          <div className="flex items-center gap-4 mb-4">
            {editForm.profileImage ? (
              <img src={editForm.profileImage} alt={editingMember.name} className="w-16 h-16 rounded-full object-cover" />
            ) : (
              <InitialsAvatar name={editingMember.name} size="lg" />
            )}
            <div>
              <label className="inline-flex items-center gap-2 text-xs font-mono text-[#c47a4f] hover:text-[#d89a6f] cursor-pointer border border-zinc-700 rounded-lg px-3 py-1.5 transition-colors">
                Upload Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    await handleProfileImageUpload(file, editingMember.id);
                    // Update local state immediately
                    const updatedMembers = await fetch("/api/users").then(r => r.json());
                    if (Array.isArray(updatedMembers)) {
                      const updated = updatedMembers.find((u: TeamMember) => u.id === editingMember.id);
                      if (updated) {
                        setEditForm(prev => ({ ...prev, profileImage: updated.profileImage || "" }));
                        setEditingMember(updated);
                      }
                    }
                    e.target.value = "";
                  }}
                />
              </label>
              {editForm.profileImage && (
                <button
                  onClick={async () => {
                    await fetch(`/api/users/${editingMember.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ profileImage: "" }),
                    });
                    setEditForm(prev => ({ ...prev, profileImage: "" }));
                    fetchMembers();
                  }}
                  className="text-xs font-mono text-zinc-600 hover:text-red-400 ml-2 transition-colors"
                >
                  Remove
                </button>
              )}
            </div>
          </div>
          <div className="space-y-4">
            <Field label="Name" value={editForm.name} onChange={(v) => setEditForm({ ...editForm, name: v })} />
            <Field label="Email" value={editForm.email} onChange={(v) => setEditForm({ ...editForm, email: v })} type="email" />
            <Field label="Phone" value={editForm.phone} onChange={(v) => setEditForm({ ...editForm, phone: v })} type="tel" />
            {canManage && currentUser?.userId !== editingMember.id && (
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                >
                  <option value="admin">Admin</option>
                  <option value="manager">Manager</option>
                  <option value="tech">Technician</option>
                  <option value="client">Client</option>
                </select>
              </div>
            )}
          </div>
          {/* Reset Password */}
          {canManage && currentUser?.userId !== editingMember.id && (
            <div className="border-t border-zinc-800 pt-4 mt-4">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-2">Reset Password</p>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={resetPassword}
                  onChange={(e) => setResetPassword(e.target.value)}
                  placeholder="New temporary password"
                  className="flex-1 bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
                />
                <button
                  onClick={async () => {
                    if (!resetPassword || !editingMember) return;
                    setSubmitting(true);
                    const res = await fetch(`/api/users/${editingMember.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ tempPassword: resetPassword }),
                    });
                    if (res.ok) {
                      // Send in-app notification
                      await fetch("/api/messages", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          toUserId: editingMember.id,
                          body: "Your password has been reset by an admin. Please log in with your new temporary password and change it.",
                        }),
                      });
                      setResetPassword("");
                      setResetSuccess(true);
                      setTimeout(() => setResetSuccess(false), 3000);
                    } else {
                      const data = await res.json();
                      setError(data.error || "Failed to reset password");
                    }
                    setSubmitting(false);
                  }}
                  disabled={submitting || !resetPassword}
                  className="bg-red-500/20 text-red-400 hover:bg-red-500/30 text-xs font-mono px-3 py-2 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                >
                  Reset
                </button>
              </div>
              {resetSuccess && (
                <p className="text-xs text-emerald-400 font-mono mt-1">Password reset. User notified via message.</p>
              )}
            </div>
          )}
          <div className="flex justify-end gap-3 mt-6">
            <button onClick={() => setEditingMember(null)} className="text-sm font-mono text-zinc-400 hover:text-white px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors">
              Cancel
            </button>
            <button onClick={handleEdit} disabled={submitting} className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50">
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </Modal>
      )}

      <MessagesDrawer
        open={showMessages}
        onClose={() => { setShowMessages(false); setMessageUserId(null); }}
        currentUserId={currentUser?.userId || ""}
        preSelectUserId={messageUserId}
      />

      {/* Profile Modal */}
      {showProfileModal && (
        <Modal onClose={() => setShowProfileModal(null)} title="Profile">
          <div className="flex flex-col items-center text-center mb-6">
            {showProfileModal.profileImage ? (
              <img src={showProfileModal.profileImage} alt={showProfileModal.name} className="w-16 h-16 rounded-full object-cover mb-3" />
            ) : (
              <div className="mb-3">
                <InitialsAvatar name={showProfileModal.name} size="lg" />
              </div>
            )}
            <h3 className="text-lg font-syne font-bold text-white">{showProfileModal.name}</h3>
            <span className={`text-xs font-mono px-2 py-1 rounded mt-2 ${roleBadgeColor(showProfileModal.role)}`}>
              {roleLabel(showProfileModal.role)}
            </span>
            {canEditMember(showProfileModal) && (
              <label className="mt-3 inline-flex items-center gap-2 text-xs font-mono text-[#c47a4f] hover:text-[#d89a6f] cursor-pointer border border-zinc-700 rounded-lg px-3 py-1.5 transition-colors">
                Change Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file || !showProfileModal) return;
                    await handleProfileImageUpload(file, showProfileModal.id);
                    const updatedMembers = await fetch("/api/users").then(r => r.json());
                    if (Array.isArray(updatedMembers)) {
                      const updated = updatedMembers.find((u: TeamMember) => u.id === showProfileModal.id);
                      if (updated) setShowProfileModal(updated);
                    }
                    e.target.value = "";
                  }}
                />
              </label>
            )}
          </div>
          <div className="space-y-3 text-sm">
            <ProfileRow label="Email" value={showProfileModal.email} />
            <ProfileRow label="Phone" value={showProfileModal.phone || "—"} />
            <ProfileRow label="Joined" value={new Date(showProfileModal.createdAt).toLocaleDateString()} />
          </div>
          <div className="flex justify-end gap-3 mt-6">
            {canEditMember(showProfileModal) && (
              <button
                onClick={() => {
                  openEdit(showProfileModal);
                  setShowProfileModal(null);
                }}
                className="text-sm font-mono text-[#c47a4f] hover:text-[#d89a6f] px-4 py-2 rounded-lg border border-[#c47a4f]/30 hover:border-[#c47a4f] transition-colors"
              >
                Edit Profile
              </button>
            )}
            <button onClick={() => setShowProfileModal(null)} className="text-sm font-mono text-zinc-400 hover:text-white px-4 py-2 rounded-lg border border-zinc-700 hover:border-zinc-500 transition-colors">
              Close
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Shared sub-components ──────────────────────────────────
function Modal({ onClose, title, children }: { onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0e0e0f] border border-zinc-800 rounded-xl p-6 w-full max-w-md shadow-2xl">
          <h2 className="text-lg font-syne font-bold text-white mb-4">{title}</h2>
          {children}
        </div>
      </div>
    </>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <div>
      <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
      />
    </div>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400">
      {message}
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-zinc-500 font-mono text-xs uppercase">{label}</span>
      <span className="text-zinc-300">{value}</span>
    </div>
  );
}
