import React from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { Sparkles, Camera, Globe, Check, X } from 'lucide-react';

interface PaywallViewProps {
  onSubscribeSuccess: () => void;
}

export const PaywallView: React.FC<PaywallViewProps> = ({ onSubscribeSuccess }) => {
  const { t } = useTranslation();

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      background: '#0D1117',
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background Graphic Elements */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        right: '-20%',
        width: '400px',
        height: '400px',
        background: 'radial-gradient(circle, rgba(131,56,236,0.4) 0%, rgba(13,17,23,0) 70%)',
        borderRadius: '50%',
      }} />
      <div style={{
        position: 'absolute',
        bottom: '-10%',
        left: '-10%',
        width: '300px',
        height: '300px',
        background: 'radial-gradient(circle, rgba(255,179,32,0.3) 0%, rgba(13,17,23,0) 70%)',
        borderRadius: '50%',
      }} />

      {/* Content Container */}
      <div style={{ 
        flex: 1, 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'space-between', 
        padding: '64px 32px 48px',
        zIndex: 1
      }}>
        
        {/* Header */}
        <div style={{ textAlign: 'center', marginTop: '20px' }}>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: 'linear-gradient(90deg, rgba(255,179,32,0.1), rgba(131,56,236,0.1))',
            padding: '6px 16px',
            borderRadius: '20px',
            marginBottom: '24px',
            border: '1px solid rgba(255,179,32,0.3)'
          }}>
            <Sparkles size={16} color="#FFB320" />
            <span style={{ color: '#FFB320', fontWeight: 800, fontSize: '0.85rem' }}>PRO</span>
          </div>

          <h1 style={{
            fontSize: '2.4rem',
            fontWeight: 900,
            color: '#FFFFFF',
            lineHeight: 1.1,
            marginBottom: '16px'
          }}>
            {t.paywall.title}
          </h1>
          <p style={{
            fontSize: '1.1rem',
            color: '#A0AEC0',
            fontWeight: 500,
          }}>
            {t.paywall.subtitle}
          </p>
        </div>

        {/* Feature List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', margin: '40px 0' }}>
          {[
            { icon: <Sparkles size={24} color="#FFB320" />, text: t.paywall.feature1 },
            { icon: <Camera size={24} color="#FFB320" />, text: t.paywall.feature2 },
            { icon: <Globe size={24} color="#FFB320" />, text: t.paywall.feature3 },
          ].map((feature, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ 
                width: '48px', 
                height: '48px', 
                borderRadius: '16px', 
                background: 'rgba(255,179,32,0.1)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                boxShadow: 'inset 0 2px 4px rgba(255,255,255,0.05)'
              }}>
                {feature.icon}
              </div>
              <span style={{ color: '#FFFFFF', fontSize: '1.1rem', fontWeight: 600 }}>
                {feature.text}
              </span>
            </div>
          ))}
        </div>

        {/* Footer / CTA */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFFFFF' }}>{t.paywall.price}</div>
            <div style={{ fontSize: '0.85rem', color: '#A0AEC0', marginTop: '4px' }}>{t.paywall.trial}</div>
          </div>

          <button
            onClick={onSubscribeSuccess}
            style={{
              width: '100%',
              height: '60px',
              borderRadius: '30px',
              border: 'none',
              background: 'linear-gradient(90deg, #FFB320 0%, #FFBF00 100%)',
              color: '#161B22',
              fontSize: '1.2rem',
              fontWeight: 800,
              boxShadow: '0 8px 24px rgba(255,179,32,0.3)',
              cursor: 'pointer',
              marginTop: '8px',
              transition: 'transform 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.02)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            {t.paywall.subscribeBtn}
          </button>
          
          <div style={{ fontSize: '0.75rem', color: '#718096', textAlign: 'center' }}>
            {t.paywall.terms}
          </div>
        </div>

      </div>
    </div>
  );
};
