import '../styles/tokens.css';
import '../styles/animations.css';
import '../styles/micro-animations.css';
import '../styles/glass.css';
import '../styles/mobile.css';
import './globals.css';
import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';
import ClientProviders from '@/components/ClientProviders';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ServiceWorkerRegister } from '@/components/ServiceWorkerRegister';
import { SpeedInsights } from '@vercel/speed-insights/next';

import { CustomizationProvider } from '@/contexts/CustomizationContext';

export const metadata: Metadata = {
  title: 'BH-EDU | Hệ thống quản lý giáo dục cao cấp',
  description:
    'Giải pháp quản lý giáo dục toàn diện, hiện đại và bảo mật - Premium Education Management System',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'BH-EDU',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/icons/icon-192x192.png',
  },
  keywords: ['giáo dục', 'quản lý học sinh', 'phần mềm quản lý trung tâm', 'BH-EDU', 'EMS'],
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0E0C0A' },
  ],
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning data-scroll-behavior="smooth">
      <body className="antialiased bg-background text-foreground min-h-screen">
        <ErrorBoundary>
          <CustomizationProvider>
            <ClientProviders>
              {children}
              <ServiceWorkerRegister />
              <SpeedInsights />
            </ClientProviders>
          </CustomizationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
