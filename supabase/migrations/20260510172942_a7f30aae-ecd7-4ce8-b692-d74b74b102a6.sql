
revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.has_role(uuid, public.app_role) from public, anon;
revoke all on function public.is_superadmin() from public, anon;

drop policy if exists "auth insert audit" on public.audit;
create policy "auth insert audit" on public.audit for insert to authenticated
  with check (auth.uid() is not null);
