// Leaflet Map Controller for Tirunelveli
// Minimalist, Clean White / Pastel Solid Aesthetic (No gradients, no shadows)

export class MapController {
  constructor(containerId, onSpotSelect) {
    this.containerId = containerId;
    this.onSpotSelect = onSpotSelect;
    this.map = null;
    this.userMarker = null;
    this.radiusCircle = null;
    this.routeLine = null;
    this.etaMarker = null;
    this.spotMarkers = new Map();
    this.userCoords = [8.7270, 77.6860]; // Tirunelveli Town
    this.selectedSpotId = null;
  }

  init(initialCenter = [8.7285, 77.6870], zoom = 15) {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error('Map container not found:', this.containerId);
      return;
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    // Initialize Leaflet Map
    this.map = L.map(this.containerId, {
      center: initialCenter,
      zoom: zoom,
      zoomControl: true,
      attributionControl: false
    });

    // Clean, crisp OpenStreetMap & Positron light tiles (Zero dark, crisp white theme)
    const lightTiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    });

    lightTiles.addTo(this.map);

    // Render User location marker in Tirunelveli
    this.renderUserLocation(this.userCoords);

    // Ensure map tiles layout properly on initial load and window resize
    setTimeout(() => {
      if (this.map) this.map.invalidateSize();
    }, 200);

    window.addEventListener('resize', () => {
      if (this.map) this.map.invalidateSize();
    });
  }

  setUserLocation(lat, lng, pan = false) {
    this.userCoords = [lat, lng];
    if (this.userMarker) {
      this.userMarker.setLatLng([lat, lng]);
    } else {
      this.renderUserLocation([lat, lng]);
    }

    if (this.radiusCircle) {
      this.radiusCircle.setLatLng([lat, lng]);
    }

    if (pan && this.map) {
      this.map.flyTo([lat, lng], 15, { duration: 1 });
      setTimeout(() => this.map.invalidateSize(), 150);
    }
  }

  renderUserLocation(coords) {
    if (!this.map) return;

    // Solid clean user pin (No gradients, no shadows)
    const userIcon = L.divIcon({
      className: 'user-pin-wrapper',
      html: `
        <div class="user-solid-pin">
          <div class="user-center-point"></div>
        </div>
      `,
      iconSize: [28, 28],
      iconAnchor: [14, 14]
    });

    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }
    this.userMarker = L.marker(coords, { icon: userIcon, zIndexOffset: 1000 }).addTo(this.map);

    // 250m walking radius circle - solid pastel cyan border
    if (this.radiusCircle) {
      this.map.removeLayer(this.radiusCircle);
    }
    this.radiusCircle = L.circle(coords, {
      radius: 250,
      color: '#0284c7',
      fillColor: '#f0f9ff',
      fillOpacity: 0.25,
      weight: 1.5,
      dashArray: '4, 4'
    }).addTo(this.map);
  }

  updateSpots(spots, activeFilter = null) {
    if (!this.map) return;

    const visibleIds = new Set();

    spots.forEach(spot => {
      if (activeFilter && !this.matchesFilter(spot, activeFilter)) {
        return;
      }

      visibleIds.add(spot.id);
      const isSelected = this.selectedSpotId === spot.id;
      const markerHtml = this.createMarkerHtml(spot, isSelected);

      if (this.spotMarkers.has(spot.id)) {
        const marker = this.spotMarkers.get(spot.id);
        const el = marker.getElement();
        if (el) {
          el.innerHTML = markerHtml;
          if (isSelected) {
            el.classList.add('is-selected');
          } else {
            el.classList.remove('is-selected');
          }
        }
      } else {
        const icon = L.divIcon({
          className: `spot-marker-container ${isSelected ? 'is-selected' : ''}`,
          html: markerHtml,
          iconSize: [90, 40],
          iconAnchor: [45, 40]
        });

        const marker = L.marker([spot.lat, spot.lng], { icon });
        marker.on('click', () => this.selectSpot(spot));
        marker.addTo(this.map);
        this.spotMarkers.set(spot.id, marker);
      }
    });

    // Clean up markers
    for (const [id, marker] of this.spotMarkers.entries()) {
      if (!visibleIds.has(id)) {
        this.map.removeLayer(marker);
        this.spotMarkers.delete(id);
      }
    }
  }

  createMarkerHtml(spot, isSelected) {
    if (spot.status === 'booked') {
      return `
        <div class="marker-pill booked">
          <span class="marker-tag">RESERVED</span>
        </div>
      `;
    }

    if (spot.pricingType === 'auction') {
      const mins = Math.floor(spot.auctionEndsInSeconds / 60);
      const secs = (spot.auctionEndsInSeconds % 60).toString().padStart(2, '0');
      return `
        <div class="marker-pill auction ${isSelected ? 'active' : ''}">
          <span class="marker-icon">🔨</span>
          <span class="marker-price">₹${spot.currentBid}</span>
          <span class="marker-timer">${mins}:${secs}</span>
        </div>
      `;
    }

    // Dynamic Price Decay Marker (Pastel Mint)
    const discount = Math.round(((spot.basePrice - spot.currentPrice) / spot.basePrice) * 100);
    return `
      <div class="marker-pill decay ${isSelected ? 'active' : ''}">
        <span class="marker-price">₹${Math.round(spot.currentPrice)}</span>
        ${discount > 5 ? `<span class="marker-badge">-${discount}%</span>` : ''}
      </div>
    `;
  }

  selectSpot(spot, panTo = true) {
    this.selectedSpotId = spot.id;

    this.spotMarkers.forEach((marker, id) => {
      const el = marker.getElement();
      if (el) {
        if (id === spot.id) {
          el.classList.add('is-selected');
        } else {
          el.classList.remove('is-selected');
        }
      }
    });

    this.drawRoute(this.userCoords, [spot.lat, spot.lng], spot);

    if (panTo && this.map) {
      const bounds = L.latLngBounds([this.userCoords, [spot.lat, spot.lng]]);
      this.map.flyToBounds(bounds, {
        paddingTopLeft: [40, 40],
        paddingBottomRight: [360, 40],
        duration: 0.8,
        maxZoom: 16
      });
      setTimeout(() => this.map.invalidateSize(), 200);
    }

    if (this.onSpotSelect) {
      this.onSpotSelect(spot);
    }
  }

  drawRoute(start, end, spot) {
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }
    if (this.etaMarker) {
      this.map.removeLayer(this.etaMarker);
      this.etaMarker = null;
    }

    // Realistic street orthogonal path
    const midLat = start[0] + (end[0] - start[0]) * 0.5;
    const path = [
      start,
      [midLat, start[1]],
      [midLat, end[1]],
      end
    ];

    // Solid blue path (No gradients, no shadows)
    this.routeLine = L.polyline(path, {
      color: '#0284c7',
      weight: 3.5,
      dashArray: '6, 6',
      lineCap: 'round'
    }).addTo(this.map);

    const etaHtml = `
      <div class="map-eta-label">
        <span>🚶 ${spot.walkingMinutes || 3}m walk (${spot.distanceMeters || 200}m)</span>
      </div>
    `;

    const etaIcon = L.divIcon({
      className: 'map-eta-wrapper',
      html: etaHtml,
      iconSize: [140, 26],
      iconAnchor: [70, 13]
    });

    this.etaMarker = L.marker([midLat, (start[1] + end[1]) / 2], { icon: etaIcon }).addTo(this.map);
  }

  clearSelection() {
    this.selectedSpotId = null;
    if (this.routeLine) {
      this.map.removeLayer(this.routeLine);
      this.routeLine = null;
    }
    if (this.etaMarker) {
      this.map.removeLayer(this.etaMarker);
      this.etaMarker = null;
    }
    this.spotMarkers.forEach(marker => {
      const el = marker.getElement();
      if (el) el.classList.remove('is-selected');
    });
  }

  matchesFilter(spot, filter) {
    if (filter.locality && filter.locality !== 'all' && spot.locality !== filter.locality) {
      return false;
    }

    if (filter.pricingType && filter.pricingType !== 'all') {
      if (filter.pricingType === 'decay' && spot.pricingType !== 'decay') return false;
      if (filter.pricingType === 'auction' && spot.pricingType !== 'auction') return false;
    }

    if (filter.evCharging && (!spot.amenities || !spot.amenities.includes('ev_charging'))) {
      return false;
    }

    if (filter.covered && (!spot.amenities || !spot.amenities.includes('covered'))) {
      return false;
    }

    return true;
  }
}
