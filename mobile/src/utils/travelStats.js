import { differenceInDays, startOfDay } from 'date-fns'

// ── Haversine ─────────────────────────────────────────────────────────────────

export function haversineKm(lat1, lng1, lat2, lng2) {
  if (lat1 == null || lng1 == null || lat2 == null || lng2 == null) return 0
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Static city coordinate fallback table ─────────────────────────────────────
// Key format: "city|CC" (lowercase city, uppercase country code)

const CITY_COORDS = {
  'london|GB':      [51.5074, -0.1278],  'paris|FR':       [48.8566,  2.3522],
  'new york|US':    [40.7128,-74.0060],  'tokyo|JP':       [35.6762,139.6503],
  'rome|IT':        [41.9028, 12.4964],  'berlin|DE':      [52.5200, 13.4050],
  'madrid|ES':      [40.4168, -3.7038],  'barcelona|ES':   [41.3851,  2.1734],
  'amsterdam|NL':   [52.3676,  4.9041],  'vienna|AT':      [48.2082, 16.3738],
  'prague|CZ':      [50.0755, 14.4378],  'budapest|HU':    [47.4979, 19.0402],
  'lisbon|PT':      [38.7169, -9.1395],  'athens|GR':      [37.9838, 23.7275],
  'istanbul|TR':    [41.0082, 28.9784],  'moscow|RU':      [55.7558, 37.6176],
  'dubai|AE':       [25.2048, 55.2708],  'singapore|SG':   [1.3521,  103.8198],
  'sydney|AU':      [-33.8688,151.2093], 'melbourne|AU':   [-37.8136,144.9631],
  'toronto|CA':     [43.6532,-79.3832],  'vancouver|CA':   [49.2827,-123.1207],
  'los angeles|US': [34.0522,-118.2437], 'chicago|US':     [41.8781,-87.6298],
  'miami|US':       [25.7617,-80.1918],  'san francisco|US':[37.7749,-122.4194],
  'seattle|US':     [47.6062,-122.3321], 'boston|US':      [42.3601,-71.0589],
  'washington|US':  [38.9072,-77.0369],  'las vegas|US':   [36.1699,-115.1398],
  'mexico city|MX': [19.4326,-99.1332],  'cancun|MX':      [21.1619,-86.8515],
  'sao paulo|BR':   [-23.5505,-46.6333], 'rio de janeiro|BR':[-22.9068,-43.1729],
  'buenos aires|AR':[-34.6037,-58.3816], 'bogota|CO':      [4.7110,-74.0721],
  'lima|PE':        [-12.0464,-77.0428], 'santiago|CL':    [-33.4489,-70.6693],
  'cairo|EG':       [30.0444, 31.2357],  'nairobi|KE':     [-1.2921, 36.8219],
  'johannesburg|ZA':[-26.2041, 28.0473], 'cape town|ZA':   [-33.9249, 18.4241],
  'lagos|NG':       [6.5244,   3.3792],  'casablanca|MA':  [33.5731, -7.5898],
  'mumbai|IN':      [19.0760, 72.8777],  'delhi|IN':       [28.6139, 77.2090],
  'bangalore|IN':   [12.9716, 77.5946],  'kolkata|IN':     [22.5726, 88.3639],
  'beijing|CN':     [39.9042,116.4074],  'shanghai|CN':    [31.2304,121.4737],
  'hong kong|HK':   [22.3193,114.1694],  'seoul|KR':       [37.5665,126.9780],
  'bangkok|TH':     [13.7563,100.5018],  'jakarta|ID':     [-6.2088,106.8456],
  'kuala lumpur|MY':[3.1390, 101.6869],  'manila|PH':      [14.5995,120.9842],
  'hanoi|VN':       [21.0285,105.8542],  'ho chi minh city|VN':[10.8231,106.6297],
  'taipei|TW':      [25.0330,121.5654],  'osaka|JP':       [34.6937,135.5023],
  'kyoto|JP':       [35.0116,135.7681],  'auckland|NZ':    [-36.8485,174.7633],
  'bali|ID':        [-8.3405,115.0920],  'phuket|TH':      [7.8804, 98.3923],
  'dubai|AE':       [25.2048, 55.2708],  'abu dhabi|AE':   [24.4539, 54.3773],
  'doha|QA':        [25.2854, 51.5310],  'riyadh|SA':      [24.7136, 46.6753],
  'tel aviv|IL':    [32.0853, 34.7818],  'amman|JO':       [31.9539, 35.9106],
  'stockholm|SE':   [59.3293, 18.0686],  'oslo|NO':        [59.9139, 10.7522],
  'copenhagen|DK':  [55.6761, 12.5683],  'helsinki|FI':    [60.1699, 24.9384],
  'zurich|CH':      [47.3769,  8.5417],  'geneva|CH':      [46.2044,  6.1432],
  'brussels|BE':    [50.8503,  4.3517],  'warsaw|PL':       [52.2297, 21.0122],
  'bucharest|RO':   [44.4268, 26.1025],  'sofia|BG':       [42.6977, 23.3219],
  'zagreb|HR':      [45.8150, 15.9819],  'dubrovnik|HR':   [42.6507, 18.0944],
  'edinburgh|GB':   [55.9533, -3.1883],  'dublin|IE':      [53.3498, -6.2603],
  'lisbon|PT':      [38.7169, -9.1395],  'porto|PT':       [41.1579, -8.6291],
  'seville|ES':     [37.3891, -5.9845],  'florence|IT':    [43.7696, 11.2558],
  'venice|IT':      [45.4408, 12.3155],  'milan|IT':       [45.4642,  9.1900],
  'munich|DE':      [48.1351, 11.5820],  'frankfurt|DE':   [50.1109,  8.6821],
  'hamburg|DE':     [53.5753,  10.0153], 'cologne|DE':     [50.9333,  6.9500],
  'zurich|CH':      [47.3769,  8.5417],  'bern|CH':        [46.9480,  7.4474],
  'reykjavik|IS':   [64.1466,-21.9426],  'valletta|MT':    [35.8997, 14.5147],
  'nicosia|CY':     [35.1676, 33.3736],  'bratislava|SK':  [48.1486, 17.1077],
  'ljubljana|SI':   [46.0569, 14.5058],  'sarajevo|BA':    [43.8563, 18.4131],
  'montreal|CA':    [45.5017,-73.5673],  'calgary|CA':     [51.0447,-114.0719],
  'honolulu|US':    [21.3069,-157.8583], 'denver|US':      [39.7392,-104.9903],
  'atlanta|US':     [33.7490,-84.3880],  'dallas|US':      [32.7767,-96.7970],
  'houston|US':     [29.7604,-95.3698],  'phoenix|US':     [33.4484,-112.0740],
  'portland|US':    [45.5051,-122.6750], 'minneapolis|US': [44.9778,-93.2650],
  'nashville|US':   [36.1627,-86.7816],  'new orleans|US': [29.9511,-90.0715],
  'havana|CU':      [23.1136,-82.3666],  'panama city|PA': [8.9936,-79.5197],
  'san jose|CR':    [9.9281,-84.0907],   'guatemala city|GT':[14.6349,-90.5069],
  'quito|EC':       [-0.2295,-78.5243],  'la paz|BO':      [-16.5000,-68.1500],
  'montevideo|UY':  [-34.9011,-56.1645], 'asuncion|PY':    [-25.2867,-57.6470],
  'caracas|VE':     [10.4806,-66.9036],  'medellin|CO':    [6.2442,-75.5812],
  'marrakech|MA':   [31.6295,-7.9811],   'tunis|TN':       [36.8190, 10.1658],
  'algiers|DZ':     [36.7372,  3.0865],  'accra|GH':       [5.6037,  -0.1870],
  'addis ababa|ET': [9.0300,  38.7400],  'dar es salaam|TZ':[-6.7924, 39.2083],
  'kampala|UG':     [0.3476,  32.5825],  'kigali|RW':      [-1.9441, 30.0619],
  'lusaka|ZM':      [-15.4167, 28.2833], 'harare|ZW':      [-17.8292, 31.0522],
  'maputo|MZ':      [-25.9692, 32.5732], 'windhoek|NA':    [-22.5597, 17.0832],
  'gaborone|BW':    [-24.6282, 25.9231], 'antananarivo|MG':[-18.9137, 47.5361],
  'colombo|LK':     [6.9271,  79.8612],  'kathmandu|NP':   [27.7172, 85.3240],
  'dhaka|BD':       [23.8103, 90.4125],  'karachi|PK':     [24.8607, 67.0011],
  'lahore|PK':      [31.5204, 74.3587],  'islamabad|PK':   [33.6844, 73.0479],
  'tashkent|UZ':    [41.2995, 69.2401],  'almaty|KZ':      [43.2220, 76.8512],
  'tbilisi|GE':     [41.6938, 44.8015],  'yerevan|AM':     [40.1872, 44.5152],
  'baku|AZ':        [40.4093, 49.8671],  'minsk|BY':       [53.9006, 27.5590],
  'riga|LV':        [56.9460, 24.1059],  'tallinn|EE':     [59.4370, 24.7536],
  'vilnius|LT':     [54.6872, 25.2797],  'kyiv|UA':        [50.4501, 30.5234],
  'chisinau|MD':    [47.0105, 28.8638],  'tirana|AL':      [41.3275, 19.8187],
  'skopje|MK':      [41.9961, 21.4316],  'podgorica|ME':   [42.4304, 19.2594],
  'pristina|XK':    [42.6629, 21.1655],  'belgrade|RS':    [44.8176, 20.4569],
}

export function lookupCityCoords(dest) {
  const key = `${(dest.city || '').toLowerCase()}|${(dest.countryCode || '').toUpperCase()}`
  const coords = CITY_COORDS[key]
  return coords ? { lat: coords[0], lng: coords[1] } : null
}

export function resolveCoords(dest) {
  if (dest.lat != null && dest.lng != null) return { lat: dest.lat, lng: dest.lng, approximate: false }
  const fallback = lookupCityCoords(dest)
  if (fallback) return { ...fallback, approximate: true }
  return null
}

// ── Distance ──────────────────────────────────────────────────────────────────

export function tripDistanceKm(destinations) {
  const sorted = [...(destinations || [])].sort(
    (a, b) => new Date(a.arrival) - new Date(b.arrival)
  )
  let km = 0
  let approximateCount = 0
  let skippedCount = 0
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = resolveCoords(sorted[i])
    const b = resolveCoords(sorted[i + 1])
    if (!a || !b) { skippedCount++; continue }
    km += haversineKm(a.lat, a.lng, b.lat, b.lng)
    if (a.approximate || b.approximate) approximateCount++
  }
  return { km, approximateCount, skippedCount }
}

