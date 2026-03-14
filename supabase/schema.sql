-- tae-atlas full schema
-- Run supabase/reset.sql first, then run this file.
-- Supabase > SQL Editor > New query

-- ─── Profiles ────────────────────────────────────────────────────────────────
-- Mirrors auth.users so we can display names and look up users by email.

create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  avatar_url  text,
  email       text,
  updated_at  timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "authenticated users can view profiles"
  on public.profiles for select
  using (auth.uid() is not null);

create policy "users can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Auto-create profile when someone signs up (captures Google name / avatar)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, full_name, avatar_url, email)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url',
    new.email
  )
  on conflict (id) do update set
    full_name  = excluded.full_name,
    avatar_url = excluded.avatar_url,
    email      = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ─── Shared helpers ──────────────────────────────────────────────────────────

create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;


-- ─── Trips ───────────────────────────────────────────────────────────────────

create type public.trip_member_role as enum ('owner', 'viewer');

create table public.trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  destination text,
  description text,
  created_by  uuid not null references public.profiles(id) on delete cascade,
  start_date  date,
  end_date    date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger trips_updated_at
  before update on public.trips
  for each row execute procedure public.handle_updated_at();

create table public.trip_members (
  trip_id    uuid not null references public.trips(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  role       public.trip_member_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

-- Auto-add trip creator as owner
create or replace function public.handle_new_trip()
returns trigger language plpgsql security definer as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute procedure public.handle_new_trip();

alter table public.trips enable row level security;
alter table public.trip_members enable row level security;

create policy "members can view trips"
  on public.trips for select
  using (exists (
    select 1 from public.trip_members where trip_id = trips.id and user_id = auth.uid()
  ));

create policy "authenticated users can create trips"
  on public.trips for insert
  with check (auth.uid() = created_by);

create policy "owners can update trips"
  on public.trips for update
  using (exists (
    select 1 from public.trip_members where trip_id = trips.id and user_id = auth.uid() and role = 'owner'
  ));

create policy "owners can delete trips"
  on public.trips for delete
  using (exists (
    select 1 from public.trip_members where trip_id = trips.id and user_id = auth.uid() and role = 'owner'
  ));

create policy "members can view trip_members"
  on public.trip_members for select
  using (exists (
    select 1 from public.trip_members tm where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid()
  ));

create policy "owners can insert trip_members"
  on public.trip_members for insert
  with check (
    auth.uid() = user_id
    or exists (
      select 1 from public.trip_members tm
      where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid() and tm.role = 'owner'
    )
  );

create policy "owners can delete trip_members"
  on public.trip_members for delete
  using (exists (
    select 1 from public.trip_members tm
    where tm.trip_id = trip_members.trip_id and tm.user_id = auth.uid() and tm.role = 'owner'
  ));


-- ─── Locations ───────────────────────────────────────────────────────────────
-- Cities / areas within a trip — used to group ideas (e.g. "Edinburgh", "Glasgow")

create table public.locations (
  id         uuid primary key default gen_random_uuid(),
  trip_id    uuid not null references public.trips(id) on delete cascade,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.locations enable row level security;

create policy "members can view locations"
  on public.locations for select
  using (exists (
    select 1 from public.trip_members where trip_id = locations.trip_id and user_id = auth.uid()
  ));

create policy "members can manage locations"
  on public.locations for all
  using (exists (
    select 1 from public.trip_members where trip_id = locations.trip_id and user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.trip_members where trip_id = locations.trip_id and user_id = auth.uid()
  ));


-- ─── Accommodations ──────────────────────────────────────────────────────────

create table public.accommodations (
  id               uuid primary key default gen_random_uuid(),
  trip_id          uuid not null references public.trips(id) on delete cascade,
  name             text not null,
  address          text,
  url              text,
  price_per_night  numeric,
  check_in_date    date,
  check_out_date   date,
  notes            text,
  is_selected      boolean not null default false,
  created_by       uuid not null references public.profiles(id) on delete cascade,
  created_at       timestamptz not null default now()
);

create table public.accommodation_votes (
  accommodation_id uuid not null references public.accommodations(id) on delete cascade,
  user_id          uuid not null references public.profiles(id) on delete cascade,
  primary key (accommodation_id, user_id)
);

alter table public.accommodations enable row level security;
alter table public.accommodation_votes enable row level security;

create policy "members can view accommodations"
  on public.accommodations for select
  using (exists (
    select 1 from public.trip_members where trip_id = accommodations.trip_id and user_id = auth.uid()
  ));

create policy "members can add accommodations"
  on public.accommodations for insert
  with check (
    auth.uid() = created_by
    and exists (
      select 1 from public.trip_members where trip_id = accommodations.trip_id and user_id = auth.uid()
    )
  );

create policy "owners can update accommodations"
  on public.accommodations for update
  using (exists (
    select 1 from public.trip_members
    where trip_id = accommodations.trip_id and user_id = auth.uid() and role = 'owner'
  ));

create policy "owners can delete accommodations"
  on public.accommodations for delete
  using (exists (
    select 1 from public.trip_members
    where trip_id = accommodations.trip_id and user_id = auth.uid() and role = 'owner'
  ));

create policy "members can view votes"
  on public.accommodation_votes for select
  using (exists (
    select 1 from public.accommodations a
    join public.trip_members tm on tm.trip_id = a.trip_id
    where a.id = accommodation_votes.accommodation_id and tm.user_id = auth.uid()
  ));

create policy "members can vote"
  on public.accommodation_votes for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.accommodations a
      join public.trip_members tm on tm.trip_id = a.trip_id
      where a.id = accommodation_votes.accommodation_id and tm.user_id = auth.uid()
    )
  );

create policy "users can remove own vote"
  on public.accommodation_votes for delete
  using (auth.uid() = user_id);


-- ─── Itinerary days ──────────────────────────────────────────────────────────

create table public.itinerary_days (
  id               uuid primary key default gen_random_uuid(),
  trip_id          uuid not null references public.trips(id) on delete cascade,
  date             date not null,
  location         text,
  accommodation_id uuid references public.accommodations(id) on delete set null,
  notes            text,
  created_at       timestamptz not null default now(),
  unique(trip_id, date)
);

alter table public.itinerary_days enable row level security;

create policy "members can view itinerary_days"
  on public.itinerary_days for select
  using (exists (
    select 1 from public.trip_members where trip_id = itinerary_days.trip_id and user_id = auth.uid()
  ));

create policy "members can manage itinerary_days"
  on public.itinerary_days for all
  using (exists (
    select 1 from public.trip_members where trip_id = itinerary_days.trip_id and user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.trip_members where trip_id = itinerary_days.trip_id and user_id = auth.uid()
  ));


-- ─── Travel legs ─────────────────────────────────────────────────────────────

create type public.travel_type as enum ('flight', 'drive');
create type public.travel_direction as enum ('arrival', 'departure');

create table public.travel_legs (
  id                  uuid primary key default gen_random_uuid(),
  trip_id             uuid not null references public.trips(id) on delete cascade,
  user_id             uuid not null references public.profiles(id) on delete cascade,
  type                public.travel_type not null,
  direction           public.travel_direction not null,
  origin              text not null,
  destination         text not null,
  departure_date      date not null,
  departure_time      time not null,
  arrival_date        date not null,
  arrival_time        time not null,
  -- flight-specific (optional)
  airline             text,
  flight_number       text,
  confirmation_number text,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create trigger travel_legs_updated_at
  before update on public.travel_legs
  for each row execute procedure public.handle_updated_at();

alter table public.travel_legs enable row level security;

create policy "members can view travel_legs"
  on public.travel_legs for select
  using (exists (
    select 1 from public.trip_members where trip_id = travel_legs.trip_id and user_id = auth.uid()
  ));

create policy "users can insert own travel_legs"
  on public.travel_legs for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.trip_members where trip_id = travel_legs.trip_id and user_id = auth.uid()
    )
  );

