import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MapPin, Users, Clock, Sparkles } from 'lucide-react';
import { WalkMeetup } from './CommunityView';
import { getMockDogs, getDefaultDogAvatar, isSameDogName, getLiveDogAvatar, getLiveDogProfile, localizeBreed, localizePersonalityTags } from '../data/mockDogs';
import { TRANSLATIONS, Language } from '../i18n/translations';
import { DogProfileModal } from './DogProfileModal';
import '../styles/OwnerNoteModal.css';

interface MeetupChatModalProps {
  meetup: WalkMeetup;
  onClose: () => void;
  language?: Language;
}

const getStoredChatHistory = (meetupId: string): any[] | null => {
  try {
    const saved = localStorage.getItem('WALWAL_MEETUP_CHATS');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed[meetupId])) {
        return parsed[meetupId];
      }
    }
  } catch (e) { }
  return null;
};

const saveChatHistory = (meetupId: string, msgs: any[]) => {
  try {
    const saved = localStorage.getItem('WALWAL_MEETUP_CHATS');
    const parsed = saved ? JSON.parse(saved) : {};
    parsed[meetupId] = msgs;
    localStorage.setItem('WALWAL_MEETUP_CHATS', JSON.stringify(parsed));
  } catch (e) {
    console.error('Failed to save meetup chat history:', e);
  }
};

