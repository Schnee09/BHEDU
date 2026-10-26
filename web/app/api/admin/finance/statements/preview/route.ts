import { NextResponse } from 'next/server';
import { createApiHandler } from '@/lib/api/apiHandler';
import { ValidationError } from '@/lib/api/errors';
import { parseBankStatement } from '@/lib/finance/bankStatementImport';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

export const POST = createApiHandler({ permission: 'finance.manage' }, async ({ request }) => {
  const form = await request.formData();
  const file = form.get('file');
  if (!(file instanceof File)) throw new ValidationError('Vui lòng chọn file sao kê CSV hoặc XLSX');

  const bankCode = String(form.get('bank_code') ?? '').trim();
  const accountScope = String(form.get('account_scope') ?? '').trim();
  const parsed = await parseBankStatement({
    fileName: file.name,
    buffer: Buffer.from(await file.arrayBuffer()),
    bankCode,
    accountScope,
  });

  const existing = new Set<string>();
  const fingerprints = parsed.rows.map((row) => row.fingerprint);
  const supabase = createServiceClient();
  for (let index = 0; index < fingerprints.length; index += 200) {
    const chunk = fingerprints.slice(index, index + 200);
    if (!chunk.length) continue;
    const { data, error } = await supabase
      .from('bank_statement_transactions')
      .select('fingerprint')
      .in('fingerprint', chunk);
    if (error) throw error;
    data?.forEach((row) => existing.add(row.fingerprint));
  }

  const seenInFile = new Set<string>();
  const rows = parsed.rows.map((row) => {
    const duplicateInFile = seenInFile.has(row.fingerprint);
    seenInFile.add(row.fingerprint);
    return {
      ...row,
      duplicate: duplicateInFile || existing.has(row.fingerprint),
      duplicateSource: duplicateInFile ? 'file' : existing.has(row.fingerprint) ? 'system' : null,
    };
  });

  return NextResponse.json({
    success: true,
    data: {
      fileName: file.name,
      fileHash: parsed.fileHash,
      headers: parsed.headers,
      rows,
      errors: parsed.errors,
      summary: {
        totalRows: rows.length + parsed.errors.length,
        validRows: rows.filter((row) => !row.duplicate).length,
        duplicateRows: rows.filter((row) => row.duplicate).length,
        invalidRows: parsed.errors.length,
        creditRows: rows.filter((row) => row.direction === 'credit' && !row.duplicate).length,
      },
    },
  });
});
