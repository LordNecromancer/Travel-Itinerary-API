import { updateFirestore } from './firestoreService.ts';
// This function first generates an itinerary. It then updates the firestore based on wether it could successfully generate it or not.
export async function handleAsyncJob(
  LLMApiKey: string,
  firestoreApiKey: string,
  jobId: string,
  destination: string,
  durationDays: number
) {
  try {
    const itinerary = await generateItinerary(LLMApiKey, destination, durationDays);

    if (!itinerary) throw new Error('Itinerary generation failed after retries.');

    await updateFirestore(firestoreApiKey, jobId, {
      status: 'completed',
      completedAt: new Date(),
      itinerary,
      error: null,
    });
  } catch (err: any) {
    await updateFirestore(firestoreApiKey, jobId, {
      status: 'failed',
      completedAt: new Date(),
      itinerary: [],
      error: err.message || 'Unknown error',
    });
  }
}
// A function to contact gpt-4o to generate a structured itinerary json based on location and number of days. 
// If itinerary generation fails, a retry mechanism is implemented with exponential delay to ask the LLM for response.
export async function generateItinerary(apiKey: string, destination: string, durationDays: number) {
  const prompt = `Create a structured travel itinerary in JSON format for ${durationDays} days in ${destination}. 
  Each day must have a theme and 3 activities (morning, afternoon, evening), with a description and location. 
  Return strictly the JSON that matches this schema: 
  [{"day": 1, "theme": "string", "activities": [{"time": "Morning", "description": "string", "location": "string"}]}]`;

  const API_ENDPOINT = 'https://api.openai.com/v1/chat/completions';
  const MAX_RETRIES = 3;
  const BASE_DELAY_MS = 500;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`LLM request attempt ${attempt}...`);

      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const rawText = data.choices[0].message.content.trim();
      const cleanedText = rawText.replace(/^```json\s*/i, '').replace(/```$/, '');
      return JSON.parse(cleanedText);
    } catch (error) {
      console.error(`Error fetching from OpenAI (attempt ${attempt}):`, error);

      if (attempt < MAX_RETRIES) {
        const delay = BASE_DELAY_MS * Math.pow(2, attempt - 1);
        await new Promise((res) => setTimeout(res, delay));
      } else {
        return null;
      }
    }
  }
}
