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
  isValidCoordinates
}; 