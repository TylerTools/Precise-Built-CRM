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
    // Poll for same-tab changes
    const interval = setInterval(check, 200);
    return () => {
      window.removeEventListener("storage", check);
      clearInterval(interval);
    };
  }, []);

  return (
    <>
      <PortalSidebar />
      <main
        className={`pt-14 lg:pt-0 min-h-screen transition-all duration-200 ${
          collapsed ? "lg:pl-16" : "lg:pl-60"
        }`}
      >
        {children}
      </main>
    </>
  );
}
