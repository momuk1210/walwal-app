import { GoogleGenAI } from '@google/genai';
import { ollamaService } from './ollamaService';
import { getSpontaneousScenario, DogBehaviorState } from '../data/arScenarios';

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

export interface FrameVisualMetrics {
  hasSubject: boolean;
  stdDev: number;
  avgEdge: number;
  meanLum: number;
  isUniform: boolean;
}

/**
 * 프레임 픽셀 데이터를 분석하여 피사체(강아지 등)의 시각적 존재 여부를 판정합니다.
 * 빈 벽, 천장, 바닥, 카메라 덮임(암전/백화) 상태를 즉시 감지합니다.
 */
export function computeFrameVisualMetrics(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  motionCount: number = 0,
  audioVol: number = 0
): FrameVisualMetrics {
  const N = width * height;
  if (!data || N === 0) {
    return { hasSubject: false, stdDev: 0, avgEdge: 0, meanLum: 0, isUniform: true };
  }

  let sumLum = 0;
  let sumSqLum = 0;
  let edgeSum = 0;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * width;
    for (let x = 0; x < width; x++) {
      const idx = (rowOffset + x) * 4;
      const lum = (data[idx] * 299 + data[idx + 1] * 587 + data[idx + 2] * 114) / 1000;
      sumLum += lum;
      sumSqLum += lum * lum;

      if (x < width - 1) {
        const rightLum = (data[idx + 4] * 299 + data[idx + 5] * 587 + data[idx + 6] * 114) / 1000;
        edgeSum += Math.abs(lum - rightLum);
      }
      if (y < height - 1) {
        const downLum = (data[idx + width * 4] * 299 + data[idx + width * 4 + 1] * 587 + data[idx + width * 4 + 2] * 114) / 1000;
        edgeSum += Math.abs(lum - downLum);
      }
    }
  }

  const meanLum = sumLum / N;
  const variance = Math.max(0, (sumSqLum / N) - (meanLum * meanLum));
  const stdDev = Math.sqrt(variance);
  const avgEdge = edgeSum / (N * 2);

  // 1. 렌즈 가림(암전 < 10) 또는 직사광선/백화(> 245)
  const isExtremeLum = meanLum < 10 || meanLum > 245;
  // 2. 단색조 평면 (빈 벽, 단색 바닥, 매끄러운 책상): 분산 < 14, 에지 < 4.5
  const isLowTexture = stdDev < 14.0 && avgEdge < 4.5;
  const hasMotionOrSound = motionCount > 25 || audioVol > 55;

  const isUniform = isExtremeLum || (isLowTexture && !hasMotionOrSound);
  const hasSubject = !isUniform;

  return {
    hasSubject,
    stdDev,
    avgEdge,
    meanLum,
    isUniform
  };
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

let quotaExhaustedUntil: number = 0;
let lastSpontaneousThought: string = '';

/**
 * 카메라 화면을 분석하여 실제 강아지 유무 및 자세/행동에 기반한 속마음을 반환합니다.
 * - 피사체(강아지)가 없거나 빈 벽일 경우: '카메라에 강아지를 비춰주세요' 반환 (절대 대사 날조 금지)
 * - 강아지가 존재할 경우: Gemini AI 또는 상황 인지 행동 엔진을 통해 즉흥적이고 생생한 속마음 출력
 */
export async function generateDogThought(
  language: string = 'ko',
  frameImageBase64?: string,
  behaviorState: DogBehaviorState = 'calm',
  metrics?: FrameVisualMetrics
): Promise<DogThoughtAnalysis> {
  const cfg = LANG_CONFIG[language] || LANG_CONFIG.ko;

  // 1. 시각적 메트릭상 피사체가 없는 경우 (빈 벽, 바닥, 어두움 등): AI 대사 출력 금지
  if (metrics && !metrics.hasSubject) {
    return {
      thought: cfg.noDogThought,
      tag: cfg.noDogTag,
      isDogDetected: false
    };
  }

  // 프레임이 아예 없으면 미감지 처리
  if (!frameImageBase64) {
    return {
      thought: cfg.noDogThought,
      tag: cfg.noDogTag,
      isDogDetected: false
    };
  }

  // 2. 로컬 Ollama AI 서버 (LLaVA 멀티모달) 우선 시도
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

  // 3. Google Gemini API 멀티모달 비전 분석
  if (ai) {
    try {
      const cleanBase64 = frameImageBase64.replace(/^data:image\/[a-z]+;base64,/, '');

      const prompt = `
You are an AI dog behavior analyst and thought translator.
Examine this camera image:

[TASK 1: Dog Presence Check]
- Check whether a pet dog, puppy, or canine is visibly present in the frame (including face, head, furry body, paws, tail, side/rear angles, or lying down).
- If there is NO dog in the frame (e.g. empty room, blank wall, bare floor, furniture, objects, hands, human only with no pet dog):
  You MUST return:
  {"isDogDetected": false, "tag": "${cfg.noDogTag}", "thought": "${cfg.noDogThought}"}
- If a dog is visibly present:
  Proceed to TASK 2.

[TASK 2: Dog Thought Translation (ONLY IF A DOG IS DETECTED)]
- Create a witty, natural 1-sentence inner monologue in ${cfg.promptGuide} reflecting the dog's posture, action, or expression.
- Length: under 15 characters (Korean/Japanese) or under 10 words (English/Spanish).
- Emotion tag in target language (${cfg.tagExamples}).
- Return:
  {"isDogDetected": true, "tag": "EmotionTag", "thought": "DogThought"}

Output ONLY valid JSON without markdown:
{"isDogDetected": boolean, "tag": string, "thought": string}
`;

      let response: any = null;
      const candidateModels = [
        'gemini-flash-lite-latest',
        'gemini-3.5-flash-lite',
        'gemini-3.1-flash-lite',
        'gemini-3.7-flash'
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
              temperature: 0.3,
            }
          });

          // 응답 지연 방어: 4초 초과 시 다음 빠른 모델로 폴백
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error(`Timeout for ${model}`)), 4000)
          );

          response = await Promise.race([apiCall, timeoutPromise]);
          if (response) break;
        } catch (err: any) {
          console.warn(`Gemini Vision model ${model} failed, trying fallback:`, err?.message || err);
          continue;
        }
      }

      if (response) {
        const raw = response.text?.trim() || '';
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
      }
    } catch (error) {
      console.error("Gemini Vision failed:", error);
    }
  }

  // 4. 비전 분석 실패 시(네트워크 장애, 429 등)에도 개가 없는데 강아지 대사를 날조하지 않고 안전하게 미감지 반환
  return {
    thought: cfg.noDogThought,
    tag: cfg.noDogTag,
    isDogDetected: false
  };
}
