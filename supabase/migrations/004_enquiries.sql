-- 004_enquiries.sql - route enquiries by topic and surface the newsletter
-- list in the admin panel.

-- 1. Contact messages carry a topic so the admin inbox can group enquiries
-- by what they're about (matching the three pillars of the site).
ALTER TABLE contact_messages
  ADD COLUMN topic text NOT NULL DEFAULT 'general'
  CHECK (topic IN ('lessons', 'shop', 'game', 'general'));

-- 2. Newsletter subscribers become readable from the admin panel. Inserts
-- remain service-role only (the signup API); no public read.
CREATE POLICY "admins read subscribers"
  ON newsletter_subscribers FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
