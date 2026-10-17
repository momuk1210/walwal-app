import React, { useState, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
// LanguageSelector moved to ProfileView
import { ARCameraView } from './components/ARCameraView';
import { NearbyView } from './components/NearbyView';
import { SnapsView } from './components/SnapsView';
import { ShortformStudio } from './components/ShortformStudio';
import { ProfileView } from './components/ProfileView';
import { CommunityView } from './components/CommunityView';
import { BottomNav, NavTab } from './components/BottomNav';
import { AuthView } from './components/AuthView';
import { PaywallView } from './components/PaywallView';
import { AdminView } from './components/AdminView';
import { AllServicesModal } from './components/AllServicesModal';
import { ServiceFeedbackModal } from './components/ServiceFeedbackModal';
import { LegalView, LegalViewType } from './components/LegalView';
// VirtualChatModal replaced by AR Camera 2-Dog Interaction Mode
import { DogProfile, MOCK_DOGS, getMockDogs, sanitizePetList } from './data/mockDogs';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Bell } from 'lucide-react';
import { PWAInstallBanner } from './components/PWAInstallBanner';
import { GlobalWalkFloatingBar } from './components/GlobalWalkFloatingBar';
import { AppPermissionModal } from './components/AppPermissionModal';

export type AppViewTab = NavTab | 'studio' | 'admin';

