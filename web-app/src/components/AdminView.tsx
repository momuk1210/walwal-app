import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Users,
  Image,
  Calendar,
  Bell,
  Trash2,
  Search,
  LogOut,
  RefreshCw,
  Sparkles,
  ExternalLink,
  Edit2,
  Check,
  X,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { db, auth } from '../firebase';
import { syncMeetupToFirestore, saveDogProfile } from '../services/db';
import {
  collection,
  onSnapshot,
  doc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  updateDoc
} from 'firebase/firestore';
import { getMeetupDynamicStatus, formatMeetupDisplay } from '../utils/meetupTime';
import { ContentReport, getAdminReports, updateReportStatus, blockUser } from '../services/moderationService';
import '../styles/AdminView.css';

interface AdminViewProps {
  onClose: () => void;
}

type AdminTab = 'overview' | 'dogs' | 'posts' | 'meetups' | 'notices' | 'reports';

interface SubscriberGroup {
  id: string;
  email: string;
  ownerName: string;
  joinedAt: string;
  dogs: any[];
}

export const AdminView: React.FC<AdminViewProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDogPerSub, setSelectedDogPerSub] = useState<Record<string, string>>({});

  // Firestore & Local Data Collections
  const [dogs, setDogs] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) { }
    return [];
  });
  const [posts, setPosts] = useState<any[]>([]);
  const [meetups, setMeetups] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_MEETUPS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter(m => m.id && !['m1', 'm2', 'm3', 'm4'].includes(m.id));
        }
      }
    } catch (e) { }
    return [];
  });
  const [notices, setNotices] = useState<any[]>([]);
  const [reports, setReports] = useState<ContentReport[]>([]);

  // Edit Dog Modal State
  const [editingDog, setEditingDog] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editBreed, setEditBreed] = useState('');
  const [editGreeting, setEditGreeting] = useState('');

  // New Notice State
  const [newNoticeTitle, setNewNoticeTitle] = useState('');
  const [newNoticeBody, setNewNoticeBody] = useState('');

  // 1. Subscribe to Firestore Collections & Synchronize Local Data
  useEffect(() => {
    setIsLoading(true);

    // Initial pass: ensure local meetups & dogs are pushed to Firestore
    try {
      const localMeetupsStr = localStorage.getItem('WALWAL_MEETUPS');
      if (localMeetupsStr) {
        const localList = JSON.parse(localMeetupsStr);
        if (Array.isArray(localList)) {
          localList.forEach((m: any) => {
            if (m.id && !['m1', 'm2', 'm3', 'm4'].includes(m.id)) {
              syncMeetupToFirestore(m);
            }
          });
        }
      }
      const localPetsStr = localStorage.getItem('WALWAL_PETS');
      if (localPetsStr) {
        const localPets = JSON.parse(localPetsStr);
        if (Array.isArray(localPets)) {
          localPets.forEach((p: any) => {
            if (p.id) saveDogProfile(p);
          });
        }
      }
    } catch (e) {
      console.warn('Initial admin sync error:', e);
    }

    const unsubDogs = onSnapshot(collection(db, 'dogs'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setDogs(list);
    });

    const unsubPosts = onSnapshot(collection(db, 'posts'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setPosts(list);
    });

    const unsubMeetups = onSnapshot(collection(db, 'meetups'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      // Merge local meetups so count is never falsely 0
      try {
        const saved = localStorage.getItem('WALWAL_MEETUPS');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            parsed.forEach((m: any) => {
              if (m.id && !['m1', 'm2', 'm3', 'm4'].includes(m.id) && !list.some(item => item.id === m.id)) {
                list.push(m);
                syncMeetupToFirestore(m);
              }
            });
          }
        }
      } catch (e) { }
      setMeetups(list);
    });

    const unsubNotices = onSnapshot(collection(db, 'notices'), (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setNotices(list);
      setIsLoading(false);
    });

    const unsubReports = onSnapshot(collection(db, 'reports'), async (snapshot) => {
      const list: ContentReport[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ContentReport);
      });
      if (list.length === 0) {
        const local = await getAdminReports();
        setReports(local);
      } else {
        setReports(list.sort((a, b) => (b.reportedAt || 0) - (a.reportedAt || 0)));
      }
    }, async () => {
      const local = await getAdminReports();
      setReports(local);
    });

    return () => {
      unsubDogs();
      unsubPosts();
      unsubMeetups();
      unsubNotices();
      unsubReports();
    };
  }, []);

  // 2. Group Dogs by Subscriber & Filtered Collections
  const subscribers: SubscriberGroup[] = useMemo(() => {
    const map = new Map<string, SubscriberGroup>();

    dogs.forEach(dog => {
      const email = dog.ownerEmail ||
        (dog.id?.startsWith('pet-')
          ? (auth.currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || 'daisynara@gmail.com')
          : `${(dog.ownerName || 'user').replace(/[^a-zA-Z0-9가-힣]/g, '').toLowerCase()}@walwal.pet`);

      const key = email.toLowerCase().trim();
      const existing = map.get(key);
      const joinedAt = dog.joinedAt || (dog.adoptionDate ? dog.adoptionDate.replace(/-/g, '.') : '2026.09.15');

      if (!existing) {
        map.set(key, {
          id: key,
          email,
          ownerName: dog.ownerName || '보호자',
          joinedAt,
          dogs: [dog]
        });
      } else {
        if (!existing.dogs.some(d => d.id === dog.id)) {
          existing.dogs.push(dog);
        }
      }
    });

    return Array.from(map.values());
  }, [dogs]);

  const filteredSubscribers = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return subscribers;
    return subscribers.filter(sub =>
      sub.email.toLowerCase().includes(q) ||
      sub.ownerName.toLowerCase().includes(q) ||
      sub.dogs.some(d => d.name?.toLowerCase().includes(q) || d.breed?.toLowerCase().includes(q))
    );
  }, [subscribers, searchQuery]);

  const filteredDogs = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return dogs;
    return dogs.filter(d =>
      d.name?.toLowerCase().includes(q) ||
      d.breed?.toLowerCase().includes(q) ||
      d.ownerName?.toLowerCase().includes(q)
    );
  }, [dogs, searchQuery]);

  const filteredPosts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return posts;
    return posts.filter(p =>
      p.recentThought?.toLowerCase().includes(q) ||
      p.thought?.toLowerCase().includes(q) ||
      p.text?.toLowerCase().includes(q) ||
      p.name?.toLowerCase().includes(q) ||
      p.authorName?.toLowerCase().includes(q)
    );
  }, [posts, searchQuery]);

  const filteredMeetups = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return meetups;
    return meetups.filter(m =>
      m.title?.toLowerCase().includes(q) ||
      m.location?.toLowerCase().includes(q) ||
      m.hostOwner?.toLowerCase().includes(q) ||
      m.hostDog?.toLowerCase().includes(q) ||
      m.hostName?.toLowerCase().includes(q)
    );
  }, [meetups, searchQuery]);

  // Actions: Delete Subscriber (all dogs)
  const handleDeleteSubscriber = async (sub: SubscriberGroup) => {
    if (!window.confirm(`'${sub.email}' 가입자와 등록된 보호견 ${sub.dogs.length}마리를 모두 영구 삭제하시겠습니까?`)) return;
    try {
      for (const dog of sub.dogs) {
        await deleteDoc(doc(db, 'dogs', dog.id));
      }
      try {
        const saved = localStorage.getItem('WALWAL_PETS');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(p => !sub.dogs.some(d => d.id === p.id));
            localStorage.setItem('WALWAL_PETS', JSON.stringify(filtered));
            window.dispatchEvent(new Event('walwal_pets_updated'));
          }
        }
        // Record deleted dog IDs in WALWAL_DELETED_PETS
        const deletedRaw = localStorage.getItem('WALWAL_DELETED_PETS');
        const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
        sub.dogs.forEach((d: any) => {
          if (d.id && !deletedList.includes(d.id)) deletedList.push(d.id);
          if (d.name && !deletedList.includes(d.name)) deletedList.push(d.name);
        });
        localStorage.setItem('WALWAL_DELETED_PETS', JSON.stringify(deletedList));
      } catch (e) { }
      alert(`'${sub.email}' 가입자 정보가 삭제되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // Actions: Delete Dog
  const handleDeleteDog = async (dog: any) => {
    if (!window.confirm(`'${dog.name}' 반려견을 데이터베이스에서 영구 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'dogs', dog.id));
      try {
        const saved = localStorage.getItem('WALWAL_PETS');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter(p => p.id !== dog.id && p.name !== dog.name);
            localStorage.setItem('WALWAL_PETS', JSON.stringify(filtered));
            window.dispatchEvent(new Event('walwal_pets_updated'));
          }
        }
        // Record in WALWAL_DELETED_PETS
        const deletedRaw = localStorage.getItem('WALWAL_DELETED_PETS');
        const deletedList: string[] = deletedRaw ? JSON.parse(deletedRaw) : [];
        if (dog.id && !deletedList.includes(dog.id)) deletedList.push(dog.id);
        if (dog.name && !deletedList.includes(dog.name)) deletedList.push(dog.name);
        localStorage.setItem('WALWAL_DELETED_PETS', JSON.stringify(deletedList));
      } catch (e) { }
      alert(`'${dog.name}' 반려견이 성공적으로 삭제되었습니다.`);
    } catch (err) {
      console.error(err);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  // Actions: Save Edit Dog
  const handleSaveEditDog = async () => {
    if (!editingDog) return;
    try {
      await updateDoc(doc(db, 'dogs', editingDog.id), {
        name: editName.trim(),
        breed: editBreed.trim(),
        greeting: editGreeting.trim(),
        updatedAt: serverTimestamp()
      });
      setEditingDog(null);
      alert('반려견 정보가 수정되었습니다.');
    } catch (err) {
      console.error(err);
      alert('수정 중 오류가 발생했습니다.');
    }
  };

  // Actions: Delete Post
  const handleDeletePost = async (post: any) => {
    if (!window.confirm(`이 게시물(작성자: ${post.name || '알 수 없음'})을 영구 삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'posts', post.id));
      alert('게시물이 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('게시물 삭제 중 오류가 발생했습니다.');
    }
  };

  // Actions: Delete Meetup
  const handleDeleteMeetup = async (meetup: any) => {
    if (!window.confirm(`'${meetup.title}' 모임을 취소/삭제하시겠습니까?`)) return;
    try {
      await deleteDoc(doc(db, 'meetups', meetup.id));
      const local = localStorage.getItem('WALWAL_MEETUPS');
      if (local) {
        try {
          const parsed = JSON.parse(local);
          if (Array.isArray(parsed)) {
            const filtered = parsed.filter((m: any) => m.id !== meetup.id);
            localStorage.setItem('WALWAL_MEETUPS', JSON.stringify(filtered));
          }
        } catch (e) { }
      }
      setMeetups(prev => prev.filter(m => m.id !== meetup.id));
      alert('모임이 삭제되었습니다.');
    } catch (err) {
      console.error(err);
      alert('모임 삭제 중 오류가 발생했습니다.');
    }
  };

  // Actions: Add Notice
  const handleAddNotice = async () => {
    if (!newNoticeTitle.trim() || !newNoticeBody.trim()) {
      alert('공지 제목과 내용을 입력해주세요.');
      return;
    }
    try {
      const noticeId = 'notice-' + Date.now();
      await setDoc(doc(db, 'notices', noticeId), {
        id: noticeId,
        title: newNoticeTitle.trim(),
        body: newNoticeBody.trim(),
        active: true,
        createdAt: serverTimestamp()
      });
      setNewNoticeTitle('');
      setNewNoticeBody('');
      alert('공지사항이 등록되었습니다.');
    } catch (err) {
      console.error(err);
      alert('공지 등록 중 오류가 발생했습니다.');
    }
  };

  // Actions: Delete Notice
  const handleDeleteNotice = async (noticeId: string) => {
    if (!window.confirm('이 공지사항을 삭제하시겠습니까?')) return;
    try {
      await deleteDoc(doc(db, 'notices', noticeId));
    } catch (err) {
      console.error(err);
    }
  };

  // Actions: Reports Moderation
  const handleResolveReport = async (reportId: string) => {
    await updateReportStatus(reportId, 'resolved');
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
    alert('신고 처리가 완료되었습니다.');
  };

  const handleDismissReport = async (reportId: string) => {
    await updateReportStatus(reportId, 'dismissed');
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'dismissed' } : r));
    alert('신고가 기각(정상 콘텐츠) 처리되었습니다.');
  };

  const handleBlockUserFromReport = (targetUserId: string) => {
    if (!window.confirm(`'${targetUserId}' 사용자를 차단하시겠습니까?`)) return;
    blockUser(targetUserId);
    alert(`'${targetUserId}' 사용자가 차단되었습니다.`);
  };

  const handleDeleteReportedContent = async (report: ContentReport) => {
    if (!window.confirm(`신고된 콘텐츠(${report.targetContent || report.targetId})를 즉시 삭제하시겠습니까?`)) return;
    try {
      if (report.targetType === 'meetup') {
        await deleteDoc(doc(db, 'meetups', report.targetId));
        setMeetups(prev => prev.filter(m => m.id !== report.targetId));
      } else if (report.targetType === 'post') {
        await deleteDoc(doc(db, 'posts', report.targetId));
        setPosts(prev => prev.filter(p => p.id !== report.targetId));
      }
      await updateReportStatus(report.id, 'resolved');
      setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'resolved' } : r));
      alert('콘텐츠가 삭제되고 신고가 처리 완료되었습니다.');
    } catch (e) {
      console.error(e);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="admin-root">
      {/* Header */}
      <header className="admin-header">
        <div className="admin-header-title">
          <Shield size={24} color="#FF9E58" />
          <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>WalWal 관리자 모드</h2>
          <span className="admin-badge">SUPER ADMIN</span>
        </div>

        <button className="admin-exit-btn" onClick={onClose}>
          <LogOut size={20} />
        </button>
      </header>

      {/* Tabs */}
      <nav className="admin-tabs">
        <button
          className={`admin-tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => { setActiveTab('overview'); setSearchQuery(''); }}
        >
          <span>대시보드</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'dogs' ? 'active' : ''}`}
          onClick={() => { setActiveTab('dogs'); setSearchQuery(''); }}
        >
          <Users size={16} />
          <span>가입자 정보</span>
          <span className="admin-tab-count">{subscribers.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'posts' ? 'active' : ''}`}
          onClick={() => { setActiveTab('posts'); setSearchQuery(''); }}
        >
          <Image size={16} />
          <span>피드</span>
          <span className="admin-tab-count">{posts.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'meetups' ? 'active' : ''}`}
          onClick={() => { setActiveTab('meetups'); setSearchQuery(''); }}
        >
          <Calendar size={16} />
          <span>산책 모임</span>
          <span className="admin-tab-count">{meetups.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'notices' ? 'active' : ''}`}
          onClick={() => { setActiveTab('notices'); setSearchQuery(''); }}
        >
          <Bell size={16} />
          <span>공지사항</span>
          <span className="admin-tab-count">{notices.length}</span>
        </button>

        <button
          className={`admin-tab-btn ${activeTab === 'reports' ? 'active' : ''}`}
          onClick={() => { setActiveTab('reports'); setSearchQuery(''); }}
        >
          <AlertTriangle size={16} />
          <span>신고 관리</span>
          {reports.filter(r => r.status === 'pending').length > 0 && (
            <span className="admin-tab-count" style={{ background: '#EF4444', color: '#fff' }}>
              {reports.filter(r => r.status === 'pending').length}
            </span>
          )}
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="admin-content">
        {/* Tab 1: Overview Dashboard */}
        {activeTab === 'overview' && (
          <div>
            <div className="admin-stats-grid">
              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(255, 179, 32, 0.15)', color: '#FF9E58' }}>
                  <Users size={24} />
                </div>
                <div>
                  <div className="admin-stat-val">
                    {subscribers.length}명 <span style={{ fontSize: '13px', color: '#c8c8c8', fontWeight: 500 }}>({dogs.length}마리)</span>
                  </div>
                  <div className="admin-stat-label">총 가입자(보호자) 수</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(46, 196, 182, 0.15)', color: '#2EC4B6' }}>
                  <Image size={24} />
                </div>
                <div>
                  <div className="admin-stat-val">{posts.length}</div>
                  <div className="admin-stat-label">등록 피드/스냅스</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                  <Calendar size={24} />
                </div>
                <div>
                  <div className="admin-stat-val">{meetups.length}</div>
                  <div className="admin-stat-label">개설된 산책 모임</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#A855F7' }}>
                  <Bell size={24} />
                </div>
                <div>
                  <div className="admin-stat-val">{notices.length}</div>
                  <div className="admin-stat-label">등록된 시스템 공지</div>
                </div>
              </div>

              <div className="admin-stat-card">
                <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444' }}>
                  <AlertTriangle size={24} />
                </div>
                <div>
                  <div className="admin-stat-val">
                    {reports.length}건 <span style={{ fontSize: '13px', color: '#EF4444', fontWeight: 600 }}>({reports.filter(r => r.status === 'pending').length} 대기)</span>
                  </div>
                  <div className="admin-stat-label">접수된 신고 건수</div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{ background: '#000', border: '1px solid #334155', borderRadius: '16px', padding: '20px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 12px 0' }}>💡 관리자 안내 & 빠른 조치</h3>
              <p style={{ fontSize: '13px', color: '#c8c8c8', lineHeight: 1.5, margin: 0 }}>
                • <strong>가입 반려견 관리</strong>: 부적절한 닉네임, 프로필 사진, 비방성 인사말을 실시간으로 수정하거나 삭제할 수 있습니다.<br />
                • <strong>게시물 검수</strong>: 음란물, 광고, 스팸 게시물 및 영상을 즉시 영구 삭제하여 서비스를 안전하게 유지합니다.<br />
                • <strong>공지 등록</strong>: 긴급 점검이나 업데이트 소식을 등록하면 사용자 앱 상단에 안내 배너가 표시됩니다.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Subscribers & Dogs Management */}
        {activeTab === 'dogs' && (
          <div>
            <div className="admin-toolbar">
              <input
                type="text"
                className="admin-search-input"
                placeholder="가입자 이메일, 보호자명, 반려견 이름 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-list">
              {filteredSubscribers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  등록된 가입자 정보가 없습니다.
                </div>
              ) : (
                filteredSubscribers.map(sub => {
                  const activeDogId = selectedDogPerSub[sub.id];
                  const activeDog = sub.dogs.find(d => d.id === activeDogId);

                  return (
                    <div key={sub.id} className="admin-subscriber-card">
                      {/* Subscriber Header */}
                      <div className="admin-subscriber-header">
                        <div className="admin-subscriber-info">
                          <div className="admin-subscriber-email-row">
                            <span className="admin-subscriber-email">{sub.email}</span>
                            <span className="admin-subscriber-count-badge">보호견 {sub.dogs.length}마리</span>
                          </div>
                          <div className="admin-subscriber-meta">
                            <span>보호자: <strong style={{ color: '#E2E8F0' }}>{sub.ownerName}</strong></span>
                            <span>·</span>
                            <span>가입일자: {sub.joinedAt}</span>
                          </div>
                        </div>

                        <div className="admin-subscriber-actions">
                          <button
                            type="button"
                            className="admin-action-btn delete"
                            title="가입자 및 등록견 일괄 삭제"
                            onClick={() => handleDeleteSubscriber(sub)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>

                      {/* Dog Chips Row */}
                      <div className="admin-subscriber-dogs-chips">
                        {sub.dogs.map((dog, idx) => {
                          const isSelected = activeDogId === dog.id;
                          return (
                            <button
                              key={dog.id}
                              type="button"
                              className={`admin-dog-chip ${isSelected ? 'active' : ''}`}
                              onClick={() => {
                                setSelectedDogPerSub(prev => ({
                                  ...prev,
                                  [sub.id]: isSelected ? '' : dog.id
                                }));
                              }}
                            >
                              <img src={dog.avatar} alt={dog.name} className="admin-dog-chip-avatar" />
                              <span className="admin-dog-chip-text">
                                <strong style={{ color: '#F8FAFC' }}>{dog.name}</strong> ({dog.breed || '견종미지정'})
                              </span>
                              <ChevronDown size={14} className={`admin-dog-chip-arrow ${isSelected ? 'rotated' : ''}`} />
                            </button>
                          );
                        })}
                      </div>

                      {/* Expanded Dog Details if selected */}
                      {activeDog && (
                        <div className="admin-subscriber-dog-details">
                          <div className="admin-item-left">
                            <img src={activeDog.avatar} alt={activeDog.name} className="admin-avatar" />
                            <div className="admin-item-info">
                              <div className="admin-item-title">
                                <span>{activeDog.name}</span>
                                <span style={{ fontSize: '11px', color: '#c8c8c8', fontWeight: 400 }}>ID: {activeDog.id}</span>
                              </div>
                              <div className="admin-item-meta">
                                {activeDog.breed || '미지정'} · {activeDog.age || '1'}살 · {activeDog.gender === 'female' ? '여아' : '남아'}
                              </div>
                              {activeDog.greeting && (
                                <div className="admin-item-text">"{activeDog.greeting}"</div>
                              )}
                              {activeDog.personality && activeDog.personality.length > 0 && (
                                <div className="admin-dog-tags">
                                  {activeDog.personality.map((tag: string, i: number) => (
                                    <span key={i} className="admin-dog-tag">{tag}</span>
                                  ))}
                                </div>
                              )}
                              {activeDog.lat && activeDog.lng && (
                                <div style={{ fontSize: '11px', color: '#2EC4B6', marginTop: '4px' }}>
                                  📍 좌표: {activeDog.lat.toFixed(4)}, {activeDog.lng.toFixed(4)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div>
                            <button
                              className="admin-action-btn"
                              title="보호견 정보 수정"
                              onClick={() => {
                                setEditingDog(activeDog);
                                setEditName(activeDog.name || '');
                                setEditBreed(activeDog.breed || '');
                                setEditGreeting(activeDog.greeting || '');
                              }}
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              className="admin-action-btn delete"
                              title="보호견 삭제"
                              onClick={() => handleDeleteDog(activeDog)}
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 3: Posts Moderation */}
        {activeTab === 'posts' && (
          <div>
            <div className="admin-toolbar">
              <input
                type="text"
                className="admin-search-input"
                placeholder="게시물 내용, 작성자 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-list">
              {filteredPosts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  등록된 게시물이 없습니다.
                </div>
              ) : (
                filteredPosts.map(post => (
                  <div key={post.id} className="admin-item-card">
                    <div className="admin-item-left">
                      {(post.image || post.poster || post.avatar) && (
                        <img
                          src={post.poster || post.image || post.avatar}
                          alt="post"
                          style={{ width: '64px', height: '64px', borderRadius: '10px', objectFit: 'cover', flexShrink: 0 }}
                        />
                      )}
                      <div className="admin-item-info">
                        <div className="admin-item-title">
                          <span>{post.name || post.authorName || '익명'}</span>
                          <span style={{ fontSize: '11px', color: '#c8c8c8', fontWeight: 400 }}>{post.time || '최근'}</span>
                        </div>
                        <div className="admin-item-text">
                          {post.recentThought || post.thought || post.text || post.caption || '(대사 없음)'}
                        </div>
                        <div className="admin-item-meta">
                          좋아요 {post.likes || 0} · 댓글 {(post.comments || []).length}
                        </div>
                      </div>
                    </div>

                    <button
                      className="admin-action-btn delete"
                      onClick={() => handleDeletePost(post)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 4: Meetups Management */}
        {activeTab === 'meetups' && (
          <div>
            <div className="admin-toolbar">
              <input
                type="text"
                className="admin-search-input"
                placeholder="모임명, 장소, 호스트 검색..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="admin-list">
              {filteredMeetups.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                  개설된 산책 모임이 없습니다.
                </div>
              ) : (
                filteredMeetups.map(meetup => {
                  const statusInfo = getMeetupDynamicStatus(meetup);
                  return (
                    <div key={meetup.id} className="admin-item-card">
                      <div className="admin-item-left">
                        <div className="admin-item-info">
                          <div className="admin-item-title">
                            <span>{meetup.title || '산책 모임'}</span>
                            <span style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              background: statusInfo.isPast ? '#333' : '#0284C7',
                              color: '#FFFFFF',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              letterSpacing: '0.2px'
                            }}>
                              {statusInfo.labelKo}
                            </span>
                          </div>
                          <div className="admin-item-meta">
                            장소: {meetup.location || '미정'} · 일시: {formatMeetupDisplay(meetup, 'ko')} · 호스트: {meetup.hostOwner || meetup.hostDog || meetup.hostName || '미등록'}
                          </div>
                          <div className="admin-item-text">
                            참가자 {(meetup.participants || []).length}명
                          </div>
                        </div>
                      </div>

                      <button
                        className="admin-action-btn delete"
                        onClick={() => handleDeleteMeetup(meetup)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 5: Notices Management */}
        {activeTab === 'notices' && (
          <div>
            {/* Add Notice Box */}
            <div className='row-column'>
              <h4>신규 공지사항 등록</h4>
              <input
                type="text"
                placeholder="공지 제목 (예: [공지] 서버 정기 점검 안내)"
                value={newNoticeTitle}
                onChange={e => setNewNoticeTitle(e.target.value)}
              />
              <textarea
                rows={3}
                placeholder="공지 내용..."
                value={newNoticeBody}
                onChange={e => setNewNoticeBody(e.target.value)}
              />
              <div className="admin-action-footer">
                <button
                  className="admin-action-btn confirm"
                  onClick={handleAddNotice}
                >
                  공지 등록하기
                </button>
              </div>
            </div>

            {/* Existing Notices List */}
            <div className="admin-list">
              {notices.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#64748B' }}>
                  등록된 공지사항이 없습니다.
                </div>
              ) : (
                notices.map(notice => (
                  <div key={notice.id} className="admin-item-card">
                    <div className="admin-item-info">
                      <div className="admin-item-title">
                        <span>{notice.title}</span>
                      </div>
                      <div className="admin-item-text">{notice.body}</div>
                    </div>
                    <button
                      className="admin-action-btn delete"
                      onClick={() => handleDeleteNotice(notice.id)}
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Tab 6: Reports Management */}
        {activeTab === 'reports' && (
          <div>
            <div className="admin-list-header">
              <h3>접수된 부적절 콘텐츠 및 사용자 신고 ({reports.length}건)</h3>
            </div>

            <div className="admin-list">
              {reports.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B', background: '#111', borderRadius: '12px', border: '1px solid #000' }}>
                  <Check size={32} color="#10B981" style={{ marginBottom: '8px' }} />
                  <p style={{ margin: 0, fontWeight: 600 }}>접수된 신고가 없습니다. 깨끗한 커뮤니티 상태입니다!</p>
                </div>
              ) : (
                reports.map(report => (
                  <div
                    key={report.id}
                    className="admin-item-card"
                    style={{
                      borderLeft: report.status === 'pending' ? '4px solid #EF4444' : '4px solid #10B981',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                      padding: '16px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span
                          style={{
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: 700,
                            background: report.targetType === 'meetup' ? '#3B82F6' : report.targetType === 'post' ? '#8B5CF6' : report.targetType === 'chat' ? '#F59E0B' : '#EC4899',
                            color: '#fff'
                          }}
                        >
                          {report.targetType === 'meetup' ? '산책모임' : report.targetType === 'post' ? '스냅피드' : report.targetType === 'chat' ? '채팅' : '댓글'}
                        </span>
                        <span style={{ fontWeight: 700, fontSize: '15px', color: '#F8FAFC' }}>
                          대상: {report.targetAuthor || report.targetId}
                        </span>
                        <span
                          style={{
                            padding: '2px 6px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: 600,
                            background: report.status === 'pending' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
                            color: report.status === 'pending' ? '#EF4444' : '#10B981'
                          }}
                        >
                          {report.status === 'pending' ? '대기 중' : report.status === 'resolved' ? '처리 완료' : '기각'}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: '#c8c8c8' }}>
                        {report.reportedAt ? new Date(report.reportedAt).toLocaleString() : ''}
                      </span>
                    </div>

                    <div style={{ background: '#111', padding: '10px 14px', borderRadius: '8px', border: '1px solid #000' }}>
                      <div style={{ fontSize: '13px', color: '#EF4444', fontWeight: 700, marginBottom: '4px' }}>
                        사유: {report.reasonText}
                      </div>
                      {report.targetContent && (
                        <div style={{ fontSize: '12px', color: '#c8c8c8' }}>
                          내용 요약: "{report.targetContent}"
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleBlockUserFromReport(report.targetAuthor || report.targetId)}
                        style={{
                          padding: '6px 12px',
                          borderRadius: '6px',
                          border: '1px solid #333',
                          background: '#000',
                          color: '#CBD5E1',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer'
                        }}
                      >
                        사용자 차단
                      </button>

                      {(report.targetType === 'meetup' || report.targetType === 'post') && (
                        <button
                          type="button"
                          onClick={() => handleDeleteReportedContent(report)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#DC2626',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer'
                          }}
                        >
                          콘텐츠 즉시 삭제
                        </button>
                      )}

                      {report.status === 'pending' && (
                        <>
                          <button
                            type="button"
                            onClick={() => handleDismissReport(report.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: '1px solid #334155',
                              background: 'transparent',
                              color: '#c8c8c8',
                              fontSize: '12px',
                              cursor: 'pointer'
                            }}
                          >
                            기각 (정상)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleResolveReport(report.id)}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              border: 'none',
                              background: '#10B981',
                              color: '#fff',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer'
                            }}
                          >
                            처리 완료
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* Edit Dog Modal */}
      {editingDog && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal" style={{ maxWidth: '440px', textAlign: 'left' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>반려견 정보 수정</h3>
              <button onClick={() => setEditingDog(null)} className="btn-ghost" style={{ color: '#c8c8c8' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#c8c8c8', display: 'block', marginBottom: '4px' }}>반려견 이름</label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{ width: '100%', background: '#111', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c8c8c8', display: 'block', marginBottom: '4px' }}>견종</label>
                <input
                  type="text"
                  value={editBreed}
                  onChange={e => setEditBreed(e.target.value)}
                  style={{ width: '100%', background: '#111', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#fff' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '12px', color: '#c8c8c8', display: 'block', marginBottom: '4px' }}>한마디 (인사말)</label>
                <textarea
                  rows={2}
                  value={editGreeting}
                  onChange={e => setEditGreeting(e.target.value)}
                  style={{ width: '100%', background: '#111', border: '1px solid #334155', borderRadius: '8px', padding: '8px 12px', color: '#fff', resize: 'vertical' }}
                />
              </div>
            </div>

            <div className="admin-modal-btns" style={{ marginTop: '20px' }}>
              <button className="admin-btn-cancel" onClick={() => setEditingDog(null)}>
                취소
              </button>
              <button className="admin-btn-confirm" onClick={handleSaveEditDog}>
                수정 완료
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminView;
