// FIX: Added imports for response and operation types to fix type errors.
// The `VideosOperation` type is not exported by `@google/genai`. Using the correct `Operation` type.
// FIX: Add GenerateVideosResponse to fix generic type errors for Operation.
import { GoogleGenAI, Modality, GenerateContentResponse, GenerateImagesResponse, Operation, GenerateVideosResponse } from "@google/genai";
import type { ImageInput, VeoModel, AspectRatio, Resolution, CharacterVoice, VisualStyle, ImageAspectRatio } from '../types';

/**
 * A helper function to retry an async function with exponential backoff.
 * This is crucial for handling API rate limits (HTTP 429).
 * @param apiCall The async function to call.
 * @param maxRetries The maximum number of times to retry.
 * @param initialDelay The initial delay in milliseconds before the first retry.
 * @returns The result of the successful API call.
 */
const withRetry = async <T>(
  apiCall: () => Promise<T>,
  maxRetries: number = 5,
  initialDelay: number = 1000
): Promise<T> => {
  let attempt = 0;
  while (attempt < maxRetries) {
    try {
      // Attempt the API call
      return await apiCall();
    } catch (error: any) {
      // Check if the error message indicates a rate limit error
      const isRateLimitError = error instanceof Error && 
                               (error.message.includes('got status: 429') || error.message.toLowerCase().includes('quota exceeded'));

      if (isRateLimitError && attempt < maxRetries - 1) {
        attempt++;
        // Calculate delay with exponential backoff and add random jitter
        const delay = initialDelay * (2 ** (attempt - 1));
        const jitter = Math.random() * 500; // Add up to 500ms of randomness
        const waitTime = delay + jitter;
        
        console.warn(`Rate limit exceeded. Retrying in ${Math.round(waitTime / 1000)}s... (Attempt ${attempt}/${maxRetries - 1})`);
        
        // Wait for the calculated time before the next attempt
        await new Promise(resolve => setTimeout(resolve, waitTime));
      } else {
        // If it's not a rate limit error or we've exhausted all retries, throw the error
        console.error(`API call failed after ${attempt} retries or with a non-retriable error.`, error);
        
        // When retries are exhausted for a rate limit error, throw a more user-friendly message.
        if (isRateLimitError) {
          throw new Error("API quota exceeded. Please check your billing plan and limits in your Google AI account. If the issue persists, please try again later.");
        }
        throw error;
      }
    }
  }
  // This part should not be reached but is a fallback to satisfy TypeScript
  throw new Error('Exhausted all retries for API call.');
};

const getGenAIClient = (apiKey: string): GoogleGenAI => {
    if (!apiKey) {
        throw new Error("API Key is missing.");
    }
    return new GoogleGenAI({ apiKey });
};

/**
 * Validates an API key by making a simple, non-costly API call.
 * @param apiKey The API key to validate.
 * @returns A promise that resolves to true if the key is valid, false otherwise.
 */
export const validateApiKey = async (apiKey: string): Promise<boolean> => {
    if (!apiKey) return false;
    try {
        const ai = getGenAIClient(apiKey);
        // A simple, lightweight call to check authentication, wrapped with retry logic.
        await withRetry(() => ai.models.list());
        return true;
    } catch (error) {
        console.error("API Key validation failed after retries:", error);
        return false;
    }
};


/**
 * Generates a video using the VEO model.
 */
