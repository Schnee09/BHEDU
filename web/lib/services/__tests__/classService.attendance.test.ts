import { ClassService } from '@/lib/services/classService';

describe('ClassService.getClassAttendance', () => {
  it('excludes soft-deleted attendance records', async () => {
    const result = { data: [], error: null };
    const query: Record<string, any> = { ...result };

    for (const method of ['select', 'eq', 'is', 'order']) {
      query[method] = jest.fn().mockReturnValue(query);
    }

    const supabase = {
      from: jest.fn().mockReturnValue(query),
    } as any;

    const service = new ClassService(supabase);
    await service.getClassAttendance('class-1', '2026-11-12');

    expect(query.eq).toHaveBeenCalledWith('class_id', 'class-1');
    expect(query.eq).toHaveBeenCalledWith('date', '2026-11-12');
    expect(query.is).toHaveBeenCalledWith('deleted_at', null);
  });
});
