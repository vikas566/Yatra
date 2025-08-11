// Indian states and their districts data with coordinates
const indianLocations = {
  'Uttar Pradesh': {
    'Agra': { lat: 27.1767, lng: 78.0081 },
    'Varanasi': { lat: 25.3176, lng: 82.9739 },
    'Lucknow': { lat: 26.8467, lng: 80.9462 },
    'Mathura': { lat: 27.4924, lng: 77.6737 },
    'Ayodhya': { lat: 26.7922, lng: 82.1998 }
  },
  'Rajasthan': {
    'Jaipur': { lat: 26.9124, lng: 75.7873 },
    'Udaipur': { lat: 24.5854, lng: 73.7125 },
    'Jodhpur': { lat: 26.2389, lng: 73.0243 },
    'Pushkar': { lat: 26.4899, lng: 74.5346 },
    'Jaisalmer': { lat: 26.9157, lng: 70.9083 }
  },
  'Delhi': {
    'Central Delhi': { lat: 28.6289, lng: 77.2065 },
    'New Delhi': { lat: 28.6139, lng: 77.2090 },
    'North Delhi': { lat: 28.7041, lng: 77.1025 },
    'South Delhi': { lat: 28.5244, lng: 77.1855 },
    'East Delhi': { lat: 28.6279, lng: 77.2952 }
  },
  'Maharashtra': {
    'Mumbai': { lat: 19.0760, lng: 72.8777 },
    'Pune': { lat: 18.5204, lng: 73.8567 },
    'Aurangabad': { lat: 19.8762, lng: 75.3433 },
    'Nashik': { lat: 19.9975, lng: 73.7898 },
    'Nagpur': { lat: 21.1458, lng: 79.0882 }
  },
  'Goa': {
    'North Goa': { lat: 15.4909, lng: 73.8278 },
    'South Goa': { lat: 15.1147, lng: 74.1346 }
  },
  'Kerala': {
    'Thiruvananthapuram': { lat: 8.5241, lng: 76.9366 },
    'Kochi': { lat: 9.9312, lng: 76.2673 },
    'Kozhikode': { lat: 11.2588, lng: 75.7804 },
    'Munnar': { lat: 10.0889, lng: 77.0595 },
    'Alleppey': { lat: 9.4981, lng: 76.3388 }
  },
  'Punjab': {
    'Amritsar': { lat: 31.6340, lng: 74.8723 },
    'Ludhiana': { lat: 30.9010, lng: 75.8573 },
    'Jalandhar': { lat: 31.3260, lng: 75.5762 },
    'Patiala': { lat: 30.3398, lng: 76.3869 },
    'Chandigarh': { lat: 30.7333, lng: 76.7794 }
  },
  'Uttarakhand': {
    'Rishikesh': { lat: 30.0869, lng: 78.2676 },
    'Haridwar': { lat: 29.9457, lng: 78.1642 },
    'Dehradun': { lat: 30.3165, lng: 78.0322 },
    'Nainital': { lat: 29.3919, lng: 79.4542 },
    'Mussoorie': { lat: 30.4598, lng: 78.0644 }
  },
  'Tamil Nadu': {
    'Chennai': { lat: 13.0827, lng: 80.2707 },
    'Madurai': { lat: 9.9252, lng: 78.1198 },
    'Thanjavur': { lat: 10.7870, lng: 79.1378 },
    'Mahabalipuram': { lat: 12.6269, lng: 80.1927 },
    'Ooty': { lat: 11.4102, lng: 76.6950 }
  },
  'West Bengal': {
    'Kolkata': { lat: 22.5726, lng: 88.3639 },
    'Darjeeling': { lat: 27.0410, lng: 88.2663 },
    'Siliguri': { lat: 26.7271, lng: 88.3953 },
    'Kalimpong': { lat: 27.0660, lng: 88.4740 },
    'Sundarbans': { lat: 21.9497, lng: 88.8775 }
  },
  'Gujarat': {
    'Ahmedabad': { lat: 23.0225, lng: 72.5714 },
    'Vadodara': { lat: 22.3072, lng: 73.1812 },
    'Surat': { lat: 21.1702, lng: 72.8311 },
    'Rajkot': { lat: 22.3039, lng: 70.8022 },
    'Gandhinagar': { lat: 23.2156, lng: 72.6369 },
    'Dwarka': { lat: 22.2442, lng: 68.9685 },
    'Somnath': { lat: 20.9069, lng: 70.3844 },
    'Kutch': { lat: 23.7337, lng: 69.8597 },
    'Porbandar': { lat: 21.6417, lng: 69.6293 },
    'Junagadh': { lat: 21.5222, lng: 70.4579 }
  },
  'Madhya Pradesh': {
    'Bhopal': { lat: 23.2599, lng: 77.4126 },
    'Indore': { lat: 22.7196, lng: 75.8577 },
    'Ujjain': { lat: 23.1765, lng: 75.7885 },
    'Gwalior': { lat: 26.2183, lng: 78.1828 },
    'Khajuraho': { lat: 24.8318, lng: 79.9199 },
    'Orchha': { lat: 25.3518, lng: 78.6412 },
    'Sanchi': { lat: 23.4829, lng: 77.7380 },
    'Jabalpur': { lat: 23.1815, lng: 79.9864 },
    'Pachmarhi': { lat: 22.4675, lng: 78.4345 },
    'Mandu': { lat: 22.3335, lng: 75.3845 }
  }
};

class LocationService {
  getStates() {
    return Object.keys(indianLocations);
  }

  getDistricts(state) {
    return Object.keys(indianLocations[state] || {});
  }

  getCoordinates(state, district) {
    return indianLocations[state]?.[district] || null;
  }

  getAllLocations() {
    const locations = [];
    for (const state in indianLocations) {
      for (const district in indianLocations[state]) {
        locations.push({
          name: district,
          state: state,
          coordinates: indianLocations[state][district]
        });
      }
    }
    return locations;
  }
}

export const locationService = new LocationService(); 