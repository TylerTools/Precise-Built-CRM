"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { SALES_STAGES, OPS_STAGES } from "@/lib/stages";
import type { StageDefinition } from "@/lib/stages";

const mainLinks = [
  { href: "/dashboard", label: "Dashboard", icon: DashboardIcon },
  { href: "/projects", label: "Projects", icon: ProjectsIcon },
];

function StageLink({ stage, pathname }: { stage: StageDefinition; pathname: string }) {
  const isActive = pathname === `/projects?stage=${stage.key}`;
  return (
    <Link
      href={`/projects?stage=${stage.key}`}
      className={`flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-mono transition-colors ${
        isActive
          ? "bg-white/10 text-white"
          : "text-zinc-500 hover:text-zinc-300 hover:bg-white/5"
      }`}
    >
      <span className={`w-2 h-2 rounded-full ${stage.color} shrink-0`} />
      <span className="font-mono text-[11px] text-zinc-600 w-5">{stage.key}</span>
      <span className="truncate">{stage.shortLabel}</span>
    </Link>
  );
}

export default function PortalSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Don't render sidebar on login page
  if (pathname === "/login") return null;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  const sidebar = (
    <div className="flex flex-col h-full bg-zinc-950 border-r border-zinc-800/50">
      {/* Logo */}
      <div className="p-4 pb-2">
        <Link href="/dashboard">
          <Image
            src="/PRECISE_BUILT logo.png"
            alt="Precise Built"
            width={200}
            height={56}
            className="h-8 w-auto brightness-0 invert opacity-90"
          />
        </Link>
        <p className="text-[10px] font-mono text-zinc-600 mt-1 tracking-wider uppercase">
          Pro Portal
        </p>
      </div>

      {/* Main nav */}
      <nav className="px-3 mt-4 space-y-1">
        {mainLinks.map((link) => {
          const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
          return (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-brand-500/15 text-brand-400"
                  : "text-zinc-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <link.icon active={isActive} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Stage pipeline */}
      <div className="px-3 mt-6 flex-1 overflow-y-auto">
        <p className="px-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
          Sales Pipeline
        </p>
        <div className="space-y-0.5 mb-5">
          {SALES_STAGES.map((s) => (
            <StageLink key={s.key} stage={s} pathname={pathname} />
          ))}
        </div>

        <div className="border-t border-zinc-800/50 my-3" />

        <p className="px-3 text-[10px] font-mono text-zinc-600 uppercase tracking-widest mb-2">
          Operations
        </p>
        <div className="space-y-0.5">
          {OPS_STAGES.map((s) => (
            <StageLink key={s.key} stage={s} pathname={pathname} />
          ))}
        </div>
      </div>

      {/* Bottom */}
      <div className="p-3 border-t border-zinc-800/50">
        <button
          onClick={handleLogout}
          className="w-full text-left px-3 py-2 rounded-lg text-sm text-zinc-500 hover:text-white hover:bg-white/5 transition-colors"
        >
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:w-60 lg:flex-col lg:fixed lg:inset-y-0 z-40">
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

function DashboardIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-brand-400" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-4 0a1 1 0 01-1-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 01-1 1h-2z" />
    </svg>
  );
}

function ProjectsIcon({ active }: { active: boolean }) {
  return (
    <svg className={`w-5 h-5 ${active ? "text-brand-400" : "text-zinc-500"}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}
