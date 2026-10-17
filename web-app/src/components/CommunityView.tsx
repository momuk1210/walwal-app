import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, MapPin, Heart, MessageSquare, Plus, CheckCircle2, Navigation, X, Send, PawPrint, Crown, LogOut, MoreVertical, Edit3, Trash2, ChevronDown, RotateCcw, Sparkles, Filter, Check, SlidersHorizontal, Menu, ShieldAlert, Flag, Clock, Flame, Play, Pause, Square, ChevronRight, ArrowLeft } from 'lucide-react';
import { DogProfile, MOCK_DOGS, getMockDogs, isSameDogName, getDefaultDogAvatar, normalizeDogProfile, getLiveDogAvatar, getLiveDogProfile, localizeBreed, localizePersonalityTags, localizeDogName, sanitizePetList } from '../data/mockDogs';
import { MeetupChatModal } from './MeetupChatModal';
import { DogProfileModal } from './DogProfileModal';
import { ReportModal, ReportModalTarget } from './ReportModal';
import { WalkHistoryModal } from './WalkHistoryModal';
import {
  ActiveWalkSession,
  getActiveWalkSession,
  startWalk,
  pauseWalk,
  resumeWalk,
  stopWalk,
  addSimulatedWalkDistance,
  isDogInActiveSession
} from '../services/walkTrackerService';
import { isUserBlocked, blockUser } from '../services/moderationService';
import { validateUserContent } from '../utils/profanityFilter';
import { useTranslation } from '../i18n/LanguageContext';
import { auth, db } from '../firebase';
import { deleteDoc, doc, collection, onSnapshot } from 'firebase/firestore';
import { syncMeetupToFirestore } from '../services/db';
import { formatMeetupDisplay, extractMeetupDateTime, getMeetupDynamicStatus } from '../utils/meetupTime';
import '../styles/CommunityView.css';

export interface WalkMeetup {
  id: string;
  title: string;
  location: string;
  lat: number;
  lng: number;
  creatorEmail?: string;
  creatorId?: string;
  time: string;
  date?: string;
  dateTime?: string;
  timeStr?: string;
  createdAt?: number;
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
  isCustomEdited?: boolean;
}

const INITIAL_MEETUPS: WalkMeetup[] = [];

interface CommunityViewProps {
}

