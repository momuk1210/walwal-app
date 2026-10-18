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

    try {
      await setDoc(doc(db, 'posts', postId), {
        hasCloudMedia: true,
        isVideo: true
      }, { merge: true });
    } catch (e) {
      console.warn('Failed to set hasCloudMedia flag on post doc:', e);
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
    video.muted = true;
    video.playsInline = true;
    video.preload = 'auto';

    let resolved = false;
    const finish = (result: string | null) => {
      if (resolved) return;
      resolved = true;
      clearTimeout(timer);
      try {
        video.pause();
        video.removeAttribute('src');
        video.load();
      } catch (e) { }
      resolve(result);
    };

    const timer = setTimeout(() => {
      finish(null);
    }, 3000);

    const grab = () => {
      try {
        if (!video.videoWidth || !video.videoHeight) return false;
        const canvas = document.createElement('canvas');
        canvas.width = Math.min(video.videoWidth, 720);
        canvas.height = Math.round(canvas.width * (video.videoHeight / video.videoWidth));
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const posterData = canvas.toDataURL('image/jpeg', 0.85);
          if (posterData && posterData.length > 500) {
            finish(posterData);
            return true;
          }
        }
      } catch (err) {
        console.warn('Failed to extract poster from video:', err);
      }
      return false;
    };

    video.onloadeddata = () => {
      try {
        video.currentTime = 0.001;
      } catch (e) {
        grab();
      }
    };

    video.onseeked = () => {
      grab();
    };

    video.onerror = () => finish(null);
    video.src = videoUrl;
    video.load();
  });
};

/**
 * Rotate and crop video blob using Canvas & MediaRecorder
 * Produces a physically rotated video file & poster for smooth native playback
 */
export const rotateAndCropVideoBlob = async (
  videoSrc: string,
  sourceBlob: Blob | null,
  rotation: number,
  cropRatio: 'original' | '1:1' | '9:16' | '16:9' = 'original'
): Promise<{ videoBlob: Blob | null; posterDataUrl: string | null }> => {
  const normRot = ((rotation % 360) + 360) % 360;
  if (normRot === 0 && cropRatio === 'original') {
    return { videoBlob: sourceBlob, posterDataUrl: null };
  }

  return new Promise((resolve) => {
    let resolved = false;
    let cleanupVideo: (() => void) | null = null;
    let fallbackPoster: string | null = null;

    const finish = (result: { videoBlob: Blob | null; posterDataUrl: string | null }) => {
      if (resolved) return;
      resolved = true;
      if (cleanupVideo) cleanupVideo();
      resolve(result);
    };

    try {
      const video = document.createElement('video');
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = 'anonymous';

      let tempUrl = '';
      if (sourceBlob && !videoSrc.startsWith('blob:') && !videoSrc.startsWith('http')) {
        tempUrl = URL.createObjectURL(sourceBlob);
        video.src = tempUrl;
      } else {
        video.src = videoSrc;
      }

      cleanupVideo = () => {
        try {
          video.pause();
          video.removeAttribute('src');
          video.load();
          if (tempUrl) URL.revokeObjectURL(tempUrl);
        } catch (e) { }
      };

      // Hard safety timeout: if anything stalls, finish gracefully
      const globalTimeout = setTimeout(() => {
        finish({ videoBlob: sourceBlob, posterDataUrl: fallbackPoster });
      }, 7000);

      video.onloadedmetadata = async () => {
        try {
          const vw = video.videoWidth || 640;
          const vh = video.videoHeight || 480;
          const isSwap = normRot === 90 || normRot === 270;
          const rotatedW = isSwap ? vh : vw;
          const rotatedH = isSwap ? vw : vh;

          let targetAspect = rotatedW / rotatedH;
          if (cropRatio === '1:1') targetAspect = 1;
          else if (cropRatio === '9:16') targetAspect = 9 / 16;
          else if (cropRatio === '16:9') targetAspect = 16 / 9;

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

          const maxDim = 1280;
          let scaleFactor = 1;
          if (cropW > maxDim || cropH > maxDim) {
            scaleFactor = maxDim / Math.max(cropW, cropH);
          }
          const canvasW = Math.max(2, Math.round(cropW * scaleFactor) & ~1);
          const canvasH = Math.max(2, Math.round(cropH * scaleFactor) & ~1);

          const canvas = document.createElement('canvas');
          canvas.width = canvasW;
          canvas.height = canvasH;
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            clearTimeout(globalTimeout);
            return finish({ videoBlob: sourceBlob, posterDataUrl: null });
          }

          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          const drawFrame = () => {
            ctx.save();
            ctx.translate(canvas.width / 2, canvas.height / 2);
            ctx.rotate((normRot * Math.PI) / 180);
            const scale = scaleFactor * Math.max(cropW / rotatedW, cropH / rotatedH);
            ctx.drawImage(video, (-vw / 2) * scale, (-vh / 2) * scale, vw * scale, vh * scale);
            ctx.restore();
          };

          drawFrame();
          fallbackPoster = canvas.toDataURL('image/jpeg', 0.85);

          // For long videos (> 12s) or when MediaRecorder is not available, return rotated poster
          if ((video.duration && video.duration > 12) || typeof MediaRecorder === 'undefined' || !(canvas as any).captureStream) {
            clearTimeout(globalTimeout);
            return finish({ videoBlob: sourceBlob, posterDataUrl: fallbackPoster });
          }

          const stream = (canvas as any).captureStream(30);

          try {
            const vStream = (video as any).captureStream ? (video as any).captureStream() : null;
            const aTracks = vStream?.getAudioTracks();
            if (aTracks && aTracks.length > 0) stream.addTrack(aTracks[0]);
          } catch (e) { }

          let mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = MediaRecorder.isTypeSupported('video/mp4') ? 'video/mp4' : (sourceBlob?.type || 'video/webm');
          }

          const recorder = new MediaRecorder(stream, { mimeType: mimeType.split(';')[0] });
          const chunks: Blob[] = [];

          recorder.ondataavailable = (e) => {
            if (e.data && e.data.size > 0) chunks.push(e.data);
          };

          recorder.onstop = () => {
            clearTimeout(globalTimeout);
            if (chunks.length > 0) {
              const rotatedBlob = new Blob(chunks, { type: recorder.mimeType || mimeType });
              finish({ videoBlob: rotatedBlob, posterDataUrl: fallbackPoster });
            } else {
              finish({ videoBlob: sourceBlob, posterDataUrl: fallbackPoster });
            }
          };

          recorder.start(100);
          video.currentTime = 0;
          video.playbackRate = 1.5;

          let animId = 0;
          const loop = () => {
            if (video.paused || video.ended) return;
            drawFrame();
            animId = requestAnimationFrame(loop);
          };

          video.onended = () => {
            cancelAnimationFrame(animId);
            if (recorder.state !== 'inactive') recorder.stop();
          };

          await video.play().catch(() => {
            cancelAnimationFrame(animId);
            clearTimeout(globalTimeout);
            finish({ videoBlob: sourceBlob, posterDataUrl: fallbackPoster });
          });
          loop();
        } catch (err) {
          console.warn('Transcode frame loop error:', err);
          clearTimeout(globalTimeout);
          finish({ videoBlob: sourceBlob, posterDataUrl: fallbackPoster });
        }
      };

      video.onerror = () => {
        clearTimeout(globalTimeout);
        finish({ videoBlob: sourceBlob, posterDataUrl: null });
      };

      video.load();
    } catch (e) {
      console.warn('Failed to start rotateAndCropVideoBlob:', e);
      finish({ videoBlob: sourceBlob, posterDataUrl: fallbackPoster });
    }
  });
};

