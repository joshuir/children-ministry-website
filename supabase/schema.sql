-- =====================================================================
-- Little Lights Children's Church — Supabase schema
-- Run in the Supabase SQL editor (or `supabase db push`).
--
-- Principles
--  * Row Level Security on every table. The browser only ever holds the
--    anon key; what it can read or write is decided here, not in the UI.
--  * Children never have accounts, profiles or rows of their own.
--  * Everything public-facing is moderated: posts by an admin, comments by
--    a teacher or admin.
--  * Public forms go through SECURITY DEFINER functions that validate input
--    and rate-limit, so the underlying tables are never writable directly.
-- =====================================================================

create extension if not exists pgcrypto;

-- ---------- Roles ----------------------------------------------------
create type public.app_role as enum ('parent', 'teacher', 'admin');

create table public.profiles (
  id          uuid primary key references auth.users on delete cascade,
  display_name text not null check (char_length(display_name) between 2 and 60),
  role        public.app_role not null default 'parent',
  teacher_id  text,                         -- links staff accounts to a public teacher card
  suspended   boolean not null default false,
  created_at  timestamptz not null default now()
);

-- New sign-ups are always parents. Only an admin can promote someone.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(nullif(new.raw_user_meta_data->>'display_name', ''), 'Parent'));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

create or replace function public.my_role() returns public.app_role
language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid() and not suspended
$$;
create or replace function public.is_staff() returns boolean
language sql stable as $$ select coalesce(public.my_role() in ('teacher','admin'), false) $$;
create or replace function public.is_admin() returns boolean
language sql stable as $$ select coalesce(public.my_role() = 'admin', false) $$;

-- ---------- Site settings (single row) --------------------------------
create table public.site_settings (
  id          int primary key default 1 check (id = 1),
  data        jsonb not null,               -- shape of SiteSettings in lib/types.ts
  updated_at  timestamptz not null default now(),
  updated_by  uuid references auth.users
);

-- ---------- Teachers, classes, lessons --------------------------------
create table public.teachers (
  id         text primary key,
  name       text not null,
  role       text not null,
  bio        text not null default '',
  photo      text,                          -- Storage URL (adult staff only)
  tone       text not null default 'blue',
  "classIds" text[] not null default '{}',
  sort       int not null default 0,
  published  boolean not null default true
);

create table public.classes (
  id          text primary key,
  name        text not null,
  "group"     text not null check ("group" in ('beginners','primary','juniors','seniors')),
  ages        text not null,
  room        text not null,
  "teacherIds" text[] not null default '{}',
  description text not null default '',
  sort        int not null default 0
);

create table public.lessons (
  pk           uuid primary key default gen_random_uuid(),
  id           text not null,               -- slug, e.g. the-good-samaritan
  "classId"    text not null references public.classes on delete cascade,
  date         date not null,
  title        text not null,
  reference    text not null,
  "memoryVerse" jsonb not null,             -- { text, reference }
  topic        text not null,
  objective    text not null,
  story        text[] not null default '{}',
  questions    text[] not null default '{}',
  activity     jsonb not null default '{"title":"","steps":[]}',
  prayer       text not null default '',
  resources    jsonb not null default '[]', -- [{ label, type, url, size }]
  published    boolean not null default false,
  updated_by   uuid references auth.users,
  updated_at   timestamptz not null default now(),
  unique ("classId", id)
);

-- ---------- Events & gallery ------------------------------------------
create table public.events (
  id        text primary key,
  title     text not null,
  date      date not null,
  "endDate" date,
  time      text not null,
  location  text not null,
  summary   text not null,
  tone      text not null default 'blue',
  scene     text not null default 'sunrise',
  published boolean not null default true
);

create table public.gallery_items (
  id          text primary key default gen_random_uuid()::text,
  category    text not null check (category in ('children-harvest','parents-day','graduation','hosanna','evangelism','excursion','camping')),
  type        text not null check (type in ('image','video')),
  event       text not null,
  caption     text not null,
  date        date not null,
  media       jsonb not null,               -- { src, alt, scene?, tone? }
  aspect      text not null default 'square',
  consent_confirmed boolean not null,       -- uploader confirmed parental photo consent
  published   boolean not null default false,
  uploaded_by uuid references auth.users default auth.uid(),
  created_at  timestamptz not null default now(),
  constraint consent_required check (consent_confirmed)
);

