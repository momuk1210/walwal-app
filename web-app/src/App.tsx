import React, { useState, useEffect } from 'react';
import { LanguageProvider, useTranslation } from './i18n/LanguageContext';
// LanguageSelector moved to ProfileView
import { ARCameraView } from './components/ARCameraView';
import { RadarView } from './components/RadarView';
import { FeedView } from './components/FeedView';
import { ShortformStudio } from './components/ShortformStudio';
import { ProfileView } from './components/ProfileView';
import { CommunityView } from './components/CommunityView';
import { BottomNav, NavTab } from './components/BottomNav';
import { AuthView } from './components/AuthView';
import { PaywallView } from './components/PaywallView';
// VirtualChatModal replaced by AR Camera 2-Dog Interaction Mode
import {  DogProfile, MOCK_DOGS, getMockDogs  } from './data/mockDogs';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';

function WalWalMain() {
  const [appState, setAppState] = useState<'loading' | 'auth' | 'paywall' | 'main'>('loading');
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Skip paywall — logged-in users go straight to main
        setAppState('main');
        localStorage.setItem('walwal_app_state', 'main');
      } else {
        setAppState('auth');
      }
    });
    return () => unsubscribe();
  }, []);

  const [currentTab, setCurrentTab] = useState<NavTab | 'studio'>('ar');
  const [arKey, setArKey] = useState<number>(0);
  const { t, language } = useTranslation();

  const [studioTargetDog, setStudioTargetDog] = useState<DogProfile>(() => getMockDogs(language)[0]);
  const [studioThought, setStudioThought] = useState<string>(() => getMockDogs(language)[0].recentThought);
  const [studioSnapshot, setStudioSnapshot] = useState<string | undefined>(undefined);
  const [interactionPair, setInteractionPair] = useState<{ dog1: DogProfile; dog2: DogProfile } | null>(null);
  const [radarTargetLocation, setRadarTargetLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [feedDraft, setFeedDraft] = useState<{ dog: DogProfile; thought: string; image?: string } | null>(null);

  const handleCaptureToStory = (dog: any, thought: string, snapshot?: string) => {
    setStudioTargetDog(dog);
    setStudioThought(thought);
    setStudioSnapshot(snapshot);
    setCurrentTab('studio');
  };

  const handleCaptureToFeed = (dog: DogProfile, thought: string, snapshot?: string) => {
    setFeedDraft({ dog, thought, image: snapshot });
    setCurrentTab('feed');
  };

  const handleStartInteraction = (dog1: DogProfile, dog2: DogProfile) => {
    setInteractionPair({ dog1, dog2 });
    setCurrentTab('ar');
  };

  const handleTabChange = (tabId: NavTab | 'studio') => {
    if (tabId === 'ar' && currentTab === 'ar') {
      setArKey(k => k + 1);
    }
    setCurrentTab(tabId);
    if (tabId === 'ar') {
      setInteractionPair(null);
    }
  };

  if (appState === 'loading') {
    return (
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#FFB320' }}>
        <h2 style={{ color: '#fff' }}>Loading...</h2>
      </div>
    );
  }

  if (appState === 'auth') {
    return <AuthView onLoginSuccess={() => {
      localStorage.setItem('walwal_app_state', 'main');
      setAppState('main');
    }} />;
  }


  return (
    <div style={{ width: '100%', height: '100%', flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
{/* Language selector moved to ProfileView app settings */}

      {/* Active Tab View */}
      <div style={{ flex: 1, height: '100%', minHeight: 0, display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden' }}>
        {currentTab === 'ar' && (
          <ARCameraView
            onCaptureToStory={handleCaptureToStory}
            onCaptureToFeed={handleCaptureToFeed}
            interactionPair={interactionPair}
            onClearInteractionPair={() => setInteractionPair(null)}
            isActiveTrigger={arKey}
          />
        )}

        {currentTab === 'radar' && (
          <RadarView
            onStartVirtualChat={handleStartInteraction}
            targetLocation={radarTargetLocation}
          />
        )}

        {currentTab === 'feed' && (
          <FeedView 
            feedDraft={feedDraft} 
            onClearFeedDraft={() => setFeedDraft(null)} 
          />
        )}

        {currentTab === 'community' && (
          <CommunityView
            onNavigateToRadar={(loc) => {
              setRadarTargetLocation(loc);
              setCurrentTab('radar');
            }}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView />
        )}

        {currentTab === 'studio' && (
          <ShortformStudio
            initialDog={studioTargetDog}
            initialThought={studioThought}
            initialImage={studioSnapshot}
            isProUser={true}
            onOpenPro={() => {}}
            onClose={() => setCurrentTab('ar')}
            onPostSuccess={() => setCurrentTab('feed')}
          />
        )}
      </div>



      <BottomNav currentTab={currentTab === 'studio' ? 'ar' : currentTab as NavTab} onChangeTab={handleTabChange} />
    </div>
  );
}

export function App() {
  return (
    <LanguageProvider>
      <WalWalMain />
    </LanguageProvider>
  );
}

export default App;
