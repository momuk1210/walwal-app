export interface DogProfile {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender?: 'male' | 'female';
  ownerName: string;
  avatar: string;
  personality: string[];
  distance: string; // e.g. "120m"
  lat: number;
  lng: number;
  recentThought: string;
  greeting?: string; // 인사말 (주인이 직접 등록)
  feedImage?: string;
  detectedEmotion: 'happy' | 'excited' | 'curious' | 'dramatic' | 'hungry';
  soundPattern: string; // e.g. "왈! 멍멍!"
  posePattern: string; // e.g. "꼬리 180도 회전, 귀 쫑긋"
  conversationLog: { speaker: string; text: string; time: string }[];
  stats?: {
    translateCount: number;
    studioCount: number;
    meetupCount: number;
  };
}

const MOCK_DOGS_KO: DogProfile[] = [
  {
    id: 'dog-1',
    name: '보리',
    breed: '골든 리트리버',
    age: '2',
    gender: 'male',
    ownerName: '보리 맘',
    avatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80',
    personality: ['#파워인싸', '#모든인간은내친구', '#간식감별사'],
    distance: '85m',
    lat: 37.5445,
    lng: 127.0560,
    recentThought: '형아 주머니 소시지 내꺼! 꼬리 프로펠러 가동!! 🍖',
    feedImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80',
    detectedEmotion: 'excited',
    soundPattern: '왕! (저음 고주파 혼합음)',
    posePattern: '꼬리 수평 회전 + 앞발 교차',
    conversationLog: [
      { speaker: '보리', text: '오! 댕댕이 친구 엉덩이 냄새 스캔!! 킁킁', time: '방금 전' },
      { speaker: '땅콩', text: '덩치값 좀 해라! 냄새 먼저 맡는게 예의지!', time: '방금 전' },
      { speaker: '보리', text: '헤헤 냄새만 맡아도 오늘 저녁 메뉴 안다구~', time: '1분 전' }
    ]
  },
  {
    id: 'dog-2',
    name: '땅콩',
    breed: '웰시코기',
    age: '3',
    gender: 'male',
    ownerName: '땅콩 아빠',
    avatar: 'https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=300&auto=format&fit=crop&q=80',
    personality: ['#식빵엉덩이', '#숏다리의자존심', '#간식헌터'],
    distance: '140m',
    lat: 37.5452,
    lng: 127.0575,
    recentThought: '내 다리 짧다고 무시마라! 자존심은 2미터다 😤',
    feedImage: 'https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=300&auto=format&fit=crop&q=80',
    detectedEmotion: 'curious',
    soundPattern: '왈왈! 컹! (경쾌한 비트)',
    posePattern: '엉덩이 씰룩 + 정면 고정 응시',
    conversationLog: [
      { speaker: '땅콩', text: '집사야 오늘 빵집 골목 산책 잊지마라 🍞', time: '3분 전' },
      { speaker: '구름', text: '땅콩 오빠! 새 날아간다! 짖어줘!', time: '2분 전' }
    ]
  },
  {
    id: 'dog-3',
    name: '구름이',
    breed: '화이트 포메라니안',
    age: '1',
    gender: 'female',
    ownerName: '구름이 엄마',
    avatar: 'https://images.dog.ceo/breeds/pomeranian/n02112018_4813.jpg',
    personality: ['#귀여움이권력', '#극대노솜뭉치', '#파워쫄보'],
    distance: '210m',
    lat: 37.5460,
    lng: 127.0550,
    recentThought: '오토바이 소리 무서워ㅠㅠ 집사 뒤로 피신할래 💨',
    feedImage: 'https://images.dog.ceo/breeds/pomeranian/n02112018_4813.jpg',
    detectedEmotion: 'dramatic',
    soundPattern: '앙! 앙앙! (초고주파 솜뭉치음)',
    posePattern: '털 120% 팽창 + 뒷걸음질 3스텝',
    conversationLog: [
      { speaker: '구름이', text: '비둘기 쫓아냈다! 나 맹수 맞지 집사야?', time: '5분 전' },
      { speaker: '보리', text: '그냥 날아간 거 같은데... 😅', time: '4분 전' }
    ]
  },
  {
    id: 'dog-4',
    name: '모찌',
    breed: '시바견',
    age: '4',
    gender: 'male',
    ownerName: '모짜 아빠',
    avatar: 'https://images.dog.ceo/breeds/shiba/shiba-16.jpg',
    personality: ['#철벽남', '#안가시바', '#마이웨이'],
    distance: '320m',
    lat: 37.5440,
    lng: 127.0580,
    recentThought: '오늘의 목표: 낙엽 10개 밟기 달성! 바스락 소리 최고🍂',
    feedImage: 'https://images.dog.ceo/breeds/shiba/shiba-16.jpg',
    detectedEmotion: 'happy',
    soundPattern: '우우우- (시바 세레나데)',
    posePattern: '사지 접지력 100% 버티기 + 볼살 늘어짐',
    conversationLog: [
      { speaker: '모찌', text: '5분만 흙냄새 더 맡고 가자. 바쁘냐?', time: '10분 전' },
      { speaker: '땅콩', text: '모찌 형 또 땅에 껌딱지처럼 붙었네 ㅋㅋ', time: '8분 전' }
    ]
  }
];

