
import { format, differenceInDays, addDays, parseISO } from 'date-fns';

export const formatDate = (date) => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'MMM dd, yyyy');
  } catch (error) {
    console.error('Error formatting date:', error);
    return date;
  }
};

export const formatDateTime = (date) => {
  if (!date) return '';
  try {
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, 'MMM dd, yyyy HH:mm');
  } catch (error) {
    console.error('Error formatting datetime:', error);
    return date;
  }
};

export const formatTime = (timeString) => {
  if (!timeString) return '';
  try {
    // Handle HH:mm format directly
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      return timeString;
    }
    // Handle ISO date strings
    if (timeString.includes('T')) {
      const parsedDate = parseISO(timeString);
      return format(parsedDate, 'HH:mm');
    }
    // Handle date objects
    if (timeString instanceof Date) {
      return format(timeString, 'HH:mm');
    }
    return timeString;
  } catch (error) {
    console.error('Error formatting time:', error);
    return timeString;
  }
};

export const getDaysBetweenDates = (startDate, endDate) => {
  if (!startDate || !endDate) return 0;
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    return differenceInDays(end, start) + 1;
  } catch (error) {
    console.error('Error calculating days between dates:', error);
    return 0;
  }
};

export const generateDateRange = (startDate, endDate) => {
  if (!startDate || !endDate) return [];
  try {
    const days = getDaysBetweenDates(startDate, endDate);
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    return Array.from({ length: days }, (_, index) => addDays(start, index));
  } catch (error) {
    console.error('Error generating date range:', error);
    return [];
  }
};

export const isValidDateRange = (startDate, endDate) => {

  if (!startDate || !endDate) return false;
  try {
    const start = typeof startDate === 'string' ? parseISO(startDate) : startDate;
    const end = typeof endDate === 'string' ? parseISO(endDate) : endDate;
    return end >= start;
  } catch (error) {
    console.error('Error validating date range:', error);
    return false;
  }
};

export const parseTimeString = (timeString) => {
  if (!timeString) return null;
  try {
    // Handle HH:mm format
    if (timeString.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeString.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    // Handle ISO date strings
    if (timeString.includes('T')) {
      return parseISO(timeString);
    }
    return null;
  } catch (error) {
    console.error('Error parsing time string:', error);
    return null;
  }
}; 