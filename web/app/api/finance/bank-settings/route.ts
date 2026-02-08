import { NextResponse } from "next/server";
import { apiSuccess, createApiHandler, createGetHandler } from "@/lib/api";
import { bankSettingsSchema } from "@/lib/schemas";
import { createServiceClient } from "@/lib/supabase/server";
import { FinanceRepository } from "@/lib/repositories/FinanceRepository";

/**
 * GET /api/finance/bank-settings
 * Get current user's bank settings (or admin's if requested? For now just user's)
 */
export const GET = createGetHandler(
  { requireAuth: true },
  async ({ user }) => {
    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);

    // For now, get OWN settings.
    // Later might allow admin to view others.
    const settings = await repository.getBankSettings(user.id);

    return apiSuccess(settings || {});
  },
);

/**
 * POST /api/finance/bank-settings
 * Update bank settings
 */
export const POST = createApiHandler(
  {
    requireAuth: true,
    bodySchema: bankSettingsSchema,
  },
  async ({ body, user }) => {
    const supabase = createServiceClient();
    const repository = new FinanceRepository(supabase);

    const updated = await repository.upsertBankSettings(user.id, body);

    return apiSuccess(updated, { message: "Bank settings saved successfully" });
  },
);
