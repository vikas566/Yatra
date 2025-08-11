// Simple translation service without external dependencies for now
class TranslationService {
  constructor() {
    this.currentLanguage = localStorage.getItem('preferredLanguage') || 'en'
    this.translations = {
      'en': {
        'Home': 'Home',
        'Create Itinerary': 'Create Itinerary',
        'Local Guides': 'Local Guides',
        'Cultural Tips': 'Cultural Tips',
        'Sign In': 'Sign In',
        'Sign Up': 'Sign Up',
        'Profile': 'Profile',
        'Logout': 'Logout'
      },
      'hi': {
        'Home': 'होम',
        'Create Itinerary': 'यात्रा योजना बनाएं',
        'Local Guides': 'स्थानीय गाइड',
        'Cultural Tips': 'सांस्कृतिक टिप्स',
        'Sign In': 'साइन इन',
        'Sign Up': 'साइन अप',
        'Profile': 'प्रोफ़ाइल',
        'Logout': 'लॉग आउट'
      },
      'bn': {
        'Home': 'হোম',
        'Create Itinerary': 'ভ্রমণসূচি তৈরি করুন',
        'Local Guides': 'স্থানীয় গাইড',
        'Cultural Tips': 'সাংস্কৃতিক টিপস',
        'Sign In': 'সাইন ইন',
        'Sign Up': 'সাইন আপ',
        'Profile': 'প্রোফাইল',
        'Logout': 'লগ আউট'
      },
      'ta': {
        'Home': 'முகப்பு',
        'Create Itinerary': 'பயண திட்டம் உருவாக்கு',
        'Local Guides': 'உள்ளூர் வழிகாட்டிகள்',
        'Cultural Tips': 'கலாச்சார குறிப்புகள்',
        'Sign In': 'உள்நுழைக',
        'Sign Up': 'பதிவு செய்க',
        'Profile': 'சுயவிவரம்',
        'Logout': 'வெளியேறு'
      }
    }
  }

  async initialize() {
    return true
  }

  async translate(text, fromLang, toLang) {
    try {
      // If translation exists in our dictionary
      if (this.translations[toLang] && this.translations[toLang][text]) {
        return this.translations[toLang][text]
      }
      // Return original text if no translation found
      return text
    } catch (error) {
      console.error('Translation failed:', error)
      return text
    }
  }

  setLanguage(langCode) {
    this.currentLanguage = langCode
    localStorage.setItem('preferredLanguage', langCode)
    return true
  }

  getCurrentLanguage() {
    return this.currentLanguage
  }

  getSupportedLanguages() {
    return {
      'en': { name: 'English', native: 'English' },
      'hi': { name: 'Hindi', native: 'हिंदी' },
      'bn': { name: 'Bengali', native: 'বাংলা' },
      'ta': { name: 'Tamil', native: 'தமிழ்' }
    }
  }
}

export const translationService = new TranslationService() 