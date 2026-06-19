import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { ChatManager } from '@/components/chat/ChatManager';
import { GlobalBackButton } from '@/components/GlobalBackButton';
import { ThemeProvider } from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: 'MeetvoAI',
  description: 'Find trusted AI builders. Deploy working agents. Grow your business.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
  },
  icons: {
    icon: '/favicon.png',
    shortcut: '/favicon.png',
    apple: '/favicon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen w-full overflow-x-hidden bg-page text-text">
        <ThemeProvider>
          <GlobalBackButton />
          {children}
          <ChatManager />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
