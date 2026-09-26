import React, { useState, useEffect } from 'react';
import { Calendar, MapPin, Heart, MessageSquare, Plus, CheckCircle2, Navigation, X, Send, PawPrint, Crown, LogOut } from 'lucide-react';
import { MOCK_DOGS, getMockDogs, isSameDogName, getDefaultDogAvatar, normalizeDogProfile, getLiveDogAvatar, getLiveDogProfile, localizeBreed, localizePersonalityTags } from '../data/mockDogs';
import { MeetupChatModal } from './MeetupChatModal';
import { DogProfileModal } from './DogProfileModal';

export interface WalkMeetup {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  time: string;
  hostDog: string;
  hostOwner: string;
  avatar: string;
  participantsCount: number;
  maxParticipants: number;
  tag: string;
  joined: boolean;
  status?: 'upcoming' | 'past';
  participants?: any[];
  unreadCount?: number;
  userJoinedPets?: any[];
  joinedPetIds?: string[];
}

const INITIAL_MEETUPS: WalkMeetup[] = [
  {
    id: 'm1',
    title: '서울숲 야간 킁킁 산책 번개',
    location: '서울숲 중앙잔디광장',
    lat: 37.5445,
    lng: 127.0374,
    time: '오늘 저녁 8시 30분',
    hostDog: '보리',
    hostOwner: '보리 엄마',
    avatar: getMockDogs("ko")[0].avatar,
    participantsCount: 4,
    maxParticipants: 8,
    tag: '#대형견환영',
    joined: false,
    status: 'upcoming',
    participants: [
      getMockDogs("ko")[0],
      getMockDogs("ko")[1],
      getMockDogs("ko")[2],
      getMockDogs("ko")[3]
    ]
  },
  {
    id: 'm2',
    title: '웰시코기 & 숏다리 친구들 모여라!',
    location: '뚝섬 한강공원 피크닉존',
    lat: 37.5298,
    lng: 127.0700,
    time: '내일 오후 3시',
    hostDog: '땅콩',
    hostOwner: '땅콩 아빠',
    avatar: getMockDogs("ko")[1].avatar,
    participantsCount: 3,
    maxParticipants: 6,
    tag: '#숏다리모임',
    joined: true,
    unreadCount: 3,
    status: 'upcoming',
    participants: [
      getMockDogs("ko")[1],
      getMockDogs("ko")[2],
      getMockDogs("ko")[3]
    ]
  },
  {
    id: 'm3',
    title: '쫄보 솜뭉치들의 조용한 힐링 산책',
    location: '살곶이 다리 산책로',
    lat: 37.5580,
    lng: 127.0435,
    time: '일요일 오전 10시',
    hostDog: '구름이',
    hostOwner: '구름 엄마',
    avatar: getMockDogs("ko")[2].avatar,
    participantsCount: 2,
    maxParticipants: 5,
    tag: '#소형견전용',
    joined: false,
    status: 'upcoming',
    participants: [
      getMockDogs("ko")[2],
      getMockDogs("ko")[3]
    ]
  },
  {
    id: 'm4',
    title: ' 가을맞이 시바견 정모 (종료)',
    location: '어린이대공원 반려견놀이터',
    lat: 37.5492,
    lng: 127.0818,
    time: '지난 주말 오후 2시',
    hostDog: '모찌',
    hostOwner: '모찌 아빠',
    avatar: getMockDogs("ko")[1].avatar,
    participantsCount: 3,
    maxParticipants: 10,
    tag: '#정기모임',
    joined: false,
    status: 'past',
    participants: [
      getMockDogs("ko")[1],
      getMockDogs("ko")[2],
      getMockDogs("ko")[0],
      getMockDogs("ko")[3]
    ]
  }
];

interface CommunityViewProps {
  onNavigateToRadar?: (meetup: { lat: number; lng: number; name: string }) => void;
}

import { useTranslation } from '../i18n/LanguageContext';

