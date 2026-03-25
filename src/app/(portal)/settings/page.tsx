"use client";

import { useEffect, useState } from "react";

interface SettingsData {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  logoUrl: string;
  accentColor: string;
  mainBgColor: string;
  cardColor: string;
  sidebarColor: string;
  darkMode: boolean;
  inviteEmailSubject: string;
  inviteEmailBody: string;
  stageEmailSubject: string;
  stageEmailBody: string;
}

const defaults: SettingsData = {
  companyName: "Precise Built Construction",
  companyPhone: "",
  companyEmail: "",
  companyAddress: "",
  logoUrl: "",
  accentColor: "#c47a4f",
  mainBgColor: "#0e0e0f",
  cardColor: "#161617",
  sidebarColor: "#111112",
  darkMode: true,
  inviteEmailSubject: "You've been invited to Precise Built Field OS",
  inviteEmailBody: "Hi {{name}}, your account has been created. Email: {{email}} Password: {{password}} Login at: {{loginUrl}}",
  stageEmailSubject: "Project stage updated",
  stageEmailBody: "Project {{project}} has moved to {{stage}}",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(defaults);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [lastBackup, setLastBackup] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          setSettings({ ...defaults, ...data });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));

    fetch("/api/settings/backup")
      .then((r) => r.json())
      .then((data) => {
        if (data.lastBackup?.backedUpAt) {
          setLastBackup(data.lastBackup.backedUpAt);
        }
      })
      .catch(() => {});
  }, []);

  const save = async (section: string, data: Partial<SettingsData>) => {
    setSavingSection(section);
    setSavedSection(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (res.ok) {
      const updated = await res.json();
      setSettings({ ...defaults, ...updated });
      setSavedSection(section);
      setTimeout(() => setSavedSection(null), 2000);
    }
    setSavingSection(null);
  };

  const handleBackupNow = async () => {
    setBackingUp(true);
    const res = await fetch("/api/settings/backup", { method: "POST" });
    if (res.ok) {
      const data = await res.json();
      setLastBackup(data.backedUpAt);
    }
    setBackingUp(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500 font-mono text-sm">Loading...</div>
      </div>
    );
  }

  return (
    <div className="p-4 lg:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-syne font-bold text-white">Settings</h1>
        <p className="text-sm text-zinc-500 font-mono mt-1">Manage your workspace</p>
      </div>

      {/* Company Profile */}
      <Section title="Company Profile">
        <div className="space-y-4">
          <Field
            label="Company Name"
            value={settings.companyName}
            onChange={(v) => setSettings({ ...settings, companyName: v })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Phone"
              value={settings.companyPhone}
              onChange={(v) => setSettings({ ...settings, companyPhone: v })}
              type="tel"
            />
            <Field
              label="Email"
              value={settings.companyEmail}
              onChange={(v) => setSettings({ ...settings, companyEmail: v })}
              type="email"
            />
          </div>
          <Field
            label="Address"
            value={settings.companyAddress}
            onChange={(v) => setSettings({ ...settings, companyAddress: v })}
          />
          <Field
            label="Logo URL"
            value={settings.logoUrl}
            onChange={(v) => setSettings({ ...settings, logoUrl: v })}
            placeholder="Upload via Vercel Blob or paste URL"
          />
        </div>
        <SaveButton
          section="company"
          saving={savingSection === "company"}
          saved={savedSection === "company"}
          onClick={() =>
            save("company", {
              companyName: settings.companyName,
              companyPhone: settings.companyPhone,
              companyEmail: settings.companyEmail,
              companyAddress: settings.companyAddress,
              logoUrl: settings.logoUrl,
            })
          }
        />
      </Section>

      {/* Appearance */}
      <Section title="Appearance">
        <div className="space-y-4">
          <ColorPicker
            label="Accent Color"
            value={settings.accentColor}
            onChange={(v) => setSettings({ ...settings, accentColor: v })}
          />
          <ColorPicker
            label="Main Background"
            value={settings.mainBgColor}
            onChange={(v) => setSettings({ ...settings, mainBgColor: v })}
          />
          <ColorPicker
            label="Card / Surface"
            value={settings.cardColor}
            onChange={(v) => setSettings({ ...settings, cardColor: v })}
          />
          <ColorPicker
            label="Sidebar"
            value={settings.sidebarColor}
            onChange={(v) => setSettings({ ...settings, sidebarColor: v })}
          />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Dark Mode</p>
              <p className="text-xs text-zinc-600">Default theme for the portal</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, darkMode: !settings.darkMode })}
              className={`w-12 h-6 rounded-full transition-colors relative ${
                settings.darkMode ? "bg-[#c47a4f]" : "bg-zinc-700"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  settings.darkMode ? "left-6" : "left-0.5"
                }`}
              />
            </button>
          </div>
        </div>
        <SaveButton
          section="appearance"
          saving={savingSection === "appearance"}
          saved={savedSection === "appearance"}
          onClick={() =>
            save("appearance", {
              accentColor: settings.accentColor,
              mainBgColor: settings.mainBgColor,
              cardColor: settings.cardColor,
              sidebarColor: settings.sidebarColor,
              darkMode: settings.darkMode,
            })
          }
        />
      </Section>

      {/* Email Templates */}
      <Section title="Email Templates">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">
              Welcome / Invite Email
            </p>
            <p className="text-[10px] text-zinc-600 font-mono">
              Variables: {"{{name}}"}, {"{{email}}"}, {"{{password}}"}, {"{{loginUrl}}"}
            </p>
            <Field
              label="Subject"
              value={settings.inviteEmailSubject}
              onChange={(v) => setSettings({ ...settings, inviteEmailSubject: v })}
            />
            <TextArea
              label="Body"
              value={settings.inviteEmailBody}
              onChange={(v) => setSettings({ ...settings, inviteEmailBody: v })}
            />
          </div>
          <div className="border-t border-zinc-800 pt-4 space-y-3">
            <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">
              Stage Advance Notification
            </p>
            <p className="text-[10px] text-zinc-600 font-mono">
              Variables: {"{{project}}"}, {"{{stage}}"}
            </p>
            <Field
              label="Subject"
              value={settings.stageEmailSubject}
              onChange={(v) => setSettings({ ...settings, stageEmailSubject: v })}
            />
            <TextArea
              label="Body"
              value={settings.stageEmailBody}
              onChange={(v) => setSettings({ ...settings, stageEmailBody: v })}
            />
          </div>
        </div>
        <SaveButton
          section="email"
          saving={savingSection === "email"}
          saved={savedSection === "email"}
          onClick={() =>
            save("email", {
              inviteEmailSubject: settings.inviteEmailSubject,
              inviteEmailBody: settings.inviteEmailBody,
              stageEmailSubject: settings.stageEmailSubject,
              stageEmailBody: settings.stageEmailBody,
            })
          }
        />
      </Section>

      {/* Backup */}
      <Section title="Settings Backup">
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Settings are automatically backed up every 30 days. Manual backups also save to Google Drive if connected.
          </p>
          {lastBackup && (
            <p className="text-xs font-mono text-zinc-500">
              Last backup: {new Date(lastBackup).toLocaleString()}
            </p>
          )}
          {!lastBackup && (
            <p className="text-xs font-mono text-zinc-600">No backups yet</p>
          )}
        </div>
        <div className="mt-4">
          <button
            onClick={handleBackupNow}
            disabled={backingUp}
            className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
          >
            {backingUp ? "Backing up..." : "Backup Now"}
          </button>
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card p-5">
      <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">{title}</h2>
      {children}
    </div>
  );
}

function ColorPicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
        {label}
      </label>
      <div className="flex items-center gap-3">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono w-32 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y"
      />
    </div>
  );
}

function SaveButton({
  section,
  saving,
  saved,
  onClick,
}: {
  section: string;
  saving: boolean;
  saved: boolean;
  onClick: () => void;
}) {
  return (
    <div className="flex items-center gap-3 mt-4">
      <button
        onClick={onClick}
        disabled={saving}
        className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save"}
      </button>
      {saved && (
        <span className="text-xs font-mono text-emerald-400">Saved</span>
      )}
    </div>
  );
}