export function yearDistanceKm(trips, year) {
  let km = 0
  let approximateCount = 0
  let skippedCount = 0
  for (const trip of trips || []) {
    const dests = (trip.destinations || []).filter(
      (d) => new Date(d.arrival).getFullYear() === year
    )
    if (dests.length < 2) continue
    const result = tripDistanceKm(dests)
    km += result.km
    approximateCount += result.approximateCount
    skippedCount += result.skippedCount
  }
  return { km, approximateCount, skippedCount }
}

// ── Geography ─────────────────────────────────────────────────────────────────

export function uniqueCountries(destinations) {
  return [...new Set((destinations || []).map((d) => d.countryCode).filter(Boolean))].sort()
}

const CONTINENT_MAP = {
  AF:'Africa',DZ:'Africa',AO:'Africa',BJ:'Africa',BW:'Africa',BF:'Africa',
  BI:'Africa',CM:'Africa',CV:'Africa',CF:'Africa',TD:'Africa',KM:'Africa',
  CG:'Africa',CD:'Africa',CI:'Africa',DJ:'Africa',EG:'Africa',GQ:'Africa',
  ER:'Africa',ET:'Africa',GA:'Africa',GM:'Africa',GH:'Africa',GN:'Africa',
  GW:'Africa',KE:'Africa',LS:'Africa',LR:'Africa',LY:'Africa',MG:'Africa',
  MW:'Africa',ML:'Africa',MR:'Africa',MU:'Africa',YT:'Africa',MA:'Africa',
  MZ:'Africa',NA:'Africa',NE:'Africa',NG:'Africa',RE:'Africa',RW:'Africa',
  SH:'Africa',ST:'Africa',SN:'Africa',SC:'Africa',SL:'Africa',SO:'Africa',
  ZA:'Africa',SS:'Africa',SD:'Africa',SZ:'Africa',TZ:'Africa',TG:'Africa',
  TN:'Africa',UG:'Africa',EH:'Africa',ZM:'Africa',ZW:'Africa',
  DZ:'Africa',
  AS:'Oceania',AU:'Oceania',CK:'Oceania',FJ:'Oceania',PF:'Oceania',
  GU:'Oceania',KI:'Oceania',MH:'Oceania',FM:'Oceania',NR:'Oceania',
  NC:'Oceania',NZ:'Oceania',NU:'Oceania',MP:'Oceania',PW:'Oceania',
  PG:'Oceania',PN:'Oceania',WS:'Oceania',SB:'Oceania',TK:'Oceania',
  TO:'Oceania',TV:'Oceania',VU:'Oceania',WF:'Oceania',
  AQ:'Antarctica',
  AM:'Asia',AZ:'Asia',BH:'Asia',BD:'Asia',BT:'Asia',IO:'Asia',BN:'Asia',
  KH:'Asia',CN:'Asia',CX:'Asia',CC:'Asia',CY:'Asia',GE:'Asia',HK:'Asia',
  IN:'Asia',ID:'Asia',IR:'Asia',IQ:'Asia',IL:'Asia',JP:'Asia',JO:'Asia',
  KZ:'Asia',KW:'Asia',KG:'Asia',LA:'Asia',LB:'Asia',MO:'Asia',MY:'Asia',
  MV:'Asia',MN:'Asia',MM:'Asia',NP:'Asia',KP:'Asia',OM:'Asia',PK:'Asia',
  PS:'Asia',PH:'Asia',QA:'Asia',SA:'Asia',SG:'Asia',KR:'Asia',LK:'Asia',
  SY:'Asia',TW:'Asia',TJ:'Asia',TH:'Asia',TL:'Asia',TR:'Asia',TM:'Asia',
  AE:'Asia',UZ:'Asia',VN:'Asia',YE:'Asia',
  AL:'Europe',AD:'Europe',AT:'Europe',BY:'Europe',BE:'Europe',BA:'Europe',
  BG:'Europe',HR:'Europe',CY:'Europe',CZ:'Europe',DK:'Europe',EE:'Europe',
  FO:'Europe',FI:'Europe',FR:'Europe',DE:'Europe',GI:'Europe',GR:'Europe',
  GG:'Europe',HU:'Europe',IS:'Europe',IE:'Europe',IM:'Europe',IT:'Europe',
  JE:'Europe',XK:'Europe',LV:'Europe',LI:'Europe',LT:'Europe',LU:'Europe',
  MK:'Europe',MT:'Europe',MD:'Europe',MC:'Europe',ME:'Europe',NL:'Europe',
  NO:'Europe',PL:'Europe',PT:'Europe',RO:'Europe',RU:'Europe',SM:'Europe',
  RS:'Europe',SK:'Europe',SI:'Europe',ES:'Europe',SE:'Europe',CH:'Europe',
  UA:'Europe',GB:'Europe',VA:'Europe',
  AI:'Americas',AG:'Americas',AR:'Americas',AW:'Americas',BS:'Americas',
  BB:'Americas',BZ:'Americas',BM:'Americas',BO:'Americas',BQ:'Americas',
  BR:'Americas',VG:'Americas',CA:'Americas',KY:'Americas',CL:'Americas',
  CO:'Americas',CR:'Americas',CU:'Americas',CW:'Americas',DM:'Americas',
  DO:'Americas',EC:'Americas',SV:'Americas',FK:'Americas',GF:'Americas',
  GL:'Americas',GD:'Americas',GP:'Americas',GT:'Americas',GY:'Americas',
  HT:'Americas',HN:'Americas',JM:'Americas',MQ:'Americas',MX:'Americas',
  MS:'Americas',NI:'Americas',PA:'Americas',PY:'Americas',PE:'Americas',
  PR:'Americas',BL:'Americas',KN:'Americas',LC:'Americas',MF:'Americas',
  PM:'Americas',VC:'Americas',SX:'Americas',SR:'Americas',TT:'Americas',
  TC:'Americas',US:'Americas',UY:'Americas',VE:'Americas',VI:'Americas',
}

