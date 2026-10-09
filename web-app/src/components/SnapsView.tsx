import React, { useState, useEffect } from 'react';
import { Heart, MessageSquare, Send, X, Image as ImageIcon, Download, Share2, Bone, Sparkles, MoreVertical, Edit3, Trash2, Plus, MoreHorizontal, Bookmark, Camera, Play, Menu, Flag, ShieldAlert } from 'lucide-react';
import confetti from 'canvas-confetti';
import { getMockDogs, isSameDogName, getDefaultDogAvatar, sanitizePetList } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { getMedia, saveMedia, deleteMedia, blobCache } from '../utils/mediaStore';
import { DogProfileModal } from './DogProfileModal';
import { ReportModal, ReportModalTarget } from './ReportModal';
import { isUserBlocked, blockUser } from '../services/moderationService';
import { validateUserContent } from '../utils/profanityFilter';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp, collection, query, orderBy } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { syncGlobalFeedPosts, syncSinglePost, deleteFeedPost, updateFeedPost } from '../services/db';
import { ensureVideoPlayable, uploadVideoToCloud, extractPosterFromVideo } from '../services/mediaSync';
import '../styles/OwnerNoteModal.css';

export interface SnapsViewProps {
  snapsDraft?: { dog: any, thought: string, image?: string, poster?: string, isVideo?: boolean } | null;
  feedDraft?: { dog: any, thought: string, image?: string, poster?: string, isVideo?: boolean } | null;
  handleClearFeedDraft?: () => void;
  onClearFeedDraft?: () => void;
  onClearSnapsDraft?: () => void;
  onRetake?: () => void;
}

export type FeedViewProps = SnapsViewProps;

const saveAndSyncUserPosts = (posts: any[]) => {
  const sanitized = posts.map(p => {
    if (p.isVideo && p.feedImage && typeof p.feedImage === 'string' && p.feedImage.startsWith('blob:')) {
      return {
        ...p,
        feedImage: p.originalFeedImage || `indexeddb:${p.id}`
      };
    }
    return p;
  });
  localStorage.setItem('WALWAL_USER_SNAPS_POSTS', JSON.stringify(sanitized));
  localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(sanitized));
  syncGlobalFeedPosts(sanitized).catch(console.error);
};


const compressImageForFirestore = (dataUrl: string): Promise<string> => {
  return new Promise((resolve) => {
    if (!dataUrl || !dataUrl.startsWith('data:image')) {
      return resolve(dataUrl);
    }
    const img = new Image();
    img.onload = () => {
      const maxW = 720;
      let w = img.width;
      let h = img.height;
      if (w > maxW) {
        h = Math.round((h * maxW) / w);
        w = maxW;
      }
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      } else {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

const cleanForFirestore = (obj: any): any => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj
      .filter(item => item !== undefined)
      .map(item => cleanForFirestore(item));
  }
  const result: any = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      result[key] = cleanForFirestore(val);
    }
  }
  return result;
};

const stripQuotes = (text?: string): string => {
  if (!text) return '';
  return text.replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, '').trim();
};

const isMyFeedPost = (_post: any): boolean => {
  return true;
};

