class PromptTemplates {
  static getDayPlanPrompt(data) {
    const {
      destination,
      startDate,
      endDate,
      travelStyle,
      budget,
      preferences,
      chunkIndex,
      totalChunks
    } = data;

    // Format dates in YYYY-MM-DD format
    const formatDate = (date) => {
      const d = new Date(date);
      return d.toISOString().split('T')[0];
    };

    const startDateFormatted = formatDate(startDate);
    const endDateFormatted = formatDate(endDate);
    const dailyBudget = Math.floor(Number(budget?.planned || 0) / totalChunks);
    const preferencesStr = preferences ? JSON.stringify(preferences, null, 2) : 'No specific preferences';

    return `Generate a travel itinerary for days ${chunkIndex} of ${totalChunks} in ${destination.city}, ${destination.country}.
Dates: From ${startDateFormatted} to ${endDateFormatted}
Style: ${travelStyle || 'balanced'}
Daily Budget: ${budget?.currency || 'USD'} ${dailyBudget || 100}
Preferences: ${preferencesStr}

CRITICAL FORMATTING REQUIREMENTS:
1. You MUST return a single JSON object with NO additional text, NO markdown formatting
2. The response MUST be valid JSON that can be parsed directly
3. Every activity MUST include ALL required fields with proper formatting
4. Location coordinates MUST be [longitude, latitude] array with valid numbers
5. Times MUST be in 24-hour format (HH:MM)
6. All text fields MUST be under specified length limits
7. Cost amounts MUST be numbers (not strings)
8. Dates MUST be in YYYY-MM-DD format (e.g., ${startDateFormatted})

EXACT Required JSON Structure with EXAMPLE:
{
  "dayPlans": [
    {
      "date": "${startDateFormatted}",
      "activities": [
        {
          "type": "Cultural",
          "title": "Visit Senso-ji Temple",
          "description": "Explore Tokyo's oldest Buddhist temple, known for its iconic Kaminarimon Gate",
          "startTime": "09:00",
          "endTime": "11:00",
          "cost": {
            "amount": 0,
            "currency": "${budget?.currency || 'USD'}"
          },
          "location": {
            "name": "Senso-ji Temple",
            "address": "2-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan",
            "coordinates": [139.7968, 35.7141]
          },
          "notes": "Free admission. Consider arriving early to avoid crowds"
        }
      ],
      "notes": "Start the day early to avoid crowds"
    }
  ]
}

COST STRUCTURE REQUIREMENTS:
1. "cost" object MUST contain both "amount" and "currency"
2. "amount" MUST be a number (not a string)
3. For free activities, use "amount": 0
4. For paid activities, use actual cost in ${budget?.currency || 'USD'}
5. "currency" MUST be "${budget?.currency || 'USD'}"
6. Total daily costs should not exceed ${dailyBudget || 100} ${budget?.currency || 'USD'}
7. Example cost structures:
   Free activity:
   {
     "amount": 0,
     "currency": "${budget?.currency || 'USD'}"
   }
   Paid activity:
   {
     "amount": 25,
     "currency": "${budget?.currency || 'USD'}"
   }

LOCATION STRUCTURE REQUIREMENTS:
1. Every location MUST include all three fields: name, address, and coordinates
2. Coordinates MUST be an array of exactly 2 numbers: [longitude, latitude]
3. Longitude must be between -180 and 180
4. Latitude must be between -90 and 90
5. Example location structure:
   {
     "name": "Senso-ji Temple",
     "address": "2-3-1 Asakusa, Taito City, Tokyo 111-0032, Japan",
     "coordinates": [139.7968, 35.7141]
   }

Activity Types (use one of these exactly):
- Cultural
- Local
- Relaxation
- Transport
- Dining
- Shopping
- Entertainment
- Sightseeing

Activity Guidelines:
1. Include 3-4 activities per day
2. Mix different activity types
3. Space activities with realistic timing
4. Keep total daily costs within ${dailyBudget || 100} ${budget?.currency || 'USD'}
5. Use accurate coordinates for real locations
6. Ensure activities are geographically feasible
7. Include breaks between activities for travel time
8. For free attractions, explicitly set cost amount to 0

DATE FORMAT REQUIREMENTS:
1. All dates MUST be in YYYY-MM-DD format
2. Example: ${startDateFormatted}
3. Do not use any other date format

Remember: The response MUST be a valid JSON object with NO additional text or formatting.`;
  }

  static getTipsPrompt(data) {
    const { destination, travelStyle, budget } = data;
    
    return `Generate 5-7 practical travel tips for ${destination.city}, ${destination.country}.
Consider:
- Travel style: ${travelStyle}
- Budget: ${budget.currency} ${budget.planned}

IMPORTANT:
1. Respond with ONLY a JSON array of strings
2. NO markdown, NO formatting
3. Each tip maximum 200 characters
4. Focus on practical, actionable advice

Example format:
[
  "First practical tip",
  "Second practical tip",
  "Third practical tip"
]`;
  }

  static getInsightsPrompt(destination) {
    return `Provide travel insights for ${destination.city}, ${destination.country}.

IMPORTANT:
1. Respond with ONLY a JSON object
2. NO markdown, NO formatting
3. Each section maximum 200 characters
4. Focus on current, accurate information

Required JSON structure:
{
  "bestTimeToVisit": "When to visit",
  "localCustoms": "Customs and etiquette",
  "transportation": "Getting around",
  "safety": "Safety tips",
  "localExperiences": "Must-try experiences"
}`;
  }

  static getActivitySuggestionsPrompt(preferences, location) {
    return `Suggest activities in ${location} matching these preferences: ${JSON.stringify(preferences)}.

IMPORTANT:
1. Respond with ONLY a JSON object
2. NO markdown, NO formatting
3. Keep descriptions under 200 characters
4. Include specific details

Required JSON structure:
{
  "activities": [
    {
      "name": "Activity name",
      "description": "Brief description",
      "duration": "Estimated duration",
      "cost": "Estimated cost",
      "bestTime": "Best time to do this"
    }
  ]
}`;
  }
}

module.exports = PromptTemplates; 