export const generateVideo = async (
  apiKey: string,
  { prompt, imageBase64, imageMimeType, model }: { prompt: string | object; imageBase64: string | null; imageMimeType: string | null; model: VeoModel; },
  aspectRatio: AspectRatio,
  enableSound: boolean,
  resolution: Resolution,
  characterVoice: CharacterVoice,
  visualStyle: VisualStyle
): Promise<string> => {
  const ai = getGenAIClient(apiKey);

  let finalPrompt: string;
  if (typeof prompt === 'string') {
    let modifiedPrompt = prompt;

    // If an image is provided, add an instruction to animate it.
    if (imageBase64) {
      modifiedPrompt = `Animate this image. ${modifiedPrompt}`;
    }
    
    // Always inject the aspect ratio into the prompt. This is the most reliable method.
    if (aspectRatio === '9:16') {
        modifiedPrompt = `${modifiedPrompt} The video must be a full-screen vertical video with a 9:16 aspect ratio.`;
    } else if (aspectRatio === '1:1') {
        modifiedPrompt = `${modifiedPrompt} The video must be a square video with a 1:1 aspect ratio.`;
    } else { // Assumes 16:9
        modifiedPrompt = `${modifiedPrompt} The video must be a widescreen video with a 16:9 aspect ratio.`;
    }
      
    let promptParts = [
      modifiedPrompt,
      `The visual style should be ${visualStyle}.`,
      `The video resolution should be ${resolution}.`
    ];

    if (enableSound && characterVoice !== 'none') {
        promptParts.push(`The video should include audio with a character voice in ${characterVoice}.`);
    } else if (enableSound) {
        promptParts.push('The video should include ambient sound.');
    } else {
        promptParts.push('The video should be silent.');
    }
    finalPrompt = promptParts.join(' ');
  } else {
    finalPrompt = JSON.stringify(prompt);
  }
  
  // Base request payload
  const requestPayload: any = {
    model: model,
    prompt: finalPrompt,
    config: {
      numberOfVideos: 1,
    }
  };

  if (imageBase64 && imageMimeType) {
    requestPayload.image = {
      imageBytes: imageBase64,
      mimeType: imageMimeType
    };
  }

  console.log("Generating video with payload:", requestPayload);

  // Wrap the initial video generation call with retry logic
  // FIX: Added explicit Operation type to resolve property access errors.
  // FIX: Operation type requires a generic argument.
  let operation: Operation<GenerateVideosResponse> = await withRetry(() => ai.models.generateVideos(requestPayload));
  
  // Poll for the result
  while (!operation.done) {
    await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds between checks
    // Also wrap the polling call with retry logic
    operation = await withRetry(() => ai.operations.getVideosOperation({ operation: operation }));
    console.log("Polling video generation status...", operation);
  }

  // FIX: The `error` property is on the Operation object itself, not its response.
  if (operation.error) {
    console.error("Video generation failed with an error:", operation.error);
    // FIX: The type of `operation.error.message` is `unknown`. Cast to string for the Error constructor.
    throw new Error(String(operation.error.message) || "Video generation failed due to an unknown error.");
  }

  const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;

  if (!downloadLink) {
    console.error("Video generation finished but no download link was provided.", operation.response);
    const errorText = "Video generation failed or returned an empty result.";
    throw new Error(errorText);
  }
  
  // The URI needs the API key to be fetched.
  // FIX: Safely append the API key, regardless of whether the URL already has query parameters.
  const keySeparator = downloadLink.includes('?') ? '&' : '?';
  const finalUrlWithKey = `${downloadLink}${keySeparator}key=${apiKey}`;
  
  // Fetch the video as a blob and return a local URL to avoid CORS and auth key exposure issues in the video tag.
  const response = await fetch(finalUrlWithKey);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Failed to download generated video:", response.status, errorBody);
    throw new Error(`Failed to download the generated video file. Server response: ${errorBody}`);
  }
  const videoBlob = await response.blob();
  return URL.createObjectURL(videoBlob);
};

/**
 * Generates a smart prompt for a TikTok affiliate video based on an image.
 */
export const generateAffiliatePrompt = async (apiKey: string, image: ImageInput): Promise<string> => {
    const ai = getGenAIClient(apiKey);

    const systemInstruction = `You are an expert fashion videographer and social media marketer for TikTok. Your task is to analyze an image of a clothing item or outfit and generate a concise, powerful prompt for an AI video generator (like VEO). The goal is to create a captivating, high-quality video for TikTok affiliate marketing.

The prompt must include:
1. **Subject Description:** A detailed but brief description of the outfit, including color, style, and fabric.
2. **Action & Pose:** A gentle, professional movement or elegant pose. Avoid using the term 'slow motion'.
3. **Camera Movement:** A dynamic camera instruction (e.g., 'dynamic close-up shot', 'medium full body shot', 'smooth orbiting shot from a low angle').
4. **Lighting:** Describe natural studio lighting (e.g., 'soft natural studio lighting', 'dramatic lighting with soft shadows').
5. **Expression & Mood:** A natural and elegant expression, with a professional and sophisticated mood.
6. **Quality Keywords:** ALWAYS include 'UHD 4K, HDR, ultra-sharp focus, realistic skin detail, professional photoshoot'.

Example Output:
'A professional model in a flowing emerald green silk dress makes a gentle turn. Dynamic medium full body shot. Soft natural studio lighting. A natural and elegant expression. UHD 4K, HDR, ultra-sharp focus, realistic skin detail, professional photoshoot.'`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: {
            parts: [
                { inlineData: { data: image.data, mimeType: image.mimeType } },
                { text: 'Analyze this image and generate a video prompt based on the system instructions.' }
            ]
        },
        config: {
            systemInstruction: systemInstruction,
        },
    }));

    return response.text.trim();
};

/**
 * Edits an image using Gemini based on a text prompt.
 */
