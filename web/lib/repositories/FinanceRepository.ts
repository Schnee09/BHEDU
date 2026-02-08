import { SupabaseClient } from "@supabase/supabase-js";
import { BaseRepository } from "./base";
import {
    BankSettingsInput,
    CreateFeeTypeInput,
    CreateInvoiceInput,
    CreatePaymentInput,
} from "@/lib/schemas";

export class FinanceRepository {
    private supabase: SupabaseClient;

    constructor(supabase: SupabaseClient) {
        this.supabase = supabase;
    }

    // ============================================
    // BANK SETTINGS (QR Code)
    // ============================================

    async getBankSettings(profileId: string) {
        const { data, error } = await this.supabase
            .from("bank_settings")
            .select("*")
            .eq("profile_id", profileId)
            .single();

        if (error && error.code !== "PGRST116") {
            throw new Error(`Failed to fetch bank settings: ${error.message}`);
        }
        return data; // null if not found
    }

    async upsertBankSettings(profileId: string, settings: BankSettingsInput) {
        const { data, error } = await this.supabase
            .from("bank_settings")
            .upsert({
                profile_id: profileId,
                ...settings,
                updated_at: new Date().toISOString(),
            }, { onConflict: "profile_id" })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to save bank settings: ${error.message}`);
        }
        return data;
    }

    // ============================================
    // INVOICES (Simple CRUD)
    // ============================================

    async createInvoice(data: CreateInvoiceInput) {
        let { student_id, academic_year_id, student_account_id } = data;

        // Resolve missing student_id or academic_year_id from student_account_id
        if ((!student_id || !academic_year_id) && student_account_id) {
            const { data: account, error: accError } = await this.supabase
                .from("student_accounts")
                .select("student_id, academic_year_id")
                .eq("id", student_account_id)
                .single();

            if (!accError && account) {
                student_id = student_id || account.student_id;
                academic_year_id = academic_year_id || account.academic_year_id;
            }
        }

        if (!student_id || !academic_year_id) {
            throw new Error("Missing student_id or academic_year_id");
        }

        // Generate invoice number
        const timestamp = Date.now();
        const invoiceNumber = `INV-${timestamp}`;

        // Create invoice
        const { data: invoice, error } = await this.supabase
            .from("invoices")
            .insert({
                invoice_number: invoiceNumber,
                student_id: student_id,
                student_account_id: student_account_id,
                academic_year_id: academic_year_id,
                due_date: data.due_date,
                notes: data.notes,
                issue_date: new Date().toISOString().split("T")[0],
                semester: data.semester,
                discount_amount: data.discount_amount,
                status: "pending",
                total_amount: 0, // Will calc
                paid_amount: 0,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create invoice: ${error.message}`);
        }

        // Insert items
        let total = 0;
        const itemsToInsert = data.items.map((item) => {
            const subtotal = item.amount * item.quantity;
            total += subtotal;
            return {
                invoice_id: invoice.id,
                fee_type_id: item.fee_type_id,
                description: item.description,
                amount: item.amount,
                quantity: item.quantity,
                subtotal: subtotal,
            };
        });

        const { error: itemsError } = await this.supabase
            .from("invoice_items")
            .insert(itemsToInsert);

        if (itemsError) {
            // Rollback
            await this.supabase.from("invoices").delete().eq("id", invoice.id);
            throw new Error(
                `Failed to create invoice items: ${itemsError.message}`,
            );
        }

        // Update total
        const finalTotal = total - (data.discount_amount || 0);
        await this.supabase
            .from("invoices")
            .update({ total_amount: finalTotal })
            .eq("id", invoice.id);

        // Return complete object
        return this.getInvoiceById(invoice.id);
    }

    async getInvoiceById(id: string) {
        const { data, error } = await this.supabase
            .from("invoices")
            .select(`
                *,
                student:profiles!invoices_student_id_fkey(
                  id,
                  full_name,
                  email
                ),
                academic_year:academic_years(id, name),
                items:invoice_items(
                  *,
                  fee_type:fee_types(id, name, category)
                )
            `)
            .eq("id", id)
            .single();

        if (error) return null;
        return data;
    }

    async getInvoices(
        filters: {
            student_id?: string;
            status?: string;
            academic_year_id?: string;
            page?: number;
            limit?: number;
        },
    ) {
        let query = this.supabase
            .from("invoices")
            .select(
                `
                *,
                student_account:student_accounts(
                  id,
                  student:profiles(
                    id,
                    full_name,
                    email,
                    student_profiles(student_code)
                  )
                ),
                academic_year:academic_years(id, name),
                items:invoice_items(
                  *,
                  fee_type:fee_types(id, name, category)
                )
            `,
                { count: "exact" },
            );

        if (filters.student_id) {
            query = query.eq("student_id", filters.student_id);
        }
        if (filters.status && filters.status !== "all") {
            query = query.eq("status", filters.status);
        }
        if (filters.academic_year_id) {
            query = query.eq("academic_year_id", filters.academic_year_id);
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const start = (page - 1) * limit;

        const { data, count, error } = await query
            .order("issue_date", { ascending: false })
            .range(start, start + limit - 1);

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0,
            page,
            pageSize: limit,
        };
    }

    // ============================================
    // PAYMENTS
    // ============================================

    async createPayment(data: CreatePaymentInput, receivedById: string) {
        let { student_id, student_account_id } = data;

        // Resolve missing student_id from student_account_id
        if (!student_id && student_account_id) {
            const { data: account, error: accError } = await this.supabase
                .from("student_accounts")
                .select("student_id")
                .eq("id", student_account_id)
                .single();

            if (!accError && account) {
                student_id = account.student_id;
            }
        }

        if (!student_id) {
            throw new Error("Missing student_id");
        }

        // Generate receipt number
        const timestamp = Date.now();
        const receiptNumber = `RCP-${timestamp}`;

        // Create Payment
        const { data: payment, error } = await this.supabase
            .from("payments")
            .insert({
                receipt_number: receiptNumber,
                student_id: student_id,
                student_account_id: student_account_id,
                payment_method_id: data.payment_method_id,
                amount: data.amount,
                payment_date: data.payment_date ||
                    new Date().toISOString().split("T")[0],
                transaction_reference: data.transaction_reference,
                notes: data.notes,
                received_by: receivedById,
            })
            .select()
            .single();

        if (error) {
            throw new Error(`Failed to create payment: ${error.message}`);
        }

        // Handle Allocations
        if (data.allocations && data.allocations.length > 0) {
            const allocations = data.allocations.map((alloc) => ({
                payment_id: payment.id,
                invoice_id: alloc.invoice_id,
                amount: alloc.amount,
            }));

            const { error: allocError } = await this.supabase
                .from("payment_allocations")
                .insert(allocations);

            if (allocError) {
                // Rollback
                await this.supabase.from("payments").delete().eq(
                    "id",
                    payment.id,
                );
                throw new Error(
                    `Failed to create payment allocations: ${allocError.message}`,
                );
            }

            // Update Invoice Paid Amounts (Simple logic, ideally transaction or trigger)
            // We loop for simplicity here as bulk update is tricky without RPC
            for (const alloc of data.allocations) {
                // Fetch current invoice to calc new total paid
                // Or better, use an RPC for "increment_paid_amount".
                // We'll perform a naive update for now.
                const { data: inv } = await this.supabase.from("invoices")
                    .select("paid_amount, total_amount, status").eq(
                        "id",
                        alloc.invoice_id,
                    ).single();
                if (inv) {
                    const newPaid = (inv.paid_amount || 0) + alloc.amount;
                    const newStatus = newPaid >= inv.total_amount
                        ? "paid"
                        : "pending"; // partially paid?
                    await this.supabase.from("invoices").update({
                        paid_amount: newPaid,
                        status: newStatus,
                    }).eq("id", alloc.invoice_id);
                }
            }
        }

        return payment;
    }

    async getPayments(
        filters: {
            student_id?: string;
            start_date?: string;
            end_date?: string;
            page?: number;
            limit?: number;
        },
    ) {
        let query = this.supabase
            .from("payments")
            .select(
                `
                *,
                student_account:student_accounts(
                  id,
                  student:profiles(
                    id,
                    full_name,
                    email,
                    student_profiles(student_code)
                  )
                ),
                payment_method:payment_methods(id, name),
                allocations:payment_allocations(*)
            `,
                { count: "exact" },
            );

        if (filters.student_id) {
            query = query.eq("student_id", filters.student_id);
        }
        if (filters.start_date) {
            query = query.gte("payment_date", filters.start_date);
        }
        if (filters.end_date) {
            query = query.lte("payment_date", filters.end_date);
        }

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const start = (page - 1) * limit;

        const { data, count, error } = await query
            .order("payment_date", { ascending: false })
            .range(start, start + limit - 1);

        if (error) throw error;

        return {
            data: data || [],
            total: count || 0,
            page,
            pageSize: limit,
        };
    }

    // ============================================
    // PAYMENT METHODS
    // ============================================

    async getPaymentMethods() {
        const { data, error } = await this.supabase
            .from("payment_methods")
            .select("*")
            .eq("is_active", true)
            .order("name");

        if (error) {
            throw Error(`Failed to fetch payment methods: ${error.message}`);
        }
        return data || [];
    }

    // ============================================
    // STUDENT ACCOUNTS
    // ============================================

    async getStudentAccounts(filters: {
        student_id?: string;
        academic_year_id?: string;
        status?: string;
        has_balance?: boolean;
        page?: number;
        limit?: number;
    }) {
        let query = this.supabase
            .from("student_accounts")
            .select(
                `
                *,
                student:profiles!student_accounts_student_id_fkey(
                  id,
                  full_name,
                  email,
                  student_profiles(
                    student_code
                  )
                ),
                academic_year:academic_years(id, name)
            `,
                { count: "exact" },
            );

        if (filters.student_id) {
            query = query.eq("student_id", filters.student_id);
        }
        if (filters.academic_year_id) {
            query = query.eq("academic_year_id", filters.academic_year_id);
        }

        // Handle Status Filter (Map UI status to DB logic)
        if (filters.status) {
            if (filters.status === "paid") {
                // UI means "Fully Paid" (Balance <= 0)
                query = query.lte("balance", 0);
            } else if (
                filters.status === "overdue" || filters.status === "pending"
            ) {
                // UI means "Owes Money" (Balance > 0)
                query = query.gt("balance", 0);
            } else if (
                ["active", "inactive", "graduated"].includes(filters.status)
            ) {
                // DB Enrollment Status
                query = query.eq("status", filters.status);
            }
        }

        // Explicit Balance Filter (overrides/augments status)
        if (filters.has_balance === true) query = query.gt("balance", 0);
        if (filters.has_balance === false) query = query.lte("balance", 0);

        const page = filters.page || 1;
        const limit = filters.limit || 20;
        const start = (page - 1) * limit;

        const { data, count, error } = await query
            .order("created_at", { ascending: false })
            .range(start, start + limit - 1);

        if (error) {
            // Graceful handling if table missing (dev env)
            if (error.code === "PGRST205" || error.code === "42P01") {
                return {
                    data: [],
                    total: 0,
                    page,
                    pageSize: limit,
                    note: "Table missing",
                };
            }
            throw new Error(
                `Failed to fetch student accounts: ${error.message}`,
            );
        }

        return {
            data: data || [],
            total: count || 0,
            page,
            pageSize: limit,
        };
    }

    async createStudentAccount(studentId: string, academicYearId: string) {
        // Check existing
        const { data: existing } = await this.supabase
            .from("student_accounts")
            .select("id")
            .eq("student_id", studentId)
            .eq("academic_year_id", academicYearId)
            .single();

        if (existing) {
            throw new Error(
                "Student account already exists for this academic year",
            );
        }

        const { data, error } = await this.supabase
            .from("student_accounts")
            .insert({
                student_id: studentId,
                academic_year_id: academicYearId,
                total_fees: 0,
                total_paid: 0,
                status: "active", // Default status
            })
            .select()
            .single();

        if (error) {
            throw new Error(
                `Failed to create student account: ${error.message}`,
            );
        }
        return data;
    }
    async getDashboardStats() {
        const [
            paymentsResult,
            invoicesResult,
            accountsResult,
        ] = await Promise.all([
            this.supabase.from("payments").select("amount, payment_date"),
            this.supabase.from("invoices").select(
                "status, total_amount, paid_amount",
            ),
            // Select balance and status for stats
            this.supabase.from("student_accounts").select("balance, status"),
        ]);

        const accounts = accountsResult.data || [];

        return {
            total_outstanding: accounts.reduce(
                (sum, acc) => sum + parseFloat(acc.balance || 0),
                0,
            ) || 0,
            accounts_with_balance:
                accounts.filter((acc) => parseFloat(acc.balance || 0) > 0)
                    .length || 0,
            total_collected: paymentsResult.data?.reduce(
                (sum, p) => sum + parseFloat(p.amount || 0),
                0,
            ) || 0,
            payment_count: paymentsResult.data?.length || 0,
            total_invoiced: invoicesResult.data?.reduce(
                (sum, inv) => sum + parseFloat(inv.total_amount || 0),
                0,
            ) || 0,
            paid_invoices:
                invoicesResult.data?.filter((inv) => inv.status === "paid")
                    .length || 0,
            overdue_invoices:
                invoicesResult.data?.filter((inv) => inv.status === "overdue")
                    .length || 0,
            account_status: {
                // Map Financial Standing
                paid: accounts.filter((acc) => (acc.balance || 0) <= 0).length,
                pending:
                    accounts.filter((acc) => (acc.balance || 0) > 0).length,
                partial: 0,
                overdue: 0,

                // Keep DB statuses
                active:
                    accounts.filter((acc) => acc.status === "active").length,
                inactive:
                    accounts.filter((acc) => acc.status === "inactive").length,
                graduated:
                    accounts.filter((acc) => acc.status === "graduated").length,
            },
        };
    }

    async getRevenueReport(startDate?: string, endDate?: string) {
        let query = this.supabase
            .from("payments")
            .select(
                "payment_date, amount, payment_method:payment_methods(name)",
            )
            .order("payment_date", { ascending: false });

        if (startDate) query = query.gte("payment_date", startDate);
        if (endDate) query = query.lte("payment_date", endDate);

        const { data, error } = await query;
        if (error) {
            throw new Error(`Failed to fetch revenue report: ${error.message}`);
        }

        // Group by month and payment method
        const monthlyRevenue = new Map<
            string,
            { total: number; count: number; methods: Map<string, number> }
        >();

        data?.forEach((payment) => {
            const month = (payment.payment_date as string).substring(0, 7); // YYYY-MM
            if (!monthlyRevenue.has(month)) {
                monthlyRevenue.set(month, {
                    total: 0,
                    count: 0,
                    methods: new Map(),
                });
            }
            const monthData = monthlyRevenue.get(month)!;
            const amount = parseFloat(payment.amount);
            monthData.total += amount;
            monthData.count += 1;

            const methodObj = payment.payment_method as unknown as {
                name: string;
            } | null;
            const method = methodObj?.name || "Unknown";
            monthData.methods.set(
                method,
                (monthData.methods.get(method) || 0) + amount,
            );
        });

        return Array.from(monthlyRevenue.entries()).map(([month, data]) => ({
            month,
            total: data.total,
            transaction_count: data.count,
            payment_methods: Array.from(data.methods.entries()).map((
                [method, amount],
            ) => ({
                method,
                amount,
            })),
        }));
    }
}