export const CommunityView: React.FC<CommunityViewProps> = ({ onNavigateToRadar }) => {
  const { t, language } = useTranslation();

  // Use dynamically translated mock data
  const localizedMeetups: WalkMeetup[] = [
    { ...INITIAL_MEETUPS[0], hostDog: getMockDogs(language)[0].name, hostOwner: getMockDogs(language)[0].ownerName, participants: [getMockDogs(language)[0], getMockDogs(language)[1], getMockDogs(language)[2], getMockDogs(language)[3]], title: t.community.mock.m1?.title || INITIAL_MEETUPS[0].title, location: t.community.mock.m1?.location || INITIAL_MEETUPS[0].location, time: t.community.mock.m1?.time || INITIAL_MEETUPS[0].time, tag: t.community.mock.m1?.tag || INITIAL_MEETUPS[0].tag },
    { ...INITIAL_MEETUPS[1], hostDog: getMockDogs(language)[1].name, hostOwner: getMockDogs(language)[1].ownerName, participants: [getMockDogs(language)[1], getMockDogs(language)[2], getMockDogs(language)[3]], title: t.community.mock.m2?.title || INITIAL_MEETUPS[1].title, location: t.community.mock.m2?.location || INITIAL_MEETUPS[1].location, time: t.community.mock.m2?.time || INITIAL_MEETUPS[1].time, tag: t.community.mock.m2?.tag || INITIAL_MEETUPS[1].tag, participantsCount: 3 },
    { ...INITIAL_MEETUPS[2], hostDog: getMockDogs(language)[2].name, hostOwner: getMockDogs(language)[2].ownerName, participants: [getMockDogs(language)[2], getMockDogs(language)[3]], title: t.community.mock.m3?.title || INITIAL_MEETUPS[2].title, location: t.community.mock.m3?.location || INITIAL_MEETUPS[2].location, time: t.community.mock.m3?.time || INITIAL_MEETUPS[2].time, tag: t.community.mock.m3?.tag || INITIAL_MEETUPS[2].tag, participantsCount: 2 },
    { ...INITIAL_MEETUPS[3], hostDog: getMockDogs(language)[1].name, hostOwner: getMockDogs(language)[1].ownerName, participants: [getMockDogs(language)[0], getMockDogs(language)[1], getMockDogs(language)[2]], title: '정기 건강 산책', location: '호수공원 둘레길', time: '지난주 수요일', tag: '#정기모임', participantsCount: 3 }
  ];

  // Initialize or sync with language changes
  const [meetups, setMeetups] = useState<WalkMeetup[]>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_MEETUPS');
      if (saved) return JSON.parse(saved);
    } catch (e) { }
    return localizedMeetups;
  });

  // Save to localStorage whenever meetups change
  React.useEffect(() => {
    localStorage.setItem('WALWAL_MEETUPS', JSON.stringify(meetups));
  }, [meetups]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHostProfile, setSelectedHostProfile] = useState<any>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formTime, setFormTime] = useState('');
  const [formTag, setFormTag] = useState('');
  const [formMax, setFormMax] = useState<number>(5);

  const [meetupStatusFilter, setMeetupStatusFilter] = useState<'upcoming' | 'joined' | 'past'>('upcoming');
  const [showParticipantsModal, setShowParticipantsModal] = useState<WalkMeetup | null>(null);
  const [activeChatMeetup, setActiveChatMeetup] = useState<WalkMeetup | null>(null);
  const [petVersion, setPetVersion] = useState(0);

  useEffect(() => {
    const handlePetUpdate = () => setPetVersion(v => v + 1);
    window.addEventListener('walwal_pets_updated', handlePetUpdate);
    window.addEventListener('storage', handlePetUpdate);
    return () => {
      window.removeEventListener('walwal_pets_updated', handlePetUpdate);
      window.removeEventListener('storage', handlePetUpdate);
    };
  }, []);

  // 내 전체 반려견 목록 (다견 지원)
  const myPets = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: any) => normalizeDogProfile(p, language));
        }
      }
    } catch (e) { }
    return getMockDogs(language);
  }, [language, petVersion]);

  const myDog = myPets[0] || getMockDogs("ko")[0];

  const getLiveDogAvatar = (name?: string, fallbackAvatar?: string): string => {
    if (!name) return fallbackAvatar || '';
    const myPet = myPets.find(p => isSameDogName(p.name, name));
    if (myPet?.avatar) return myPet.avatar;
    return fallbackAvatar || getDefaultDogAvatar(name);
  };

  // 다견 산책 참여 선택 모달 상태
  const [joinPetSelectionMeetup, setJoinPetSelectionMeetup] = useState<WalkMeetup | null>(null);
  const [selectedJoinPetIds, setSelectedJoinPetIds] = useState<string[]>([]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formLocation || !formTime) return;

    const newMeetup: WalkMeetup = {
      id: `m_${Date.now()}`,
      title: formTitle,
      location: formLocation,
      lat: 37.5445,
      lng: 127.0374,
      time: formTime,
      hostDog: myDog.name,
      hostOwner: myDog.ownerName,
      avatar: myDog.avatar,
      participantsCount: 1,
      maxParticipants: formMax,
      tag: formTag || '#자유모임',
      joined: true,
      status: 'upcoming',
      participants: [myDog],
      userJoinedPets: [myDog],
      joinedPetIds: [myDog.id || myDog.name]
    };

    setMeetups([newMeetup, ...meetups]);
    setShowCreateModal(false);

    setFormTitle('');
    setFormLocation('');
    setFormTime('');
    setFormTag('');
    setFormMax(5);
  };

  // Sync when language changes
  React.useEffect(() => {
    setMeetups(prev => prev.map(m => {
      const localizedM = localizedMeetups.find(lm => lm.id === m.id);
      if (localizedM) {
        return {
          ...m,
          title: localizedM.title,
          location: localizedM.location,
          time: localizedM.time,
          tag: localizedM.tag
        };
      }
      return m;
    }));
  }, [language]);

  const handleJoin = (id: string) => {
    const targetMeetup = meetups.find(m => m.id === id);
    if (!targetMeetup) return;

    // 이미 참여한 모임이면 -> 취소 처리
    if (targetMeetup.joined) {
      setMeetups(prev =>
        prev.map(m => {
          if (m.id === id) {
            const myNames = new Set(myPets.map((p: any) => p.name));
            const filteredParticipants = (m.participants || []).filter(p => !myNames.has(p.name));
            const removedCount = (m.participants || []).length - filteredParticipants.length;
            return {
              ...m,
              joined: false,
              participantsCount: Math.max(0, m.participantsCount - (removedCount || 1)),
              participants: filteredParticipants,
              userJoinedPets: [],
              joinedPetIds: []
            };
          }
          return m;
        })
      );
      return;
    }

    // 미참여 모임인데, 반려견이 2마리 이상인 경우 -> 반려견 선택 모달 표시
    if (myPets.length > 1) {
      setJoinPetSelectionMeetup(targetMeetup);
      setSelectedJoinPetIds(myPets.map((p: any) => p.id || p.name));
      return;
    }

    // 반려견이 1마리인 경우 -> 바로 1마리로 참여
    setMeetups(prev =>
      prev.map(m => {
        if (m.id === id) {
          const nextParticipants = [...(m.participants || []), myDog];
          return {
            ...m,
            joined: true,
            participantsCount: m.participantsCount + 1,
            participants: nextParticipants,
            userJoinedPets: [myDog],
            joinedPetIds: [myDog.id || myDog.name]
          };
        }
        return m;
      })
    );
  };

  const confirmJoinWithSelectedPets = () => {
    if (!joinPetSelectionMeetup || selectedJoinPetIds.length === 0) return;

    const chosenDogs = myPets.filter((p: any) => selectedJoinPetIds.includes(p.id || p.name));

    setMeetups(prev =>
      prev.map(m => {
        if (m.id === joinPetSelectionMeetup.id) {
          const nextParticipants = [...(m.participants || []), ...chosenDogs];
          return {
            ...m,
            joined: true,
            participantsCount: m.participantsCount + chosenDogs.length,
            participants: nextParticipants,
            userJoinedPets: chosenDogs,
            joinedPetIds: selectedJoinPetIds
          };
        }
        return m;
      })
    );

    setJoinPetSelectionMeetup(null);
  };

  const handleLocationClick = (m: WalkMeetup) => {
    if (onNavigateToRadar) {
      onNavigateToRadar({ lat: m.lat, lng: m.lng, name: m.location });
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(m.location)}`, '_blank');
    }
  };

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="title-lg">{t.tabs.community}</h2>
          <p className="text-sub">{t.community.subtitle}</p>
        </div>
        <button
          className="btn-ghost"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={24} strokeWidth={2} />
        </button>
      </div>

      {/* Content */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '6px' }}>
        <button className="tap-btn"
          onClick={() => setMeetupStatusFilter('upcoming')}
          style={{ background: meetupStatusFilter === 'upcoming' ? '#3b4a5d' : '#E2E8F0', color: meetupStatusFilter === 'upcoming' ? '#fff' : '#4A5568' }}
        >
          {t.community.filterUpcoming}
        </button>
        <button className="tap-btn"
          onClick={() => setMeetupStatusFilter('joined')}
          style={{ border: 'none', background: meetupStatusFilter === 'joined' ? '#3b4a5d' : '#E2E8F0', color: meetupStatusFilter === 'joined' ? '#fff' : '#4A5568' }}
        >
          {t.community.filterJoined}
        </button>
        <button className="tap-btn"
          onClick={() => setMeetupStatusFilter('past')}
          style={{ background: meetupStatusFilter === 'past' ? '#3b4a5d' : '#E2E8F0', color: meetupStatusFilter === 'past' ? '#fff' : '#4A5568' }}
        >
          {t.community.filterPast}
        </button>
      </div>
      <div className="section-gap">
        {meetups.filter(m => {
          if (meetupStatusFilter === 'joined') return m.joined;
          if (meetupStatusFilter === 'past') return m.status === 'past';
          return m.status !== 'past';
        }).map(m => (
          <div
            key={m.id}
            className={`card-lg${m.joined ? ' card-joined' : ''}`}
          >
            <div className="row-between" style={{ alignItems: 'flex-start' }}>
              <div className="row gap-12" style={{ alignItems: 'start', flex: '1' }}>
                <img
                  src={getLiveDogAvatar(m.hostDog, m.avatar)}
                  alt={m.hostDog}
                  className="avatar-md"
                  style={{ cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#FFB320')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'transparent')}
                  onClick={() => {
                    const profile = myPets.find(d => isSameDogName(d.name, m.hostDog)) || getMockDogs(language).find(d => isSameDogName(d.name, m.hostDog));
                    if (profile) setSelectedHostProfile(profile);
                    else {
                      setSelectedHostProfile({
                        name: m.hostDog,
                        breed: '알 수 없음',
                        age: '비공개',
                        ownerName: m.hostOwner,
                        avatar: getLiveDogAvatar(m.hostDog, m.avatar),
                        personality: []
                      });
                    }
                  }}
                />
                <div className="host-info-wrapper"
                  onClick={() => {
                    if (!m.joined) {
                      alert(t.community.joinReqBeforeChat || '모임에 참가 신청 후 톡방에 입장할 수 있습니다.');
                      return;
                    }
                    setActiveChatMeetup(m);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="row-between gap-12" style={{ alignItems: 'center', width: '100%' }}>
                    <span className="badge-hashtag">{m.tag}</span>
                    <div className="text-sub" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Crown size={14} style={{ color: '#FFB320' }} />
                      {m.hostOwner}
                    </div>
                  </div>
                  <h3 className="title-md" style={{ transition: 'color 0.2s', display: 'flex', alignItems: 'center', gap: '6px' }} onMouseOver={e => e.currentTarget.style.color = '#38c5b7'} onMouseOut={e => e.currentTarget.style.color = 'inherit'}>
                    {m.title}
                    {m.unreadCount ? (
                      <span className="unreadCount">
                        {m.unreadCount} +
                      </span>
                    ) : null}
                  </h3>
                </div>
              </div>
            </div>

            {/* Location & Time */}
            < div className="col mt-16 gap-10" style={{ fontSize: '0.8rem', color: '#4A5568' }}>
              <div className="info-row">
                <button
                  className="link-accent"
                  onClick={() => handleLocationClick(m)}
                  title={t.community.tooltipLocation}
                >
                  <MapPin size={16} />
                  <span style={{ textDecoration: 'underline' }}>{m.location}</span>
                </button>
              </div>
              <div className="info-row justify-start">
                <Calendar size={16} /> <span>{m.time}</span>
              </div>
            </div>

            <div className="row-between mt-20" style={{ alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div className="text-sm">
                  {t.community.participants}: {m.participantsCount} / {m.maxParticipants}{t.community.peopleCount}
                </div>
                {/* Facepile UI */}
                {m.participants && m.participants.length > 0 && (
                  <div
                    onClick={() => setShowParticipantsModal(m)}
                    style={{ display: 'flex', cursor: 'pointer', alignItems: 'center' }}
                  >
                    {m.participants.slice(0, 5).map((p: any, idx: number) => (
                      <img
                        key={idx}
                        src={getLiveDogAvatar(p.name, p.avatar)}
                        alt={p.name}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #fff', marginLeft: idx === 0 ? 0 : '-10px', zIndex: 5 - idx, position: 'relative' }}
                      />
                    ))}
                    {m.participants.length > 5 && (
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid #fff', marginLeft: '-10px', zIndex: 0, background: '#EDF2F7', display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.75rem', fontWeight: 800, color: '#4A5568', position: 'relative' }}>
                        +{m.participants.length - 5}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <button
                onClick={() => m.status !== 'past' && handleJoin(m.id)}
                className={m.status === 'past' ? 'btn-disabled' : (m.joined ? 'btn-dark-line' : 'btn-primary')}
                style={{ background: m.status === 'past' ? '#bfc4c9ff' : undefined, cursor: m.status === 'past' ? 'not-allowed' : 'pointer', color: m.status === 'past' ? '#fff' : undefined, height: 'fit-content' }}
                disabled={m.status === 'past'}
              >
                {m.status === 'past' ? (
                  '종료됨'
                ) : m.joined ? (
                  <><LogOut size={16} /></>
                ) : (
                  <><PawPrint size={16} />In</>
                )}
              </button>
            </div>
          </div>
        ))
        }
      </div >

      {/* Create Meetup Modal */}
      {
        showCreateModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '400px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#2D3748' }}>{t.community.modalCreateTitle}</h3>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} color="#3b4a5d" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 600 }}>{t.community.modalTitleLabel}</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder={t.community.modalTitlePlaceholder}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 600 }}>{t.community.modalLocationLabel}</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder={t.community.modalLocationPlaceholder}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 600 }}>{t.community.modalTimeLabel}</label>
                  <input
                    type="text"
                    value={formTime}
                    onChange={e => setFormTime(e.target.value)}
                    placeholder={t.community.modalTimePlaceholder}
                    style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                    required
                  />
                </div>

                <div style={{ display: 'flex', gap: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 600 }}>{t.community.modalTagLabel}</label>
                    <input
                      type="text"
                      value={formTag}
                      onChange={e => setFormTag(e.target.value)}
                      placeholder={t.community.modalTagPlaceholder}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', fontSize: '0.85rem', color: '#4A5568', marginBottom: '6px', fontWeight: 600 }}>{t.community.modalMaxLabel}</label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={formMax}
                      onChange={e => setFormMax(parseInt(e.target.value) || 5)}
                      style={{ width: '100%', padding: '12px', borderRadius: '12px', border: '1px solid #E2E8F0', outline: 'none' }}
                    />
                  </div>
                </div>

                <button type="submit" style={{
                  background: '#FFB320', color: '#fff', border: 'none', padding: '14px', borderRadius: '14px', fontSize: '1rem', fontWeight: 700, marginTop: '8px', cursor: 'pointer'
                }}>
                  {t.community.modalBtnSubmit}
                </button>
              </form>
            </div>
          </div>
        )
      }
      {/* Host / Participant Profile Modal */}
      <DogProfileModal
        dog={selectedHostProfile}
        onClose={() => setSelectedHostProfile(null)}
      />
      {/* Participant List Modal */}
      {
        showParticipantsModal && (
          <div style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(5px)'
          }}>
            <div style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '360px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative',
              maxHeight: '80vh'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ margin: 0, fontSize: '1.2rem', color: '#2D3748', fontWeight: 800 }}>
                  {t.community.modalParticipantsTitle} ({showParticipantsModal.participants?.length || 0})
                </h3>
                <button onClick={() => setShowParticipantsModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                  <X size={24} color="#3b4a5d" />
                </button>
              </div>

              <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {showParticipantsModal.participants?.map((p: any, idx: number) => (
                  <div
                    key={idx}
                    className='avatar-wrapper'
                    style={{ cursor: 'pointer', transition: 'background 0.15s', padding: '6px 8px', borderRadius: '14px' }}
                    onClick={() => {
                      const profile = getLiveDogProfile(p.name, language) || p;
                      setSelectedHostProfile(profile);
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    title={`${p.name} 프로필 보기`}
                  >
                    <img className="avatar-sm" src={getLiveDogAvatar(p.name, p.avatar)} alt={p.name} />
                    <div>
                      <div className="pName">{p.name} <span>({localizeBreed(p.breed, language)} / {p.age ? String(p.age).replace(/[^0-9]/g, '') : '1'}{t.profile?.dogAgeSuffix || '살'} / {p.gender === 'male' ? (t.common?.genderShortMale || '남') : (t.common?.genderShortFemale || '여')})</span></div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {localizePersonalityTags(p.personality || [], language).map((tag: string, i: number) => (
                          <span key={i} className='badge-hashtag'>
                            {tag.startsWith('#') ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setShowParticipantsModal(null)}
                style={{ width: '100%', background: '#F7FAFC', color: '#4A5568', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer', marginTop: '20px' }}
              >
                {t.community.btnClose}
              </button>
            </div>
          </div>
        )
      }
      {/* Multi-Pet Join Selection Modal (함께 산책 갈 반려견 선택) */}
      {joinPetSelectionMeetup && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.6)',
            zIndex: 10000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '20px',
            backdropFilter: 'blur(5px)'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setJoinPetSelectionMeetup(null);
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: '24px',
              padding: '24px',
              width: '100%',
              maxWidth: '360px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
              display: 'flex',
              flexDirection: 'column',
              position: 'relative'
            }}
          >
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#1E293B', fontWeight: 800 }}>
                  {t.community.selectPetTitle || '함께 산책 갈 반려견 선택'}
                </h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#64748B' }}>
                  {joinPetSelectionMeetup.title}
                </p>
              </div>
              <button
                onClick={() => setJoinPetSelectionMeetup(null)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: '16px', lineHeight: 1.4 }}>
              {t.community.selectPetDesc || '이번 모임에 함께 참여할 아이를 선택해주세요. (다중 선택 가능)'}
            </p>

            {/* Pet Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
              {myPets.map((pet: any) => {
                const petKey = pet.id || pet.name;
                const isSelected = selectedJoinPetIds.includes(petKey);
                return (
                  <div
                    key={petKey}
                    onClick={() => {
                      if (isSelected) {
                        if (selectedJoinPetIds.length === 1) {
                          alert(t.community.minOnePetAlert || '최소 1마리 이상의 반려견을 선택해주세요.');
                          return;
                        }
                        setSelectedJoinPetIds(selectedJoinPetIds.filter(id => id !== petKey));
                      } else {
                        setSelectedJoinPetIds([...selectedJoinPetIds, petKey]);
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: '16px',
                      border: isSelected ? '2px solid #FFB320' : '1.5px solid #E2E8F0',
                      background: isSelected ? '#FFFDF5' : '#FFFFFF',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={getLiveDogAvatar(pet.name, pet.avatar)}
                        alt={pet.name}
                        style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: isSelected ? '2px solid #FFB320' : '1px solid #E2E8F0' }}
                      />
                      <div>
                        <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#1E293B' }}>{pet.name}</div>
                        <div style={{ fontSize: '0.7rem', color: '#64748B' }}>
                          {pet.breed} · {pet.age}{t.profile?.dogAgeSuffix || '살'} {pet.gender === 'female' ? (t.common?.genderShortFemale || '여') : pet.gender === 'male' ? (t.common?.genderShortMale || '남') : ''}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        width: '24px',
                        height: '24px',
                        borderRadius: '50%',
                        background: isSelected ? '#FFB320' : '#E2E8F0',
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '0.8rem',
                        fontWeight: 800
                      }}
                    >
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick All / Single toggle */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                type="button"
                onClick={() => setSelectedJoinPetIds(myPets.map((p: any) => p.id || p.name))}
                style={{
                  flex: 1,
                  padding: '8px',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  background: selectedJoinPetIds.length === myPets.length ? '#FFF7E6' : '#F8FAFC',
                  color: selectedJoinPetIds.length === myPets.length ? '#D97706' : '#64748B',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {(t.community.allPetsBtn || '모든 반려견 ({count}마리 모두)').replace('{count}', String(myPets.length))}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={confirmJoinWithSelectedPets}
              disabled={selectedJoinPetIds.length === 0}
              style={{
                width: '100%',
                background: selectedJoinPetIds.length > 0 ? '#FFB320' : '#CBD5E1',
                color: '#FFFFFF',
                border: 'none',
                padding: '14px',
                borderRadius: '14px',
                fontSize: '0.98rem',
                fontWeight: 700,
                cursor: selectedJoinPetIds.length > 0 ? 'pointer' : 'not-allowed',
                boxShadow: selectedJoinPetIds.length > 0 ? '0 4px 12px rgba(255, 179, 32, 0.35)' : 'none'
              }}
            >
              {(t.community.btnJoinWithCount || '{count}마리 반려견과 함께 참여하기').replace('{count}', String(selectedJoinPetIds.length))}
            </button>
          </div>
        </div>
      )}

      {/* Meetup Chat Modal */}
      {activeChatMeetup && (
        <MeetupChatModal
          meetup={activeChatMeetup}
          onClose={() => setActiveChatMeetup(null)}
          language={language}
        />
      )}
    </div>
  );
};
