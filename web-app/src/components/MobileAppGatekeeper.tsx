import React, { useState } from 'react';
import { useTranslation, Language } from '../i18n/LanguageContext';
import '../styles/MobileAppGatekeeper.css';

interface MobileAppGatekeeperProps {
  onBypass: () => void;
}

const GATEKEEPER_I18N: Record<Language, {
  titlePre: string;
  titleHighlight: string;
  titlePost: string;
  featAI: string;
  featNearby: string;
  featWalk: string;
  featPet: string;
  playStore: string;
  adminLink: string;
  adminPlaceholder: string;
  adminSubmit: string;
  adminCancel: string;
  adminError: string;
}> = {
  ko: {
    titlePre: 'WalWal은 ',
    titleHighlight: '모바일 앱',
    titlePost: ' 전용\n서비스입니다',
    featAI: '반려견 실시간 AI 속마음 번역',
    featNearby: '동네친구 찾기',
    featWalk: '산책 기록 & 커뮤니티',
    featPet: '마이펫 관리',
    playStore: 'Google Play 스토어',
    adminLink: '관리자 / 테스터 접속',
    adminPlaceholder: '관리자 인증 코드 입력',
    adminSubmit: '인증',
    adminCancel: '취소',
    adminError: '인증 코드가 일치하지 않습니다.'
  },
  en: {
    titlePre: 'WalWal is a ',
    titleHighlight: 'Mobile App',
    titlePost: ' Only\nService',
    featAI: 'Real-time AI Dog Translator',
    featNearby: 'Find Nearby Friends',
    featWalk: 'Walk Logs & Community',
    featPet: 'My Pet Management',
    playStore: 'Google Play Store',
    adminLink: 'Admin / Tester Access',
    adminPlaceholder: 'Enter admin passcode',
    adminSubmit: 'Verify',
    adminCancel: 'Cancel',
    adminError: 'Invalid authentication code.'
  },
  ja: {
    titlePre: 'WalWalは',
    titleHighlight: 'モバイルアプリ',
    titlePost: '専用\nサービスです',
    featAI: '愛犬リアルタイムAI本音翻訳',
    featNearby: '近所の友達探し',
    featWalk: '散歩記録＆コミュニティ',
    featPet: 'マイペット管理',
    playStore: 'Google Play ストア',
    adminLink: '管理者 / テスター接続',
    adminPlaceholder: '管理者コードを入力',
    adminSubmit: '認証',
    adminCancel: 'キャンセル',
    adminError: '認証コードが一致しません。'
  },
  es: {
    titlePre: 'WalWal es un servicio ',
    titleHighlight: 'solo para App Móvil',
    titlePost: '',
    featAI: 'Traductor IA canino en vivo',
    featNearby: 'Buscar amigos del barrio',
    featWalk: 'Registro de paseos y comunidad',
    featPet: 'Gestión de Mi Mascota',
    playStore: 'Google Play Store',
    adminLink: 'Acceso Admin / Tester',
    adminPlaceholder: 'Código de acceso admin',
    adminSubmit: 'Verificar',
    adminCancel: 'Cancelar',
    adminError: 'Código de autenticación incorrecto.'
  },
  zh: {
    titlePre: 'WalWal 是',
    titleHighlight: '手机移动端',
    titlePost: '专属服务',
    featAI: '爱犬实时AI心声翻译',
    featNearby: '寻找同城狗友',
    featWalk: '散步记录与社区',
    featPet: '我的爱宠管理',
    playStore: 'Google Play 商店',
    adminLink: '管理员 / 测试员入口',
    adminPlaceholder: '输入管理员验证码',
    adminSubmit: '验证',
    adminCancel: '取消',
    adminError: '验证码不正确。'
  },
  fr: {
    titlePre: 'WalWal est un service ',
    titleHighlight: "réservé à l'App Mobile",
    titlePost: '',
    featAI: 'Traducteur IA canin en direct',
    featNearby: 'Trouver des amis voisins',
    featWalk: 'Journal de balade & communauté',
    featPet: 'Gestion de mon animal',
    playStore: 'Google Play Store',
    adminLink: 'Accès Admin / Testeur',
    adminPlaceholder: "Code d'accès admin",
    adminSubmit: 'Vérifier',
    adminCancel: 'Annuler',
    adminError: 'Code d’authentification invalide.'
  }
};