export function countryToContinent(countryCode) {
  return CONTINENT_MAP[countryCode] ?? 'Unknown'
}

export function uniqueContinents(destinations) {
  return [...new Set(uniqueCountries(destinations).map(countryToContinent))].sort()
}

export function yearNightsAway(trips, year) {
  let total = 0, vacation = 0, business = 0
  for (const trip of trips || []) {
    for (const d of trip.destinations || []) {
      if (new Date(d.arrival).getFullYear() !== year) continue
      const nights = differenceInDays(startOfDay(new Date(d.departure)), startOfDay(new Date(d.arrival)))
      if (nights <= 0) continue
      total += nights
      if (d.type === 'vacation') vacation += nights
      else business += nights
    }
  }
  return { total, vacation, business }
}

export function yearGeographicStats(trips, year) {
  const allDests = (trips || []).flatMap((t) =>
    (t.destinations || []).filter((d) => new Date(d.arrival).getFullYear() === year)
  )
  const tripsWithYear = (trips || []).filter((t) =>
    (t.destinations || []).some((d) => new Date(d.arrival).getFullYear() === year)
  )
  const countryCodes = uniqueCountries(allDests)
  const continents = uniqueContinents(allDests)
  const { total, vacation, business } = yearNightsAway(trips, year)
  return {
    countryCodes,
    countries: countryCodes.map((cc) => allDests.find((d) => d.countryCode === cc)?.country ?? cc),
    continents,
    nightsAway: total,
    vacationNights: vacation,
    businessNights: business,
    destinationCount: allDests.length,
    tripCount: tripsWithYear.length,
  }
}

