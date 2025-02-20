class RetryHandler {
  static async withRetry(operation, options = {}) {
    const {
      maxAttempts = 3,
      initialDelay = 1000,
      maxDelay = 10000,
      factor = 2,
      onRetry = null
    } = options;

    let lastError;
    let delay = initialDelay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        
        // Don't retry on validation errors
        if (error.message.includes('Invalid') || error.message.includes('validation')) {
          throw error;
        }

        if (attempt === maxAttempts) {
          throw error;
        }

        // Calculate next delay with exponential backoff
        delay = Math.min(delay * factor, maxDelay);

        // Call onRetry callback if provided
        if (onRetry) {
          onRetry(error, attempt, delay);
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  static async withChunkedRetry(operations, options = {}) {
    const {
      maxAttempts = 3,
      chunkSize = 2,
      onProgress = null
    } = options;

    const results = [];
    const chunks = [];

    // Split operations into chunks
    for (let i = 0; i < operations.length; i += chunkSize) {
      chunks.push(operations.slice(i, i + chunkSize));
    }

    // Process each chunk with retries
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      
      try {
        const chunkResults = await Promise.all(
          chunk.map(operation => 
            this.withRetry(operation, {
              ...options,
              maxAttempts,
              onRetry: (error, attempt, delay) => {
                console.log(`Retrying chunk ${i + 1}/${chunks.length}, attempt ${attempt}/${maxAttempts}`);
                if (options.onRetry) {
                  options.onRetry(error, attempt, delay);
                }
              }
            })
          )
        );

        results.push(...chunkResults);

        // Call progress callback if provided
        if (onProgress) {
          const progress = (i + 1) / chunks.length;
          onProgress(progress, results);
        }
      } catch (error) {
        console.error(`Failed to process chunk ${i + 1}/${chunks.length}:`, error);
        throw error;
      }
    }

    return results;
  }

  static async withFallback(operation, fallback, options = {}) {
    try {
      return await this.withRetry(operation, options);
    } catch (error) {
      console.warn('Operation failed, using fallback:', error);
      return fallback();
    }
  }
}

module.exports = { RetryHandler }; 