create policy "users can update own travel_legs"
  on public.travel_legs for update
  using (auth.uid() = user_id);

create policy "users can delete own travel_legs"
  on public.travel_legs for delete
  using (auth.uid() = user_id);


-- ─── Ideas ───────────────────────────────────────────────────────────────────

create table public.ideas (
  id           uuid primary key default gen_random_uuid(),
  trip_id      uuid not null references public.trips(id) on delete cascade,
  location_id  uuid references public.locations(id) on delete set null,
  title        text not null,
  description  text,
  url          text,
  category     text,
  submitted_by uuid not null references public.profiles(id) on delete cascade,
  created_at   timestamptz not null default now()
);

-- Link ideas to specific calendar days (optional)
create table public.idea_day_links (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  day_id  uuid not null references public.itinerary_days(id) on delete cascade,
  primary key (idea_id, day_id)
);

alter table public.ideas enable row level security;
alter table public.idea_day_links enable row level security;

create policy "members can view ideas"
  on public.ideas for select
  using (exists (
    select 1 from public.trip_members where trip_id = ideas.trip_id and user_id = auth.uid()
  ));

create policy "members can add ideas"
  on public.ideas for insert
  with check (
    auth.uid() = submitted_by
    and exists (
      select 1 from public.trip_members where trip_id = ideas.trip_id and user_id = auth.uid()
    )
  );

create policy "submitters can update ideas"
  on public.ideas for update
  using (auth.uid() = submitted_by);

create policy "submitters and owners can delete ideas"
  on public.ideas for delete
  using (
    auth.uid() = submitted_by
    or exists (
      select 1 from public.trip_members
      where trip_id = ideas.trip_id and user_id = auth.uid() and role = 'owner'
    )
  );

create policy "members can view idea_day_links"
  on public.idea_day_links for select
  using (exists (
    select 1 from public.ideas i
    join public.trip_members tm on tm.trip_id = i.trip_id
    where i.id = idea_day_links.idea_id and tm.user_id = auth.uid()
  ));

create policy "members can manage idea_day_links"
  on public.idea_day_links for all
  using (exists (
    select 1 from public.ideas i
    join public.trip_members tm on tm.trip_id = i.trip_id
    where i.id = idea_day_links.idea_id and tm.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.ideas i
    join public.trip_members tm on tm.trip_id = i.trip_id
    where i.id = idea_day_links.idea_id and tm.user_id = auth.uid()
  ));
