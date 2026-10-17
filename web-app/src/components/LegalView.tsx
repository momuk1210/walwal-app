import React from 'react';
import { ArrowLeft, HelpCircle, FileText, Shield } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import '../styles/LegalView.css';

export type LegalViewType = 'faq' | 'terms' | 'privacy';

interface LegalViewProps {
  type: LegalViewType;
  onClose: () => void;
}

/* ─────────────────────────────────────────────
   이용약관 (한국어) - 보충 상세 전문
───────────────────────────────────────────── */
const TERMS_KO = `제1조 (목적)
본 약관은 WalWal(이하 "회사")이 제공하는 반려동물 AI 소통 및 커뮤니티 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 서비스 이용 조건 및 절차 등 기본적인 사항을 규정함을 목적으로 합니다.

제2조 (용어의 정의)
① 본 약관에서 사용하는 용어의 정의는 다음과 같습니다.
1. "서비스"란 단말기(스마트폰, 태블릿 등)에 관계없이 회사가 제공하는 WalWal 모바일 앱 및 웹 플랫폼을 통해 제공되는 AR 반려동물 감정 분석, 행동 번역, 소셜 피드스, 산책 모임 커뮤니티, 펫 스튜디오 및 이에 부수하는 제반 서비스를 의미합니다.
2. "이용자"란 본 약관에 동의하고 회사가 제공하는 서비스를 이용하는 회원 및 비회원을 말합니다.
3. "회원"이란 서비스에 개인정보 또는 소셜 계정(Google, Apple 등)을 연동하여 가입하고 회사의 서비스를 지속적으로 제공받는 자를 말합니다.
4. "반려견 프로필"이란 회원이 서비스 내에 등록한 반려견의 이름, 견종, 나이, 성별, 성격 태그, 사진, 위치 좌표 등의 정보를 말합니다.
5. "게시물"이란 회원이 서비스를 이용함에 있어 게시하거나 등록한 문자, 사진, 동영상, 캡처 대사, 음향 및 댓글 일체를 의미합니다.
6. "유료 서비스"란 회원이 별도의 유료 결제 또는 정기 구독을 통해 이용할 수 있는 프리미엄 기능을 의미합니다.
② 본 약관에서 정의되지 않은 용어는 관계 법령 및 서비스별 개별 안내에서 정하는 바에 따릅니다.

제3조 (약관의 효력 및 개정)
① 본 약관은 서비스 화면에 게시하거나 전자우편 등의 방법으로 회원에게 공지함으로써 효력이 발생합니다.
② 회사는 「전자상거래 등에서의 소비자보호에 관한 법률」, 「약관의 규제에 관한 법률」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
③ 약관을 개정할 경우에는 적용일자 및 개정사유를 명시하여 현행약관과 함께 서비스 공지사항 또는 초기화면에 최소 7일 전부터 공지합니다. 단, 이용자에게 불리한 중요한 내용의 개정은 최소 30일 이상의 유예기간을 두고 사전 고지합니다.
④ 회원이 개정약관의 적용에 동의하지 않는 경우 서비스 이용계약을 해지(회원 탈퇴)할 수 있으며, 변경 공지 기간 내에 명시적인 거부 의사를 표시하지 아니한 때에는 개정약관에 동의한 것으로 간주합니다.

제4조 (이용계약의 체결 및 계정 관리)
① 이용계약은 가입을 희망하는 자가 약관의 내용에 동의하고 가입 신청을 한 후, 회사가 이를 승인함으로써 체결됩니다.
② 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 거부하거나 사후에 이용계약을 해지할 수 있습니다.
1. 타인의 명의, 이메일 또는 소셜 계정을 도용한 경우
2. 허위 정보를 기재하거나 회사가 필수적으로 요구하는 항목을 누락한 경우
3. 법령 또는 공서양속을 저해하거나 서비스의 정상적인 운영을 방해할 목적으로 신청한 경우
4. 만 14세 미만 아동이 법정대리인의 동의 없이 신청한 경우
③ 회원은 자신의 계정 정보(소셜 로그인 연동 정보 등)를 철저히 관리해야 하며, 제3자에게 양도하거나 대여할 수 없습니다. 관리 소홀로 인해 발생하는 손해에 대한 책임은 회원 본인에게 있습니다.

제5조 (서비스의 내용 및 위치기반 서비스 제공)
① 회사는 이용자에게 다음과 같은 서비스를 제공합니다.
1. AI 카메라 비전 엔진을 활용한 실시간 반려동물 감정 분석, 표정/행동 번역
2. 주변 반려견 친구 탐색, 산책로 안내 및 동네 산책 모임 개설/참여/실시간 채팅
3. 반려동물 일상 사진 및 영상 공유(피드스/피드), 대화형 스티커 및 숏폼 영상 제작(펫 스튜디오)
4. 반려견 산책 통계 기록(산책 거리, 산책 시간, 누적 뱃지)
5. 서비스 개선 요청(피드백) 및 관리자 답변 기능
② [위치기반 서비스] 회사는 주변 산책 모임 추천, 동네 친구 찾기 등의 편의 제공을 위해 이용자의 단말기 위치정보(GPS 위경도 좌표)를 수집 및 이용합니다. 위치정보는 해당 서비스 구동 시에만 실시간으로 참조되며, 별도의 영구적인 위치 추적 목적으로 사용되지 않습니다.

제6조 (AI 감정 분석 결과의 법적 성격 및 수의학적 면책)
① 서비스에서 제공하는 "AI 감정 분석", "속마음 번역", "행동 상태 추정" 결과는 인공지능 알고리즘과 반려견 행동 패턴 데이터베이스에 기반한 참고용 오락 및 교감 보조 정보입니다.
② 본 서비스는 전문 수의학적 진단, 질병 판정, 치료 목적의 의료 행위를 일체 대체하지 않습니다. 반려동물의 질병, 부상, 급격한 행동 이상이 발생한 경우 즉시 공인된 동물병원 및 수의사의 전문 진료를 받으셔야 합니다.
③ 회사는 AI 분석 결과의 절대적 완전성, 특정 상황에서의 의학적 적합성에 대해 보증하지 아니하며, 이를 신뢰하여 발생한 결과에 대하여 회사의 고의 또는 중과실이 없는 한 법적 책임을 지지 않습니다.

제7조 (사용자 생성 콘텐츠 및 저작권)
① 회원이 서비스 내에 게시한 모든 게시물(사진, 동영상, 글 등)의 저작권은 해당 게시물의 저작자에게 귀속됩니다.
② 회원은 회사가 서비스를 운영, 개선, 홍보하기 위한 목적으로 자신이 게시한 콘텐츠를 비독점적으로 복제, 수정, 배포, 전시할 수 있는 권리를 회사에 무상으로 부여합니다.
③ 회원의 게시물이 타인의 저작권, 사생활, 초상권, 명예를 침해하는 경우 그로 인한 모든 법적 책임은 회원 본인에게 있으며, 회사는 이에 대해 어떠한 책임도 부담하지 않습니다.
④ 회사는 다음 각 호에 해당하는 게시물을 발견할 경우 사전 통지 없이 즉시 삭제하거나 노출을 제한할 수 있습니다.
1. 동물 학대, 유기, 위해를 가하는 내용이 포함된 경우
2. 음란, 폭력, 혐오, 불법 정보가 포함된 경우
3. 타인의 명예를 훼손하거나 권리를 침해하는 경우
4. 상업적 광고, 스팸, 허위 정보를 무단 게시한 경우

제8조 (이용자의 의무 및 금지사항)
회원은 서비스를 이용할 때 다음 각 호의 행위를 하여서는 안 됩니다.
1. 회원 가입 신청 또는 정보 변경 시 허위 사실을 기재하는 행위
2. 타인의 정보를 도용하거나 제3자의 권리를 침해하는 행위
3. 서비스의 정상적인 운영을 방해하거나 서버/네트워크에 부하를 야기하는 행위
4. 자동화된 프로그램(봇, 크롤러, 스크래퍼 등)을 무단 이용하여 데이터를 수집하거나 서비스 구조를 역설계하는 행위
5. 회사의 사전 서면 승낙 없이 서비스를 영리 목적으로 이용하는 행위

제9조 (유료 서비스, 구독 및 청약철회)
① 회사가 유료 서비스를 제공할 경우, 요금 및 결제 방식은 결제 화면에 명시합니다.
② 앱 마켓(Google Play Store, Apple App Store)을 통해 결제한 유료 서비스의 결제 취소, 청약철회 및 환불은 해당 앱 마켓의 정책 및 관련 법령에 따릅니다.
③ 회원이 유료 결제 후 디지털 콘텐츠를 이미 사용하였거나 서비스를 개시한 경우에는 「전자상거래 등에서의 소비자보호에 관한 법률」에 따라 청약철회가 제한될 수 있습니다.

제10조 (계약 해지 및 회원 탈퇴)
① 회원은 언제든지 앱 내 [환경 설정 > 계정 관리 > 회원 탈퇴] 메뉴를 통해 이용계약 해지(회원 탈퇴)를 요청할 수 있으며, 회사는 관계 법령이 정하는 바에 따라 지체 없이 처리합니다.
② 탈퇴 시 회원의 개인정보 및 반려견 등록 데이터는 즉시 영구 파기됩니다. 단, 다른 이용자와 공유된 게시물, 댓글 등은 서비스 보존을 위해 삭제되지 않을 수 있으므로 탈퇴 전 본인이 직접 삭제해야 합니다.

제11조 (손해배상 및 면책)
① 회사는 천재지변, 전쟁, 기간통신사업자의 장애, 클라우드 서비스 장애 등 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 책임이 면제됩니다.
② 회사는 회원 상호 간 또는 회원과 제3자 간에 서비스를 매개로 발생한 분쟁에 대해 개입할 의무가 없으며 이로 인한 손해를 배상할 책임을 지지 않습니다.

제12조 (준거법 및 재판관할)
본 약관의 해석 및 회사와 회원 간의 분쟁에 대하여는 대한민국 법률을 준거법으로 하며, 소송이 제기될 경우 민사소송법에 따른 법원을 관할 법원으로 합니다.

부칙
• 공고 일자: 2026년 10월 1일
• 시행 일자: 2026년 10월 1일
• 문의 및 고객지원: wal.wal.app365@gmail.com`;

