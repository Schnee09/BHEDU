import { ReactNode } from "react";
import NavBar from "@/components/NavBar";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <NavBar />
      <div className="max-w-5xl mx-auto px-4 py-6">
        {children}
      </div>
    </>
  );
}
