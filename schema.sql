-- =========================================================================
-- ParkPulse: Tirunelveli Smart Parking Database Schema (Supabase)
-- Paste this script into your Supabase Dashboard -> SQL Editor and click RUN
-- =========================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Parking Spots Table
CREATE TABLE IF NOT EXISTS public.spots (
  id TEXT PRIMARY KEY,
  locality TEXT NOT NULL,
  title TEXT NOT NULL,
  address TEXT NOT NULL,
  landmark TEXT,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  spot_type TEXT NOT NULL,
  pricing_type TEXT NOT NULL DEFAULT 'decay',
  base_price NUMERIC NOT NULL,
  floor_price NUMERIC,
  current_price NUMERIC NOT NULL,
  current_bid NUMERIC,
  min_bid_increment NUMERIC DEFAULT 10,
  instant_buy_price NUMERIC,
  highest_bidder TEXT,
  total_bids INTEGER DEFAULT 0,
  auction_ends_in_seconds INTEGER DEFAULT 240,
  window_minutes_remaining INTEGER DEFAULT 30,
  host_name TEXT NOT NULL,
  host_avatar TEXT,
  host_rating NUMERIC DEFAULT 4.9,
  amenities TEXT[] DEFAULT '{}',
  vehicle_size TEXT DEFAULT 'Standard Vehicle',
  access_instructions TEXT,
  photo TEXT,
  status TEXT DEFAULT 'available',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Live Auction Bids Table
CREATE TABLE IF NOT EXISTS public.bids (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  spot_id TEXT NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  bidder_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. PayPal Bookings Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  spot_id TEXT NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  spot_title TEXT NOT NULL,
  user_name TEXT DEFAULT 'Demo Driver',
  amount NUMERIC NOT NULL,
  currency TEXT DEFAULT 'INR',
  payment_method TEXT DEFAULT 'paypal_sandbox',
  gate_pin TEXT NOT NULL,
  bay_number TEXT,
  status TEXT DEFAULT 'confirmed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Enable Row Level Security (RLS) & Allow Team Access
ALTER TABLE public.spots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & public read/write for team demonstration
CREATE POLICY "Allow public read spots" ON public.spots FOR SELECT USING (true);
CREATE POLICY "Allow public insert spots" ON public.spots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update spots" ON public.spots FOR UPDATE USING (true);

CREATE POLICY "Allow public read bids" ON public.bids FOR SELECT USING (true);
CREATE POLICY "Allow public insert bids" ON public.bids FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public read bookings" ON public.bookings FOR SELECT USING (true);
CREATE POLICY "Allow public insert bookings" ON public.bookings FOR INSERT WITH CHECK (true);

-- Enable Realtime for live team synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE public.spots;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bids;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
