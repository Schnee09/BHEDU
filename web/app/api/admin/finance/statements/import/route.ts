import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/apiHandler';
import { ConflictError, ValidationError } from '@/lib/api/errors';
import { parseBankStatement } from '@/lib/finance/bankStatementImport';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export const POST = createApiHandler(
  { permission: 'finance.manage' },
  async ({ request, user }) => {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File))
      throw new ValidationError('Vui lòng chọn file sao kê CSV hoặc XLSX');

    const bankCode = String(form.get('bank_code') ?? '').trim();
    const accountScope = String(form.get('account_scope') ?? '').trim();
    const parsed = await parseBankStatement({
      fileName: file.name,
      buffer: Buffer.from(await file.arrayBuffer()),
      bankCode,
      accountScope,
    });
    if (parsed.errors.length) {
      throw new ValidationError(
        `File còn ${parsed.errors.length} dòng không hợp lệ. Vui lòng sửa file trước khi nhập.`
      );
    }
    if (!parsed.rows.length) throw new ValidationError('File không có giao dịch hợp lệ để nhập');

    const supabase = createServiceClient();
    const { data: existing, error: existingError } = await supabase
      .from('bank_statement_batches')
      .select('id')
      .eq('source', 'file')
      .eq('file_hash', parsed.fileHash)
      .maybeSingle();
    if (existingError) throw existingError;
    if (existing) throw new ConflictError('File sao kê này đã được nhập trước đó');

    const { data, error } = await supabase.rpc('import_bank_statement', {
      p_file_name: file.name,
      p_file_hash: parsed.fileHash,
      p_bank_code: bankCode || null,
      p_account_scope: accountScope || null,
      p_imported_by: user.id,
      p_rows: parsed.rows.map((row) => ({
        rowNumber: row.rowNumber,
        transactionAt: row.transactionAt,
        amount: row.amount,
        direction: row.direction,
        description: row.description,
        referenceNumber: row.referenceNumber,
        counterpartyName: row.counterpartyName,
        counterpartyAccount: row.counterpartyAccount,
        bankTransactionId: row.bankTransactionId,
        fingerprint: row.fingerprint,
        rawData: row.rawData,
      })),
    });
    if (error) {
      if (error.code === '23505') throw new ConflictError('File sao kê này đã được nhập trước đó');
      throw error;
    }

    return NextResponse.json({ success: true, data });
  }
);
