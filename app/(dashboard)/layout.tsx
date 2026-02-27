import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-[1500px] gap-6 px-4 py-4">
      <Sidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
