import React, { useState, useEffect } from 'react';
import { User, Globe, Settings, Award, Zap, Heart, Shield, Sparkles, Edit3, Plus, Camera, X, Check, Upload } from 'lucide-react';
import { DogProfile, MOCK_DOGS, getMockDogs, isSameDogName, getDefaultDogAvatar } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';

interface ProfileViewProps {
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1612774412771-005ed8e861d2?w=300&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1519098901909-b1553a1190af?w=300&auto=format&fit=crop&q=80',
  'https://images.dog.ceo/breeds/maltese/n02085936_2927.jpg',
  'https://images.dog.ceo/breeds/poodle-toy/n02113624_6683.jpg',
  'https://images.dog.ceo/breeds/pomeranian/n02112018_4813.jpg',
  'https://images.dog.ceo/breeds/shiba/shiba-16.jpg',
  'https://images.dog.ceo/breeds/beagle/n02088364_10108.jpg'
];

export const ProfileView: React.FC<ProfileViewProps> = () => {
  const { language, setLanguage, t } = useTranslation();
  // Load pets from localStorage or fallback
  const [pets, setPets] = useState<DogProfile[]>(() => {
    const saved = localStorage.getItem('WALWAL_PETS');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((p: DogProfile) => {
            const mock = getMockDogs('ko').find(m => m.id === p.id || isSameDogName(m.name, p.name));
            return {
              ...p,
              // 저장된 avatar 최우선, 없을 때만 mock/기본값 사용
              avatar: p.avatar || mock?.avatar || getDefaultDogAvatar(p.name || p.breed),
              gender: p.gender || mock?.gender || 'male',
              age: p.age ? String(p.age).replace(/[^0-9]/g, '') : '1'
            };
          });
        }
      } catch (e) { }
    }
    const defaultList = getMockDogs(language);
    localStorage.setItem('WALWAL_PETS', JSON.stringify(defaultList));
    return defaultList;
  });


  // Sync mock dogs in localStorage whenever language changes
  React.useEffect(() => {
    setPets(prev => {
      let changed = false;
      const nextPets = prev.map(p => {
        if (p.id.startsWith('dog-')) {
          const mockMatch = getMockDogs(language).find(m => m.id === p.id);
          if (mockMatch && (p.name !== mockMatch.name || p.age !== mockMatch.age)) {
            changed = true;
            return {
              ...p,
              name: mockMatch.name,
              breed: mockMatch.breed,
              personality: mockMatch.personality,
              recentThought: mockMatch.recentThought,
              ownerName: mockMatch.ownerName,
              age: mockMatch.age
            };
          }
        } else {
          // Demo translation for user-added custom dogs
          const demoTranslations: Record<string, Record<string, string>> = {
            '딸기': { ko: '딸기', en: 'Strawberry', ja: 'イチゴ', es: 'Fresa' },
            '초코': { ko: '초코', en: 'Choco', ja: 'チョコ', es: 'Choco' },
            'Strawberry': { ko: '딸기', en: 'Strawberry', ja: 'イチゴ', es: 'Fresa' },
            'イチゴ': { ko: '딸기', en: 'Strawberry', ja: 'イチゴ', es: 'Fresa' },
            'Fresa': { ko: '딸기', en: 'Strawberry', ja: 'イチゴ', es: 'Fresa' }
          };

          if (demoTranslations[p.name]) {
            const translatedName = demoTranslations[p.name][language] || demoTranslations[p.name]['en'];
            if (p.name !== translatedName) {
              changed = true;
              return { ...p, name: translatedName };
            }
          }
        }
        return p;
      });
      if (changed) {
        localStorage.setItem('WALWAL_PETS', JSON.stringify(nextPets));
      }
      return nextPets;
    });
  }, [language]);

  const [activePetIndex, setActivePetIndex] = useState<number>(0);

  const myDog = pets[activePetIndex] || pets[0] || getMockDogs(language)[0];

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
        conversationLog: []
      };
      const updated = [...pets, newPet];
      savePetsToStorage(updated);
      setActivePetIndex(updated.length - 1);
    }

    setModalMode(null);
  };

  return (
    <div className="page-root">
      {/* Top Header */}
      <div className="page-header">
        <div>
          <h2 className="title-lg">{t.profile.title}</h2>
          <p className="text-sub">{t.profile.subtitle}</p>
        </div>

        <button onClick={openAddModal} className="btn-primary">
          <Plus size={16} strokeWidth={3} /> {t.profile.addNew}
        </button>
      </div>

      {/* Multi-Pet Selector Tabs (If more than 1 pet) */}
      {pets.length > 1 && (
        <div className="petNameSection">
          {pets.map((pet, idx) => (
            <button
              className={`petNameBtn ${activePetIndex === idx ? 'active' : ''}`}
              key={pet.id}
              onClick={() => setActivePetIndex(idx)}
            >
              <img src={pet.avatar} alt={pet.name} />
              {pet.name}
            </button>
          ))}
        </div>
      )}

      {/* Pet Card */}
      <div className="card-lg mb-20" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
        {/* Edit Button on Top-Right */}
        <button className='editProfileBtn'
          onClick={openEditModal}
        >
          <Edit3 size={15} /> {t.profile.edit}
        </button>

        {/* Avatar with Camera Icon */}
        <div style={{ position: 'relative', cursor: 'pointer', marginTop: '10px' }} onClick={openEditModal}>
          <img className='dogAvata'
            src={myDog.avatar}
            alt={myDog.name}
          />
          <div className="editAvata">
            <Camera size={14} color="#fff" />
          </div>
        </div>

        <h3 className="title-lg" style={{ marginTop: '16px' }}>
          {myDog.name}
        </h3>
        <p className="text-sub mt-4">
          {myDog.breed} &middot; {myDog.age}{t.profile.dogAgeSuffix}  &middot; {(myDog.gender || 'female') === 'female' ? t.common?.genderShortFemale : t.common?.genderShortMale}
        </p>

        {/* Personality Tags */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
          {myDog.personality.map((tag, i) => (
            <span key={i} className="badge-primary">
              {tag}
            </span>
          ))}
        </div>


        {/* Greetings */}
        <div style={{ marginTop: '20px', width: '100%' }}>
          <div style={{
            background: '#F8F9FB',
            borderRadius: '12px',
            padding: '14px 16px',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: '#4A5568',
            fontStyle: 'italic'
          }}>
            "{myDog.greeting || t.profile?.greetingEmpty || '반갑습니다! 인사말을 등록해주세요 😊'}"
          </div>
        </div>
      </div>



      {/* Stats Grid */}
      <div className="grid-3 mb-24">
        <div className="card" style={{ padding: '16px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFB320' }}>128</div>
          <div className="text-sub mt-6">{t.profile.statTranslate}</div>
        </div>
        <div className="card" style={{ padding: '16px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#38c5b7' }}>42</div>
          <div className="text-sub mt-6">{t.profile.statWebtoon}</div>
        </div>
        <div className="card" style={{ padding: '16px 10px', textAlign: 'center' }}>
          <div style={{ fontSize: '1.3rem', fontWeight: 900, color: '#F6AD55' }}>15</div>
          <div className="text-sub mt-6">{t.profile.statMeetup}</div>
        </div>
      </div>

      {/* App Settings: Language Selection */}
      <div className="card-lg mb-30">
        <div className="row gap-8 mb-18">
          <Globe size={20} color="#38c5b7" />
          <span className="title-md">{t.profile.langSetting}</span>
        </div>
        <div className="grid-2">
          {[
            { code: 'ko', label: '🇰🇷 한국어' },
            { code: 'en', label: '🇺🇸 English' },
            { code: 'ja', label: '🇯🇵 日本語' },
            { code: 'es', label: '🇪🇸 Español' }
          ].map(l => {
            const isSelected = language === l.code;
            return (
              <button
                key={l.code}
                onClick={() => setLanguage(l.code as any)}
                style={{
                  padding: '12px 16px',
                  borderRadius: '16px',
                  background: isSelected ? '#FFB320' : '#F8F9FB',
                  border: isSelected ? 'none' : '1px solid rgba(0,0,0,0.05)',
                  color: isSelected ? '#fff' : '#718096',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  boxShadow: isSelected ? '0 8px 20px rgba(255, 179, 32, 0.3)' : 'none',
                  fontFamily: 'inherit'
                }}
              >
                <span>{l.label}</span>
                {isSelected && <Check size={16} strokeWidth={3} color="#fff" />}
              </button>
            );
          })}
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
              <button onClick={() => setModalMode(null)} className="btn-ghost" style={{ color: '#3b4a5d' }}>
                <X size={24} strokeWidth={3} />
              </button>
            </div>

            {/* Photo Avatar Section */}
            <div className="col mb-24" style={{ alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={formAvatar}
                  alt="avatar preview"
                  style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #FFF8E7', boxShadow: '0 8px 20px rgba(0,0,0,0.05)' }}
                />
                <label style={{
                  position: 'absolute',
                  bottom: '0',
                  right: '0',
                  background: '#FFB320',
                  borderRadius: '50%',
                  padding: '8px',
                  cursor: 'pointer',
                  border: '3px solid #fff'
                }}>
                  <Camera size={16} color="#fff" />
                  <input type="file" accept="image/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />
                </label>
              </div>
              <span className="text-sub mt-10">{t.profile.uploadPhoto}</span>

              {/* Preset Avatars */}
              <div style={{
                display: 'flex',
                overflowX: 'auto',
                gap: '10px',
                marginTop: '12px',
                paddingBottom: '10px',
                width: '100%',
                WebkitOverflowScrolling: 'touch'
              }}>
                {AVATAR_PRESETS.map((preset, i) => (
                  <img
                    key={i}
                    src={preset}
                    alt="preset"
                    onClick={() => setFormAvatar(preset)}
                    style={{
                      width: '40px',
                      height: '40px',
                      minWidth: '40px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: formAvatar === preset ? '3px solid #FFB320' : '1px solid rgba(0,0,0,0.1)',
                      transform: formAvatar === preset ? 'scale(1.15)' : 'scale(1)',
                      transition: 'all 0.2s'
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Input: Name */}
            <div className="mb-18">
              <label className="form-label">
                {t.profile.dogName} <span style={{ color: '#EF4444' }}>*</span>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={formAge}
                  onChange={(e) => setFormAge(e.target.value)}
                  placeholder={t.profile.dogAgePlaceholder}
                  className="form-input"
                  style={{ flex: 1, textAlign: 'center' }}
                />
                <span style={{ color: '#4A5568', whiteSpace: 'nowrap' }}>
                  {t.profile.dogAgeSuffix}
                </span>
              </div>
            </div>

            {/* Gender */}
            <div className="mb-18">
              <label className="form-label">
                {t.profile.genderLabel}
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFormGender('female')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    border: formGender === 'female' ? '2px solid #FFB320' : '1px solid #E2E8F0',
                    background: formGender === 'female' ? '#FFF8E7' : '#fff',
                    fontWeight: formGender === 'female' ? 800 : 400,
                    color: formGender === 'female' ? '#FFB320' : '#4A5568',
                    cursor: 'pointer'
                  }}
                >
                  {t.profile.genderFemale}
                </button>
                <button
                  type="button"
                  onClick={() => setFormGender('male')}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '12px',
                    border: formGender === 'male' ? '2px solid #FFB320' : '1px solid #E2E8F0',
                    background: formGender === 'male' ? '#FFF8E7' : '#fff',
                    fontWeight: formGender === 'male' ? 800 : 400,
                    color: formGender === 'male' ? '#FFB320' : '#4A5568',
                    cursor: 'pointer'
                  }}
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
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setFormOwnerTitle('mom')}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: formOwnerTitle === 'mom' ? '2px solid #FFB320' : '1px solid #E2E8F0', background: formOwnerTitle === 'mom' ? '#FFF8E7' : '#fff', fontWeight: formOwnerTitle === 'mom' ? 800 : 400, color: formOwnerTitle === 'mom' ? '#FFB320' : '#4A5568', cursor: 'pointer' }}
                >
                  {t.profile.mom}
                </button>
                <button
                  type="button"
                  onClick={() => setFormOwnerTitle('dad')}
                  style={{ flex: 1, padding: '10px', borderRadius: '12px', border: formOwnerTitle === 'dad' ? '2px solid #FFB320' : '1px solid #E2E8F0', background: formOwnerTitle === 'dad' ? '#FFF8E7' : '#fff', fontWeight: formOwnerTitle === 'dad' ? 800 : 400, color: formOwnerTitle === 'dad' ? '#FFB320' : '#4A5568', cursor: 'pointer' }}
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
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={customTag}
                  onChange={(e) => setCustomTag(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') addCustomTag(); }}
                  placeholder={t.profile.addTagPlaceholder}
                  className="form-input"
                  style={{ paddingRight: '52px' }}
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="btn-add"
                  title="ADD"
                  style={{
                    position: 'absolute',
                    right: '6px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    padding: '6px 12px',
                    boxShadow: 'none'
                  }}
                >
                  <Plus size={18} strokeWidth={3} />
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
                style={{
                  flex: 1,
                  padding: '16px',
                  background: '#F8F9FB',
                  border: '1px solid #E2E8F0',
                  borderRadius: '20px',
                  color: '#4A5568',
                  fontSize: '0.9rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  fontFamily: 'inherit'
                }}
              >
                {t.profile.cancel}
              </button>
              <button
                type="button"
                onClick={handleSave}
                style={{
                  flex: 2,
                  padding: '16px',
                  background: '#FFB320',
                  border: 'none',
                  borderRadius: '20px',
                  color: '#fff',
                  fontSize: '0.95rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 8px 25px rgba(255, 179, 32, 0.4)',
                  fontFamily: 'inherit'
                }}
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
