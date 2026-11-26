import { NextResponse } from 'next/server';
import { getAuthContext } from '@/lib/auth/guard';
import { getDataClient } from '@/lib/auth/dataClient';
import { canAccessStudent } from '@/lib/auth/classAccess';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const studentAuth = await getAuthContext(request, 'students.view');
    if (!studentAuth.profile) {
      return NextResponse.json({ error: studentAuth.reason || 'Unauthorized' }, { status: 401 });
    }
    if (!studentAuth.authorized) {
      return NextResponse.json({ error: studentAuth.reason || 'Forbidden' }, { status: 403 });
    }

    const financeAuth = await getAuthContext(request, 'finance.view');
    if (!financeAuth.authorized) {
      return NextResponse.json({ error: financeAuth.reason || 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { supabase } = await getDataClient(request);
    if (
      !studentAuth.role ||
      !(await canAccessStudent(
        supabase,
        { id: studentAuth.profile.id, role: studentAuth.role },
        id
      ))
    ) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch student profile with guardians and basic account info
    const { data: student, error: studentError } = await supabase
      .from('profiles')
      .select(
        `
        *,
        guardians:guardians(*),
        student_accounts(*),
        enrollments:enrollments(*, class:classes(id,name,code,grade_level,academic_year:academic_years(id,name)))
      `
      )
      .eq('id', id)
      .eq('role', 'student')
      .maybeSingle();

    if (studentError) {
      console.error('Error fetching student details:', studentError);
      return NextResponse.json({ error: 'Failed to fetch student details' }, { status: 500 });
    }

    if (!student) {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch recent invoices and payments for the student
    const { data: invoices } = await supabase
      .from('invoices')
      .select(`*, items:invoice_items(*), academic_year:academic_years(id,name)`)
      .eq('student_id', id)
      .order('issue_date', { ascending: false })
      .limit(20);

    const { data: payments } = await supabase
      .from('payments')
      .select('*')
      .eq('student_id', id)
      .order('payment_date', { ascending: false })
      .limit(20);

    return NextResponse.json({
      success: true,
      data: { student, invoices: invoices || [], payments: payments || [] },
    });
  } catch (err) {
    console.error('Error in admin/details/students/[id]:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
