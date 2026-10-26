import { normalizeMatchText, suggestStudentMatch } from '../bankStatementMatching';

const students = [
  { id: '1', fullName: 'Nguyễn Văn An', studentCode: 'HS20260001' },
  { id: '2', fullName: 'Trần Minh Anh', studentCode: 'HS20260002' },
];

describe('bank statement student matching', () => {
  it('normalizes Vietnamese text without accents', () => {
    expect(normalizeMatchText('  Học phí – Nguyễn Văn An ')).toBe('hoc phi nguyen van an');
  });

  it('prioritizes an exact student code', () => {
    expect(
      suggestStudentMatch({ description: 'Dong hoc phi HS20260002 thang 10' }, students)
    ).toMatchObject({ id: '2', confidence: 0.99, reason: 'student_code' });
  });

  it('matches a normalized full name as a secondary signal', () => {
    expect(
      suggestStudentMatch({ description: 'Hoc phi Nguyen Van An thang 10' }, students)
    ).toMatchObject({ id: '1', confidence: 0.9, reason: 'full_name' });
  });

  it('does not guess from a partial or unrelated name', () => {
    expect(suggestStudentMatch({ description: 'Hoc phi em An' }, students)).toBeNull();
  });

  it('marks equal matches as ambiguous', () => {
    const sameNames = [
      { id: '3', fullName: 'Lê Minh Anh', studentCode: null },
      { id: '4', fullName: 'Lê Minh Anh', studentCode: null },
    ];
    expect(suggestStudentMatch({ description: 'Hoc phi Le Minh Anh' }, sameNames)).toMatchObject({
      ambiguous: true,
      confidence: 0.6,
    });
  });
});
