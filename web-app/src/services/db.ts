import { db, storage, auth, COLLECTIONS } from '../firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getMedia } from '../utils/mediaStore';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import type { DogProfile } from '../data/mockDogs';

// =======================
// Dog Profiles
// =======================

export const saveDogProfile = async (profile: DogProfile, userId?: string) => {
  if (!profile.id) return;
  const currentEmail = auth.currentUser?.email || (typeof localStorage !== 'undefined' ? localStorage.getItem('WALWAL_USER_EMAIL') : '') || '';
  const cleanData: any = {
    id: profile.id,
    name: profile.name || '',
    breed: profile.breed || '',
    age: profile.age ? String(profile.age).replace(/[^0-9]/g, '') : '1',
    gender: profile.gender || 'male',
    ownerName: profile.ownerName || '',
    ownerEmail: profile.ownerEmail || currentEmail || 'daisynara@gmail.com',
    joinedAt: profile.joinedAt || '2026.09.15',
    avatar: profile.avatar || '',
    personality: profile.personality || [],
    greeting: profile.greeting || '',
    adoptionDate: profile.adoptionDate || '',
    lat: profile.lat ?? 37.4200,
    lng: profile.lng ?? 127.1267,
    walkDistance: profile.walkDistance || 0,
    walkMinutes: profile.walkMinutes || 0,
    updatedAt: serverTimestamp()
  };
  if (userId) cleanData.userId = userId;

  try {
    await setDoc(doc(db, COLLECTIONS.DOGS, profile.id), cleanData, { merge: true });
    if (userId) {
      await setDoc(doc(db, 'users', userId, 'dogs', profile.id), cleanData, { merge: true });
    }
  } catch (err) {
    console.warn('Failed to save dog profile to Firestore:', err);
  }
};

export const deleteDogProfile = async (dogId: string, userId?: string) => {
  if (!dogId) return;
  try {
    await deleteDoc(doc(db, COLLECTIONS.DOGS, dogId));
    if (userId) {
      await deleteDoc(doc(db, 'users', userId, 'dogs', dogId));
    }
  } catch (err) {
    console.warn('Failed to delete dog profile from Firestore:', err);
  }
};

export const getDogProfiles = async (userId: string): Promise<DogProfile[]> => {
  const q = query(collection(db, 'users', userId, 'dogs'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as DogProfile);
};

export const getAllDogs = async (): Promise<DogProfile[]> => {
  const q = query(collection(db, COLLECTIONS.DOGS));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as DogProfile);
};

// =======================
// Feed Posts
// =======================

export interface FeedPostData {
  id?: string;
  name: string;
  avatar: string;
  time: string;
  image?: string;
  text: string;
  likes: number;
  comments: any[];
  shares: number;
  liked: boolean;
  isOwner?: boolean;
  createdAt?: any;
  recentThought?: string;
}

export const createFeedPost = async (post: FeedPostData) => {
  const postRef = doc(collection(db, COLLECTIONS.POSTS));
  await setDoc(postRef, {
    ...post,
    id: postRef.id,
    createdAt: serverTimestamp()
  });
  return postRef.id;
};

export const getFeedPosts = async (): Promise<FeedPostData[]> => {
  const q = query(collection(db, COLLECTIONS.POSTS), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FeedPostData);
};

export const updateFeedPost = async (postId: string, updates: Partial<FeedPostData>) => {
  const postRef = doc(db, COLLECTIONS.POSTS, postId);
  await updateDoc(postRef, updates);
};

export const deleteFeedPost = async (postId: string) => {
  const postRef = doc(db, COLLECTIONS.POSTS, postId);
  try {
    await updateDoc(postRef, {
      isDeleted: true,
      deletedAt: serverTimestamp()
    });
  } catch (e) { }
  await deleteDoc(postRef);
};

// =======================
// Global Array Sync for Prototype
// =======================

