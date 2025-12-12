import "./globals.css";
import { ReactNode } from "react";
import ClientProviders from "@/components/ClientProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground">
        <ErrorBoundary>
          <ClientProviders>
            {children}
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
