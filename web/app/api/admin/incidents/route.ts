import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/auth/adminAuth';
import { getRecentIncidents, recordIncident } from '@/lib/incidentLogger';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const auth = await adminAuth();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
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
  const auth = await adminAuth();
  if (!auth.authorized) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const incident = recordIncident({
      type: body.type || 'CRASH',
      message: body.message || 'Manual admin reported incident',
      userEmail: auth.userEmail || 'admin@bhedu.vn',
      userRole: auth.userRole || 'admin',
      url: body.url || request.nextUrl.pathname,
      metadata: body.metadata,
    });

    return NextResponse.json({ success: true, data: incident });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message }, { status: 400 });
  }
}
