import "./globals.css";
import { ReactNode } from "react";
import type { Metadata, Viewport } from "next";
import ClientProviders from "@/components/ClientProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

import { CustomizationProvider } from "@/contexts/CustomizationContext";

export const metadata: Metadata = {
  title: "BH-EDU | Hệ thống quản lý giáo dục",
  description: "Hệ thống quản lý giáo dục BH-EDU - Education Management System",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BH-EDU",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#6366f1",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="vi" suppressHydrationWarning data-scroll-behavior="smooth" className="h-full overflow-hidden">
      <body className="antialiased bg-background text-foreground h-full overflow-hidden">
        <ErrorBoundary>
          <CustomizationProvider>
            <ClientProviders>
              {children}
              <ServiceWorkerRegister />
            </ClientProviders>
          </CustomizationProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
