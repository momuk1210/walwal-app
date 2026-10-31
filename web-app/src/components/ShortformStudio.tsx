import React, { useState } from 'react';
import { Wand2, Download, Share2, Sparkles, X, Bone, Bookmark, Camera, Send } from 'lucide-react';
import { BREED_DEFINITIONS, BreedDefinition } from '../data/breedProfiles';
import confetti from 'canvas-confetti';
import WalWalLogo from '../assets/walwal.svg';
import { useTranslation } from '../i18n/LanguageContext';
import { TRANSLATIONS, Language } from '../i18n/translations';
import { saveMedia, blobCache } from '../utils/mediaStore';
import { syncSinglePost } from '../services/db';
import { uploadVideoToCloud, extractPosterFromVideo } from '../services/mediaSync';
import { STORAGE_KEYS } from '../firebase';

interface ShortformStudioProps {
  initialDog?: any;
  initialThought?: string;
  initialImage?: string;
  initialPoster?: string;
  isProUser: boolean;
  onOpenPro: () => void;
  onClose?: () => void;
  onRetake?: () => void;
  onPostSuccess?: (post?: any) => void;
}

export const ShortformStudio: React.FC<ShortformStudioProps> = ({
  initialDog = BREED_DEFINITIONS[0],
  initialThought = BREED_DEFINITIONS[0].quipsByEmotion.excited[0],
  initialImage,
  initialPoster,
  isProUser,
  onOpenPro,
  onClose,
  onRetake,
  onPostSuccess
}) => {
  const { t, language } = useTranslation();
  const [selectedBreed, setSelectedBreed] = useState<BreedDefinition>(
    BREED_DEFINITIONS.find(b => initialDog && (b.name === initialDog.name || b.breedKr === initialDog.breed)) || BREED_DEFINITIONS[0]
  );
  const [thought, setThought] = useState<string>(initialThought);
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'tiktok' | 'youtube' | 'download' | 'more'>('instagram');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const getLocalizedBreed = (breedName?: string) => {
    const targetName = breedName || selectedBreed.breedKr;
    const koBreeds = TRANSLATIONS.ko?.profile?.breedOptions || [];
    const targetBreeds = t.profile?.breedOptions || koBreeds;

    const idx = koBreeds.findIndex((b: string) => b.toLowerCase() === targetName.toLowerCase());
    if (idx !== -1 && targetBreeds[idx]) return targetBreeds[idx];

    for (const lang of ['en', 'ja', 'es'] as Language[]) {
      const list = TRANSLATIONS[lang]?.profile?.breedOptions || [];
      const foundIdx = list.findIndex((b: string) => b.toLowerCase() === targetName.toLowerCase());
      if (foundIdx !== -1 && targetBreeds[foundIdx]) return targetBreeds[foundIdx];
    }
    return targetName;
  };

  const getFormattedPersonality = () => {
    const tags = initialDog?.personality || initialDog?.personalityTags;
    if (Array.isArray(tags) && tags.length > 0) {
      return tags.map((tg: string) => (tg.startsWith('#') ? tg : `#${tg}`)).join(' ');
    }
    if (typeof tags === 'string' && tags.trim()) {
      return tags;
    }
    return language === 'ko' ? '#파워인싸 #모든인간은내친구' : language === 'ja' ? '#陽キャ犬 #みんな友達' : '#Friendly #SocialButterfly';
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // 견종 맞춤형 AI 대사 다시뽑기
  const generateNewPunchline = () => {
    const quips = selectedBreed.quipsByEmotion.excited;
    const filtered = quips.filter(q => q !== thought);
    const chosen = filtered.length > 0 ? filtered[Math.floor(Math.random() * filtered.length)] : quips[0];
    setThought(chosen);
    confetti({ particleCount: 25, spread: 50, origin: { y: 0.5 } });
  };

  // 9:16 Full HD (1080x1920) 숏폼 카드 캔버스 렌더링
  const generateCanvasImage = (): Promise<string> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve('');
        return;
      }

      canvas.width = 1080;
      canvas.height = 1920;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = initialImage || selectedBreed.avatar;
      img.onload = () => {
        // Draw Full Image
        ctx.drawImage(img, 0, 0, 1080, 1920);

        // Top Gradient Overlay
        const topGrad = ctx.createLinearGradient(0, 0, 0, 480);
        topGrad.addColorStop(0, 'rgba(0, 0, 0, 0.75)');
        topGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = topGrad;
        ctx.fillRect(0, 0, 1080, 480);

        // Bottom Gradient Overlay
        const btmGrad = ctx.createLinearGradient(0, 1300, 0, 1920);
        btmGrad.addColorStop(0, 'rgba(0, 0, 0, 0)');
        btmGrad.addColorStop(1, 'rgba(0, 0, 0, 0.9)');
        ctx.fillStyle = btmGrad;
        ctx.fillRect(0, 1300, 1080, 620);

        // Top Profile Area
        const avatarSize = 120;
        const padding = 60;
        const textX = padding + avatarSize + 40;

        const logoImg = new Image();
        logoImg.src = WalWalLogo;
        logoImg.onload = () => {
          // Draw logo on bottom center
          const logoWidth = 150;
          const logoHeight = 42;
          ctx.drawImage(logoImg, 540 - (logoWidth / 2), 1920 - 50 - logoHeight, logoWidth, logoHeight);

          const drawBubbleAndResolve = () => {
            // Bottom Captions (Speech Bubble Style)
            ctx.shadowBlur = 0; // Remove text shadow for bubble text

            const words = thought.split(' ');
            let lines = [];
            let line = '';
            ctx.font = 'bold 54px sans-serif';
            for (let n = 0; n < words.length; n++) {
              const testLine = line + words[n] + ' ';
              const metrics = ctx.measureText(testLine);
              if (metrics.width > 800 && n > 0) {
                lines.push(line);
                line = words[n] + ' ';
              } else {
                line = testLine;
              }
            }
            lines.push(line);

            const bubblePadding = 60;
            const lineHeight = 80;
            const bubbleHeight = (lines.length * lineHeight) + (bubblePadding * 2) - 20;
            const bubbleY = 1920 - bubbleHeight - 120;

            // Draw Bubble Background
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
            ctx.beginPath();
            ctx.roundRect(80, bubbleY, 1080 - 160, bubbleHeight, 40);
            ctx.fill();

            // Draw Bubble Tail
            ctx.beginPath();
            ctx.moveTo(140, bubbleY);
            ctx.lineTo(170, bubbleY - 40);
            ctx.lineTo(200, bubbleY);
            ctx.fill();

            // Draw Text
            ctx.fillStyle = '#333';
            ctx.textAlign = 'center';
            lines.forEach((l, i) => {
              ctx.fillText(l.trim(), 540, bubbleY + bubblePadding + 40 + (i * lineHeight));
            });

            resolve(canvas.toDataURL('image/png'));
          };

          if (initialDog) {
            const avatarImg = new Image();
            avatarImg.crossOrigin = 'anonymous';
            avatarImg.src = initialDog.avatar || selectedBreed.avatar;
            avatarImg.onload = () => {
              ctx.save();
              ctx.beginPath();
              ctx.arc(padding + avatarSize / 2, padding + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
              ctx.closePath();
              ctx.clip();
              const size = Math.min(avatarImg.width, avatarImg.height);
              const sx = (avatarImg.width - size) / 2;
              const sy = (avatarImg.height - size) / 2;
              ctx.drawImage(avatarImg, sx, sy, size, size, padding, padding, avatarSize, avatarSize);
              ctx.restore();

              ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
              ctx.lineWidth = 6;
              ctx.beginPath();
              ctx.arc(padding + avatarSize / 2, padding + avatarSize / 2, avatarSize / 2, 0, Math.PI * 2);
              ctx.stroke();

              // Name
              ctx.textAlign = 'left';
              ctx.font = 'bold 46px sans-serif';
              ctx.fillStyle = '#FFFFFF';
              ctx.shadowColor = 'rgba(0, 0, 0, 0.9)';
              ctx.shadowBlur = 12;
              ctx.fillText(initialDog.name || selectedBreed.name, textX, padding + 35);

              // Breed . Age . Gender
              ctx.font = 'bold 32px sans-serif';
              ctx.fillStyle = '#E2E8F0';
              const ageSuffix = t.profile?.dogAgeSuffix || t.profile?.ageSuffix || (language === 'ko' ? '살' : ' yrs');
              const genderShort = initialDog?.gender === 'female'
                ? (t.common?.genderShortFemale || (language === 'ko' ? '여' : 'F'))
                : (t.common?.genderShortMale || (language === 'ko' ? '남' : 'M'));
              const dogInfoStr = `${getLocalizedBreed(initialDog?.breed)} · ${initialDog?.age || 2}${ageSuffix} · ${genderShort}`;
              ctx.fillText(dogInfoStr, textX, padding + 80);

              // Tags
              ctx.font = '30px sans-serif';
              ctx.fillStyle = '#F1F5F9';
              const tagsStr = getFormattedPersonality();
              ctx.fillText(tagsStr, textX, padding + 120);

              drawBubbleAndResolve();
            };
            avatarImg.onerror = () => drawBubbleAndResolve();
          } else {
            drawBubbleAndResolve();
          }
        };
        logoImg.onerror = () => resolve(canvas.toDataURL('image/png'));
      };

      img.onerror = () => resolve('');
    });
  };

  const isVideo = Boolean(initialImage && (initialImage.startsWith('blob:') || initialImage.endsWith('.webm') || initialImage.endsWith('.mp4')));

  // 미디어 파일(이미지 또는 비디오) 자동 다운로드 도우미
  const downloadMedia = async (filenameSuffix: string): Promise<string> => {
    const localizedBreed = getLocalizedBreed(initialDog?.breed).replace(/\s+/g, '_');
    if (isVideo && initialImage) {
      const link = document.createElement('a');
      link.href = initialImage;
      link.download = `walwal_${localizedBreed}_${filenameSuffix}.webm`;
      link.click();
      return initialImage;
    } else {
      const dataUrl = await generateCanvasImage();
      if (dataUrl) {
        const link = document.createElement('a');
        link.download = `walwal_${localizedBreed}_${filenameSuffix}.png`;
        link.href = dataUrl;
        link.click();
      }
      return dataUrl;
    }
  };

  // 플랫폼별 액션 핸들러
  const handleShareInstagram = async () => {
    setSelectedPlatform('instagram');
    const localizedBreed = getLocalizedBreed(initialDog?.breed);
    const caption = language === 'ko'
      ? `"${thought}"\n\n#WalWal #왈왈 #반려견통역 #${selectedBreed.breedKr} #멍스타그램 #댕댕이`
      : language === 'ja'
        ? `"${thought}"\n\n#WalWal #ワルワル #愛犬翻訳 #${localizedBreed.replace(/\s+/g, '')} #いぬすたぐらむ #わんこ`
        : `"${thought}"\n\n#WalWal #DogTranslator #${localizedBreed.replace(/\s+/g, '')} #Dogstagram #Puppy`;

    showToast(language === 'ko' ? 'Instagram 등록 화면으로 이동 중 (태그 복사 및 다운로드)...' : language === 'ja' ? 'Instagram登録画面へ移動中 (タグコピー&ダウンロード)...' : 'Opening Instagram (tags copied & downloaded)...');

    const dataUrl = await downloadMedia('instagram');
    if (dataUrl && !isVideo) {
      // 2. 클립보드에 이미지 및 캡션 복사 (동영상은 클립보드 복사 미지원)
      try {
        const res = await fetch(dataUrl);
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
      // 인스타그램 새 게시물 만들기 / 등록 창으로 직접 진입
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = 'instagram://camera';
        setTimeout(() => {
          window.open('https://www.instagram.com/create/select/', '_blank');
        }, 400);
      } else {
        window.open('https://www.instagram.com/create/select/', '_blank');
      }
      showToast(language === 'ko' ? 'Instagram 등록 화면이 열렸습니다! 다운로드된 사진을 넣고 등록하세요.' : language === 'ja' ? 'Instagramが開きました！ダウンロードされた写真を選択して投稿してください。' : 'Instagram opened! Select the downloaded media and post.');
    }, 900);
  };

  const handleShareTikTok = async () => {
    setSelectedPlatform('tiktok');
    const localizedBreed = getLocalizedBreed(initialDog?.breed);
    const caption = language === 'ko'
      ? `"${thought}" #WalWal #반려견통역 #강아지속마음 #${selectedBreed.breedKr} #댕댕이 #fyp`
      : language === 'ja'
        ? `"${thought}" #WalWal #愛犬翻訳 #犬の本音 #${localizedBreed.replace(/\s+/g, '')} #わんこ #fyp`
        : `"${thought}" #WalWal #DogTranslator #${localizedBreed.replace(/\s+/g, '')} #Puppy #fyp`;

    showToast(language === 'ko' ? 'TikTok 숏폼 등록 화면으로 이동 중 (태그 복사 및 9:16 규격 다운로드)...' : language === 'ja' ? 'TikTokショート登録画面へ移動中 (タグコピー&9:16動画ダウンロード)...' : 'Opening TikTok (tags copied & video downloaded)...');

    await downloadMedia('tiktok');
    try { await navigator.clipboard.writeText(caption); } catch (e) { }

    setTimeout(() => {
      // 틱톡 크리에이터 동영상 업로드 등록 화면으로 직접 이동
      window.open('https://www.tiktok.com/upload?lang=ko-KR', '_blank');
      showToast(language === 'ko' ? 'TikTok 동영상 등록 화면이 열렸습니다! 다운로드된 파일을 선택하고 등록하세요.' : language === 'ja' ? 'TikTokが開きました！ダウンロードされたファイルを選択して投稿してください。' : 'TikTok opened! Select the downloaded file and post.');
    }, 900);
  };

  const handleShareYouTube = async () => {
    setSelectedPlatform('youtube');
    const localizedBreed = getLocalizedBreed(initialDog?.breed);
    const title = language === 'ko'
      ? `[WalWal AI] ${selectedBreed.name} (${selectedBreed.breedKr}) 속마음 통역 #Shorts`
      : language === 'ja'
        ? `[WalWal AI] ${initialDog?.name || selectedBreed.name} (${localizedBreed}) 本音通訳 #Shorts`
        : `[WalWal AI] ${initialDog?.name || selectedBreed.name} (${localizedBreed}) Thoughts #Shorts`;
    const desc = language === 'ko'
      ? `"${thought}"\n\nWalWal AI 반려견 실시간 통역기\n#Shorts #WalWal #반려견통역 #${selectedBreed.breedKr}`
      : language === 'ja'
        ? `"${thought}"\n\nWalWal AI 愛犬リアルタイム通訳機\n#Shorts #WalWal #愛犬翻訳 #${localizedBreed.replace(/\s+/g, '')}`
        : `"${thought}"\n\nWalWal AI Real-time Dog Translator\n#Shorts #WalWal #DogTranslator #${localizedBreed.replace(/\s+/g, '')}`;

    showToast(language === 'ko' ? 'YouTube Shorts 등록 화면으로 이동 중 (제목 복사 및 다운로드)...' : language === 'ja' ? 'YouTube Shorts登録画面へ移動中 (タイトルコピー&ダウンロード)...' : 'Opening YouTube Shorts (title copied & downloaded)...');

    await downloadMedia('shorts');
    try { await navigator.clipboard.writeText(`${title}\n\n${desc}`); } catch (e) { }

    setTimeout(() => {
      // 유튜브 동영상 업로드(등록) 팝업 화면으로 직접 이동
      window.open('https://www.youtube.com/upload', '_blank');
      showToast(language === 'ko' ? 'YouTube 동영상 등록 화면이 열렸습니다! 파일 선택 후 바로 등록하세요.' : language === 'ja' ? 'YouTubeが開きました！ファイルを選択して投稿してください。' : 'YouTube opened! Select the downloaded file and post.');
    }, 900);
  };

  const handleDownloadOnly = async () => {
    setSelectedPlatform('download');
    showToast(isVideo
      ? (language === 'ko' ? '동영상 파일 다운로드 중...' : language === 'ja' ? '動画ファイルダウンロード中...' : 'Downloading video file...')
      : (t.share?.rendering || (language === 'ko' ? '무손실 숏폼 카드 렌더링 중...' : language === 'ja' ? '高画質カードをレンダリング中...' : 'Rendering shortform card...')));

    await downloadMedia(Date.now().toString());

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    showToast((t.snaps || t.studio)?.downloadComplete || t.share?.downloadComplete || (language === 'ko' ? '파일이 다운로드되었습니다! 🎉' : language === 'ja' ? 'ファイルがダウンロードされました！🎉' : 'File downloaded successfully! 🎉'));
  };

  const handleShareMore = async () => {
    setSelectedPlatform('more');
    showToast(language === 'ko' ? '공유 기능을 준비 중...' : 'Preparing share...');

    try {
      if (isVideo) {
        if (navigator.share) {
          await navigator.share({
            title: 'WalWal Pet Studio',
            text: `"${thought}"\n\n#WalWal #DogTranslator`,
            url: window.location.href
          });
          showToast(language === 'ko' ? '공유 메뉴가 열렸습니다.' : 'Share menu opened.');
        } else {
          showToast(language === 'ko' ? '현재 브라우저에서는 파일 공유를 지원하지 않습니다.' : 'File sharing is not supported on this browser.');
        }
      } else {
        const dataUrl = await generateCanvasImage();
        if (dataUrl) {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], `walwal_share_${Date.now()}.png`, { type: 'image/png' });

          if (navigator.share) {
            await navigator.share({
              title: 'WalWal Pet Studio',
              text: `"${thought}"\n\n#WalWal`,
              files: [file]
            });
            showToast(language === 'ko' ? '공유 메뉴가 열렸습니다.' : 'Share menu opened.');
          } else {
            showToast(language === 'ko' ? '현재 브라우저에서는 파일 공유를 지원하지 않아 클립보드에 복사합니다.' : 'Sharing not supported, copying to clipboard instead.');
            if (navigator.clipboard && (window as any).ClipboardItem) {
              await navigator.clipboard.write([
                new (window as any).ClipboardItem({ 'image/png': blob })
              ]);
            }
          }
        }
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        showToast(language === 'ko' ? '공유가 취소되었습니다.' : 'Share cancelled.');
      } else {
        showToast(language === 'ko' ? '공유 중 오류가 발생했습니다.' : 'Error during share.');
      }
    }
  };

  const handlePostToSnaps = async () => {
    // 1. 새 피드샷 게시물 생성
    let finalPoster = initialPoster || '';
    if (!finalPoster && isVideo && initialImage) {
      try {
        const ext = await extractPosterFromVideo(initialImage);
        if (ext) finalPoster = ext;
      } catch (e) {
        console.warn('Extract poster failed:', e);
      }
    }
    if (!finalPoster) {
      finalPoster = isVideo ? (initialDog?.avatar || selectedBreed.avatar) : (initialImage || '');
    }

    const newPost = {
      id: `post_${Date.now()}`,
      name: initialDog?.name || selectedBreed.name,
      ownerName: initialDog?.ownerName || (language === 'ko' ? '나' : (language === 'ja' ? '私' : 'Me')),
      avatar: initialDog?.avatar || selectedBreed.avatar,
      breed: getLocalizedBreed(initialDog?.breed),
      age: initialDog?.age || 2,
      gender: initialDog?.gender || 'female',
      personality: Array.isArray(initialDog?.personality) ? initialDog.personality : [getFormattedPersonality()],
      recentThought: (thought || initialThought || '').replace(/^["'“”«»\s]+|["'“”«»\s]+$/g, '').trim(),
      feedImage: initialImage,
      poster: finalPoster,
      isVideo: isVideo,
      hasCloudMedia: isVideo,
      createdAt: new Date().toISOString(),
      likes: 0,
      liked: false,
      comments: [],
      showComments: false,
      shares: 0,
      isMine: true
    };

    const postToSave = { ...newPost };

    // 동영상 blob IndexedDB 비동기 저장 완벽 대기
    let blob = (initialImage && blobCache.get(initialImage)) || null;
    if (!blob && initialImage && (initialImage.startsWith('blob:') || initialImage.startsWith('data:'))) {
      try {
        const res = await fetch(initialImage);
        blob = await res.blob();
      } catch (e) {
        console.warn('Could not fetch blob from initialImage:', e);
      }
    }

    if (blob) {
      try {
        await saveMedia(newPost.id, blob);
        blobCache.set(`indexeddb:${newPost.id}`, blob);
        blobCache.set(newPost.id, blob);
        postToSave.feedImage = `indexeddb:${newPost.id}`;
        postToSave.isVideo = true;
        postToSave.hasCloudMedia = true;
        (newPost as any).originalFeedImage = postToSave.feedImage;

        // 클라우드 Firestore 미디어 청크 업로드 (어느 디바이스에서든 즉시 동기화)
        const uploadRes = await uploadVideoToCloud(newPost.id, blob);
        console.log(`Cloud video chunks uploaded for ${newPost.id}:`, uploadRes);
      } catch (e) {
        console.error('Failed to save media in IndexedDB:', e);
      }
    }

    // 2. localStorage에 저장 (피드샷 최상단 저장 및 하위 호환)
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SNAPS_POSTS) || localStorage.getItem(STORAGE_KEYS.FEED_POSTS);
      const posts = saved ? JSON.parse(saved) : [];
      const filtered = posts.filter((p: any) => p.id !== postToSave.id);
      filtered.unshift(postToSave);
      localStorage.setItem(STORAGE_KEYS.SNAPS_POSTS, JSON.stringify(filtered));
      localStorage.setItem(STORAGE_KEYS.FEED_POSTS, JSON.stringify(filtered));
    } catch (e) {
      console.error('Failed to save snaps post to localStorage:', e);
    }

    try {
      const savedDeleted = localStorage.getItem(STORAGE_KEYS.DELETED_POST_IDS);
      if (savedDeleted) {
        const ids = JSON.parse(savedDeleted).filter((id: string) => id !== postToSave.id);
        localStorage.setItem(STORAGE_KEYS.DELETED_POST_IDS, JSON.stringify(ids));
      }
    } catch (e) { }

    // 3. Firestore posts 컬렉션 동기화
    await syncSinglePost(postToSave);

    // 이벤트 브로드캐스트
    window.dispatchEvent(new Event('walwal_snaps_updated'));
    window.dispatchEvent(new Event('walwal_feed_updated'));

    // 4. 토스트 메시지
    showToast((t.snaps || t.studio)?.postSuccess || (language === 'ko' ? '피드샷에 저장되었습니다!' : 'Successfully saved to WalWal Snaps! 🎉'));

    // 5. 피드샷 화면으로 이동
    setTimeout(() => {
      if (onPostSuccess) {
        onPostSuccess(postToSave);
      } else if (onClose) {
        onClose();
      }
    }, 400);
  };

  const handlePostToFeed = handlePostToSnaps;

  const handleRetake = () => {
    if (onRetake) {
      onRetake();
    } else {
      if (onClose) onClose();
      window.dispatchEvent(new CustomEvent('walwal_switch_tab', { detail: 'ar' }));
    }
  };

  const platformSubtitles: Record<string, string> = {
    instagram: t.share?.subtitles?.instagram || (language === 'ko'
      ? '클릭 시 Instagram 등록 화면으로 바로 이동하여\n다운로드된 사진으로 즉시 등록할 수 있습니다.'
      : language === 'ja'
        ? 'クリックでInstagram投稿画面へ移動し、\nダウンロードされた写真で即座に投稿できます。'
        : 'Quickly redirect to Instagram create screen\nwith your downloaded media ready to post.'),
    tiktok: t.share?.subtitles?.tiktok || (language === 'ko'
      ? '클릭 시 TikTok 동영상 등록 화면으로 바로 이동하여\n다운로드된 9:16 영상 카드를 즉시 등록할 수 있습니다.'
      : language === 'ja'
        ? 'クリックでTikTok動画投稿画面へ移動し、\nダウンロードされた9:16動画で即座に投稿できます。'
        : 'Directly open TikTok upload page\nwith your 9:16 video card ready to post.'),
    youtube: t.share?.subtitles?.youtube || (language === 'ko'
      ? '클릭 시 YouTube 동영상 업로드 등록 화면으로 바로 이동하여\n제목/태그와 함께 즉시 등록할 수 있습니다.'
      : language === 'ja'
        ? 'クリックでYouTubeショート動画アップロード画面へ移動し、\nタイトル・タグと共に即座に投稿できます。'
        : 'Open YouTube upload screen with\npre-copied title and tags for Shorts.'),
    download: t.share?.subtitles?.download || (language === 'ko'
      ? '단말기에 원본 무손실 4K 화질로\n안전하게 저장됩니다.'
      : language === 'ja'
        ? '端末に元の無損失4K高画質で\n安全に保存されます。'
        : 'Safely save in original lossless quality\nto your device.'),
    more: t.share?.subtitles?.more || (language === 'ko'
      ? '카카오톡, 메시지, 에어드롭 등\n원하는 플랫폼으로 바로 전송합니다.'
      : language === 'ja'
        ? 'メッセージ、AirDropなど\nお好みのプラットフォームへ転送します。'
        : 'Share directly via Messages, AirDrop, or other apps.')
  };

  return (
    <div className="snaps-modal-overlay">
      <div className="snaps-modal-container">
        {/* Header (Yellow Style) */}
        <div className="snaps-modal-header row-between">
          <div className="snaps-modal-header-title ">
            <h2 className="title-lg">
              {(t.tabs?.snaps || t.tabs?.studio) || (language === 'ko' ? ' 피드샷' : 'Pet Studio')}</h2>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              onClick={handleRetake}
              className="snaps-modal-retake-btn"
              title={language === 'ko' ? '재촬영' : 'Retake'}
            >
              <Camera size={24} />
            </button>
            <button onClick={onClose} className="btn-ghost snaps-modal-close-btn">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Body (Text + Image) */}
        <div className="snaps-modal-body">
          <div className="snaps-modal-media-wrapper">
            {isVideo ? (
              <video
                src={initialImage}
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img
                src={initialImage || selectedBreed.avatar}
                alt="Preview"
              />
            )}
          </div>
        </div>

        {/* Bottom Actions (Floating Glass Dock) */}
        <div className="snaps-modal-action-wrapper">
          {/* 0. 재촬영 (카메라) */}
          <button type="button" onClick={handleRetake} title={language === 'ko' ? '재촬영' : 'Retake'}>
            <div className="share-icon-btn retake">
              <Camera size={24} color="#fff" />
            </div>
          </button>

          {/* Action Buttons Row */}
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
              <Download size={22} />
            </div>
            <span>{t.share?.download || (language === 'ko' ? '다운로드' : 'Download')}</span>
          </button>

          {/* 5. 더 보기 */}
          <button onClick={handleShareMore}>
            <div className={`share-icon-btn more ${selectedPlatform === 'more' ? 'selected' : ''}`}>
              <Send size={22} color="#121212" />
            </div>
            <span>{t.share?.more || (language === 'ko' ? '더 보기' : 'More')}</span>
          </button>

          {/* 6. 피드샷 (노란색 #FF9E58 + 북마크 아이콘) */}
          <button onClick={handlePostToSnaps}>
            <div className="share-icon-btn snaps">
              <Bone size={22} color="#fff" />
            </div>
            <span className="share-label-snaps share-label-feed">{language === 'ko' ? '저장' : language === 'ja' ? '保存' : 'Save'}</span>
          </button>
        </div>
      </div>

      {/* Floating Toast Message */}
      {toastMessage && (
        <div className="snaps-toast">
          <Sparkles size={16} color="#FF9E58" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};
