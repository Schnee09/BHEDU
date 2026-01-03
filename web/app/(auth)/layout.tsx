import { ReactNode } from "react";
import PublicHeader from "@/components/PublicHeader";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PublicHeader />
      <main className="flex-1">
        {children}
      </main>
    </>
  );
}
