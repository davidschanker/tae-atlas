-- Run this first if you need to wipe and start fresh.
-- Go to Supabase > SQL Editor > New query, paste and run.

drop table if exists public.idea_day_links cascade;
drop table if exists public.ideas cascade;
drop table if exists public.travel_legs cascade;
drop table if exists public.itinerary_days cascade;
drop table if exists public.accommodation_votes cascade;
drop table if exists public.accommodations cascade;
drop table if exists public.locations cascade;
drop table if exists public.trip_members cascade;
drop table if exists public.trips cascade;
drop table if exists public.profiles cascade;

drop type if exists public.trip_member_role cascade;
drop type if exists public.travel_type cascade;
drop type if exists public.travel_direction cascade;

drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_trip() cascade;
drop function if exists public.handle_updated_at() cascade;