function WalWalMain() {
  const [appState, setAppState] = useState<'loading' | 'auth' | 'paywall' | 'main'>(() => {
    const savedLoggedIn = localStorage.getItem('walwal_logged_in');
    const savedState = localStorage.getItem('walwal_app_state');
    if (savedLoggedIn === 'true' || savedState === 'main') {
      return 'main';
    }
    return 'loading';
  });
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setAppState('main');
        localStorage.setItem('walwal_logged_in', 'true');
        localStorage.setItem('walwal_app_state', 'main');
      } else {
        const savedLoggedIn = localStorage.getItem('walwal_logged_in');
        const savedState = localStorage.getItem('walwal_app_state');
        if (savedLoggedIn === 'true' || savedState === 'main') {
          setAppState('main');
        } else {
          setAppState('auth');
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const [currentTab, setCurrentTab] = useState<AppViewTab>('ar');
  const [arKey, setArKey] = useState<number>(0);
  const { t, language } = useTranslation();

  const [showPermissionModal, setShowPermissionModal] = useState<boolean>(() => {
    return localStorage.getItem('WALWAL_APP_PERMISSIONS_CONSENT') !== 'true';
  });

  useEffect(() => {
    if (localStorage.getItem('WALWAL_APP_PERMISSIONS_CONSENT') === 'true') {
      localStorage.setItem('WALWAL_PERM_CAMERA', 'true');
      localStorage.setItem('WALWAL_PERM_MIC', 'true');
      localStorage.setItem('WALWAL_PERM_LOCATION', 'true');
    }
  }, []);

  const [toastNotification, setToastNotification] = useState<{ title: string; body: string; time?: string } | null>(null);

  useEffect(() => {
    const handlePushEvent = (e: any) => {
      if (e.detail) {
        setToastNotification(e.detail);
        setTimeout(() => {
          setToastNotification(null);
        }, 5000);
      }
    };

    window.addEventListener('walwal_push_notification', handlePushEvent);
    return () => window.removeEventListener('walwal_push_notification', handlePushEvent);
  }, []);

  const [isAllServicesOpen, setIsAllServicesOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [activeLegalModal, setActiveLegalModal] = useState<LegalViewType | null>(null);

  useEffect(() => {
    const handleOpenServices = () => setIsAllServicesOpen(true);
    window.addEventListener('walwal_open_all_services', handleOpenServices);
    return () => window.removeEventListener('walwal_open_all_services', handleOpenServices);
  }, []);

  useEffect(() => {
    const handleOpenFeedback = () => setIsFeedbackOpen(true);
    window.addEventListener('walwal_open_feedback', handleOpenFeedback);
    return () => window.removeEventListener('walwal_open_feedback', handleOpenFeedback);
  }, []);

  useEffect(() => {
    const handleOpenLegal = (e: any) => {
      if (e.detail) {
        setActiveLegalModal(e.detail);
      }
    };
    window.addEventListener('walwal_open_legal', handleOpenLegal);
    return () => window.removeEventListener('walwal_open_legal', handleOpenLegal);
  }, []);

  useEffect(() => {
    const handleSwitchTab = (e: any) => {
      if (e.detail) {
        if (e.detail === 'ar') {
          setArKey(k => k + 1);
          setFeedDraft(null);
        }
        setCurrentTab(e.detail);
      }
    };
    window.addEventListener('walwal_switch_tab', handleSwitchTab);
    return () => window.removeEventListener('walwal_switch_tab', handleSwitchTab);
  }, []);

  const [studioTargetDog, setStudioTargetDog] = useState<DogProfile | null>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = sanitizePetList(parsed, language);
          if (list.length > 0) return list[0];
        }
      }
    } catch (e) { }
    return null;
  });
  const [studioThought, setStudioThought] = useState<string>('');
  const [studioSnapshot, setStudioSnapshot] = useState<string | undefined>(undefined);
  const [studioPoster, setStudioPoster] = useState<string | undefined>(undefined);
  const [interactionPair, setInteractionPair] = useState<{ dog1: DogProfile; dog2: DogProfile } | null>(null);
  const [feedDraft, setFeedDraft] = useState<{ dog: DogProfile; thought: string; image?: string; poster?: string; isVideo?: boolean } | null>(null);

  const handleCaptureToStory = (dog: any, thought: string, snapshot?: string, poster?: string) => {
    setStudioTargetDog(dog);
    setStudioThought(thought);
    setStudioSnapshot(snapshot);
    setStudioPoster(poster);
    setCurrentTab('studio');
  };

  const handleCaptureToFeed = (dog: DogProfile, thought: string, snapshot?: string, poster?: string, isVideo?: boolean) => {
    setFeedDraft({ dog, thought, image: snapshot, poster: poster || snapshot, isVideo: Boolean(isVideo) });
    setCurrentTab('snaps');
  };

  const handleStartInteraction = (dog1: DogProfile, dog2: DogProfile) => {
    setInteractionPair({ dog1, dog2 });
    setCurrentTab('ar');
  };

  const handleTabChange = (tabId: NavTab) => {
    if (tabId === 'ar') {
      setArKey(k => k + 1);
      setInteractionPair(null);
    } else {
      // AR탭이 아닌 다른 탭으로 이동 시 전역 카메라 하드웨어 스트림 즉시 강제 종료
      const globalStream = (window as any).__WALWAL_CAMERA_STREAM__;
      if (globalStream && typeof globalStream.getTracks === 'function') {
        globalStream.getTracks().forEach((t: MediaStreamTrack) => {
          try { t.stop(); } catch (e) { }
        });
        (window as any).__WALWAL_CAMERA_STREAM__ = null;
      }
    }
    setFeedDraft(null);
    if (tabId === 'snaps') {
      window.dispatchEvent(new CustomEvent('walwal_reset_snaps_top'));
    }
    setCurrentTab(tabId);
  };

  // Direct URL navigation check for Legal documents (Privacy / Terms)
  const currentPath = typeof window !== 'undefined' ? window.location.pathname.toLowerCase() : '';
  if (currentPath.includes('privacy')) {
    return (
      <div className="app-root-container" style={{ background: '#F8FAFC' }}>
        <LegalView type="privacy" onClose={() => { window.location.href = '/'; }} />
      </div>
    );
  }
  if (currentPath.includes('terms')) {
    return (
      <div className="app-root-container" style={{ background: '#F8FAFC' }}>
        <LegalView type="terms" onClose={() => { window.location.href = '/'; }} />
      </div>
    );
  }

  if (appState === 'loading') {
    return (
      <div className="app-loading-screen">
        <h2 className="app-loading-title">Loading...</h2>
      </div>
    );
  }

  if (appState === 'auth') {
    return <AuthView onLoginSuccess={() => {
      localStorage.setItem('walwal_app_state', 'main');
      setAppState('main');
    }} />;
  }


  return (
    <div className="app-root-container">
      {/* In-App Push Notification Banner */}
      {toastNotification && (
        <div
          onClick={() => {
            setCurrentTab('community');
            setToastNotification(null);
          }}
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            width: 'calc(100% - 32px)',
            maxWidth: '420px',
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(12px)',
            borderRadius: '18px',
            padding: '12px 16px',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
            border: '1.5px solid #FF9E58',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            cursor: 'pointer',
            animation: 'fadeIn 0.3s ease-out'
          }}
        >
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            background: '#FFF8E7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Bell size={20} color="#FF9E58" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '0.86rem', fontWeight: 800, color: '#000', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {toastNotification.title}
              </div>
              <span style={{ fontSize: '0.72rem', color: '#c8c8c8' }}>{toastNotification.time || '방금'}</span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#333', marginTop: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {toastNotification.body}
            </div>
          </div>
        </div>
      )}

      {/* Active Tab View */}
      <div className="app-viewport">
        {currentTab === 'ar' && (
          <ARCameraView
            onCaptureToStory={handleCaptureToStory}
            onCaptureToSnaps={handleCaptureToFeed}
            onCaptureToFeed={handleCaptureToFeed}
            interactionPair={interactionPair}
            onClearInteractionPair={() => setInteractionPair(null)}
            isActiveTrigger={arKey}
          />
        )}

        {currentTab === 'nearby' && (
          <NearbyView
            onStartVirtualChat={handleStartInteraction}
          />
        )}

        {currentTab === 'snaps' && (
          <SnapsView
            snapsDraft={feedDraft}
            feedDraft={feedDraft}
            onClearSnapsDraft={() => setFeedDraft(null)}
            onClearFeedDraft={() => setFeedDraft(null)}
            onRetake={() => {
              setFeedDraft(null);
              localStorage.setItem('WALWAL_PERM_CAMERA', 'true');
              setArKey(k => k + 1);
              setCurrentTab('ar');
            }}
          />
        )}

        {currentTab === 'community' && (
          <CommunityView />
        )}

        {currentTab === 'profile' && (
          <ProfileView />
        )}

        {currentTab === 'studio' && (
          <ShortformStudio
            initialDog={studioTargetDog}
            initialThought={studioThought}
            initialImage={studioSnapshot}
            initialPoster={studioPoster}
            isProUser={true}
            onOpenPro={() => { }}
            onClose={() => setCurrentTab('ar')}
            onRetake={() => {
              setArKey(k => k + 1);
              setCurrentTab('ar');
            }}
            onPostSuccess={() => setCurrentTab('snaps')}
          />
        )}

        {currentTab === 'admin' && (
          <AdminView onClose={() => setCurrentTab('profile')} />
        )}

        {currentTab !== 'admin' && currentTab !== 'community' && (
          <GlobalWalkFloatingBar
            onOpenWalkModal={() => {
              setCurrentTab('community');
            }}
          />
        )}
        <PWAInstallBanner />
        {currentTab !== 'admin' && (
          <BottomNav currentTab={currentTab === 'studio' ? 'ar' : currentTab} onChangeTab={handleTabChange} />
        )}

      </div>
      {/* All Services Menu Drawer */}
      <AllServicesModal
        isOpen={isAllServicesOpen}
        onClose={() => setIsAllServicesOpen(false)}
        onNavigate={(tabId) => handleTabChange(tabId as any)}
      />

      {/* Service Improvement & Feedback Modal */}
      <ServiceFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
      />

      {/* Legal Document Modal (Terms / Privacy / FAQ) */}
      {activeLegalModal && (
        <LegalView
          type={activeLegalModal}
          onClose={() => setActiveLegalModal(null)}
        />
      )}

      {/* App Access Permission Guidance Modal (최초 로그인/진입 시 1회만 표시 후 영구 저장) */}
      {showPermissionModal && (
        <AppPermissionModal
          onClose={() => setShowPermissionModal(false)}
        />
      )}
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <WalWalMain />
    </LanguageProvider>
  );
}

export default App;
