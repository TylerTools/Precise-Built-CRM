import PortalSidebar from "@/components/PortalSidebar";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PortalSidebar />
      <main className="lg:pl-60 pt-14 lg:pt-0 min-h-screen">{children}</main>
    </>
  );
}
