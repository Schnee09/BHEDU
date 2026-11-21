/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { GET as GET_OVERVIEW } from '@/app/api/admin/finance/overview/route';
import { GET as GET_INVOICES, POST as POST_INVOICE } from '@/app/api/admin/finance/invoices/route';
import { POST as POST_INVOICE_PAYMENT } from '@/app/api/admin/finance/invoices/[id]/pay/route';
import {
  GET as GET_TUITION_MATRIX,
  POST as POST_TUITION_MATRIX,
} from '@/app/api/admin/finance/tuition-matrix/route';
import { POST as POST_BULK_INVOICES } from '@/app/api/admin/finance/invoices/bulk/route';
import { getAuthContext } from '@/lib/auth/guard';

jest.mock('@/lib/auth/guard', () => ({ getAuthContext: jest.fn() }));
jest.mock('@/lib/services', () => ({ financeService: {} }));

type FinanceHandler = (request: NextRequest) => Promise<Response>;

const handlers: Array<[string, FinanceHandler, 'GET' | 'POST', string]> = [
  ['finance overview', GET_OVERVIEW, 'GET', 'finance.view'],
  ['invoice list', GET_INVOICES, 'GET', 'finance.view'],
  ['invoice creation', POST_INVOICE, 'POST', 'finance.manage'],
  ['invoice payment', POST_INVOICE_PAYMENT, 'POST', 'finance.manage'],
  ['tuition matrix', GET_TUITION_MATRIX, 'GET', 'finance.view'],
  ['tuition matrix update', POST_TUITION_MATRIX, 'POST', 'finance.manage'],
  ['bulk invoice generation', POST_BULK_INVOICES, 'POST', 'finance.manage'],
];

function request(method: 'GET' | 'POST') {
  return new NextRequest('http://localhost/api/admin/finance/test', {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: method === 'POST' ? JSON.stringify({}) : undefined,
  });
}

describe('admin finance authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it.each(handlers)(
    'returns 401 for %s without a profile',
    async (_name, handler, method, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: null,
        role: null,
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(401);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );

  it.each(handlers)(
    'returns 403 for %s without its finance permission',
    async (_name, handler, method, permission) => {
      jest.mocked(getAuthContext).mockResolvedValue({
        authorized: false,
        profile: { id: 'staff-1' },
        role: 'teacher',
      } as Awaited<ReturnType<typeof getAuthContext>>);

      const response = await handler(request(method));

      expect(response.status).toBe(403);
      expect(getAuthContext).toHaveBeenCalledWith(expect.any(NextRequest), permission);
    }
  );
});
