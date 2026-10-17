export interface DogProfile {
  id: string;
  name: string;
  breed: string;
  age: string;
  gender?: 'male' | 'female';
  ownerName: string;
  ownerEmail?: string;
  joinedAt?: string;
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
  adoptionDate?: string; // 함께한 날 / 생일 (YYYY-MM-DD)
  todayWalkDistance?: number; // 오늘 산책 거리 (km)
  todayWalkMinutes?: number; // 오늘 산책 시간 (분)
  walkDistance?: number; // 누적 산책 거리 (km)
  walkMinutes?: number; // 누적 산책 시간 (분)
  dailyDistanceGoal?: number; // 일일 목표 산책 거리 (km)
  dailyTimeGoal?: number; // 일일 목표 산책 시간 (분)
  walkGoalDistance?: number; // 프로필 편집 목표 산책 거리 (km)
  walkGoalMinutes?: number; // 프로필 편집 목표 산책 시간 (분)
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
    ownerName: '보리 엄마',
    avatar: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80',
    personality: ['#파워인싸', '#모든인간은내친구', '#간식감별사'],
    distance: '85m',
    lat: 37.5445,
    lng: 127.0560,
    adoptionDate: '2024-03-15',
    walkDistance: 14.8,
    walkMinutes: 320,
    recentThought: '형아 주머니 소시지 내꺼! 꼬리 프로펠러 가동!!',
    feedImage: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80',
    detectedEmotion: 'excited',
    soundPattern: '왕! (저음 고주파 혼합음)',
    posePattern: '꼬리 수평 회전 + 앞발 교차',
    conversationLog: [
      { speaker: '보리', text: '오! 댕댕이 친구 엉덩이 냄새 스캔!! 킁킁', time: '방금 전' },
      { speaker: '보리', text: '헤헤 냄새만 맡아도 오늘 저녁 메뉴 안다구~', time: '1분 전' }
    ]
  }
];

export const AI_QUIPS: Record<string, string[]> = {
  excited: [
    "헐 대박! 뼈다귀 냄새다!!",
    "집사 발걸음 느려! 우주선 속도로 가자",
    "지나가는 인간들 다 내 미모에 감탄 중"
  ],
  hungry: [
    "저 손가락 각도... 트릿 봉지 뜯는 각도다",
    "사료에 고기 토핑 없으면 슬리퍼 뜯을거야",
    "꼬르륵... 나만 들리는 거 아니지?"
  ],
  curious: [
    "저 길고양이 눈빛 보소... 눈싸움 간다",
    "전봇대에 옆 동네 뽀삐 냄새 난다!",
    "집사야 전화받는 척 산책 단축하려 하지마."
  ],
  dramatic: [
    "세상이 날 억까해도 난 잔디밭을 구를거야",
    "목줄이란... 영혼을 옭아매는 붉은 실",
    "비장한 한 마디: 내일 병원 가는 날 아니지?"
  ],
  happy: [
    "햇살 좋고 집사 튼튼하고! 살맛 난다",
    "꼬리 모터 과열 주의보! 행복 1000%",
    "집사 사랑해! 간식 주면 2배로 사랑할게!"
  ]
};

const MOCK_DOGS_EN: DogProfile[] = [
  {
    ...MOCK_DOGS_KO[0],
    name: '보리',
    breed: 'Golden Retriever',
    ownerName: '보리 Mom',
    personality: ['#SocialButterfly', '#Friendly', '#SnackExpert'],
    recentThought: '"Sniff sniff... 100% sausage in bro\'s pocket!! Should I start the tail propeller?"',
    soundPattern: 'Woof (High pitch)',
    posePattern: 'Tail wagging + paws crossed',
    conversationLog: [
      { speaker: '보리', text: 'Hey doggy friend! Sniffing your butt!!', time: 'Just now' },
      { speaker: '보리', text: 'Hehe I can tell what you ate today by the smell!', time: '1m ago' }
    ]
  }
];

const MOCK_DOGS_JA: DogProfile[] = [
  {
    ...MOCK_DOGS_KO[0],
    name: '보리',
    breed: 'ゴールデンレトリバー',
    ownerName: '보리의ママ',
    personality: ['#人気者', '#フレンドリー', '#おやつ鑑定士'],
    recentThought: '「くんくん…兄ちゃんのポケットにソーセージ入ってるの絶対100%！しっぽプロペラ回しちゃう？！」',
    soundPattern: 'ワン！（高音）',
    posePattern: 'しっぽブンブン＋前足クロス',
    conversationLog: [
      { speaker: '보리', text: 'わあ！わんこ友達のお尻の匂いをスキャン！！クンクン', time: 'たった今' },
      { speaker: '보리', text: 'へへっ、匂いを嗅ぐだけで今日の夕飯のメニューがわかるんだ〜', time: '1분전' }
    ]
  }
];

