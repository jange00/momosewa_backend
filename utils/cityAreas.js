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
    'Ekantakuna',
    'Dhapakhel',
    'Godavari',
    'Chapagaun',
    'Thecho',
    'Bungamati',
    'Karyabinayak',
    'Lamatar',
    'Lubhu',
    'Pyangaon',
  ],
  Kritipur: [
    'Kritipur Bazar',
    'Panga',
    'Chobar',
    'Kirtipur Chowk',
    'Chilancho',
    'Naga Bahal',
    'Pachali',
    'Bagdol',
    'Gongabu',
    'Macchegaun',
    'Teku',
    'Dakshinkali',
    'Pharping',
    'Chandragiri',
  ],
};

export const getAreasByCity = (city) => {
  if (!city) return [];
  return CITY_AREAS[city] || [];
};

export const getAllCities = () => {
  return Object.keys(CITY_AREAS);
};

export const isValidAreaForCity = (city, area) => {
  const areas = getAreasByCity(city);
  return areas.some(a => a.toLowerCase() === area.toLowerCase());
};














