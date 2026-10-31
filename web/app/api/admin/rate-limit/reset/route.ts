/**
 * Admin Rate Limit Reset API
 * POST /api/admin/rate-limit/reset - Clear all or specific rate limits
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import {
  resetRateLimit,
  clearAllRateLimits,
  cleanupRateLimits,
  getRateLimitIdentifier,
} from '@/lib/auth/rateLimit';

export async function POST(request: NextRequest) {
  try {
    // Do not rate-limit this recovery endpoint, but require centralized management permission.
    const auth = await getAuthContext(request, 'permissions.manage');
    if (!auth.authorized || !auth.profile) {
      return NextResponse.json(
        { error: auth.reason || 'Forbidden' },
        { status: auth.profile ? 403 : 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const { identifier, all } = body as { identifier?: unknown; all?: unknown };

    if (all !== undefined && typeof all !== 'boolean') {
      return NextResponse.json({ error: 'all must be a boolean' }, { status: 400 });
    }

    if (
      identifier !== undefined &&
      (typeof identifier !== 'string' || !identifier.trim() || identifier.length > 200)
    ) {
      return NextResponse.json({ error: 'identifier must be a non-empty string' }, { status: 400 });
    }

    if (all === true) {
      clearAllRateLimits();
      return NextResponse.json({
        success: true,
        message: 'All rate limits cleared',
      });
    }

    if (typeof identifier === 'string') {
      resetRateLimit(identifier.trim());
      return NextResponse.json({
        success: true,
        message: 'Rate limit cleared',
      });
    }

    // Default: cleanup expired and reset current user
    const cleaned = cleanupRateLimits();
    const currentIdentifier = getRateLimitIdentifier(request);
    resetRateLimit(currentIdentifier);

    return NextResponse.json({
      success: true,
      message: `Rate limit reset for current user. Cleaned ${cleaned} expired entries.`,
    });
  } catch (error) {
    console.error('Rate limit reset error:', error);
    return NextResponse.json(
      {
        error: 'Failed to reset rate limits',
      },
      { status: 500 }
    );
  }
}
