// Main Application Controller for Tirunelveli Smart Parking & Auction
import { TIRUNELVELI_LOCALITIES, AMENITY_LABELS } from './data.js';
import { sound } from './audio.js';
import { pricingEngine } from './pricing-engine.js';
import { MapController } from './map.js';
import { PayPalCheckout } from './paypal.js';
import { HostManager } from './host.js';
import { supabaseService } from './supabase-client.js';

class App {
  constructor() {
    this.currentLocality = 'all';
    this.selectedSpot = null;
    this.activeFilter = {
      locality: 'all',
      pricingType: 'all',
      evCharging: false,
      covered: false
    };

    this.mapCtrl = null;
    this.paypal = null;
    this.hostMgr = null;
    this.customBidStep = 10;

    this.init();
  }

  init() {
    // 1. Initialize Map centered on Tirunelveli Town
    const initialConfig = TIRUNELVELI_LOCALITIES['all'];
    this.mapCtrl = new MapController('map', (spot) => this.handleSpotSelected(spot));
    this.mapCtrl.init(initialConfig.center, initialConfig.zoom);
    this.mapCtrl.setUserLocation(initialConfig.userLocation[0], initialConfig.userLocation[1]);

    // 2. Initialize Subsystems
    this.paypal = new PayPalCheckout((spot, booking) => this.handleBookingCompleted(spot, booking));
    this.hostMgr = new HostManager((newSpot) => this.handleNewListingAdded(newSpot));

    // 3. Start Dynamic Engine
    pricingEngine.updateDistances(initialConfig.userLocation[0], initialConfig.userLocation[1]);
    pricingEngine.start();

    // 4. Subscribe to updates
    pricingEngine.subscribe((spots, eventType, data) => this.handleEngineUpdate(spots, eventType, data));

    // 5. Connect Realtime Supabase Cloud Synchronization for the team
    supabaseService.fetchSpots().then(remoteSpots => {
      if (remoteSpots && remoteSpots.length > 0) {
        pricingEngine.spots = remoteSpots;
        this.renderFeed();
        this.mapCtrl.updateSpots(pricingEngine.getSpots(this.currentLocality), this.activeFilter);
      }
    });

    supabaseService.subscribeToChanges(
      (remoteBid) => {
        const spot = pricingEngine.getSpotById(remoteBid.spot_id);
        if (spot) {
          spot.currentBid = remoteBid.amount;
          spot.highestBidder = remoteBid.bidder_name;
          spot.totalBids = (spot.totalBids || 0) + 1;
          pricingEngine.saveSpots();
          this.renderFeed();
          if (this.selectedSpot && this.selectedSpot.id === spot.id) {
            this.renderDetailPanel(spot);
          }
        }
      },
      (remoteSpot) => {
        pricingEngine.addHostSpot(remoteSpot);
        this.renderFeed();
        this.mapCtrl.updateSpots(pricingEngine.getSpots(this.currentLocality), this.activeFilter);
      }
    );

    // 5. Wire Events & Render
    this.bindEvents();
    this.renderLocalitySelector();
    this.renderFeed();
    this.mapCtrl.updateSpots(pricingEngine.getSpots(this.currentLocality), this.activeFilter);
    this.updateStatsBar();

    // Auto-select active auction spot on load so bidding is immediately visible!
    const spots = pricingEngine.getSpots(this.currentLocality);
    if (spots.length > 0) {
      const defaultSpot = spots.find(s => s.pricingType === 'auction') || spots[0];
      setTimeout(() => {
        this.selectSpot(defaultSpot);
      }, 350);
    }
  }

