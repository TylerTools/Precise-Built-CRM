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
  bgImageUrl: string;
  bgStyle: string;
  bgOverlayOpacity: number;
  bgBlurAmount: number;
  glassOpacity: number;
  glassBlur: number;
  glassBorderOpacity: number;
  hoverAccentGlow: boolean;
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
  bgImageUrl: "",
  bgStyle: "solid",
  bgOverlayOpacity: 0.75,
  bgBlurAmount: 20,
  glassOpacity: 0.03,
  glassBlur: 12,
  glassBorderOpacity: 0.06,
  hoverAccentGlow: false,
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
      const url = data.url || data.blobUrl || "";
      setSettings((s: SettingsData) => ({ ...s, bgImageUrl: url }));
    }
    setUploadingBg(false);
  };

  const resetAppearanceDefaults = () => {
    setSettings((s: SettingsData) => ({
      ...s,
      bgImageUrl: "",
      bgStyle: "solid",
      bgOverlayOpacity: 0.75,
      bgBlurAmount: 20,
      glassOpacity: 0.03,
      glassBlur: 12,
      glassBorderOpacity: 0.06,
      hoverAccentGlow: false,
    }));
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
        <p className="text-sm text-zinc-500 font-mono mt-1">
          Manage your workspace
        </p>
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
          <div>
            <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-1">
              Accent Color
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.accentColor}
                onChange={(e) =>
                  setSettings({ ...settings, accentColor: e.target.value })
                }
                className="w-10 h-10 rounded-lg border border-zinc-700 bg-transparent cursor-pointer"
              />
              <input
                type="text"
                value={settings.accentColor}
                onChange={(e) =>
                  setSettings({ ...settings, accentColor: e.target.value })
                }
                className="bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 font-mono w-32 focus:outline-none focus:ring-1 focus:ring-[#c47a4f]"
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-zinc-300">Dark Mode</p>
              <p className="text-xs text-zinc-600">
                Default theme for the portal
              </p>
            </div>
            <button
              onClick={() =>
                setSettings({ ...settings, darkMode: !settings.darkMode })
              }
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
              darkMode: settings.darkMode,
            })
          }
        />
      </Section>

      {/* Glass & Background — Owner Only */}
      <Section title="Glass & Background">
        {!isOwner ? (
          <div className="flex items-center gap-2 text-zinc-500 text-sm font-mono py-4">
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
            Only the account owner can modify glass and background settings.
          </div>
        ) : (
          <div className="space-y-6">
            {/* Glass Controls */}
            <div className="space-y-4">
              <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">
                Glass Effect
              </p>
              <Slider
                label="Glass Opacity"
                value={settings.glassOpacity}
                min={0}
                max={0.3}
                step={0.01}
                onChange={(v) => setSettings({ ...settings, glassOpacity: v })}
                displayValue={settings.glassOpacity.toFixed(2)}
              />
              <Slider
                label="Glass Blur (px)"
                value={settings.glassBlur}
                min={0}
                max={40}
                step={1}
                onChange={(v) => setSettings({ ...settings, glassBlur: v })}
                displayValue={String(settings.glassBlur)}
              />
              <Slider
                label="Glass Border Opacity"
                value={settings.glassBorderOpacity}
                min={0}
                max={0.3}
                step={0.01}
                onChange={(v) =>
                  setSettings({ ...settings, glassBorderOpacity: v })
                }
                displayValue={settings.glassBorderOpacity.toFixed(2)}
              />
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-zinc-300">Hover Accent Glow</p>
                  <p className="text-xs text-zinc-600">
                    Add glow effect on card hover
                  </p>
                </div>
                <button
                  onClick={() =>
                    setSettings({
                      ...settings,
                      hoverAccentGlow: !settings.hoverAccentGlow,
                    })
                  }
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    settings.hoverAccentGlow ? "bg-[#c47a4f]" : "bg-zinc-700"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.hoverAccentGlow ? "left-6" : "left-0.5"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Background Controls */}
            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">
                Background
              </p>

              {/* Background Image Upload */}
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
                      onChange={(e) => {
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

              {/* Background Style Selector */}
              <div>
                <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider block mb-2">
                  Background Style
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {(
                    ["solid", "texture", "blurred", "overlay"] as const
                  ).map((style) => (
                    <button
                      key={style}
                      onClick={() =>
                        setSettings({ ...settings, bgStyle: style })
                      }
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

              {/* Conditional sliders */}
              {settings.bgStyle === "overlay" && (
                <Slider
                  label="Overlay Opacity"
                  value={settings.bgOverlayOpacity}
                  min={0}
                  max={1}
                  step={0.05}
                  onChange={(v) =>
                    setSettings({ ...settings, bgOverlayOpacity: v })
                  }
                  displayValue={settings.bgOverlayOpacity.toFixed(2)}
                />
              )}
              {settings.bgStyle === "blurred" && (
                <Slider
                  label="Blur Amount (px)"
                  value={settings.bgBlurAmount}
                  min={0}
                  max={60}
                  step={1}
                  onChange={(v) =>
                    setSettings({ ...settings, bgBlurAmount: v })
                  }
                  displayValue={String(settings.bgBlurAmount)}
                />
              )}
            </div>

            {/* Live Preview */}
            <div className="border-t border-zinc-800 pt-4">
              <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-3">
                Live Preview
              </p>
              <div
                className="relative rounded-xl overflow-hidden p-6 min-h-[120px]"
                style={{
                  background: settings.bgImageUrl
                    ? `url(${settings.bgImageUrl}) center/cover`
                    : "#1a1a1d",
                }}
              >
                {settings.bgStyle === "overlay" && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: `rgba(14,14,15,${settings.bgOverlayOpacity})`,
                    }}
                  />
                )}
                {settings.bgStyle === "blurred" && (
                  <div
                    className="absolute inset-0"
                    style={{
                      background: settings.bgImageUrl
                        ? `url(${settings.bgImageUrl}) center/cover`
                        : "#1a1a1d",
                      filter: `blur(${settings.bgBlurAmount}px)`,
                      transform: "scale(1.1)",
                    }}
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
                  <p className="text-sm text-zinc-300 font-mono">
                    Glass card preview
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">
                    Adjust the sliders to see changes
                  </p>
                </div>
              </div>
            </div>

            {/* Save + Reset */}
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={() =>
                  save("glass-bg", {
                    bgImageUrl: settings.bgImageUrl,
                    bgStyle: settings.bgStyle,
                    bgOverlayOpacity: settings.bgOverlayOpacity,
                    bgBlurAmount: settings.bgBlurAmount,
                    glassOpacity: settings.glassOpacity,
                    glassBlur: settings.glassBlur,
                    glassBorderOpacity: settings.glassBorderOpacity,
                    hoverAccentGlow: settings.hoverAccentGlow,
                  })
                }
                disabled={savingSection === "glass-bg"}
                className="bg-[#c47a4f] hover:bg-[#b06a3f] text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors disabled:opacity-50"
              >
                {savingSection === "glass-bg" ? "Saving..." : "Save"}
              </button>
              <button
                onClick={resetAppearanceDefaults}
                className="border border-zinc-700 text-zinc-400 hover:text-zinc-200 hover:border-zinc-500 text-sm px-4 py-2 rounded-lg transition-colors"
              >
                Reset to Defaults
              </button>
              {savedSection === "glass-bg" && (
                <span className="text-xs font-mono text-emerald-400">
                  Saved
                </span>
              )}
            </div>
          </div>
        )}
      </Section>

      {/* Email Templates */}
      <Section title="Email Templates">
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-mono text-[#c47a4f] uppercase tracking-wider">
              Welcome / Invite Email
            </p>
            <p className="text-[10px] text-zinc-600 font-mono">
              Variables: {"{{name}}"}, {"{{email}}"}, {"{{password}}"},{" "}
              {"{{loginUrl}}"}
            </p>
            <Field
              label="Subject"
              value={settings.inviteEmailSubject}
              onChange={(v) =>
                setSettings({ ...settings, inviteEmailSubject: v })
              }
            />
            <TextArea
              label="Body"
              value={settings.inviteEmailBody}
              onChange={(v) =>
                setSettings({ ...settings, inviteEmailBody: v })
              }
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
              onChange={(v) =>
                setSettings({ ...settings, stageEmailSubject: v })
              }
            />
            <TextArea
              label="Body"
              value={settings.stageEmailBody}
              onChange={(v) =>
                setSettings({ ...settings, stageEmailBody: v })
              }
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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-800 p-5">
      <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-wider mb-4">
        {title}
      </h2>
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

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  displayValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  displayValue: string;
}) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
          {label}
        </label>
        <span className="text-xs font-mono text-zinc-400">{displayValue}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-zinc-700 rounded-full appearance-none cursor-pointer accent-[#c47a4f]"
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
