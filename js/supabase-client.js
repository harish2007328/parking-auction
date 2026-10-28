// Supabase Database & Realtime Synchronization Client for Tirunelveli ParkPulse
import { INITIAL_SPOTS } from './data.js';

const SUPABASE_URL = 'https://ymbpjdaavlnjqhcezdcy.supabase.co';
const SUPABASE_KEY = 'sb_publishable_AP61gH1AylpCqnDp2Ds5yg_qlh2d4sQ';

class SupabaseService {
  constructor() {
    this.client = null;
    this.isReady = false;
    this.init();
  }

  async init() {
    if (typeof window !== 'undefined' && window.supabase) {
      try {
        this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
        this.isReady = true;
        console.log('✅ Supabase client initialized for Tirunelveli hub');
      } catch (e) {
        console.warn('Supabase initialization notice:', e);
      }
    }
  }

  // Load spots from Supabase or fallback to initial data and seed
  async fetchSpots() {
    if (!this.client) return null;

    try {
      const { data, error } = await this.client
        .from('spots')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase spots query notice (tables may need creation):', error.message);
        return null;
      }

      if (Array.isArray(data) && data.length > 0) {
        // Map snake_case DB columns to camelCase JS objects
        return data.map(s => this.mapFromDb(s));
      } else {
        // Table exists but is empty -> seed Tirunelveli spots automatically!
        this.seedInitialSpots();
        return null;
      }
    } catch (e) {
      return null;
    }
  }

  async seedInitialSpots() {
    if (!this.client) return;
    try {
      const dbRows = INITIAL_SPOTS.map(s => this.mapToDb(s));
      await this.client.from('spots').insert(dbRows);
      console.log('🌱 Seeded initial Tirunelveli spots into Supabase!');
    } catch (e) {
      console.warn('Seeding notice:', e);
    }
  }

  // Save a newly listed parking space
  async saveNewSpot(spot) {
    if (!this.client) return;
    try {
      const row = this.mapToDb(spot);
      const { error } = await this.client.from('spots').insert([row]);
      if (error) console.warn('Supabase save spot notice:', error.message);
    } catch (e) {}
  }

  // Record a bid in the cloud DB for real-time team synchronization
  async recordBid(spotId, bidderName, amount) {
    if (!this.client) return;
    try {
      // 1. Insert bid record
      await this.client.from('bids').insert([{
        spot_id: spotId,
        bidder_name: bidderName,
        amount: Math.round(amount)
      }]);

      // 2. Update spot current bid
      await this.client.from('spots').update({
        current_bid: Math.round(amount),
        highest_bidder: bidderName
      }).eq('id', spotId);
    } catch (e) {
      console.warn('Supabase record bid notice:', e);
    }
  }

  // Record a PayPal confirmed booking
  async recordBooking(booking) {
    if (!this.client) return;
    try {
      await this.client.from('bookings').insert([{
        id: booking.id,
        transaction_id: booking.transactionId,
        spot_id: booking.spot.id,
        spot_title: booking.spot.title,
        amount: booking.order.total,
        currency: 'INR',
        payment_method: 'paypal_sandbox',
        gate_pin: booking.gatePin,
        bay_number: booking.bayNumber || 'TN72-P1',
        status: 'confirmed'
      }]);

      // Mark spot booked
      await this.client.from('spots').update({
        status: 'booked'
      }).eq('id', booking.spot.id);
    } catch (e) {
      console.warn('Supabase record booking notice:', e);
    }
  }

  // Listen for real-time team bids and spot additions
  subscribeToChanges(onRemoteBid, onRemoteSpot) {
    if (!this.client) return;

    try {
      this.client
        .channel('public:parking_updates')
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'bids' }, payload => {
          if (onRemoteBid) onRemoteBid(payload.new);
        })
        .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'spots' }, payload => {
          if (onRemoteSpot) onRemoteSpot(this.mapFromDb(payload.new));
        })
        .subscribe();
    } catch (e) {}
  }

  mapToDb(s) {
    return {
      id: s.id,
      locality: s.locality || 'town',
      title: s.title,
      address: s.address,
      landmark: s.landmark,
      lat: s.lat,
      lng: s.lng,
      spot_type: s.spotType,
      pricing_type: s.pricingType,
      base_price: s.basePrice,
      floor_price: s.floorPrice || null,
      current_price: s.currentPrice,
      current_bid: s.currentBid || null,
      min_bid_increment: s.minBidIncrement || 10,
      instant_buy_price: s.instantBuyPrice || null,
      highest_bidder: s.highestBidder || null,
      total_bids: s.totalBids || 0,
      auction_ends_in_seconds: s.auctionEndsInSeconds || 240,
      window_minutes_remaining: s.windowMinutesRemaining || 30,
      host_name: s.host.name,
      host_avatar: s.host.avatar,
      host_rating: s.host.rating || 4.9,
      amenities: s.amenities || [],
      vehicle_size: s.vehicleSize || 'Standard Vehicle',
      access_instructions: s.accessInstructions,
      photo: s.photo,
      status: s.status || 'available'
    };
  }

  mapFromDb(r) {
    return {
      id: r.id,
      locality: r.locality,
      title: r.title,
      address: r.address,
      landmark: r.landmark,
      lat: r.lat,
      lng: r.lng,
      spotType: r.spot_type,
      pricingType: r.pricing_type,
      basePrice: parseFloat(r.base_price),
      floorPrice: r.floor_price ? parseFloat(r.floor_price) : 20,
      currentPrice: parseFloat(r.current_price),
      currentBid: r.current_bid ? parseFloat(r.current_bid) : null,
      minBidIncrement: r.min_bid_increment ? parseFloat(r.min_bid_increment) : 10,
      instantBuyPrice: r.instant_buy_price ? parseFloat(r.instant_buy_price) : null,
      highestBidder: r.highest_bidder,
      totalBids: r.total_bids || 0,
      auctionEndsInSeconds: r.auction_ends_in_seconds || 240,
      windowMinutesRemaining: r.window_minutes_remaining || 30,
      host: {
        name: r.host_name,
        avatar: r.host_avatar,
        rating: parseFloat(r.host_rating || 4.9),
        reviewsCount: 45,
        badge: 'Verified Resident'
      },
      amenities: r.amenities || [],
      vehicleSize: r.vehicle_size || 'Standard Vehicle',
      accessInstructions: r.access_instructions,
      photo: r.photo,
      distanceMeters: 200,
      walkingMinutes: 3,
      status: r.status || 'available',
      createdAt: new Date(r.created_at).getTime()
    };
  }
}

export const supabaseService = new SupabaseService();
if (typeof window !== 'undefined') {
  window.supabaseService = supabaseService;
}