export function getAvailableYears(trips) {
  const years = new Set()
  for (const trip of trips || []) {
    for (const d of trip.destinations || []) {
      const y = new Date(d.arrival).getFullYear()
      if (!isNaN(y)) years.add(y)
    }
  }
  return years.size > 0 ? [...years].sort((a, b) => b - a) : [new Date().getFullYear()]
}

// ── Fun comparisons ───────────────────────────────────────────────────────────

export const REFERENCE_DISTANCES = {
  GREAT_BARRIER_REEF:  { km: 2_300,   label: 'Great Barrier Reef',          emoji: '🪸' },
  SILK_ROAD:           { km: 6_400,   label: 'ancient Silk Road',           emoji: '🐪' },
  AMAZON_RIVER:        { km: 6_992,   label: 'Amazon River',                emoji: '🌿' },
  TRANS_SIBERIAN:      { km: 9_289,   label: 'Trans-Siberian Railway',      emoji: '🚂' },
  NYC_TO_LA:           { km: 4_486,   label: 'New York to Los Angeles',     emoji: '🗽' },
  SAHARA_DESERT:       { km: 4_800,   label: 'width of the Sahara Desert',  emoji: '🏜' },
  GREAT_WALL:          { km: 21_196,  label: 'Great Wall of China',         emoji: '🏯' },
  ROMAN_ROAD_NETWORK:  { km: 80_000,  label: 'Roman road network',          emoji: '🏛' },
  EARTH_CIRCUMFERENCE: { km: 40_075,  label: 'Earth circumference',         emoji: '🌍' },
  PACIFIC_OCEAN:       { km: 12_300,  label: 'Pacific Ocean (widest)',      emoji: '🌊' },
  MOON_DISTANCE:       { km: 384_400, label: 'Earth to the Moon',           emoji: '🌕' },
}

