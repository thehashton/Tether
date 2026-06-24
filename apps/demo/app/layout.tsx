import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'tether-ws demo',
  description: 'Live demo of tether-ws resilience features',
  icons: {
    icon: '/logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