export const editImage = async (
  apiKey: string,
  image: ImageInput,
  prompt: string
): Promise<ImageInput> => {
  const ai = getGenAIClient(apiKey);
  // Wrap the API call with retry logic
  // FIX: Added explicit GenerateContentResponse type to resolve property access errors.
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    // FIX: Updated deprecated model name to 'gemini-2.5-flash-image'.
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: image.data,
            mimeType: image.mimeType,
          },
        },
        { text: prompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  }));

  // FIX: Added optional chaining and nullish coalescing to safely access nested properties and prevent runtime errors.
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }
  }

  throw new Error('No image was generated by the model.');
};

/**
 * Generates an image using Imagen 4.0 from a text prompt.
 */
export const generateImage = async (
  apiKey: string,
  prompt: string,
  aspectRatio: ImageAspectRatio,
): Promise<ImageInput> => {
  const ai = getGenAIClient(apiKey);
  // Wrap the API call with retry logic
  // FIX: Added explicit GenerateImagesResponse type to resolve property access errors.
  const response: GenerateImagesResponse = await withRetry(() => ai.models.generateImages({
    model: 'imagen-4.0-generate-001',
    prompt: prompt,
    config: {
      numberOfImages: 1,
      outputMimeType: 'image/png',
      aspectRatio: aspectRatio,
    },
  }));

  const generatedImage = response.generatedImages[0]?.image;

  if (generatedImage?.imageBytes) {
      return {
          data: generatedImage.imageBytes,
          mimeType: 'image/png',
      };
  }

  throw new Error('No image was generated by the model.');
};


/**
 * Changes the aspect ratio of an image using Gemini.
 */
export const changeImageAspectRatio = async (
  apiKey: string,
  {
  mainImage,
  aspectReferenceImage,
}: {
  mainImage: ImageInput;
  aspectReferenceImage: ImageInput;
}): Promise<ImageInput> => {
  const ai = getGenAIClient(apiKey);
  // Wrap the API call with retry logic
  // FIX: Added explicit GenerateContentResponse type to resolve property access errors.
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    // FIX: Updated deprecated model name to 'gemini-2.5-flash-image'.
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: mainImage.data,
            mimeType: mainImage.mimeType,
          },
        },
        {
          inlineData: {
            data: aspectReferenceImage.data,
            mimeType: aspectReferenceImage.mimeType,
          },
        },
        {
          text: 'Expand the first image to fill the canvas of the second image (which defines the new aspect ratio). Maintain the original style and create a coherent extension of the scene.',
        },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  }));

  // FIX: Added optional chaining and nullish coalescing to safely access nested properties and prevent runtime errors.
  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }
  }

  throw new Error('No image was generated by the model.');
};

/**
 * Generates a product photo using an existing image as a subject.
 */
export const generateProductPhoto = async (
  apiKey: string,
  productImage: ImageInput,
  prompt: string,
  aspectRatio: ImageAspectRatio
): Promise<ImageInput> => {
  const ai = getGenAIClient(apiKey);
  const finalPrompt = `${prompt} Ensure the final image has a ${aspectRatio} aspect ratio.`;
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: [
        {
          inlineData: {
            data: productImage.data,
            mimeType: productImage.mimeType,
          },
        },
        { text: finalPrompt },
      ],
    },
    config: {
      responseModalities: [Modality.IMAGE],
    },
  }));

  for (const part of response.candidates?.[0]?.content?.parts ?? []) {
    if (part.inlineData) {
      return {
        data: part.inlineData.data,
        mimeType: part.inlineData.mimeType,
      };
    }
  }

  throw new Error('No image was generated by the model.');
};

/**
 * Generates a product photo using an existing image as a subject and another as a background.
 */
export const generateProductPhotoWithBackgroundImage = async (
  apiKey: string,
  productImage: ImageInput,
  backgroundImage: ImageInput,
  prompt: string,
  aspectRatio: ImageAspectRatio
): Promise<ImageInput> => {
    const ai = getGenAIClient(apiKey);
    const finalPrompt = `${prompt}. Place the product from the first image naturally into the background of the second image. Ensure the final image has a ${aspectRatio} aspect ratio. The result must be photorealistic and high-quality.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: finalPrompt },
                { inlineData: { data: productImage.data, mimeType: productImage.mimeType } },
                { inlineData: { data: backgroundImage.data, mimeType: backgroundImage.mimeType } },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            return {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }
    }
    throw new Error('Model did not generate an image.');
};


/**
 * Generates a detailed JSON video prompt from a simple text description.
 */
export const generateVideoPrompt = async (apiKey: string, description: string): Promise<string> => {
  const ai = getGenAIClient(apiKey);
  const systemInstruction = `You are an expert at creating detailed, structured JSON prompts for a powerful text-to-video generation model called VEO.
Your task is to take a user's simple text description and expand it into a rich, multi-scene JSON prompt.
The JSON structure should be an array of objects, where each object represents a scene.
Each scene object must have a 'prompt' key with a detailed description of the visual action for that scene.
A scene can also optionally include 'duration_seconds' (e.g., 2, 4, 8) and 'motion_scale' (0-10, where higher means more camera motion).
Generate a creative and visually interesting sequence of 2-4 scenes based on the user's input. Ensure the scenes flow logically.
Output ONLY the raw JSON string, with no markdown or other text.`;

  // Wrap the API call with retry logic
  // FIX: Added explicit GenerateContentResponse type to resolve property access errors.
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Create a detailed JSON video prompt for the following idea: "${description}"`,
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
    },
  }));

  return response.text.trim();
};

