"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { SALES_STAGES, OPS_STAGES } from "@/lib/stages";
import type { StageDefinition } from "@/lib/stages";

function StageLink({
  stage,
  pathname,
  collapsed,
}: {
  stage: StageDefinition;
  pathname: string;
  collapsed: boolean;
}) {
  const isActive = pathname === `/projects?stage=${stage.key}`;
  return (
    <Link
      href={`/projects?stage=${stage.key}`}
      title={stage.shortLabel}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs transition-colors ${
        isActive
          ? "bg-white/10 text-white"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${stage.color} shrink-0`} />
      {!collapsed && <span className="truncate">{stage.shortLabel}</span>}
    </Link>
  );
}

export default function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(false);
  const [salesOpen, setSalesOpen] = useState(true);
  const [opsOpen, setOpsOpen] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed");
    if (saved === "true") setCollapsed(true);
  }, []);

  useEffect(() => {
    localStorage.setItem("sidebar-collapsed", String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.role) setUserRole(data.user.role);
      })
      .catch(() => {});
  }, []);

  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  const canSeeTeam =
    userRole === "owner" || userRole === "admin" || userRole === "manager";
  const canSeeArchive = userRole === "owner" || userRole === "admin";

  const sidebarWidth = collapsed ? "w-16" : "w-60";

  const navItem = (
    href: string,
    label: string,
    icon: React.ReactNode
  ) => (
    <Link
      href={href}
      onClick={() => setMobileOpen(false)}
      title={label}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive(href)
          ? "bg-brand-500/15 text-brand-400"
          : "text-zinc-400 hover:text-white hover:bg-white/5"
      }`}
    >
      {icon}
      {!collapsed && <span>{label}</span>}
    </Link>
  );

  const sectionToggle = (
    label: string,
    open: boolean,
    toggle: () => void,
    icon: React.ReactNode
  ) => (
    <button
      onClick={toggle}
      title={label}
      className="flex items-center gap-3 px-3 py-2 w-full text-left text-[10px] font-mono text-zinc-600 uppercase tracking-widest hover:text-zinc-400 transition-colors"
    >
      {icon}
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          <svg
            className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </>
      )}
    </button>
  );

  const sidebar = (
    <div className="flex flex-col h-full bg-[var(--color-sidebar,#111112)] border-r border-zinc-800/50">
      {/* Logo + collapse toggle */}
      <div className="bg-black/30 px-3 py-3 flex items-center justify-between">
        <Link href="/dashboard" className={collapsed ? "mx-auto" : "flex-1 flex justify-center"}>
          {collapsed ? (
            <Image
              src="/PRECISE_BUILT logo.png"
              alt="PB"
              width={32}
              height={32}
              className="brightness-0 invert opacity-90 h-12 w-12 object-contain"
            />
          ) : (
            <Image
              src="/PRECISE_BUILT logo.png"
              alt="Precise Built"
              width={240}
              height={56}
              className="brightness-0 invert opacity-90 w-full h-[72px] object-contain"
            />
          )}
        </Link>
        {!collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 text-zinc-500 hover:text-white transition-colors shrink-0"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
            </svg>
          </button>
        )}
        {collapsed && (
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 text-zinc-500 hover:text-white transition-colors absolute right-0 top-3"
            aria-label="Toggle sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
            </svg>
          </button>
        )}
      </div>

      {/* Main nav */}
      <nav className="px-2 mt-2 space-y-1">
        {navItem(
          "/dashboard",
          "Dashboard",
          <DashboardIcon active={isActive("/dashboard")} />
        )}
      </nav>

      {/* Sales section */}
      <div className="px-2 mt-4">
        {sectionToggle("Sales", salesOpen, () => setSalesOpen(!salesOpen), (
          <SalesIcon />
        ))}
        {salesOpen && (
          <div className="space-y-0.5 mt-1 ml-1">
            {SALES_STAGES.map((s) => (
              <StageLink
                key={s.key}
                stage={s}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>

      {/* Operations section */}
      <div className="px-2 mt-3">
        {sectionToggle("Operations", opsOpen, () => setOpsOpen(!opsOpen), (
          <OpsIcon />
        ))}
        {opsOpen && (
          <div className="space-y-0.5 mt-1 ml-1">
            {OPS_STAGES.map((s) => (
              <StageLink
                key={s.key}
                stage={s}
                pathname={pathname}
                collapsed={collapsed}
              />
            ))}
          </div>
        )}
      </div>

      {/* Archived */}
      {canSeeArchive && (
        <div className="px-2 mt-3">
          {navItem(
            "/projects?archived=true",
            "Archived",
            <ArchiveIcon active={isActive("/projects?archived=true")} />
          )}
        </div>
      )}

      <div className="flex-1" />

      {/* Bottom nav */}
      <div className="px-2 space-y-1 mb-2">
        <div className="border-t border-zinc-800/50 my-2" />

        {navItem(
          "/clients",
          "Clients",
          <ClientsIcon active={isActive("/clients")} />
        )}

        {canSeeTeam &&
          navItem(
            "/settings/team",
            "Team",
            <TeamIcon active={isActive("/settings/team")} />
          )}

        {navItem(
          "/settings",
          "Settings",
          <SettingsIcon active={isActive("/settings") && !isActive("/settings/team")} />
        )}

        <div className="border-t border-zinc-800/50 my-2" />

        <button
          onClick={handleLogout}
          title="Sign Out"
          className="flex items-center gap-3 w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          <LogoutIcon />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 z-40 transition-all duration-200 ${sidebarWidth}`}
      >
        {sidebar}
      </aside>

      {/* Mobile header bar */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-zinc-950 border-b border-zinc-800/50 flex items-center justify-between px-4 h-14">
        <Link href="/dashboard">
          <Image
            src="/PRECISE_BUILT logo.png"
            alt="Precise Built"
            width={160}
            height={45}
            className="h-6 w-auto brightness-0 invert opacity-90"
          />
        </Link>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-zinc-400"
          aria-label="Toggle menu"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {mobileOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile slide-out */}
      {mobileOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/60"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="lg:hidden fixed inset-y-0 left-0 z-50 w-64">
            {sidebar}
          </aside>
        </>
      )}
    </>
  );
}

// ─── Icons ──────────────────────────────────────────────────
function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${active ? "text-brand-400" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  );
}

function SalesIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );
}

function OpsIcon() {
  return (
    <svg className="w-4 h-4 shrink-0 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
    </svg>
  );
}

function ClientsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${active ? "text-brand-400" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
    </svg>
  );
}

function TeamIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${active ? "text-brand-400" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${active ? "text-brand-400" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ArchiveIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 shrink-0 ${active ? "text-brand-400" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg className="w-5 h-5 shrink-0 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
  );
}