export const MOCK_DOGS = MOCK_DOGS_KO;

export const DOG_NAME_ALIASES: Record<string, string[]> = {
  '보리': ['보리', 'bori', 'ボリ', '波利'],
  '딸기': ['딸기', 'strawberry', 'イチゴ', 'fresa', '草莓', 'fraise'],
  '땅콩': ['땅콩', 'peanut', 'ピーナッツ', 'cacahuate', '花生', 'cacahuète'],
  '구름': ['구름', '구름이', 'cloud', 'クラウド', 'nube', '白云', 'nuage'],
  '모찌': ['모찌', 'mochi', 'モチ', '麻薯']
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
  if (term.includes('딸기') || term.includes('strawberry') || term.includes('말티즈') || term.includes('maltese') || term.includes('草莓') || term.includes('fraise')) {
    return 'https://images.dog.ceo/breeds/maltese/n02085936_2927.jpg';
  }
  if (term.includes('보리') || term.includes('bori') || term.includes('리트리버') || term.includes('retriever') || term.includes('波利')) {
    return 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80';
  }
  if (term.includes('코기') || term.includes('corgi') || term.includes('땅콩') || term.includes('peanut') || term.includes('花生') || term.includes('cacahuète')) {
    return 'https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=300&auto=format&fit=crop&q=80';
  }
  if (term.includes('포메') || term.includes('pomeranian') || term.includes('구름') || term.includes('cloud') || term.includes('白云') || term.includes('nuage')) {
    return 'https://images.dog.ceo/breeds/pomeranian/n02112018_4813.jpg';
  }
  if (term.includes('시바') || term.includes('shiba') || term.includes('모찌') || term.includes('mochi') || term.includes('麻薯')) {
    return 'https://images.dog.ceo/breeds/shiba/shiba-16.jpg';
  }
  return 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80';
};

export const BREED_TRANSLATIONS: Array<{ key: string; ko: string; en: string; ja: string; es: string; zh: string; fr: string }> = [
  { key: 'golden', ko: '골든 리트리버', en: 'Golden Retriever', ja: 'ゴールデンレトリバー', es: 'Golden Retriever', zh: '金毛寻回犬', fr: 'Golden Retriever' },
  { key: 'corgi', ko: '웰시코기', en: 'Welsh Corgi', ja: 'ウェルシュコーギー', es: 'Corgi Galés', zh: '柯基犬', fr: 'Welsh Corgi' },
  { key: 'pomeranian', ko: '화이트 포메라니안', en: 'Pomeranian', ja: 'ポメラニアン', es: 'Pomerania', zh: '博美犬', fr: 'Loulou de Poméranie' },
  { key: 'pomeranian_short', ko: '포메라니안', en: 'Pomeranian', ja: 'ポメラニアン', es: 'Pomerania', zh: '博美犬', fr: 'Loulou de Poméranie' },
  { key: 'shiba', ko: '시바견', en: 'Shiba Inu', ja: '柴犬', es: 'Shiba Inu', zh: '柴犬', fr: 'Shiba Inu' },
  { key: 'maltese', ko: '말티즈', en: 'Maltese', ja: 'マルチーズ', es: 'Maltés', zh: '马尔济斯犬', fr: 'Bichon Maltais' },
  { key: 'poodle', ko: '푸들', en: 'Poodle', ja: 'プードル', es: 'Caniche', zh: '贵宾犬', fr: 'Caniche' },
  { key: 'chihuahua', ko: '치와와', en: 'Chihuahua', ja: 'チワワ', es: 'Chihuahua', zh: '吉娃娃', fr: 'Chihuahua' },
  { key: 'shih_tzu', ko: '시추', en: 'Shih Tzu', ja: 'シーズー', es: 'Shih Tzu', zh: '西施犬', fr: 'Shih Tzu' },
  { key: 'yorkshire', ko: '요크셔테리어', en: 'Yorkshire Terrier', ja: 'ヨークシャーテリア', es: 'Yorkshire Terrier', zh: '约克夏梗', fr: 'Yorkshire Terrier' },
  { key: 'cocker', ko: '코카 스패니얼', en: 'Cocker Spaniel', ja: 'コッカースパニエル', es: 'Cocker Spaniel', zh: '可卡犬', fr: 'Cocker Spaniel' },
  { key: 'beagle', ko: '비글', en: 'Beagle', ja: 'ビーグル', es: 'Beagle', zh: '比格犬', fr: 'Beagle' },
  { key: 'jindo', ko: '진돗개', en: 'Jindo Dog', ja: '珍島犬', es: 'Perro Jindo', zh: '珍岛犬', fr: 'Jindo' },
  { key: 'shepherd', ko: '저먼 셰퍼드', en: 'German Shepherd', ja: 'ジャーマンシェパード', es: 'Pastor Alemán', zh: '德国牧羊犬', fr: 'Berger Allemand' },
  { key: 'husky', ko: '시베리안 허스키', en: 'Siberian Husky', ja: 'シベリアンハスキー', es: 'Husky Siberiano', zh: '哈士奇', fr: 'Husky Sibérien' },
  { key: 'terrier', ko: '테리어', en: 'Terrier', ja: 'テリア', es: 'Terrier', zh: '梗犬', fr: 'Terrier' },
  { key: 'dachshund', ko: '닥스훈트', en: 'Dachshund', ja: 'ダックスフント', es: 'Dachshund', zh: '腊肠犬', fr: 'Teckel' },
  { key: 'spitz', ko: '스피츠', en: 'Spitz', ja: 'スピッツ', es: 'Spitz', zh: '狐狸犬', fr: 'Spitz' }
];