/* ─────────────────────────────────────────────
   이용약관 (영어)
───────────────────────────────────────────── */
const TERMS_EN = `Article 1 (Purpose)
These Terms of Service ("Terms") govern the use of the WalWal pet AI communication platform service ("Service") provided by WalWal ("Company") and define the rights, obligations, and responsibilities between the Company and users.

Article 2 (Definitions)
① "Service" refers to the WalWal mobile app and web platform, including real-time AR pet behavior/emotion analysis, social snaps, walking meetups, and Pet Studio features.
② "User" refers to any individual who agrees to these Terms and uses the Service.
③ "Dog Profile" refers to registered dog information including name, breed, age, gender, personality tags, photos, and location coordinates.
④ "Paid Service" refers to features available to users after subscribing to a paid plan.

Article 3 (Effectiveness and Modification of Terms)
① These Terms take effect when posted on the service screen or notified to users.
② The Company may amend these Terms within the scope of applicable laws. Amendments will be announced at least 7 days before the effective date. For significant amendments unfavorable to users, notice will be given at least 30 days in advance.

Article 4 (User Registration and Account Management)
① Users register by agreeing to these Terms and linking authentication credentials.
② Users must not transfer or share accounts with third parties and are responsible for safeguarding their login credentials.

Article 5 (Location-Based Services)
The Company collects and utilizes real-time device location (GPS coordinates) solely to recommend nearby dog walking meetups and friends. Location data is referenced only while using the relevant features and is not used for persistent user tracking.

Article 6 (AI Analysis Disclaimer)
① AI pet translation and emotion analysis results are intended for companion interaction, entertainment, and reference purposes only.
② This Service does not provide professional veterinary diagnoses or medical treatments. If a pet displays signs of illness or injury, please seek qualified veterinary care immediately.

Article 7 (User Generated Content)
① Copyright to content created and uploaded by users remains with the respective users.
② Users grant the Company a non-exclusive license to use uploaded content for service operation and improvement.
③ Content involving animal abuse, hate speech, obscenity, or illegal activities will be removed immediately without prior notice.

Article 8 (Account Deletion)
Users may terminate their account at any time via Settings > Account > Delete Account. Upon deletion, all associated personal and dog profile data will be permanently purged without delay.

Effective Date: October 1, 2026
Contact: wal.wal.app365@gmail.com`;

