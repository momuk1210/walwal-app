import React, { useState, useEffect } from 'react';
import { User, Globe, Settings, Award, Zap, Heart, Shield, Sparkles, Edit3, Plus, Camera, X, Check, Upload, LogOut, Trash2 } from 'lucide-react';
import { DogProfile, MOCK_DOGS, getMockDogs, isSameDogName, getDefaultDogAvatar, normalizeDogProfile, localizeBreed, localizePersonalityTags, localizeDogName } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { auth } from '../firebase';
import { signOut, deleteUser } from 'firebase/auth';
import { SettingsView } from './SettingsView';
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

export const ProfileView: React.FC<ProfileViewProps> = () => {
  const { language, setLanguage, t } = useTranslation();
  const [showSettings, setShowSettings] = useState(false);
  // Load pets from localStorage or fallback
  const [pets, setPets] = useState<DogProfile[]>(() => {
    const saved = localStorage.getItem('WALWAL_PETS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = parsed.map((p: DogProfile) => normalizeDogProfile(p, language));
          localStorage.setItem('WALWAL_PETS', JSON.stringify(list));
          return list;
        }
      } catch (e) { }
    }
    const defaultList = getMockDogs(language);
    localStorage.setItem('WALWAL_PETS', JSON.stringify(defaultList));
    return defaultList;
  });

  // Re-normalize when language changes
  useEffect(() => {
    setPets(prev => {
      const updated = prev.map(p => normalizeDogProfile(p, language));
      localStorage.setItem('WALWAL_PETS', JSON.stringify(updated));
      return updated;
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
    return myDog.name === '보리' || myDog.name === 'Bori' ? 2 : 1;
  }, [myDog.name]);

  // Sync to localStorage
  const savePetsToStorage = (updated: DogProfile[]) => {
    setPets(updated);
    localStorage.setItem('WALWAL_PETS', JSON.stringify(updated));
    window.dispatchEvent(new Event('walwal_pets_updated'));
  };

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
    setModalMode('add');
  };

  // Handle Photo Upload
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

  // Toggle Personality Tag
  const toggleTag = (tag: string) => {
    if (formPersonalities.includes(tag)) {
      setFormPersonalities(formPersonalities.filter(t => t !== tag));
    } else {
      if (formPersonalities.length < 5) {
        setFormPersonalities([...formPersonalities, tag]);
      }
    }
  };

  // Add Custom Tag
  const addCustomTag = () => {
    if (!customTag.trim()) return;
    const formatted = customTag.startsWith('#') ? customTag.trim() : '#' + customTag.trim();
    if (!formPersonalities.includes(formatted) && formPersonalities.length < 5) {
      setFormPersonalities([...formPersonalities, formatted]);
      setCustomTag('');
    }
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
            greeting: formGreeting.trim()
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
      const updated = [...pets, newPet];
      savePetsToStorage(updated);
      setActivePetIndex(updated.length - 1);
    }

    setModalMode(null);
  };


  if (showSettings) return <SettingsView onClose={() => setShowSettings(false)} />;

  return (
    <div className="page-root">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h2 className="title-lg">{t.profile.title}</h2>
          <p className="text-sub">{t.profile.subtitle}</p>
        </div>

        <div className="profile-header-actions">
          <button onClick={() => setShowSettings(true)} className='btn-ghost'>
            <Settings size={24} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Multi-Pet Selector Tabs */}
      <div className="petNameSection">
        <div className="row">
          {pets.map((pet, idx) => {
            const normalizedPet = normalizeDogProfile(pet, language);
            return (
              <button
                className={`petNameBtn ${activePetIndex === idx ? 'active' : ''}`}
                key={pet.id || idx}
                onClick={() => setActivePetIndex(idx)}
              >
                <img src={normalizedPet.avatar} alt={normalizedPet.name} />
                {normalizedPet.name}
              </button>
            );
          })}
        </div>
        <button
          onClick={openAddModal} className="btn-ghost" >
          <Plus size={24} strokeWidth={2} />
        </button>
      </div>

      {/* Pet Card */}
      <div className="card-lg mb-20 profile-card">
        {/* Edit Button on Top-Right */}
        <button className='btn-ghost editProfileBtn'
          onClick={openEditModal}
        >
          <Edit3 size={18} />
        </button>

        {/* Avatar with Camera Icon */}
        <div className="profile-avatar-wrapper" onClick={openEditModal}>
          <img className='dogAvata'
            src={myDog.avatar}
            alt={myDog.name}
          />
          <div className="editAvata">
            <Camera size={18} color="#fff" />
          </div>
        </div>

        <h3 className="title-lg profile-name">
          {myDog.name}
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
            "{myDog.greeting || t.profile?.greetingEmpty || '반갑습니다! 인사말을 등록해주세요 😊'}"
          </div>
        </div>
      </div>



      {/* Stats Grid */}
      <div className="grid-3 mb-24">
        <div className="card profile-stat-card">
          <div className="profile-stat-val-1">{myDog.conversationLog?.length || 0}</div>
          <div className="text-sub mt-6">{t.profile.statTranslate}</div>
        </div>
        <div className="card profile-stat-card">
          <div className="profile-stat-val-2">{studioCount}</div>
          <div className="text-sub mt-6">{t.profile.statWebtoon}</div>
        </div>
        <div className="card profile-stat-card">
          <div className="profile-stat-val-3">{joinedMeetupsCount}</div>
          <div className="text-sub mt-6">{t.profile.statMeetup}</div>
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

            {/* Input: Age, Gender, Owner Title */}
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
                {t.profile.presetPersonalities?.map((tag: string) => {
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
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomTag(); }}
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
            <div className="row gap-12">
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
      )
      }
    </div >
  );
};
