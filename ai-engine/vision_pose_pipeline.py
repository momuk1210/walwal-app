from typing import Dict, List, Tuple
import math

class DogPoseClassifier:
    LABELS = [
        "PLAY_BOW",             # 플레이 바우 (놀자고 유혹)
        "TAIL_WAGGING_FAST",    # 꼬리 빠른 회전/흔들림 (흥분/행복)
        "SNIFFING_GROUND",      # 노즈워크/지면 밀착 탐색
        "FREEZE_ALERT",         # 귀 쫑긋 및 얼음 정지 자세 (경계)
        "SUBMISSIVE_CURL"       # 웅크리기 및 꼬리 안으로 말기 (복종/겁)
    ]

    def classify_behavior(self, keypoints: Dict[str, Tuple[float, float]], tail_velocity: float = 0.0) -> Tuple[str, Dict[str, float]]:
        """
        keypoints 예시 (0.0 ~ 1.0 정규화 좌표):
        {
            'nose': (x, y),
            'throat': (x, y),
            'spine_mid': (x, y),
            'tail_base': (x, y),
            'tail_tip': (x, y),
            'front_paws': (x, y),
            'hind_paws': (x, y)
        }
        """
        nose_y = keypoints.get('nose', (0.5, 0.5))[1]
        tail_base_y = keypoints.get('tail_base', (0.5, 0.5))[1]
        tail_tip_y = keypoints.get('tail_tip', (0.5, 0.5))[1]
        front_paw_y = keypoints.get('front_paws', (0.5, 0.8))[1]
        hind_paw_y = keypoints.get('hind_paws', (0.5, 0.8))[1]

        scores = {label: 0.1 for label in self.LABELS}

        # 1. Play Bow 감지: 앞발/머리가 낮고 엉덩이/꼬리기저가 높은 경우 (y값이 클수록 화면 아래쪽)
        if (nose_y > tail_base_y + 0.15) and (tail_tip_y < tail_base_y):
            scores["PLAY_BOW"] = 0.85

        # 2. 꼬리 흔들림 감지: tail_velocity가 높을 때
        elif tail_velocity > 0.6:
            scores["TAIL_WAGGING_FAST"] = 0.90

        # 3. 노즈워크/지면 밀착: 코가 앞발과 거의 같은 지면 높이일 때
        elif abs(nose_y - front_paw_y) < 0.12:
            scores["SNIFFING_GROUND"] = 0.80

        # 4. 꼬리 말림/웅크림: 꼬리 끝이 꼬리 기저 아래쪽으로 깊게 말려 들어갈 때
        elif tail_tip_y > tail_base_y + 0.1:
            scores["SUBMISSIVE_CURL"] = 0.85

        # 5. 경계 정지: 기본 상태에서 꼬리가 수평/직립이고 움직임 정지
        else:
            scores["FREEZE_ALERT"] = 0.70

        # Softmax normalization
        total = sum(math.exp(v) for v in scores.values())
        probs = {k: round(math.exp(v) / total, 3) for k, v in scores.items()}
        top_label = max(probs, key=probs.get)
        return top_label, probs
