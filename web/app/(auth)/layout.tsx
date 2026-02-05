import { ReactNode } from "react";
import PublicHeader from "@/components/PublicHeader";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-y-auto">
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}