-- ---------- Feed: posts, reactions, comments, reports ----------------
create table public.posts (
  id          text primary key default gen_random_uuid()::text,
  kind        text not null check (kind in ('image','video','text','verse','announcement','event')),
  "authorId"  text not null references public.teachers,
  author_user uuid not null references auth.users default auth.uid(),
  body        text not null check (char_length(body) between 1 and 1500),
  media       jsonb,
  verse       jsonb,
  event       jsonb,
  pinned      boolean not null default false,
  status      text not null default 'pending' check (status in ('pending','published','hidden')),
  "createdAt" timestamptz not null default now(),
  approved_by uuid references auth.users
);

create table public.post_reactions (
  post_id  text references public.posts on delete cascade,
  user_id  uuid references auth.users on delete cascade default auth.uid(),
  reaction text not null check (reaction in ('love','laugh','wow','pray','like')),
  primary key (post_id, user_id)            -- one reaction per person per post
);

create table public.post_saves (
  post_id text references public.posts on delete cascade,
  user_id uuid references auth.users on delete cascade default auth.uid(),
  primary key (post_id, user_id)
);

create table public.comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     text not null references public.posts on delete cascade,
  parent_id   uuid references public.comments on delete cascade,
  user_id     uuid not null references auth.users on delete cascade default auth.uid(),
  body        text not null check (char_length(body) between 1 and 500),
  status      text not null default 'pending' check (status in ('pending','approved','removed')),
  created_at  timestamptz not null default now(),
  -- block the most common personal-information leaks at the database level too
  constraint no_contact_details check (
    body !~* '[^\s@]+@[^\s@]+\.[a-z]{2,}' and body !~ '\+?\d[\d\s-]{7,}\d'
  )
);

create table public.comment_likes (
  comment_id uuid references public.comments on delete cascade,
  user_id    uuid references auth.users on delete cascade default auth.uid(),
  primary key (comment_id, user_id)
);

create table public.reports (
  id          uuid primary key default gen_random_uuid(),
  post_id     text references public.posts on delete cascade,
  comment_id  uuid references public.comments on delete cascade,
  reporter    uuid references auth.users default auth.uid(),
  reason      text check (char_length(reason) <= 300),
  resolved    boolean not null default false,
  created_at  timestamptz not null default now(),
  check (post_id is not null or comment_id is not null)
);

-- ---------- Forms ----------------------------------------------------
create table public.contact_messages (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  email      text not null,
  phone      text,
  subject    text not null,
  message    text not null,
  created_at timestamptz not null default now(),
  handled    boolean not null default false
);

create table public.newsletter_subscribers (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null unique,
  created_at   timestamptz not null default now(),
  unsubscribed_at timestamptz,
  unsubscribe_token uuid not null default gen_random_uuid()
);

-- ---------- Rate limiting --------------------------------------------
create table public.rate_events (
  bucket     text not null,                 -- e.g. 'comment:<uid>', 'contact:<email>'
  created_at timestamptz not null default now()
);
create index on public.rate_events (bucket, created_at desc);

create or replace function public.rate_limit(p_bucket text, p_max int, p_window interval)
returns void language plpgsql security definer set search_path = public as $$
begin
  if (select count(*) from rate_events where bucket = p_bucket and created_at > now() - p_window) >= p_max then
    raise exception 'rate limit exceeded' using errcode = 'P0001';
  end if;
  insert into rate_events (bucket) values (p_bucket);
  delete from rate_events where created_at < now() - interval '2 days';
end $$;

-- Comments: max 5 per user per 10 minutes, suspended users blocked.
create or replace function public.comments_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if (select suspended from profiles where id = auth.uid()) then raise exception 'account suspended'; end if;
  perform rate_limit('comment:' || auth.uid(), 5, interval '10 minutes');
  new.status := case when is_staff() then 'approved' else 'pending' end;  -- parents are always moderated
  new.user_id := auth.uid();
  return new;
