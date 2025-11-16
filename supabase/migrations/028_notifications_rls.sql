-- 028: Notifications RLS policies
-- Date: 2025-11-16

alter table if exists public.notifications enable row level security;

-- Users can read their own notifications
drop policy if exists "Users read own notifications" on public.notifications;
create policy "Users read own notifications"
  on public.notifications for select
  using (target_id = auth.uid());

-- Users can mark their own notifications as read
drop policy if exists "Users update own notifications" on public.notifications;
create policy "Users update own notifications"
  on public.notifications for update
  using (target_id = auth.uid());
