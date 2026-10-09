import React from 'react';
import { LocateFixed, Bone, PawPrint, Dog, MessageCircle, Camera } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';

export type NavTab = 'ar' | 'nearby' | 'snaps' | 'community' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onChangeTab }) => {
  const { t } = useTranslation();

  const tabs = [
    { id: 'ar' as NavTab, label: t.tabs.ar, icon: Camera },
    { id: 'nearby' as NavTab, label: t.tabs.nearby, icon: LocateFixed },
    { id: 'snaps' as NavTab, label: t.tabs.snaps, icon: Bone, style: { transform: 'rotate(45deg)' } },
    { id: 'community' as NavTab, label: t.tabs.community, icon: PawPrint },
    { id: 'profile' as NavTab, label: t.tabs.profile, icon: Dog }
  ];

  return (
    <div className="bottom-nav">
      {tabs.map(tab => {
        const Icon = tab.icon;
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id)}
            className="nav-btn"
          >
            <div className={`nav-btn__icon${isActive ? ' active' : ''}`}>
              <Icon size={28} color={isActive ? '#FFB320' : '#3b4a5d'} style={tab.style} />
            </div>
            <span className={`nav-btn__label${isActive ? ' active' : ''}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};
