import React, { useState, useEffect } from 'react';
import { User, Globe, Settings, Award, Zap, Heart, Shield, Sparkles, Edit3, Plus, Camera, X, Check, Upload, LogOut, Trash2, MapPin, Clock, Calendar, ChevronRight, Menu } from 'lucide-react';
import { DogProfile, MOCK_DOGS, getMockDogs, isSameDogName, getDefaultDogAvatar, normalizeDogProfile, localizeBreed, localizePersonalityTags, localizeDogName, isMockNeighborDog, isDeletedPet, sanitizePetList } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { auth, db } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { signOut, deleteUser, onAuthStateChanged } from 'firebase/auth';
import { SettingsView } from './SettingsView';
import { WalkHistoryModal } from './WalkHistoryModal';
import { saveDogProfile, deleteDogProfile } from '../services/db';
import '../styles/ProfileView.css';

interface ProfileViewProps {
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=500&auto=format&fit=crop&q=80',
  'https://images.dog.ceo/breeds/maltese/n02085936_2927.jpg',
  'https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=300&auto=format&fit=crop&q=80',
  'https://images.dog.ceo/breeds/pomeranian/n02112018_4813.jpg',
  'https://images.dog.ceo/breeds/shiba/shiba-16.jpg',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=300&auto=format&fit=crop&q=80',
  'https://images.dog.ceo/breeds/poodle-toy/n02113624_6683.jpg',
  'https://images.dog.ceo/breeds/beagle/n02088364_10108.jpg'
];

export const calculateDDay = (dateStr?: string, fallbackAgeStr?: string): number => {
  if (dateStr) {
    const targetDate = new Date(dateStr);
    const today = new Date();
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - targetDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(1, diffDays);
  }
  const age = parseInt(fallbackAgeStr || '1', 10) || 1;
  return age * 365;
};

export const getDefaultAdoptionDate = (ageStr?: string): string => {
  const age = parseInt(ageStr || '1', 10) || 1;
  const d = new Date();
  d.setFullYear(d.getFullYear() - age);
  return d.toISOString().split('T')[0];
};

