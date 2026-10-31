import React, { useState, useEffect, useMemo } from 'react';
import { X, Send } from 'lucide-react';
import { getLiveDogAvatar, localizePersonalityTags, localizeDogName, isSameDogName, localizeBreed, DogProfile } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { db, COLLECTIONS } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import '../styles/DogProfileModal.css';

export interface DogProfileModalProps {
  dog: {
    id?: string;
    name: string;
    breed?: string;
    age?: string | number;
    gender?: 'male' | 'female' | string;
    avatar?: string;
    personality?: string[];
    greeting?: string;
    recentThought?: string;
    isMyDog?: boolean;
    ownerName?: string;
  } | null;
  onClose: () => void;
  onSendNote?: (dog: any) => void;
}

export const DogProfileModal: React.FC<DogProfileModalProps> = ({ dog, onClose, onSendNote }) => {
  const { language, t } = useTranslation();
  const [cloudDogData, setCloudDogData] = useState<any | null>(null);

  // Firestore 'dogs' 컬렉션에서 해당 강아지의 공식 등록 원본 데이터를 동기화
  useEffect(() => {
    if (!dog) {
      setCloudDogData(null);
      return;
    }
    const targetName = dog.name || dog.id || '';
    if (!targetName) return;

    // 1. 로컬 캐시에서 즉시 탐색
    try {
      const savedAll = localStorage.getItem('WALWAL_ALL_DOGS');
      if (savedAll) {
        const parsed = JSON.parse(savedAll);
        if (Array.isArray(parsed)) {
          const matched = parsed.find((d: any) => d && (d.id === dog.id || isSameDogName(d.name, targetName)));
          if (matched) {
            setCloudDogData(matched);
          }
        }
      }
    } catch (e) { }

    // 2. Firestore 최신 데이터 fetch
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
            if (docSnap.id === dog.id || isSameDogName(d.name, targetName)) {
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
  }, [dog]);

  // 내 반려견인지 정확히 판정
  const isMyDog = useMemo(() => {
    if (!dog) return false;
    if (dog.isMyDog !== undefined) return Boolean(dog.isMyDog);
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const pets = JSON.parse(saved);
        if (Array.isArray(pets) && pets.some((p: any) => isSameDogName(p.name, dog.name))) {
          return true;
        }
      }
    } catch (e) { }
    return false;
  }, [dog]);

  // 모든 정보(이름, 나이, 견종, 성별, 해시태그, 인사말)를 DB 및 단일 소스로 일원화
  const resolvedDog = useMemo(() => {
    if (!dog) return null;
    const targetName = dog.name || dog.id || '반려견';

    // 1) 내 반려견 목록 확인
    let myPetInfo: any = null;
    try {
      const savedPets = localStorage.getItem('WALWAL_PETS');
      if (savedPets) {
        const pets = JSON.parse(savedPets);
        if (Array.isArray(pets)) {
          myPetInfo = pets.find((p: any) => isSameDogName(p.name, targetName) || (dog.id && p.id === dog.id));
        }
      }
    } catch (e) { }

    const merged = {
      ...(cloudDogData || {}),
      ...(myPetInfo || {}),
      ...dog,
      ...(cloudDogData || {}) // DB 공식 데이터 최우선
    };

    const cleanName = localizeDogName(merged.name || targetName, language);
    const isStrawberry = isSameDogName(cleanName, '딸기');
    const isBori = isSameDogName(cleanName, '보리');
    const isMugi = isSameDogName(cleanName, '무기');
    const isKong3 = isSameDogName(cleanName, '콩이3');

    // 견종
    const rawBreed = merged.breed && merged.breed !== '반려견'
      ? merged.breed
      : (isStrawberry ? '말티즈' : isBori ? '골든 리트리버' : isMugi ? '스피츠' : isKong3 ? '말티즈' : '믹스견');
    const breed = localizeBreed(rawBreed, language);

    // 나이
    const rawAge = merged.age
      ? String(merged.age).replace(/[^0-9]/g, '')
      : (isStrawberry ? '10' : isBori ? '2' : isMugi ? '5' : isKong3 ? '1' : '1');
    const age = rawAge || '1';

    // 성별
    const gender = merged.gender || (isStrawberry ? 'female' : 'male');

    // 해시태그
    let rawTags: string[] = [];
    if (Array.isArray(merged.personality) && merged.personality.length > 0) {
      rawTags = merged.personality;
    } else if (isStrawberry) {
      rawTags = ['#참지않는말티즈'];
    } else if (isBori) {
      rawTags = ['#파워인싸', '#모든인간은내친구', '#간식감별사'];
    } else if (isMugi) {
      rawTags = ['#폼생폼사', '#호기심대왕', '#활발함'];
    } else if (isKong3) {
      rawTags = ['#파워인싸', '#모든인간은내친구'];
    } else {
      rawTags = ['#산책러버', '#댕댕이'];
    }
    const tags = localizePersonalityTags(rawTags, language);

    // 인사말: 사용자가 실제로 등록한 인사말만 사용 (등록되지 않은 경우 임의 생성하지 않음)
    let greeting = (merged.greeting || '').trim();
    if (greeting.includes('카메라에 강아지를 비춰') || greeting.includes('undefined')) {
      greeting = '';
    }

    const avatar = getLiveDogAvatar(targetName, merged.avatar || dog.avatar);

    return {
      ...merged,
      name: cleanName,
      breed,
      age,
      gender,
      tags,
      greeting,
      avatar
    };
  }, [dog, cloudDogData, language]);

  if (!dog || !resolvedDog) return null;

  const ageSuffix = t.profile?.dogAgeSuffix || (language === 'ko' ? '살' : language === 'ja' ? '歳' : ' yrs');
  const genderText = resolvedDog.gender === 'female'
    ? (t.common?.genderShortFemale || '여')
    : (t.common?.genderShortMale || '남');

  return (
    <div
      className="dog-profile-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dog-profile-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          className="dog-profile-modal-close-btn"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={20} strokeWidth={2.5} />
        </button>

        {/* Top Profile Info: Avatar + (Name & Breed/Age/Gender) + Hashtags */}
        <div className="dog-profile-modal-header-row">
          <img
            src={resolvedDog.avatar}
            alt={resolvedDog.name}
            className="dog-profile-modal-avatar-img"
          />
          <div className="dog-profile-modal-info-col">
            <div className="dog-profile-modal-title-row">
              <h3 className="dog-profile-modal-name">
                {resolvedDog.name}
              </h3>
              <span className="dog-profile-modal-sub-info">
                ({resolvedDog.breed} / {resolvedDog.age}{ageSuffix} / {genderText})
              </span>
              {isMyDog && (
                <span className="dog-profile-modal-badge">
                  {language === 'ko' ? '내 반려견' : language === 'ja' ? '愛犬' : 'My Dog'}
                </span>
              )}
            </div>

            <div className="dog-profile-modal-tags">
              {resolvedDog.tags.map((tag: string, i: number) => (
                <span key={i} className="dog-profile-modal-hashtag">
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Quote / Greeting Box: 사용자가 등록한 인사말이 있을 때만 노출 */}
        {resolvedDog.greeting ? (
          <div className="dog-profile-modal-greeting">
            {resolvedDog.greeting}          </div>
        ) : null}

        {/* Bottom Action Area */}
        <div className="dog-profile-modal-bottom-action">
          {isMyDog ? (
            <div className="dog-profile-modal-walking-banner">
              <span>
                {language === 'ko' ? '현재 나와 함께 산책 중인 반려견입니다' : 'Walking with you right now'}
              </span>
            </div>
          ) : (
            <button
              type="button"
              className="dog-profile-modal-send-note-btn"
              onClick={() => {
                if (onSendNote) {
                  onSendNote(resolvedDog);
                }
                onClose();
              }}
            >
              <Send size={18} />
              <span>{language === 'ko' ? '메세지' : 'Send Note'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
