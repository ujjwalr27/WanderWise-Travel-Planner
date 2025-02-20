class ResponseValidator {
  constructor() {
    this.dayPlanSchema = {
      required: ['date', 'activities', 'notes'],
      properties: {
        date: { type: 'string', pattern: '\\d{4}-\\d{2}-\\d{2}' },
        activities: {
          type: 'array',
          items: {
            required: ['type', 'title', 'description', 'startTime', 'endTime', 'cost', 'location', 'notes'],
            properties: {
              type: { 
                type: 'string',
                enum: ['Cultural', 'Local', 'Relaxation', 'Transport', 'Dining', 'Shopping', 'Entertainment', 'Sightseeing']
              },
              title: { type: 'string', maxLength: 100 },
              description: { type: 'string', maxLength: 250 },
              startTime: { type: 'string', pattern: '\\d{2}:\\d{2}' },
              endTime: { type: 'string', pattern: '\\d{2}:\\d{2}' },
              cost: {
                required: ['amount', 'currency'],
                properties: {
                  amount: { type: 'number', minimum: 0 },
                  currency: { type: 'string' }
                }
              },
              location: {
                required: ['name', 'address', 'coordinates'],
                properties: {
                  name: { type: 'string' },
                  address: { type: 'string' },
                  coordinates: {
                    type: 'array',
                    items: { type: 'number' },
                    minItems: 2,
                    maxItems: 2
                  }
                }
              },
              notes: { type: 'string', maxLength: 200 }
            }
          }
        },
        notes: { type: 'string', maxLength: 200 }
      }
    };
  }

  validateCost(cost, activityIndex, currency) {
    if (!cost || typeof cost !== 'object') {
      throw new Error(`Missing or invalid cost object at activity ${activityIndex + 1}`);
    }

    const { amount, currency: costCurrency } = cost;

    if (amount === undefined || amount === null) {
      throw new Error(`Missing cost amount at activity ${activityIndex + 1}`);
    }

    if (typeof amount !== 'number') {
      throw new Error(`Cost amount must be a number at activity ${activityIndex + 1}, got ${typeof amount}`);
    }

    if (amount < 0) {
      throw new Error(`Cost amount cannot be negative at activity ${activityIndex + 1}`);
    }

    if (!costCurrency) {
      throw new Error(`Missing cost currency at activity ${activityIndex + 1}`);
    }

    if (costCurrency !== currency) {
      throw new Error(`Invalid currency at activity ${activityIndex + 1}: expected ${currency}, got ${costCurrency}`);
    }

    return true;
  }

  validateTimeFormat(time, field, activityIndex) {
    if (!/^\d{2}:\d{2}$/.test(time)) {
      throw new Error(`Invalid ${field} format at activity ${activityIndex + 1}: must be HH:MM`);
    }

    const [hours, minutes] = time.split(':').map(Number);
    if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
      throw new Error(`Invalid ${field} at activity ${activityIndex + 1}: hours must be 0-23, minutes must be 0-59`);
    }

    return true;
  }

  validateActivityTiming(startTime, endTime, activityIndex) {
    this.validateTimeFormat(startTime, 'startTime', activityIndex);
    this.validateTimeFormat(endTime, 'endTime', activityIndex);

    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startMinutesTotal = startHours * 60 + startMinutes;
    const endMinutesTotal = endHours * 60 + endMinutes;

    if (endMinutesTotal <= startMinutesTotal) {
      throw new Error(`Invalid timing at activity ${activityIndex + 1}: endTime must be after startTime`);
    }

    if (endMinutesTotal - startMinutesTotal > 480) { // 8 hours max
      throw new Error(`Activity ${activityIndex + 1} duration exceeds 8 hours`);
    }

    return true;
  }

  validateLocation(location, activityIndex) {
    if (!location || typeof location !== 'object') {
      throw new Error(`Missing or invalid location at activity ${activityIndex + 1}`);
    }

    const { name, address, coordinates } = location;

    if (!name || typeof name !== 'string') {
      throw new Error(`Missing or invalid location name at activity ${activityIndex + 1}`);
    }

    if (!address || typeof address !== 'string') {
      throw new Error(`Missing or invalid location address at activity ${activityIndex + 1}`);
    }

    if (!Array.isArray(coordinates) || coordinates.length !== 2) {
      throw new Error(`Invalid coordinates format at activity ${activityIndex + 1}: must be [longitude, latitude]`);
    }

    const [longitude, latitude] = coordinates;

    if (typeof longitude !== 'number' || typeof latitude !== 'number') {
      throw new Error(`Invalid coordinates at activity ${activityIndex + 1}: values must be numbers`);
    }

    if (longitude < -180 || longitude > 180) {
      throw new Error(`Invalid longitude at activity ${activityIndex + 1}: must be between -180 and 180`);
    }

    if (latitude < -90 || latitude > 90) {
      throw new Error(`Invalid latitude at activity ${activityIndex + 1}: must be between -90 and 90`);
    }

    return true;
  }

  validateActivity(activity, index, currency) {
    const {
      type, title, description, startTime, endTime,
      cost, location, notes
    } = activity;

    // Validate required fields
    const requiredFields = ['type', 'title', 'description', 'startTime', 'endTime', 'cost', 'location', 'notes'];
    const missingFields = requiredFields.filter(field => !activity[field]);
    if (missingFields.length > 0) {
      throw new Error(`Missing required fields in activity ${index + 1}: ${missingFields.join(', ')}`);
    }

    // Validate activity type
    if (!this.dayPlanSchema.properties.activities.items.properties.type.enum.includes(type)) {
      throw new Error(`Invalid activity type in activity ${index + 1}: ${type}. Must be one of: ${this.dayPlanSchema.properties.activities.items.properties.type.enum.join(', ')}`);
    }

    // Validate text lengths
    if (title.length > 100) {
      throw new Error(`Title exceeds 100 characters in activity ${index + 1}`);
    }
    if (description.length > 250) {
      throw new Error(`Description exceeds 250 characters in activity ${index + 1}`);
    }
    if (notes.length > 200) {
      throw new Error(`Notes exceed 200 characters in activity ${index + 1}`);
    }

    // Validate timing
    this.validateActivityTiming(startTime, endTime, index);

    // Validate cost
    this.validateCost(cost, index, currency);

    // Validate location
    this.validateLocation(location, index);

    return true;
  }

  validateDayPlan(dayPlan, index, currency) {
    const { date, activities, notes } = dayPlan;

    // Validate date format
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      throw new Error(`Invalid date format for day ${index + 1}: ${date}. Must be YYYY-MM-DD`);
    }

    // Validate activities array
    if (!Array.isArray(activities)) {
      throw new Error(`Activities must be an array for day ${index + 1}`);
    }

    if (activities.length === 0) {
      throw new Error(`No activities provided for day ${index + 1}`);
    }

    if (activities.length > 8) {
      throw new Error(`Too many activities for day ${index + 1}: maximum is 8`);
    }

    // Validate each activity
    activities.forEach((activity, activityIndex) => {
      this.validateActivity(activity, activityIndex, currency);
    });

    // Validate day notes
    if (typeof notes !== 'string' || notes.length > 200) {
      throw new Error(`Invalid or too long notes for day ${index + 1}`);
    }

    // Validate activity timing sequence
    let previousEndTime = '00:00';
    activities.forEach((activity, activityIndex) => {
      if (activity.startTime < previousEndTime) {
        throw new Error(`Activity timing overlap on day ${index + 1}: activity ${activityIndex + 1} starts before previous activity ends`);
      }
      previousEndTime = activity.endTime;
    });

    return true;
  }

  async cleanJsonString(text) {
    try {
      // Remove any markdown formatting
      text = text.replace(/```(?:json)?\s*|\s*```/g, '');
      
      // Find JSON content
      const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON content found in response');
      }

      // Clean up the JSON string
      let cleanJson = jsonMatch[0]
        .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
        .replace(/\n\s*(["}])/g, '$1') // Clean up line breaks
        .replace(/([{[,:])\s*\n\s*/g, '$1') // Clean up whitespace
        .replace(/\\n/g, ' ') // Replace newlines in strings with spaces
        .replace(/\s+/g, ' ') // Normalize whitespace
        .replace(/"([^"]*)":\s*"([^"]*)"\s*([,}])/g, '"$1":"$2"$3') // Fix spacing in key-value pairs
        .trim();

      // Try to parse and stringify to ensure valid JSON
      cleanJson = JSON.stringify(JSON.parse(cleanJson));
      return cleanJson;
    } catch (error) {
      console.error('JSON cleaning error:', error);
      console.log('Original text:', text);
      throw new Error(`Failed to clean JSON: ${error.message}`);
    }
  }

  async parseAndValidateJson(text) {
    try {
      const cleanJson = await this.cleanJsonString(text);
      const parsed = JSON.parse(cleanJson);
      
      // Log the cleaned and parsed JSON for debugging
      console.log('Cleaned and parsed JSON:', JSON.stringify(parsed, null, 2));
      
      return parsed;
    } catch (error) {
      console.error('JSON parse error:', error);
      console.log('Cleaned text:', text);
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  async validateDayPlans(text, currency) {
    const json = await this.parseAndValidateJson(text);
    
    if (!json.dayPlans || !Array.isArray(json.dayPlans)) {
      throw new Error('Invalid day plans format: missing or invalid dayPlans array');
    }

    if (json.dayPlans.length === 0) {
      throw new Error('No day plans provided');
    }

    // Validate each day plan
    json.dayPlans.forEach((dayPlan, index) => {
      try {
        this.validateDayPlan(dayPlan, index, currency);
      } catch (error) {
        throw new Error(`Validation failed for day ${index + 1}: ${error.message}`);
      }
    });

    return json;
  }

  async validateTips(text) {
    const tips = await this.parseAndValidateJson(text);
    
    if (!Array.isArray(tips)) {
      throw new Error('Tips must be an array of strings');
    }

    if (tips.length === 0) {
      throw new Error('No tips provided');
    }

    if (tips.length > 10) {
      throw new Error('Too many tips: maximum is 10');
    }

    if (!tips.every(tip => typeof tip === 'string' && tip.length <= 200)) {
      throw new Error('Each tip must be a string of maximum 200 characters');
    }

    return tips;
  }

  async validateInsights(text) {
    const insights = await this.parseAndValidateJson(text);
    
    const requiredKeys = [
      'bestTimeToVisit',
      'localCustoms',
      'transportation',
      'safety',
      'localExperiences'
    ];

    for (const key of requiredKeys) {
      if (!insights[key] || typeof insights[key] !== 'string') {
        throw new Error(`Missing or invalid ${key} in insights`);
      }
      if (insights[key].length > 200) {
        throw new Error(`${key} exceeds maximum length of 200 characters`);
      }
    }

    return insights;
  }

  async validateActivities(text) {
    const json = await this.parseAndValidateJson(text);
    
    if (!json.activities || !Array.isArray(json.activities)) {
      throw new Error('Activities must be an array');
    }

    if (json.activities.length === 0) {
      throw new Error('No activities provided');
    }

    json.activities.forEach((activity, index) => {
      const { name, description, duration, cost, bestTime } = activity;

      if (!name || !description || !duration || !cost || !bestTime) {
        throw new Error(`Missing required fields in activity at index ${index}`);
      }

      if (description.length > 200) {
        throw new Error(`Description exceeds maximum length in activity at index ${index}`);
      }
    });

    return json;
  }
}

module.exports = { ResponseValidator }; 