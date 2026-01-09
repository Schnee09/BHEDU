"use client";

/**
 * PageGuard - Page-level permission protection component
 * 
 * Wraps page content and checks if user has required permissions.
 * Shows loading state while checking, access denied UI if unauthorized.
 * 
 * Usage:
 * <PageGuard permissions="system.settings">
 *   <SettingsPage />
 * </PageGuard>
 * 
 * Or with multiple permissions:
 * <PageGuard permissions={['users.view', 'users.edit']} requireAll={false}>
 *   <UsersPage />
 * </PageGuard>
 */

import { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import type { PermissionCode } from '@/lib/auth/permissions.config';
import { Icons } from '@/components/ui/Icons';
import { Button } from '@/components/ui';

interface PageGuardProps {
    children: ReactNode;
    /** Single permission or array of permissions required */
    permissions: PermissionCode | PermissionCode[];
    /** If true, require ALL permissions. If false (default), require ANY permission */
    requireAll?: boolean;
    /** Custom message to show when access is denied */
    deniedMessage?: string;
    /** Show loading skeleton while checking permissions */
    showLoading?: boolean;
}

/**
 * Loading skeleton component
 */
function LoadingSkeleton() {
    return (
        <div className="p-6 max-w-7xl mx-auto space-y-6 animate-pulse">
            {/* Header skeleton */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="h-8 w-64 bg-stone-200 rounded mb-2" />
                    <div className="h-5 w-96 bg-stone-200 rounded" />
                </div>
            </div>

            {/* Content skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="h-32 bg-stone-200 rounded-xl" />
                <div className="h-32 bg-stone-200 rounded-xl" />
                <div className="h-32 bg-stone-200 rounded-xl" />
            </div>

            <div className="h-64 bg-stone-200 rounded-xl" />
        </div>
    );
}

/**
 * Access denied UI component
 */
function AccessDenied({ message, onBack }: { message: string; onBack: () => void }) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
            <div className="text-center max-w-md">
                {/* Icon */}
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-red-100 flex items-center justify-center">
                    <Icons.Lock className="w-10 h-10 text-red-500" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-stone-900 mb-2">
                    Truy cập bị từ chối
                </h1>

                {/* Message */}
                <p className="text-stone-600 mb-6">
                    {message}
                </p>

                {/* Actions */}
                <div className="flex gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={onBack}
                        leftIcon={<Icons.Back className="w-4 h-4" />}
                    >
                        Quay lại
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => window.location.href = '/dashboard'}
                        leftIcon={<Icons.Home className="w-4 h-4" />}
                    >
                        Về trang chủ
                    </Button>
                </div>
            </div>
        </div>
    );
}

/**
 * PageGuard component - protects page content with permission checks
 */
export default function PageGuard({
    children,
    permissions,
    requireAll = false,
    deniedMessage = 'Bạn không có quyền truy cập trang này. Vui lòng liên hệ quản trị viên nếu bạn cần quyền truy cập.',
    showLoading = true,
}: PageGuardProps) {
    const router = useRouter();
    const { can, canAny, canAll, loading, isAdmin } = usePermissions();

    // Show loading state
    if (loading) {
        return showLoading ? <LoadingSkeleton /> : null;
    }

    // Admin always has access
    if (isAdmin) {
        return <>{children}</>;
    }

    // Check permissions
    const permissionArray = Array.isArray(permissions) ? permissions : [permissions];
    const hasAccess = requireAll
        ? canAll(permissionArray)
        : canAny(permissionArray);

    // Access denied
    if (!hasAccess) {
        return (
            <AccessDenied
                message={deniedMessage}
                onBack={() => router.back()}
            />
        );
    }

    // Authorized - render children
    return <>{children}</>;
}

/**
 * Higher-order component version for class components or simpler wrapping
 */
export function withPageGuard<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    permissions: PermissionCode | PermissionCode[],
    options?: Omit<PageGuardProps, 'children' | 'permissions'>
) {
    return function WithPageGuardComponent(props: P) {
        return (
            <PageGuard permissions={permissions} {...options}>
                <WrappedComponent {...props} />
            </PageGuard>
        );
    };
}
