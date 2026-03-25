"use client";

import { useEffect, useState } from "react";

interface SettingsData {
  companyName: string;
  companyPhone: string;
  companyEmail: string;
  companyAddress: string;
  logoUrl: string;
  accentColor: string;
  darkMode: boolean;
  inviteEmailSubject: string;
  inviteEmailBody: string;
  stageEmailSubject: string;
  stageEmailBody: string;
  driveConnected: boolean;
  sharedDriveId: string;
  bgImageUrl: string;
  bgImageOpacity: number;
  bgStyle: string;
  bgOverlayOpacity: number;
  bgBlurAmount: number;
  glassOpacity: number;
  glassBlur: number;
  glassBorderOpacity: number;
  hoverAccentGlow: boolean;
  mainBgColor: string;
  cardColor: string;
  sidebarColor: string;
}

const defaults: SettingsData = {
  companyName: "Precise Built Construction",
  companyPhone: "",
  companyEmail: "",
  companyAddress: "",
  logoUrl: "",
  accentColor: "#c47a4f",
  darkMode: true,
  inviteEmailSubject: "You've been invited to Precise Built Field OS",
  inviteEmailBody:
    "Hi {{name}}, your account has been created. Email: {{email}} Password: {{password}} Login at: {{loginUrl}}",
  stageEmailSubject: "Project stage updated",
  stageEmailBody: "Project {{project}} has moved to {{stage}}",
  driveConnected: false,
  sharedDriveId: "0AMK9dkBAqTzpUk9PVA",
  bgImageUrl: "",
  bgImageOpacity: 1.0,
  bgStyle: "solid",
  bgOverlayOpacity: 0.75,
  bgBlurAmount: 20,
  glassOpacity: 0.03,
  glassBlur: 12,
  glassBorderOpacity: 0.06,
  hoverAccentGlow: false,
  mainBgColor: "#0e0e0f",
  cardColor: "#161617",
  sidebarColor: "#111112",
};

