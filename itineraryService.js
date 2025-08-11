import axios from 'axios';

class ItineraryService {
  constructor() {
    this.openRouterApiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    this.apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  }

  async generateItinerary(preferences) {
    try {
      const { state, destination, selectedInterests, duration, language, travelStyle } = preferences;
      
      // Format interests for the prompt
      const interests = this.formatInterests(selectedInterests);
      
      // Build the prompt for the AI
      const prompt = this.buildItineraryPrompt(state, destination, interests, duration, language, travelStyle);
      
      // Call the OpenRouter API
      const model = import.meta.env.VITE_OPENROUTER_MODEL || 'deepseek/deepseek-r1-distill-llama-70b:free';
      
      if (!this.openRouterApiKey) {
        console.error('OpenRouter API key is missing');
        return this.createFallbackItinerary(duration, destination);
      }
      
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.openRouterApiKey}`,
          'HTTP-Referer': window.location.href,
          'X-Title': 'Cultural Planner'
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { 
              role: 'system', 
              content: `You are a cultural travel expert specializing in Indian tourism and cultural experiences. 
              Create detailed, authentic, and culturally immersive travel itineraries with:
              1. Specific timings and durations for each activity
              2. Exact locations with addresses
              3. Cultural and historical context
              4. Practical information (costs, bookings, dress code)
              5. Local insights and tips
              6. Weather alternatives
              
              Format each activity exactly as:
              [Time] Activity Name | Location
              Description: (activity details)
              Cultural Context: (historical/cultural significance)
              Practical Info:
              - Duration: X hours
              - Cost: ₹XXX
              - Booking: (requirements)
              - Dress Code: (requirements)
              - Photography: (rules)
              - Transport: (how to reach)
              Tips: (special advice)
              Weather Alternative: (backup plan)`
            },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7,
          max_tokens: 4000
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('OpenRouter API error:', errorData);
        return this.createFallbackItinerary(duration, destination);
      }
      
      const data = await response.json();
      
      // Check if the response has the expected structure
      if (!data || !data.choices || !Array.isArray(data.choices) || data.choices.length === 0 || !data.choices[0].message?.content) {
        console.error('Invalid API response structure:', data);
        return this.createFallbackItinerary(duration, destination);
      }
      
      const itineraryText = data.choices[0].message.content;
      
      // Parse and format the response
      return this.parseItineraryResponse(itineraryText, duration, destination);
      
    } catch (error) {
      console.error('Error generating itinerary:', error);
      return this.createFallbackItinerary(duration, destination);
    }
  }

  buildItineraryPrompt(state, destination, interests, duration, language, travelStyle) {
    const travelStyleGuide = {
      'relaxed': 'Focus on leisurely paced activities, ample rest time, and easily accessible locations. Include longer breaks between activities.',
      'balanced': 'Mix of active and relaxed experiences, moderate walking distances, and well-timed breaks.',
      'intensive': 'Pack more activities per day, include early morning starts, and cover more ground. Minimize downtime.'
    };

    const styleGuidance = travelStyleGuide[travelStyle] || travelStyleGuide['balanced'];

    return `Create a detailed ${duration}-day cultural journey in ${destination}, ${state}, India, focusing on authentic experiences and specific locations. The itinerary should be in ${language} and follow a ${travelStyle} pace (${styleGuidance}).

Key Requirements:
1. Focus specifically on these cultural interests: ${interests}
2. Ensure activities match the ${travelStyle} travel style
3. Include both iconic sites and hidden local experiences
4. Consider local festivals and events during the visit
5. Provide language support in ${language}

Structure each day following this exact format:

Early Morning (6:00 AM - 8:00 AM):
- Spiritual or cultural morning activities
- Specific temple names or locations
- Photography opportunities

Morning (9:00 AM - 12:00 PM):
- Main cultural activities and sightseeing
- Workshop or interactive experiences
- Local guide recommendations

Afternoon (2:00 PM - 5:00 PM):
- Cultural demonstrations or hands-on activities
- Art/craft workshops or cultural sites
- Indoor alternatives for weather issues

Evening (5:00 PM - 8:00 PM):
- Cultural performances or ceremonies
- Sunset viewing points
- Local community interactions

For EACH activity, provide:
1. Exact timing and duration
2. Specific venue name and address
3. Cultural significance and history
4. Cost estimates in Indian Rupees
5. Booking requirements if any
6. Dress code and cultural etiquette
7. Photography guidelines
8. Transportation options
9. Weather alternatives
10. Local tips and insights

Important Considerations:
1. Account for travel time between locations
2. Include meal times at authentic local venues
3. Add rest breaks appropriate for ${travelStyle} style
4. Note prayer times and religious customs
5. Suggest photo opportunities
6. Include backup plans for weather
7. Add shopping recommendations for local crafts
8. Consider accessibility needs
9. Include local emergency contacts
10. Suggest cultural do's and don'ts

Please maintain consistent formatting throughout the itinerary, using the exact structure provided in the system message.`;
  }

  parseItineraryResponse(responseText, duration, destination) {
    try {
      const itinerary = [];
      
      if (!responseText || typeof responseText !== 'string') {
        console.error('Invalid response text:', responseText);
        return this.createFallbackItinerary(duration, destination);
      }

      // Split by day markers
      let days = [];
      // First try to split by "Day X:" pattern
      const dayPattern = /Day\s+(\d+):/gi;
      const dayMatches = [...responseText.matchAll(dayPattern)];
      
      if (dayMatches.length > 0) {
        for (let i = 0; i < dayMatches.length; i++) {
          const currentMatch = dayMatches[i];
          const nextMatch = dayMatches[i + 1];
          const dayNumber = parseInt(currentMatch[1]);
          
          if (dayNumber > 0 && dayNumber <= duration) {
            const startIndex = currentMatch.index + currentMatch[0].length;
            const endIndex = nextMatch ? nextMatch.index : responseText.length;
            const dayContent = responseText.substring(startIndex, endIndex).trim();
            
            if (dayContent) {
              days.push({
                dayNumber: dayNumber,
                content: dayContent
              });
            }
          }
        }
      }
      
      // If no days found with the pattern, try to split evenly
      if (days.length === 0) {
        console.warn('No day markers found, attempting to split content evenly');
        const splitContent = responseText.split(/\n\s*\n+/g)
          .filter(section => section.trim().length > 0);
        
        // Try to distribute content evenly among the expected number of days
        const sectionsPerDay = Math.max(1, Math.ceil(splitContent.length / duration));
        for (let i = 0; i < duration; i++) {
          const startIdx = i * sectionsPerDay;
          const endIdx = Math.min(startIdx + sectionsPerDay, splitContent.length);
          if (startIdx < splitContent.length) {
            const dayContent = splitContent.slice(startIdx, endIdx).join('\n\n');
            days.push({
              dayNumber: i + 1,
              content: dayContent
            });
          }
        }
      }
      
      // Ensure we have the correct number of days
      if (days.length < duration) {
        console.warn(`Only found ${days.length} days, but ${duration} were requested. Adding empty days.`);
        for (let i = days.length + 1; i <= duration; i++) {
          days.push({
            dayNumber: i,
            content: `Explore ${destination} at your own pace.`
          });
        }
      } else if (days.length > duration) {
        console.warn(`Found ${days.length} days, but only ${duration} were requested. Truncating.`);
        days = days.slice(0, duration);
      }
      
      // Sort days by dayNumber to ensure correct order
      days.sort((a, b) => a.dayNumber - b.dayNumber);
      
      // Process each day's content
      days.forEach(day => {
        const timeSlots = [];
        
        // Extract time slots using regex - fixed pattern with improved time capture
        const timeSlotPattern = /\[([\d:]+(?:\s*(?:AM|PM))?)\]\s*([^|]+)\|\s*([^\n]+)(?:\n([\s\S]*?)(?=\[[\d:]+(?:\s*(?:AM|PM))?\]|$))?/gm;
        const matches = [...day.content.matchAll(timeSlotPattern)];
        
        if (matches.length === 0) {
          // No time slots found, create default activities
          console.warn(`No valid time slots found for day ${day.dayNumber}, creating default activities`);
          timeSlots.push(this.createDefaultActivity(day.dayNumber, '09:00 AM', destination));
          timeSlots.push(this.createDefaultActivity(day.dayNumber, '12:00 PM', destination));
          timeSlots.push(this.createDefaultActivity(day.dayNumber, '03:00 PM', destination));
          timeSlots.push(this.createDefaultActivity(day.dayNumber, '07:00 PM', destination));
        } else {
          for (const match of matches) {
            const [_, time, title, location, details] = match;
            
            // Parse activity details with improved extraction
            let description = '';
            let culturalContext = '';
            let practicalInfo = {
              duration: '',
              cost: '',
              booking: '',
              dressCode: '',
              photography: '',
              transport: ''
            };
            let tips = '';
            let weatherAlternative = '';
            
            if (details) {
              // Clean up details by removing excessive whitespace
              const cleanDetails = details.replace(/\n+/g, '\n').trim();
              
              // Extract sections using improved patterns
              description = this.extractSection(cleanDetails, 'Description:', 'Cultural Context:') ||
                           this.extractSection(cleanDetails, 'Description:', 'Practical Info:') || '';
              
              culturalContext = this.extractSection(cleanDetails, 'Cultural Context:', 'Practical Info:') || 
                               this.extractSection(cleanDetails, 'Cultural Context:', 'Tips:') || '';
              
              // Extract practical info
              const practicalInfoSection = this.extractSection(cleanDetails, 'Practical Info:', 'Tips:') || 
                                          this.extractSection(cleanDetails, 'Practical Info:', 'Weather Alternative:') || '';
              
              if (practicalInfoSection) {
                practicalInfo.duration = this.extractBulletPoint(practicalInfoSection, 'Duration:') || '';
                practicalInfo.cost = this.extractBulletPoint(practicalInfoSection, 'Cost:') || '';
                practicalInfo.booking = this.extractBulletPoint(practicalInfoSection, 'Booking:') || '';
                practicalInfo.dressCode = this.extractBulletPoint(practicalInfoSection, 'Dress Code:') || '';
                practicalInfo.photography = this.extractBulletPoint(practicalInfoSection, 'Photography:') || '';
                practicalInfo.transport = this.extractBulletPoint(practicalInfoSection, 'Transport:') || '';
              }
              
              tips = this.extractSection(cleanDetails, 'Tips:', 'Weather Alternative:') || 
                    this.extractSection(cleanDetails, 'Tips:', null) || '';
              
              weatherAlternative = this.extractSection(cleanDetails, 'Weather Alternative:', null) || '';
            }
            
            timeSlots.push({
              time: this.formatTimeIndicator(time),
              title: title.trim(),
              location: location.trim(),
              description: description.trim(),
              culturalContext: culturalContext.trim(),
              practicalInfo,
              tips: tips.trim(),
              weatherAlternative: weatherAlternative.trim()
            });
          }
        }
        
        // Sort time slots by time
        timeSlots.sort((a, b) => {
          const timeA = this.parseTime(a.time);
          const timeB = this.parseTime(b.time);
          return timeA - timeB;
        });
        
        // Ensure time slots don't overlap by adjusting display format
        for (let i = 0; i < timeSlots.length; i++) {
          // Ensure time is in consistent format with leading zeros
          timeSlots[i].time = this.formatTimeWithLeadingZeros(timeSlots[i].time);
          
          // Add a displayTime property that includes the activity number
          timeSlots[i].displayTime = `${timeSlots[i].time}`;
        }
        
        itinerary.push({
          day: day.dayNumber,
          timeSlots
        });
      });
      
      // Ensure days are in sequential order
      itinerary.sort((a, b) => a.day - b.day);
      
      return itinerary;
      
    } catch (error) {
      console.error('Error parsing itinerary response:', error);
      return this.createFallbackItinerary(duration, destination);
    }
  }
  
  // Helper methods for extracting sections
  extractSection(text, startMarker, endMarker) {
    if (!text || !startMarker) return '';
    
    const startIndex = text.indexOf(startMarker);
    if (startIndex === -1) return '';
    
    const contentStart = startIndex + startMarker.length;
    
    let contentEnd;
    if (endMarker) {
      contentEnd = text.indexOf(endMarker, contentStart);
      if (contentEnd === -1) contentEnd = text.length;
    } else {
      contentEnd = text.length;
    }
    
    return text.substring(contentStart, contentEnd).trim();
  }
  
  extractBulletPoint(text, marker) {
    const pattern = new RegExp(`${marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*([^\\n]+)`, 'i');
    const match = text.match(pattern);
    return match ? match[1].replace(/^[-•]\s*/, '').trim() : '';
  }
  
  createDefaultActivity(dayNumber, time, destination) {
    const activities = [
      {
        title: 'Cultural Heritage Walk',
        description: `Explore the historical streets and landmarks of ${destination}`,
        culturalContext: 'Learn about the local history and architectural influences',
        tips: 'Wear comfortable walking shoes and carry water',
        weatherAlternative: 'Visit the local history museum'
      },
      {
        title: 'Local Cuisine Experience',
        description: `Sample authentic ${destination} flavors at a traditional restaurant`,
        culturalContext: 'Discover the culinary heritage and spice traditions',
        tips: 'Ask locals for their favorite dishes and specialties',
        weatherAlternative: 'Take a cooking class at an indoor venue'
      },
      {
        title: 'Artisan Workshop Visit',
        description: `Observe local craftspeople creating traditional ${destination} handicrafts`,
        culturalContext: 'Understand the artistic techniques passed down through generations',
        tips: 'Support local artisans by purchasing directly from them',
        weatherAlternative: 'Visit an indoor craft exhibition or gallery'
      },
      {
        title: 'Evening Cultural Performance',
        description: 'Enjoy traditional music, dance, or theatrical performance',
        culturalContext: 'Experience the performing arts traditions of the region',
        tips: 'Arrive early for the best seating',
        weatherAlternative: 'Indoor theater or cultural center performance'
      }
    ];
    
    const index = (parseInt(time) + dayNumber) % activities.length;
    const activity = activities[index];
    
    return {
      time,
      displayTime: time,
      title: activity.title,
      location: `${destination} ${activity.title.includes('Walk') ? 'Old Town' : 'Cultural Center'}`,
      description: activity.description,
      culturalContext: activity.culturalContext,
      practicalInfo: {
        duration: '2-3 hours',
        cost: '₹500-1000 per person',
        booking: 'No reservation required',
        dressCode: 'Casual, respectful attire',
        photography: 'Permitted in most areas',
        transport: 'Available by auto-rickshaw or taxi'
      },
      tips: activity.tips,
      weatherAlternative: activity.weatherAlternative
    };
  }

  parseTime(timeStr) {
    const [time, period] = timeStr.split(/\s+/);
    const [hours, minutes] = time.split(':').map(Number);
    let totalMinutes = hours * 60 + minutes;
    
    if (period?.toUpperCase() === 'PM' && hours !== 12) {
      totalMinutes += 12 * 60;
    } else if (period?.toUpperCase() === 'AM' && hours === 12) {
      totalMinutes -= 12 * 60;
    }
    
    return totalMinutes;
  }

  formatTimeIndicator(time) {
    // Ensure consistent time format (e.g., "09:00 AM")
    const timeMatch = time.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (!timeMatch) return time;
    
    let [_, hours, minutes, period] = timeMatch;
    hours = parseInt(hours);
    
    if (!period) {
      period = hours >= 12 ? 'PM' : 'AM';
      if (hours > 12) hours -= 12;
    }
    
    return `${hours.toString().padStart(2, '0')}:${minutes.padStart(2, '0')} ${period.toUpperCase()}`;
  }

  formatTimeWithLeadingZeros(timeStr) {
    const timeMatch = timeStr.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);
    if (!timeMatch) return timeStr;
    
    const [_, hours, minutes, period] = timeMatch;
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')} ${period.toUpperCase()}`;
  }

  formatInterests(selectedInterestIds) {
    const interestMap = {
      'food': 'Culinary Arts and Local Cuisine',
      'history': 'Historical Sites and Heritage',
      'arts': 'Traditional Arts and Performances',
      'festivals': 'Cultural Festivals and Ceremonies',
      'crafts': 'Traditional Crafts and Artisans',
      'spiritual': 'Spiritual and Religious Experiences'
    };
    
    return selectedInterestIds
      .map(id => interestMap[id] || id)
      .join(', ');
  }

  createFallbackItinerary(duration, destination) {
    // Define varied activities for different days
    const defaultActivities = {
      'Agra': [
        // Day 1 - Classic Monuments
        [
          {
            time: '9:00 AM',
            title: 'Taj Mahal Sunrise Visit',
            description: 'Experience the breathtaking Taj Mahal during the magical sunrise hours. Best time for photos and peaceful exploration.',
            location: 'Taj Mahal',
            culturalContext: 'UNESCO World Heritage site, built by Emperor Shah Jahan as a testament of love.'
          },
          {
            time: '1:00 PM',
            title: 'Royal Mughlai Feast',
            description: 'Indulge in authentic Mughlai dining featuring royal recipes passed down through generations.',
            location: 'Pind Balluchi, Agra',
            culturalContext: 'Experience the royal cuisine of the Mughal era.'
          },
          {
            time: '3:00 PM',
            title: 'Agra Fort Heritage Tour',
            description: 'Explore this massive red sandstone fort complex with its palaces and audience halls.',
            location: 'Agra Fort',
            culturalContext: 'Former residence of Mughal emperors including Shah Jahan.'
          },
          {
            time: '7:00 PM',
            title: 'Mohabbat the Taj Show',
            description: 'Watch a spectacular cultural show depicting the love story behind the Taj Mahal.',
            location: 'Kalakriti Cultural Center',
            culturalContext: 'Theatrical representation of Mughal era culture and customs.'
          }
        ],
        // Day 2 - Local Culture
        [
          {
            time: '9:00 AM',
            title: 'Marble Crafts Workshop',
            description: 'Learn from local artisans about the intricate marble inlay work (pietra dura).',
            location: 'Agra Marble Workshop',
            culturalContext: 'Traditional craft techniques passed down through generations.'
          },
          {
            time: '1:00 PM',
            title: 'Street Food Tour',
            description: 'Explore Agra\'s famous street food, including petha and paratha.',
            location: 'Sadar Bazaar',
            culturalContext: 'Local culinary traditions and street food culture.'
          },
          {
            time: '3:00 PM',
            title: 'Mehtab Bagh Gardens',
            description: 'Visit the moonlight garden with perfect views of the Taj Mahal.',
            location: 'Mehtab Bagh',
            culturalContext: 'Mughal garden architecture and landscaping traditions.'
          },
          {
            time: '7:00 PM',
            title: 'Cooking Class',
            description: 'Learn to prepare traditional Mughlai dishes with a local family.',
            location: 'Local Home Kitchen',
            culturalContext: 'Home cooking traditions and family recipes.'
          }
        ],
        // Day 3 - Hidden Gems
        [
          {
            time: '9:00 AM',
            title: 'Fatehpur Sikri Tour',
            description: 'Explore the abandoned Mughal city and its architectural marvels.',
            location: 'Fatehpur Sikri',
            culturalContext: 'UNESCO site showcasing Mughal urban planning.'
          },
          {
            time: '1:00 PM',
            title: 'Village Lunch Experience',
            description: 'Enjoy a traditional lunch in a rural setting.',
            location: 'Kachhpura Village',
            culturalContext: 'Rural Indian lifestyle and agricultural traditions.'
          },
          {
            time: '3:00 PM',
            title: 'Tomb of Akbar Tour',
            description: 'Visit the magnificent tomb of Emperor Akbar the Great.',
            location: 'Sikandra',
            culturalContext: 'Mughal funerary architecture and history.'
          },
          {
            time: '7:00 PM',
            title: 'Yamuna Aarti Ceremony',
            description: 'Witness the evening prayer ceremony by the Yamuna River.',
            location: 'Yamuna Ghat',
            culturalContext: 'Hindu religious traditions and river worship.'
          }
        ]
      ],
      'default': [
        // Day 1 - Heritage
        [
          {
            time: '9:00 AM',
            title: 'Heritage Walking Tour',
            description: `Explore the cultural heritage of ${destination} with a guided walking tour.`,
            location: `${destination} Old City`,
            culturalContext: 'Historical significance and architectural heritage.'
          },
          {
            time: '1:00 PM',
            title: 'Traditional Lunch',
            description: 'Experience local flavors and culinary traditions.',
            location: `${destination} Heritage Restaurant`,
            culturalContext: 'Regional cuisine and dining customs.'
          },
          {
            time: '3:00 PM',
            title: 'Temple Visit',
            description: 'Explore ancient temples and religious sites.',
            location: `${destination} Main Temple`,
            culturalContext: 'Religious practices and architectural styles.'
          },
          {
            time: '7:00 PM',
            title: 'Cultural Performance',
            description: 'Watch traditional music and dance performances.',
            location: `${destination} Cultural Center`,
            culturalContext: 'Performing arts traditions.'
          }
        ],
        // Day 2 - Local Life
        [
          {
            time: '9:00 AM',
            title: 'Local Market Tour',
            description: 'Explore bustling local markets and bazaars.',
            location: `${destination} Market`,
            culturalContext: 'Trading traditions and local commerce.'
          },
          {
            time: '1:00 PM',
            title: 'Street Food Trail',
            description: 'Sample famous local street food specialties.',
            location: `${destination} Food Street`,
            culturalContext: 'Street food culture and culinary heritage.'
          },
          {
            time: '3:00 PM',
            title: 'Artisan Workshop',
            description: 'Meet local craftspeople and learn traditional skills.',
            location: `${destination} Craft Center`,
            culturalContext: 'Traditional crafts and artisanal skills.'
          },
          {
            time: '7:00 PM',
            title: 'Community Dinner',
            description: 'Share a meal with locals and learn about their lifestyle.',
            location: 'Local Community Center',
            culturalContext: 'Community traditions and social customs.'
          }
        ],
        // Day 3 - Nature and Spirituality
        [
          {
            time: '9:00 AM',
            title: 'Morning Meditation',
            description: 'Start the day with guided meditation or yoga.',
            location: `${destination} Spiritual Center`,
            culturalContext: 'Spiritual practices and wellness traditions.'
          },
          {
            time: '1:00 PM',
            title: 'Organic Farm Lunch',
            description: 'Visit a local organic farm and enjoy fresh cuisine.',
            location: 'Local Organic Farm',
            culturalContext: 'Agricultural traditions and sustainable practices.'
          },
          {
            time: '3:00 PM',
            title: 'Nature Walk',
            description: 'Explore local flora and natural heritage sites.',
            location: `${destination} Nature Park`,
            culturalContext: 'Environmental conservation and natural heritage.'
          },
          {
            time: '7:00 PM',
            title: 'Evening Ritual',
            description: 'Participate in traditional evening ceremonies.',
            location: `${destination} Sacred Site`,
            culturalContext: 'Religious ceremonies and rituals.'
          }
        ]
      ]
    };

    const activities = defaultActivities[destination] || defaultActivities.default;
    
    return Array.from({ length: duration }, (_, i) => ({
      day: i + 1,
      timeSlots: activities[i % activities.length].map(activity => ({
        ...activity,
        description: activity.description,
        tips: activity.tips || 'No specific tips available'
      }))
    }));
  }
}

export const itineraryService = new ItineraryService(); 