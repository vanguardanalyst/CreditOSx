'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AlertTriangle, BarChart3, FolderUp, Settings, Wallet } from 'lucide-react';
import clsx from 'clsx';

const links = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/upload', label: 'Upload Transcript', icon: FolderUp },
  { href: '/portfolio', label: 'Portfolio Tracker', icon: Wallet },
  { href: '/alerts', label: 'Risk Alerts', icon: AlertTriangle },
  { href: '/settings', label: 'Settings', icon: Settings }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="panel sticky top-4 h-[calc(100vh-2rem)] w-64 rounded-xl p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-mutedBlue">CreditOS</p>
      <nav className="mt-6 space-y-2">
        {links.map((link) => {
          const ActiveIcon = link.icon;
          const active = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={clsx(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition',
                active ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/70 hover:text-white'
              )}
            >
              <ActiveIcon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