export const SnapsView: React.FC<SnapsViewProps> = ({ snapsDraft: propSnapsDraft, feedDraft: propFeedDraft, onClearFeedDraft: propOnClearFeedDraft, onClearSnapsDraft: propOnClearSnapsDraft, handleClearFeedDraft: propHandleClearFeedDraft, onRetake }) => {
  const { t, language } = useTranslation();

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const commentImageInputRef = React.useRef<HTMLInputElement>(null);
  const [localFeedDraft, setLocalFeedDraft] = useState<any | null>(null);
  const feedDraft = propSnapsDraft || propFeedDraft || localFeedDraft;

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setModalCommentImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
    if (e.target) e.target.value = '';
  };

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
    if (propOnClearFeedDraft) propOnClearFeedDraft();
    if (propHandleClearFeedDraft) propHandleClearFeedDraft();
    if (localFeedDraft) setLocalFeedDraft(null);
  };

  const handleRetake = () => {
    handleClearFeedDraft();
    if (onRetake) {
      onRetake();
    } else {
      window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'ar' }));
    }
  };


  const [feedPosts, setFeedPosts] = useState<any[]>([]);

  // 피드 상호작용 (좋아요, 댓글, 공유 수) 로컬 스토리지 헬퍼
  const getStoredInteractions = (): Record<string, any> => {
    try {
      const saved = localStorage.getItem('WALWAL_FEED_INTERACTIONS');
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const saveFeedInteraction = (postId: string, update: Partial<{ liked: boolean; likes: number; comments: any[]; shares: number }>) => {
    try {
      const current = getStoredInteractions();
      current[postId] = {
        ...(current[postId] || {}),
        ...update
      };
      localStorage.setItem('WALWAL_FEED_INTERACTIONS', JSON.stringify(current));
    } catch (e) {
      console.error('Failed to save feed interaction:', e);
    }
  };

  const getDeletedPostIds = (): Set<string> => {
    try {
      const saved = localStorage.getItem('WALWAL_DELETED_POST_IDS');
      const ids: string[] = saved ? JSON.parse(saved) : [];
      return new Set(['test_post_1791081404195', ...ids]);
    } catch (e) {
      return new Set(['test_post_1791081404195']);
    }
  };

  const addDeletedPostId = (id: string) => {
    try {
      const current = Array.from(getDeletedPostIds());
      if (!current.includes(id)) {
        current.push(id);
        localStorage.setItem('WALWAL_DELETED_POST_IDS', JSON.stringify(current));
      }
    } catch (e) { }
  };

  const DEFAULT_FEED_DATA = [
    {
      "id": "post_1790236216201",
      "name": "ボリ",
      "ownerName": "보리 엄마",
      "avatar": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&auto=format&fit=crop&q=80",
      "breed": "ゴールデンレトリバー",
      "age": "2",
      "gender": "male",
      "personality": ["#陽キャ犬", "#みんな友達", "#おやつ鑑定士"],
      "recentThought": "Let's play! Give me treats!",
      "feedImage": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=800&auto=format&fit=crop&q=80",
      "isVideo": false,
      "createdAt": "2026-09-24T07:50:16.201Z",
      "likes": 8,
      "liked": false,
      "comments": [],
      "showComments": false,
      "shares": 2
    },
    {
      "id": "draft_1790231530745",
      "name": "보리 & 딸기",
      "breed": "골든 리트리버 · 말티즈",
      "age": "2, 5",
      "ownerName": "보리&딸기 맘",
      "avatar": "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=300&auto=format&fit=crop&q=80",
      "personality": ["#다둥이네", "#절친케미", "#우당탕탕"],
      "distance": "85m",
      "lat": 37.5445,
      "lng": 127.056,
      "recentThought": "아함~ 졸리고 편안하다 멍~",
      "feedImage": "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=800&auto=format&fit=crop&q=80",
      "detectedEmotion": "excited",
      "soundPattern": "왕! (저음 고주파 혼합음)",
      "posePattern": "꼬리 수평 회전 + 앞발 교차",
      "conversationLog": [
        { "speaker": "보리", "text": "오! 댕댕이 친구 엉덩이 냄새 스캔!! 킁킁", "time": "방금 전" },
        { "speaker": "땅콩", "text": "덩치값 좀 해라! 냄새 먼저 맡는게 예의지!", "time": "방금 전" },
        { "speaker": "보리", "text": "헤헤 냄새만 맡아도 오늘 저녁 메뉴 안다구~", "time": "1분 전" }
      ],
      "gender": "male",
      "greeting": "산책과 간식을 좋아해요",
      "stats": { "translateCount": 3, "studioCount": 8, "meetupCount": 0 },
      "subInfo": "골든 리트리버 2살, 말티즈 5살",
      "likes": 12,
      "liked": true,
      "comments": [],
      "showComments": false,
      "shares": 0,
      "isVideo": false
    },
    {
      "id": "draft_1789984025526",
      "name": "Bori & Fresa",
      "breed": "Golden Retriever · 말티즈",
      "age": "2, 5",
      "ownerName": "Bori&Fresa 맘",
      "avatar": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=300&auto=format&fit=crop&q=80",
      "personality": ["#Duo", "#BestFriends", "#Playful"],
      "distance": "85m",
      "lat": 37.5445,
      "lng": 127.056,
      "recentThought": "¡Mi humano está aquí! ¡Estoy aquí!",
      "feedImage": "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=800&auto=format&fit=crop&q=80",
      "detectedEmotion": "happy",
      "soundPattern": "Woof!",
      "posePattern": "Tail wagging",
      "conversationLog": [],
      "gender": "female",
      "greeting": "Love treats!",
      "stats": { "translateCount": 5, "studioCount": 2, "meetupCount": 1 },
      "subInfo": "Golden Retriever 2y, Maltese 5y",
      "likes": 5,
      "liked": false,
      "comments": [],
      "showComments": false,
      "shares": 0,
      "isVideo": false
    }
  ];

  React.useEffect(() => {
    // 1. Immediately render local/default posts synchronously so feed is NEVER blank!
    loadLocal();

    const handleFeedUpdate = () => {
      loadLocal();
    };
    window.addEventListener('walwal_snaps_updated', handleFeedUpdate);
    window.addEventListener('walwal_feed_updated', handleFeedUpdate);
    window.addEventListener('storage', handleFeedUpdate);

    let unsubscribe: any = null;
    try {
      unsubscribe = onSnapshot(collection(db, 'posts'), (querySnapshot) => {
        try {
          const deletedIds = getDeletedPostIds();
          const currentUserId = auth.currentUser?.uid || localStorage.getItem('walwal_user_id') || 'guest_user';
          const currentUserEmail = auth.currentUser?.email || '';

          const remotePosts: any[] = [];
          querySnapshot.forEach(docSnap => {
            if (deletedIds.has(docSnap.id)) return;
            const data = docSnap.data();
            if (data.name === 'Test Dog' || data.dog?.name === 'Test Dog') return;

            // 내가 올린 게시물만 필터링 (userId 일치 또는 userEmail 일치 또는 isMine 플래그)
            const isMine = Boolean(
              (currentUserId && data.userId && data.userId === currentUserId) ||
              (currentUserEmail && data.userEmail && data.userEmail === currentUserEmail) ||
              data.isMine
            );
            if (!isMine) return;

            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || data.clientCreatedAt || new Date().toISOString());
            remotePosts.push({
              ...data,
              id: docSnap.id,
              isMine: true,
              createdAt
            });
          });

          remotePosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

          let localPosts: any[] = [];
          try {
            const saved = localStorage.getItem('WALWAL_USER_SNAPS_POSTS') || localStorage.getItem('WALWAL_USER_FEED_POSTS');
            if (saved) localPosts = JSON.parse(saved);
            localPosts = localPosts.filter((p: any) => p && !deletedIds.has(p.id) && p.name !== 'Test Dog' && !DEFAULT_FEED_DATA.some(d => d.id === p.id));
          } catch (lsErr) { }

          const remoteIds = new Set(remotePosts.map(p => p.id));
          const pendingLocalPosts = localPosts.filter((lp: any) =>
            lp && lp.id && !remoteIds.has(lp.id) && !DEFAULT_FEED_DATA.some(d => d.id === lp.id) && !deletedIds.has(lp.id)
          );

          const mergedPosts = [...pendingLocalPosts, ...remotePosts];
          mergedPosts.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

          try {
            localStorage.setItem('WALWAL_USER_SNAPS_POSTS', JSON.stringify(mergedPosts));
            localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(mergedPosts));
          } catch (lsErr) { }

          loadPostsWithMedia(mergedPosts);
        } catch (snapErr) {
          console.error('Error handling Firestore onSnapshot:', snapErr);
          loadLocal();
        }
      }, (error) => {
        console.warn('Firestore snapshot error, falling back to local storage:', error);
        loadLocal();
      });
    } catch (e) {
      console.error('Firestore init error, using local storage:', e);
      loadLocal();
    }

    return () => {
      if (unsubscribe) unsubscribe();
      window.removeEventListener('walwal_snaps_updated', handleFeedUpdate);
      window.removeEventListener('walwal_feed_updated', handleFeedUpdate);
      window.removeEventListener('storage', handleFeedUpdate);
    };
  }, [language]);

  const loadPostsWithMedia = (postsToLoad: any[]) => {
    try {
      if (!postsToLoad || !Array.isArray(postsToLoad)) {
        setFeedPosts([]);
        return;
      }
      const interactions = getStoredInteractions();
      const defaultIds = new Set(DEFAULT_FEED_DATA.map(d => d.id));
      const deletedIds = getDeletedPostIds();
      const processedPosts = postsToLoad
        .filter(item => item && !defaultIds.has(item.id) && !deletedIds.has(item.id))
        .map(item => ({ ...item, isMine: true }));

      const currentUserId = auth.currentUser?.uid || localStorage.getItem('walwal_user_id') || 'guest_user';
      const currentUserEmail = auth.currentUser?.email || '';

      for (let i = 0; i < processedPosts.length; i++) {
        const post = processedPosts[i];
        if (interactions[post.id]) {
          const inter = interactions[post.id];
          if (inter.liked !== undefined) post.liked = inter.liked;
          if (inter.likes !== undefined) post.likes = inter.likes;
          if (inter.comments !== undefined) post.comments = inter.comments;
          if (inter.shares !== undefined) post.shares = inter.shares;
        }

        if (post.feedImage && typeof post.feedImage === 'string' && post.feedImage.startsWith('data:image') && !post.hasCloudMedia) {
          post.isVideo = false;
        }

        const isVideoPost = Boolean(
          post.isVideo ||
          post.hasCloudMedia ||
          (post.feedImage && typeof post.feedImage === 'string' && (post.feedImage.startsWith('indexeddb:') || post.feedImage.endsWith('.webm') || post.feedImage.endsWith('.mp4')))
        );

        if (isVideoPost) {
          post.isVideo = true;
          post.hasCloudMedia = true;
          const mediaId = (post.feedImage && typeof post.feedImage === 'string' && post.feedImage.startsWith('indexeddb:'))
            ? post.feedImage.split(':')[1]
            : post.id;
          let cachedBlob = blobCache.get(post.id) || (mediaId ? blobCache.get(mediaId) : null) || (post.feedImage ? blobCache.get(post.feedImage) : null);

          if (!post.originalFeedImage) {
            post.originalFeedImage = post.feedImage;
          }

          if (cachedBlob) {
            post.feedImage = URL.createObjectURL(cachedBlob);
          } else if (post.poster) {
            post.feedImage = post.poster;
          }
        }

        post.isMine = true;
      }

      // 1. Synchronously set feedPosts immediately!
      setFeedPosts(processedPosts);

      // 2. Asynchronously resolve videos in background without blocking
      processedPosts.forEach(async (post: any) => {
        const isPlayable = typeof post.feedImage === 'string' && (
          post.feedImage.startsWith('blob:') ||
          post.feedImage.startsWith('http://') ||
          post.feedImage.startsWith('https://') ||
          post.feedImage.endsWith('.webm') ||
          post.feedImage.endsWith('.mp4')
        );

        if (post.isVideo && !isPlayable) {
          try {
            const playableUrl = await ensureVideoPlayable(post);
            if (playableUrl && playableUrl !== post.feedImage) {
              setFeedPosts(prev => prev.map(p => p.id === post.id ? { ...p, feedImage: playableUrl } : p));
            }
          } catch (e) {
            console.error('Error resolving video for post:', post.id, e);
          }
        }
      });
    } catch (err) {
      console.error('Error in loadPostsWithMedia:', err);
      setFeedPosts(Array.isArray(postsToLoad) ? postsToLoad.filter(p => !DEFAULT_FEED_DATA.some(d => d.id === p.id)) : []);
    }
  };

  const loadLocal = () => {
    const deletedIds = getDeletedPostIds();
    const defaultIds = new Set(DEFAULT_FEED_DATA.map(d => d.id));
    let localPosts: any[] = [];
    try {
      const saved = localStorage.getItem('WALWAL_USER_SNAPS_POSTS') || localStorage.getItem('WALWAL_USER_FEED_POSTS');
      if (saved) localPosts = JSON.parse(saved);
      localPosts = localPosts.filter((p: any) => p && !deletedIds.has(p.id) && p.name !== 'Test Dog' && !defaultIds.has(p.id));
      localStorage.setItem('WALWAL_USER_SNAPS_POSTS', JSON.stringify(localPosts));
      localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(localPosts));
    } catch (e) {
      console.error('Failed to load WALWAL_USER_SNAPS_POSTS:', e);
      localPosts = [];
    }
    loadPostsWithMedia(localPosts);
  };

  const [newCommentText, setNewCommentText] = useState<{ [key: string]: string }>({});
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [modalCommentInput, setModalCommentInput] = useState('');
  const [modalCommentImage, setModalCommentImage] = useState<string | null>(null);
  const activeCommentPost = feedPosts.find(p => p.id === activeCommentPostId);
  const [draftText, setDraftText] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDetailPost, setSelectedDetailPost] = useState<any | null>(null);
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

    myPets = sanitizePetList(myPets, language);

    return myPets.map((p: any) => {
      const mock = getMockDogs(language).find(m => isSameDogName(m.name, p.name));
      const avatar = p.avatar || mock?.avatar || getDefaultDogAvatar(p.name || p.breed);
      return {
        id: p.id || p.name,
        name: p.name,
        breed: p.breed,
        ownerName: p.name,
        avatar,
        age: p.age ? String(p.age).replace(/[^0-9]/g, '') : '1',
        gender: p.gender || mock?.gender || 'male',
        personality: p.personality || p.tags || mock?.personality || ['#댕댕이']
      };
    });
  }, [language, petsUpdateTrigger]);

  const myDog = petOptions[0] || getMockDogs(language)[0];
  const [selectedCommentPetId, setSelectedCommentPetId] = useState<string>('');
  const currentCommentPet = petOptions.find(p => p.id === selectedCommentPetId) || petOptions[0] || myDog;

  const [selectedPetIds, setSelectedPetIds] = useState<string[]>(() => [petOptions[0]?.id || 'dog-1']);
  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [editText, setEditText] = useState<string>('');
  const [profileModalDog, setProfileModalDog] = useState<any | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportModalTarget | null>(null);
  const [blockedVersion, setBlockedVersion] = useState(0);

  useEffect(() => {
    const handleBlockedUpdated = () => setBlockedVersion(v => v + 1);
    window.addEventListener('walwal_blocked_users_updated', handleBlockedUpdated);
    return () => window.removeEventListener('walwal_blocked_users_updated', handleBlockedUpdated);
  }, []);

  // 드롭다운 메뉴 열려있을 때 바깥 빈 공간 클릭/터치 시 닫기
  useEffect(() => {
    if (!activeMenuPostId) return;
    const handleGlobalClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.snaps-album-dropdown') && !target.closest('.snaps-album-more-btn')) {
        setActiveMenuPostId(null);
      }
    };
    const timer = setTimeout(() => {
      window.addEventListener('click', handleGlobalClick);
      window.addEventListener('touchstart', handleGlobalClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('touchstart', handleGlobalClick);
    };
  }, [activeMenuPostId]);

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
                      border: '1px solid #FFB320',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.1)'
                    }}
                  />
                  <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#1A202C' }}>
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
        onMouseEnter={(e) => (e.currentTarget.style.background = 'transparent')}
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
        <span style={{ fontSize: '.85rem', fontWeight: 600, color: '#1A202C' }}>
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

  const isVideo = Boolean(
    feedDraft?.isVideo ||
    (feedDraft?.image && (feedDraft.image.endsWith('.webm') || feedDraft.image.endsWith('.mp4'))) ||
    (feedDraft?.image && feedDraft.image.startsWith('blob:') && blobCache.get(feedDraft.image)?.type.startsWith('video'))
  );

  const isMobileDevice = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // 실제 Blob MIME 타입 기준 확장자 (동영상을 .png로 저장/공유하던 버그 방지)
  const getMediaExt = (src: string, cacheKey?: string, videoHint?: boolean): string => {
    const blob = (cacheKey ? blobCache.get(cacheKey) : undefined) || blobCache.get(src);
    const type = blob?.type || '';
    if (type.includes('mp4')) return 'mp4';
    if (type.includes('webm')) return 'webm';
    if (type.includes('png')) return 'png';
    if (type.startsWith('image')) return 'jpg';
    return videoHint ? 'mp4' : 'jpg';
  };

  // 모바일: OS 공유 시트로 파일 전달 → 사용자가 Instagram/TikTok/YouTube 앱 선택. 처리되면 true
  const shareFileViaSheet = async (src: string | undefined, text: string, cacheKey?: string): Promise<boolean> => {
    if (!src || !navigator.canShare) return false;
    try {
      let blob = (cacheKey ? blobCache.get(cacheKey) : undefined) || blobCache.get(src);
      if (!blob) blob = await (await fetch(src)).blob();
      const type = blob.type || 'image/jpeg';
      const file = new File([blob], `walwal_${Date.now()}.${getMediaExt(src, cacheKey)}`, { type });
      if (!navigator.canShare({ files: [file] })) return false;
      await navigator.share({ files: [file], title: 'WalWal', text });
      return true;
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우는 처리 완료로 간주
      return (e as any)?.name === 'AbortError';
    }
  };

  const downloadDraftMedia = async (suffix: string): Promise<string> => {
    if (!feedDraft?.image) return '';
    const link = document.createElement('a');
    link.href = feedDraft.image;
    link.download = `walwal_feed_${suffix}.${getMediaExt(feedDraft.image, undefined, isVideo)}`;
    link.click();
    return feedDraft.image;
  };

  const handleShareInstagram = async () => {
    setSelectedPlatform('instagram');
    const thought = feedDraft?.thought || '';
    const caption = language === 'ko'
      ? `"${thought}"\n\n#WalWal #왈왈 #반려견통역 #멍스타그램 #댕댕이`
      : `"${thought}"\n\n#WalWal #DogTranslator #Dogstagram #Puppy`;

    if (isMobileDevice && await shareFileViaSheet(feedDraft?.image, caption)) return;

    // 팝업 차단 방지: await 전에 즉시 열기
    window.open('https://www.instagram.com/', '_blank');
    await downloadDraftMedia('instagram');
    try { await navigator.clipboard.writeText(caption); } catch (e) { }
    showToast(language === 'ko' ? '파일 다운로드·태그 복사 완료! Instagram에서 [+] 눌러 등록하세요.' : 'Downloaded & tags copied! Tap [+] on Instagram to post.');
  };

  const handleShareTikTok = async () => {
    setSelectedPlatform('tiktok');
    const thought = feedDraft?.thought || '';
    const caption = language === 'ko'
      ? `"${thought}" #WalWal #반려견통역 #강아지속마음 #댕댕이 #fyp`
      : `"${thought}" #WalWal #DogTranslator #Puppy #fyp`;

    if (isMobileDevice && await shareFileViaSheet(feedDraft?.image, caption)) return;

    window.open('https://www.tiktok.com/upload', '_blank');
    await downloadDraftMedia('tiktok');
    try { await navigator.clipboard.writeText(caption); } catch (e) { }
    showToast(language === 'ko' ? '파일 다운로드·태그 복사 완료! TikTok 업로드 화면에서 파일을 선택하세요.' : 'Downloaded & tags copied! Select the file on TikTok upload.');
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

    if (isMobileDevice && await shareFileViaSheet(feedDraft?.image, `${title}\n\n${desc}`)) return;

    window.open('https://www.youtube.com/upload', '_blank');
    await downloadDraftMedia('shorts');
    try { await navigator.clipboard.writeText(`${title}\n\n${desc}`); } catch (e) { }
    showToast(language === 'ko' ? '파일 다운로드·제목 복사 완료! YouTube 업로드 화면에서 파일을 선택하세요.' : 'Downloaded & title copied! Select the file on YouTube upload.');
  };

  const handleDownloadOnly = async () => {
    setSelectedPlatform('download');
    showToast(language === 'ko' ? '파일 다운로드 중...' : 'Downloading file...');

    await downloadDraftMedia(Date.now().toString());

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    showToast((t.snaps || t.studio)?.downloadComplete || t.share?.downloadComplete || (language === 'ko' ? '파일이 다운로드되었습니다! 🎉' : 'File downloaded successfully! 🎉'));
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
      setDraftText(stripQuotes(feedDraft.thought));
      if (feedDraft.dog && feedDraft.dog.id) {
        const found = petOptions.find(o => o.id === feedDraft.dog.id || o.name === feedDraft.dog.name);
        if (found) setSelectedPetIds([found.id]);
      }
    }
  }, [feedDraft, petOptions]);

  const handlePostFeedDraft = async () => {
    if (!feedDraft) return;

    const validation = validateUserContent(draftText);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

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
    const combinedOwnerName = activePets.length > 1 ? `${activePets.map(p => p.name).join('&')} 엄마` : activePets[0].ownerName;
    const combinedPersonality = activePets.length > 1
      ? (language === 'ko' ? ['#다둥이네', '#절친케미', '#우당탕탕'] : ['#Duo', '#BestFriends', '#Playful'])
      : activePets[0].personality;

    const postId = `post_${Date.now()}`;
    const isPostVideo = Boolean(
      feedDraft.isVideo ||
      isVideo ||
      (feedDraft.image && (feedDraft.image.endsWith('.webm') || feedDraft.image.endsWith('.mp4'))) ||
      (feedDraft.image && feedDraft.image.startsWith('blob:') && blobCache.get(feedDraft.image)?.type.startsWith('video'))
    );

    // 1. 비디오 및 포스터 추출 / 압축
    let posterDataUrl = feedDraft.poster || '';
    let videoBlob: Blob | null = null;

    if (isPostVideo && feedDraft.image) {
      if (blobCache.has(feedDraft.image)) {
        videoBlob = blobCache.get(feedDraft.image) || null;
      } else if (feedDraft.image.startsWith('blob:') || feedDraft.image.startsWith('data:')) {
        try {
          const res = await fetch(feedDraft.image);
          videoBlob = await res.blob();
        } catch (e) {
          console.warn('Fetch video blob failed:', e);
        }
      }

      if (!posterDataUrl && feedDraft.image) {
        try {
          const ext = await extractPosterFromVideo(feedDraft.image);
          if (ext) posterDataUrl = ext;
        } catch (e) {
          console.warn('Poster extraction failed:', e);
        }
      }
    }

    if (!posterDataUrl) {
      posterDataUrl = feedDraft.image || activePets[0].avatar || getDefaultDogAvatar();
    }

    const compressedPoster = await compressImageForFirestore(posterDataUrl);

    // 2. 미디어를 로컬 IndexedDB에 보관 및 클라우드 청크 업로드
    if (isPostVideo && videoBlob) {
      blobCache.set(postId, videoBlob);
      blobCache.set(`indexeddb:${postId}`, videoBlob);
      await saveMedia(postId, videoBlob).catch(console.warn);
      const res = await uploadVideoToCloud(postId, videoBlob);
      console.log(`Video chunks uploaded to Firestore for ${postId}:`, res);
    } else if (feedDraft.image) {
      try {
        let blob: Blob | null = null;
        if (feedDraft.image.startsWith('blob:') && blobCache.has(feedDraft.image)) {
          blob = blobCache.get(feedDraft.image) || null;
        } else if (feedDraft.image.startsWith('data:') || feedDraft.image.startsWith('blob:')) {
          const res = await fetch(feedDraft.image);
          blob = await res.blob();
        }
        if (blob) {
          await saveMedia(postId, blob);
        }
      } catch (err) {
        console.error('Failed to save media to IndexedDB:', err);
      }
    }

    const currentUserId = auth.currentUser?.uid || localStorage.getItem('walwal_user_id') || 'guest_user';
    const currentUserEmail = auth.currentUser?.email || '';

    // 3. 화면 즉시 표시용 새 포스트 (작성 기기에서는 Blob URL로 즉시 재생)
    const immediatePlayableMedia = isPostVideo
      ? (feedDraft.image || (videoBlob ? URL.createObjectURL(videoBlob) : compressedPoster))
      : compressedPoster;

    const newPost = {
      ...(feedDraft.dog || {}),
      id: postId,
      userId: currentUserId,
      userEmail: currentUserEmail,
      name: combinedName,
      breed: combinedBreed,
      age: combinedAge,
      subInfo: combinedSubInfo,
      gender: activePets[0].gender,
      ownerName: combinedOwnerName,
      avatar: activePets[0].avatar,
      personality: combinedPersonality,
      recentThought: stripQuotes(draftText || feedDraft.thought),
      feedImage: immediatePlayableMedia,
      poster: compressedPoster,
      likes: 0,
      liked: false,
      comments: [],
      showComments: false,
      shares: 0,
      isVideo: isPostVideo,
      hasCloudMedia: isPostVideo,
      isMine: true,
      clientCreatedAt: new Date().toISOString()
    };

    // 4. localStorage 및 Firestore 보관용 (용량 제한 방지: indexeddb 식별자 및 가벼운 poster 저장)
    const storagePost = {
      ...newPost,
      feedImage: isPostVideo ? `indexeddb:${postId}` : compressedPoster
    };

    try {
      const saved = localStorage.getItem('WALWAL_USER_SNAPS_POSTS') || localStorage.getItem('WALWAL_USER_FEED_POSTS');
      const posts = saved ? JSON.parse(saved) : [];
      posts.unshift(storagePost);
      localStorage.setItem('WALWAL_USER_SNAPS_POSTS', JSON.stringify(posts));
      localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(posts));
    } catch (e) {
      console.error('Failed to save to localStorage:', e);
    }

    try {
      const savedDeleted = localStorage.getItem('WALWAL_DELETED_POST_IDS');
      if (savedDeleted) {
        const ids = JSON.parse(savedDeleted).filter((id: string) => id !== postId);
        localStorage.setItem('WALWAL_DELETED_POST_IDS', JSON.stringify(ids));
      }
    } catch (e) { }

    // 5. 화면 state에 즉시 추가
    setFeedPosts(prev => [newPost, ...prev.filter(p => p.id !== postId)]);

    // 6. 토스트 띄우고 모달 즉시 닫기
    showToast(language === 'ko' ? `${combinedName} 스냅샷에 저장되었습니다!` : `Saved as ${combinedName}!`);
    handleClearFeedDraft();
    window.dispatchEvent(new Event('walwal_snaps_updated'));

    // 7. Firestore DB에 즉시 저장 (어느 디바이스로 로그인하든 스냅샷 히스토리 연동)
    try {
      const sanitizedPost = cleanForFirestore({
        ...storagePost,
        createdAt: null
      });
      delete sanitizedPost.createdAt;

      await setDoc(doc(db, 'posts', postId), {
        ...sanitizedPost,
        createdAt: serverTimestamp()
      });
      console.log('Post successfully saved to Firestore:', postId);
    } catch (dbErr) {
      console.error('Failed to save post to Firestore:', dbErr);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!window.confirm(t.snaps?.deleteConfirm || t.feed?.deleteConfirm || (language === 'ko' ? '이 스냅샷을 삭제하시겠습니까?' : language === 'ja' ? 'このスナップを削除しますか？' : 'Delete this snap?'))) return;

    // 1. Blacklist ID so it can never be loaded from Firestore or mock data
    addDeletedPostId(id);
    setActiveMenuPostId(null);

    // 2. Remove immediately from screen state
    setFeedPosts(prev => prev.filter(p => p.id !== id));

    // 3. Immediately remove from localStorage before any async operations
    try {
      const savedSnaps = localStorage.getItem('WALWAL_USER_SNAPS_POSTS');
      if (savedSnaps) {
        const posts = JSON.parse(savedSnaps).filter((p: any) => p && p.id !== id);
        localStorage.setItem('WALWAL_USER_SNAPS_POSTS', JSON.stringify(posts));
      }
      const savedFeed = localStorage.getItem('WALWAL_USER_FEED_POSTS');
      if (savedFeed) {
        const posts = JSON.parse(savedFeed).filter((p: any) => p && p.id !== id);
        localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(posts));
      }
      const interactions = getStoredInteractions();
      if (interactions[id]) {
        delete interactions[id];
        localStorage.setItem('WALWAL_FEED_INTERACTIONS', JSON.stringify(interactions));
      }
    } catch (e) {
      console.error('Failed to update localStorage on delete:', e);
    }

    // 4. Delete document in Firestore
    try {
      await deleteFeedPost(id);
    } catch (e) {
      console.error('Firestore delete error:', e);
    }

    // 5. Delete from IndexedDB media cache
    try {
      await deleteMedia(id);
    } catch (e) {
      console.warn('IndexedDB delete error:', e);
    }

    showToast(t.snaps?.deleteSuccess || t.feed?.deleteSuccess || (language === 'ko' ? '스냅샷이 삭제되었습니다.' : language === 'ja' ? 'スナップが削除されました。🗑️' : 'Snap deleted.'));
  };

  const handleSaveEditPost = () => {
    if (!editingPost) return;

    const validation = validateUserContent(editText);
    if (!validation.isValid) {
      alert(validation.message);
      return;
    }

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
        const userPosts = updated.filter(p => !p.id.toString().startsWith('dog-')).map(p => ({
          ...p,
          feedImage: p.originalFeedImage || p.feedImage,
          originalFeedImage: undefined
        }));
        saveAndSyncUserPosts(userPosts);
        updateFeedPost(editingPost.id, { recentThought: editText }).catch(console.error);
      } catch (e) {
        console.error('Failed to update localStorage on edit:', e);
      }
      return updated;
    });
    setEditingPost(null);
    showToast(t.snaps?.saveSuccess || t.feed?.saveSuccess || (language === 'ko' ? '스냅샷이 수정되었습니다!' : language === 'ja' ? 'スナップが修正されました！✨' : 'Snap updated!'));
  };

  const handleShareFeed = async (id: string) => {
    const postToShare = feedPosts.find(p => p.id === id);

    setFeedPosts(prev => prev.map(p => {
      if (p.id === id) {
        const newShares = (p.shares || 0) + 1;
        saveFeedInteraction(id, { shares: newShares });
        return { ...p, shares: newShares };
      }
      return p;
    }));

    if (postToShare) {
      try {
        if (navigator.share) {
          await navigator.share({
            title: `WalWal - ${postToShare.name}의 속마음`,
            text: `"${postToShare.recentThought}"\n우리 댕댕이 무슨 생각하는지 궁금하다면? WalWal 앱에서 확인해보세요!`,
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


  const sharePostTo = async (post: any, uploadUrl: string, doneMsg: string) => {
    const caption = `"${stripQuotes(post.recentThought)}"\n\n#WalWal`;
    if (isMobileDevice && await shareFileViaSheet(post.feedImage, caption, post.id)) return;

    // 팝업 차단 방지: await 전에 즉시 열기
    window.open(uploadUrl, '_blank');
    await handlePostDownload(post);
    try { await navigator.clipboard.writeText(caption); } catch (e) { }
    showToast(doneMsg);
  };

  const handlePostShareInstagram = (post: any) => sharePostTo(post, 'https://www.instagram.com/',
    language === 'ko' ? '파일 다운로드·태그 복사 완료! Instagram에서 [+] 눌러 등록하세요.' : 'Downloaded & tags copied! Tap [+] on Instagram to post.');

  const handlePostShareTikTok = (post: any) => sharePostTo(post, 'https://www.tiktok.com/upload',
    language === 'ko' ? '파일 다운로드·태그 복사 완료! TikTok 업로드 화면에서 파일을 선택하세요.' : 'Downloaded & tags copied! Select the file on TikTok upload.');

  const handlePostShareYouTube = (post: any) => sharePostTo(post, 'https://www.youtube.com/upload',
    language === 'ko' ? '파일 다운로드·태그 복사 완료! YouTube 업로드 화면에서 파일을 선택하세요.' : 'Downloaded & tags copied! Select the file on YouTube upload.');

  const handlePostDownload = async (post: any) => {
    showToast(language === 'ko' ? '파일 다운로드 중...' : 'Downloading file...');
    try {
      if (post.feedImage) {
        const link = document.createElement('a');
        link.href = post.feedImage;
        link.download = `walwal_${post.id || Date.now()}.${getMediaExt(post.feedImage, post.id, post.isVideo)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
        showToast(language === 'ko' ? '파일이 다운로드되었습니다!' : 'Downloaded!');
      }
    } catch (e) {
      showToast(language === 'ko' ? '다운로드 실패' : 'Download failed');
    }
  };

  const handlePostShareMore = async (post: any) => {
    await handleShareFeed(post.id);
  };

  const handleLikeFeed = (id: string) => {
    setFeedPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          const newLiked = !p.liked;
          const currentLikes = p.likes || 0;
          const newLikes = newLiked ? currentLikes + 1 : Math.max(0, currentLikes - 1);
          saveFeedInteraction(id, { liked: newLiked, likes: newLikes });
          return {
            ...p,
            liked: newLiked,
            likes: newLikes
          };
        }
        return p;
      });

      // customPosts에도 반영하여 최신 상태 동기화
      try {
        const userPosts = updated.filter(p => !p.id.toString().startsWith('dog-')).map(p => ({
          ...p,
          feedImage: p.originalFeedImage || p.feedImage,
          originalFeedImage: undefined
        }));
        saveAndSyncUserPosts(userPosts);
      } catch (e) {
        console.error('Failed to sync WALWAL_USER_FEED_POSTS on like:', e);
      }

      return updated;
    });
  };

  const handleOpenComments = (post: any) => {
    setActiveCommentPostId(post.id);
    setModalCommentInput('');
  };

  const handleCloseComments = () => {
    setActiveCommentPostId(null);
    setModalCommentInput('');
    setModalCommentImage(null);
  };

  const handleDeleteComment = (postId: string, commentId: number) => {
    setFeedPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === postId) {
          const newComments = (p.comments || []).filter((c: any) => c.id !== commentId);
          saveFeedInteraction(postId, { comments: newComments });
          return {
            ...p,
            comments: newComments
          };
        }
        return p;
      });

      try {
        const userPosts = updated.filter(p => !p.id.toString().startsWith('dog-')).map(p => ({
          ...p,
          feedImage: p.originalFeedImage || p.feedImage,
          originalFeedImage: undefined
        }));
        saveAndSyncUserPosts(userPosts);
      } catch (err) {
        console.error('Failed to sync WALWAL_USER_FEED_POSTS on delete comment:', err);
      }

      return updated;
    });

    showToast(language === 'ko' ? '댓글이 삭제되었습니다.' : 'Comment deleted.');
  };

  const handleModalSubmitComment = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeCommentPostId || (!modalCommentInput.trim() && !modalCommentImage)) return;

    const commentText = modalCommentInput.trim();
    if (commentText) {
      const valid = validateUserContent(commentText);
      if (!valid.isValid) {
        alert(valid.message);
        return;
      }
    }
    const commentImage = modalCommentImage;

    setFeedPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === activeCommentPostId) {
          const newCommentList = [
            ...(p.comments || []),
            {
              id: Date.now(),
              author: currentCommentPet.name,
              avatar: currentCommentPet.avatar || getDefaultDogAvatar(),
              text: commentText,
              image: commentImage || undefined,
              isMine: true,
              createdAt: language === 'ko' ? '방금 전' : (language === 'ja' ? 'たった今' : 'Just now')
            }
          ];
          saveFeedInteraction(activeCommentPostId, { comments: newCommentList });
          return {
            ...p,
            comments: newCommentList
          };
        }
        return p;
      });

      try {
        const userPosts = updated.filter(p => !p.id.toString().startsWith('dog-')).map(p => ({
          ...p,
          feedImage: p.originalFeedImage || p.feedImage,
          originalFeedImage: undefined
        }));
        saveAndSyncUserPosts(userPosts);
      } catch (err) {
        console.error('Failed to sync WALWAL_USER_FEED_POSTS on modal comment:', err);
      }

      return updated;
    });

    setModalCommentInput('');
    setModalCommentImage(null);
  };

  const handleToggleComments = (id: string) => {
    const post = feedPosts.find(p => p.id === id);
    if (post) {
      handleOpenComments(post);
    }
  };

  const handleSubmitComment = (id: string, e: React.FormEvent) => {
    e.preventDefault();
    const commentText = newCommentText[id]?.trim();
    if (!commentText) return;

    const valid = validateUserContent(commentText);
    if (!valid.isValid) {
      alert(valid.message);
      return;
    }

    setFeedPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === id) {
          const newCommentList = [
            ...(p.comments || []),
            { id: Date.now(), author: myDog.name, text: commentText }
          ];
          saveFeedInteraction(id, { comments: newCommentList });
          return {
            ...p,
            comments: newCommentList
          };
        }
        return p;
      });

      // customPosts에도 반영
      try {
        const userPosts = updated.filter(p => !p.id.toString().startsWith('dog-')).map(p => ({
          ...p,
          feedImage: p.originalFeedImage || p.feedImage,
          originalFeedImage: undefined
        }));
        saveAndSyncUserPosts(userPosts);
      } catch (e) {
        console.error('Failed to sync WALWAL_USER_FEED_POSTS on comment:', e);
      }

      return updated;
    });
    setNewCommentText(prev => ({ ...prev, [id]: '' }));
  };

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header row-between">
        <div>
          <h2 className="title-lg">{t.tabs?.snaps || t.tabs?.feed || '스냅샷'}</h2>
          <p className="text-sub">{t.snaps?.subtitle || t.feed?.subtitle || '세상의 모든 귀여움, 댕댕이 스냅샷'}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            className="btn-ghost" onClick={() => fileInputRef.current?.click()}
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
        <input
          type="file"
          accept="image/*"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={handleFileSelect}
        />
      </div>

      <div style={{ overflowX: 'hidden', overflowY: 'auto', flex: 1, paddingBottom: '140px' }}>
        <div className="section-gap" style={{ paddingBottom: '140px' }}>
          {feedPosts.length === 0 ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              textAlign: 'center',
              gap: '16px'
            }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: 'rgba(255, 179, 32, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Camera size={34} color="#FFB320" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E293B', marginBottom: '6px' }}>
                  {language === 'ko' ? '등록된 내 스냅샷이 없습니다' : language === 'ja' ? '登録されたマイスナップがありません' : 'No Snaps Yet'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  {language === 'ko'
                    ? 'AR 카메라로 강아지의 생각을 읽고\n첫 번째 스냅샷을 저장해보세요!'
                    : language === 'ja'
                      ? 'ARカメラでわんちゃんの気持ちを読み取って\n最初のスナップを保存してみましょう！'
                      : 'Capture your pet with AR camera\nand save your first Snap!'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'ar' }));
                }}
                className="btn btn-primary"
                style={{ padding: '12px 24px', fontSize: '0.9rem', marginTop: '8px' }}
              >
                <Camera size={18} />
                <span>{language === 'ko' ? 'AR 카메라로 촬영하기' : language === 'ja' ? 'ARカメラで撮影する' : 'Open AR Camera'}</span>
              </button>
            </div>
          ) : (
            (() => {
              const renderAlbumCard = (post: any) => {
                const isVideo = Boolean(
                  post.isVideo ||
                  (post.feedImage && typeof post.feedImage === 'string' && (post.feedImage.endsWith('.webm') || post.feedImage.endsWith('.mp4') || post.feedImage.includes('video')))
                );
                const hasValidPoster = Boolean(
                  post.poster &&
                  typeof post.poster === 'string' &&
                  (post.poster.startsWith('data:image') || (post.poster.startsWith('http') && !post.poster.endsWith('.webm') && !post.poster.endsWith('.mp4')))
                );
                const hasPlayableVideo = Boolean(
                  post.feedImage &&
                  typeof post.feedImage === 'string' &&
                  !post.feedImage.startsWith('indexeddb:') &&
                  (post.feedImage.startsWith('blob:') || post.feedImage.startsWith('http'))
                );
                const postDate = post.createdAt ? new Date(post.createdAt).toLocaleDateString(undefined, { month: 'numeric', day: 'numeric' }) : '';

                return (
                  <div
                    key={post.id}
                    className={`snaps-album-card ${activeMenuPostId === post.id ? 'active-menu' : ''}`}
                    onClick={async () => {
                      if (activeMenuPostId) {
                        setActiveMenuPostId(null);
                        return;
                      }
                      if (isVideo && (!post.feedImage || post.feedImage.startsWith('indexeddb:'))) {
                        const playable = await ensureVideoPlayable(post);
                        if (playable) {
                          setSelectedDetailPost({ ...post, feedImage: playable });
                          return;
                        }
                      }
                      setSelectedDetailPost(post);
                    }}
                  >
                    {/* Media Thumbnail Container */}
                    <div className="snaps-album-thumb-container">
                      {isVideo ? (
                        hasValidPoster ? (
                          <img
                            src={post.poster}
                            alt={post.name || 'Snap'}
                            className="snaps-album-thumb"
                            loading="lazy"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = post.avatar || getDefaultDogAvatar();
                            }}
                          />
                        ) : hasPlayableVideo ? (
                          <video
                            src={`${post.feedImage}#t=0.001`}
                            className="snaps-album-thumb"
                            muted
                            playsInline
                            preload="metadata"
                          />
                        ) : (
                          <img
                            src={post.avatar || getDefaultDogAvatar()}
                            alt={post.name || 'Snap'}
                            className="snaps-album-thumb snaps-album-fallback"
                            loading="lazy"
                          />
                        )
                      ) : (
                        <img
                          src={(post.feedImage && !post.feedImage.startsWith('indexeddb:')) ? post.feedImage : (post.poster || post.avatar || getDefaultDogAvatar())}
                          alt={post.name || 'Snap'}
                          className="snaps-album-thumb"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = post.avatar || getDefaultDogAvatar();
                          }}
                        />
                      )}

                      {/* Gradient Overlay */}
                      <div className="snaps-album-overlay" />

                      {/* Video Indicator Centered on Image */}
                      {isVideo && (
                        <div className="snaps-album-video-badge">
                          <Play size={12} fill="#fff" />
                        </div>
                      )}
                    </div>

                    {/* Dog Thought Caption Overlay at bottom */}
                    {post.recentThought && (
                      <div className="snaps-album-caption">
                        {stripQuotes(post.recentThought)}
                      </div>
                    )}

                    {/* Date Badge */}
                    {postDate && (
                      <div className="snaps-album-date-badge">
                        {postDate}
                      </div>
                    )}

                    {/* 3-Dots Button (점 3개 버튼) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id);
                      }}
                      className="snaps-album-more-btn"
                      title={t.share?.more || (language === 'ko' ? '더 보기' : 'More')}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {/* Dropdown Menu (수정 / 삭제 혹은 신고 / 차단) */}
                    {activeMenuPostId === post.id && (() => {
                      const isMyPost = Boolean(
                        post.isMine ||
                        petOptions.some(p => isSameDogName(p.name, post.name)) ||
                        (post.ownerName && petOptions.some(p => p.ownerName === post.ownerName))
                      );
                      return (
                        <div
                          className="snaps-album-dropdown"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {isMyPost ? (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingPost({ ...post });
                                  setEditText(post.recentThought || '');
                                  setActiveMenuPostId(null);
                                }}
                              >
                                <Edit3 size={14} />
                                <span>{t.snaps?.editPost || t.feed?.editPost || (language === 'ko' ? '수정' : 'Edit')}</span>
                              </button>
                              <button
                                type="button"
                                className="delete"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 size={14} />
                                <span>{t.snaps?.deletePost || t.feed?.deletePost || (language === 'ko' ? '삭제' : 'Delete')}</span>
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuPostId(null);
                                  setReportTarget({
                                    type: 'post',
                                    id: String(post.id),
                                    author: post.name || post.ownerName || 'unknown',
                                    content: post.recentThought || ''
                                  });
                                }}
                              >
                                <Flag size={14} color="#E53E3E" />
                                <span style={{ color: '#E53E3E' }}>게시글 신고</span>
                              </button>
                              <button
                                type="button"
                                className="delete"
                                onClick={() => {
                                  setActiveMenuPostId(null);
                                  const targetUser = post.name || post.ownerName;
                                  if (window.confirm(`'${targetUser}' 사용자를 차단하시겠습니까? 이 사용자의 모든 글이 숨겨집니다.`)) {
                                    blockUser(targetUser);
                                    alert('사용자가 차단되었습니다.');
                                  }
                                }}
                              >
                                <ShieldAlert size={14} />
                                <span>작성자 차단</span>
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              };

              const visiblePosts = feedPosts.filter(p => !isUserBlocked(p.name) && !isUserBlocked(p.ownerName));

              return (
                <>
                  {activeMenuPostId && (
                    <div
                      className="snaps-dropdown-backdrop"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveMenuPostId(null);
                      }}
                    />
                  )}
                  <div className="snaps-album-grid">
                    <div className="snaps-album-column">
                      {visiblePosts.filter((_, idx) => idx % 2 === 0).map(renderAlbumCard)}
                    </div>
                    <div className="snaps-album-column">
                      {visiblePosts.filter((_, idx) => idx % 2 !== 0).map(renderAlbumCard)}
                    </div>
                  </div>
                </>
              );
            })()
          )}
        </div>
      </div>

      {/* Feed Registration Modal */}
      {feedDraft && (
        <div className="snaps-modal-overlay">
          <div className="snaps-modal-container">
            {/* Header (Clean Style) */}
            <div className="snaps-modal-header row-between">
              <div className="snaps-modal-header-title ">
                <h2 className="title-lg">
                  {language === 'ko' ? '스냅샷' : language === 'ja' ? 'スナップ' : language === 'es' ? 'Foto / Video' : 'Pet Studio'}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

                {/*Header : Retake Button */}
                <button
                  type="button"
                  onClick={handleRetake}
                  className="snaps-modal-retake-btn"
                  title={language === 'ko' ? '재촬영' : 'Retake'}
                >
                  <Camera size={22} />
                  {/* <span>{language === 'ko' ? '재촬영' : language === 'ja' ? '再撮影' : language === 'es' ? 'Repetir' : 'Retake'}</span> */}
                </button>
                <button onClick={handleClearFeedDraft} className="btn-ghost snaps-modal-close-btn">
                  <X size={24} />
                </button>
              </div>
            </div>


            {/* Body (9:16 AI 말풍선 스냅샷 온전 노출 + 스크롤) */}
            <div className="snaps-modal-body">
              <div className="snaps-modal-media-wrapper">
                {feedDraft.image ? (
                  (typeof feedDraft.image === 'string' && (feedDraft.image.startsWith('blob:') || feedDraft.image.endsWith('.webm') || feedDraft.image.endsWith('.mp4'))) ? (
                    <video
                      src={feedDraft.image}
                      poster={feedDraft.poster}
                      autoPlay
                      loop
                      muted
                      playsInline
                    />
                  ) : (
                    <img
                      src={feedDraft.image}
                      alt="Preview"
                    />
                  )
                ) : (
                  <div className="snaps-empty-media">
                    <ImageIcon size={48} opacity={0.5} />

                    {/* Pet Selector Chips (아이콘 없이 이름만, 다중 선택 및 가로 스와이프 지원) */}
                    <div className={`pet-selector-chips-wrapper ${petOptions.length > 3 ? 'start-align' : ''}`}>
                      {petOptions.map(option => {
                        const isSelected = selectedPetIds.includes(option.id);
                        return (
                          <button
                            key={option.id}
                            onClick={() => handleTogglePet(option.id)}
                            type="button"
                            className={`pet-chip-btn ${isSelected ? 'active' : ''}`}
                          >
                            <span>{option.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>





            {/* Bottom Actions (Floating Glass Dock) */}
            <div className="snaps-modal-action-wrapper">
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

              {/* 6. 스냅샷 (노란색 #FFB320 + 북마크 아이콘) */}
              <button onClick={handlePostFeedDraft}>
                <div className="share-icon-btn snaps">
                  <Bone size={22} color="#fff" />
                </div>
                <span className="share-label-snaps share-label-feed">{language === 'ko' ? '저장' : language === 'ja' ? '保存' : 'Save'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Photo Album Detail Modal (Pet Studio style large view with SNS share dock) */}
      {selectedDetailPost && (
        <div className="snaps-modal-overlay" onClick={() => setSelectedDetailPost(null)}>
          <div className="snaps-modal-container" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="snaps-modal-header row-between">
              <div className="snaps-modal-header-title">
                <h2 className="title-lg">
                  {selectedDetailPost.name ? `${selectedDetailPost.name}` : (t.tabs?.snaps || '스냅샷')}
                </h2>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setEditingPost({ ...selectedDetailPost });
                    setEditText(selectedDetailPost.recentThought || '');
                    setSelectedDetailPost(null);
                  }}
                  className="btn-ghost"
                  style={{ padding: '4px' }}
                  title={t.snaps?.editPost || '수정'}
                >
                  <Edit3 size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const idToDelete = selectedDetailPost.id;
                    setSelectedDetailPost(null);
                    handleDeletePost(idToDelete);
                  }}
                  className="btn-ghost"
                  style={{ padding: '4px' }}
                  title={t.snaps?.deletePost || '삭제'}
                >
                  <Trash2 size={20} />
                </button>
                <button onClick={() => setSelectedDetailPost(null)} className="btn-ghost snaps-modal-close-btn">
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Body: High-resolution media + thought card */}
            <div className="snaps-modal-body">
              <div className="snaps-modal-media-wrapper">
                {selectedDetailPost.isVideo ? (
                  <video
                    src={selectedDetailPost.feedImage}
                    poster={selectedDetailPost.poster}
                    autoPlay
                    loop
                    muted
                    playsInline
                    controls
                  />
                ) : (
                  <img
                    src={selectedDetailPost.feedImage}
                    alt={selectedDetailPost.name || 'Snap'}
                  />
                )}
                {selectedDetailPost.recentThought && (
                  <div className="snaps-modal-thought">
                    <p>
                      {stripQuotes(selectedDetailPost.recentThought)}
                    </p>

                    {selectedDetailPost.createdAt && (
                      <span>
                        {new Date(selectedDetailPost.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                )}
              </div>


            </div>

            {/* Floating Glass SNS Share Dock at the bottom */}
            <div className="snaps-modal-action-wrapper" style={{ bottom: '20px' }}>
              {/* 1. Instagram */}
              <button onClick={() => handlePostShareInstagram(selectedDetailPost)} title="Instagram">
                <div className="share-icon-btn instagram">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                  </svg>
                </div>
                <span>Instagram</span>
              </button>

              {/* 2. TikTok */}
              <button onClick={() => handlePostShareTikTok(selectedDetailPost)} title="TikTok">
                <div className="share-icon-btn tiktok">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3.14 15.7a6.34 6.34 0 0 0 9.06 5.67V12.1a8.16 8.16 0 0 0 5.14 1.83v-3.47a4.85 4.85 0 0 1-2.25-.77 4.8 4.8 0 0 1-1.5-1.92z" />
                  </svg>
                </div>
                <span>TikTok</span>
              </button>

              {/* 3. YouTube */}
              <button onClick={() => handlePostShareYouTube(selectedDetailPost)} title="YouTube">
                <div className="share-icon-btn youtube">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="#fff">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
                <span>YouTube</span>
              </button>

              {/* 4. 다운로드 */}
              <button onClick={() => handlePostDownload(selectedDetailPost)} title="다운로드">
                <div className="share-icon-btn download">
                  <Download size={20} color="#4A5568" />
                </div>
                <span>{t.share?.download || (language === 'ko' ? '다운로드' : 'Download')}</span>
              </button>

              {/* 5. 더 보기 */}
              <button onClick={() => handlePostShareMore(selectedDetailPost)} title="더 보기">
                <div className="share-icon-btn more">
                  <Share2 size={20} color="#4A5568" />
                </div>
                <span>{t.share?.more || (language === 'ko' ? '더 보기' : 'More')}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Post Modal */}
      {editingPost && (
        <div className="snaps-modal-overlay">
          <div className="edit-post-modal-container">
            <div className="row-between mb-16 edit-post-modal-header">
              <span className="edit-post-modal-title">
                {t.feed?.editModalTitle || (language === 'ko' ? '수정' : language === 'ja' ? 'フィード編集' : 'Edit Feed Post')}
              </span>
              <button onClick={() => setEditingPost(null)} className="btn-ghost edit-post-modal-close">
                <X size={20} />
              </button>
            </div>

            <div className="edit-post-body">
              <label className="edit-post-label">
                {t.feed?.editThoughtLabel || (language === 'ko' ? '속마음 텍스트 수정' : language === 'ja' ? '本音テキストの編集' : 'Edit Thought')}
              </label>
              <textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder={t.feed?.editPlaceholder || (language === 'ko' ? '피드 내용을 입력하세요...' : language === 'ja' ? 'フィード内容を入力してください...' : 'Enter feed text...')}
                rows={4}
                className="edit-post-textarea"
              />
            </div>

            <div className="edit-post-actions">
              <button
                onClick={() => setEditingPost(null)}
                className="btn-edit-cancel"
              >
                {t.feed?.editCancel || (language === 'ko' ? '취소' : language === 'ja' ? 'キャンセル' : 'Cancel')}
              </button>
              <button
                onClick={handleSaveEditPost}
                className="btn-edit-save"
              >
                {t.feed?.editSave || (language === 'ko' ? '수정 완료' : language === 'ja' ? '編集完了' : 'Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Dog Profile Popup Modal */}
      <DogProfileModal
        dog={profileModalDog}
        onClose={() => setProfileModalDog(null)}
      />

      {/* Instagram/TikTok Style Comment Bottom Sheet Modal */}
      {activeCommentPost && (
        <div
          className="comment-bottom-sheet-overlay"
          onClick={(e) => {
            if (e.target === e.currentTarget) handleCloseComments();
          }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 3500,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            animation: 'fadeIn 0.2s ease-out'
          }}
        >
          <div
            className="comment-bottom-sheet-container"
            style={{
              width: '100%',
              maxWidth: '480px',
              margin: '0 auto',
              background: '#FFFFFF',
              borderTopLeftRadius: '28px',
              borderTopRightRadius: '28px',
              height: '75vh',
              maxHeight: '620px',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.25)',
              position: 'relative'
            }}
          >
            {/* Top Drag Handle */}
            <div
              style={{
                width: '42px',
                height: '4.5px',
                background: '#475569',
                borderRadius: '3px',
                margin: '12px auto 8px'
              }}
            />

            {/* Header */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                padding: '4px 16px 14px',
                borderBottom: '1px solid #F1F5F9'
              }}
            >
              <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                {t.feed?.commentTitle || '댓글'}
              </h3>
            </div>

            {/* Comment List Body */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              {activeCommentPost.comments.length === 0 ? (
                /* Empty State (스크린샷 디자인 100% 반영) */
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '60px 20px',
                    textAlign: 'center'
                  }}
                >
                  <h2
                    style={{
                      fontSize: '1.35rem',
                      fontWeight: 800,
                      color: '#000000',
                      marginBottom: '10px',
                      letterSpacing: '-0.02em'
                    }}
                  >
                    {t.feed?.noComments || '아직 댓글이 없습니다'}
                  </h2>
                  <p style={{ fontSize: '0.95rem', color: '#64748B', margin: 0 }}>
                    {t.feed?.beFirstComment || '댓글을 남겨보세요.'}
                  </p>
                </div>
              ) : (
                /* Comment Items List */
                <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                  {activeCommentPost.comments.filter((c: any) => !isUserBlocked(c.author)).map((c: any) => {
                    const isMyComment = Boolean(
                      c.isMine ||
                      petOptions.some(p => isSameDogName(p.name, c.author) || (p.ownerName && isSameDogName(p.ownerName, c.author))) ||
                      isSameDogName(c.author, '보리') ||
                      isSameDogName(c.author, '딸기') ||
                      c.author === '나'
                    );

                    const authorAvatar = isMyComment
                      ? (currentCommentPet?.avatar || myDog?.avatar || c.avatar || getDefaultDogAvatar())
                      : (c.avatar || getDefaultDogAvatar());

                    const cleanAuthor = (c.author || '')
                      .replace(/\s*(엄마|맘|아빠|Mom|Dad|ママ|パパ)\s*$/gi, '')
                      .trim() || c.author;

                    return (
                      <div key={c.id} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                        <img
                          src={authorAvatar}
                          alt={cleanAuthor}
                          style={{
                            width: '38px',
                            height: '38px',
                            borderRadius: '50%',
                            objectFit: 'cover',
                            background: '#F1F5F9',
                            flexShrink: 0,
                            border: '1px solid #E2E8F0'
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>{cleanAuthor}</span>
                              <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{c.createdAt || '방금 전'}</span>
                            </div>
                            {isMyComment ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(activeCommentPost.id, c.id)}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  padding: '2px 4px',
                                  cursor: 'pointer',
                                  color: '#CBD5E1',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  transition: 'color 0.15s'
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                                onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                                title={t.feed?.deleteComment || '댓글 삭제'}
                              >
                                <X size={14} />
                              </button>
                            ) : (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReportTarget({
                                      type: 'comment',
                                      id: String(c.id),
                                      author: cleanAuthor,
                                      content: c.text || ''
                                    });
                                  }}
                                  title="댓글 신고"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    color: '#CBD5E1',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                                >
                                  <Flag size={13} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (window.confirm(`'${cleanAuthor}' 사용자를 차단하시겠습니까?`)) {
                                      blockUser(cleanAuthor);
                                      alert('사용자가 차단되었습니다.');
                                    }
                                  }}
                                  title="작성자 차단"
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: '2px',
                                    cursor: 'pointer',
                                    color: '#CBD5E1',
                                    display: 'flex',
                                    alignItems: 'center'
                                  }}
                                  onMouseEnter={(e) => (e.currentTarget.style.color = '#718096')}
                                  onMouseLeave={(e) => (e.currentTarget.style.color = '#CBD5E1')}
                                >
                                  <ShieldAlert size={13} />
                                </button>
                              </div>
                            )}
                          </div>
                          {c.text && (
                            <p style={{ fontSize: '0.9rem', color: '#334155', margin: '4px 0 0', lineHeight: 1.45, wordBreak: 'break-word' }}>
                              {c.text}
                            </p>
                          )}
                          {c.image && (
                            <div style={{ marginTop: '8px', borderRadius: '12px', overflow: 'hidden', maxWidth: '180px', maxHeight: '180px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                              <img src={c.image} alt="Comment image" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Bottom Interaction Bar */}
            <div style={{ borderTop: '1px solid #F1F5F9', background: '#FFFFFF' }}>
              {/* Quick Emojis Row (❤️ 🙌 👏 😍 😮 😂) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '10px 18px 6px'
                }}
              >
                {['❤️', '🙌', '🔥', '👏', '😢', '😍', '😮', '😂'].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setModalCommentInput((prev) => prev + emoji)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: '1.45rem',
                      cursor: 'pointer',
                      padding: '2px',
                      transition: 'transform 0.15s'
                    }}
                    onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(1.25)')}
                    onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.18)')}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              {/* Hidden File Input for Image Attachment */}
              <input
                type="file"
                ref={commentImageInputRef}
                onChange={handleCommentImageSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />

              {/* Attached Image Preview */}
              {modalCommentImage && (
                <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'relative', display: 'inline-block' }}>
                    <img
                      src={modalCommentImage}
                      alt="Preview"
                      style={{ width: '56px', height: '56px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #ffb320', boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}
                    />
                    <button
                      type="button"
                      onClick={() => setModalCommentImage(null)}
                      style={{
                        position: 'absolute',
                        top: '-6px',
                        right: '-6px',
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#0F172A',
                        color: '#FFFFFF',
                        border: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer'
                      }}
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              {/* Multi-Pet Selector Chips (반려견이 2마리 이상일 때 표시) */}
              {petOptions.length > 1 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 16px 6px', overflowX: 'auto' }}>

                  {petOptions.map(pet => {
                    const isSelected = (currentCommentPet.id === pet.id || currentCommentPet.name === pet.name);
                    return (
                      <button
                        className={`badge-name ${isSelected ? 'active' : ''}`}
                        key={pet.id}
                        type="button"
                        onClick={() => setSelectedCommentPetId(pet.id)}
                      >
                        <img src={pet.avatar} alt={pet.name} style={{ width: '16px', height: '16px', borderRadius: '50%', objectFit: 'cover' }} />
                        <span>{pet.name}</span>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Input Form */}
              <form
                onSubmit={handleModalSubmitComment}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '8px 16px 24px',
                  background: '#FFFFFF'
                }}
              >
                <img
                  src={currentCommentPet.avatar || getDefaultDogAvatar()}
                  alt={currentCommentPet.name}
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    flexShrink: 0,
                    border: '1.5px solid #38c5b7'
                  }}
                  title={`${currentCommentPet.name} 프로필`}
                />
                <div
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    background: '#FFFFFF',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: '24px',
                    padding: '4px 12px 4px 16px',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.02)'
                  }}
                >
                  <input
                    type="text"
                    placeholder={t.feed?.commentPlaceholder || '댓글 달기...'}
                    value={modalCommentInput}
                    onChange={(e) => setModalCommentInput(e.target.value)}
                    style={{
                      flex: 1,
                      border: 'none',
                      background: 'transparent',
                      outline: 'none',
                      fontSize: '0.92rem',
                      color: '#0F172A',
                      padding: '6px 0'
                    }}
                  />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: '6px' }}>
                    <button
                      type="button"
                      onClick={() => commentImageInputRef.current?.click()}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#0F172A',
                        cursor: 'pointer',
                        padding: '2px',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="갤러리에서 사진 첨부"
                    >
                      <ImageIcon size={22} strokeWidth={2} />
                    </button>
                    {(modalCommentInput.trim() || modalCommentImage) && (
                      <button
                        type="submit"
                        style={{
                          background: '#38c5b7',
                          color: '#FFFFFF',
                          border: 'none',
                          borderRadius: '50%',
                          width: '28px',
                          height: '28px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          marginLeft: '2px',
                          boxShadow: '0 2px 8px rgba(56, 197, 183, 0.4)'
                        }}
                      >
                        <Send size={13} style={{ marginLeft: '1px' }} />
                      </button>
                    )}
                  </div>
                </div>
              </form>
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

      {/* Report Modal */}
      <ReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div>
  );
};

export const FeedView = SnapsView;
export default SnapsView;
