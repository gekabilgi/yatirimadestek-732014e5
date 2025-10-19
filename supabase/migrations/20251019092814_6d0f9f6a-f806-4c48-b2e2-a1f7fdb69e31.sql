-- Fix persistent RLS issues on public.soru_cevap and add safe helper
-- 1) Helper to check YDO province access without RLS recursion
create or replace function public.has_ydo_province_access(_user_id uuid, _province text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.ydo_users yu
    where yu.user_id = _user_id
      and (yu.province is null or yu.province = _province)
  );
$$;

-- 2) Ensure RLS is enabled
alter table public.soru_cevap enable row level security;

-- 3) Drop ALL existing policies on soru_cevap to remove any restrictive blockers
DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='soru_cevap'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.soru_cevap', pol.policyname);
  END LOOP;
END $$;

-- 4) Public can read only approved/explicitly public answers
create policy "Public can view approved answers"
ON public.soru_cevap
for select
to public
using (
  answer is not null
  and btrim(answer) <> ''
  and (
    lower(coalesce(answer_status, '')) = 'approved'
    or sent_to_user = true
    or admin_sent = true
  )
);

-- 5) Admins full manage
create policy "Admins can manage soru_cevap"
ON public.soru_cevap
for all
to authenticated
using (public.has_role(auth.uid(), 'admin'))
with check (public.has_role(auth.uid(), 'admin'));

-- 6) Question owners can view/update their own (by email match)
create policy "Users can view own questions"
ON public.soru_cevap
for select
to authenticated
using ( (
  (auth.jwt() ->> 'email') = email
) or exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.email = email
));

create policy "Users can insert their own questions"
ON public.soru_cevap
for insert
to authenticated
with check (
  email is not null and question is not null and province is not null
  and ((auth.jwt() ->> 'email') = email or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.email = email
  ))
);

create policy "Users can update their own questions"
ON public.soru_cevap
for update
to authenticated
using ( (
  (auth.jwt() ->> 'email') = email
) or exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.email = email
))
with check ( (
  (auth.jwt() ->> 'email') = email
) or exists (
  select 1 from public.profiles p
  where p.id = auth.uid() and p.email = email
));

-- 7) YDO users can view questions for their province
create policy "YDO users can view province questions"
ON public.soru_cevap
for select
to authenticated
using ( public.has_ydo_province_access(auth.uid(), province) );
