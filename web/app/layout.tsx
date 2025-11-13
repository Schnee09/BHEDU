import "./globals.css";
import { ReactNode } from "react";
import NavBar from "@/components/NavBar";
import ClientProviders from "@/components/ClientProviders";
import { ErrorBoundary } from "@/components/ErrorBoundary";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ErrorBoundary>
          <ClientProviders>
            <NavBar />
            <div className="max-w-5xl mx-auto px-4 py-6">
              {children}
            </div>
          </ClientProviders>
        </ErrorBoundary>
      </body>
    </html>
  );
}