/* ─────────────────────────────────────────────
   개인정보 처리방침 (한국어) - 보충 상세 전문
───────────────────────────────────────────── */
const PRIVACY_KO = `WalWal(이하 "회사")은 이용자의 소중한 개인정보를 안전하게 보호하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」, 「위치정보의 보호 및 이용 등에 관한 법률」 등 대한민국 관계 법령과 Google Play 개발자 정책을 철저히 준수합니다.

본 개인정보 처리방침은 회사가 제공하는 WalWal 모바일 앱 및 제반 웹 서비스(이하 "서비스")를 이용하는 모든 정보주체에게 적용됩니다.

제1조 (개인정보의 처리 목적)
회사는 다음의 목적을 위하여 최소한의 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 관련 법령에 따라 별도의 동의를 받는 등 필요한 조치를 이행합니다.
1. 회원 가입 및 계정 관리: 소셜 로그인 연동, 회원제 서비스 제공에 따른 식별·인증, 계정 탈퇴 처리, 부정이용 방지
2. 서비스 제공 및 기능 구동: AI 반려동물 감정 분석, 반려견 프로필 관리, 피드스 피드 및 숏폼 영상 제작, 커뮤니티 채팅
3. 위치기반 서비스 제공: 주변 반려견 친구 탐색, 산책 모임 장소 확인, 산책 거리 및 경로 기록
4. 고객 지원 및 소통: 서비스 개선 요청(피드백) 처리, 공지사항 전달, 문의 대응
5. 서비스 분석 및 품질 개선: 접속 빈도 파악, 서비스 이용 통계 분석, 인공지능 모델 경량화 및 성능 고도화

제2조 (처리하는 개인정보 항목)
회사는 서비스 제공을 위해 아래와 같은 개인정보를 처리하고 있습니다.
1. [필수 수집 항목]
- 소셜 로그인 계정 식별자 (Google, Apple 로그인 고유 ID, 이메일 주소)
- 기기 정보 (OS 종류 및 버전, 디바이스 모델명, 브라우저 정보)
- 서비스 이용 기록 (접속 일시, IP 주소, 불량 이용 기록)
2. [선택 수집 항목]
- 보호자 닉네임, 프로필 이미지
- 반려견 프로필 정보: 이름, 견종, 나이, 성별, 성격 태그, 인사말, 입양일/생일, 등록 사진
- 피드 및 피드스 업로드 콘텐츠: 사진, 동영상, 캡처 대사, 댓글 내용
3. [위치정보 (선택 동의)]
- GPS 위도·경도 좌표 (동네친구 찾기, 산책로 모임 탐색 시 실시간 참조)
4. [기기 권한 관련 (카메라/마이크)]
- 카메라 및 마이크 권한: 실시간 AR 분석 및 스튜디오 영상 촬영 시 기기 내에서 실시간 연산되며, 영상 스트림 원본을 사전 동의 없이 원격 서버에 무단 저장하지 않습니다.

제3조 (개인정보의 처리 및 보유 기간)
① 회사는 법령에 따른 개인정보 보유·이용 기간 또는 이용자로부터 개인정보 수집 시에 동의받은 보유·이용 기간 내에서 개인정보를 처리하고 보유합니다.
② 이용자의 개인정보는 원칙적으로 회원 탈퇴 시 즉시 영구 파기됩니다.
③ 단, 관계 법령의 규정에 의하여 보존할 필요가 있는 경우 회사는 아래와 같이 관계 법령에서 정한 기간 동안 개인정보를 안전하게 보관합니다.
1. 「전자상거래 등에서의 소비자보호에 관한 법률」
- 계약 또는 청약철회 등에 관한 기록: 5년
- 대금결제 및 재화 등의 공급에 관한 기록: 5년
- 소비자의 불만 또는 분쟁처리에 관한 기록: 3년
2. 「통신비밀보호법」
- 서비스 방문 기록, 접속 로그, IP 주소: 3개월

제4조 (개인정보의 파기 절차 및 방법)
① 회사는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체 없이 해당 개인정보를 파기합니다.
② 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법(영구 삭제 및 덮어쓰기)을 사용하여 완전히 삭제합니다.

제5조 (위치기반 개인정보의 보호)
① 회사는 이용자의 위치정보를 보호하기 위해 기술적·관리적 보안 대책을 엄격히 적용합니다.
② 위치정보는 이용자가 앱 내에서 위치기반 기능(동네친구 찾기, 산책로 탐색 등)을 활성화한 순간에만 수집·참조되며, 이용자의 허가 없이 제3자에게 임의로 제공되지 않습니다.
③ 이용자는 앱 내 설정 또는 단말기 환경설정에서 언제든지 위치 권한 제공을 거부하거나 철회할 수 있습니다.

제6조 (개인정보의 제3자 제공)
회사는 이용자의 사전 동의 없이 개인정보를 외부에 제공하지 않습니다. 단, 법률의 규정에 의거하거나 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우는 예외로 합니다.

제7조 (개인정보 처리의 위탁)
회사는 서비스의 안정적인 인프라 운영 및 품질 향상을 위해 다음과 같이 개인정보 처리 업무를 위탁하고 있습니다.
1. 수탁업체: Google LLC (Firebase / Google Cloud Platform)
- 위탁 업무: 클라우드 인프라 호스팅, 회원 인증, 데이터베이스 스토리지, 서버 로그 모니터링
- 보유 기간: 회원 탈퇴 시 또는 위탁계약 종료 시까지
2. 수탁업체: Apple Inc.
- 위탁 업무: Apple 간편 로그인 인증 처리

제8조 (이용자 및 법정대리인의 권리와 행사방법)
① 이용자는 언제든지 등록되어 있는 자신의 개인정보를 조회하거나 수정할 수 있으며, 회원 탈퇴를 통해 개인정보의 파기를 요청할 수 있습니다.
② 권리 행사는 서비스 내 [환경 설정 > 계정 관리 > 회원 탈퇴]를 통해 직접 처리하거나, 개인정보 보호책임자에게 이메일(wal.wal.app365@gmail.com)로 요청하시면 지체 없이 조치합니다.

제9조 (계정 삭제 및 데이터 삭제 요청 - Google Play 정책 준수)
Google Play 사용자 데이터 정책에 따라 이용자는 앱 내부 및 외부 웹 채널을 통해 계정 및 연계 데이터 일체의 삭제를 요청할 수 있습니다.
1. 앱 내 삭제: [설정 > 계정 관리 > 회원 탈퇴] 클릭 시 인증 계정, 프로필, 등록 반려견 데이터가 즉시 영구 삭제됩니다.
2. 외부 요청 채널: 고객지원 이메일(wal.wal.app365@gmail.com)로 가입 이메일과 함께 삭제 요청을 접수하시면 확인 즉시 모든 데이터를 파기하고 결과를 통보해 드립니다.

제10조 (개인정보의 안전성 확보 조치)
회사는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고 있습니다.
1. 관리적 조치: 개인정보 취급 담당자의 최소화, 정기적 보안 교육, 내부 관리계획 수립 및 시행
2. 기술적 조치: 모든 데이터 전송 구간 암호화(HTTPS/TLS), 데이터베이스 접근 제어, 비밀번호 미저장(소셜 토큰 인증 방식)
3. 물리적 조치: 글로벌 최고 수준의 보안 인증을 보유한 클라우드 데이터센터 인프라 이용

제11조 (만 14세 미만 아동의 보호)
회사는 원칙적으로 만 14세 미만 아동의 회원 가입을 받지 않으며, 만 14세 미만 아동의 개인정보를 수집하지 않습니다. 만약 만 14세 미만 아동의 정보가 수집된 사실을 인지할 경우 지체 없이 해당 계정과 정보를 영구 삭제합니다.

제12조 (개인정보 보호책임자 및 문의처)
회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

• 개인정보 보호책임자: WalWal 운영팀
• 연락처 및 문의 이메일: wal.wal.app365@gmail.com
• 이용자는 서비스를 이용하며 발생하는 모든 개인정보 보호 관련 민원을 개인정보 보호책임자에게 문의하실 수 있으며, 회사는 신속하고 성실하게 답변드릴 것입니다.

제13조 (개인정보 처리방침의 개정 및 고지)
본 개인정보 처리방침은 정부의 정책, 법령 또는 회사 내부 보안 정책의 변경에 따라 개정될 수 있습니다. 내용이 추가, 삭제 또는 수정될 경우에는 개정 최소 7일 전부터 서비스 내 공지사항을 통해 고지할 것입니다.

• 공고 일자: 2026년 10월 1일
• 시행 일자: 2026년 10월 1일`;

