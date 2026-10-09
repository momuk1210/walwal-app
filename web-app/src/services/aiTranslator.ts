import { GoogleGenAI } from '@google/genai';
import { ollamaService } from './ollamaService';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({ apiKey });
}

export interface DogThoughtAnalysis {
  thought: string;
  tag: string;
  isDogDetected: boolean;
}

export const LANG_CONFIG: Record<string, {
  noDogThought: string;
  noDogTag: string;
  observingTag: string;
  fallbackThought: string;
  fallbackTag: string;
  promptGuide: string;
  tagExamples: string;
  thoughtExamples: string;
}> = {
  ko: {
    noDogThought: "카메라에 강아지를 비춰주세요",
    noDogTag: "강아지 찾는 중",
    observingTag: "관찰 중",
    fallbackThought: "간식 줄 거야? 멍멍!",
    fallbackTag: "호기심",
    promptGuide: "한국어 댕댕이 1인칭 구어체 (15자 내외, 예: 멍!, 왈!)",
    tagExamples: "호기심, 나른함, 간식 갈망, 경계, 신남",
    thoughtExamples: "뭘 봐? 간식 줄 거야? 멍!, 졸려 죽겠는데 왜 깨워..., 산책 언제가? 빨리 나가자!"
  },
  en: {
    noDogThought: "Please point camera at a dog",
    noDogTag: "Searching for dog",
    observingTag: "Observing",
    fallbackThought: "Got treats for me? Woof!",
    fallbackTag: "Curious",
    promptGuide: "natural English dog monologue (short, under 10 words, e.g. Woof!)",
    tagExamples: "Curious, Sleepy, Hungry, Alert, Excited",
    thoughtExamples: "Whatcha looking at? Give me treats!, So sleepy... let me nap!, Walkies time? Let's go!"
  },
  ja: {
    noDogThought: "カメラにワンちゃんを映してください",
    noDogTag: "犬を探しています",
    observingTag: "観察中",
    fallbackThought: "おやつくれるの？ワン！",
    fallbackTag: "好奇心",
    promptGuide: "自然な日本語の犬の話し言葉 (15文字以内、例: ワン！)",
    tagExamples: "好奇心, まったり, おやつ待ち, 警戒, ワクワク",
    thoughtExamples: "何見てるの？おやつくれる？ワン！, 眠いから起こさないで…ワン！, 散歩いつ行くの？早く行こう！"
  },
  es: {
    noDogThought: "Por favor enfoca a un perro",
    noDogTag: "Buscando perro",
    observingTag: "Observando",
    fallbackThought: "¿Tienes premios para mí? ¡Guau!",
    fallbackTag: "Curioso",
    promptGuide: "Español coloquial de perro (máximo 10 palabras, ej: ¡Guau!)",
    tagExamples: "Curioso, Con sueño, Con hambre, Alerta, Feliz",
    thoughtExamples: "¿Qué miras? ¡Dame un premio! ¡Guau!, Tengo sueño... ¡no me despiertes!, ¿Cuándo salimos de paseo? ¡Vamos ya!"
  },
  zh: {
    noDogThought: "请将摄像头对准狗狗",
    noDogTag: "寻找狗狗中",
    observingTag: "观察中",
    fallbackThought: "要给我零食吗？汪汪！",
    fallbackTag: "好奇",
    promptGuide: "自然的中文狗狗第一人称心声口语（15字以内，例如：汪！汪呜！）",
    tagExamples: "好奇, 慵懒, 渴望零食, 警惕, 兴奋",
    thoughtExamples: "看什么呢？要给我好吃的吗？汪！, 困死了别吵我睡觉…, 什么时候去遛弯？快出门吧！"
  },
  fr: {
    noDogThought: "Veuillez pointer la caméra vers un chien",
    noDogTag: "Recherche de chien",
    observingTag: "En observation",
    fallbackThought: "Tu as une friandise ? Ouaf !",
    fallbackTag: "Curieux",
    promptGuide: "Monologue intérieur naturel de chien en français (moins de 10 mots, ex: Ouaf !)",
    tagExamples: "Curieux, Somnolent, Gourmand, Alerte, Excité",
    thoughtExamples: "Qu'est-ce que tu regardes ? Donne une friandise !, Trop sommeil... laisse-moi dormir !, Quand est-ce qu'on se promène ? Allons-y !"
  }
};

/**
 * 카메라 화면을 보고 실제 피사체(강아지 유무, 실제 견종, 자세, 표정)를 실시간 분석하여
 * 사용자가 선택한 언어(ko, en, ja, es)로 짧고 직관적인 1문장 속마음을 반환합니다.
 */
