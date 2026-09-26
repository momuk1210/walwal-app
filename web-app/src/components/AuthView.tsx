import React, { useState } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Apple, Globe, LogIn } from 'lucide-react';
import { auth } from '../firebase';
import { signInWithPopup, GoogleAuthProvider, signInAnonymously } from 'firebase/auth';
import walwalWalking from '../assets/walwal-walking.gif';

interface AuthViewProps {
  onLoginSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      if (!import.meta.env.VITE_FIREBASE_API_KEY) {
        console.warn("Firebase config is missing, simulating login...");
        setTimeout(() => onLoginSuccess(), 500);
        return;
      }
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      onLoginSuccess();
    } catch (error) {
      console.error("Google login failed", error);
      alert("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestLogin = async () => {
    try {
      setLoading(true);
      if (!import.meta.env.VITE_FIREBASE_API_KEY) {
        console.warn("Firebase config is missing, simulating guest login...");
        setTimeout(() => onLoginSuccess(), 500);
        return;
      }
      await signInAnonymously(auth);
      onLoginSuccess();
    } catch (error) {
      console.error("Guest login failed", error);
      alert("게스트 로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: 'linear-gradient(135deg, #FFB320 0%, #FFBF00 100%)',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Graphic Elements */}
      <div style={{
        position: 'absolute',
        top: '-10%',
        right: '-10%',
        width: '300px',
        height: '300px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '50%',
        filter: 'blur(40px)'
      }} />
      <div style={{
        position: 'absolute',
        bottom: '10%',
        left: '-10%',
        width: '250px',
        height: '250px',
        background: 'rgba(131,56,236,0.15)',
        borderRadius: '50%',
        filter: 'blur(50px)'
      }} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '0 32px' }}>
        <style>
          {`
            @keyframes walkAcross {
              0% { transform: translateX(-60vw); }
              100% { transform: translateX(60vw); }
            }
          `}
        </style>
        <img
          src={walwalWalking}
          alt="WalWal Walking"
          style={{
            width: '260px',
            marginBottom: '42px',
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))',
            animation: 'walkAcross 8s linear infinite'
          }}
        />

        <h1 style={{
          display: 'block',
          width: 'auto',
          fontSize: '1.8rem',
          fontWeight: 900,
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.2,
          marginBottom: '12px',
          textShadow: '0 2px 10px rgba(0,0,0,0.1)',
          wordBreak: 'keep-all'
        }}>
          {t.auth.welcomeTitle}
        </h1>

        <p style={{
          fontSize: '1.05rem',
          color: 'rgba(255, 255, 255, 0.9)',
          textAlign: 'center',
          fontWeight: 600,
          marginBottom: '64px'
        }}>
          {t.auth.welcomeSub}
        </p>

        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '28px',
              border: 'none',
              background: '#FFFFFF',
              color: '#161B22',
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            {t.auth.continueGoogle || '구글로 계속하기'}
          </button>

          {/* <button
            onClick={handleGuestLogin}
            disabled={loading}
            style={{
              width: '100%',
              height: '56px',
              borderRadius: '28px',
              border: 'none',
              background: '#F8FAFC',
              color: '#2D3748',
              fontSize: '1.1rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'transform 0.2s ease',
              opacity: loading ? 0.7 : 1
            }}
            onMouseOver={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1.02)' }}
            onMouseOut={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
          >
            <LogIn size={24} color="#2D3748" />
            {t.auth.continueGuest || '게스트로 시작하기'}
          </button> */}
        </div>
      </div>
    </div>
  );
};
