import {
  createStatementFingerprint,
  parseBankStatement,
  parseStatementAmount,
  parseStatementDate,
} from '../bankStatementImport';

describe('bank statement import', () => {
  it('normalizes common Vietnamese amounts', () => {
    expect(parseStatementAmount('1.200.000 VND')).toBe(1200000);
    expect(parseStatementAmount('1,200,000')).toBe(1200000);
    expect(parseStatementAmount('1250,50')).toBe(1250.5);
  });

  it('reads Vietnamese dates in the center timezone', () => {
    expect(parseStatementDate('24/10/2026 08:15:30')).toBe('2026-10-24T08:15:30+07:00');
  });

  it('parses a Vietnamese CSV and reports invalid rows', async () => {
    const csv =
      '\uFEFFNgày giao dịch,Số tiền ghi có,Nội dung,Số tham chiếu\n24/10/2026 08:15,1.200.000,HP Nguyen Van A,ABC 123\nsai,500000,HP B,DEF';
    const result = await parseBankStatement({
      fileName: 'sao-ke.csv',
      buffer: Buffer.from(csv),
      bankCode: 'VCB',
      accountScope: '***1234',
    });
    expect(result.rows).toHaveLength(1);
    expect(result.errors).toEqual([{ rowNumber: 3, message: 'Ngày giao dịch không hợp lệ' }]);
    expect(result.rows[0]).toMatchObject({
      amount: 1200000,
      direction: 'credit',
      description: 'HP Nguyen Van A',
    });
  });

  it('creates stable fingerprints after whitespace and case normalization', () => {
    const base = {
      bankCode: 'VCB',
      accountScope: '***1234',
      transactionAt: '2026-10-24T08:15:00+07:00',
      amount: 1200000,
      direction: 'credit' as const,
    };
    expect(
      createStatementFingerprint({
        ...base,
        referenceNumber: 'ABC 123',
        description: 'HP  Nguyen Van A',
      })
    ).toBe(
      createStatementFingerprint({
        ...base,
        bankCode: ' vcb ',
        referenceNumber: 'abc123',
        description: 'hp nguyen van a',
      })
    );
  });
});