export async function generateDogThought(
  language: string = 'ko',
  frameImageBase64?: string
): Promise<DogThoughtAnalysis> {
  const cfg = LANG_CONFIG[language] || LANG_CONFIG.ko;

  // 프레임이 아예 없으면 즉시 미감지 처리
  if (!frameImageBase64) {
    return {
      thought: cfg.noDogThought,
      tag: cfg.noDogTag,
      isDogDetected: false
    };
  }

  // 1. 로컬 Ollama AI 서버 (LLaVA 멀티모달) 우선 시도
  try {
    const ollamaStatus = await ollamaService.checkStatus();
    if (ollamaStatus.isConnected) {
      const activeModel = ollamaStatus.models.find(m => m.includes('llava')) || ollamaStatus.models[0] || 'llava';
      const result = await ollamaService.generateDogThought(frameImageBase64, activeModel, language);
      if (result) return result;
    }
  } catch (err) {
    console.warn("Local Ollama check failed, trying Gemini / fallback:", err);
  }

  // 2. Google Gemini API 멀티모달 비전 분석
  if (ai) {
    try {
      const cleanBase64 = frameImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const prompt = `
You are an AI dog behavior analyst and thought translator.
Examine this camera image with STRICT visual verification:

[TASK 1: Dog Presence Check - STRICT]
- Check whether a real, living domestic dog or puppy is visibly present in this frame.
- Only return isDogDetected: true if canine anatomy (such as a dog's face, snout, eyes, ears, body, paws, tail, or fur) is clearly recognizable.
- If there is NO dog in the frame (for example: empty rooms, walls, floors, ceilings, desks, furniture, everyday household objects, screens, keyboards, hands or faces of humans with no dog, or blurry indistinct surfaces):
  You MUST return:
  {"isDogDetected": false, "tag": "${cfg.noDogTag}", "thought": "${cfg.noDogThought}"}
- Do NOT guess, imagine, or hallucinate a dog in textures, shadows, or background noise. If no real dog is present, ALWAYS return isDogDetected: false.

[TASK 2: Dog Thought Translation (ONLY IF A REAL DOG IS DETECTED)]
- If and ONLY IF an actual dog is clearly visible:
  - Assess its posture, facial expression, eyes, and environment to create a witty, natural 1-sentence inner monologue in ${cfg.promptGuide}.
  - Length: under 15 characters (Korean/Japanese) or under 10 words (English/Spanish).
  - Emotion tag in target language (${cfg.tagExamples}).
  - Return:
  {"isDogDetected": true, "tag": "EmotionTag", "thought": "DogThought"}

Output ONLY valid JSON without markdown:
{"isDogDetected": boolean, "tag": string, "thought": string}
`;

      let response: any = null;
      const candidateModels = [
        'gemini-3.1-flash-lite',
        'gemini-3.6-flash',
        'gemini-3.8-flash',
        'gemini-3.5-flash'
      ];
      for (const model of candidateModels) {
        try {
          const apiCall = ai.models.generateContent({
            model,
            contents: [
              {
                inlineData: {
                  mimeType: 'image/jpeg',
                  data: cleanBase64
                }
              },
              prompt
            ],
            config: {
              temperature: 0.3, // 낮은 온도로 환각 방지 및 피사체 판별 정확도 유지
            }
          });

          // 응답 지연 방어: 3.5초 초과 시 다음 빠른 모델로 폴백
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout for ${model}`)), 3500)
          );

          response = await Promise.race([apiCall, timeoutPromise]);
          if (response) break;
        } catch (err: any) {
          console.warn(`Gemini Vision model ${model} failed, trying fallback:`, err?.message || err);
        }
      }

      if (!response) {
        throw new Error("All Gemini Vision candidate models failed");
      }

      const raw = response.text?.trim() || '';
      console.log('[AI Translator Vision Raw]:', raw);

      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          const detected = Boolean(parsed.isDogDetected);
          if (detected && parsed.thought && parsed.thought !== cfg.noDogThought) {
            return {
              thought: parsed.thought.replace(/^["'「\s]+|["'」\s]+$/g, ''),
              tag: parsed.tag || cfg.observingTag,
              isDogDetected: true
            };
          } else {
            return {
              thought: cfg.noDogThought,
              tag: cfg.noDogTag,
              isDogDetected: false
            };
          }
        } catch (_) { }
      }
    } catch (error) {
      console.error("Gemini Vision failed:", error);
    }
  }

  // 3. 비전 분석 실패 시(네트워크 장애 등)에도 개가 없는데 강아지 대사를 날조하지 않고 안전하게 미감지 반환
  return {
    thought: cfg.noDogThought,
    tag: cfg.noDogTag,
    isDogDetected: false
  };
}
