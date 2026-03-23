import type { Metadata } from "next";
import "./globals.css";
import PortalSidebar from "@/components/PortalSidebar";

export const metadata: Metadata = {
  title: {
    default: "Precise Built CRM",
    template: "%s | Precise Built CRM",
  },
  description: "Project management and CRM for Precise Built Construction",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Inter:wght@400;500;600;700&family=Syne:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <div className="min-h-screen bg-zinc-900 text-zinc-100 font-syne">
          <PortalSidebar />
          <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
