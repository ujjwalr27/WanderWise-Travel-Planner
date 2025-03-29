import * as yup from 'yup';

// Common validation schemas
export const loginSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required')
});

export const registerSchema = yup.object({
  email: yup
    .string()
    .email('Enter a valid email')
    .required('Email is required'),
  password: yup
    .string()
    .min(6, 'Password must be at least 6 characters')
    .required('Password is required'),
  firstName: yup
    .string()
    .required('First name is required'),
  lastName: yup
    .string()
    .required('Last name is required')
});

// Validation schemas
const coordinatesSchema = yup.array()
  .of(yup.number())
  .length(2)
  .test('valid-coordinates', 'Invalid coordinates', (coords) => {
    if (!coords) return false;
    const [longitude, latitude] = coords;
    return longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
  });

const locationSchema = yup.object({
  name: yup.string().required('Location name is required').trim(),
  address: yup.string().required('Address is required').trim(),
  coordinates: coordinatesSchema.required('Coordinates are required'),
  placeId: yup.string().optional().trim()
});

const costSchema = yup.object({
  amount: yup.number()
    .required('Cost amount is required')
    .min(0, 'Cost cannot be negative')
    .transform((value) => (isNaN(value) ? undefined : value)),
  currency: yup.string()
    .required('Currency is required')
    .matches(/^[A-Z]{3}$/, 'Currency must be a 3-letter code')
    .uppercase()
});

const activitySchema = yup.object({
  type: yup.string()
    .required('Activity type is required')
    .oneOf([
      'cultural', 'local', 'relaxation', 'transport',
      'dining', 'shopping', 'entertainment', 'sightseeing'
    ], 'Invalid activity type')
    .lowercase(),
  title: yup.string()
    .required('Title is required')
    .max(100, 'Title must be at most 100 characters')
    .trim(),
  description: yup.string()
    .max(250, 'Description must be at most 250 characters')
    .trim(),
  startTime: yup.string()
    .required('Start time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)'),
  endTime: yup.string()
    .required('End time is required')
    .matches(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Invalid time format (HH:mm)')
    .test('is-after-start', 'End time must be after start time', function(endTime) {
      const { startTime } = this.parent;
      if (!startTime || !endTime) return true;
      return endTime > startTime;
    }),
  cost: costSchema.required('Cost information is required'),
  location: locationSchema.required('Location information is required'),
  notes: yup.string()
    .max(200, 'Notes must be at most 200 characters')
    .trim()
});

const dayPlanSchema = yup.object({
  date: yup.date().required('Date is required'),
  activities: yup.array()
    .of(activitySchema)
    .min(1, 'At least one activity is required')
    .max(8, 'Maximum 8 activities per day'),
  notes: yup.string()
    .max(200, 'Notes must be at most 200 characters')
    .trim()
});

const itinerarySchema = yup.object({
  destination: yup.object({
    city: yup.string().required('City is required').trim(),
    country: yup.string().required('Country is required').trim(),
    coordinates: coordinatesSchema.required('Coordinates are required')
  }).required('Destination information is required'),
  startDate: yup.date().required('Start date is required'),
  endDate: yup.date()
    .required('End date is required')
    .min(yup.ref('startDate'), 'End date must be after start date'),
  budget: yup.object({
    planned: yup.number()
      .required('Budget amount is required')
      .min(0, 'Budget cannot be negative')
      .transform((value) => (isNaN(value) ? undefined : value)),
    currency: yup.string()
      .required('Currency is required')
      .matches(/^[A-Z]{3}$/, 'Currency must be a 3-letter code')
      .uppercase()
  }).required('Budget information is required'),
  travelStyle: yup.string()
    .required('Travel style is required')
    .oneOf(['luxury', 'budget', 'adventure', 'cultural', 'relaxation'])
    .lowercase(),
  dayPlans: yup.array()
    .of(dayPlanSchema)
    .min(1, 'At least one day plan is required'),
  preferences: yup.object({
    interests: yup.array().of(yup.string()),
    accessibility: yup.array().of(yup.string()),
    dietaryRestrictions: yup.array().of(yup.string())
  })
});

// Helper functions
export const getValidationErrors = (error) => {
  const validationErrors = {};
  
  if (error.inner) {
    error.inner.forEach((err) => {
      validationErrors[err.path] = err.message;
    });
  }
  
  return validationErrors;
};

export const validateField = async (schema, field, value) => {
  try {
    await schema.validateAt(field, { [field]: value });
    return null;
  } catch (error) {
    return error.message;
  }
};

// Validation functions
const validateItineraryData = async (data) => {
  try {
    const validatedData = await itinerarySchema.validate(data, {
      abortEarly: false,
      stripUnknown: true
    });
    return { isValid: true, data: validatedData, errors: null };
  } catch (error) {
    const errors = {};
    if (error.inner) {
      error.inner.forEach((err) => {
        errors[err.path] = err.message;
      });
    }
    return { isValid: false, data: null, errors };
  }
};

const validateActivity = async (activity) => {
  try {
    const validatedActivity = await activitySchema.validate(activity, {
      abortEarly: false,
      stripUnknown: true
    });
    return { isValid: true, data: validatedActivity, errors: null };
  } catch (error) {
    const errors = {};
    if (error.inner) {
      error.inner.forEach((err) => {
        errors[err.path] = err.message;
      });
    }
    return { isValid: false, data: null, errors };
  }
};

export {
  validateItineraryData,
  validateActivity,
  itinerarySchema,
  activitySchema,
  dayPlanSchema,
  costSchema,
  locationSchema
}; 