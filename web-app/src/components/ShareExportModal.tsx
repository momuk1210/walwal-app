import React, { useState } from 'react';
import { X, Download, Upload, Share2, Check, Copy, ExternalLink, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface ShareExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  dogName: string;
  breedKr: string;
  avatar: string;
  thought: string;
  templateType?: 'webtoon' | 'story' | 'neon';
  isProUser?: boolean;
}

import { useTranslation } from '../i18n/LanguageContext';

export const ShareExportModal: React.FC<ShareExportModalProps> = ({
  isOpen,
  onClose,
  dogName,
  breedKr,
  avatar,
  thought,
  templateType = 'webtoon',
  isProUser = false
}) => {
  const { t } = useTranslation();
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'tiktok' | 'youtube' | 'download' | 'more'>('instagram');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 1080x1350 / 9:16 Canvas Generator
  const generateCanvasImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      canvas.width = 1080;
      canvas.height = 1920; // 9:16 Full HD Vertical Shortform format

      // 1. Background
      const bgGradient = ctx.createLinearGradient(0, 0, 0, 1920);
      if (templateType === 'webtoon') {
        bgGradient.addColorStop(0, '#FFE8D6');
        bgGradient.addColorStop(1, '#FFF5ED');
      } else if (templateType === 'story') {
        bgGradient.addColorStop(0, '#FFF5ED');
        bgGradient.addColorStop(1, '#FFE8D6');
      } else {
        bgGradient.addColorStop(0, '#F5F3FF');
        bgGradient.addColorStop(1, '#EDE9FE');
      }
      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, 1080, 1920);

      // 2. Dog Image
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = avatar;
      img.onload = () => {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(80, 260, 920, 1050, 48);
        ctx.clip();
        ctx.drawImage(img, 80, 260, 920, 1050);
        ctx.restore();

        // Border around photo
        ctx.lineWidth = 12;
        ctx.strokeStyle = '#FF9E58';
        ctx.beginPath();
        ctx.roundRect(80, 260, 920, 1050, 48);
        ctx.stroke();

        // Top Header
        ctx.font = '900 52px sans-serif';
        ctx.fillStyle = templateType === 'webtoon' ? '#FF9E58' : '#38c5b7';
        ctx.fillText(`${t.share.watermarkTop} ${breedKr} ${t.share.watermarkTopSuffix}`, 90, 180);

        // 3. Speech Bubble
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.roundRect(80, 1370, 920, 360, 36);
        ctx.fill();
        ctx.lineWidth = 8;
        ctx.strokeStyle = '#FF9E58';
        ctx.stroke();

        ctx.font = 'bold 44px sans-serif';
        ctx.fillStyle = '#FF9E58';
        ctx.fillText(`${dogName} (${breedKr} ${t.share.speechTitleSuffix})`, 130, 1450);

        ctx.font = 'bold 50px sans-serif';
        ctx.fillStyle = '#333';

        const words = thought.split(' ');
        let line = '';
        let y = 1540;
        for (let n = 0; n < words.length; n++) {
          const testLine = line + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 800 && n > 0) {
            ctx.fillText(line, 130, y);
            line = words[n] + ' ';
            y += 65;
          } else {
            line = testLine;
          }
        }
        ctx.fillText(line, 130, y);

        // Watermark Footer
        ctx.font = '600 32px sans-serif';
        ctx.fillStyle = '#c8c8c8';
        ctx.textAlign = 'center';
        ctx.fillText(isProUser ? (t.snaps || t.studio).watermarkFree : t.share.watermarkFooter, 540, 1820);

        resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve('');
    });
  };

  const incrementStudioCount = () => {
    try {
      const saved = localStorage.getItem('WALWAL_STUDIO_COUNTS');
      const counts = saved ? JSON.parse(saved) : {};
      counts[dogName] = (counts[dogName] || 0) + 1;
      localStorage.setItem('WALWAL_STUDIO_COUNTS', JSON.stringify(counts));
      window.dispatchEvent(new Event('walwal_studio_updated'));
    } catch (e) { }
  };

  const handleDownloadOnly = async () => {
    setSelectedPlatform('download');
    showToast(t.share.rendering);
    const dataUrl = await generateCanvasImage();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `walwal_${breedKr}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();

      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
      showToast(t.share.downloadComplete);
      incrementStudioCount();
    }
  };

  const executeNativeShare = async (platform: string, caption: string, fallbackUrl: string, toastTarget: string) => {
    setSelectedPlatform(platform as any);
    showToast(`${toastTarget} ${t.share.redirecting}`);

    try {
      const dataUrl = await generateCanvasImage();
      if (!dataUrl) {
        showToast(t.share.errorGenerate);
        return;
      }

      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `walwal_${breedKr}_${platform}.png`, { type: 'image/png' });

      // 1. 네이티브 앱 공유 (모바일에서 해당 플랫폼 앱으로 다이렉트 전송)
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `[WalWal] ${dogName} ${t.share.caption1}`,
            text: caption
          });
          showToast(t.share.shareSuccess);
          incrementStudioCount();
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            showToast(t.share.shareCancel);
            return;
          }
        }
      }

      // 2. PC / 데스크톱 Fallback
      let copiedToClipboard = false;
      try {
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob })
          ]);
          await navigator.clipboard.writeText(caption);
          copiedToClipboard = true;
        }
      } catch (clipErr) { }

      incrementStudioCount();
      setTimeout(() => {
        if (fallbackUrl) {
          window.open(fallbackUrl, '_blank');
        }
        if (copiedToClipboard) {
          showToast(t.share.clipboardSuccess.replace('${toastTarget}', toastTarget));
        } else {
          showToast(t.share.manualAdd.replace('${toastTarget}', toastTarget));
        }
      }, 900);
    } catch (err) {
      showToast(t.share.errorShare);
    }
  };

  const handleShareInstagram = () => {
    const caption = `"${thought}"\n\n#WalWal #왈왈 #반려견통역 #${breedKr} #멍스타그램 #댕댕이`;
    executeNativeShare('instagram', caption, 'https://www.instagram.com/', 'Instagram');
  };

  const handleShareTikTok = () => {
    const caption = `"${thought}" #WalWal #반려견통역 #강아지속마음 #${breedKr} #댕댕이 #fyp`;
    executeNativeShare('tiktok', caption, 'https://www.tiktok.com/upload?lang=ko-KR', 'TikTok');
  };

  const handleShareYouTube = () => {
    const caption = `[WalWal AI] ${dogName} (${breedKr}) 속마음 통역 #Shorts\n\n"${thought}"\n\nWalWal AI 반려견 실시간 통역기\n#Shorts #WalWal #반려견통역 #${breedKr}`;
    executeNativeShare('youtube', caption, 'https://www.youtube.com/upload', 'YouTube Shorts');
  };

  const handleShareMore = () => {
    const caption = `"${thought}" - WalWal AI`;
    executeNativeShare('more', caption, '', 'Share');
  };

  const platformSubtitles: Record<string, string> = {
    instagram: t.share.subtitles.instagram,
    tiktok: t.share.subtitles.tiktok,
    youtube: t.share.subtitles.youtube,
    download: t.share.subtitles.download,
    more: t.share.subtitles.more
  };

  return (
    <div className="modal-overlay" style={{
      background: 'rgba(255, 255, 255, 0.85)',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '24px 16px 36px 16px',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Top Close Button & Header */}
      <div style={{ width: '100%', maxWidth: '420px', position: 'relative', textAlign: 'center', marginTop: '6px' }}>
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{
            position: 'absolute',
            left: '0',
            top: '0',
            background: 'rgba(0,0,0,0.05)',
            width: '36px',
            height: '36px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#333'
          }}
        >
          <X size={20} />
        </button>

        <h2 className="title-lg">
          {t.share.title}
        </h2>
        <p className="text-sub" >
          {platformSubtitles[selectedPlatform] || platformSubtitles.instagram}
        </p>
      </div>

      {/* Center 9:16 Shortform Preview Card */}
      <div style={{
        position: 'relative',
        width: '240px',
        height: '400px',
        borderRadius: '28px',
        overflow: 'hidden',
        background: '#FFFFFF',
        boxShadow: '0 20px 40px rgba(0,0,0,0.08), 0 0 20px rgba(255, 179, 32, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        margin: '16px 0'
      }}>
        <img
          src={avatar}
          alt={dogName}
          style={{ width: '100%', height: '62%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', top: '12px', left: '12px', background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(8px)', padding: '3px 8px', borderRadius: '10px', fontSize: '0.65rem', fontWeight: 800, color: '#FF9E58' }}>
          [WalWal] {breedKr}
        </div>

        {/* Speech Bubble inside card */}
        <div style={{
          flex: 1,
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#FFFFFF',
        }}>
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 600, color: '#FF9E58', marginBottom: '3px' }}>
              {dogName}
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#333', lineHeight: 1.35, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' }}>
              "{thought}"
            </div>
          </div>
          <div style={{ fontSize: '0.58rem', color: '#222', textAlign: 'center' }}>
            {t.share.watermarkFooter}
          </div>
        </div>
      </div>

      {/* Bottom Share Platforms Action Bar (Matching User Screenshot Layout) */}
      <div style={{
        width: '100%',
        maxWidth: '420px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 8px'
      }}>
        {/* 1. Instagram */}
        <button
          onClick={handleShareInstagram}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 10px 20px rgba(225, 48, 108, 0.25)',
            transform: selectedPlatform === 'instagram' ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.2s'
          }}>
            {/* Instagram Camera SVG */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
            </svg>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#333', fontWeight: 700 }}>Instagram</span>
        </button>

        {/* 2. TikTok */}
        <button
          onClick={handleShareTikTok}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            background: '#000000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.2)',
            transform: selectedPlatform === 'tiktok' ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.2s'
          }}>
            {/* TikTok Note SVG */}
            <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3.14 15.7a6.34 6.34 0 0 0 9.06 5.67V12.1a8.16 8.16 0 0 0 5.14 1.83v-3.47a4.85 4.85 0 0 1-2.25-.77 4.8 4.8 0 0 1-1.5-1.92z" />
            </svg>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#333', fontWeight: 700 }}>TikTok</span>
        </button>

        {/* 3. YouTube */}
        <button
          onClick={handleShareYouTube}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            background: '#FF0000',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 10px 20px rgba(255, 0, 0, 0.25)',
            transform: selectedPlatform === 'youtube' ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.2s'
          }}>
            {/* YouTube Play SVG */}
            <svg width="28" height="28" viewBox="0 0 24 24" fill="#fff">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </div>
          <span style={{ fontSize: '0.72rem', color: '#333', fontWeight: 700 }}>YouTube</span>
        </button>

        {/* 4. 다운로드 */}
        <button
          onClick={handleDownloadOnly}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            background: '#FFFFFF',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            transform: selectedPlatform === 'download' ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.2s'
          }}>
            <Download size={24} color="#333" />
          </div>
          <span style={{ fontSize: '0.72rem', color: '#333', fontWeight: 700 }}>{t.share.download}</span>
        </button>

        {/* 5. 더 보기 */}
        <button
          onClick={handleShareMore}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '8px',
            cursor: 'pointer',
            fontFamily: 'inherit'
          }}
        >
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '20px',
            background: '#EDF2F7',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: '#121212',
            boxShadow: '0 10px 20px rgba(0, 0, 0, 0.05)',
            transform: selectedPlatform === 'more' ? 'scale(1.08)' : 'scale(1)',
            transition: 'all 0.2s'
          }}>
            <Share2 size={24} />
          </div>
          <span style={{ fontSize: '0.72rem', color: '#333', fontWeight: 700 }}>{t.share.more}</span>
        </button>
      </div>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '120px',
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '24px',
          padding: '12px 24px',
          color: '#333',
          fontSize: '0.85rem',
          fontWeight: 800,
          boxShadow: '0 15px 35px rgba(0,0,0,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          animation: 'fadeInUp 0.3s ease',
          zIndex: 4000
        }}>
          <Sparkles size={18} color="#FF9E58" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
