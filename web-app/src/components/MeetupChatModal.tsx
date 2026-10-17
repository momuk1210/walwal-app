import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MapPin, Users, Clock, Sparkles, MoreVertical, Edit3, Trash2, Flag, ShieldAlert, ChevronLeft } from 'lucide-react';
import { WalkMeetup } from './CommunityView';
import { getMockDogs, getDefaultDogAvatar, isSameDogName, getLiveDogAvatar, getLiveDogProfile, localizeBreed, localizePersonalityTags } from '../data/mockDogs';
import { TRANSLATIONS, Language } from '../i18n/translations';
import { formatChatTime } from '../utils/timeUtils';
import { DogProfileModal } from './DogProfileModal';
import { ReportModal, ReportModalTarget } from './ReportModal';
import { isUserBlocked, blockUser } from '../services/moderationService';
import { validateUserContent, maskProfanity } from '../utils/profanityFilter';
import { auth } from '../firebase';
import '../styles/OwnerNoteModal.css';

interface MeetupChatModalProps {
  meetup: WalkMeetup;
  onClose: () => void;
  language?: Language;
  onEdit?: () => void;
  onDelete?: () => void;
  isHost?: boolean;
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

export const MeetupChatModal: React.FC<MeetupChatModalProps> = ({ meetup, onClose, language = 'ko', onEdit, onDelete, isHost }) => {
  const t = TRANSLATIONS[language] || TRANSLATIONS['ko'];
  const [petUpdateTrigger, setPetUpdateTrigger] = useState(0);
  const [showMenu, setShowMenu] = useState(false);
  const [reportTarget, setReportTarget] = useState<ReportModalTarget | null>(null);
  const [blockedVersion, setBlockedVersion] = useState(0);
  const [activeMsgMenuId, setActiveMsgMenuId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.meetup-chat-menu-wrapper')) {
        setShowMenu(false);
      }
      if (!(e.target as HTMLElement).closest('.msg-options-wrapper')) {
        setActiveMsgMenuId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    const handlePetsUpdated = () => {
      setPetUpdateTrigger(prev => prev + 1);
    };
    const handleBlockedUpdated = () => {
      setBlockedVersion(prev => prev + 1);
    };
    window.addEventListener('walwal_pets_updated', handlePetsUpdated);
    window.addEventListener('walwal_blocked_users_updated', handleBlockedUpdated);
    window.addEventListener('storage', handlePetsUpdated);
    return () => {
      window.removeEventListener('walwal_pets_updated', handlePetsUpdated);
      window.removeEventListener('walwal_blocked_users_updated', handleBlockedUpdated);
      window.removeEventListener('storage', handlePetsUpdated);
    };
  }, []);

