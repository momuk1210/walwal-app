import { db } from '../firebase';
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

export const saveDogProfile = async (userId: string, profile: DogProfile) => {
  const docRef = doc(db, 'users', userId, 'dogs', profile.id);
  await setDoc(docRef, {
    ...profile,
    updatedAt: serverTimestamp()
  }, { merge: true });
};

export const getDogProfiles = async (userId: string): Promise<DogProfile[]> => {
  const q = query(collection(db, 'users', userId, 'dogs'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as DogProfile);
};

export const getAllDogs = async (): Promise<DogProfile[]> => {
  const q = query(collection(db, 'dogs'));
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
}

export const createFeedPost = async (post: FeedPostData) => {
  const postRef = doc(collection(db, 'posts'));
  await setDoc(postRef, {
    ...post,
    id: postRef.id,
    createdAt: serverTimestamp()
  });
  return postRef.id;
};

export const getFeedPosts = async (): Promise<FeedPostData[]> => {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as FeedPostData);
};

export const updateFeedPost = async (postId: string, updates: Partial<FeedPostData>) => {
  const postRef = doc(db, 'posts', postId);
  await updateDoc(postRef, updates);
};

export const deleteFeedPost = async (postId: string) => {
  const postRef = doc(db, 'posts', postId);
  await deleteDoc(postRef);
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
  const q = query(collection(db, 'meetups'), orderBy('createdAt', 'desc'));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => doc.data() as MeetupData);
};

export const createMeetup = async (meetup: MeetupData) => {
  const meetupRef = doc(collection(db, 'meetups'));
  await setDoc(meetupRef, {
    ...meetup,
    id: meetupRef.id,
    createdAt: serverTimestamp()
  });
  return meetupRef.id;
};
