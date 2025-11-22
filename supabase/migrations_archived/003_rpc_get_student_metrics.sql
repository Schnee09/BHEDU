-- rpc_get_student_metrics.sql
create or replace function public.get_student_metrics(p_student_id uuid)
returns jsonb
language plpgsql
as $$
declare
  recent_scores jsonb;
  avg_score numeric;
  attendance_stats jsonb;
  late_submissions int;
begin
  select jsonb_agg(jsonb_build_object(
    'class_id', s.class_id,
    'assignment_id', s.assignment_id,
    'score', s.score,
    'graded_at', s.graded_at
  ) order by s.graded_at desc)
  into recent_scores
  from scores s
  where s.student_id = p_student_id
  limit 20;

  select round(avg(score)::numeric,2) into avg_score from scores where student_id = p_student_id;

  select jsonb_build_object(
    'total_days', count(a.*),
    'absent', sum((a.status = 'absent')::int),
    'late', sum((a.status = 'late')::int)
  ) into attendance_stats
  from attendance a
  where a.student_id = p_student_id;

  select count(*) into late_submissions
  from submissions sb
  join assignments ass on ass.id = sb.assignment_id
  where sb.student_id = p_student_id and sb.submitted_at > ass.due_date;

  return jsonb_build_object(
    'student_id', p_student_id,
    'average_score', coalesce(avg_score,0),
    'recent_scores', coalesce(recent_scores,'[]'::jsonb),
    'attendance', coalesce(attendance_stats,jsonb_build_object('total_days',0,'absent',0,'late',0)),
    'late_submissions', coalesce(late_submissions,0),
    'generated_at', now()
  );
end;
$$;