export function getFunComparisons(km) {
  if (!km || km <= 0) return []
  return Object.entries(REFERENCE_DISTANCES)
    .map(([key, ref]) => {
      const ratio = km / ref.km
      const rounded = Math.round(ratio * 100) / 100
      let text
      if (key === 'EARTH_CIRCUMFERENCE') {
        text = ratio >= 1
          ? `You could have circled the Earth ${rounded}× times`
          : `You've covered ${Math.round(ratio * 100)}% of Earth's circumference`
      } else if (key === 'MOON_DISTANCE') {
        text = `You're ${Math.round(ratio * 100)}% of the way to the Moon`
      } else if (ratio >= 1) {
        text = `You've traveled ${rounded}× the ${ref.label}`
      } else {
        text = `You've covered ${Math.round(ratio * 100)}% of the ${ref.label}`
      }
      return { key, label: ref.label, emoji: ref.emoji, ratio: rounded, text }
    })
    .filter((c) => c.ratio >= 0.05 && c.ratio <= 999)
    .sort((a, b) => Math.abs(a.ratio - 1) - Math.abs(b.ratio - 1))
}

// ── Achievement badges ────────────────────────────────────────────────────────

const BADGE_DEFS = [
  { id: 'first_flight',      label: 'Jet-setter Begins',  emoji: '✈',  description: 'First destination added',              tier: 'bronze', test: (s) => s.destinationCount >= 1 },
  { id: 'globetrotter_10k',  label: '10K Club',           emoji: '🚀', description: '10,000 km traveled in a year',         tier: 'bronze', test: (s) => s.km >= 10_000 },
  { id: 'night_owl_30',      label: 'Month Away',         emoji: '🌙', description: '30 nights away in a year',             tier: 'bronze', test: (s) => s.nightsAway >= 30 },
  { id: 'multi_continent',   label: 'Continental Drift',  emoji: '🗺',  description: 'Visited 2+ continents in a year',      tier: 'bronze', test: (s) => s.continents.length >= 2 },
  { id: 'five_countries',    label: 'Five Flags',         emoji: '🎌', description: '5 countries visited in a year',        tier: 'silver', test: (s) => s.countryCodes.length >= 5 },
  { id: 'globetrotter_50k',  label: '50K Voyager',        emoji: '🌐', description: '50,000 km traveled in a year',         tier: 'silver', test: (s) => s.km >= 50_000 },
  { id: 'night_owl_90',      label: 'Quarter Nomad',      emoji: '🎒', description: '90 nights away in a year',             tier: 'silver', test: (s) => s.nightsAway >= 90 },
  { id: 'ten_countries',     label: 'Ten Flags',          emoji: '🏆', description: '10 countries visited in a year',       tier: 'gold',   test: (s) => s.countryCodes.length >= 10 },
  { id: 'globetrotter_100k', label: 'Century Traveler',   emoji: '👑', description: '100,000 km traveled in a year',        tier: 'gold',   test: (s) => s.km >= 100_000 },
]

