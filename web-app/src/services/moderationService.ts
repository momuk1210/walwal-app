import { db, auth, COLLECTIONS } from '../firebase';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  updateDoc
} from 'firebase/firestore';

export interface ContentReport {
  id: string;
  targetType: 'post' | 'meetup' | 'comment' | 'chat';
  targetId: string;
  targetAuthor: string;
  targetContent: string;
  reason: 'spam' | 'abuse' | 'inappropriate' | 'harassment' | 'other';
  reasonText: string;
  reportedBy: string;
  reportedAt: number;
  status: 'pending' | 'resolved' | 'dismissed';
}

const STORAGE_BLOCKED_KEY = 'WALWAL_BLOCKED_USERS';
const STORAGE_REPORTS_KEY = 'WALWAL_REPORTS';

/**
 * 1. 차단된 사용자 관리 (Block)
 */
export const getBlockedUsers = (): string[] => {
  try {
    const raw = localStorage.getItem(STORAGE_BLOCKED_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map(s => String(s).trim().toLowerCase());
    }
  } catch (e) {}
  return [];
};

export const isUserBlocked = (userIdOrName?: string): boolean => {
  if (!userIdOrName) return false;
  const clean = String(userIdOrName).trim().toLowerCase();
  if (!clean) return false;
  const blockedList = getBlockedUsers();
  return blockedList.includes(clean);
};

export const blockUser = async (userIdOrName: string, reason?: string): Promise<void> => {
  if (!userIdOrName) return;
  const clean = String(userIdOrName).trim().toLowerCase();
  if (!clean) return;

  const currentList = getBlockedUsers();
  if (!currentList.includes(clean)) {
    currentList.push(clean);
    localStorage.setItem(STORAGE_BLOCKED_KEY, JSON.stringify(currentList));
    window.dispatchEvent(new CustomEvent('walwal_blocked_users_updated', { detail: { blockedUser: clean } }));
  }

  // Firestore 사용자별 차단 목록에도 백업 동기화 (로그인 시)
  const currentUid = auth.currentUser?.uid;
  if (currentUid) {
    try {
      await setDoc(doc(db, 'users', currentUid, 'blockedUsers', clean), {
        blockedTarget: clean,
        reason: reason || '사용자 직접 차단',
        blockedAt: serverTimestamp()
      });
    } catch (e) {
      console.warn('Failed to sync blocked user to firestore:', e);
    }
  }
};

export const unblockUser = async (userIdOrName: string): Promise<void> => {
  if (!userIdOrName) return;
  const clean = String(userIdOrName).trim().toLowerCase();
  const currentList = getBlockedUsers().filter(u => u !== clean);
  localStorage.setItem(STORAGE_BLOCKED_KEY, JSON.stringify(currentList));
  window.dispatchEvent(new CustomEvent('walwal_blocked_users_updated', { detail: { unblockedUser: clean } }));

  const currentUid = auth.currentUser?.uid;
  if (currentUid) {
    try {
      await deleteDoc(doc(db, 'users', currentUid, 'blockedUsers', clean));
    } catch (e) {
      console.warn('Failed to delete blocked user from firestore:', e);
    }
  }
};

/**
 * 2. 콘텐츠 신고 접수 (Report)
 */
export const reportContent = async (params: {
  targetType: 'post' | 'meetup' | 'comment' | 'chat';
  targetId: string;
  targetAuthor: string;
  targetContent: string;
  reason: 'spam' | 'abuse' | 'inappropriate' | 'harassment' | 'other';
  reasonText: string;
  blockAuthorAlso?: boolean;
}): Promise<void> => {
  const reportId = `report-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const currentUser = auth.currentUser;
  const reporterEmail = currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || 'guest';

  const reportData: ContentReport = {
    id: reportId,
    targetType: params.targetType,
    targetId: params.targetId,
    targetAuthor: params.targetAuthor || 'Unknown',
    targetContent: (params.targetContent || '').substring(0, 300), // 최대 300자 요약
    reason: params.reason,
    reasonText: params.reasonText,
    reportedBy: reporterEmail,
    reportedAt: Date.now(),
    status: 'pending'
  };

  // 1) LocalStorage 캐싱
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    const list: ContentReport[] = raw ? JSON.parse(raw) : [];
    list.unshift(reportData);
    localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(list.slice(0, 100)));
  } catch (e) {}

  // 2) Firestore reports 컬렉션 저장
  try {
    await setDoc(doc(db, COLLECTIONS.REPORTS, reportId), {
      ...reportData,
      createdAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Failed to save report to firestore:', e);
  }

  // 3) 옵션: 작성자 동시 차단 요청 시 즉시 차단
  if (params.blockAuthorAlso && params.targetAuthor) {
    await blockUser(params.targetAuthor, `신고로 인한 자동 차단 (${params.reasonText})`);
  }
};

/**
 * 3. 관리자 신고 목록 조회
 */
export const getAdminReports = async (): Promise<ContentReport[]> => {
  try {
    const q = query(collection(db, COLLECTIONS.REPORTS), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    if (!snap.empty) {
      return snap.docs.map(d => ({ id: d.id, ...d.data() } as ContentReport));
    }
  } catch (e) {
    console.warn('Failed to fetch reports from firestore, falling back to local:', e);
  }

  // fallback to local
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}

  return [];
};

/**
 * 4. 관리자 신고 상태 변경 및 대상 처리
 */
export const updateReportStatus = async (
  reportId: string,
  newStatus: 'resolved' | 'dismissed'
): Promise<void> => {
  try {
    await updateDoc(doc(db, COLLECTIONS.REPORTS, reportId), {
      status: newStatus,
      updatedAt: serverTimestamp()
    });
  } catch (e) {
    console.warn('Failed to update report status in firestore:', e);
  }

  // local cache update
  try {
    const raw = localStorage.getItem(STORAGE_REPORTS_KEY);
    if (raw) {
      const list: ContentReport[] = JSON.parse(raw);
      const updated = list.map(r => r.id === reportId ? { ...r, status: newStatus } : r);
      localStorage.setItem(STORAGE_REPORTS_KEY, JSON.stringify(updated));
    }
  } catch (e) {}
};
