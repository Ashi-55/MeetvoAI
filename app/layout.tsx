import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';

export const metadata: Metadata = {
  title: 'MeetvoAI — India\'s AI Automation Marketplace',
  description: 'Find verified AI builders. Deploy working agents. Grow your business.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ backgroundColor: '#0A0F1E', color: '#FFFFFF' }}>
        {children}

        <Toaster />
      </body>
    </html>
  );
}

