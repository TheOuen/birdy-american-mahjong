-- 005_bookings.sql - Lesson booking scheduling + customer-visible orders.
--
-- scheduled_at: when Andrew has arranged the lesson (set from the admin
-- bookings page, which also emails the customer). admin_note travels with
-- the booking (location, what to bring) and is shown to the customer.

ALTER TABLE orders
  ADD COLUMN scheduled_at timestamptz,
  ADD COLUMN admin_note text;

-- Customers can see orders placed with their signed-in email address, not
-- just rows carrying their user_id. Both emails are verified: the JWT email
-- by Supabase auth (magic link), the order email by Stripe at payment.
CREATE POLICY "customers read orders by email"
  ON orders FOR SELECT
  USING (lower(customer_email) = lower(auth.jwt() ->> 'email'));
