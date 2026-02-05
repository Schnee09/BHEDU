/**
 * Next.js Proxy for Authentication and Route Protection
 * Handles session refresh and route access control
 */

import { type CookieOptions, createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";

// Routes that don't require authentication
const PUBLIC_ROUTES = [
    "/",
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/checkin",
];

// Routes that require admin/staff access
const ADMIN_ROUTES = [
    "/dashboard/users",
    "/dashboard/admin",
    "/dashboard/settings",
];

// Routes that require at least teacher access
const TEACHER_ROUTES = [
    "/dashboard/grades/entry",
    "/dashboard/attendance/mark",
];

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for required environment variables
    if (
        !process.env.NEXT_PUBLIC_SUPABASE_URL ||
        !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
        console.error("Missing Supabase environment variables in proxy");
        return NextResponse.next();
    }

    // Allow static files and API routes without auth check
    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.includes(".")
    ) {
        return NextResponse.next();
    }

    // Allow public routes
    if (PUBLIC_ROUTES.some((route) => pathname === route)) {
        return NextResponse.next();
    }

    let response = NextResponse.next({
        request: {
            headers: request.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        {
            cookies: {
                get(name: string) {
                    return request.cookies.get(name)?.value;
                },
                set(name: string, value: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value,
                        ...options,
                    });
                },
                remove(name: string, options: CookieOptions) {
                    request.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                    response = NextResponse.next({
                        request: {
                            headers: request.headers,
                        },
                    });
                    response.cookies.set({
                        name,
                        value: "",
                        ...options,
                    });
                },
            },
        },
    );

    // Check authentication for protected routes
    if (pathname.startsWith("/dashboard")) {
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();

        if (authError || !user) {
            // Not authenticated - redirect to login
            const url = request.nextUrl.clone();
            url.pathname = "/login";
            url.searchParams.set("redirect", pathname);
            return NextResponse.redirect(url);
        }

        // Get user's role from profile
        const { data: profile } = await supabase
            .from("profiles")
            .select("role")
            .eq("user_id", user.id)
            .single();

        const userRole = profile?.role || "student";

        // Check admin routes
        if (ADMIN_ROUTES.some((route) => pathname.startsWith(route))) {
            if (
                !["admin", "staff", "super_admin", "owner"].includes(userRole)
            ) {
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard";
                url.searchParams.set("error", "unauthorized");
                return NextResponse.redirect(url);
            }
        }

        // Check teacher routes
        if (TEACHER_ROUTES.some((route) => pathname.startsWith(route))) {
            if (
                !["admin", "staff", "teacher", "super_admin", "owner"].includes(
                    userRole,
                )
            ) {
                const url = request.nextUrl.clone();
                url.pathname = "/dashboard";
                url.searchParams.set("error", "unauthorized");
                return NextResponse.redirect(url);
            }
        }

        // Settings is admin and above
        if (
            pathname.startsWith("/dashboard/settings") &&
            !["admin", "super_admin", "owner"].includes(userRole)
        ) {
            const url = request.nextUrl.clone();
            url.pathname = "/dashboard";
            url.searchParams.set("error", "unauthorized");
            return NextResponse.redirect(url);
        }

        // Set role in header for downstream use
        response.headers.set("x-user-role", userRole);
    }

    return response;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files
         */
        "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
    ],
};

// Default export for Next.js 16 proxy convention
export default proxy;
