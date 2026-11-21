import { NextRequest, NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { getRecentIncidents, recordIncident } from '@/lib/incidentLogger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await getAuthContext(request, 'system.audit');
  if (!auth.profile) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  const incidents = getRecentIncidents();

  return NextResponse.json({
    success: true,
    data: incidents,
    total: incidents.length,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest) {
  const auth = await getAuthContext(request, 'system.audit');
  if (!auth.profile) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const incident = recordIncident({
      type: body.type || 'CRASH',
      message: body.message || 'Manual admin reported incident',
      userEmail: auth.profile.email || 'admin@bhedu.vn',
      userRole: auth.role || 'admin',
      url: body.url || request.nextUrl.pathname,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, data: incident });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Invalid incident data';
    return NextResponse.json({ success: false, error: errorMessage }, { status: 400 });
  }
}
