import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Send, X, Image as ImageIcon, Download, Share2, Bone, Sparkles, MoreVertical, Edit3, Trash2, Plus } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getMockDogs, isSameDogName, getDefaultDogAvatar } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';

interface FeedViewProps {
  feedDraft?: { dog: any, thought: string, image?: string } | null;
  handleClearFeedDraft?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({ feedDraft: propFeedDraft, onClearFeedDraft: propOnClearFeedDraft }) => {
  const { t, language } = useTranslation();

  const myDog = getMockDogs(language)[0];

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [localFeedDraft, setLocalFeedDraft] = useState<any | null>(null);
  const feedDraft = propFeedDraft || localFeedDraft;

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalFeedDraft({ dog: myDog, thought: '', image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

  const handleClearFeedDraft = () => {
    if (propFeedDraft && propOnClearFeedDraft) propOnClearFeedDraft();
    if (localFeedDraft) setLocalFeedDraft(null);
  };


  const [feedPosts, setFeedPosts] = useState<any[]>([]);

  React.useEffect(() => {
    let customPosts: any[] = [];
    try {
      const saved = localStorage.getItem('WALWAL_USER_FEED_POSTS');
      if (saved) customPosts = JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load WALWAL_USER_FEED_POSTS:', e);
    }

    setFeedPosts(prev => {
      const mockPosts = getMockDogs(language).map((dog, idx) => {
        const existing = prev.find(p => p.id === dog.id);
        return {
          ...dog,
          likes: existing ? existing.likes : Math.floor(Math.random() * 30) + 10,
          liked: existing ? existing.liked : false,
          comments: existing ? existing.comments : [
            { id: Date.now() + Math.random(), author: t.community?.hostMom || 'Mom', text: dog.recentThought }
          ],
          showComments: existing ? existing.showComments : false,
          shares: existing ? existing.shares : 11
        };
      });

      // customPosts가 최신 순서(맨 위)로 나오도록 합침
      const existingCustomIds = new Set(customPosts.map(p => p.id));
      const prevOnlyCustom = prev.filter(p => !p.id.toString().startsWith('dog-') && !existingCustomIds.has(p.id));

      return [...customPosts, ...prevOnlyCustom, ...mockPosts];
    });
  }, [language, t]);

  const [newCommentText, setNewCommentText] = useState<{ [key: string]: string }>({});
  const [draftText, setDraftText] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [petsUpdateTrigger, setPetsUpdateTrigger] = useState(0);

  // 반려견 프로필 수정/추가 시 실시간 동기화
  useEffect(() => {
    const handlePetsUpdated = () => {
      setPetsUpdateTrigger(prev => prev + 1);
    };
    window.addEventListener('walwal_pets_updated', handlePetsUpdated);
    window.addEventListener('storage', handlePetsUpdated);
    return () => {
      window.removeEventListener('walwal_pets_updated', handlePetsUpdated);
      window.removeEventListener('storage', handlePetsUpdated);
    };
  }, []);

  // 내 반려견 목록 (개별 강아지들) - localStorage 최신 데이터 반영
  const petOptions = React.useMemo(() => {
    let myPets: any[] = [];
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) myPets = JSON.parse(saved);
    } catch (e) { }

    if (!Array.isArray(myPets) || myPets.length === 0) {
      myPets = getMockDogs(language);
    }

    return myPets.map((p: any) => {
      const mock = getMockDogs(language).find(m => isSameDogName(m.name, p.name));
      const avatar = p.avatar || mock?.avatar || getDefaultDogAvatar(p.name || p.breed);
      return {
        id: p.id || p.name,
        name: p.name,
        breed: p.breed,
        ownerName: p.ownerName || `${p.name} 맘`,
        avatar,
        age: p.age ? String(p.age).replace(/[^0-9]/g, '') : '1',
        gender: p.gender || mock?.gender || 'male',
        personality: p.personality || p.tags || mock?.personality || ['#댕댕이']
      };
    });
  }, [language, petsUpdateTrigger]);

  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(() => [petOptions[0]?.id || 'dog-1']);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [profileModalDog, setProfileModalDog] = useState<any | null>(null);

  // 강아지 프로필 조회: 사용자가 저장한 WALWAL_PETS 데이터에서 직접 로드
  const findDogProfile = (dogName: string, fallbackAvatar?: string) => {
    const cleanName = dogName.trim();

    // 1. 최우선: 사용자가 저장/수정한 실제 반려견 데이터 (localStorage 'WALWAL_PETS')
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const pets = JSON.parse(saved);
        const found = pets.find((p: any) => isSameDogName(p.name, cleanName));
        if (found) {
          const mock = getMockDogs(language).find(m => isSameDogName(m.name, found.name));
          const dbAvatar = found.avatar || mock?.avatar || getDefaultDogAvatar(found.name || found.breed);
          return {
            name: found.name,
            breed: found.breed,
            age: found.age ? String(found.age).replace(/[^0-9]/g, '') : '1',
            gender: found.gender || mock?.gender || 'male',
            avatar: dbAvatar,
            personality: found.personality || found.tags || mock?.personality || ['#댕댕이']
          };
        }
      }
    } catch (e) { }

