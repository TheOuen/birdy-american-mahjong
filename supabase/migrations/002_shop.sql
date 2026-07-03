-- 002_shop.sql — AML shop: products, orders, newsletter

-- ============================================
-- 1. Products (shop catalog)
-- ============================================
CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  price_pence integer NOT NULL CHECK (price_pence > 0),
  type text NOT NULL CHECK (type IN ('physical', 'lesson')),
  image text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products are publicly readable"
  ON products FOR SELECT USING (true);

-- ============================================
-- 2. Orders (Stripe checkout + fulfillment)
-- ============================================
CREATE TABLE orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_session_id text UNIQUE NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  shipping_address jsonb,
  items jsonb NOT NULL,
  total_pence integer NOT NULL,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'fulfilled')),
  user_id uuid REFERENCES auth.users (id),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "customers read own orders"
  ON orders FOR SELECT USING (auth.uid() = user_id);

-- role lives in app_metadata (server-set only); user_metadata is client-editable
CREATE POLICY "admins read all orders"
  ON orders FOR SELECT
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "admins update order status"
  ON orders FOR UPDATE
  USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- inserts happen only via service role (webhook), which bypasses RLS

-- ============================================
-- 3. Newsletter Subscribers
-- ============================================
CREATE TABLE newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- no public policies: inserts via service role only

-- ============================================
-- 4. Seed: Product Catalog
-- ============================================
INSERT INTO products (slug, name, description, price_pence, type, image) VALUES
  ('beginner-individual-session', 'Beginner Individual Session (2.5 Hours)',
   'New to Mahjong? Our Beginner Session is the perfect place to start. Learn the tiles, the rules, and how to build winning hands — at your own pace. You''ll leave with a complete guide to take home and return to anytime.',
   25000, 'lesson', '/aml/lesson-beginner.png'),
  ('beginner-group-session', 'Beginner Group Session (2.5 Hours, per person)',
   'Learn everything you need to know to play American Mahjong from scratch, in a group of 2, 3, or 4. Cover the tiles, the rules, and winning hand construction at your own pace, and leave with a complete guide to take home.',
   15000, 'lesson', '/aml/lesson-individual.png'),
  ('private-session-1-hour', 'Private Session (1 Hour)',
   'Already know American Mahjong? This session is designed for you. Refresh your knowledge of the rules and etiquette, keep building on your game, and pick up advanced strategy, gameplay and tips to take your game to the next level.',
   12500, 'lesson', '/aml/lesson-1-hour.png'),
  ('nmjl-card-2026', '2026 Official NMJL Card (Large Print)',
   'The official 2026 National Mah Jongg League card, large print edition, imported from the US. Released every April with the year''s official winning hands — required to play American Mahjong.',
   1500, 'physical', '/aml/nmjl-card-2026.png'),
  ('scorecard-notepad', 'American Mahjong Scorecard Notepad (A5, 50 pages)',
   'Keep scoring simple. A5 notepad with 50 tear-off scorecard pages, designed for American Mahjong.',
   1000, 'physical', '/aml/scorecard-notepad.png');