end $$;
create trigger comments_guard before insert on public.comments
  for each row execute function public.comments_guard();

-- Posts: teachers' posts always start pending; only admins publish.
create or replace function public.posts_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  perform rate_limit('post:' || auth.uid(), 10, interval '1 hour');
  new.author_user := auth.uid();
  if not is_admin() then new.status := 'pending'; new.pinned := false; end if;
  return new;
end $$;
create trigger posts_guard before insert on public.posts
  for each row execute function public.posts_guard();

-- Public contact form
create or replace function public.submit_contact(p_name text, p_email text, p_phone text, p_subject text, p_message text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(p_name)) not between 2 and 80
     or p_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$'
     or char_length(trim(p_message)) not between 10 and 2000
     or char_length(p_subject) > 80 then
    raise exception 'invalid input';
  end if;
  perform rate_limit('contact:' || lower(p_email), 3, interval '1 hour');
  perform rate_limit('contact:all', 60, interval '1 hour');   -- global flood protection
  insert into contact_messages (name, email, phone, subject, message)
  values (trim(p_name), lower(trim(p_email)), nullif(trim(p_phone), ''), p_subject, trim(p_message));
end $$;

-- Public newsletter sign-up (idempotent — never reveals whether an email exists)
create or replace function public.subscribe_newsletter(p_name text, p_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if char_length(trim(p_name)) not between 1 and 80 or p_email !~* '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then
    raise exception 'invalid input';
  end if;
  perform rate_limit('newsletter:' || lower(p_email), 3, interval '1 hour');
  perform rate_limit('newsletter:all', 200, interval '1 hour');
  insert into newsletter_subscribers (name, email) values (trim(p_name), lower(trim(p_email)))
  on conflict (email) do update set unsubscribed_at = null, name = excluded.name;
end $$;

revoke all on function public.submit_contact, public.subscribe_newsletter from public;
grant execute on function public.submit_contact, public.subscribe_newsletter to anon, authenticated;

-- ---------- Row Level Security ---------------------------------------
alter table public.profiles               enable row level security;
alter table public.site_settings          enable row level security;
alter table public.teachers               enable row level security;
alter table public.classes                enable row level security;
alter table public.lessons                enable row level security;
alter table public.events                 enable row level security;
alter table public.gallery_items          enable row level security;
alter table public.posts                  enable row level security;
alter table public.post_reactions         enable row level security;
alter table public.post_saves             enable row level security;
alter table public.comments               enable row level security;
alter table public.comment_likes          enable row level security;
alter table public.reports                enable row level security;
alter table public.contact_messages       enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.rate_events            enable row level security;   -- no policies: functions only

-- profiles
create policy "read own profile"   on public.profiles for select using (id = auth.uid() or is_staff());
create policy "edit own name"      on public.profiles for update using (id = auth.uid()) with check (id = auth.uid() and role = (select role from public.profiles where id = auth.uid()));
create policy "admins manage"      on public.profiles for all using (is_admin()) with check (is_admin());

-- public content: anyone can read what's published; staff/admins write
create policy "public settings"    on public.site_settings for select using (true);
create policy "admin settings"     on public.site_settings for all using (is_admin()) with check (is_admin());

create policy "public teachers"    on public.teachers for select using (published or is_staff());
create policy "admin teachers"     on public.teachers for all using (is_admin()) with check (is_admin());

create policy "public classes"     on public.classes for select using (true);
create policy "admin classes"      on public.classes for all using (is_admin()) with check (is_admin());

create policy "public lessons"     on public.lessons for select using (published or is_staff());
create policy "staff lessons"      on public.lessons for all using (is_staff()) with check (is_staff());

create policy "public events"      on public.events for select using (published or is_staff());
create policy "admin events"       on public.events for all using (is_admin()) with check (is_admin());

create policy "public gallery"     on public.gallery_items for select using (published or is_staff());
create policy "staff upload"       on public.gallery_items for insert with check (is_staff());
create policy "admin gallery"      on public.gallery_items for update using (is_admin()) with check (is_admin());
create policy "admin gallery del"  on public.gallery_items for delete using (is_admin());

-- posts
create policy "public posts"       on public.posts for select using (status = 'published' or is_staff());
create policy "staff create posts" on public.posts for insert with check (is_staff());
create policy "admin moderate"     on public.posts for update using (is_admin()) with check (is_admin());
create policy "admin delete"       on public.posts for delete using (is_admin());

-- reactions & saves: signed-in users manage their own
create policy "read reactions"     on public.post_reactions for select using (true);
create policy "own reactions"      on public.post_reactions for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own saves"          on public.post_saves for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- comments: approved are public; authors see their own pending ones
create policy "read comments"      on public.comments for select using (status = 'approved' or user_id = auth.uid() or is_staff());
create policy "signed-in comment"  on public.comments for insert with check (auth.uid() is not null);
create policy "staff moderate"     on public.comments for update using (is_staff()) with check (is_staff());
create policy "delete own/staff"   on public.comments for delete using (user_id = auth.uid() or is_staff());

create policy "read likes"         on public.comment_likes for select using (true);
create policy "own likes"          on public.comment_likes for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy "anyone signed-in reports" on public.reports for insert with check (auth.uid() is not null);
create policy "staff read reports" on public.reports for select using (is_staff());
create policy "staff resolve"      on public.reports for update using (is_staff()) with check (is_staff());

-- form data: never readable publicly
create policy "admin contact"      on public.contact_messages for all using (is_admin()) with check (is_admin());
create policy "admin subscribers"  on public.newsletter_subscribers for all using (is_admin()) with check (is_admin());

-- ---------- Storage: media bucket ------------------------------------
-- Only staff can upload; files are public-read; 5 MB images / 50 MB video.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 52428800, array['image/jpeg','image/png','image/webp','video/mp4','video/webm','video/quicktime','application/pdf','audio/mpeg'])
on conflict (id) do nothing;

