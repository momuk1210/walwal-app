import React, { useState, useEffect, useRef } from 'react';
import { Camera, RefreshCw, Volume2, Share2, ShieldCheck, Zap, Activity, MessageCircle, Send, Video, Play, Pause, Disc, Layers, PlusSquare, Bone, Scan, ScanFace } from 'lucide-react';
import { BREED_DEFINITIONS, BreedDefinition } from '../data/breedProfiles';
import { DogProfile, MOCK_DOGS, getMockDogs } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { OwnerNoteModal } from './OwnerNoteModal';
import { generateDogThought } from '../services/aiTranslator';
import { blobCache } from '../utils/mediaStore';
import '../styles/ARCameraView.css';
import confetti from 'canvas-confetti';
import walwalLogo from '../assets/walwal.svg';
import walwalWalking from '../assets/walwal-walking.gif';

interface ARCameraViewProps {
  onCaptureToStory: (dog: any, thought: string, snapshot?: string) => void;
  onCaptureToFeed?: (dog: any, thought: string, snapshot?: string) => void;
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

// 삼형제 실시간 비디오 대화 시나리오 턴
const PACK3_TURNS: { stage: string; dogs: { thought: string; behavior: string; conf: number }[] }[] = [
  {
    stage: '1단계: 시선 고정 & 간식 냄새 포착',
    dogs: [
      {
        thought: '오! 주머니에 간식 냄새 킁킁! 🐶',
        behavior: '귀 32° 전방 직립 · 호기심 96%',
        conf: 96
      },
      {
        thought: '형아 폼 미쳤다! 내가 제일 먼저 꼬리친다 멍!',
        behavior: '가슴 활짝 폄 · 리더십 자세 98%',
        conf: 98
      },
      {
        thought: '얌전히 있으면 간식 떨어지겠지? 헤헤 🤤',
        behavior: '고개 15° 갸우뚱 · 애교 신호 97%',
        conf: 97
      }
    ]
  },
  {
    stage: '2단계: 카밍 시그널 & 착한 척하기',
    dogs: [
      {
        thought: '앞발 모았으니까 얼른 찍고 간식 줘!',
        behavior: '앞발런지 교차 · 대기 신호 95%',
        conf: 95
      },
      {
        thought: '오늘 산책 완벽했지? 꼬리 살랑~',
        behavior: '꼬리 수평 3.1Hz 와깅 · 호의 99%',
        conf: 99
      },
      {
        thought: '손이 주머니로 간다! 드디어 나온다 멍!',
        behavior: '입술 이완 헐떡임 · 기대감 98%',
        conf: 98
      }
    ]
  },
  {
    stage: '3단계: 간식 쟁탈전 & 합동 애교 발사',
    dogs: [
      {
        thought: '형아들 비켜! 간식은 내가 먼저!',
        behavior: '체중 전방 이동 · 적극 탐색 97%',
        conf: 97
      },
      {
        thought: '막내야 줄 서! 하나씩 먹어야 착한 댕댕이지!',
        behavior: '귀 쫑긋 정렬 · 맏형 모드 98%',
        conf: 98
      },
      {
        thought: '냠냠 최고다 멍! 다 먹고 뛰자!',
        behavior: '프로펠러 꼬리 와깅 · 극찬 케미 99%',
        conf: 99
      }
    ]
  }
];


// ===== 실시간 강아지 행동+음성 분석 시나리오 =====
// 행동 상태: bark(짖음) / whine(낑낑) / growl(그로울) / active(활발 조용) / calm(조용 안정)
type DogBehaviorState = 'bark' | 'whine' | 'growl' | 'active' | 'calm';

interface LiveScenario { thought: string; behavior: string; signal: string; confidence: number }

const LIVE_DOG_SCENARIOS: Record<DogBehaviorState, LiveScenario[]> = {
  // 짖음 감지 (고음량 + 중저주파 버스트)
  bark: [
    { thought: '야!! 거기 누구야! 내 구역이다 멍멍!!', behavior: '경계 짖음 · 영역 방어 반응 97%', signal: '고음량 짖음 감지', confidence: 97 },
    { thought: '집사 온다!! 나 여기 있어 멍!!', behavior: '환영 짖음 · 재회 흥분 99%', signal: '반복 짖음 패턴 감지', confidence: 99 },
    { thought: '냄새가 이상해! 조심해 멍멍!!', behavior: '경보 짖음 · 위협 인식 94%', signal: '연속 짖음 버스트 감지', confidence: 94 },
    { thought: '저 소리 들었어?! 나한테 맡겨 멍!!', behavior: '탐지 짖음 · 청각 자극 반응 96%', signal: '외부 자극 반응 짖음', confidence: 96 },
    { thought: '빨리 문 열어! 나가고 싶다 멍!!', behavior: '요구 짖음 · 행동 촉구 98%', signal: '간헐적 요구 짖음 감지', confidence: 98 },
  ],
  // 낑낑 감지 (중음량 + 고주파)
  whine: [
    { thought: '집사 어디 가... 나 혼자 두고 가지마 🥺', behavior: '분리 불안 신호 · 애착 표현 96%', signal: '고주파 낑낑 감지', confidence: 96 },
    { thought: '배고파... 고기 줘... 꼬르륵 🍖', behavior: '식욕 호소 신호 · 요구 표현 94%', signal: '지속 고주파 발성 감지', confidence: 94 },
    { thought: '발바닥이 이상해... 아픈 거 같아 😢', behavior: '통증/불편 신호 · 주의 필요 88%', signal: '낮은 낑낑 + 자세 변화', confidence: 88 },
    { thought: '너무 신나! 빨리 산책 가자 낑낑!', behavior: '흥분 억제 신호 · 기대감 95%', signal: '흥분성 고주파 발성', confidence: 95 },
    { thought: '무서운 냄새... 집사 옆에 딱 붙어있어야지 😰', behavior: '불안 카밍 신호 · 보호 요청 91%', signal: '불안성 낑낑 발성', confidence: 91 },
  ],
  // 그로울 감지 (저음량 + 저주파 지속)
  growl: [
    { thought: '가까이 오지 마. 여긴 내 구역이야 😤', behavior: '경고 그로울 · 영역 주장 98%', signal: '저주파 지속 그로울 감지', confidence: 98 },
    { thought: '저거 내 거야! 건들지 마 👀', behavior: '자원 방어 그로울 · 소유 반응 95%', signal: '자원 앞 저주파 발성', confidence: 95 },
    { thought: '나 지금 사냥 놀이 모드다! 어흥 🎮', behavior: '플레이 그로울 · 놀이 초대 89%', signal: '플레이 중 저주파 발성', confidence: 89 },
    { thought: '뭔가 맘에 안 들어... 지켜보고 있다 🤨', behavior: '불만 그로울 · 불쾌 신호 93%', signal: '간헐적 저주파 그로울', confidence: 93 },
  ],
  // 활발하게 움직이지만 조용 (모션 높음 + 음량 낮음)
  active: [
    { thought: '뭔가 있다 킁킁! 냄새 추적 시작! 🔍', behavior: '무성 탐색 · 후각 주도 이동 95%', signal: '고모션 + 저음량 · 탐색 행동', confidence: 95 },
    { thought: '내 구역 순찰 중! 이상 무', behavior: '순찰 보행 · 영역 확인 행동 93%', signal: '규칙적 이동 패턴 감지', confidence: 93 },
    { thought: '저기 꿀잼 냄새! 빨리 가보자 🎾', behavior: '자발적 이동 · 놀이 탐색 96%', signal: '빠른 이동 + 귀 전방 직립', confidence: 96 },
    { thought: '달리고 싶어! 전속력으로 고고 🏃', behavior: '과잉 에너지 · 운동 욕구 97%', signal: '전신 근육 긴장 + 이동 반복', confidence: 97 },
    { thought: '여기도 저기도 다 볼 거야! 바쁘다 바빠 👀', behavior: '다방향 주의 · 활발 탐색 91%', signal: '빠른 시선 이동 + 체중 전방', confidence: 91 },
  ],
  // 조용하고 안정적 (모션 낮음 + 음량 낮음)
  calm: [
    { thought: '집사 옆이 최고야~ 행복해 ☀️', behavior: '이완 안정 · 신뢰 유대 신호 98%', signal: '낮은 모션 + 정상 호흡', confidence: 98 },
    { thought: '킁킁... 집사 오늘 고기 먹었네? 👃', behavior: '후각 환경 분석 · 이완 탐색 92%', signal: '비강 확장 · 느린 이동', confidence: 92 },
    { thought: '졸려... 눈이 자꾸 감긴다 😴', behavior: '수면 전 이완 · 경계 완화 96%', signal: '순막 이완 + 호흡 느림', confidence: 96 },
    { thought: '오늘 산책도 밥도 완벽했다 🍖', behavior: '만족 이완 · 세로토닌 상태 99%', signal: '꼬리 낮은 와깅 + 눈 부드러움', confidence: 99 },
    { thought: '누구 냄새지? 기다려볼까 ⏳', behavior: '수동 대기 · 자극 기다림 90%', signal: '귀 측면 경청 + 저모션', confidence: 90 },
    { thought: '집사 기분 좋아보이네! 나도 좋다 🐶', behavior: '정서 동기화 · 공감 반응 94%', signal: '시선 추적 + 꼬리 서행 와깅', confidence: 94 },
  ]
};

export const ARCameraView: React.FC<ARCameraViewProps> = ({
  onCaptureToStory,
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
  const [isCameraLive, setIsCameraLive] = useState<boolean>(true);
  const [hasLiveStream, setHasLiveStream] = useState<boolean>(false);
  const [cameraFacingMode, setCameraFacingMode] = useState<'environment' | 'user'>('environment');
  const [zoomLevel, setZoomLevel] = useState<'0.5x' | '1x' | '2x'>('1x');
  const [audioLevel, setAudioLevel] = useState<number>(52);
  const [focusTarget, setFocusTarget] = useState<{ x: number; y: number; active: boolean; dogName: string }>({ x: 50, y: 50, active: false, dogName: '' });
  const [behaviorState, setBehaviorState] = useState<DogBehaviorState>('calm');
  const [scenarioIdx, setScenarioIdx] = useState<number>(0);
  const [isCapturingVideo, setIsCapturingVideo] = useState<boolean>(false);
  const [captureCountdown, setCaptureCountdown] = useState<number>(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const liveScenarios = (t.ar.liveScenarios || LIVE_DOG_SCENARIOS) as Record<DogBehaviorState, LiveScenario[]>;
  const liveThought = liveScenarios[behaviorState]?.[scenarioIdx] || LIVE_DOG_SCENARIOS.calm[0];
  const [focusLocked, setFocusLocked] = useState<boolean>(false);

  const [aiAnalyzing, setAiAnalyzing] = useState<boolean>(false);
  const [aiThoughtText, setAiThoughtText] = useState<string>(liveThought.thought);
  const aiThoughtTextRef = useRef<string>(liveThought.thought);

  useEffect(() => {
    aiThoughtTextRef.current = aiThoughtText;
  }, [aiThoughtText]);
  const [ownerNoteTarget, setOwnerNoteTarget] = useState<DogProfile | null>(null);
  const [showTargetSelector, setShowTargetSelector] = useState<boolean>(false);

  // 단독견 프리셋용 (프로필 데이터 연동)
  const [myDogProfile] = useState<DogProfile>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0];
      }
    } catch (e) { }
    return getMockDogs(language)[0];
  });

  const videoRef = useRef<HTMLVideoElement | null>(null);
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
      setTurnIndex(prev => (prev + 1) % PACK3_TURNS.length);
    }, 6500);

    return () => clearInterval(turnInterval);
  }, []);


  // 자동 포커스: 가운데(주피사체) 강아지로 자동 포커싱 후 순환
  useEffect(() => {
    // 시작 시 가운데 강아지 자동 포커싱
    const initialFocus = setTimeout(() => {
      setFocusTarget({ x: 53, y: 47, active: true, dogName: '인절미 (가운데)' });
      setFocusLocked(true);
      setTimeout(() => setFocusLocked(false), 1500);
    }, 800);

    // 포커스 대상을 6.5초마다 순환: 가운데 -> 좌 -> 우 -> 가운데
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


  // 라이브 모드: 모션/오디오 강도(behaviorState)가 변경될 때만 멘트 갱신 (AI 연동)
  useEffect(() => {
    if (!isCameraLive) return;

    const len = LIVE_DOG_SCENARIOS[behaviorState].length;
    setScenarioIdx(Math.floor(Math.random() * len));

    // Gemini AI 호출 로직
    let isCancelled = false;
    const fetchAiThought = async () => {
      setAiAnalyzing(true);

      const dogName = myDogProfile?.name || '멍멍이';
      const breed = myDogProfile?.breed || '말티즈';
      const age = myDogProfile?.age ? parseInt(myDogProfile.age as string, 10) : 3;

      const generatedText = await generateDogThought(dogName, breed, age, behaviorState, language);
      if (!isCancelled) {
        setAiThoughtText(generatedText);
        setAiAnalyzing(false);
      }
    };

    // 딜레이를 주어 너무 잦은 API 호출 방지
    const timer = setTimeout(() => {
      fetchAiThought();
    }, 500);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [isCameraLive, behaviorState, language, myDogProfile]);

  // 뷰파인더 탭 시 해당 위치로 포커스 이동
  const handleViewfinderTap = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setFocusTarget({ x, y, active: true, dogName: '수동 포커스' });
    setFocusLocked(true);
    setTimeout(() => setFocusLocked(false), 1500);
  };


  const startLiveCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setHasLiveStream(false);
        return;
      }
      let stream: MediaStream | null = null;
      try {
        // 1순위: 모바일 환경 후면 카메라 우선 (ideal)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: cameraFacingMode } },
          audio: false
        });
      } catch (e1) {
        try {
          // 2순위: PC/노트북 웹캠 또는 기본 카메라 폴백
          stream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: false
          });
        } catch (e2) {
          console.log('No physical camera or permission denied:', e2);
        }
      }

      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play().catch(err => console.log('Video play error:', err));
        setHasLiveStream(true);
        setIsCameraLive(true);
      } else {
        setHasLiveStream(false);
      }

      // 마이크 오디오 분석기 시작
      try {
        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        audioStreamRef.current = micStream;
        const ctx = new AudioContext();
        audioCtxRef.current = ctx;
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.6;
        const src = ctx.createMediaStreamSource(micStream);
        src.connect(analyser);
        analyserRef.current = analyser;
      } catch (micErr) {
        console.log('Mic not available, motion-only analysis:', micErr);
      }
    } catch (err) {
      console.log('Camera permission or device not ready, live simulation active:', err);
      setHasLiveStream(false);
    }
  };

  const toggleRealCamera = async () => {
    if (isCameraLive) {
      // 카메라 트랙을 끄지 않고 상태만 오프라인으로 변경 (블러 처리된 배경 유지를 위함)
      setIsCameraLive(false);
    } else {
      setIsCameraLive(true);
      if (!videoRef.current?.srcObject) {
        await startLiveCamera();
      }
    }
  };

  // 컴포넌트 마운트 시 실시간 카메라 자동 활성화
  useEffect(() => {
    if (interactionPair) {
      setAnglePreset('pack3');
    }
    startLiveCamera();

    // cleanup
    return () => {
      if (videoRef.current?.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(t => t.stop());
      }
      if (audioCtxRef.current) audioCtxRef.current.close();
    };
  }, [cameraFacingMode]);

  // 하단 탭을 다시 클릭했을 때 카메라 상태 토글
  useEffect(() => {
    if (isActiveTrigger && isActiveTrigger > 0) {
      setIsCameraLive(prev => {
        const nextState = !prev;
        if (nextState && !videoRef.current?.srcObject) {
          setTimeout(() => startLiveCamera(), 0);
        }
        return nextState;
      });
    }
  }, [isActiveTrigger]);

  const formatRecordTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };
  const currentTurn = PACK3_TURNS[turnIndex];

  // 캔버스에 9:16 영상/사진 배경 + 실시간 AI 행동 분석 말풍선 합성
  const drawFrameWithBubble = (context: CanvasRenderingContext2D, cWidth: number, cHeight: number, elapsedSec: number = 0) => {
    const activeTurn = PACK3_TURNS[turnIndexRef.current] || PACK3_TURNS[0];
    const s = cWidth / 400;

    // 1. 배경 비디오를 9:16 캔버스에 맞춰 object-fit: cover 비율로 크롭하여 그리기
    if (hasLiveStream && videoRef.current && videoRef.current.readyState >= 2 && videoRef.current.videoWidth > 0) {
      const v = videoRef.current;
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
      context.fillText(`🧬 ${behaviorDetail}`, bubbleX + padX, currY, maxBottomLeftW);

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
        activeTurn.dogs[0].thought, activeTurn.dogs[0].behavior, activeTurn.dogs[0].behavior, '이완 안정', activeTurn.dogs[0].conf,
        cWidth * 0.04, cHeight * 0.11 + floatY1, w, '#FFB320', (t.ar.mockDogLeftName || '') + (t.ar.speechSuffix || '')
      );

      // Right Dog (Index 2)
      drawBubble(
        activeTurn.dogs[2].thought, activeTurn.dogs[2].behavior, activeTurn.dogs[2].behavior, '경계 호기심', activeTurn.dogs[2].conf,
        cWidth * 0.51, cHeight * 0.13 + floatY3, w, '#FFBF00', (t.ar.mockDogRightName || '') + (t.ar.speechSuffix || '')
      );

      // Center Dog (Index 1)
      drawBubble(
        activeTurn.dogs[1].thought, activeTurn.dogs[1].behavior, activeTurn.dogs[1].behavior, '높은 친밀감', activeTurn.dogs[1].conf,
        cWidth * 0.27, cHeight * 0.05 + floatY2, w, '#2EC4B6', (t.ar.mockDogCenterName || '') + (t.ar.speechSuffix || '')
      );
    } else {
      const floatY = elapsedSec > 0 ? Math.sin(elapsedSec * (Math.PI * 2 / 2.8)) * (7 * s) : 0;
      const targetThought = isCameraLive ? aiThoughtTextRef.current : activeTurn.dogs[1].thought;
      const targetBehavior = isCameraLive ? liveThought.behavior : '이완 안정 · 신뢰 유대 신호';
      const targetSignal = isCameraLive ? liveThought.signal : '낮은 모션 + 정상 호흡';
      const targetConfidence = isCameraLive ? liveThought.confidence : 98;
      const behaviorTagText = behaviorState === 'bark' ? t.ar.behaviorBark : behaviorState === 'growl' ? t.ar.behaviorGrowl : behaviorState === 'whine' ? t.ar.behaviorWhine : behaviorState === 'active' ? t.ar.behaviorActive : t.ar.behaviorCalm;
      const behaviorColor = behaviorState === 'bark' ? '#EF4444' : behaviorState === 'growl' ? '#8B5CF6' : behaviorState === 'whine' ? '#3B82F6' : behaviorState === 'active' ? '#EAB308' : '#22C55E';

      drawBubble(
        targetThought, behaviorTagText, targetBehavior, targetSignal, targetConfidence,
        (cWidth - cWidth * 0.82) / 2, cHeight * 0.08 + floatY, cWidth * 0.82, behaviorColor, t.ar.realtimeAI
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

          {/* 우측: Pet Translator & Companion 타이틀 */}
          <div className="walwal-info">
            {t.ar.petTranslator}
          </div>
        </div>
      </div>

      {/* 둥근 카드 스타일의 카메라 컨테이너 */}
      <div className="ar-camera-container" onClick={handleViewfinderTap}>

        {/* 5초 녹화 중 상태 배지 */}
        {isCapturingVideo && (
          <div style={{
            position: 'absolute',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 1100,
            background: 'rgba(239, 68, 68, 0.92)',
            backdropFilter: 'blur(8px)',
            color: '#fff',
            padding: '7px 16px',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 700,
            fontSize: '0.82rem',
            boxShadow: '0 4px 16px rgba(239, 68, 68, 0.4)',
            pointerEvents: 'none'
          }}>
            <div style={{ width: '10px', height: '10px', background: '#fff', borderRadius: '50%' }} />
            <span>5초 비디오 녹화 중... ({captureCountdown > 0 ? captureCountdown : 1}s)</span>
          </div>
        )}

        {/* 카메라 비디오 & 시뮬레이션 배경 레이어 (줌 뷰포트 확대 적용) */}
        <div style={{
          position: 'absolute',
          inset: 0,
          filter: isCameraLive ? 'none' : 'blur(8px) brightness(0.6)',
          transform: zoomLevel === '2x' ? 'scale(1.6)' : zoomLevel === '0.5x' ? 'scale(1)' : 'scale(1.2)',
          transition: 'transform 0.3s ease, filter 0.5s ease',
          pointerEvents: 'none'
        }}>
          {/* 웹캠 미연결 또는 로딩 시 표시되는 강아지 시뮬레이션 배경 */}
          <img
            ref={simImgRef}
            src="/three_dogs_camera.jpg"
            alt="Dog Camera Simulation"
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: hasLiveStream ? 'none' : 'block'
            }}
          />

          {/* 실제 웹캠 비디오 */}
          <video
            ref={videoRef}
            playsInline
            muted
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: hasLiveStream ? 'block' : 'none'
            }}
          />
        </div>

        {/* ================= AR HUD 및 말풍선 오버레이 레이어 (1:1 픽셀 정확한 상단 배치) ================= */}
        <div style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 30
        }}>
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
                  ● AF 포커스 잠금
                </div>
              )}
            </div>
          )}

          {/* ================= 3. 카메라 앵글 속 강아지 머리 위 실시간 AR 말풍선 ================= */}
          {/* 다중 강아지(pack3/교감 모드) 오버레이 표시 */}
          {anglePreset === 'pack3' && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 35 }}>

              {/* Left Dog Speech Bubble (머리 바로 위) */}
              <div style={{
                position: 'absolute',
                left: '4%',
                top: '11%',
                width: '38%',
                pointerEvents: 'auto',
                animation: 'floatBubble 3s ease-in-out infinite'
              }}>
                <div className="ar-speech-bubble">
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#FFB320', marginBottom: '2px' }}>
                    {t.ar.mockDogLeftName}{t.ar.speechSuffix}
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2D3748', lineHeight: 1.3, marginBottom: '4px' }}>
                    "{t.ar.mockTurns?.[turnIndex]?.dogs[0]?.thought || currentTurn.dogs[0].thought}"
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#718096', background: 'rgba(255,126,54,0.15)', padding: '2px 5px', borderRadius: '4px' }}>
                    🧬 {t.ar.mockTurns?.[turnIndex]?.dogs[0]?.behavior || currentTurn.dogs[0].behavior}
                  </div>
                  {/* Pointer Arrow */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '60%',
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '8px solid #FFB320'
                  }} />
                </div>
              </div>


              {/* Center Dog Speech Bubble (머리 바로 위) */}
              <div style={{
                position: 'absolute',
                left: '31%',
                top: '7%',
                width: '38%',
                pointerEvents: 'auto',
                animation: 'floatBubble 3.2s ease-in-out infinite'
              }}>
                <div className="ar-speech-bubble" style={{
                  border: '2px solid #2EC4B6',
                }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#2EC4B6', marginBottom: '2px' }}>
                    {t.ar.mockDogCenterName}{t.ar.speechSuffix}
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2D3748', lineHeight: 1.3, marginBottom: '4px' }}>
                    "{t.ar.mockTurns?.[turnIndex]?.dogs[1]?.thought || currentTurn.dogs[1].thought}"
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#718096', background: 'rgba(46,196,182,0.15)', padding: '2px 5px', borderRadius: '4px' }}>
                    🧬 {t.ar.mockTurns?.[turnIndex]?.dogs[1]?.behavior || currentTurn.dogs[1].behavior}
                  </div>
                  {/* Pointer Arrow */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '8px solid #2EC4B6'
                  }} />
                </div>
              </div>


              {/* Right Dog Speech Bubble (머리 바로 위) */}
              <div style={{
                position: 'absolute',
                right: '5%',
                top: '13%',
                width: '38%',
                pointerEvents: 'auto',
                animation: 'floatBubble 2.8s ease-in-out infinite'
              }}>
                <div className="ar-speech-bubble" style={{
                  border: '2px solid #FFBF00',
                }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 600, color: '#FFBF00', marginBottom: '2px' }}>
                    {t.ar.mockDogRightName}{t.ar.speechSuffix}
                  </div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: '#2D3748', lineHeight: 1.3, marginBottom: '4px' }}>
                    "{t.ar.mockTurns?.[turnIndex]?.dogs[2]?.thought || currentTurn.dogs[2].thought}"
                  </div>
                  <div style={{ fontSize: '0.55rem', color: '#718096', background: 'rgba(255,191,0,0.15)', padding: '2px 5px', borderRadius: '4px' }}>
                    🧬 {t.ar.mockTurns?.[turnIndex]?.dogs[2]?.behavior || currentTurn.dogs[2].behavior}
                  </div>
                  {/* Pointer Arrow */}
                  <div style={{
                    position: 'absolute',
                    bottom: '-8px',
                    left: '40%',
                    width: 0,
                    height: 0,
                    borderLeft: '7px solid transparent',
                    borderRight: '7px solid transparent',
                    borderTop: '8px solid #FFBF00'
                  }} />
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

            // 말풍선: 하단 버튼 및 데시벨 안내와 겹치지 않도록 카메라 상단에 안전하게 배치
            const liveBubbleTop = isCapturingVideo ? '58px' : '22px';

            return (
              <div className="ar-detection-overlay">
                {/* 동적 탐지 박스 (AI HUD가 켜져있을 때 표시) */}
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

                {/* 말풍선 - 상단 배치 (하단 컨트롤 및 데시벨 안내와 겹치지 않도록 상단 영역에 배치) */}
                <div
                  className="ar-live-bubble-container"
                  style={{
                    top: liveBubbleTop,
                    left: '4%',
                    right: '4%',
                    width: '92%',
                    zIndex: 40,
                  }}
                >
                  <div className="ar-speech-bubble live">
                    <div className="ar-live-bubble-header">
                      <span className="ar-live-bubble-title">{t.ar.realtimeAI}</span>
                      <div className="ar-live-bubble-info">
                        <span className={`ar-live-bubble-tag tag-${behaviorState}`}>
                          {behaviorState === 'bark' ? t.ar.behaviorBark : behaviorState === 'growl' ? t.ar.behaviorGrowl : behaviorState === 'whine' ? t.ar.behaviorWhine : behaviorState === 'active' ? t.ar.behaviorActive : t.ar.behaviorCalm}
                          <span className="ar-live-bubble-confidence">{liveThought.confidence}%</span>
                        </span>
                      </div>
                    </div>
                    <div className="liveThought-text">
                      {aiAnalyzing ? (
                        <span className="blinking-text">✨ {language === 'ko' ? 'AI가 실시간 분석 중...' : 'AI is analyzing in real-time...'}</span>
                      ) : (
                        `"${aiThoughtText}"`
                      )}
                    </div>
                    <div className="behavior-signal-container">
                      <div>
                        🧬 {liveThought.behavior}
                      </div>
                      <div>
                        {liveThought.signal}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div> {/* 카메라 + AR 오버레이 통합 래퍼 끝 */}

        {/* 오프라인 상태 (블러 처리된 화면 위에 선명하게 표시) */}
        {!isCameraLive && (
          <div className="ar-offline-overlay">
            <div className="ar-offline-walking-container">
              <img src={walwalWalking} className='ar-offline-walking-img' />
            </div>
            <button onClick={toggleRealCamera} className="ar-offline-turn-on-btn" style={{ pointerEvents: 'auto' }}>
              <ScanFace size={34} />
            </button>
          </div>
        )}


        {/* ================= 4. 비디오 오디오 파형 & 실시간 마이크 레벨 ================= */}
        <div className="ar-audio-level-container" style={{
          filter: isCameraLive ? 'none' : 'blur(8px) brightness(0.6)',
          transition: 'filter 0.5s ease',
          pointerEvents: isCameraLive ? 'auto' : 'none'
        }}>
          <Volume2 size={13} color="#2EC4B6" />
          <div className="ar-audio-level-bars">
            {[30, 60, 45, 80, 50, 90, 40].map((h, i) => (
              <div
                key={i}
                className="ar-audio-level-bar"
                style={{
                  height: Math.min(14, (audioLevel / 100) * h) + 'px',
                  background: i % 2 === 0 ? '#FFB320' : '#2EC4B6',
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
        <div className="ar-bottom-control-bar" style={{
          filter: isCameraLive ? 'none' : 'blur(8px) brightness(0.6)',
          transition: 'filter 0.5s ease',
          pointerEvents: isCameraLive ? 'auto' : 'none'
        }}>

          {/* 중앙 공유/캡처 버튼 */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={`bottom-bar-btn ${!isCapturingVideo ? 'shot' : ''}`}
              style={{ position: 'relative' }}
              onClick={() => {
                if (isCapturingVideo) return;

                confetti({
                  particleCount: 20,
                  spread: 40,
                  origin: { y: 0.8 }
                });

                const targetDog = anglePreset === 'pack3' ? getMockDogs(language)[1] : (myDogProfile || getMockDogs(language)[0]);
                const targetThought = isCameraLive ? aiThoughtText : currentTurn.dogs[1].thought;

                try {
                  // 9:16 모바일 숏폼 표준 해상도 (720 x 1280) 고정으로 왜곡 및 확대 잘림 방지
                  const CANVAS_W = 720;
                  const CANVAS_H = 1280;
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
                  if (typeof captureStreamFn !== 'function' || typeof (window as any).MediaRecorder === 'undefined') {
                    throw new Error('captureStream or MediaRecorder not supported');
                  }

                  const stream = captureStreamFn.call(canvas, 30);
                  const isWebMSupported = typeof (window as any).MediaRecorder.isTypeSupported === 'function' &&
                    (window as any).MediaRecorder.isTypeSupported('video/webm');
                  const options = isWebMSupported ? { mimeType: 'video/webm' } : undefined;

                  const mediaRecorder = new (window as any).MediaRecorder(stream, options);
                  mediaRecorderRef.current = mediaRecorder;
                  const chunks: BlobPart[] = [];

                  mediaRecorder.ondataavailable = (e: any) => {
                    if (e.data && e.data.size > 0) chunks.push(e.data);
                  };

                  mediaRecorder.onstop = () => {
                    setIsCapturingVideo(false);
                    setCaptureCountdown(0);
                    const actualMimeType = mediaRecorder.mimeType || (isWebMSupported ? 'video/webm' : 'video/mp4');
                    const blob = new Blob(chunks, { type: actualMimeType });
                    const videoUrl = URL.createObjectURL(blob);
                    blobCache.set(videoUrl, blob);
                    onCaptureToStory(targetDog, targetThought, videoUrl);
                    if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
                  };

                  setIsCapturingVideo(true);
                  setCaptureCountdown(5);

                  let count = 5;
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
                  }, 5000);
                  return;
                } catch (e) {
                  setIsCapturingVideo(false);
                  setCaptureCountdown(0);
                  console.error('Canvas capture fallback to snapshot:', e);

                  let snapshot = '';
                  const CANVAS_W = 720;
                  const CANVAS_H = 1280;
                  const canvas = document.createElement('canvas');
                  canvas.width = CANVAS_W;
                  canvas.height = CANVAS_H;
                  const ctx = canvas.getContext('2d');
                  if (ctx) {
                    drawFrameWithBubble(ctx, canvas.width, canvas.height, 0);
                    snapshot = canvas.toDataURL('image/jpeg', 0.85);
                    fetch(snapshot).then(r => r.blob()).then(blob => blobCache.set(snapshot, blob)).catch(console.error);
                  }
                  onCaptureToStory(targetDog, targetThought, snapshot);
                }
              }}
              title={isCapturingVideo ? `녹화 중... (${captureCountdown}s)` : "펫스튜디오 공유 (5초 동영상 촬영)"}
            >
              {isCapturingVideo ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                  <div style={{ width: '12px', height: '12px', background: '#FF3B30', borderRadius: '50%' }} />
                  <span style={{ fontSize: '0.65rem', fontWeight: 800, color: '#FF3B30' }}>{captureCountdown}</span>
                </div>
              ) : (
                <Scan size={24} strokeWidth={2} />
              )}
            </button>
          </div>

          {/* 중앙: 줌 버튼 및 카메라 전환 */}
          <div className="ar-zoom-container" style={{ flex: 'none', margin: '0 8px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="ar-zoom-group">
              {(['0.5x', '1x', '2x'] as const).map(z => (
                <button className="button"
                  key={z}
                  onClick={() => setZoomLevel(z)}
                  style={{
                    background: zoomLevel === z ? '#FFB320' : 'transparent',
                    color: zoomLevel === z ? '#FFFFFF' : '#fff',
                  }}
                >
                  {z}
                </button>
              ))}


              {/* 카메라 전환 버튼 */}
              <button className="button" onClick={() => setCameraFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}>
                <RefreshCw size={16} />
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
              const targetThought = isCameraLive ? aiThoughtText : currentTurn.dogs[1].thought;

              const CANVAS_W = 720;
              const CANVAS_H = 1280;
              const canvas = document.createElement('canvas');
              canvas.width = CANVAS_W;
              canvas.height = CANVAS_H;
              const ctx = canvas.getContext('2d');
              let snapshot = '';

              if (ctx) {
                drawFrameWithBubble(ctx, CANVAS_W, CANVAS_H, 0);
                snapshot = canvas.toDataURL('image/jpeg', 0.9);
              }

              if (onCaptureToFeed) {
                onCaptureToFeed(targetDog || myDogProfile, targetThought, snapshot);
              }
            }}
            title="피드 추가"
          >
            <ScanFace size={24} strokeWidth={2} />
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