const getTodayDateStr = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const formatMeetupDateTime = (dateStr: string, timeStr: string, lang: string = 'ko'): string => {
  if (!dateStr && !timeStr) return '';
  if (!timeStr) return dateStr;
  if (!dateStr) return timeStr;

  try {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);

    const now = new Date();
    const isToday = now.getFullYear() === year && now.getMonth() === month - 1 && now.getDate() === day;

    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    const isTomorrow = tomorrow.getFullYear() === year && tomorrow.getMonth() === month - 1 && tomorrow.getDate() === day;

    const displayHour = hours % 12 === 0 ? 12 : hours % 12;

    let timeFormatted = '';
    if (lang === 'en') {
      const ampm = hours < 12 ? 'AM' : 'PM';
      timeFormatted = minutes === 0 ? `${displayHour} ${ampm}` : `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
    } else if (lang === 'ja') {
      const ampm = hours < 12 ? '午前' : '午後';
      timeFormatted = minutes === 0 ? `${ampm}${displayHour}時` : `${ampm}${displayHour}時${minutes}分`;
    } else if (lang === 'es') {
      const ampm = hours < 12 ? 'AM' : 'PM';
      timeFormatted = minutes === 0 ? `${displayHour} ${ampm}` : `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
    } else {
      const ampm = hours < 12 ? '오전' : '오후';
      const minStr = minutes === 0 ? '' : ` ${minutes}분`;
      timeFormatted = `${ampm} ${displayHour}시${minStr}`;
    }

    if (isToday) {
      if (lang === 'en') return `Today ${timeFormatted}`;
      if (lang === 'ja') return `今日 ${timeFormatted}`;
      if (lang === 'es') return `Hoy ${timeFormatted}`;
      return `오늘 ${timeFormatted}`;
    }
    if (isTomorrow) {
      if (lang === 'en') return `Tomorrow ${timeFormatted}`;
      if (lang === 'ja') return `明日 ${timeFormatted}`;
      if (lang === 'es') return `Mañana ${timeFormatted}`;
      return `내일 ${timeFormatted}`;
    }

    const targetDate = new Date(year, month - 1, day);
    const dayOfWeek = targetDate.getDay();

    if (lang === 'en') {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[month - 1]} ${day} (${dayNames[dayOfWeek]}) ${timeFormatted}`;
    }
    if (lang === 'ja') {
      const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
      return `${month}月${day}日 (${dayNames[dayOfWeek]}) ${timeFormatted}`;
    }
    if (lang === 'es') {
      const dayNames = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
      const monthNames = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
      return `${day} ${monthNames[month - 1]} (${dayNames[dayOfWeek]}) ${timeFormatted}`;
    }

    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    return `${month}월 ${day}일 (${dayNames[dayOfWeek]}) ${timeFormatted}`;
  } catch (e) {
    return `${dateStr} ${timeStr}`;
  }
};

export const normalizeHostOwnerName = (ownerName: string, lang: string = 'ko'): string => {
  if (!ownerName) return '';
  let cleaned = ownerName.replace(/맘/g, '엄마');
  if (lang === 'ko') {
    return cleaned
      .replace(/ママ/g, '엄마')
      .replace(/パパ/g, '아빠')
      .replace(/Mom/ig, '엄마')
      .replace(/Dad/ig, '아빠')
      .replace(/Strawberry/ig, '딸기')
      .replace(/イチゴ/g, '딸기');
  } else if (lang === 'ja') {
    return cleaned
      .replace(/엄마/g, 'ママ')
      .replace(/아빠/g, 'パパ')
      .replace(/Mom/ig, 'ママ')
      .replace(/Dad/ig, 'パパ')
      .replace(/Strawberry/ig, '딸기');
  } else if (lang === 'en') {
    return cleaned
      .replace(/엄마/g, 'Mom')
      .replace(/아빠/g, 'Dad')
      .replace(/ママ/g, 'Mom')
      .replace(/パパ/g, 'Dad')
      .replace(/Strawberry/ig, '딸기');
  }
  return cleaned;
};

const parseMeetupDateTime = (timeText: string): { date: string; time: string } => {
  const todayStr = getTodayDateStr();
  if (!timeText) {
    return { date: todayStr, time: '15:00' };
  }

  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const lowerText = timeText.toLowerCase().trim();

  let date = todayStr;
  if (timeText.includes('내일') || lowerText.includes('tomorrow') || timeText.includes('明日') || lowerText.includes('mañana')) {
    const tm = new Date(now);
    tm.setDate(now.getDate() + 1);
    date = `${tm.getFullYear()}-${pad(tm.getMonth() + 1)}-${pad(tm.getDate())}`;
  } else if (timeText.includes('오늘') || lowerText.includes('today') || timeText.includes('今日') || lowerText.includes('hoy')) {
    date = todayStr;
  } else {
    const fullDateMatch = timeText.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (fullDateMatch) {
      date = `${fullDateMatch[1]}-${pad(Number(fullDateMatch[2]))}-${pad(Number(fullDateMatch[3]))}`;
    } else {
      const monthDayMatch = timeText.match(/(\d{1,2})[월月\/\.-]\s*(\d{1,2})[일日]?/);
      if (monthDayMatch) {
        const m = pad(Number(monthDayMatch[1]));
        const d = pad(Number(monthDayMatch[2]));
        date = `${now.getFullYear()}-${m}-${d}`;
      } else {
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const esMonths = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
        let matchedMonthIdx = -1;
        for (let i = 0; i < 12; i++) {
          if (lowerText.includes(monthNames[i]) || lowerText.includes(esMonths[i])) {
            matchedMonthIdx = i;
            break;
          }
        }
        if (matchedMonthIdx !== -1) {
          const dayMatch = timeText.match(/\b(\d{1,2})\b/);
          if (dayMatch) {
            date = `${now.getFullYear()}-${pad(matchedMonthIdx + 1)}-${pad(Number(dayMatch[1]))}`;
          }
        }
      }
    }
  }

  let hours = 15;
  let minutes = 0;
  const pmMatch = lowerText.includes('오후') || lowerText.includes('저녁') || lowerText.includes('밤') || lowerText.includes('pm') || lowerText.includes('午後');
  const amMatch = lowerText.includes('오전') || lowerText.includes('아침') || lowerText.includes('새벽') || lowerText.includes('am') || lowerText.includes('午前');

  const colonMatch = timeText.match(/(\d{1,2}):(\d{2})/);
  if (colonMatch) {
    hours = parseInt(colonMatch[1], 10);
    minutes = parseInt(colonMatch[2], 10);
    if (pmMatch && hours < 12) hours += 12;
    if (amMatch && hours === 12) hours = 0;
  } else {
    const hourMatch = timeText.match(/(\d{1,2})\s*(시|時|h|pm|am)/i) || timeText.match(/\b(\d{1,2})\s*(?:pm|am)\b/i);
    const minMatch = timeText.match(/(\d{1,2})\s*(분|m|min)/i);
    if (hourMatch) {
      hours = parseInt(hourMatch[1], 10);
      if (pmMatch && hours < 12) hours += 12;
      if (amMatch && hours === 12) hours = 0;
      if (minMatch) minutes = parseInt(minMatch[1], 10);
    }
  }

  return {
    date,
    time: `${pad(hours)}:${pad(minutes)}`
  };
};

export const CommunityView: React.FC<CommunityViewProps> = () => {
  const { t, language } = useTranslation();
  const filterT = (t.community as any)?.filters || {};

  // Use dynamically translated mock data
  const localizedMeetups: WalkMeetup[] = [];

  // Initialize or sync with language changes
  const [meetups, setMeetups] = useState<WalkMeetup[]>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_MEETUPS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const filtered = parsed.filter(m => {
            // Remove mock data from user's cache
            if (!m.id) return false;
            if (['m1', 'm2', 'm3', 'm4'].includes(m.id)) return false;
            if (m.title && (m.title.includes('웰시코기') || m.title.includes('쫄보') || m.title.includes('정기 건강 산책') || m.title.includes('서울숲'))) return false;
            return true;
          });
          return filtered.map((m: WalkMeetup) => {
            let cleanedHostOwner = normalizeHostOwnerName(m.hostOwner, language);
            let cleanedHostDog = m.hostDog;
            if (cleanedHostDog) cleanedHostDog = localizeDogName(cleanedHostDog, language);
            if (m.id === 'm1' || m.hostDog === '보리') {
              return { ...m, hostOwner: language === 'ko' ? '보리 엄마' : 'Bori Mom' };
            }
            const cleanedParticipants = (m.participants || []).map((p: any) => ({
              ...p,
              name: localizeDogName(p.name, language),
              breed: localizeBreed(p.breed, language)
            }));
            return { ...m, hostOwner: cleanedHostOwner, hostDog: cleanedHostDog, participants: cleanedParticipants };
          });
        }
      }
    } catch (e) { }
    return localizedMeetups;
  });

  // Save to localStorage and Firestore whenever meetups change
  React.useEffect(() => {
    localStorage.setItem('WALWAL_MEETUPS', JSON.stringify(meetups));
    if (meetups && meetups.length > 0) {
      meetups.forEach(m => {
        syncMeetupToFirestore(m);
      });
    }
  }, [meetups]);

  // Two-way sync with Firestore meetups collection
  React.useEffect(() => {
    const unsub = onSnapshot(collection(db, 'meetups'), (snapshot) => {
      if (snapshot.empty) return;
      const remoteList: WalkMeetup[] = [];
      snapshot.forEach(docSnap => {
        remoteList.push({ id: docSnap.id, ...docSnap.data() } as WalkMeetup);
      });
      setMeetups(prev => {
        const map = new Map<string, WalkMeetup>();
        prev.forEach(m => {
          if (m.id && !['m1', 'm2', 'm3', 'm4'].includes(m.id)) {
            map.set(m.id, m);
          }
        });
        let hasChanges = false;
        remoteList.forEach(rm => {
          if (rm.id && !['m1', 'm2', 'm3', 'm4'].includes(rm.id)) {
            if (!map.has(rm.id)) {
              map.set(rm.id, rm);
              hasChanges = true;
            }
          }
        });
        if (!hasChanges) return prev;
        return Array.from(map.values());
      });
    }, (err) => {
      console.warn('Community meetups onSnapshot error:', err);
    });
    return () => unsub();
  }, []);

  // Sync loaded meetups when language changes
  React.useEffect(() => {
    setMeetups(prev => prev.map(m => {
      let cleanedHostOwner = normalizeHostOwnerName(m.hostOwner, language);
      let cleanedHostDog = m.hostDog ? localizeDogName(m.hostDog, language) : m.hostDog;
      const cleanedParticipants = (m.participants || []).map((p: any) => ({
        ...p,
        name: localizeDogName(p.name, language),
        breed: localizeBreed(p.breed, language)
      }));
      return { ...m, hostOwner: cleanedHostOwner, hostDog: cleanedHostDog, participants: cleanedParticipants };
    }));
  }, [language]);

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedHostProfile, setSelectedHostProfile] = useState<any>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formLocation, setFormLocation] = useState('');
  const [formDate, setFormDate] = useState(() => getTodayDateStr());
  const [formTimeStr, setFormTimeStr] = useState('15:00');
  const [formTag, setFormTag] = useState('');
  const [formMax, setFormMax] = useState<number>(5);

  const [meetupStatusFilter, setMeetupStatusFilter] = useState<'all' | 'joined'>('all');
  const [openOnly, setOpenOnly] = useState<boolean>(false);
  const [dogSize, setDogSize] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [walkStyle, setWalkStyle] = useState<'all' | 'free' | 'training' | 'sniff' | 'shy'>('all');
  const [distanceFilter, setDistanceFilter] = useState<'all' | 'neighborhood' | 'nearby'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'weekend' | 'custom'>('all');
  const [customDate, setCustomDate] = useState<string>('');
  const [timeSlotFilter, setTimeSlotFilter] = useState<'all' | 'morning' | 'day' | 'night'>('all');
  const [myDogMatch, setMyDogMatch] = useState<boolean>(false);
  const [activeDropdown, setActiveDropdown] = useState<'dogSize' | 'walkStyle' | 'date' | null>(null);

  // Filter Modal State & Draft values
  const [showFilterModal, setShowFilterModal] = useState<boolean>(false);
  const [draftOpenOnly, setDraftOpenOnly] = useState<boolean>(false);
  const [draftDogSize, setDraftDogSize] = useState<'all' | 'small' | 'medium' | 'large'>('all');
  const [draftWalkStyle, setDraftWalkStyle] = useState<'all' | 'free' | 'training' | 'sniff' | 'shy'>('all');
  const [draftDistanceFilter, setDraftDistanceFilter] = useState<'all' | 'neighborhood' | 'nearby'>('all');
  const [draftDateFilter, setDraftDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'weekend' | 'custom'>('all');
  const [draftCustomDate, setDraftCustomDate] = useState<string>('');
  const [draftTimeSlotFilter, setDraftTimeSlotFilter] = useState<'all' | 'morning' | 'day' | 'night'>('all');
  const [draftMyDogMatch, setDraftMyDogMatch] = useState<boolean>(false);

  const openFilterModal = () => {
    setDraftOpenOnly(openOnly);
    setDraftDogSize(dogSize);
    setDraftWalkStyle(walkStyle);
    setDraftDistanceFilter(distanceFilter);
    setDraftDateFilter(dateFilter);
    setDraftCustomDate(customDate || getTodayDateStr());
    setDraftTimeSlotFilter(timeSlotFilter);
    setDraftMyDogMatch(myDogMatch);
    setShowFilterModal(true);
  };

  const applyFilterModal = () => {
    setOpenOnly(draftOpenOnly);
    setDogSize(draftDogSize);
    setWalkStyle(draftWalkStyle);
    setDistanceFilter(draftDistanceFilter);
    setDateFilter(draftDateFilter);
    setCustomDate(draftCustomDate);
    setTimeSlotFilter(draftTimeSlotFilter);
    setMyDogMatch(draftMyDogMatch);
    setShowFilterModal(false);
  };

  const resetDraftFilters = () => {
    setDraftOpenOnly(false);
    setDraftDogSize('all');
    setDraftWalkStyle('all');
    setDraftDistanceFilter('all');
    setDraftDateFilter('all');
    setDraftCustomDate('');
    setDraftTimeSlotFilter('all');
    setDraftMyDogMatch(false);
  };

  const hasActiveFilters = openOnly || dogSize !== 'all' || walkStyle !== 'all' || distanceFilter !== 'all' || dateFilter !== 'all' || timeSlotFilter !== 'all' || myDogMatch;

  const resetAllFilters = () => {
    setOpenOnly(false);
    setDogSize('all');
    setWalkStyle('all');
    setDistanceFilter('all');
    setDateFilter('all');
    setCustomDate('');
    setTimeSlotFilter('all');
    setMyDogMatch(false);
    setActiveDropdown(null);
  };

  const [showParticipantsModal, setShowParticipantsModal] = useState<WalkMeetup | null>(null);
  const [activeChatMeetup, setActiveChatMeetup] = useState<WalkMeetup | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportModalTarget | null>(null);
  const [petVersion, setPetVersion] = useState(0);
  const [blockedVersion, setBlockedVersion] = useState(0);

  useEffect(() => {
    const handlePetUpdate = () => setPetVersion(v => v + 1);
    const handleBlockedUpdate = () => setBlockedVersion(v => v + 1);
    window.addEventListener('walwal_pets_updated', handlePetUpdate);
    window.addEventListener('walwal_blocked_users_updated', handleBlockedUpdate);
    window.addEventListener('storage', handlePetUpdate);
    return () => {
      window.removeEventListener('walwal_pets_updated', handlePetUpdate);
      window.removeEventListener('walwal_blocked_users_updated', handleBlockedUpdate);
      window.removeEventListener('storage', handlePetUpdate);
    };
  }, []);

  // 내 전체 반려견 목록 (다견 지원 - 등록된 반려견이 없으면 빈 배열)
  const myPets = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizePetList(parsed, language);
        }
      }
    } catch (e) { }
    return [];
  }, [language, petVersion]);

  const myDog = myPets[0] || null;

  // 실시간 산책 트래커 연동 상태
  const [activeSession, setActiveSession] = useState<ActiveWalkSession | null>(() => getActiveWalkSession());
  const [selectedWalkDogIds, setSelectedWalkDogIds] = useState<string[]>(() => myPets.map(p => p.id || p.name));
  const [showWalkHistoryModal, setShowWalkHistoryModal] = useState<boolean>(false);
  const [walkHistoryTab, setWalkHistoryTab] = useState<'distance' | 'time'>('distance');

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setActiveSession(e.detail ? { ...e.detail } : getActiveWalkSession());
    };
    const handleStarted = (e: any) => {
      setActiveSession(e.detail ? { ...e.detail } : getActiveWalkSession());
    };
    const handleStopped = () => {
      setActiveSession(null);
    };

    window.addEventListener('walwal_walk_tracker_update', handleUpdate);
    window.addEventListener('walwal_walk_tracker_started', handleStarted);
    window.addEventListener('walwal_walk_tracker_stopped', handleStopped);

    return () => {
      window.removeEventListener('walwal_walk_tracker_update', handleUpdate);
      window.removeEventListener('walwal_walk_tracker_started', handleStarted);
      window.removeEventListener('walwal_walk_tracker_stopped', handleStopped);
    };
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isAllDogsSelected = myPets.length > 0 && selectedWalkDogIds.length === myPets.length;

  const handleToggleDog = (dogKey: string) => {
    setSelectedWalkDogIds(prev => {
      if (prev.includes(dogKey)) {
        return prev.filter(k => k !== dogKey);
      } else {
        return [...prev, dogKey];
      }
    });
  };

  const handleToggleAllDogs = () => {
    const allKeys = myPets.map(p => p.id || p.name);
    if (selectedWalkDogIds.length === allKeys.length) {
      setSelectedWalkDogIds([]);
    } else {
      setSelectedWalkDogIds(allKeys);
    }
  };

  const targetWalkDog = React.useMemo(() => {
    const found = myPets.find(p => selectedWalkDogIds.includes(p.id || p.name));
    return found || myDog;
  }, [selectedWalkDogIds, myPets, myDog]);

  const getTargetDogsToStart = (): DogProfile[] => {
    const selected = myPets.filter(p => selectedWalkDogIds.includes(p.id || p.name));
    return selected.length > 0 ? selected : myPets;
  };

  const getLiveDogAvatar = (name?: string, fallbackAvatar?: string): string => {
    if (!name) return fallbackAvatar || '';
    const myPet = myPets.find(p => isSameDogName(p.name, name));
    if (myPet?.avatar) return myPet.avatar;
    return fallbackAvatar || getDefaultDogAvatar(name);
  };

  const isMeetupClosed = (m: WalkMeetup): boolean => {
    if (m.status === 'past') return true;
    try {
      const now = new Date();
      const { targetDate } = extractMeetupDateTime(m);
      // 모임 시작 후 2시간 경과 시 마감 처리
      if (now.getTime() > targetDate.getTime() + 2 * 60 * 60 * 1000) {
        return true;
      }
    } catch (e) { }

    const timeStr = (m.time || '').trim().toLowerCase();
    if (timeStr.includes('지난') || timeStr.includes('종료') || timeStr.includes('마감') || timeStr.includes('past') || timeStr.includes('closed') || timeStr.includes('締切') || timeStr.includes('cerrado')) {
      return true;
    }

    return false;
  };

  const isUserHost = (m: WalkMeetup): boolean => {
    const currentEmail = (auth?.currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '').toLowerCase().trim();
    const currentUid = auth?.currentUser?.uid || '';

    // 1. 작성자 계정(이메일 또는 UID)이 명시적으로 일치하는 경우
    if (m.creatorEmail && currentEmail && m.creatorEmail.toLowerCase().trim() === currentEmail) {
      return true;
    }
    if (m.creatorId && currentUid && m.creatorId === currentUid) {
      return true;
    }

    // 2. 등록된 내 반려견이 아예 없는 계정은 절대 타인 모임의 호스트가 될 수 없음
    if (!myPets || myPets.length === 0) {
      return false;
    }

    // 3. 내 실제 등록된 반려견과 매칭되는지 확인
    const isDogMatched = myPets.some(p => isSameDogName(p.name, m.hostDog) || (p.ownerName && p.ownerName === m.hostOwner));
    if (isDogMatched) {
      // 시스템 기본 모임(보리, 딸기 등)은 daisynara 관리자/개발자 계정만 호스트로 인정
      if (isSameDogName(m.hostDog, '보리') || isSameDogName(m.hostDog, 'Bori') || isSameDogName(m.hostDog, '딸기') || isSameDogName(m.hostDog, 'Strawberry')) {
        return currentEmail.includes('daisynara');
      }
      return true;
    }

    return false;
  };

  // 모임 참가 여부 엄격 검증 (호스트이거나, 등록된 내 반려견이 실제 참가자 목록에 포함된 경우만)
  const isUserJoined = (m: WalkMeetup): boolean => {
    if (isUserHost(m)) return true;
    if (!myPets || myPets.length === 0) return false;
    const myPetKeys = new Set(myPets.map(p => (p.id || p.name).toLowerCase()));
    if (m.joinedPetIds && m.joinedPetIds.some(id => myPetKeys.has(id.toLowerCase()))) return true;
    if (m.userJoinedPets && m.userJoinedPets.some(p => myPetKeys.has((p.id || p.name).toLowerCase()))) return true;
    if (m.participants && m.participants.some(p => myPetKeys.has((p.name || '').toLowerCase()))) return true;
    return false;
  };

  // 모임 톡방 입장 핸들러 (참가하지 않았거나 마감된 모임 입장 가드)
  const handleEnterChat = (m: WalkMeetup) => {
    const isClosed = isMeetupClosed(m);
    const joined = isUserJoined(m);

    if (!joined) {
      if (isClosed) {
        alert(language === 'ko' ? '마감된 모임입니다. 참가자만 톡방에 입장할 수 있습니다.' : 'This meetup is closed. Only participants can enter the chat room.');
      } else {
        alert(t.community?.joinReqBeforeChat || (language === 'ko' ? '모임에 먼저 참가 신청을 해야 톡방에 입장할 수 있습니다.' : 'Please join the meetup first to enter the chat room.'));
      }
      return;
    }

    setMeetups(prev => prev.map(item => item.id === m.id ? { ...item, unreadCount: 0 } : item));
    setActiveChatMeetup({ ...m, unreadCount: 0 });
  };

  // 모임 정보 수정 상태
  const [editingMeetup, setEditingMeetup] = useState<WalkMeetup | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editDate, setEditDate] = useState(() => getTodayDateStr());
  const [editTimeStr, setEditTimeStr] = useState('15:00');
  const [editTag, setEditTag] = useState('');
  const [editMax, setEditMax] = useState<number>(5);
  const [selectedEditPetIds, setSelectedEditPetIds] = useState<string[]>([]);

  const openEditModal = (meetup: WalkMeetup) => {
    const parsed = parseMeetupDateTime(meetup.time);
    setEditingMeetup(meetup);
    setEditTitle(meetup.title);
    setEditLocation(meetup.location);
    setEditDate(parsed.date);
    setEditTimeStr(parsed.time);
    setEditTag(meetup.tag || '');
    setEditTag(meetup.tag || '');
    setEditMax(meetup.maxParticipants || 5);

    const initialPets = meetup.joinedPetIds || [];
    setSelectedEditPetIds(initialPets.length > 0 ? initialPets : (myPets.length > 0 ? [myPets[0].id || myPets[0].name] : []));
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeetup || !editTitle.trim() || !editLocation.trim() || !editDate || !editTimeStr) return;

    const validTitle = validateUserContent(editTitle);
    if (!validTitle.isValid) {
      alert(validTitle.message);
      return;
    }
    const validLoc = validateUserContent(editLocation);
    if (!validLoc.isValid) {
      alert(validLoc.message);
      return;
    }

    const formattedTime = formatMeetupDateTime(editDate, editTimeStr, language);

    const selectedPets = myPets.filter(p => selectedEditPetIds.includes(p.id || p.name));
    if (selectedPets.length === 0) return;

    const hostDogName = selectedPets.map(p => p.name).join(language === 'en' ? ', ' : ', ');
    const firstOwner = selectedPets[0].ownerName || `${selectedPets[0].name} ${language === 'ko' ? '엄마' : language === 'ja' ? 'ママ' : 'Mom'}`;

    let ownerSuffix = language === 'ko' ? '엄마' : language === 'ja' ? 'ママ' : 'Mom';
    const lowerOwner = firstOwner.toLowerCase();
    if (lowerOwner.includes('papa') || lowerOwner.includes('dad') || firstOwner.includes('아빠') || firstOwner.includes('パパ')) {
      ownerSuffix = language === 'ko' ? '아빠' : language === 'ja' ? 'パパ' : 'Dad';
    } else if (lowerOwner.includes('mom') || firstOwner.includes('엄마') || firstOwner.includes('맘') || firstOwner.includes('ママ')) {
      ownerSuffix = language === 'ko' ? '엄마' : language === 'ja' ? 'ママ' : 'Mom';
    } else if (firstOwner.includes('형')) ownerSuffix = '형';
    else if (firstOwner.includes('누나')) ownerSuffix = '누나';
    else if (firstOwner.includes('언니')) ownerSuffix = '언니';
    else if (firstOwner.includes('오빠')) ownerSuffix = '오빠';
    else {
      const parts = firstOwner.split(' ');
      if (parts.length > 1) ownerSuffix = parts[parts.length - 1];
    }

    const hostOwnerName = `${hostDogName} ${ownerSuffix}`;

    setMeetups(prev => prev.map(m => {
      if (m.id === editingMeetup.id) {
        const prevHostPetsCount = m.userJoinedPets?.length || 1;
        const otherParticipants = (m.participants || []).filter(p => !m.userJoinedPets?.some(up => (up.id || up.name) === (p.id || p.name)));
        const nextParticipants = [...otherParticipants, ...selectedPets];
        const nextParticipantsCount = m.participantsCount - prevHostPetsCount + selectedPets.length;

        return {
          ...m,
          title: editTitle.trim(),
          location: editLocation.trim(),
          time: formattedTime,
          tag: editTag.trim() || '#자유모임',
          maxParticipants: editMax,
          hostDog: hostDogName,
          hostOwner: hostOwnerName,
          avatar: selectedPets[0].avatar,
          participantsCount: nextParticipantsCount,
          userJoinedPets: selectedPets,
          joinedPetIds: selectedEditPetIds,
          participants: nextParticipants,
          isCustomEdited: true
        };
      }
      return m;
    }));

    if (activeChatMeetup && activeChatMeetup.id === editingMeetup.id) {
      setActiveChatMeetup(prev => prev ? ({
        ...prev,
        title: editTitle.trim(),
        location: editLocation.trim(),
        time: formattedTime,
        tag: editTag.trim() || '#자유모임',
        maxParticipants: editMax,
        isCustomEdited: true
      }) : null);
    }

    setEditingMeetup(null);
  };

  // 모임 드롭다운 메뉴 상태
  const [activeMenuMeetupId, setActiveMenuMeetupId] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.meetup-menu-wrapper')) {
        setActiveMenuMeetupId(null);
      }
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleDeleteMeetup = (id: string) => {
    if (window.confirm(t.community?.deleteConfirm || '정말로 이 산책 모임을 삭제하시겠습니까?')) {
      setMeetups(prev => prev.filter(m => m.id !== id));
      deleteDoc(doc(db, 'meetups', id)).catch(() => { });
      if (activeChatMeetup && activeChatMeetup.id === id) {
        setActiveChatMeetup(null);
      }
      setActiveMenuMeetupId(null);
    }
  };

  // 다견 산책 참여 선택 모달 상태
  const [joinPetSelectionMeetup, setJoinPetSelectionMeetup] = useState<WalkMeetup | null>(null);
  const [selectedJoinPetIds, setSelectedJoinPetIds] = useState<string[]>([]);
  const [selectedCreatePetIds, setSelectedCreatePetIds] = useState<string[]>([]);

  const openCreateModal = () => {
    if (!myPets || myPets.length === 0) {
      const msg = language === 'ko'
        ? '산책 모임 개설은 등록된 반려견이 있을 경우에만 이용할 수 있습니다.\n반려견 등록 페이지로 이동합니다.'
        : language === 'ja'
          ? 'お散歩の集まりを作成するには、登録された愛犬が必要です。\n愛犬登録ページへ移動します。'
          : language === 'es'
            ? 'Para crear un encuentro debes tener un perro registrado.\nRedirigiendo a la página de registro.'
            : language === 'zh'
              ? '创建散步聚会需要已登记的宠物。\n即将前往宠物登记页面。'
              : language === 'fr'
                ? 'Pour créer une rencontre, un chien enregistré est requis.\nRedirection vers la page d\'inscription.'
                : 'Please register a pet before creating a walk meetup.\nRedirecting to pet registration page.';
      alert(msg);
      window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'profile' }));
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('walwal_open_pet_register'));
      }, 150);
      return;
    }
    setSelectedCreatePetIds([myPets[0].id || myPets[0].name]);
    setShowCreateModal(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formLocation || !formDate || !formTimeStr) return;

    const validTitle = validateUserContent(formTitle);
    if (!validTitle.isValid) {
      alert(validTitle.message);
      return;
    }
    const validLoc = validateUserContent(formLocation);
    if (!validLoc.isValid) {
      alert(validLoc.message);
      return;
    }

    const formattedTime = formatMeetupDateTime(formDate, formTimeStr, language);

    const selectedPets = myPets.filter(p => selectedCreatePetIds.includes(p.id || p.name));
    if (selectedPets.length === 0) return;

    const hostDogName = selectedPets.map(p => p.name).join(language === 'en' ? ', ' : ', ');
    const firstOwner = selectedPets[0].ownerName || `${selectedPets[0].name} ${language === 'ko' ? '엄마' : language === 'ja' ? 'ママ' : 'Mom'}`;

    let ownerSuffix = language === 'ko' ? '엄마' : language === 'ja' ? 'ママ' : 'Mom';
    const lowerOwner = firstOwner.toLowerCase();
    if (lowerOwner.includes('papa') || lowerOwner.includes('dad') || firstOwner.includes('아빠') || firstOwner.includes('パパ')) {
      ownerSuffix = language === 'ko' ? '아빠' : language === 'ja' ? 'パパ' : 'Dad';
    } else if (lowerOwner.includes('mom') || firstOwner.includes('엄마') || firstOwner.includes('맘') || firstOwner.includes('ママ')) {
      ownerSuffix = language === 'ko' ? '엄마' : language === 'ja' ? 'ママ' : 'Mom';
    } else if (firstOwner.includes('형')) ownerSuffix = '형';
    else if (firstOwner.includes('누나')) ownerSuffix = '누나';
    else if (firstOwner.includes('언니')) ownerSuffix = '언니';
    else if (firstOwner.includes('오빠')) ownerSuffix = '오빠';
    else {
      const parts = firstOwner.split(' ');
      if (parts.length > 1) ownerSuffix = parts[parts.length - 1];
    }

    const hostOwnerName = `${hostDogName} ${ownerSuffix}`;

    const nowTimestamp = Date.now();
    const currentEmail = (auth?.currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '').toLowerCase().trim();
    const currentUid = auth?.currentUser?.uid || '';

    const newMeetup: WalkMeetup = {
      id: `m_${nowTimestamp}`,
      title: formTitle,
      location: formLocation,
      lat: 37.5445,
      lng: 127.0374,
      creatorEmail: currentEmail,
      creatorId: currentUid,
      date: formDate,
      timeStr: formTimeStr,
      dateTime: `${formDate}T${formTimeStr}:00`,
      createdAt: nowTimestamp,
      time: formattedTime,
      hostDog: hostDogName,
      hostOwner: hostOwnerName,
      avatar: selectedPets[0].avatar,
      participantsCount: selectedPets.length,
      maxParticipants: formMax,
      tag: formTag || '#자유모임',
      joined: true,
      status: 'upcoming',
      participants: selectedPets,
      userJoinedPets: selectedPets,
      joinedPetIds: selectedCreatePetIds,
      isCustomEdited: true
    };

    setMeetups([newMeetup, ...meetups]);
    setShowCreateModal(false);

    setFormTitle('');
    setFormLocation('');
    setFormDate(getTodayDateStr());
    setFormTimeStr('15:00');
    setFormTag('');
    setFormMax(5);
  };

  // Sync when language changes
  React.useEffect(() => {
    setMeetups(prev => prev.map(m => {
      if (m.isCustomEdited) return m;
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
    if (!targetMeetup || isMeetupClosed(targetMeetup)) return;

    if (isUserHost(targetMeetup)) {
      alert('모임장은 모임에서 나갈 수 없습니다. 모임을 종료하거나 삭제하려면 우측 상단 메뉴(⋮)에서 삭제해주세요.');
      return;
    }

    // 이미 참여한 모임이면 -> 취소 처리
    if (isUserJoined(targetMeetup)) {
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

    // 반려견이 0마리인 경우 -> 참여 불가 안내
    if (myPets.length === 0 || !myDog) {
      alert(language === 'ko' ? '반려견을 등록한 후 산책 모임에 참가할 수 있습니다.' : 'Please register a pet before joining a meetup.');
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

    import('../utils/notificationService').then(({ sendPushNotification }) => {
      sendPushNotification({
        title: `[WalWal 산책] 참가 완료!`,
        body: `'${targetMeetup.title}' 모임 참여가 확정되었습니다.`,
        data: { meetupId: targetMeetup.id }
      });
    });
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

    const meetupTitle = joinPetSelectionMeetup.title;
    const meetupId = joinPetSelectionMeetup.id;
    setJoinPetSelectionMeetup(null);

    import('../utils/notificationService').then(({ sendPushNotification }) => {
      sendPushNotification({
        title: `[WalWal 산책] ${chosenDogs.length}마리 참가 완료!`,
        body: `'${meetupTitle}' 모임 참여가 확정되었습니다.`,
        data: { meetupId }
      });
    });
  };

  const handleLocationClick = (m: WalkMeetup) => {
    if (!m.location) return;
    const query = encodeURIComponent(m.location);

    // 1. 캐시된 사용자 최근 좌표 확인
    let coords: { lat: number; lng: number } | null = null;
    try {
      const saved = localStorage.getItem('WALWAL_LAST_COORDS');
      if (saved) coords = JSON.parse(saved);
    } catch (e) { }

    const openMap = (lat?: number, lng?: number) => {
      // 내 현재 위치 좌표가 있으면 구글맵 중심(@lat,lng,14z)을 잡아 내 위치에서 가장 가까운 장소를 최우선 표시
      if (lat && lng) {
        window.open(`https://www.google.com/maps/search/${query}/@${lat},${lng},14z`, '_blank');
      } else {
        window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
      }
    };

    if (coords && coords.lat && coords.lng) {
      openMap(coords.lat, coords.lng);
      return;
    }

    // 좌표가 아직 없으면 브라우저 Geolocation으로 즉시 확인 후 열기
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          try {
            localStorage.setItem('WALWAL_LAST_COORDS', JSON.stringify({ lat, lng }));
          } catch (e) { }
          openMap(lat, lng);
        },
        () => {
          openMap();
        },
        { timeout: 2000, maximumAge: 300000 }
      );
    } else {
      openMap();
    }
  };

  const DOG_SIZE_OPTIONS = [
    { value: 'all', label: '전체 크기' },
    { value: 'small', label: '소형견 (말티즈, 포메 등)' },
    { value: 'medium', label: '중형견 (웰시코기, 시바 등)' },
    { value: 'large', label: '대형견 (리트리버, 허스키 등)' }
  ];

  const WALK_STYLE_OPTIONS = [
    { value: 'all', label: '전체 스타일' },
    { value: 'free', label: '자유 산책 / 피크닉' },
    { value: 'sniff', label: '킁킁 탐색 / 노즈워크' },
    { value: 'training', label: '훈련 & 사회화' },
    { value: 'shy', label: '소심이 / 힐링 산책' }
  ];

  const DATE_OPTIONS = [
    { value: 'all', label: '전체 날짜' },
    { value: 'today', label: '오늘' },
    { value: 'tomorrow', label: '내일' },
    { value: 'weekend', label: '주말' }
  ];

  const dogSizeLabel = dogSize === 'small' ? '소형견' : dogSize === 'medium' ? '중형견' : dogSize === 'large' ? '대형견' : '견종 크기';
  const walkStyleLabel = walkStyle === 'free' ? '자유산책' : walkStyle === 'sniff' ? '킁킁탐색' : walkStyle === 'training' ? '훈련·사회화' : walkStyle === 'shy' ? '소심이힐링' : '산책 스타일';
  const dateLabel = dateFilter === 'today' ? '오늘' : dateFilter === 'tomorrow' ? '내일' : dateFilter === 'weekend' ? '주말' : '날짜';

  const filteredMeetups = useMemo(() => {
    return meetups.filter(m => {
      // 0. Blocked user filter
      if (isUserBlocked(m.hostDog) || isUserBlocked(m.hostOwner)) {
        return false;
      }

      // 1. Tab filter
      if (meetupStatusFilter === 'joined') {
        if (!isUserJoined(m)) return false;
      }

      const isClosed = isMeetupClosed(m);

      // 2. Open only filter
      if (openOnly && isClosed) {
        return false;
      }

      // 3. Dog Size filter
      if (dogSize === 'small') {
        const isSmall = m.tag.includes('소형') || m.title.includes('소형') || m.title.includes('솜뭉치') || m.title.includes('포메') || m.title.includes('말티');
        if (!isSmall) return false;
      } else if (dogSize === 'medium') {
        const isMedium = m.tag.includes('중형') || m.tag.includes('숏다리') || m.title.includes('코기') || m.title.includes('시바') || m.title.includes('비글') || m.title.includes('중형');
        if (!isMedium) return false;
      } else if (dogSize === 'large') {
        const isLarge = m.tag.includes('대형') || m.title.includes('대형') || m.title.includes('리트리버') || m.title.includes('허스키') || m.title.includes('셰퍼드');
        if (!isLarge) return false;
      }

      // 4. Walk Style filter
      if (walkStyle === 'free') {
        const isFree = m.tag.includes('자유') || m.tag.includes('정기') || m.title.includes('자유') || m.title.includes('정모') || m.title.includes('피크닉');
        if (!isFree) return false;
      } else if (walkStyle === 'training') {
        const isTraining = m.tag.includes('훈련') || m.tag.includes('사회화') || m.title.includes('사회화') || m.title.includes('예절');
        if (!isTraining) return false;
      } else if (walkStyle === 'sniff') {
        const isSniff = m.tag.includes('킁킁') || m.tag.includes('탐색') || m.title.includes('킁킁') || m.title.includes('노즈워크');
        if (!isSniff) return false;
      } else if (walkStyle === 'shy') {
        const isShy = m.tag.includes('소심') || m.tag.includes('힐링') || m.tag.includes('조용') || m.title.includes('쫄보') || m.title.includes('힐링');
        if (!isShy) return false;
      }

      // 5. Distance / Area filter
      if (distanceFilter === 'neighborhood') {
        const isLocal = m.location.includes('성수') || m.location.includes('뚝섬') || m.location.includes('서울숲') || m.location.includes('살곶이');
        if (!isLocal) return false;
      }

      // 6. Date filter
      const parsedTime = parseMeetupDateTime(m.time);
      const todayStr = getTodayDateStr();
      const tm = new Date();
      tm.setDate(tm.getDate() + 1);
      const pad = (n: number) => String(n).padStart(2, '0');
      const tomorrowStr = `${tm.getFullYear()}-${pad(tm.getMonth() + 1)}-${pad(tm.getDate())}`;

      if (dateFilter === 'today') {
        if (parsedTime.date !== todayStr) return false;
      } else if (dateFilter === 'tomorrow') {
        if (parsedTime.date !== tomorrowStr) return false;
      } else if (dateFilter === 'weekend') {
        const targetD = new Date(parsedTime.date + 'T00:00:00');
        const dayOfWeek = targetD.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) return false;
      } else if (dateFilter === 'custom' && customDate) {
        if (parsedTime.date !== customDate) return false;
      }

      // 7. Time slot filter
      if (timeSlotFilter !== 'all') {
        const hour = parseInt(parsedTime.time.split(':')[0], 10);
        if (timeSlotFilter === 'morning') {
          if (hour < 6 || hour >= 10) return false;
        } else if (timeSlotFilter === 'day') {
          if (hour < 10 || hour >= 18) return false;
        } else if (timeSlotFilter === 'night') {
          if (hour < 18 && hour >= 6) return false;
        }
      }

      // 8. My Dog Match filter
      if (myDogMatch) {
        const breedKey = myDog.breed?.replace(/견|종/g, '').trim() || '';
        const matchesBreed = breedKey && (m.title.includes(breedKey) || m.tag.includes(breedKey));
        const matchesLarge = (myDog.breed.includes('리트리버') || myDog.breed.includes('허스키')) && (m.tag.includes('대형') || m.title.includes('대형'));
        const matchesMedium = (myDog.breed.includes('코기') || myDog.breed.includes('시바')) && (m.tag.includes('숏다리') || m.tag.includes('중형') || m.title.includes('코기'));
        const matchesSmall = (myDog.breed.includes('포메') || myDog.breed.includes('말티')) && (m.tag.includes('소형') || m.title.includes('소형') || m.title.includes('솜뭉치'));
        const isParticipating = isUserJoined(m);

        if (!matchesBreed && !matchesLarge && !matchesMedium && !matchesSmall && !isParticipating) {
          return false;
        }
      }

      return true;
    });
  }, [meetups, meetupStatusFilter, openOnly, dogSize, walkStyle, distanceFilter, dateFilter, customDate, timeSlotFilter, myDogMatch, myDog, blockedVersion]);

  const draftMatchCount = useMemo(() => {
    return meetups.filter(m => {
      // 0. Blocked user filter
      if (isUserBlocked(m.hostDog) || isUserBlocked(m.hostOwner)) {
        return false;
      }

      if (meetupStatusFilter === 'joined') {
        if (!isUserJoined(m)) return false;
      }
      const isClosed = isMeetupClosed(m);
      if (draftOpenOnly && isClosed) return false;

      if (draftDogSize === 'small') {
        const isSmall = m.tag.includes('소형') || m.title.includes('소형') || m.title.includes('솜뭉치') || m.title.includes('포메') || m.title.includes('말티');
        if (!isSmall) return false;
      } else if (draftDogSize === 'medium') {
        const isMedium = m.tag.includes('중형') || m.tag.includes('숏다리') || m.title.includes('코기') || m.title.includes('시바') || m.title.includes('비글') || m.title.includes('중형');
        if (!isMedium) return false;
      } else if (draftDogSize === 'large') {
        const isLarge = m.tag.includes('대형') || m.title.includes('대형') || m.title.includes('리트리버') || m.title.includes('허스키') || m.title.includes('셰퍼드');
        if (!isLarge) return false;
      }

      if (draftWalkStyle === 'free') {
        const isFree = m.tag.includes('자유') || m.tag.includes('정기') || m.title.includes('자유') || m.title.includes('정모') || m.title.includes('피크닉');
        if (!isFree) return false;
      } else if (draftWalkStyle === 'training') {
        const isTraining = m.tag.includes('훈련') || m.tag.includes('사회화') || m.title.includes('사회화') || m.title.includes('예절');
        if (!isTraining) return false;
      } else if (draftWalkStyle === 'sniff') {
        const isSniff = m.tag.includes('킁킁') || m.tag.includes('탐색') || m.title.includes('킁킁') || m.title.includes('노즈워크');
        if (!isSniff) return false;
      } else if (draftWalkStyle === 'shy') {
        const isShy = m.tag.includes('소심') || m.tag.includes('힐링') || m.tag.includes('조용') || m.title.includes('쫄보') || m.title.includes('힐링');
        if (!isShy) return false;
      }

      if (draftDistanceFilter === 'neighborhood') {
        const isLocal = m.location.includes('성수') || m.location.includes('뚝섬') || m.location.includes('서울숲') || m.location.includes('살곶이');
        if (!isLocal) return false;
      }

      const draftParsedTime = parseMeetupDateTime(m.time);
      const draftTodayStr = getTodayDateStr();
      const draftTm = new Date();
      draftTm.setDate(draftTm.getDate() + 1);
      const draftPad = (n: number) => String(n).padStart(2, '0');
      const draftTomorrowStr = `${draftTm.getFullYear()}-${draftPad(draftTm.getMonth() + 1)}-${draftPad(draftTm.getDate())}`;

      if (draftDateFilter === 'today') {
        if (draftParsedTime.date !== draftTodayStr) return false;
      } else if (draftDateFilter === 'tomorrow') {
        if (draftParsedTime.date !== draftTomorrowStr) return false;
      } else if (draftDateFilter === 'weekend') {
        const targetD = new Date(draftParsedTime.date + 'T00:00:00');
        const dayOfWeek = targetD.getDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) return false;
      } else if (draftDateFilter === 'custom' && draftCustomDate) {
        if (draftParsedTime.date !== draftCustomDate) return false;
      }

      if (draftTimeSlotFilter !== 'all') {
        const hour = parseInt(draftParsedTime.time.split(':')[0], 10);
        if (draftTimeSlotFilter === 'morning') {
          if (hour < 6 || hour >= 10) return false;
        } else if (draftTimeSlotFilter === 'day') {
          if (hour < 10 || hour >= 18) return false;
        } else if (draftTimeSlotFilter === 'night') {
          if (hour < 18 && hour >= 6) return false;
        }
      }

      if (draftMyDogMatch) {
        const breedKey = myDog.breed?.replace(/견|종/g, '').trim() || '';
        const matchesBreed = breedKey && (m.title.includes(breedKey) || m.tag.includes(breedKey));
        const matchesLarge = (myDog.breed.includes('리트리버') || myDog.breed.includes('허스키')) && (m.tag.includes('대형') || m.title.includes('대형'));
        const matchesMedium = (myDog.breed.includes('코기') || myDog.breed.includes('시바')) && (m.tag.includes('숏다리') || m.tag.includes('중형') || m.title.includes('코기'));
        const matchesSmall = (myDog.breed.includes('포메') || myDog.breed.includes('말티')) && (m.tag.includes('소형') || m.title.includes('소형') || m.title.includes('솜뭉치'));
        const isParticipating = isUserJoined(m);

        if (!matchesBreed && !matchesLarge && !matchesMedium && !matchesSmall && !isParticipating) {
          return false;
        }
      }

      return true;
    }).length;
  }, [meetups, meetupStatusFilter, draftOpenOnly, draftDogSize, draftWalkStyle, draftDistanceFilter, draftDateFilter, draftCustomDate, draftTimeSlotFilter, draftMyDogMatch, myDog, blockedVersion]);

  if (showWalkHistoryModal) {
    return (
      <WalkHistoryModal
        dog={targetWalkDog}
        allPets={myPets}
        initialWalkTargetMode={isAllDogsSelected ? 'all' : (selectedWalkDogIds[0] || 'all')}
        initialTab={walkHistoryTab}
        onClose={() => setShowWalkHistoryModal(false)}
      />
    );
  }

  return (
    <div className={`page-root community-page-root ${activeSession ? 'tracking-active' : ''}`}>
      {/* Header */}
      <div className="page-header row-between">
        <h2 className="title-lg">{t.tabs.community}</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => setShowWalkHistoryModal(true)}
            title={language === 'ko' ? '산책 일지' : 'Walk Logs'}
          >
            <PawPrint size={22} />
          </button>
          <button
            className="btn-ghost"
            onClick={openCreateModal}
          >
            <Plus size={24} strokeWidth={2} />
          </button>
          <button
            className="all-services-header-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('walwal_open_all_services'))}
            aria-label="전체서비스"
            title="전체서비스"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>


      {/* Content: Top Tab Row (Left: [함께산책해요] [내 산책] | Right: Filter Icon Button) */}
      <div className="community-filter-row">
        <div className="community-tab-group">
          <button
            className={`community-tab-btn ${meetupStatusFilter === 'all' ? 'active' : ''}`}
            onClick={() => setMeetupStatusFilter('all')}
          >
            {t.community?.filterUpcoming ||
              (language === 'zh' ? '聚会活动' :
                language === 'fr' ? 'Rencontres' :
                  language === 'ja' ? '一緒にお散歩' :
                    language === 'es' ? 'Encuentros' :
                      language === 'en' ? 'Meetups' : '함께산책해요')}
          </button>
          <button
            className={`community-tab-btn ${meetupStatusFilter === 'joined' ? 'active' : ''}`}
            onClick={() => setMeetupStatusFilter('joined')}
          >
            {t.community?.filterJoined ||
              (language === 'zh' ? '我的聚会' :
                language === 'fr' ? 'Mes rencontres' :
                  language === 'ja' ? '私のお散歩' :
                    language === 'es' ? 'Mis Encuentros' :
                      language === 'en' ? 'My Meetups' : '내 산책')}
          </button>
        </div>

        {/* Filter Icon Button on Right */}
        <button
          type="button"
          className={`filter-icon-btn ${hasActiveFilters ? 'active' : ''}`}
          onClick={openFilterModal}
          title={filterT.modalTitle || '상세 필터 검색'}
        >
          <SlidersHorizontal size={24} />
          {hasActiveFilters && <span className="filter-badge-dot" />}
        </button>
      </div>


      <div className="section-gap">
        {filteredMeetups.length === 0 ? (
          <div className="community-empty-card">
            <div className="community-empty-icon-wrap">
              <div className="community-empty-icon-circle">
                <PawPrint size={30} color="#c8c8c8" />
              </div>
            </div>
            <h4 className="community-empty-title">
              {meetupStatusFilter === 'joined'
                ? (language === 'ko' ? '아직 참여한 산책모임이 없어요.'
                  : language === 'ja' ? 'まだ参加したお散歩の集まりがありません。'
                    : language === 'es' ? 'Aún no te has unido a ningún paseo.'
                      : language === 'zh' ? '尚未参加任何散步聚会。'
                        : language === 'fr' ? 'Vous n\'avez pas encore rejoint de promenade.'
                          : 'You haven\'t joined any walk meetups yet.')
                : (filterT.emptyTitle || (language === 'ko' ? '조건에 맞는 산책 모임이 없어요' : 'No meetups match your criteria'))}
            </h4>
            <p className="community-empty-desc">
              {meetupStatusFilter === 'joined'
                ? (language === 'ko' ? '함께 산책할 모임을 찾아보거나 직접 새로운 모임을 개설해보세요.'
                  : language === 'ja' ? '一緒に散歩する集まりを探すか、新しい集まりを作成してみましょう。'
                    : language === 'es' ? 'Encuentra un grupo para pasear juntos o crea tu propio encuentro.'
                      : language === 'zh' ? '寻找一起散步的聚会，或直接创建新的聚会。'
                        : language === 'fr' ? 'Trouvez une rencontre ou créez votre propre groupe.'
                          : 'Explore meetups to join or create a new walk meetup yourself.')
                : (filterT.emptySub || (language === 'ko' ? '필터를 변경하거나 직접 새로운 모임을 개설해보세요!' : 'Try changing filters or create a new meetup!'))}
            </p>
            <div className="community-empty-btn-group">
              {meetupStatusFilter === 'joined' ? (
                <>
                  <button
                    className="tap-btn community-empty-reset-btn"
                    onClick={() => setMeetupStatusFilter('all')}
                  >
                    <PawPrint size={14} style={{ marginRight: '4px' }} />
                    {language === 'ko' ? '모임 찾아보기' : language === 'ja' ? '集まりを探す' : 'Explore Meetups'}
                  </button>
                  <button
                    className="btn-primary community-empty-create-btn"
                    onClick={openCreateModal}
                  >
                    <Plus size={16} /> {filterT.emptyCreateBtn || (language === 'ko' ? '모임 개설하기' : 'Create Meetup')}
                  </button>
                </>
              ) : (
                <>
                  {hasActiveFilters && (
                    <button
                      className="tap-btn community-empty-reset-btn"
                      onClick={resetAllFilters}
                    >
                      <RotateCcw size={13} style={{ marginRight: '4px' }} /> {filterT.emptyResetBtn || (language === 'ko' ? '필터 초기화' : 'Reset Filters')}
                    </button>
                  )}
                  <button
                    className="btn-primary community-empty-create-btn"
                    onClick={openCreateModal}
                  >
                    <Plus size={16} /> {filterT.emptyCreateBtn || (language === 'ko' ? '모임 개설하기' : 'Create Meetup')}
                  </button>
                </>
              )}
            </div>
          </div>
        ) : filteredMeetups.map(m => {
          const isClosed = isMeetupClosed(m);
          return (
            <div
              key={m.id}
              className={`card-lg${isUserJoined(m) ? ' card-joined' : ''}`}
            >
              <div className="row-between meetup-card-top">
                <div className="row gap-12 meetup-card-left">
                  <img
                    src={getLiveDogAvatar(m.hostDog, m.avatar)}
                    alt={m.hostDog}
                    className="avatar-md meetup-host-avatar"
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
                  <div className="host-info-wrapper meetup-host-info-wrap"
                    onClick={() => handleEnterChat(m)}
                  >
                    <div className="row-between gap-12 meetup-tag-row">
                      <div className="meetup-badge-group">
                        <span className="badge">{m.tag}</span>

                      </div>
                      <div className="meetup-host-row">
                        <div className="text-sub meetup-host-text">
                          <Crown size={14} className="meetup-crown-icon" />
                          {normalizeHostOwnerName(m.hostOwner, language)}
                        </div>
                        <div className="meetup-menu-wrapper" style={{ position: 'relative' }}>
                          <button
                            type="button"
                            className={`meetup-menu-btn ${activeMenuMeetupId === m.id ? 'active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuMeetupId(prev => prev === m.id ? null : m.id);
                            }}
                            title={isUserHost(m) ? "모임 관리" : "더보기"}
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuMeetupId === m.id && (
                            <div className="snaps-dropdown-menu feed-dropdown-menu">
                              {isUserHost(m) ? (
                                <>
                                  <button
                                    className="snaps-dropdown-item feed-dropdown-item"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openEditModal(m);
                                      setActiveMenuMeetupId(null);
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F7FAFC')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  >
                                    <Edit3 size={15} />
                                    <span>{t.community?.editMeetup || (language === 'ko' ? '수정' : language === 'ja' ? '集まりを編集' : 'Edit Meetup')}</span>
                                  </button>
                                  <button
                                    className="snaps-dropdown-item feed-dropdown-item"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteMeetup(m.id);
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF5F5')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  >
                                    <Trash2 size={15} />
                                    <span>{t.community?.deleteMeetup || (language === 'ko' ? '모임 삭제' : language === 'ja' ? '集まりを削除' : 'Delete Meetup')}</span>
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="snaps-dropdown-item feed-dropdown-item"
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuMeetupId(null);
                                      setReportTarget({
                                        type: 'meetup',
                                        id: m.id,
                                        author: m.hostDog || m.hostOwner,
                                        content: m.title
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
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setActiveMenuMeetupId(null);
                                      const targetUser = m.hostDog || m.hostOwner;
                                      if (window.confirm(`'${targetUser}' 사용자를 차단하시겠습니까? 이 사용자의 모임과 글이 목록에서 숨겨집니다.`)) {
                                        blockUser(targetUser);
                                        alert('사용자가 차단되었습니다.');
                                      }
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.background = '#F7FAFC')}
                                    onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                                  >
                                    <ShieldAlert size={15} color="#121212" />
                                    <span>작성자 차단하기</span>
                                  </button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <h3 className="title-md meetup-card-title">
                      {m.title}
                      {!!m.unreadCount && m.unreadCount > 0 && (
                        <span className="unreadCount">
                          {m.unreadCount > 99 ? '99+' : m.unreadCount}
                        </span>
                      )}
                    </h3>
                  </div>
                </div>
              </div>

              {/* Location & Time */}
              <div className="col mt-16 gap-10 meetup-location-time-col">
                <div className="info-row">
                  <button
                    className="link-accent"
                    onClick={() => handleLocationClick(m)}
                    title={t.community.tooltipLocation}
                  >
                    <MapPin size={16} />
                    <span className="meetup-location-link">{m.location}</span>
                  </button>
                  <div className="info-row justify-start">
                    <Calendar size={16} />
                    <span>
                      {formatMeetupDisplay(m, language)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="row-between mt-20 meetup-card-bottom">
                <div className="meetup-facepile-wrap">
                  <div className="text-sm">
                    {t.community.participants}: {m.participantsCount} / {m.maxParticipants}{t.community.peopleCount}
                  </div>
                  {/* Facepile UI */}
                  {m.participants && m.participants.length > 0 && (
                    <div
                      className="meetup-facepile-row"
                      onClick={() => setShowParticipantsModal(m)}
                    >
                      {m.participants.slice(0, 5).map((p: any, idx: number) => (
                        <img
                          key={idx}
                          src={getLiveDogAvatar(p.name, p.avatar)}
                          alt={p.name}
                          className={`meetup-participant-avatar ${idx > 0 ? 'stacked' : ''}`}
                          style={{ zIndex: 5 - idx }}
                        />
                      ))}
                      {m.participants.length > 5 && (
                        <div className="meetup-participant-more">
                          +{m.participants.length - 5}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => !isClosed && handleJoin(m.id)}
                  className={`meetup-join-btn ${isClosed ? 'btn-disabled closed' : ((isUserJoined(m) || isUserHost(m)) ? 'btn-dark-line' : 'btn-primary')}`}
                  disabled={isClosed}
                >
                  {isClosed ? (
                    t.community?.closedBtn || (language === 'ko' ? '마감' : language === 'ja' ? '締切' : language === 'es' ? 'Cerrado' : 'Closed')
                  ) : (isUserJoined(m) || isUserHost(m)) ? (
                    <><LogOut size={20} /></>
                  ) : (
                    <><PawPrint size={20} />In</>
                  )}
                </button>
              </div>
            </div>
          );
        })}
      </div >

      {/* Create Meetup Modal */}
      {
        showCreateModal && (
          <div className="community-modal-overlay">
            <div className="community-modal-content">
              <div className="modal-header-row">
                <h3 className="modal-title-text">{t.community.modalCreateTitle}</h3>
                <button type="button" onClick={() => setShowCreateModal(false)} className="modal-close-icon-btn">
                  <X size={24} color="#222" />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} className="modal-form">
                <div>
                  <label className="modal-label">{t.community.modalTitleLabel}</label>
                  <input
                    type="text"
                    value={formTitle}
                    onChange={e => setFormTitle(e.target.value)}
                    placeholder={t.community.modalTitlePlaceholder}
                    className="modal-input"
                    required
                  />
                </div>

                <div>
                  <label className="modal-label">{t.community.modalLocationLabel}</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={e => setFormLocation(e.target.value)}
                    placeholder={t.community.modalLocationPlaceholder}
                    className="modal-input"
                    required
                  />
                </div>

                <div>
                  <label className="modal-label">
                    {t.community.modalTimeLabel || '모임 일시'}
                  </label>
                  <div className="modal-datetime-row">
                    <input
                      type="date"
                      value={formDate}
                      onChange={e => setFormDate(e.target.value)}
                      className="modal-date-input"
                      required
                    />
                    <input
                      type="time"
                      value={formTimeStr}
                      onChange={e => setFormTimeStr(e.target.value)}
                      className="modal-time-input"
                      required
                    />
                  </div>
                  {formDate && formTimeStr && (
                    <div className="modal-datetime-preview">
                      ✓ {formatMeetupDateTime(formDate, formTimeStr, language)}
                    </div>
                  )}
                </div>

                <div className="modal-two-col">
                  <div>
                    <label className="modal-label">{t.community.modalTagLabel}</label>
                    <input
                      type="text"
                      value={formTag}
                      onChange={e => setFormTag(e.target.value)}
                      placeholder={t.community.modalTagPlaceholder}
                      className="modal-input"
                    />
                  </div>
                  <div>
                    <label className="modal-label">{t.community.modalMaxLabel}</label>
                    <input
                      type="number"
                      min="2"
                      max="20"
                      value={formMax}
                      onChange={e => setFormMax(parseInt(e.target.value) || 5)}
                      className="modal-input"
                    />
                  </div>
                </div>

                <div>
                  <label className="modal-label">{t.community.modalJoinPetsLabel || '함께 갈 반려견 선택'}</label>
                  <div className="modal-pet-scroll">
                    {myPets.map((pet: any) => {
                      const isSelected = selectedCreatePetIds.includes(pet.id || pet.name);
                      return (
                        <div
                          key={pet.id || pet.name}
                          onClick={() => {
                            if (isSelected) {
                              if (selectedCreatePetIds.length > 1) {
                                setSelectedCreatePetIds(selectedCreatePetIds.filter(id => id !== (pet.id || pet.name)));
                              } else {
                                alert(t.community.modalJoinPetsMinAlert || '최소 한 마리의 반려견을 선택해야 합니다.');
                              }
                            } else {
                              setSelectedCreatePetIds([...selectedCreatePetIds, pet.id || pet.name]);
                            }
                          }}
                          className="modal-pet-chip"
                          style={{ opacity: isSelected ? 1 : 0.4 }}
                        >
                          <img
                            src={getLiveDogAvatar(pet.name, pet.avatar)}
                            alt={pet.name}
                            className={`modal-pet-avatar ${isSelected ? 'selected' : ''}`}
                          />
                          <span className={`modal-pet-name ${isSelected ? 'selected' : ''}`}>{pet.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button type="submit" className="modal-submit-btn">
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
          <div className='dog-profile-modal-overlay'>
            <div className="dog-profile-modal-card">

              <div className="modal-header-row" style={{ width: '100%', marginBottom: '16px' }}>
                <h3 className="modal-title-text">
                  {t.community.modalParticipantsTitle} ({showParticipantsModal.participants?.length || 0})
                </h3>

                <button type="button" onClick={() => setShowParticipantsModal(null)} className="modal-close-icon-btn">
                  <X size={24} color="#222" />
                </button>
              </div>

              <div className="participants-list">
                {showParticipantsModal.participants?.map((p: any, idx: number) => {
                  const localizedName = localizeDogName(p.name, language);
                  return (
                    <div
                      key={idx}
                      className="avatar-wrapper"
                      style={{ transition: 'background 0.15s', padding: '6px 8px', borderRadius: '14px' }}
                    >
                      <img className="avatar-sm" src={getLiveDogAvatar(p.name, p.avatar)} alt={localizedName} />
                      <div>
                        <div className="pName">{localizedName} <span>({localizeBreed(p.breed, language)} / {p.age ? String(p.age).replace(/[^0-9]/g, '') : '1'}{t.profile?.dogAgeSuffix || '살'} / {p.gender === 'male' ? (t.common?.genderShortMale || '남') : (t.common?.genderShortFemale || '여')})</span></div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                          {localizePersonalityTags(p.personality || [], language).map((tag: string, i: number) => (
                            <span key={i} className='badge-hashtag'>
                              {tag.startsWith('#') ? tag : `#${tag}`}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        )
      }
      {/* Multi-Pet Join Selection Modal (함께 산책 갈 반려견 선택) */}
      {joinPetSelectionMeetup && (
        <div
          className="pet-select-modal-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) setJoinPetSelectionMeetup(null);
          }}
        >
          <div className="pet-select-modal-card">
            {/* Header */}
            <div className="pet-select-header">
              <div>
                <h3 className="pet-select-title">
                  {t.community.selectPetTitle || '함께 산책 갈 반려견 선택'}
                </h3>
                <p className="pet-select-subtitle">
                  {joinPetSelectionMeetup.title}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setJoinPetSelectionMeetup(null)}
                className="pet-select-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <p className="pet-select-desc">
              {t.community.selectPetDesc || '이번 모임에 함께 참여할 아이를 선택해주세요. (다중 선택 가능)'}
            </p>

            {/* Pet Options */}
            <div className="pet-select-list">
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
                    className={`pet-select-item ${isSelected ? 'selected' : ''}`}
                  >
                    <div className="pet-select-item-left">
                      <img
                        src={getLiveDogAvatar(pet.name, pet.avatar)}
                        alt={pet.name}
                        className={`pet-select-item-avatar ${isSelected ? 'selected' : ''}`}
                      />
                      <div>
                        <div className="pet-select-item-name">{pet.name}</div>
                        <div className="pet-select-item-sub">
                          {pet.breed} · {pet.age}{t.profile?.dogAgeSuffix || '살'} {pet.gender === 'female' ? (t.common?.genderShortFemale || '여') : pet.gender === 'male' ? (t.common?.genderShortMale || '남') : ''}
                        </div>
                      </div>
                    </div>
                    <div className={`pet-select-check-circle ${isSelected ? 'selected' : ''}`}>
                      {isSelected ? '✓' : ''}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick All / Single toggle */}
            <div className="pet-select-toggle-row">
              <button
                type="button"
                onClick={() => setSelectedJoinPetIds(myPets.map((p: any) => p.id || p.name))}
                className={`pet-select-all-btn ${selectedJoinPetIds.length === myPets.length ? 'active' : ''}`}
              >
                {(t.community.allPetsBtn || '모든 반려견 ({count}마리 모두)').replace('{count}', String(myPets.length))}
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="button"
              onClick={confirmJoinWithSelectedPets}
              disabled={selectedJoinPetIds.length === 0}
              className="pet-select-submit-btn"
            >
              {(t.community.btnJoinWithCount || '{count}마리 반려견과 함께 참여하기').replace('{count}', String(selectedJoinPetIds.length))}
            </button>
          </div>
        </div>
      )}

      {/* Edit Meetup Modal (모임장 전용) */}
      {editingMeetup && (
        <div className="community-modal-overlay">
          <div className="community-modal-content">
            <div className="modal-header-row">
              <h3 className="modal-title-text" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Crown size={18} color="#FF9E58" /> {t.community?.editModalTitle || (language === 'ko' ? '모임 정보 수정' : language === 'ja' ? '集まりの情報を編集' : 'Edit Meetup Info')}
              </h3>
              <button type="button" onClick={() => setEditingMeetup(null)} className="modal-close-icon-btn">
                <X size={24} color="#222" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="modal-form">
              <div>
                <label className="modal-label">{t.community.modalTitleLabel}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  placeholder={t.community.modalTitlePlaceholder}
                  className="modal-input"
                  required
                />
              </div>

              <div>
                <label className="modal-label">{t.community.modalLocationLabel}</label>
                <input
                  type="text"
                  value={editLocation}
                  onChange={e => setEditLocation(e.target.value)}
                  placeholder={t.community.modalLocationPlaceholder}
                  className="modal-input"
                  required
                />
              </div>

              <div>
                <label className="modal-label">
                  {t.community.modalTimeLabel || '모임 일시'}
                </label>
                <div className="modal-datetime-row">
                  <input
                    type="date"
                    value={editDate}
                    onChange={e => setEditDate(e.target.value)}
                    className="modal-date-input"
                    required
                  />
                  <input
                    type="time"
                    value={editTimeStr}
                    onChange={e => setEditTimeStr(e.target.value)}
                    className="modal-time-input"
                    required
                  />
                </div>
                {editDate && editTimeStr && (
                  <div className="modal-datetime-preview">
                    ✓ {formatMeetupDateTime(editDate, editTimeStr, language)}
                  </div>
                )}
              </div>

              <div className="modal-two-col">
                <div>
                  <label className="modal-label">{t.community.modalTagLabel}</label>
                  <input
                    type="text"
                    value={editTag}
                    onChange={e => setEditTag(e.target.value)}
                    placeholder={t.community.modalTagPlaceholder}
                    className="modal-input"
                  />
                </div>
                <div>
                  <label className="modal-label">{t.community.modalMaxLabel}</label>
                  <input
                    type="number"
                    min="2"
                    max="20"
                    value={editMax}
                    onChange={e => setEditMax(parseInt(e.target.value) || 5)}
                    className="modal-input"
                  />
                </div>
              </div>

              <div>
                <label className="modal-label">{t.community.modalJoinPetsLabel || '함께 갈 반려견 선택'}</label>
                <div className="modal-pet-scroll">
                  {myPets.map((pet: any) => {
                    const isSelected = selectedEditPetIds.includes(pet.id || pet.name);
                    return (
                      <div
                        key={pet.id || pet.name}
                        onClick={() => {
                          if (isSelected) {
                            if (selectedEditPetIds.length > 1) {
                              setSelectedEditPetIds(selectedEditPetIds.filter(id => id !== (pet.id || pet.name)));
                            } else {
                              alert(t.community.modalJoinPetsMinAlert || '최소 한 마리의 반려견을 선택해야 합니다.');
                            }
                          } else {
                            setSelectedEditPetIds([...selectedEditPetIds, pet.id || pet.name]);
                          }
                        }}
                        className="modal-pet-chip"
                        style={{ opacity: isSelected ? 1 : 0.4 }}
                      >
                        <img
                          src={getLiveDogAvatar(pet.name, pet.avatar)}
                          alt={pet.name}
                          className={`modal-pet-avatar ${isSelected ? 'selected' : ''}`}
                        />
                        <span className={`modal-pet-name ${isSelected ? 'selected' : ''}`}>{pet.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button type="submit" className="modal-submit-btn">
                {t.community?.editSubmitBtn || (language === 'ko' ? '수정 완료' : language === 'ja' ? '修正完了' : 'Save Changes')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 100% Filter Modal Popup */}
      {showFilterModal && (
        <div className="modal-overlay" onClick={() => setShowFilterModal(false)} style={{ maxWidth: '100%', padding: '0' }}>
          <div
            className="modal-box"
            onClick={e => e.stopPropagation()}  >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SlidersHorizontal size={20} color="#000" />
                <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: '#000', margin: 0 }}>
                  {filterT.modalTitle || '상세 필터 검색'}
                </h3>
              </div>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => setShowFilterModal(false)}
                style={{ padding: '4px' }}
              >
                <X size={22} color="#64748B" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {/* 1. 모집 상태 */}
              <div className="filter-modal-section">
                <div className="filter-modal-label">
                  <span>{filterT.statusLabel || '모집 상태'}</span>
                </div>
                <div className="filter-chip-group">
                  <button
                    type="button"
                    className={`filter-modal-chip ${!draftOpenOnly ? 'active' : ''}`}
                    onClick={() => setDraftOpenOnly(false)}
                  >
                    {filterT.statusAll || '전체 보기'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftOpenOnly ? 'active' : ''}`}
                    onClick={() => setDraftOpenOnly(true)}
                  >
                    {filterT.statusOpenOnly || '모집중만 보기'}
                  </button>
                </div>
              </div>

              {/* 2. 견종 크기 */}
              <div className="filter-modal-section">
                <div className="filter-modal-label">
                  <span>{filterT.dogSizeLabel || '1. 견종 크기'}</span>
                </div>
                <div className="filter-chip-group">
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDogSize === 'all' ? 'active' : ''}`}
                    onClick={() => setDraftDogSize('all')}
                  >
                    {filterT.sizeAll || '전체'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDogSize === 'small' ? 'active' : ''}`}
                    onClick={() => setDraftDogSize('small')}
                  >
                    {filterT.sizeSmall || '소형견'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDogSize === 'medium' ? 'active' : ''}`}
                    onClick={() => setDraftDogSize('medium')}
                  >
                    {filterT.sizeMedium || '중형견'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDogSize === 'large' ? 'active' : ''}`}
                    onClick={() => setDraftDogSize('large')}
                  >
                    {filterT.sizeLarge || '대형견'}
                  </button>
                </div>
              </div>

              {/* 3. 산책 스타일 */}
              <div className="filter-modal-section">
                <div className="filter-modal-label">
                  <span>{filterT.walkStyleLabel || '2. 산책 스타일'}</span>
                </div>
                <div className="filter-chip-group">
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftWalkStyle === 'all' ? 'active' : ''}`}
                    onClick={() => setDraftWalkStyle('all')}
                  >
                    {filterT.styleAll || '전체'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftWalkStyle === 'free' ? 'active' : ''}`}
                    onClick={() => setDraftWalkStyle('free')}
                  >
                    {filterT.styleFree || '자유산책'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftWalkStyle === 'training' ? 'active' : ''}`}
                    onClick={() => setDraftWalkStyle('training')}
                  >
                    {filterT.styleTraining || '훈련·사회화'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftWalkStyle === 'sniff' ? 'active' : ''}`}
                    onClick={() => setDraftWalkStyle('sniff')}
                  >
                    {filterT.styleSniff || '킁킁이(탐색)'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftWalkStyle === 'shy' ? 'active' : ''}`}
                    onClick={() => setDraftWalkStyle('shy')}
                  >
                    {filterT.styleShy || '소심이 전용'}
                  </button>
                </div>
              </div>

              {/* 4. 거리 / 지역 */}
              <div className="filter-modal-section">
                <div className="filter-modal-label">
                  <span>{filterT.distanceLabel || '3. 거리 / 지역'}</span>
                </div>
                <div className="filter-chip-group">
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDistanceFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDraftDistanceFilter('all')}
                  >
                    {filterT.distanceAll || '전체'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDistanceFilter === 'nearby' ? 'active' : ''}`}
                    onClick={() => setDraftDistanceFilter('nearby')}
                  >
                    {filterT.distanceNearby || '거리순'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDistanceFilter === 'neighborhood' ? 'active' : ''}`}
                    onClick={() => setDraftDistanceFilter('neighborhood')}
                  >
                    {filterT.distanceNeighborhood || '내 동네'}
                  </button>
                </div>
              </div>

              {/* 5. 날짜별 */}
              <div className="filter-modal-section">
                <div className="filter-modal-label">
                  <span>{filterT.dateLabel || '4. 날짜별'}</span>
                </div>
                <div className="filter-chip-group">
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDateFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDraftDateFilter('all')}
                  >
                    {filterT.dateAll || '전체'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDateFilter === 'today' ? 'active' : ''}`}
                    onClick={() => setDraftDateFilter('today')}
                  >
                    {filterT.dateToday || '오늘'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDateFilter === 'tomorrow' ? 'active' : ''}`}
                    onClick={() => setDraftDateFilter('tomorrow')}
                  >
                    {filterT.dateTomorrow || '내일'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDateFilter === 'weekend' ? 'active' : ''}`}
                    onClick={() => setDraftDateFilter('weekend')}
                  >
                    {filterT.dateWeekend || '주말'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftDateFilter === 'custom' ? 'active' : ''}`}
                    onClick={() => setDraftDateFilter('custom')}
                  >
                    {filterT.dateCustom || '직접 설정'}
                  </button>
                </div>
                {draftDateFilter === 'custom' && (
                  <div style={{ marginTop: '10px' }}>
                    <input
                      type="date"
                      value={draftCustomDate}
                      onChange={e => setDraftCustomDate(e.target.value)}
                      className="filter-custom-date-input"
                    />
                  </div>
                )}
              </div>

              {/* 6. 시간대별 */}
              <div className="filter-modal-section">
                <div className="filter-modal-label">
                  <span>{filterT.timeSlotLabel || '5. 시간대별'}</span>
                </div>
                <div className="filter-chip-group">
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftTimeSlotFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setDraftTimeSlotFilter('all')}
                  >
                    {filterT.timeAll || '전체'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftTimeSlotFilter === 'morning' ? 'active' : ''}`}
                    onClick={() => setDraftTimeSlotFilter('morning')}
                  >
                    {filterT.timeMorning || '이른 아침 (06~09시)'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftTimeSlotFilter === 'day' ? 'active' : ''}`}
                    onClick={() => setDraftTimeSlotFilter('day')}
                  >
                    {filterT.timeDay || '낮 (10~17시)'}
                  </button>
                  <button
                    type="button"
                    className={`filter-modal-chip ${draftTimeSlotFilter === 'night' ? 'active' : ''}`}
                    onClick={() => setDraftTimeSlotFilter('night')}
                  >
                    {filterT.timeNight || '야간 / 심야 (18시~)'}
                  </button>
                </div>
              </div>

              {/* 7. 참여 조건 필터 */}
              <div className="filter-modal-section">
                <div
                  className={`filter-toggle-card ${draftMyDogMatch ? 'active' : ''}`}
                  onClick={() => setDraftMyDogMatch(prev => !prev)}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#000' }}>
                    {filterT.myDogMatchLabel || '내 강아지 참여 가능 여부'}
                  </span>
                  <div className={`filter-toggle-switch ${draftMyDogMatch ? 'active' : 'inactive'}`}>
                    <div className="filter-toggle-knob" />
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions Footer */}
            <div className="flex grid-2">
              <button
                type="button"
                className="tap-btn"
                onClick={resetDraftFilters}
                title={filterT.resetBtn || '초기화'}
              >
                <RotateCcw size={18} />
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={applyFilterModal}
              >
                {draftMatchCount > 0
                  ? (filterT.searchWithCount ? filterT.searchWithCount.replace('{count}', String(draftMatchCount)) : `${draftMatchCount}개 산책 모임 조회하기`)
                  : (filterT.searchBtn || '조회하기')}
              </button>
            </div>
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
            language={language}
            isHost={isUserHost(activeChatMeetup)}
            onEdit={isUserHost(activeChatMeetup) ? () => openEditModal(activeChatMeetup) : undefined}
            onDelete={isUserHost(activeChatMeetup) ? () => handleDeleteMeetup(activeChatMeetup.id) : undefined}
          />
        )
      }

      {/* 하단 플로팅 산책 컨트롤러 (평상시: 시작하기 캡슐 버튼 / 진행중: 실시간 트래커 시트) */}
      <div className={`community-bottom-walk-container ${activeSession ? 'active' : ''}`}>
        {!activeSession ? (
          <div className="community-bottom-start-wrapper">
            {myPets.length > 1 && (
              <div className="bottom-start-dog-chips">
                <div>
                  {myPets.map((p, idx) => {
                    const dogKey = p.id || p.name;
                    const isSelected = selectedWalkDogIds.includes(dogKey);
                    return (
                      <button
                        key={p.id || idx}
                        type="button"
                        className={`bottom-dog-chip ${isSelected ? 'active' : ''}`}
                        onClick={() => handleToggleDog(dogKey)}
                      >
                        <img src={p.avatar} alt={p.name} />
                        <span>{p.name}</span>
                        {isSelected && <Check size={12} strokeWidth={2.5} className="dog-chip-check-icon" />}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  className={`bottom-dog-chip all ${isAllDogsSelected ? 'active' : ''}`}
                  onClick={handleToggleAllDogs}
                >
                  <Check size={12} strokeWidth={2.5} className="all-chip-check-icon" />
                  <span>
                    {language === 'ko' ? `모두 (${myPets.length}마리)`
                      : language === 'ja' ? `みんな (${myPets.length}匹)`
                        : language === 'es' ? `Todos (${myPets.length})`
                          : language === 'zh' ? `一起 (${myPets.length}只)`
                            : language === 'fr' ? `Tous (${myPets.length})`
                              : `All (${myPets.length})`}
                  </span>
                </button>
              </div>
            )}

            <button
              type="button"
              className="community-bottom-start-btn"
              onClick={() => {
                if (!myPets || myPets.length === 0) {
                  const msg = language === 'ko'
                    ? '산책 시작은 등록된 반려견이 있을 경우에만 이용할 수 있습니다.\n반려견 등록 페이지로 이동합니다.'
                    : language === 'ja'
                      ? 'お散歩は登録された愛犬がいる場合のみ利用できます。\n愛犬登録ページへ移動します。'
                      : language === 'es'
                        ? 'El seguimiento de paseo solo está disponible si tienes un perro registrado.\nRedirigiendo a la página de registro.'
                        : language === 'zh'
                          ? '散步仅在已登记宠物时可用。\n即将前往宠物登记页面。'
                          : language === 'fr'
                            ? 'La promenade est disponible uniquement avec un animal enregistré.\nRedirection vers la page d\'inscription.'
                            : 'Walk tracking is available only when you have a registered pet.\nRedirecting to pet registration page.';
                  alert(msg);
                  window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'profile' }));
                  setTimeout(() => {
                    window.dispatchEvent(new CustomEvent('walwal_open_pet_register'));
                  }, 150);
                  return;
                }
                const targetDogs = getTargetDogsToStart();
                if (!targetDogs || targetDogs.length === 0) return;
                startWalk(targetDogs);
              }}
            >
              <span className="start-btn-label">
                {language === 'ko' ? '산책 시작'
                  : language === 'ja' ? 'お散歩スタート'
                    : language === 'es' ? 'Empezar paseo'
                      : language === 'zh' ? '开始散步'
                        : language === 'fr' ? 'Commencer la promenade'
                          : 'Start'}
              </span>
            </button>
          </div>
        ) : (
          /* 산책 진행 중 / 일시정지: 하단 트래킹 시트 (Nike / Strava 스타일 - 사용자 스크린샷 4, 5 매칭) */
          <div className={`community-bottom-tracking-sheet ${activeSession.isPaused ? 'paused' : ''}`}>
            {/* 시트 상단 바: 반려견 이름 및 보조 액션 (+100m 테스트, 일지) */}
            <div className="sheet-top-bar">
              <div className="sheet-dog-info">
                <span className={`sheet-live-dot ${activeSession.isPaused ? 'paused' : ''}`} />
                <span className="sheet-dog-title">
                  {activeSession.isPaused
                    ? (language === 'ko' ? `${activeSession.dogName} 산책 일시정지됨`
                      : language === 'ja' ? `${activeSession.dogName}のお散歩一時停止中`
                        : language === 'es' ? `Paseo con ${activeSession.dogName} en pausa`
                          : language === 'zh' ? `${activeSession.dogName} 散步已暂停`
                            : language === 'fr' ? `Promenade avec ${activeSession.dogName} en pause`
                              : `${activeSession.dogName} Paused`)
                    : (language === 'ko' ? `${activeSession.dogName}와(과) 산책 중`
                      : language === 'ja' ? `${activeSession.dogName}とお散歩中`
                        : language === 'es' ? `Paseando con ${activeSession.dogName}`
                          : language === 'zh' ? `与${activeSession.dogName}散步中`
                            : language === 'fr' ? `En promenade avec ${activeSession.dogName}`
                              : `Walking with ${activeSession.dogName}`)}
                </span>
              </div>
              <div className="sheet-aux-actions">
                <button
                  type="button"
                  className="sheet-aux-btn"
                  onClick={() => addSimulatedWalkDistance(0.1)}
                  title="실내 테스트: +0.1km 추가"
                >
                  +100m
                </button>
                <button
                  type="button"
                  className="sheet-aux-btn logs"
                  onClick={() => setShowWalkHistoryModal(true)}
                >
                  {language === 'ko' ? '일지 보기' : language === 'ja' ? '記録' : language === 'es' ? 'Registros' : language === 'zh' ? '日志' : language === 'fr' ? 'Journal' : 'Logs'}
                </button>
              </div>
            </div>

            {/* 대형 핵심 메트릭 (스크린샷 4/5 스타일: 0.00 KM) */}
            <div className="sheet-hero-metric-section">
              <div className="sheet-hero-metric">
                <span className="hero-metric-value">{activeSession.distanceKm.toFixed(2)}</span>
                <span className="hero-metric-unit">KM</span>
              </div>
              <div className={`sheet-status-pill ${activeSession.isPaused ? 'paused' : ''}`}>
                <PawPrint size={12} strokeWidth={2.5} />
                <span>
                  {activeSession.isPaused
                    ? 'PAUSED'
                    : 'START MOVING!'}
                </span>
              </div>
            </div>



            {/* 3단 메트릭 그리드 (스크린샷 4 & 5 매칭: DISTANCE / DURATION / CALORIES) */}
            <div className="sheet-metrics-grid">
              <div className="sheet-metric-col">
                <span className="col-label">DISTANCE</span>
                <span className="col-val"><strong>{activeSession.distanceKm.toFixed(2)} </strong><small>KM</small></span>
              </div>
              <div className="sheet-metric-col">
                <span className="col-label">DURATION</span>
                <span className="col-val"><strong>{formatTimer(activeSession.elapsedSeconds)}</strong></span>
              </div>
              <div className="sheet-metric-col">
                <span className="col-label">CALORIES</span>
                <span className="col-val"><strong>{activeSession.caloriesKcal} </strong><small>KCAL</small></span>
              </div>
            </div>

            {/* 액션 컨트롤 버튼들 (스크린샷 4 & 5 매칭) */}
            <div className="sheet-action-btns">
              {!activeSession.isPaused ? (
                /* 진행 중: 전체 너비 블랙 PAUSE RUN 버튼 (스크린샷 4) */
                <button
                  type="button"
                  className="sheet-btn-pause-full"
                  onClick={() => pauseWalk()}
                >
                  <Pause size={15} fill="currentColor" />
                  <span>{language === 'ko' ? 'PAUSE RUN (일시정지)' : language === 'ja' ? '一時停止' : language === 'es' ? 'Pausar' : language === 'zh' ? '暂停' : language === 'fr' ? 'Pause' : 'PAUSE RUN'}</span>
                </button>
              ) : (
                /* 일시정지 중: RESUME RUN(블랙) + FINISH(화이트 아웃라인) 나란히 배치 (스크린샷 5) */
                <div className="sheet-btn-row-paused">
                  <button
                    type="button"
                    className="sheet-btn-resume"
                    onClick={() => resumeWalk()}
                  >
                    <Play size={15} fill="currentColor" />
                    <span>{language === 'ko' ? 'RESUME RUN' : language === 'ja' ? 'RESUME RUN' : language === 'es' ? 'RESUME RUN' : language === 'zh' ? 'RESUME RUN' : language === 'fr' ? 'RESUME RUN' : 'RESUME RUN'}</span>
                  </button>
                  <button
                    type="button"
                    className="sheet-btn-finish"
                    onClick={() => {
                      setActiveSession(null);
                      stopWalk();
                    }}
                  >
                    <Square size={15} fill="currentColor" />
                    <span>{language === 'ko' ? 'FINISH (종료)' : language === 'ja' ? 'FINISH (終了)' : language === 'es' ? 'FINISH (Terminar)' : language === 'zh' ? 'FINISH (结束)' : language === 'fr' ? 'FINISH (Terminer)' : 'HOLD TO FINISH'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
