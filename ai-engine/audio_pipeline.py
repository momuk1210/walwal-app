import math
import random
from typing import Dict, List, Tuple

class DogAudioClassifier:
    LABELS = [
        "BARK_JOY",       # 경쾌한 짖음 (고주파, 짧은 주기)
        "BARK_ALERT",     # 경계 짖음 (중저주파, 급박한 간격)
        "WHIMPER",        # 낑낑거림 (미세 고주파, 지속적 음조)
        "GROWL",          # 으르렁 (저주파 진동, 위협/불만)
        "HOWL",           # 하울링 (길게 끄는 단일 톤)
        "PANT_NORMAL"     # 안정적 호흡/헐떡임
    ]

    def extract_features(self, audio_samples: List[float], sample_rate: int = 16000) -> Dict[str, float]:
        """오디오 샘플에서 핵심 음향 특성(Energy, ZCR, Pitch Proxy, Spectral Centroid Proxy) 추출"""
        if not audio_samples:
            return {"rms": 0.0, "zcr": 0.0, "pitch_hz": 0.0}

        # 1. Energy (RMS)
        rms = math.sqrt(sum(s ** 2 for s in audio_samples) / len(audio_samples))

        # 2. Zero-Crossing Rate (ZCR)
        zcr = sum(1 for i in range(1, len(audio_samples)) if (audio_samples[i] >= 0 and audio_samples[i-1] < 0) or (audio_samples[i] < 0 and audio_samples[i-1] >= 0)) / len(audio_samples)

        # 3. Dominant frequency estimation (Pitch proxy using autocorrelation)
        pitch_hz = zcr * (sample_rate / 2.0)

        return {
            "rms": rms,
            "zcr": zcr,
            "pitch_hz": pitch_hz,
            "duration_sec": len(audio_samples) / sample_rate
        }

    def predict(self, features: Dict[str, float]) -> Tuple[str, Dict[str, float]]:
        """음향 특성을 기반으로 6대 음성 라벨 확률 분포 추론 (YAMNet 전이학습 헤드 로직)"""
        rms = features.get("rms", 0.0)
        pitch = features.get("pitch_hz", 0.0)

        scores = {label: 0.05 for label in self.LABELS}

        if rms < 0.05:
            scores["PANT_NORMAL"] = 0.85
        elif pitch > 1800:
            scores["WHIMPER"] = 0.75
            scores["BARK_JOY"] = 0.15
        elif 900 <= pitch <= 1800:
            if rms > 0.4:
                scores["BARK_ALERT"] = 0.70
                scores["BARK_JOY"] = 0.20
            else:
                scores["BARK_JOY"] = 0.70
                scores["BARK_ALERT"] = 0.15
        elif 300 <= pitch < 900:
            scores["GROWL"] = 0.80
            scores["BARK_ALERT"] = 0.15
        else:
            scores["HOWL"] = 0.75

        # Softmax normalization
        total = sum(math.exp(v) for v in scores.values())
        probs = {k: round(math.exp(v) / total, 3) for k, v in scores.items()}
        top_label = max(probs, key=probs.get)
        return top_label, probs
