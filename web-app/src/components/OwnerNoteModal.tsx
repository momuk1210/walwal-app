import React, { useState, useEffect, useMemo } from 'react';
import { X, Send, Trash2 } from 'lucide-react';
import { DogProfile, getDefaultDogAvatar, getLiveDogProfile, isSameDogName } from '../data/mockDogs';
import confetti from 'canvas-confetti';
import { useTranslation } from '../i18n/LanguageContext';
import { formatChatTime } from '../utils/timeUtils';
import { getConversation, saveDirectMessage, deleteConversation, DirectMessageItem } from '../services/directMessageService';
import { db, COLLECTIONS } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
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
  const [messages, setMessages] = useState<DirectMessageItem[]>([]);
  const [cloudDogData, setCloudDogData] = useState<Partial<DogProfile> | null>(null);

  // Live timer to update relative time
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Firestore 'dogs' 컬렉션에서 상대견의 최신 상세 프로필(이름, 견종, 나이, 성별, 보호자명 등) 조회 및 캐시
  useEffect(() => {
    if (!isOpen || !targetDog) {
      return;
    }
    let cancelled = false;
    getDocs(collection(db, COLLECTIONS.DOGS))
      .then((snap) => {
        if (cancelled) return;
        const allDogs: any[] = [];
        let matched: any = null;
        snap.forEach((docSnap) => {
          const d = docSnap.data();
          if (d && d.name) {
            const item = { id: docSnap.id, ...d };
            allDogs.push(item);
            if (docSnap.id === targetDog.id || isSameDogName(d.name, targetDog.name)) {
              matched = item;
            }
          }
        });
        if (allDogs.length > 0) {
          try {
            localStorage.setItem('WALWAL_ALL_DOGS', JSON.stringify(allDogs));
          } catch (e) { }
        }
        if (matched) {
          setCloudDogData(matched);
        }
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [isOpen, targetDog]);

  const resolvedDog = useMemo(() => {
    if (!targetDog) return null;
    const live = getLiveDogProfile(targetDog.name || targetDog.id, language);
    const matchingCloud =
      cloudDogData &&
      ((cloudDogData.id && targetDog.id && cloudDogData.id === targetDog.id) ||
        (cloudDogData.name && isSameDogName(cloudDogData.name, targetDog.name)))
        ? cloudDogData
        : {};
    const merged: any = {
      ...(live || {}),
      ...targetDog,
      ...matchingCloud,
    };
    const name = merged.name || targetDog.name || '반려견';
    const isStrawberry = isSameDogName(name, '딸기');
    const breed = (merged.breed && merged.breed !== '반려견')
      ? merged.breed
      : (live?.breed && live.breed !== '반려견' ? live.breed : (isStrawberry ? '말티즈' : (merged.breed || '믹스견')));
    const age = merged.age ? String(merged.age) : (live?.age ? String(live.age) : (isStrawberry ? '2' : '1'));
    const gender = merged.gender || live?.gender || (isStrawberry ? 'female' : 'male');
    const rawOwner = merged.ownerName || live?.ownerName || '';
    const ownerName = rawOwner && rawOwner !== 'undefined' ? rawOwner : `${name} 보호자`;
    const personality = Array.isArray(merged.personality) && merged.personality.length > 0
      ? merged.personality
      : (Array.isArray(live?.personality) && live.personality.length > 0 ? live.personality : ['#산책러버', '#댕댕이']);
    const distance = merged.distance || live?.distance || '120m';
    const avatar = merged.avatar || live?.avatar || getDefaultDogAvatar(name);

    return {
      ...merged,
      name,
      breed,
      age,
      gender,
      ownerName,
      personality,
      distance,
      avatar
    } as DogProfile;
  }, [targetDog, cloudDogData, language]);

  // 모달 열릴 때 기존 대화 복원 + body 스크롤 잠금
  useEffect(() => {
    let cancelled = false;
    if (isOpen && targetDog) {
      // body 스크롤 잠금 → 뒷 화면 레이아웃 틀어짐 방지
      document.body.style.overflow = 'hidden';
      Promise.resolve().then(() => {
        if (cancelled) return;
        const existingConv = getConversation(targetDog);
        if (existingConv && Array.isArray(existingConv.messages)) {
          setMessages(existingConv.messages);
        } else {
          setMessages([]);
        }
        setMessageText('');
      });
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      cancelled = true;
      document.body.style.overflow = '';
    };
  }, [isOpen, targetDog]);

  if (!isOpen || !targetDog || !resolvedDog) return null;

  // avatar 유효성 검사
  const safeAvatar = (url?: string) => {
    if (!url || url.length < 10 || (!url.startsWith('http') && !url.startsWith('blob') && !url.startsWith('data'))) {
      return getDefaultDogAvatar(resolvedDog.name + ' ' + resolvedDog.breed);
    }
    return url;
  };
  const displayAvatar = safeAvatar(resolvedDog.avatar);

  const handleSend = () => {
    if (!messageText.trim() || !resolvedDog) return;
    const now = Date.now();
    const formattedTime = formatChatTime(now, language);
    const savedMsg = saveDirectMessage(resolvedDog, {
      text: messageText.trim(),
      sender: 'me',
      time: formattedTime
    });
    setMessages(prev => [...prev, savedMsg]);
    setMessageText('');
    confetti({ particleCount: 25, spread: 45, origin: { y: 0.6 } });
  };

  const cleanDogName = (resolvedDog.name || '')
    .replace(/\s*(엄마|아빠|보호자|집사|맘|Mom|Dad|ママ|パパ)\s*$/gi, '')
    .trim() || resolvedDog.name || '반려견';

  const handleDeleteChat = () => {
    const confirmMsg = language === 'ko'
      ? `${cleanDogName}와의 대화 내용을 모두 삭제하고 나가시겠습니까?`
      : 'Delete all messages with this user and leave?';
    if (window.confirm(confirmMsg)) {
      if (resolvedDog) {
        deleteConversation(resolvedDog);
      }
      setMessages([]);
      onClose();
    }
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
                alt={cleanDogName}
                className="own-message-modal-avatar"
              />
              <div className="own-message-modal-status-dot" />
            </div>
            <div>
              <div className="row gap-6">
                <span className="own-message-modal-owner-name">{cleanDogName}</span>
                {resolvedDog.distance && (
                  <span className="own-message-modal-distance">
                    {resolvedDog.distance}
                  </span>
                )}
              </div>

              <div className="own-message-modal-dog-info">
                <div className='text-sm'>
                  {resolvedDog.breed} · {resolvedDog.age}{t.profile?.dogAgeSuffix || '살'} &middot; {resolvedDog.gender === 'female' ? (t.common?.genderShortFemale || '여') : (t.common?.genderShortMale || '남')}
                </div>
                <div className="row gap-4" style={{ flexWrap: 'wrap', marginTop: 4 }}>
                  {resolvedDog.personality?.map((p, i) => (
                    <span key={i} className="badge-hashtag">{p}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleDeleteChat}
                className="btn-ghost own-message-modal-close-btn"
                title={language === 'ko' ? '대화 삭제 및 나가기' : 'Delete conversation'}
                aria-label={language === 'ko' ? '대화 삭제 및 나가기' : 'Delete conversation'}
                style={{ color: 'rgba(255, 255, 255, 0.9)' }}
              >
                <Trash2 size={20} />
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="btn-ghost own-message-modal-close-btn"
              title={language === 'ko' ? '닫기' : 'Close'}
              aria-label={language === 'ko' ? '닫기' : 'Close'}
            >
              <X size={24} />
            </button>
          </div>
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
            placeholder={
              language === 'ko'
                ? `${cleanDogName}에게 메세지 보내기...`
                : t.profile?.notePlaceholder
                  ? t.profile.notePlaceholder.replace('{ownerName}', cleanDogName)
                  : `Send a message to ${cleanDogName}...`
            }
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
