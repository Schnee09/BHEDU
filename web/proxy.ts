/**
 * Next.js 16 Proxy — Authentication & Route Protection
 * Complies with Next.js 16 proxy convention (replacing deprecated middleware.ts).
 * Handles session refresh, role resolution, and fine-grained access control.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { hasPermission, UserRole, PermissionCode } from './lib/auth/core';

// Map of route prefixes to required permission codes.
// Sorted by specificity (longest prefix first) for correct precedence matching.
const ROUTE_PERMISSIONS: { prefix: string; permission: PermissionCode }[] = [
  // ── Admin Sub-routes ──
  { prefix: '/dashboard/admin/students/parent-links', permission: 'parent_links.view' },
  { prefix: '/dashboard/admin/permissions', permission: 'permissions.manage' },
  { prefix: '/dashboard/admin/announcements', permission: 'announcements.manage' },
  { prefix: '/dashboard/admin/academic-years', permission: 'classes.manage' },
  { prefix: '/dashboard/admin/grading-scales', permission: 'classes.manage' },
  { prefix: '/dashboard/admin/semesters', permission: 'classes.manage' },
  { prefix: '/dashboard/admin/subjects', permission: 'subjects.manage' },
  { prefix: '/dashboard/admin/enrollments', permission: 'enrollments.manage' },
  { prefix: '/dashboard/admin/invitations', permission: 'users.invite' },
  { prefix: '/dashboard/admin/import', permission: 'users.bulk_import' },
  { prefix: '/dashboard/admin/finance/tuition-matrix', permission: 'finance.manage' },
  { prefix: '/dashboard/admin/finance', permission: 'finance.view' },
  { prefix: '/dashboard/admin/audit', permission: 'system.audit' },
  { prefix: '/dashboard/admin/backup', permission: 'system.settings' },
  { prefix: '/dashboard/admin/health', permission: 'system.settings' },
  { prefix: '/dashboard/admin/data-dump', permission: 'system.settings' },
  { prefix: '/dashboard/admin/diagnostic', permission: 'system.settings' },
  { prefix: '/dashboard/admin/impersonate', permission: 'system.impersonate' },
  { prefix: '/dashboard/admin', permission: 'users.view' },

  // ── System & Audit ──
  { prefix: '/dashboard/debug-all-apis', permission: 'system.audit' },
  { prefix: '/dashboard/settings', permission: 'system.settings' },
  { prefix: '/dashboard/reports', permission: 'reports.view' },

  // ── Master Timetable (Admin/Owner only) ──
  { prefix: '/dashboard/timetable', permission: 'classes.manage' },

  // ── Users, Teachers & Tutors Management ──
  { prefix: '/dashboard/users', permission: 'users.view' },
  { prefix: '/dashboard/teachers', permission: 'users.view' },
  { prefix: '/dashboard/tutors', permission: 'users.view' },

  // ── Teacher-specific portal routes ──
  { prefix: '/dashboard/teacher/classes', permission: 'attendance.mark' },
  { prefix: '/dashboard/teacher', permission: 'attendance.mark' },

  // ── Tutor-specific routes ──
  { prefix: '/dashboard/tutor/students', permission: 'tutoring.sessions.view' },
  { prefix: '/dashboard/tutor', permission: 'tutoring.sessions.view' },
  { prefix: '/dashboard/tutoring', permission: 'tutoring.sessions.view' },

  // ── Student management ──
  { prefix: '/dashboard/students/import', permission: 'students.import' },
  { prefix: '/dashboard/students/bulk', permission: 'students.create' },
  { prefix: '/dashboard/students', permission: 'students.view' },

  // ── Classes ──
  { prefix: '/dashboard/classes', permission: 'classes.view' },

  // ── Attendance ──
  { prefix: '/dashboard/attendance/mark', permission: 'attendance.mark' },
  { prefix: '/dashboard/attendance/reports', permission: 'attendance.reports' },
  { prefix: '/dashboard/attendance/history', permission: 'attendance.view' },
  { prefix: '/dashboard/attendance', permission: 'attendance.view' },

  // ── Grades ──
  { prefix: '/dashboard/grades/entry', permission: 'grades.entry' },
  { prefix: '/dashboard/grades/assignments', permission: 'grades.manage' },
  { prefix: '/dashboard/grades/analytics', permission: 'grades.analytics' },
  { prefix: '/dashboard/grades/transcripts', permission: 'grades.view' },
  { prefix: '/dashboard/grades', permission: 'grades.view' },

  // ── Parent ──
  { prefix: '/dashboard/parent/link-student', permission: 'parent.link_student' },
  { prefix: '/dashboard/parent/grades', permission: 'grades.view' },
  { prefix: '/dashboard/parent/attendance', permission: 'attendance.view' },
  { prefix: '/dashboard/parent', permission: 'parent.view_students' },
];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only protect dashboard routes; allow public and unauthorized pages to render freely.
  if (!pathname.startsWith('/dashboard') || pathname === '/dashboard/unauthorized') {
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  // 1. Verify authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 2. Resolve the required permission for the current path
  let requiredPermission: PermissionCode | null = null;
  for (const rule of ROUTE_PERMISSIONS) {
    if (pathname === rule.prefix || pathname.startsWith(rule.prefix + '/')) {
      requiredPermission = rule.permission;
      break;
    }
  }

  // No specific permission required (e.g. general dashboard / profile)
  if (!requiredPermission) {
    return response;
  }

  // 3. Resolve role — check cookie cache first to avoid an extra DB round-trip
  const cachedRoleCookie = request.cookies.get('user-role')?.value;
  let role: UserRole | null = null;

  if (cachedRoleCookie) {
    const [cookieUserId, cookieRole] = cachedRoleCookie.split(':');
    if (cookieUserId === user.id) {
      role = cookieRole as UserRole;
    }
  }

  // Cache miss: fetch role from the profiles table
  if (!role) {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();

    if (error || !profile) {
      console.warn(`[Proxy] Profile fetch failed for user ${user.id}:`, error);
      return NextResponse.redirect(new URL('/dashboard/unauthorized', request.url));
    }

    role = profile.role as UserRole;

    // Persist role in a short-lived cookie to avoid repeat DB queries
    response.cookies.set('user-role', `${user.id}:${role}`, {
      maxAge: 60 * 60 * 24, // 1 day
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
  }

  // 4. Permission check
  if (!hasPermission(role, requiredPermission)) {
    console.warn(
      `[Proxy] Access denied — user ${user.id} (role: ${role}) → ${pathname}. Required: ${requiredPermission}`
    );
    const unauthorizedResponse = NextResponse.redirect(
      new URL('/dashboard/unauthorized', request.url)
    );
    // Propagate role cache to the redirect response
    unauthorizedResponse.cookies.set('user-role', `${user.id}:${role}`, {
      maxAge: 60 * 60 * 24,
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return unauthorizedResponse;
  }

  return response;
}

export const config = {
  matcher: ['/dashboard/:path*'],
};

export default proxy;
