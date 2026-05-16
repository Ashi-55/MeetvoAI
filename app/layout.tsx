import './globals.css';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { Toaster } from '@/components/ui/toaster';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'MeetvoAI — India\'s AI Automation Marketplace',
  description: 'Find verified AI builders. Deploy working agents. Grow your business.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body
        className={inter.className}
        style={{ backgroundColor: '#0A0F1E', color: '#FFFFFF' }}
      >
        {children}

        <Toaster />
      </body>
    </html>
  );
}

