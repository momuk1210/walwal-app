const fs = require('fs');
const path = 'e:/workspace/walwal-app/web-app/src/components/ARCameraView.tsx';

let code = `import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Volume2, Share2, ShieldCheck, Zap, Info } from 'lucide-react';
import { BREED_DEFINITIONS, BreedDefinition } from '../data/breedProfiles';
import { useTranslation } from '../i18n/LanguageContext';
import { TRANSLATIONS } from '../i18n/translations';
import confetti from 'canvas-confetti';

interface ARCameraViewProps {
  onCaptureToStory: (dog: any, thought: string) => void;
  onOpenPro: () => void;
}

export const ARCameraView: React.FC<ARCameraViewProps> = ({ onCaptureToStory, onOpenPro }) => {
  const { language, t } = useTranslation();
  const [selectedBreed, setSelectedBreed] = useState<BreedDefinition>(BREED_DEFINITIONS[0]);
  const [currentThought, setCurrentThought] = useState<string>('');
  const [isCameraLive, setIsCameraLive] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(45);
  const [dogPose, setDogPose] = useState<{ x: number; y: number }>({ x: 50, y: 48 });
  const [speechBubbleVisible, setSpeechBubbleVisible] = useState<boolean>(true);
  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [showEthologyInfo, setShowEthologyInfo] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  // �� ������ ����Ǹ� �ش� ��� ���� ��� �ڵ� ����/����
  useEffect(() => {
    const breedDict = TRANSLATIONS[language]?.breedQuips?.[selectedBreed.id] || TRANSLATIONS.en.breedQuips[selectedBreed.id] || [];
    const quipList = breedDict[language] || breedDict['en'] || selectedBreed.quipsByEmotion.excited;
    if (quipList && quipList.length > 0) {
      setCurrentThought(quipList[0]);
    }
  }, [language, selectedBreed]);

  useEffect(() => {
    const interval = setInterval(() => {
      setAudioLevel(Math.floor(20 + Math.random() * 65));
      setDogPose(prev => ({
        x: Math.max(42, Math.min(58, prev.x + (Math.random() - 0.5) * 2)),
        y: Math.max(44, Math.min(52, prev.y + (Math.random() - 0.5) * 1.5))
      }));
    }, 1200);

    return () => clearInterval(interval);
  }, []);

  const handleSelectBreed = (breed: BreedDefinition) => {
    setSelectedBreed(breed);
    setAiAnalyzing(true);
    setSpeechBubbleVisible(false);

    setTimeout(() => {
      const breedDict = TRANSLATIONS[language]?.breedQuips?.[breed.id] || TRANSLATIONS.en.breedQuips[breed.id] || [];
      const quipList = breedDict[language] || breedDict['en'] || breed.quipsByEmotion.excited;
      const newQuip = quipList[Math.floor(Math.random() * quipList.length)];
      setCurrentThought(newQuip);
      setSpeechBubbleVisible(true);
      setAiAnalyzing(false);

      confetti({
        particleCount: 30,
        spread: 50,
        origin: { y: 0.4 },
        colors: breed.id === 'shiba' ? ['#FF7E36', '#334155'] : ['#FF7E36', '#FFBF00', '#2EC4B6']
      });
    }, 350);
  };

  const handleRethink = () => {
    setAiAnalyzing(true);
    setSpeechBubbleVisible(false);

    setTimeout(() => {
      const breedDict = TRANSLATIONS[language]?.breedQuips?.[selectedBreed.id] || TRANSLATIONS.en.breedQuips[selectedBreed.id] || [];
      const quipList = breedDict[language] || breedDict['en'] || selectedBreed.quipsByEmotion.excited;
      const filtered = quipList.filter((q: string) => q !== currentThought);
      const chosen = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : quipList[0];
      setCurrentThought(chosen);
      setSpeechBubbleVisible(true);
      setAiAnalyzing(false);
    }, 400);
  };

  const toggleRealCamera = async () => {
    if (isCameraLive) {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setIsCameraLive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
        setIsCameraLive(true);
      } catch (err) {
        alert('Simulator Mode active');
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Top Header */}
      <div style={{ position: 'absolute', top: '14px', left: '14px', right: '110px', zIndex: 30, display: 'flex', alignItems: 'center' }}>
        <div className="glass-panel" style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem' }}>??</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.85rem', background: 'linear-gradient(90deg, #FF7E36, #FFBF00)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t.appTitle}
            </div>
            <div style={{ fontSize: '0.62rem', color: '#94A3B8' }}>{selectedBreed.breedKr} �� AI Active</div>
          </div>
        </div>
      </div>

      {/* Main Viewport */}
      <div style={{ position: 'relative', flex: 1, width: '100%', background: '#000', overflow: 'hidden' }}>
        <video
          ref={videoRef}
          playsInline
          muted
          style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', display: isCameraLive ? 'block' : 'none' }}
        />

        {!isCameraLive && (
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <img
              src={selectedBreed.avatar}
              alt={selectedBreed.name}
              style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.92) contrast(1.05)' }}
            />
            <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 40%, rgba(255,126,54,0.12) 0%, rgba(15,18,22,0.85) 90%)' }} />
          </div>
        )}

        {/* AI Tracking Box */}
        <div style={{
          position: 'absolute',
          top: (dogPose.y - 25) + '%',
          left: (dogPose.x - 30) + '%',
          width: '60%',
          height: '52%',
          border: '2px dashed rgba(255, 126, 54, 0.75)',
          borderRadius: '24px',
          pointerEvents: 'none',
          boxShadow: '0 0 20px rgba(255, 126, 54, 0.25)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-28px',
            left: '0px',
            background: 'rgba(255, 126, 54, 0.92)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            fontSize: '0.65rem',
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <ShieldCheck size={12} />
            <span>[AI Ethology] {selectedBreed.breedKr}</span>
          </div>

          <div style={{ position: 'absolute', top: '25%', left: '35%', width: '8px', height: '8px', background: '#2EC4B6', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '25%', right: '35%', width: '8px', height: '8px', background: '#2EC4B6', borderRadius: '50%' }} />
          <div style={{ position: 'absolute', top: '48%', left: '48%', width: '10px', height: '10px', background: '#FFBF00', borderRadius: '50%' }} />
        </div>

        {/* Action Pills Row */}
        <div style={{ position: 'absolute', top: '56px', left: '14px', right: '14px', zIndex: 32, display: 'flex', gap: '6px' }}>
          <button
            onClick={() => setShowEthologyInfo(!showEthologyInfo)}
            className="glass-pill"
            style={{ padding: '5px 10px', color: '#2EC4B6', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 700 }}
          >
            <Info size={13} /> {t.ar.ethologyBtn}
          </button>
          <button
            onClick={toggleRealCamera}
            className="glass-pill"
            style={{ padding: '5px 10px', color: isCameraLive ? '#2EC4B6' : '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem', fontWeight: 600 }}
          >
            <Camera size={13} /> {isCameraLive ? t.ar.liveWebcam : t.ar.simulator}
          </button>
          <button
            onClick={onOpenPro}
            className="glow-btn"
            style={{ background: 'linear-gradient(135deg, #FF7E36, #8338EC)', border: 'none', borderRadius: '9999px', padding: '5px 12px', color: '#fff', fontSize: '0.7rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          >
            <Zap size={13} /> WalWal Pro
          </button>
        </div>

        {/* Ethology Card */}
        {showEthologyInfo && (
          <div style={{
            position: 'absolute',
            top: '95px',
            left: '16px',
            right: '16px',
            zIndex: 35,
            background: 'rgba(15, 18, 22, 0.95)',
            border: '1px solid #2EC4B6',
            borderRadius: '20px',
            padding: '16px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.8)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2EC4B6' }}>
                ?? {selectedBreed.breedKr} {t.ar.ethologyModalTitle}
              </span>
              <button onClick={() => setShowEthologyInfo(false)} style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer' }}>?</button>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#E2E8F0', lineHeight: 1.4, display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>?? {t.ar.tailInterpretation}:</strong> {selectedBreed.tailWaggingInterpretation}</div>
              <div><strong>??? {t.ar.barkInterpretation}:</strong> {selectedBreed.audioBarkInterpretation}</div>
              <div><strong>?? {t.ar.personaTitle}:</strong> {selectedBreed.tagline}</div>
            </div>
          </div>
        )}

        {/* SPEECH BUBBLE */}
        {speechBubbleVisible && (
          <div
            className="bubble-anim"
            style={{
              position: 'absolute',
              top: Math.max(16, dogPose.y - 32) + '%',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 25,
              width: '88%',
              maxWidth: '380px',
              cursor: 'pointer'
            }}
            onClick={handleRethink}
          >
            <div style={{
              background: 'linear-gradient(135deg, rgba(26, 31, 41, 0.95), rgba(40, 48, 64, 0.92))',
              backdropFilter: 'blur(20px)',
              border: selectedBreed.id === 'shiba' ? '2px solid #94A3B8' : selectedBreed.id === 'maltese' ? '2px solid #F43F5E' : '2px solid #FF7E36',
              borderRadius: '24px',
              padding: '16px 20px',
              boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7), 0 0 25px rgba(255, 126, 54, 0.35)',
              position: 'relative'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '1rem' }}>??</span>
                  <span style={{ fontWeight: 800, fontSize: '0.85rem', color: '#FF7E36' }}>{selectedBreed.name}{t.ar.speechSuffix}</span>
                  <span style={{ fontSize: '0.68rem', color: '#CBD5E1', background: 'rgba(255,255,255,0.1)', padding: '1px 6px', borderRadius: '6px' }}>
                    {selectedBreed.breedKr}
                  </span>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); handleRethink(); }}
                  style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.7rem' }}
                >
                  <RefreshCw size={12} className={aiAnalyzing ? 'spin' : ''} />
                  {t.ar.retranslate}
                </button>
              </div>

              <div style={{ fontSize: '1.02rem', fontWeight: 700, lineHeight: 1.45, color: '#FFFFFF' }}>
                "{currentThought}"
              </div>

              <div style={{
                position: 'absolute',
                bottom: '-12px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '12px solid rgba(255, 126, 54, 0.9)'
              }} />
            </div>
          </div>
        )}

        {/* Audio Frequency Monitor */}
        <div style={{
          position: 'absolute',
          left: '16px',
          bottom: '160px',
          zIndex: 22,
          background: 'rgba(15, 18, 22, 0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '16px',
          padding: '8px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          width: '140px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.62rem', color: '#94A3B8', fontWeight: 600 }}>{t.ar.audioFreq}</span>
            <Volume2 size={12} color="#FF7E36" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '3px', height: '18px' }}>
            {[40, 75, 25, 90, 50, 80, audioLevel].map((val, idx) => (
              <div key={idx} style={{ flex: 1, background: val > 65 ? '#FF7E36' : '#2EC4B6', height: Math.min(100, Math.max(15, val)) + '%', borderRadius: '2px', transition: 'height 0.3s ease' }} />
            ))}
          </div>
          <div style={{ fontSize: '0.62rem', color: '#FFBF00', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedBreed.breedKr} AI Filter
          </div>
        </div>

        {/* Breed Selector */}
        <div style={{
          position: 'absolute',
          bottom: '80px',
          left: '0',
          right: '0',
          padding: '0 14px',
          zIndex: 25,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto'
        }}>
          {BREED_DEFINITIONS.map(breed => {
            const isSelected = breed.id === selectedBreed.id;
            return (
              <button
                key={breed.id}
                onClick={() => handleSelectBreed(breed)}
                style={{
                  background: isSelected ? 'rgba(255, 126, 54, 0.95)' : 'rgba(26, 31, 41, 0.75)',
                  border: isSelected ? '2px solid #FFF' : '1px solid rgba(255, 255, 255, 0.15)',
                  backdropFilter: 'blur(10px)',
                  borderRadius: '16px',
                  padding: '6px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.2s ease'
                }}
              >
                <img
                  src={breed.avatar}
                  alt={breed.name}
                  style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #fff' }}
                />
                <div style={{ textAlign: 'left' }}>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: '0.7rem' }}>{breed.name}</div>
                  <div style={{ color: isSelected ? '#FFE8D6' : '#94A3B8', fontSize: '0.65rem' }}>{breed.breedKr}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Bottom Shutter */}
        <div style={{
          position: 'absolute',
          bottom: '12px',
          left: '16px',
          right: '16px',
          zIndex: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', maxWidth: '160px' }}>
            {selectedBreed.personalityTags.map((tag, i) => (
              <span key={i} style={{ fontSize: '0.65rem', background: 'rgba(255,255,255,0.12)', padding: '2px 6px', borderRadius: '8px', color: '#CBD5E1' }}>
                {tag}
              </span>
            ))}
          </div>

          <button
            onClick={() => onCaptureToStory({ ...selectedBreed, breed: selectedBreed.breedKr }, currentThought)}
            className="glow-btn"
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #FF7E36, #FFBF00)',
              border: '3px solid #FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              cursor: 'pointer',
              boxShadow: '0 8px 25px rgba(255, 126, 54, 0.6)'
            }}
          >
            <Share2 size={22} color="#FFFFFF" />
            <span style={{ fontSize: '0.52rem', color: '#fff', fontWeight: 800, marginTop: '2px' }}>{t.ar.captureShorts}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
`;

fs.writeFileSync(path, code, 'utf8');
console.log('ARCameraView updated with i18n successfully');
