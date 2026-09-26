import React, { useState, useEffect } from 'react';
import { X, Send, Sparkles } from 'lucide-react';
import { DogProfile, getDefaultDogAvatar } from '../data/mockDogs';
import confetti from 'canvas-confetti';
import { useTranslation } from '../i18n/LanguageContext';
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
  const { t } = useTranslation();

  const QUICK_TEMPLATES = [
    t.profile?.noteTemplate1 || '안녕하세요! 산책 코스가 어떻게 되시나요?',
    t.profile?.noteTemplate2 || '강아지가 너무 예뻐요! 저희 애랑 인사해도 될까요?',
    t.profile?.noteTemplate3 || '지금 어느 쪽으로 산책 중이신가요?',
    t.profile?.noteTemplate4 || '간식 하나 줘도 될까요? 알러지 있나요?'
  ];

  const [messageText, setMessageText] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [messages, setMessages] = useState<Array<{ sender: 'me' | 'target'; text: string; time: string }>>([]);

  // 모달 열릴 때 초기 메세지 세팅 + body 스크롤 잠금
  useEffect(() => {
    if (isOpen && targetDog) {
      const defaultIntro = '안녕하세요! 저는 {ownerName} 맘(대디)이에요. 저희 {dogName}이는 {breed}랍니다. 친하게 지내요!';
      const introText = (t.profile?.noteIntro || defaultIntro)
        .replace('{ownerName}', targetDog.ownerName || '')
        .replace('{dogName}', targetDog.name || '')
        .replace('{breed}', targetDog.breed || '');
      setMessages([{ sender: 'target', text: introText, time: t.profile?.justNow || '방금 전' }]);
      setMessageText('');
      // body 스크롤 잠금 → 뒷 화면 레이아웃 틀어짐 방지
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, targetDog]);

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
    setMessages(prev => [...prev, { sender: 'me', text: messageText.trim(), time: t.profile?.justNow || '방금 전' }]);
    setMessageText('');
    setIsSending(true);
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });
    setTimeout(() => {
      setIsSending(false);
      const autoReplies = [
        t.profile?.noteReply1?.replace('{distance}', targetDog.distance) || `${targetDog.distance} 인근에 계시네요! 반가워요.`,
        t.profile?.noteReply2?.replace('{dogName}', targetDog.name) || `${targetDog.name}이가 좋아할 것 같아요!`,
        t.profile?.noteReply3 || '네, 좋아요! 이따 뵐게요.'
      ];
      const reply = autoReplies[Math.floor(Math.random() * autoReplies.length)];
      setMessages(prev => [...prev, { sender: 'target', text: reply, time: t.profile?.justNow || '방금 전' }]);
    }, 1200);
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
                  {targetDog.distance} 인근
                </span>
              </div>

              <div className="own-message-modal-dog-info">
                <div>{targetDog.breed} {targetDog.age}{t.profile?.dogAgeSuffix || '살'} &middot; {targetDog.gender === 'female' ? (t.common?.genderShortFemale || '여') : (t.common?.genderShortMale || '남')}</div>
                <div>{targetDog.personality?.join(' ')}</div>
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
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}
          {isSending && (
            <div className="row gap-6 own-message-sending-indicator">
              <Sparkles size={13} />
              {targetDog.ownerName} 맘(대디)님이 답장을 작성하고 있습니다...
            </div>
          )}
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
            placeholder={t.profile?.notePlaceholder ? t.profile.notePlaceholder.replace('{ownerName}', targetDog.ownerName) : `${targetDog.ownerName} 맘(대디)님께 메세지 보내기...`}
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
