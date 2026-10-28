// Dynamic Pricing & Micro-Auction Engine for Tirunelveli Hub
import { INITIAL_SPOTS } from './data.js';
import { sound } from './audio.js';

class PricingEngine {
  constructor() {
    this.listeners = [];
    this.timer = null;
    this.spots = this.loadSpots();
    this.simulationEnabled = true;
  }

  loadSpots() {
    const saved = localStorage.getItem('parkpulse_tvl_spots_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {}
    }
    return JSON.parse(JSON.stringify(INITIAL_SPOTS));
  }

  saveSpots() {
    localStorage.setItem('parkpulse_tvl_spots_v2', JSON.stringify(this.spots));
  }

  resetSpots() {
    this.spots = JSON.parse(JSON.stringify(INITIAL_SPOTS));
    this.saveSpots();
    this.notify('reset');
  }

  start() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => this.tick(), 1000);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  subscribe(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  notify(eventType = 'tick', data = null) {
    this.listeners.forEach(cb => cb(this.spots, eventType, data));
  }

  getSpots(locality = 'all') {
    let list = (!locality || locality === 'all') ? [...this.spots] : this.spots.filter(s => s.locality === locality);
    return list.sort((a, b) => (a.distanceMeters || 9999) - (b.distanceMeters || 9999));
  }

  getSpotById(id) {
    return this.spots.find(s => s.id === id);
  }

  addHostSpot(newSpot) {
    this.spots.unshift(newSpot);
    this.saveSpots();
    this.notify('new_spot', newSpot);
  }

  markSpotBooked(spotId, bookingDetails) {
    const spot = this.getSpotById(spotId);
    if (spot) {
      spot.status = 'booked';
      spot.bookedAt = Date.now();
      spot.bookingDetails = bookingDetails;
      this.saveSpots();
      this.notify('spot_booked', spot);
    }
    return spot;
  }

  releaseSpot(spotId) {
    const spot = this.getSpotById(spotId);
    if (spot) {
      spot.status = 'available';
      spot.bookedAt = null;
      spot.bookingDetails = null;
      this.saveSpots();
      this.notify('spot_released', spot);
    }
    return spot;
  }

  // Interactive Driver Bidding Engine
  placeBid(spotId, bidderName = 'You (Driver)', customAmount = null) {
    const spot = this.getSpotById(spotId);
    if (!spot || spot.pricingType !== 'auction' || spot.status !== 'available') {
      return { success: false, message: 'Auction is not available for this spot.' };
    }

    if (spot.auctionEndsInSeconds <= 0) {
      return { success: false, message: 'This auction has already concluded.' };
    }

    const minIncrement = spot.minBidIncrement || 10;
    const currentBid = spot.currentBid || spot.basePrice;
    const bidValue = customAmount ? parseFloat(customAmount) : (currentBid + minIncrement);

    if (bidValue <= currentBid) {
      return { success: false, message: `Your bid must be greater than current bid (₹${currentBid})` };
    }

    spot.currentBid = Math.round(bidValue);
    spot.highestBidder = bidderName;
    spot.totalBids = (spot.totalBids || 0) + 1;

    // Add to bid history ledger
    if (!Array.isArray(spot.bidHistory)) {
      spot.bidHistory = [];
    }
    spot.bidHistory.unshift({
      bidder: bidderName,
      amount: spot.currentBid,
      time: 'Just now'
    });

    // Anti-sniping: extend timer by 30 seconds if bid placed in final 30 seconds
    if (spot.auctionEndsInSeconds < 30) {
      spot.auctionEndsInSeconds += 30;
    }

    sound.playBidPlaced();
    this.saveSpots();

    // Synchronize bid with Supabase cloud database for team
    if (typeof window !== 'undefined' && window.supabaseService) {
      window.supabaseService.recordBid(spotId, bidderName, spot.currentBid);
    }

    this.notify('bid_placed', { spot, newBid: spot.currentBid, bidderName });
    return { success: true, spot };
  }

  // 1-second live pricing & auction loop
  tick() {
    let priceDrop = false;

    this.spots.forEach(spot => {
      if (spot.status !== 'available') return;

      // 1. Dynamic Reverse Price Decay for Tirunelveli spots
      if (spot.pricingType === 'decay') {
        if (typeof spot.windowSecondsRemaining === 'undefined') {
          spot.windowSecondsRemaining = (spot.windowMinutesRemaining || 20) * 60;
        }

        if (spot.windowSecondsRemaining > 0) {
          spot.windowSecondsRemaining -= 1;
          spot.windowMinutesRemaining = Math.max(1, Math.ceil(spot.windowSecondsRemaining / 60));

          // Drop price per second smoothly
          const dropPerSecond = (spot.decayRatePerMin || 1.2) / 60;
          const prev = spot.currentPrice;
          let updated = spot.currentPrice - dropPerSecond;

          // Enforce floor reserve price
          updated = Math.max(spot.floorPrice || 20, updated);
          spot.currentPrice = Math.round(updated * 10) / 10;

          if (Math.floor(prev) > Math.floor(updated)) {
            priceDrop = true;
          }
        }
      }

      // 2. High-Demand Micro-Auction
      if (spot.pricingType === 'auction') {
        if (spot.auctionEndsInSeconds > 0) {
          spot.auctionEndsInSeconds -= 1;

          // Realistic Tirunelveli local competing bidders simulation
          if (this.simulationEnabled && spot.auctionEndsInSeconds > 10) {
            const chance = Math.random();
            if (chance < 0.025 && spot.highestBidder !== 'You (Driver)') {
              const localBidders = [
                'Murugan_TN72 (Swift)',
                'Senthil_Innova',
                'Karthik_Baleno',
                'Praveen_Creta',
                'Muthu_Auto',
                'Ramesh_City'
              ];
              const randomBidder = localBidders[Math.floor(Math.random() * localBidders.length)];
              const inc = spot.minBidIncrement || 10;
              spot.currentBid += inc;
              spot.highestBidder = randomBidder;
              spot.totalBids = (spot.totalBids || 0) + 1;

              if (!Array.isArray(spot.bidHistory)) spot.bidHistory = [];
              spot.bidHistory.unshift({
                bidder: randomBidder,
                amount: spot.currentBid,
                time: 'Just now'
              });

              this.notify('simulated_bid', { spot, bidderName: randomBidder });
            }
          }
        } else if (spot.auctionEndsInSeconds === 0) {
          spot.status = 'auction_ended';
          this.notify('auction_ended', spot);
        }
      }
    });

    if (priceDrop) {
      sound.playPriceDrop();
    }

    this.notify('tick');
  }

  updateDistances(userLat, userLng) {
    this.spots.forEach(spot => {
      const distMeters = this.haversine(userLat, userLng, spot.lat, spot.lng);
      spot.distanceMeters = Math.round(distMeters);
      spot.walkingMinutes = Math.max(1, Math.round(distMeters / 75)); // ~75m/min walking speed in busy streets
    });
    this.notify('distance_updated');
  }

  haversine(lat1, lon1, lat2, lon2) {
    const R = 6371e3;
    const phi1 = (lat1 * Math.PI) / 180;
    const phi2 = (lat2 * Math.PI) / 180;
    const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
    const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
      Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

export const pricingEngine = new PricingEngine();
