-- Fix: recreate all RLS policies and grants
-- Run this in Supabase > SQL Editor > New query

-- ─── Grants ─────────────────────────────────────────────────────────────────
GRANT USAGE ON SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;
GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, anon;

-- ─── Helper: SECURITY DEFINER function to check trip membership ────────────
-- This bypasses RLS, preventing infinite recursion when policies on
-- trip_members (or tables that join through trip_members) reference it.
CREATE OR REPLACE FUNCTION public.is_trip_member(p_trip_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id AND user_id = p_user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.is_trip_owner(p_trip_id uuid, p_user_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.trip_members
    WHERE trip_id = p_trip_id AND user_id = p_user_id AND role = 'owner'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_trip_member(uuid, uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_trip_owner(uuid, uuid) TO authenticated, anon;

-- ─── Profiles ───────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "authenticated users can view profiles" ON public.profiles;
CREATE POLICY "authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "users can update own profile" ON public.profiles;
CREATE POLICY "users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- ─── Trips ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view trips" ON public.trips;
CREATE POLICY "members can view trips"
  ON public.trips FOR SELECT
  USING (public.is_trip_member(id, auth.uid()));

DROP POLICY IF EXISTS "authenticated users can create trips" ON public.trips;
CREATE POLICY "authenticated users can create trips"
  ON public.trips FOR INSERT
  WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "owners can update trips" ON public.trips;
CREATE POLICY "owners can update trips"
  ON public.trips FOR UPDATE
  USING (public.is_trip_owner(id, auth.uid()));

DROP POLICY IF EXISTS "owners can delete trips" ON public.trips;
CREATE POLICY "owners can delete trips"
  ON public.trips FOR DELETE
  USING (public.is_trip_owner(id, auth.uid()));

-- ─── Trip members ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view trip_members" ON public.trip_members;
CREATE POLICY "members can view trip_members"
  ON public.trip_members FOR SELECT
  USING (public.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "owners can insert trip_members" ON public.trip_members;
CREATE POLICY "owners can insert trip_members"
  ON public.trip_members FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    OR public.is_trip_owner(trip_id, auth.uid())
  );

DROP POLICY IF EXISTS "owners can delete trip_members" ON public.trip_members;
CREATE POLICY "owners can delete trip_members"
  ON public.trip_members FOR DELETE
  USING (public.is_trip_owner(trip_id, auth.uid()));

-- ─── Locations ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view locations" ON public.locations;
CREATE POLICY "members can view locations"
  ON public.locations FOR SELECT
  USING (public.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "members can manage locations" ON public.locations;
CREATE POLICY "members can manage locations"
  ON public.locations FOR ALL
  USING (public.is_trip_member(trip_id, auth.uid()))
  WITH CHECK (public.is_trip_member(trip_id, auth.uid()));

-- ─── Accommodations ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view accommodations" ON public.accommodations;
CREATE POLICY "members can view accommodations"
  ON public.accommodations FOR SELECT
  USING (public.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "members can add accommodations" ON public.accommodations;
CREATE POLICY "members can add accommodations"
  ON public.accommodations FOR INSERT
  WITH CHECK (
    auth.uid() = created_by
    AND public.is_trip_member(trip_id, auth.uid())
  );

DROP POLICY IF EXISTS "owners can update accommodations" ON public.accommodations;
CREATE POLICY "owners can update accommodations"
  ON public.accommodations FOR UPDATE
  USING (public.is_trip_owner(trip_id, auth.uid()));

DROP POLICY IF EXISTS "owners can delete accommodations" ON public.accommodations;
CREATE POLICY "owners can delete accommodations"
  ON public.accommodations FOR DELETE
  USING (public.is_trip_owner(trip_id, auth.uid()));

-- ─── Accommodation votes ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view votes" ON public.accommodation_votes;
CREATE POLICY "members can view votes"
  ON public.accommodation_votes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.accommodations a
    WHERE a.id = accommodation_votes.accommodation_id
      AND public.is_trip_member(a.trip_id, auth.uid())
  ));

DROP POLICY IF EXISTS "members can vote" ON public.accommodation_votes;
CREATE POLICY "members can vote"
  ON public.accommodation_votes FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public.accommodations a
      WHERE a.id = accommodation_votes.accommodation_id
        AND public.is_trip_member(a.trip_id, auth.uid())
    )
  );

DROP POLICY IF EXISTS "users can remove own vote" ON public.accommodation_votes;
CREATE POLICY "users can remove own vote"
  ON public.accommodation_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Itinerary days ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view itinerary_days" ON public.itinerary_days;
CREATE POLICY "members can view itinerary_days"
  ON public.itinerary_days FOR SELECT
  USING (public.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "members can manage itinerary_days" ON public.itinerary_days;
CREATE POLICY "members can manage itinerary_days"
  ON public.itinerary_days FOR ALL
  USING (public.is_trip_member(trip_id, auth.uid()))
  WITH CHECK (public.is_trip_member(trip_id, auth.uid()));

-- ─── Travel legs ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view travel_legs" ON public.travel_legs;
CREATE POLICY "members can view travel_legs"
  ON public.travel_legs FOR SELECT
  USING (public.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "users can insert own travel_legs" ON public.travel_legs;
CREATE POLICY "users can insert own travel_legs"
  ON public.travel_legs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND public.is_trip_member(trip_id, auth.uid())
  );

DROP POLICY IF EXISTS "users can update own travel_legs" ON public.travel_legs;
CREATE POLICY "users can update own travel_legs"
  ON public.travel_legs FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "users can delete own travel_legs" ON public.travel_legs;
CREATE POLICY "users can delete own travel_legs"
  ON public.travel_legs FOR DELETE
  USING (auth.uid() = user_id);

-- ─── Ideas ──────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view ideas" ON public.ideas;
CREATE POLICY "members can view ideas"
  ON public.ideas FOR SELECT
  USING (public.is_trip_member(trip_id, auth.uid()));

DROP POLICY IF EXISTS "members can add ideas" ON public.ideas;
CREATE POLICY "members can add ideas"
  ON public.ideas FOR INSERT
  WITH CHECK (
    auth.uid() = submitted_by
    AND public.is_trip_member(trip_id, auth.uid())
  );

DROP POLICY IF EXISTS "submitters can update ideas" ON public.ideas;
CREATE POLICY "submitters can update ideas"
  ON public.ideas FOR UPDATE
  USING (auth.uid() = submitted_by);

DROP POLICY IF EXISTS "submitters and owners can delete ideas" ON public.ideas;
CREATE POLICY "submitters and owners can delete ideas"
  ON public.ideas FOR DELETE
  USING (
    auth.uid() = submitted_by
    OR public.is_trip_owner(trip_id, auth.uid())
  );

-- ─── Idea day links ─────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "members can view idea_day_links" ON public.idea_day_links;
CREATE POLICY "members can view idea_day_links"
  ON public.idea_day_links FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.ideas i
    WHERE i.id = idea_day_links.idea_id
      AND public.is_trip_member(i.trip_id, auth.uid())
  ));

DROP POLICY IF EXISTS "members can manage idea_day_links" ON public.idea_day_links;
CREATE POLICY "members can manage idea_day_links"
  ON public.idea_day_links FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.ideas i
    WHERE i.id = idea_day_links.idea_id
      AND public.is_trip_member(i.trip_id, auth.uid())
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ideas i
    WHERE i.id = idea_day_links.idea_id
      AND public.is_trip_member(i.trip_id, auth.uid())
  ));
