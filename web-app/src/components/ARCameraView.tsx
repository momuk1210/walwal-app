import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Volume2, Share2, ShieldCheck, Zap, Activity, MessageCircle, Send, Video, Play, Pause, Disc, Layers, PlusSquare, Bone, Scan, ScanFace, Menu } from 'lucide-react';
import { BREED_DEFINITIONS, BreedDefinition } from '../data/breedProfiles';
import { DogProfile, MOCK_DOGS, getMockDogs, sanitizePetList } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { OwnerNoteModal } from './OwnerNoteModal';
import { generateDogThought, LANG_CONFIG } from '../services/aiTranslator';
import { ollamaService } from '../services/ollamaService';
import { blobCache } from '../utils/mediaStore';
import '../styles/ARCameraView.css';
import confetti from 'canvas-confetti';
import walwalLogo from '../assets/walwal.svg';
import walwalWalking from '../assets/walwal-walking.gif';

interface ARCameraViewProps {
  onCaptureToStory: (dog: any, thought: string, snapshot?: string, poster?: string) => void;
  onCaptureToSnaps?: (dog: any, thought: string, snapshot?: string, poster?: string, isVideo?: boolean) => void;
  onCaptureToFeed?: (dog: any, thought: string, snapshot?: string, poster?: string, isVideo?: boolean) => void;
  interactionPair?: { dog1: any; dog2: any } | null;
  onClearInteractionPair?: () => void;
  isActiveTrigger?: number;
}

// 앵글 프리셋 타입
type AnglePreset = 'pack3' | 'duo_park' | 'single';

interface DetectedDogInFrame {
  id: string;
  name: string;
  breedKr: string;
  box: { left: string; top: string; width: string; height: string };
  bubblePos: { left: string; top: string; maxWidth: string };
  pointerAlign: 'left' | 'center' | 'right';
  currentThought: string;
  behaviorSignal: string;
  confidence: number;
  avatar: string;
  accentColor: string;
}

import { getLiveDogScenarios, getPack3Turns, DogBehaviorState, LiveScenario } from '../data/arScenarios';


