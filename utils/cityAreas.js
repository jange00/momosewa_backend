/**
 * City to Areas mapping for address filtering
 * Areas are specific to each city
 */
export const CITY_AREAS = {
  Kathmandu: [
    'Thamel',
    'Durbar Marg',
    'Lazimpat',
    'Boudha',
    'Patan',
    'New Road',
    'Asan',
    'Kalimati',
    'Kalanki',
    'Kalimati',
    'Budhanilkantha',
    'Tokha',
    'Koteshwor',
    'Baneshwor',
    'Maitighar',
    'Putalisadak',
    'Ratnapark',
    'Basundhara',
    'Buddhanagar',
    'Kumaripati',
    'Pulchowk',
    'Jawalakhel',
    'Satungal',
    'Swayambhu',
    'Gongabu',
    'Balaju',
    'Sanepa',
    'Kapan',
    'Buddhanilkantha',
    'Jorpati',
    'Chabahil',
    'Sinamangal',
    'Tinkune',
    'Airport Area',
    'Lainchaur',
    'Thahiti',
    'Teku',
    'Tripureshwor',
    'Balkumari',
    'Koteshwor',
    'Minbhawan',
    'Shankhamul',
    'Thimi',
    'Imadol',
    'Balkumari',
  ],
  Bhaktapur: [
    'Durbar Square',
    'Taumadhi',
    'Dattatreya',
    'Suryamadhi',
    'Kamal Vinayak',
    'Nagarkot',
    'Changunarayan',
    'Thimi',
    'Sankhu',
    'Madhyapur Thimi',
    'Suryabinayak',
    'Nala',
    'Tathali',
    'Duwakot',
    'Gathaghar',
    'Balkumari',
    'Lokanthali',
    'Jagati',
    'Dadhikot',
    'Nangkhel',
  ],
  Lalitpur: [
    'Patan Durbar Square',
    'Kumaripati',
    'Pulchowk',
    'Jawalakhel',
    'Lagankhel',
    'Satdobato',
    'Gwarko',
    'Kupondole',
    'Balkumari',
    'Nakhipot',
    'Imadol',
    'Harisiddhi',
    'Thaiba',
    'Bhaisepati',
    'Harihar Bhawan',
    'Mangal Bazaar',
    'Patan Dhoka',
    'Sanepa',
    'Chyasal',
    'Tikabhairab',
    'Balkumari',
    'Ekantakuna',
    'Balkumari',
    'Dhapakhel',
    'Balkumari',
    'Godavari',
    'Chapagaun',
    'Thecho',
    'Bungamati',
    'Karyabinayak',
    'Lamatar',
    'Lubhu',
    'Balkumari',
    'Pyangaon',
  ],
  Kritipur: [
    'Kritipur Bazar',
    'Panga',
    'Balkumari',
    'Chobar',
    'Kirtipur Chowk',
    'Chilancho',
    'Naga Bahal',
    'Pachali',
    'Balkumari',
    'Bagdol',
    'Gongabu',
    'Balkumari',
    'Macchegaun',
    'Teku',
    'Balkumari',
    'Dakshinkali',
    'Pharping',
    'Chandragiri',
    'Balkumari',
  ],
};

/**
 * Get areas for a specific city
 * @param {string} city - City name
 * @returns {string[]} Array of area names
 */
export const getAreasByCity = (city) => {
  if (!city) return [];
  return CITY_AREAS[city] || [];
};

/**
 * Get all cities
 * @returns {string[]} Array of city names
 */
export const getAllCities = () => {
  return Object.keys(CITY_AREAS);
};

/**
 * Check if area exists in city
 * @param {string} city - City name
 * @param {string} area - Area name
 * @returns {boolean}
 */
export const isValidAreaForCity = (city, area) => {
  const areas = getAreasByCity(city);
  return areas.some(a => a.toLowerCase() === area.toLowerCase());
};