export const PERSONALITY_TAG_TRANSLATIONS: Array<{ ko: string; en: string; ja: string; es: string; zh: string; fr: string }> = [
  { ko: '#파워인싸', en: '#SocialButterfly', ja: '#陽キャ犬', es: '#MariposaSocial', zh: '#社交达人', fr: '#TrèsSociable' },
  { ko: '#모든인간은내친구', en: '#Friendly', ja: '#みんな友達', es: '#Amigable', zh: '#谁都是朋友', fr: '#AmiDeTous' },
  { ko: '#간식감별사', en: '#SnackExpert', ja: '#おやつ鑑定士', es: '#ExpertoEnSnacks', zh: '#零食质检员', fr: '#InspecteurDeFriandises' },
  { ko: '#식빵엉덩이', en: '#LoafBooty', ja: '#食パンお尻', es: '#TraseroDePan', zh: '#短腿小翘臀', fr: '#PetitCulEnBrioche' },
  { ko: '#숏다리의자존심', en: '#ShortLegsPride', ja: '#短足の誇り', es: '#OrgulloPatasCortas', zh: '#短腿骄傲', fr: '#FiertéPattesCourtes' },
  { ko: '#간식헌터', en: '#TreatHunter', ja: '#おやつハンター', es: '#CazadorDePremios', zh: '#零食猎手', fr: '#ChasseurDeFriandises' },
  { ko: '#폼생폼사', en: '#SwagKing', ja: '#かっこつけ', es: '#PuraActitud', zh: '#帅气有范', fr: '#LaClasse' },
  { ko: '#참지않는말티즈', en: '#FierceMaltese', ja: '#我慢しないマルチーズ', es: '#MaltésFeroz', zh: '#脾气暴躁马尔济斯', fr: '#MaltaisTéméraire' },
  { ko: '#호기심대마왕', en: '#CuriousExplorer', ja: '#好奇心旺盛', es: '#GranCurioso', zh: '#好奇大王', fr: '#GrandCurieux' },
  { ko: '#애교쟁이', en: '#CuddleBug', ja: '#甘えん坊', es: '#Cariñoso', zh: '#撒娇怪', fr: '#PotDeColle' },
  { ko: '#엄마바라기', en: '#MommyBoy', ja: '#ママっ子', es: '#HijoDeMamá', zh: '#跟屁虫', fr: '#FilsÀMaman' },
  { ko: '#산책중독자', en: '#WalkAddict', ja: '#散歩中毒', es: '#AdictoAlPaseo', zh: '#散步狂人', fr: '#AccroAuxBalades' },
  { ko: '#귀여움이권력', en: '#CutenessIsPower', ja: '#可愛いは正義', es: '#PoderTierno', zh: '#可爱即正义', fr: '#PouvoirDuMignon' },
  { ko: '#극대노솜뭉치', en: '#AngryFluffball', ja: '#怒りんぼモフモフ', es: '#BolitaFuria', zh: '#生气毛球', fr: '#BouleDeNerfs' },
  { ko: '#파워쫄보', en: '#Timid', ja: '#超ビビり', es: '#Tímido', zh: '#胆小鬼', fr: '#GrandTrouillard' },
  { ko: '#철벽남', en: '#Independent', ja: '#ツンデレ', es: '#Independiente', zh: '#高冷傲娇', fr: '#Indépendant' },
  { ko: '#안가시바', en: '#Stubborn', ja: '#動かない柴', es: '#Terco', zh: '#赖皮柴犬', fr: '#ShibaTêtu' },
  { ko: '#마이웨이', en: '#MyWay', ja: '#マイペース', es: '#AMiManera', zh: '#走自己的路', fr: '#ÀSaManière' },
  { ko: '#ShortLegs', en: '#ShortLegs', ja: '#短足', es: '#PatasCortas', zh: '#短腿', fr: '#PattesCourtes' }
];

