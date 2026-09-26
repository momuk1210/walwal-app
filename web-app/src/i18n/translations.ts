export type Language = 'ko' | 'en' | 'ja' | 'es';

export interface TranslationSchema {
  appTitle: string;
  subtitle: string;
  tabs: any;
  ar: any;
  studio: any;
  radar: any;
  pro: {
    title?: string;
    subtitle?: string;
    features?: string[];
    price: string;
    trialDesc: string;
    bannerSub: string;
    storeNotice: string;
    cta: string;
    successMsg?: string;
    unlimitedAccess?: string;
    proPremium?: string;
    badge?: string;
    activeText?: string;
    heading?: string;
    [key: string]: any;
  };
  auth: {
    welcomeTitle: string;
    welcomeSub: string;
    continueApple: string;
    continueGoogle: string;
    continueGuest?: string;
  };
  paywall: {
    title: string;
    subtitle: string;
    feature1: string;
    feature2: string;
    feature3: string;
    price: string;
    trial: string;
    subscribeBtn: string;
    terms: string;
  };
  profile: any;
  community: any;
  feed?: any;
  share: any;
  breedQuips: any;
  settings: any;
  legal: any;
  common: any;
}

export const TRANSLATIONS: Record<Language, TranslationSchema> = {
  "ko": {
    "appTitle": "WalWal AR · 견종 특화 AI",
    "subtitle": "AI 실시간 번역기",
    "common": {
      "genderShortMale": "남",
      "genderShortFemale": "여",
      "gpsReceiving": " 실시간 GPS 신호 수신 중..."
    },
    "tabs": {
      "ar": "펫톡",
      "radar": "레이더",
      "studio": "펫스튜디오",
      "community": "산책",
      "feed": "피드",
      "profile": "마이펫"
    },
    "feed": {
      "subtitle": "세상의 모든 귀여움, 댕댕이 피드",
      "commentTitle": "댓글",
      "noComments": "아직 댓글이 없습니다",
      "beFirstComment": "댓글을 남겨보세요.",
      "commentPlaceholder": "댓글 달기...",
      "deleteComment": "댓글 삭제"
    },
    "legal": {
      "faqTitle": "자주 묻는 질문",
      "termsTitle": "이용약관",
      "privacyTitle": "개인정보 처리방침",
      "faqQ1": "WalWal 앱에서는 어떤 프리미엄 기능을 제공하나요?",
      "faqA1": "WalWal은 전면 유료 구독 기반의 프리미엄 서비스입니다. 구독 시 무제한 다중 반려견 프로필 관리, 정밀한 실시간 AR 짖음 번역기, 그리고 글로벌 반려견 커뮤니티(번개 모임) 매칭 기능을 광고 없이 쾌적하게 이용하실 수 있습니다.",
      "faqQ2": "강아지 프로필은 몇 개까지 추가할 수 있나요?",
      "faqA2": "구독 기간 동안 마리 수 제한 없이 무제한으로 반려견 프로필을 추가하고 통합 관리하실 수 있습니다.",
      "termsContent": "제1조 (목적)\n본 약관은 WalWal 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.\n\n제2조 (서비스의 제공)\n회사는 회원의 원활한 반려동물 소통을 돕기 위해 AR 번역 및 커뮤니티 서비스를 제공합니다.",
      "privacyContent": "1. 수집하는 개인정보 항목\n이메일, 닉네임, 기기 정보(마이크, 카메라 접근 권한 등).\n\n2. 개인정보의 이용 목적\n- 반려견 AR 짖음 분석 서비스 제공\n- 위치기반 반려견 커뮤니티 모임 매칭 기능 제공"
    },
    "settings": {
      "title": "설정",
      "proTitle": "WalWal Pro 구독",
      "proStatus": "무료 체험 진행 중",
      "restorePurchase": "구매 항목 복원",
      "preferences": "앱 설정",
      "language": "언어 (Language)",
      "notifications": "알림 설정",
      "radarAlert": "근처 반려견 등장 (레이더)",
      "meetupAlert": "번개 모임",
      "feedAlert": "피드 소식",
      "permissions": "권한 관리",
      "camera": "카메라",
      "mic": "마이크",
      "location": "위치",
      "support": "고객 지원 및 약관",
      "faq": "자주 묻는 질문",
      "terms": "이용약관",
      "privacy": "개인정보 처리방침",
      "account": "계정 관리",
      "logout": "로그아웃",
      "deleteAccount": "회원 탈퇴",
      "confirmDelete": "정말로 계정을 탈퇴하시겠습니까? 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.",
      "logoutError": "로그아웃 중 오류가 발생했습니다."
    },
    "profile": {
      "greetingLabel": "인사말",
      "greetingPlaceholder": "예: 안녕하세요! 우리 강아지는 간식을 좋아해요.",
      "greetingEmpty": "반갑습니다! 인사말을 등록해주세요 😊",
      "genderLabel": "성별",
      "genderMale": "수컷 (Male)",
      "genderFemale": "암컷 (Female)",
      "ownerTitleSelect": "호칭 선택",
      "mom": "엄마",
      "dad": "아빠",
      "title": "마이 펫",
      "subtitle": "나의 반려견 프로필 및 AI 통역 언어 설정",
      "addNew": "새 반려견 등록",
      "justNow": "방금 전",
      "hostMom": "엄마",
      "hostDad": "아빠",
      "alertNameRequired": "반려견 이름을 입력해주세요!",
      "noteIntro": "안녕하세요! {ownerName}입니다. {dogName}({breed})와 함께 산책 중이에요!",
      "noteReply1": "반가워요! 저희 지금 {distance} 근처 잔디밭 쪽으로 걷고 있어요. 천천히 오세요!",
      "noteReply2": "네 좋아요! 저희 {dogName}도 친구 만나는 거 엄청 좋아해요 ㅎㅎ 지금 인사 나눠요!",
      "noteReply3": "메세지 감사해요! 마침 간식 챙겨 나왔는데 같이 나눠먹어요 😊",
      "notePlaceholder": "{ownerName} 님께 메세지 보내기...",
      "noteSend": "보내기",
      "noteSending": "전송 중...",
      "noteTemplate1": "안녕하세요! 산책 코스가 겹치네요, 혹시 댕댕이 인사 나눌 수 있을까요?",
      "noteTemplate2": "강아지가 너무 예뻐요! 저희 애랑 성향이 잘 맞을 것 같아요 😊",
      "noteTemplate3": "지금 어느 쪽으로 산책 중이신가요? 냄새 교환하러 가겠습니다! ",
      "noteTemplate4": "혹시 오늘 산책 번개 모임 같이 참여하실 생각 있으신가요? ✨",
      "edit": "수정하기",
      "owner": "엄마/아빠",
      "proActiveSub": "워터마크 없는 4K 카드 & 무제한 번역 활성화",
      "statTranslate": "누적 AI 통역",
      "statWebtoon": "펫 스튜디오",
      "statMeetup": "산책 모임 참가",
      "langSetting": "언어 설정 (Language)",
      "modalEdit": "반려견 프로필 수정",
      "modalAdd": "새로운 반려견 등록",
      "uploadPhoto": "카메라 버튼을 눌러 사진 업로드 또는 아래 프리셋 선택",
      "dogName": "반려견 이름",
      "dogNamePlaceholder": "예: 보리, 땅콩, 콩이",
      "dogBreed": "품종 (견종 특화 AI 행동학 엔진 연동)",
      "dogAge": "나이",
      "dogAgeSuffix": "살",
      "dogAgePlaceholder": "숫자만 입력",
      "ownerName": "엄마/아빠 이름",
      "ownerPlaceholder": "예: 댕댕맘, 성수동산책러",
      "personality": "반려견 성향 태그 (최대 3개)",
      "cancel": "취소",
      "save": "저장하기",
      "ageSuffix": "살",
      "personalityLimit": "성격 태그 (최대 5개 선택)",
      "addTagPlaceholder": "태그 직접 입력 후 엔터...",
      "breedOptions": [
        "말티즈",
        "푸들",
        "포메라니안",
        "치와와",
        "시추",
        "요크셔테리어",
        "코카 스패니얼",
        "비글",
        "진돗개",
        "웰시코기",
        "골든 리트리버",
        "저먼 셰퍼드",
        "시베리안 허스키",
        "테리어",
        "닥스훈트",
        "스피츠",
        "스태그하운드",
        "포인터",
        "리트리버",
        "컴패니언"
      ],
      "presetPersonalities": [
        "#파워인싸",
        "#모든인간은내친구",
        "#간식감별사",
        "#식빵엉덩이",
        "#숏다리의자존심",
        "#간식헌터",
        "#폼생폼사",
        "#참지않는말티즈",
        "#호기심대마왕",
        "#애교쟁이",
        "#엄마바라기",
        "#산책중독자"
      ]
    },
    "ar": {
      "ethologyBtn": "견종행동학",
      "liveWebcam": "웹캠 ON",
      "simulator": "시뮬레이터",
      "retranslate": "다시번역",
      "captureShorts": "싷폼저장",
      "audioFreq": "음성 주파수 감지",
      "speechSuffix": "의 속마음",
      "ethologyModalTitle": "행동학(Ethology) 분석 기준",
      "tailInterpretation": "꼬리 흔들기 해석",
      "barkInterpretation": "짖는 소리 해석",
      "personaTitle": "성향 페르소나",
      "petTokOn": "펫톡",
      "petTranslator": "댕댕이 속마음 번역기",
      "petTokOff": "펫톡",
      "aiDetection": "[AI 탐지] 반려견 · 신뢰도 97.8%",
      "realtimeAI": "실시간 AI 행동 분석",
      "behaviorBark": " 짖음",
      "behaviorGrowl": " 그로울",
      "behaviorWhine": " 낑낑",
      "behaviorActive": " 활발",
      "behaviorCalm": " 안정",
      "freqAnalyzing": "실시간 짖음 주파수 분석 중",
      "nextTurn": "대사 이어가기",
      "analyzing": "분석 중",
      "ownerNote": "메세지",
      "confidence": "신뢰도 98.4%",
      "realtimeAnalysisSuffix": " (3세, 순함)",
      "basisPrefix": "분석 근거: ",
      "mockDogCenter": "인절미 (가운데)",
      "mockDogLeft": "초코 (좌측)",
      "mockDogRight": "뭉치 (우측)",
      "mockDogCenterName": "인절미",
      "mockDogLeftName": "초코",
      "mockDogRightName": "뭉치",
      "mockGolden": "골든 리트리버",
      "mockBori": "보리",
      "mockBoriThought": "\"저기 형아 주머니에 소시지 100%!! 꼬리 프로펠러 가동? \"",
      "mockBoriBasis": "95% 순수한 호의와 반가움 (놀이 유혹)",
      "afLock": "오토포커스",
      "liveScenarios": {
        "bark": [
          {
            "thought": "누구야!! 내 영역에서 당장 나가!! 😠",
            "behavior": "경계성 짖음 · 영역 방어",
            "signal": "지속적 짖음 감지",
            "confidence": 98
          },
          {
            "thought": "빨리 문 열어! 나가고 싶다 멍!!",
            "behavior": "요구 짖음 · 행동 촉구",
            "signal": "간헐적 요구 짖음 감지",
            "confidence": 98
          },
          {
            "thought": "집사 온다!! 나 여기 있어 멍!!",
            "behavior": "환영 짖음 · 재회 흥분",
            "signal": "반복 짖음 패턴 감지",
            "confidence": 99
          },
          {
            "thought": "냄새가 이상해! 조심해 멍멍!!",
            "behavior": "경보 짖음 · 위협 인식",
            "signal": "연속 짖음 버스트 감지",
            "confidence": 94
          },
          {
            "thought": "저 소리 들었어?! 나한테 맡겨 멍!!",
            "behavior": "탐지 짖음 · 청각 자극 반응",
            "signal": "외부 자극 반응 짖음",
            "confidence": 96
          }
        ],
        "whine": [
          {
            "thought": "집사 어디 가... 나 혼자 두고 가지마 🥺",
            "behavior": "분리 불안 신호 · 애착 표현",
            "signal": "고주파 낑낑 감지",
            "confidence": 96
          },
          {
            "thought": "배고파... 고기 줘... 꼬르륵",
            "behavior": "식욕 호소 신호 · 요구 표현",
            "signal": "지속 고주파 발성 감지",
            "confidence": 94
          },
          {
            "thought": "발바닥이 이상해... 아픈 거 같아 😢",
            "behavior": "통증/불편 신호 · 주의 필요",
            "signal": "낮은 낑낑 + 자세 변화",
            "confidence": 88
          },
          {
            "thought": "너무 신나! 빨리 산책 가자 낑낑!",
            "behavior": "흥분 억제 신호 · 기대감",
            "signal": "흥분성 고주파 발성",
            "confidence": 95
          },
          {
            "thought": "무서운 냄새... 집사 옆에 딱 붙어있어야지 😰",
            "behavior": "불안 카밍 신호 · 보호 요청",
            "signal": "불안성 낑낑 발성",
            "confidence": 91
          }
        ],
        "growl": [
          {
            "thought": "가까이 오지 마. 여긴 내 구역이야 😤",
            "behavior": "경고 그로울 · 영역 주장",
            "signal": "저주파 지속 그로울 감지",
            "confidence": 98
          },
          {
            "thought": "저거 내 거야! 건들지 마 👀",
            "behavior": "자원 방어 그로울 · 소유 반응",
            "signal": "자원 앞 저주파 발성",
            "confidence": 95
          },
          {
            "thought": "나 지금 사냥 놀이 모드다! 어흥",
            "behavior": "플레이 그로울 · 놀이 초대",
            "signal": "플레이 중 저주파 발성",
            "confidence": 89
          },
          {
            "thought": "뭔가 맘에 안 들어... 지켜보고 있다 🤨",
            "behavior": "불만 그로울 · 불쾌 신호",
            "signal": "간헐적 저주파 그로울",
            "confidence": 93
          }
        ],
        "active": [
          {
            "thought": "뭔가 있다 킁킁! 냄새 추적 시작!",
            "behavior": "무성 탐색 · 후각 주도 이동",
            "signal": "고모션 + 저음량 · 탐색 행동",
            "confidence": 95
          },
          {
            "thought": "내 구역 순찰 중! 이상 무",
            "behavior": "순찰 보행 · 영역 확인 행동",
            "signal": "규칙적 이동 패턴 감지",
            "confidence": 93
          },
          {
            "thought": "저기 꿀잼 냄새! 빨리 가보자 🎾",
            "behavior": "자발적 이동 · 놀이 탐색",
            "signal": "빠른 이동 + 귀 전방 직립",
            "confidence": 96
          },
          {
            "thought": "달리고 싶어! 전속력으로 고고",
            "behavior": "과잉 에너지 · 운동 욕구",
            "signal": "전신 근육 긴장 + 이동 반복",
            "confidence": 97
          },
          {
            "thought": "여기도 저기도 다 볼 거야! 바쁘다 바빠 👀",
            "behavior": "다방향 주의 · 활발 탐색",
            "signal": "빠른 시선 이동 + 체중 전방",
            "confidence": 91
          }
        ],
        "calm": [
          {
            "thought": "집사 옆이 최고야~ 행복해 ☀️",
            "behavior": "이완 안정 · 신뢰 유대 신호",
            "signal": "낮은 모션 + 정상 호흡",
            "confidence": 98
          },
          {
            "thought": "킁킁... 집사 오늘 고기 먹었네? ",
            "behavior": "후각 환경 분석 · 이완 탐색",
            "signal": "비강 확장 · 느린 이동",
            "confidence": 92
          },
          {
            "thought": "졸려... 눈이 자꾸 감긴다 😴",
            "behavior": "수면 전 이완 · 경계 완화",
            "signal": "순막 이완 + 호흡 느림",
            "confidence": 96
          },
          {
            "thought": "오늘 산책도 밥도 완벽했다",
            "behavior": "만족 이완 · 세로토닌 상태",
            "signal": "꼬리 낮은 와깅 + 눈 부드러움",
            "confidence": 99
          },
          {
            "thought": "누구 냄새지? 기다려볼까",
            "behavior": "수동 대기 · 자극 기다림",
            "signal": "귀 측면 경청 + 저모션",
            "confidence": 90
          },
          {
            "thought": "집사 기분 좋아보이네! 나도 좋다 ",
            "behavior": "정서 동기화 · 공감 반응",
            "signal": "시선 추적 + 꼬리 서행 와깅",
            "confidence": 94
          }
        ]
      }
    },
    "studio": {
      "title": "펫스튜디오",
      "subtitle": "고유 성향이 깃든 인스타/싷폼 컷툰 생성기",
      "reRollQuip": "대사 다시뽐기",
      "downloadPng": "웹툰 컷 PNG 다운로드",
      "downloading": "카드 렌더링 중...",
      "postToFeed": "등록하기",
      "postSuccess": "피드에 성공적으로 등록되었습니다!",
      "downloadComplete": "파일이 다운로드되었습니다!"
    },
    "radar": {
      "greetingLabel": "인사말",
      "greetingEmpty": "안녕하세요! 반가워요 😊",
      "title": "댕댕이 레이더",
      "dogsNearby": "주변 반경 산책 중인 댕댕이",
      "startVirtualChat": "펫톡",
      "sendNote": "메세지",
      "myLocation": "내 현재 위치",
      "apiKeyModalTitle": "Google Maps API 키 설정",
      "apiKeyModalDesc": "Google Cloud API 키를 입력하시면 공식 구글 지도 타일로 즉시 전환됩니다.",
      "mapTypeToggle": "지도 타일 전환",
      "darkMap": "다크 맵",
      "generalMap": "라이트 맵",
      "meetupLocation": "모임 장소",
      "realtimeThought": "실시간 속마음",
      "nearby": "인근"
    },
    "pro": {
      "badge": "WalWal Pro",
      "heading": "댕댕이의 속마음을",
      "highlight": "한계 없이 무제한으로 엿보세요",
      "tagline": "전 세계 펫팸족을 위한 글로뢌 1위 AR 번역기",
      "benefit1": "실시간 AR 통역 & 티키타카 무제한",
      "benefit2": "워터마크 완전 제거 & 4K 고화질 저장",
      "benefit3": "레이더 반경 5km 무제한 확장",
      "benefit4": "AI 반려견 음성/행동 정밀 분석 리포트",
      "cta": "프리미엄 구독 시작하기",
      "activeText": "이미 Pro 플랜 이용 중입니다",
      "price": "월 8,900원",
      "trialDesc": "7일간 100% 무료 체험 · 이후 월 8,900원 자동 전환 (언제든 해지 가능)",
      "bannerSub": "월 8,900원 · 광고/워터마크 없는 무제한 AI 통역",
      "storeNotice": "Google Play & App Store 안심 정기구독 · 7일 이내 해지 시 0원 청구"
    },
    "auth": {
      "welcomeTitle": "반려견과의 소통",
      "welcomeSub": "WalWal과 함께 특별한 소통을 경험하세요",
      "continueApple": "Apple로 계속하기",
      "continueGoogle": "Google로 계속하기",
      "continueGuest": "게스트로 시작하기"
    },
    "paywall": {
      "title": "WalWal Pro",
      "subtitle": "언어 장벽 없는 전 세계 펫팸족 커뮤니티",
      "feature1": "무제한 실시간 AI 통역",
      "feature2": "워터마크 없는 4K 저장",
      "feature3": "글로벌 커뮤니티 자동 번역",
      "price": "월 8,900원",
      "trial": "7일 무료 체험 후 결제",
      "subscribeBtn": "프리미엄 구독 시작하기",
      "terms": "결제는 언제든 취소 가능합니다."
    },
    "community": {
      "subtitle": "오늘 같이 산책할 동네 친구 모여라!",
      "alertCreate": "새로운 산책 번개 모임 개설 팝업이 열립니다!",
      "btnCreate": "모임개설",
      "host": "주최",
      "tabMeetup": "산책 번개 모임",
      "tabFeed": "댕댕 속마음 피드",
      "hostMom": "엄마",
      "hostDad": "아빠",
      "tooltipLocation": "클릭 시 지도에서 위치 확인",
      "tooltipDirections": "Google 지도 새창으로 길찾기",
      "directions": "길찾기",
      "participants": "참여 인원",
      "peopleCount": "명",
      "filterUpcoming": "함께산책해요",
      "filterJoined": "내 산책",
      "filterPast": "지난 산책",
      "joined": "참여 확정됨",
      "btnJoin": "산책 참가 신청",
      "btnPostComment": "게시",
      "placeholderComment": "댓글 달기...",
      "btnClose": "닫기",
      "modalParticipantsTitle": "함께할 친구들",
      "modalCreateTitle": "산책 번개 모임 개설",
      "modalTitleLabel": "모임 제목",
      "modalTitlePlaceholder": "예: 주말 한강공원 산책해요!",
      "modalLocationLabel": "모임 장소",
      "modalLocationPlaceholder": "예: 뚝섬 한강공원",
      "modalTimeLabel": "일시",
      "modalTimePlaceholder": "예: 이번 주 일요일 오후 3시",
      "modalTagLabel": "태그",
      "modalTagPlaceholder": "#대형견환영",
      "modalMaxLabel": "최대 인원 (명)",
      "modalBtnSubmit": "모임 등록하기",
      "selectPetTitle": "함께 산책 갈 반려견 선택",
      "selectPetDesc": "이번 모임에 함께 참여할 아이를 선택해주세요. (다중 선택 가능)",
      "allPetsBtn": "모든 반려견 ({count}마리 모두)",
      "btnJoinWithCount": "{count}마리 반려견과 함께 참여하기",
      "minOnePetAlert": "최소 1마리 이상의 반려견을 선택해주세요.",
      "joinReqBeforeChat": "모임에 참가 신청 후 톡방에 입장할 수 있습니다.",
      "participatingNeighbors": "참여 이웃:",
      "senderProfile": "발신 프로필:",
      "chatPlaceholder": "{name}(으)로 메시지 입력...",
      "participantsCountSuffix": "명 참여 중",
      "mock": {
        "m1": { "title": "서울숲 야간 킁킁 산책 번개", "location": "서울숲 중앙잔디광장", "time": "오늘 저녁 8시 30분", "tag": "#대형견환영" },
        "m2": { "title": "웰시코기 & 숏다리 친구들 모여라!", "location": "뚝섬 한강공원 피크닉존", "time": "내일 오후 3시", "tag": "#숏다리모임" },
        "m3": { "title": "쫄보 솜뭉치들의 조용한 힐링 산책", "location": "살곶이 다리 산책로", "time": "일요일 오전 10시", "tag": "#소형견전용" }
      }
    },
    "share": {
      "title": "공유 위치 선택",
      "watermarkTop": "[WalWal AI]",
      "watermarkTopSuffix": "편",
      "speechTitleSuffix": "속마음",
      "watermarkFooter": "WalWal AI 반려견 실시간 속마음 번역기 (walwal.app)",
      "rendering": "카드 렌더링 중...",
      "downloadComplete": "고화질 카드가 다운로드되었습니다!",
      "redirecting": "등록 화면으로 다이렉트 이동 중...",
      "errorGenerate": "이미지 생성에 실패했습니다.",
      "shareSuccess": "앱으로 이미지가 성공적으로 전송되었습니다!",
      "shareCancel": "공유가 취소되었습니다.",
      "clipboardSuccess": "데스크톱 환경: 클립보드에 복사되었습니다! ${toastTarget}에 붙여넣기(Ctrl+V) 하세요.",
      "manualAdd": "${toastTarget} 화면이 열렸습니다! 이미지를 수동으로 추가해주세요.",
      "errorShare": "공유 처리 중 오류가 발생했습니다.",
      "download": "다운로드",
      "more": "더 보기",
      "subtitles": {
        "instagram": "동영상은 Instagram에서 높은 품질로 재생될 수 있도록 최적화됩니다.",
        "tiktok": "동영상은 TikTok 9:16 풀스크린 규격에 맞춰 최적화됩니다.",
        "youtube": "동영상은 YouTube Shorts 알고리즘에 맞춘 고화질로 렌더링됩니다.",
        "download": "단말기에 원본 무손실 4K 화질로 안전하게 저장됩니다.",
        "more": "카카오톡, 메시지, 에어드롭 등 원하는 플랫폼으로 바로 전송합니다."
      }
    },
    "breedQuips": {
      "golden": {
        "ko": [
          "앗! 새로운 친구다! 나랑 당장 놀자!!",
          "저기 형아 주머니에 소시지 냄새! 꼬리 흔들기 300% 가동!!"
        ],
        "en": [
          "OMG a new friend! Play with me right now! I love everyone!!",
          "I smell sausages in your pocket! Tail propeller at 300%!!"
        ],
        "ja": [
          "わぁ！新しいお友達だ！今すぐ一緒に遊ぼう！！",
          "あのお兄さんのポケットからソーセージの匂いがする！尻尾全開！！"
        ],
        "es": [
          "¡Un nuevo amigo! ¡Juega conmigo ahora mismo! ¡Los amo a todos!",
          "¡Huelo salchichas en tu bolsillo! ¡Cola a máxima velocidad!"
        ]
      },
      "shiba": {
        "ko": [
          "너 나한테 관심 갖지 마라. 꼬리 흔든 건 기분 좋아서가 아니라 반동 추진력이다.",
          "눈 마주쳤다고 친구 먹을 생각 마. 내 퍼스널 스페이스 2미터 유지해라."
        ],
        "en": [
          "Do not look at me. Wiggling my tail was just recoil propulsion.",
          "Keep your 6-foot distance. We are not friends just because we made eye contact."
        ],
        "ja": [
          "私に関わるな。尻尾を振ったのは反動の推進力だ。",
          "目が合ったからって友達気取りするな。2mの距離を保て。"
        ],
        "es": [
          "No me mires. Mover la cola fue solo propulsión de retroceso.",
          "Mantén tu distancia de 2 metros. No somos amigos solo por cruzar miradas."
        ]
      },
      "maltese": {
        "ko": [
          "말티즈는 참지 않아! 집사야 나한테 집중해! 다른 개 쳐다보지 마 앙앙!!",
          "내가 귀엽다고 만만하게 보지 마라! 내 안에 맹수의 피가 흔른다! 🦁"
        ],
        "en": [
          "Maltese never holds back! Human, focus on ME! Stop looking at other dogs!",
          "Do not underestimate my cuteness! The blood of a fierce beast runs in me! 🦁"
        ],
        "ja": [
          "マルチーズは我慢しない！ご主人様、私だけに集中して！他の犬を見ないで！",
          "可愛いからって甘く見るな！私の中には猛獣の血が流れている！🦁"
        ],
        "es": [
          "¡El Maltés no se guarda nada! ¡Humano, mírame solo a mí!",
          "¡No subestimes mi ternura! ¡Por mis venas corre sangre de fiera! 🦁"
        ]
      },
      "corgi": {
        "ko": [
          "다리는 짧아도 내 앉덩이 모터 회전수는 분당 3000RPM이다 씨룩씨룩! ",
          "다리 길다고 유세 떨지 마라! 내 무게중심이 지구상에서 제일 안정적이다 컹컹!"
        ],
        "en": [
          "My legs may be short, but my booty RPM is 3000 per minute! ",
          "Do not brag about your long legs! My center of gravity is superior!"
        ],
        "ja": [
          "足は短くてもお尻の回転数は毎分3000回だワン！プリプリ！",
          "足が長いからって威張るな！私の重心の低さこそ至高！"
        ],
        "es": [
          "¡Mis patas serán cortas, pero mi cola gira a 3000 RPM! ",
          "¡No presumas de patas largas! ¡Mi centro de gravedad es invencible!"
        ]
      },
      "pome": {
        "ko": [
          "나 솜사탕 아니다! 맹수다! 어흥! 비둘기 너 내 구역에서 당장 꺼져 앙앙! 🦁",
          "내 털 120% 부풀었다! 이 압도적인 사자 갈기에 다들 기절하겠지?! "
        ],
        "en": [
          "I am not cotton candy! I am an apex predator! Pigeon, get off my lawn! 🦁",
          "My fur expanded by 120%! Kneel before my majestic lion mane! "
        ],
        "ja": [
          "私は綿あめじゃない！猛獣だ！ハトよ、私の縄張りから出て行け！🦁",
          "毛量が120%膨らんだ！この圧倒的なライオンの鬣にひれ伏すがいい！"
        ],
        "es": [
          "¡No soy un algodón de azúcar! ¡Soy un depredador! ¡Paloma, vete de mi territorio! 🦁",
          "¡Mi pelaje se infló un 120%! ¡Arrodíllense ante mi melena de león! "
        ]
      },
      "poodle": {
        "ko": [
          "집사야 표정보니 지금 죄책감 드는 타이밍이다? 고개 45도 간식 득템 ",
          "인간들이 날 귀여워하는 패턴을 완벽히 데이터화했다. 완벽한 애교 출력 중!"
        ],
        "en": [
          "Human looks guilty right now. Perfect time for the 45-degree head tilt! Treat acquired ",
          "I have fully calculated human psychology. Executing optimal cuteness algorithm!"
        ],
        "ja": [
          "ご主人様、今罪悪感を感じてるな？首を45度かしげる技を発動！おやつゲット",
          "人間が私を可愛いと思うパターンを完全データ化。完璧な愛嬍bを出力中！"
        ],
        "es": [
          "El humano parece culpable. ¡Momento perfecto para inclinar la cabeza 45 grados! Premio conseguido ",
          "He calculado la psicología humana. ¡Ejecutando algoritmo de ternura!"
        ]
      }
    }
  },
  "en": {
    "appTitle": "WalWal AR · Breed AI",
    "subtitle": "AI Real-time Translator",
    "common": {
      "genderShortMale": "M",
      "genderShortFemale": "F",
      "gpsReceiving": "🛰️ Receiving GPS signal..."
    },
    "tabs": {
      "ar": "Pet Tok",
      "radar": "Radar",
      "studio": "Pet Studio",
      "community": "Walk",
      "feed": "Feed",
      "profile": "My Pet"
    },
    "feed": {
      "subtitle": "All the cuteness in the world, doggy feed",
      "commentTitle": "Comments",
      "noComments": "No comments yet",
      "beFirstComment": "Be the first to comment.",
      "commentPlaceholder": "Add a comment...",
      "deleteComment": "Delete comment"
    },
    "legal": {
      "faqTitle": "FAQ",
      "termsTitle": "Terms of Service",
      "privacyTitle": "Privacy Policy",
      "faqQ1": "What premium features does the WalWal app offer?",
      "faqA1": "WalWal is a fully premium subscription service. By subscribing, you gain ad-free, unlimited access to multi-dog profile management, real-time AR bark translation, and global pet community matching.",
      "faqQ2": "How many dogs can I add?",
      "faqA2": "During your subscription, you can add and manage an unlimited number of dog profiles without any restrictions.",
      "termsContent": "Article 1 (Purpose)\nThe purpose of these Terms is to define the rights and obligations between the company and the user regarding the WalWal service.\n\nArticle 2 (Service Provision)\nThe company provides AR translation and community services to facilitate communication with pets.",
      "privacyContent": "1. Information Collected\nEmail, nickname, device permissions (mic, camera, etc.).\n\n2. Purpose of Use\n- Providing AR bark analysis services\n- Offering location-based pet community matching"
    },
    "settings": {
      "title": "Settings",
      "proTitle": "WalWal Pro Subscription",
      "proStatus": "Free trial active",
      "restorePurchase": "Restore Purchases",
      "preferences": "App Preferences",
      "language": "Language",
      "notifications": "Notifications",
      "radarAlert": "Radar Alerts (Nearby Dogs)",
      "meetupAlert": "Meetups",
      "feedAlert": "Feed Activity",
      "permissions": "Permissions",
      "camera": "Camera",
      "mic": "Microphone",
      "location": "Location",
      "support": "Support & Legal",
      "faq": "FAQ",
      "terms": "Terms of Service",
      "privacy": "Privacy Policy",
      "account": "Account Management",
      "logout": "Log Out",
      "deleteAccount": "Delete Account",
      "confirmDelete": "Are you sure you want to delete your account? All data will be permanently removed.",
      "logoutError": "An error occurred during logout."
    },
    "profile": {
      "greetingLabel": "Greeting",
      "greetingPlaceholder": "e.g., Hello! My dog loves treats.",
      "greetingEmpty": "Hello! Please register a greeting 😊",
      "genderLabel": "Gender",
      "genderMale": "Male",
      "genderFemale": "Female",
      "ownerTitleSelect": "Select Title",
      "mom": "Mom",
      "dad": "Dad",
      "title": "My Pet",
      "subtitle": "My Pet's Profile & AI Translation Settings",
      "addNew": "Add New Dog",
      "justNow": "Just now",
      "hostMom": "Mom/Dad",
      "alertNameRequired": "Please enter your dog's name!",
      "noteIntro": "Hello! I am {ownerName}. I am walking with {dogName}({breed})!",
      "noteReply1": "Nice to meet you! We are walking near {distance}. Take your time!",
      "noteReply2": "Sure! {dogName} loves meeting new friends. Let's say hi!",
      "noteReply3": "Thanks for the note! I brought some snacks, let's share! 😊",
      "notePlaceholder": "Send a note to {ownerName}...",
      "noteSend": "Send",
      "noteSending": "Sending...",
      "noteTemplate1": "Hello! Our walking routes overlap, can our dogs say hi?",
      "noteTemplate2": "Your dog is so pretty! I think our dogs will get along well 😊",
      "noteTemplate3": "Which way are you walking? We'll come over to exchange scents! 🐕",
      "noteTemplate4": "Are you interested in joining a quick meetup today? ✨",
      "edit": "Edit",
      "owner": "Mom/Dad",
      "proActiveSub": "No watermark 4K cards & unlimited translation active",
      "statTranslate": "AI Translations",
      "statWebtoon": "Generated Pet Studio",
      "statMeetup": "Walk Meetups",
      "langSetting": "Language Settings",
      "modalEdit": "Edit Dog Profile",
      "modalAdd": "Register New Dog",
      "uploadPhoto": "Click camera to upload or select a preset below",
      "dogName": "Dog's Name",
      "dogNamePlaceholder": "ex: Buddy, Max, Bella",
      "dogBreed": "Breed (AI Ethology Engine Linked)",
      "dogAge": "Age",
      "dogAgeSuffix": "yrs",
      "dogAgePlaceholder": "Number only",
      "ownerName": "Mom/Dad's Name",
      "ownerPlaceholder": "ex: Dog Mom, Walker",
      "personality": "Personality Tags (Max 3)",
      "cancel": "Cancel",
      "save": "Save",
      "ageSuffix": " yrs",
      "personalityLimit": "Personality Tags (Max 5)",
      "addTagPlaceholder": "Type custom tag and Enter...",
      "breedOptions": [
        "Maltese",
        "Poodle",
        "Pomeranian",
        "Chihuahua",
        "Shih Tzu",
        "Yorkshire Terrier",
        "Cocker Spaniel",
        "Beagle",
        "Jindo",
        "Welsh Corgi",
        "Golden Retriever",
        "German Shepherd",
        "Siberian Husky",
        "Terrier",
        "Dachshund",
        "Spitz",
        "Staghound",
        "Pointer",
        "Retriever",
        "Companion Dog"
      ],
      "presetPersonalities": [
        "#SocialButterfly",
        "#EveryoneIsMyFriend",
        "#SnackInspector",
        "#LoafButt",
        "#ShortLegsPride",
        "#SnackHunter",
        "#SwagDog",
        "#FeistyMaltese",
        "#CuriousExplorer",
        "#CuddleBug",
        "#MommasBoy",
        "#WalkAddict"
      ]
    },
    "ar": {
      "ethologyBtn": "Ethology",
      "liveWebcam": "Webcam ON",
      "simulator": "Sim Mode",
      "retranslate": "Rethink",
      "captureShorts": "Save Story",
      "audioFreq": "Audio Frequency",
      "speechSuffix": "'s Mind",
      "ethologyModalTitle": "Canine Ethology Insights",
      "tailInterpretation": "Tail Wagging Meaning",
      "barkInterpretation": "Bark Acoustic Pattern",
      "personaTitle": "Breed Persona",
      "petTokOn": "Pet Tok",
      "petTranslator": "Pet Translator & Companion",
      "petTokOff": "Pet Tok",
      "aiDetection": "AI Detecting",
      "realtimeAI": " Real-time AI Behavior Analysis",
      "behaviorBark": "Bark",
      "behaviorGrowl": "Growl",
      "behaviorWhine": "Whine",
      "behaviorActive": "Active",
      "behaviorCalm": "Calm",
      "freqAnalyzing": "Analyzing bark frequency in real-time",
      "nextTurn": "Continue",
      "analyzing": "Analyzing",
      "ownerNote": "Message Mom/Dad",
      "confidence": "Reliability 98.4%",
      "realtimeAnalysisSuffix": " (3yrs, Gentle)",
      "basisPrefix": "Basis: ",
      "mockDogCenter": "Injeolmi (Center)",
      "mockDogLeft": "Choco (Left)",
      "mockDogRight": "Moongchi (Right)",
      "mockDogCenterName": "Injeolmi",
      "mockDogLeftName": "Choco",
      "mockDogRightName": "Moongchi",
      "mockGolden": "Golden Retriever",
      "mockBori": "Bori",
      "mockBoriThought": "\"Sniff sniff... 100% sausage in bro's pocket!! Should I start the tail propeller? \"",
      "mockBoriBasis": "95% pure goodwill and welcome (play temptation)",
      "afLock": "Auto Focus",
      "liveScenarios": {
        "bark": [
          {
            "thought": "Who is it!! Get out of my territory!! 😠",
            "behavior": "Alert Barking · Territorial",
            "signal": "Continuous Barking Detected",
            "confidence": 98
          },
          {
            "thought": "Open the door! I wanna go out!!",
            "behavior": "Demand Barking · Action Urged",
            "signal": "Intermittent Demand Barking",
            "confidence": 98
          },
          {
            "thought": "My human is here!! I'm here!!",
            "behavior": "Welcome Barking · Excitement",
            "signal": "Repeated Barking Pattern",
            "confidence": 99
          },
          {
            "thought": "Strange smell! Be careful!!",
            "behavior": "Warning Barking · Threat Detected",
            "signal": "Continuous Bark Burst",
            "confidence": 94
          },
          {
            "thought": "Did you hear that?! Leave it to me!!",
            "behavior": "Detection Barking · Auditory Response",
            "signal": "External Stimulus Barking",
            "confidence": 96
          }
        ],
        "whine": [
          {
            "thought": "Where are you going... Don't leave me 🥺",
            "behavior": "Separation Anxiety · Attachment",
            "signal": "High-frequency Whine",
            "confidence": 96
          },
          {
            "thought": "Hungry... give me meat...",
            "behavior": "Appetite Appeal · Demand",
            "signal": "Continuous High-freq Vocalization",
            "confidence": 94
          },
          {
            "thought": "My paw feels weird... I think it hurts 😢",
            "behavior": "Pain/Discomfort · Attention Needed",
            "signal": "Low Whine + Posture Change",
            "confidence": 88
          },
          {
            "thought": "So excited! Let's go for a walk!",
            "behavior": "Excitement Suppression · Anticipation",
            "signal": "Excited High-freq Vocalization",
            "confidence": 95
          },
          {
            "thought": "Scary smell... I should stay close 😰",
            "behavior": "Anxiety Calming · Protection Request",
            "signal": "Anxious Whining",
            "confidence": 91
          }
        ],
        "growl": [
          {
            "thought": "Don't come closer. This is my turf 😤",
            "behavior": "Warning Growl · Territorial",
            "signal": "Low-freq Continuous Growl",
            "confidence": 98
          },
          {
            "thought": "That's mine! Don't touch it 👀",
            "behavior": "Resource Guarding · Ownership",
            "signal": "Low-freq Vocalization at Resource",
            "confidence": 95
          },
          {
            "thought": "I'm in hunting play mode! Rawr",
            "behavior": "Play Growl · Play Invitation",
            "signal": "Low-freq Vocalization during Play",
            "confidence": 89
          },
          {
            "thought": "I don't like this... I'm watching you 🤨",
            "behavior": "Displeasure Growl · Uncomfortable",
            "signal": "Intermittent Low-freq Growl",
            "confidence": 93
          }
        ],
        "active": [
          {
            "thought": "Something's here sniff sniff! Tracking!",
            "behavior": "Silent Search · Olfactory Driven",
            "signal": "High Motion + Low Vol · Searching",
            "confidence": 95
          },
          {
            "thought": "Patrolling my area! All clear",
            "behavior": "Patrol Walk · Area Check",
            "signal": "Regular Movement Pattern",
            "confidence": 93
          },
          {
            "thought": "Fun smell over there! Let's go 🎾",
            "behavior": "Spontaneous Movement · Play Search",
            "signal": "Fast Movement + Ears Forward",
            "confidence": 96
          },
          {
            "thought": "I wanna run! Full speed ahead",
            "behavior": "Excess Energy · Exercise Desire",
            "signal": "Full Body Tension + Repetitive Move",
            "confidence": 97
          },
          {
            "thought": "Gonna check everywhere! So busy 👀",
            "behavior": "Multi-direction Attention · Active Search",
            "signal": "Fast Gaze Shift + Forward Weight",
            "confidence": 91
          }
        ],
        "calm": [
          {
            "thought": "Next to my human is the best~ So happy ☀️",
            "behavior": "Relaxed · Trust Bond Signal",
            "signal": "Low Motion + Normal Breathing",
            "confidence": 98
          },
          {
            "thought": "Sniff... Did you eat meat today? ",
            "behavior": "Olfactory Analysis · Relaxed Search",
            "signal": "Nasal Expansion · Slow Move",
            "confidence": 92
          },
          {
            "thought": "Sleepy... My eyes are closing 😴",
            "behavior": "Pre-sleep Relaxation · Guard Down",
            "signal": "Nictitating Membrane Relaxed",
            "confidence": 96
          },
          {
            "thought": "Today's walk and food were perfect",
            "behavior": "Satisfied Relaxed · Serotonin State",
            "signal": "Low Tail Wag + Soft Eyes",
            "confidence": 99
          },
          {
            "thought": "Whose smell is this? I'll wait",
            "behavior": "Passive Wait · Stimulus Wait",
            "signal": "Ears Listening + Low Motion",
            "confidence": 90
          },
          {
            "thought": "You look happy! I'm happy too ",
            "behavior": "Emotional Sync · Empathy Response",
            "signal": "Gaze Tracking + Slow Tail Wag",
            "confidence": 94
          }
        ]
      }
    },
    "studio": {
      "title": "Pet Studio",
      "subtitle": "Create viral story & 4-cut webtoon cards",
      "reRollQuip": "Rethink Punchline",
      "downloadPng": "Download Comic PNG",
      "downloading": "Rendering...",
      "postToFeed": "Post to Feed",
      "postSuccess": "Successfully posted to WalWal Feed!",
      "downloadComplete": "File downloaded successfully!"
    },
    "radar": {
      "greetingLabel": "Greeting",
      "greetingEmpty": "Hello! Nice to meet you 😊",
      "title": "Paw Radar",
      "dogsNearby": "Dogs walking nearby",
      "startVirtualChat": "Pet Tok",
      "sendNote": "Message Mom/Dad",
      "myLocation": "My Current Location",
      "apiKeyModalTitle": "Google Maps API Setup",
      "apiKeyModalDesc": "Enter Google Cloud API Key to switch to official Google Map tiles.",
      "mapTypeToggle": "Toggle Map View",
      "darkMap": "Dark Radar Map",
      "generalMap": "Standard Map",
      "meetupLocation": "Meetup Location",
      "realtimeThought": "Real-time Thoughts",
      "nearby": "nearby"
    },
    "pro": {
      "badge": "WalWal Pro",
      "heading": "Discover Your Dog's Inner Mind",
      "highlight": "Without Any Limits",
      "tagline": "World's #1 AR Dog Translator & Social App",
      "benefit1": "Unlimited Real-time AR Translation & Tiki-Taka",
      "benefit2": "Watermark-free 4K Story Card Downloads",
      "benefit3": "Radar Range Expanded to 5km",
      "benefit4": "Weekly Canine Stress & Joy Analytics",
      "cta": "Start Premium Subscription",
      "activeText": "You are on WalWal Pro",
      "price": "$6.99 / mo",
      "trialDesc": "100% Free for 7 days · Then $6.99/month, cancel anytime",
      "bannerSub": "$6.99/mo · Unlimited AI Translation & No Watermark",
      "storeNotice": "Google Play & App Store Safe Subscription · $0 charged if canceled within 7 days"
    },
    "auth": {
      "welcomeTitle": "Where conversations with your dog begin",
      "welcomeSub": "Experience special moments with WalWal",
      "continueApple": "Continue with Apple",
      "continueGoogle": "Continue with Google",
      "continueGuest": "Start as Guest"
    },
    "paywall": {
      "title": "WalWal Pro",
      "subtitle": "A borderless pet community",
      "feature1": "Unlimited Real-time AI Translation",
      "feature2": "4K Saves without Watermark",
      "feature3": "Auto-translation for Global Community",
      "price": "$8.99 / month",
      "trial": "7 days free trial, then billed monthly",
      "subscribeBtn": "Start Premium Subscription",
      "terms": "Cancel anytime."
    },
    "community": {
      "subtitle": "Gather local friends for a walk today!",
      "alertCreate": "New walk meetup creation popup will open!",
      "btnCreate": "Create Meetup",
      "host": "Host",
      "tabMeetup": "Walk Meetups",
      "tabFeed": "Dog Thoughts Feed",
      "hostMom": "Mom",
      "hostDad": "Dad",
      "tooltipLocation": "Click to check location on map",
      "tooltipDirections": "Open directions in Google Maps",
      "directions": "Directions",
      "participants": "Participants",
      "peopleCount": " people",
      "filterUpcoming": "Upcoming",
      "filterJoined": "My Walks",
      "filterPast": "Past Walks",
      "joined": "Joined",
      "btnJoin": "Join Meetup",
      "btnPostComment": "Post",
      "placeholderComment": "Add a comment...",
      "btnClose": "Close",
      "modalParticipantsTitle": "Participating Dog Friends",
      "modalCreateTitle": "Create Walk Meetup",
      "modalTitleLabel": "Meetup Title",
      "modalTitlePlaceholder": "e.g. Weekend Han River Park Walk!",
      "modalLocationLabel": "Location",
      "modalLocationPlaceholder": "e.g. Central Park",
      "modalTimeLabel": "Time",
      "modalTimePlaceholder": "e.g. This Sunday 3 PM",
      "modalTagLabel": "Tag",
      "modalTagPlaceholder": "#LargeDogsWelcome",
      "modalMaxLabel": "Max People",
      "modalBtnSubmit": "Create Meetup",
      "selectPetTitle": "Select Dogs for Walk",
      "selectPetDesc": "Please select which dog(s) will join this meetup. (Multiple selection allowed)",
      "allPetsBtn": "All Dogs (all {count})",
      "btnJoinWithCount": "Join with {count} dog(s)",
      "minOnePetAlert": "Please select at least 1 dog.",
      "joinReqBeforeChat": "Please join the meetup first to enter the chat room.",
      "participatingNeighbors": "Neighbors:",
      "senderProfile": "Send as:",
      "chatPlaceholder": "Type message as {name}...",
      "participantsCountSuffix": "joined",
      "mock": {
        "m1": { "title": "🌙 Seoul Forest Night Sniffing Walk", "location": "Seoul Forest Central Lawn", "time": "Tonight at 8:30 PM", "tag": "#LargeDogsWelcome" },
        "m2": { "title": " Corgi & Short-legged Friends Gather!", "location": "Ttukseom Hangang Park Picnic Zone", "time": "Tomorrow at 3:00 PM", "tag": "#ShortLegsClub" },
        "m3": { "title": " Quiet Healing Walk for Timid Fluffballs", "location": "Salgoji Bridge Promenade", "time": "Sunday at 10:00 AM", "tag": "#SmallDogsOnly" }
      }
    },
    "share": {
      "title": "Select Share Platform",
      "watermarkTop": "[WalWal AI]",
      "watermarkTopSuffix": "Edition",
      "speechTitleSuffix": "Mind",
      "watermarkFooter": "WalWal AI Dog Translator & Companion (walwal.app)",
      "rendering": "Rendering card...",
      "downloadComplete": "High-quality card downloaded!",
      "redirecting": "Redirecting to platform...",
      "errorGenerate": "Failed to generate image.",
      "shareSuccess": "Image sent successfully!",
      "shareCancel": "Sharing cancelled.",
      "clipboardSuccess": "Copied to clipboard! Paste in ${toastTarget}.",
      "manualAdd": "${toastTarget} opened! Please add the image manually.",
      "errorShare": "Error during sharing.",
      "download": "Download",
      "more": "More",
      "subtitles": {
        "instagram": "Video will be optimized for high quality on Instagram.",
        "tiktok": "Video will be optimized for TikTok's 9:16 format.",
        "youtube": "Video will be rendered for YouTube Shorts.",
        "download": "Saved locally in original 4K quality.",
        "more": "Send via Messages, AirDrop, etc."
      }
    },
    "breedQuips": {
      "golden": {
        "ko": [
          "와! 새로운 친구다! 나랑 당장 놀자! 온못으로 환영해!!",
          "저기 형아 주머니에 소시지 냄새 난다! 꼬리 모터 300% 가동!!"
        ],
        "en": [
          "OMG a new friend! Play with me right now! I love everyone!!",
          "I smell sausages in your pocket! Tail propeller at 300%!!"
        ],
        "ja": [
          "わぁ！新しいお友達だ！今すぐ一緒に遊ぼう！！",
          "あのお兄さんのポケットからソーセージの匂いがする！尻尾全開！！"
        ],
        "es": [
          "¡Un nuevo amigo! ¡Juega conmigo ahora mismo! ¡Los amo a todos!",
          "¡Huelo salchichas en tu bolsillo! ¡Cola a máxima velocidad!"
        ]
      },
      "shiba": {
        "ko": [
          "너 나한테 관심 갖지 마라. 꼬리 흔든 건 기분 좋아서가 아니라 반동 추진력이다.",
          "눈 마주쳤다고 친구 먹을 생각 마. 내 퍼스널 스페이스 2미터 유지해라."
        ],
        "en": [
          "Do not look at me. Wiggling my tail was just recoil propulsion.",
          "Keep your 6-foot distance. We are not friends just because we made eye contact."
        ],
        "ja": [
          "私に関わるな。尻尾を振ったのは反動の推進力だ。",
          "目が合ったからって友達気取りするな。2mの距離を保て。"
        ],
        "es": [
          "No me mires. Mover la cola fue solo propulsión de retroceso.",
          "Mantén tu distancia de 2 metros. No somos amigos solo por cruzar miradas."
        ]
      },
      "maltese": {
        "ko": [
          "말티즈는 참지 않아! 집사야 나한테 집중해! 다른 개 쳐다보지 마 앙앙!!",
          "내가 귀엽다고 만만하게 보지 마라! 내 안에 맹수의 피가 흔른다! 🦁"
        ],
        "en": [
          "Maltese never holds back! Human, focus on ME! Stop looking at other dogs!",
          "Do not underestimate my cuteness! The blood of a fierce beast runs in me! 🦁"
        ],
        "ja": [
          "マルチーズは我慢しない！ご主人様、私だけに集中して！他の犬を見ないで！",
          "可愛いからって甘く見るな！私の中には猛獣の血が流れている！🦁"
        ],
        "es": [
          "¡El Maltés no se guarda nada! ¡Humano, mírame solo a mí!",
          "¡No subestimes mi ternura! ¡Por mis venas corre sangre de fiera! 🦁"
        ]
      },
      "corgi": {
        "ko": [
          "다리는 짧아도 내 앉덩이 모터 회전수는 분당 3000RPM이다 씨룩씨룩! ",
          "다리 길다고 유세 떨지 마라! 내 무게중심이 지구상에서 제일 안정적이다 컹컹!"
        ],
        "en": [
          "My legs may be short, but my booty RPM is 3000 per minute! ",
          "Do not brag about your long legs! My center of gravity is superior!"
        ],
        "ja": [
          "足は短くてもお尻の回転数は毎分3000回だワン！プリプリ！",
          "足が長いからって威張るな！私の重心の低さこそ至高！"
        ],
        "es": [
          "¡Mis patas serán cortas, pero mi cola gira a 3000 RPM! ",
          "¡No presumas de patas largas! ¡Mi centro de gravedad es invencible!"
        ]
      },
      "pome": {
        "ko": [
          "나 솜사탕 아니다! 맹수다! 어흥! 비둘기 너 내 구역에서 당장 꺼져 앙앙! 🦁",
          "내 털 120% 부풀었다! 이 압도적인 사자 갈기에 다들 기절하겠지?! "
        ],
        "en": [
          "I am not cotton candy! I am an apex predator! Pigeon, get off my lawn! 🦁",
          "My fur expanded by 120%! Kneel before my majestic lion mane! "
        ],
        "ja": [
          "私は綿あめじゃない！猛獣だ！ハトよ、私の縄張りから出て行け！🦁",
          "毛量が120%膨らんだ！この圧倒的なライオンの鬣にひれ伏すがいい！"
        ],
        "es": [
          "¡No soy un algodón de azúcar! ¡Soy un depredador! ¡Paloma, vete de mi territorio! 🦁",
          "¡Mi pelaje se infló un 120%! ¡Arrodíllense ante mi melena de león! "
        ]
      },
      "poodle": {
        "ko": [
          "집사야 표정보니 지금 죄책감 드는 타이밍이다? 고개 45도 간식 득템 ",
          "인간들이 날 귀여워하는 패턴을 완벽히 데이터화했다. 완벽한 애교 출력 중!"
        ],
        "en": [
          "Human looks guilty right now. Perfect time for the 45-degree head tilt! Treat acquired ",
          "I have fully calculated human psychology. Executing optimal cuteness algorithm!"
        ],
        "ja": [
          "ご主人様、今罪悪感を感じてるな？首を45度かしげる技を発動！おやつゲット",
          "人間が私を可愛いと思うパターンを完全データ化。完璧な愛嬍bを出力中！"
        ],
        "es": [
          "El humano parece culpable. ¡Momento perfecto para inclinar la cabeza 45 grados! Premio conseguido ",
          "He calculado la psicología humana. ¡Ejecutando algoritmo de ternura!"
        ]
      }
    }
  },
  "ja": {
    "appTitle": "WalWal AR · 犬種特化AI",
    "subtitle": "AI リアルタイム翻訳機",
    "common": {
      "genderShortMale": "オス",
      "genderShortFemale": "メス",
      "gpsReceiving": "🛰️ リアルタイムGPS信号を受信中..."
    },
    "tabs": {
      "ar": "ペットトーク",
      "radar": "レーダー",
      "studio": "ペットスタジオ",
      "community": "散歩",
      "feed": "フィード",
      "profile": "マイペット"
    },
    "feed": {
      "subtitle": "世界中のすべての可愛さ、わんこフィード",
      "commentTitle": "コメント",
      "noComments": "まだコメントがありません",
      "beFirstComment": "コメントを残してみましょう。",
      "commentPlaceholder": "コメントを追加...",
      "deleteComment": "コメント削除"
    },
    "legal": {
      "faqTitle": "よくある質問",
      "termsTitle": "利用規約",
      "privacyTitle": "プライバシーポリシー",
      "faqQ1": "WalWalアプリではどのようなプレミアム機能を提供していますか？",
      "faqA1": "WalWalは完全有料のサブスクリプションサービスです。登録すると、複数の愛犬プロフィール管理、高精度のリアルタイムAR吠え声翻訳、グローバルコミュニティ（オフ会）マッチング機能を広告なしで無制限にご利用いただけます。",
      "faqQ2": "犬のプロフィールはいくつ追加できますか？",
      "faqA2": "サブスクリプション期間中は、無制限に愛犬のプロフィールを追加して管理できます。",
      "termsContent": "第1条（目的）\n本規約は、WalWalサービスの利用に関して、会社と会員間の権利、義務、および責任事項を規定することを目的とします。\n\n第2条（サービスの提供）\n会社は、円滑なペットコミュニケーションを支援するためにAR翻訳およびコミュニティサービスを提供します。",
      "privacyContent": "1. 収集する個人情報\nメール、ニックネーム、デバイス権限（マイク、カメラなど）。\n\n2. 利用目的\n- 犬のAR吠え声分析サービスの提供\n- 位置情報ベースのペットコミュニティマッチングの提供"
    },
    "settings": {
      "title": "設定",
      "proTitle": "WalWal Pro サブスクリプション",
      "proStatus": "無料トライアル中",
      "restorePurchase": "購入の復元",
      "preferences": "アプリ設定",
      "language": "言語 (Language)",
      "notifications": "通知",
      "radarAlert": "レーダーアラート",
      "meetupAlert": "ミートアップ",
      "feedAlert": "フィードアクティビティ",
      "permissions": "権限",
      "camera": "カメラ",
      "mic": "マイク",
      "location": "位置情報",
      "support": "サポートと規約",
      "faq": "よくある質問",
      "terms": "利用規約",
      "privacy": "プライバシーポリシー",
      "account": "アカウント管理",
      "logout": "ログアウト",
      "deleteAccount": "アカウント削除",
      "confirmDelete": "本当にアカウントを削除しますか？すべてのデータは完全に消去されます。",
      "logoutError": "ログアウト中にエラーが発生しました。"
    },
    "profile": {
      "greetingLabel": "挨拶",
      "greetingPlaceholder": "例：こんにちは！うちの犬はおやつが大好きです。",
      "greetingEmpty": "初めまして！挨拶を登録してください😊",
      "genderLabel": "性別",
      "genderMale": "オス (Male)",
      "genderFemale": "メス (Female)",
      "presetPersonalities": [
        "#超陽キャ",
        "#人間みんな友達",
        "#おやつ検査官",
        "#おしり食パン",
        "#短足の誇り",
        "#おやつハンター",
        "#イケワン",
        "#マルチーズの気性",
        "#好奇心旺盛",
        "#甘えん坊",
        "#ママっ子",
        "#散歩中毒"
      ],
      "breedOptions": [
        "マルチーズ",
        "プードル",
        "ポメラニアン",
        "チワワ",
        "シーズー",
        "ヨークシャーテリア",
        "コッカースパニエル",
        "ビーグル",
        "珍島犬",
        "ウェルシュコーギー",
        "ゴールデンレトリバー",
        "ジャーマンシェパード",
        "シベリアンハスキー",
        "テリア",
        "ダックスフント",
        "スピッツ",
        "スタッグハウンド",
        "ポインター",
        "レトリバー",
        "コンパニオンドッグ"
      ],
      "ownerTitleSelect": "呼称選択",
      "mom": "ママ",
      "dad": "パパ",
      "title": "マイペット",
      "subtitle": "愛犬のプロフィールとAI翻訳設定",
      "addNew": "新しく登録する",
      "justNow": "たった今",
      "hostMom": "ママ/パパ",
      "alertNameRequired": "ワンちゃんの名前を入力してください！",
      "noteIntro": "こんにちは！{ownerName}です。{dogName}({breed})と散歩中です！",
      "noteReply1": "初めまして！今{distance}近くの芝生を歩いています。ゆっくり来てくださいね！🐾",
      "noteReply2": "いいですね！{dogName}も友達に会うのが大好きです。挨拶しましょう！",
      "noteReply3": "メッセージありがとうございます！おやつを持ってきたので一緒に食べましょう😊",
      "notePlaceholder": "{ownerName}さんにメッセージを送る...",
      "noteSend": "送信",
      "noteSending": "送信中...",
      "noteTemplate1": "こんにちは！散歩コースが重なっていますね。わんちゃん同士挨拶しませんか？🐾",
      "noteTemplate2": "わんちゃんとても可愛いですね！うちの子と気が合いそうです😊",
      "noteTemplate3": "今どちらへ向かっていますか？匂い交換に行きます！🐕",
      "noteTemplate4": "今日のお散歩オフ会に参加する予定はありますか？✨",
      "edit": "編集する",
      "owner": "ママ/パパ",
      "proActiveSub": "透かしなし4Kカードと無制限翻訳が有効です",
      "statTranslate": "AI翻訳回数",
      "statWebtoon": "ペット写真スタジオ",
      "statMeetup": "お散歩会参加",
      "langSetting": "言語設定 (Language)",
      "modalEdit": "愛犬のプロフィール編集",
      "modalAdd": "新しい愛犬を登録",
      "uploadPhoto": "カメラボタンを押してアップロード、または下のプリセットを選択",
      "dogName": "愛犬の名前",
      "dogNamePlaceholder": "例: ポチ、太郎、ハナ",
      "dogBreed": "犬種 (犬種特化AI行動学エンジン連動)",
      "dogAge": "年齢",
      "dogAgeSuffix": "歳",
      "dogAgePlaceholder": "数字のみ",
      "ownerName": "ママ/パパの名前",
      "ownerPlaceholder": "例: 犬ママ、お散歩好き",
      "personality": "愛犬の性格タグ (最大3つ)",
      "cancel": "キャンセル",
      "save": "保存する"
    },
    "ar": {
      "ethologyBtn": "犬種行動学",
      "liveWebcam": "カメラON",
      "simulator": "シミュレーター",
      "retranslate": "再翻訳",
      "captureShorts": "保存",
      "audioFreq": "鳴き声周波数検知",
      "speechSuffix": "の本音",
      "ethologyModalTitle": "犬種行動学(Ethology)の基準",
      "tailInterpretation": "尻尾振りの解釈",
      "barkInterpretation": "鳴き声の解釈",
      "personaTitle": "犬種ペルソナ",
      "petTokOn": "ペットトーク",
      "petTranslator": "愛犬の心の声通訳機",
      "petTokOff": "ペットトーク",
      "aiDetection": "AI検出中",
      "realtimeAI": " リアルタイムAI行動分析",
      "behaviorBark": "吠える",
      "behaviorGrowl": "唸る",
      "behaviorWhine": "鳴く",
      "behaviorActive": "活発",
      "behaviorCalm": "安定",
      "freqAnalyzing": "リアルタイム周波数分析中",
      "nextTurn": "次へ",
      "analyzing": "分析中",
      "ownerNote": "ママ(パパ) メッセージ",
      "confidence": "信頼度 98.4%",
      "realtimeAnalysisSuffix": " (3歳, おとなしい)",
      "basisPrefix": "分析根拠: ",
      "mockDogCenter": "きなこ (中央)",
      "mockDogLeft": "チョコ (左)",
      "mockDogRight": "ムンチ (右)",
      "mockDogCenterName": "きなこ",
      "mockDogLeftName": "チョコ",
      "mockDogRightName": "ムンチ",
      "mockGolden": "ゴールデンレトリバー",
      "mockBori": "ボリ",
      "mockBoriThought": "\"クンクン… お兄ちゃんのポケットにソーセージ100%!! しっぽプロペラ、回してみる？ \"",
      "mockBoriBasis": "95%純粋な好意と歓迎（遊びの誘惑）",
      "afLock": "オートフォーカス",
      "liveScenarios": {
        "bark": [
          {
            "thought": "誰だ!! 僕の領域から出て行け!! 😠",
            "behavior": "警戒吠え · 領域防衛",
            "signal": "持続的な吠え検知",
            "confidence": 98
          },
          {
            "thought": "早くドア開けて! 外に出たいワン!!",
            "behavior": "要求吠え · 行動促し",
            "signal": "断続的な要求吠え検知",
            "confidence": 98
          },
          {
            "thought": "ご主人様だ!! 僕ここだよワン!!",
            "behavior": "歓迎吠え · 再会の興奮",
            "signal": "反復的な吠えパターン",
            "confidence": 99
          },
          {
            "thought": "変な匂いがする! 気をつけてワン!!",
            "behavior": "警報吠え · 脅威認識",
            "signal": "連続的な吠えバースト",
            "confidence": 94
          },
          {
            "thought": "あの音聞こえた?! 僕に任せて!!",
            "behavior": "探知吠え · 聴覚刺激反応",
            "signal": "外部刺激反応の吠え",
            "confidence": 96
          }
        ],
        "whine": [
          {
            "thought": "どこ行くの... 僕を一人にしないで 🥺",
            "behavior": "分離不安サイン · 愛着表現",
            "signal": "高周波のクンクン鳴き",
            "confidence": 96
          },
          {
            "thought": "お腹すいた... お肉ちょうだい...",
            "behavior": "食欲アピール · 要求表現",
            "signal": "持続的な高周波発声",
            "confidence": 94
          },
          {
            "thought": "足の裏が変... 痛いみたい 😢",
            "behavior": "痛み/不快サイン · 注意喚起",
            "signal": "低い鳴き声 + 姿勢変化",
            "confidence": 88
          },
          {
            "thought": "すごく楽しい! 早く散歩行こう!",
            "behavior": "興奮抑制サイン · 期待感",
            "signal": "興奮性高周波発声",
            "confidence": 95
          },
          {
            "thought": "怖い匂い... ぴったりくっついてよう 😰",
            "behavior": "不安カーミングサイン · 保護要請",
            "signal": "不安性のクンクン鳴き",
            "confidence": 91
          }
        ],
        "growl": [
          {
            "thought": "近づかないで。ここは僕の場所だ 😤",
            "behavior": "警告のうなり声 · 領域主張",
            "signal": "低周波持続うなり検知",
            "confidence": 98
          },
          {
            "thought": "それ僕の! 触らないで 👀",
            "behavior": "資源防衛うなり · 所有反応",
            "signal": "資源前の低周波発声",
            "confidence": 95
          },
          {
            "thought": "今狩り遊びモードだぞ! ガオー",
            "behavior": "遊びうなり · 遊びの誘い",
            "signal": "遊び中の低周波発声",
            "confidence": 89
          },
          {
            "thought": "なんか気に入らない... 見張ってるぞ 🤨",
            "behavior": "不満うなり · 不快サイン",
            "signal": "断続的な低周波うなり",
            "confidence": 93
          }
        ],
        "active": [
          {
            "thought": "何かあるクンクン! 匂い追跡開始!",
            "behavior": "無声探索 · 嗅覚主導の移動",
            "signal": "高モーション+低音量 · 探索",
            "confidence": 95
          },
          {
            "thought": "僕のエリアパトロール中! 異常なし",
            "behavior": "パトロール歩行 · 領域確認",
            "signal": "規則的な移動パターン",
            "confidence": 93
          },
          {
            "thought": "あっちから面白い匂い! 行ってみよう 🎾",
            "behavior": "自発的移動 · 遊び探索",
            "signal": "速い移動 + 耳が前方直立",
            "confidence": 96
          },
          {
            "thought": "走りたい! 全速力でゴーゴー",
            "behavior": "過剰エネルギー · 運動欲求",
            "signal": "全身の筋肉緊張+移動反復",
            "confidence": 97
          },
          {
            "thought": "あっちもこっちも見なきゃ! 大忙し 👀",
            "behavior": "多方向注意 · 活発な探索",
            "signal": "速い視線移動 + 体重前方",
            "confidence": 91
          }
        ],
        "calm": [
          {
            "thought": "隣が一番いいな〜 幸せ ☀️",
            "behavior": "弛緩安定 · 信頼の絆サイン",
            "signal": "低モーション + 正常呼吸",
            "confidence": 98
          },
          {
            "thought": "クンクン... 今日お肉食べたね? ",
            "behavior": "嗅覚環境分析 · 弛緩探索",
            "signal": "鼻腔拡張 · ゆっくり移動",
            "confidence": 92
          },
          {
            "thought": "眠い... 目が閉じちゃう 😴",
            "behavior": "睡眠前の弛緩 · 警戒緩和",
            "signal": "瞬膜弛緩 + 呼吸が遅い",
            "confidence": 96
          },
          {
            "thought": "今日の散歩もご飯も完璧だった",
            "behavior": "満足弛緩 · セロトニン状態",
            "signal": "尻尾の低いワギング+柔らかい目",
            "confidence": 99
          },
          {
            "thought": "誰の匂い? 待ってみよう",
            "behavior": "受動的待機 · 刺激待ち",
            "signal": "耳側面の傾聴 + 低モーション",
            "confidence": 90
          },
          {
            "thought": "機嫌良さそう! 僕も嬉しい ",
            "behavior": "情動同期 · 共感反応",
            "signal": "視線追跡 + 尻尾の徐行ワギング",
            "confidence": 94
          }
        ]
      }
    },
    "studio": {
      "title": "ペットスタジオ",
      "subtitle": "愛犬の個性が光るバズカード作成",
      "reRollQuip": "セリフ再生成",
      "downloadPng": "4コマPNG保存",
      "downloading": "描画中...",
      "postToFeed": "フィードに投稿",
      "postSuccess": "フィードに正常に投稿されました！🎉",
      "downloadComplete": "ファイルがダウンロードされました！🎉"
    },
    "radar": {
      "greetingLabel": "挨拶",
      "greetingEmpty": "こんにちは！よろしくね😊",
      "title": "ポーレーダー",
      "dogsNearby": "周辺でお散歩中のワンちゃん",
      "startVirtualChat": "ペットトーク",
      "sendNote": "ママ/パパにメッセージ",
      "myLocation": "現在地",
      "apiKeyModalTitle": "Google Maps APIキー設定",
      "apiKeyModalDesc": "Google Cloud APIキーを入力すると、公式Googleマップが即座に有効化されます。",
      "mapTypeToggle": "マップ切り替え",
      "darkMap": "ダークレーダーマップ",
      "generalMap": "一般マップ",
      "meetupLocation": "集合場所",
      "realtimeThought": "リアルタイム本音",
      "nearby": "付近"
    },
    "pro": {
      "badge": "WalWal Pro",
      "heading": "愛犬の本当の気持ちを",
      "highlight": "限界なく無制限に覗き見る",
      "tagline": "世界中の愛犬家のためのNo.1 AR翻訳アプリ",
      "benefit1": "リアルタイムAR翻訳＆掛け合い無制限",
      "benefit2": "透かし完全除去＆4K高画質保存",
      "benefit3": "レーダー探索範囲5kmへ扩張",
      "benefit4": "愛犬のストレス・幸福度AI分析レポート",
      "cta": "7日間無料体験を始める",
      "activeText": "Proプランをご利用中です",
      "price": "月額 980円",
      "trialDesc": "7日間100%無料体験 · その後月額980円（いつでも解約可能）",
      "bannerSub": "月額980円 · 透かしなし無制限AI翻訳",
      "storeNotice": "Google Play & App Store 安心定期購読 · 7日以内の解約で請求0円",
      "successMsg": "Proプランへのご登録ありがとうございます！🐾",
      "unlimitedAccess": "プレミアム無制限アクセス",
      "proPremium": "WalWal Pro"
    },
    "auth": {
      "welcomeTitle": "愛犬との対話が始まる場所",
      "welcomeSub": "WalWalで特別なコミュニケーションを",
      "continueApple": "Appleで続ける",
      "continueGoogle": "Googleで続ける"
    },
    "paywall": {
      "title": "WalWal Pro",
      "subtitle": "言葉の壁を超えたグローバルペットコミュニティ",
      "feature1": "無制限のリアルタイムAI翻訳",
      "feature2": "透かしなしの4K保存",
      "feature3": "グローバルコミュニティ自動翻訳",
      "price": "月額 980円",
      "trial": "7日間無料体験後にお支払い",
      "subscribeBtn": "7日間無料体験を始める",
      "terms": "いつでもキャンセル可能です。"
    },
    "community": {
      "subtitle": "今日一緒に散歩する近所の友達集まれ！",
      "alertCreate": "新しいお散歩会の作成ポップアップが開きます！",
      "btnCreate": "集まりを作成",
      "host": "主催",
      "tabMeetup": "お散歩会",
      "tabFeed": "ワンちゃんの本音フィード",
      "hostMom": "ママ",
      "hostDad": "パパ",
      "tooltipLocation": "クリックして地図で位置を確認",
      "tooltipDirections": "Googleマップで経路を開く",
      "directions": "経路",
      "participants": "参加人数",
      "peopleCount": "人",
      "filterUpcoming": "今後の散歩",
      "filterJoined": "私の散歩",
      "filterPast": "過去の散歩",
      "joined": "参加確定",
      "btnJoin": "参加を申し込む",
      "btnPostComment": "投稿",
      "placeholderComment": "コメントを追加...",
      "btnClose": "閉じる",
      "modalParticipantsTitle": "参加中の犬の友達",
      "modalCreateTitle": "お散歩会を作成",
      "modalTitleLabel": "タイトル",
      "modalTitlePlaceholder": "例：週末の公園散歩！",
      "modalLocationLabel": "場所",
      "modalLocationPlaceholder": "例：代々木公園",
      "modalTimeLabel": "日時",
      "modalTimePlaceholder": "例：今週の日曜日 午後3時",
      "modalTagLabel": "タグ",
      "modalTagPlaceholder": "#大型犬歓迎",
      "modalMaxLabel": "最大人数",
      "modalBtnSubmit": "登録する",
      "selectPetTitle": "一緒に散歩する愛犬を選択",
      "selectPetDesc": "今回の散歩に参加する愛犬を選択してください。（複数選択可）",
      "allPetsBtn": "すべての愛犬（全{count}頭）",
      "btnJoinWithCount": "{count}頭の愛犬と一緒に参加する",
      "minOnePetAlert": "少なくとも1頭の愛犬を選択してください。",
      "joinReqBeforeChat": "イベントに参加申請後、チャットルームに入室できます。",
      "participatingNeighbors": "参加メンバー:",
      "senderProfile": "送信元:",
      "chatPlaceholder": "{name}としてメッセージ入力...",
      "participantsCountSuffix": "人参加中",
      "mock": {
        "m1": { "title": "🌙 ソウルの森 夜のクンクン散歩", "location": "ソウルの森 中央芝生広場", "time": "今日の夜 8:30", "tag": "#大型犬歓迎" },
        "m2": { "title": " コーギー＆短足仲間集まれ！", "location": "トゥクソム漢江公園 ピクニックゾーン", "time": "明日の午後 3:00", "tag": "#短足クラブ" },
        "m3": { "title": " 臆病なもふもふ達の静かな癒し散歩", "location": "サルゴジ橋 散歩道", "time": "日曜日 午前 10:00", "tag": "#小型犬専用" }
      }
    },
    "share": {
      "title": "シェア先を選択",
      "watermarkTop": "[WalWal AI]",
      "watermarkTopSuffix": "編",
      "speechTitleSuffix": "の本音",
      "watermarkFooter": "WalWal AI 愛犬リアルタイム翻訳 & コンパニオン (walwal.app)",
      "rendering": "カードを作成中...",
      "downloadComplete": "高画質カードがダウンロードされました！",
      "redirecting": "登録画面へ移動中...",
      "errorGenerate": "画像の生成に失敗しました。",
      "shareSuccess": "アプリへ画像を送信しました！",
      "shareCancel": "シェアがキャンセルされました。",
      "clipboardSuccess": "クリップボードにコピーされました！ ${toastTarget} に貼り付けてください。",
      "manualAdd": "${toastTarget} が開きました！手動で画像を追加してください。",
      "errorShare": "シェア処理中にエラーが発生しました。",
      "download": "ダウンロード",
      "more": "その他",
      "subtitles": {
        "instagram": "Instagramで高品質で再生されるよう最適化されます。",
        "tiktok": "TikTokの9:16フルスクリーンに合わせて最適化されます。",
        "youtube": "YouTube Shortsのアルゴリズムに合わせた高画質でレンダリングされます。",
        "download": "端末に無損失の4K画質で保存されます。",
        "more": "メッセージ、AirDropなど好きなプラットフォームへ転送します。"
      }
    },
    "breedQuips": {
      "golden": {
        "ko": [
          "와! 새로운 친구다! 나랑 당장 놀자! 온못으로 환영해!!",
          "저기 형아 주머니에 소시지 냄새 난다! 꼬리 모터 300% 가동!!"
        ],
        "en": [
          "OMG a new friend! Play with me right now! I love everyone!!",
          "I smell sausages in your pocket! Tail propeller at 300%!!"
        ],
        "ja": [
          "わぁ！新しいお友達だ！今すぐ一緒に遊ぼう！！",
          "あのお兄さんのポケットからソーセージの匂いがする！尻尾全開！！"
        ],
        "es": [
          "¡Un nuevo amigo! ¡Juega conmigo ahora mismo! ¡Los amo a todos!",
          "¡Huelo salchichas en tu bolsillo! ¡Cola a máxima velocidad!"
        ]
      },
      "shiba": {
        "ko": [
          "너 나한테 관심 갖지 마라. 꼬리 흔든 건 기분 좋아서가 아니라 반동 추진력이다.",
          "눈 마주쳤다고 친구 먹을 생각 마. 내 퍼스널 스페이스 2미터 유지해라."
        ],
        "en": [
          "Do not look at me. Wiggling my tail was just recoil propulsion.",
          "Keep your 6-foot distance. We are not friends just because we made eye contact."
        ],
        "ja": [
          "私に関わるな。尻尾を振ったのは反動の推進力だ。",
          "目が合ったからって友達気取りするな。2mの距離を保て。"
        ],
        "es": [
          "No me mires. Mover la cola fue solo propulsión de retroceso.",
          "Mantén tu distancia de 2 metros. No somos amigos solo por cruzar miradas."
        ]
      },
      "maltese": {
        "ko": [
          "말티즈는 참지 않아! 집사야 나한테 집중해! 다른 개 쳐다보지 마 앙앙!!",
          "내가 귀엽다고 만만하게 보지 마라! 내 안에 맹수의 피가 흔른다! 🦁"
        ],
        "en": [
          "Maltese never holds back! Human, focus on ME! Stop looking at other dogs!",
          "Do not underestimate my cuteness! The blood of a fierce beast runs in me! 🦁"
        ],
        "ja": [
          "マルチーズは我慢しない！ご主人様、私だけに集中して！他の犬を見ないで！",
          "可愛いからって甘く見るな！私の中には猛獣の血が流れている！🦁"
        ],
        "es": [
          "¡El Maltés no se guarda nada! ¡Humano, mírame solo a mí!",
          "¡No subestimes mi ternura! ¡Por mis venas corre sangre de fiera! 🦁"
        ]
      },
      "corgi": {
        "ko": [
          "다리는 짧아도 내 앉덩이 모터 회전수는 분당 3000RPM이다 씨룩씨룩! ",
          "다리 길다고 유세 떨지 마라! 내 무게중심이 지구상에서 제일 안정적이다 컹컹!"
        ],
        "en": [
          "My legs may be short, but my booty RPM is 3000 per minute! ",
          "Do not brag about your long legs! My center of gravity is superior!"
        ],
        "ja": [
          "足は短くてもお尻の回転数は毎分3000回だワン！プリプリ！",
          "足が長いからって威張るな！私の重心の低さこそ至高！"
        ],
        "es": [
          "¡Mis patas serán cortas, pero mi cola gira a 3000 RPM! ",
          "¡No presumas de patas largas! ¡Mi centro de gravedad es invencible!"
        ]
      },
      "pome": {
        "ko": [
          "나 솜사탕 아니다! 맹수다! 어흥! 비둘기 너 내 구역에서 당장 꺼져 앙앙! 🦁",
          "내 털 120% 부풀었다! 이 압도적인 사자 갈기에 다들 기절하겠지?! "
        ],
        "en": [
          "I am not cotton candy! I am an apex predator! Pigeon, get off my lawn! 🦁",
          "My fur expanded by 120%! Kneel before my majestic lion mane! "
        ],
        "ja": [
          "私は綿あめじゃない！猛獣だ！ハトよ、私の縄張りから出て行け！🦁",
          "毛量が120%膨らんだ！この圧倒的なライオンの鬣にひれ伏すがいい！"
        ],
        "es": [
          "¡No soy un algodón de azúcar! ¡Soy un depredador! ¡Paloma, vete de mi territorio! 🦁",
          "¡Mi pelaje se infló un 120%! ¡Arrodíllense ante mi melena de león! "
        ]
      },
      "poodle": {
        "ko": [
          "집사야 표정보니 지금 죄책감 드는 타이밍이다? 고개 45도 간식 득템 ",
          "인간들이 날 귀여워하는 패턴을 완벽히 데이터화했다. 완벽한 애교 출력 중!"
        ],
        "en": [
          "Human looks guilty right now. Perfect time for the 45-degree head tilt! Treat acquired ",
          "I have fully calculated human psychology. Executing optimal cuteness algorithm!"
        ],
        "ja": [
          "ご主人様、今罪悪感を感じてるな？首を45度かしげる技を発動！おやつゲット",
          "人間が私を可愛いと思うパターンを完全データ化。完璧な愛嬍bを出力中！"
        ],
        "es": [
          "El humano parece culpable. ¡Momento perfecto para inclinar la cabeza 45 grados! Premio conseguido ",
          "He calculado la psicología humana. ¡Ejecutando algoritmo de ternura!"
        ]
      }
    }
  },
  "es": {
    "appTitle": "WalWal AR · IA de Razas",
    "subtitle": "Traductor de IA en Tiempo Real",
    "common": {
      "genderShortMale": "M",
      "genderShortFemale": "H",
      "gpsReceiving": "🛰️ Recibiendo señal GPS..."
    },
    "tabs": {
      "ar": "Pet Tok",
      "radar": "Radar",
      "studio": "Pet Studio",
      "community": "Paseo",
      "feed": "Feed",
      "profile": "Mi Mascota"
    },
    "feed": {
      "subtitle": "Toda la ternura del mundo, feed perrito",
      "commentTitle": "Comentarios",
      "noComments": "Aún no hay comentarios",
      "beFirstComment": "Sé el primero en comentar.",
      "commentPlaceholder": "Añadir un comentario...",
      "deleteComment": "Eliminar comentario"
    },
    "legal": {
      "faqTitle": "Preguntas frecuentes",
      "termsTitle": "Términos de servicio",
      "privacyTitle": "Política de privacidad",
      "faqQ1": "¿Qué funciones premium ofrece la aplicación WalWal?",
      "faqA1": "WalWal es un servicio de suscripción totalmente premium. Al suscribirse, obtendrá acceso ilimitado y sin anuncios a la gestión de múltiples perfiles de perros, traducción de ladridos AR en tiempo real y emparejamiento con la comunidad global de mascotas.",
      "faqQ2": "¿Cuántos perros puedo añadir?",
      "faqA2": "Durante tu suscripción, puedes añadir y gestionar un número ilimitado de perfiles de perros sin restricciones.",
      "termsContent": "Artículo 1 (Propósito)\nEl propósito de estos Términos es definir los derechos y obligaciones entre la empresa y el usuario con respecto al servicio WalWal.\n\nArtículo 2 (Provisión de servicios)\nLa empresa proporciona traducción AR y servicios comunitarios para facilitar la comunicación con las mascotas.",
      "privacyContent": "1. Información recopilada\nCorreo electrónico, apodo, permisos del dispositivo (micrófono, cámara, etc.).\n\n2. Propósito de uso\n- Proporcionar servicios de análisis de ladridos AR\n- Ofrecer emparejamiento comunitario de mascotas basado en la ubicación"
    },
    "settings": {
      "title": "Ajustes",
      "proTitle": "Suscripción WalWal Pro",
      "proStatus": "Prueba gratuita activa",
      "restorePurchase": "Restaurar compras",
      "preferences": "Preferencias de la aplicación",
      "language": "Idioma (Language)",
      "notifications": "Notificaciones",
      "radarAlert": "Alertas de radar",
      "meetupAlert": "Reuniones",
      "feedAlert": "Actividad del feed",
      "permissions": "Permisos",
      "camera": "Cámara",
      "mic": "Micrófono",
      "location": "Ubicación",
      "support": "Soporte y legal",
      "faq": "Preguntas frecuentes",
      "terms": "Términos de servicio",
      "privacy": "Política de privacidad",
      "account": "Gestión de cuenta",
      "logout": "Cerrar sesión",
      "deleteAccount": "Eliminar cuenta",
      "confirmDelete": "¿Estás seguro de que quieres eliminar tu cuenta? Todos los datos se perderán permanentemente.",
      "logoutError": "Ocurrió un error al cerrar sesión."
    },
    "profile": {
      "greetingLabel": "Saludo",
      "greetingPlaceholder": "Ej. ¡Hola! A mi perro le encantan los premios.",
      "greetingEmpty": "¡Hola! Por favor, registra un saludo 😊",
      "genderLabel": "Género",
      "genderMale": "Macho (Male)",
      "genderFemale": "Hembra (Female)",
      "presetPersonalities": [
        "#SúperSociable",
        "#AmigoDeTodos",
        "#InspectorDeSnacks",
        "#TraseroDePan",
        "#OrgulloPatasCortas",
        "#CazadorDeSnacks",
        "#PerritoConEstilo",
        "#MaltésLuchador",
        "#ExploradorCurioso",
        "#Cariñoso",
        "#NiñoDeMamá",
        "#AdictoAlPaseo"
      ],
      "breedOptions": [
        "Bichón Maltés",
        "Caniche",
        "Pomerania",
        "Chihuahua",
        "Shih Tzu",
        "Yorkshire Terrier",
        "Cocker Spaniel",
        "Beagle",
        "Jindo",
        "Corgi Galés",
        "Golden Retriever",
        "Pastor Alemán",
        "Husky Siberiano",
        "Terrier",
        "Dachshund",
        "Spitz",
        "Staghound",
        "Pointer",
        "Retriever",
        "Perro de Compañía"
      ],
      "ownerTitleSelect": "Seleccionar título",
      "mom": "Mamá",
      "dad": "Papá",
      "title": "Mi Mascota",
      "subtitle": "Perfil del perro y configuración del traductor AI",
      "addNew": "Añadir Mascota",
      "justNow": "Justo ahora",
      "hostMom": "Mamá",
      "hostDad": "Papá",
      "alertNameRequired": "¡Por favor, ingresa el nombre de tu perrito!",
      "noteIntro": "¡Hola! Soy {ownerName}. Estoy paseando con {dogName}({breed}).",
      "noteReply1": "¡Mucho gusto! Estamos caminando cerca de {distance}. ¡Tómate tu tiempo!",
      "noteReply2": "¡Claro! A {dogName} le encanta hacer nuevos amigos. ¡Vamos a saludarnos!",
      "noteReply3": "¡Gracias por el mensaje! Traje algunos snacks, ¡vamos a compartirlos! 😊",
      "notePlaceholder": "Enviar un mensaje a {ownerName}...",
      "noteSend": "Enviar",
      "noteSending": "Enviando...",
      "noteTemplate1": "¡Hola! Nuestras rutas coinciden, ¿pueden nuestros perros saludarse?",
      "noteTemplate2": "¡Tu perro es hermoso! Creo que se llevará bien con el mío 😊",
      "noteTemplate3": "¿Hacia dónde caminan? ¡Iremos a intercambiar olores! 🐕",
      "noteTemplate4": "¿Te interesa unirte a un encuentro rápido hoy? ✨",
      "edit": "Editar",
      "owner": "Mamá/Papá",
      "proActiveSub": "Tarjetas 4K sin marca de agua y traducción ilimitada activa",
      "statTranslate": "Traducciones AI",
      "statWebtoon": "Pet Studio Generado",
      "statMeetup": "Paseos en Grupo",
      "langSetting": "Configuración de Idioma",
      "modalEdit": "Editar Perfil de Mascota",
      "modalAdd": "Registrar Nueva Mascota",
      "uploadPhoto": "Haz clic en la cámara para subir foto o elige un modelo",
      "dogName": "Nombre del perro",
      "dogNamePlaceholder": "ej: Max, Luna, Toby",
      "dogBreed": "Raza (Motor de Etología AI Vinculado)",
      "dogAge": "Edad",
      "dogAgeSuffix": "años",
      "dogAgePlaceholder": "Solo número",
      "ownerName": "Nombre de Mamá/Papá",
      "ownerPlaceholder": "ej: Mamá perruna, Paseador",
      "personality": "Etiquetas de personalidad (Máx. 3)",
      "cancel": "Cancelar",
      "save": "Guardar"
    },
    "ar": {
      "ethologyBtn": "Etología",
      "liveWebcam": "Cámara ON",
      "simulator": "Simulador",
      "retranslate": "Re-analizar",
      "captureShorts": "Guardar",
      "audioFreq": "Frecuencia de Ladrido",
      "speechSuffix": " - Pensamiento Real",
      "ethologyModalTitle": "Criterios de Etología Canina",
      "tailInterpretation": "Significado de la Cola",
      "barkInterpretation": "Significado del Ladrido",
      "personaTitle": "Personalidad de la Raza",
      "petTokOn": "Pet Tok",
      "petTranslator": "Pet Translator & Companion",
      "petTokOff": "Pet Tok",
      "aiDetection": "Detección AI",
      "realtimeAI": " Análisis de IA en Tiempo Real",
      "behaviorBark": "Ladrido",
      "behaviorGrowl": "Gruñido",
      "behaviorWhine": "Gemido",
      "behaviorActive": "Activo",
      "behaviorCalm": "Tranquilo",
      "freqAnalyzing": "Analizando frecuencia del ladrido",
      "nextTurn": "Continuar",
      "analyzing": "Analizando",
      "ownerNote": "Mensaje Mamá(Papá)",
      "confidence": "Confianza 98.4%",
      "realtimeAnalysisSuffix": " (3 años, Suave)",
      "basisPrefix": "Base: ",
      "mockDogCenter": "Injeolmi (Centro)",
      "mockDogLeft": "Choco (Izquierda)",
      "mockDogRight": "Moongchi (Derecha)",
      "mockDogCenterName": "Injeolmi",
      "mockDogLeftName": "Choco",
      "mockDogRightName": "Moongchi",
      "mockGolden": "Golden Retriever",
      "mockBori": "Bori",
      "mockBoriThought": "\"¡Sniff sniff! ¡100% salchichas en el bolsillo de mi hermano! ¿Enciendo la hélice de la cola? \"",
      "mockBoriBasis": "95% pura buena voluntad y bienvenida (tentación de juego)",
      "afLock": "Enfoque Automático",
      "liveScenarios": {
        "bark": [
          {
            "thought": "¡¿Quién es?! ¡Fuera de mi territorio! 😠",
            "behavior": "Ladrido de Alerta · Defensa",
            "signal": "Ladrido Continuo Detectado",
            "confidence": 98
          },
          {
            "thought": "¡Abre la puerta! ¡Quiero salir!",
            "behavior": "Ladrido de Demanda · Urgencia",
            "signal": "Ladrido de Demanda Intermitente",
            "confidence": 98
          },
          {
            "thought": "¡Mi humano está aquí! ¡Estoy aquí!",
            "behavior": "Ladrido de Bienvenida · Emoción",
            "signal": "Patrón de Ladridos Repetidos",
            "confidence": 99
          },
          {
            "thought": "¡Olor extraño! ¡Cuidado!",
            "behavior": "Ladrido de Advertencia · Amenaza",
            "signal": "Ráfaga de Ladridos Continuos",
            "confidence": 94
          },
          {
            "thought": "¡¿Escuchaste eso?! ¡Déjamelo a mí!",
            "behavior": "Ladrido de Detección · Respuesta",
            "signal": "Respuesta a Estímulo Externo",
            "confidence": 96
          }
        ],
        "whine": [
          {
            "thought": "¿A dónde vas...? No me dejes solo 🥺",
            "behavior": "Ansiedad por Separación",
            "signal": "Lloriqueo de Alta Frecuencia",
            "confidence": 96
          },
          {
            "thought": "Hambriento... dame carne...",
            "behavior": "Apelación de Apetito · Demanda",
            "signal": "Vocalización Continua Alta",
            "confidence": 94
          },
          {
            "thought": "Mi pata se siente rara... creo que duele 😢",
            "behavior": "Dolor/Incomodidad · Atención",
            "signal": "Lloriqueo Bajo + Cambio Postura",
            "confidence": 88
          },
          {
            "thought": "¡Qué emoción! ¡Vamos a pasear!",
            "behavior": "Supresión de Emoción · Anticipación",
            "signal": "Vocalización Emocionada Alta",
            "confidence": 95
          },
          {
            "thought": "Olor asustadizo... me quedaré cerca 😰",
            "behavior": "Calmar Ansiedad · Protección",
            "signal": "Lloriqueo Ansioso",
            "confidence": 91
          }
        ],
        "growl": [
          {
            "thought": "No te acerques. Este es mi territorio 😤",
            "behavior": "Gruñido de Advertencia · Territorial",
            "signal": "Gruñido Continuo Bajo",
            "confidence": 98
          },
          {
            "thought": "¡Eso es mío! No lo toques 👀",
            "behavior": "Defensa de Recursos",
            "signal": "Vocalización Baja en Recurso",
            "confidence": 95
          },
          {
            "thought": "¡Modo caza activado! Grrr",
            "behavior": "Gruñido de Juego · Invitación",
            "signal": "Vocalización Baja en Juego",
            "confidence": 89
          },
          {
            "thought": "No me gusta esto... te vigilo 🤨",
            "behavior": "Gruñido de Disgusto · Incómodo",
            "signal": "Gruñido Bajo Intermitente",
            "confidence": 93
          }
        ],
        "active": [
          {
            "thought": "¡Sniff sniff! ¡Rastreando olor!",
            "behavior": "Búsqueda Silenciosa · Olfato",
            "signal": "Alto Movimiento + Bajo Vol",
            "confidence": 95
          },
          {
            "thought": "¡Patrullando mi área! Todo despejado",
            "behavior": "Paseo de Patrulla · Revisión",
            "signal": "Patrón de Movimiento Regular",
            "confidence": 93
          },
          {
            "thought": "¡Olor divertido! ¡Vamos! 🎾",
            "behavior": "Movimiento Espontáneo · Juego",
            "signal": "Movimiento Rápido + Orejas Adelante",
            "confidence": 96
          },
          {
            "thought": "¡Quiero correr! A toda velocidad",
            "behavior": "Exceso de Energía · Ejercicio",
            "signal": "Tensión Corporal + Movimiento",
            "confidence": 97
          },
          {
            "thought": "¡Revisaré todo! Tan ocupado 👀",
            "behavior": "Atención Multidireccional",
            "signal": "Cambio Rápido de Mirada",
            "confidence": 91
          }
        ],
        "calm": [
          {
            "thought": "Junto a ti es lo mejor~ Tan feliz ☀️",
            "behavior": "Relajado · Señal de Confianza",
            "signal": "Bajo Movimiento + Respiración Normal",
            "confidence": 98
          },
          {
            "thought": "Sniff... ¿Comiste carne hoy? ",
            "behavior": "Análisis Olfativo · Búsqueda",
            "signal": "Expansión Nasal · Mov Lento",
            "confidence": 92
          },
          {
            "thought": "Sueño... Mis ojos se cierran 😴",
            "behavior": "Relajación Pre-sueño",
            "signal": "Membrana Nictitante Relajada",
            "confidence": 96
          },
          {
            "thought": "El paseo y comida fueron perfectos",
            "behavior": "Satisfecho Relajado · Serotonina",
            "signal": "Movimiento de Cola Bajo + Ojos Suaves",
            "confidence": 99
          },
          {
            "thought": "¿De quién es este olor? Esperaré",
            "behavior": "Espera Pasiva · Estímulo",
            "signal": "Orejas Escuchando + Mov Bajo",
            "confidence": 90
          },
          {
            "thought": "¡Te ves feliz! Yo también lo estoy ",
            "behavior": "Sincronización Emocional",
            "signal": "Seguimiento de Mirada + Cola",
            "confidence": 94
          }
        ]
      }
    },
    "studio": {
      "title": "Pet Studio",
      "subtitle": "Crea historias y tarjetas virales para redes",
      "reRollQuip": "Nueva Frase",
      "downloadPng": "Descargar Cómic PNG",
      "downloading": "Generando...",
      "postToFeed": "Publicar en Feed",
      "postSuccess": "¡Publicado con éxito en el Feed!",
      "downloadComplete": "¡Archivo descargado con éxito!"
    },
    "radar": {
      "greetingLabel": "Saludo",
      "greetingEmpty": "¡Hola! Encantado de conocerte 😊",
      "title": "Paw Radar",
      "dogsNearby": "Perritos paseando cerca",
      "startVirtualChat": "Pet Tok",
      "sendNote": "Mensaje a Mamá/Papá",
      "myLocation": "Mi Ubicación",
      "apiKeyModalTitle": "Configuración de Clave API Google Maps",
      "apiKeyModalDesc": "Ingrese su clave API de Google Cloud para activar mapas oficiales.",
      "mapTypeToggle": "Cambiar Mapa",
      "darkMap": "Mapa Radar Oscuro",
      "generalMap": "Mapa Estándar",
      "meetupLocation": "Lugar de Encuentro",
      "realtimeThought": "Pensamientos en Tiempo Real",
      "nearby": "cerca"
    },
    "pro": {
      "badge": "WalWal Pro",
      "heading": "Descubre la Mente de tu Perro",
      "highlight": "Sin Ningún Límite",
      "tagline": "La app #1 del mundo en traducción AR para mascotas",
      "benefit1": "Traducción AR ilimitada en tiempo real",
      "benefit2": "Descarga 4K sin marca de agua",
      "benefit3": "Radar ampliado a 5 km",
      "benefit4": "Reporte semanal de emociones y bienestar",
      "cta": "Comenzar Prueba Gratis de 7 Días",
      "activeText": "Plan WalWal Pro Activo",
      "price": "6,99 € / mes",
      "trialDesc": "100% Gratis por 7 días · Luego 6,99 €/mes (cancela cuando quieras)",
      "bannerSub": "6,99 €/mes · Traducción AI ilimitada sin marca de agua",
      "storeNotice": "Suscripción segura en Google Play y App Store · 0 € si cancelas en 7 días"
    },
    "auth": {
      "welcomeTitle": "Donde comienzan las conversaciones",
      "welcomeSub": "Experimenta momentos especiales con WalWal",
      "continueApple": "Continuar con Apple",
      "continueGoogle": "Continuar con Google"
    },
    "paywall": {
      "title": "WalWal Pro",
      "subtitle": "Una comunidad de mascotas sin fronteras",
      "feature1": "Traducción AI en tiempo real ilimitada",
      "feature2": "Guardar en 4K sin marca de agua",
      "feature3": "Traducción automática global",
      "price": "$8.99 / mes",
      "trial": "7 días de prueba gratis",
      "subscribeBtn": "Comenzar Prueba Gratis de 7 Días",
      "terms": "Cancela en cualquier momento."
    },
    "community": {
      "subtitle": "¡Reúnete con amigos del barrio para un paseo!",
      "alertCreate": "¡Se abrirá la ventana para crear un encuentro!",
      "btnCreate": "Crear Encuentro",
      "host": "Anfitrión",
      "tabMeetup": "Encuentros de Paseo",
      "tabFeed": "Pensamientos de Perros",
      "hostMom": "Mamá",
      "hostDad": "Papá",
      "tooltipLocation": "Haz clic para ver la ubicación en el mapa",
      "tooltipDirections": "Abrir en Google Maps",
      "directions": "Direcciones",
      "participants": "Participantes",
      "peopleCount": " personas",
      "filterUpcoming": "Próximos",
      "filterJoined": "Mis Paseos",
      "filterPast": "Paseos Pasados",
      "joined": "Confirmado",
      "btnJoin": "Unirse al Paseo",
      "btnPostComment": "Publicar",
      "placeholderComment": "Añadir un comentario...",
      "btnClose": "Cerrar",
      "modalParticipantsTitle": "Amigos Perros Participantes",
      "modalCreateTitle": "Crear Reunión de Paseo",
      "modalTitleLabel": "Título de la Reunión",
      "modalTitlePlaceholder": "ej. ¡Paseo de fin de semana!",
      "modalLocationLabel": "Lugar",
      "modalLocationPlaceholder": "ej. Parque Central",
      "modalTimeLabel": "Fecha y hora",
      "modalTimePlaceholder": "ej. Este domingo a las 3 PM",
      "modalTagLabel": "Etiqueta",
      "modalTagPlaceholder": "#PerrosGrandesBienvenidos",
      "modalMaxLabel": "Personas máximas",
      "modalBtnSubmit": "Crear Reunión",
      "selectPetTitle": "Seleccionar Perros para el Paseo",
      "selectPetDesc": "Selecciona qué perro(s) participarán en este encuentro. (Selección múltiple)",
      "allPetsBtn": "Todos los perros ({count} en total)",
      "btnJoinWithCount": "Unirse con {count} perro(s)",
      "minOnePetAlert": "Por favor, selecciona al menos 1 perro.",
      "joinReqBeforeChat": "Debes unirte al encuentro antes de entrar al chat.",
      "participatingNeighbors": "Vecinos:",
      "senderProfile": "Enviar como:",
      "chatPlaceholder": "Mensaje como {name}...",
      "participantsCountSuffix": "participando",
      "mock": {
        "m1": { "title": "🌙 Paseo Nocturno Bosque de Seúl", "location": "Césped Central Bosque de Seúl", "time": "Hoy a las 8:30 PM", "tag": "#PerrosGrandesBienvenidos" },
        "m2": { "title": " ¡Club de Patas Cortas!", "location": "Zona de Picnic Río Han", "time": "Mañana a las 3:00 PM", "tag": "#PatasCortas" },
        "m3": { "title": " Paseo Tranquilo para Peludos", "location": "Puente Salgoji", "time": "Domingo a las 10:00 AM", "tag": "#SoloPerrosPequeños" }
      }
    },
    "share": {
      "title": "Seleccionar Plataforma",
      "watermarkTop": "[WalWal AI]",
      "watermarkTopSuffix": "Edición",
      "speechTitleSuffix": "Pensamiento",
      "watermarkFooter": "WalWal AI Traductor & Compañero Canino (walwal.app)",
      "rendering": "Generando tarjeta...",
      "downloadComplete": "¡Tarjeta guardada en alta calidad!",
      "redirecting": "Redirigiendo...",
      "errorGenerate": "Error al generar imagen.",
      "shareSuccess": "¡Imagen enviada!",
      "shareCancel": "Compartir cancelado.",
      "clipboardSuccess": "¡Copiado al portapapeles! Pégalo en ${toastTarget}.",
      "manualAdd": "¡Se abrió ${toastTarget}! Agrega la foto manualmente.",
      "errorShare": "Error al compartir.",
      "download": "Descargar",
      "more": "Más",
      "subtitles": {
        "instagram": "Optimizado para alta calidad en Instagram.",
        "tiktok": "Optimizado para el formato 9:16 de TikTok.",
        "youtube": "Renderizado para YouTube Shorts.",
        "download": "Guardado en el dispositivo en 4K.",
        "more": "Enviar por Mensajes, AirDrop, etc."
      }
    },
    "breedQuips": {
      "golden": {
        "ko": [
          "와! 새로운 친구다! 나랑 당장 놀자! 온못으로 환영해!!",
          "저기 형아 주머니에 소시지 냄새 난다! 꼬리 모터 300% 가동!!"
        ],
        "en": [
          "OMG a new friend! Play with me right now! I love everyone!!",
          "I smell sausages in your pocket! Tail propeller at 300%!!"
        ],
        "ja": [
          "わぁ！新しいお友達だ！今すぐ一緒に遊ぼう！！",
          "あのお兄さんのポケットからソーセージの匂いがする！尻尾全開！！"
        ],
        "es": [
          "¡Un nuevo amigo! ¡Juega conmigo ahora mismo! ¡Los amo a todos!",
          "¡Huelo salchichas en tu bolsillo! ¡Cola a máxima velocidad!"
        ]
      },
      "shiba": {
        "ko": [
          "너 나한테 관심 갖지 마라. 꼬리 흔든 건 기분 좋아서가 아니라 반동 추진력이다.",
          "눈 마주쳤다고 친구 먹을 생각 마. 내 퍼스널 스페이스 2미터 유지해라."
        ],
        "en": [
          "Do not look at me. Wiggling my tail was just recoil propulsion.",
          "Keep your 6-foot distance. We are not friends just because we made eye contact."
        ],
        "ja": [
          "私に関わるな。尻尾を振ったのは反動の推進力だ。",
          "目が合ったからって友達気取りするな。2mの距離を保て。"
        ],
        "es": [
          "No me mires. Mover la cola fue solo propulsión de retroceso.",
          "Mantén tu distancia de 2 metros. No somos amigos solo por cruzar miradas."
        ]
      },
      "maltese": {
        "ko": [
          "말티즈는 참지 않아! 집사야 나한테 집중해! 다른 개 쳐다보지 마 앙앙!!",
          "내가 귀엽다고 만만하게 보지 마라! 내 안에 맹수의 피가 흔른다! 🦁"
        ],
        "en": [
          "Maltese never holds back! Human, focus on ME! Stop looking at other dogs!",
          "Do not underestimate my cuteness! The blood of a fierce beast runs in me! 🦁"
        ],
        "ja": [
          "マルチーズは我慢しない！ご主人様、私だけに集中して！他の犬を見ないで！",
          "可愛いからって甘く見るな！私の中には猛獣の血が流れている！🦁"
        ],
        "es": [
          "¡El Maltés no se guarda nada! ¡Humano, mírame solo a mí!",
          "¡No subestimes mi ternura! ¡Por mis venas corre sangre de fiera! 🦁"
        ]
      },
      "corgi": {
        "ko": [
          "다리는 짧아도 내 앉덩이 모터 회전수는 분당 3000RPM이다 씨룩씨룩! ",
          "다리 길다고 유세 떨지 마라! 내 무게중심이 지구상에서 제일 안정적이다 컹컹!"
        ],
        "en": [
          "My legs may be short, but my booty RPM is 3000 per minute! ",
          "Do not brag about your long legs! My center of gravity is superior!"
        ],
        "ja": [
          "足は短くてもお尻の回転数は毎分3000回だワン！プリプリ！",
          "足が長いからって威張るな！私の重心の低さこそ至高！"
        ],
        "es": [
          "¡Mis patas serán cortas, pero mi cola gira a 3000 RPM! ",
          "¡No presumas de patas largas! ¡Mi centro de gravedad es invencible!"
        ]
      },
      "pome": {
        "ko": [
          "나 솜사탕 아니다! 맹수다! 어흥! 비둘기 너 내 구역에서 당장 꺼져 앙앙! 🦁",
          "내 털 120% 부풀었다! 이 압도적인 사자 갈기에 다들 기절하겠지?! "
        ],
        "en": [
          "I am not cotton candy! I am an apex predator! Pigeon, get off my lawn! 🦁",
          "My fur expanded by 120%! Kneel before my majestic lion mane! "
        ],
        "ja": [
          "私は綿あめじゃない！猛獣だ！ハトよ、私の縄張りから出て行け！🦁",
          "毛量が120%膨らんだ！この圧倒的なライオンの鬣にひれ伏すがいい！"
        ],
        "es": [
          "¡No soy un algodón de azúcar! ¡Soy un depredador! ¡Paloma, vete de mi territorio! 🦁",
          "¡Mi pelaje se infló un 120%! ¡Arrodíllense ante mi melena de león! "
        ]
      },
      "poodle": {
        "ko": [
          "집사야 표정보니 지금 죄책감 드는 타이밍이다? 고개 45도 간식 득템 ",
          "인간들이 날 귀여워하는 패턴을 완벽히 데이터화했다. 완벽한 애교 출력 중!"
        ],
        "en": [
          "Human looks guilty right now. Perfect time for the 45-degree head tilt! Treat acquired ",
          "I have fully calculated human psychology. Executing optimal cuteness algorithm!"
        ],
        "ja": [
          "ご主人様、今罪悪感を感じてるな？首を45度かしげる技を発動！おやつゲット",
          "人間が私を可愛いと思うパターンを完全データ化。完璧な愛嬍bを出力中！"
        ],
        "es": [
          "El humano parece culpable. ¡Momento perfecto para inclinar la cabeza 45 grados! Premio conseguido ",
          "He calculado la psicología humana. ¡Ejecutando algoritmo de ternura!"
        ]
      }
    }
  }
};

export function detectUserLanguage(): Language {
  if (typeof window === 'undefined') return 'ko';
  const browserLang = (navigator.language || (navigator as any).userLanguage || 'ko').toLowerCase();
  if (browserLang.startsWith('en')) return 'en';
  if (browserLang.startsWith('ja')) return 'ja';
  if (browserLang.startsWith('es')) return 'es';
  return 'ko';
}
