import React from 'react';
import { X } from 'lucide-react';
import { getLiveDogAvatar, localizeBreed, localizePersonalityTags, localizeDogName } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import '../styles/DogProfileModal.css';

export interface DogProfileModalProps {
  dog: {
    name: string;
    breed?: string;
    age?: string | number;
    gender?: 'male' | 'female' | string;
    avatar?: string;
    personality?: string[];
  } | null;
  onClose: () => void;
}

export const DogProfileModal: React.FC<DogProfileModalProps> = ({ dog, onClose }) => {
  const { language, t } = useTranslation();

  if (!dog) return null;

  const liveAvatar = getLiveDogAvatar(dog.name, dog.avatar);
  const localizedBreed = localizeBreed(dog.breed || '골든 리트리버', language);
  const cleanAge = dog.age ? String(dog.age).replace(/[^0-9]/g, '') : '1';
  const ageSuffix = t.profile?.dogAgeSuffix || (language === 'ko' ? '살' : ' yrs');
  const genderShort = dog.gender === 'female'
    ? (t.common?.genderShortFemale || (language === 'ko' ? '여' : 'F'))
    : (t.common?.genderShortMale || (language === 'ko' ? '남' : 'M'));
  const tags = localizePersonalityTags(dog.personality || [], language);

  return (
    <div
      className="dog-profile-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dog-profile-modal-card">
        {/* Close Button */}
        <button
          className="dog-profile-modal-close-btn"
          onClick={onClose}
          aria-label="닫기"
        >
          <X size={24} />
        </button>

        {/* Profile Avatar */}
        <div className="dog-profile-modal-avatar-ring">
          <img
            src={liveAvatar}
            alt={dog.name}
            className="dog-profile-modal-avatar-img"
          />
        </div>

        {/* Name */}
        <h3 className="dog-profile-modal-name">
          {localizeDogName(dog.name, language)}
        </h3>

        {/* Breed, Age & Gender */}
        <p className="dog-profile-modal-subtitle">
          {localizedBreed} · {cleanAge}{ageSuffix} · {genderShort}
        </p>

        {/* Personality Hashtags */}
        <div className="dog-profile-modal-tags">
          {tags.map((tag: string, i: number) => (
            <span key={i} className="badge-hashtag">
              {tag.startsWith('#') ? tag : `#${tag}`}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};
