from typing import Dict, List, Tuple

BREED_ETHOLOGY_CONFIG = {
    'GOLDEN_RETRIEVER': {
        'name_kr': '골든 리트리버',
        'tone': '다정다감 파워인싸, 인류애 1000%',
        'bias_multipliers': {
            'SUPER_EXCITED': 1.8,
            'HAPPY_CHILL': 1.5,
            'ON_GUARD': 0.3,
            'ANXIOUS_BEGGING': 1.1,
            'CURIOUS_INVESTIGATOR': 1.2
        },
        'quips': {
            'SUPER_EXCITED': '와! 저기 지나가는 인간도 내 친구, 저기 날아가는 나비도 내 친구! 세상은 너무 아름다워!! 💖',
            'ON_GUARD': '어? 낯선 사람이다! 빨리가서 꼬리 흔들면서 안아달라고 해야지 헤헤',
            'CURIOUS_INVESTIGATOR': '이 냄새는... 옆 동네 친구가 다녀간 냄새다! 친구야 어디 있니?',
            'ANXIOUS_BEGGING': '집사야 손에 든 거 나 한 입만 주면 내가 오늘 하루 종일 뽀뽀해줄게 응?',
            'HAPPY_CHILL': '햇살 좋고 풀냄새 좋고 집사 다리 튼튼하고! 인생 참 행복하다 멍!'
        }
    },
    'SHIBA_INU': {
        'name_kr': '시바견',
        'tone': '시크 마이웨이, 철벽 보안관, 안가시바',
        'bias_multipliers': {
            'ON_GUARD': 2.4,
            'CURIOUS_INVESTIGATOR': 1.6,
            'SUPER_EXCITED': 0.4,
            'HAPPY_CHILL': 1.1,
            'ANXIOUS_BEGGING': 0.5
        },
        'quips': {
            'ON_GUARD': '너 나한테 관심 갖지 마라. 눈 마주쳤다고 친구 먹을 생각 하지 마. 🕶️',
            'SUPER_EXCITED': '흥, 내가 꼬리 흔든 건 기분이 좋아서가 아니라 반동 추진력 때문이다.',
            'CURIOUS_INVESTIGATOR': '저 냄새... 수상하다. 이 구역 안전은 내가 검증하기 전까진 한 발짝도 못 간다.',
            'ANXIOUS_BEGGING': '간식을 달라고 애원하는 게 아니다. 네가 간식을 바칠 기회를 주는 거다.',
            'HAPPY_CHILL': '집사야 줄 당기지 마라. 난 여기서 10분 더 명상할 거다. 안 가 시바.'
        }
    },
    'MALTESE': {
        'name_kr': '말티즈',
        'tone': '말티즈는 참지않긔, 집사 독점욕, 앙칼진 귀요미',
        'bias_multipliers': {
            'SUPER_EXCITED': 1.6,
            'ON_GUARD': 1.9,
            'ANXIOUS_BEGGING': 1.5,
            'CURIOUS_INVESTIGATOR': 0.9,
            'HAPPY_CHILL': 0.7
        },
        'quips': {
            'ON_GUARD': '말티즈는 참지 않아! 저기 큰 개 나 쳐다본 거 맞아? 내가 가서 혼내줄까?! 💢',
            'SUPER_EXCITED': '집사야 나만 봐! 딴 개 보지 마! 내가 세상에서 제일 예쁘단 말이야 앙앙!!',
            'CURIOUS_INVESTIGATOR': '뭐야 저 수상한 냄새? 내 허락도 없이 우리 동네에 냄새를 흘려?',
            'ANXIOUS_BEGGING': '지금 당장 간식 안 주면 오늘 밤에 침대 모퉁이 물어뜯을 거야 협박 아님.',
            'HAPPY_CHILL': '내가 가만히 있는 건 착해서가 아니라 졸려서다. 잘 받들어 모셔라.'
        }
    },
    'WELSH_CORGI': {
        'name_kr': '웰시코기',
        'tone': '숏다리 프라이드, 식탐 대마왕, 하체 그루브',
        'bias_multipliers': {
            'SUPER_EXCITED': 1.7,
            'CURIOUS_INVESTIGATOR': 1.5,
            'ANXIOUS_BEGGING': 1.8,
            'HAPPY_CHILL': 1.0,
            'ON_GUARD': 0.7
        },
        'quips': {
            'SUPER_EXCITED': '다리는 짧아도 내 엉덩이 모터 회전수는 분당 3000RPM이다 씰룩씰룩! 🍞',
            'ON_GUARD': '다리 길다고 유세 떨지 마라! 내 무게중심이 훨씬 안정적이다 컹컹!',
            'CURIOUS_INVESTIGATOR': '킁킁... 300미터 밖 빵집에서 버터 굽는 냄새가 난다! 집사야 방향 틀어라!',
            'ANXIOUS_BEGGING': '다리가 짧아서 배가 땅에 닿겠다... 식량 보충이 시급하다 집사야 🍖',
            'HAPPY_CHILL': '식빵 굽기 딱 좋은 잔디 온도네. 5분만 누워서 광합성 때린다.'
        }
    },
    'POMERANIAN': {
        'name_kr': '포메라니안',
        'tone': '솜뭉치 맹수, 극대노 허세, 털 팽창',
        'bias_multipliers': {
            'ON_GUARD': 2.0,
            'SUPER_EXCITED': 1.6,
            'ANXIOUS_BEGGING': 1.2,
            'CURIOUS_INVESTIGATOR': 0.8,
            'HAPPY_CHILL': 0.6
        },
        'quips': {
            'ON_GUARD': '나 솜사탕 아니다! 맹수다! 어흥! 비둘기 너 내 구역에서 꺼져 앙앙! 🦁',
            'SUPER_EXCITED': '내 털 120% 부풀었다! 이 압도적인 카리스마에 다들 기절하겠지?! ☁️',
            'CURIOUS_INVESTIGATOR': '저기 뭐 있는 거야? 무섭진 않은데 집사 네가 먼저 가서 확인해봐.',
            'ANXIOUS_BEGGING': '나 안아줘! 땅바닥에 흙 묻으면 내 솜뭉치 털 망가진단 말이야 힝...',
            'HAPPY_CHILL': '오늘 미용 완벽하고 바람 각도 예술이네. 내 미모에 취한다.'
        }
    }
}

class BreedEthologyEngine:
    def adjust_prediction(self, breed_key: str, raw_emotion: str, raw_confidence: float) -> Tuple[str, str, float]:
        breed_info = BREED_ETHOLOGY_CONFIG.get(breed_key, BREED_ETHOLOGY_CONFIG['GOLDEN_RETRIEVER'])
        multipliers = breed_info['bias_multipliers']

        # 가중치 재계산 (동일 꼬리흔들기/포즈라도 시바견은 경계 가중치가 높음)
        adjusted_emotion = raw_emotion
        if breed_key == 'SHIBA_INU' and raw_emotion in ['SUPER_EXCITED', 'HAPPY_CHILL']:
            adjusted_emotion = 'ON_GUARD'
        elif breed_key == 'GOLDEN_RETRIEVER' and raw_emotion == 'ON_GUARD':
            adjusted_emotion = 'SUPER_EXCITED'

        quip = breed_info['quips'].get(adjusted_emotion, breed_info['quips']['HAPPY_CHILL'])
        adjusted_conf = min(0.98, raw_confidence * multipliers.get(adjusted_emotion, 1.0) / 1.5)

        return adjusted_emotion, quip, round(adjusted_conf, 2)
