"use client";

import { useState, useEffect } from "react";
import PortalSidebar from "@/components/PortalSidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [bgStyle, setBgStyle] = useState("solid");

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

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data && !data.error) {
          const root = document.documentElement;
          if (data.glassOpacity !== undefined)
            root.style.setProperty("--glass-opacity", String(data.glassOpacity));
          if (data.glassBlur !== undefined)
            root.style.setProperty("--glass-blur", data.glassBlur + "px");
          if (data.glassBorderOpacity !== undefined)
            root.style.setProperty("--glass-border-opacity", String(data.glassBorderOpacity));
          if (data.bgImageUrl)
            root.style.setProperty("--bg-image", `url(${data.bgImageUrl})`);
          if (data.bgOverlayOpacity !== undefined)
            root.style.setProperty("--bg-overlay-opacity", String(data.bgOverlayOpacity));
          if (data.bgBlurAmount !== undefined)
            root.style.setProperty("--bg-blur", data.bgBlurAmount + "px");
          if (data.accentColor)
            root.style.setProperty("--color-accent", data.accentColor);
          root.style.setProperty("--color-bg", data.mainBgColor || "#0e0e0f");
          root.style.setProperty("--color-card", data.cardColor || "#161617");
          root.style.setProperty("--color-sidebar", data.sidebarColor || "#111112");
          if (data.bgStyle) setBgStyle(data.bgStyle);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div className={`bg-style-${bgStyle}`}>
      <PortalSidebar />
      <main
        className={`pt-14 lg:pt-0 min-h-screen transition-all duration-200 relative z-[2] ${
          collapsed ? "lg:pl-16" : "lg:pl-60"
        }`}
      >
        {children}
      </main>
    </div>
  );
}
