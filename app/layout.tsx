import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'CreditOS – AI-Powered Credit Intelligence',
  description: 'Institutional-grade credit intelligence for professional investors.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
