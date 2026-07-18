-- 004_stock.sql - Inventory tracking for the shop.
--
-- products.stock: NULL means "not tracked" (lessons, made-to-order items);
-- an integer means a finite quantity that the Stripe webhook decrements on
-- each completed checkout. 0 renders the product as sold out in the shop.

ALTER TABLE products
  ADD COLUMN stock integer CHECK (stock IS NULL OR stock >= 0);

-- Atomic decrement, called by the Stripe webhook (service role) once per
-- order line after the order row is inserted. GREATEST() floors at zero so
-- a rare oversell (two checkouts racing for the last item) records as
-- sold-out rather than negative stock.
CREATE OR REPLACE FUNCTION decrement_stock(item_slug text, qty integer)
RETURNS void AS $$
  UPDATE products
  SET stock = GREATEST(stock - qty, 0)
  WHERE slug = item_slug AND stock IS NOT NULL AND qty > 0;
$$ LANGUAGE sql SECURITY DEFINER SET search_path = public;

-- Only the webhook's service client may decrement; browsers and signed-in
-- users cannot call it.
REVOKE EXECUTE ON FUNCTION decrement_stock(text, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION decrement_stock(text, integer) TO service_role;
