const validateItineraryData = async (data) => {
  try {
    // Validate required fields
    if (!data.destination || !data.destination.city || !data.destination.country || !data.destination.coordinates) {
      throw new Error('Destination information is incomplete');
    }

    if (!data.startDate || !data.endDate) {
      throw new Error('Start date and end date are required');
    }

    if (!data.budget || typeof data.budget.planned !== 'number' || !data.budget.currency) {
      throw new Error('Budget information is incomplete');
    }

    // Validate coordinates
    if (!Array.isArray(data.destination.coordinates) || 
        data.destination.coordinates.length !== 2 ||
        !isValidCoordinates(data.destination.coordinates)) {
      throw new Error('Invalid coordinates format');
    }

    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Invalid date format');
    }
    if (endDate < startDate) {
      throw new Error('End date must be after start date');
    }

    // Validate travel style
    const validTravelStyles = ['luxury', 'budget', 'adventure', 'cultural', 'relaxation'];
    if (!validTravelStyles.includes(data.travelStyle?.toLowerCase())) {
      throw new Error('Invalid travel style');
    }

    // Validate day plans if present
    if (data.dayPlans) {
      if (!Array.isArray(data.dayPlans)) {
        throw new Error('Day plans must be an array');
      }

      for (const dayPlan of data.dayPlans) {
        await validateDayPlan(dayPlan);
      }
    }

    return { isValid: true, data };
  } catch (error) {
    return {
      isValid: false,
      errors: {
        message: error.message
      }
    };
  }
};

const validateDayPlan = async (dayPlan) => {
  if (!dayPlan.date) {
    throw new Error('Day plan date is required');
  }

  if (!Array.isArray(dayPlan.activities)) {
    throw new Error('Activities must be an array');
  }

  for (const activity of dayPlan.activities) {
    await validateActivity(activity);
  }
};

const validateActivity = async (activity) => {
  // Required fields
  if (!activity.type) throw new Error('Activity type is required');
  if (!activity.title) throw new Error('Activity title is required');
  if (!activity.startTime) throw new Error('Start time is required');
  if (!activity.endTime) throw new Error('End time is required');

  // Validate location
  if (!activity.location || 
      !activity.location.name || 
      !activity.location.address || 
      !activity.location.coordinates) {
    throw new Error('Location information is incomplete');
  }

  // Validate coordinates
  if (!Array.isArray(activity.location.coordinates) || 
      activity.location.coordinates.length !== 2 ||
      !isValidCoordinates(activity.location.coordinates)) {
    throw new Error('Invalid location coordinates');
  }

  // Validate times
  if (!isValidTimeFormat(activity.startTime)) {
    throw new Error('Invalid start time format (HH:mm required)');
  }
  if (!isValidTimeFormat(activity.endTime)) {
    throw new Error('Invalid end time format (HH:mm required)');
  }
  if (activity.startTime >= activity.endTime) {
    throw new Error('End time must be after start time');
  }

  // Validate cost if present
  if (activity.cost) {
    if (typeof activity.cost.amount !== 'number' || activity.cost.amount < 0) {
      throw new Error('Invalid cost amount');
    }
    if (!activity.cost.currency || typeof activity.cost.currency !== 'string') {
      throw new Error('Invalid currency');
    }
  }
};

const isValidTimeFormat = (time) => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(time);
};

const isValidCoordinates = (coordinates) => {
  const [longitude, latitude] = coordinates;
  return (
    typeof longitude === 'number' &&
    typeof latitude === 'number' &&
    longitude >= -180 && longitude <= 180 &&
    latitude >= -90 && latitude <= 90
  );
};

module.exports = {
  validateItineraryData,
  validateDayPlan,
  validateActivity,
  isValidTimeFormat,
  isValidCoordinates
}; 