/**
 * Next.js 16 Proxy — Authentication & Route Protection
 * Replaces the deprecated middleware.ts convention.
 * Handles session refresh, role resolution, and fine-grained access control.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { hasPermission, UserRole, PermissionCode } from './lib/auth/core';

// Map of route prefixes to required permission codes.
// Sorted by specificity (longest prefix first) for correct precedence matching.
const ROUTE_PERMISSIONS: { prefix: string; permission: PermissionCode }[] = [
  { prefix: '/dashboard/admin/students/parent-links', permission: 'students.edit' },
  { prefix: '/dashboard/admin/permissions', permission: 'permissions.manage' },
  { prefix: '/dashboard/admin/announcements', permission: 'users.view' },
  { prefix: '/dashboard/admin/semesters', permission: 'classes.view' },
  { prefix: '/dashboard/admin/subjects', permission: 'classes.view' },
  { prefix: '/dashboard/admin/enrollments', permission: 'students.edit' },
  { prefix: '/dashboard/admin/invitations', permission: 'users.view' },
  { prefix: '/dashboard/admin/data', permission: 'reports.export' },
  { prefix: '/dashboard/admin/health', permission: 'system.settings' },
  { prefix: '/dashboard/classes', permission: 'classes.view' },
  { prefix: '/dashboard/students', permission: 'students.view' },
  { prefix: '/dashboard/timetable', permission: 'timetable.view' },
  { prefix: '/dashboard/parent/link-student', permission: 'parent.link_student' },
  { prefix: '/dashboard/parent', permission: 'parent.view_students' },
  { prefix: '/dashboard/attendance/mark', permission: 'attendance.mark' },
  { prefix: '/dashboard/attendance/history', permission: 'attendance.view' },
  { prefix: '/dashboard/attendance/reports', permission: 'attendance.reports' },
  { prefix: '/dashboard/grades/entry', permission: 'grades.entry' },
  { prefix: '/dashboard/grades/transcripts', permission: 'grades.view' },
  { prefix: '/dashboard/grades/analytics', permission: 'grades.analytics' },
  { prefix: '/dashboard/users', permission: 'users.view' },
  { prefix: '/dashboard/tutors', permission: 'users.view' },
  { prefix: '/dashboard/settings', permission: 'system.settings' },
];

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Only protect dashboard routes; allow the unauthorized page to render freely.
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
