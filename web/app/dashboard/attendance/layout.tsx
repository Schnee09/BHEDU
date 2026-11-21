export const dynamic = 'force-dynamic';

// Route-specific attendance permissions are enforced by proxy.ts and the API layer.
// A role-only guard here would reject staff/custom roles with valid grants.
export default function AttendanceSectionLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
