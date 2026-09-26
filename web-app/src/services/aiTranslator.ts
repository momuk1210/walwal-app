import { GoogleGenAI } from '@google/genai';

// Initialize the SDK. It will automatically pick up VITE_GEMINI_API_KEY if we pass it,
// but since this is a Vite environment (browser), we need to pass the key explicitly.
// In a real production app, this should be called from a secure backend to hide the key.
const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export async function generateDogThought(
  dogName: string,
  breed: string,
  age: number,
  behaviorState: 'bark' | 'whine' | 'growl' | 'active' | 'calm',
  language: string = 'ko'
): Promise<string> {
  if (!ai) {
    console.warn("Gemini API Key is missing. Returning fallback text.");
    return fallbackTranslation(behaviorState, language);
  }

  const prompt = `
You are a highly intelligent dog behavior translator AI.
You are translating the thoughts of a dog based on its current behavior state.

Dog Information:
- Name: ${dogName}
- Breed: ${breed}
- Age: ${age} years old
- Current State: ${behaviorState} (bark: barking loudly, whine: whining/crying, growl: growling, active: moving a lot, calm: sitting/resting)

Instructions:
1. Write a SINGLE, short sentence (max 15 words) expressing what the dog is thinking right now.
2. The tone should match a dog's personality (playful, loyal, or demanding).
3. If the state is 'bark', make it sound urgent or demanding. If 'calm', make it peaceful.
4. MUST output in the following language code: ${language}.
5. Do not include quotes around the sentence. Just the sentence itself.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        temperature: 0.9,
      }
    });
    
    return response.text?.trim() || fallbackTranslation(behaviorState, language);
  } catch (error) {
    console.error("Failed to generate dog thought via Gemini:", error);
    return fallbackTranslation(behaviorState, language);
  }
}

function fallbackTranslation(state: string, lang: string): string {
  // If API fails or key is missing, return a generic translated fallback
  if (lang === 'ko') {
    if (state === 'bark') return "누구야! 내 구역에 오지 마 멍!";
    if (state === 'calm') return "아함~ 졸리고 편안하다 멍~";
    if (state === 'active') return "놀자! 빨리 간식 줘 멍멍!";
    return "집사야 나 심심해 멍!";
  }
  // Default EN fallback
  if (state === 'bark') return "Who's there?! Stay away! Woof!";
  if (state === 'calm') return "Yawn... I'm so relaxed right now.";
  if (state === 'active') return "Let's play! Give me treats!";
  return "Hey human, I'm bored!";
}
