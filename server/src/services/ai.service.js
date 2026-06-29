const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('redis');
const crypto = require('crypto');
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

    // Cache generated itineraries for 24h so identical requests skip the LLM
    this.cacheTtlSeconds = Number(process.env.AI_CACHE_TTL) || 86400;
    this.initRedis();
  }

  async initRedis() {
    // Caching is best-effort: if Redis is unavailable the service still
    // generates itineraries, just without the cache speedup.
    if (!process.env.REDIS_URL) {
      console.warn('REDIS_URL not set — AI response caching is disabled');
      return;
    }

    try {
      this.redis = createClient({ url: process.env.REDIS_URL });
      this.redis.on('error', (err) => console.error('AI cache Redis error:', err));
      await this.redis.connect();
      console.log('AI service cache (Redis) connected successfully');
    } catch (error) {
      console.error('AI cache Redis initialization error:', error);
      this.redis = null;
    }
  }

  // Build a deterministic cache key from the sanitized request parameters
  buildCacheKey(sanitizedData) {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify(sanitizedData))
      .digest('hex');
    return `itinerary:${hash}`;
  }

  async getCachedItinerary(cacheKey) {
    if (!this.redis?.isReady) return null;
    try {
      const cached = await this.redis.get(cacheKey);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('AI cache read error:', error);
      return null;
    }
  }

  async setCachedItinerary(cacheKey, value) {
    if (!this.redis?.isReady) return;
    try {
      await this.redis.set(cacheKey, JSON.stringify(value), { EX: this.cacheTtlSeconds });
    } catch (error) {
      console.error('AI cache write error:', error);
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

    // Return a cached result if we've already generated this exact request.
    // Keyed on the sanitized params, so two equivalent requests share a result.
    const cacheKey = this.buildCacheKey(sanitizedData);
    const cached = await this.getCachedItinerary(cacheKey);
    if (cached) {
      console.log('AI cache hit — returning cached itinerary for', cacheKey);
      return cached;
    }

    // Calculate total days (capped at 4)
    const totalDays = Math.min(
      4,
      Math.ceil((sanitizedData.endDate - sanitizedData.startDate) / (1000 * 60 * 60 * 24))
    );
    const chunkSize = 2; // Process 2 days at a time for better response times
    const totalChunks = Math.ceil(totalDays / chunkSize);

    try {
      // Generate each day-plan chunk and the travel tips concurrently. Total
      // latency becomes the slowest single request instead of the sum of all.
      const dayPlanChunkPromises = Array.from({ length: totalChunks }, (_, i) => {
        const chunkData = {
          ...sanitizedData,
          chunkIndex: i + 1,
          totalChunks
        };

        return this.retryHandler.withRetry(
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
      });

      // Travel tips don't depend on the day plans, so generate them in parallel too.
      const tipsPromise = this.retryHandler.withRetry(
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

      const [dayPlanChunks, tips] = await Promise.all([
        Promise.all(dayPlanChunkPromises),
        tipsPromise
      ]);

      // Promise.all preserves order, so chunks stay in chronological day order
      const allDayPlans = dayPlanChunks.flat();

      const itinerary = {
        dayPlans: allDayPlans,
        tips,
        budget: sanitizedData.budget
      };

      // Cache the successful result for subsequent identical requests
      await this.setCachedItinerary(cacheKey, itinerary);

      return itinerary;

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