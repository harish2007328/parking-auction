// Tirunelveli Parking Hubs & Real-time Spots Dataset
// Tailored exclusively for Tirunelveli Town, Junction, Vannarpettai, Palayamkottai & Malls
// Every spot supports BOTH Live Auction Bidding AND Dynamic Reverse Price Decay!

export const TIRUNELVELI_CENTER = [8.7250, 77.7050];

export const TIRUNELVELI_LOCALITIES = {
  'all': {
    name: 'All Tirunelveli Spots',
    center: [8.7250, 77.7050],
    zoom: 14,
    userLocation: [8.7240, 77.7250],
    description: 'All commercial and private slots across Tirunelveli'
  },
  'vannarpettai': {
    name: 'Vannarpettai & Roopa Mall',
    center: [8.7235, 77.7280],
    zoom: 16,
    userLocation: [8.7240, 77.7250],
    description: 'Shopping hubs, textile showrooms, and Roopa Mall'
  },
  'town': {
    name: 'Tirunelveli Town (Nellaiappar Temple)',
    center: [8.7285, 77.6870],
    zoom: 16,
    userLocation: [8.7270, 77.6860],
    description: 'High traffic temple zone, Car Streets, Bazaar'
  },
  'junction': {
    name: 'Tirunelveli Junction (Railway Station)',
    center: [8.7300, 77.7120],
    zoom: 16,
    userLocation: [8.7290, 77.7110],
    description: 'Railway station, bus stands, and commercial hotels'
  },
  'palayamkottai': {
    name: 'Palayamkottai (Market & VOC Ground)',
    center: [8.7120, 77.7420],
    zoom: 15,
    userLocation: [8.7110, 77.7400],
    description: 'Twin city district, schools, colleges, and VOC stadium'
  },
  'new-bus-stand': {
    name: 'New Bus Stand (Vaeinthaankulam)',
    center: [8.6985, 77.7330],
    zoom: 16,
    userLocation: [8.6990, 77.7310],
    description: 'Intercity bus terminal and bypass shopping complex'
  }
};