export const AI_QUIPS: Record<string, string[]> = {
  excited: [
    "헐 대박! 뼈다귀 냄새다!! 🦴",
    "집사 발걸음 느려! 우주선 속도로 가자 🚀",
    "지나가는 인간들 다 내 미모에 감탄 중 ✨"
  ],
  hungry: [
    "저 손가락 각도... 트릿 봉지 뜯는 각도다 🥩",
    "사료에 고기 토핑 없으면 슬리퍼 뜯을거야",
    "꼬르륵... 나만 들리는 거 아니지? 🤤"
  ],
  curious: [
    "저 길고양이 눈빛 보소... 눈싸움 간다 👀",
    "전봇대에 옆 동네 뽀삐 냄새 난다!",
    "집사야 전화받는 척 산책 단축하려 하지마."
  ],
  dramatic: [
    "세상이 날 억까해도 난 잔디밭을 구를거야 🍂",
    "목줄이란... 영혼을 옭아매는 붉은 실 🎭",
    "비장한 한 마디: 내일 병원 가는 날 아니지?"
  ],
  happy: [
    "햇살 좋고 집사 튼튼하고! 살맛 난다 ☀️",
    "꼬리 모터 과열 주의보! 행복 1000% 💖",
    "집사 사랑해! 간식 주면 2배로 사랑할게!"
  ]
};

const MOCK_DOGS_EN: DogProfile[] = [
  {
    ...MOCK_DOGS_KO[0],
    name: 'Bori',
    breed: 'Golden Retriever',
    ownerName: 'Bori Mom',
    personality: ['#SocialButterfly', '#Friendly', '#SnackExpert'],
    recentThought: '"Sniff sniff... 100% sausage in bro\'s pocket!! Should I start the tail propeller? 🍖"',
    soundPattern: 'Woof (High pitch)',
    posePattern: 'Tail wagging + paws crossed',
    conversationLog: [
      { speaker: 'Bori', text: 'Hey doggy friend! Sniffing your butt!!', time: 'Just now' },
      { speaker: 'Peanut', text: 'Hey watch it! I smell first!', time: 'Just now' },
      { speaker: 'Bori', text: 'Hehe I can tell what you ate today by the smell!', time: '1m ago' }
    ]
  },
  {
    ...MOCK_DOGS_KO[1],
    name: 'Peanut',
    breed: 'Welsh Corgi',
    ownerName: 'Corgi Papa',
    personality: ['#ShortLegs', '#Stubborn', '#Energetic'],
    recentThought: '"Don\'t ignore my short legs! My pride is 2 meters high 😤"',
    soundPattern: 'Bark! (Loud)',
    posePattern: 'Ears perked up, intense stare',
    conversationLog: []
  },
  {
    ...MOCK_DOGS_KO[2],
    name: 'Cloud',
    breed: 'Pomeranian',
    ownerName: 'Cloud Mom',
    personality: ['#Timid', '#MommyBoy', '#Fluffy'],
    recentThought: '"Mom... let\'s go home... that big dog is scary 🥺"',
    soundPattern: 'Yip yip (Quietly)',
    posePattern: 'Hiding behind owner',
    conversationLog: []
  },
  {
    ...MOCK_DOGS_KO[3],
    name: 'Mochi',
    breed: 'Shiba Inu',
    ownerName: 'Shiba Owner',
    personality: ['#Independent', '#Clean', '#Doge'],
    recentThought: '"I don\'t want to walk that way. I\'m going to plant my feet here 🐕"',
    soundPattern: 'Awoo (Softly)',
    posePattern: 'Refusing to move',
    conversationLog: []
  }
];

