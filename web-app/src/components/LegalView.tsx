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
   이용약관 (한국어)
───────────────────────────────────────────── */
const TERMS_KO = `제1조 (목적)
본 약관은 WalWal(이하 "회사")이 제공하는 반려동물 AI 소통 플랫폼 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.

제2조 (정의)
① "서비스"란 회사가 제공하는 WalWal 앱 및 웹 플랫폼, AR 반려동물 행동 분석, 피드, 커뮤니티, 펫 스튜디오 기능 일체를 의미합니다.
② "이용자"란 본 약관에 동의하고 서비스를 이용하는 모든 개인을 말합니다.
③ "유료 서비스"란 이용자가 구독 결제 후 이용할 수 있는 프리미엄 기능을 의미합니다.

제3조 (약관의 효력 및 변경)
① 본 약관은 서비스 내 화면에 게시하거나 이메일로 통지하는 방법으로 공시되며, 이용자가 서비스에 가입하거나 서비스를 이용함으로써 본 약관에 동의한 것으로 간주합니다.
② 회사는 관련 법령을 위반하지 않는 범위에서 약관을 개정할 수 있으며, 개정 시 적용 일자 및 개정 사유를 명시하여 최소 7일 전에 공지합니다. 단, 이용자에게 불리한 변경의 경우 30일 전에 공지합니다.

제4조 (서비스의 제공 및 변경)
① 회사는 다음과 같은 서비스를 제공합니다.
  - AI 기반 반려동물 행동 분석 및 속마음 번역 서비스
  - AR 카메라를 활용한 실시간 반려동물 감정 분석
  - 반려동물 소셜 피드 및 커뮤니티
  - 산책 모임 및 반려동물 이벤트 정보 제공
  - 펫 스튜디오(숏폼 영상 제작 및 공유)
② 서비스의 내용은 기술적·운영상의 이유로 변경될 수 있으며, 이 경우 사전 공지합니다.

제5조 (이용자의 의무)
① 이용자는 다음 행위를 하여서는 안 됩니다.
  - 타인의 개인정보 도용 또는 허위 정보 입력
  - 서비스를 이용하여 법령 또는 공서양속에 반하는 행위
  - 다른 이용자에게 불이익을 주는 스팸, 음란물, 혐오 콘텐츠 게시
  - 회사의 지식재산권 침해 또는 불법 복제
  - 서비스 운영을 방해하는 행위(해킹, 악성코드 등)
② 이용자는 관련 법령, 본 약관 및 서비스 내 안내사항을 준수할 의무가 있습니다.

제6조 (콘텐츠 및 지식재산권)
① 이용자가 서비스에 업로드한 콘텐츠(사진, 동영상, 텍스트 등)의 저작권은 이용자에게 있습니다.
② 이용자는 회사에게 서비스 운영, 홍보 등을 위한 비독점적 사용 권한을 부여하는 것에 동의합니다.
③ 회사가 제공하는 서비스 내 콘텐츠(AI 분석 결과, UI 디자인, 소프트웨어 등)의 지식재산권은 회사에 귀속됩니다.

제7조 (유료 서비스 및 환불)
① 유료 서비스 이용 요금은 구독 플랜별로 결제 시 표시되는 금액을 따릅니다.
② 구독 서비스는 결제일로부터 자동 갱신됩니다.
③ 환불은 「전자상거래 등에서의 소비자보호에 관한 법률」에 따르며, 결제 후 7일 이내에 서비스를 이용하지 않은 경우 전액 환불이 가능합니다.
④ 앱스토어(Apple App Store, Google Play)를 통해 결제한 경우 각 플랫폼의 환불 정책을 따릅니다.

제8조 (서비스의 제한 및 중단)
① 회사는 시스템 점검, 천재지변, 서버 장애 등의 사유로 서비스 제공을 일시 중단할 수 있습니다.
② 이용자가 본 약관을 위반한 경우 서비스 이용을 제한하거나 계정을 해지할 수 있습니다.

제9조 (면책 조항)
① 회사는 천재지변, 불가항력적 사유로 인한 서비스 장애에 대해 책임을 지지 않습니다.
② AI 분석 결과는 참고 목적으로 제공되며, 실제 반려동물의 건강·행동 진단을 대체하지 않습니다.
③ 이용자 간 분쟁에 대해 회사는 관여하지 않으며 책임을 지지 않습니다.

제10조 (분쟁 해결)
서비스 이용과 관련하여 발생한 분쟁은 대한민국 법률을 준거법으로 하며, 서울중앙지방법원을 제1심 관할 법원으로 합니다.

시행일: 2026년 10월 1일
최종 수정일: 2026년 10월 1일
문의: wal.wal.app365@gmail.com`;