create policy "staff upload media" on storage.objects for insert
  with check (bucket_id = 'media' and public.is_staff());
create policy "admin manage media" on storage.objects for update using (bucket_id = 'media' and public.is_admin());
create policy "admin delete media" on storage.objects for delete using (bucket_id = 'media' and public.is_admin());

-- Display names/roles only (no flags or ids beyond the key) for showing comment authors.
create or replace view public.public_profiles as
  select id, display_name, role from public.profiles where not suspended;
grant select on public.public_profiles to anon, authenticated;

-- ---------- Public read view for the feed ----------------------------
-- Shapes posts exactly like the `Post` type in lib/types.ts.
create or replace view public.feed_posts with (security_invoker = true) as
select
  p.id, p.kind, p."authorId", p."createdAt", p.body, p.media, p.verse, p.event, p.pinned, p.status,
  jsonb_build_object(
    'love',  count(r.*) filter (where r.reaction = 'love'),
    'laugh', count(r.*) filter (where r.reaction = 'laugh'),
    'wow',   count(r.*) filter (where r.reaction = 'wow'),
    'pray',  count(r.*) filter (where r.reaction = 'pray'),
    'like',  count(r.*) filter (where r.reaction = 'like')
  ) as reactions,
  coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', c.id, 'author', pr.display_name, 'authorRole', pr.role, 'body', c.body,
      'createdAt', c.created_at, 'likes', (select count(*) from public.comment_likes l where l.comment_id = c.id),
      'replies', coalesce((
        select jsonb_agg(jsonb_build_object('id', rc.id, 'author', rp.display_name, 'authorRole', rp.role, 'body', rc.body, 'createdAt', rc.created_at,
                                            'likes', (select count(*) from public.comment_likes l2 where l2.comment_id = rc.id)) order by rc.created_at)
        from public.comments rc join public.public_profiles rp on rp.id = rc.user_id
        where rc.parent_id = c.id and rc.status = 'approved'), '[]'::jsonb)
    ) order by c.created_at)
    from public.comments c join public.public_profiles pr on pr.id = c.user_id
    where c.post_id = p.id and c.parent_id is null and c.status = 'approved'
  ), '[]'::jsonb) as comments
from public.posts p
left join public.post_reactions r on r.post_id = p.id
group by p.id;
