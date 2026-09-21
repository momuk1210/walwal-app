import React, { useState } from 'react';
import { Calendar, MapPin, Heart, MessageSquare, Plus, CheckCircle2, Navigation, X, Send, PawPrint, Crown, LogOut } from 'lucide-react';
import { MOCK_DOGS, getMockDogs } from '../data/mockDogs';
import { MeetupChatModal } from './MeetupChatModal';

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
}

const INITIAL_MEETUPS: WalkMeetup[] = [
  {
    id: 'm1',
    title: '🌙 서울숲 야간 킁킁 산책 번개',
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
    title: '🍞 웰시코기 & 숏다리 친구들 모여라!',
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
    title: '☁️ 쫄보 솜뭉치들의 조용한 힐링 산책',
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
    title: '🍂 가을맞이 시바견 정모 (종료)',
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
  const [meetups, setMeetups] = useState<WalkMeetup[]>(localizedMeetups);

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

  const [myDog] = useState(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0];
      }
    } catch (e) { }
    return getMockDogs("ko")[0];
  });

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
      participants: [myDog]
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
    setMeetups(prev =>
      prev.map(m => {
        if (m.id === id) {
          const nextJoined = !m.joined;
          let nextParticipants = m.participants ? [...m.participants] : [];
          if (nextJoined) {
            nextParticipants.push(myDog);
          } else {
            nextParticipants = nextParticipants.filter(p => p.name !== myDog.name);
          }
          return {
            ...m,
            joined: nextJoined,
            participantsCount: nextJoined ? m.participantsCount + 1 : m.participantsCount - 1,
            participants: nextParticipants
          };
        }
        return m;
      })
    );
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
          className="btn-primary"
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} strokeWidth={3} />
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
                  src={m.avatar}
                  alt={m.hostDog}
                  className="avatar-md"
                  style={{ cursor: 'pointer', border: '2px solid transparent', transition: 'border-color 0.2s' }}
                  onMouseOver={e => (e.currentTarget.style.borderColor = '#FFB320')}
                  onMouseOut={e => (e.currentTarget.style.borderColor = 'transparent')}
                  onClick={() => {
                    const profile = [myDog, ...getMockDogs("ko")].find(d => d.avatar === m.avatar);
                    if (profile) setSelectedHostProfile(profile);
                    else {
                      setSelectedHostProfile({
                        name: m.hostDog,
                        breed: '알 수 없음',
                        age: '비공개',
                        ownerName: m.hostOwner,
                        avatar: m.avatar,
                        personality: []
                      });
                    }
                  }}
                />
                <div className="host-info-wrapper"
                  onClick={() => {
                    if (!m.joined) {
                      alert('모임에 참가 신청 후 톡방에 입장할 수 있습니다. 🐾');
                      return;
                    }
                    setActiveChatMeetup(m);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <div className="row-between gap-12" style={{ alignItems: 'center', width: '100%' }}>
                    <span className="badge">{m.tag}</span>
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
                        src={p.avatar}
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
                style={{ background: m.status === 'past' ? '#CBD5E0' : undefined, cursor: m.status === 'past' ? 'not-allowed' : 'pointer', color: m.status === 'past' ? '#718096' : undefined, height: 'fit-content' }}
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
      {/* Host Profile Modal */}
      {
        selectedHostProfile && (
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
              maxWidth: '320px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              position: 'relative'
            }}>
              <button onClick={() => setSelectedHostProfile(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={24} color="#3b4a5d" />
              </button>
              <img src={selectedHostProfile.avatar} alt={selectedHostProfile.name} style={{ width: '100px', height: '100px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #FFB320', marginBottom: '16px' }} />
              <h3 style={{ margin: 0, fontSize: '1.4rem', color: '#2D3748', fontWeight: 800 }}>{selectedHostProfile.name}</h3>
              <p style={{ margin: '4px 0 16px 0', fontSize: '0.9rem', color: '#718096' }}>
                {selectedHostProfile.breed} {selectedHostProfile.age}{t.profile.dogAgeSuffix} {selectedHostProfile.gender === 'female' ? t.common?.genderShortFemale : selectedHostProfile.gender === 'male' ? t.common?.genderShortMale : ''} {selectedHostProfile.personality && selectedHostProfile.personality.length > 0 ? `(${selectedHostProfile.personality.join(' ')})` : ''}
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center', marginBottom: '20px' }}>
                {selectedHostProfile.personality.map((p: string, i: number) => (
                  <span key={i} style={{ background: '#FFF7E6', color: '#FFB320', padding: '6px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 700 }}>
                    {p}
                  </span>
                ))}
              </div>
              <button
                onClick={() => setSelectedHostProfile(null)}
                style={{ width: '100%', background: '#F7FAFC', color: '#4A5568', border: '1px solid #E2E8F0', padding: '12px', borderRadius: '12px', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' }}
              >
                {t.community.modalBtnClose}
              </button>
            </div>
          </div>
        )
      }
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
                  <div key={idx} className='avatar-wrapper' >
                    <img className="avatar-sm" src={p.avatar} alt={p.name} />
                    <div>
                      <div className="pName">{p.name} <span>({p.breed} / {p.age}{t.profile.dogAgeSuffix} / {p.gender === 'male' ? t.common?.genderShortMale : p.gender === 'female' ? t.common?.genderShortFemale : ''})</span></div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                        {p.personality?.map((tag: string, i: number) => (
                          <span key={i} className='tag-hashtag'>
                            {tag}
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
      {/* Meetup Chat Modal */}
      {
        activeChatMeetup && (
          <MeetupChatModal
            meetup={activeChatMeetup}
            onClose={() => setActiveChatMeetup(null)}
          />
        )
      }
    </div >
  );
};
