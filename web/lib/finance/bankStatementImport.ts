import { createHash } from 'node:crypto';
import ExcelJS from 'exceljs';
import Papa from 'papaparse';

export const MAX_STATEMENT_FILE_SIZE = 5 * 1024 * 1024;
export const MAX_STATEMENT_ROWS = 5000;
type Cell = unknown;

export interface StatementTransaction {
  rowNumber: number;
  transactionAt: string;
  amount: number;
  direction: 'credit' | 'debit';
  description: string | null;
  referenceNumber: string | null;
  counterpartyName: string | null;
  counterpartyAccount: string | null;
  bankTransactionId: string | null;
  fingerprint: string;
  rawData: Record<string, unknown>;
  warnings: string[];
}
export interface StatementParseResult {
  fileHash: string;
  rows: StatementTransaction[];
  errors: Array<{ rowNumber: number; message: string }>;
  headers: string[];
}

const aliases = {
  date: ['ngay giao dich', 'ngay gd', 'ngay', 'thoi gian', 'transaction date', 'date', 'datetime'],
  amount: ['so tien', 'amount', 'transaction amount', 'gia tri'],
  credit: ['ghi co', 'so tien ghi co', 'credit', 'credit amount', 'tien vao', 'so tien vao'],
  debit: ['ghi no', 'so tien ghi no', 'debit', 'debit amount', 'tien ra', 'so tien ra'],
  description: ['noi dung', 'dien giai', 'mo ta', 'description', 'remark', 'memo', 'details'],
  reference: ['ma giao dich', 'so tham chieu', 'reference', 'reference number', 'ref no'],
  counterpartyName: ['ten doi tac', 'nguoi gui', 'nguoi chuyen', 'counterparty name', 'sender'],
  counterpartyAccount: [
    'tai khoan doi tac',
    'tai khoan nguoi gui',
    'counterparty account',
    'sender account',
  ],
  transactionId: ['transaction id', 'bank transaction id', 'ma gd', 'ft number'],
} as const;

