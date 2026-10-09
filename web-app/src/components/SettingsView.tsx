import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation, Language } from '../i18n/LanguageContext';
import { auth } from '../firebase';
import { signOut, deleteUser, onAuthStateChanged } from 'firebase/auth';
import { LegalView, LegalViewType } from './LegalView';
import {
  ArrowLeft,
  Globe,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  LogOut,
  Trash2,
  ChevronRight,
  Camera,
  Mic,
  MapPin,
  Sparkles,
  Download,
  MessageSquare
} from 'lucide-react';
import { triggerPWAInstall, openPWAInstallGuide } from './PWAInstallBanner';
import '../styles/SettingsView.css';
import '../styles/AdminView.css';

interface SettingsViewProps {
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const { t, language, setLanguage } = useTranslation();

  // Persisted Notification toggle states
  const [radarAlert, setRadarAlert] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_SETTINGS_NOTIFICATIONS');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.radarAlert !== false;
      }
    } catch (e) { }
    return true;
  });

  const [meetupAlert, setMeetupAlert] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_SETTINGS_NOTIFICATIONS');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.meetupAlert !== false;
      }
    } catch (e) { }
    return true;
  });

  const [feedAlert, setFeedAlert] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_SETTINGS_NOTIFICATIONS');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.feedAlert !== false;
      }
    } catch (e) { }
    return true;
  });

  const updateNotificationSetting = (key: 'radarAlert' | 'meetupAlert' | 'feedAlert', val: boolean) => {
    try {
      const saved = localStorage.getItem('WALWAL_SETTINGS_NOTIFICATIONS');
      const current = saved ? JSON.parse(saved) : {};
      const updated = {
        radarAlert: key === 'radarAlert' ? val : (current.radarAlert !== false),
        meetupAlert: key === 'meetupAlert' ? val : (current.meetupAlert !== false),
        feedAlert: key === 'feedAlert' ? val : (current.feedAlert !== false)
      };
      localStorage.setItem('WALWAL_SETTINGS_NOTIFICATIONS', JSON.stringify(updated));
    } catch (e) { }
  };

  const toggleRadarAlert = async () => {
    const next = !radarAlert;
    setRadarAlert(next);
    updateNotificationSetting('radarAlert', next);
    if (next) {
      const { requestNotificationPermission } = await import('../utils/notificationService');
      await requestNotificationPermission();
    }
  };

  const toggleMeetupAlert = async () => {
    const next = !meetupAlert;
    setMeetupAlert(next);
    updateNotificationSetting('meetupAlert', next);
    if (next) {
      const { requestNotificationPermission, sendPushNotification } = await import('../utils/notificationService');
      const granted = await requestNotificationPermission();
      if (granted) {
        sendPushNotification({
          title: t.settings?.notificationActivatedTitle || 'WalWal 산책방 알림 활성화됨',
          body: t.settings?.notificationActivatedBody || '산책방에 새 이웃이 입장하거나 글이 올라오면 핸드폰으로 알려드립니다!'
        });
      }
    }
  };

  const toggleFeedAlert = async () => {
    const next = !feedAlert;
    setFeedAlert(next);
    updateNotificationSetting('feedAlert', next);
    if (next) {
      const { requestNotificationPermission } = await import('../utils/notificationService');
      await requestNotificationPermission();
    }
  };

  // 권한 기본값: 명시적으로 켠 경우('true')에만 활성화하여 자동 팝업 차단
  const [cameraPerm, setCameraPerm] = useState(localStorage.getItem('WALWAL_PERM_CAMERA') === 'true');
  const [micPerm, setMicPerm] = useState(localStorage.getItem('WALWAL_PERM_MIC') === 'true');
  const [locationPerm, setLocationPerm] = useState(localStorage.getItem('WALWAL_PERM_LOCATION') !== 'false');
  const [activeLegalView, setActiveLegalView] = useState<LegalViewType | null>(null);

  // Admin Mode Gate
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u?.email) {
        localStorage.setItem('WALWAL_USER_EMAIL', u.email);
      }
    });
    return () => unsub();
  }, []);

  const [versionTaps, setVersionTaps] = useState(0);
  const [showAdminPinModal, setShowAdminPinModal] = useState(false);
  const [adminPin, setAdminPin] = useState('');
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(localStorage.getItem('WALWAL_ADMIN_AUTH') === 'true');

  const isDaisynara = React.useMemo(() => {
    const email = (currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || '').toLowerCase().trim();
    return email === 'daisynara@gmail.com' || email.includes('daisynara') || isAdminUnlocked;
  }, [currentUser, isAdminUnlocked]);

  const handleVersionClick = () => {
    const next = versionTaps + 1;
    if (next >= 5) {
      setVersionTaps(0);
      if (isDaisynara) {
        window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'admin' }));
        onClose();
      } else {
        setShowAdminPinModal(true);
      }
    } else {
      setVersionTaps(next);
    }
  };

  const handleVerifyAdminPin = () => {
    if (adminPin.trim() === 'walwal777' || adminPin.trim() === 'admin777' || adminPin.trim() === '1234') {
      localStorage.setItem('WALWAL_ADMIN_AUTH', 'true');
      setIsAdminUnlocked(true);
      setShowAdminPinModal(false);
      setAdminPin('');
      window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'admin' }));
      onClose();
    } else {
      alert('관리자 인증 번호(PIN)가 올바르지 않습니다.');
    }
  };

  const toggleCamera = () => {
    const next = !cameraPerm;
    setCameraPerm(next);
    localStorage.setItem('WALWAL_PERM_CAMERA', next ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('walwal_permissions_updated', { detail: { type: 'camera', value: next } }));
  };
  const toggleMic = () => {
    const next = !micPerm;
    setMicPerm(next);
    localStorage.setItem('WALWAL_PERM_MIC', next ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('walwal_permissions_updated', { detail: { type: 'mic', value: next } }));
  };
  const toggleLocation = () => {
    const next = !locationPerm;
    setLocationPerm(next);
    localStorage.setItem('WALWAL_PERM_LOCATION', next ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('walwal_permissions_updated', { detail: { type: 'location', value: next } }));
  };

  const handleLogout = async () => {
    try {
      localStorage.removeItem('walwal_logged_in');
      localStorage.removeItem('walwal_app_state');
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Logout error", error);
      localStorage.removeItem('walwal_logged_in');
      localStorage.removeItem('walwal_app_state');
      window.location.reload();
    }
  };

  const handleDeleteAccount = async () => {
    const confirmMsg = t.settings?.confirmDelete || "정말로 계정을 탈퇴하시겠습니까? 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.";
    const confirmDelete = window.confirm(confirmMsg);
    if (confirmDelete) {
      try {
        if (auth.currentUser) {
          await deleteUser(auth.currentUser);
        }
        localStorage.removeItem('walwal_logged_in');
        localStorage.removeItem('walwal_app_state');
        localStorage.removeItem('WALWAL_PETS');
        localStorage.removeItem('WALWAL_FEED_POSTS');
        window.location.reload();
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          alert("보안을 위해 다시 로그인한 후 탈퇴를 진행해주세요.");
        } else {
          console.error("Account deletion error", error);
          localStorage.removeItem('walwal_logged_in');
          localStorage.removeItem('walwal_app_state');
          window.location.reload();
        }
      }
    }
  };

  const Toggle = ({ active, onChange }: { active: boolean, onChange: () => void }) => (
    <div
      className={`settings-toggle ${active ? 'active' : 'inactive'}`}
      onClick={onChange}
    >
      <div className={`settings-toggle-knob ${active ? 'active' : 'inactive'}`} />
    </div>
  );

  const Section = ({ title, children }: { title: string, children: React.ReactNode }) => (
    <div className="settings-section">
      <h3 className="settings-section-title">{title}</h3>
      <div className="settings-section-content">{children}</div>
      {activeLegalView && <LegalView type={activeLegalView} onClose={() => setActiveLegalView(null)} />}
    </div>
  );

  const ListItem = ({
    icon,
    title,
    subtitle,
    rightElement,
    onClick,
    destructive
  }: {
    icon: React.ReactNode,
    title: string,
    subtitle?: string,
    rightElement?: React.ReactNode,
    onClick?: () => void,
    destructive?: boolean
  }) => (
    <div
      className={`settings-list-item ${destructive ? 'destructive' : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="settings-list-icon">{icon}</div>
      <div className="settings-list-text">
        <div className="settings-list-title">{title}</div>
        {subtitle && <div className="settings-list-subtitle">{subtitle}</div>}
      </div>
      {rightElement || (onClick && <ChevronRight size={20} color="#718096" />)}
    </div>
  );

  return (
    <div className="settings-view-root">
      {/* Header */}
      <div className="settings-header">
        <button onClick={onClose} className="settings-back-btn">
          <ArrowLeft size={24} />
        </button>
        <h1 className="settings-title">
          {t.settings?.title || "설정"}
        </h1>
      </div>

      {/* Scrollable Content */}
      <div className="settings-content">

        {/* Preferences */}
        <Section title={t.settings?.preferences || "앱 설정"}>
          <ListItem
            icon={<Globe size={22} />}
            title={t.settings?.language || "언어 (Language)"}
            rightElement={
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="settings-lang-select"
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="ja">日本語</option>
                <option value="es">Español</option>
                <option value="fr">Français</option>
                <option value="zh">中文</option>
              </select>
            }
          />
          <ListItem
            icon={<Download size={22} />}
            title={t.settings?.pwaInstallTitle || "앱 다운로드 / 홈 화면에 설치"}
            subtitle={t.settings?.pwaInstallSubtitle || "홈 화면에 PWA 앱으로 추가하여 전체 화면으로 사용"}
            onClick={async () => {
              const installed = await triggerPWAInstall();
              if (!installed) {
                openPWAInstallGuide();
              }
            }}
          />
        </Section>

        {/* Permissions */}
        <Section title={t.settings?.permissions || "권한 관리"}>
          <ListItem
            icon={<Camera size={22} />}
            title={t.settings?.camera || "카메라"}
            rightElement={<Toggle active={cameraPerm} onChange={toggleCamera} />}
          />
          <ListItem
            icon={<Mic size={22} />}
            title={t.settings?.mic || "마이크"}
            rightElement={<Toggle active={micPerm} onChange={toggleMic} />}
          />
          <ListItem
            icon={<MapPin size={22} />}
            title={t.settings?.location || "위치"}
            rightElement={<Toggle active={locationPerm} onChange={toggleLocation} />}
          />
        </Section>

        {/* Notifications */}
        <Section title={t.settings?.notifications || "알림 설정"}>
          <ListItem
            icon={<Bell size={22} />}
            title={t.settings?.radarAlert || "근처 반려견 등장 (동네친구)"}
            rightElement={<Toggle active={radarAlert} onChange={toggleRadarAlert} />}
          />
          <ListItem
            icon={<Bell size={22} />}
            title={t.settings?.meetupAlert || (language === 'zh' ? "聚会与聊天室实时提醒" : language === 'fr' ? "Rencontres & Chat en direct" : "번개 모임 & 산책방 실시간 알림")}
            subtitle={
              t.settings?.meetupAlertSubtitle ||
              (language === 'zh'
                ? "新参与者加入与聊天消息推送提醒"
                : language === 'fr'
                ? "Notifications pour les nouveaux participants et messages"
                : language === 'ja'
                ? "新しい参加者の入場およびチャットメッセージ通知"
                : language === 'es'
                ? "Notificaciones para nuevos participantes y mensajes de chat"
                : language === 'en'
                ? "Push notifications for new participants & chat messages"
                : "새 참여자 입장 및 채팅 메시지 푸시 알림")
            }
            rightElement={<Toggle active={meetupAlert} onChange={toggleMeetupAlert} />}
          />
          <ListItem
            icon={<Bell size={22} />}
            title={t.settings?.feedAlert || t.settings?.snapsAlert || "피드 소식"}
            rightElement={<Toggle active={feedAlert} onChange={toggleFeedAlert} />}
          />
          <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              type="button"
              className="tap-btn"
              style={{ padding: '6px 12px', fontSize: '0.78rem', background: '#F1F5F9', border: '1px solid #CBD5E1', color: '#334155' }}
              onClick={async () => {
                const { requestNotificationPermission, sendPushNotification } = await import('../utils/notificationService');
                const granted = await requestNotificationPermission();
                if (granted) {
                  sendPushNotification({
                    title: t.settings?.testNotificationTitle || '[WalWal] 초코 님이 산책방에 참여했습니다!',
                    body: t.settings?.testNotificationBody || '서울숲 야간 킁킁 산책: "안녕하세요! 오늘 8시 반에 만나요!"'
                  });
                } else {
                  alert(t.settings?.notificationPermissionDenied || '브라우저 설정에서 알림 권한을 허용해주세요.');
                }
              }}
            >
              {t.settings?.testNotificationBtn || '핸드폰 알림 테스트 발송'}
            </button>
          </div>
        </Section>

        {/* Support & Legal */}
        <Section title={t.settings?.support || "고객 지원 및 약관"}>
          <ListItem icon={<HelpCircle size={22} />} title={t.settings?.faq || "자주 묻는 질문"} onClick={() => setActiveLegalView('faq')} />
          <ListItem
            icon={<MessageSquare size={22} />}
            title={
              t.settings?.serviceFeedback ||
              (language === 'ko' ? "서비스 개선" :
              language === 'ja' ? "サービス改善" :
              language === 'es' ? "Mejora del servicio" :
              language === 'zh' ? "意见反馈" :
              language === 'fr' ? "Amélioration du service" : "Service Feedback")
            }
            onClick={() => window.dispatchEvent(new CustomEvent('walwal_open_feedback'))}
          />
          <ListItem icon={<FileText size={22} />} title={t.settings?.terms || "이용약관"} onClick={() => setActiveLegalView('terms')} />
          <ListItem icon={<Shield size={22} />} title={t.settings?.privacy || "개인정보 처리방침"} onClick={() => setActiveLegalView('privacy')} />
        </Section>

        {/* Account Management */}
        <Section title={t.settings?.account || "계정 관리"}>
          {isAdminUnlocked && (
            <ListItem
              icon={<Shield size={22} />}
              title="관리자 콘솔 (Admin)"
              subtitle="가입견 · 게시물 · 모임 통합 관리"
              rightElement={<ChevronRight size={18} color="#94A3B8" />}
              onClick={() => {
                window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'admin' }));
                onClose();
              }}
            />
          )}
          <ListItem
            icon={<LogOut size={22} />}
            title={t.settings?.logout || "로그아웃"}
            onClick={handleLogout}
          />
          <ListItem
            icon={<Trash2 size={22} />}
            title={t.settings?.deleteAccount || "회원 탈퇴"}
            destructive
            onClick={handleDeleteAccount}
          />
        </Section>

        {/* App Version Info with Hidden Admin Trigger */}
        <div style={{ textAlign: 'center', padding: '30px 16px 24px', color: '#94A3B8', fontSize: '12px' }}>
          <div
            onClick={handleVersionClick}
            style={{ cursor: 'pointer', display: 'inline-block', userSelect: 'none', padding: '4px 8px' }}
            title="5회 탭 시 관리자 인증"
          >
            WalWal App v1.5.0 (Build 2026.10.09)
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
            © WalWal Team. All rights reserved.
          </div>
        </div>

      </div>

      {/* Admin PIN Verification Modal */}
      {showAdminPinModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 179, 32, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFB320' }}>
                <Shield size={26} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800 }}>관리자 인증</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#94A3B8' }}>
              관리자 모드 접근을 위해 마스터 PIN을 입력하세요.
            </p>
            <input
              type="password"
              className="admin-pin-input"
              placeholder="PIN 번호 입력"
              value={adminPin}
              onChange={e => setAdminPin(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleVerifyAdminPin(); }}
              autoFocus
            />
            <div className="admin-modal-btns">
              <button
                className="admin-btn-cancel"
                onClick={() => { setShowAdminPinModal(false); setAdminPin(''); }}
              >
                취소
              </button>
              <button
                className="admin-btn-confirm"
                onClick={handleVerifyAdminPin}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
