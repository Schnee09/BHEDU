/**
 * Payment Callback API Endpoint (REFACTORED)
 *
 * Handles VNPay payment callback after transaction.
 */

import { NextRequest, NextResponse } from "next/server";
import { processPaymentCallback } from "@/lib/payments/paymentService";
import { createApiHandler, createGetHandler } from "@/lib/api";

// GET /api/payments/callback - Redirect after payment
export const GET = createGetHandler(
  { requireAuth: false },
  async ({ request, searchParams }) => {
    const query: Record<string, string> = {};
    searchParams.forEach((value, key) => {
      query[key] = value;
    });

    try {
      const result = await processPaymentCallback(query);

      const redirectUrl = new URL(
        "/dashboard/finance/payments/result",
        request.url,
      );
      redirectUrl.searchParams.set(
        "success",
        result.success ? "true" : "false",
      );
      redirectUrl.searchParams.set("orderId", result.orderId);
      redirectUrl.searchParams.set("amount", String(result.amount));
      redirectUrl.searchParams.set("message", result.message);

      if (result.transactionNo) {
        redirectUrl.searchParams.set("transactionNo", result.transactionNo);
      }

      return NextResponse.redirect(redirectUrl.toString());
    } catch (error) {
      console.error("Payment callback error:", error);
      const errorUrl = new URL(
        "/dashboard/finance/payments/result",
        request.url,
      );
      errorUrl.searchParams.set("success", "false");
      errorUrl.searchParams.set(
        "message",
        "Có lỗi xảy ra khi xử lý thanh toán",
      );
      return NextResponse.redirect(errorUrl.toString());
    }
  },
);

// POST /api/payments/callback - Instant Payment Notification (IPN)
export const POST = createApiHandler(
  { requireAuth: false },
  async ({ request }) => {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const query: Record<string, string> = {};
    params.forEach((value, key) => {
      query[key] = value;
    });

    try {
      const result = await processPaymentCallback(query);

      if (result.success) {
        return NextResponse.json({ RspCode: "00", Message: "Confirm Success" });
      } else {
        return NextResponse.json({ RspCode: "01", Message: result.message });
      }
    } catch (error) {
      console.error("Payment IPN error:", error);
      return NextResponse.json({ RspCode: "99", Message: "Unknown error" });
    }
  },
);
