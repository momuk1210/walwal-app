/**
 * 로컬 Ollama + LLaVA 멀티모달 AI 연동 서비스 (웹 브라우저용)
 * Vite 개발 서버의 /ollama 프록시를 통해 CORS 없이 http://localhost:11434 와 통신
 */

export interface OllamaStatus {
  isConnected: boolean;
  models: string[];
}

export class OllamaService {
  private static instance: OllamaService;
  private isChecking: boolean = false;
  private lastCheckTime: number = 0;
  private cachedStatus: OllamaStatus = { isConnected: false, models: [] };

  public static getInstance(): OllamaService {
    if (!OllamaService.instance) {
      OllamaService.instance = new OllamaService();
    }
    return OllamaService.instance;
  }

  /**
   * Ollama 서버 연결 및 멀티모달 모델(llava 등) 존재 여부 확인
   */
  public async checkStatus(): Promise<OllamaStatus> {
    const now = Date.now();
    // 3초 내 재요청 시 캐시 반환
    if (now - this.lastCheckTime < 3000 && this.cachedStatus.isConnected) {
      return this.cachedStatus;
    }

    if (this.isChecking) return this.cachedStatus;
    this.isChecking = true;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);

      const res = await fetch('/ollama/api/tags', {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const models = (data.models || []).map((m: any) => m.name || m.model || '');
        this.cachedStatus = {
          isConnected: true,
          models
        };
      } else {
        this.cachedStatus = { isConnected: false, models: [] };
      }
    } catch (_) {
      this.cachedStatus = { isConnected: false, models: [] };
    } finally {
      this.isChecking = false;
      this.lastCheckTime = Date.now();
    }

    return this.cachedStatus;
  }

  /**
   * 캡처된 카메라 이미지(Base64)를 LLaVA에 전송하여 실제 피사체를 실시간 분석
   */
  public async generateDogThought(
    base64DataUrlOrRaw: string,
    modelName: string = 'llava',
    language: string = 'ko'
  ): Promise<{ thought: string; tag: string; isDogDetected: boolean } | null> {
    try {
      // Data URL 접두사 제거
      const cleanBase64 = base64DataUrlOrRaw.replace(/^data:image\/[a-z]+;base64,/, '');

      const langRules = {
        ko: {
          noDogTag: "강아지 찾는 중",
          noDogThought: "카메라에 강아지를 비춰주세요",
          guide: "Korean (playful dog 1st person monologue under 15 characters, e.g. 멍!)"
        },
        en: {
          noDogTag: "Searching for dog",
          noDogThought: "Please point camera at a dog",
          guide: "English (short dog monologue under 10 words, e.g. Woof!)"
        },
        ja: {
          noDogTag: "犬を探しています",
          noDogThought: "カメラにワンちゃんを映してください",
          guide: "Japanese (natural dog monologue under 15 characters, e.g. ワン！)"
        },
        es: {
          noDogTag: "Buscando perro",
          noDogThought: "Por favor enfoca a un perro",
          guide: "Spanish (short dog monologue under 10 words, e.g. ¡Guau!)"
        }
      }[language] || {
        noDogTag: "강아지 찾는 중",
        noDogThought: "카메라에 강아지를 비춰주세요",
        guide: "Korean (playful dog monologue under 15 characters)"
      };

      const prompt =
        "Examine this camera image carefully. Is there a dog, puppy, or pet canine visible in this photo (including moving, side/back angles, or partial)? " +
        `If there is truly NO dog (e.g. wall, floor, ceiling, desk, room, objects, human with no pet): output JSON: {"isDogDetected": false, "tag": "${langRules.noDogTag}", "thought": "${langRules.noDogThought}"}. ` +
        `If a dog is visible: observe its posture and facial expression, and generate a short, witty 1-sentence inner thought in ${langRules.guide}. ` +
        'output JSON: {"isDogDetected": true, "tag": "EmotionTag", "thought": "ShortDogThought"}. ' +
        "Output ONLY the JSON string without any markdown formatting.";

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // 20초 타임아웃

      const res = await fetch('/ollama/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: modelName,
          prompt,
          images: [cleanBase64],
          stream: false,
          options: {
            temperature: 0.3,
            num_predict: 100
          }
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const responseText = data.response?.trim();
        if (responseText) {
          const match = responseText.match(/\{[\s\S]*\}/);
          if (match) {
            try {
              const parsed = JSON.parse(match[0]);
              const detected = Boolean(parsed.isDogDetected);
              if (detected && parsed.thought && parsed.thought !== langRules.noDogThought) {
                return {
                  thought: parsed.thought.replace(/^["'「\s]+|["'」\s]+$/g, ''),
                  tag: parsed.tag || "관찰 중",
                  isDogDetected: true
                };
              } else {
                return {
                  thought: langRules.noDogThought,
                  tag: langRules.noDogTag,
                  isDogDetected: false
                };
              }
            } catch (_) { }
          }
        }
      }
      return {
        thought: langRules.noDogThought,
        tag: langRules.noDogTag,
        isDogDetected: false
      };
    } catch (err) {
      console.warn('Ollama generate error:', err);
      return null;
    }
  }
}

export const ollamaService = OllamaService.getInstance();
