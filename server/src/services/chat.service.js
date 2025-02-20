const { GoogleGenerativeAI } = require('@google/generative-ai');
const { createClient } = require('redis');

class ChatService {
  constructor() {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is required but not provided');
    }

    // Initialize Gemini
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-pro',
      generationConfig: {
        temperature: 0.7,
        topP: 0.8,
        topK: 40,
        maxOutputTokens: 8192,
      }
    });

    // Initialize Redis
    this.initRedis();
  }

  async initRedis() {
    try {
      this.redis = createClient({
        url: process.env.REDIS_URL
      });

      this.redis.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await this.redis.connect();
      console.log('Redis connected successfully');
    } catch (error) {
      console.error('Redis initialization error:', error);
    }
  }

  async generateResponse(message, context = {}) {
    try {
      const { userId, itineraryId } = context;
      
      if (!userId) {
        throw new Error('User ID is required');
      }

      // Get chat history and format it for Gemini
      const chatHistory = await this.getChatHistory(userId);
      const formattedHistory = chatHistory.map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }]
      }));

      // Create the prompt for the current message
      const prompt = `You are an AI travel assistant helping users plan their trips. 
      ${itineraryId ? 'You are currently discussing a specific itinerary.' : ''}
      Be friendly, helpful, and provide specific, actionable advice.

      User message: ${message}`;

      // Generate response using direct content generation
      const result = await this.model.generateContent(prompt);
      const response = result.response.text();

      if (!response) {
        throw new Error('Empty response from AI');
      }

      // Save messages to history
      const userMessage = {
        sender: 'user',
        content: message,
        timestamp: new Date().toISOString(),
        itineraryId
      };

      const assistantMessage = {
        sender: 'assistant',
        content: response,
        timestamp: new Date().toISOString(),
        itineraryId
      };

      await this.saveChatMessage(userId, userMessage);
      await this.saveChatMessage(userId, assistantMessage);

      return response;
    } catch (error) {
      console.error('Error generating AI response:', error);
      throw new Error(`Failed to generate response: ${error.message}`);
    }
  }

  async getChatHistory(userId) {
    try {
      if (!this.redis.isReady) {
        await this.initRedis();
      }

      const key = `chat:${userId}:history`;
      const history = await this.redis.get(key);
      
      if (!history) {
        return [];
      }

      return JSON.parse(history);
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }

  async saveChatMessage(userId, message) {
    try {
      if (!this.redis.isReady) {
        await this.initRedis();
      }

      const key = `chat:${userId}:history`;
      const history = await this.getChatHistory(userId);
      
      history.push(message);

      // Keep only last 50 messages
      if (history.length > 50) {
        history.shift();
      }

      await this.redis.set(key, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Error saving chat message:', error);
      return false;
    }
  }

  async clearChatHistory(userId) {
    try {
      if (!this.redis.isReady) {
        await this.initRedis();
      }

      if (!userId) {
        throw new Error('User ID is required to clear chat history');
      }

      const key = `chat:${userId}:history`;
      await this.redis.del(key);
      return true;
    } catch (error) {
      console.error('Error clearing chat history:', error);
      throw new Error(`Failed to clear chat history: ${error.message}`);
    }
  }

  async getTravelSuggestions(query, preferences = {}) {
    try {
      const prompt = `As a travel expert, provide detailed suggestions based on:
        Travel Style: ${preferences.travelStyle || 'Not specified'}
        Budget: ${preferences.budget || 'Not specified'}
        Interests: ${preferences.interests?.join(', ') || 'Not specified'}
        
        Query: ${query}
        
        Please provide:
        1. Specific recommendations with names and details
        2. Estimated costs in USD
        3. Best time to visit with weather considerations
        4. Local tips and insider advice
        5. Important cultural considerations and etiquette
        
        Format your response in a clear, structured way.`;

      const result = await this.model.generateContent({
        contents: [{ role: 'user', parts: [{ text: prompt }] }]
      });
      
      const response = result.response.text();

      if (!response) {
        throw new Error('Empty response from AI');
      }

      return response;
    } catch (error) {
      console.error('Error getting travel suggestions:', error);
      throw new Error(`Failed to get travel suggestions: ${error.message}`);
    }
  }
}

module.exports = new ChatService(); 