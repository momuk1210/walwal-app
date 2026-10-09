import { db } from '../firebase';
import { doc, setDoc, getDocs, collection, query, orderBy } from 'firebase/firestore';
import { saveMedia, getMedia, blobCache } from '../utils/mediaStore';

const CHUNK_SIZE = 400 * 1024; // 400KB base64 chunk size (well under 1MB Firestore doc limit)

/**
 * Convert Blob to Base64 data string (without prefix)
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1] || '';
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert Base64 string back to Blob
 */
export const base64ToBlob = (base64: string, mimeType: string = 'video/webm'): Blob => {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
};

/**
 * Upload Video Blob to Firestore subcollection in ~400KB chunks
 * Available to any authenticated or guest client across devices
 */
export const uploadVideoToCloud = async (
  postId: string,
  blob: Blob
): Promise<{ success: boolean; totalChunks: number; mimeType: string }> => {
  try {
    const mimeType = blob.type || 'video/webm';
    const base64 = await blobToBase64(blob);
    const totalChunks = Math.ceil(base64.length / CHUNK_SIZE);

    for (let i = 0; i < totalChunks; i++) {
      const chunkData = base64.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
      const chunkRef = doc(db, 'posts', postId, 'media_chunks', `chunk_${i}`);
      await setDoc(chunkRef, {
        index: i,
        totalChunks,
        mimeType,
        data: chunkData
      });
    }

    return { success: true, totalChunks, mimeType };
  } catch (err) {
    console.warn('Failed to upload video chunks to Firestore:', err);
    return { success: false, totalChunks: 0, mimeType: blob.type || 'video/webm' };
  }
};

/**
 * Download Video from Firestore chunks, reconstruct Blob, and cache locally
 */
export const downloadVideoFromCloud = async (postId: string): Promise<Blob | null> => {
  try {
    const chunksRef = collection(db, 'posts', postId, 'media_chunks');
    const q = query(chunksRef, orderBy('index', 'asc'));
    const snap = await getDocs(q);

    if (snap.empty) return null;

    let fullBase64 = '';
    let mimeType = 'video/webm';

    snap.forEach(docSnap => {
      const d = docSnap.data();
      fullBase64 += d.data;
      if (d.mimeType) mimeType = d.mimeType;
    });

    if (!fullBase64) return null;

    const blob = base64ToBlob(fullBase64, mimeType);

    // Cache in local IndexedDB so future reads on this device are instant and offline-ready
    await saveMedia(postId, blob);
    blobCache.set(postId, blob);
    blobCache.set(`indexeddb:${postId}`, blob);

    return blob;
  } catch (err) {
    console.warn(`Failed to download video chunks for ${postId}:`, err);
    return null;
  }
};

/**
 * Ensure a post's video is playable, resolving from memory, IndexedDB, or Cloud
 */
export const ensureVideoPlayable = async (post: any): Promise<string | null> => {
  if (!post) return null;

  // 1. If feedImage is already a valid playable URL
  if (post.feedImage && typeof post.feedImage === 'string' && (post.feedImage.startsWith('blob:') || (post.feedImage.startsWith('http') && !post.feedImage.includes('firebasestorage')))) {
    return post.feedImage;
  }

  // 2. Check in-memory blob cache
  if (post.id && blobCache.has(post.id)) {
    const b = blobCache.get(post.id)!;
    return URL.createObjectURL(b);
  }
  if (post.feedImage && blobCache.has(post.feedImage)) {
    const b = blobCache.get(post.feedImage)!;
    return URL.createObjectURL(b);
  }
  if (post.originalFeedImage && blobCache.has(post.originalFeedImage)) {
    const b = blobCache.get(post.originalFeedImage)!;
    return URL.createObjectURL(b);
  }

  // Extract ID if feedImage or originalFeedImage has 'indexeddb:post_xxx' format
  const sourceImage = post.originalFeedImage || post.feedImage || '';
  const mediaId = (typeof sourceImage === 'string' && sourceImage.startsWith('indexeddb:'))
    ? sourceImage.split(':')[1]
    : post.id;

  // 3. Check local IndexedDB
  if (mediaId) {
    try {
      const blob = await getMedia(mediaId);
      if (blob) {
        blobCache.set(mediaId, blob);
        blobCache.set(post.id, blob);
        return URL.createObjectURL(blob);
      }
    } catch (e) {
      console.warn('IndexedDB getMedia error:', e);
    }
  }

  // 4. Download from Firestore media_chunks (for other devices or new browsers)
  if (post.id) {
    try {
      const cloudBlob = await downloadVideoFromCloud(post.id);
      if (cloudBlob) {
        return URL.createObjectURL(cloudBlob);
      }
    } catch (e) {
      console.warn('Download from cloud failed for:', post.id, e);
    }
  }

  return null;
};

/**
 * Extract a poster thumbnail from video element or blob
 */
export const extractPosterFromVideo = (videoUrl: string): Promise<string | null> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    video.crossOrigin = 'anonymous';
    video.src = videoUrl;
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth || 480, 480);
        canvas.height = Math.min(video.videoHeight || 640, 640);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const posterData = canvas.toDataURL('image/jpeg', 0.8);
          resolve(posterData);
          return;
        }
      } catch (err) {
        console.warn('Failed to extract poster from video:', err);
      }
      resolve(null);
    };

    video.onerror = () => resolve(null);
    video.load();
  });
};
