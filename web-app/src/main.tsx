import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/common.css'
import App from './App.tsx'
import { registerSW } from 'virtual:pwa-register'
import { sanitizePetList } from './data/mockDogs'

// Clean up stale mock/deleted pets immediately on app start
try {
  const saved = localStorage.getItem('WALWAL_PETS');
  if (saved) {
    const parsed = JSON.parse(saved);
    if (Array.isArray(parsed)) {
      const activeLang = localStorage.getItem('WALWAL_LANGUAGE') || 'ko';
      const sanitized = sanitizePetList(parsed, activeLang);
      localStorage.setItem('WALWAL_PETS', JSON.stringify(sanitized));
    }
  }
} catch (e) { }

// PWA 진입 시 카메라/마이크 자동 팝업 원천 차단: 기본 상태를 항상 false로 시작
try {
  localStorage.setItem('WALWAL_PERM_CAMERA', 'false');
  localStorage.setItem('WALWAL_PERM_MIC', 'false');
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

// Auto-reload when new Service Worker takes over (PWA update)
let refreshing = false;
if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    updateSW(true);
  },
  onOfflineReady() {
    console.log('WalWal PWA ready to work offline');
  }
});

// Check for updates when PWA becomes active
if (typeof window !== 'undefined') {
  window.addEventListener('focus', () => {
    updateSW(true);
  });
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      updateSW(true);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
