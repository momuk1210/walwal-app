import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { DogProfile, getDefaultDogAvatar, getMockDogs, normalizeDogProfile } from '../data/mockDogs';
import confetti from 'canvas-confetti';
import { useTranslation } from '../i18n/LanguageContext';
import { formatChatTime } from '../utils/timeUtils';
import '../styles/OwnerNoteModal.css';

interface OwnerNoteModalProps {
  isOpen: boolean;
  targetDog: DogProfile | null;
  onClose: () => void;
  onStartVirtualChat?: (dog: DogProfile) => void;
}

export const OwnerNoteModal: React.FC<OwnerNoteModalProps> = ({
  isOpen,
  targetDog,
  onClose,
  onStartVirtualChat
}) => {
  const { t, language } = useTranslation();

  const QUICK_TEMPLATES = [
    t.profile?.noteTemplate1 || '안녕하세요! 산책 코스가 어떻게 되시나요?',
    t.profile?.noteTemplate2 || '강아지가 너무 예뻐요! 저희 애랑 인사해도 될까요?',
    t.profile?.noteTemplate3 || '지금 어느 쪽으로 산책 중이신가요?',
    t.profile?.noteTemplate4 || '간식 하나 줘도 될까요? 알러지 있나요?'
  ];

  const [messageText, setMessageText] = useState<string>('');
  const [, setTimeTick] = useState<number>(0);
  const [messages, setMessages] = useState<Array<{ sender: 'me' | 'target'; text: string; time?: string; timestamp?: number }>>([]);

  // Live timer to update relative time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // 모달 열릴 때 초기 메세지 세팅 + body 스크롤 잠금
  useEffect(() => {
    if (isOpen && targetDog) {
      let myDog: any = null;
      try {
        const saved = localStorage.getItem('WALWAL_PETS');
        if (saved) {
          const pets = JSON.parse(saved);
          if (pets.length > 0) myDog = normalizeDogProfile(pets[0], language);
        }
      } catch (e) { }
      if (!myDog) {
        myDog = getMockDogs(language)[0];
      }

      const defaultIntro = '안녕하세요! 저는 {ownerName} 보호자(엄마/아빠)예요. 저희 {dogName}이는 {breed}랍니다. 친하게 지내요!';
      const introText = (t.profile?.noteIntro || defaultIntro)
        .replace('{ownerName}', myDog.ownerName || myDog.name + ' 엄마')
        .replace('{dogName}', myDog.name || '')
        .replace('{breed}', myDog.breed || '');
      const now = Date.now();
      setMessages([{ sender: 'me', text: introText, timestamp: now, time: formatChatTime(now, language) }]);
      setMessageText('');
      // body 스크롤 잠금 → 뒷 화면 레이아웃 틀어짐 방지
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, targetDog, language]);

  if (!isOpen || !targetDog) return null;

  // avatar 유효성 검사
  const safeAvatar = (url?: string) => {
    if (!url || url.length < 10 || (!url.startsWith('http') && !url.startsWith('blob') && !url.startsWith('data'))) {
      return getDefaultDogAvatar(targetDog.name + ' ' + targetDog.breed);
    }
    return url;
  };
  const displayAvatar = safeAvatar(targetDog.avatar);

  const handleSend = () => {
    if (!messageText.trim()) return;
    const now = Date.now();
    setMessages(prev => [...prev, { sender: 'me', text: messageText.trim(), timestamp: now, time: formatChatTime(now, language) }]);
    setMessageText('');
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });
  };

  return (
    <div className="own-message-modal-overlay">
      <div className="own-message-modal-container">
        {/* Header */}
        <div className="own-message-modal-header row-between">
          <div className="row gap-10">
            <div className="own-message-modal-avatar-container">
              <img
                src={displayAvatar}
                alt={targetDog.name}
                className="own-message-modal-avatar"
              />
              <div className="own-message-modal-status-dot" />
            </div>
            <div>
              <div className="row gap-6">
                <span className="own-message-modal-owner-name">{targetDog.ownerName}</span>
                <span className="own-message-modal-distance">
                  {targetDog.distance}{t.common?.nearby || ' 인근'}
                </span>
              </div>

              <div className="own-message-modal-dog-info">
                <div className='text-sm'>{targetDog.breed} {targetDog.age}{t.profile?.dogAgeSuffix || '살'} &middot; {targetDog.gender === 'female' ? (t.common?.genderShortFemale || '여') : (t.common?.genderShortMale || '남')}</div>
                <div className="row gap-4" style={{ flexWrap: 'wrap', marginTop: 4 }}>
                  {targetDog.personality?.map((p, i) => (
                    <span key={i} className="badge-hashtag">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost own-message-modal-close-btn"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message Stream */}
        <div className="own-message-modal-body">
          {messages.map((msg, idx) => {
            const isMe = msg.sender === 'me';
            return (
              <div key={idx} className={`own-message-row ${isMe ? 'is-me' : 'is-target'}`}>
                {!isMe && (
                  <img src={displayAvatar} alt="avatar" className="own-message-avatar" />
                )}
                <div className={`own-message-bubble ${isMe ? 'is-me' : 'is-target'}`}>
                  {msg.text && (
                    <div className={`own-message-text ${isMe ? 'is-me' : 'is-target'}`}>
                      {msg.text}
                    </div>
                  )}
                  <div className={`own-message-time ${isMe ? 'is-me' : 'is-target'}`}>
                    {formatChatTime(msg.timestamp, language, msg.time)}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Templates */}
        <div className="own-message-quick-templates-wrapper">
          {QUICK_TEMPLATES.map((tmpl, i) => (
            <button
              key={i}
              onClick={() => setMessageText(tmpl)}
              className="own-message-quick-template-btn"
            >
              {tmpl.slice(0, 14)}...
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="own-message-input-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder={t.profile?.notePlaceholder ? t.profile.notePlaceholder.replace('{ownerName}', targetDog.ownerName) : `${targetDog.ownerName} 보호자님께 메세지 보내기...`}
            className="own-message-input"
          />
          <button
            onClick={handleSend}
            disabled={!messageText.trim()}
            className="own-message-send-btn"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
