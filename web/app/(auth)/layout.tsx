import { ReactNode } from "react";
import { AcademicBackground } from "@/components/Academic/AcademicBackground";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen relative flex flex-col overflow-y-auto bg-background dark:bg-[#050505]">
      <AcademicBackground />
      <main className="flex-1 relative z-10 flex flex-col items-center justify-center p-4 py-12">
        {children}
      </main>
    </div>
  );
}