export const MOCK_DOGS = MOCK_DOGS_KO;

export const DOG_NAME_ALIASES: Record<string, string[]> = {
  '보리': ['보리', 'bori', 'ボリ'],
  '딸기': ['딸기', 'strawberry', 'イチゴ', 'fresa'],
  '땅콩': ['땅콩', 'peanut', 'ピーナッツ', 'cacahuate'],
  '구름': ['구름', 'cloud', 'クラウド', 'nube'],
  '모찌': ['모찌', 'mochi', 'モチ']
};

export const isSameDogName = (name1?: string, name2?: string): boolean => {
  if (!name1 || !name2) return false;
  const n1 = name1.trim().toLowerCase();
  const n2 = name2.trim().toLowerCase();
  if (n1 === n2 || n1.includes(n2) || n2.includes(n1)) return true;

  for (const aliases of Object.values(DOG_NAME_ALIASES)) {
    const hasN1 = aliases.some(a => a.toLowerCase() === n1 || n1.includes(a.toLowerCase()));
    const hasN2 = aliases.some(a => a.toLowerCase() === n2 || n2.includes(a.toLowerCase()));
    if (hasN1 && hasN2) return true;
  }
  return false;
};

export const getDefaultDogAvatar = (nameOrBreed?: string): string => {
  if (!nameOrBreed) return 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80';
  const term = nameOrBreed.toLowerCase();
  if (term.includes('딸기') || term.includes('strawberry') || term.includes('말티즈') || term.includes('maltese')) {
    return 'https://images.dog.ceo/breeds/maltese/n02085936_2927.jpg';
  }
  if (term.includes('보리') || term.includes('bori') || term.includes('리트리버') || term.includes('retriever')) {
    return 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80';
  }
  if (term.includes('코기') || term.includes('corgi') || term.includes('땅콩') || term.includes('peanut')) {
    return 'https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=300&auto=format&fit=crop&q=80';
  }
  if (term.includes('포메') || term.includes('pomeranian') || term.includes('구름') || term.includes('cloud')) {
    return 'https://images.dog.ceo/breeds/pomeranian/n02112018_4813.jpg';
  }
  if (term.includes('시바') || term.includes('shiba') || term.includes('모찌') || term.includes('mochi')) {
    return 'https://images.dog.ceo/breeds/shiba/shiba-16.jpg';
  }
  return 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80';
};

export const BREED_TRANSLATIONS: Array<{ key: string; ko: string; en: string; ja: string; es: string }> = [
  { key: 'golden', ko: '골든 리트리버', en: 'Golden Retriever', ja: 'ゴールデンレトリバー', es: 'Golden Retriever' },
  { key: 'corgi', ko: '웰시코기', en: 'Welsh Corgi', ja: 'ウェルシュコーギー', es: 'Corgi Galés' },
  { key: 'pomeranian', ko: '화이트 포메라니안', en: 'Pomeranian', ja: 'ポメラニアン', es: 'Pomerania' },
  { key: 'pomeranian_short', ko: '포메라니안', en: 'Pomeranian', ja: 'ポメラニアン', es: 'Pomerania' },
  { key: 'shiba', ko: '시바견', en: 'Shiba Inu', ja: '柴犬', es: 'Shiba Inu' },
  { key: 'maltese', ko: '말티즈', en: 'Maltese', ja: 'マルチーズ', es: 'Maltés' },
  { key: 'poodle', ko: '푸들', en: 'Poodle', ja: 'プードル', es: 'Caniche' },
  { key: 'chihuahua', ko: '치와와', en: 'Chihuahua', ja: 'チワワ', es: 'Chihuahua' },
  { key: 'shih_tzu', ko: '시추', en: 'Shih Tzu', ja: 'シーズー', es: 'Shih Tzu' },
  { key: 'yorkshire', ko: '요크셔테리어', en: 'Yorkshire Terrier', ja: 'ヨークシャーテリア', es: 'Yorkshire Terrier' },
  { key: 'cocker', ko: '코카 스패니얼', en: 'Cocker Spaniel', ja: 'コッカースパニエル', es: 'Cocker Spaniel' },
  { key: 'beagle', ko: '비글', en: 'Beagle', ja: 'ビーグル', es: 'Beagle' },
  { key: 'jindo', ko: '진돗개', en: 'Jindo Dog', ja: '珍島犬', es: 'Perro Jindo' },
  { key: 'shepherd', ko: '저먼 셰퍼드', en: 'German Shepherd', ja: 'ジャーマンシェパード', es: 'Pastor Alemán' },
  { key: 'husky', ko: '시베리안 허스키', en: 'Siberian Husky', ja: 'シベリアンハスキー', es: 'Husky Siberiano' },
  { key: 'terrier', ko: '테리어', en: 'Terrier', ja: 'テリア', es: 'Terrier' },
  { key: 'dachshund', ko: '닥스훈트', en: 'Dachshund', ja: 'ダックスフント', es: 'Dachshund' },
  { key: 'spitz', ko: '스피츠', en: 'Spitz', ja: 'スピッツ', es: 'Spitz' }
];

