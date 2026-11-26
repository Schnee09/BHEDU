import { paginationSchema, paginationWithDefaults } from '@/lib/schemas/common';

describe('shared pagination schemas', () => {
  it('coerces valid query-string values', () => {
    expect(paginationSchema.parse({ page: '2', limit: '50' })).toEqual({ page: 2, limit: 50 });
    expect(paginationWithDefaults(50).parse({})).toEqual({ page: 1, limit: 50 });
  });

  it.each([
    { page: '0' },
    { page: '1.5' },
    { page: 'abc' },
    { limit: '0' },
    { limit: '1.5' },
    { limit: '101' },
    { limit: 'abc' },
  ])('rejects invalid pagination: %p', (input) => {
    expect(paginationSchema.safeParse(input).success).toBe(false);
  });

  it('keeps specialized defaults within the shared upper bound', () => {
    expect(paginationWithDefaults(100).parse({})).toEqual({ page: 1, limit: 100 });
  });
});
