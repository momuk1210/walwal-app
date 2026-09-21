import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Apple, Globe } from 'lucide-react';

interface AuthViewProps {
  onLoginSuccess: () => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();

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
        <img 
          src="/src/assets/walwal.svg" 
          alt="WalWal" 
          style={{ width: '140px', marginBottom: '32px', filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.1))' }} 
        />
        
        <h1 style={{
          fontSize: '2rem',
          fontWeight: 900,
          color: '#FFFFFF',
          textAlign: 'center',
          lineHeight: 1.2,
          marginBottom: '12px',
          textShadow: '0 2px 10px rgba(0,0,0,0.1)'
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
            onClick={onLoginSuccess}
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
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Apple size={24} color="#161B22" />
            {t.auth.continueApple}
          </button>

          <button
            onClick={onLoginSuccess}
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
              cursor: 'pointer',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            <Globe size={22} color="#4285F4" />
            {t.auth.continueGoogle}
          </button>
        </div>
      </div>
    </div>
  );
};
