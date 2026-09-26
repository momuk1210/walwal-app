export interface BreedDefinition {
  id: string;
  name: string;
  breedKr: string;
  avatar: string;
  tagline: string;
  personalityTags: string[];
  tailWaggingInterpretation: string; // 동일한 꼬리 흔들기 시 견종별 행동학적 의미
  audioBarkInterpretation: string;   // 동일한 짖음 시 견종별 해석
  quipsByEmotion: Record<string, string[]>;
}

export const BREED_DEFINITIONS: BreedDefinition[] = [
  {
    id: 'golden',
    name: '보리',
    breedKr: '골든 리트리버',
    avatar: 'https://images.unsplash.com/photo-1552053831-71594a27632d?w=400&auto=format&fit=crop&q=80',
    tagline: '세상 모든 인간과 댕댕이는 내 친구! 무한 긍정 천사견',
    personalityTags: ['#파워인싸', '#인류애1000%', '#모든인간은친구'],
    tailWaggingInterpretation: '95% 순수한 호의와 반가움 (놀이 유혹)',
    audioBarkInterpretation: '친구가 되고 싶다는 우렁찬 환영 인사',
    quipsByEmotion: {
      excited: [
        '와! 친구다! 당장 놀자! 💖',
        '주머니 소시지 냄새 킁킁! 꼬리 모터 가동! 🚀',
        '나 쓰다듬고 가도 돼 헤헤 ✨'
      ],
      curious: [
        '다른 칭구 냄새난다! 어디 있니?',
        '나비야! 잔디밭 같이 뛸래? 🦋'
      ],
      dramatic: [
        '저 칭구 허그해주고 싶은데 목줄이 너무 짧아... 🥺'
      ]
    }
  },
  {
    id: 'shiba',
    name: '모찌',
    breedKr: '시바견',
    avatar: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400&auto=format&fit=crop&q=80',
    tagline: '너 나한테 관심 갖지 마라. 난 내 길을 간다. 시크 마이웨이',
    personalityTags: ['#시크도도', '#철벽남', '#안가시바', '#엄격한거리두기'],
    tailWaggingInterpretation: '70% 긴장·경계·거리두기 신호 (뻣뻣한 수직 꼬리)',
    audioBarkInterpretation: '자신의 퍼스널 스페이스를 침범하지 말라는 단호한 경고',
    quipsByEmotion: {
      excited: [
        '꼬리 흔드는 거 반동 추진력이다. 오해마라. 🕶️',
        '눈 마주쳤다고 친구 아님. 2미터 유지해.',
        '당기지 마라. 안 간다 시바. 🛑'
      ],
      curious: [
        '리트리버 녀석 너무 해맑네... 안 본 척 한다.',
        '수상한 냄새. 이 구역은 내가 검증한다.'
      ],
      dramatic: [
        '세상은 시끄럽다... 난 흙냄새나 맡을란다.'
      ]
    }
  },
  {
    id: 'maltese',
    name: '뽀삐',
    breedKr: '말티즈',
    avatar: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?w=400&auto=format&fit=crop&q=80',
    tagline: '말티즈는 참지 않아! 집사 독점욕과 당돌한 자기주장',
    personalityTags: ['#말티즈는참지않긔', '#집사독점욕', '#당돌한공주님'],
    tailWaggingInterpretation: '80% 자기주장 및 즉각적인 관심 요구 (빠른 핑퐁)',
    audioBarkInterpretation: '"당장 내 요구를 들어줘라!" 강력한 의사 표시',
    quipsByEmotion: {
      excited: [
        '말티즈는 참지 않아! 나만 봐라 앙! 💢',
        '내 안에 맹수의 피가 흐른다! 🦁',
        '지금 간식 안 주면 이불 뜯는다!'
      ],
      curious: [
        '저 큰 개 뭐야? 내가 혼내줄까?!',
        '내 구역 냄새 누구냐! 당장 나와!'
      ],
      dramatic: [
        '발바닥에 먼지 묻었다! 당장 안아라 집사야 😤'
      ]
    }
  },
  {
    id: 'corgi',
    name: '땅콩',
    breedKr: '웰시코기',
    avatar: 'https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=400&auto=format&fit=crop&q=80',
    tagline: '다리는 짧아도 내 식탐은 2미터다! 엉덩이 댄스 마스터',
    personalityTags: ['#식빵엉덩이', '#숏다리프라이드', '#간식헌터'],
    tailWaggingInterpretation: '85% 하체 씰룩 흥분 및 간식 갈망 (식탐 모터)',
    audioBarkInterpretation: '식사 시간 또는 간식 봉지 소리에 대한 경쾌한 비트',
    quipsByEmotion: {
      excited: [
        '엉덩이 모터 3000RPM! 씰룩씰룩! 🍞',
        '내 무게중심이 우주 최강 안정적이다 컹컹!',
        '트릿 봉지 뜯는 소리다! 투하하라!'
      ],
      curious: [
        '킁킁... 빵집 냄새다! 방향 틀어라!',
        '풀이 배에 닿네... 천연 안마 코스구만?'
      ],
      dramatic: [
        '배고파서 다리가 더 짧아짐... 고기 긴급 처방 🍖'
      ]
    }
  },
  {
    id: 'pome',
    name: '구름이',
    breedKr: '포메라니안',
    avatar: 'https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&auto=format&fit=crop&q=80',
    tagline: '나 솜사탕 아니다! 맹수다! 극대노 허세 솜뭉치',
    personalityTags: ['#극대노솜뭉치', '#나맹수다', '#털팽창120%'],
    tailWaggingInterpretation: '75% 방어적 기선제압 및 털 팽창 (엄포 신호)',
    audioBarkInterpretation: '"나 건들면 아프다!" 초고주파 방어적 경고음',
    quipsByEmotion: {
      excited: [
        '어흥! 비둘기 내 구역에서 당장 꺼져! 🦁',
        '내 털 120% 부풀었다! 다들 기절하겠지? ☁️',
        '바람 각도 예술~ 내 미모 눈부시지?'
      ],
      curious: [
        '저기 뭐 움직였다! 무서운 건 아닌데 집사 먼저 가봐.',
        '낙엽이 굴러가네? 나한테 덤비냐? 맹수 모드!'
      ],
      dramatic: [
        '안아줘 안아줘! 내 솜뭉치 털 망가져 힝...'
      ]
    }
  },
  {
    id: 'poodle',
    name: '초코',
    breedKr: '푸들',
    avatar: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&auto=format&fit=crop&q=80',
    tagline: '천재견의 계산된 애교! 인간들의 심리를 꿰뚫는 조련사',
    personalityTags: ['#천재견', '#눈치100단', '#집사조련사'],
    tailWaggingInterpretation: '90% 보상을 얻어내기 위한 고도의 계산된 제스처',
    audioBarkInterpretation: '집사의 행동 패턴을 유도하는 맞춤형 소리 신호',
    quipsByEmotion: {
      excited: [
        '고개 45도 갸우뚱! 간식 득템 🧠',
        '애교 패턴 데이터 완벽 출력 중!',
        '짖는 건 하수지. 난 눈빛으로 조종한다.'
      ],
      curious: [
        '집사 웃네? 산책 10분 연장 찬스다.',
        '저기 고급 유기농 트릿 냄새...'
      ],
      dramatic: [
        '하품 한 번, 아련한 눈빛 발사. 3초 뒤 간식이 올 것이다.'
      ]
    }
  }
];
