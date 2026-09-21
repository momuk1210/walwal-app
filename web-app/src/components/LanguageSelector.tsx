import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Language } from '../i18n/translations';
import { Globe } from 'lucide-react';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const options: { code: Language; label: string }[] = [
    { code: 'ko', label: 'KO' },
    { code: 'en', label: 'EN' },
    { code: 'ja', label: 'JA' },
    { code: 'es', label: 'ES' }
  ];

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      background: 'rgba(255, 255, 255, 0.12)',
      backdropFilter: 'blur(10px)',
      borderRadius: '9999px',
      padding: '2px 4px',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    }}>
      <Globe size={13} color="#2EC4B6" style={{ marginLeft: '4px', marginRight: '2px' }} />
      {options.map(opt => (
        <button
          key={opt.code}
          onClick={() => setLanguage(opt.code)}
          style={{
            background: language === opt.code ? '#FF7E36' : 'transparent',
            border: 'none',
            color: language === opt.code ? '#fff' : '#CBD5E1',
            borderRadius: '9999px',
            padding: '2px 6px',
            fontSize: '0.65rem',
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
