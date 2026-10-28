// Host / Owner Space Listing for Tirunelveli
import { pricingEngine } from './pricing-engine.js';
import { sound } from './audio.js';
import { TIRUNELVELI_LOCALITIES } from './data.js';

export class HostManager {
  constructor(onNewListingAdded) {
    this.onNewListingAdded = onNewListingAdded;
    this.hostListings = this.loadHostListings();
    this.initForm();
  }

  loadHostListings() {
    const saved = localStorage.getItem('parkpulse_tvl_host_spots');
    return saved ? JSON.parse(saved) : [];
  }

  saveHostListings() {
    localStorage.setItem('parkpulse_tvl_host_spots', JSON.stringify(this.hostListings));
  }

  initForm() {
    const form = document.getElementById('newSpotForm');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }

    const radios = document.querySelectorAll('input[name="pricingStrategy"]');
    radios.forEach(radio => {
      radio.addEventListener('change', () => {
        const decayFields = document.getElementById('decayFields');
        if (decayFields) {
          decayFields.style.display = radio.value === 'decay' ? 'block' : 'none';
        }
      });
    });
  }

  handleSubmit(e) {
    e.preventDefault();

    const title = document.getElementById('spotTitle')?.value.trim();
    const address = document.getElementById('spotAddress')?.value.trim();
    const locality = document.getElementById('spotLocality')?.value || 'town';
    const spotType = document.getElementById('spotType')?.value || 'Private Driveway';
    const strategy = document.querySelector('input[name="pricingStrategy"]:checked')?.value || 'decay';
    const basePrice = parseFloat(document.getElementById('basePrice')?.value) || 50;

    const locData = TIRUNELVELI_LOCALITIES[locality] || TIRUNELVELI_LOCALITIES['town'];
    const lat = locData.center[0] + (Math.random() - 0.5) * 0.004;
    const lng = locData.center[1] + (Math.random() - 0.5) * 0.004;

    const amenities = [];
    if (document.getElementById('amenityEv')?.checked) amenities.push('ev_charging');
    if (document.getElementById('amenityCovered')?.checked) amenities.push('covered');
    if (document.getElementById('amenityCctv')?.checked) amenities.push('cctv');
    amenities.push('instant_claim');

    const newSpot = {
      id: 'host-' + Date.now().toString().slice(-6),
      locality,
      title: title || 'Private Reserved Driveway',
      address: address || `Car Street, ${locData.name}`,
      landmark: `Near ${locData.name}`,
      lat,
      lng,
      spotType,
      pricingType: strategy,
      basePrice,
      currentPrice: basePrice,
      floorPrice: parseFloat(document.getElementById('floorPrice')?.value) || Math.round(basePrice * 0.4),
      decayRatePerMin: 1.5,
      windowMinutesRemaining: parseInt(document.getElementById('windowMinutes')?.value) || 30,
      windowTotalMinutes: parseInt(document.getElementById('windowMinutes')?.value) || 30,
      host: {
        name: 'You (Owner)',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
        rating: 5.0,
        reviewsCount: 1,
        badge: 'Verified Resident'
      },
      amenities,
      vehicleSize: 'All Standard Vehicles',
      accessInstructions: 'Drive straight to gate; automated pass recognizes booking PIN.',
      photo: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80',
      description: 'Newly listed unused parking space in Tirunelveli! Dynamic pricing enabled to ensure space is never wasted.',
      distanceMeters: 200,
      walkingMinutes: 3,
      status: 'available',
      createdAt: Date.now()
    };

    if (strategy === 'auction') {
      newSpot.currentBid = basePrice;
      newSpot.minBidIncrement = 10;
      newSpot.instantBuyPrice = Math.round(basePrice * 1.6);
      newSpot.totalBids = 0;
      newSpot.auctionEndsInSeconds = 240;
      newSpot.highestBidder = 'None yet';
      newSpot.bidHistory = [];
    }

    pricingEngine.addHostSpot(newSpot);
    this.hostListings.push(newSpot);
    this.saveHostListings();

    // Sync newly published spot to Supabase
    if (typeof window !== 'undefined' && window.supabaseService) {
      window.supabaseService.saveNewSpot(newSpot);
    }

    sound.playSuccessChime();

    const modal = document.getElementById('hostModal');
    if (modal) modal.classList.remove('is-active');

    if (this.onNewListingAdded) {
      this.onNewListingAdded(newSpot);
    }

    alert(`🎉 Success! Your Tirunelveli parking spot "${newSpot.title}" is now LIVE on the map!`);
  }

  renderAnalytics() {
    const container = document.getElementById('hostAnalyticsContainer');
    if (!container) return;

    const allSpots = pricingEngine.getSpots('all');
    const mySpots = allSpots.filter(s => s.id.startsWith('host-') || s.host.name.includes('You'));

    container.innerHTML = `
      <div class="analytics-metrics-grid">
        <div class="metric-card">
          <span class="metric-title">Recovered Revenue (INR)</span>
          <div class="metric-value" style="color:var(--solid-green);">₹${(1420 + mySpots.length * 120)}</div>
          <span class="metric-trend">▲ +₹280 from unused driveways today</span>
        </div>
        <div class="metric-card">
          <span class="metric-title">Occupancy Rate</span>
          <div class="metric-value" style="color:var(--solid-primary);">94.2%</div>
          <span class="metric-trend">Dynamic decay prevented vacant slots</span>
        </div>
        <div class="metric-card">
          <span class="metric-title">Active Listed Slots</span>
          <div class="metric-value">${mySpots.length + 1}</div>
          <span class="metric-trend">Published across Tirunelveli</span>
        </div>
      </div>

      <div class="host-spots-manager">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <h4 style="font-weight:800;">Your Tirunelveli Parking Spaces</h4>
          <span style="font-size:0.75rem; color:var(--text-sub);">${mySpots.length} Managed</span>
        </div>

        <div class="host-spots-list">
          ${mySpots.length === 0 ? `
            <div style="padding:16px; background:var(--bg-subtle); border:1px solid var(--border-light); border-radius:4px; font-size:0.85rem; color:var(--text-sub);">
              No personal spaces listed yet. Have an empty driveway near Nellaiappar Temple, Junction, or Roopa Mall? Monetize it today!
            </div>
          ` : mySpots.map(s => `
            <div class="host-spot-item">
              <div>
                <strong style="font-size:0.88rem;">${s.title}</strong>
                <div style="font-size:0.75rem; color:var(--text-sub);">📍 ${s.address} • Strategy: <code>${s.pricingType}</code></div>
              </div>
              <div style="text-align:right;">
                <div style="font-family:var(--font-mono); font-weight:800; font-size:1rem; color:var(--solid-green);">₹${s.currentPrice || s.currentBid}</div>
                <span style="font-size:0.68rem; font-weight:700; color:var(--solid-primary);">${s.status.toUpperCase()}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}