/* ─────────────────────────────────────────────
   이용약관 (영어)
───────────────────────────────────────────── */
const TERMS_EN = `Article 1 (Purpose)
These Terms of Service ("Terms") govern the use of the WalWal pet AI communication platform service ("Service") provided by WalWal ("Company") and define the rights, obligations, and responsibilities between the Company and users.

Article 2 (Definitions)
① "Service" refers to the WalWal app and web platform, including AR pet behavior analysis, social feed, community, and Pet Studio features.
② "User" refers to any individual who agrees to these Terms and uses the Service.
③ "Premium Service" refers to features available to users after subscribing to a paid plan.

Article 3 (Effectiveness and Modification of Terms)
① These Terms take effect when users register for or use the Service. By accessing the Service, users agree to be bound by these Terms.
② The Company may amend these Terms within the scope of applicable law. Amendments will be announced at least 7 days before the effective date. For amendments unfavorable to users, notice will be given at least 30 days in advance.

Article 4 (Service Provision and Changes)
① The Company provides the following services:
  - AI-based pet behavior analysis and "inner thoughts" translation
  - Real-time pet emotion analysis via AR camera
  - Pet social feed and community features
  - Meetup events and pet activity information
  - Pet Studio (short-form video creation and sharing)
② Service content may change for technical or operational reasons, with prior notice provided.

Article 5 (User Obligations)
① Users must not engage in the following:
  - Using another person's identity or submitting false information
  - Engaging in activities that violate laws or public morals
  - Posting spam, obscene content, or hate speech
  - Infringing on the Company's intellectual property rights
  - Disrupting service operations (hacking, malware, etc.)
② Users are obligated to comply with applicable laws, these Terms, and in-service guidelines.

Article 6 (Content and Intellectual Property)
① Copyright to content uploaded by users (photos, videos, text, etc.) remains with the user.
② Users grant the Company a non-exclusive license to use uploaded content for service operation and promotion.
③ Intellectual property rights to all Company-created content (AI analysis results, UI design, software, etc.) belong to the Company.

Article 7 (Paid Services and Refunds)
① Fees for paid services are as displayed at the time of purchase.
② Subscriptions are automatically renewed from the payment date.
③ Refunds are available within 7 days of purchase if the premium service has not been used.
④ For purchases made through Apple App Store or Google Play, the respective platform's refund policy applies.

Article 8 (Service Restriction and Suspension)
① The Company may temporarily suspend the Service for system maintenance, force majeure, or server failure.
② Users who violate these Terms may have their service access restricted or accounts terminated.

Article 9 (Disclaimer)
① The Company is not liable for service disruptions caused by force majeure.
② AI analysis results are for reference only and do not substitute professional veterinary diagnosis.
③ The Company is not involved in or responsible for disputes between users.

Article 10 (Dispute Resolution)
Disputes arising from the use of the Service shall be governed by the laws of the Republic of Korea, with the Seoul Central District Court as the court of first instance.

Effective Date: January 1, 2025
Last Updated: September 1, 2025
Contact: wal.wal.app365@gmail.com`;