/* ─────────────────────────────────────────────
   개인정보 처리방침 (영어)
───────────────────────────────────────────── */
const PRIVACY_EN = `WalWal ("Company") values user privacy and complies with the Personal Information Protection Act, Location Information Protection Act, and Google Play Developer Policies.

Article 1 (Purpose of Personal Data Processing)
The Company processes personal data for member registration, authentication, AI pet translation features, walking meetup recommendations, pet profile management, customer feedback handling, and service analytics.

Article 2 (Items of Personal Data Processed)
1. Required: Social login identifiers (Google, Apple ID, email), device identifiers (OS, model), usage logs, IP addresses.
2. Optional: Owner nickname, pet profiles (name, breed, age, photos, tags), uploaded snaps/videos.
3. Location Data: Real-time GPS coordinates collected only when actively using nearby friends/meetup search.
4. Camera/Microphone: Real-time video processing occurs on-device and is never transmitted to servers without consent.

Article 3 (Retention and Deletion)
Personal data is permanently deleted immediately upon account withdrawal, except where retention is required by applicable laws (e.g. 5 years for transaction records, 3 months for access logs).

Article 4 (Account and Data Deletion - Google Play Compliance)
Users may permanently delete their account and all associated data at any time via:
1. In-app: Settings > Account > Delete Account
2. External request: Email wal.wal.app365@gmail.com with your registered email address.

Article 5 (Delegation of Data Processing)
Infrastructure hosting, user authentication, and database services are delegated to Google LLC (Firebase / Google Cloud Platform).

Article 6 (Privacy Officer)
Privacy Officer: WalWal Operations
Email: wal.wal.app365@gmail.com

Effective Date: October 1, 2026`;

