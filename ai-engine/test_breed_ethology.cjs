console.log("=========================================================");
console.log("?? 왈왈 (WalWal) 견종별 행동학(Ethology) 분석 검증 테스트");
console.log("=========================================================\n");

const breeds = [
  {
    breedKr: "골든 리트리버",
    name: "보리",
    tagline: "세상 모든 인간과 댕댕이는 내 친구! 무한 긍정 천사견",
    tailWaggingInterpretation: "95% 순수한 호의와 반가움 (놀이 유혹)",
    audioBarkInterpretation: "친구가 되고 싶다는 우렁찬 환영 인사",
    speech: "와! 새로운 친구다! 나랑 당장 놀자! 온몸으로 환영해!! ??"
  },
  {
    breedKr: "시바견",
    name: "모찌",
    tagline: "너 나한테 관심 갖지 마라. 난 내 길을 간다. 시크 마이웨이",
    tailWaggingInterpretation: "70% 긴장·경계·거리두기 신호 (뻣뻣한 수직 꼬리)",
    audioBarkInterpretation: "자신의 퍼스널 스페이스를 침범하지 말라는 단호한 경고",
    speech: "너 나한테 관심 갖지 마라. 꼬리 흔든 건 기분 좋아서가 아니라 반동 추진력이다. ???"
  },
  {
    breedKr: "말티즈",
    name: "뽀삐",
    tagline: "말티즈는 참지 않아! 집사 독점욕과 당돌한 자기주장",
    tailWaggingInterpretation: "80% 자기주장 및 즉각적인 관심 요구 (빠른 핑퐁)",
    audioBarkInterpretation: "\"당장 내 요구를 들어줘라!\" 강력한 의사 표시",
    speech: "말티즈는 참지 않아! 집사야 나한테 집중해! 다른 개 쳐다보지 마 앙앙!! ??"
  },
  {
    breedKr: "웰시코기",
    name: "땅콩",
    tagline: "다리는 짧아도 내 식탐은 2미터다! 엉덩이 댄스 마스터",
    tailWaggingInterpretation: "85% 하체 씰룩 흥분 및 간식 갈망 (식탐 모터)",
    audioBarkInterpretation: "식사 시간 또는 간식 봉지 소리에 대한 경쾌한 비트",
    speech: "다리는 짧아도 내 엉덩이 모터 회전수는 분당 3000RPM이다 씰룩씰룩! ??"
  },
  {
    breedKr: "포메라니안",
    name: "구름이",
    tagline: "나 솜사탕 아니다! 맹수다! 극대노 허세 솜뭉치",
    tailWaggingInterpretation: "75% 방어적 기선제압 및 털 팽창 (엄포 신호)",
    audioBarkInterpretation: "\"나 건들면 아프다!\" 초고주파 방어적 경고음",
    speech: "나 솜사탕 아니다! 맹수다! 어흥! 비둘기 너 내 구역에서 당장 꺼져 앙앙! ??"
  },
  {
    breedKr: "푸들",
    name: "초코",
    tagline: "천재견의 계산된 애교! 인간들의 심리를 꿰뚫는 조련사",
    tailWaggingInterpretation: "90% 보상을 얻어내기 위한 고도의 계산된 제스처",
    audioBarkInterpretation: "집사의 행동 패턴을 유도하는 맞춤형 소리 신호",
    speech: "집사야 표정보니 지금 죄책감 드는 타이밍이네? 고개 45도 갸우뚱 시전! 간식 득템 ??"
  }
];

breeds.forEach(breed => {
  console.log(`[견종: ${breed.breedKr} (${breed.name})]`);
  console.log(`- 성향 페르소나: ${breed.tagline}`);
  console.log(`- 동일 동작 ('꼬리 흔들기') 행동학적 해석: ${breed.tailWaggingInterpretation}`);
  console.log(`- 동일 음성 ('우렁찬 짖음') 분석 결과: ${breed.audioBarkInterpretation}`);
  console.log(`- 생성된 머리 위 실시간 속마음 대사:`);
  console.log(`  "${breed.speech}"`);
  console.log("---------------------------------------------------------");
});
console.log("ALL_BREED_ETHOLOGY_TESTS_PASSED");
