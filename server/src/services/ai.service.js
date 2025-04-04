const { GoogleGenerativeAI } = require('@google/generative-ai');
const { RetryHandler } = require('../utils/retryHandler');
const { ResponseValidator } = require('../utils/responseValidator');
const PromptTemplates = require('../utils/promptTemplates');

class AIService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required but not provided');
    }

    try {
      this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      // Update to use gemini-2.0-flash, Google's newest and fastest model
      this.model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.0-flash',
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 8192,
        }
      });
      this.retryHandler = RetryHandler;
      this.validator = new ResponseValidator();
    } catch (error) {
      console.error('Failed to initialize AI service:', error);
      throw new Error('Failed to initialize AI service: ' + error.message);
    }
  }

  validateAndSanitizeData(data) {
    // Ensure all required fields are present with defaults
    const sanitized = {
      destination: {
        city: data.destination?.city || 'Unknown City',
        country: data.destination?.country || 'Unknown Country',
        coordinates: data.destination?.coordinates || [0, 0]
      },
      startDate: new Date(data.startDate || Date.now()),
      endDate: new Date(data.endDate || Date.now() + 86400000), // Default to next day
      travelStyle: data.travelStyle || 'balanced',
      budget: {
        planned: Number(data.budget?.planned || 500),
        currency: data.budget?.currency || 'USD'
      },
      preferences: data.preferences || {}
    };

    // Validate dates
    if (sanitized.endDate < sanitized.startDate) {
      sanitized.endDate = new Date(sanitized.startDate.getTime() + 86400000);
    }

    // Restrict to maximum 4 days
    const maxDays = 4;
    const currentDays = Math.ceil((sanitized.endDate - sanitized.startDate) / (1000 * 60 * 60 * 24));
    if (currentDays > maxDays) {
      // Set endDate to startDate + 4 days
      sanitized.endDate = new Date(sanitized.startDate.getTime() + (maxDays * 24 * 60 * 60 * 1000));
    }

    // Ensure budget is a positive number
    if (isNaN(sanitized.budget.planned) || sanitized.budget.planned <= 0) {
      sanitized.budget.planned = 500;
    }

    return sanitized;
  }

  async generateItinerary(data) {
    // Validate and sanitize input data
    const sanitizedData = this.validateAndSanitizeData(data);
    
    // Calculate total days (capped at 4)
    const totalDays = Math.min(
      4, 
      Math.ceil((sanitizedData.endDate - sanitizedData.startDate) / (1000 * 60 * 60 * 24))
    );
    const chunkSize = 2; // Process 2 days at a time for better response times
    const totalChunks = Math.ceil(totalDays / chunkSize);
    
    let allDayPlans = [];
    let tips = [];

    try {
      // Generate day plans in chunks
      for (let i = 0; i < totalChunks; i++) {
        const chunkData = {
          ...sanitizedData,
          chunkIndex: i + 1,
          totalChunks
        };

        const dayPlansResult = await this.retryHandler.withRetry(
          async () => {
            const prompt = PromptTemplates.getDayPlanPrompt(chunkData);
            console.log('Generating day plans with prompt:', prompt);
            
            try {
              const result = await this.model.generateContent(prompt);
              const text = result.response.text();
              console.log('Raw API response:', text);
              
              const json = await this.validator.validateDayPlans(text, sanitizedData.budget.currency);
              return json.dayPlans;
            } catch (error) {
              console.error('Gemini API Error:', error.message, error.stack);
              // Specific error for better debugging
              if (error.message.includes('404') || error.message.includes('not found')) {
                throw new Error('AI model "gemini-2.0-flash" not available or API configuration issue');
              }
              throw error;
            }
          },
          {
            maxAttempts: 3,
            onRetry: (error, attempt) => {
              console.log(`Retry ${attempt} for chunk ${i + 1}: ${error.message}`);
              console.log('Full error:', error);
            }
          }
        );

        allDayPlans = [...allDayPlans, ...dayPlansResult];
      }

      // Generate travel tips
      tips = await this.retryHandler.withRetry(
        async () => {
          const prompt = PromptTemplates.getTipsPrompt(sanitizedData);
          try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            return await this.validator.validateTips(text);
          } catch (error) {
            console.error('Gemini API Error for tips:', error.message);
            // If there's an API error, return empty tips to avoid blocking the itinerary
            if (error.message.includes('404') || error.message.includes('not found')) {
              throw new Error('Error generating travel tips: AI model not available');
            }
            throw error;
          }
        },
        { 
          maxAttempts: 2,
          onRetry: (error, attempt) => {
            console.log(`Retry ${attempt} for tips: ${error.message}`);
          }
        }
      );

      return {
        dayPlans: allDayPlans,
        tips,
        budget: sanitizedData.budget
      };

    } catch (error) {
      console.error('Error generating itinerary:', error);
      if (error.message.includes('validate')) {
        // Validation error - return more specific error
        throw new Error(`Failed to generate valid itinerary: ${error.message}`);
      } else if (error.message.includes('model') || error.message.includes('AI')) {
        // Model error - more specific message
        throw new Error('The AI service encountered an error. Please try again with a different destination or travel parameters.');
      } else {
        // Generic error
        throw new Error(`Failed to generate itinerary: ${error.message}`);
      }
    }
  }

  async getDestinationInsights(destination) {
    try {
      const sanitizedDestination = {
        city: destination?.city || 'Unknown City',
        country: destination?.country || 'Unknown Country'
      };

      return await this.retryHandler.withRetry(
        async () => {
          const prompt = PromptTemplates.getInsightsPrompt(sanitizedDestination);
          try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            return await this.validator.validateInsights(text);
          } catch (error) {
            console.error('Gemini API Error for insights:', error.message);
            throw new Error('Failed to get destination insights due to an API error');
          }
        },
        { 
          maxAttempts: 2,
          onRetry: (error, attempt) => {
            console.log(`Retry ${attempt} for insights: ${error.message}`);
          }
        }
      );
    } catch (error) {
      console.error('Error getting destination insights:', error);
      throw new Error(`Failed to get destination insights: ${error.message}`);
    }
  }

  async suggestActivities(preferences, location) {
    try {
      const sanitizedPreferences = preferences || {};
      const sanitizedLocation = location || 'Unknown Location';

      return await this.retryHandler.withRetry(
        async () => {
          const prompt = PromptTemplates.getActivitySuggestionsPrompt(sanitizedPreferences, sanitizedLocation);
          try {
            const result = await this.model.generateContent(prompt);
            const text = result.response.text();
            return await this.validator.validateActivities(text);
          } catch (error) {
            console.error('Gemini API Error for activities:', error.message);
            throw new Error('Failed to suggest activities due to an API error');
          }
        },
        { 
          maxAttempts: 2,
          onRetry: (error, attempt) => {
            console.log(`Retry ${attempt} for activity suggestions: ${error.message}`);
          }
        }
      );
    } catch (error) {
      console.error('Error suggesting activities:', error);
      throw new Error(`Failed to suggest activities: ${error.message}`);
    }
  }
}

module.exports = new AIService(); 