  // 내 전체 반려견 목록 (등록된 반려견이 없으면 빈 배열)
  const allMyPets = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const isInitialMockDump = parsed.length === 4 && parsed[0]?.id === 'dog-1' && parsed[1]?.id === 'dog-2' && parsed[2]?.id === 'dog-3' && parsed[3]?.id === 'dog-4';
          const listToUse = isInitialMockDump ? [parsed[0]] : parsed;
          return listToUse;
        }
      }
    } catch (e) { }
    return [];
  }, [language, petUpdateTrigger]);

  const activePet = allMyPets[0] || null;
  const currentUserEmail = (auth?.currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '').toLowerCase().trim();
  const defaultDisplayName = currentUserEmail ? currentUserEmail.split('@')[0] : (language === 'ko' ? '보호자' : 'Owner');

  const hostLiveAvatar = getLiveDogAvatar(meetup.hostDog, meetup.avatar);

  const [selectedProfileDog, setSelectedProfileDog] = useState<any | null>(null);
  const [inputText, setInputText] = useState('');
  const [, setTimeTick] = useState(0);

  // Live timer to update relative time (e.g. from '방금' to exact clock time)
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeTick(t => t + 1);
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Load chat messages from localStorage or create initial dummy messages
  const [messages, setMessages] = useState<Array<{ id: string; sender: any; text: string; time?: string; timestamp?: number }>>(() => {
    const stored = getStoredChatHistory(meetup.id);
    if (stored && Array.isArray(stored) && stored.length > 0) {
      return stored.filter((m: any) => !m.id || !m.id.startsWith('reply_'));
    }

    const participants = meetup.participants || [];
    const dummyMessages = [];

    if (participants.length > 0) {
      dummyMessages.push({
        id: 'msg1',
        sender: participants[0],
        text: `안녕하세요! 다들 ${meetup.time}에 뵐 수 있는거죠?`,
        time: '오후 1:00'
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

    const validation = validateUserContent(inputText.trim());
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

    const now = Date.now();
    const currentText = inputText.trim();
    const senderName = activePet?.name || defaultDisplayName;
    const senderOwnerName = activePet?.ownerName || (activePet ? `${activePet.name} 엄마` : defaultDisplayName);
    const senderAvatar = activePet ? getLiveDogAvatar(activePet.name, activePet.avatar) : getDefaultDogAvatar();
    const senderBreed = activePet?.breed || (language === 'ko' ? '보호자' : 'Owner');

    const newMessage = {
      id: `my_msg_${now}`,
      timestamp: now,
      isMyMessage: true,
      sender: {
        name: senderName,
        ownerName: senderOwnerName,
        avatar: senderAvatar,
        breed: senderBreed
      },
      text: currentText,
      time: formatChatTime(now, language)
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
        <div className="own-message-modal-header" style={{ padding: '12px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '8px' }}>
            {/* 좌측 뒤로가기 버튼 (명확하고 큰 버튼) */}
            <button
              onClick={onClose}
              type="button"
              className="btn-ghost own-message-modal-back-btn"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.25)',
                color: '#FFFFFF',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
                padding: 0,
                transition: 'background 0.2s'
              }}
              title={language === 'ko' ? '뒤로 가기' : 'Back'}
              aria-label={language === 'ko' ? '뒤로 가기' : 'Back'}
            >
              <ChevronLeft size={24} strokeWidth={2.5} />
            </button>

            {/* 중앙 호스트 정보 및 타이틀 */}
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flex: 1, minWidth: 0 }}>
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
                  style={{ cursor: 'pointer', width: '36px', height: '36px' }}
                  title="호스트 프로필 보기"
                />
                <div className="own-message-modal-status-dot" />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span className="own-message-modal-owner-name" style={{ fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                    {meetup.title}
                  </span>
                </div>

                {/* Participants Facepile */}
                {meetup.participants && meetup.participants.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      {meetup.participants.slice(0, 5).map((p: any, idx: number) => {
                        const avatarUrl = getLiveDogAvatar(p.name, p.avatar);
                        return (
                          <img
                            key={idx}
                            src={avatarUrl}
                            alt={p.name}
                            title={`${p.name} (${p.ownerName || '견주'})`}
                            onClick={() => setSelectedProfileDog(getLiveDogProfile(p.name, language) || { ...p, avatar: avatarUrl })}
                            style={{
                              width: '20px',
                              height: '20px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '1.5px solid #FFFFFF',
                              marginLeft: idx === 0 ? 0 : '-5px',
                              cursor: 'pointer',
                              position: 'relative',
                              zIndex: 10 - idx
                            }}
                          />
                        );
                      })}
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.95)', fontWeight: 700, flexShrink: 0, marginLeft: '2px' }}>
                      {meetup.participantsCount || (meetup.participants?.length || 1)}/{meetup.maxParticipants || (meetup.participants?.length || 1)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* 우측 닫기 버튼 */}
            <button
              onClick={onClose}
              type="button"
              className="btn-ghost own-message-modal-close-btn"
              style={{ flexShrink: 0, marginLeft: '2px' }}
              title={language === 'ko' ? '닫기' : 'Close'}
              aria-label={language === 'ko' ? '닫기' : 'Close'}
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
            gap: '8px',
            fontSize: '0.76rem',
            color: '#121212',
            borderBottom: '1px solid #E2E8F0',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flex: 1, minWidth: 0 }}>
            <MapPin size={14} color="#FF9E58" style={{ flexShrink: 0 }} />
            <span style={{ fontWeight: 600, color: '#333', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {meetup.location}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} color="#121212" style={{ flexShrink: 0 }} />
              <span style={{ fontWeight: 500, color: '#121212', whiteSpace: 'nowrap' }}>
                {meetup.time}
              </span>
            </div>
            <div className="meetup-chat-menu-wrapper" style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setShowMenu(prev => !prev)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: showMenu ? '#E2E8F0' : 'transparent',
                  border: 'none',
                  color: '#121212',
                  cursor: 'pointer',
                  padding: 0,
                  transition: 'background 0.2s, color 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#E2E8F0';
                  e.currentTarget.style.color = '#000';
                }}
                onMouseLeave={e => {
                  if (!showMenu) e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#121212';
                }}
                title={isHost ? "모임 관리" : "더보기"}
              >
                <MoreVertical size={15} />
              </button>

              {showMenu && (
                <div className="snaps-dropdown-menu feed-dropdown-menu">
                  {isHost ? (
                    <>
                      {onEdit && (
                        <button
                          className="snaps-dropdown-item feed-dropdown-item"
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onEdit();
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#F7FAFC')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <Edit3 size={15} />
                          <span>{t.community?.editMeetup || (language === 'ko' ? '수정' : language === 'ja' ? '集まりを編集' : 'Edit Meetup')}</span>
                        </button>
                      )}
                      {onDelete && (
                        <button
                          className="snaps-dropdown-item feed-dropdown-item"
                          type="button"
                          onClick={() => {
                            setShowMenu(false);
                            onDelete();
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF5F5')}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                        >
                          <Trash2 size={15} />
                          <span>{t.community?.deleteMeetup || (language === 'ko' ? '모임 삭제' : language === 'ja' ? '集まりを削除' : 'Delete Meetup')}</span>
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <button
                        className="snaps-dropdown-item feed-dropdown-item"
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          setReportTarget({
                            type: 'meetup',
                            id: meetup.id,
                            author: meetup.hostDog || meetup.hostOwner,
                            content: meetup.title
                          });
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF5F5')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <Flag size={15} color="#E53E3E" />
                        <span style={{ color: '#E53E3E' }}>모임 신고하기</span>
                      </button>
                      <button
                        className="snaps-dropdown-item feed-dropdown-item"
                        type="button"
                        onClick={() => {
                          setShowMenu(false);
                          const targetUser = meetup.hostDog || meetup.hostOwner;
                          if (window.confirm(`'${targetUser}' 사용자를 차단하시겠습니까? 이 사용자의 모임과 글이 숨겨집니다.`)) {
                            blockUser(targetUser);
                            alert('사용자가 차단되었습니다.');
                          }
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F7FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <ShieldAlert size={15} color="#121212" />
                        <span>호스트 차단하기</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Message Stream */}
        <div className="own-message-modal-body">
          {messages
            .filter((msg: any) => {
              const sName = msg.sender?.name || '';
              const oName = msg.sender?.ownerName || '';
              return !isUserBlocked(sName) && !isUserBlocked(oName);
            })
            .map((msg: any) => {
              const isMe = Boolean(
                msg.isMyMessage === true ||
                (msg.id && typeof msg.id === 'string' && msg.id.startsWith('my_msg_')) ||
                allMyPets.some((p: any) => isSameDogName(p.name, msg.sender?.name))
              );
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%', position: 'relative' }}>
                    {!isMe && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '4px' }}>
                        <span style={{ fontSize: '0.75rem', color: '#121212', marginLeft: '4px', fontWeight: 600 }}>
                          {msg.sender.name} <span style={{ opacity: 0.7, fontWeight: 400 }}>{msg.sender.ownerName ? msg.sender.ownerName.replace(msg.sender.name, '').replace(/맘/g, '엄마').trim() : ''}</span>
                        </span>
                        <div className="msg-options-wrapper" style={{ position: 'relative' }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMsgMenuId(prev => prev === msg.id ? null : msg.id);
                            }}
                            style={{
                              background: 'none',
                              border: 'none',
                              color: '#A0AEC0',
                              cursor: 'pointer',
                              padding: '2px 4px',
                              display: 'flex',
                              alignItems: 'center'
                            }}
                            title="신고/차단"
                          >
                            <MoreVertical size={13} />
                          </button>
                          {activeMsgMenuId === msg.id && (
                            <div
                              className="snaps-dropdown-menu"
                              style={{
                                position: 'absolute',
                                top: '100%',
                                right: 0,
                                zIndex: 100,
                                minWidth: '130px',
                                background: '#FFFFFF',
                                borderRadius: '8px',
                                boxShadow: '0 4px 14px rgba(0,0,0,0.12)',
                                border: '1px solid #E2E8F0',
                                padding: '4px 0'
                              }}
                            >
                              <button
                                className="snaps-dropdown-item"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMsgMenuId(null);
                                  setReportTarget({
                                    type: 'chat',
                                    id: msg.id,
                                    author: msg.sender?.name || 'unknown',
                                    content: msg.text || ''
                                  });
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: 'none',
                                  fontSize: '0.8rem',
                                  color: '#E53E3E',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                <Flag size={13} />
                                <span>메시지 신고</span>
                              </button>
                              <button
                                className="snaps-dropdown-item"
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setActiveMsgMenuId(null);
                                  const targetUser = msg.sender?.name || msg.sender?.ownerName;
                                  if (window.confirm(`'${targetUser}' 사용자를 차단하시겠습니까? 이 사용자의 모든 글과 메시지가 숨겨집니다.`)) {
                                    blockUser(targetUser);
                                    alert('사용자가 차단되었습니다.');
                                  }
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '6px',
                                  width: '100%',
                                  padding: '8px 12px',
                                  border: 'none',
                                  background: 'none',
                                  fontSize: '0.8rem',
                                  color: '#121212',
                                  cursor: 'pointer',
                                  textAlign: 'left'
                                }}
                              >
                                <ShieldAlert size={13} />
                                <span>작성자 차단</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    <div className={`own-message-bubble ${isMe ? 'is-me' : 'is-target'}`} style={{ maxWidth: '100%' }}>
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
                </div>
              );
            })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="own-message-input-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder={
              activePet
                ? (t.community?.chatPlaceholder || '{name}(으)로 메시지 입력...').replace('{name}', activePet.name)
                : (language === 'ko' ? '메시지를 입력하세요...' : 'Type a message...')
            }
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

      {/* Report Modal */}
      <ReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div >
  );
};