export const PERSONALITY_TAG_TRANSLATIONS: Array<{ ko: string; en: string; ja: string; es: string }> = [
  { ko: '#파워인싸', en: '#SocialButterfly', ja: '#陽キャ犬', es: '#MariposaSocial' },
  { ko: '#모든인간은내친구', en: '#Friendly', ja: '#みんな友達', es: '#Amigable' },
  { ko: '#간식감별사', en: '#SnackExpert', ja: '#おやつ鑑定士', es: '#ExpertoEnSnacks' },
  { ko: '#식빵엉덩이', en: '#LoafBooty', ja: '#食パンお尻', es: '#TraseroDePan' },
  { ko: '#숏다리의자존심', en: '#ShortLegsPride', ja: '#短足の誇り', es: '#OrgulloPatasCortas' },
  { ko: '#간식헌터', en: '#TreatHunter', ja: '#おやつハンター', es: '#CazadorDePremios' },
  { ko: '#폼생폼사', en: '#SwagKing', ja: '#かっこつけ', es: '#PuraActitud' },
  { ko: '#참지않는말티즈', en: '#FierceMaltese', ja: '#我慢しないマルチーズ', es: '#MaltésFeroz' },
  { ko: '#호기심대마왕', en: '#CuriousExplorer', ja: '#好奇心旺盛', es: '#GranCurioso' },
  { ko: '#애교쟁이', en: '#CuddleBug', ja: '#甘えん坊', es: '#Cariñoso' },
  { ko: '#엄마바라기', en: '#MommyBoy', ja: '#ママっ子', es: '#HijoDeMamá' },
  { ko: '#산책중독자', en: '#WalkAddict', ja: '#散歩中毒', es: '#AdictoAlPaseo' },
  { ko: '#귀여움이권력', en: '#CutenessIsPower', ja: '#可愛いは正義', es: '#PoderTierno' },
  { ko: '#극대노솜뭉치', en: '#AngryFluffball', ja: '#怒りんぼモフモフ', es: '#BolitaFuria' },
  { ko: '#파워쫄보', en: '#Timid', ja: '#超ビビり', es: '#Tímido' },
  { ko: '#철벽남', en: '#Independent', ja: '#ツンデレ', es: '#Independiente' },
  { ko: '#안가시바', en: '#Stubborn', ja: '#動かない柴', es: '#Terco' },
  { ko: '#마이웨이', en: '#MyWay', ja: '#マイペース', es: '#AMiManera' },
  { ko: '#ShortLegs', en: '#ShortLegs', ja: '#短足', es: '#PatasCortas' }
];

export const localizeBreed = (breed: string, targetLang: string = 'ko'): string => {
  if (!breed) return breed;
  const match = BREED_TRANSLATIONS.find(b =>
    b.ko.toLowerCase() === breed.toLowerCase() ||
    b.en.toLowerCase() === breed.toLowerCase() ||
    b.ja.toLowerCase() === breed.toLowerCase() ||
    b.es.toLowerCase() === breed.toLowerCase() ||
    breed.toLowerCase().includes(b.ko.toLowerCase()) ||
    breed.toLowerCase().includes(b.en.toLowerCase())
  );
  if (match) {
    return (match as any)[targetLang] || match.ko;
  }
  return breed;
};

export const localizePersonalityTags = (tags: string[] = [], targetLang: string = 'ko'): string[] => {
  if (!tags || !Array.isArray(tags)) return [];
  return tags.map(tag => {
    const cleanTag = tag.startsWith('#') ? tag : `#${tag}`;
    const match = PERSONALITY_TAG_TRANSLATIONS.find(p =>
      p.ko === cleanTag ||
      p.en.toLowerCase() === cleanTag.toLowerCase() ||
      p.ja === cleanTag ||
      p.es.toLowerCase() === cleanTag.toLowerCase()
    );
    if (match) {
      return (match as any)[targetLang] || match.ko;
    }
    return cleanTag;
  });
};