    // 2. 현재 상태의 petOptions
    const foundInOptions = petOptions.find(p => isSameDogName(p.name, cleanName));
    if (foundInOptions) {
      return {
        name: foundInOptions.name,
        breed: foundInOptions.breed,
        age: foundInOptions.age,
        gender: foundInOptions.gender || 'male',
        avatar: foundInOptions.avatar || getDefaultDogAvatar(foundInOptions.name || foundInOptions.breed),
        personality: foundInOptions.personality || ['#댕댕이']
      };
    }

    // 3. 목 데이터 (mockDogs.ts)
    const mockList = getMockDogs(language);
    const foundInMock = mockList.find(m => isSameDogName(m.name, cleanName));
    if (foundInMock) {
      return {
        name: foundInMock.name,
        breed: foundInMock.breed,
        age: foundInMock.age,
        gender: foundInMock.gender || 'male',
        avatar: foundInMock.avatar || getDefaultDogAvatar(foundInMock.name || foundInMock.breed),
        personality: foundInMock.personality || ['#댕댕이']
      };
    }

    // 4. 미등록 일반 강아지 폴백 (견종/이름에 맞는 기본 아바타)
    return {
      name: cleanName,
      breed: '반려견',
      age: '1',
      gender: 'male',
      avatar: fallbackAvatar || getDefaultDogAvatar(cleanName),
      personality: ['#댕댕이']
    };
  };

  const handleOpenDogProfile = (dogName: string, fallbackAvatar?: string) => {
    setProfileModalDog(findDogProfile(dogName, fallbackAvatar));
  };

  const renderAuthorProfile = (post: any) => {
    const postName = post.name || '';
    if (postName.includes('&')) {
      const parts = postName.split('&');
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {parts.map((part: string, index: number) => {
            const cleanName = part.trim();
            // 각 강아지 아바타는 DB에서 1:1로 직접 로드 (첫 번째 강아지 아바타로 덮어쓰기 방지)
            const dog = findDogProfile(cleanName);
            return (
              <React.Fragment key={index}>
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    setProfileModalDog(dog);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    cursor: 'pointer',
                    padding: '3px',
                    transition: 'all 0.15s ease',
                  }}
                  title={`${dog.name} 프로필 보기`}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 179, 32, 0.15)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(0, 0, 0, 0)')}
                >
                  <img
                    src={dog.avatar}
                    alt={dog.name}
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '1.5px solid #FFB320',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1A202C' }}>
                    {dog.name}
                  </span>
                </div>
              </React.Fragment>
            );
          })}
        </div>
      );
    }

    // 단독견
    const singleDog = findDogProfile(postName, post.avatar);
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          setProfileModalDog(singleDog);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          cursor: 'pointer',
          padding: '2px 4px',
          borderRadius: '20px',
          transition: 'all 0.15s ease'
        }}
        title={`${singleDog.name} 프로필 보기`}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 179, 32, 0.12)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <img
          src={singleDog.avatar}
          alt={singleDog.name}
          className="avatar-sm"
          style={{
            border: '1.5px solid #FFB320',
            boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
          }}
        />
        <span style={{ fontSize: '1rem', fontWeight: 700, color: '#1A202C' }}>
          {singleDog.name}
        </span>
      </div>
    );
  };

  const handleTogglePet = (petId: string) => {
    setSelectedPetIds(prev => {
      if (prev.includes(petId)) {
        if (prev.length === 1) return prev; // 최소 1마리 선택 유지
        return prev.filter(id => id !== petId);
      } else {
        return [...prev, petId];
      }
    });
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(prev => prev === msg ? null : prev);
    }, 2800);
  };

  const isVideo = Boolean(feedDraft?.image && (feedDraft.image.startsWith('blob:') || feedDraft.image.endsWith('.webm') || feedDraft.image.endsWith('.mp4')));

  const downloadDraftMedia = async (suffix: string): Promise<string> => {
    if (!feedDraft?.image) return '';
    const link = document.createElement('a');
    link.href = feedDraft.image;
    link.download = `walwal_feed_${suffix}.${isVideo ? 'webm' : 'png'}`;
    link.click();
    return feedDraft.image;
  };

  const handleShareInstagram = async () => {
    setSelectedPlatform('instagram');
    const thought = feedDraft?.thought || '';
    const caption = language === 'ko'
      ? `"${thought}"\n\n#WalWal #왈왈 #반려견통역 #멍스타그램 #댕댕이`
      : `"${thought}"\n\n#WalWal #DogTranslator #Dogstagram #Puppy`;

    showToast(language === 'ko' ? 'Instagram 등록 화면으로 이동 중 (태그 복사 및 다운로드)...' : 'Opening Instagram (tags copied & downloaded)...');

    const mediaUrl = await downloadDraftMedia('instagram');
    if (mediaUrl && !isVideo) {
      try {
        const res = await fetch(mediaUrl);
        const blob = await res.blob();
        if (navigator.clipboard && (window as any).ClipboardItem) {
          await navigator.clipboard.write([
            new (window as any).ClipboardItem({ 'image/png': blob })
          ]);
        }
      } catch (e) { }
    }
    try { await navigator.clipboard.writeText(caption); } catch (e) { }

    setTimeout(() => {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = 'instagram://camera';
        setTimeout(() => {
          window.open('https://www.instagram.com/create/select/', '_blank');
        }, 1200);
      } else {
        window.open('https://www.instagram.com/create/select/', '_blank');
      }
      showToast(language === 'ko' ? '📸 Instagram 등록 화면이 열렸습니다! 다운로드된 사진을 넣고 등록하세요.' : '📸 Instagram opened! Select the downloaded media and post.');
    }, 900);
  };

  const handleShareTikTok = async () => {
    setSelectedPlatform('tiktok');
    const thought = feedDraft?.thought || '';
    const caption = language === 'ko'
      ? `"${thought}" #WalWal #반려견통역 #강아지속마음 #댕댕이 #fyp`
      : `"${thought}" #WalWal #DogTranslator #Puppy #fyp`;

    showToast(language === 'ko' ? 'TikTok 숏폼 등록 화면으로 이동 중 (태그 복사 및 다운로드)...' : 'Opening TikTok (tags copied & video downloaded)...');

    await downloadDraftMedia('tiktok');
    try { await navigator.clipboard.writeText(caption); } catch (e) { }

    setTimeout(() => {
      window.open('https://www.tiktok.com/upload?lang=ko-KR', '_blank');
      showToast(language === 'ko' ? '🎵 TikTok 동영상 등록 화면이 열렸습니다! 다운로드된 파일을 선택하고 등록하세요.' : '🎵 TikTok opened! Select the downloaded file and post.');
    }, 900);
  };

  const handleShareYouTube = async () => {
    setSelectedPlatform('youtube');
    const dogName = feedDraft?.dog?.name || '댕댕이';
    const thought = feedDraft?.thought || '';
    const title = language === 'ko'
      ? `[WalWal AI] ${dogName} 속마음 통역 #Shorts`
      : `[WalWal AI] ${dogName} Thoughts #Shorts`;
    const desc = language === 'ko'
      ? `"${thought}"\n\nWalWal AI 반려견 실시간 통역기\n#Shorts #WalWal #반려견통역`
      : `"${thought}"\n\nWalWal AI Real-time Dog Translator\n#Shorts #WalWal #DogTranslator`;

    showToast(language === 'ko' ? 'YouTube Shorts 등록 화면으로 이동 중 (제목 복사 및 다운로드)...' : 'Opening YouTube Shorts (title copied & downloaded)...');

    await downloadDraftMedia('shorts');
    try { await navigator.clipboard.writeText(`${title}\n\n${desc}`); } catch (e) { }

    setTimeout(() => {
      window.open('https://www.youtube.com/upload', '_blank');
      showToast(language === 'ko' ? '🎬 YouTube 동영상 등록 화면이 열렸습니다! 파일 선택 후 바로 등록하세요.' : '🎬 YouTube opened! Select the downloaded file and post.');
    }, 900);
  };

  const handleDownloadOnly = async () => {
    setSelectedPlatform('download');
    showToast(language === 'ko' ? '파일 다운로드 중...' : 'Downloading file...');

    await downloadDraftMedia(Date.now().toString());

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    showToast(t.studio?.downloadComplete || t.share?.downloadComplete || (language === 'ko' ? '파일이 다운로드되었습니다! 🎉' : 'File downloaded successfully! 🎉'));
  };

  const handleShareMore = async () => {
    setSelectedPlatform('more');
    showToast(language === 'ko' ? '공유 기능을 준비 중...' : 'Preparing share...');
    const thought = feedDraft?.thought || '';

    try {
      if (feedDraft?.image) {
        const res = await fetch(feedDraft.image);
        const blob = await res.blob();
        const file = new File([blob], `walwal_feed_${Date.now()}.${isVideo ? 'webm' : 'png'}`, { type: isVideo ? 'video/webm' : 'image/png' });

        if (navigator.share) {
          await navigator.share({
            title: 'WalWal Feed Post',
            text: `"${thought}"\n\n#WalWal`,
            files: [file]
          });
          showToast(language === 'ko' ? '공유 메뉴가 열렸습니다.' : 'Share menu opened.');
        } else {
          showToast(language === 'ko' ? '현재 브라우저에서는 파일 공유를 지원하지 않습니다.' : 'File sharing is not supported on this browser.');
        }
      }
    } catch (e) {
      showToast(language === 'ko' ? '공유가 취소되었습니다.' : 'Share cancelled.');
    }
  };

  // When feedDraft changes, initialize the text
  React.useEffect(() => {
    if (feedDraft) {
      setDraftText(`"${feedDraft.thought}"\n`);
      if (feedDraft.dog && feedDraft.dog.id) {
        const found = petOptions.find(o => o.id === feedDraft.dog.id || o.name === feedDraft.dog.name);
        if (found) setSelectedPetIds([found.id]);
      }
    }
  }, [feedDraft, petOptions]);

  const handlePostFeedDraft = () => {
    if (!feedDraft) return;
    confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });

    const selectedPets = petOptions.filter(o => selectedPetIds.includes(o.id));
    const activePets = selectedPets.length > 0 ? selectedPets : [petOptions[0]];

    const combinedName = activePets.map(p => p.name).join(' & ');
    const combinedBreed = activePets.map(p => p.breed).join(' · ');
    const combinedAge = activePets.map(p => p.age).join(', ');
    const ageSuffix = t.profile?.dogAgeSuffix || (language === 'ko' ? '살' : ' yrs');
    const combinedSubInfo = activePets.length > 1
      ? activePets.map(p => `${p.breed} ${p.age}${ageSuffix}`).join(', ')
      : `${activePets[0].breed} · ${activePets[0].age}${ageSuffix} · ${activePets[0].gender === 'female' ? (t.common?.genderShortFemale || '여') : (t.common?.genderShortMale || '남')}`;
    const combinedOwnerName = activePets.length > 1 ? `${activePets.map(p => p.name).join('&')} 맘` : activePets[0].ownerName;
    const combinedPersonality = activePets.length > 1
      ? (language === 'ko' ? ['#다둥이네', '#절친케미', '#우당탕탕'] : ['#Duo', '#BestFriends', '#Playful'])
      : activePets[0].personality;

    const newPost = {
      ...(feedDraft.dog || {}),
      id: `draft_${Date.now()}`,
      name: combinedName,
      breed: combinedBreed,
      age: combinedAge,
      subInfo: combinedSubInfo,
      gender: activePets[0].gender,
      ownerName: combinedOwnerName,
      avatar: activePets[0].avatar,
      personality: combinedPersonality,
      recentThought: draftText || feedDraft.thought,
      feedImage: feedDraft.image,
      likes: 0,
      liked: false,
      comments: [],
      showComments: false,
      shares: 0
    };
    try {
      const saved = localStorage.getItem('WALWAL_USER_FEED_POSTS');
      const posts = saved ? JSON.parse(saved) : [];
      posts.unshift(newPost);
      localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(posts));
    } catch (e) {
      console.error('Failed to save feed draft:', e);
    }
    setFeedPosts(prev => [newPost, ...prev]);
    showToast(language === 'ko' ? `${combinedName} 피드가 등록되었습니다! 🐾` : `Posted as ${combinedName}! 🐾`);
    if (handleClearFeedDraft) handleClearFeedDraft();
  };

  const handleDeletePost = (id: string) => {
    if (!window.confirm(language === 'ko' ? '이 피드를 삭제하시겠습니까?' : 'Delete this feed post?')) return;
    setFeedPosts(prev => {
      const updated = prev.filter(p => p.id !== id);
      try {
        const userPosts = updated.filter(p => !p.id.toString().startsWith('dog-'));
        localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(userPosts));
      } catch (e) {
        console.error('Failed to update localStorage on delete:', e);
      }
      return updated;
    });
    setActiveMenuPostId(null);
    showToast(language === 'ko' ? '피드가 삭제되었습니다. 🗑️' : 'Post deleted. 🗑️');
  };

  const handleSaveEditPost = () => {
    if (!editingPost) return;
    setFeedPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === editingPost.id) {
          return {
            ...p,
            recentThought: editText
          };
        }
        return p;
      });
      try {
        const userPosts = updated.filter(p => !p.id.toString().startsWith('dog-'));
        localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(userPosts));
      } catch (e) {
        console.error('Failed to update localStorage on edit:', e);
      }
      return updated;
    });
    setEditingPost(null);
    showToast(language === 'ko' ? '피드가 수정되었습니다! ✨' : 'Post updated! ✨');
  };

  const handleShareFeed = async (id: string) => {
    const postToShare = feedPosts.find(p => p.id === id);

    setFeedPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, shares: p.shares + 1 };
      }
      return p;
    }));

    if (postToShare) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: `WalWal - ${postToShare.name}의 속마음`,
            text: `"${postToShare.recentThought}"\n우리 댕댕이 무슨 생각하는지 궁금하다면? WalWal 앱에서 확인해보세요! 🐾`,
            url: window.location.href,
          });
        } else {
          await navigator.clipboard.writeText(`"${postToShare.recentThought}"\n- ${postToShare.name}의 속마음 (WalWal에서 확인하기)`);
          alert('내용이 클립보드에 복사되었습니다! SNS에 붙여넣기 해보세요.');
        }
      } catch (error) {
        console.log('Share canceled or failed:', error);
      }
    }
  };

  const handleLikeFeed = (id: string) => {
    setFeedPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          liked: !p.liked,
          likes: p.liked ? p.likes - 1 : p.likes + 1
        };
      }
      return p;
    }));
  };

  const handleToggleComments = (id: string) => {
    setFeedPosts(prev => prev.map(p => {
      if (p.id === id) {
        return { ...p, showComments: !p.showComments };
      }
      return p;
    }));
  };

  const handleSubmitComment = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText[id]?.trim()) return;
    setFeedPosts(prev => prev.map(p => {
      if (p.id === id) {
        return {
          ...p,
          comments: [...p.comments, { id: Date.now(), author: myDog.ownerName, text: newCommentText[id].trim() }]
        };
      }
      return p;
    }));
    setNewCommentText(prev => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header row-between" style={{ margin: '0', alignItems: 'center' }}>
        <div>
          <h2 className="title-lg">{t.tabs?.feed || '피드'}</h2>
          <p className="text-sub">{t.feed?.subtitle || '세상의 모든 귀여움, 댕댕이 피드'}</p>
        </div>
        <button
          className="btn-primary"
          style={{ padding: '8px 16px', borderRadius: '100px', fontSize: '0.85rem', fontWeight: 700 }}
          onClick={() => fileInputRef.current?.click()}
        >
          <Plus size={16} strokeWidth={3} />
        </button>
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      <div style={{ overflowX: 'hidden', overflowY: 'auto', flex: 1 }}>
        <div className="section-gap">
          {feedPosts.map(post => (
            <div key={post.id} className="card-lg" style={{ position: 'relative' }}>
              <div className="row-between mb-12" style={{ alignItems: 'center', position: 'relative' }}>
                {renderAuthorProfile(post)}

                {/* More Options Button (점 세개 버튼) */}
                <div style={{ position: 'relative' }}>
                  <button
                    onClick={() => setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px',
                      cursor: 'pointer',
                      color: '#718096',
                      display: 'flex',
                      alignItems: 'center',
                      transition: 'background 0.15s ease',
                    }}
                    title="더 보기"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {/* Dropdown Menu (피드 수정 / 피드 삭제) */}
                  {activeMenuPostId === post.id && (
                    <div
                      style={{
                        position: 'absolute',
                        right: 0,
                        top: '100%',
                        zIndex: 100,
                        background: '#FFFFFF',
                        borderRadius: '12px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
                        border: '1px solid #EDF2F7',
                        minWidth: '120px',
                        padding: '6px 0',
                        overflow: 'hidden',
                      }}
                    >
                      <button
                        onClick={() => {
                          setEditingPost({ ...post });
                          setEditText(post.recentThought || '');
                          setActiveMenuPostId(null);
                        }}
                        style={{
                          width: '100%',
                          padding: '9px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'none',
                          border: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#2D3748',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#F7FAFC')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <Edit3 size={15} color="#4A5568" />
                        <span>피드 수정</span>
                      </button>
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        style={{
                          width: '100%',
                          padding: '9px 14px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          background: 'none',
                          border: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 600,
                          color: '#E53E3E',
                          cursor: 'pointer',
                          textAlign: 'left',
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = '#FFF5F5')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                      >
                        <Trash2 size={15} color="#E53E3E" />
                        <span>피드 삭제</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              {!post.feedImage && post.recentThought && (
                <p className="text-body" style={{ margin: '12px 0' }}>
                  "{post.recentThought}"
                </p>
              )}
              {post.feedImage && (
                (post.isVideo || (typeof post.feedImage === 'string' && (post.feedImage.startsWith('blob:') || post.feedImage.endsWith('.webm') || post.feedImage.endsWith('.mp4')))) ? (
                  <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', aspectRatio: '9/16', background: '#000', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }}>
                    <video
                      src={post.feedImage}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top center',
                        display: 'block'
                      }}
                    />
                  </div>
                ) : (
                  <div style={{ width: '100%', borderRadius: '16px', overflow: 'hidden', marginBottom: '16px', aspectRatio: '9/16', maxHeight: '520px', background: '#F8FAFC', boxShadow: '0 4px 16px rgba(0,0,0,0.06)' }}>
                    <img
                      src={post.feedImage}
                      alt="Feed media"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        objectPosition: 'top center',
                        display: 'block'
                      }}
                    />
                  </div>
                )
              )}
              <div className="action-row" style={{ transition: '0.2s' }}>
                <span className="action-item" onClick={() => handleLikeFeed(post.id)}>
                  <Heart size={16} color={post.liked ? "#333" : "#333"} fill={post.liked ? "#FF4757" : "none"} style={{ transition: '0.2s' }} /> {post.likes}
                </span>
                <span className="action-item" onClick={() => handleToggleComments(post.id)}>
                  <MessageSquare size={16} color="#333" fill={post.showComments ? "rgba(56, 197, 183, 0.2)" : "none"} style={{ transition: '0.2s' }} /> {post.comments.length}
                </span>
                <span className="action-item" onClick={() => handleShareFeed(post.id)}>
                  <Send size={16} color="#333" style={{ transition: '0.2s' }} /> {post.shares}
                </span>
              </div>

              {post.showComments && (
                <div style={{ paddingTop: '16px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                    {post.comments.map((c: any) => (
                      <div key={c.id} style={{ fontSize: '0.85rem' }}>
                        <span style={{ fontWeight: 700, marginRight: '8px', color: '#2D3748' }}>{c.author}</span>
                        <span style={{ color: '#4A5568' }}>{c.text}</span>
                      </div>
                    ))}
                  </div>
                  <form onSubmit={(e) => handleSubmitComment(post.id, e)} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder={t.community?.placeholderComment || '댓글 달기...'}
                      value={newCommentText[post.id] || ''}
                      onChange={(e) => setNewCommentText(prev => ({ ...prev, [post.id]: e.target.value }))}
                      style={{ flex: 1, padding: '10px 14px', borderRadius: '20px', border: '1px solid #E2E8F0', fontSize: '0.85rem', outline: 'none' }}
                    />
                    <button type="submit" style={{ padding: '8px 16px', borderRadius: '20px', background: '#38c5b7', color: '#fff', border: 'none', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' }}>
                      {t.community?.btnPostComment || '게시'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Feed Registration Modal */}
      {feedDraft && (
        <div className="pet-studio-modal-overlay" style={{ zIndex: 3000 }}>
          <div className="pet-studio-modal-container" style={{ display: 'flex', flexDirection: 'column', maxHeight: '852px', position: 'relative' }}>
            {/* Header (Clean Style) */}
            <div className="pet-studio-modal-header row-between" >

              <div className="pet-studio-modal-header-title title-lg">
                <span>
                  {language === 'ko' ? '펫 스튜디오' : 'New Feed Post'}
                </span>
              </div>
              <button onClick={handleClearFeedDraft} className="btn-ghost pet-studio-modal-close-btn" style={{ color: '#fff' }}>
                <X size={24} />
              </button>
            </div>

            {/* Pet Selector Chips (아이콘 없이 이름만, 다중 선택 및 가로 스와이프 지원) */}
            <div className='pet-selector-chips-wrapper'
              style={{
                justifyContent: petOptions.length <= 3 ? 'center' : 'flex-start',
              }}
            >
              {petOptions.map(option => {
                const isSelected = selectedPetIds.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => handleTogglePet(option.id)}
                    type="button"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '6px 14px',
                      borderRadius: '16px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      border: isSelected ? '1.5px solid #FFB320' : '1px solid #E2E8F0',
                      background: isSelected ? '#FFB320' : '#FFFFFF',
                      color: isSelected ? '#FFFFFF' : '#4A5568',
                      cursor: 'pointer',
                      boxShadow: isSelected ? '0 2px 8px rgba(255, 179, 32, 0.35)' : 'none',
                      transition: 'all 0.15s ease',
                      whiteSpace: 'nowrap',
                      flexShrink: 0,
                    }}
                  >
                    <span>{option.name}</span>
                  </button>
                );
              })}
            </div>

            {/* Body (9:16 AI 말풍선 스냅샷 온전 노출 + 스크롤) */}
            <div className="pet-studio-modal-body" >
              <div className='pet-studio-modal-media-wrapper'>
                {feedDraft.image ? (
                  (typeof feedDraft.image === 'string' && (feedDraft.image.startsWith('blob:') || feedDraft.image.endsWith('.webm') || feedDraft.image.endsWith('.mp4'))) ? (
                    <video
                      src={feedDraft.image}
                      autoPlay
                      loop
                      muted
                      playsInline
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  ) : (
                    <img
                      src={feedDraft.image}
                      alt="Preview"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                    />
                  )
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#F8FAFC', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <ImageIcon size={48} opacity={0.5} />
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Actions (Floating Glass Dock) */}
            <div className="pet-studio-modal-action-wrapper">
              {/* 1. Instagram */}
              <button onClick={handleShareInstagram}>
                <div className={`share-icon-btn instagram ${selectedPlatform === 'instagram' ? 'selected' : ''}`}>

                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
                </div>
                <span>Instagram</span>
              </button>

              {/* 2. TikTok */}
              <button onClick={handleShareTikTok}>
                <div className={`share-icon-btn tiktok ${selectedPlatform === 'tiktok' ? 'selected' : ''}`}>

                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3.14 15.7a6.34 6.34 0 0 0 9.06 5.67V12.1a8.16 8.16 0 0 0 5.14 1.83v-3.47a4.85 4.85 0 0 1-2.25-.77 4.8 4.8 0 0 1-1.5-1.92z" /></svg>
                </div>
                <span>TikTok</span>
              </button>

              {/* 3. YouTube */}
              <button onClick={handleShareYouTube}>
                <div className={`share-icon-btn youtube ${selectedPlatform === 'youtube' ? 'selected' : ''}`}>

                  <svg width="24" height="24" viewBox="0 0 24 24" fill="#fff"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                </div>
                <span>YouTube</span>
              </button>

              {/* 4. 다운로드 */}
              <button onClick={handleDownloadOnly}>
                <div className={`share-icon-btn download ${selectedPlatform === 'download' ? 'selected' : ''}`}>

                  <Download size={22} color="#4A5568" />
                </div>
                <span>{t.share?.download || (language === 'ko' ? '다운로드' : 'Download')}</span>
              </button>

              {/* 5. 더 보기 */}
              <button onClick={handleShareMore}>
                <div className={`share-icon-btn more ${selectedPlatform === 'more' ? 'selected' : ''}`}>

                  <Share2 size={22} color="#4A5568" />
                </div>
                <span>{t.share?.more || (language === 'ko' ? '더 보기' : 'More')}</span>
              </button>

              {/* 6. 피드 (노란색 #FFB320 + 뼈다귀 아이콘) */}
              <button onClick={handlePostFeedDraft}>
                <div className="share-icon-btn feed">

                  <Bone size={22} color="#fff" style={{ transform: 'rotate(45deg)' }} />
                </div>
                <span style={{ color: '#FFB320', fontWeight: 700 }}>{t.tabs?.feed || (language === 'ko' ? '피드' : 'Feed')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="pet-studio-modal-overlay" style={{ zIndex: 3000 }}>
          <div
            className="pet-studio-modal-container"
            style={{
              display: 'flex',
              flexDirection: 'column',
              maxHeight: '480px',
              maxWidth: '380px',
              padding: '20px',
              borderRadius: '24px',
              background: '#FFFFFF',
              boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
              boxSizing: 'border-box',
            }}
          >
            <div className="row-between mb-16" style={{ width: '100%', alignItems: 'center' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1A202C' }}>
                {language === 'ko' ? '피드 수정' : 'Edit Feed Post'}
              </span>
              <button onClick={() => setEditingPost(null)} className="btn-ghost" style={{ padding: '4px', color: '#718096' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#4A5568' }}>
                {language === 'ko' ? '속마음 텍스트 수정' : 'Edit Thought'}
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={language === 'ko' ? '피드 내용을 입력하세요...' : 'Enter feed text...'}
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: '1.5px solid #E2E8F0',
                  fontSize: '0.9rem',
                  outline: 'none',
                  resize: 'none',
                  boxSizing: 'border-box',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setEditingPost(null)}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '16px',
                  border: '1px solid #E2E8F0',
                  background: '#F7FAFC',
                  color: '#4A5568',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {language === 'ko' ? '취소' : 'Cancel'}
              </button>
              <button
                onClick={handleSaveEditPost}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: '16px',
                  border: 'none',
                  background: '#FFB320',
                  color: '#FFFFFF',
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(255, 179, 32, 0.4)',
                }}
              >
                {language === 'ko' ? '수정 완료' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mini Dog Profile Modal */}
      {profileModalDog && (
        <div
          className="pet-studio-modal-overlay"
          style={{ zIndex: 4000, background: 'rgba(0, 0, 0, 0.45)', backdropFilter: 'blur(3px)' }}
          onClick={() => setProfileModalDog(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '85%',
              maxWidth: '300px',
              background: '#FFFFFF',
              borderRadius: '24px',
              padding: '24px 20px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.25)',
              position: 'relative',
              boxSizing: 'border-box',
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setProfileModalDog(null)}
              style={{
                position: 'absolute',
                top: '12px',
                right: '12px',
                background: '#F7FAFC',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#718096',
              }}
            >
              <X size={16} />
            </button>

            {/* Profile Avatar */}
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              padding: '3px',
              background: 'linear-gradient(135deg, #FFB320, #FFA500)',
              boxShadow: '0 6px 18px rgba(255, 179, 32, 0.35)',
              marginBottom: '12px',
              flexShrink: 0,
            }}>
              <img
                src={profileModalDog.avatar}
                alt={profileModalDog.name}
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  display: 'block',
                  background: '#F8FAFC',
                }}
              />
            </div>

            {/* Name */}
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.2rem', fontWeight: 800, color: '#1A202C' }}>
              {profileModalDog.name}
            </h3>

            {/* Breed, Age & Gender */}
            <p style={{ margin: '0 0 14px 0', fontSize: '0.88rem', color: '#718096', fontWeight: 600 }}>
              {profileModalDog.breed} · {profileModalDog.age}{t.profile?.dogAgeSuffix || (language === 'ko' ? '살' : ' yrs')} · {
                profileModalDog.gender === 'male'
                  ? (t.common?.genderShortMale || (language === 'ko' ? '남' : 'M'))
                  : (t.common?.genderShortFemale || (language === 'ko' ? '여' : 'F'))
              }
            </p>

            {/* Personality Hashtags */}
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '6px',
              justifyContent: 'center',
              width: '100%',
            }}>
              {(profileModalDog.personality || []).map((tag: string, i: number) => (
                <span
                  key={i}
                  style={{
                    color: '#38c5b7',
                    border: '1px solid #38c5b7',
                    padding: '4px 9px',
                    borderRadius: '12px',
                    fontSize: '0.78rem',
                    fontWeight: 500,
                  }}
                >
                  {tag.startsWith('#') ? tag : `#${tag}`}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Toast Message */}
      {toastMessage && (
        <div style={{
          position: 'fixed', bottom: '85px', left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #FFB320', borderRadius: '12px',
          padding: '10px 18px', color: '#2D3748', fontSize: '0.8rem', fontWeight: 800,
          boxShadow: '0 8px 30px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px',
          zIndex: 4000, whiteSpace: 'nowrap'
        }}>
          <Sparkles size={16} color="#FFB320" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
