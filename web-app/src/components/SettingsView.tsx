import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation, Language } from '../i18n/LanguageContext';
import { auth } from '../firebase';
import { signOut, deleteUser, onAuthStateChanged, updatePassword, sendPasswordResetEmail } from 'firebase/auth';
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
  MessageSquare,
  User,
  Key,
  Mail,
  Lock,
  CheckCircle,
  AlertCircle,
  X
} from 'lucide-react';
import { triggerPWAInstall, openPWAInstallGuide } from './PWAInstallBanner';
import '../styles/SettingsView.css';
import '../styles/AdminView.css';

const GoogleIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" className="settings-account-provider-google">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

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

  const updateNotificationSetting = (key: 'radarAlert' | 'meetupAlert', val: boolean) => {
    try {
      const saved = localStorage.getItem('WALWAL_SETTINGS_NOTIFICATIONS');
      const current = saved ? JSON.parse(saved) : {};
      const updated = {
        radarAlert: key === 'radarAlert' ? val : (current.radarAlert !== false),
        meetupAlert: key === 'meetupAlert' ? val : (current.meetupAlert !== false)
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

  // 권한 기본값: 명시적으로 켠 경우('true')에만 활성화하여 자동 팝업 차단
  const [cameraPerm, setCameraPerm] = useState(localStorage.getItem('WALWAL_PERM_CAMERA') === 'true');
  const [micPerm, setMicPerm] = useState(localStorage.getItem('WALWAL_PERM_MIC') === 'true');
  const [locationPerm, setLocationPerm] = useState(localStorage.getItem('WALWAL_PERM_LOCATION') !== 'false');
  const [activeLegalView, setActiveLegalView] = useState<LegalViewType | null>(null);

  useEffect(() => {
    const handlePermUpdate = (e: any) => {
      if (e?.detail?.type === 'camera') setCameraPerm(Boolean(e.detail.value));
      if (e?.detail?.type === 'mic') setMicPerm(Boolean(e.detail.value));
      if (e?.detail?.type === 'location') setLocationPerm(Boolean(e.detail.value));
    };
    window.addEventListener('walwal_permissions_updated', handlePermUpdate);
    return () => window.removeEventListener('walwal_permissions_updated', handlePermUpdate);
  }, []);

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

  const userEmail = useMemo(() => {
    return currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '';
  }, [currentUser]);

  const isGoogleUser = useMemo(() => {
    return currentUser?.providerData?.some((p: any) => p.providerId === 'google.com');
  }, [currentUser]);

  // Password Change Modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [passwordStatusMsg, setPasswordStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordLoading, setPasswordLoading] = useState(false);

  const handleUpdatePassword = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setPasswordStatusMsg(null);

    if (!newPassword || newPassword.length < 6) {
      setPasswordStatusMsg({ type: 'error', text: '비밀번호는 최소 6자 이상이어야 합니다.' });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordStatusMsg({ type: 'error', text: '새 비밀번호가 일치하지 않습니다.' });
      return;
    }

    try {
      setPasswordLoading(true);
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPasswordStatusMsg({ type: 'success', text: '비밀번호가 성공적으로 변경되었습니다!' });
        setNewPassword('');
        setConfirmNewPassword('');
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordStatusMsg(null);
        }, 1500);
      } else {
        setPasswordStatusMsg({ type: 'error', text: '로그인 세션이 만료되었습니다. 다시 로그인해 주세요.' });
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      if (err.code === 'auth/requires-recent-login') {
        setPasswordStatusMsg({ type: 'error', text: '보안을 위해 로그아웃 후 다시 로그인하여 비밀번호를 변경해 주세요.' });
      } else {
        setPasswordStatusMsg({ type: 'error', text: err.message || '비밀번호 변경에 실패했습니다.' });
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!userEmail) return;
    try {
      setPasswordLoading(true);
      await sendPasswordResetEmail(auth, userEmail);
      setPasswordStatusMsg({ type: 'success', text: `${userEmail}으로 비밀번호 재설정 이메일이 발송되었습니다.` });
    } catch (err: any) {
      setPasswordStatusMsg({ type: 'error', text: '이메일 발송에 실패했습니다: ' + err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const isDaisynara = React.useMemo(() => {
    const email = (userEmail || '').toLowerCase().trim();
    return email === 'daisynara@gmail.com' || email.includes('daisynara');
  }, [userEmail]);

  useEffect(() => {
    if (userEmail && !isDaisynara) {
      localStorage.removeItem('WALWAL_ADMIN_AUTH');
      setIsAdminUnlocked(false);
    }
  }, [userEmail, isDaisynara]);

  const handleOpenPasswordModal = () => {
    if (isGoogleUser) {
      alert(language === 'ko'
        ? 'Google 소셜 로그인으로 연동된 계정입니다.\n비밀번호 변경은 Google 계정 관리(myaccount.google.com)에서 관리됩니다.'
        : 'You signed in with Google.\nPassword changes are managed through your Google Account (myaccount.google.com).');
    } else if (!userEmail) {
      alert(language === 'ko' ? '로그인이 필요합니다.' : 'Please log in first.');
    } else {
      setPasswordStatusMsg(null);
      setNewPassword('');
      setConfirmNewPassword('');
      setShowPasswordModal(true);
    }
  };

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
      localStorage.removeItem('WALWAL_ADMIN_AUTH');
      localStorage.removeItem('walwal_user_email');
      localStorage.removeItem('WALWAL_USER_EMAIL');
      localStorage.removeItem('WALWAL_PETS');
      await signOut(auth);
      window.location.reload();
    } catch (error) {
      console.error("Logout error", error);
      localStorage.removeItem('walwal_logged_in');
      localStorage.removeItem('walwal_app_state');
      localStorage.removeItem('WALWAL_ADMIN_AUTH');
      localStorage.removeItem('walwal_user_email');
      localStorage.removeItem('WALWAL_USER_EMAIL');
      localStorage.removeItem('WALWAL_PETS');
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
      className={`settings-list-item  ${destructive ? 'destructive' : ''}`}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
      onClick={onClick}
    >
      <div className="settings-list-icon">{icon}</div>
      <div className="settings-list-text">
        <div className="settings-list-title">{title}</div>
        {subtitle && <div className="settings-list-subtitle">{subtitle}</div>}
      </div>
      {rightElement || (onClick && <ChevronRight size={20} color="#121212" />)}
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

        {/* 계정 관리 그룹 div */}
        <div className="settings-section settings-account-section">
          <h3 className="settings-section-title">{t.settings?.account || "계정 관리"}</h3>
          <div className="settings-account-card">
            {/* 이메일 주소 및 구글/이메일 아이콘 */}
            <div className="settings-account-header">
              <span className="settings-account-email">
                {userEmail || (language === 'ko' ? '로그인되지 않음' : 'Not Logged In')}
              </span>
              <span className="settings-account-provider-badge" title={isGoogleUser ? 'Google 계정' : '이메일 계정'}>
                {isGoogleUser ? (
                  <GoogleIcon size={18} />
                ) : (
                  <Mail size={18} className="settings-account-provider-mail" />
                )}
              </span>
              {isDaisynara && (
                <span className="settings-account-admin-crown" title="관리자">👑</span>
              )}
            </div>

            {/* 2x2 버튼:
                비밀번호변경 | 로그아웃
                회원탈퇴     | 관리자콘솔(admin) */}
            <div className="settings-account-grid">
              <button
                type="button"
                className="settings-account-action-btn"
                onClick={handleOpenPasswordModal}
              >
                <Key size={15} />
                <span>{language === 'ko' ? '비밀번호 변경' : 'Change Password'}</span>
              </button>

              <button
                type="button"
                className="settings-account-action-btn"
                onClick={handleLogout}
              >
                <LogOut size={15} />
                <span>{t.settings?.logout || '로그아웃'}</span>
              </button>

              <button
                type="button"
                className={`settings-account-action-btn destructive ${!isDaisynara ? 'full-width' : ''}`}
                onClick={handleDeleteAccount}
              >
                <Trash2 size={15} />
                <span>{t.settings?.deleteAccount || '회원 탈퇴'}</span>
              </button>

              {isDaisynara && (
                <button
                  type="button"
                  className="settings-account-action-btn admin active"
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'admin' }));
                    onClose();
                  }}
                >
                  <Shield size={15} />
                  <span>{language === 'ko' ? '관리자콘솔(admin)' : 'Admin Console'}</span>
                </button>
              )}
            </div>
          </div>
        </div>

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
            icon={<Download size={24} />}
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
            icon={<Camera size={24} />}
            title={t.settings?.camera || "카메라"}
            rightElement={<Toggle active={cameraPerm} onChange={toggleCamera} />}
          />
          <ListItem
            icon={<Mic size={24} />}
            title={t.settings?.mic || "마이크"}
            rightElement={<Toggle active={micPerm} onChange={toggleMic} />}
          />
          <ListItem
            icon={<MapPin size={24} />}
            title={t.settings?.location || "위치"}
            rightElement={<Toggle active={locationPerm} onChange={toggleLocation} />}
          />
        </Section>

        {/* Notifications */}
        <Section title={t.settings?.notifications || "알림 설정"}>
          <ListItem
            icon={<Bell size={24} />}
            title={t.settings?.radarAlert || "근처 반려견 등장 (동네친구)"}
            rightElement={<Toggle active={radarAlert} onChange={toggleRadarAlert} />}
          />
          <ListItem
            icon={<Bell size={24} />}
            title={t.settings?.meetupAlert || (language === 'zh' ? "聚会与聊天室实时提醒" : language === 'fr' ? "Rencontres & Chat en direct" : "모임 & 산책방 실시간 알림")}
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
          <div style={{ padding: '10px 16px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <button
              type="button"
              className="btn"
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
          <ListItem icon={<HelpCircle size={24} />} title={t.settings?.faq || "자주 묻는 질문"} onClick={() => setActiveLegalView('faq')} />
          <ListItem
            icon={<MessageSquare size={24} />}
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
          <ListItem icon={<FileText size={24} />} title={t.settings?.terms || "이용약관"} onClick={() => setActiveLegalView('terms')} />
          <ListItem icon={<Shield size={24} />} title={t.settings?.privacy || "개인정보 처리방침"} onClick={() => setActiveLegalView('privacy')} />
        </Section>


        {/* App Version Info with Hidden Admin Trigger */}
        <div style={{ textAlign: 'center', padding: '30px 16px 24px', color: '#c8c8c8', fontSize: '12px' }}>
          <div
            onClick={handleVersionClick}
            style={{ cursor: 'pointer', display: 'inline-block', userSelect: 'none', padding: '4px 8px', fontSize: '14x' }}
            title="5회 탭 시 관리자 인증"
          >
            WalWal App v1.5.0 (Build 2026.10.09)
          </div>
          <div style={{ fontSize: '11px', marginTop: '4px', opacity: 0.7 }}>
            © WalWal Team. All rights reserved.
          </div>
        </div>

      </div>

      {/* Password Change Modal (Email Users) */}
      {showPasswordModal && (
        <div className="admin-modal-backdrop" style={{ zIndex: 100000 }}>
          <div className="admin-modal" style={{ maxWidth: '380px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'rgba(255, 158, 88, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF9E58' }}>
                  <Key size={20} />
                </div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>비밀번호 변경</h3>
              </div>
              <button
                type="button"
                onClick={() => { setShowPasswordModal(false); setPasswordStatusMsg(null); }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ margin: '0 0 16px 0', fontSize: '0.84rem', color: '#666', lineHeight: 1.5 }}>
              새로 사용할 비밀번호를 6자 이상 입력해주세요.
            </p>

            <form onSubmit={handleUpdatePassword}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#333' }}>
                  새 비밀번호
                </label>
                <input
                  type="password"
                  placeholder="새 비밀번호 (6자 이상)"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, marginBottom: '6px', color: '#333' }}>
                  새 비밀번호 확인
                </label>
                <input
                  type="password"
                  placeholder="새 비밀번호 다시 입력"
                  value={confirmNewPassword}
                  onChange={e => setConfirmNewPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid #E2E8F0',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              {passwordStatusMsg && (
                <div style={{
                  padding: '10px 12px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  fontSize: '0.82rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: passwordStatusMsg.type === 'success' ? '#F0FDF4' : '#FEF2F2',
                  color: passwordStatusMsg.type === 'success' ? '#16A34A' : '#DC2626',
                  border: `1px solid ${passwordStatusMsg.type === 'success' ? '#BBF7D0' : '#FECACA'}`
                }}>
                  {passwordStatusMsg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
                  <span>{passwordStatusMsg.text}</span>
                </div>
              )}

              <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                <button
                  type="button"
                  onClick={() => { setShowPasswordModal(false); setPasswordStatusMsg(null); }}
                  className="admin-btn-cancel"
                  style={{ flex: 1 }}
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="admin-btn-confirm"
                  style={{ flex: 1, background: '#FF9E58' }}
                >
                  {passwordLoading ? '변경 중...' : '비밀번호 변경'}
                </button>
              </div>

              <div style={{ textAlign: 'center', paddingTop: '8px', borderTop: '1px solid #f0f0f0' }}>
                <button
                  type="button"
                  onClick={handleSendResetEmail}
                  disabled={passwordLoading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#FF9E58',
                    fontSize: '0.8rem',
                    textDecoration: 'underline',
                    cursor: 'pointer'
                  }}
                >
                  이메일로 재설정 링크 받기
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin PIN Verification Modal */}
      {showAdminPinModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '12px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(255, 179, 32, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FF9E58' }}>
                <Shield size={26} />
              </div>
            </div>
            <h3 style={{ margin: '0 0 6px 0', fontSize: '18px', fontWeight: 800 }}>관리자 인증</h3>
            <p style={{ margin: '0 0 16px 0', fontSize: '13px', color: '#c8c8c8' }}>
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