  bindEvents() {
    // Detail Drawer Pricing Mode Switcher Tabs
    const btnTabAuction = document.getElementById('btnTabAuction');
    const btnTabDecay = document.getElementById('btnTabDecay');
    if (btnTabAuction && btnTabDecay) {
      btnTabAuction.addEventListener('click', () => this.switchPricingMode('auction'));
      btnTabDecay.addEventListener('click', () => this.switchPricingMode('decay'));
    }

    // Locality Selector Dropdown
    const locSelect = document.getElementById('localitySelector');
    if (locSelect) {
      locSelect.addEventListener('change', (e) => this.switchLocality(e.target.value));
    }

    // GPS Button
    const btnLocate = document.getElementById('btnLocateMe');
    if (btnLocate) {
      btnLocate.addEventListener('click', () => this.locateUserGps());
    }

    // Audio SFX Toggle
    const btnAudio = document.getElementById('btnAudioToggle');
    if (btnAudio) {
      this.updateAudioButtonState();
      btnAudio.addEventListener('click', () => {
        sound.toggleMute();
        this.updateAudioButtonState();
      });
    }

    // Driver vs Host Mode Switcher
    const modeDriver = document.getElementById('modeDriver');
    const modeHost = document.getElementById('modeHost');
    if (modeDriver && modeHost) {
      modeDriver.addEventListener('click', () => this.switchMode('driver'));
      modeHost.addEventListener('click', () => this.switchMode('host'));
    }

    // Mobile View Switcher (Map vs List)
    const mobileTabMap = document.getElementById('mobileTabMap');
    const mobileTabList = document.getElementById('mobileTabList');
    const sidebar = document.getElementById('discoverySidebar');

    if (mobileTabMap && mobileTabList && sidebar) {
      mobileTabMap.addEventListener('click', () => {
        mobileTabMap.classList.add('is-active');
        mobileTabList.classList.remove('is-active');
        sidebar.classList.remove('mobile-show');
        if (this.mapCtrl && this.mapCtrl.map) {
          setTimeout(() => this.mapCtrl.map.invalidateSize(), 150);
        }
      });

      mobileTabList.addEventListener('click', () => {
        mobileTabList.classList.add('is-active');
        mobileTabMap.classList.remove('is-active');
        sidebar.classList.add('mobile-show');
      });
    }

    // Filter Chips
    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('is-active'));
        chip.classList.add('is-active');
        this.activeFilter.pricingType = chip.dataset.filter || 'all';
        this.applyFilters();
        sound.playTick();
      });
    });

    // Sub-toggles
    const chkEv = document.getElementById('filterEv');
    const chkCovered = document.getElementById('filterCovered');
    if (chkEv) chkEv.addEventListener('change', (e) => {
      this.activeFilter.evCharging = e.target.checked;
      this.applyFilters();
    });
    if (chkCovered) chkCovered.addEventListener('change', (e) => {
      this.activeFilter.covered = e.target.checked;
      this.applyFilters();
    });

    // Search input
    const searchInput = document.getElementById('spotSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.searchQuery = e.target.value.toLowerCase();
        this.renderFeed();
      });
    }

    // Modal Triggers
    const btnOpenHost = document.getElementById('btnOpenHostModal');
    if (btnOpenHost) {
      btnOpenHost.addEventListener('click', () => {
        document.getElementById('hostModal')?.classList.add('is-active');
      });
    }

    const btnMyBookings = document.getElementById('btnMyBookings');
    if (btnMyBookings) {
      btnMyBookings.addEventListener('click', () => {
        this.openBookingsDrawer();
      });
    }

    // Generic Modal Close
    document.querySelectorAll('[data-close-modal]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const modal = e.target.closest('.modal-overlay');
        if (modal) modal.classList.remove('is-active');
      });
    });

    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('is-active');
      });
    });

    // PayPal Modal Buttons
    const btnPaypalGold = document.getElementById('btnPaypalGold');
    const btnPaypalUpi = document.getElementById('btnPaypalUpi');
    if (btnPaypalGold) {
      btnPaypalGold.addEventListener('click', () => this.paypal.processPayment('paypal'));
    }
    if (btnPaypalUpi) {
      btnPaypalUpi.addEventListener('click', () => this.paypal.processPayment('upi'));
    }

    // Drawer Reserve CTA
    const btnReserve = document.getElementById('btnDetailReservePaypal');
    if (btnReserve) {
      btnReserve.addEventListener('click', () => {
        if (this.selectedSpot) {
          this.paypal.openCheckout(this.selectedSpot, false);
        }
      });
    }

    // Instant Buy in Auction
    const btnInstantBuy = document.getElementById('btnDetailInstantBuy');
    if (btnInstantBuy) {
      btnInstantBuy.addEventListener('click', () => {
        if (this.selectedSpot) {
          this.paypal.openCheckout(this.selectedSpot, true);
        }
      });
    }

    // Detail Drawer Close Button (✕)
    const btnDetailClose = document.getElementById('btnDetailClose');
    if (btnDetailClose) {
      btnDetailClose.addEventListener('click', () => {
        this.closeDetailDrawer();
      });
    }

    // Quick Step Bidding Buttons (+₹10, +₹20, +₹50)
    document.querySelectorAll('.btn-bid-step').forEach(btn => {
      btn.addEventListener('click', () => {
        const step = parseInt(btn.dataset.step) || 10;
        this.customBidStep = step;
        document.querySelectorAll('.btn-bid-step').forEach(b => b.style.borderColor = 'var(--solid-amber)');
        btn.style.borderColor = 'var(--solid-dark)';
        if (this.selectedSpot && this.selectedSpot.pricingType === 'auction') {
          const target = this.selectedSpot.currentBid + step;
          document.getElementById('bidCustomAmount').value = target;
        }
      });
    });

    // Place Bid Action Button
    const btnPlaceBid = document.getElementById('btnDetailPlaceBid');
    if (btnPlaceBid) {
      btnPlaceBid.addEventListener('click', () => {
        if (this.selectedSpot && this.selectedSpot.pricingType === 'auction') {
          const customVal = document.getElementById('bidCustomAmount')?.value;
          const res = pricingEngine.placeBid(this.selectedSpot.id, 'You (Driver)', customVal);
          if (res.success) {
            this.renderDetailPanel(this.selectedSpot);
            this.renderFeed();
          } else {
            alert(res.message);
          }
        }
      });
    }

    // Close Detail Drawer
    const btnCloseDetail = document.getElementById('btnCloseDetail');
    if (btnCloseDetail) {
      btnCloseDetail.addEventListener('click', () => {
        document.getElementById('spotDetailDrawer')?.classList.remove('is-open');
        this.mapCtrl.clearSelection();
      });
    }
  }

  updateAudioButtonState() {
    const btn = document.getElementById('btnAudioToggle');
    if (!btn) return;
    const isMuted = sound.isMuted();
    btn.innerHTML = isMuted 
      ? '<span class="icon">🔇</span><span>Muted</span>' 
      : '<span class="icon">🔊</span><span>Sound On</span>';
  }

  switchLocality(locKey) {
    if (!TIRUNELVELI_LOCALITIES[locKey]) return;
    this.currentLocality = locKey;
    this.activeFilter.locality = locKey;
    const loc = TIRUNELVELI_LOCALITIES[locKey];

    this.mapCtrl.setUserLocation(loc.userLocation[0], loc.userLocation[1], true);
    pricingEngine.updateDistances(loc.userLocation[0], loc.userLocation[1]);

    this.mapCtrl.updateSpots(pricingEngine.getSpots(this.currentLocality), this.activeFilter);
    this.renderFeed();
    this.updateStatsBar();

    const spots = pricingEngine.getSpots(this.currentLocality);
    if (spots.length > 0) {
      this.selectSpot(spots[0]);
    }
    sound.playTick();
  }

  locateUserGps() {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.mapCtrl.setUserLocation(latitude, longitude, true);
        pricingEngine.updateDistances(latitude, longitude);
        this.renderFeed();
        sound.playSuccessChime();
      },
      () => {
        // Fallback to Tirunelveli center
        const def = TIRUNELVELI_LOCALITIES['all'];
        this.mapCtrl.setUserLocation(def.userLocation[0], def.userLocation[1], true);
        alert('Set to Tirunelveli Central location simulator.');
      },
      { timeout: 7000 }
    );
  }

  switchMode(mode) {
    const driverView = document.getElementById('driverDiscoveryView');
    const hostView = document.getElementById('hostDashboardView');
    const modeDriver = document.getElementById('modeDriver');
    const modeHost = document.getElementById('modeHost');

    if (mode === 'driver') {
      if (driverView) driverView.style.display = 'grid';
      if (hostView) hostView.style.display = 'none';
      if (modeDriver) modeDriver.classList.add('is-active');
      if (modeHost) modeHost.classList.remove('is-active');
      setTimeout(() => this.mapCtrl.map.invalidateSize(), 200);
    } else {
      if (driverView) driverView.style.display = 'none';
      if (hostView) hostView.style.display = 'block';
      if (modeDriver) modeDriver.classList.remove('is-active');
      if (modeHost) modeHost.classList.add('is-active');
      this.hostMgr.renderAnalytics();
    }
    sound.playTick();
  }

  applyFilters() {
    this.mapCtrl.updateSpots(pricingEngine.getSpots(this.currentLocality), this.activeFilter);
    this.renderFeed();
  }

  handleEngineUpdate(spots, eventType, data) {
    this.mapCtrl.updateSpots(pricingEngine.getSpots(this.currentLocality), this.activeFilter);
    this.updateFeedLiveValues();

    if (this.selectedSpot) {
      const fresh = pricingEngine.getSpotById(this.selectedSpot.id);
      if (fresh) {
        this.selectedSpot = fresh;
        this.updateDetailLiveValues(fresh);
      }
    }

    this.updateStatsBar();
  }

  renderLocalitySelector() {
    const select = document.getElementById('localitySelector');
    if (!select) return;

    select.innerHTML = Object.entries(TIRUNELVELI_LOCALITIES).map(([k, loc]) => `
      <option value="${k}" ${k === this.currentLocality ? 'selected' : ''}>
        📍 ${loc.name}
      </option>
    `).join('');
  }

  renderFeed() {
    const container = document.getElementById('spotsFeedList');
    if (!container) return;

    let spots = pricingEngine.getSpots(this.currentLocality);
    spots = spots.filter(s => this.mapCtrl.matchesFilter(s, this.activeFilter));

    if (this.searchQuery) {
      spots = spots.filter(s =>
        s.title.toLowerCase().includes(this.searchQuery) ||
        s.address.toLowerCase().includes(this.searchQuery) ||
        (s.landmark && s.landmark.toLowerCase().includes(this.searchQuery))
      );
    }

    if (spots.length === 0) {
      container.innerHTML = `
        <div style="padding:24px; text-align:center; background:#ffffff; border:1px solid var(--border-light); border-radius:8px;">
          <h4 style="font-size:0.95rem; font-weight:700;">No spots found</h4>
          <p style="font-size:0.75rem; color:var(--text-sub); margin-top:4px;">Try selecting "All Tirunelveli Spots" or clearing filters.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = spots.map(s => this.createSpotCardHtml(s)).join('');

    container.querySelectorAll('.spot-feed-card').forEach(card => {
      card.addEventListener('click', () => {
        const id = card.dataset.spotId;
        const spot = pricingEngine.getSpotById(id);
        if (spot) this.selectSpot(spot);
      });
    });
  }

  createSpotCardHtml(spot) {
    const isSelected = this.selectedSpot && this.selectedSpot.id === spot.id;
    const isAuction = spot.pricingType === 'auction';

    let priceHtml = '';
    let discountPill = '';
    let timerPill = '';

    if (isAuction) {
      const mins = Math.floor(spot.auctionEndsInSeconds / 60);
      const secs = (spot.auctionEndsInSeconds % 60).toString().padStart(2, '0');
      priceHtml = `
        <div class="card-price-block auction">
          <span style="font-size:0.65rem; color:var(--text-sub); display:block;">Current Bid</span>
          <span class="price-val" id="price-${spot.id}">₹${spot.currentBid}</span>
        </div>
      `;
      timerPill = `
        <span class="badge-urgent-pastel" id="timer-${spot.id}">
          🔨 ${mins}:${secs} (${spot.totalBids || 0} bids)
        </span>
      `;
    } else {
      const discount = Math.round(((spot.basePrice - spot.currentPrice) / spot.basePrice) * 100);
      priceHtml = `
        <div class="card-price-block decay">
          <span class="price-original">₹${spot.basePrice}</span>
          <span class="price-val" id="price-${spot.id}">₹${Math.round(spot.currentPrice)}</span>
        </div>
      `;
      if (discount > 5) {
        discountPill = `<span class="badge-discount-pastel">-${discount}% OFF</span>`;
      }
      timerPill = `
        <span class="badge-timer-pastel" id="timer-${spot.id}">
          ⏳ Closes in ${spot.windowMinutesRemaining || 15}m
        </span>
      `;
    }

    return `
      <div class="spot-feed-card ${isSelected ? 'is-selected' : ''}" data-spot-id="${spot.id}">
        <div class="card-thumbnail-wrap">
          <img src="${spot.photo}" alt="${spot.title}" class="card-thumbnail" loading="lazy" />
          <span class="card-type-tag">${spot.spotType}</span>
          ${discountPill}
        </div>

        <div class="card-main-content">
          <div class="card-header-row">
            <h4 class="card-title">${spot.title}</h4>
            ${priceHtml}
          </div>

          <p class="card-address">📍 ${spot.address}</p>

          <div class="card-badges-row">
            <span class="badge-distance">🚶 ${spot.walkingMinutes || 3}m (${spot.distanceMeters || 200}m)</span>
            ${timerPill}
          </div>

          <div class="card-footer-row">
            <div class="host-inline">
              <img src="${spot.host.avatar}" class="host-tiny-avatar" alt="${spot.host.name}" />
              <span class="host-tiny-name">${spot.host.name}</span>
            </div>
            <button class="card-quick-btn" style="${isAuction ? 'background:var(--pastel-amber-bg); color:var(--solid-amber); border:1.5px solid var(--solid-amber); padding:4px 10px; border-radius:4px; font-weight:800;' : 'background:var(--pastel-sky-bg); color:var(--solid-primary); border:1px solid var(--pastel-sky-border); padding:4px 8px; border-radius:4px; font-weight:700;'}">
              ${isAuction ? `🔨 BID NOW (₹${spot.currentBid})` : 'Reserve →'}
            </button>
          </div>
        </div>
      </div>
    `;
  }

  updateFeedLiveValues() {
    const spots = pricingEngine.getSpots(this.currentLocality);
    spots.forEach(spot => {
      const pEl = document.getElementById(`price-${spot.id}`);
      const tEl = document.getElementById(`timer-${spot.id}`);

      if (pEl) {
        if (spot.pricingType === 'auction') {
          pEl.textContent = `₹${spot.currentBid}`;
        } else {
          pEl.textContent = `₹${Math.round(spot.currentPrice)}`;
        }
      }

      if (tEl) {
        if (spot.pricingType === 'auction') {
          const mins = Math.floor(spot.auctionEndsInSeconds / 60);
          const secs = (spot.auctionEndsInSeconds % 60).toString().padStart(2, '0');
          tEl.textContent = `🔨 ${mins}:${secs} (${spot.totalBids || 0} bids)`;
        } else {
          tEl.textContent = `⏳ Closes in ${spot.windowMinutesRemaining || 15}m`;
        }
      }
    });
  }

  selectSpot(spot, notifyMap = true) {
    if (!spot) return;
    this.selectedSpot = spot;

    if (notifyMap && this.mapCtrl) {
      this.mapCtrl.selectSpot(spot, true, false);
    }

    this.renderDetailPanel(spot);

    document.querySelectorAll('.spot-feed-card').forEach(c => {
      if (c.dataset.spotId === spot.id) {
        c.classList.add('is-selected');
        // Only scroll the sidebar feed container if card is not already visible
        const container = document.getElementById('spotsFeedList');
        if (container) {
          const cRect = c.getBoundingClientRect();
          const pRect = container.getBoundingClientRect();
          if (cRect.top < pRect.top || cRect.bottom > pRect.bottom) {
            c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }
      } else {
        c.classList.remove('is-selected');
      }
    });

    sound.playTick();
  }

  closeDetailDrawer() {
    const drawer = document.getElementById('spotDetailDrawer');
    if (drawer) drawer.classList.remove('is-open');
    if (this.mapCtrl) this.mapCtrl.clearSelection();
    this.selectedSpot = null;
    document.querySelectorAll('.spot-feed-card').forEach(c => c.classList.remove('is-selected'));
  }

  handleSpotSelected(spot) {
    if (!spot) return;
    if (this.selectedSpot && this.selectedSpot.id === spot.id) {
      this.renderDetailPanel(spot);
      return;
    }
    // Spot was picked directly on the map, update UI without re-notifying map
    this.selectSpot(spot, false);
  }

  switchPricingMode(mode) {
    if (!this.selectedSpot) return;
    this.selectedSpot.activePricingView = mode;
    this.updatePricingModeUI(mode);
    sound.playTick();
  }

  updatePricingModeUI(mode) {
    const btnTabAuction = document.getElementById('btnTabAuction');
    const btnTabDecay = document.getElementById('btnTabDecay');
    const decayBox = document.getElementById('detailDecaySection');
    const auctionBox = document.getElementById('detailAuctionSection');
    const btnReserve = document.getElementById('btnDetailReservePaypal');
    const spot = this.selectedSpot;
    if (!spot) return;

    if (mode === 'auction') {
      if (btnTabAuction) {
        btnTabAuction.style.border = '1.5px solid var(--solid-amber)';
        btnTabAuction.style.background = 'var(--pastel-amber-bg)';
        btnTabAuction.style.color = 'var(--solid-amber)';
      }
      if (btnTabDecay) {
        btnTabDecay.style.border = '1px solid var(--border-light)';
        btnTabDecay.style.background = '#ffffff';
        btnTabDecay.style.color = 'var(--text-sub)';
      }

      if (auctionBox) auctionBox.style.display = 'block';
      if (decayBox) decayBox.style.display = 'none';
      if (btnReserve) btnReserve.style.display = 'none';

      if (!spot.currentBid) spot.currentBid = Math.round(spot.currentPrice || spot.basePrice);
      if (!spot.instantBuyPrice) spot.instantBuyPrice = Math.round(spot.currentBid * 1.5);
      if (!spot.auctionEndsInSeconds) spot.auctionEndsInSeconds = 240;

      document.getElementById('detailCurrentBid').textContent = `₹${spot.currentBid}`;
      document.getElementById('detailHighestBidder').textContent = spot.highestBidder || 'None yet';
      document.getElementById('detailInstantBuyPrice').textContent = `₹${spot.instantBuyPrice}`;

      const nextBidAmount = spot.currentBid + (spot.minBidIncrement || 10);
      const customInput = document.getElementById('bidCustomAmount');
      if (customInput) customInput.value = nextBidAmount;

      this.renderBidHistory(spot);
    } else {
      if (btnTabDecay) {
        btnTabDecay.style.border = '1.5px solid var(--solid-green)';
        btnTabDecay.style.background = 'var(--pastel-mint-bg)';
        btnTabDecay.style.color = 'var(--solid-green)';
      }
      if (btnTabAuction) {
        btnTabAuction.style.border = '1px solid var(--border-light)';
        btnTabAuction.style.background = '#ffffff';
        btnTabAuction.style.color = 'var(--text-sub)';
      }

      if (auctionBox) auctionBox.style.display = 'none';
      if (decayBox) decayBox.style.display = 'block';
      if (btnReserve) {
        btnReserve.style.display = 'flex';
        btnReserve.innerHTML = `Reserve Now with PayPal • <span id="detailBtnPrice">₹${Math.round(spot.currentPrice)}</span>`;
      }
    }
  }

  renderDetailPanel(spot) {
    const drawer = document.getElementById('spotDetailDrawer');
    if (!drawer) return;

    drawer.classList.add('is-open');

    document.getElementById('detailSpotTitle').textContent = spot.title;
    document.getElementById('detailSpotAddress').textContent = `📍 ${spot.address}`;
    document.getElementById('detailSpotType').textContent = spot.spotType;
    document.getElementById('detailSpotDescription').textContent = spot.description;
    document.getElementById('detailSpotPhoto').src = spot.photo;
    document.getElementById('detailHostName').textContent = spot.host.name;
    document.getElementById('detailHostAvatar').src = spot.host.avatar;
    document.getElementById('detailHostRating').textContent = `★ ${spot.host.rating} (${spot.host.reviewsCount} reviews)`;
    document.getElementById('detailHostBadge').textContent = spot.host.badge;
    document.getElementById('detailVehicleSize').textContent = spot.vehicleSize;
    document.getElementById('detailAccessInstructions').textContent = spot.accessInstructions;
    document.getElementById('detailDistanceEta').textContent = `${spot.walkingMinutes || 3} min walk • ${spot.distanceMeters || 200}m away`;

    const amenitiesBox = document.getElementById('detailAmenitiesList');
    if (amenitiesBox && spot.amenities) {
      amenitiesBox.innerHTML = spot.amenities.map(a => {
        const item = AMENITY_LABELS[a] || { label: a };
        return `<span class="amenity-tag">✓ ${item.label}</span>`;
      }).join('');
    }

    // Default to Bidding view so bidding controls are always immediately visible and testable!
    const activeView = spot.activePricingView || 'auction';
    this.updatePricingModeUI(activeView);

    // Update decay specs
    const discount = Math.round(((spot.basePrice - spot.currentPrice) / spot.basePrice) * 100);
    document.getElementById('detailBasePrice').textContent = `₹${spot.basePrice}`;
    document.getElementById('detailCurrentPrice').textContent = `₹${Math.round(spot.currentPrice)}`;
    document.getElementById('detailFloorPrice').textContent = `₹${spot.floorPrice || 20}`;
    document.getElementById('detailDiscountBadge').textContent = `Save ${discount}%`;
    document.getElementById('detailDecayRateNote').textContent = `Price drops by ₹${spot.decayRatePerMin || 1.5} every 2 minutes as expiry nears!`;

    const progress = Math.max(5, Math.min(100, ((spot.currentPrice - spot.floorPrice) / (spot.basePrice - spot.floorPrice)) * 100));
    const fill = document.getElementById('detailDecayFill');
    if (fill) fill.style.width = `${progress}%`;

    this.updateDetailLiveValues(spot);
  }

  renderBidHistory(spot) {
    const box = document.getElementById('bidHistoryContainer');
    if (!box) return;

    const history = spot.bidHistory || [];
    if (history.length === 0) {
      box.innerHTML = `<div style="color:var(--text-muted); font-size:0.7rem;">No bids placed yet. Be the first to bid!</div>`;
      return;
    }

    box.innerHTML = history.slice(0, 4).map(h => `
      <div class="bid-history-item">
        <span>${h.bidder}</span>
        <strong>₹${h.amount} <small style="font-weight:normal; color:var(--text-muted);">(${h.time})</small></strong>
      </div>
    `).join('');
  }

  updateDetailLiveValues(spot) {
    if (spot.pricingType === 'auction') {
      const bidEl = document.getElementById('detailCurrentBid');
      const timerEl = document.getElementById('detailAuctionTimer');
      const bidderEl = document.getElementById('detailHighestBidder');

      if (bidEl) bidEl.textContent = `₹${spot.currentBid}`;
      if (bidderEl) bidderEl.textContent = spot.highestBidder || 'None yet';

      if (timerEl) {
        const mins = Math.floor(spot.auctionEndsInSeconds / 60);
        const secs = (spot.auctionEndsInSeconds % 60).toString().padStart(2, '0');
        timerEl.textContent = `${mins}:${secs}`;
      }
    } else {
      const priceEl = document.getElementById('detailCurrentPrice');
      const btnPriceEl = document.getElementById('detailBtnPrice');
      const windowTimerEl = document.getElementById('detailWindowTimer');

      if (priceEl) priceEl.textContent = `₹${Math.round(spot.currentPrice)}`;
      if (btnPriceEl) btnPriceEl.textContent = `₹${Math.round(spot.currentPrice)}`;
      if (windowTimerEl) {
        windowTimerEl.textContent = `${spot.windowMinutesRemaining || 15} minutes left`;
      }
    }
  }

  updateStatsBar() {
    const spots = pricingEngine.getSpots(this.currentLocality);
    const available = spots.filter(s => s.status === 'available');
    const auctions = spots.filter(s => s.pricingType === 'auction' && s.status === 'available');

    const statAvail = document.getElementById('statActiveSpots');
    const statAuct = document.getElementById('statAuctionsCount');
    if (statAvail) statAvail.textContent = available.length;
    if (statAuct) statAuct.textContent = auctions.length;
  }

  handleBookingCompleted(spot, booking) {
    pricingEngine.markSpotBooked(spot.id, booking);
    this.renderFeed();
    this.mapCtrl.updateSpots(pricingEngine.getSpots(this.currentLocality), this.activeFilter);
    this.renderDetailPanel(spot);
  }

  handleNewListingAdded(newSpot) {
    this.renderFeed();
    this.mapCtrl.updateSpots(pricingEngine.getSpots(this.currentLocality), this.activeFilter);
    this.selectSpot(newSpot);
  }

  openBookingsDrawer() {
    const bookings = JSON.parse(localStorage.getItem('parkpulse_tvl_bookings') || '[]');
    if (bookings.length === 0) {
      alert('No active parking permits yet. Select a spot in Tirunelveli and reserve it via PayPal to get your digital gate pass!');
      return;
    }
    this.paypal.showDigitalPass(bookings[0]);
  }
}

function initParkPulseApp() {
  if (!window.parkPulseApp) {
    window.parkPulseApp = new App();
    window.__PARKPULSE_INITIALIZED__ = true;
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initParkPulseApp);
} else {
  initParkPulseApp();
}
