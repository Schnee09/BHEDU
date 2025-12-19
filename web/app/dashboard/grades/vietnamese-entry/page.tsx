"use client";

import Link from "next/link";

// Deprecated: merged into `grades/entry`.
export default function DeprecatedVietnameseEntry() {
  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold">Page moved</h2>
      <p className="mt-2">This page was merged into the main Grade Entry page.</p>
      <p className="mt-3">
        <Link href="/dashboard/grades/entry" className="text-blue-600 underline">Open Grade Entry</Link>
      </p>
    </div>
  );
}

