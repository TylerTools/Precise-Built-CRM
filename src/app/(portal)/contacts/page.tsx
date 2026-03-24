"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface Contact {
  id: string;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: string;
  createdAt: string;
  _count: { projects: number };
}

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/contacts")
      .then((r) => r.json())
      .then((data) => {
        setContacts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = contacts.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  const statusColors: Record<string, string> = {
    new: "text-blue-400 bg-blue-500/10 border-blue-500/20",
    active: "text-green-400 bg-green-500/10 border-green-500/20",
    inactive: "text-zinc-400 bg-zinc-500/10 border-zinc-500/20",
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500 font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-syne font-bold text-white">Contacts</h1>
          <p className="text-sm text-zinc-500 font-mono">
            {contacts.length} contact{contacts.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full max-w-md rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-brand-500 focus:border-brand-500"
        />
      </div>

      {/* Contact list */}
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-zinc-500 mb-2">
            {search ? "No contacts match your search." : "No contacts yet."}
          </p>
          <p className="text-sm text-zinc-600">
            Contacts are created when you add a new lead.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((contact) => (
            <Link
              key={contact.id}
              href={`/contacts/${contact.id}`}
              className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 rounded-xl border border-zinc-800/80 p-4 hover:border-zinc-700 transition-colors group"
              style={{ backgroundColor: "#161617" }}
            >
              {/* Avatar + name */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-9 h-9 rounded-full bg-brand-500/15 flex items-center justify-center shrink-0">
                  <span className="text-sm font-syne font-bold text-brand-400">
                    {contact.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-zinc-200 truncate group-hover:text-white">
                    {contact.name}
                  </h3>
                  <p className="text-xs text-zinc-500 truncate">
                    {contact.email || contact.phone}
                  </p>
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center gap-4 text-xs sm:shrink-0 pl-12 sm:pl-0">
                <span
                  className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${
                    statusColors[contact.status] || statusColors.inactive
                  }`}
                >
                  {contact.status}
                </span>
                <span className="text-zinc-500 font-mono">
                  {contact._count.projects} project
                  {contact._count.projects !== 1 ? "s" : ""}
                </span>
                <span className="text-zinc-600 font-mono">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
