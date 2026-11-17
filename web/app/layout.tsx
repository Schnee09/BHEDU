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
  title: 'BH-EDU | Quản lý trung tâm giáo dục',
  description:
    'Hệ thống quản lý học sinh, lớp học, lịch học, điểm danh, kết quả học tập và học phí tại Trung tâm Giáo dục Bùi Hoàng.',
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
  keywords: [
    'Trung tâm Giáo dục Bùi Hoàng',
    'quản lý học sinh',
    'quản lý lớp học',
    'quản lý học phí',
    'BH-EDU',
  ],
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
