/**
 * 욕설 / 비속어 / 유해어 필터링 유틸리티
 * 한국어 및 영어 대표 욕설, 비하, 음란, 혐오 표현 감지 및 마스킹
 */

const BAD_WORDS_KO = [
  '시발', '씨발', 'ㅅㅂ', '시ㅂ', '씨ㅂ', '쉬발', '슈발', '시펄', '씨펄',
  '개새끼', '개색기', '개새', '개세끼', '개새키', 'ㄱㅅㄲ',
  '병신', '븅신', 'ㅂㅅ', '등신', '호구',
  '지랄', 'ㅈㄹ', '염병', '옘병', '지랄마',
  '닥쳐', '닥치', '닥쳐라', '꺼져', '꺼져라',
  '존나', '졸라', 'ㅈㄴ', '존맛', '존버', // 맥락에 따라 조정 가능하나 기본 주의
  '미친놈', '미친년', '미친새끼', '미쳤냐',
  '죽어', '죽어라', '자살', '살인',
  '걸레', '창녀', '보지', '자지', '섹스', '야동', '조건만남', '조건'
];

const BAD_WORDS_EN = [
  'fuck', 'fucking', 'fucker', 'f**k', 'fck',
  'shit', 'bullshit', 'sh*t',
  'bitch', 'bitches', 'b*tch',
  'asshole', 'bastard', 'dick', 'pussy', 'slut', 'whore',
  'cunt', 'nigger', 'faggot', 'retard',
  'kill yourself', 'die', 'kys'
];

// 정규식 컴파일 (특수문자/공백 우회 방지 정규화용)
const ALL_BAD_WORDS = [...BAD_WORDS_KO, ...BAD_WORDS_EN];

/**
 * 텍스트 내 비속어/유해어 포함 여부 확인
 */
export function containsProfanity(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  // 공백 및 특수문자 제거 버전으로 우회 시도 검사
  const normalized = text.toLowerCase().replace(/[\s\-_.,!?~@#$%^&*()+=/\\|0-9]/g, '');
  const lowerText = text.toLowerCase();

  for (const word of ALL_BAD_WORDS) {
    const cleanWord = word.toLowerCase().replace(/[\s\-_]/g, '');
    if (lowerText.includes(word.toLowerCase()) || normalized.includes(cleanWord)) {
      return true;
    }
  }

  return false;
}

/**
 * 텍스트 내 비속어를 ***로 마스킹
 */
export function maskProfanity(text: string): string {
  if (!text || typeof text !== 'string') return text;

  let masked = text;
  for (const word of ALL_BAD_WORDS) {
    const regex = new RegExp(word.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&'), 'gi');
    masked = masked.replace(regex, '*'.repeat(word.length));
  }

  return masked;
}

/**
 * 사용자 입력 콘텐츠 유효성 검증
 */
export function validateUserContent(text: string, lang: string = 'ko'): { isValid: boolean; message?: string } {
  if (containsProfanity(text)) {
    const msg = lang === 'ko'
      ? '부적절하거나 공격적인 표현이 감지되었습니다. 건전한 반려동물 커뮤니티를 위해 정중한 언어를 사용해주세요.'
      : 'Inappropriate or offensive language detected. Please use respectful language.';
    return { isValid: false, message: msg };
  }
  return { isValid: true };
}