export const localizeBreed = (breed: string, targetLang: string = 'ko'): string => {
  if (!breed) return breed;
  const match = BREED_TRANSLATIONS.find(b =>
    b.ko.toLowerCase() === breed.toLowerCase() ||
    b.en.toLowerCase() === breed.toLowerCase() ||
    b.ja.toLowerCase() === breed.toLowerCase() ||
    b.es.toLowerCase() === breed.toLowerCase() ||
    (b.zh && b.zh.toLowerCase() === breed.toLowerCase()) ||
    (b.fr && b.fr.toLowerCase() === breed.toLowerCase()) ||
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
      p.es.toLowerCase() === cleanTag.toLowerCase() ||
      (p.zh && p.zh.toLowerCase() === cleanTag.toLowerCase()) ||
      (p.fr && p.fr.toLowerCase() === cleanTag.toLowerCase())
    );
    if (match) {
      return (match as any)[targetLang] || match.ko;
    }
    return cleanTag;
  });
};

export const localizeDogName = (name: string, _targetLang: string = 'ko'): string => {
  if (!name) return name;
  const n = name.trim().toLowerCase();
  // 반려견 고유명사: 딸기, 보리는 언어 설정과 무관하게 한글 고유명사 원본 그대로 유지
  if (n === 'bori' || n === '보리' || n === 'ボリ' || n === '波利') {
    return '보리';
  }
  if (n === 'strawberry' || n === '딸기' || n === 'イチゴ' || n === 'fresa' || n === '草莓' || n === 'fraise') {
    return '딸기';
  }
  // 사용자가 한글로 지은 강아지 이름은 고유명사이므로 억지로 번역하지 않고 원본 그대로 유지
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

  // 고유명사인 반려견 이름 정규화 (딸기, 보리 등 한글 고유명사 보존)
  const normalizedName = isBori ? '보리' : isStrawberry ? '딸기' : localizeDogName(dog.name, targetLang);

  return {
    ...dog,
    name: normalizedName,
    breed: localizeBreed(dog.breed, targetLang),
    personality: localizePersonalityTags(dog.personality, targetLang),
    avatar: fixedAvatar
  };
};

export const getMockDogs = (language: string): DogProfile[] => {
  const base = language === 'ko' ? MOCK_DOGS_KO : language === 'ja' ? MOCK_DOGS_JA : MOCK_DOGS_EN;
  return base.map(d => normalizeDogProfile(d, language));
};

export const isMockNeighborDog = (p: any): boolean => {
  if (!p) return true;
  if (p.id === 'dog-2' || p.id === 'dog-3' || p.id === 'dog-4') return true;
  const n = (p.name || '').toLowerCase().trim();
  const mockNeighborNames = ['땅콩', '구름이', '구름', '모찌', 'ピーナッツ', 'クラウド', 'モチ', 'peanut', 'cloud', 'mochi'];
  if (mockNeighborNames.includes(n)) {
    return true;
  }
  return false;
};

export const isDeletedPet = (p: any): boolean => {
  if (!p) return true;
  const cleanName = (p.name || '').trim();
  // 꼬북이 is explicitly marked deleted per user request
  if (cleanName === '꼬북이' || p.id === 'pet-1791121947345') return true;
  return false;
};

