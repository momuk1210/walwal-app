import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Bookmark,
  Users,
  UserCheck,
  Heart,
  MessageCircle,
  Play,
  Search,
  Send,
  Trash2,
  ExternalLink,
  X,
  Loader2,
  UserMinus
} from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { getLiveDogAvatar, getLiveDogProfile, DogProfile, isSameDogName } from '../data/mockDogs';
import { db, COLLECTIONS, STORAGE_KEYS } from '../firebase';
import { collection, onSnapshot } from 'firebase/firestore';
import { blobCache } from '../utils/mediaStore';
import { downloadVideoFromCloud } from '../services/mediaSync';
import '../styles/MyActivityModals.css';

// ---------------------------------------------------------------------------
// Helper: 내 등록 반려견 이름 목록 (팔로우/팔로잉 대상에서 철저히 제외)
// ---------------------------------------------------------------------------
const getMyDogNames = (): string[] => {
  try {
    const saved = localStorage.getItem('WALWAL_PETS');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((p: any) => (p?.name || '').trim()).filter(Boolean);
      }
    }
  } catch (e) { }
  return [];
};

const checkIsMyDog = (name: string): boolean => {
  if (!name) return false;
  const myDogs = getMyDogNames();
  return myDogs.some(myDogName => isSameDogName(myDogName, name));
};

// ---------------------------------------------------------------------------
// 1. SavedPostsModal (저장됨 - 북마크한 게시물 모아보기)
// ---------------------------------------------------------------------------
interface SavedPostsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewInSnaps?: (postId: string) => void;
}

