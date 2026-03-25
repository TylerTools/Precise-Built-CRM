"use client";

import { useState, useEffect } from "react";
import PortalSidebar from "@/components/PortalSidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const check = () => {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "true");
    };
    check();
    window.addEventListener("storage", check);
    const interval = setInterval(check, 200);
    return () => {
      window.removeEventListener("storage", check);
      clearInterval(interval);
    };
  }, []);

  // Load color settings and apply as CSS variables
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          const root = document.documentElement;
          if (data.mainBgColor) root.style.setProperty("--color-bg", data.mainBgColor);
          if (data.cardColor) root.style.setProperty("--color-card", data.cardColor);
          if (data.sidebarColor) root.style.setProperty("--color-sidebar", data.sidebarColor);
          if (data.accentColor) root.style.setProperty("--color-accent", data.accentColor);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <>
      <PortalSidebar />
      <main
        className={`pt-14 lg:pt-0 min-h-screen transition-all duration-200 ${
          collapsed ? "lg:pl-16" : "lg:pl-60"
        }`}
        style={{ backgroundColor: "var(--color-bg)" }}
      >
        {children}
      </main>
    </>
  );
}
