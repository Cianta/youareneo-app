-- Match existing app save access even when the Supabase Data API is used directly.
alter policy "Members create their own workspace snapshot" on public.guiding_workspace_snapshots
with check ((select auth.uid()) = user_id and (select public.trinity_can_save()));
alter policy "Members update their own workspace snapshot" on public.guiding_workspace_snapshots
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id and (select public.trinity_can_save()));