/**
 * Generates a detailed JSON video prompt from an image.
 */
export const generateVideoPromptFromImage = async (
  apiKey: string,
  {
  image,
  aspectRatio,
}: {
  image: ImageInput;
  aspectRatio: string;
}): Promise<string> => {
  const ai = getGenAIClient(apiKey);
  const systemInstruction = `You are an expert at creating detailed, structured JSON prompts for a powerful image-to-video generation model called VEO.
Your task is to analyze an input image and generate a rich, multi-scene JSON prompt that animates the image or creates a video starting from it.
The JSON structure should be an array of objects, where each object represents a scene.
The first scene should describe the input image and add a subtle motion to it. Subsequent scenes should continue the action logically.
Each scene object must have a 'prompt' key with a detailed description of the visual action.
A scene can also optionally include 'duration_seconds' (e.g., 2, 4, 8) and 'motion_scale' (0-10, where higher means more camera motion).
Generate a creative and visually interesting sequence of 2-3 scenes based on the image.
Output ONLY the raw JSON string, with no markdown or other text.`;

  // Wrap the API call with retry logic
  // FIX: Added explicit GenerateContentResponse type to resolve property access errors.
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: {
      parts: [
        {
          inlineData: {
            data: image.data,
            mimeType: image.mimeType,
          },
        },
        {
          text: `Create a detailed JSON video prompt that animates this image. The aspect ratio is ${aspectRatio}.`,
        },
      ],
    },
    config: {
      systemInstruction: systemInstruction,
      responseMimeType: 'application/json',
    },
  }));

  return response.text.trim();
};

// Helper to decode base64 string to Uint8Array
const decode = (base64: string): Uint8Array => {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
};

// Helper for writing strings to a DataView
const writeString = (view: DataView, offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

// Helper to wrap raw PCM data in a WAV header
const createWavBlobFromPcm = (pcmData: Uint8Array): Blob => {
    const sampleRate = 24000; // Standard for gemini-2.5-flash-preview-tts
    const numChannels = 1;
    const bitsPerSample = 16; // The API returns 16-bit PCM
    
    const blockAlign = numChannels * (bitsPerSample / 8);
    const byteRate = sampleRate * blockAlign;
    const dataSize = pcmData.length;

    const buffer = new ArrayBuffer(44 + dataSize);
    const view = new DataView(buffer);

    // RIFF chunk descriptor
    writeString(view, 0, 'RIFF');
    view.setUint32(4, 36 + dataSize, true);
    writeString(view, 8, 'WAVE');
    // FMT sub-chunk
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Audio format 1=PCM
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, byteRate, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bitsPerSample, true);
    // data sub-chunk
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    // Write PCM data
    new Uint8Array(buffer, 44).set(pcmData);

    return new Blob([view], { type: 'audio/wav' });
};

/**
 * Generates speech from text using a specific voice.
 * @param apiKey The API key.
 * @param script The text to convert.
 * @param voiceName The prebuilt voice to use (e.g., 'Kore', 'Puck').
 * @returns A promise that resolves to an audio Blob in WAV format.
 */
export const generateVoiceOver = async (
  apiKey: string,
  script: string,
  voiceName: string,
): Promise<Blob> => {
  const ai = getGenAIClient(apiKey);
  const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: script }] }],
      config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
              voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceName },
              },
          },
      },
  }));

  const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!base64Audio) {
      throw new Error("TTS generation failed, no audio data was returned from the API.");
  }

  const pcmData = decode(base64Audio);
  return createWavBlobFromPcm(pcmData);
};

/**
 * Generates text-to-speech audio using the Gemini API.
 * @param ai The GoogleGenAI client instance.
 * @param text The text to convert to speech.
 * @returns A promise that resolves to an audio Blob in WAV format.
 */