export const SavedPostsModal: React.FC<SavedPostsModalProps> = ({
  isOpen,
  onClose,
  onViewInSnaps
}) => {
  const { t, language } = useTranslation();
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>([]);
  const [savedPosts, setSavedPosts] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load bookmarked posts directly from Cloud Firestore + unified local cache
  useEffect(() => {
    if (!isOpen) return;

    // 1. Read current bookmarked IDs from localStorage
    let currentBookmarkedIds: string[] = [];
    try {
      const savedIdsStr = localStorage.getItem('WALWAL_BOOKMARKED_POST_IDS');
      currentBookmarkedIds = savedIdsStr ? JSON.parse(savedIdsStr).map(String) : [];
    } catch (e) { }

    let isMounted = true;

    Promise.resolve().then(() => {
      if (!isMounted) return;
      setIsLoading(true);
      setBookmarkedIds(currentBookmarkedIds);
    });

    // Helper: process, filter and hydrate posts
    const processAndSetPosts = (allPosts: any[]) => {
      if (!isMounted) return;

      // Deduplicate posts by ID
      const postMap = new Map<string, any>();
      allPosts.forEach(p => {
        if (p && p.id && !postMap.has(String(p.id))) {
          postMap.set(String(p.id), p);
        }
      });

      // Match all bookmarked IDs against available posts
      const matched = Array.from(postMap.values()).filter(p => {
        const pId = String(p.id);
        return currentBookmarkedIds.some(bid => {
          const b = String(bid);
          return b === pId || pId.includes(b) || b.includes(pId);
        });
      });

      // Sort by creation time desc
      matched.sort((a, b) => {
        const timeA = new Date(a.createdAt || a.clientCreatedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.clientCreatedAt || 0).getTime();
        return timeB - timeA;
      });

      // Hydrate video post blobs and posters
      matched.forEach(post => {
        const isVideo = Boolean(
          post.isVideo ||
          post.hasCloudMedia ||
          (typeof post.feedImage === 'string' && (post.feedImage.startsWith('indexeddb:') || post.feedImage.endsWith('.webm') || post.feedImage.endsWith('.mp4')))
        );

        if (isVideo) {
          post.isVideo = true;
          const mediaId = (post.feedImage && typeof post.feedImage === 'string' && post.feedImage.startsWith('indexeddb:'))
            ? post.feedImage.split(':')[1]
            : post.id;
          const cachedBlob = blobCache.get(post.id) || (mediaId ? blobCache.get(mediaId) : null);
          if (cachedBlob && (!post.feedImage || post.feedImage.startsWith('indexeddb:'))) {
            post.feedImage = URL.createObjectURL(cachedBlob);
          } else if (!post.feedImage || post.feedImage.startsWith('indexeddb:')) {
            downloadVideoFromCloud(post.id).then(blob => {
              if (blob && isMounted) {
                const url = URL.createObjectURL(blob);
                setSavedPosts(prev => prev.map(item => item.id === post.id ? { ...item, feedImage: url } : item));
              }
            }).catch(() => { });
          }
        }
      });

      setSavedPosts(matched);
      setIsLoading(false);
    };

    // 2. Immediate load from local storage cache across all potential keys
    const localCandidates: any[] = [];
    try {
      const storageSources = [
        STORAGE_KEYS.SNAPS_POSTS,
        STORAGE_KEYS.FEED_POSTS,
        'WALWAL_DEV_USER_SNAPS_POSTS',
        'WALWAL_USER_SNAPS_POSTS',
        'WALWAL_LOCAL_POSTS',
        'WALWAL_PENDING_LOCAL_POSTS'
      ];
      storageSources.forEach(key => {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) localCandidates.push(...parsed);
        }
      });
      if (localCandidates.length > 0) {
        Promise.resolve().then(() => processAndSetPosts(localCandidates));
      }
    } catch (e) { }

    // 3. Real-time Cloud Firestore listeners across both 'dev_posts' and 'posts' to never miss any real posts
    const unsubs: any[] = [];
    const remotePostsMap = new Map<string, any>();

    const handleSnapshot = (snapshot: any) => {
      snapshot.forEach((docSnap: any) => {
        const data = docSnap.data();
        if (data?.isDeleted) return;
        remotePostsMap.set(docSnap.id, {
          ...data,
          id: docSnap.id,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (data.createdAt || data.clientCreatedAt || new Date().toISOString())
        });
      });

      const combined = [...Array.from(remotePostsMap.values()), ...localCandidates];
      processAndSetPosts(combined);
    };

    try {
      const unsub1 = onSnapshot(collection(db, COLLECTIONS.POSTS), handleSnapshot, () => setIsLoading(false));
      unsubs.push(unsub1);

      // Also listen to fallback collection if dev vs prod names differ
      const altCol = COLLECTIONS.POSTS === 'dev_posts' ? 'posts' : 'dev_posts';
      const unsub2 = onSnapshot(collection(db, altCol), handleSnapshot, () => { });
      unsubs.push(unsub2);
    } catch (err) {
      console.warn('Failed to listen to Firestore:', err);
      Promise.resolve().then(() => {
        if (isMounted) setIsLoading(false);
      });
    }

    return () => {
      isMounted = false;
      unsubs.forEach(u => { if (typeof u === 'function') u(); });
    };
  }, [isOpen]);

  // Unsave post
  const handleUnsave = (e: React.MouseEvent, postId: string) => {
    e.stopPropagation();
    const updatedIds = bookmarkedIds.filter(id => id !== String(postId));
    setBookmarkedIds(updatedIds);
    setSavedPosts(prev => prev.filter(p => String(p.id) !== String(postId)));
    try {
      localStorage.setItem('WALWAL_BOOKMARKED_POST_IDS', JSON.stringify(updatedIds));
      window.dispatchEvent(new CustomEvent('walwal_bookmarked_updated', { detail: updatedIds.length }));
    } catch (e) { }

    if (selectedPost && String(selectedPost.id) === String(postId)) {
      setSelectedPost(null);
    }
  };

  const handleOpenDetail = (post: any) => {
    setSelectedPost(post);
  };

  const handleGoToSnaps = (postId?: string) => {
    onClose();
    if (onViewInSnaps && postId) {
      onViewInSnaps(postId);
    } else {
      window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'snaps' }));
      window.dispatchEvent(new CustomEvent('walwal_view_saved_snaps'));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="activity-modal-overlay" onClick={onClose}>
      <div className="activity-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="activity-modal-header">
          <button type="button" className="activity-modal-back-btn" onClick={onClose} aria-label="닫기">
            <ArrowLeft size={22} />
          </button>
          <div className="activity-modal-title">
            <span>{t.settings?.saved || (language === 'ko' ? '저장됨' : 'Saved')}</span>
            <span className="activity-modal-count-badge">{savedPosts.length}</span>
          </div>
          <div className="activity-modal-close-spacer" />
        </div>

        {/* Body */}
        <div className="activity-modal-body">
          {isLoading && savedPosts.length === 0 ? (
            <div className="activity-empty-state" style={{ padding: '80px 24px' }}>
              <Loader2 size={32} color="#6b7280" style={{ animation: 'activitySpin 1s linear infinite' }} />
              <div style={{ marginTop: '14px', fontSize: '0.88rem', color: '#6b7280', fontWeight: 500 }}>
                {language === 'ko' ? '저장한 게시물을 불러오는 중...' : 'Loading saved posts...'}
              </div>
            </div>
          ) : savedPosts.length === 0 ? (
            <div className="activity-empty-state">
              <div className="activity-empty-icon-wrap">
                <Bookmark size={36} strokeWidth={1.5} />
              </div>
              <div className="activity-empty-title">
                {language === 'ko' ? '저장한 게시물이 없습니다' : language === 'ja' ? '保存済みの投稿はありません' : 'No saved posts'}
              </div>
              <div className="activity-empty-desc">
                {language === 'ko'
                  ? '피드 우측의 북마크 아이콘을 눌러 마음에 드는 게시물을 저장해 보세요.'
                  : language === 'ja'
                    ? 'フィードのブックマークアイコンをタップして、お気に入りの投稿を保存しましょう。'
                    : 'Tap the bookmark icon on posts to save your favorites.'}
              </div>
              <button
                type="button"
                className="activity-empty-btn"
                onClick={() => handleGoToSnaps()}
              >
                {language === 'ko' ? '피드 둘러보기' : language === 'ja' ? 'フィードを見る' : 'Browse Feeds'}
              </button>
            </div>
          ) : (
            <div className="activity-saved-grid">
              {savedPosts.map((post) => {
                const isVideo = Boolean(post.isVideo || (typeof post.feedImage === 'string' && (post.feedImage.endsWith('.mp4') || post.feedImage.endsWith('.webm'))));
                const displayImg = post.poster || post.feedImage || post.originalFeedImage || '';
                const authorName = post.name || post.dogName || post.ownerName || 'WalWal Dog';
                const likesCount = typeof post.likes === 'number' ? post.likes : 0;

                return (
                  <div
                    key={post.id}
                    className="activity-saved-card"
                    onClick={() => handleOpenDetail(post)}
                  >
                    {isVideo && (
                      <div className="activity-saved-card-video-badge">
                        <Play size={13} fill="#fff" />
                      </div>
                    )}

                    <button
                      type="button"
                      className="activity-saved-card-unsave-btn"
                      onClick={(e) => handleUnsave(e, post.id)}
                      title={language === 'ko' ? '저장 취소' : 'Unsave'}
                    >
                      <Bookmark size={16} fill="#FFD700" color="#FFD700" />
                    </button>

                    {displayImg ? (
                      <img
                        src={displayImg}
                        alt={authorName}
                        className="activity-saved-card-media"
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', background: '#374151' }} />
                    )}

                    <div className="activity-saved-card-overlay">
                      <span className="activity-saved-card-author">{authorName}</span>
                      <span className="activity-saved-card-stats">
                        <Heart size={12} fill="#ef4444" color="#ef4444" />
                        <span>{likesCount}</span>
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Nested Post Detail Modal */}
      {selectedPost && (
        <div className="activity-post-detail-overlay" onClick={() => setSelectedPost(null)}>
          <div className="activity-post-detail-card" onClick={e => e.stopPropagation()}>
            <div className="activity-post-detail-header">
              <div className="activity-post-detail-author">
                <img
                  src={getLiveDogAvatar(selectedPost.name, selectedPost.avatar)}
                  alt={selectedPost.name}
                  className="activity-post-detail-avatar"
                />
                <div>
                  <div className="activity-post-detail-name">
                    {selectedPost.name || selectedPost.dogName || 'WalWal Dog'}
                  </div>
                  <div className="activity-post-detail-time">
                    {selectedPost.timeAgo || '오늘'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                className="activity-modal-back-btn"
                onClick={() => setSelectedPost(null)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="activity-post-detail-media-wrap">
              {selectedPost.isVideo ? (
                <video
                  src={selectedPost.feedImage}
                  poster={selectedPost.poster}
                  controls
                  autoPlay
                  playsInline
                  className="activity-post-detail-media"
                />
              ) : (
                <img
                  src={selectedPost.feedImage || selectedPost.originalFeedImage}
                  alt="Post"
                  className="activity-post-detail-media"
                />
              )}
            </div>

            <div className="activity-post-detail-body">
              {selectedPost.thought && (
                <div className="activity-post-detail-thought">
                  💭 {selectedPost.thought}
                </div>
              )}
              {selectedPost.caption && (
                <p style={{ fontSize: '0.88rem', color: '#374151', margin: '4px 0 12px' }}>
                  {selectedPost.caption}
                </p>
              )}

              <div className="activity-post-detail-actions">
                <div className="activity-post-detail-stats">
                  <span className="activity-post-detail-stats-item">
                    <Heart size={16} fill="#ef4444" color="#ef4444" />
                    <span>{selectedPost.likes || 0}</span>
                  </span>
                  <span className="activity-post-detail-stats-item">
                    <MessageCircle size={16} />
                    <span>{Array.isArray(selectedPost.comments) ? selectedPost.comments.length : 0}</span>
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    type="button"
                    className="activity-btn-follow"
                    style={{ background: '#fef3c7', color: '#b45309', borderColor: '#fde68a' }}
                    onClick={(e) => handleUnsave(e, selectedPost.id)}
                  >
                    {language === 'ko' ? '저장 해제' : 'Unsave'}
                  </button>
                  <button
                    type="button"
                    className="activity-post-view-in-snaps-btn"
                    onClick={() => handleGoToSnaps(selectedPost.id)}
                  >
                    {language === 'ko' ? '피드로 보기' : 'View in Feed'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// 2. FollowersModal (팔로우 - 나를 팔로우하는 실제 반려견 친구들)
// ---------------------------------------------------------------------------
interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDogProfile: (dog: any) => void;
  onSendNote: (dog: any) => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  onOpenDogProfile,
  onSendNote
}) => {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);
  const [followers, setFollowers] = useState<string[]>([]);

  // Load follower and followed state (strictly exclude my pets and clean any mock data)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        // 1. Followed users (sanitize by excluding my own dogs)
        const savedFollowed = localStorage.getItem('WALWAL_FOLLOWED_USERS');
        const parsedFollowed: string[] = savedFollowed ? JSON.parse(savedFollowed) : [];
        const cleanFollowed = parsedFollowed.filter(name => !checkIsMyDog(name));
        setFollowedUsers(cleanFollowed);

        // 2. Followers (strictly purge any mock data like 모찌, 땅콩, 구름이)
        const MOCK_NAMES = ['모찌', '땅콩', '구름이'];
        const savedFollowers = localStorage.getItem('WALWAL_FOLLOWER_USERS');
        const parsedFollowers: string[] = savedFollowers ? JSON.parse(savedFollowers) : [];
        const cleanFollowers = parsedFollowers.filter(name => !MOCK_NAMES.includes(name) && !checkIsMyDog(name));

        setFollowers(cleanFollowers);
        localStorage.setItem('WALWAL_FOLLOWER_USERS', JSON.stringify(cleanFollowers));
      } catch (e) { }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  // Toggle follow / following (Mutual follow)
  const handleToggleFollow = (dogName: string) => {
    setFollowedUsers(prev => {
      const isFollowing = prev.includes(dogName);
      const updated = isFollowing ? prev.filter(n => n !== dogName) : [...prev, dogName];
      try {
        localStorage.setItem('WALWAL_FOLLOWED_USERS', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  // Remove follower
  const handleRemoveFollower = (dogName: string) => {
    const confirmMsg = language === 'ko'
      ? `'${dogName}' 님을 팔로워에서 삭제하시겠습니까?`
      : language === 'ja'
        ? `'${dogName}' をフォロワーから削除しますか？`
        : `Remove '${dogName}' from followers?`;
    if (!window.confirm(confirmMsg)) return;

    setFollowers(prev => {
      const updated = prev.filter(n => n !== dogName);
      try {
        localStorage.setItem('WALWAL_FOLLOWER_USERS', JSON.stringify(updated));
      } catch (e) { }
      return updated;
    });
  };

  // Filter followers by query (and strictly exclude my own dogs)
  const filteredFollowers = useMemo(() => {
    return followers
      .filter(name => !checkIsMyDog(name))
      .filter(name => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const dog = getLiveDogProfile(name, language);
        return (
          name.toLowerCase().includes(q) ||
          (dog?.breed && dog.breed.toLowerCase().includes(q))
        );
      });
  }, [followers, searchQuery, language]);

  if (!isOpen) return null;

  return (
    <div className="activity-modal-overlay" onClick={onClose}>
      <div className="activity-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="activity-modal-header">
          <button type="button" className="activity-modal-back-btn" onClick={onClose} aria-label="닫기">
            <ArrowLeft size={22} />
          </button>
          <div className="activity-modal-title">
            <span>{t.settings?.followers || (language === 'ko' ? '팔로우' : 'Followers')}</span>
            <span className="activity-modal-count-badge">{filteredFollowers.length}</span>
          </div>
          <div className="activity-modal-close-spacer" />
        </div>

        {/* Search */}
        <div className="activity-search-bar">
          <div className="activity-search-input-wrapper">
            <Search size={16} className="activity-search-icon" />
            <input
              type="text"
              className="activity-search-input"
              placeholder={language === 'ko' ? '친구 이름 또는 견종 검색' : 'Search followers...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Body */}
        <div className="activity-modal-body">
          {filteredFollowers.length === 0 ? (
            <div className="activity-empty-state">
              <div className="activity-empty-icon-wrap">
                <Users size={36} strokeWidth={1.5} />
              </div>
              <div className="activity-empty-title">
                {searchQuery ? (language === 'ko' ? '검색 결과가 없습니다' : 'No results found') : (language === 'ko' ? '아직 팔로워가 없습니다' : 'No followers yet')}
              </div>
              <div className="activity-empty-desc">
                {language === 'ko'
                  ? '동네 산책과 피드 활동을 통해 새로운 이웃 반려견 친구들을 사귀어 보세요!'
                  : 'Meet neighbor dog friends through walks and snaps!'}
              </div>
            </div>
          ) : (
            <div className="activity-user-list">
              {filteredFollowers.map(name => {
                const dog = getLiveDogProfile(name, language) || {
                  id: name,
                  name,
                  breed: '믹스견',
                  age: '2',
                  gender: 'female',
                  ownerName: `${name} 보호자`,
                  personality: ['#산책러버', '#댕댕이'],
                  avatar: getLiveDogAvatar(name),
                  distance: '150m',
                  greeting: '안녕하세요! 친하게 지내요 🐾',
                  recentThought: '안녕하세요! 친하게 지내요 🐾'
                };
                const isFollowing = followedUsers.includes(name);

                return (
                  <div key={name} className="activity-user-item">
                    <div
                      className="activity-user-avatar-wrap"
                      onClick={() => onOpenDogProfile(dog)}
                      title={language === 'ko' ? '프로필 보기' : 'View profile'}
                    >
                      <img
                        src={getLiveDogAvatar(name, dog.avatar)}
                        alt={name}
                        className="activity-user-avatar"
                      />
                    </div>

                    <div
                      className="activity-user-info"
                      onClick={() => onOpenDogProfile(dog)}
                    >
                      <div className="activity-user-name-row">
                        <span className="activity-user-name">{name}</span>
                        <span className="activity-user-breed">· {dog.breed}</span>
                      </div>
                      <div className="activity-user-thought">
                        {dog.greeting || dog.recentThought || (language === 'ko' ? '산책 메이트를 찾고 있어요!' : 'Looking for walk friends!')}
                      </div>
                    </div>

                    <div className="activity-user-actions">
                      <button
                        type="button"
                        className={`activity-btn-follow ${isFollowing ? 'active' : 'primary'}`}
                        onClick={() => handleToggleFollow(name)}
                      >
                        {isFollowing
                          ? (language === 'ko' ? '팔로잉 취소' : 'Unfollow')
                          : (language === 'ko' ? '맞팔로우' : 'Follow back')}
                      </button>

                      <button
                        type="button"
                        className="activity-btn-icon"
                        onClick={() => onSendNote(dog)}
                        title={language === 'ko' ? '쪽지 보내기' : 'Send message'}
                      >
                        <Send size={15} />
                      </button>

                      <button
                        type="button"
                        className="activity-btn-icon destructive"
                        onClick={() => handleRemoveFollower(name)}
                        title={language === 'ko' ? '팔로워 삭제' : 'Remove follower'}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// 3. FollowingModal (팔로잉 - 내가 팔로우하는 실제 반려견 친구들)
// ---------------------------------------------------------------------------
interface FollowingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenDogProfile: (dog: any) => void;
  onSendNote: (dog: any) => void;
}

export const FollowingModal: React.FC<FollowingModalProps> = ({
  isOpen,
  onClose,
  onOpenDogProfile,
  onSendNote
}) => {
  const { t, language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [followedUsers, setFollowedUsers] = useState<string[]>([]);

  // Load following state (strictly exclude user's own dogs)
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;

    Promise.resolve().then(() => {
      if (cancelled) return;
      try {
        const saved = localStorage.getItem('WALWAL_FOLLOWED_USERS');
        const parsed: string[] = saved ? JSON.parse(saved) : [];
        // Strictly exclude my own pets from following list
        const cleanFollowing = parsed.filter(name => !checkIsMyDog(name));
        setFollowedUsers(cleanFollowing);
        localStorage.setItem('WALWAL_FOLLOWED_USERS', JSON.stringify(cleanFollowing));
      } catch (e) { }
    });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const handleUnfollow = (dogName: string) => {
    const updated = followedUsers.filter(n => n !== dogName);
    setFollowedUsers(updated);
    try {
      localStorage.setItem('WALWAL_FOLLOWED_USERS', JSON.stringify(updated));
    } catch (e) { }
  };

  // Filter following list (and strictly exclude user's own registered dogs)
  const filteredFollowing = useMemo(() => {
    return followedUsers
      .filter(name => !checkIsMyDog(name))
      .filter(name => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const dog = getLiveDogProfile(name, language);
        return (
          name.toLowerCase().includes(q) ||
          (dog?.breed && dog.breed.toLowerCase().includes(q))
        );
      });
  }, [followedUsers, searchQuery, language]);

  if (!isOpen) return null;

  return (
    <div className="activity-modal-overlay" onClick={onClose}>
      <div className="activity-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="activity-modal-header">
          <button type="button" className="activity-modal-back-btn" onClick={onClose} aria-label="닫기">
            <ArrowLeft size={22} />
          </button>
          <div className="activity-modal-title">
            <span>{t.settings?.following || (language === 'ko' ? '팔로잉' : 'Following')}</span>
            <span className="activity-modal-count-badge">{filteredFollowing.length}</span>
          </div>
          <div className="activity-modal-close-spacer" />
        </div>

        {/* Search */}
        <div className="activity-search-bar">
          <div className="activity-search-input-wrapper">
            <Search size={16} className="activity-search-icon" />
            <input
              type="text"
              className="activity-search-input"
              placeholder={language === 'ko' ? '친구 이름 또는 견종 검색' : 'Search following...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Body */}
        <div className="activity-modal-body">
          {filteredFollowing.length === 0 ? (
            <div className="activity-empty-state">
              <div className="activity-empty-icon-wrap">
                <UserCheck size={36} strokeWidth={1.5} />
              </div>
              <div className="activity-empty-title">
                {searchQuery ? (language === 'ko' ? '검색 결과가 없습니다' : 'No results found') : (language === 'ko' ? '아직 팔로잉 중인 친구가 없습니다' : 'Not following anyone yet')}
              </div>
              <div className="activity-empty-desc">
                {language === 'ko'
                  ? '피드에서 마음에 드는 이웃 반려견 친구의 [팔로우] 버튼을 눌러 소식을 받아보세요!'
                  : 'Follow neighbor dogs on Snaps to see their daily stories!'}
              </div>
            </div>
          ) : (
            <div className="activity-user-list">
              {filteredFollowing.map(name => {
                const dog = getLiveDogProfile(name, language) || {
                  id: name,
                  name,
                  breed: '믹스견',
                  age: '2',
                  gender: 'female',
                  ownerName: `${name} 보호자`,
                  personality: ['#산책러버', '#댕댕이'],
                  avatar: getLiveDogAvatar(name),
                  distance: '120m',
                  greeting: '신나게 산책하고 있어요 🐶',
                  recentThought: '신나게 산책하고 있어요 🐶'
                };

                return (
                  <div key={name} className="activity-user-item">
                    <div
                      className="activity-user-avatar-wrap"
                      onClick={() => onOpenDogProfile(dog)}
                      title={language === 'ko' ? '프로필 보기' : 'View profile'}
                    >
                      <img
                        src={getLiveDogAvatar(name, dog.avatar)}
                        alt={name}
                        className="activity-user-avatar"
                      />
                    </div>

                    <div
                      className="activity-user-info"
                      onClick={() => onOpenDogProfile(dog)}
                    >
                      <div className="activity-user-name-row">
                        <span className="activity-user-name">{name}</span>
                        <span className="activity-user-breed">· {dog.breed}</span>
                      </div>
                      <div className="activity-user-thought">
                        {dog.greeting || dog.recentThought || (language === 'ko' ? '함께 산책해요!' : 'Let\'s walk together!')}
                      </div>
                    </div>

                    <div className="activity-user-actions">
                      <button
                        type="button"
                        className="activity-btn-follow active"
                        onClick={() => handleUnfollow(name)}
                        title={language === 'ko' ? '팔로잉 취소' : 'Unfollow'}
                      >
                        {language === 'ko' ? '팔로잉 취소' : 'Unfollow'}
                      </button>

                      {/* <button
                        type="button"
                        className="activity-btn-icon"
                        onClick={() => onSendNote(dog)}
                        title={language === 'ko' ? '쪽지 보내기' : 'Send message'}
                      >
                        <Send size={15} />
                      </button> */}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
