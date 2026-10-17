import React, { useState, useEffect, useRef } from 'react';
import { Heart, MessageSquare, MessageCircle, Send, X, Image as ImageIcon, Circle, Download, Share2, AlignRight, Bone, Sparkles, MoreVertical, Edit3, Trash2, Plus, MoreHorizontal, Bookmark, Camera, Play, Menu, Flag, ShieldAlert, RotateCcw, RotateCw, ArrowLeft, ChevronsLeft, LayoutGrid, Link2, Check, Undo, Redo, Square, Repeat2 } from 'lucide-react';
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

const formatSocialCount = (num: number = 0, lang: string = 'ko'): string => {
  if (!num || num <= 0) return '0';
  if (lang === 'ko') {
    if (num >= 10000) return (num / 10000).toFixed(1).replace(/\.0$/, '') + '만';
    if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + '천';
    return num.toLocaleString();
  }
  if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
  return num.toLocaleString();
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

/**
 * 캔버스를 이용해 이미지를 좌/우 90도 단위로 회전하고, 원하는 종횡비(1:1, 9:16, 16:9, 원본)로 정밀 크롭합니다.
 */
export function transformImage(
  img: HTMLImageElement,
  rotation: number,
  cropRatio: 'original' | '1:1' | '9:16' | '16:9'
): string {
  const normRot = ((rotation % 360) + 360) % 360;
  const isSwap = normRot === 90 || normRot === 270;

  const rotatedW = isSwap ? img.naturalHeight : img.naturalWidth;
  const rotatedH = isSwap ? img.naturalWidth : img.naturalHeight;

  let targetAspect = rotatedW / rotatedH;
  if (cropRatio === '1:1') {
    targetAspect = 1;
  } else if (cropRatio === '9:16') {
    targetAspect = 9 / 16;
  } else if (cropRatio === '16:9') {
    targetAspect = 16 / 9;
  }

  let cropW = rotatedW;
  let cropH = rotatedH;
  const currentAspect = rotatedW / rotatedH;

  if (cropRatio !== 'original') {
    if (currentAspect > targetAspect) {
      cropH = rotatedH;
      cropW = Math.round(cropH * targetAspect);
    } else {
      cropW = rotatedW;
      cropH = Math.round(cropW / targetAspect);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, cropW);
  canvas.height = Math.max(1, cropH);
  const ctx = canvas.getContext('2d');
  if (!ctx) return img.src;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.translate(canvas.width / 2, canvas.height / 2);
  ctx.rotate((normRot * Math.PI) / 180);

  ctx.drawImage(
    img,
    -img.naturalWidth / 2,
    -img.naturalHeight / 2,
    img.naturalWidth,
    img.naturalHeight
  );

  return canvas.toDataURL('image/jpeg', 0.95);
}

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
    if (!petOptions || petOptions.length === 0) {
      alert(language === 'ko'
        ? '등록된 내 반려견이 없습니다.\n마이펫 탭에서 먼저 반려견을 등록해 주세요!'
        : 'No registered pet found. Please register your pet in My Pet first!');
      if (e.target) e.target.value = '';
      window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'profile' }));
      return;
    }
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


  const [petsUpdateTrigger, setPetsUpdateTrigger] = useState(0);

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

  const myDog = petOptions[0] || null;

  // 게시물이 현재 사용자의 게시물인지 검증하는 오너십 판정 함수
  const checkIsMyPost = React.useCallback((post: any): boolean => {
    if (!post) return false;
    const currentUserId = auth.currentUser?.uid || '';
    const currentUserEmail = (auth.currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || localStorage.getItem('walwal_user_email') || '').toLowerCase().trim();

    // 1. 게시물 작성자의 email이나 uid가 일치하면 본인 게시물
    const postEmail = (post.userEmail || post.authorEmail || '').toLowerCase().trim();
    if (postEmail && currentUserEmail && postEmail === currentUserEmail) return true;

    const postUid = post.userId || post.authorId || '';
    if (postUid && currentUserId && postUid === currentUserId) return true;

    // 2. 내 계정에 등록된 반려견이 0마리면 타인 게시물의 소유자가 될 수 없음
    if (!petOptions || petOptions.length === 0) return false;

    // 3. 내 등록 반려견과 이름 매칭 확인
    const matchesPet = petOptions.some((p: any) => isSameDogName(p.name, post.name));
    if (matchesPet) {
      // 시스템 기본 강아지(보리, 딸기 등)는 daisynara 계정만 본인 글로 인정
      if (isSameDogName(post.name, '보리') || isSameDogName(post.name, 'Bori') || isSameDogName(post.name, '딸기') || isSameDogName(post.name, 'Strawberry')) {
        return currentUserEmail.includes('daisynara');
      }
      return true;
    }

    return false;
  }, [petOptions]);

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
      const ids: any[] = saved ? JSON.parse(saved) : [];
      return new Set(['test_post_1791081404195', ...ids.map(String)]);
    } catch (e) {
      return new Set(['test_post_1791081404195']);
    }
  };

  const addDeletedPostId = (id: any) => {
    try {
      const current = Array.from(getDeletedPostIds());
      const strId = String(id);
      if (!current.includes(strId)) {
        current.push(strId);
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
      setFeedPosts(prev => {
        const deletedIds = getDeletedPostIds();
        if (prev && prev.length > 0) {
          return prev.filter(p => p && !deletedIds.has(String(p.id)));
        }
        loadLocal();
        return prev;
      });
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

          const getPostTime = (p: any): number => {
            if (!p) return 0;
            const t = p.createdAt || p.clientCreatedAt;
            if (!t) return 0;
            if (typeof t.toDate === 'function') return t.toDate().getTime();
            if (t.seconds) return t.seconds * 1000;
            const parsed = new Date(t).getTime();
            return isNaN(parsed) ? 0 : parsed;
          };

          const remotePosts: any[] = [];
          querySnapshot.forEach(docSnap => {
            if (deletedIds.has(String(docSnap.id))) return;
            const data = docSnap.data();
            if (data.name === 'Test Dog' || data.dog?.name === 'Test Dog') return;

            const isMine = checkIsMyPost({ ...data, id: docSnap.id });
            const createdAt = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || data.clientCreatedAt || new Date().toISOString());
            remotePosts.push({
              ...data,
              id: docSnap.id,
              isMine,
              createdAt
            });
          });

          remotePosts.sort((a, b) => getPostTime(b) - getPostTime(a));

          let localPosts: any[] = [];
          try {
            const saved = localStorage.getItem('WALWAL_USER_SNAPS_POSTS') || localStorage.getItem('WALWAL_USER_FEED_POSTS');
            if (saved) localPosts = JSON.parse(saved);
            localPosts = localPosts.filter((p: any) => p && !deletedIds.has(String(p.id)) && p.name !== 'Test Dog' && !DEFAULT_FEED_DATA.some(d => String(d.id) === String(p.id)));
          } catch (lsErr) { }

          const remoteIds = new Set(remotePosts.map(p => String(p.id)));
          const pendingLocalPosts = localPosts.filter((lp: any) =>
            lp && lp.id && !remoteIds.has(String(lp.id)) && !DEFAULT_FEED_DATA.some(d => String(d.id) === String(lp.id)) && !deletedIds.has(String(lp.id))
          );

          const mergedPosts = [...pendingLocalPosts, ...remotePosts];
          mergedPosts.sort((a, b) => getPostTime(b) - getPostTime(a));

          try {
            const lightPosts = mergedPosts.slice(0, 30).map(p => ({
              ...p,
              feedImage: (typeof p.feedImage === 'string' && p.feedImage.length > 50000 && p.poster) ? p.poster : p.feedImage
            }));
            localStorage.setItem('WALWAL_USER_SNAPS_POSTS', JSON.stringify(lightPosts));
            localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(lightPosts));
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
      const defaultIds = new Set(DEFAULT_FEED_DATA.map(d => String(d.id)));
      const deletedIds = getDeletedPostIds();
      const getPostTime = (p: any): number => {
        if (!p) return 0;
        const t = p.createdAt || p.clientCreatedAt;
        if (!t) return 0;
        if (typeof t.toDate === 'function') return t.toDate().getTime();
        if (t.seconds) return t.seconds * 1000;
        const parsed = new Date(t).getTime();
        return isNaN(parsed) ? 0 : parsed;
      };

      const processedPosts = postsToLoad
        .filter(item => item && !defaultIds.has(String(item.id)) && !deletedIds.has(String(item.id)))
        .map(item => ({ ...item, isMine: checkIsMyPost(item) }))
        .sort((a, b) => getPostTime(b) - getPostTime(a));

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

        post.isMine = checkIsMyPost(post);
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
      setFeedPosts(Array.isArray(postsToLoad) ? postsToLoad.filter(p => !DEFAULT_FEED_DATA.some(d => String(d.id) === String(p.id))) : []);
    }
  };

  const loadLocal = () => {
    const deletedIds = getDeletedPostIds();
    const defaultIds = new Set(DEFAULT_FEED_DATA.map(d => String(d.id)));
    let localPosts: any[] = [];
    try {
      const saved = localStorage.getItem('WALWAL_USER_SNAPS_POSTS') || localStorage.getItem('WALWAL_USER_FEED_POSTS');
      if (saved) localPosts = JSON.parse(saved);
      localPosts = localPosts.filter((p: any) => p && !deletedIds.has(String(p.id)) && p.name !== 'Test Dog' && !defaultIds.has(String(p.id)));
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
  const [replyingToComment, setReplyingToComment] = useState<{ id: number; author: string } | null>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);
  const activeCommentPost = feedPosts.find(p => p.id === activeCommentPostId);
  const [draftText, setDraftText] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [selectedDetailPost, setSelectedDetailPost] = useState<any | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'feed'>('feed');
  const [selectedFeedPostId, setSelectedFeedPostId] = useState<string | null>(null);
  const [activeFeedMenuId, setActiveFeedMenuId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // 팔로우한 사용자 목록 상태 (로컬 스토리지 연동)
  const [followedUsers, setFollowedUsers] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_FOLLOWED_USERS');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const handleToggleFollow = (authorKey: string) => {
    if (!authorKey) return;
    setFollowedUsers(prev => {
      const isFollowed = prev.includes(authorKey);
      const updated = isFollowed
        ? prev.filter(k => k !== authorKey)
        : [...prev, authorKey];
      try {
        localStorage.setItem('WALWAL_FOLLOWED_USERS', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save followed users:', e);
      }
      showToast(
        isFollowed
          ? (language === 'ko' ? `'${authorKey}' 님을 언팔로우했습니다.` : language === 'ja' ? 'フォローを解除しました。' : 'Unfollowed.')
          : (language === 'ko' ? `'${authorKey}' 님을 팔로우했습니다!` : language === 'ja' ? 'フォローしました！' : 'Following!')
      );
      return updated;
    });
  };

  // 북마크 (게시물 저장) 상태
  const [bookmarkedPostIds, setBookmarkedPostIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_BOOKMARKED_POST_IDS');
      return saved ? JSON.parse(saved).map(String) : [];
    } catch (e) {
      return [];
    }
  });

  // 저장한 게시물 모아보기 필터 상태
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const handleToggleBookmark = (postId: any) => {
    const targetId = String(postId);
    setBookmarkedPostIds(prev => {
      const isBookmarked = prev.map(String).includes(targetId);
      const updated = isBookmarked ? prev.map(String).filter(id => id !== targetId) : [...prev.map(String), targetId];
      try {
        localStorage.setItem('WALWAL_BOOKMARKED_POST_IDS', JSON.stringify(updated));
      } catch (e) { }
      showToast(
        isBookmarked
          ? (language === 'ko' ? '게시물 저장이 취소되었습니다.' : language === 'ja' ? '保存を取り消しました。' : 'Post unsaved.')
          : (language === 'ko' ? '게시물이 저장되었습니다! 📌 (상단 북마크 아이콘에서 확인)' : language === 'ja' ? '投稿を保存しました！📌' : 'Post saved! 📌')
      );
      return updated;
    });
  };

  // 피드 탭 재클릭 시 최상단(최신 피드)으로 초기화
  useEffect(() => {
    const handleResetTop = () => {
      setSelectedFeedPostId(null);
      setShowBookmarkedOnly(false);
      setViewMode('feed');
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      }
    };
    window.addEventListener('walwal_reset_snaps_top', handleResetTop);
    return () => window.removeEventListener('walwal_reset_snaps_top', handleResetTop);
  }, []);

  // 피드 드롭다운 메뉴 바깥 영역 클릭 및 스크롤/터치 이동 시 즉시 닫기 (스크롤 방해 원천 차단)
  useEffect(() => {
    if (!activeFeedMenuId) return;
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.snaps-feed-dropdown-menu') && !target.closest('.snaps-feed-action-icon-btn')) {
        setActiveFeedMenuId(null);
      }
    };
    const handleScrollOrMove = () => {
      setActiveFeedMenuId(null);
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick, { passive: true });
    window.addEventListener('scroll', handleScrollOrMove, true);
    window.addEventListener('touchmove', handleScrollOrMove, { passive: true });
    window.addEventListener('wheel', handleScrollOrMove, { passive: true });
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
      window.removeEventListener('scroll', handleScrollOrMove, true);
      window.removeEventListener('touchmove', handleScrollOrMove);
      window.removeEventListener('wheel', handleScrollOrMove);
    };
  }, [activeFeedMenuId]);

  // 피드 모드로 진입하거나 특정 사진을 선택했을 때 해당 카드로 자동 스크롤
  useEffect(() => {
    if (viewMode === 'feed') {
      const scrollTarget = () => {
        if (selectedFeedPostId) {
          const targetEl = document.getElementById(`feed-post-${selectedFeedPostId}`);
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'auto', block: 'start' });
            return;
          }
        }
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      };
      const raf = requestAnimationFrame(scrollTarget);
      const timer = setTimeout(scrollTarget, 60);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [viewMode, selectedFeedPostId]);

  // 그리드 모드로 복귀 시: 선택했던 피드로 위치를 잡거나 최상단(최신 피드)으로 정렬
  useEffect(() => {
    if (viewMode === 'grid') {
      const scrollGridTarget = () => {
        if (selectedFeedPostId) {
          const targetEl = document.getElementById(`album-post-${selectedFeedPostId}`);
          if (targetEl) {
            // 상위 2개(최신) 포스트인 경우 스크롤을 맨 위(0)로 깔끔하게 맞춤
            const isTopPost = feedPosts.slice(0, 2).some(p => String(p.id) === String(selectedFeedPostId));
            if (isTopPost && scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = 0;
            } else {
              targetEl.scrollIntoView({ behavior: 'auto', block: 'center' });
            }
            return;
          }
        }
        // 선택된 피드가 없거나 못 찾으면 최상단(최신 피드)으로 스크롤
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      };
      const raf = requestAnimationFrame(scrollGridTarget);
      const timer = setTimeout(scrollGridTarget, 60);
      return () => {
        cancelAnimationFrame(raf);
        clearTimeout(timer);
      };
    }
  }, [viewMode, selectedFeedPostId, feedPosts]);

  // 피드 모드에서 스크롤 시 화면 상단/중앙에 위치한 카드 ID를 추적하여 그리드 복귀 시 위치 보존
  useEffect(() => {
    if (viewMode !== 'feed') return;
    const scrollEl = scrollContainerRef.current;
    if (!scrollEl) return;

    let ticking = false;
    const handleFeedScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const cards = scrollEl.querySelectorAll<HTMLElement>('.snaps-feed-card');
          if (cards.length === 0) {
            ticking = false;
            return;
          }
          const containerRect = scrollEl.getBoundingClientRect();
          const targetY = containerRect.top + 70;

          let bestId: string | null = null;
          let minDiff = Infinity;

          cards.forEach(card => {
            const rect = card.getBoundingClientRect();
            const diff = Math.abs(rect.top - targetY);
            if (diff < minDiff) {
              minDiff = diff;
              const id = card.id.replace('feed-post-', '');
              if (id) bestId = id;
            }
          });

          if (bestId) {
            setSelectedFeedPostId(bestId);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    scrollEl.addEventListener('scroll', handleFeedScroll, { passive: true });
    return () => scrollEl.removeEventListener('scroll', handleFeedScroll);
  }, [viewMode]);

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


  const [selectedCommentPetId, setSelectedCommentPetId] = useState<string>('');
  const currentUserDisplayName = auth.currentUser?.displayName || (auth.currentUser?.email ? auth.currentUser.email.split('@')[0] : '') || localStorage.getItem('walwal_user_nickname') || (language === 'ko' ? '익명 댕댕이' : 'Anonymous');
  const defaultUserPet = {
    id: 'default-user-pet',
    name: currentUserDisplayName,
    avatar: auth.currentUser?.photoURL || getDefaultDogAvatar()
  };
  const currentCommentPet = petOptions.find(p => p.id === selectedCommentPetId) || petOptions[0] || myDog || defaultUserPet;

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
                      border: '1px solid #FF9E58',
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
            border: '1.5px solid #FF9E58',
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

  // 피드샷 이미지/비디오 회전 및 비율 자르기 편집 상태
  const [editRotation, setEditRotation] = useState<number>(0);
  const [editCropRatio, setEditCropRatio] = useState<'original' | '1:1' | '9:16' | '16:9'>('original');
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const baseOriginalImageRef = React.useRef<string | null>(null);

  useEffect(() => {
    if (feedDraft?.image && feedDraft.image !== baseOriginalImageRef.current) {
      baseOriginalImageRef.current = feedDraft.image;
      setEditRotation(0);
      setEditCropRatio('original');
      setProcessedImage(null);
    }
  }, [feedDraft?.image]);

  useEffect(() => {
    if (!feedDraft?.image || isVideo) {
      setProcessedImage(null);
      return;
    }

    if (editRotation === 0 && editCropRatio === 'original') {
      setProcessedImage(null);
      return;
    }

    const sourceSrc = baseOriginalImageRef.current || feedDraft.image;
    let isCancelled = false;
    const img = new Image();
    if (!sourceSrc.startsWith('data:') && !sourceSrc.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }

    const applyTransform = () => {
      if (isCancelled) return;
      try {
        const transformed = transformImage(img, editRotation, editCropRatio);
        if (!isCancelled && transformed) {
          setProcessedImage(transformed);
        }
      } catch (err) {
        console.warn('Image transform failed:', err);
      }
    };

    img.onload = applyTransform;
    img.onerror = (e) => console.warn('Transform img load error:', e);
    img.src = sourceSrc;

    if (img.complete && img.naturalWidth > 0) {
      applyTransform();
    }

    return () => {
      isCancelled = true;
    };
  }, [editRotation, editCropRatio, feedDraft?.image, isVideo]);

  const handleRotateLeft = () => {
    setEditRotation(prev => ((prev - 90) % 360 + 360) % 360);
  };

  const handleRotateRight = () => {
    setEditRotation(prev => (prev + 90) % 360);
  };

  const handleSetCropRatio = (ratio: 'original' | '1:1' | '9:16' | '16:9') => {
    setEditCropRatio(ratio);
  };

  const handleResetEdit = () => {
    setEditRotation(0);
    setEditCropRatio('original');
    setProcessedImage(null);
  };

  const displayImage = processedImage || feedDraft?.image || '';

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
    const targetSrc = src || displayImage;
    if (!targetSrc || !navigator.canShare) return false;
    try {
      let blob = (cacheKey ? blobCache.get(cacheKey) : undefined) || blobCache.get(targetSrc);
      if (!blob) blob = await (await fetch(targetSrc)).blob();
      const type = blob.type || 'image/jpeg';
      const file = new File([blob], `walwal_${Date.now()}.${getMediaExt(targetSrc, cacheKey)}`, { type });
      if (!navigator.canShare({ files: [file] })) return false;
      await navigator.share({ files: [file], title: 'WalWal', text });
      return true;
    } catch (e) {
      // 사용자가 공유 시트를 닫은 경우는 처리 완료로 간주
      return (e as any)?.name === 'AbortError';
    }
  };

  const downloadDraftMedia = async (suffix: string): Promise<string> => {
    const targetSrc = displayImage || feedDraft?.image;
    if (!targetSrc) return '';
    const link = document.createElement('a');
    link.href = targetSrc;
    link.download = `walwal_feed_${suffix}.${getMediaExt(targetSrc, undefined, isVideo)}`;
    link.click();
    return targetSrc;
  };

  const handleShareInstagram = async () => {
    setSelectedPlatform('instagram');
    const thought = feedDraft?.thought || '';
    const caption = language === 'ko'
      ? `"${thought}"\n\n#WalWal #왈왈 #반려견통역 #멍스타그램 #댕댕이`
      : language === 'ja'
        ? `"${thought}"\n\n#WalWal #犬のきもち #愛犬 #ワンコ`
        : `"${thought}"\n\n#WalWal #DogTranslator #Dogstagram #Puppy`;

    const targetSrc = displayImage || feedDraft?.image;
    if (isMobileDevice && await shareFileViaSheet(targetSrc, caption)) return;

    // 팝업 차단 방지: await 전에 즉시 열기
    window.open('https://www.instagram.com/', '_blank');
    await downloadDraftMedia('instagram');
    try { await navigator.clipboard.writeText(caption); } catch (e) { }
    showToast(language === 'ko' ? '파일 다운로드·태그 복사 완료! Instagram에서 [+] 눌러 등록하세요.' : language === 'ja' ? 'ダウンロード・タグコピー完了！Instagramで[+]を押して投稿してください。' : 'Downloaded & tags copied! Tap [+] on Instagram to post.');
  };

  const handleShareTikTok = async () => {
    setSelectedPlatform('tiktok');
    const thought = feedDraft?.thought || '';
    const caption = language === 'ko'
      ? `"${thought}" #WalWal #반려견통역 #강아지속마음 #댕댕이 #fyp`
      : language === 'ja'
        ? `"${thought}" #WalWal #犬のきもち #愛犬 #ワンコ #fyp`
        : `"${thought}" #WalWal #DogTranslator #Puppy #fyp`;

    const targetSrc = displayImage || feedDraft?.image;
    if (isMobileDevice && await shareFileViaSheet(targetSrc, caption)) return;

    window.open('https://www.tiktok.com/upload', '_blank');
    await downloadDraftMedia('tiktok');
    try { await navigator.clipboard.writeText(caption); } catch (e) { }
    showToast(language === 'ko' ? '파일 다운로드·태그 복사 완료! TikTok 업로드 화면에서 파일을 선택하세요.' : language === 'ja' ? 'ダウンロード・タグコピー完了！TikTokの投稿画面でファイルを選択してください。' : 'Downloaded & tags copied! Select the file on TikTok upload.');
  };

  const handleShareYouTube = async () => {
    setSelectedPlatform('youtube');
    const dogName = feedDraft?.dog?.name || (language === 'ko' ? '댕댕이' : language === 'ja' ? 'わんちゃん' : 'Dog');
    const thought = feedDraft?.thought || '';
    const title = language === 'ko'
      ? `[WalWal AI] ${dogName} 속마음 통역 #Shorts`
      : language === 'ja'
        ? `[WalWal AI] ${dogName}のきもち通訳 #Shorts`
        : `[WalWal AI] ${dogName} Thoughts #Shorts`;
    const desc = language === 'ko'
      ? `"${thought}"\n\nWalWal AI 반려견 실시간 통역기\n#Shorts #WalWal #반려견통역`
      : language === 'ja'
        ? `"${thought}"\n\nWalWal AI 愛犬リアルタイム通訳\n#Shorts #WalWal #犬のきもち`
        : `"${thought}"\n\nWalWal AI Real-time Dog Translator\n#Shorts #WalWal #DogTranslator`;

    const targetSrc = displayImage || feedDraft?.image;
    if (isMobileDevice && await shareFileViaSheet(targetSrc, `${title}\n\n${desc}`)) return;

    window.open('https://www.youtube.com/upload', '_blank');
    await downloadDraftMedia('shorts');
    try { await navigator.clipboard.writeText(`${title}\n\n${desc}`); } catch (e) { }
    showToast(language === 'ko' ? '파일 다운로드·제목 복사 완료! YouTube 업로드 화면에서 파일을 선택하세요.' : language === 'ja' ? 'ダウンロード・タイトルコピー完了！YouTubeの投稿画面でファイルを選択してください。' : 'Downloaded & title copied! Select the file on YouTube upload.');
  };

  const handleDownloadOnly = async () => {
    setSelectedPlatform('download');
    showToast(language === 'ko' ? '파일 다운로드 중...' : language === 'ja' ? 'ファイルをダウンロード中...' : 'Downloading file...');

    await downloadDraftMedia(Date.now().toString());

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    showToast((t.snaps || t.studio)?.downloadComplete || t.share?.downloadComplete || (language === 'ko' ? '파일이 다운로드되었습니다! 🎉' : language === 'ja' ? 'ダウンロードが完了しました！🎉' : 'File downloaded successfully! 🎉'));
  };

  const handleShareMore = async () => {
    setSelectedPlatform('more');
    showToast(language === 'ko' ? '공유 기능을 준비 중...' : language === 'ja' ? '共有機能を準備中...' : 'Preparing share...');
    const thought = feedDraft?.thought || '';
    const targetSrc = displayImage || feedDraft?.image;

    try {
      if (targetSrc) {
        const res = await fetch(targetSrc);
        const blob = await res.blob();
        const file = new File([blob], `walwal_feed_${Date.now()}.${isVideo ? 'webm' : 'jpg'}`, { type: isVideo ? 'video/webm' : 'image/jpeg' });

        if (navigator.share) {
          await navigator.share({
            title: 'WalWal Feed Post',
            text: `"${thought}"\n\n#WalWal`,
            files: [file]
          });
          showToast(language === 'ko' ? '공유 메뉴가 열렸습니다.' : language === 'ja' ? '共有メニューが開きました。' : 'Share menu opened.');
        } else {
          showToast(language === 'ko' ? '현재 브라우저에서는 파일 공유를 지원하지 않습니다.' : language === 'ja' ? '現在のブラウザではファイル共有に対応していません。' : 'File sharing is not supported on this browser.');
        }
      }
    } catch (e) {
      showToast(language === 'ko' ? '공유가 취소되었습니다.' : language === 'ja' ? '共有がキャンセルされました。' : 'Share cancelled.');
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

    if (!petOptions || petOptions.length === 0) {
      alert(language === 'ko'
        ? '등록된 내 반려견이 없습니다.\n마이펫 탭에서 먼저 반려견을 등록해 주세요!'
        : 'No registered pet found. Please register your pet in My Pet first!');
      handleClearFeedDraft();
      window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'profile' }));
      return;
    }

    try {
      const validation = validateUserContent(draftText);
      if (!validation.isValid) {
        alert(validation.message);
        return;
      }

      confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });

      // Robust pet fallback resolution - NEVER fallback to mock Bori!
      const fallbackDog = (petOptions && petOptions.length > 0 ? petOptions[0] : null) || feedDraft.dog;
      const selectedPets = (petOptions || []).filter(o => selectedPetIds.includes(o.id));
      const activePets = selectedPets.length > 0 ? selectedPets : [fallbackDog];
      const firstPet = activePets[0] || fallbackDog;

      const combinedName = activePets.map(p => p?.name).filter(Boolean).join(' & ') || fallbackDog.name || '우리 댕댕이';
      const combinedBreed = activePets.map(p => p?.breed).filter(Boolean).join(' · ') || fallbackDog.breed || '믹스견';
      const combinedAge = activePets.map(p => p?.age ? String(p.age) : '1').join(', ');
      const ageSuffix = t.profile?.dogAgeSuffix || (language === 'ko' ? '살' : language === 'ja' ? '歳' : ' yrs');
      const combinedSubInfo = activePets.length > 1
        ? activePets.map(p => `${p?.breed || '반려견'} ${p?.age || '1'}${ageSuffix}`).join(', ')
        : `${firstPet?.breed || '반려견'} · ${firstPet?.age || '1'}${ageSuffix} · ${(firstPet?.gender === 'female' ? (t.common?.genderShortFemale || '여') : (t.common?.genderShortMale || '남'))}`;
      const combinedOwnerName = activePets.length > 1 ? `${activePets.map(p => p?.name || '댕댕이').join('&')} 엄마` : (firstPet?.ownerName || `${firstPet?.name || '댕댕이'} 집사`);
      const combinedPersonality = activePets.length > 1
        ? (language === 'ko' ? ['#다둥이네', '#절친케미', '#우당탕탕'] : language === 'ja' ? ['#多頭飼い', '#仲良し', '#わちゃわちゃ'] : ['#Duo', '#BestFriends', '#Playful'])
        : (firstPet?.personality || ['#댕댕이']);

      const postId = `post_${Date.now()}`;
      const isPostVideo = Boolean(
        feedDraft.isVideo ||
        isVideo ||
        (feedDraft.image && (feedDraft.image.endsWith('.webm') || feedDraft.image.endsWith('.mp4'))) ||
        (feedDraft.image && feedDraft.image.startsWith('blob:') && blobCache.get(feedDraft.image)?.type.startsWith('video'))
      );

      // 1. 비디오 및 포스터 추출 / 변환
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

        if (posterDataUrl && (editRotation !== 0 || editCropRatio !== 'original')) {
          try {
            const pImg = new Image();
            await new Promise<void>((resolve) => {
              const timer = setTimeout(() => resolve(), 800);
              pImg.onload = () => { clearTimeout(timer); resolve(); };
              pImg.onerror = () => { clearTimeout(timer); resolve(); };
              pImg.src = posterDataUrl;
              if (pImg.complete) { clearTimeout(timer); resolve(); }
            });
            if (pImg.naturalWidth > 0) {
              posterDataUrl = transformImage(pImg, editRotation, editCropRatio);
            }
          } catch (err) {
            console.warn('Transform video poster error:', err);
          }
        }
      }

      let finalImage = processedImage || displayImage || feedDraft.image;
      if (!isPostVideo && (editRotation !== 0 || editCropRatio !== 'original') && feedDraft.image) {
        const sourceSrc = baseOriginalImageRef.current || feedDraft.image;
        try {
          const transformed = await new Promise<string>((resolve) => {
            const img = new Image();
            const timer = setTimeout(() => resolve(sourceSrc), 1000);
            if (!sourceSrc.startsWith('data:') && !sourceSrc.startsWith('blob:')) {
              img.crossOrigin = 'anonymous';
            }
            img.onload = () => {
              clearTimeout(timer);
              try {
                resolve(transformImage(img, editRotation, editCropRatio));
              } catch (e) {
                resolve(sourceSrc);
              }
            };
            img.onerror = () => {
              clearTimeout(timer);
              resolve(sourceSrc);
            };
            img.src = sourceSrc;
            if (img.complete && img.naturalWidth > 0) {
              clearTimeout(timer);
              try {
                resolve(transformImage(img, editRotation, editCropRatio));
              } catch (e) {
                resolve(sourceSrc);
              }
            }
          });
          if (transformed) {
            finalImage = transformed;
          }
        } catch (err) {
          console.warn('Transform fallback error:', err);
        }
      }

      if (!isPostVideo) {
        posterDataUrl = finalImage || firstPet?.avatar || getDefaultDogAvatar();
      } else if (!posterDataUrl) {
        posterDataUrl = finalImage || firstPet?.avatar || getDefaultDogAvatar();
      }

      const compressedPoster = await compressImageForFirestore(posterDataUrl).catch(() => posterDataUrl);

      // Save media to IndexedDB & background upload (non-blocking)
      if (isPostVideo && videoBlob) {
        blobCache.set(postId, videoBlob);
        blobCache.set(`indexeddb:${postId}`, videoBlob);
        saveMedia(postId, videoBlob).catch(console.warn);
        uploadVideoToCloud(postId, videoBlob).catch(console.warn);
      } else if (finalImage) {
        try {
          if (finalImage.startsWith('blob:') && blobCache.has(finalImage)) {
            const b = blobCache.get(finalImage);
            if (b) saveMedia(postId, b).catch(console.warn);
          } else if (finalImage.startsWith('data:') || finalImage.startsWith('blob:')) {
            fetch(finalImage).then(r => r.blob()).then(b => {
              if (b) saveMedia(postId, b).catch(console.warn);
            }).catch(console.warn);
          }
        } catch (err) {
          console.error('Failed to save media to IndexedDB:', err);
        }
      }

      const currentUserId = auth.currentUser?.uid || localStorage.getItem('walwal_user_id') || 'guest_user';
      const currentUserEmail = auth.currentUser?.email || '';

      const immediatePlayableMedia = isPostVideo
        ? (feedDraft.image || (videoBlob ? URL.createObjectURL(videoBlob) : compressedPoster))
        : (finalImage || compressedPoster);

      const postThought = stripQuotes(draftText || feedDraft.thought) || '오늘 하루도 행복해! 멍멍!';

      const newPost = {
        ...(feedDraft.dog || {}),
        id: postId,
        userId: currentUserId,
        userEmail: currentUserEmail,
        name: combinedName,
        breed: combinedBreed,
        age: combinedAge,
        subInfo: combinedSubInfo,
        gender: firstPet?.gender || 'male',
        ownerName: combinedOwnerName,
        avatar: firstPet?.avatar || getDefaultDogAvatar(),
        personality: combinedPersonality,
        recentThought: postThought,
        feedImage: immediatePlayableMedia,
        poster: compressedPoster || firstPet?.avatar || getDefaultDogAvatar(),
        likes: 0,
        liked: false,
        comments: [],
        showComments: false,
        shares: 0,
        isVideo: isPostVideo,
        hasCloudMedia: isPostVideo,
        rotation: editRotation || 0,
        cropRatio: editCropRatio || 'original',
        isMine: true,
        createdAt: new Date().toISOString(),
        clientCreatedAt: new Date().toISOString()
      };

      const storagePost = {
        ...newPost,
        feedImage: isPostVideo ? `indexeddb:${postId}` : compressedPoster
      };

      // 4. Save to localStorage immediately!
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

      // 5. Update UI state IMMEDIATELY!
      setFeedPosts(prev => [newPost, ...prev.filter(p => p.id !== postId)]);

      // 6. Close draft modal & show success toast
      showToast(language === 'ko' ? `${combinedName} 피드샷에 저장되었습니다!` : language === 'ja' ? `${combinedName} スナップに保存されました！` : `Saved as ${combinedName}!`);
      handleClearFeedDraft();
      window.dispatchEvent(new Event('walwal_snaps_updated'));

      // 7. Background Firestore DB save
      try {
        const sanitizedPost = cleanForFirestore({
          ...storagePost,
          createdAt: null
        });
        delete sanitizedPost.createdAt;

        setDoc(doc(db, 'posts', postId), {
          ...sanitizedPost,
          createdAt: serverTimestamp()
        }).catch(dbErr => {
          console.warn('Firestore setDoc background error:', dbErr);
        });
      } catch (dbErr) {
        console.error('Failed to prepare post for Firestore:', dbErr);
      }
    } catch (criticalErr) {
      console.error('Critical error in handlePostFeedDraft:', criticalErr);
      alert(language === 'ko' ? '피드 등록 중 오류가 발생했습니다. 다시 시도해 주세요.' : 'An error occurred while posting. Please try again.');
    }
  };

  const handleDeletePost = async (id: any) => {
    if (!id) return;
    const targetId = String(id);

    // 1. Blacklist ID so it can never be loaded from Firestore or mock data
    addDeletedPostId(targetId);
    setActiveMenuPostId(null);
    setActiveFeedMenuId(null);

    // 2. Remove immediately from screen state
    setFeedPosts(prev => prev.filter(p => String(p.id) !== targetId));
    if (selectedDetailPost && String(selectedDetailPost.id) === targetId) {
      setSelectedDetailPost(null);
    }
    if (activeCommentPostId && String(activeCommentPostId) === targetId) {
      setActiveCommentPostId(null);
    }

    // 3. Immediately remove from localStorage before any async operations
    try {
      const savedSnaps = localStorage.getItem('WALWAL_USER_SNAPS_POSTS');
      if (savedSnaps) {
        const posts = JSON.parse(savedSnaps).filter((p: any) => p && String(p.id) !== targetId);
        localStorage.setItem('WALWAL_USER_SNAPS_POSTS', JSON.stringify(posts));
      }
      const savedFeed = localStorage.getItem('WALWAL_USER_FEED_POSTS');
      if (savedFeed) {
        const posts = JSON.parse(savedFeed).filter((p: any) => p && String(p.id) !== targetId);
        localStorage.setItem('WALWAL_USER_FEED_POSTS', JSON.stringify(posts));
      }
      const interactions = getStoredInteractions();
      if (interactions[targetId]) {
        delete interactions[targetId];
        localStorage.setItem('WALWAL_FEED_INTERACTIONS', JSON.stringify(interactions));
      }
    } catch (e) {
      console.error('Failed to update localStorage on delete:', e);
    }

    // 4. Delete document in Firestore
    try {
      await deleteFeedPost(targetId);
    } catch (e) {
      console.error('Firestore delete error:', e);
    }

    // 5. Delete from IndexedDB media cache
    try {
      await deleteMedia(targetId);
    } catch (e) {
      console.warn('IndexedDB delete error:', e);
    }

    // 6. Notify other listeners
    window.dispatchEvent(new Event('walwal_snaps_updated'));

    showToast(t.snaps?.deleteSuccess || t.feed?.deleteSuccess || (language === 'ko' ? '피드가 삭제되었습니다.' : language === 'ja' ? 'スナップが削除されました。🗑️' : 'Snap deleted.'));
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
    showToast(t.snaps?.saveSuccess || t.feed?.saveSuccess || (language === 'ko' ? '피드샷이 수정되었습니다!' : language === 'ja' ? 'スナップが修正されました！✨' : 'Snap updated!'));
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
    language === 'ko' ? '파일 다운로드·태그 복사 완료! Instagram에서 [+] 눌러 등록하세요.' : language === 'ja' ? 'ダウンロード・タグコピー完了！Instagramで[+]を押して投稿してください。' : 'Downloaded & tags copied! Tap [+] on Instagram to post.');

  const handlePostShareTikTok = (post: any) => sharePostTo(post, 'https://www.tiktok.com/upload',
    language === 'ko' ? '파일 다운로드·태그 복사 완료! TikTok 업로드 화면에서 파일을 선택하세요.' : language === 'ja' ? 'ダウンロード・タグコピー完了！TikTokの投稿画面でファイルを選択してください。' : 'Downloaded & tags copied! Select the file on TikTok upload.');

  const handlePostShareYouTube = (post: any) => sharePostTo(post, 'https://www.youtube.com/upload',
    language === 'ko' ? '파일 다운로드·태그 복사 완료! YouTube 업로드 화면에서 파일을 선택하세요.' : language === 'ja' ? 'ダウンロード・タイトルコピー完了！YouTubeの投稿画面でファイルを選択してください。' : 'Downloaded & tags copied! Select the file on YouTube upload.');

  const handleCopyPostLink = async (post: any) => {
    const shareUrl = `${window.location.origin}${window.location.pathname}?tab=snaps#feed-${post.id}`;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      showToast(language === 'ko' ? '링크가 클립보드에 복사되었습니다!' : language === 'ja' ? 'リンクがコピーされました！' : 'Link copied to clipboard!');
    } catch (e) {
      showToast(language === 'ko' ? '링크 복사 실패' : language === 'ja' ? 'リンクのコピーに失敗しました' : 'Failed to copy link');
    }
  };

  const handlePostShareWhatsApp = (post: any) => {
    const thoughtText = post.recentThought ? `"${stripQuotes(post.recentThought)}"\n` : '';
    const shareUrl = `${window.location.origin}${window.location.pathname}?tab=snaps#feed-${post.id}`;
    const dogTitle = post.name || (language === 'ko' ? '강아지' : language === 'ja' ? 'わんちゃん' : 'Dog');
    const sharePrefix = language === 'ko'
      ? `우리 댕댕이 ${dogTitle}의 피드샷 🐶\n`
      : language === 'ja'
        ? `『${dogTitle}』のきもちスナップ 🐶\n`
        : `Our cute dog ${dogTitle}'s snap 🐶\n`;
    const shareText = encodeURIComponent(`${thoughtText}${sharePrefix}${shareUrl}`);
    window.open(`https://api.whatsapp.com/send?text=${shareText}`, '_blank');
  };

  const handlePostShareMessage = (post: any) => {
    const thoughtText = post.recentThought ? `"${stripQuotes(post.recentThought)}"\n` : '';
    const shareUrl = `${window.location.origin}${window.location.pathname}?tab=snaps#feed-${post.id}`;
    const dogTitle = post.name || (language === 'ko' ? '강아지' : language === 'ja' ? 'わんちゃん' : 'Dog');
    const sharePrefix = language === 'ko'
      ? `우리 댕댕이 ${dogTitle}의 피드샷 🐶\n`
      : language === 'ja'
        ? `『${dogTitle}』のきもちスナップ 🐶\n`
        : `Our cute dog ${dogTitle}'s snap 🐶\n`;
    const shareText = encodeURIComponent(`${thoughtText}${sharePrefix}${shareUrl}`);
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    const smsUrl = isIOS ? `sms:&body=${shareText}` : `sms:?body=${shareText}`;
    window.location.href = smsUrl;
  };

  const handlePostDownload = async (post: any) => {
    showToast(language === 'ko' ? '파일 다운로드 중...' : language === 'ja' ? 'ファイルをダウンロード中...' : 'Downloading file...');
    try {
      if (post.feedImage) {
        const link = document.createElement('a');
        link.href = post.feedImage;
        link.download = `walwal_${post.id || Date.now()}.${getMediaExt(post.feedImage, post.id, post.isVideo)}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        confetti({ particleCount: 30, spread: 50, origin: { y: 0.6 } });
        showToast(language === 'ko' ? '파일이 다운로드되었습니다!' : language === 'ja' ? 'ダウンロードが完了しました！' : 'Downloaded!');
      }
    } catch (e) {
      showToast(language === 'ko' ? '다운로드 실패' : language === 'ja' ? 'ダウンロードに失敗しました' : 'Download failed');
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
    setReplyingToComment(null);
  };

  const handleDeleteComment = (postId: string, commentId: any) => {
    if (!postId || !commentId) return;

    let targetNewComments: any[] | null = null;

    setFeedPosts(prev => {
      const updated = prev.map(p => {
        if (String(p.id) === String(postId)) {
          const existing = Array.isArray(p.comments) ? p.comments : [];
          const newComments = existing.filter((c: any) => 
            String(c.id) !== String(commentId) && 
            String(c.parentId || '') !== String(commentId)
          );
          targetNewComments = newComments;
          saveFeedInteraction(String(postId), { comments: newComments });
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

    // Firestore 동기화 (원격 게시물인 경우)
    if (targetNewComments) {
      try {
        updateFeedPost(String(postId), { comments: targetNewComments }).catch(() => {});
      } catch (e) {}
    }

    try {
      const savedIds: any[] = JSON.parse(localStorage.getItem('WALWAL_MY_COMMENT_IDS') || '[]');
      const filtered = savedIds.filter(id => String(id) !== String(commentId));
      localStorage.setItem('WALWAL_MY_COMMENT_IDS', JSON.stringify(filtered));
    } catch (e) {}

    showToast(language === 'ko' ? '댓글이 삭제되었습니다.' : language === 'ja' ? 'コメントが削除されました。' : 'Comment deleted.');
  };

  const handleStartReply = (comment: any) => {
    setReplyingToComment({ id: comment.parentId || comment.id, author: comment.author });
    setModalCommentInput(`@${comment.author} `);
    setTimeout(() => {
      commentInputRef.current?.focus();
    }, 60);
  };

  const isMyComment = (c: any): boolean => {
    if (!c) return false;
    if (c.isMine) return true;
    try {
      const myIds: any[] = JSON.parse(localStorage.getItem('WALWAL_MY_COMMENT_IDS') || '[]');
      if (myIds.some(id => String(id) === String(c.id))) return true;
    } catch (e) {}

    const clean = (str: string = '') => str.replace(/\s*(엄마|맘|아빠|Mom|Dad|ママ|パパ)\s*$/gi, '').trim().toLowerCase();
    const cAuthor = clean(c.author || '');
    const currentPetName = clean(currentCommentPet?.name || '');
    const currentUserName = (currentUserDisplayName || '').toLowerCase().trim();
    const currentEmail = (auth.currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || '').toLowerCase().trim();

    if (c.author === '나' || c.author === 'me') return true;
    if (cAuthor && currentPetName && cAuthor === currentPetName) return true;
    if (c.author && currentUserName && c.author.toLowerCase() === currentUserName) return true;
    if (currentEmail && c.author && currentEmail.split('@')[0].toLowerCase() === cAuthor) return true;
    if (c.userEmail && currentEmail && c.userEmail.toLowerCase() === currentEmail) return true;
    if (c.userId && auth.currentUser?.uid && c.userId === auth.currentUser.uid) return true;

    if (petOptions && petOptions.length > 0) {
      if (petOptions.some((p: any) => {
        const pName = clean(p.name || '');
        const pOwner = clean(p.ownerName || '');
        return isSameDogName(p.name, c.author) || (pName && pName === cAuthor) || (pOwner && pOwner === cAuthor);
      })) {
        return true;
      }
    }

    return false;
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
    const newCommentId = Date.now();
    const authorName = currentCommentPet.name || currentUserDisplayName || '나';
    const authorAvatar = currentCommentPet.avatar || getDefaultDogAvatar();

    const newComment = {
      id: newCommentId,
      author: authorName,
      avatar: authorAvatar,
      text: commentText,
      image: commentImage || undefined,
      isMine: true,
      userEmail: auth.currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || undefined,
      userId: auth.currentUser?.uid || undefined,
      parentId: replyingToComment ? replyingToComment.id : undefined,
      replyToAuthor: replyingToComment ? replyingToComment.author : undefined,
      createdAt: language === 'ko' ? '방금 전' : (language === 'ja' ? 'たった今' : 'Just now')
    };

    try {
      const savedIds: any[] = JSON.parse(localStorage.getItem('WALWAL_MY_COMMENT_IDS') || '[]');
      if (!savedIds.some(id => String(id) === String(newCommentId))) {
        savedIds.push(newCommentId);
        savedIds.push(String(newCommentId));
        localStorage.setItem('WALWAL_MY_COMMENT_IDS', JSON.stringify(savedIds));
      }
    } catch (e) {}

    setFeedPosts(prev => {
      const updated = prev.map(p => {
        if (p.id === activeCommentPostId) {
          const existing = Array.isArray(p.comments) ? p.comments : [];
          const newCommentList = [...existing, newComment];
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
    setReplyingToComment(null);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '6px', marginLeft: '-6px' }}
            onClick={() => {
              if (showBookmarkedOnly) {
                setShowBookmarkedOnly(false);
              } else {
                setViewMode(prev => prev === 'feed' ? 'grid' : 'feed');
              }
            }}
            aria-label={showBookmarkedOnly ? (language === 'ko' ? '전체 피드로 돌아가기' : 'Back to all feeds') : (language === 'ko' ? '화면 전환' : 'Switch view')}
            title={showBookmarkedOnly ? (language === 'ko' ? '전체 피드로 돌아가기' : 'Back to all feeds') : (language === 'ko' ? '화면 전환' : 'Switch view')}
          >
            <ArrowLeft size={24} />
          </button>
          <div
            style={{ cursor: 'pointer' }}
            onClick={() => {
              setSelectedFeedPostId(null);
              setShowBookmarkedOnly(false);
              if (scrollContainerRef.current) {
                scrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}
          >
            <h2 className="title-lg">
              {showBookmarkedOnly
                ? (language === 'ko' ? '저장한 게시물 📌' : language === 'ja' ? '保存済みスナップ 📌' : 'Saved Posts 📌')
                : viewMode === 'feed'
                  ? (language === 'ko' ? '피드' : language === 'ja' ? 'スナップフィード' : 'Snaps Feed')
                  : (language === 'ko' ? '피드 앨범' : language === 'ja' ? 'スナップアルバム' : 'Snaps Album')}
            </h2>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* 저장한 게시물 모아보기 토글 버튼 */}
          <button
            type="button"
            className={`snaps-view-toggle-btn ${showBookmarkedOnly ? 'active' : ''}`}
            onClick={() => setShowBookmarkedOnly(prev => !prev)}
            title={showBookmarkedOnly
              ? (language === 'ko' ? '전체 피드 보기' : 'All Feeds')
              : (language === 'ko' ? '저장한 게시물 모아보기' : 'Saved Posts')}
            aria-label={showBookmarkedOnly
              ? (language === 'ko' ? '전체 피드 보기' : 'All Feeds')
              : (language === 'ko' ? '저장한 게시물 모아보기' : 'Saved Posts')}
            style={showBookmarkedOnly ? { background: '#111827', color: '#fff', borderColor: '#111827' } : undefined}
          >
            <Bookmark size={19} fill={showBookmarkedOnly ? '#fff' : 'none'} color={showBookmarkedOnly ? '#fff' : 'currentColor'} />
          </button>

          <button
            type="button"
            className="snaps-view-toggle-btn"
            onClick={() => setViewMode(prev => prev === 'grid' ? 'feed' : 'grid')}
            title={viewMode === 'feed' ? (language === 'ko' ? '앨범 모아보기' : language === 'ja' ? 'アルバム表示' : 'Grid View') : (language === 'ko' ? '피드로 보기' : language === 'ja' ? 'フィード表示' : 'Feed View')}
            aria-label={viewMode === 'feed' ? (language === 'ko' ? '앨범 모아보기' : language === 'ja' ? 'アルバム表示' : 'Grid View') : (language === 'ko' ? '피드로 보기' : language === 'ja' ? 'フィード表示' : 'Feed View')}
          >
            {viewMode === 'feed' ? <LayoutGrid size={20} /> : <Square size={19} />}
          </button>
          <button
            className="btn-ghost" onClick={() => fileInputRef.current?.click()}
          >
            <Plus size={24} strokeWidth={2} />
          </button>
          <button
            className="all-services-header-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('walwal_open_all_services'))}
            aria-label={language === 'ko' ? '전체서비스' : language === 'ja' ? '全サービス' : 'All Services'}
            title={language === 'ko' ? '전체서비스' : language === 'ja' ? '全サービス' : 'All Services'}
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

      <div ref={scrollContainerRef} style={{ flex: 1, overflowX: 'hidden', overflowY: 'auto' }}>
        <div className="section-gap">
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
                <Camera size={34} color="#FF9E58" />
              </div>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#000', marginBottom: '6px' }}>
                  {language === 'ko' ? '등록된 내 피드샷이 없습니다' : language === 'ja' ? '登録されたマイスナップがありません' : 'No Snaps Yet'}
                </h3>
                <p style={{ fontSize: '0.88rem', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
                  {language === 'ko'
                    ? 'AR 카메라로 강아지의 생각을 읽고\n첫 번째 피드샷을 저장해보세요!'
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

                return (
                  <div
                    key={post.id}
                    id={`album-post-${post.id}`}
                    className={`snaps-album-card ${activeMenuPostId === post.id ? 'active-menu' : ''}`}
                    onClick={async () => {
                      if (activeMenuPostId) {
                        setActiveMenuPostId(null);
                        return;
                      }
                      if (isVideo && (!post.feedImage || post.feedImage.startsWith('indexeddb:'))) {
                        const playable = await ensureVideoPlayable(post);
                        if (playable) {
                          post.feedImage = playable;
                        }
                      }
                      setSelectedFeedPostId(String(post.id));
                      setViewMode('feed');
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
                            style={{
                              transform: post.rotation ? `rotate(${post.rotation}deg)` : undefined,
                              objectFit: 'cover'
                            }}
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


                    {/* Dropdown Menu (수정 / 삭제 혹은 신고 / 차단) */}
                    {activeMenuPostId === post.id && (() => {
                      const isMyPost = checkIsMyPost(post);
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
                                <span>{t.snaps?.editPost || t.feed?.editPost || (language === 'ko' ? '수정' : language === 'ja' ? '編集' : 'Edit')}</span>
                              </button>
                              <button
                                type="button"
                                className="delete"
                                onClick={() => handleDeletePost(post.id)}
                              >
                                <Trash2 size={14} />
                                <span>{t.snaps?.deletePost || t.feed?.deletePost || (language === 'ko' ? '삭제' : language === 'ja' ? '削除' : 'Delete')}</span>
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
                                <span style={{ color: '#E53E3E' }}>{language === 'ko' ? '게시글 신고' : language === 'ja' ? '投稿を通報' : 'Report Post'}</span>
                              </button>
                              <button
                                type="button"
                                className="delete"
                                onClick={() => {
                                  setActiveMenuPostId(null);
                                  const targetUser = post.name || post.ownerName;
                                  const confirmMsg = language === 'ko'
                                    ? `'${targetUser}' 사용자를 차단하시겠습니까? 이 사용자의 모든 글이 숨겨집니다.`
                                    : language === 'ja'
                                      ? `'${targetUser}' をブロックしますか？このユーザーのすべての投稿が非表示になります。`
                                      : `Block '${targetUser}'? All posts from this user will be hidden.`;
                                  const alertMsg = language === 'ko'
                                    ? '사용자가 차단되었습니다.'
                                    : language === 'ja'
                                      ? 'ユーザーをブロックしました。'
                                      : 'User has been blocked.';
                                  if (window.confirm(confirmMsg)) {
                                    blockUser(targetUser);
                                    alert(alertMsg);
                                  }
                                }}
                              >
                                <ShieldAlert size={14} />
                                <span>{language === 'ko' ? '작성자 차단' : language === 'ja' ? '投稿者をブロック' : 'Block User'}</span>
                              </button>
                            </>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                );
              };

              const getFormattedPostDate = (createdAt?: string | number, clientCreatedAt?: string) => {
                const timeVal = createdAt || clientCreatedAt;
                if (!timeVal) return '';
                const d = new Date(timeVal);
                if (isNaN(d.getTime())) return '';
                const now = new Date();
                const isToday = d.getFullYear() === now.getFullYear() &&
                  d.getMonth() === now.getMonth() &&
                  d.getDate() === now.getDate();

                const localeStr = language === 'ko' ? 'ko-KR' : language === 'ja' ? 'ja-JP' : language === 'es' ? 'es-ES' : 'en-US';

                const dateStr = d.toLocaleDateString(localeStr, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                });

                if (isToday) {
                  const timeStr = d.toLocaleTimeString(localeStr, {
                    hour: 'numeric',
                    minute: '2-digit',
                    hour12: true
                  });
                  return `${dateStr} ${timeStr}`;
                }
                return dateStr;
              };

              const renderVerticalFeedCard = (post: any) => {
                const isVideo = Boolean(
                  post.isVideo ||
                  (post.feedImage && typeof post.feedImage === 'string' && (post.feedImage.endsWith('.webm') || post.feedImage.endsWith('.mp4') || post.feedImage.includes('video')))
                );
                const isMyPost = checkIsMyPost(post);
                const formattedDate = getFormattedPostDate(post.createdAt, post.clientCreatedAt);

                return (
                  <div
                    key={post.id}
                    id={`feed-post-${post.id}`}
                    className={`snaps-feed-card${String(activeFeedMenuId) === String(post.id) ? ' active' : ''}`}
                  >
                    {/* 1. Header (User & 3-Dots Menu) */}
                    <div className="snaps-feed-card-header">
                      <div className="snaps-feed-card-user">
                        <img
                          src={post.avatar || getDefaultDogAvatar(post.name || post.breed)}
                          alt={post.name || 'Dog'}
                          className="snaps-feed-avatar"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = getDefaultDogAvatar(post.name || post.breed);
                          }}
                        />
                        <div className="snaps-feed-user-info">
                          <span className="snaps-feed-user-name">{post.name || '댕댕이'}</span>
                          <span className="snaps-feed-user-sub">
                            {formattedDate || post.breed || '피드샷'}
                          </span>
                        </div>
                      </div>

                      {/* 타인 글: 팔로우 / 언팔로우 버튼 */}
                      {!isMyPost && (
                        <div className="snaps-feed-header-follow">
                          <button
                            type="button"
                            className={`snaps-feed-follow-btn ${followedUsers.includes(post.name || post.ownerName || 'unknown') ? 'following' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFollow(post.name || post.ownerName || 'unknown');
                            }}
                          >
                            {followedUsers.includes(post.name || post.ownerName || 'unknown')
                              ? (language === 'ko' ? '팔로잉' : language === 'ja' ? 'フォロー中' : 'Following')
                              : (language === 'ko' ? '팔로우' : language === 'ja' ? 'フォロー' : 'Follow')}
                          </button>
                        </div>
                      )}

                      {/* 본인 글: 상단 우측 점 세개 메뉴 버튼 & 드롭다운 (다운로드, SNS, 수정, 삭제) */}
                      {isMyPost && (
                        <div className="snaps-feed-header-actions">
                          <button
                            type="button"
                            className="snaps-feed-action-icon-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveFeedMenuId(String(activeFeedMenuId) === String(post.id) ? null : String(post.id));
                            }}
                            aria-label={language === 'ko' ? '더보기 메뉴' : language === 'ja' ? 'メニュー' : 'More menu'}
                            title={language === 'ko' ? '메뉴' : language === 'ja' ? 'メニュー' : 'Menu'}
                          >
                            <AlignRight size={20} color="#fff" />
                          </button>

                          {/* 더보기 드롭다운: 다운로드, SNS 버튼들, 수정, 삭제 */}
                          {String(activeFeedMenuId) === String(post.id) && (
                            <div
                              className="snaps-feed-dropdown-menu"
                              onClick={(e) => e.stopPropagation()}
                            >
                              {/* 상단 닫기 바 버튼 */}
                              <button
                                type="button"
                                className="snaps-feed-menu-close-bar-btn"
                                onClick={() => setActiveFeedMenuId(null)}
                                aria-label={language === 'ko' ? '닫기' : language === 'ja' ? '閉じる' : 'Close'}
                                title={language === 'ko' ? '닫기' : language === 'ja' ? '閉じる' : 'Close'}
                              >
                                <span className="snaps-feed-menu-close-bar" />
                              </button>

                              {/* 다운로드 */}
                              <div className="snaps-feed-menu-group" >
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    handlePostDownload(post);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle download">
                                    <Download size={18} />
                                  </div>
                                  <span>{t.share?.download || (language === 'ko' ? '다운로드' : language === 'ja' ? 'ダウンロード' : 'Download')}</span>
                                </button>
                              </div>

                              <div className="snaps-feed-menu-group" >

                                {/* Instagram */}
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    handlePostShareInstagram(post);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle instagram">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                                    </svg>
                                  </div>
                                  <span>Instagram</span>
                                </button>

                                {/* TikTok */}
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    handlePostShareTikTok(post);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle tiktok">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64c.29 0 .58.04.85.12V9.4a6.33 6.33 0 0 0-.85-.06A6.34 6.34 0 0 0 3.14 15.7a6.34 6.34 0 0 0 9.06 5.67V12.1a8.16 8.16 0 0 0 5.14 1.83v-3.47a4.85 4.85 0 0 1-2.25-.77 4.8 4.8 0 0 1-1.5-1.92z" />
                                    </svg>
                                  </div>
                                  <span>TikTok</span>
                                </button>

                                {/* YouTube */}
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    handlePostShareYouTube(post);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle youtube">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.016 3.016 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                                    </svg>
                                  </div>
                                  <span>YouTube</span>
                                </button>

                                {/* 링크복사 */}
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    handleCopyPostLink(post);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle link">
                                    <Link2 size={18} />
                                  </div>
                                  <span>{language === 'ko' ? '링크복사' : language === 'ja' ? 'リンクをコピー' : 'Copy Link'}</span>
                                </button>

                                {/* 왓츠앱 */}
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    handlePostShareWhatsApp(post);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle whatsapp">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
                                      <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z" />
                                    </svg>
                                  </div>
                                  <span>{language === 'ko' ? '왓츠앱' : 'WhatsApp'}</span>
                                </button>

                                {/* 메세지 */}
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    handlePostShareMessage(post);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle message">
                                    <MessageSquare size={16} fill="#fff" strokeWidth={1} />
                                  </div>
                                  <span>{language === 'ko' ? '메세지' : language === 'ja' ? 'メッセージ' : 'Messages'}</span>
                                </button>

                                {/* 더 보기 */}
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    handlePostShareMore(post);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle more">
                                    <Send size={18} />
                                  </div>
                                  <span>{t.share?.more || (language === 'ko' ? '더 보기' : language === 'ja' ? 'その他' : 'More')}</span>
                                </button>
                              </div>
                              {/* 수정 / 삭제 */}
                              <div className="snaps-feed-menu-group" >
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item"
                                  onClick={() => {
                                    setActiveFeedMenuId(null);
                                    setEditingPost({ ...post });
                                    setEditText(post.recentThought || '');
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle edit">
                                    <Edit3 size={18} />
                                  </div>
                                  <span>{t.snaps?.editPost || (language === 'ko' ? '수정' : language === 'ja' ? '編集' : 'Edit')}</span>
                                </button>
                                <button
                                  type="button"
                                  className="snaps-feed-menu-item delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setActiveFeedMenuId(null);
                                    handleDeletePost(post.id);
                                  }}
                                >
                                  <div className="snaps-menu-icon-circle delete">
                                    <Trash2 size={18} />
                                  </div>
                                  <span>{t.snaps?.deletePost || (language === 'ko' ? '삭제' : language === 'ja' ? '削除' : 'Delete')}</span>
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 2. Media Container */}
                    <div
                      className="snaps-feed-media-container"
                      style={{
                        aspectRatio: post.cropRatio === '1:1' ? '1 / 1' : post.cropRatio === '9:16' ? '9 / 16' : post.cropRatio === '16:9' ? '16 / 9' : undefined,
                        overflow: 'hidden',
                        position: 'relative',
                        zIndex: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#000'
                      }}
                    >
                      {isVideo ? (
                        <video
                          src={post.feedImage && !post.feedImage.startsWith('indexeddb:') ? post.feedImage : undefined}
                          poster={post.poster}
                          controls
                          playsInline
                          loop
                          preload="metadata"
                          className="snaps-feed-media"
                          style={{
                            transform: post.rotation ? `rotate(${post.rotation}deg)` : undefined,
                            objectFit: (post.cropRatio && post.cropRatio !== 'original') ? 'cover' : 'contain',
                            width: '100%',
                            height: (post.cropRatio && post.cropRatio !== 'original') ? '100%' : 'auto',
                            transition: 'transform 0.25s ease'
                          }}
                          onPlay={async (e) => {
                            const videoEl = e.currentTarget;
                            if (!videoEl.src || videoEl.src.includes('undefined') || post.feedImage?.startsWith('indexeddb:')) {
                              const playable = await ensureVideoPlayable(post);
                              if (playable) {
                                post.feedImage = playable;
                                videoEl.src = playable;
                                videoEl.play().catch(() => { });
                              }
                            }
                          }}
                        />
                      ) : (
                        <img
                          src={(post.feedImage && !post.feedImage.startsWith('indexeddb:')) ? post.feedImage : (post.poster || post.avatar || getDefaultDogAvatar())}
                          alt={post.name || 'Snap'}
                          className="snaps-feed-media"
                          loading="lazy"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src = post.avatar || getDefaultDogAvatar();
                          }}
                        />
                      )}
                    </div>

                    {/* 3. Instagram Actions (Like, Comment, Repost/Share, Send, Bookmark) */}
                    <div className="snaps-insta-actions-row">
                      <div className="snaps-insta-actions-left">
                        {/* 좋아요 */}
                        <button
                          type="button"
                          className={`snaps-insta-btn like-btn ${post.liked ? 'liked' : ''}`}
                          onClick={() => handleLikeFeed(post.id)}
                          aria-label={post.liked ? (language === 'ko' ? '좋아요 취소' : 'Unlike') : (language === 'ko' ? '좋아요' : 'Like')}
                        >
                          <Heart
                            size={24}
                            fill={post.liked ? '#FF3040' : 'none'}
                            color={post.liked ? '#FF3040' : '#111827'}
                            strokeWidth={post.liked ? 0 : 2}
                          />
                          <span className="snaps-insta-count">{formatSocialCount(post.likes || 0, language)}</span>
                        </button>

                        {/* 댓글 */}
                        <button
                          type="button"
                          className="snaps-insta-btn comment-btn"
                          onClick={() => handleOpenComments(post)}
                          aria-label={language === 'ko' ? '댓글' : 'Comment'}
                        >
                          <MessageCircle
                            size={23}
                            color="#111827"
                            strokeWidth={2}
                          />
                          <span className="snaps-insta-count">{formatSocialCount((post.comments || []).length, language)}</span>
                        </button>

                        {/* 공유 (종이비행기) */}
                        <button
                          type="button"
                          className="snaps-insta-btn send-btn"
                          onClick={() => handleShareFeed(post.id)}
                          aria-label={language === 'ko' ? '공유' : 'Share'}
                        >
                          <Send
                            size={21}
                            color="#111827"
                            strokeWidth={2}
                            style={{ transform: 'rotate(12deg)' }}
                          />
                          <span className="snaps-insta-count">{formatSocialCount(post.shares || 0, language)}</span>
                        </button>
                      </div>

                      <div className="snaps-insta-actions-right">
                        {/* 북마크 (게시물 저장) */}
                        <button
                          type="button"
                          className={`snaps-insta-btn bookmark-btn ${bookmarkedPostIds.map(String).includes(String(post.id)) ? 'bookmarked' : ''}`}
                          onClick={() => handleToggleBookmark(post.id)}
                          aria-label={bookmarkedPostIds.map(String).includes(String(post.id)) ? (language === 'ko' ? '저장 취소' : 'Unsave') : (language === 'ko' ? '게시물 저장' : 'Save')}
                        >
                          <Bookmark
                            size={23}
                            fill={bookmarkedPostIds.map(String).includes(String(post.id)) ? '#111827' : 'none'}
                            color="#111827"
                            strokeWidth={2}
                          />
                        </button>
                      </div>
                    </div>

                    {/* 4. Instagram Feed Details (Caption, Comments link) */}
                    <div className="snaps-feed-content-body">

                      {/* 본문 / 속마음 */}
                      {post.recentThought && (
                        <div className="snaps-insta-caption">
                          <span className="snaps-insta-caption-author">{post.name || '댕댕이'}</span>
                          <span className="snaps-insta-caption-text">{stripQuotes(post.recentThought)}</span>
                        </div>
                      )}

                      {/* 댓글 링크 / 댓글 달기 */}
                      {post.comments && post.comments.length > 0 ? (
                        <button
                          type="button"
                          className="snaps-insta-comments-toggle"
                          onClick={() => handleOpenComments(post)}
                        >
                          {language === 'ko'
                            ? `댓글 ${post.comments.length}개 모두 보기`
                            : language === 'ja'
                              ? `コメント${post.comments.length}件をすべて見る`
                              : `View all ${post.comments.length} comments`}
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="snaps-insta-comments-toggle empty"
                          onClick={() => handleOpenComments(post)}
                        >
                          {language === 'ko' ? '댓글 달기...' : language === 'ja' ? 'コメントを追加...' : 'Add a comment...'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              };

              const visiblePosts = feedPosts.filter(p => {
                if (isUserBlocked(p.name) || isUserBlocked(p.ownerName)) return false;
                if (showBookmarkedOnly) {
                  return bookmarkedPostIds.map(String).includes(String(p.id));
                }
                return true;
              });

              if (showBookmarkedOnly && visiblePosts.length === 0) {
                return (
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px 20px',
                    textAlign: 'center',
                    gap: '12px'
                  }}>
                    <div style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Bookmark size={30} color="#94A3B8" />
                    </div>
                    <div style={{ fontSize: '1.08rem', fontWeight: 600, color: '#1E293B' }}>
                      {language === 'ko' ? '저장한 게시물이 없습니다' : language === 'ja' ? '保存済みの投稿はありません' : 'No saved posts'}
                    </div>
                    <p style={{ fontSize: '0.88rem', color: '#64748B', margin: '0 0 8px 0' }}>
                      {language === 'ko' ? '피드 우측의 북마크 아이콘을 눌러 마음에 드는 게시물을 저장해 보세요.' : 'Bookmark posts to save and view them here.'}
                    </p>
                    <button
                      type="button"
                      className="btn-primary"
                      style={{ padding: '8px 20px', fontSize: '0.9rem', borderRadius: '20px' }}
                      onClick={() => setShowBookmarkedOnly(false)}
                    >
                      {language === 'ko' ? '전체 피드 보기' : 'Browse All Feeds'}
                    </button>
                  </div>
                );
              }

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
                  {viewMode === 'feed' ? (
                    <div className="snaps-feed-view-wrapper">
                      <div className="snaps-feed-list">
                        {visiblePosts.map(renderVerticalFeedCard)}
                      </div>
                    </div>
                  ) : (
                    <div className="snaps-album-grid">
                      <div className="snaps-album-column">
                        {visiblePosts.filter((_, idx) => idx % 2 === 0).map(renderAlbumCard)}
                      </div>
                      <div className="snaps-album-column">
                        {visiblePosts.filter((_, idx) => idx % 2 !== 0).map(renderAlbumCard)}
                      </div>
                    </div>
                  )}
                </>
              );
            })()
          )}
        </div>
      </div>

      {/* Feed Registration Modal */}
      {
        feedDraft && (
          <div className="snaps-modal-overlay">
            <div className="snaps-modal-container">
              {/* Header (Clean Style) */}
              <div className="snaps-modal-header">
                <button onClick={handleClearFeedDraft} className="btn-ghost snaps-modal-close-btn">
                  <ArrowLeft size={24} />
                </button>
                <div className="snaps-modal-header-title ">
                  <h2 className="title-lg">
                    {language === 'ko' ? '피드샷' : language === 'ja' ? 'スナップ' : language === 'es' ? 'Foto / Video' : 'Pet Studio'}
                  </h2>
                </div>

              </div>


              <div className="snaps-modal-body">

                {/* Body (피드샷 온전 노출 + 회전/비율 편집 바) */}

                {/* 편집 툴바 (회전 및 종횡비 자르기) */}
                {feedDraft.image && (
                  <div className="snaps-edit-toolbar">
                    <div className="snaps-toolbar-section lucide">
                      <button
                        type="button"
                        className="snaps-tool-btn"
                        onClick={handleRotateLeft}
                        title={language === 'ko' ? '왼쪽으로 90° 회전' : language === 'ja' ? '左に90°回転' : 'Rotate Left 90°'}
                      >
                        <Undo size={15} strokeWidth={2.4} />
                      </button>
                      <button
                        type="button"
                        className="snaps-tool-btn"
                        onClick={handleRotateRight}
                        title={language === 'ko' ? '오른쪽으로 90° 회전' : language === 'ja' ? '右に90°回転' : 'Rotate Right 90°'}
                      >
                        <Redo size={15} strokeWidth={2.4} />
                      </button>
                    </div>


                    <div className="snaps-toolbar-section snaps-ratio-section">
                      {([
                        { id: 'original', className: 'ratio-original', title: language === 'ko' ? '원본 (초기화)' : language === 'ja' ? '原本 (リセット)' : 'Original (Reset)' },
                        { id: '1:1', className: 'ratio-square ratio-1-1', title: '1:1' },
                        { id: '9:16', className: 'ratio-vertical ratio-9-16', title: language === 'ko' ? '세로 (9:16)' : '9:16' },
                        { id: '16:9', className: 'ratio-horizontal ratio-16-9', title: language === 'ko' ? '가로 (16:9)' : '16:9' },
                      ] as const).map(item => {
                        const isSelected = editCropRatio === item.id;
                        const isOriginal = item.id === 'original';
                        const showResetIcon = isOriginal && !isSelected;

                        return (
                          <button
                            key={item.id}
                            type="button"
                            className={`snaps-ratio-btn ${item.className} ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              if (isOriginal) {
                                handleResetEdit();
                              } else {
                                handleSetCropRatio(item.id);
                              }
                            }}
                            title={item.title}
                            aria-label={item.title}
                          >
                            {isSelected && <Check size={14} strokeWidth={2.6} />}
                            {showResetIcon && <RotateCcw size={12} strokeWidth={2.4} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
                <div className="snaps-modal-media-wrapper">
                  {/*Header : Retake Button */}
                  <button
                    type="button"
                    onClick={handleRetake}
                    className="snaps-modal-retake-btn"
                    title={language === 'ko' ? '재촬영' : language === 'ja' ? '再撮影' : 'Retake'}
                  >
                    <Circle size={22} />
                  </button>

                  {feedDraft.image ? (
                    (typeof feedDraft.image === 'string' && (feedDraft.image.startsWith('blob:') || feedDraft.image.endsWith('.webm') || feedDraft.image.endsWith('.mp4'))) ? (
                      <div
                        className="snaps-video-crop-container"
                        style={{
                          aspectRatio: editCropRatio === '1:1' ? '1 / 1' : editCropRatio === '9:16' ? '9 / 16' : editCropRatio === '16:9' ? '16 / 9' : undefined,
                          width: '100%',
                          maxHeight: '65vh',
                          overflow: 'hidden',
                          borderRadius: '16px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: '#000'
                        }}
                      >
                        <video
                          src={feedDraft.image}
                          poster={displayImage || feedDraft.poster}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            transform: editRotation ? `rotate(${editRotation}deg)` : undefined,
                            objectFit: editCropRatio !== 'original' ? 'cover' : 'contain',
                            width: '100%',
                            height: '100%',
                            transition: 'transform 0.25s ease'
                          }}
                        />
                      </div>
                    ) : (
                      <img
                        src={displayImage}
                        alt="Preview"
                        style={{
                          transition: 'all 0.2s ease',
                          maxHeight: '65vh'
                        }}
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
                    <Download size={22} color="#121212" />
                  </div>
                  <span>{t.share?.download || (language === 'ko' ? '다운로드' : language === 'ja' ? 'ダウンロード' : 'Download')}</span>
                </button>

                {/* 5. 더 보기 */}
                <button onClick={handleShareMore}>
                  <div className={`share-icon-btn more ${selectedPlatform === 'more' ? 'selected' : ''}`}>
                    <Share2 size={22} color="#121212" />
                  </div>
                  <span>{t.share?.more || (language === 'ko' ? '더 보기' : language === 'ja' ? 'その他' : 'More')}</span>
                </button>

                {/* 6. 피드샷 (노란색 #FF9E58 + 북마크 아이콘) */}
                <button onClick={handlePostFeedDraft}>
                  <div className="share-icon-btn snaps">
                    <Bone size={22} color="#fff" />
                  </div>
                  <span className="share-label-snaps share-label-feed">{language === 'ko' ? '내피드' : language === 'ja' ? '保存' : 'Feed'}</span>
                </button>
              </div>

            </div>
          </div>
        )
      }

      {/* Photo Album Detail Modal (Pet Studio style large view with SNS share dock) */}
      {
        selectedDetailPost && (
          <div className="snaps-modal-overlay" onClick={() => setSelectedDetailPost(null)}>
            <div className="snaps-modal-container" onClick={(e) => e.stopPropagation()}>
              {/* Header */}
              <div className="snaps-modal-header row-between">
                <div className="snaps-modal-header-title">
                  <h2 className="title-lg">
                    {selectedDetailPost.name ? `${selectedDetailPost.name}` : (t.tabs?.snaps || '피드샷')}
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
                    title={t.snaps?.editPost || (language === 'ko' ? '수정' : language === 'ja' ? '編集' : 'Edit')}
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
                    title={t.snaps?.deletePost || (language === 'ko' ? '삭제' : language === 'ja' ? '削除' : 'Delete')}
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
                <div
                  className="snaps-modal-media-wrapper"
                  style={{
                    aspectRatio: selectedDetailPost.cropRatio === '1:1' ? '1 / 1' : selectedDetailPost.cropRatio === '9:16' ? '9 / 16' : selectedDetailPost.cropRatio === '16:9' ? '16 / 9' : undefined,
                    overflow: 'hidden',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#000'
                  }}
                >
                  {selectedDetailPost.isVideo ? (
                    <video
                      src={selectedDetailPost.feedImage}
                      poster={selectedDetailPost.poster}
                      autoPlay
                      loop
                      muted
                      playsInline
                      controls
                      style={{
                        transform: selectedDetailPost.rotation ? `rotate(${selectedDetailPost.rotation}deg)` : undefined,
                        objectFit: (selectedDetailPost.cropRatio && selectedDetailPost.cropRatio !== 'original') ? 'cover' : 'contain',
                        width: '100%',
                        height: (selectedDetailPost.cropRatio && selectedDetailPost.cropRatio !== 'original') ? '100%' : 'auto'
                      }}
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
                <button onClick={() => handlePostDownload(selectedDetailPost)} title={t.share?.download || (language === 'ko' ? '다운로드' : language === 'ja' ? 'ダウンロード' : 'Download')}>
                  <div className="share-icon-btn download">
                    <Download size={20} color="#121212" />
                  </div>
                  <span>{t.share?.download || (language === 'ko' ? '다운로드' : language === 'ja' ? 'ダウンロード' : 'Download')}</span>
                </button>

                {/* 5. 더 보기 */}
                <button onClick={() => handlePostShareMore(selectedDetailPost)} title={t.share?.more || (language === 'ko' ? '더 보기' : language === 'ja' ? 'その他' : 'More')}>
                  <div className="share-icon-btn more">
                    <Send size={20} color="#121212" />
                  </div>
                  <span>{t.share?.more || (language === 'ko' ? '더 보기' : language === 'ja' ? 'その他' : 'More')}</span>
                </button>
              </div>
            </div>
          </div>
        )
      }

      {/* Edit Post Modal */}
      {
        editingPost && (
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
        )
      }

      {/* Dog Profile Popup Modal */}
      <DogProfileModal
        dog={profileModalDog}
        onClose={() => setProfileModalDog(null)}
      />

      {/* Instagram/TikTok Style Comment Bottom Sheet Modal */}
      {
        activeCommentPost && (
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
                  background: '#333',
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
                <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#111', margin: 0 }}>
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
                {(() => {
                  const allComments: any[] = Array.isArray(activeCommentPost.comments) ? activeCommentPost.comments : [];
                  const rootComments = allComments.filter((c: any) => !c.parentId && !isUserBlocked(c.author));
                  const getReplies = (parentId: number) => allComments.filter((c: any) => c.parentId === parentId && !isUserBlocked(c.author));

                  if (rootComments.length === 0) {
                    return (
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
                    );
                  }

                  return (
                    <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {rootComments.map((c: any) => {
                        const myComment = isMyComment(c);
                        const authorAvatar = myComment
                          ? (currentCommentPet?.avatar || myDog?.avatar || c.avatar || getDefaultDogAvatar())
                          : (c.avatar || getDefaultDogAvatar());

                        const cleanAuthor = (c.author || '')
                          .replace(/\s*(엄마|맘|아빠|Mom|Dad|ママ|パパ)\s*$/gi, '')
                          .trim() || c.author;

                        const replies = getReplies(c.id);

                        return (
                          <div key={c.id} style={{ display: 'flex', flexDirection: 'column' }}>
                            {/* Root Comment Row */}
                            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
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
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#111' }}>{cleanAuthor}</span>
                                    <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>{c.createdAt || '방금 전'}</span>
                                  </div>

                                  {myComment ? (
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteComment(activeCommentPost.id, c.id);
                                      }}
                                      style={{
                                        background: '#F1F5F9',
                                        border: 'none',
                                        width: '26px',
                                        height: '26px',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        color: '#64748B',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        transition: 'all 0.15s',
                                        flexShrink: 0
                                      }}
                                      onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#FEE2E2';
                                        e.currentTarget.style.color = '#EF4444';
                                      }}
                                      onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#F1F5F9';
                                        e.currentTarget.style.color = '#64748B';
                                      }}
                                      title={t.feed?.deleteComment || (language === 'ko' ? '댓글 삭제' : 'Delete')}
                                      aria-label="댓글 삭제"
                                    >
                                      <X size={14} strokeWidth={2.5} />
                                    </button>
                                  ) : (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
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
                                        title={language === 'ko' ? '댓글 신고' : language === 'ja' ? 'コメントを通報' : 'Report Comment'}
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
                                          const confirmMsg = language === 'ko'
                                            ? `'${cleanAuthor}' 사용자를 차단하시겠습니까?`
                                            : language === 'ja'
                                              ? `'${cleanAuthor}' をブロックしますか？`
                                              : `Block user '${cleanAuthor}'?`;
                                          const alertMsg = language === 'ko'
                                            ? '사용자가 차단되었습니다.'
                                            : language === 'ja'
                                              ? 'ユーザーをブロックしました。'
                                              : 'User has been blocked.';
                                          if (window.confirm(confirmMsg)) {
                                            blockUser(cleanAuthor);
                                            alert(alertMsg);
                                          }
                                        }}
                                        title={language === 'ko' ? '작성자 차단' : language === 'ja' ? '投稿者をブロック' : 'Block User'}
                                        style={{
                                          background: 'none',
                                          border: 'none',
                                          padding: '2px',
                                          cursor: 'pointer',
                                          color: '#CBD5E1',
                                          display: 'flex',
                                          alignItems: 'center'
                                        }}
                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#121212')}
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

                                {/* 답글 달기 버튼 */}
                                <div style={{ marginTop: '6px' }}>
                                  <button
                                    type="button"
                                    onClick={() => handleStartReply(c)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      padding: 0,
                                      fontSize: '0.78rem',
                                      fontWeight: 600,
                                      color: '#64748B',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    {language === 'ko' ? '답글 달기' : language === 'ja' ? '返信' : 'Reply'}
                                  </button>
                                </div>
                              </div>
                            </div>

                            {/* Nested Replies (대댓글 목록) */}
                            {replies.length > 0 && (
                              <div style={{
                                marginLeft: '38px',
                                marginTop: '10px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '12px',
                                borderLeft: '2px solid #F1F5F9',
                                paddingLeft: '14px'
                              }}>
                                {replies.map((reply: any) => {
                                  const myReply = isMyComment(reply);
                                  const replyAvatar = myReply
                                    ? (currentCommentPet?.avatar || myDog?.avatar || reply.avatar || getDefaultDogAvatar())
                                    : (reply.avatar || getDefaultDogAvatar());

                                  return (
                                    <div key={reply.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                      <img
                                        src={replyAvatar}
                                        alt={reply.author}
                                        style={{
                                          width: '28px',
                                          height: '28px',
                                          borderRadius: '50%',
                                          objectFit: 'cover',
                                          background: '#F1F5F9',
                                          flexShrink: 0,
                                          border: '1px solid #E2E8F0'
                                        }}
                                      />
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, fontSize: '0.82rem', color: '#111' }}>{reply.author}</span>
                                            <span style={{ fontSize: '0.72rem', color: '#94A3B8' }}>{reply.createdAt || '방금 전'}</span>
                                          </div>
                                          {myReply ? (
                                            <button
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                handleDeleteComment(activeCommentPost.id, reply.id);
                                              }}
                                              style={{
                                                background: '#F1F5F9',
                                                border: 'none',
                                                width: '24px',
                                                height: '24px',
                                                borderRadius: '50%',
                                                cursor: 'pointer',
                                                color: '#64748B',
                                                display: 'inline-flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0,
                                                transition: 'all 0.15s'
                                              }}
                                              onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#FEE2E2';
                                                e.currentTarget.style.color = '#EF4444';
                                              }}
                                              onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#F1F5F9';
                                                e.currentTarget.style.color = '#64748B';
                                              }}
                                              title={language === 'ko' ? '답글 삭제' : 'Delete'}
                                              aria-label="답글 삭제"
                                            >
                                              <X size={12} strokeWidth={2.5} />
                                            </button>
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => {
                                                setReportTarget({
                                                  type: 'comment',
                                                  id: String(reply.id),
                                                  author: reply.author,
                                                  content: reply.text || ''
                                                });
                                              }}
                                              style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: '#CBD5E1', flexShrink: 0 }}
                                              title="답글 신고"
                                            >
                                              <Flag size={11} />
                                            </button>
                                          )}
                                        </div>

                                        <p style={{ fontSize: '0.85rem', color: '#334155', margin: '3px 0 0', lineHeight: 1.45, wordBreak: 'break-word' }}>
                                          {reply.replyToAuthor && (
                                            <span style={{ color: '#0095F6', fontWeight: 600, marginRight: '4px' }}>@{reply.replyToAuthor}</span>
                                          )}
                                          {reply.text.replace(new RegExp(`^@${reply.replyToAuthor}\\s*`, 'i'), '')}
                                        </p>

                                        {reply.image && (
                                          <div style={{ marginTop: '6px', borderRadius: '10px', overflow: 'hidden', maxWidth: '140px', maxHeight: '140px', border: '1px solid #E2E8F0' }}>
                                            <img src={reply.image} alt="Reply attachment" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                                          </div>
                                        )}

                                        <button
                                          type="button"
                                          onClick={() => handleStartReply(c)}
                                          style={{
                                            background: 'none',
                                            border: 'none',
                                            padding: 0,
                                            marginTop: '4px',
                                            fontSize: '0.74rem',
                                            fontWeight: 600,
                                            color: '#64748B',
                                            cursor: 'pointer'
                                          }}
                                        >
                                          {language === 'ko' ? '답글 달기' : language === 'ja' ? '返信' : 'Reply'}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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
                          background: '#111',
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

                {/* Replying Banner */}
                {replyingToComment && (
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 16px',
                    background: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    fontSize: '0.82rem',
                    color: '#475569'
                  }}>
                    <span>
                      <strong style={{ color: '#0095F6' }}>@{replyingToComment.author}</strong> 님에게 답글 작성 중
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setReplyingToComment(null);
                        if (modalCommentInput.startsWith(`@${replyingToComment.author}`)) {
                          setModalCommentInput('');
                        }
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '2px',
                        cursor: 'pointer',
                        color: '#94A3B8',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                      title="답글 취소"
                    >
                      <X size={15} />
                    </button>
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
                    src={currentCommentPet?.avatar || getDefaultDogAvatar()}
                    alt={currentCommentPet?.name || 'User'}
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      flexShrink: 0,
                      border: '1.5px solid #38c5b7'
                    }}
                    title={`${currentCommentPet?.name || 'User'} 프로필`}
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
                      ref={commentInputRef}
                      type="text"
                      placeholder={replyingToComment ? `@${replyingToComment.author} 님에게 답글 달기...` : (t.feed?.commentPlaceholder || (language === 'ko' ? '댓글 달기...' : language === 'ja' ? 'コメントを追加...' : 'Add a comment...'))}
                      value={modalCommentInput}
                      onChange={(e) => setModalCommentInput(e.target.value)}
                      style={{
                        flex: 1,
                        border: 'none',
                        background: 'transparent',
                        outline: 'none',
                        fontSize: '0.92rem',
                        color: '#111',
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
                          color: '#111',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title={language === 'ko' ? '갤러리에서 사진 첨부' : language === 'ja' ? '写真を追加' : 'Attach photo'}
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
        )
      }

      {/* Floating Toast Message */}
      {
        toastMessage && (
          <div style={{
            position: 'fixed', bottom: '85px', left: '50%', transform: 'translateX(-50%)',
            background: 'rgba(255, 255, 255, 0.95)', border: '1px solid #FF9E58', borderRadius: '12px',
            padding: '10px 18px', color: '#333', fontSize: '0.8rem', fontWeight: 800,
            boxShadow: '0 8px 30px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: '8px',
            zIndex: 4000, whiteSpace: 'nowrap'
          }}>
            <Sparkles size={16} color="#FF9E58" />
            <span>{toastMessage}</span>
          </div>
        )
      }

      {/* Report Modal */}
      <ReportModal
        target={reportTarget}
        onClose={() => setReportTarget(null)}
      />
    </div >
  );
};

export const FeedView = SnapsView;
export default SnapsView;
