from typing import Dict, List, Any
from audio_pipeline import DogAudioClassifier
from vision_pose_pipeline import DogPoseClassifier

class WalWalMultimodalEngine:
    def __init__(self):
        self.audio_classifier = DogAudioClassifier()
        self.pose_classifier = DogPoseClassifier()

    def analyze_moment(
        self,
        audio_features: Dict[str, float],
        keypoints: Dict[str, Any],
        tail_velocity: float,
        personality_tags: List[str],
        locale: str = "ko_KR"
    ) -> Dict[str, Any]:
        audio_label, audio_probs = self.audio_classifier.predict(audio_features)
        pose_label, pose_probs = self.pose_classifier.classify_behavior(keypoints, tail_velocity)

        # 멀티모달 상태 판별
        composite_emotion = self._fuse_emotions(audio_label, pose_label)
        
        # 프롬프트 생성 (LLM 텍스트 생성용)
        llm_prompt = self._build_llm_prompt(composite_emotion, personality_tags, locale)
        
        # 임시 LLM 목업 호출 (실제 연동 시 API 호출로 대체)
        quip = self._mock_llm_call(llm_prompt, locale, composite_emotion, personality_tags)

        return {
            "detected_audio": audio_label,
            "detected_pose": pose_label,
            "composite_emotion": composite_emotion,
            "speech_quip": quip,
            "llm_prompt_used": llm_prompt, # 디버깅용
            "confidence": round((audio_probs[audio_label] + pose_probs[pose_label]) / 2.0, 2)
        }

    def _fuse_emotions(self, audio: str, pose: str) -> str:
        if pose == "PLAY_BOW" or (audio == "BARK_JOY" and pose == "TAIL_WAGGING_FAST"):
            return "SUPER_EXCITED"
        if audio == "GROWL" or pose == "FREEZE_ALERT":
            return "ON_GUARD"
        if pose == "SNIFFING_GROUND":
            return "CURIOUS_INVESTIGATOR"
        if audio == "WHIMPER" or pose == "SUBMISSIVE_CURL":
            return "ANXIOUS_BEGGING"
        return "HAPPY_CHILL"

    def _build_llm_prompt(self, emotion: str, tags: List[str], locale: str) -> str:
        return f"""
현재 강아지의 멀티모달 감정 상태는 '{emotion}'이며, 
성격 태그는 {tags}입니다.
이 정보를 바탕으로 강아지의 현재 생각이나 하고 싶은 말을 위트 있게 1~2문장으로 작성해 주세요.
반드시 [{locale}] 언어로 작성해야 하며, 해당 국가의 펫팸족들이 자주 사용하는 자연스러운 구어체와 슬랭을 포함하여 유머러스하게 의역해 주세요.
"""

    def _mock_llm_call(self, prompt: str, locale: str, emotion: str, tags: List[str]) -> str:
        # 실제 LLM 연동 전까지 locale에 따른 더미 응답 반환
        lang = locale.split('_')[0] if '_' in locale else locale
        
        is_inssa = any("인싸" in t for t in tags)
        
        if emotion == "SUPER_EXCITED":
            if lang == 'en': return "Yoo-hoo! Calling all the doggos in the hood! I'm hosting a paw-ty today, bark! 🚀" if is_inssa else "My heart's going thump-thump! I'm off to catch that flying butterfly, woof! ✨"
            elif lang == 'ja': return "ヤッホー！近所のワンちゃんたち、みんな集まれ！今日は僕がパーティーの主催者だ、ワン！🚀" if is_inssa else "ドキドキ！あそこ飛んでる蝶々捕まえに出動するワン！✨"
            elif lang == 'es': return "¡Yuhu! ¡Llamando a todos los perritos del barrio! ¡Hoy yo organizo la fiesta, guau! 🚀" if is_inssa else "¡Mi corazón hace pum-pum! Voy a atrapar esa mariposa voladora, ¡guau! ✨"
            else: return "야호! 온 동네 댕댕이들아 다 나와라! 오늘 파티는 내가 주최한다 왈왈! 🚀" if is_inssa else "심장이 콩닥콩닥! 저기 날아가는 나비 잡으러 출동한다 멍! ✨"
            
        return "햇살 따스하고 잔디 푹신하고~ 오늘 산책 코스 10점 만점에 100점이다 멍! ☀️"