export const localizeDogName = (name: string, targetLang: string = 'ko'): string => {
  if (!name) return name;
  const n = name.trim().toLowerCase();
  if (n === 'bori' || n === '보리' || n === 'ボリ') {
    return targetLang === 'ko' ? '보리' : targetLang === 'ja' ? 'ボリ' : 'Bori';
  }
  if (n === 'strawberry' || n === '딸기' || n === 'イチゴ' || n === 'fresa') {
    return targetLang === 'ko' ? '딸기' : targetLang === 'ja' ? 'イチゴ' : targetLang === 'es' ? 'Fresa' : 'Strawberry';
  }
  if (n === 'peanut' || n === '땅콩' || n === 'ピーナッツ' || n === 'cacahuate') {
    return targetLang === 'ko' ? '땅콩' : targetLang === 'ja' ? 'ピーナッツ' : 'Peanut';
  }
  if (n === 'cloud' || n === '구름' || n === '구름이' || n === 'クラウド' || n === 'nube') {
    return targetLang === 'ko' ? '구름이' : targetLang === 'ja' ? 'クラウド' : 'Cloud';
  }
  if (n === 'mochi' || n === '모찌' || n === 'モチ') {
    return targetLang === 'ko' ? '모찌' : targetLang === 'ja' ? 'モチ' : 'Mochi';
  }
  return name;
};

export const getLiveDogProfile = (dogNameOrId: string, targetLang: string = 'ko'): DogProfile | null => {
  if (!dogNameOrId) return null;
  const clean = dogNameOrId.trim();
  try {
    const saved = localStorage.getItem('WALWAL_PETS');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        const found = parsed.find((p: any) => p.id === clean || isSameDogName(p.name, clean));
        if (found) {
          return normalizeDogProfile(found, targetLang);
        }
      }
    }
  } catch (e) { }

  const mock = getMockDogs(targetLang).find(m => m.id === clean || isSameDogName(m.name, clean));
  return mock || null;
};

export const getLiveDogAvatar = (dogNameOrId?: string, fallbackAvatar?: string): string => {
  if (!dogNameOrId && !fallbackAvatar) return getDefaultDogAvatar('');

  if (dogNameOrId) {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const found = parsed.find((p: any) => p.id === dogNameOrId || isSameDogName(p.name, dogNameOrId));
          if (found?.avatar && !found.avatar.includes('photo-1517849845537-4d257902454a')) {
            return found.avatar;
          }
        }
      }
    } catch (e) { }

    const mock = getMockDogs('ko').find(m => m.id === dogNameOrId || isSameDogName(m.name, dogNameOrId));
    if (mock?.avatar) {
      return mock.avatar;
    }
  }

  if (fallbackAvatar && !fallbackAvatar.includes('photo-1517849845537-4d257902454a')) {
    return fallbackAvatar;
  }

  return getDefaultDogAvatar(dogNameOrId || '');
};

export const normalizeDogProfile = (dog: DogProfile, targetLang: string = 'ko'): DogProfile => {
  const isBori = isSameDogName(dog.name, '보리');
  const isStrawberry = isSameDogName(dog.name, '딸기');

  let fixedAvatar = dog.avatar;
  // If Bori erroneously had the pug picture or missing, normalize to Bori Golden Retriever
  if (isBori && (!fixedAvatar || fixedAvatar.includes('photo-1517849845537-4d257902454a'))) {
    fixedAvatar = 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80';
  } else if (isStrawberry && (!fixedAvatar || fixedAvatar.includes('photo-1517849845537-4d257902454a'))) {
    fixedAvatar = 'https://images.dog.ceo/breeds/maltese/n02085936_2927.jpg';
  } else if (!fixedAvatar) {
    fixedAvatar = getDefaultDogAvatar(dog.name || dog.breed);
  }

  return {
    ...dog,
    name: localizeDogName(dog.name, targetLang),
    breed: localizeBreed(dog.breed, targetLang),
    personality: localizePersonalityTags(dog.personality, targetLang),
    avatar: fixedAvatar
  };
};

export const getMockDogs = (language: string): DogProfile[] => {
  const base = language === 'ko' ? MOCK_DOGS_KO : MOCK_DOGS_EN;
  return base.map(d => normalizeDogProfile(d, language));
};
