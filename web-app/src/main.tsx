import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/common.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { sanitizePetList } from './data/mockDogs'

// Global MediaDevices getUserMedia Interceptor:
// 중복 호출 및 React 렌더링/이벤트 경쟁 상태로 인한 iOS WebKit 연속 권한 팝업(3회 이상)을 브라우저 API 레벨에서 원천 차단
if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
  const nativeGUM = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
  let globalMediaStream: MediaStream | null = null;
  let inFlightMediaPromise: Promise<MediaStream> | null = null;

  navigator.mediaDevices.getUserMedia = async function (constraints?: MediaStreamConstraints) {
    // 1. 이미 활성 비디오 트랙이 살아있다면 브라우저 하드웨어에 절대 재요청하지 않고 기존 스트림 즉시 반환
    if (globalMediaStream) {
      if (globalMediaStream.getVideoTracks().some(t => t.readyState === 'live')) {
        return globalMediaStream;
      }
      globalMediaStream = null;
    }

    // 2. 이미 시스템 권한 승인 팝업이 떠서 대기 중이라면 추가 팝업을 띄우지 않고 기존 요청 Promise를 공유
    if (inFlightMediaPromise) {
      return inFlightMediaPromise;
    }

    inFlightMediaPromise = (async () => {
      try {
        const stream = await nativeGUM(constraints);
        globalMediaStream = stream;
        stream.getVideoTracks().forEach(track => {
          track.addEventListener('ended', () => {
            if (globalMediaStream && !globalMediaStream.getVideoTracks().some(t => t.readyState === 'live')) {
              globalMediaStream = null;
            }
          });
        });
        return stream;
      } finally {
        inFlightMediaPromise = null;
      }
    })();

    return inFlightMediaPromise;
  };
}

// Clean up stale mock/deleted pets and verify pet ownership immediately on app start
try {
  const curEmail = (localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '').toLowerCase().trim();
  const saved = localStorage.getItem('WALWAL_PETS');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      const activeLang = localStorage.getItem('WALWAL_LANGUAGE') || 'ko';
      const owned = parsed.filter((p: any) => {
        if (!curEmail) return true;
        const petOwner = (p.ownerEmail || '').toLowerCase().trim();
        if (curEmail.includes('daisynara')) return true;
        return !petOwner || petOwner === curEmail;
      });
      const sanitized = sanitizePetList(owned, activeLang);
      localStorage.setItem('WALWAL_PETS', JSON.stringify(sanitized));
    }
  }
} catch (e) { }

// Sanitize admin authorization flag: only daisynara can hold WALWAL_ADMIN_AUTH by default
try {
  const curEmail = (localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '').toLowerCase().trim();
  if (curEmail && !curEmail.includes('daisynara')) {
    localStorage.removeItem('WALWAL_ADMIN_AUTH');
  }
} catch (e) { }

// 카메라/마이크 권한: 앱 권한 동의 상태와 동기화 (카메라, 마이크 동일하게 처리)
try {
  const hasConsent = localStorage.getItem('WALWAL_APP_PERMISSIONS_CONSENT') === 'true';
  if (hasConsent) {
    localStorage.setItem('WALWAL_PERM_CAMERA', 'true');
    localStorage.setItem('WALWAL_PERM_MIC', 'true');
    localStorage.setItem('WALWAL_PERM_LOCATION', 'true');
  }
} catch (e) { }

// Ensure all default notification settings are ON for new users
try {
  if (!localStorage.getItem('WALWAL_SETTINGS_NOTIFICATIONS')) {
    localStorage.setItem('WALWAL_SETTINGS_NOTIFICATIONS', JSON.stringify({
      radarAlert: true,
      meetupAlert: true,
      feedAlert: true
    }));
  }
} catch (e) { }

// PWA Service Worker Registration
registerSW({
  immediate: true,
  onNeedRefresh() {
    console.log('New WalWal version available');
  },
  onOfflineReady() {
    console.log('WalWal PWA ready to work offline');
  }
});

if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistration().then(reg => {
    if (reg) reg.update();
  }).catch(() => {});
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