export const ProfileView: React.FC<ProfileViewProps> = () => {
  const { language, setLanguage, t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  const [showWalkHistoryModal, setShowWalkHistoryModal] = useState(false);
  const [walkHistoryTab, setWalkHistoryTab] = useState<'distance' | 'time'>('distance');

  // Auth & Admin state
  const [currentUser, setCurrentUser] = useState<any>(auth.currentUser);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setCurrentUser(u);
      if (u?.email) {
        localStorage.setItem('WALWAL_USER_EMAIL', u.email);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const handleOpenSettings = () => setShowSettings(true);
    const handleOpenWalkHistory = () => setShowWalkHistoryModal(true);
    window.addEventListener('walwal_open_settings', handleOpenSettings);
    window.addEventListener('walwal_open_walk_history', handleOpenWalkHistory);
    return () => {
      window.removeEventListener('walwal_open_settings', handleOpenSettings);
      window.removeEventListener('walwal_open_walk_history', handleOpenWalkHistory);
    };
  }, []);

  const isDaisynara = React.useMemo(() => {
    const email = (currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '').toLowerCase().trim();
    return email === 'daisynara@gmail.com' || email.includes('daisynara') || localStorage.getItem('WALWAL_ADMIN_AUTH') === 'true';
  }, [currentUser]);

  // Load pets from localStorage or fallback
  const [pets, setPets] = useState<DogProfile[]>(() => {
    const saved = localStorage.getItem('WALWAL_PETS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const sanitized = sanitizePetList(parsed, language);
          localStorage.setItem('WALWAL_PETS', JSON.stringify(sanitized));
          return sanitized;
        }
      } catch (e) { }
    }
    const defaultList = [getMockDogs(language)[0]];
    localStorage.setItem('WALWAL_PETS', JSON.stringify(defaultList));
    return defaultList;
  });

  // Re-normalize when language changes
  useEffect(() => {
    setPets(prev => {
      const sanitized = sanitizePetList(prev, language);
      localStorage.setItem('WALWAL_PETS', JSON.stringify(sanitized));
      return sanitized;
    });
  }, [language]);

  const [activePetIndex, setActivePetIndex] = useState<number>(0);

  const rawPet = pets[activePetIndex] || pets[0] || getMockDogs(language)[0];
  const myDog = normalizeDogProfile(rawPet, language);

  // Modal states
  const [modalMode, setModalMode] = useState<'edit' | 'add' | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formBreed, setFormBreed] = useState(t.profile.breedOptions?.[0] || '골든 리트리버');
  const [formAge, setFormAge] = useState('1');
  const [formGender, setFormGender] = useState<'male' | 'female'>('male');
  const [formOwnerTitle, setFormOwnerTitle] = useState<'mom' | 'dad'>('mom');
  const [formAvatar, setFormAvatar] = useState(AVATAR_PRESETS[0]);
  const [formPersonalities, setFormPersonalities] = useState<string[]>([]);
  const [formGreeting, setFormGreeting] = useState('');
  const [formAdoptionDate, setFormAdoptionDate] = useState('');
  const [customTag, setCustomTag] = useState<string>('');

  const studioCount = React.useMemo(() => {
    let count = myDog.stats?.studioCount || 0;
    try {
      // Always double check localStorage to prevent stale state issues
      const savedPets = localStorage.getItem('WALWAL_PETS');
      if (savedPets) {
        const pets = JSON.parse(savedPets);
        const pet = pets.find((p: any) => p.name === myDog.name);
        if (pet?.stats?.studioCount) {
          count = Math.max(count, pet.stats.studioCount);
        }
      }

      const savedCounts = localStorage.getItem('WALWAL_STUDIO_COUNTS');
      if (savedCounts) {
        const counts = JSON.parse(savedCounts);
        if (counts[myDog.name]) {
          count = Math.max(count, counts[myDog.name]);
        }
      }
    } catch (e) { }
    return count;
  }, [myDog.name, myDog.stats?.studioCount]);

  const joinedMeetupsCount = React.useMemo(() => {
    try {
      const saved = localStorage.getItem('WALWAL_MEETUPS');
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed.filter((m: any) => m.participants?.some((p: any) => p.name === myDog.name)).length;
      }
    } catch (e) { }
    // Fallback based on INITIAL_MEETUPS where Bori is in m1 and m4
    return isSameDogName(myDog.name, '보리') ? 2 : 1;
  }, [myDog.name]);

  // Sync to localStorage and Firestore
  const savePetsToStorage = (updated: DogProfile[]) => {
    const sanitized = sanitizePetList(updated, language);
    setPets(sanitized);
    localStorage.setItem('WALWAL_PETS', JSON.stringify(sanitized));
    window.dispatchEvent(new Event('walwal_pets_updated'));
    // 클라우드 Firestore dogs 컬렉션에도 실제 가입된 반려견으로 동기화 (유효한 반려견만)
    sanitized.forEach(pet => {
      if (!isMockNeighborDog(pet) && !isDeletedPet(pet)) {
        saveDogProfile(pet, currentUser?.uid);
      }
    });
  };

  // 앱 로드 시 로컬 반려견 프로필을 Firestore에 동기화 (기존 mock 제외, 유효한 사용자 반려견만)
  useEffect(() => {
    if (pets && pets.length > 0) {
      pets.forEach(pet => {
        if (!isMockNeighborDog(pet) && !isDeletedPet(pet) && pet.id !== 'dog-1') {
          saveDogProfile(pet, currentUser?.uid);
        }
      });
    }
  }, []);

  // 다른 기기나 도메인(예: localhost -> walwal-app.web.app)에서 등록/삭제된 반려견 실시간 자동 동기화
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'dogs'), (snapshot) => {
      if (snapshot.empty) return;
      const remoteDogs: DogProfile[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        if (data && data.name) {
          remoteDogs.push({ id: docSnap.id, ...data } as DogProfile);
        }
      });

      const currentEmail = (currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '').toLowerCase().trim();

      // 현재 사용자가 소유한 원격 반려견만 엄격히 필터링 (다른 사람의 반려견이나 mock 이웃 반려견 유입 방지)
      const myRemoteDogs = remoteDogs.filter(rd => {
        if (isMockNeighborDog(rd) || isDeletedPet(rd)) return false;
        const ownerEmail = (rd.ownerEmail || '').toLowerCase().trim();
        if (isDaisynara) {
          return ownerEmail === 'daisynara@gmail.com' || !ownerEmail || rd.id === 'dog-1';
        }
        if (currentEmail) {
          return ownerEmail === currentEmail || rd.id === 'dog-1';
        }
        return !ownerEmail && rd.id === 'dog-1';
      });

      if (myRemoteDogs.length === 0) return;

      setPets(prevPets => {
        const cleanPrev = sanitizePetList(prevPets, language);
        const petList: DogProfile[] = [];

        // 1. 원격에서 현재 사용자의 등록된 반려견 추가 (이름 및 ID 중복 방지)
        myRemoteDogs.forEach(rd => {
          const already = petList.some(d => isSameDogName(d.name, rd.name) || (rd.id && d.id === rd.id));
          if (!already) {
            petList.push(normalizeDogProfile(rd, language));
          }
        });

        // 2. 로컬에만 있는 유효한 반려견(오프라인 추가 등) 유지
        cleanPrev.forEach(p => {
          const already = petList.some(d => isSameDogName(d.name, p.name) || (p.id && d.id === p.id));
          if (!already && !isDeletedPet(p) && !isMockNeighborDog(p)) {
            petList.push(normalizeDogProfile(p, language));
          }
        });

        const merged = sanitizePetList(petList, language);
        if (merged.length === 0) return cleanPrev;

        localStorage.setItem('WALWAL_PETS', JSON.stringify(merged));
        window.dispatchEvent(new Event('walwal_pets_updated'));
        return merged;
      });
    }, (err) => {
      console.warn('ProfileView dogs onSnapshot error:', err);
    });

    return () => unsub();
  }, [language, currentUser, isDaisynara]);

  // Open Edit Modal
  const openEditModal = () => {
    setFormName(myDog.name);
    setFormBreed(myDog.breed);
    setFormAge(myDog.age);
    setFormGender(myDog.gender || 'male');
    setFormOwnerTitle(myDog.ownerName?.includes(t.profile.dad) || myDog.ownerName?.includes('아빠') || myDog.ownerName?.includes('Dad') ? 'dad' : 'mom');
    setFormAvatar(myDog.avatar);
    setFormPersonalities([...myDog.personality]);
    setFormGreeting(myDog.greeting || '');
    setFormAdoptionDate(myDog.adoptionDate || getDefaultAdoptionDate(myDog.age));
    setModalMode('edit');
  };

  // Open Add Modal
  const openAddModal = () => {
    setFormName('');
    setFormBreed(t.profile.breedOptions?.[0] || '골든 리트리버');
    setFormAge('1');
    setFormGender('male');
    setFormOwnerTitle('mom');
    setFormAvatar(AVATAR_PRESETS[1]);
    setFormPersonalities(t.profile.presetPersonalities?.slice(0, 2) || []);
    setFormGreeting('');
    setFormAdoptionDate(new Date().toISOString().split('T')[0]);
    setModalMode('add');
  };

  // Handle Photo Upload (Modal)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setFormAvatar(uploadEvent.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Direct Photo Upload on Profile Avatar Camera Click
  const handleDirectPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          const newAvatar = uploadEvent.target.result as string;
          const updated = pets.map((p, idx) => {
            if (idx === activePetIndex) {
              return { ...p, avatar: newAvatar };
            }
            return p;
          });
          savePetsToStorage(updated);
        }
      };
      reader.readAsDataURL(file);
    }
    // reset target value so selecting the same file again triggers change
    e.target.value = '';
  };

  // Toggle Personality Tag
  const toggleTag = (tag: string) => {
    if (formPersonalities.includes(tag)) {
      setFormPersonalities(formPersonalities.filter(t => t !== tag));
    } else {
      if (formPersonalities.length < 5) {
        setFormPersonalities([...formPersonalities, tag]);
      } else {
        alert(language === 'ko' ? '성격 태그는 최대 5개까지 선택할 수 있습니다.' : 'You can select up to 5 personality tags.');
      }
    }
  };

  // Add Custom Tag
  const addCustomTag = () => {
    const raw = customTag.trim();
    if (!raw) return;
    const formatted = raw.startsWith('#') ? raw : '#' + raw;
    if (formPersonalities.includes(formatted)) {
      setCustomTag('');
      return;
    }
    if (formPersonalities.length >= 5) {
      alert(language === 'ko' ? '성격 태그는 최대 5개까지 선택할 수 있습니다.' : 'You can select up to 5 personality tags.');
      return;
    }
    setFormPersonalities(prev => [...prev, formatted]);
    setCustomTag('');
  };

  // Save Form Handler
  const handleSave = () => {
    if (!formName.trim()) {
      alert(t.profile.alertNameRequired || 'Please enter your dog\'s name!');
      return;
    }

    if (modalMode === 'edit') {
      const updated = pets.map((p, idx) => {
        if (idx === activePetIndex) {
          return {
            ...p,
            name: formName.trim(),
            breed: formBreed,
            age: formAge.trim(),
            gender: formGender,
            ownerName: `${formName.trim()} ${formOwnerTitle === 'dad' ? t.profile.dad : t.profile.mom}`,
            avatar: formAvatar,
            personality: formPersonalities.length > 0 ? formPersonalities : [t.profile.presetPersonalities?.[0] || '#댕댕이'],
            greeting: formGreeting.trim(),
            adoptionDate: formAdoptionDate,
          };
        }
        return p;
      });
      savePetsToStorage(updated);
    } else if (modalMode === 'add') {
      const newPet: DogProfile = {
        id: 'pet-' + Date.now(),
        name: formName.trim(),
        breed: formBreed,
        age: formAge.trim(),
        gender: formGender,
        ownerName: `${formName.trim()} ${formOwnerTitle === 'dad' ? t.profile.dad : t.profile.mom}`,
        avatar: formAvatar || AVATAR_PRESETS[0],
        personality: formPersonalities.length > 0 ? formPersonalities : [t.profile.presetPersonalities?.[0] || '#새로운댕댕이'],
        greeting: formGreeting.trim(),
        adoptionDate: formAdoptionDate || new Date().toISOString().split('T')[0],
        walkDistance: 0.0,
        walkMinutes: 0,
        distance: '0m',
        lat: 37.4200,
        lng: 127.1267,
        recentThought: language === 'ko' ? '우리 가족이 최고야! 오늘도 재미있게 놀자!' : "My family is the best! Let's play today!",
        detectedEmotion: 'happy',
        soundPattern: language === 'ko' ? '왈! 멍멍!' : 'Woof! Bark!',
        posePattern: language === 'ko' ? '신나게 꼬리 흔들기' : 'Wagging tail happily',
        conversationLog: [],
        stats: {
          translateCount: 0,
          studioCount: 0,
          meetupCount: 0
        }
      };
      // 새 반려견 추가 시 이전에 삭제 목록에 있었던 이름이면 복원 허용
      try {
        const raw = localStorage.getItem('WALWAL_DELETED_PETS');
        if (raw) {
          const list: string[] = JSON.parse(raw);
          const filtered = list.filter(item => item !== formName.trim());
          localStorage.setItem('WALWAL_DELETED_PETS', JSON.stringify(filtered));
        }
      } catch (e) { }

      const updated = [...pets, newPet];
      savePetsToStorage(updated);
      setActivePetIndex(updated.length - 1);
    }

    setModalMode(null);
  };

  // Delete Pet Handler
  const handleDeletePet = async (indexToDelete?: number) => {
    const targetIdx = typeof indexToDelete === 'number' ? indexToDelete : activePetIndex;
    const targetPet = pets[targetIdx] || myDog;
    if (!targetPet) return;

    if (pets.length <= 1) {
      alert(language === 'ko'
        ? '반려견이 최소 1마리 이상 등록되어 있어야 합니다. 새 반려견을 추가한 후 삭제해주세요.'
        : 'At least one dog profile is required. Please add a new dog before deleting this one.');
      return;
    }

    const confirmMsg = language === 'ko'
      ? `'${targetPet.name}' 반려견을 정말 삭제하시겠습니까?`
      : `Are you sure you want to delete '${targetPet.name}'?`;
    if (!window.confirm(confirmMsg)) return;

    // 1. Record in WALWAL_DELETED_PETS
    try {
      const raw = localStorage.getItem('WALWAL_DELETED_PETS');
      const list: string[] = raw ? JSON.parse(raw) : [];
      if (targetPet.id && !list.includes(targetPet.id)) list.push(targetPet.id);
      if (targetPet.name && !list.includes(targetPet.name)) list.push(targetPet.name);
      localStorage.setItem('WALWAL_DELETED_PETS', JSON.stringify(list));
    } catch (e) { }

    // 2. Delete from Firestore
    if (targetPet.id) {
      await deleteDogProfile(targetPet.id, currentUser?.uid);
    }

    // 3. Update local state
    const remaining = pets.filter((_, idx) => idx !== targetIdx);
    const updated = sanitizePetList(remaining, language);
    setPets(updated);
    localStorage.setItem('WALWAL_PETS', JSON.stringify(updated));

    if (activePetIndex >= updated.length) {
      setActivePetIndex(Math.max(0, updated.length - 1));
    } else if (targetIdx === activePetIndex) {
      setActivePetIndex(Math.max(0, Math.min(activePetIndex, updated.length - 1)));
    } else if (targetIdx < activePetIndex) {
      setActivePetIndex(prev => Math.max(0, prev - 1));
    }

    setModalMode(null);
    window.dispatchEvent(new Event('walwal_pets_updated'));

    alert(language === 'ko' ? `'${targetPet.name}' 반려견이 삭제되었습니다.` : `'${targetPet.name}' has been deleted.`);
  };


  if (showSettings) return <SettingsView onClose={() => setShowSettings(false)} />;

  return (
    <div className="page-root">
      {/* Top Header */}
      <div className="page-header row-between">
        <div>
          <h2 className="title-lg">{t.profile.title}</h2>
          <p className="text-sub">{t.profile.subtitle}</p>
        </div>

        <div className="profile-header-actions" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          <button onClick={() => setShowSettings(true)} className='btn-ghost'>
            <Settings size={24} strokeWidth={2} />
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

      {/* Multi-Pet Selector Tabs */}
      <div className="petNameSection">
        <div className="row">
          {pets.map((pet, idx) => {
            const normalizedPet = normalizeDogProfile(pet, language);
            const isActive = activePetIndex === idx;
            return (
              <button
                className={`petNameBtn ${isActive ? 'active' : ''}`}
                key={pet.id || idx}
                onClick={() => setActivePetIndex(idx)}
              >
                <img src={normalizedPet.avatar} alt={normalizedPet.name} />
                <span>{normalizedPet.name}</span>
                {pets.length > 1 && (
                  <span
                    className="petTabDeleteBtn"
                    title={language === 'ko' ? `${normalizedPet.name} 삭제` : `Delete ${normalizedPet.name}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeletePet(idx);
                    }}
                  >
                    <X size={12} strokeWidth={2.5} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <button
          onClick={openAddModal}
          className="btn-ghost"
          title={language === 'ko' ? '반려견 추가' : 'Add Pet'}
        >
          <Plus size={28} strokeWidth={2} />
        </button>
      </div>

      {/* Pet Card */}
      <div className="card-lg mb-20 profile-card">

        {/* Avatar with Camera Icon */}
        <div className="profile-avatar-wrapper">
          <img className='dogAvata'
            src={myDog.avatar}
            alt={myDog.name}
            onClick={openEditModal}
          />
          <label className="editAvata" title="프로필 사진 변경">
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleDirectPhotoUpload}
            />
            <Camera size={24} color="#fff" />
          </label>
        </div>

        <h3 className="title-lg profile-name">
          {myDog.name}
          {/* Edit Button */}
          <button className='btn-ghost editProfileBtn'
            onClick={openEditModal}
            title={language === 'ko' ? '프로필 수정' : 'Edit Profile'}
          >
            <Edit3 size={16} />
          </button>
          {/* Delete Button */}
          {pets.length > 1 && (
            <button className='btn-ghost deleteProfileBtn'
              onClick={() => handleDeletePet(activePetIndex)}
              title={language === 'ko' ? '반려견 삭제' : 'Delete Pet'}
            >
              <Trash2 size={16} />
            </button>
          )}
        </h3>
        <p className="text-sub mt-4">
          {localizeBreed(myDog.breed, language)} &middot; {myDog.age}{t.profile.dogAgeSuffix}  &middot; {(myDog.gender || 'female') === 'female' ? t.common?.genderShortFemale : t.common?.genderShortMale}
        </p>

        {/* Personality Tags */}
        <div className="profile-tags-wrapper">
          {localizePersonalityTags(myDog.personality, language).map((tag, i) => (
            <span key={i} className="badge-primary">
              {tag}
            </span>
          ))}
        </div>


        {/* Greetings */}
        <div className="profile-greeting-wrapper">
          <div className="profile-greeting-inner">
            "{myDog.greeting || t.profile?.greetingEmpty || '반갑습니다! 인사말을 등록해주세요'}"
          </div>
        </div>
      </div>



      {/* Stats List: 3 Full-width Rows (Today Walk Distance, Today Walk Time, Days Together) */}
      <div className="profile-stats-list">
        {/* Row 1: Today Walk Distance */}
        <div
          className="profile-stat-row-card clickable"
          onClick={() => {
            setWalkHistoryTab('distance');
            setShowWalkHistoryModal(true);
          }}
          title={language === 'ko' ? '거리 & 코스 분석 보기' : 'View Distance & Course'}
        >
          <div className="profile-stat-icon-wrapper distance">
            <MapPin size={22} strokeWidth={2.5} />
          </div>
          <div className="profile-stat-content">
            <div className="profile-stat-line primary">
              <span className="profile-stat-label-main">
                {t.profile.statTodayDistance || (language === 'ko' ? '오늘 산책 거리' : 'Today Walk')}
              </span>
              <span className="profile-stat-val-main distance">
                {(myDog.todayWalkDistance !== undefined ? myDog.todayWalkDistance : 1.8).toFixed(1)} km
              </span>
            </div>
            <div className="profile-stat-line secondary">
              <span className="profile-stat-label-sub">
                {t.profile.totalDistanceLabel || (language === 'ko' ? '누적 거리' : 'Total Distance')}
              </span>
              <span className="profile-stat-val-sub">
                {(myDog.walkDistance !== undefined ? myDog.walkDistance : 35).toFixed(0)} km
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="profile-stat-arrow" />
        </div>

        {/* Row 2: Today Walk Time */}
        <div
          className="profile-stat-row-card clickable"
          onClick={() => {
            setWalkHistoryTab('time');
            setShowWalkHistoryModal(true);
          }}
          title={language === 'ko' ? '시간 & 활동량 분석 보기' : 'View Time & Activity'}
        >
          <div className="profile-stat-icon-wrapper time">
            <Clock size={22} strokeWidth={2.5} />
          </div>
          <div className="profile-stat-content">
            <div className="profile-stat-line primary">
              <span className="profile-stat-label-main">
                {t.profile.statTodayTime || (language === 'ko' ? '오늘 산책 시간' : 'Today Time')}
              </span>
              <span className="profile-stat-val-main time">
                {myDog.todayWalkMinutes !== undefined ? myDog.todayWalkMinutes : 45} {t.profile.walkMinSuffix || (language === 'ko' ? '분' : 'min')}
              </span>
            </div>
            <div className="profile-stat-line secondary">
              <span className="profile-stat-label-sub">
                {t.profile.totalTimeLabel || (language === 'ko' ? '누적 시간' : 'Total Time')}
              </span>
              <span className="profile-stat-val-sub">
                {myDog.walkMinutes !== undefined ? myDog.walkMinutes : 320} {t.profile.walkMinSuffix || (language === 'ko' ? '분' : 'min')}
              </span>
            </div>
          </div>
          <ChevronRight size={18} className="profile-stat-arrow" />
        </div>

        {/* Row 3: Days Together (D-Day) */}
        <div className="profile-stat-row-card">
          <div className="profile-stat-icon-wrapper dday">
            <Calendar size={22} strokeWidth={2.5} />
          </div>
          <div className="profile-stat-content">
            <div className="profile-stat-line primary">
              <span className="profile-stat-label-main">
                {t.profile.statDays || (language === 'ko' ? '함께한 날' : 'Days Together')}
              </span>
              <span className="profile-stat-val-main dday">
                D+{calculateDDay(myDog.adoptionDate, myDog.age)}
              </span>
            </div>
            <div className="profile-stat-line secondary">
              <span className="profile-stat-label-sub">
                {t.profile.sinceAdoption || (language === 'ko' ? '가족이 된 날' : 'Adoption Day')}
              </span>
              <span className="profile-stat-val-sub">
                {myDog.adoptionDate || getDefaultAdoptionDate(myDog.age)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Edit or Add Pet Profile */}
      {modalMode && (
        <div className="modal-overlay">
          <div className="modal-box">
            {/* Modal Header */}
            <div className="modal-header">
              <div className="row gap-10">
                <h3 className="title-lg">
                  {modalMode === 'edit' ? t.profile.modalEdit : t.profile.modalAdd}
                </h3>
              </div>
              <button onClick={() => setModalMode(null)} className="btn-ghost profile-modal-close">
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Photo Avatar Section */}
            <div className="col mb-24 profile-avatar-section">
              <div className="profile-avatar-preview-wrapper">
                <img
                  src={formAvatar}
                  alt="avatar preview"
                  className="profile-avatar-preview"
                />
                <label className="profile-avatar-upload">
                  <Camera size={16} color="#fff" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>
              <span className="text-sub mt-10">{t.profile.uploadPhoto}</span>

              {/* Preset Avatars */}
              <div className="profile-presets-wrapper">
                {AVATAR_PRESETS.map((preset, i) => (
                  <img
                    key={i}
                    src={preset}
                    alt="preset"
                    onClick={() => setFormAvatar(preset)}
                    className="profile-preset-img"
                    style={{
                      border: formAvatar === preset ? '3px solid #FFB320' : '1px solid rgba(0,0,0,0.1)',
                      transform: formAvatar === preset ? 'scale(1.15)' : 'scale(1)'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Input: Name */}
            <div className="mb-18">
              <label className="form-label">
                {t.profile.dogName} <span className="profile-required-star">*</span>
              </label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t.profile.dogNamePlaceholder}
                className="form-input"
              />
            </div>

            {/* Input: Breed */}
            <div className="mb-18">
              <label className="form-label">
                {t.profile.dogBreed}
              </label>
              <select
                value={formBreed}
                onChange={(e) => setFormBreed(e.target.value)}
                className="form-input"
              >
                {t.profile.breedOptions?.map((b: string) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>
            {/* Input: Age, Adoption Date, Gender, Owner Title */}
            {/* Age */}
            <div className="mb-18">
              <label className="form-label">
                {t.profile.dogAge}
              </label>
              <div className="profile-age-wrapper">
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  placeholder={t.profile.dogAgePlaceholder}
                  className="form-input profile-age-input"
                />
                <span className="profile-age-suffix">
                  {t.profile.dogAgeSuffix}
                </span>
              </div>
            </div>

            {/* Adoption Date / Birthday */}
            <div className="mb-18">
              <label className="form-label">
                {t.profile?.adoptionDate ||
                  (language === 'ko' ? '함께한 날 (생일 / 입양일)' :
                   language === 'zh' ? '陪伴时光（生日 / 领养日）' :
                   language === 'ja' ? '一緒に過ごした日（誕生日・お迎え日）' :
                   language === 'fr' ? "Date de naissance / d'adoption" :
                   language === 'es' ? 'Fecha de nacimiento / adopción' : 'Birthday / Adoption Date')}
              </label>
              <input
                type="date"
                value={formAdoptionDate}
                onChange={(e) => setFormAdoptionDate(e.target.value)}
                className="form-input"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>

            {/* Gender */}
            <div className="mb-18">
              <label className="form-label">
                {t.profile.genderLabel}
              </label>
              <div className="profile-toggle-wrapper">
                <button
                  type="button"
                  onClick={() => setFormGender('female')}
                  className={`profile-toggle-btn ${formGender === 'female' ? 'active' : ''}`}
                >
                  {t.profile.genderFemale}
                </button>
                <button
                  type="button"
                  onClick={() => setFormGender('male')}
                  className={`profile-toggle-btn ${formGender === 'male' ? 'active' : ''}`}
                >
                  {t.profile.genderMale}
                </button>
              </div>
            </div>

            {/* Owner Title */}
            <div className="mb-18">
              <label className="form-label">
                {t.profile.ownerTitleSelect}
              </label>
              <div className="profile-toggle-wrapper">
                <button
                  type="button"
                  onClick={() => setFormOwnerTitle('mom')}
                  className={`profile-toggle-btn ${formOwnerTitle === 'mom' ? 'active' : ''}`}
                >
                  {t.profile.mom}
                </button>
                <button
                  type="button"
                  onClick={() => setFormOwnerTitle('dad')}
                  className={`profile-toggle-btn ${formOwnerTitle === 'dad' ? 'active' : ''}`}
                >
                  {t.profile.dad}
                </button>
              </div>
            </div>

            {/* Input: Personality Tags */}
            <div className="mb-24">
              <label className="form-label">
                {t.profile.personalityLimit}
              </label>

              {/* Tag Chips */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                {Array.from(new Set([...(t.profile.presetPersonalities || []), ...formPersonalities])).map((tag: string) => {
                  const isSelected = formPersonalities.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`tag-chip ${isSelected ? 'active' : ''}`}
                    >
                      {tag} {isSelected && '✓'}
                    </button>
                  );
                })}
              </div>

              {/* Custom Tag Input */}
              <div className="profile-tag-input-wrapper">
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder={t.profile.addTagPlaceholder}
                  className="form-input profile-tag-input"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="btn-ghost"
                  title="ADD"
                >
                  <Plus size={24} strokeWidth={2} />
                </button>
              </div>
            </div>

            {/* Input: Greeting */}
            <div className="mb-24">
              <label className="form-label">
                {t.profile?.greetingLabel || '인사말'}
              </label>
              <input
                type="text"
                value={formGreeting}
                onChange={(e) => setFormGreeting(e.target.value)}
                placeholder={t.profile?.greetingPlaceholder || '예: 안녕하세요! 우리 강아지는 간식을 좋아해요.'}
                className="form-input"
              />
            </div>

            {/* Action Buttons */}
            <div className="row gap-12" style={{ marginTop: '10px' }}>
              {modalMode === 'edit' && (
                <button
                  type="button"
                  onClick={() => handleDeletePet(activePetIndex)}
                  className="profile-action-cancel"
                  title={language === 'ko' ? '반려견 삭제' : language === 'zh' ? '删除狗狗' : language === 'ja' ? '愛犬を削除' : language === 'fr' ? 'Supprimer le profil' : language === 'es' ? 'Eliminar perro' : 'Delete Pet'}
                >
                  <Trash2 size={18} /> {language === 'ko' ? '삭제' : language === 'zh' ? '删除' : language === 'ja' ? '削除' : language === 'fr' ? 'Supprimer' : language === 'es' ? 'Eliminar' : 'Delete'}
                </button>
              )}
              <button
                type="button"
                onClick={() => setModalMode(null)}
                className="profile-action-cancel"
              >
                {t.profile.cancel}
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="profile-action-save"
              >
                <Check size={18} strokeWidth={3} /> {t.profile.save}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Walk History Modal */}
      {showWalkHistoryModal && (
        <WalkHistoryModal
          dog={myDog}
          initialTab={walkHistoryTab}
          onClose={() => setShowWalkHistoryModal(false)}
          onUpdateStats={(newDist, newMins) => {
            const updated = pets.map(p => {
              if (p.id === myDog.id) {
                return {
                  ...p,
                  walkDistance: newDist,
                  walkMinutes: newMins
                };
              }
              return p;
            });
            savePetsToStorage(updated);
          }}
        />
      )}
    </div>
  );
};
