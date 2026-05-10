import type { Metadata } from 'next';
import './globals.css';
import LayoutShell from '@/components/LayoutShell';

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Mission Control',
  description: 'Mission Control — AI workspace dashboard',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body style={{ backgroundColor: 'rgb(13, 13, 26)', color: 'white', margin: 0 }}>
        <LayoutShell>{children}</LayoutShell>
      </body>
    </html>
  );
}