/* ─────────────────────────────────────────────
   개인정보 처리방침 (한국어)
───────────────────────────────────────────── */
const PRIVACY_KO = `WalWal(이하 "회사")은 이용자의 개인정보를 중요시하며, 「개인정보 보호법」, 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 등 관련 법령을 준수합니다.

제1조 (수집하는 개인정보 항목)
회사는 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.

[필수 항목]
  - 이메일 주소, 비밀번호 (회원가입 시)
  - 소셜 로그인 정보 (Apple, Google 계정 식별자)
  - 기기 식별자 (앱 서비스 운영)
  - 서비스 이용 기록, 접속 로그, IP 주소

[선택 항목]
  - 반려동물 프로필 (이름, 종류, 나이, 사진)
  - 프로필 사진
  - 위치 정보 (산책 모임, 레이더 기능 사용 시 - 별도 동의)

[자동 수집 항목]
  - 기기 정보 (OS, 앱 버전, 모델명)
  - 카메라 영상 데이터 (AR 분석 시, 기기 내 처리 후 서버 미전송)

제2조 (개인정보 수집 및 이용 목적)
① 회원가입 및 본인 확인
② AI 반려동물 행동 분석 서비스 제공
③ 피드, 커뮤니티, 펫 스튜디오 기능 제공
④ 결제 처리 및 환불 처리
⑤ 서비스 이용통계 분석 및 품질 개선
⑥ 고객 문의 답변 및 공지 발송
⑦ 부정 이용 방지 및 보안 유지

제3조 (개인정보 보유 및 이용 기간)
① 회원 탈퇴 시 즉시 파기합니다. 단, 다음 경우 해당 기간 보관합니다.
  - 전자상거래 관련 기록: 5년 (전자상거래 등에서의 소비자보호에 관한 법률)
  - 접속 로그: 3개월 (통신비밀보호법)
  - 불법 이용 방지 기록: 1년
② 이용자의 동의 철회 또는 수집·이용 목적이 달성된 경우 지체없이 파기합니다.

제4조 (개인정보의 제3자 제공)
회사는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 단, 다음의 경우 예외로 합니다.
  - 이용자가 사전에 동의한 경우
  - 법령에 의한 수사기관의 요청이 있는 경우
  - 서비스 제공을 위해 필요한 최소한의 정보를 처리 위탁하는 경우

제5조 (개인정보 처리 위탁)
회사는 원활한 서비스 제공을 위해 다음과 같이 처리를 위탁합니다.
  - Firebase (Google LLC): 인증, 데이터베이스, 분석
  - Apple Inc.: Apple 로그인 인증
  - 결제 대행사: 구독 결제 처리
위탁사는 위탁 목적 범위 내에서만 개인정보를 처리합니다.

제6조 (카메라 및 위치 정보 관련)
① AR 카메라 기능은 기기의 카메라에 접근하며, 촬영된 영상은 기기 내에서만 처리되고 서버로 전송되지 않습니다.
② 위치 정보는 이용자의 명시적 동의 후에만 수집되며, 산책 모임 검색 기능에만 사용됩니다.

제7조 (이용자의 권리)
이용자는 언제든지 다음 권리를 행사할 수 있습니다.
  - 개인정보 열람 요청
  - 오류 정정 요청
  - 삭제(잊혀질 권리) 요청
  - 처리 정지 요청
권리 행사는 앱 내 설정 > 개인정보 관리 또는 wal.wal.app365@gmail.com으로 문의하시면 됩니다.

제8조 (개인정보 보호 조치)
① 개인정보는 암호화하여 저장·전송합니다.
② 개인정보 접근은 최소한의 권한을 가진 담당자에게만 허용됩니다.
③ 정기적인 보안 점검을 통해 개인정보 유출을 방지합니다.

제9조 (만 14세 미만 아동)
본 서비스는 만 14세 미만 아동의 이용을 제한하며, 해당 연령대의 개인정보를 의도적으로 수집하지 않습니다. 발견 시 즉시 삭제합니다.

제10조 (개인정보 보호책임자)
개인정보 보호책임자: webmaster
이메일: wal.wal.app365@gmail.com 

제11조 (개인정보 처리방침 변경)
본 방침은 법령 또는 정책 변경에 따라 수정될 수 있으며, 변경 시 앱 내 공지사항을 통해 사전 안내합니다.

시행일: 2026년 10월 1일
최종 수정일: 2026년 10월 1일`;

