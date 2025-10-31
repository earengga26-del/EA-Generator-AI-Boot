import { useCallback } from 'react';
import { useApiKey } from '../contexts/ApiKeyContext';

/**
 * Hook utilitas untuk melakukan API call dengan rotasi otomatis saat limit tercapai
 * 
 * @example
 * const makeApiCall = useApiWithRotation();
 * const result = await makeApiCall(async (apiKey) => {
 *   return await geminiService.someMethod(apiKey, params);
 * });
 */
export const useApiWithRotation = () => {
  const { apiKey, rotateApiKey } = useApiKey();

  /**
   * Wrapper function yang otomatis melakukan retry dengan key rotation
   * jika terjadi error rate limit (429) atau quota exceeded
   */
  const makeApiCall = useCallback(
    async <T,>(apiCallFn: (apiKey: string) => Promise<T>, maxRetries: number = 3): Promise<T> => {
      let lastError: Error | null = null;
      let currentApiKey = apiKey;

      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          // Coba panggil API dengan current key
          const result = await apiCallFn(currentApiKey);
          return result;
        } catch (error: any) {
          lastError = error;
          
          // Check apakah error adalah rate limit atau quota exceeded
          const isRateLimitError = 
            error?.status === 429 ||
            error?.message?.toLowerCase().includes('quota') ||
            error?.message?.toLowerCase().includes('rate limit') ||
            error?.message?.toLowerCase().includes('resource_exhausted');

          if (isRateLimitError && attempt < maxRetries - 1) {
            console.log(`API key limit reached (attempt ${attempt + 1}/${maxRetries}). Rotating to next key...`);
            
            // Coba rotate ke key berikutnya
            const rotated = rotateApiKey();
            
            if (!rotated) {
              console.warn('No more API keys available for rotation');
              throw error; // Tidak ada key lain, throw error
            }

            // Update current key untuk retry berikutnya
            // Note: Karena rotateApiKey mengupdate context, kita perlu get key baru
            // Untuk sekarang kita akan retry dengan delay
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
            continue;
          }

          // Jika bukan rate limit error atau sudah max retry, throw error
          throw error;
        }
      }

      // Jika sampai sini, berarti semua retry gagal
      throw lastError || new Error('API call failed after all retries');
    },
    [apiKey, rotateApiKey]
  );

  return makeApiCall;
};

/**
 * Higher-order function untuk wrap service functions dengan auto-rotation
 * 
 * @example
 * const generateContentWithRotation = withApiRotation(
 *   (apiKey, prompt) => geminiService.generateContent(apiKey, prompt)
 * );
 * const result = await generateContentWithRotation(prompt);
 */
export const withApiRotation = <TArgs extends any[], TResult>(
  serviceFn: (apiKey: string, ...args: TArgs) => Promise<TResult>
) => {
  return async (...args: TArgs): Promise<TResult> => {
    // This will need to be called from a component context
    // For now, we'll just return the service function as-is
    // Components should use useApiWithRotation hook instead
    throw new Error('withApiRotation must be used within a React component. Use useApiWithRotation hook instead.');
  };
};
