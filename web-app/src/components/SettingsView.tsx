import React, { useState } from 'react';
import { useTranslation, Language } from '../i18n/LanguageContext';
import { auth } from '../firebase';
import { signOut, deleteUser } from 'firebase/auth';
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
  Sparkles
} from 'lucide-react';
import '../styles/SettingsView.css';

interface SettingsViewProps {
  onClose: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onClose }) => {
  const { t, language, setLanguage } = useTranslation();

  // Dummy toggle states
  const [radarAlert, setRadarAlert] = useState(true);
  const [meetupAlert, setMeetupAlert] = useState(true);
  const [feedAlert, setFeedAlert] = useState(false);
  const [cameraPerm, setCameraPerm] = useState(true);
  const [micPerm, setMicPerm] = useState(true);
  const [locationPerm, setLocationPerm] = useState(true);
  const [activeLegalView, setActiveLegalView] = useState<LegalViewType | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      // App.tsx onAuthStateChanged will handle redirection
    } catch (error) {
      console.error("Logout error", error);
      alert(t.settings?.logoutError || "로그아웃 중 오류가 발생했습니다.");
    }
  };

  const handleDeleteAccount = async () => {
    const confirmMsg = t.settings?.confirmDelete || "정말로 계정을 탈퇴하시겠습니까? 탈퇴 시 모든 데이터가 삭제되며 복구할 수 없습니다.";
    const confirmDelete = window.confirm(confirmMsg);
    if (confirmDelete && auth.currentUser) {
      try {
        await deleteUser(auth.currentUser);
        // App.tsx handles state on user deletion
      } catch (error: any) {
        if (error.code === 'auth/requires-recent-login') {
          alert("보안을 위해 다시 로그인한 후 탈퇴를 진행해주세요.");
        } else {
          console.error("Account deletion error", error);
          alert("회원 탈퇴 중 오류가 발생했습니다.");
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
              </select>
            }
          />
        </Section>

        {/* Permissions */}
        <Section title={t.settings?.permissions || "권한 관리"}>
          <ListItem
            icon={<Camera size={22} />}
            title={t.settings?.camera || "카메라"}
            rightElement={<Toggle active={cameraPerm} onChange={() => setCameraPerm(!cameraPerm)} />}
          />
          <ListItem
            icon={<Mic size={22} />}
            title={t.settings?.mic || "마이크"}
            rightElement={<Toggle active={micPerm} onChange={() => setMicPerm(!micPerm)} />}
          />
          <ListItem
            icon={<MapPin size={22} />}
            title={t.settings?.location || "위치"}
            rightElement={<Toggle active={locationPerm} onChange={() => setLocationPerm(!locationPerm)} />}
          />
        </Section>

        {/* Notifications */}
        <Section title={t.settings?.notifications || "알림 설정"}>
          <ListItem
            icon={<Bell size={22} />}
            title={t.settings?.radarAlert || "근처 반려견 등장 (레이더)"}
            rightElement={<Toggle active={radarAlert} onChange={() => setRadarAlert(!radarAlert)} />}
          />
          <ListItem
            icon={<Bell size={22} />}
            title={t.settings?.meetupAlert || "번개 모임"}
            rightElement={<Toggle active={meetupAlert} onChange={() => setMeetupAlert(!meetupAlert)} />}
          />
          <ListItem
            icon={<Bell size={22} />}
            title={t.settings?.feedAlert || "피드 소식"}
            rightElement={<Toggle active={feedAlert} onChange={() => setFeedAlert(!feedAlert)} />}
          />
        </Section>

        {/* Support & Legal */}
        <Section title={t.settings?.support || "고객 지원 및 약관"}>
          <ListItem icon={<HelpCircle size={22} />} title={t.settings?.faq || "자주 묻는 질문"} onClick={() => setActiveLegalView('faq')} />
          <ListItem icon={<FileText size={22} />} title={t.settings?.terms || "이용약관"} onClick={() => setActiveLegalView('terms')} />
          <ListItem icon={<Shield size={22} />} title={t.settings?.privacy || "개인정보 처리방침"} onClick={() => setActiveLegalView('privacy')} />
        </Section>

        {/* Account Management */}
        <Section title={t.settings?.account || "계정 관리"}>
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

      </div>
    </div>
  );
};