const appearanceDefaults = {
  bgImageUrl: "",
  bgImageOpacity: 1.0,
  bgStyle: "solid",
  bgOverlayOpacity: 0.75,
  bgBlurAmount: 20,
  glassOpacity: 0.03,
  glassBlur: 12,
  glassBorderOpacity: 0.06,
  hoverAccentGlow: false,
  mainBgColor: "#0e0e0f",
  cardColor: "#161617",
  sidebarColor: "#111112",
  accentColor: "#c47a4f",
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsData>(defaults);
  const [loading, setLoading] = useState(true);
  const [savingSection, setSavingSection] = useState<string | null>(null);
  const [savedSection, setSavedSection] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string>("");
  const [uploadingBg, setUploadingBg] = useState(false);

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

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data?.role) setUserRole(data.role);
        else if (data?.user?.role) setUserRole(data.user.role);
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

  const handleBgUpload = async (file: File) => {
    setUploadingBg(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", "bg");
    const res = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });
    if (res.ok) {
      const data = await res.json();
      const url = data.url || "";
      setSettings((prev: SettingsData) => ({ ...prev, bgImageUrl: url }));
    }
    setUploadingBg(false);
  };

  const resetAppearanceDefaults = () => {
    setSettings((prev: SettingsData) => ({ ...prev, ...appearanceDefaults }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-zinc-500 font-mono text-sm">Loading...</div>
      </div>
    );
  }

  const isOwner = userRole === "owner";

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
            onChange={(v: string) => setSettings({ ...settings, companyName: v })}
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label="Phone"
              value={settings.companyPhone}
              onChange={(v: string) => setSettings({ ...settings, companyPhone: v })}
              type="tel"
            />
            <Field
              label="Email"
              value={settings.companyEmail}
              onChange={(v: string) => setSettings({ ...settings, companyEmail: v })}
              type="email"
            />
          </div>
          <Field
            label="Address"
            value={settings.companyAddress}
            onChange={(v: string) => setSettings({ ...settings, companyAddress: v })}
          />
          <Field
            label="Logo URL"
            value={settings.logoUrl}
            onChange={(v: string) => setSettings({ ...settings, logoUrl: v })}
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

      {/* Appearance — Owner Only */}
      <Section title="Appearance">
        {!isOwner ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono py-4">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Only the account owner can edit appearance.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Color Pickers */}
            <div className="space-y-4">
              <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">Colors</p>
              <ColorPicker
                label="Accent Color"
                value={settings.accentColor}
                onChange={(v: string) => setSettings({ ...settings, accentColor: v })}
              />
              <ColorPicker
                label="Main Background"
                value={settings.mainBgColor}
                onChange={(v: string) => setSettings({ ...settings, mainBgColor: v })}
              />
              <ColorPicker
                label="Card Color"
                value={settings.cardColor}
                onChange={(v: string) => setSettings({ ...settings, cardColor: v })}
              />
              <ColorPicker
                label="Sidebar Color"
                value={settings.sidebarColor}
                onChange={(v: string) => setSettings({ ...settings, sidebarColor: v })}
              />
            </div>

            {/* Glass Effect Sliders */}
            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">Glass Effect</p>
              <Slider
                label="Card Glass Opacity"
                value={settings.glassOpacity}
                min={0.01}
                max={0.15}
                step={0.01}
                onChange={(v: number) => setSettings({ ...settings, glassOpacity: v })}
                display={settings.glassOpacity.toFixed(2)}
              />
              <Slider
                label="Card Blur Intensity"
                value={settings.glassBlur}
                min={0}
                max={24}
                step={1}
                onChange={(v: number) => setSettings({ ...settings, glassBlur: v })}
                display={String(settings.glassBlur) + "px"}
              />
              <Slider
                label="Card Border Opacity"
                value={settings.glassBorderOpacity}
                min={0}
                max={0.2}
                step={0.01}
                onChange={(v: number) => setSettings({ ...settings, glassBorderOpacity: v })}
                display={settings.glassBorderOpacity.toFixed(2)}
              />
              <Toggle
                label="Hover Accent Glow"
                description="Add glow effect on card hover"
                checked={settings.hoverAccentGlow}
                onChange={() => setSettings({ ...settings, hoverAccentGlow: !settings.hoverAccentGlow })}
              />
            </div>

            {/* Background Controls */}
            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">Background</p>

              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
                  Background Image
                </label>
                <div className="flex items-center gap-3">
                  <label className="cursor-pointer bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-lg px-4 py-2 text-sm text-zinc-300 transition-colors">
                    {uploadingBg ? "Uploading..." : "Choose File"}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                        const f = e.target.files?.[0];
                        if (f) handleBgUpload(f);
                      }}
                    />
                  </label>
                  {settings.bgImageUrl && (
                    <span className="text-xs text-zinc-500 font-mono truncate max-w-[200px]">
                      {settings.bgImageUrl}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-2">
                  Background Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(["solid", "texture", "blurred", "overlay"] as const).map((style) => (
                    <button
                      key={style}
                      onClick={() => setSettings({ ...settings, bgStyle: style })}
                      className={`px-3 py-2 rounded-lg text-sm font-mono capitalize transition-colors border ${
                        settings.bgStyle === style
                          ? "bg-[#c47a4f] border-[#c47a4f] text-white"
                          : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {settings.bgImageUrl && settings.bgStyle !== "solid" && (
                <Slider
                  label="Background Image Opacity"
                  value={settings.bgImageOpacity}
                  min={0.1}
                  max={1.0}
                  step={0.05}
                  onChange={(v: number) => setSettings({ ...settings, bgImageOpacity: v })}
                  display={settings.bgImageOpacity.toFixed(2)}
                />
              )}
              {settings.bgStyle === "overlay" && (
                <Slider
                  label="Overlay Opacity"
                  value={settings.bgOverlayOpacity}
                  min={0.5}
                  max={0.95}
                  step={0.05}
                  onChange={(v: number) => setSettings({ ...settings, bgOverlayOpacity: v })}
                  display={settings.bgOverlayOpacity.toFixed(2)}
                />
              )}
              {settings.bgStyle === "blurred" && (
                <Slider
                  label="Background Blur"
                  value={settings.bgBlurAmount}
                  min={0}
                  max={40}
                  step={1}
                  onChange={(v: number) => setSettings({ ...settings, bgBlurAmount: v })}
                  display={String(settings.bgBlurAmount) + "px"}
                />
              )}
            </div>

            {/* Live Preview */}
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">Live Preview</p>
              <div
                className="relative rounded-xl overflow-hidden p-6 min-h-[120px]"
                style={{ background: settings.mainBgColor }}
              >
                {settings.bgImageUrl && settings.bgStyle !== "solid" && settings.bgStyle !== "blurred" && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${settings.bgImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      opacity: settings.bgImageOpacity,
                    }}
                  />
                )}
                {settings.bgStyle === "blurred" && settings.bgImageUrl && (
                  <div
                    className="absolute inset-0"
                    style={{
                      backgroundImage: `url(${settings.bgImageUrl})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      filter: `blur(${settings.bgBlurAmount}px)`,
                      transform: "scale(1.1)",
                      opacity: settings.bgImageOpacity,
                    }}
                  />
                )}
                {settings.bgStyle === "overlay" && (
                  <div
                    className="absolute inset-0 z-[1]"
                    style={{ background: `rgba(14,14,15,${settings.bgOverlayOpacity})` }}
                  />
                )}
                <div
                  className="relative z-10 rounded-xl p-4"
                  style={{
                    background: `rgba(255,255,255,${settings.glassOpacity})`,
                    backdropFilter: `blur(${settings.glassBlur}px)`,
                    WebkitBackdropFilter: `blur(${settings.glassBlur}px)`,
                    border: `1px solid rgba(255,255,255,${settings.glassBorderOpacity})`,
                  }}
                >
                  <p className="text-sm text-zinc-300 font-mono">Glass card preview</p>
                  <p className="text-xs text-zinc-500 mt-1">Adjust the sliders to see changes</p>
                </div>
              </div>
            </div>

            {/* Save + Reset */}
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  save("appearance", {
                    accentColor: settings.accentColor,
                    mainBgColor: settings.mainBgColor,
                    cardColor: settings.cardColor,
                    sidebarColor: settings.sidebarColor,
                    glassOpacity: settings.glassOpacity,
                    glassBlur: settings.glassBlur,
                    glassBorderOpacity: settings.glassBorderOpacity,
                    hoverAccentGlow: settings.hoverAccentGlow,
                    bgImageUrl: settings.bgImageUrl,
                    bgImageOpacity: settings.bgImageOpacity,
                    bgStyle: settings.bgStyle,
                    bgOverlayOpacity: settings.bgOverlayOpacity,
                    bgBlurAmount: settings.bgBlurAmount,
                  })
                }
                disabled={savingSection === "appearance"}
                className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingSection === "appearance" ? "Saving..." : "Save"}
              </button>
              <button
                onClick={resetAppearanceDefaults}
                className="border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Reset to Defaults
              </button>
              {savedSection === "appearance" && (
                <span className="text-xs font-mono text-emerald-400">Saved</span>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Integrations */}
      <Section title="Integrations">
        <div className="space-y-4">
          <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">Google Drive</p>
          <div className="flex items-center gap-3">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                settings.driveConnected ? "bg-emerald-500" : "bg-red-500"
              }`}
            />
            <span className="text-sm text-zinc-300">
              {settings.driveConnected ? "Connected" : "Not Connected"}
            </span>
          </div>
          {!settings.driveConnected ? (
            <a
              href="/api/auth/google-drive"
              className="inline-flex items-center gap-2 bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M7.71 3.5L1.15 15l3.43 5.96h6.86L7.71 3.5zm1.14 0l3.71 6.45H21l-3.71-6.45H8.85zm4.57 7.95L9.71 18.4l3.43 5.96L21.57 11.45h-8.15z" />
              </svg>
              Connect Google Drive
            </a>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-emerald-400 font-mono">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Connected
              </div>
              <Field
                label="Shared Drive ID"
                value={settings.sharedDriveId}
                onChange={(v: string) => setSettings({ ...settings, sharedDriveId: v })}
              />
              <div className="flex items-center gap-3">
                <SaveButton
                  section="integrations"
                  saving={savingSection === "integrations"}
                  saved={savedSection === "integrations"}
                  onClick={() =>
                    save("integrations", {
                      sharedDriveId: settings.sharedDriveId,
                    } as Partial<SettingsData>)
                  }
                />
                <button
                  onClick={async () => {
                    await save("integrations-disconnect", {
                      driveConnected: false,
                    } as Partial<SettingsData>);
                    setSettings((prev: SettingsData) => ({ ...prev, driveConnected: false }));
                  }}
                  className="border border-red-800 text-red-400 hover:text-red-300 hover:border-red-600 text-sm px-4 py-2 rounded-lg transition-colors"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>
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
              onChange={(v: string) => setSettings({ ...settings, inviteEmailSubject: v })}
            />
            <TextArea
              label="Body"
              value={settings.inviteEmailBody}
              onChange={(v: string) => setSettings({ ...settings, inviteEmailBody: v })}
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
              onChange={(v: string) => setSettings({ ...settings, stageEmailSubject: v })}
            />
            <TextArea
              label="Body"
              value={settings.stageEmailBody}
              onChange={(v: string) => setSettings({ ...settings, stageEmailBody: v })}
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
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 p-5">
      <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">{title}</h2>
      {children}
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
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
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
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => onChange(e.target.value)}
        rows={4}
        className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono focus:outline-none focus:ring-1 focus:ring-[#c47a4f] resize-y"
      />
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
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="w-10 h-10 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
        />
        <input
          type="text"
          value={value}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono w-32 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
        />
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  display,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  display: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">{label}</label>
        <span className="text-xs font-mono text-zinc-400">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-[#c47a4f]"
      />
    </div>
  );
}

function Toggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-zinc-300">{label}</p>
        <p className="text-xs text-zinc-600">{description}</p>
      </div>
      <button
        onClick={onChange}
        className={`w-12 h-6 rounded-full transition-colors relative ${
          checked ? "bg-[#c47a4f]" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
            checked ? "left-6" : "left-0.5"
          }`}
        />
      </button>
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
