export const dynamic = 'force-dynamic';

// Authentication and fine-grained authorization are enforced by proxy.ts.
// Keeping a role-only guard here would incorrectly reject staff/custom roles
// that have been granted access through the dynamic permission system.
export default function AdminSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