function text(value: unknown): string {
  if (value == null) return '';
  if (typeof value === 'object' && 'text' in value)
    return String((value as { text: unknown }).text ?? '').trim();
  if (typeof value === 'object' && 'result' in value)
    return text((value as { result: unknown }).result);
  return String(value).trim();
}
function normalized(value: unknown) {
  return text(value)
    .replace(/^\uFEFF/, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}
function column(headers: string[], names: readonly string[]) {
  const accepted = new Set(names.map(normalized));
  return headers.findIndex((header) => accepted.has(normalized(header)));
}

export function parseStatementAmount(value: unknown): number | null {
  if (typeof value === 'number')
    return Number.isFinite(value) && value !== 0 ? Math.abs(value) : null;
  let raw = text(value).replace(/\s|₫|đ|vnd/gi, '');
  if (!raw || raw === '-') return null;
  raw = raw.replace(/[()\-+]/g, '');
  const separator = Math.max(raw.lastIndexOf(','), raw.lastIndexOf('.'));
  raw =
    separator >= 0 && raw.length - separator - 1 <= 2
      ? `${raw.slice(0, separator).replace(/[.,]/g, '')}.${raw.slice(separator + 1)}`
      : raw.replace(/[.,]/g, '');
  const amount = Number(raw);
  return Number.isFinite(amount) && amount !== 0 ? Math.abs(amount) : null;
}

const localIso = (y: number, m: number, d: number, h = 0, min = 0, s = 0) => {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}T${pad(h)}:${pad(min)}:${pad(s)}+07:00`;
};
export function parseStatementDate(value: unknown): string | null {
  if (value instanceof Date && !Number.isNaN(value.getTime()))
    return localIso(
      value.getFullYear(),
      value.getMonth() + 1,
      value.getDate(),
      value.getHours(),
      value.getMinutes(),
      value.getSeconds()
    );
  if (typeof value === 'number' && value > 1) {
    const date = new Date(Math.round((value - 25569) * 86400000));
    return localIso(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours(),
      date.getUTCMinutes(),
      date.getUTCSeconds()
    );
  }
  const raw = text(value);
  const match = raw.match(
    /^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/
  );
  if (match) {
    const [, d, m, y, h = '0', min = '0', s = '0'] = match;
    const iso = localIso(Number(y), Number(m), Number(d), Number(h), Number(min), Number(s));
    return Number.isNaN(new Date(iso).getTime()) ? null : iso;
  }
  const date = new Date(raw);
  return raw && !Number.isNaN(date.getTime()) ? date.toISOString() : null;
}
function localTimestamp(iso: string) {
  const values = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value])
  );
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}
export function createStatementFingerprint(input: {
  bankCode?: string;
  accountScope?: string;
  transactionAt: string;
  amount: number;
  direction: 'credit' | 'debit';
  referenceNumber?: string | null;
  description?: string | null;
}) {
  const payload = [
    input.bankCode ?? '',
    input.accountScope ?? '',
    localTimestamp(input.transactionAt),
    input.amount.toFixed(2).replace(/\.00$/, ''),
    input.direction,
    (input.referenceNumber ?? '').replace(/\s+/g, ''),
    (input.description ?? '').replace(/\s+/g, ' '),
  ]
    .map((v) => v.trim().toLowerCase())
    .join('|');
  return createHash('md5').update(payload).digest('hex');
}

async function readFile(
  fileName: string,
  buffer: Buffer
): Promise<{ headers: string[]; rows: Cell[][] }> {
  const extension = fileName.toLowerCase().split('.').pop();
  if (extension === 'csv') {
    const parsed = Papa.parse<string[]>(buffer.toString('utf8'), { skipEmptyLines: 'greedy' });
    if (parsed.errors.length && !parsed.data.length)
      throw new Error(`Không thể đọc CSV: ${parsed.errors[0]?.message}`);
    const [head = [], ...rows] = parsed.data;
    return { headers: head.map(text), rows };
  }
  if (extension === 'xlsx') {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet) throw new Error('File Excel không có trang dữ liệu');
    const all: Cell[][] = [];
    sheet.eachRow({ includeEmpty: false }, (row) => {
      const values = Array.isArray(row.values) ? row.values.slice(1) : [];
      all.push(values);
    });
    const [head = [], ...rows] = all;
    return { headers: head.map(text), rows };
  }
  throw new Error('Chỉ hỗ trợ file CSV hoặc XLSX');
}

export async function parseBankStatement(input: {
  fileName: string;
  buffer: Buffer;
  bankCode?: string;
  accountScope?: string;
}): Promise<StatementParseResult> {
  if (input.buffer.byteLength > MAX_STATEMENT_FILE_SIZE)
    throw new Error('File vượt quá giới hạn 5 MB');
  const { headers, rows } = await readFile(input.fileName, input.buffer);
  if (!headers.length) throw new Error('File không có hàng tiêu đề');
  if (rows.length > MAX_STATEMENT_ROWS)
    throw new Error(`File vượt quá giới hạn ${MAX_STATEMENT_ROWS} giao dịch`);
  const indexes: Record<keyof typeof aliases, number> = {
    date: column(headers, aliases.date),
    amount: column(headers, aliases.amount),
    credit: column(headers, aliases.credit),
    debit: column(headers, aliases.debit),
    description: column(headers, aliases.description),
    reference: column(headers, aliases.reference),
    counterpartyName: column(headers, aliases.counterpartyName),
    counterpartyAccount: column(headers, aliases.counterpartyAccount),
    transactionId: column(headers, aliases.transactionId),
  };
  if (indexes.date < 0) throw new Error('Không tìm thấy cột ngày giao dịch');
  if (indexes.amount < 0 && indexes.credit < 0 && indexes.debit < 0)
    throw new Error('Không tìm thấy cột số tiền');
  const result: StatementParseResult = {
    fileHash: createHash('sha256').update(input.buffer).digest('hex'),
    rows: [],
    errors: [],
    headers,
  };
  rows.forEach((row, offset) => {
    const rowNumber = offset + 2;
    const transactionAt = parseStatementDate(row[indexes.date]);
    const credit = indexes.credit >= 0 ? parseStatementAmount(row[indexes.credit]) : null;
    const debit = indexes.debit >= 0 ? parseStatementAmount(row[indexes.debit]) : null;
    const amount =
      credit ?? debit ?? (indexes.amount >= 0 ? parseStatementAmount(row[indexes.amount]) : null);
    if (!transactionAt || !amount) {
      result.errors.push({
        rowNumber,
        message: !transactionAt ? 'Ngày giao dịch không hợp lệ' : 'Số tiền không hợp lệ',
      });
      return;
    }
    const get = (index: number) => (index >= 0 ? text(row[index]) || null : null);
    const direction = credit ? 'credit' : debit ? 'debit' : 'credit';
    const description = get(indexes.description);
    const referenceNumber = get(indexes.reference);
    const rawData = Object.fromEntries(
      headers.map((header, i) => [header || `Cột ${i + 1}`, row[i] ?? null])
    );
    result.rows.push({
      rowNumber,
      transactionAt,
      amount,
      direction,
      description,
      referenceNumber,
      counterpartyName: get(indexes.counterpartyName),
      counterpartyAccount: get(indexes.counterpartyAccount),
      bankTransactionId: get(indexes.transactionId),
      rawData,
      fingerprint: createStatementFingerprint({
        bankCode: input.bankCode,
        accountScope: input.accountScope,
        transactionAt,
        amount,
        direction,
        referenceNumber,
        description,
      }),
      warnings:
        direction === 'debit' ? ['Giao dịch ghi nợ sẽ không được dùng để đối soát học phí.'] : [],
    });
  });
  return result;
}