export const generateTextToSpeech = async (ai: GoogleGenAI, text: string): Promise<Blob> => {
    // FIX: Added explicit GenerateContentResponse type to resolve property access errors.
    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: `Say this with a clear and friendly tone: ${text}` }] }],
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: {
                    // Using a standard, clear voice. 'Puck' is another good option.
                    prebuiltVoiceConfig: { voiceName: 'Kore' },
                },
            },
        },
    }));

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
        throw new Error("TTS generation failed, no audio data was returned from the API.");
    }

    const pcmData = decode(base64Audio);
    return createWavBlobFromPcm(pcmData);
};


/**
 * Generates a video for story-based components, handling the polling loop and progress callbacks.
 * This version accepts an AI client instance directly to integrate with `executeApiCallWithKeyRotation`.
 */
export const generateVideoForStory = async (
  ai: GoogleGenAI,
  model: VeoModel,
  payload: {
    prompt: string;
    image?: { imageBytes: string; mimeType: string };
    config: any;
  },
  logCallback: (msg: string) => void
// FIX: Operation type requires a generic argument.
): Promise<Operation<GenerateVideosResponse>> => {
    const requestPayload: any = {
        model: model,
        prompt: payload.prompt,
        config: payload.config,
    };

    if (payload.image) {
        requestPayload.image = payload.image;
    }

    logCallback("Sending video generation request to the model...");
    // FIX: Operation type requires a generic argument.
    let operation: Operation<GenerateVideosResponse> = await withRetry(() => ai.models.generateVideos(requestPayload));
    logCallback("Request received. Waiting for video processing to start...");

    while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait 10 seconds
        operation = await withRetry(() => ai.operations.getVideosOperation({ operation: operation }));
        logCallback("Polling video generation status...");
    }

    if (operation.error) {
        console.error("Video generation failed with an error:", operation.error);
        // FIX: The type of `operation.error.message` is `unknown`. Cast to string for the Error constructor.
        throw new Error(String(operation.error.message) || "Video generation failed due to an unknown error.");
    }

    logCallback("Video processing complete.");
    return operation;
};

/**
 * Mixes two images based on a text prompt.
 */
export const mixImages = async (
  apiKey: string,
  modelImage: ImageInput,
  productImage: ImageInput,
  prompt: string,
  aspectRatio: ImageAspectRatio,
): Promise<ImageInput> => {
    const ai = getGenAIClient(apiKey);
    const finalPrompt = `${prompt}
Sangat penting: JAGA agar fitur wajah dan etnis model di gambar pertama tetap SAMA persis di hasil akhir.
Buat gambar akhir dalam rasio aspek ${aspectRatio}. Hasil harus fotorealistis dan berkualitas tinggi.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: finalPrompt },
                { inlineData: { data: modelImage.data, mimeType: modelImage.mimeType } },
                { inlineData: { data: productImage.data, mimeType: productImage.mimeType } },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            return {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }
    }
    throw new Error('Model tidak menghasilkan gambar.');
};

/**
 * Mixes a model image, a product image, and a background image.
 */
export const mixImagesWithBackground = async (
  apiKey: string,
  modelImage: ImageInput,
  productImage: ImageInput,
  backgroundImage: ImageInput,
  prompt: string,
  aspectRatio: ImageAspectRatio,
): Promise<ImageInput> => {
    const ai = getGenAIClient(apiKey);
    const finalPrompt = `${prompt}
Sangat penting: Tempatkan model (gambar pertama) yang mengenakan produk (gambar kedua) ke dalam latar belakang yang disediakan (gambar ketiga).
JAGA agar fitur wajah dan etnis model di gambar pertama tetap SAMA persis di hasil akhir.
Buat gambar akhir dalam rasio aspek ${aspectRatio}. Hasil harus fotorealistis dan berkualitas tinggi.`;

    const response: GenerateContentResponse = await withRetry(() => ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
            parts: [
                { text: finalPrompt },
                { inlineData: { data: modelImage.data, mimeType: modelImage.mimeType } },
                { inlineData: { data: productImage.data, mimeType: productImage.mimeType } },
                { inlineData: { data: backgroundImage.data, mimeType: backgroundImage.mimeType } },
            ],
        },
        config: {
            responseModalities: [Modality.IMAGE],
        },
    }));

    for (const part of response.candidates?.[0]?.content?.parts ?? []) {
        if (part.inlineData) {
            return {
                data: part.inlineData.data,
                mimeType: part.inlineData.mimeType,
            };
        }
    }
    throw new Error('Model tidak menghasilkan gambar.');
};