/* ─────────────────────────────────────────────
   FAQ (한국어)
───────────────────────────────────────────── */
const FAQ_KO = [
  {
    q: 'WalWal의 AI 반려동물 번역은 얼마나 정확한가요?',
    a: 'WalWal의 AI는 반려동물의 자세, 표정, 움직임 패턴, 소리 등을 분석하여 행동 상태를 추정합니다. 재미와 소통을 위한 참고 정보로 활용해 주시기 바라며, 수의학적 진단을 대체하지는 않습니다.'
  },
  {
    q: '카메라로 촬영한 영상이 서버에 저장되나요?',
    a: 'AR 카메라 기능으로 촬영한 영상은 기기 내부에서만 처리되며, 서버로 전송되거나 저장되지 않습니다. 이용자가 직접 피드에 올리기로 선택한 사진/동영상만 서비스 내에 저장됩니다.'
  },
  {
    q: '구독을 취소하면 어떻게 되나요?',
    a: '구독 취소 후에도 현재 결제된 기간이 끝날 때까지 프리미엄 기능을 이용할 수 있습니다. 기간 만료 후 무료 이용 범위 내로 자동 전환됩니다. 환불은 결제 플랫폼(App Store / Google Play)의 정책을 따릅니다.'
  },
  {
    q: '여러 반려동물을 등록할 수 있나요?',
    a: '네, 여러 마리의 반려동물 프로필을 등록하고 각각의 데이터를 관리할 수 있습니다. 프로필 화면에서 "+" 버튼을 눌러 추가하세요.'
  },
  {
    q: '피드에 올린 게시물을 삭제할 수 있나요?',
    a: '네, 피드 게시물 오른쪽 상단의 "⋮" 메뉴를 눌러 언제든지 삭제하거나 수정할 수 있습니다.'
  },
  {
    q: '산책 모임은 어떻게 참여하나요?',
    a: '커뮤니티 탭에서 근처 산책 모임을 검색하거나 새 모임을 만들 수 있습니다. 참여 버튼을 누르면 모임 채팅방에 입장됩니다.'
  },
  {
    q: '계정 탈퇴는 어떻게 하나요?',
    a: '설정 > 계정 > 회원 탈퇴 메뉴에서 탈퇴할 수 있습니다. 탈퇴 시 모든 개인정보 및 게시물이 즉시 삭제됩니다.'
  },
];