export const sanitizePetList = (list: any[], lang: string = 'ko'): DogProfile[] => {
  if (!Array.isArray(list) || list.length === 0) return [];
  const filtered = list.filter(p => !isMockNeighborDog(p) && !isDeletedPet(p));
  if (filtered.length === 0) {
    return [];
  }

  // 엄격한 중복 제거 (이름 및 ID 기준 1마리씩만 유지)
  const deduped: DogProfile[] = [];
  for (const pet of filtered) {
    const rawName = (pet.name || '').trim();
    if (!rawName) continue;
    const petId = (pet.id || '').trim();

    const exists = deduped.some(d =>
      isSameDogName(d.name, rawName) ||
      (petId && d.id && d.id === petId)
    );

    if (!exists) {
      deduped.push(normalizeDogProfile(pet, lang));
    }
  }

  return deduped;
};

export const getBreedRecommendedGoals = (breedStr?: string) => {
  const b = (breedStr || '').toLowerCase();
  // 대형견 (체력과 활동량이 많음)
  if (
    b.includes('리트리버') || b.includes('retriever') || b.includes('レトリバー') ||
    b.includes('허스키') || b.includes('husky') || b.includes('ハスキー') ||
    b.includes('셰퍼드') || b.includes('shepherd') || b.includes('シェパード') ||
    b.includes('보더콜리') || b.includes('border collie') || b.includes('ボーダーコリー') ||
    b.includes('사모예드') || b.includes('samoyed') || b.includes('サモエド') ||
    b.includes('말라뮤트') || b.includes('malamute')
  ) {
    return { distance: 3.0, minutes: 60 };
  }
  // 소형견 (관절 및 심장 배려)
  if (
    b.includes('말티즈') || b.includes('maltese') || b.includes('マルチーズ') ||
    b.includes('포메라니안') || b.includes('pomeranian') || b.includes('ポメラニアン') ||
    b.includes('치와와') || b.includes('chihuahua') || b.includes('チワワ') ||
    b.includes('요크셔') || b.includes('yorkshire') || b.includes('ヨーキー') ||
    b.includes('시츄') || b.includes('shih tzu') || b.includes('シーズー') ||
    b.includes('토이푸들') || b.includes('toy poodle') || b.includes('トイプードル')
  ) {
    return { distance: 1.2, minutes: 30 };
  }
  // 중형견 / 기본 권장
  return { distance: 2.0, minutes: 45 };
};

export const getPetWalkGoals = (pet?: { id?: string; name?: string; breed?: string; dailyDistanceGoal?: number; dailyTimeGoal?: number } | null) => {
  if (!pet) return { distance: 2.0, minutes: 45 };
  const recommended = getBreedRecommendedGoals(pet.breed);
  const key = `WALWAL_WALK_CUSTOM_GOAL_${pet.id || pet.name}`;
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        distance: typeof parsed.distance === 'number' && parsed.distance > 0 ? parsed.distance : (pet.dailyDistanceGoal || recommended.distance),
        minutes: typeof parsed.minutes === 'number' && parsed.minutes > 0 ? parsed.minutes : (pet.dailyTimeGoal || recommended.minutes)
      };
    }
  } catch (e) { }
  return {
    distance: pet.dailyDistanceGoal || recommended.distance,
    minutes: pet.dailyTimeGoal || recommended.minutes
  };
};

export const setPetWalkGoals = (petIdOrName: string, goals: { distance: number; minutes: number }) => {
  const key = `WALWAL_WALK_CUSTOM_GOAL_${petIdOrName}`;
  try {
    localStorage.setItem(key, JSON.stringify(goals));
    const savedPets = localStorage.getItem('WALWAL_PETS');
    if (savedPets) {
      const parsed = JSON.parse(savedPets);
      if (Array.isArray(parsed)) {
        const updated = parsed.map((p: any) => {
          if (p.id === petIdOrName || p.name === petIdOrName) {
            return { ...p, dailyDistanceGoal: goals.distance, dailyTimeGoal: goals.minutes };
          }
          return p;
        });
        localStorage.setItem('WALWAL_PETS', JSON.stringify(updated));
      }
    }
  } catch (e) { }
  window.dispatchEvent(new CustomEvent('walwal_walk_goal_updated', { detail: { id: petIdOrName, ...goals } }));
  window.dispatchEvent(new CustomEvent('walwal_pets_updated'));
};