export const syncGlobalFeedPosts = async (posts: any[]) => {
  // Legacy function: We no longer sync the entire array.
  // Kept to avoid breaking older references, but it does nothing now.
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

export const syncSinglePost = async (post: any) => {
  try {
    const finalPost = cleanForFirestore({
      ...post,
      createdAt: null
    });
    delete finalPost.createdAt;

    // Save to the `posts` collection
    const postRef = doc(db, COLLECTIONS.POSTS, post.id);
    await setDoc(postRef, {
      ...finalPost,
      createdAt: serverTimestamp()
    });
    console.log('Successfully synced single post to Firestore:', post.id);
  } catch (e) {
    console.error('Failed to sync single post to Firestore', e);
  }
};

export const getGlobalFeedPosts = async (): Promise<any[] | null> => {
  try {
    const docRef = doc(db, 'system', 'global_feed');
    const snapshot = await getDoc(docRef);
    if (snapshot.exists()) {
      return snapshot.data().posts || [];
    }
  } catch (e) {
    console.error('Failed to get from Firestore, falling back to local', e);
  }
  return null;
};

// =======================
// Meetups (Radar View)
// =======================

export interface MeetupData {
  id?: string;
  title: string;
  location: string;
  time: string;
  tag: string;
  hostDog: string;
  hostOwner: string;
  participantsCount: number;
  participants: DogProfile[];
  createdAt?: any;
}

export const getMeetups = async (): Promise<MeetupData[]> => {
  const q = query(collection(db, COLLECTIONS.MEETUPS), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as MeetupData);
};

export const createMeetup = async (meetup: MeetupData) => {
  const meetupRef = doc(collection(db, COLLECTIONS.MEETUPS));
  await setDoc(meetupRef, {
    ...meetup,
    id: meetupRef.id,
    createdAt: serverTimestamp()
  });
  return meetupRef.id;
};

export const syncMeetupToFirestore = async (meetup: any) => {
  if (!meetup.id) return;
  try {
    const cleanMeetup = cleanForFirestore({
      ...meetup,
      updatedAt: serverTimestamp()
    });
    await setDoc(doc(db, COLLECTIONS.MEETUPS, meetup.id), cleanMeetup, { merge: true });
  } catch (err) {
    console.warn('Failed to sync meetup to Firestore:', err);
  }
};

// =======================
// =======================
// User Accounts & Subscribers
// =======================

export interface AppUserData {
  id?: string;
  email: string;
  ownerName?: string;
  displayName?: string;
  role?: 'admin' | 'user';
  provider?: string;
  dogs?: string[];
  createdAt?: any;
  lastLoginAt?: any;
}

export const syncUserToFirestore = async (userData: AppUserData) => {
  if (!userData.email) return;
  const cleanEmail = userData.email.toLowerCase().trim();
  const docId = cleanEmail.replace(/[^a-z0-9@._-]/g, '_');
  try {
    const dataToSet: any = {
      id: docId,
      email: cleanEmail,
      ownerName: userData.ownerName || cleanEmail.split('@')[0],
      role: userData.role || (cleanEmail.includes('daisynara') ? 'admin' : 'user'),
      updatedAt: serverTimestamp()
    };
    if (userData.provider) dataToSet.provider = userData.provider;
    if (userData.lastLoginAt) dataToSet.lastLoginAt = userData.lastLoginAt;
    await setDoc(doc(db, COLLECTIONS.USERS, docId), dataToSet, { merge: true });
    // Also sync to app_users for backward compatibility
    await setDoc(doc(db, 'app_users', docId), {
      email: cleanEmail,
      updatedAt: serverTimestamp()
    }, { merge: true });
  } catch (err) {
    console.warn('Failed to sync user to Firestore:', err);
  }
};

export const registerAppUser = async (email: string, passwordHash: string) => {
  const cleanEmail = email.toLowerCase().trim();
  const docId = cleanEmail.replace(/[^a-z0-9]/g, '_');
  try {
    await setDoc(doc(db, 'app_users', docId), {
      email: cleanEmail,
      password: passwordHash,
      createdAt: serverTimestamp()
    }, { merge: true });
    await syncUserToFirestore({
      email: cleanEmail,
      ownerName: cleanEmail.split('@')[0],
      role: cleanEmail.includes('daisynara') ? 'admin' : 'user'
    });
  } catch (e) {
    console.warn('registerAppUser cloud fallback note:', e);
  }
};

export const verifyAppUser = async (email: string, inputPw: string): Promise<boolean> => {
  const cleanEmail = email.toLowerCase().trim();
  const docId = cleanEmail.replace(/[^a-z0-9]/g, '_');
  try {
    const snap = await getDoc(doc(db, 'app_users', docId));
    if (snap.exists()) {
      const data = snap.data();
      return data?.password === inputPw;
    }
  } catch (e) {
    console.warn('verifyAppUser cloud check note:', e);
  }
  return false;
};


