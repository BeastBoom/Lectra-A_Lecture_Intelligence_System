// This layout intentionally renders NO AppShell.
// Landing and Login pages are fully standalone — no sidebar, no topnav.
export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
