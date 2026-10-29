import { apiSuccess, createGetHandler } from '@/lib/api';
import { AuthorizationError } from '@/lib/api/errors';
import { createServiceClient } from '@/lib/supabase/server';
import { cached, CACHE_TTL } from '@/lib/cache/cache';

export const dynamic = 'force-dynamic';

const GLOBAL_RANKING_ROLES = new Set(['super_admin', 'owner', 'admin']);
const ASSIGNED_CLASS_ROLES = new Set(['teacher', 'tutor', 'staff']);

interface StudentRanking {
  studentId: string;
  studentName: string;
  className: string;
  average: number;
  rank: number;
  percentile: number;
  change: number;
}

interface RankingResult {
  topStudents: StudentRanking[];
  atRiskStudents: StudentRanking[];
}

function toRankingResult(
  students: Omit<StudentRanking, 'rank' | 'percentile' | 'change'>[],
  limit: number
): RankingResult {
  const ranked = students
    .sort((a, b) => b.average - a.average || a.studentName.localeCompare(b.studentName, 'vi'))
    .map((student, index, all) => ({
      ...student,
      rank: index + 1,
      percentile:
        all.length <= 1 ? 100 : Math.round(((all.length - index - 1) / (all.length - 1)) * 100),
      change: 0,
    }));

  return {
    topStudents: ranked.slice(0, limit),
    atRiskStudents: ranked
      .filter((student) => student.average < 5)
      .reverse()
      .slice(0, limit),
  };
}

export const GET = createGetHandler({ permission: 'grades.view' }, async ({ request, user }) => {
  const url = new URL(request.url);
  const parsedLimit = Number.parseInt(url.searchParams.get('limit') || '10', 10);
  const limit = Number.isFinite(parsedLimit) ? Math.min(Math.max(parsedLimit, 1), 50) : 10;
  const requestedTeacherId = url.searchParams.get('teacher_id');
  const supabase = createServiceClient();

  if (!GLOBAL_RANKING_ROLES.has(user.role) && !ASSIGNED_CLASS_ROLES.has(user.role)) {
    throw new AuthorizationError('Bạn không có quyền xem bảng xếp hạng này');
  }

  // Non-admin scopes always come from the authenticated profile, never the URL.
  const teacherId = GLOBAL_RANKING_ROLES.has(user.role) ? requestedTeacherId : user.id;
  const cacheKey = `rankings:${teacherId ? `teacher:${teacherId}` : 'global'}:${limit}`;

  const result = await cached<RankingResult>(
    cacheKey,
    async () => {
      if (!teacherId) {
        const { data: rankings, error } = await supabase.rpc('get_student_rankings');
        if (error) throw new Error(`Failed to fetch rankings: ${error.message}`);

        return toRankingResult(
          (rankings || []).map((student: any) => ({
            studentId: student.student_id,
            studentName: student.student_name,
            className: student.class_name,
            average: Number(student.average),
          })),
          limit
        );
      }

      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('id, name')
        .eq('teacher_id', teacherId);
      if (classError) throw new Error(`Failed to resolve ranking scope: ${classError.message}`);
      if (!classes?.length) return { topStudents: [], atRiskStudents: [] };

      const classIds = classes.map((item: any) => item.id);
      const classNames = new Map(classes.map((item: any) => [item.id, item.name]));
      const { data: grades, error: gradeError } = await supabase
        .from('grades')
        .select('student_id, class_id, score')
        .in('class_id', classIds);
      if (gradeError) throw new Error(`Failed to fetch scoped grades: ${gradeError.message}`);
      if (!grades?.length) return { topStudents: [], atRiskStudents: [] };

      const studentIds = [...new Set(grades.map((grade: any) => grade.student_id))];
      const { data: profiles, error: profileError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', studentIds);
      if (profileError)
        throw new Error(`Failed to fetch ranking profiles: ${profileError.message}`);

      const profileNames = new Map(
        (profiles || []).map((profile: any) => [profile.id, profile.full_name])
      );
      const aggregates = new Map<string, { total: number; count: number; classIds: Set<string> }>();

      for (const grade of grades as any[]) {
        const score = Number(grade.score);
        if (!Number.isFinite(score)) continue;
        const current = aggregates.get(grade.student_id) || {
          total: 0,
          count: 0,
          classIds: new Set<string>(),
        };
        current.total += score;
        current.count += 1;
        if (grade.class_id) current.classIds.add(grade.class_id);
        aggregates.set(grade.student_id, current);
      }

      const students = [...aggregates.entries()].flatMap(([studentId, aggregate]) => {
        const studentName = profileNames.get(studentId);
        if (!studentName || aggregate.count === 0) return [];
        return [
          {
            studentId,
            studentName,
            className: [...aggregate.classIds]
              .map((id) => classNames.get(id))
              .filter(Boolean)
              .join(', '),
            average: aggregate.total / aggregate.count,
          },
        ];
      });

      return toRankingResult(students, limit);
    },
    { ttl: CACHE_TTL.SHORT, tags: ['grades', 'rankings'] }
  );

  return apiSuccess(result);
});