export const MobileAppGatekeeper: React.FC<MobileAppGatekeeperProps> = ({ onBypass }) => {
  const { language } = useTranslation();
  const [showAdminPrompt, setShowAdminPrompt] = useState(false);
  const [passcode, setPasscode] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const t = GATEKEEPER_I18N[language] || GATEKEEPER_I18N.en;

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim() === 'walwal2026' || passcode.trim() === 'daisynara' || passcode.trim() === 'admin1234') {
      localStorage.setItem('WALWAL_DEV_BYPASS', 'true');
      onBypass();
    } else {
      setErrorMsg(t.adminError);
    }
  };

  const handlePlayStoreClick = () => {
    const playStoreUrl = 'https://play.google.com/store/apps/details?id=com.walwal.app';
    window.open(playStoreUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="gatekeeper-root">
      <div className="gatekeeper-card">
        {/* 앱 로고 */}
        <div className="gatekeeper-header">
          <div className="gatekeeper-logo-wrapper">
            <img src="/android-chrome-192x192.png" alt="WalWal Logo" className="gatekeeper-app-logo" />
          </div>
        </div>

        {/* 메인 타이틀 */}
        <div className="gatekeeper-body">
          <h1 className="gatekeeper-title">
            {t.titlePre}
            <span className="highlight">{t.titleHighlight}</span>
            {t.titlePost}
          </h1>
        </div>

        {/* 주요 핵심 기능 요약 */}
        <div className="gatekeeper-features">
          <div className="feature-pill">
            <span>{t.featAI}</span>
          </div>
          <div className="feature-pill">
            <span>{t.featNearby}</span>
          </div>
          <div className="feature-pill">
            <span>{t.featWalk}</span>
          </div>
          <div className="feature-pill">
            <span>{t.featPet}</span>
          </div>
        </div>

        {/* 플레이스토어 바로가기 버튼 */}
        <div className="gatekeeper-actions">
          <button
            type="button"
            className="btn-playstore"
            onClick={handlePlayStoreClick}
          >
            <div className="playstore-icon-wrap">
              <svg viewBox="0 0 512 512" width="22" height="22">
                <path fill="#4285F4" d="M32.53 19.37L282.8 269.64 32.53 519.91c-7.39-4.2-12.53-12.28-12.53-21.91V41.28c0-9.63 5.14-17.71 12.53-21.91z" />
                <path fill="#FBBC04" d="M374.9 177.54L282.8 269.64l92.1 92.1 96.55-55.74c10.45-6.03 16.55-17.15 16.55-29.2 0-12.05-6.1-23.17-16.55-29.2l-96.55-10.06z" />
                <path fill="#EA4335" d="M282.8 269.64L32.53 19.37l342.37 158.17 96.55 10.06z" />
                <path fill="#34A853" d="M282.8 269.64L374.9 361.74l-342.37 158.17L282.8 269.64z" />
              </svg>
            </div>
            <div className="playstore-btn-text">
              <span className="small-label">GET IT ON</span>
              <span className="bold-label">{t.playStore}</span>
            </div>
          </button>
        </div>

        {/* 개발자 및 관리자 인증 바이패스 */}
        <div className="gatekeeper-footer">
          {!showAdminPrompt ? (
            <button
              type="button"
              className="btn-admin-link"
              onClick={() => setShowAdminPrompt(true)}
            >
              <span>{t.adminLink}</span>
            </button>
          ) : (
            <form onSubmit={handleAdminLogin} className="admin-login-form">
              <input
                type="password"
                placeholder={t.adminPlaceholder}
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  setErrorMsg('');
                }}
                className="admin-input"
                autoFocus
              />
              <button type="submit" className="btn-admin-submit">
                {t.adminSubmit}
              </button>
              <button
                type="button"
                className="btn-admin-cancel"
                onClick={() => {
                  setShowAdminPrompt(false);
                  setErrorMsg('');
                }}
              >
                {t.adminCancel}
              </button>
            </form>
          )}
          {errorMsg && <p className="admin-error">{errorMsg}</p>}
        </div>
      </div>
    </div>
  );
};