const FAQ_EN = [
  {
    q: 'How accurate is WalWal\'s AI pet translation?',
    a: 'WalWal\'s AI analyzes your pet\'s posture, expressions, movement patterns, and sounds to estimate behavioral states. Results are meant for fun and reference only and do not substitute professional veterinary diagnosis.'
  },
  {
    q: 'Is camera footage stored on servers?',
    a: 'Video captured through the AR camera is processed on-device only and is never transmitted to or stored on our servers. Only photos/videos you explicitly post to snaps are stored within the service.'
  },
  {
    q: 'What happens when I cancel my subscription?',
    a: 'After canceling, you can continue to use premium features until the end of your current billing period. After expiration, your account automatically reverts to the free tier. Refunds follow the policy of your payment platform (App Store / Google Play).'
  },
  {
    q: 'Can I register multiple pets?',
    a: 'Yes! You can register multiple pet profiles and manage data for each one. Tap the "+" button on the Profile screen to add more pets.'
  },
  {
    q: 'Can I delete or edit posts I\'ve shared to snaps?',
    a: 'Yes. Tap the "⋮" menu in the top-right corner of any post to edit or delete it at any time.'
  },
  {
    q: 'How do I join a walking meetup?',
    a: 'Browse nearby meetups in the Community tab or create your own. Tap the Join button to enter the meetup chat room.'
  },
  {
    q: 'How do I delete my account?',
    a: 'Go to Settings > Account > Delete Account. All personal data and posts will be immediately and permanently deleted upon withdrawal.'
  },
];