export function getAchievementBadges(stats) {
  return BADGE_DEFS.map(({ test, ...def }) => ({ ...def, earned: test(stats) }))
}

// ── Travel personality ────────────────────────────────────────────────────────

export function getTravelPersonality(geo, distResult) {
  const { nightsAway, vacationNights, businessNights, destinationCount, countryCodes } = geo
  const { km } = distResult
  if (!destinationCount) return null
  const businessRatio = nightsAway > 0 ? businessNights / nightsAway : 0
  const avgStay = destinationCount > 0 ? nightsAway / destinationCount : 0
  if (businessRatio > 0.6 && km > 5_000)
    return { type: 'business_jet_setter', label: 'Business Jet-Setter', emoji: '💼', description: 'Your passport is basically a work permit.' }
  if (countryCodes.length >= 5 && avgStay < 5)
    return { type: 'culture_hopper', label: 'Culture Hopper', emoji: '🎭', description: 'You collect countries like souvenirs.' }
  if (nightsAway >= 60 && avgStay > 10)
    return { type: 'nomad', label: 'Nomad', emoji: '🏕', description: 'Home is wherever you unpack.' }
  if (destinationCount >= 6 && nightsAway < 30)
    return { type: 'weekend_escaper', label: 'Weekend Escaper', emoji: '⚡', description: 'Maximum destinations, minimum days off.' }
  if (km > 30_000)
    return { type: 'long_hauler', label: 'Long-Hauler', emoji: '🌏', description: 'You eat time zones for breakfast.' }
  return { type: 'explorer', label: 'Explorer', emoji: '🧭', description: 'Every trip is an adventure in the making.' }
}

// ── Year-over-year ────────────────────────────────────────────────────────────

export function multiYearKm(trips, years) {
  return years.map((year) => ({ year, ...yearDistanceKm(trips, year) }))
}

// ── Top cities / countries ────────────────────────────────────────────────────

export function topCities(trips, limit = 5) {
  const map = {}
  for (const trip of trips || []) {
    for (const d of trip.destinations || []) {
      const key = `${d.city}|${d.countryCode}`
      if (!map[key]) map[key] = { city: d.city, countryCode: d.countryCode, country: d.country, visits: 0, nights: 0 }
      map[key].visits++
      map[key].nights += Math.max(0, differenceInDays(startOfDay(new Date(d.departure)), startOfDay(new Date(d.arrival))))
    }
  }
  return Object.values(map).sort((a, b) => b.visits - a.visits || b.nights - a.nights).slice(0, limit)
}

export function topCountries(trips, limit = 5) {
  const map = {}
  for (const trip of trips || []) {
    for (const d of trip.destinations || []) {
      const key = d.countryCode
      if (!key) continue
      if (!map[key]) map[key] = { countryCode: key, country: d.country, visits: 0, nights: 0 }
      map[key].visits++
      map[key].nights += Math.max(0, differenceInDays(startOfDay(new Date(d.departure)), startOfDay(new Date(d.arrival))))
    }
  }
  return Object.values(map).sort((a, b) => b.visits - a.visits || b.nights - a.nights).slice(0, limit)
}