/* ─────────────────────────────────────────────
   개인정보 처리방침 (영어)
───────────────────────────────────────────── */
const PRIVACY_EN = `WalWal ("Company") values user privacy and complies with the Personal Information Protection Act and other applicable laws.

Article 1 (Information We Collect)
The Company collects the following information to provide the Service:

[Required]
  - Email address and password (for account registration)
  - Social login identifiers (Apple ID, Google account)
  - Device identifiers (for app operation)
  - Service usage logs, access logs, IP address

[Optional]
  - Pet profile (name, species, age, photo)
  - Profile photo
  - Location information (for Meetup/Radar features, with separate consent)

[Automatically Collected]
  - Device information (OS, app version, model)
  - Camera data (processed on-device for AR; never transmitted to servers)

Article 2 (Purposes of Collection and Use)
① User registration and identity verification
② Providing AI-based pet behavior analysis services
③ Feed, community, and Pet Studio features
④ Payment and refund processing
⑤ Usage statistics and service improvement
⑥ Customer support and notifications
⑦ Fraud prevention and security

Article 3 (Retention and Disposal)
① Personal data is deleted immediately upon account termination, except:
  - E-commerce transaction records: 5 years (Consumer Protection in Electronic Commerce Act)
  - Access logs: 3 months (Protection of Communications Secrets Act)
  - Fraud prevention records: 1 year
② Data is disposed of without delay when the purpose of collection is fulfilled or consent is withdrawn.

Article 4 (Third-Party Disclosure)
The Company does not share personal information with third parties as a general rule, except:
  - When the user has given prior consent
  - When required by law enforcement or legal process
  - For service operation through data processing agreements (see Article 5)

Article 5 (Data Processing Delegation)
The Company delegates processing to the following for service operation:
  - Firebase (Google LLC): Authentication, database, analytics
  - Apple Inc.: Apple sign-in authentication
  - Payment processors: Subscription billing
Delegates process data only within the scope of the delegated purpose.

Article 6 (Camera and Location Data)
① The AR camera feature accesses the device camera. All video processing occurs on-device and is never transmitted to servers.
② Location information is collected only with explicit user consent and used solely for the Meetup/Radar search feature.

Article 7 (User Rights)
Users may exercise the following rights at any time:
  - Right to access personal data
  - Right to correction of inaccurate data
  - Right to erasure ("right to be forgotten")
  - Right to restriction of processing
To exercise these rights, visit Settings > Privacy within the app or contact wal.wal.app365@gmail.com.

Article 8 (Security Measures)
① Personal data is encrypted during storage and transmission.
② Access to personal data is restricted to authorized personnel only.
③ Regular security audits are conducted to prevent data breaches.

Article 9 (Children Under 14)
This Service is not intended for children under 14 years of age. We do not knowingly collect personal data from children. If discovered, such data will be deleted immediately.

Article 10 (Privacy Officer)
Privacy Officer: Webmaster
Email: wal.wal.app365@gmail.com 

Article 11 (Policy Updates)
This policy may be updated due to legal or policy changes. Updates will be announced through in-app notices in advance.

Effective Date: October 1, 2026
Last Updated: October 1, 2026`;

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
    a: 'Video captured through the AR camera is processed on-device only and is never transmitted to or stored on our servers. Only photos/videos you explicitly post to the feed are stored within the service.'
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
    q: 'Can I delete or edit posts I\'ve shared to the feed?',
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
      case 'faq': return <HelpCircle size={24} color="#FFB320" />;
      case 'terms': return <FileText size={24} color="#FFB320" />;
      case 'privacy': return <Shield size={24} color="#FFB320" />;
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
