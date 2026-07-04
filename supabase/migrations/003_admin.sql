-- 003_admin.sql - AML admin: blog posts, contact inbox, product management,
-- and lesson-booking workflow. All admin checks use app_metadata.role
-- (server-set only) via the same expression as 002's orders policies.

-- 1. Blog posts (published posts are public; drafts admin-only)
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  excerpt text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  published boolean NOT NULL DEFAULT false,
  published_at timestamptz
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "published posts are publicly readable"
  ON posts FOR SELECT USING (published = true);

CREATE POLICY "admins read all posts"
  ON posts FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admins write posts"
  ON posts FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 2. Contact inbox - every contact-form submission is stored for the admin
-- panel (the notification email remains best-effort delivery on top).
CREATE TABLE contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied'))
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

-- Inserts come from the contact API via service client; no public policy.
CREATE POLICY "admins read messages"
  ON contact_messages FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admins update message status"
  ON contact_messages FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 3. Product management - admins manage the catalogue from the panel.
CREATE POLICY "admins read all products"
  ON products FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admins write products"
  ON products FOR ALL
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
  WITH CHECK ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- 4. Booking workflow - lesson orders move new -> scheduled -> fulfilled.
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('new', 'scheduled', 'fulfilled'));