export const INITIAL_SPOTS = [
  // 1. Roopa Mall & North Bypass Corridor (High-Demand Micro-Auction - PRIMARY DEMO)
  {
    id: 'tvl-2',
    locality: 'vannarpettai',
    title: 'Roopa Mall & North Bypass Reserved Bay 2B',
    address: 'North Bypass Road, Vannarpettai, Tirunelveli',
    landmark: 'Adjacent to Roopa Mall Entry Gate 2',
    lat: 8.7248,
    lng: 77.7265,
    spotType: 'Indoor Garage',
    pricingType: 'auction',
    basePrice: 50,
    floorPrice: 25,
    currentPrice: 40,
    currentBid: 75,
    minBidIncrement: 10,
    instantBuyPrice: 120,
    totalBids: 8,
    auctionEndsInSeconds: 195,
    highestBidder: 'Murugan_TN72 (Swift Dzire)',
    bidHistory: [
      { bidder: 'Murugan_TN72 (Swift Dzire)', amount: 75, time: '1m ago' },
      { bidder: 'Karthik_Creta', amount: 65, time: '2m ago' },
      { bidder: 'Anand_i20', amount: 55, time: '3m ago' },
      { bidder: 'Senthil_Innova', amount: 50, time: '4m ago' }
    ],
    decayRatePerMin: 1.5,
    windowMinutesRemaining: 25,
    windowTotalMinutes: 60,
    host: {
      name: 'Vannarpettai Retail Commercials',
      avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80',
      rating: 4.88,
      reviewsCount: 310,
      badge: 'Verified Garage'
    },
    amenities: ['ev_charging', 'cctv', 'covered', 'security_guard'],
    vehicleSize: 'All Sizes / SUV Friendly',
    accessInstructions: 'Show instant PayPal / UPI digital badge at barrier scanner.',
    photo: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?w=600&auto=format&fit=crop&q=80',
    description: 'Prime weekend shopping slot opposite Roopa Mall. Active bidding war ending soon! Or lock instantly with Buy Now.',
    distanceMeters: 140,
    walkingMinutes: 2,
    status: 'available',
    createdAt: Date.now()
  },

  // 2. Sri Nellaiappar Temple Town
  {
    id: 'tvl-1',
    locality: 'town',
    title: 'Nellaiappar Temple West Car Street Driveway',
    address: '42 West Car Street, Tirunelveli Town',
    landmark: 'Opposite North Temple Gopuram Arch',
    lat: 8.7282,
    lng: 77.6855,
    spotType: 'Private Driveway',
    pricingType: 'auction',
    basePrice: 60,
    floorPrice: 25,
    currentPrice: 35,
    currentBid: 55,
    minBidIncrement: 10,
    instantBuyPrice: 90,
    totalBids: 6,
    auctionEndsInSeconds: 220,
    highestBidder: 'Senthil_Pillai (Innova)',
    bidHistory: [
      { bidder: 'Senthil_Pillai (Innova)', amount: 55, time: '45s ago' },
      { bidder: 'Karthik_Baleno', amount: 45, time: '2m ago' },
      { bidder: 'Muthu_Auto', amount: 35, time: '3m ago' }
    ],
    decayRatePerMin: 1.5,
    windowMinutesRemaining: 18,
    windowTotalMinutes: 60,
    host: {
      name: 'Subramanian Pillai',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      rating: 4.96,
      reviewsCount: 142,
      badge: 'Temple Superhost'
    },
    amenities: ['cctv', 'covered', 'instant_claim'],
    vehicleSize: 'Sedan / Hatchback / Auto',
    accessInstructions: 'Drive straight past West Ratha Veethi arch; Bay #1 on left with green gate.',
    photo: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80',
    description: 'Priceless sheltered parking space right on West Car Street. Skip the town bazaar chaos! Bidding war active.',
    distanceMeters: 180,
    walkingMinutes: 2,
    status: 'available',
    createdAt: Date.now()
  },

  // 3. Tirunelveli Junction Railway Station
  {
    id: 'tvl-3',
    locality: 'junction',
    title: 'Tirunelveli Junction Station Bay A',
    address: 'Railway Feeder Road, Tirunelveli Junction',
    landmark: '100m from Platform 1 Main Entrance',
    lat: 8.7305,
    lng: 77.7125,
    spotType: 'Commercial Lot',
    pricingType: 'decay',
    basePrice: 70,
    floorPrice: 30,
    currentPrice: 42,
    currentBid: 50,
    minBidIncrement: 10,
    instantBuyPrice: 85,
    totalBids: 4,
    auctionEndsInSeconds: 180,
    highestBidder: 'ExpressDriver_72',
    bidHistory: [
      { bidder: 'ExpressDriver_72', amount: 50, time: '1m ago' },
      { bidder: 'Rajesh_Ciaz', amount: 40, time: '3m ago' }
    ],
    decayRatePerMin: 2.0,
    windowMinutesRemaining: 14,
    windowTotalMinutes: 45,
    host: {
      name: 'Junction Commuter Parking',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
      rating: 4.85,
      reviewsCount: 220,
      badge: 'Transit Superhost'
    },
    amenities: ['cctv', 'instant_claim', 'ev_charging'],
    vehicleSize: 'Sedan / SUV / Hatchback',
    accessInstructions: 'Drive onto express entry lane. Automated camera recognizes booking number.',
    photo: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?w=600&auto=format&fit=crop&q=80',
    description: 'Catch your Nellai Express without circling around! Price drops dynamically every 2 minutes.',
    distanceMeters: 130,
    walkingMinutes: 2,
    status: 'available',
    createdAt: Date.now()
  },

  // 4. Vannarpettai Chellapandian Circle
  {
    id: 'tvl-4',
    locality: 'vannarpettai',
    title: 'Chellapandian Statue Circle Carport',
    address: 'Trivandrum High Road, Vannarpettai, Tirunelveli',
    landmark: 'Behind Kalyan Silks Showroom',
    lat: 8.7225,
    lng: 77.7295,
    spotType: 'Residential Carport',
    pricingType: 'decay',
    basePrice: 50,
    floorPrice: 20,
    currentPrice: 28,
    currentBid: 35,
    minBidIncrement: 10,
    instantBuyPrice: 65,
    totalBids: 3,
    auctionEndsInSeconds: 210,
    highestBidder: 'Arun_Tata',
    bidHistory: [
      { bidder: 'Arun_Tata', amount: 35, time: '2m ago' },
      { bidder: 'Ganesh_P', amount: 25, time: '4m ago' }
    ],
    decayRatePerMin: 1.2,
    windowMinutesRemaining: 16,
    windowTotalMinutes: 50,
    host: {
      name: 'Arumugam Nadar',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      rating: 4.92,
      reviewsCount: 88,
      badge: 'Local Resident'
    },
    amenities: ['covered', 'cctv', 'instant_claim'],
    vehicleSize: 'Standard Sedan / Hatchback',
    accessInstructions: 'Covered port with green sliding gate. Keypad entry PIN provided upon booking.',
    photo: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&auto=format&fit=crop&q=80',
    description: 'Calm residential carport 1 minute from the busy Vannarpettai shopping junction.',
    distanceMeters: 310,
    walkingMinutes: 4,
    status: 'available',
    createdAt: Date.now()
  },

  // 5. Palayamkottai VOC Ground & Market
  {
    id: 'tvl-5',
    locality: 'palayamkottai',
    title: 'Palayamkottai VOC Stadium & Market Lane',
    address: 'VOC Stadium Road, Palayamkottai, Tirunelveli',
    landmark: 'Near St. Xavier’s College Gate',
    lat: 8.7125,
    lng: 77.7410,
    spotType: 'Private Driveway',
    pricingType: 'auction',
    basePrice: 40,
    floorPrice: 20,
    currentPrice: 30,
    currentBid: 60,
    minBidIncrement: 10,
    instantBuyPrice: 95,
    totalBids: 5,
    auctionEndsInSeconds: 240,
    highestBidder: 'Praveen_Kumar',
    bidHistory: [
      { bidder: 'Praveen_Kumar', amount: 60, time: '30s ago' },
      { bidder: 'Suresh_K', amount: 50, time: '2m ago' },
      { bidder: 'Ganesh_R', amount: 40, time: '4m ago' }
    ],
    decayRatePerMin: 1.0,
    windowMinutesRemaining: 30,
    windowTotalMinutes: 60,
    host: {
      name: 'Dr. Joseph Raj',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      rating: 4.95,
      reviewsCount: 64,
      badge: 'Verified Resident'
    },
    amenities: ['cctv', 'covered', 'suv_friendly'],
    vehicleSize: 'All Sizes / Large SUV',
    accessInstructions: 'Wide double driveway. Security watchman assists with hassle-free parking.',
    photo: 'https://images.unsplash.com/photo-1590674899484-d5640e854abe?w=600&auto=format&fit=crop&q=80',
    description: 'High demand during college hours and VOC ground evening sports matches. Bid now or instant claim.',
    distanceMeters: 290,
    walkingMinutes: 4,
    status: 'available',
    createdAt: Date.now()
  },

  // 6. Vaeinthaankulam New Bus Stand
  {
    id: 'tvl-6',
    locality: 'new-bus-stand',
    title: 'Vaeinthaankulam New Bus Stand Express Lot',
    address: 'New Bus Stand Bypass, Tirunelveli',
    landmark: 'Behind City Bus Departure Bay',
    lat: 8.6980,
    lng: 77.7335,
    spotType: 'Commercial Lot',
    pricingType: 'decay',
    basePrice: 50,
    floorPrice: 20,
    currentPrice: 30,
    currentBid: 38,
    minBidIncrement: 10,
    instantBuyPrice: 65,
    totalBids: 2,
    auctionEndsInSeconds: 230,
    highestBidder: 'CityCommuter_9',
    bidHistory: [
      { bidder: 'CityCommuter_9', amount: 38, time: '1m ago' }
    ],
    decayRatePerMin: 1.0,
    windowMinutesRemaining: 22,
    windowTotalMinutes: 60,
    host: {
      name: 'Nellai Metro Transit',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      rating: 4.81,
      reviewsCount: 190,
      badge: 'Transit Partner'
    },
    amenities: ['ev_charging', 'cctv', 'instant_claim'],
    vehicleSize: 'All Standard Vehicles',
    accessInstructions: 'Barrier arm lifts with QR code scan on digital parking pass.',
    photo: 'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?w=600&auto=format&fit=crop&q=80',
    description: 'Secure open paved bay right at the intercity bus terminal. Great for commuters departing Tirunelveli.',
    distanceMeters: 160,
    walkingMinutes: 2,
    status: 'available',
    createdAt: Date.now()
  },

  // 7. Town East Car Street Bazaar
  {
    id: 'tvl-7',
    locality: 'town',
    title: 'East Car Street Halwa Corner Covered Slot',
    address: 'East Car Street, Tirunelveli Town',
    landmark: 'Near Iruttu Kadai Halwa Shop',
    lat: 8.7292,
    lng: 77.6885,
    spotType: 'Private Driveway',
    pricingType: 'auction',
    basePrice: 70,
    floorPrice: 35,
    currentPrice: 45,
    currentBid: 65,
    minBidIncrement: 10,
    instantBuyPrice: 110,
    totalBids: 7,
    auctionEndsInSeconds: 160,
    highestBidder: 'HalwaLover_TN72',
    bidHistory: [
      { bidder: 'HalwaLover_TN72', amount: 65, time: '1m ago' },
      { bidder: 'Kannan_Swift', amount: 55, time: '2m ago' },
      { bidder: 'Muthu_R', amount: 45, time: '3m ago' }
    ],
    decayRatePerMin: 1.8,
    windowMinutesRemaining: 12,
    windowTotalMinutes: 45,
    host: {
      name: 'Sundaram Chettiar',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      rating: 4.98,
      reviewsCount: 180,
      badge: 'Town Superhost'
    },
    amenities: ['cctv', 'covered', 'instant_claim'],
    vehicleSize: 'Sedan / Compact SUV',
    accessInstructions: 'Drive into private heritage compound; designated spot #3.',
    photo: 'https://images.unsplash.com/photo-1573348722427-f1d6819fdf98?w=600&auto=format&fit=crop&q=80',
    description: 'Impossible to find parking near East Car Street and Iruttu Kadai without this spot! Active micro-auction.',
    distanceMeters: 140,
    walkingMinutes: 2,
    status: 'available',
    createdAt: Date.now()
  }
];

export const AMENITY_LABELS = {
  ev_charging: { label: 'EV Fast Charging', icon: 'zap' },
  cctv: { label: '24/7 CCTV Monitored', icon: 'shield-check' },
  covered: { label: 'Covered / Rain Shelter', icon: 'umbrella' },
  security_guard: { label: 'Security Guard Onsite', icon: 'user-check' },
  instant_claim: { label: 'Instant Gate Pass', icon: 'check-circle' },
  suv_friendly: { label: 'Large SUV Friendly', icon: 'truck' }
};