export const MeetupChatModal: React.FC<MeetupChatModalProps> = ({ meetup, onClose, language = 'ko' }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['ko'];
  const [petUpdateTrigger, setPetUpdateTrigger] = useState(0);

  useEffect(() => {
    const handlePetsUpdated = () => {
      setPetUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('walwal_pets_updated', handlePetsUpdated);
    window.addEventListener('storage', handlePetsUpdated);
    return () => {
      window.removeEventListener('walwal_pets_updated', handlePetsUpdated);
      window.removeEventListener('storage', handlePetsUpdated);
    };
  }, []);

  // 내 전체 반려견 목록
  const allMyPets = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return getMockDogs(language);
  }, [language, petUpdateTrigger]);

  // 이 모임에 실제로 참여하고 있는 내 반려견 목록만 필터링
  const myParticipatingPets = React.useMemo(() => {
    // 1. 모임에 명시적으로 참여 신청된 내 반려견 목록이 있는 경우
    if (meetup.userJoinedPets && meetup.userJoinedPets.length > 0) {
      return meetup.userJoinedPets;
    }
    // 2. 참여 반려견 ID 목록이 있는 경우
    if (meetup.joinedPetIds && meetup.joinedPetIds.length > 0) {
      const matched = allMyPets.filter(p => meetup.joinedPetIds!.includes(p.id || p.name));
      if (matched.length > 0) return matched;
    }
    // 3. 참여자 목록(participants) 중 내 반려견과 매칭되는 아이들
    const participants = meetup.participants || [];
    const matched = allMyPets.filter(myPet =>
      participants.some(p =>
        (p.id && myPet.id && p.id === myPet.id) ||
        (p.name && myPet.name && p.name.trim().toLowerCase() === myPet.name.trim().toLowerCase())
      )
    );
    return matched.length > 0 ? matched : [allMyPets[0]];
  }, [allMyPets, meetup.userJoinedPets, meetup.joinedPetIds, meetup.participants]);

  const [selectedPetId, setSelectedPetId] = useState<string>(() => myParticipatingPets[0]?.id || myParticipatingPets[0]?.name || '');

  useEffect(() => {
    if (!myParticipatingPets.some(p => (p.id === selectedPetId || p.name === selectedPetId))) {
      setSelectedPetId(myParticipatingPets[0]?.id || myParticipatingPets[0]?.name || '');
    }
  }, [myParticipatingPets]);

  const activePet = myParticipatingPets.find(p => (p.id === selectedPetId || p.name === selectedPetId)) || myParticipatingPets[0];

  const hostLiveAvatar = getLiveDogAvatar(meetup.hostDog, meetup.avatar);

  const [selectedProfileDog, setSelectedProfileDog] = useState<any | null>(null);
  const [inputText, setInputText] = useState('');

  // Load chat messages from localStorage or create initial dummy messages
  const [messages, setMessages] = useState<Array<{ id: string; sender: any; text: string; time: string }>>(() => {
    const stored = getStoredChatHistory(meetup.id);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored;
    }

    const participants = meetup.participants || [];
    const dummyMessages = [];

    if (participants.length > 0) {
      dummyMessages.push({
        id: 'msg1',
        sender: participants[0],
        text: `안녕하세요! 다들 ${meetup.time}에 뵐 수 있는거죠? 🐶`,
        time: '오후 1:00'
      });
    }

    if (participants.length > 1) {
      dummyMessages.push({
        id: 'msg2',
        sender: participants[1],
        text: `네네! 저희 애가 너무 기대하고 있어요ㅎㅎ 장소는 ${meetup.location} 맞죠?`,
        time: '오후 1:05'
      });
    }

    if (participants.length > 0) {
      dummyMessages.push({
        id: 'msg3',
        sender: participants[0],
        text: `맞습니다! 도착하시면 톡방에 말씀해주세요~`,
        time: '오후 1:10'
      });
    }

    saveChatHistory(meetup.id, dummyMessages);
    return dummyMessages;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: {
        name: activePet.name,
        ownerName: activePet.ownerName || `${activePet.name} 맘`,
        avatar: getLiveDogAvatar(activePet.name, activePet.avatar),
        breed: activePet.breed
      },
      text: inputText.trim(),
      time: language === 'ko' ? '방금' : (language === 'ja' ? 'たった今' : 'Just now')
    };

    setMessages(prev => {
      const next = [...prev, newMessage];
      saveChatHistory(meetup.id, next);
      return next;
    });
    setInputText('');
  };

  return (
    <div className="own-message-modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="own-message-modal-container" style={{ position: 'relative' }}>

        {/* Header */}
        <div className="own-message-modal-header" style={{ padding: '16px 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', flex: 1, minWidth: 0 }}>
              <div className="own-message-modal-avatar-container" style={{ flexShrink: 0 }}>
                <img
                  src={hostLiveAvatar}
                  alt={meetup.title}
                  className="own-message-modal-avatar"
                  onClick={() => setSelectedProfileDog(getLiveDogProfile(meetup.hostDog, language) || {
                    name: meetup.hostDog,
                    ownerName: meetup.hostOwner,
                    avatar: hostLiveAvatar,
                    breed: '호스트 반려견',
                    personality: [meetup.tag]
                  })}
                  style={{ cursor: 'pointer' }}
                  title="호스트 프로필 보기"
                />
                <div className="own-message-modal-status-dot" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Title */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                  <span className="own-message-modal-owner-name" style={{ fontSize: '0.95rem' }}>{meetup.title}</span>
                </div>

                {/* Participants Facepile (참여중인 이웃 프로필 사진들) */}
                {meetup.participants && meetup.participants.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {meetup.participants.map((p: any, idx: number) => {
                        const avatarUrl = getLiveDogAvatar(p.name, p.avatar);
                        return (
                          <img
                            key={idx}
                            src={avatarUrl}
                            alt={p.name}
                            title={`${p.name} (${p.ownerName || '견주'})`}
                            onClick={() => setSelectedProfileDog(getLiveDogProfile(p.name, language) || { ...p, avatar: avatarUrl })}
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid #FFFFFF',
                              marginLeft: idx === 0 ? 0 : '-6px',
                              cursor: 'pointer',
                              position: 'relative',
                              zIndex: 10 - idx,
                              transition: 'transform 0.15s, box-shadow 0.15s'
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.transform = 'scale(1.25)';
                              e.currentTarget.style.zIndex = '30';
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.transform = 'scale(1)';
                              e.currentTarget.style.zIndex = String(10 - idx);
                            }}
                          />
                        );
                      })}
                    </div>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.95)', fontWeight: 700, flexShrink: 0, marginLeft: '2px' }}>
                      {meetup.participantsCount || (meetup.participants?.length || 1)}/{meetup.maxParticipants || (meetup.participants?.length || 1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-ghost own-message-modal-close-btn"
              style={{ flexShrink: 0, marginLeft: '8px' }}
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {/* Location & Time Bar (배경 #efefef) */}
        <div
          style={{
            background: '#efefef',
            padding: '8px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '10px',
            fontSize: '0.76rem',
            color: '#4A5568',
            borderBottom: '1px solid #E2E8F0',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: 0 }}>
            <MapPin size={14} color="#FFB320" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: '#2D3748', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meetup.location}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <Clock size={13} color="#718096" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 500, color: '#4A5568', whiteSpace: 'nowrap' }}>
              {meetup.time}
            </span>
          </div>
        </div>

        {/* Message Stream */}
        <div className="own-message-modal-body">
          {messages.map((msg) => {
            const isMe = allMyPets.some((p: any) => p.name === msg.sender.name || (msg.sender.ownerName && p.ownerName === msg.sender.ownerName));
            return (
              <div key={msg.id} className={`own-message-row ${isMe ? 'is-me' : 'is-target'}`}>
                {!isMe && (
                  <img
                    src={getLiveDogAvatar(msg.sender.name, msg.sender.avatar)}
                    alt="avatar"
                    className="own-message-avatar"
                    onClick={() => setSelectedProfileDog(getLiveDogProfile(msg.sender.name, language) || msg.sender)}
                    style={{ cursor: 'pointer' }}
                    title={`${msg.sender.name}`}
                  />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  {!isMe && (
                    <span style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '4px', marginLeft: '4px', fontWeight: 600 }}>
                      {msg.sender.name} <span style={{ opacity: 0.7, fontWeight: 400 }}>{msg.sender.ownerName ? msg.sender.ownerName.replace(msg.sender.name, '').trim() : ''}</span>
                    </span>
                  )}
                  <div className={`own-message-bubble ${isMe ? 'is-me' : 'is-target'}`} style={{ maxWidth: '100%' }}>
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
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Multi-Pet Sender Switcher (이 모임에 2마리 이상 함께 참여했을 때만 전환 탭 표시) */}
        {myParticipatingPets.length > 1 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 16px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', overflowX: 'auto' }}>
            <span style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 600, flexShrink: 0 }}>
              {t.community?.senderProfile || '발신 프로필:'}
            </span>
            {myParticipatingPets.map((pet: any) => {
              const isSelected = (activePet.id === pet.id || activePet.name === pet.name);
              const petAvatar = getLiveDogAvatar(pet.name, pet.avatar);
              return (
                <button
                  key={pet.id || pet.name}
                  type="button"
                  onClick={() => setSelectedPetId(pet.id || pet.name)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    border: isSelected ? '1.5px solid #FFB320' : '1px solid #E2E8F0',
                    background: isSelected ? 'rgba(255, 179, 32, 0.15)' : '#FFFFFF',
                    color: isSelected ? '#D97706' : '#64748B',
                    fontSize: '0.75rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  <img src={petAvatar} alt={pet.name} style={{ width: '14px', height: '14px', borderRadius: '50%', objectFit: 'cover' }} />
                  <span>{pet.name}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* Input */}
        <div className="own-message-input-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder={(t.community?.chatPlaceholder || '{name}(으)로 메시지 입력...').replace('{name}', activePet.name)}
            className="own-message-input"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="own-message-send-btn"
          >
            <Send size={16} />
          </button>
        </div>

      </div>

      {/* Participant Profile Detail Popup Modal */}
      <DogProfileModal
        dog={selectedProfileDog}
        onClose={() => setSelectedProfileDog(null)}
      />
    </div>
  );
};