export const LegalView: React.FC<LegalViewProps> = ({ type, onClose }) => {
  const { t, language } = useTranslation();

  const isKo = language === 'ko';

  const getTitle = () => {
    switch (type) {
      case 'faq': return isKo ? '자주 묻는 질문' : 'FAQ';
      case 'terms': return isKo ? '이용약관' : 'Terms of Service';
      case 'privacy': return isKo ? '개인정보 처리방침' : 'Privacy Policy';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'faq': return <HelpCircle size={24} color="#FF9E58" />;
      case 'terms': return <FileText size={24} color="#FF9E58" />;
      case 'privacy': return <Shield size={24} color="#FF9E58" />;
    }
  };

  const renderContent = () => {
    if (type === 'faq') {
      const faqItems = isKo ? FAQ_KO : FAQ_EN;
      return (
        <div className="legal-faq-list">
          {faqItems.map((item, i) => (
            <div className="legal-faq-item" key={i}>
              <h3 className="legal-faq-q">Q. {item.q}</h3>
              <p className="legal-faq-a">A. {item.a}</p>
            </div>
          ))}
        </div>
      );
    }

    const rawText = type === 'terms'
      ? (isKo ? TERMS_KO : TERMS_EN)
      : (isKo ? PRIVACY_KO : PRIVACY_EN);

    // 조항 제목(숫자로 시작하는 줄)을 굵게 표시
    const lines = rawText.split('\n');
    return (
      <div className="legal-text-content">
        {lines.map((line, i) => {
          const isSectionHeader = /^(제\d+조|Article\s+\d+|第\d+条|Artículo\s+\d+|\[.+\])/.test(line.trim());
          if (isSectionHeader) {
            return <p key={i} className="legal-section-header">{line}</p>;
          }
          if (line.trim() === '') return <br key={i} />;
          return <p key={i} className="legal-paragraph">{line}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="legal-view-root">
      {/* Header */}
      <div className="legal-header">
        <button onClick={onClose} className="legal-back-btn">
          <ArrowLeft size={24} color="#1A202C" />
        </button>
        <div className="legal-title-container">
          <h1 className="legal-title">
            {getTitle()}
          </h1>
        </div>
      </div>

      {/* Content */}
      <div className="legal-content-container">
        {renderContent()}
      </div>
    </div>
  );
};
