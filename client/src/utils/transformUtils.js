// Data transformation utilities
const transformItineraryData = (data) => {
  if (!data) return null;

  return {
    destination: transformDestination(data.destination),
    startDate: new Date(data.startDate).toISOString(),
    endDate: new Date(data.endDate).toISOString(),
    travelStyle: String(data.travelStyle || '').toLowerCase(),
    budget: transformBudget(data.budget),
    preferences: transformPreferences(data.preferences),
    dayPlans: transformDayPlans(data.dayPlans, data.budget?.currency),
    tips: Array.isArray(data.tips) ? data.tips.map(tip => String(tip).trim()) : []
  };
};

const transformDestination = (destination) => {
  if (!destination) return null;

  return {
    city: String(destination.city || '').trim(),
    country: String(destination.country || '').trim(),
    coordinates: Array.isArray(destination.coordinates) 
      ? destination.coordinates.map(coord => Number(coord) || 0)
      : [0, 0]
  };
};

const transformBudget = (budget) => {
  if (!budget) return null;

  return {
    planned: Number(budget.planned) || 0,
    currency: String(budget.currency || 'USD').toUpperCase()
  };
};

const transformPreferences = (preferences) => {
  if (!preferences) return {};

  return {
    interests: Array.isArray(preferences.interests) 
      ? preferences.interests.map(String) 
      : [],
    accessibility: Array.isArray(preferences.accessibility) 
      ? preferences.accessibility.map(String) 
      : [],
    dietaryRestrictions: Array.isArray(preferences.dietaryRestrictions) 
      ? preferences.dietaryRestrictions.map(String) 
      : []
  };
};

const transformDayPlans = (dayPlans, defaultCurrency) => {
  if (!Array.isArray(dayPlans)) return [];

  return dayPlans.map(day => ({
    date: new Date(day.date).toISOString(),
    activities: Array.isArray(day.activities) 
      ? day.activities.map(activity => transformActivity(activity, defaultCurrency))
      : [],
    notes: String(day.notes || '').trim()
  }));
};

const transformActivity = (activity, defaultCurrency) => {
  if (!activity) return null;

  return {
    type: String(activity.type || '').toLowerCase(),
    title: String(activity.title || '').trim(),
    description: String(activity.description || '').trim(),
    startTime: String(activity.startTime || '').trim(),
    endTime: String(activity.endTime || '').trim(),
    cost: {
      amount: Number(activity.cost?.amount) || 0,
      currency: String(activity.cost?.currency || defaultCurrency || 'USD').toUpperCase()
    },
    location: {
      name: String(activity.location?.name || '').trim(),
      address: String(activity.location?.address || '').trim(),
      coordinates: Array.isArray(activity.location?.coordinates)
        ? activity.location.coordinates.map(coord => Number(coord) || 0)
        : [0, 0],
      placeId: activity.location?.placeId 
        ? String(activity.location.placeId).trim() 
        : undefined
    },
    notes: String(activity.notes || '').trim()
  };
};

export {
  transformItineraryData,
  transformDestination,
  transformBudget,
  transformPreferences,
  transformDayPlans,
  transformActivity
}; 