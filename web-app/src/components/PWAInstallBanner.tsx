import React, { useState, useEffect } from 'react';
import { Download, X, Share, PlusSquare, Smartphone, ArrowDown } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

let deferredPrompt: BeforeInstallPromptEvent | null = null;

export const triggerPWAInstall = async (): Promise<boolean> => {
  if (deferredPrompt) {
    try {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        return true;
      }
    } catch (e) {
      console.error('PWA install prompt error:', e);
    }
  }
  return false;
};

export const openPWAInstallGuide = () => {
  window.dispatchEvent(new CustomEvent('walwal_show_pwa_guide'));
};

export const PWAInstallBanner: React.FC = () => {
  const { language } = useTranslation();
  const [canInstall, setCanInstall] = useState(true);
  const [isIOS, setIsIOS] = useState(false);
  const [isSafari, setIsSafari] = useState(true);
  const [showGuide, setShowGuide] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // 1. Check if already installed in standalone mode
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    if (isStandalone) {
      setCanInstall(false);
      return;
    }

    // 2. Check if dismissed before in session
    const isDismissed = sessionStorage.getItem('WALWAL_PWA_BANNER_DISMISSED');
    if (isDismissed) {
      setDismissed(true);
    }

    // 3. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isSafariBrowser = /safari/.test(userAgent) && !/chrome|crios|fxios|naver|kakaotalk/.test(userAgent);

    setIsIOS(isIosDevice);
    setIsSafari(isSafariBrowser);

    // 4. Capture Android/Chrome beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      deferredPrompt = e as BeforeInstallPromptEvent;
      setCanInstall(true);
    };

    const handleCustomOpenGuide = () => {
      setShowGuide(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('walwal_show_pwa_guide', handleCustomOpenGuide);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('walwal_show_pwa_guide', handleCustomOpenGuide);
    };
  }, []);

  const handleInstallClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isIOS) {
      setShowGuide(true);
      return;
    }

    if (deferredPrompt) {
      const success = await triggerPWAInstall();
      if (success) {
        setCanInstall(false);
        return;
      }
    }
    // If not iOS and no automated prompt available, show general guide
    setShowGuide(true);
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissed(true);
    sessionStorage.setItem('WALWAL_PWA_BANNER_DISMISSED', 'true');
  };

  if (!canInstall || dismissed) {
    // Even if banner is hidden, keep the modal listener active
    if (!showGuide) return null;
  }

  return (
    <>
      {!dismissed && canInstall && (
        <div
          onClick={handleInstallClick}
          style={{
            position: 'fixed',
            bottom: '72px',
            left: '50%',
            transform: 'translateX(-50%)',
            width: 'calc(100% + 24px)',
            maxWidth: '440px',
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            color: '#FFFFFF',
            borderRadius: '18px',
            padding: '12px 14px',
            boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            zIndex: 9990,
            cursor: 'pointer',
            border: '1px solid rgba(255, 179, 32, 0.3)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '12px',
                background: '#FFB320',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 4px 12px rgba(255, 179, 32, 0.4)'
              }}
            >
              <Download size={22} color="#FFFFFF" strokeWidth={2.5} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#FFFFFF' }}>
                {language === 'ko' ? 'WalWal 앱 다운로드 / 설치' : language === 'ja' ? 'WalWal アプリをインストール' : 'Install WalWal App'}
              </div>
              <div style={{ fontSize: '0.73rem', color: '#CBD5E1', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {language === 'ko' ? '홈 화면에 추가하면 알림 없이 바로 켜져요!' : 'Add to home screen for full app experience!'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleInstallClick}
              style={{
                background: '#FFB320',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '12px',
                padding: '8px 14px',
                fontSize: '0.82rem',
                fontWeight: 500,
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 8px rgba(255, 179, 32, 0.3)'
              }}
            >
              {language === 'ko' ? '앱 설치' : 'Install'}
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#94A3B8',
                cursor: 'pointer',
                padding: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
              title="닫기"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Installation Guide Modal (High Z-Index, Full Touch Overlay) */}
      {showGuide && (
        <div
          onClick={() => setShowGuide(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.65)',
            backdropFilter: 'blur(6px)',
            WebkitBackdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            zIndex: 100000,
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '380px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '26px 22px',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              animation: 'scaleUp 0.25s ease-out'
            }}
          >
            {/* Close Icon */}
            <button
              onClick={() => setShowGuide(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: '#F1F5F9',
                border: 'none',
                borderRadius: '50%',
                width: '32px',
                height: '32px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748B',
                cursor: 'pointer'
              }}
            >
              <X size={24} />
            </button>

            {/* Icon Header */}


            <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: '#1E293B', marginTop: '30px' }}>
              {isIOS ? '아이폰 홈 화면에 앱 설치하기' : '스마트폰 홈 화면에 앱 설치하기'}
            </h3>

            <p style={{ fontSize: '0.74rem', color: '#64748B', lineHeight: 1.5, padding: '20px' }}>
              {language === 'ko'
                ? '앱으로 설치하면 접속할 때마다 알림 없이 바로 카메라가 켜집니다.'
                : 'Install as app to open camera instantly without repeated prompts.'}
            </p>

            {/* Guide Step Boxes */}
            {isIOS ? (
              <div style={{ textAlign: 'left', background: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '22px' }}>
                {!isSafari && (
                  <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px dashed #E2E8F0', color: '#EF4444', fontSize: '0.82rem', fontWeight: 700 }}>
                    카카오톡/인스타 인앱브라우저에서는 우측 상단 메뉴를 눌러 <strong>[Safari로 열기]</strong>를 먼저 선택해 주세요!
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FFB320', color: '#FFFFFF', fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    1
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 500 }}>
                    Safari 하단의 <strong>공유 버튼</strong> (<Share size={15} style={{ display: 'inline', verticalAlign: '-2px' }} />) 터치
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FFB320', color: '#FFFFFF', fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    2
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 500 }}>
                    메뉴에서 <strong>[홈 화면에 추가]</strong> (<PlusSquare size={15} style={{ display: 'inline', verticalAlign: '-2px' }} />) 선택
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'left', background: '#F8FAFC', borderRadius: '16px', padding: '16px', marginBottom: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FFB320', color: '#FFFFFF', fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    1
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 500 }}>
                    브라우저 우측 상단 <strong>메뉴 (⋮)</strong> 터치
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#FFB320', color: '#FFFFFF', fontWeight: 500, fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    2
                  </div>
                  <div style={{ fontSize: '0.88rem', color: '#1E293B', fontWeight: 500 }}>
                    <strong>[앱 설치]</strong> 또는 <strong>[홈 화면에 추가]</strong> 선택
                  </div>
                </div>
              </div>
            )}

            {isIOS && isSafari && (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px', color: '#FF7E36', fontSize: '0.8rem', fontWeight: 700, marginBottom: '16px' }}>
                <ArrowDown size={16} /> 화면 맨 아래 공유 아이콘을 눌러주세요
              </div>
            )}

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              style={{
                width: '100%',
                padding: '14px',
                background: '#FFB320',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: '16px',
                fontSize: '0.95rem',
                fontWeight: 500,
                cursor: 'pointer',
                boxShadow: '0 4px 16px rgba(255, 179, 32, 0.35)'
              }}
            >
              {language === 'ko' ? '확인 완료' : 'Got it'}
            </button>
          </div>
        </div>
      )}
    </>
  );
};
