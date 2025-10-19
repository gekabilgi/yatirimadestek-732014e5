-- Create secure RPCs to avoid RLS errors while exposing only safe data
create or replace function public.get_ydo_user_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint from public.ydo_users;
$$;

create or replace function public.get_public_qna(limit_count integer default 100)
returns table(
  id uuid,
  category text,
  question text,
  answer text,
  province text,
  created_at timestamptz,
  answer_date timestamptz,
  question_number integer
)
language sql
stable
security definer
set search_path = public
as $$
  select id, category, question, answer, province, created_at, answer_date, question_number
  from public.soru_cevap
  where answer is not null and btrim(answer) <> '' and (
    lower(coalesce(answer_status, '')) = 'approved'
    or sent_to_user = true
    or admin_sent = true
  )
  order by created_at desc
  limit coalesce(limit_count, 100);
$$;

create or replace function public.get_public_qna_count()
returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::bigint
  from public.soru_cevap
  where answer is not null and btrim(answer) <> '' and (
    lower(coalesce(answer_status, '')) = 'approved'
    or sent_to_user = true
    or admin_sent = true
  );
$$;