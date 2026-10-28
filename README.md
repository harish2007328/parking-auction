# ParkPulse: Tirunelveli Smart Parking & Dynamic Auction

A high-performance web application designed exclusively for **Tirunelveli, Tamil Nadu**, featuring **real-time map discovery**, **dynamic price decay for expiring unused spaces**, **live micro-auctions**, **PayPal & UPI checkout**, and **verified digital gate passes**.

Built in a **Pure Clean White Theme** with **solid & pastel colors**, **zero gradients**, **zero drop shadows**, and **Instrument Sans** typography.

---

## 📍 Focused Exclusively on Tirunelveli Major Hubs
- **Sri Nellaiappar Temple & Town Bazaar**: West Car Street, East Car Street / Sannathi Street, and Iruttu Kadai Halwa lane.
- **Roopa Mall & North Bypass Corridor**: Weekend shopping and cinema parking with active bidding wars.
- **Tirunelveli Junction Railway Station**: Transit commuter parking with rapid dynamic price drops as train departures near.
- **Vannarpettai & Chellapandian Circle**: Retail showrooms and commercial banks.
- **Palayamkottai**: VOC Stadium Ground, St. Xavier's College area, and twin-city market spaces.
- **Vaeinthaankulam New Bus Stand**: Intercity bus terminal commuter bays with EV charging.

---

## 🎨 Design System
- **Pure White Background**: `#ffffff` and subtle clean `#f8fafc`.
- **Zero Gradients**: All surfaces use crisp solid colors.
- **Zero Drop Shadows**: All geometry is defined with clean `1px solid #e2e8f0` borders (`box-shadow: none !important`).
- **Pastel Palette**:
  - 🌿 **Pastel Mint** (`#ecfdf5` / `#a7f3d0` / `#065f46`): Dynamic reverse price decay & savings.
  - 🌊 **Pastel Sky** (`#f0f9ff` / `#bae6fd` / `#0369a1`): Distance and instant gate badges.
  - 🍯 **Pastel Amber** (`#fffbeb` / `#fde68a` / `#92400e`): Live bidding auctions.
- **Typography**: Google **Instrument Sans** with **JetBrains Mono** for monetary amounts (`₹`) and countdown timers.
- **Mobile Responsive**: Adaptive layout with bottom navigation tabs ("🗺️ Map View" / "📋 Spots List") and a slide-up drawer on mobile devices.

---

## 🔨 Interactive Bidding Engine
- **Live Bid Countdown**: Real-time timer with anti-sniping protection (+30s added when bids occur in the final 30s).
- **Quick Bid Chips**: Instant +₹10, +₹20, +₹50 increments or custom amount input.
- **Real-Time Bid Ledger**: Displays recent competing bids from simulated local drivers (e.g. `Murugan_TN72`, `Karthik_Baleno`).
- **Instant Buy Now**: Allows drivers in a hurry to bypass the bidding war and claim the spot immediately.

---

## 🚀 How to Run Locally

```bash
# Start local server
npm start
# or
node server.js
```

Open your browser at:
**[http://localhost:3000](http://localhost:3000)**