export const ARCameraView: React.FC<ARCameraViewProps> = ({
  onCaptureToStory,
  onCaptureToSnaps,
  onCaptureToFeed,
  interactionPair,
  onClearInteractionPair,
  isActiveTrigger
}) => {
  const { language, t } = useTranslation();

  // 앵글 프리셋 (기본: 단독 반려견 앵글)
  const [anglePreset, setAnglePreset] = useState<AnglePreset>('single');
  const [turnIndex, setTurnIndex] = useState<number>(0);
  const turnIndexRef = useRef<number>(0);

  useEffect(() => {
    turnIndexRef.current = turnIndex;
  }, [turnIndex]);
  const [isRecording, setIsRecording] = useState<boolean>(true);
  const [recordTime, setRecordTime] = useState<number>(7);
  // 카메라 탭 및 재촬영 진입 시 바로 라이브 카메라 활성화
  const [isCameraLive, setIsCameraLive] = useState<boolean>(true);
  const [hasLiveStream, setHasLiveStream] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [zoomLevel, setZoomLevel] = useState<'0.5x' | '1x' | '2x'>('1x');
  const [audioLevel, setAudioLevel] = useState<number>(52);
  const [focusTarget, setFocusTarget] = useState<{ x: number; y: number; active: boolean; dogName: string }>({ x: 50, y: 50, active: false, dogName: '' });
  const orientationStateRef = useRef<{ isLandscape: boolean; rotation: number }>({ isLandscape: false, rotation: 0 });
  const [isLandscapeMode, setIsLandscapeMode] = useState<boolean>(false);
  const lastAccRef = useRef<{ ax: number; ay: number } | null>(null);
  const lastGyroRef = useRef<{ gamma: number; beta: number } | null>(null);
  const [behaviorState, setBehaviorState] = useState<DogBehaviorState>('calm');
  const [scenarioIdx, setScenarioIdx] = useState<number>(0);
  const [isCapturingVideo, setIsCapturingVideo] = useState<boolean>(false);
  const [captureCountdown, setCaptureCountdown] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const liveScenarios = getLiveDogScenarios(language);
  const liveThought = liveScenarios[behaviorState]?.[scenarioIdx] || liveScenarios.calm[0];
  const [focusLocked, setFocusLocked] = useState<boolean>(false);

  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const isAnalyzingRef = useRef<boolean>(false);
  const consecutiveMissRef = useRef<number>(0);
  const [aiThoughtText, setAiThoughtText] = useState<string>(() => (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogThought);
  const [aiEmotionTag, setAiEmotionTag] = useState<string>(() => (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogTag);
  const [isDogInView, setIsDogInView] = useState<boolean>(false);
  const aiThoughtTextRef = useRef<string>(aiThoughtText);
  const [ollamaConnected, setOllamaConnected] = useState<boolean>(false);

  useEffect(() => {
    aiThoughtTextRef.current = aiThoughtText;
  }, [aiThoughtText]);

  useEffect(() => {
    const cfg = LANG_CONFIG[language] || LANG_CONFIG.ko;
    if (!isDogInView) {
      setAiThoughtText(cfg.noDogThought);
      setAiEmotionTag(cfg.noDogTag);
    }
  }, [language, isDogInView]);
  const [ownerNoteTarget, setOwnerNoteTarget] = useState<DogProfile | null>(null);
  const [showTargetSelector, setShowTargetSelector] = useState<boolean>(false);

  // 단독견 프리셋용 (프로필 데이터 연동)
  const [myDogProfile] = useState<DogProfile>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = sanitizePetList(parsed, language);
          return list[0] || getMockDogs(language)[0];
        }
      }
    } catch (e) { }
    return getMockDogs(language)[0];
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const liveStreamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);
  const isStartingRef = useRef<boolean>(false);
  const simImgRef = useRef<HTMLImageElement | null>(null);
  const trackingCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const prevFrameDataRef = useRef<Uint8ClampedArray | null>(null);
  const trackingRafRef = useRef<number | null>(null);
  const focusTargetRef = useRef<{ x: number; y: number }>({ x: 50, y: 50 });
  const motionCountBufRef = useRef<number[]>([]);  // 모션 픽셀 수 이동평균 버퍼
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const lastBehaviorChangeRef = useRef<number>(0);

  // 레코딩 타이머 효과 (실제 동영상 촬영 느낌)
  useEffect(() => {
    let timer: any;
    if (isRecording) {
      timer = setInterval(() => {
        setRecordTime(prev => prev + 1);
        setAudioLevel(Math.floor(35 + Math.random() * 50));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isRecording]);

  // 대화 턴 자동 전환 시뮬레이션 (동영상처럼 대화가 살아 움직임)
  useEffect(() => {
    const turnInterval = setInterval(() => {
      setTurnIndex(prev => (prev + 1) % (getPack3Turns(language).length || 6));
    }, 6500);

    return () => clearInterval(turnInterval);
  }, [language]);

  // 스마트폰 하드웨어 가속도/자이로 센서 실시간 감지 (중력 가속도로 폰의 회전 100% 자동 감지)
  useEffect(() => {
    // 1. 중력 가속도 센서 (어떤 각도로 쥐고 있든 x, y 중력 비교로 즉시 감지)
    const handleDeviceMotion = (e: DeviceMotionEvent) => {
      const acc = e.accelerationIncludingGravity;
      if (!acc || acc.x === null || acc.y === null) return;

      const ax = acc.x;
      const ay = acc.y;
      lastAccRef.current = { ax, ay };

      const planar = Math.sqrt(ax * ax + ay * ay);
      // 테이블에 완전히 평평하게 내려놓은 상태 (|planar| < 1.0) 제외
      if (planar < 1.0) return;

      // 브라우저 자체가 이미 가로 상태라면 센서로 덮어쓰지 않음
      const isWindowCurrentlyLandscape = (typeof window.orientation !== 'undefined' && Math.abs(Number(window.orientation)) === 90) ||
                                          (typeof window !== 'undefined' && window.innerWidth > window.innerHeight) ||
                                          (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(orientation: landscape)').matches);
      if (isWindowCurrentlyLandscape) {
        orientationStateRef.current = { isLandscape: true, rotation: -90 };
        return;
      }

      // 폰을 가로로 돌려 쥐었을 때: x축 중력이 y축 중력보다 큼
      if (Math.abs(ax) > Math.abs(ay) + 1.2) {
        orientationStateRef.current = {
          isLandscape: true,
          rotation: ax > 0 ? -90 : 90
        };
        setIsLandscapeMode(true);
      }
      // 폰을 세로로 세워 쥐었을 때: y축 중력이 x축 중력보다 큼
      else if (Math.abs(ay) > Math.abs(ax) + 1.2) {
        orientationStateRef.current = {
          isLandscape: false,
          rotation: 0
        };
        setIsLandscapeMode(false);
      }
    };

    // 2. orientation (자이로스코프) 이벤트 보조 감지
    const handleDeviceOrientation = (event: DeviceOrientationEvent) => {
      const { gamma, beta } = event;
      if (gamma === null || beta === null) return;
      lastGyroRef.current = { gamma, beta };

      const isWindowCurrentlyLandscape = (typeof window.orientation !== 'undefined' && Math.abs(Number(window.orientation)) === 90) ||
                                          (typeof window !== 'undefined' && window.innerWidth > window.innerHeight) ||
                                          (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(orientation: landscape)').matches);
      if (isWindowCurrentlyLandscape) {
        orientationStateRef.current = { isLandscape: true, rotation: -90 };
        setIsLandscapeMode(true);
        return;
      }

      // 좌우 기울기(gamma)가 크면 가로
      if (Math.abs(gamma) > 35) {
        orientationStateRef.current = {
          isLandscape: true,
          rotation: gamma > 0 ? 90 : -90
        };
        setIsLandscapeMode(true);
      } else if (Math.abs(gamma) < 18 && Math.abs(beta) > 25) {
        orientationStateRef.current = {
          isLandscape: false,
          rotation: 0
        };
        setIsLandscapeMode(false);
      }
    };

    // 3. 브라우저 화면 방향 변경 감지 (화면 자동회전 시 100% 동작)
    const handleScreenResize = () => {
      const isWindowLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight;
      const isOrientationLandscape = typeof window.orientation !== 'undefined' && Math.abs(Number(window.orientation)) === 90;
      const isScreenLandscape = typeof window.screen !== 'undefined' && Boolean(window.screen.orientation?.type?.includes('landscape'));
      const isMediaLandscape = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(orientation: landscape)').matches;

      if (isWindowLandscape || isOrientationLandscape || isScreenLandscape || isMediaLandscape) {
        let rot = -90;
        if (typeof window.orientation !== 'undefined') {
          rot = Number(window.orientation) === 90 ? -90 : 90;
        } else if (typeof window.screen?.orientation?.angle === 'number') {
          rot = window.screen.orientation.angle === 90 ? -90 : 90;
        }
        orientationStateRef.current = { isLandscape: true, rotation: rot };
        setIsLandscapeMode(true);
      } else {
        orientationStateRef.current = { isLandscape: false, rotation: 0 };
        setIsLandscapeMode(false);
      }
    };

    const mediaQuery = typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(orientation: landscape)') : null;
    const handleMediaChange = (e: any) => {
      if (e.matches) {
        orientationStateRef.current = { isLandscape: true, rotation: -90 };
        setIsLandscapeMode(true);
      } else {
        handleScreenResize();
      }
    };

    handleScreenResize();
    if (mediaQuery) {
      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener('change', handleMediaChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleMediaChange);
      }
    }
    window.addEventListener('devicemotion', handleDeviceMotion, true);
    window.addEventListener('deviceorientation', handleDeviceOrientation, true);
    window.addEventListener('resize', handleScreenResize);
    window.addEventListener('orientationchange', handleScreenResize);

    return () => {
      if (mediaQuery) {
        if (mediaQuery.removeEventListener) {
          mediaQuery.removeEventListener('change', handleMediaChange);
        } else if ((mediaQuery as any).removeListener) {
          (mediaQuery as any).removeListener(handleMediaChange);
        }
      }
      window.removeEventListener('devicemotion', handleDeviceMotion, true);
      window.removeEventListener('deviceorientation', handleDeviceOrientation, true);
      window.removeEventListener('resize', handleScreenResize);
      window.removeEventListener('orientationchange', handleScreenResize);
    };
  }, []);


  // 자동 포커스: 가운데(주피사체) 강아지로 자동 포커싱 후 순환
  useEffect(() => {
    // 시작 시 가운데 강아지 자동 포커싱
    const initialFocus = setTimeout(() => {
      setFocusTarget({ x: 53, y: 47, active: true, dogName: '인절미 (가운데)' });
      setFocusLocked(true);
      setTimeout(() => setFocusLocked(false), 1500);
    }, 800);

    // 포커스 대상을 6.3초마다 순환: 가운데 -> 좌 -> 우 -> 가운데
    const focusTargets = [
      { x: 53, y: 47, dogName: t.ar.mockDogCenter },
      { x: 24, y: 56, dogName: t.ar.mockDogLeft },
      { x: 78, y: 59, dogName: t.ar.mockDogRight }
    ];
    let focusIdx = 0;
    const cycleInterval = setInterval(() => {
      focusIdx = (focusIdx + 1) % focusTargets.length;
      const t = focusTargets[focusIdx];
      setFocusTarget({ ...t, active: true });
      setFocusLocked(true);
      setTimeout(() => setFocusLocked(false), 1500);
    }, 6500);

    return () => {
      clearTimeout(initialFocus);
      clearInterval(cycleInterval);
    };
  }, []);

  // ================= 실시간 모션 트래킹 (라이브 카메라 전용) =================
  useEffect(() => {
    if (!isCameraLive) {
      // 라이브 카메라 꺼지면 트래킹 중단
      if (trackingRafRef.current) {
        cancelAnimationFrame(trackingRafRef.current);
        trackingRafRef.current = null;
      }
      prevFrameDataRef.current = null;
      return;
    }

    const SAMPLE_W = 80;  // 다운샘플 해상도 (성능)
    const SAMPLE_H = 120;
    const MOTION_THRESHOLD = 25;  // 픽셀 변화 감도
    const SMOOTH = 0.08;  // 포커스 이동 부드러움 (0=즉시, 1=고정)

    let canvas = trackingCanvasRef.current;
    if (!canvas) {
      canvas = document.createElement('canvas');
      canvas.width = SAMPLE_W;
      canvas.height = SAMPLE_H;
      trackingCanvasRef.current = canvas;
    }
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return;

    const analyze = () => {
      const video = videoRef.current;
      if (!video || video.readyState < 2) {
        trackingRafRef.current = requestAnimationFrame(analyze);
        return;
      }

      // 현재 프레임 다운샘플 캡처
      ctx.drawImage(video, 0, 0, SAMPLE_W, SAMPLE_H);
      const frame = ctx.getImageData(0, 0, SAMPLE_W, SAMPLE_H);
      const curr = frame.data;

      if (prevFrameDataRef.current) {
        const prev = prevFrameDataRef.current;
        let sumX = 0, sumY = 0, count = 0;

        for (let py = 0; py < SAMPLE_H; py++) {
          for (let px = 0; px < SAMPLE_W; px++) {
            const idx = (py * SAMPLE_W + px) * 4;
            const dr = Math.abs(curr[idx] - prev[idx]);
            const dg = Math.abs(curr[idx + 1] - prev[idx + 1]);
            const db = Math.abs(curr[idx + 2] - prev[idx + 2]);
            if (dr + dg + db > MOTION_THRESHOLD) {
              sumX += px;
              sumY += py;
              count++;
            }
          }
        }

        // 충분한 모션이 감지된 경우에만 포커스 이동
        // 모션 강도 버퍼 업데이트 (30프레임 이동평균)
        const buf = motionCountBufRef.current;
        buf.push(count);
        if (buf.length > 30) buf.shift();
        const avgMotion = buf.reduce((a, b) => a + b, 0) / (buf.length || 1);

        // 오디오 분석 (analyser 있으면)
        let audioState: 'bark' | 'whine' | 'growl' | 'silent' = 'silent';
        if (analyserRef.current) {
          const freqData = new Uint8Array(analyserRef.current.frequencyBinCount);
          analyserRef.current.getByteFrequencyData(freqData);
          // 주파수 대역 평균: 저(0~20), 중(20~60), 고(60~128) bin
          const lowAvg = freqData.slice(0, 20).reduce((a, b) => a + b, 0) / 20;
          const midAvg = freqData.slice(20, 60).reduce((a, b) => a + b, 0) / 40;
          const highAvg = freqData.slice(60, 128).reduce((a, b) => a + b, 0) / 68;
          const totalVol = (lowAvg + midAvg + highAvg) / 3;

          if (totalVol > 60) {
            // 큰 소리: 주파수 분포로 짖음/낑낑/그로울 구분
            if (highAvg > midAvg && highAvg > lowAvg) {
              audioState = 'whine';  // 고주파 우세 = 낑낑/호소
            } else if (lowAvg > midAvg * 1.2) {
              audioState = 'growl'; // 저주파 우세 = 그로울
            } else {
              audioState = 'bark';  // 중저 혼합 = 짖음
            }
          }
        }

        // 행동 상태 최종 분류 (오디오 우선, 보조로 모션)
        let newBehavior: DogBehaviorState;
        if (audioState === 'bark') newBehavior = 'bark';
        else if (audioState === 'whine') newBehavior = 'whine';
        else if (audioState === 'growl') newBehavior = 'growl';
        else if (avgMotion > 40) newBehavior = 'active';
        else newBehavior = 'calm';

        const now = Date.now();
        setBehaviorState(prev => {
          if (prev !== newBehavior && now - lastBehaviorChangeRef.current > 2500) {
            lastBehaviorChangeRef.current = now;
            return newBehavior;
          }
          return prev;
        });

        if (count > 30) {
          const rawX = (sumX / count / SAMPLE_W) * 100;
          const rawY = (sumY / count / SAMPLE_H) * 100;

          // 부드러운 보간 이동 (lerp)
          const prevX = focusTargetRef.current.x;
          const prevY = focusTargetRef.current.y;
          const lerpX = prevX + (rawX - prevX) * SMOOTH;
          const lerpY = prevY + (rawY - prevY) * SMOOTH;

          // 화면 경계 클램핑: AF 링(84px)이 뷰파인더 밖으로 나가지 않도록
          const newX = Math.max(8, Math.min(92, lerpX));
          const newY = Math.max(8, Math.min(88, lerpY));

          focusTargetRef.current = { x: newX, y: newY };

          setFocusTarget(prev => ({
            ...prev,
            x: newX,
            y: newY,
            active: true,
            dogName: '모션 트래킹'
          }));
        }
      }

      // 현재 프레임 저장
      prevFrameDataRef.current = new Uint8ClampedArray(curr);
      trackingRafRef.current = requestAnimationFrame(analyze);
    };

    // 약간의 딜레이 후 시작 (카메라 스트림 안정화)
    const startDelay = setTimeout(() => {
      trackingRafRef.current = requestAnimationFrame(analyze);
    }, 600);

    return () => {
      clearTimeout(startDelay);
      if (trackingRafRef.current) {
        cancelAnimationFrame(trackingRafRef.current);
        trackingRafRef.current = null;
      }
      prevFrameDataRef.current = null;
    };
  }, [isCameraLive]);


  // 현재 비디오 화면 프레임 캡처 (360px 경량화 & 0.65 JPEG 압축으로 전송 및 비전 분석 시간 대폭 단축)
  const captureCurrentFrameBase64 = (): string | undefined => {
    try {
      const video = videoRef.current;
      if (video && video.videoWidth > 0 && video.videoHeight > 0) {
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = Math.round((video.videoHeight / video.videoWidth) * 360) || 270;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.65);
        }
      }
      if (!isCameraLive && simImgRef.current && simImgRef.current.naturalWidth > 0) {
        const img = simImgRef.current;
        const canvas = document.createElement('canvas');
        canvas.width = 360;
        canvas.height = Math.round((img.naturalHeight / img.naturalWidth) * 360) || 270;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          return canvas.toDataURL('image/jpeg', 0.65);
        }
      }
    } catch (e) {
      console.warn('Frame capture failed:', e);
    }
    return undefined;
  };

  // 로컬 Ollama AI 서버 연결 상태 주기적 확인 (6초 간격)
  useEffect(() => {
    let isMounted = true;
    ollamaService.checkStatus().then(st => {
      if (isMounted) setOllamaConnected(st.isConnected);
    });

    const statusInterval = setInterval(() => {
      ollamaService.checkStatus().then(st => {
        if (isMounted) setOllamaConnected(st.isConnected);
      });
    }, 6000);

    return () => {
      isMounted = false;
      clearInterval(statusInterval);
    };
  }, []);

  // 라이브 모드: 카메라가 켜지면 실제 화면 프레임 분석
  useEffect(() => {
    if (!isCameraLive) return;

    let isCancelled = false;
    let warmupTimer: any = null;

    const fetchAiThought = async () => {
      if (isCancelled || isAnalyzingRef.current) return;
      const frameBase64 = captureCurrentFrameBase64();
      if (!frameBase64) {
        // 카메라 스트림 로딩 중인 경우 500ms 후 재시도
        warmupTimer = setTimeout(fetchAiThought, 500);
        return;
      }

      isAnalyzingRef.current = true;
      setAiAnalyzing(true);
      try {
        const result = await generateDogThought(language, frameBase64);
        if (!isCancelled) {
          if (result.isDogDetected) {
            consecutiveMissRef.current = 0;
            setIsDogInView(true);
            setAiThoughtText(result.thought);
            setAiEmotionTag(result.tag);
          } else {
            consecutiveMissRef.current += 1;
            setIsDogInView(false);
            setAiThoughtText(result.thought || (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogThought);
            setAiEmotionTag(result.tag || (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogTag);
          }
        }
      } catch (err) {
        console.error('Initial vision thought failed:', err);
        if (!isCancelled) {
          setIsDogInView(false);
          setAiThoughtText((LANG_CONFIG[language] || LANG_CONFIG.ko).noDogThought);
          setAiEmotionTag((LANG_CONFIG[language] || LANG_CONFIG.ko).noDogTag);
        }
      } finally {
        isAnalyzingRef.current = false;
        if (!isCancelled) setAiAnalyzing(false);
      }
    };

    // 카메라 켜지고 400ms 후 첫 프레임 분석 시도
    warmupTimer = setTimeout(fetchAiThought, 400);

    return () => {
      isCancelled = true;
      if (warmupTimer) clearTimeout(warmupTimer);
    };
  }, [isCameraLive, language]);

  // 카메라가 켜져 있는 동안 4.2초 주기로 실제 화면 연속 실시간 비전 분석
  useEffect(() => {
    if (!isCameraLive) return;

    const liveLoop = setInterval(async () => {
      if (isAnalyzingRef.current) return;
      const frameBase64 = captureCurrentFrameBase64();
      if (!frameBase64) return;

      isAnalyzingRef.current = true;
      setAiAnalyzing(true);
      try {
        const result = await generateDogThought(language, frameBase64);
        if (result.isDogDetected) {
          consecutiveMissRef.current = 0;
          setIsDogInView(true);
          setAiThoughtText(result.thought);
          setAiEmotionTag(result.tag);
        } else {
          consecutiveMissRef.current += 1;
          setIsDogInView(false);
          setAiThoughtText(result.thought || (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogThought);
          setAiEmotionTag(result.tag || (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogTag);
        }
      } catch (e) {
        console.error('Live loop vision error:', e);
        setIsDogInView(false);
        setAiThoughtText((LANG_CONFIG[language] || LANG_CONFIG.ko).noDogThought);
        setAiEmotionTag((LANG_CONFIG[language] || LANG_CONFIG.ko).noDogTag);
      } finally {
        isAnalyzingRef.current = false;
        setAiAnalyzing(false);
      }
    }, 4200);

    return () => clearInterval(liveLoop);
  }, [isCameraLive, language]);

  // 뷰파인더 탭 시 해당 위치로 포커스 이동
  const handleViewfinderTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocusTarget({ x, y, active: true, dogName: '수동 포커스' });
    setFocusLocked(true);
    setTimeout(() => setFocusLocked(false), 1500);
  };


  const stopLiveCamera = () => {
    if (liveStreamRef.current) {
      liveStreamRef.current.getTracks().forEach(t => {
        try { t.stop(); } catch (e) { }
      });
      liveStreamRef.current = null;
    }
    if (videoRef.current && videoRef.current.srcObject) {
      const s = videoRef.current.srcObject as MediaStream;
      if (s && s.getTracks) {
        s.getTracks().forEach(t => {
          try { t.stop(); } catch (e) { }
        });
      }
      videoRef.current.srcObject = null;
    }
    if ((window as any).__WALWAL_CAMERA_STREAM__) {
      const gStream = (window as any).__WALWAL_CAMERA_STREAM__ as MediaStream;
      gStream.getTracks().forEach(t => {
        try { t.stop(); } catch (e) { }
      });
      (window as any).__WALWAL_CAMERA_STREAM__ = null;
    }
    setHasLiveStream(false);
  };

  const startLiveCamera = async () => {
    if (isStartingRef.current) return;
    isStartingRef.current = true;
    const unlockTimeout = setTimeout(() => {
      isStartingRef.current = false;
    }, 4000);

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasLiveStream(false);
        isStartingRef.current = false;
        return;
      }

      const isCameraBlocked = localStorage.getItem('WALWAL_PERM_CAMERA') === 'false';
      if (isCameraBlocked) {
        stopLiveCamera();
        setIsCameraLive(false);
        isStartingRef.current = false;
        return;
      }

      // 이미 활성화된 스트림이 있다면 즉시 비디오에 연결하여 0ms로 실행
      if (liveStreamRef.current && liveStreamRef.current.active && videoRef.current) {
        const v = videoRef.current;
        v.srcObject = liveStreamRef.current;
        v.play().catch(() => {});
        setHasLiveStream(true);
        setIsCameraLive(true);
        isStartingRef.current = false;
        clearTimeout(unlockTimeout);
        return;
      }

      if ((window as any).__WALWAL_CAMERA_STREAM__ && (window as any).__WALWAL_CAMERA_STREAM__.active && videoRef.current) {
        const gStream = (window as any).__WALWAL_CAMERA_STREAM__ as MediaStream;
        liveStreamRef.current = gStream;
        const v = videoRef.current;
        v.srcObject = gStream;
        v.play().catch(() => {});
        setHasLiveStream(true);
        setIsCameraLive(true);
        isStartingRef.current = false;
        clearTimeout(unlockTimeout);
        return;
      }

      let stream: MediaStream | null = null;

      try {
        // 비디오 단독 요청
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: cameraFacingMode },
          audio: false
        });
      } catch (e1) {
        try {
          // 비디오 폴백
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (e2) {
          console.log('No physical camera or permission denied:', e2);
        }
      }

      if (!isMountedRef.current) {
        if (stream) stream.getTracks().forEach(t => t.stop());
        return;
      }

      if (stream && videoRef.current) {
        liveStreamRef.current = stream;
        (window as any).__WALWAL_CAMERA_STREAM__ = stream;
        const v = videoRef.current;
        v.muted = true;
        (v as any).defaultMuted = true;
        v.playsInline = true;
        v.srcObject = stream;

        try {
          await v.play();
        } catch (playErr) {
          console.log('Video auto-play delayed/prevented:', playErr);
        }

        setHasLiveStream(true);
        setIsCameraLive(true);

        // 마이크 하드웨어 연결 불필요: 자연스러운 환경 소음(45~55dB) 시뮬레이션
        setAudioLevel(48);
      } else {
        setHasLiveStream(false);
      }
    } catch (err: any) {
      console.log('Camera initialization error:', err);
      if (isMountedRef.current) {
        setHasLiveStream(false);
      }
    } finally {
      clearTimeout(unlockTimeout);
      isStartingRef.current = false;
    }
  };

  const toggleRealCamera = async () => {
    if (isCameraLive && hasLiveStream) {
      setIsCameraLive(false);
      localStorage.setItem('WALWAL_PERM_CAMERA', 'false');
      stopLiveCamera();
    } else {
      setIsCameraLive(true);
      localStorage.setItem('WALWAL_PERM_CAMERA', 'true');
      await startLiveCamera();
    }
  };

  // 설정(SettingsView)에서 권한 토글 시 즉시 카메라/마이크 제어
  useEffect(() => {
    const handlePermUpdate = (e: any) => {
      const permType = e?.detail?.type;
      const permValue = e?.detail?.value;

      if (permType === 'camera') {
        const nextLive = permValue !== undefined ? Boolean(permValue) : localStorage.getItem('WALWAL_PERM_CAMERA') === 'true';
        setIsCameraLive(nextLive);
        if (!nextLive) {
          stopLiveCamera();
        } else {
          startLiveCamera();
        }
      } else if (permType === 'mic') {
        const micOn = permValue !== undefined ? Boolean(permValue) : localStorage.getItem('WALWAL_PERM_MIC') === 'true';
        setAudioLevel(micOn ? 48 : 0);
      } else {
        // 일반 storage 이벤트
        const cameraOn = localStorage.getItem('WALWAL_PERM_CAMERA') === 'true';
        setIsCameraLive(cameraOn);
        if (!cameraOn) {
          stopLiveCamera();
        }
      }
    };

    window.addEventListener('walwal_permissions_updated', handlePermUpdate);
    window.addEventListener('storage', handlePermUpdate);

    return () => {
      window.removeEventListener('walwal_permissions_updated', handlePermUpdate);
      window.removeEventListener('storage', handlePermUpdate);
    };
  }, [cameraFacingMode]);

  // 컴포넌트 마운트 및 facingMode 변경 시 처리 (즉시 라이브 카메라 시작)
  useEffect(() => {
    isMountedRef.current = true;
    if (interactionPair) {
      setAnglePreset('pack3');
    }
    const isCameraBlocked = localStorage.getItem('WALWAL_PERM_CAMERA') === 'false';
    if (!isCameraBlocked) {
      setIsCameraLive(true);
      startLiveCamera();
    }

    window.addEventListener('beforeunload', stopLiveCamera);

    // cleanup
    return () => {
      window.removeEventListener('beforeunload', stopLiveCamera);
      isMountedRef.current = false;
      stopLiveCamera();
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(t => t.stop());
        audioStreamRef.current = null;
      }
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => { });
        audioCtxRef.current = null;
      }
    };
  }, [cameraFacingMode]);

  // 하단 탭(AR톡) 또는 재촬영(Retake) 클릭 시 카메라 즉시 시작
  useEffect(() => {
    if (isActiveTrigger && isActiveTrigger > 0) {
      const isCameraBlocked = localStorage.getItem('WALWAL_PERM_CAMERA') === 'false';
      if (!isCameraBlocked) {
        setIsCameraLive(true);
        startLiveCamera();
      }
    }
  }, [isActiveTrigger]);

  const formatRecordTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  const packTurns = getPack3Turns(language);
  const currentTurn = packTurns[turnIndex % packTurns.length] || packTurns[0];
  // 화면 및 카메라 실제 앵글에 따른 동적 가로/세로 해상도 계산 (1280x720 vs 720x1280)
  const getCaptureDimensions = () => {
    // 1. 센서 가속도/자이로 실시간 물리적 방향 확인
    let isLandscapeBySensor = orientationStateRef.current.isLandscape;
    if (lastAccRef.current) {
      const { ax, ay } = lastAccRef.current;
      const planar = Math.sqrt(ax * ax + ay * ay);
      if (planar >= 1.0) {
        isLandscapeBySensor = Math.abs(ax) > Math.abs(ay);
      }
    } else if (lastGyroRef.current) {
      if (Math.abs(lastGyroRef.current.gamma) > 25) {
        isLandscapeBySensor = true;
      }
    }

    // 2. 브라우저/스크린/윈도우 물리 방향 및 수동 선택 확인
    const isScreenLandscape = typeof window !== 'undefined' && window.innerWidth > window.innerHeight;
    const isWindowOrientationLandscape = typeof window !== 'undefined' &&
      typeof window.orientation !== 'undefined' &&
      Math.abs(Number(window.orientation)) === 90;
    const isScreenOrientationLandscape = typeof window !== 'undefined' &&
      typeof window.screen !== 'undefined' &&
      Boolean(window.screen.orientation?.type?.includes('landscape'));
    const isMediaLandscape = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(orientation: landscape)').matches;

    if (isLandscapeMode || isMediaLandscape || isLandscapeBySensor || isScreenLandscape || isWindowOrientationLandscape || isScreenOrientationLandscape) {
      return { width: 1280, height: 720, isLandscape: true };
    }

    // 3. 비디오 스트림 자체가 가로인 경우 (PC 웹캠 등)
    if (hasLiveStream && videoRef.current && videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
      const v = videoRef.current;
      if (v.videoWidth > v.videoHeight) {
        return { width: 1280, height: 720, isLandscape: true };
      }
    }

    // 4. 기본 세로 (720x1280)
    return { width: 720, height: 1280, isLandscape: false };
  };

  // 캔버스에 가로/세로 영상/사진 배경 + 실시간 AI 행동 분석 말풍선 합성
  const drawFrameWithBubble = (context: CanvasRenderingContext2D, cWidth: number, cHeight: number, elapsedSec: number = 0) => {
    const activeTurn = packTurns[turnIndexRef.current % packTurns.length] || packTurns[0];
    const isLandscape = cWidth > cHeight;
    const s = (isLandscape ? cHeight : cWidth) / 400;

    // 1. 배경 비디오 그리기
    if (hasLiveStream && videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
      const v = videoRef.current;
      const isVideoVertical = v.videoHeight > v.videoWidth;
      const isPhysicalLandscape = (typeof window !== 'undefined' && window.innerWidth > window.innerHeight) ||
                                  (typeof window.orientation !== 'undefined' && Math.abs(Number(window.orientation)) === 90) ||
                                  Boolean(typeof window !== 'undefined' && window.screen?.orientation?.type?.includes('landscape'));

      if (isLandscape && isVideoVertical) {
        // 스마트폰을 가로로 돌려 찍었을 때: 세로 카메라 비디오(720x1280) 전체를 90도 회전시켜 1280x720 가로 전체 화면에 시원하게 꽉 채움
        context.save();
        context.translate(cWidth / 2, cHeight / 2);
        let rot = orientationStateRef.current.rotation;
        if (!rot || rot === 0) {
          if (typeof window.orientation !== 'undefined' && Math.abs(Number(window.orientation)) === 90) {
            rot = Number(window.orientation) === 90 ? -90 : 90;
          } else if (typeof window.screen?.orientation?.angle === 'number' && window.screen.orientation.angle !== 0) {
            rot = window.screen.orientation.angle === 90 ? -90 : 90;
          } else {
            rot = -90;
          }
        }
        context.rotate(rot * Math.PI / 180);
        const scale = Math.max(cWidth / v.videoHeight, cHeight / v.videoWidth);
        const dw = v.videoWidth * scale;
        const dh = v.videoHeight * scale;
        context.drawImage(v, -dw / 2, -dh / 2, dw, dh);
        context.restore();
      } else {
        // 화면 회전 잠금 상태에서 가로 모드로 촬영하거나, 비디오가 이미 가로이거나, 세로 모드 촬영일 때:
        // 왜곡/뒤집힘 없이 cWidth x cHeight 중심에 꽉 차게 비율 크롭 렌더링
        const vAspect = v.videoWidth / v.videoHeight;
        const cAspect = cWidth / cHeight;
        let sx = 0, sy = 0, sW = v.videoWidth, sH = v.videoHeight;
        if (vAspect > cAspect) {
          sW = v.videoHeight * cAspect;
          sx = (v.videoWidth - sW) / 2;
        } else {
          sH = v.videoWidth / cAspect;
          sy = (v.videoHeight - sH) / 2;
        }
        context.drawImage(v, sx, sy, sW, sH, 0, 0, cWidth, cHeight);
      }
    } else if (simImgRef.current && simImgRef.current.complete && simImgRef.current.naturalWidth > 0) {
      const img = simImgRef.current;
      const iAspect = img.naturalWidth / img.naturalHeight;
      const cAspect = cWidth / cHeight;
      let sx = 0, sy = 0, sW = img.naturalWidth, sH = img.naturalHeight;
      if (iAspect > cAspect) {
        sW = img.naturalHeight * cAspect;
        sx = (img.naturalWidth - sW) / 2;
      } else {
        sH = img.naturalWidth / cAspect;
        sy = (img.naturalHeight - sH) / 2;
      }
      context.drawImage(img, sx, sy, sW, sH, 0, 0, cWidth, cHeight);
    } else {
      const bgGrad = context.createLinearGradient(0, 0, 0, cHeight);
      bgGrad.addColorStop(0, '#1E293B');
      bgGrad.addColorStop(0.5, '#0F172A');
      bgGrad.addColorStop(1, '#020617');
      context.fillStyle = bgGrad;
      context.fillRect(0, 0, cWidth, cHeight);
    }

    const drawBubble = (
      thought: string, tagLabel: string, behaviorDetail: string, signal: string, conf: number,
      bubbleX: number, bubbleY: number, bubbleW: number,
      bColor: string, title: string
    ) => {
      const padX = 14 * s;
      const padY = 12 * s;

      const fontThought = `bold ${15 * s}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans KR", sans-serif`;
      context.font = fontThought;
      const maxTextW = bubbleW - (padX * 2);

      const words = thought.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      for (let n = 0; n < words.length; n++) {
        const testLine = currentLine ? `${currentLine} ${words[n]}` : words[n];
        if (context.measureText(testLine).width > maxTextW && n > 0) {
          lines.push(currentLine);
          currentLine = words[n];
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = 21 * s;
      const textBlockH = lines.length * lineHeight;
      const headerH = 18 * s;
      const footerH = 16 * s;
      const bubbleH = padY + headerH + 6 * s + textBlockH + 10 * s + footerH + padY;

      context.save();
      context.shadowColor = 'rgba(0, 0, 0, 0.35)';
      context.shadowBlur = 20 * s;
      context.shadowOffsetY = 6 * s;

      context.fillStyle = 'rgba(255, 255, 255, 0.96)';
      context.strokeStyle = bColor;
      context.lineWidth = 1.6 * s;

      const r = 16 * s;
      context.beginPath();
      context.moveTo(bubbleX + r, bubbleY);
      context.lineTo(bubbleX + bubbleW - r, bubbleY);
      context.quadraticCurveTo(bubbleX + bubbleW, bubbleY, bubbleX + bubbleW, bubbleY + r);
      context.lineTo(bubbleX + bubbleW, bubbleY + bubbleH - r);
      context.quadraticCurveTo(bubbleX + bubbleW, bubbleY + bubbleH, bubbleX + bubbleW - r, bubbleY + bubbleH);
      context.lineTo(bubbleX + r, bubbleY + bubbleH);
      context.quadraticCurveTo(bubbleX, bubbleY + bubbleH, bubbleX, bubbleY + bubbleH - r);
      context.lineTo(bubbleX, bubbleY + r);
      context.quadraticCurveTo(bubbleX, bubbleY, bubbleX + r, bubbleY);
      context.closePath();
      context.fill();
      context.stroke();
      context.restore();

      let currY = bubbleY + padY;

      const tagText = `${tagLabel} ${conf}%`;
      context.font = `bold ${9.5 * s}px sans-serif`;
      const tagW = context.measureText(tagText).width + (24 * s); // Increased horizontal padding
      const tagH = 19 * s; // Slightly taller for vertical breathing room
      const tagX = bubbleX + bubbleW - padX - tagW;
      const tagY = currY - 2 * s;

      // Draw title with fixed color and maxWidth to prevent overlap
      context.fillStyle = '#FFB320';
      context.font = `bold ${12 * s}px sans-serif`;
      context.textAlign = 'left';
      context.textBaseline = 'top';
      const availableTitleW = bubbleW - (padX * 2) - tagW - (8 * s);
      context.fillText(title, bubbleX + padX, currY, Math.max(10, availableTitleW));

      // Draw Pill Tag (Transparent background, matched border)
      context.strokeStyle = bColor;
      context.lineWidth = 1 * s;
      context.beginPath();
      const tagR = tagH / 2;
      context.moveTo(tagX + tagR, tagY);
      context.lineTo(tagX + tagW - tagR, tagY);
      context.arc(tagX + tagW - tagR, tagY + tagR, tagR, -Math.PI / 2, Math.PI / 2);
      context.lineTo(tagX + tagR, tagY + tagH);
      context.arc(tagX + tagR, tagY + tagR, tagR, Math.PI / 2, -Math.PI / 2);
      context.closePath();
      context.stroke();

      context.fillStyle = bColor;
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(tagText, tagX + tagW / 2, tagY + tagH / 2);

      currY += headerH + 6 * s;
      context.fillStyle = '#1A202C';
      context.font = fontThought;
      context.textAlign = 'left';
      context.textBaseline = 'top';
      for (let i = 0; i < lines.length; i++) {
        const lineText = (i === 0 ? `"` : '') + lines[i] + (i === lines.length - 1 ? `"` : '');
        context.fillText(lineText, bubbleX + padX, currY + (i * lineHeight));
      }

      currY += textBlockH + 10 * s;
      context.font = `${10.5 * s}px sans-serif`;
      context.fillStyle = '#2D3748';
      context.textAlign = 'left';
      context.textBaseline = 'top';
      const maxBottomLeftW = maxTextW * 0.55;
      context.fillText(behaviorDetail, bubbleX + padX, currY, maxBottomLeftW);

      context.fillStyle = '#718096';
      context.textAlign = 'right';
      const maxBottomRightW = maxTextW * 0.40;
      context.fillText(signal, bubbleX + bubbleW - padX, currY, maxBottomRightW);
    };

    if (anglePreset === 'pack3') {
      const floatY1 = elapsedSec > 0 ? Math.sin(elapsedSec * (Math.PI * 2 / 3.0)) * (7 * s) : 0;
      const floatY2 = elapsedSec > 0 ? Math.sin(elapsedSec * (Math.PI * 2 / 3.2)) * (7 * s) : 0;
      const floatY3 = elapsedSec > 0 ? Math.sin(elapsedSec * (Math.PI * 2 / 2.8)) * (7 * s) : 0;

      const w = cWidth * 0.45; // slightly wider than 38% for canvas readability

      // Left Dog (Index 0)
      drawBubble(
        activeTurn.dogs[0].thought, activeTurn.dogs[0].behavior, activeTurn.dogs[0].behavior, t.ar.behaviorCalm || '이완 안정', activeTurn.dogs[0].conf,
        cWidth * 0.04, cHeight * 0.11 + floatY1, w, '#FFB320', (t.ar.mockDogLeftName || '') + (t.ar.speechSuffix || '')
      );

      // Right Dog (Index 2)
      drawBubble(
        activeTurn.dogs[2].thought, activeTurn.dogs[2].behavior, activeTurn.dogs[2].behavior, t.ar.behaviorActive || '경계 호기심', activeTurn.dogs[2].conf,
        cWidth * 0.51, cHeight * 0.13 + floatY3, w, '#FFBF00', (t.ar.mockDogRightName || '') + (t.ar.speechSuffix || '')
      );

      // Center Dog (Index 1)
      drawBubble(
        activeTurn.dogs[1].thought, activeTurn.dogs[1].behavior, activeTurn.dogs[1].behavior, t.ar.behaviorCalm || '높은 친밀감', activeTurn.dogs[1].conf,
        cWidth * 0.27, cHeight * 0.05 + floatY2, w, '#2EC4B6', (t.ar.mockDogCenterName || '') + (t.ar.speechSuffix || '')
      );
    } else {
      const floatY = elapsedSec > 0 ? Math.sin(elapsedSec * (Math.PI * 2 / 2.8)) * (7 * s) : 0;
      const targetThought = isCameraLive ? aiThoughtTextRef.current : activeTurn.dogs[1].thought;
      const behaviorObj = (t.ar.behaviors as any)?.[behaviorState] || (t.ar.behaviors as any)?.calm;
      const targetConfidence = isCameraLive ? (liveThought.confidence || 95) : 98;
      const targetBehavior = behaviorObj ? `${behaviorObj.detail} ${targetConfidence}%` : (isCameraLive ? liveThought.behavior : '이완 안정 · 신뢰 유대 신호');
      const targetSignal = behaviorObj ? behaviorObj.signal : (isCameraLive ? liveThought.signal : '낮은 모션 + 정상 호흡');
      const behaviorTagText = behaviorState === 'bark' ? t.ar.behaviorBark : behaviorState === 'growl' ? t.ar.behaviorGrowl : behaviorState === 'whine' ? t.ar.behaviorWhine : behaviorState === 'active' ? t.ar.behaviorActive : t.ar.behaviorCalm;
      const behaviorColor = behaviorState === 'bark' ? '#EF4444' : behaviorState === 'growl' ? '#8B5CF6' : behaviorState === 'whine' ? '#3B82F6' : behaviorState === 'active' ? '#EAB308' : '#22C55E';

      const maxBubbleW = isLandscape ? Math.min(cWidth * 0.65, 560 * (s / 1.8)) : cWidth * 0.82;
      drawBubble(
        targetThought, behaviorTagText, targetBehavior, targetSignal, targetConfidence,
        (cWidth - maxBubbleW) / 2, cHeight * 0.08 + floatY, maxBubbleW, behaviorColor, t.ar.realtimeAI
      );
    }
  };


  return (
    <div className="page-root ar-page-root">
      {/* ================= 상단 고정 HUD (카메라 밖) ================= */}
      <div className="ar-header">
        {/* 카메라 모드는 자동 인식되므로 수동 토글 탭은 제거됨 */}

        {/* 서브 옵션: 좌=로고 / 우=타이틀 */}
        <div className="ar-top-bar">
          {/* 좌측: 왈왈 로고 */}
          <div className="ar-logo-container">
            <img
              src={walwalLogo}
              alt="WalWal"
              className="ar-logo"
            />
          </div>

          {/* 우측: Pet Translator & Companion 타이틀 & 전체서비스 햄버거 버튼 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="walwal-info">
              {t.ar.petTranslator}
            </div>
            <button
              className="all-services-header-btn"
              onClick={() => window.dispatchEvent(new CustomEvent('walwal_open_all_services'))}
              aria-label="전체서비스"
              title="전체서비스" >
              <Menu size={24} color="#1E293B" />
            </button>
          </div>
        </div>
      </div>

      {/* 둥근 카드 스타일의 카메라 컨테이너 */}
      <div className="ar-camera-container" onClick={handleViewfinderTap}>



        {/* 3초 녹화 중 상태 배지 */}
        {isCapturingVideo && (
          <div className="ar-recording-badge">
            <div className="ar-recording-dot" />
            <span>
              {(t.ar.recordingVideo || '3초 비디오 녹화 중... ({sec}s)').replace('{sec}', String(captureCountdown > 0 ? captureCountdown : 1))}
            </span>
          </div>
        )}

        {/* 카메라 비디오 & 시뮬레이션 배경 레이어 (줌 뷰포트 확대 적용) */}
        <div className={`ar-viewport-layer zoom-${zoomLevel.replace('.', '')} ${!isCameraLive ? 'offline' : ''}`}>
          {/* 웹캠 미연결 또는 로딩 시 표시되는 강아지 시뮬레이션 배경 */}
          <img
            ref={simImgRef}
            src="/three_dogs_camera.png"
            alt="Dog Camera Simulation"
            className={`ar-sim-bg ${hasLiveStream ? 'is-live' : ''}`}
          />

          {/* 실제 웹캠 비디오 */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            onLoadedMetadata={() => {
              videoRef.current?.play().catch(() => { });
            }}
            onCanPlay={() => {
              setHasLiveStream(true);
              setIsCameraLive(true);
            }}
            className={`ar-webcam-video ${hasLiveStream ? 'is-live' : ''}`}
          />
        </div>

        {/* ================= AR HUD 및 말풍선 오버레이 레이어 (1:1 픽셀 정확한 상단 배치) ================= */}
        <div className="ar-overlay-layer">
          {/* ================= AF 포커스 링 오버레이 ================= */}
          {focusTarget.active && (
            <div
              className={`af-focus-ring ${focusLocked ? 'locked' : 'searching'}`}
              style={{
                left: `calc(${focusTarget.x}% - 42px)`,
                top: `calc(${focusTarget.y}% - 42px)`,
              }}
            >
              {/* Corner brackets */}
              <div className={`af-corner af-corner-tl ${focusLocked ? 'locked' : ''}`} />
              <div className={`af-corner af-corner-tr ${focusLocked ? 'locked' : ''}`} />
              <div className={`af-corner af-corner-bl ${focusLocked ? 'locked' : ''}`} />
              <div className={`af-corner af-corner-br ${focusLocked ? 'locked' : ''}`} />

              {/* Center crosshair dot */}
              <div className={`af-center-dot ${focusLocked ? 'locked' : ''}`} />

              {/* AF Label */}
              {focusLocked && (
                <div className="af-label">
                  {t.ar.afLocked || '● AF 포커스 잠금'}
                </div>
              )}
            </div>
          )}

          {/* ================= 3. 카메라 앵글 속 강아지 머리 위 실시간 AR 말풍선 ================= */}
          {/* 다중 강아지(pack3/교감 모드) 오버레이 표시 */}
          {anglePreset === 'pack3' && (
            <div className="ar-pack3-container">

              {/* Left Dog Speech Bubble (머리 바로 위) */}
              <div className="ar-dog-bubble-left">
                <div className="ar-speech-bubble">
                  <div className="ar-bubble-speaker left">
                    {t.ar.mockDogLeftName}{t.ar.speechSuffix}
                  </div>
                  <div className="ar-bubble-thought">
                    "{currentTurn.dogs[0].thought}"
                  </div>
                  <div className="ar-bubble-behavior left">
                    {currentTurn.dogs[0].behavior}
                  </div>
                  {/* Pointer Arrow */}
                  <div className="ar-bubble-pointer left" />
                </div>
              </div>


              {/* Center Dog Speech Bubble (머리 바로 위) */}
              <div className="ar-dog-bubble-center">
                <div className="ar-speech-bubble center">
                  <div className="ar-bubble-speaker center">
                    {t.ar.mockDogCenterName}{t.ar.speechSuffix}
                  </div>
                  <div className="ar-bubble-thought">
                    "{currentTurn.dogs[1].thought}"
                  </div>
                  <div className="ar-bubble-behavior center">
                    {currentTurn.dogs[1].behavior}
                  </div>
                  {/* Pointer Arrow */}
                  <div className="ar-bubble-pointer center" />
                </div>
              </div>


              {/* Right Dog Speech Bubble (머리 바로 위) */}
              <div className="ar-dog-bubble-right">
                <div className="ar-speech-bubble right">
                  <div className="ar-bubble-speaker right">
                    {t.ar.mockDogRightName}{t.ar.speechSuffix}
                  </div>
                  <div className="ar-bubble-thought">
                    "{currentTurn.dogs[2].thought}"
                  </div>
                  <div className="ar-bubble-behavior right">
                    {currentTurn.dogs[2].behavior}
                  </div>
                  {/* Pointer Arrow */}
                  <div className="ar-bubble-pointer right" />
                </div>
              </div>
            </div>
          )}

          {/* 실제 카메라(웹캠) ON 시 - 단일 강아지 라이브 AR 오버레이 (교감 모드가 아닐 때만 표시) */}
          {anglePreset !== 'pack3' && (() => {
            // 탐지 박스: focusTarget 중심, 화면 안에 유지 (박스 44%×30% half-size)
            const BOX_W = 44; // % 단위 반폭
            const BOX_H = 30; // % 단위 반높이
            const boxLeft = Math.max(2, Math.min(100 - BOX_W * 2, focusTarget.x - BOX_W));
            const boxTop = Math.max(18, Math.min(100 - BOX_H * 2 - 5, focusTarget.y - BOX_H));

            return (
              <div className="ar-detection-overlay">
                {/* 동적 탐지 박스 (실제 강아지가 감지되었을 때만 표시) */}
                {isDogInView && (
                  <div
                    className="ar-detection-box"
                    style={{
                      left: `${boxLeft}%`,
                      top: `${boxTop}%`,
                      width: `${BOX_W * 2}%`,
                      height: `${BOX_H * 2}%`,
                    }}
                  >
                    <div className="ar-detection-label">
                      ● {t.ar.afLock}
                    </div>
                    <div className="ar-detection-eye left" />
                    <div className="ar-detection-eye right" />
                  </div>
                )}

                {/* 말풍선 - 상단 배치 (하단 컨트롤 및 데시벨 안내와 겹치지 않도록 상단 영역에 배치) */}
                <div className={`ar-live-bubble-container ${isCapturingVideo ? 'capturing' : ''}`}>
                  <div className="ar-speech-bubble live">
                    <div className="ar-live-bubble-header">
                      <span className="ar-live-bubble-title" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {ollamaConnected ? (
                          <>
                            <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22C55E', boxShadow: '0 0 8px #22C55E' }} />
                            <span>Ollama LLaVA (로컬)</span>
                          </>
                        ) : (
                          <>
                            <span style={{
                              display: 'inline-block',
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: aiAnalyzing ? '#F59E0B' : '#38BDF8',
                              boxShadow: aiAnalyzing ? '0 0 8px #F59E0B' : '0 0 8px #38BDF8',
                              transition: 'all 0.3s ease'
                            }} />
                            <span>{aiAnalyzing ? (language === 'ko' ? '분석 중...' : language === 'zh' ? '分析中...' : language === 'ja' ? '分析中...' : language === 'fr' ? 'Analyse...' : language === 'es' ? 'Analizando...' : 'Analyzing...') : 'Gemini AI'}</span>
                          </>
                        )}
                      </span>
                      <div className="ar-live-bubble-info">
                        <span className={`ar-live-bubble-tag tag-${isDogInView ? 'active' : 'calm'}`}>
                          {isDogInView ? aiEmotionTag : (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogTag}
                        </span>
                      </div>
                    </div>
                    <div className="liveThought-text">
                      {isDogInView ? (
                        `"${aiThoughtText}"`
                      ) : (
                        (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogThought
                      )}
                    </div>
                    {isDogInView && (() => {
                      const behaviorObj = (t.ar.behaviors as any)?.[behaviorState] || (t.ar.behaviors as any)?.calm;
                      const targetConfidence = isCameraLive ? (liveThought.confidence || 95) : 98;
                      const detailText = behaviorObj ? `${behaviorObj.detail} ${targetConfidence}%` : liveThought.behavior;
                      const signalText = behaviorObj ? behaviorObj.signal : liveThought.signal;
                      return (
                        <div className="ar-live-bubble-footer" style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '6px',
                          paddingTop: '6px',
                          borderTop: '1px solid rgba(0, 0, 0, 0.06)',
                          fontSize: '11px',
                          color: '#64748B'
                        }}>
                          <span style={{ fontWeight: 500, color: '#334155' }}>{detailText}</span>
                          <span style={{ color: '#94A3B8' }}>{signalText}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            );
          })()}
        </div> {/* 카메라 + AR 오버레이 통합 래퍼 끝 */}

        {/* 오프라인 상태 (카메라 미연결 시 원터치 켜기 버튼 선명하게 노출) */}
        {(!isCameraLive || !hasLiveStream) && (
          <div className="ar-offline-overlay">
            <div className="ar-offline-walking-container">
              <img src={walwalWalking} className='ar-offline-walking-img' />
            </div>
            <button
              onClick={toggleRealCamera}
              className="ar-offline-turn-on-btn"
              title={t.ar.turnOnCamera || "카메라 켜기"}
            >
              <Camera size={38} color="#FFFFFF" />
            </button>
          </div>
        )}


        {/* ================= 4. 비디오 오디오 파형 & 실시간 마이크 레벨 ================= */}
        <div className={`ar-audio-level-container ${!isCameraLive ? 'offline' : ''}`}>
          <Volume2 size={13} color="#2EC4B6" />
          <div className="ar-audio-level-bars">
            {[30, 60, 45, 80, 50, 90, 40].map((h, i) => (
              <div
                key={i}
                className="ar-audio-level-bar"
                style={{
                  height: Math.min(14, (audioLevel / 100) * h) + 'px',
                }}
              />
            ))}
          </div>
          <span className="ar-audio-level-text">{audioLevel}dB</span>
          <span className="ar-audio-level-freq">
            {t.ar.freqAnalyzing}
          </span>
        </div>

        {/* ================= 5. 하단 동영상 촬영 컨트롤 바 ================= */}
        <div className={`ar-bottom-control-bar ${!isCameraLive ? 'offline' : ''}`}>

          {/* 중앙 공유/캡처 버튼 */}
          <div className="ar-capture-btn-group">
            <button className={`bottom-bar-btn ${!isCapturingVideo ? 'shot' : ''}`}
              onClick={() => {
                if (isCapturingVideo) return;

                confetti({
                  particleCount: 20,
                  spread: 40,
                  origin: { y: 0.8 }
                });

                const targetDog = anglePreset === 'pack3' ? getMockDogs(language)[1] : (myDogProfile || getMockDogs(language)[0]);
                const targetThought = isCameraLive ? (isDogInView ? aiThoughtText : (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogThought) : currentTurn.dogs[1].thought;

                try {
                  // 실제 촬영 앵글(가로 1280x720 / 세로 720x1280)에 맞춘 동적 해상도 적용
                  const { width: CANVAS_W, height: CANVAS_H } = getCaptureDimensions();
                  const canvas = document.createElement('canvas');
                  canvas.width = CANVAS_W;
                  canvas.height = CANVAS_H;
                  canvas.style.position = 'absolute';
                  canvas.style.left = '-9999px';
                  canvas.style.top = '0';
                  canvas.style.opacity = '0';
                  canvas.style.pointerEvents = 'none';
                  document.body.appendChild(canvas);

                  const ctx = canvas.getContext('2d');
                  if (!ctx) throw new Error('Could not create canvas 2d context');

                  const startTime = performance.now();
                  drawFrameWithBubble(ctx, canvas.width, canvas.height, 0);

                  const captureStreamFn = (canvas as any).captureStream || (canvas as any).webkitCaptureStream;
                  let stream: MediaStream | null = null;
                  if (typeof captureStreamFn === 'function') {
                    try {
                      stream = captureStreamFn.call(canvas, 30);
                    } catch (streamErr) {
                      console.warn('captureStream failed:', streamErr);
                    }
                  }

                  // iOS/Safari 등 캔버스 스트림 미지원 브라우저는 실제 웹캠 스트림으로 폴백
                  if (!stream && videoRef.current?.srcObject) {
                    stream = videoRef.current.srcObject as MediaStream;
                  }

                  if (!stream || typeof (window as any).MediaRecorder === 'undefined') {
                    throw new Error('captureStream or MediaRecorder not supported');
                  }

                  let options: any = undefined;
                  const MR = (window as any).MediaRecorder;
                  if (typeof MR.isTypeSupported === 'function') {
                    if (MR.isTypeSupported('video/mp4;codecs=avc1')) {
                      options = { mimeType: 'video/mp4;codecs=avc1', videoBitsPerSecond: 1_200_000 };
                    } else if (MR.isTypeSupported('video/mp4')) {
                      options = { mimeType: 'video/mp4', videoBitsPerSecond: 1_200_000 };
                    } else if (MR.isTypeSupported('video/webm;codecs=vp9')) {
                      options = { mimeType: 'video/webm;codecs=vp9', videoBitsPerSecond: 1_200_000 };
                    } else if (MR.isTypeSupported('video/webm')) {
                      options = { mimeType: 'video/webm', videoBitsPerSecond: 1_200_000 };
                    }
                  }

                  const mediaRecorder = options ? new MR(stream, options) : new MR(stream);
                  mediaRecorderRef.current = mediaRecorder;
                  const chunks: BlobPart[] = [];

                  mediaRecorder.ondataavailable = (e: any) => {
                    if (e.data && e.data.size > 0) chunks.push(e.data);
                  };

                  mediaRecorder.onstop = () => {
                    setIsCapturingVideo(false);
                    setCaptureCountdown(0);
                    const actualMimeType = mediaRecorder.mimeType || (options?.mimeType?.includes('mp4') ? 'video/mp4' : 'video/webm');
                    const blob = new Blob(chunks, { type: actualMimeType });
                    const videoUrl = URL.createObjectURL(blob);
                    blobCache.set(videoUrl, blob);

                    // Extract poster frame from current canvas
                    let poster = '';
                    try {
                      poster = canvas.toDataURL('image/jpeg', 0.85);
                    } catch (e) { }

                    // 3초 동영상 녹화 완료 후 스냅스(Snaps) 등록으로 직행
                    if (onCaptureToSnaps) {
                      onCaptureToSnaps(targetDog, targetThought, videoUrl, poster, true);
                    } else if (onCaptureToFeed) {
                      onCaptureToFeed(targetDog, targetThought, videoUrl, poster, true);
                    } else {
                      onCaptureToStory(targetDog, targetThought, videoUrl, poster);
                    }
                    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                  };

                  setIsCapturingVideo(true);
                  setCaptureCountdown(3);

                  let count = 3;
                  const countInterval = setInterval(() => {
                    count--;
                    setCaptureCountdown(count);
                    if (count <= 0) clearInterval(countInterval);
                  }, 1000);

                  mediaRecorder.start();

                  let animationId: number;
                  const renderFrame = () => {
                    const elapsed = (performance.now() - startTime) / 1000;
                    drawFrameWithBubble(ctx, canvas.width, canvas.height, elapsed);
                    animationId = requestAnimationFrame(renderFrame);
                  };
                  renderFrame();

                  setTimeout(() => {
                    clearInterval(countInterval);
                    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
                      mediaRecorderRef.current.stop();
                      cancelAnimationFrame(animationId);
                    }
                  }, 3000);
                  return;
                } catch (e) {
                  setIsCapturingVideo(false);
                  setCaptureCountdown(0);
                  console.error('Canvas capture fallback to snapshot:', e);

                  let snapshot = '';
                  const { width: CANVAS_W, height: CANVAS_H } = getCaptureDimensions();
                  const canvas = document.createElement('canvas');
                  canvas.width = CANVAS_W;
                  canvas.height = CANVAS_H;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    drawFrameWithBubble(ctx, canvas.width, canvas.height, 0);
                    snapshot = canvas.toDataURL('image/jpeg', 0.85);
                    fetch(snapshot).then(r => r.blob()).then(blob => blobCache.set(snapshot, blob)).catch(console.error);
                  }
                  if (onCaptureToSnaps) {
                    onCaptureToSnaps(targetDog, targetThought, snapshot, snapshot, false);
                  } else if (onCaptureToFeed) {
                    onCaptureToFeed(targetDog, targetThought, snapshot, snapshot, false);
                  } else {
                    onCaptureToStory(targetDog, targetThought, snapshot);
                  }
                }
              }}
              title={
                isCapturingVideo
                  ? (t.ar.recordingTitle || '녹화 중... ({sec}s)').replace('{sec}', String(captureCountdown))
                  : (t.ar.captureVideoTitle || "스냅스 동영상 촬영 (3초)")
              }
            >
              {isCapturingVideo ? (
                <div className="ar-btn-countdown-wrap">
                  <div className="ar-btn-countdown-dot" />
                  <span className="ar-btn-countdown-num">{captureCountdown}</span>
                </div>
              ) : (
                <Scan size={30} strokeWidth={2} />
              )}
            </button>
          </div>

          {/* 중앙: 줌 버튼 및 카메라 전환 */}
          <div className="ar-zoom-container center-ctrl">
            <div className="ar-zoom-group">
              {(['0.5x', '1x', '2x'] as const).map(z => (
                <button
                  className={`button ${zoomLevel === z ? 'active' : ''}`}
                  key={z}
                  onClick={() => setZoomLevel(z)}
                >
                  {z}
                </button>
              ))}


              {/* 카메라 전환 버튼 */}
              <button className="button" title={t.ar.switchCamera || "카메라 전환"} onClick={() => setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}>
                <RefreshCw size={20} />
              </button>
            </div>
          </div>

          <button className="bottom-bar-btn"
            onClick={() => {
              confetti({
                particleCount: 16,
                spread: 35,
                origin: { y: 0.8 }
              });

              const targetDog = anglePreset === 'pack3' ? getMockDogs(language)[1] : (myDogProfile || getMockDogs(language)[0]);
              const targetThought = isCameraLive ? (isDogInView ? aiThoughtText : (LANG_CONFIG[language] || LANG_CONFIG.ko).noDogThought) : currentTurn.dogs[1].thought;

              const { width: CANVAS_W, height: CANVAS_H } = getCaptureDimensions();
              const canvas = document.createElement('canvas');
              canvas.width = CANVAS_W;
              canvas.height = CANVAS_H;
              const ctx = canvas.getContext('2d');
              let snapshot = '';

              if (ctx) {
                drawFrameWithBubble(ctx, CANVAS_W, CANVAS_H, 0);
                snapshot = canvas.toDataURL('image/jpeg', 0.9);
              }

              if (onCaptureToSnaps) {
                onCaptureToSnaps(targetDog || myDogProfile, targetThought, snapshot);
              } else if (onCaptureToFeed) {
                onCaptureToFeed(targetDog || myDogProfile, targetThought, snapshot);
              }
            }}
            title={t.ar.capturePhotoTitle || "스냅샷 추가"}
          >
            <Camera size={30} strokeWidth={2} />
          </button>
        </div>


      </div>

      {/* Owner Note Modal */}
      <OwnerNoteModal
        isOpen={!!ownerNoteTarget}
        targetDog={ownerNoteTarget}
        onClose={() => setOwnerNoteTarget(null)}
      />
    </div >
  );
};
