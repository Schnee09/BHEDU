import { NextRequest, NextResponse } from "next/server";
import { createClientFromRequest } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
    try {
        const supabase = await createClientFromRequest(request);

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth
            .getUser();
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, {
                status: 401,
            });
        }

        // Get profile to check role
        const { data: profile } = await supabase
            .from("profiles")
            .select("role, id")
            .eq("user_id", user.id)
            .single();

        if (!profile) {
            return NextResponse.json({ error: "Profile not found" }, {
                status: 404,
            });
        }

        let query = supabase
            .from("payment_transactions")
            .select(`
        *,
        student:profiles!payment_transactions_student_id_fkey(full_name, student_id),
        invoice:invoices(description, due_date)
      `)
            .order("created_at", { ascending: false });

        // If student, only show own payments
        if (profile.role === "student") {
            query = query.eq("student_id", profile.id);
        } // If parent (future), show child's payments. (Skipping for now as parent role logic varies)
        // If teacher/admin, maybe allow viewing all? For now, this endpoint is "My History", so let's check.
        // Actually, "Payment History" usually implies the user's own history.
        // If admin wants to see all, they use the admin/finance/payments API.
        // So if not student, we might return empty or just their own if they paid (e.g. staff buying lunch? Unlikely).
        // Let's restrict to student for now, or if admin/staff, show all (audit mode).
        else if (["admin", "staff", "super_admin"].includes(profile.role)) {
            // Admins might want to see specific student history via query param
            const { searchParams } = new URL(request.url);
            const studentId = searchParams.get("student_id");
            if (studentId) {
                query = query.eq("student_id", studentId);
            }
            // If no student_id, maybe list recent system payments?
            // For safety, let's default to no filter (all payments) but paginated by default in UI.
            // But this is "history/route.ts". Let's assume it's personal history.
            // However, admins don't pay tuition. So for admins, this might be a debug view.
        }

        const { data, error } = await query;

        if (error) {
            console.error("Error fetching payment history:", error);
            return NextResponse.json({
                error: "Failed to fetch payment history",
            }, { status: 500 });
        }

        // Transform for UI
        const payments = data?.map((p) => ({
            id: p.id,
            amount: p.amount,
            status: p.status,
            method: p.payment_method,
            transactionDate: p.created_at,
            description: p.invoice?.description || "Thanh toán học phí",
            transactionId: p.transaction_id,
            studentName: p.student?.full_name,
            studentCode: p.student?.student_id,
        }));

        return NextResponse.json({
            success: true,
            payments: payments || [],
        });
    } catch (error) {
        console.error("Error in GET /api/payments/history:", error);
        return NextResponse.json({ error: "Internal server error" }, {
            status: 500,
        });
    }
}
