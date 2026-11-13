import React, { useState, useEffect, useCallback } from 'react';
import { X, ArrowLeft, MapPin, Clock, Calendar, Flame, Award, Plus, Check, ChevronUp, TrendingUp, Sun, Moon, Zap, Compass, Edit2, Play, Pause, Square } from 'lucide-react';
import { DogProfile, getDefaultDogAvatar, getPetWalkGoals, setPetWalkGoals, localizeDogName } from '../data/mockDogs';
import {
  ActiveWalkSession,
  getActiveWalkSession,
  pauseWalk,
  resumeWalk,
  stopWalk,
  addSimulatedWalkDistance,
  isDogInActiveSession
} from '../services/walkTrackerService';
import { useTranslation } from '../i18n/LanguageContext';
import '../styles/WalkHistoryModal.css';

export interface WalkRecord {
  id: string;
  date: string; // YYYY-MM-DD
  distanceKm: number;
  durationMinutes: number;
  caloriesKcal: number;
  locationName: string;
  timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
}

interface WalkHistoryModalProps {
  dog: DogProfile;
  allPets?: DogProfile[];
  initialWalkTargetMode?: string;
  initialTab?: 'distance' | 'time';
  onClose: () => void;
  onUpdateStats?: (totalDistance: number, totalMinutes: number) => void;
}


const WALK_MODAL_I18N: Record<string, {
  modalTitle: string;
  subDistance: string;
  subTime: string;
  close: string;
  logOf: (dogName: string) => string;
  walkingBadge: string;
  tabDistance: string;
  tabTime: string;
  livePaused: (dogName: string) => string;
  liveWalking: (dogName: string) => string;
  testBtnTitle: string;
  testBtnLabel: string;
  elapsedTime: string;
  liveDistance: string;
  liveCalories: string;
  resume: string;
  pause: string;
  finishConfirm: string;
  finish: string;
  otherWalking: (dogName: string) => string;
  otherEndConfirm: (dogName: string) => string;
  endBtn: string;
  targetLabel: string;
  allDogsTogether: (count: number) => string;
  startAllTogetherTitle: (count: number) => string;
  startWithDogTitle: (dogName: string) => string;
  startAllTogetherSubtitle: string;
  startWithDogSubtitle: string;
  startBtn: string;
  distanceStatsBadge: string;
  todayDistanceTag: (km: number | string) => string;
  totalDist: string;
  longestDist: string;
  walksCount: string;
  timesUnit: string;
  todayDistanceGoalTitle: (goal: string) => string;
  editGoal: string;
  targetDistanceLabel: string;
  goalAchieved: string;
  goalRemaining: (rem: string) => React.ReactNode;
  timeStatsBadge: string;
  todayTimeTag: (mins: number) => string;
  totalTime: string;
  minUnit: string;
  avgPace: string;
  caloriesBurned: string;
  dailyTimeGoalTitle: (mins: number) => string;
  targetTimeLabel: string;
  morningWalk: string;
  eveningWalk: string;
  todayBurnedLabel: string;
  todayBurnedDesc: (kcal: number) => string;
  listDistanceTitle: string;
  listTimeTitle: string;
  addWalkFormCollapse: string;
  addWalkFormOpen: string;
  phDistance: string;
  phDuration: string;
  phLocation: string;
  optMorning: string;
  optAfternoon: string;
  optEvening: string;
  optNight: string;
  saveWalkBtn: string;
  durationMinsTaken: (mins: number) => string;
  durationMins: (mins: number) => string;
}> = {
  ko: {
    modalTitle: '산책일지',
    subDistance: '코스별 이동 거리와 마일스톤',
    subTime: '산책 시간과 활동량·칼로리 분석',
    close: '닫기',
    logOf: (name) => `${name}의 일지`,
    walkingBadge: '산책중',
    tabDistance: '거리 & 코스 분석',
    tabTime: '시간 & 활동 분석',
    livePaused: (name) => `${name} 산책 일시정지됨`,
    liveWalking: (name) => ` ${name} 실시간 산책 중`,
    testBtnTitle: '실내 테스트용: +0.1km 추가',
    testBtnLabel: '테스트',
    elapsedTime: '경과 시간',
    liveDistance: '실시간 이동 거리',
    liveCalories: '소모 칼로리',
    resume: '산책 재개',
    pause: '일시정지',
    finishConfirm: '산책을 종료하고 오늘 기록으로 자동 저장할까요?',
    finish: '산책 완료',
    otherWalking: (name) => `${name}와(과) 이미 산책 진행 중입니다.`,
    otherEndConfirm: (name) => `${name}의 산책을 종료할까요?`,
    endBtn: '종료',
    targetLabel: '산책 대상',
    allDogsTogether: (count) => `모두 함께 (${count}마리)`,
    startAllTogetherTitle: (count) => ` 모두 함께 산책하기 (${count}마리)`,
    startWithDogTitle: (name) => ` ${name}와(과) 산책 시작하기`,
    startAllTogetherSubtitle: 'GPS 실시간 측정 & 전 반려견 일지에 동시 합산',
    startWithDogSubtitle: 'GPS 실시간 거리·시간 측정 & 종료 시 자동 합산',
    startBtn: '시작',
    distanceStatsBadge: '누적 거리 집계',
    todayDistanceTag: (km) => `오늘 ${km} km`,
    totalDist: '총 누적 거리',
    longestDist: '최장 산책 거리',
    walksCount: '총 산책 횟수',
    timesUnit: '회',
    todayDistanceGoalTitle: (goal) => `오늘 산책 목표 (${goal} km)`,
    editGoal: '목표 수정',
    targetDistanceLabel: '목표 거리:',
    goalAchieved: '오늘의 산책 목표를 달성했어요! 🎉',
    goalRemaining: (rem) => <>오늘 목표 달성까지 <strong>{rem}</strong>km 남았어요!</>,
    timeStatsBadge: '활동량 & 시간 분석',
    todayTimeTag: (mins) => `오늘 ${mins}분 활동`,
    totalTime: '총 누적 시간',
    minUnit: '분',
    avgPace: '평균 보행 속도',
    caloriesBurned: '누적 소모 열량',
    dailyTimeGoalTitle: (mins) => `일일 권장 운동 시간 (${mins}분)`,
    targetTimeLabel: '목표 시간:',
    morningWalk: '아침/낮 산책',
    eveningWalk: '저녁/밤 산책',
    todayBurnedLabel: '오늘 칼로리',
    todayBurnedDesc: (kcal) => `오늘 약 ${kcal} kcal 소모 (맛있는 닭가슴살 큐브 1개 분량)! 저녁 산책을 주로 즐기는 댕댕이입니다.`,
    listDistanceTitle: '코스 및 거리 기록 목록',
    listTimeTitle: '산책 시간 및 칼로리 기록 목록',
    addWalkFormCollapse: '접기',
    addWalkFormOpen: '기록 추가',
    phDistance: '거리 (예: 2.5 km)',
    phDuration: '시간 (예: 40 분)',
    phLocation: '산책 장소 또는 코스명 (예: 한강공원)',
    optMorning: '아침',
    optAfternoon: '낮',
    optEvening: '저녁',
    optNight: '밤',
    saveWalkBtn: '산책 기록 저장',
    durationMinsTaken: (mins) => `${mins} 분 소요`,
    durationMins: (mins) => `${mins} 분`,
  },
  ja: {
    modalTitle: 'お散歩記録',
    subDistance: 'コース別移動距離とマイルストーン',
    subTime: '散歩時間・運動量・カロリー分析',
    close: '閉じる',
    logOf: (name) => `${name}の日誌`,
    walkingBadge: '散歩中',
    tabDistance: '距離・コース分析',
    tabTime: '時間・活動分析',
    livePaused: (name) => `${name} お散歩一時停止中`,
    liveWalking: (name) => ` ${name} リアルタイム散歩中`,
    testBtnTitle: '室内テスト用: +0.1km追加',
    testBtnLabel: 'テスト',
    elapsedTime: '経過時間',
    liveDistance: 'リアルタイム距離',
    liveCalories: '消費カロリー',
    resume: '再開',
    pause: '一時停止',
    finishConfirm: '散歩を終了して今日の記録に自動保存しますか？',
    finish: '散歩終了',
    otherWalking: (name) => `${name}とすでにお散歩中です。`,
    otherEndConfirm: (name) => `${name}の散歩を終了しますか？`,
    endBtn: '終了',
    targetLabel: '散歩対象',
    allDogsTogether: (count) => `みんな一緒に (${count}匹)`,
    startAllTogetherTitle: (count) => ` みんな一緒に散歩する (${count}匹)`,
    startWithDogTitle: (name) => ` ${name}とお散歩開始`,
    startAllTogetherSubtitle: 'GPSリアルタイム計測・すべてのワンちゃんの日誌に自動反映',
    startWithDogSubtitle: 'GPSリアルタイム距離・時間計測＆終了時に自動反映',
    startBtn: '開始',
    distanceStatsBadge: '累計距離集計',
    todayDistanceTag: (km) => `今日 ${km} km`,
    totalDist: '総累計距離',
    longestDist: '最長散歩距離',
    walksCount: '総散歩回数',
    timesUnit: '回',
    todayDistanceGoalTitle: (goal) => `今日の散歩目標 (${goal} km)`,
    editGoal: '目標編集',
    targetDistanceLabel: '目標距離:',
    goalAchieved: '今日の散歩目標を達成しました！🎉',
    goalRemaining: (rem) => <>今日の目標達成まであと <strong>{rem}</strong>km です！</>,
    timeStatsBadge: '活動量・時間分析',
    todayTimeTag: (mins) => `今日 ${mins}分 活動`,
    totalTime: '総累計時間',
    minUnit: '分',
    avgPace: '平均歩行速度',
    caloriesBurned: '累計消費カロリー',
    dailyTimeGoalTitle: (mins) => `1日推奨運動時間 (${mins}分)`,
    targetTimeLabel: '目標時間:',
    morningWalk: '朝・昼の散歩',
    eveningWalk: '夕方・夜の散歩',
    todayBurnedLabel: '今日のカロリー',
    todayBurnedDesc: (kcal) => `今日 約${kcal} kcal 消費（美味しいチキンキューブ約1個分）！夕方・夜のお散歩を好むワンちゃんです。`,
    listDistanceTitle: 'コース・距離記録一覧',
    listTimeTitle: '散歩時間・カロリー記録一覧',
    addWalkFormCollapse: '閉じる',
    addWalkFormOpen: '記録追加',
    phDistance: '距離 (例: 2.5 km)',
    phDuration: '時間 (例: 40 分)',
    phLocation: '散歩場所・コース名 (例: 公園)',
    optMorning: '朝',
    optAfternoon: '昼',
    optEvening: '夕方',
    optNight: '深夜',
    saveWalkBtn: '散歩記録を保存',
    durationMinsTaken: (mins) => `${mins} 分`,
    durationMins: (mins) => `${mins} 分`,
  },
  es: {
    modalTitle: 'Diario de Paseos',
    subDistance: 'Distancia por rutas y metas',
    subTime: 'Tiempo de paseo y análisis calórico',
    close: 'Cerrar',
    logOf: (name) => `Diario de ${name}`,
    walkingBadge: 'Paseando',
    tabDistance: 'Distancia y Ruta',
    tabTime: 'Tiempo y Actividad',
    livePaused: (name) => `${name} Paseo en pausa`,
    liveWalking: (name) => ` ${name} Paseo en curso`,
    testBtnTitle: 'Prueba: +0.1km',
    testBtnLabel: 'Prueba',
    elapsedTime: 'Tiempo',
    liveDistance: 'Distancia en vivo',
    liveCalories: 'Calorías quemadas',
    resume: 'Reanudar',
    pause: 'Pausar',
    finishConfirm: '¿Terminar el paseo y guardarlo en el registro de hoy?',
    finish: 'Finalizar',
    otherWalking: (name) => `Ya hay un paseo en curso con ${name}.`,
    otherEndConfirm: (name) => `¿Terminar el paseo de ${name}?`,
    endBtn: 'Terminar',
    targetLabel: 'Compañero',
    allDogsTogether: (count) => `Todos juntos (${count})`,
    startAllTogetherTitle: (count) => ` Pasear todos juntos (${count})`,
    startWithDogTitle: (name) => ` Pasear con ${name}`,
    startAllTogetherSubtitle: 'Rastreo GPS en vivo y guardado para todas las mascotas',
    startWithDogSubtitle: 'Rastreo GPS de distancia y tiempo en tiempo real',
    startBtn: 'Iniciar',
    distanceStatsBadge: 'Estadísticas de distancia',
    todayDistanceTag: (km) => `Hoy ${km} km`,
    totalDist: 'Distancia total',
    longestDist: 'Distancia máxima',
    walksCount: 'Total de paseos',
    timesUnit: 'veces',
    todayDistanceGoalTitle: (goal) => `Meta de distancia de hoy (${goal} km)`,
    editGoal: 'Editar meta',
    targetDistanceLabel: 'Distancia meta:',
    goalAchieved: '¡Has alcanzado la meta de paseo de hoy! 🎉',
    goalRemaining: (rem) => <>¡Faltan <strong>{rem} km</strong> para la meta de hoy!</>,
    timeStatsBadge: 'Tiempo y actividad',
    todayTimeTag: (mins) => `Hoy ${mins}m de actividad`,
    totalTime: 'Tiempo total',
    minUnit: 'min',
    avgPace: 'Ritmo promedio',
    caloriesBurned: 'Calorías quemadas',
    dailyTimeGoalTitle: (mins) => `Tiempo diario sugerido (${mins}m)`,
    targetTimeLabel: 'Tiempo meta:',
    morningWalk: 'Paseo matutino',
    eveningWalk: 'Paseo nocturno',
    todayBurnedLabel: 'Calorías de hoy',
    todayBurnedDesc: (kcal) => `¡Aprox. ${kcal} kcal quemadas hoy! Le encantan principalmente los paseos nocturnos.`,
    listDistanceTitle: 'Historial de rutas y distancia',
    listTimeTitle: 'Historial de tiempo y calorías',
    addWalkFormCollapse: 'Plegar',
    addWalkFormOpen: 'Añadir paseo',
    phDistance: 'Distancia (ej: 2.5 km)',
    phDuration: 'Tiempo (ej: 40 min)',
    phLocation: 'Lugar o curso de paseo',
    optMorning: 'Mañana',
    optAfternoon: 'Tarde',
    optEvening: 'Noche',
    optNight: 'Noche',
    saveWalkBtn: 'Guardar paseo',
    durationMinsTaken: (mins) => `${mins} mins`,
    durationMins: (mins) => `${mins} mins`,
  },
  en: {
    modalTitle: 'Walk Log',
    subDistance: 'Distance & Course Milestones',
    subTime: 'Time & Activity Analysis',
    close: 'Close',
    logOf: (name) => `${name}'s Log`,
    walkingBadge: 'Walking',
    tabDistance: 'Distance & Course',
    tabTime: 'Time & Activity',
    livePaused: (name) => `${name} Paused`,
    liveWalking: (name) => ` ${name} Live Walk`,
    testBtnTitle: 'Test: +0.1km',
    testBtnLabel: 'Test',
    elapsedTime: 'Time',
    liveDistance: 'Distance',
    liveCalories: 'Calories',
    resume: 'Resume',
    pause: 'Pause',
    finishConfirm: 'Finish walk and save record?',
    finish: 'Finish',
    otherWalking: (name) => `${name} is already walking.`,
    otherEndConfirm: (name) => `End walk for ${name}?`,
    endBtn: 'End',
    targetLabel: 'Target',
    allDogsTogether: (count) => `All (${count})`,
    startAllTogetherTitle: (count) => ` Walk All Together (${count})`,
    startWithDogTitle: (name) => ` Start Walk with ${name}`,
    startAllTogetherSubtitle: 'Real-time GPS tracking & auto-saves for all dogs',
    startWithDogSubtitle: 'Real-time GPS tracking & auto-save',
    startBtn: 'Start',
    distanceStatsBadge: 'Distance Stats',
    todayDistanceTag: (km) => `Today ${km} km`,
    totalDist: 'Total Dist',
    longestDist: 'Longest',
    walksCount: 'Walks',
    timesUnit: 'times',
    todayDistanceGoalTitle: (goal) => `Today Distance Goal (${goal} km)`,
    editGoal: 'Edit goal',
    targetDistanceLabel: 'Target:',
    goalAchieved: "Achieved today's walking goal! 🎉",
    goalRemaining: (rem) => <><strong>{rem} km</strong> left to reach today's goal!</>,
    timeStatsBadge: 'Time & Activity',
    todayTimeTag: (mins) => `Today ${mins}m`,
    totalTime: 'Total Time',
    minUnit: 'min',
    avgPace: 'Avg Pace',
    caloriesBurned: 'Calories',
    dailyTimeGoalTitle: (mins) => `Daily Target Time (${mins}m)`,
    targetTimeLabel: 'Target:',
    morningWalk: 'Morning',
    eveningWalk: 'Evening',
    todayBurnedLabel: 'Today Burned',
    todayBurnedDesc: (kcal) => `Burned ~${kcal} kcal today! Mostly enjoys evening walks.`,
    listDistanceTitle: 'Course & Distance Logs',
    listTimeTitle: 'Time & Calorie Logs',
    addWalkFormCollapse: 'Collapse',
    addWalkFormOpen: 'Add Walk',
    phDistance: 'Distance (km)',
    phDuration: 'Duration (min)',
    phLocation: 'Course / Location',
    optMorning: 'Morning',
    optAfternoon: 'Afternoon',
    optEvening: 'Evening',
    optNight: 'Night',
    saveWalkBtn: 'Save Walk',
    durationMinsTaken: (mins) => `${mins} mins`,
    durationMins: (mins) => `${mins} mins`,
  }
};

export const WalkHistoryModal: React.FC<WalkHistoryModalProps> = ({
  dog,
  allPets,
  initialWalkTargetMode,
  initialTab = 'distance',
  onClose,
  onUpdateStats
}) => {
  const { language } = useTranslation();
  const i18n = WALK_MODAL_I18N[language] || WALK_MODAL_I18N.en;
  const petList = allPets && allPets.length > 0 ? allPets : [dog];
  const [currentDog, setCurrentDog] = useState<DogProfile>(dog);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (!cancelled) setCurrentDog(dog);
    });
    return () => {
      cancelled = true;
    };
  }, [dog]);

  const [activeTab, setActiveTab] = useState<'distance' | 'time'>(initialTab);

  // 초기 산책 기록 생성기 (기존 프로필 데이터와 자연스럽게 연동)
  const generateInitialRecords = useCallback((d: DogProfile): WalkRecord[] => {
    const today = new Date();
    const todayDistance = d.todayWalkDistance !== undefined ? d.todayWalkDistance : 1.8;
    const todayMinutes = d.todayWalkMinutes !== undefined ? d.todayWalkMinutes : 45;

    const baseRecords: WalkRecord[] = [
      {
        id: `walk-${Date.now()}-${d.id || d.name}`,
        date: today.toISOString().split('T')[0],
        distanceKm: todayDistance,
        durationMinutes: todayMinutes,
        caloriesKcal: Math.round(todayDistance * 52),
        locationName: language === 'ko' ? '동네 공원 산책로' : language === 'ja' ? '近所の公園散歩コース' : 'Neighborhood Park Walk',
        timeOfDay: 'evening'
      }
    ];

    const pastMemosKo = [
      '단골 산책로 & 친구 인사',
      '주말 잔디마당 달리기',
      '저녁 가벼운 산책',
      '동네 골목 탐험',
      '가을 솔솔 바람 산책',
      '반려견 놀이터 방문',
      '하천변 힐링 코스'
    ];
    const pastDistances = [2.4, 3.2, 1.5, 2.1, 2.8, 3.0, 1.9, 2.5, 1.7, 2.2, 3.1, 2.0, 2.6];
    const pastMinutes = [50, 65, 30, 40, 55, 60, 40, 50, 35, 45, 60, 40, 55];

    for (let i = 1; i <= pastDistances.length; i++) {
      const dObj = new Date();
      dObj.setDate(today.getDate() - i);
      const dist = pastDistances[i - 1];
      const mins = pastMinutes[i - 1];
      baseRecords.push({
        id: `walk-${i + 1}-${d.name}`,
        date: dObj.toISOString().split('T')[0],
        distanceKm: dist,
        durationMinutes: mins,
        caloriesKcal: Math.round(dist * 50),
        locationName: pastMemosKo[(i - 1) % pastMemosKo.length],
        timeOfDay: i % 4 === 0 ? 'morning' : i % 4 === 1 ? 'afternoon' : i % 4 === 2 ? 'evening' : 'night'
      });
    }

    return baseRecords;
  }, [language]);

  const loadDogRecords = useCallback((d: DogProfile): WalkRecord[] => {
    const keys = [`WALWAL_WALK_LOGS_${d.id}`, `WALWAL_WALK_LOGS_${d.name}`].filter(Boolean);
    for (const k of keys) {
      try {
        const saved = localStorage.getItem(k);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) { }
    }
    const initial = generateInitialRecords(d);
    localStorage.setItem(`WALWAL_WALK_LOGS_${d.id || d.name}`, JSON.stringify(initial));
    return initial;
  }, [generateInitialRecords]);

  const [records, setRecords] = useState<WalkRecord[]>(() => loadDogRecords(currentDog));

  // 개인화 산책 목표 (견종 기본 추천 + 사용자 커스텀 설정)
  const initialGoals = getPetWalkGoals(currentDog);
  const [dailyDistanceGoal, setDailyDistanceGoal] = useState<number>(initialGoals.distance);
  const [dailyTimeGoal, setDailyTimeGoal] = useState<number>(initialGoals.minutes);

  const [isEditingDistanceGoal, setIsEditingDistanceGoal] = useState(false);
  const [tempDistanceGoal, setTempDistanceGoal] = useState(String(initialGoals.distance));

  const [isEditingTimeGoal, setIsEditingTimeGoal] = useState(false);
  const [tempTimeGoal, setTempTimeGoal] = useState(String(initialGoals.minutes));

  // 반려견 전환 시 일지 기록 및 목표 실시간 리로드
  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(() => {
      if (cancelled) return;
      setRecords(loadDogRecords(currentDog));
      const goals = getPetWalkGoals(currentDog);
      setDailyDistanceGoal(goals.distance);
      setDailyTimeGoal(goals.minutes);
      setTempDistanceGoal(String(goals.distance));
      setTempTimeGoal(String(goals.minutes));
    });
    return () => {
      cancelled = true;
    };
  }, [currentDog, loadDogRecords]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDistance, setNewDistance] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('evening');

  // 통계 계산
  const totalDistance = records.reduce((acc, r) => acc + (Number(r.distanceKm) || 0), 0);
  const totalMinutes = records.reduce((acc, r) => acc + (Number(r.durationMinutes) || 0), 0);
  const totalCalories = records.reduce((acc, r) => acc + (Number(r.caloriesKcal) || 0), 0);
  const totalWalks = records.length;
  const todayRecord = records.find(r => r.date === new Date().toISOString().split('T')[0]) || records[0];

  const saveDogRecords = (d: DogProfile, recs: WalkRecord[]) => {
    const json = JSON.stringify(recs);
    if (d.id) localStorage.setItem(`WALWAL_WALK_LOGS_${d.id}`, json);
    if (d.name) localStorage.setItem(`WALWAL_WALK_LOGS_${d.name}`, json);
  };

  // 설정 화면이나 외부에서 목표 변경 시 실시간 동기화
  useEffect(() => {
    const handleGoalUpdate = (e: any) => {
      const detail = e.detail;
      if (!detail || detail.id === currentDog.id || detail.id === currentDog.name) {
        const updated = getPetWalkGoals(currentDog);
        setDailyDistanceGoal(updated.distance);
        setDailyTimeGoal(updated.minutes);
      }
    };
    window.addEventListener('walwal_walk_goal_updated', handleGoalUpdate);
    return () => window.removeEventListener('walwal_walk_goal_updated', handleGoalUpdate);
  }, [currentDog]);

  const handleSaveDistanceGoal = () => {
    const val = parseFloat(tempDistanceGoal);
    if (!isNaN(val) && val > 0 && val <= 50) {
      const rounded = Math.round(val * 10) / 10;
      setDailyDistanceGoal(rounded);
      setPetWalkGoals(currentDog.id || currentDog.name, { distance: rounded, minutes: dailyTimeGoal });
    }
    setIsEditingDistanceGoal(false);
  };

  const handleSaveTimeGoal = () => {
    const val = parseInt(tempTimeGoal, 10);
    if (!isNaN(val) && val > 0 && val <= 360) {
      setDailyTimeGoal(val);
      setPetWalkGoals(currentDog.id || currentDog.name, { distance: dailyDistanceGoal, minutes: val });
    }
    setIsEditingTimeGoal(false);
  };

  // 실시간 산책 트래킹 세션 상태
  const [activeSession, setActiveSession] = useState<ActiveWalkSession | null>(() => getActiveWalkSession());

  useEffect(() => {
    const handleTrackerUpdate = (e: any) => {
      setActiveSession(e.detail ? { ...e.detail } : getActiveWalkSession());
    };
    const handleTrackerStarted = (e: any) => {
      setActiveSession(e.detail ? { ...e.detail } : getActiveWalkSession());
    };
    const handleTrackerStopped = () => {
      setActiveSession(null);
    };

    window.addEventListener('walwal_walk_tracker_update', handleTrackerUpdate);
    window.addEventListener('walwal_walk_tracker_started', handleTrackerStarted);
    window.addEventListener('walwal_walk_tracker_stopped', handleTrackerStopped);

    return () => {
      window.removeEventListener('walwal_walk_tracker_update', handleTrackerUpdate);
      window.removeEventListener('walwal_walk_tracker_started', handleTrackerStarted);
      window.removeEventListener('walwal_walk_tracker_stopped', handleTrackerStopped);
    };
  }, []);

  // 산책 완료 시 기록 목록 및 상단 게이지 자동 갱신
  useEffect(() => {
    const handleWalkCompleted = () => {
      try {
        const refreshed = loadDogRecords(currentDog);
        setRecords(refreshed);
        if (onUpdateStats) {
          const newTotalDist = refreshed.reduce((acc: number, r: WalkRecord) => acc + (Number(r.distanceKm) || 0), 0);
          const newTotalMins = refreshed.reduce((acc: number, r: WalkRecord) => acc + (Number(r.durationMinutes) || 0), 0);
          onUpdateStats(newTotalDist, newTotalMins);
        }
      } catch (e) { }
    };

    window.addEventListener('walwal_walk_completed', handleWalkCompleted);
    return () => window.removeEventListener('walwal_walk_completed', handleWalkCompleted);
  }, [currentDog, onUpdateStats, loadDogRecords]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 거리 관련 통계 (거리 중심)
  const todayDistanceRate = Math.min(100, Math.round(((todayRecord?.distanceKm || 0) / (dailyDistanceGoal || 2.0)) * 100));
  const maxDistanceRecord = Math.max(...records.map(r => r.distanceKm || 0));

  // 시간 관련 통계 (시간 중심)
  const todayTimeRate = Math.min(100, Math.round(((todayRecord?.durationMinutes || 0) / (dailyTimeGoal || 50)) * 100));
  const avgPace = totalMinutes > 0 ? (totalDistance / (totalMinutes / 60)).toFixed(1) : '2.4';
  const eveningWalkCount = records.filter(r => r.timeOfDay === 'evening').length;
  const eveningRatio = Math.round((eveningWalkCount / (records.length || 1)) * 100);
  const morningRatio = 100 - eveningRatio;

  const handleAddWalk = (e: React.FormEvent) => {
    e.preventDefault();
    const dist = parseFloat(newDistance);
    const mins = parseInt(newMinutes, 10);
    if (isNaN(dist) || dist <= 0 || isNaN(mins) || mins <= 0) return;

    const newRecord: WalkRecord = {
      id: 'walk-' + Date.now(),
      date: new Date().toISOString().split('T')[0],
      distanceKm: dist,
      durationMinutes: mins,
      caloriesKcal: Math.round(dist * 52),
      locationName: newLocation.trim() || (language === 'ko' ? '즐거운 산책' : language === 'ja' ? '楽しいお散歩' : language === 'es' ? 'Paseo alegre' : 'Joyful Walk'),
      timeOfDay: newTimeOfDay
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    saveDogRecords(currentDog, updated);

    // WALWAL_PETS 업데이트
    try {
      const savedPetsStr = localStorage.getItem('WALWAL_PETS');
      if (savedPetsStr) {
        const pets = JSON.parse(savedPetsStr);
        if (Array.isArray(pets)) {
          const updatedPets = pets.map((p: any) => {
            if ((currentDog.id && p.id === currentDog.id) || p.name === currentDog.name) {
              return {
                ...p,
                todayWalkDistance: Math.round(((Number(p.todayWalkDistance) || 0) + dist) * 10) / 10,
                todayWalkMinutes: (Number(p.todayWalkMinutes) || 0) + mins,
                walkDistance: Math.round(((Number(p.walkDistance) || 0) + dist) * 10) / 10,
                walkMinutes: (Number(p.walkMinutes) || 0) + mins
              };
            }
            return p;
          });
          localStorage.setItem('WALWAL_PETS', JSON.stringify(updatedPets));
          window.dispatchEvent(new Event('walwal_pets_updated'));
        }
      }
    } catch (e) { }

    if (onUpdateStats) {
      const newTotalDist = updated.reduce((acc, r) => acc + r.distanceKm, 0);
      const newTotalMins = updated.reduce((acc, r) => acc + r.durationMinutes, 0);
      onUpdateStats(newTotalDist, newTotalMins);
    }

    setNewDistance('');
    setNewMinutes('');
    setNewLocation('');
    setShowAddForm(false);
  };

  const localizeLocationName = (name: string, lang: string): string => {
    if (!name) return name;
    if (lang === 'ko') return name;

    const memoMap: Record<string, { en: string; ja: string; es?: string }> = {
      '동네 공원 산책로': { en: 'Neighborhood Park Trail', ja: '近所の公園散歩コース', es: 'Sendero del parque' },
      '단골 산책로 & 친구 인사': { en: 'Favorite Trail & Friends', ja: 'いつもの散歩道＆友達にご挨拶', es: 'Ruta habitual y amigos' },
      '주말 잔디마당 달리기': { en: 'Weekend Lawn Running', ja: '週末の芝生ラン', es: 'Carrera en césped de fin de semana' },
      '저녁 가벼운 산책': { en: 'Light Evening Stroll', ja: '夕方のんびり散歩', es: 'Paseo nocturno ligero' },
      '동네 골목 탐험': { en: 'Neighborhood Alley Walk', ja: '路地裏の冒険探検', es: 'Aventura en el vecindario' },
      '가을 솔솔 바람 산책': { en: 'Breezy Autumn Walk', ja: '秋風のそよ風散歩', es: 'Paseo con brisa otoñal' },
      '반려견 놀이터 방문': { en: 'Dog Park Playground', ja: 'ドッグラン・遊び場訪問', es: 'Visita al parque canino' },
      '하천변 힐링 코스': { en: 'Riverside Healing Trail', ja: '川沿いヒーリングコース', es: 'Sendero relajante junto al río' },
      '실시간 산책 코스': { en: 'Live GPS Walk Route', ja: 'リアルタイム散歩コース', es: 'Ruta de paseo GPS' },
      '즐거운 산책': { en: 'Joyful Walk', ja: '楽しいお散歩', es: 'Paseo alegre' }
    };

    if (memoMap[name]) {
      return (memoMap[name] as any)[lang] || memoMap[name].en;
    }

    if (name.includes('동반 산책')) {
      const match = name.match(/동반 산책 \((.*)와 함께\)/) || name.match(/동반 산책 \((.*)과 함께\)/);
      if (match) {
        const otherDog = match[1];
        if (lang === 'ja') return `一緒にお散歩 (${otherDog}と一緒)`;
        if (lang === 'es') return `Paseo conjunto (con ${otherDog})`;
        return `Joint Walk (with ${otherDog})`;
      }
      if (lang === 'ja') return '一緒にお散歩';
      if (lang === 'es') return 'Paseo conjunto';
      return 'Joint Walk';
    }

    return name;
  };

  const formatDisplayDate = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();

    const monthNamesEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNamesEs = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

    let dateText = `${m}월 ${day}일`;
    if (language === 'en') {
      dateText = `${monthNamesEn[m - 1]} ${day}`;
    } else if (language === 'ja') {
      dateText = `${m}月${day}日`;
    } else if (language === 'es') {
      dateText = `${day} de ${monthNamesEs[m - 1]}`;
    }

    const todayLabel = language === 'ko' ? '오늘' : language === 'ja' ? '今日' : language === 'es' ? 'Hoy' : 'Today';
    const yesterdayLabel = language === 'ko' ? '어제' : language === 'ja' ? '昨日' : language === 'es' ? 'Ayer' : 'Yesterday';

    if (dateStr === todayStr) {
      return { text: dateText, isToday: true, label: todayLabel };
    }
    if (dateStr === yesterdayStr) {
      return { text: dateText, isToday: false, label: yesterdayLabel };
    }
    return { text: dateText, isToday: false, label: '' };
  };

  return (
    <div className="page-root walk-history-page-root">
      {/* Header */}
      <div className="page-header row-between" style={{ padding: '10px 16px', borderBottom: '1px solid #F1F5F9', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn-ghost"
            style={{ padding: '6px', marginLeft: '-6px' }}
            onClick={onClose}
            aria-label={language === 'ko' ? '뒤로가기' : 'Back'}
            title={language === 'ko' ? '뒤로가기' : 'Back'}
          >
            <ArrowLeft size={24} />
          </button>
          <h2 className="title-lg">{i18n.modalTitle}</h2>
        </div>
        <button
          type="button"
          className="btn-ghost"
          onClick={onClose}
          aria-label={language === 'ko' ? '닫기' : 'Close'}
          title={language === 'ko' ? '닫기' : 'Close'}
        >
          <X size={24} strokeWidth={2} />
        </button>
      </div>

        {/* Pet Switcher Nav (다견 등록 시 딸기 / 보리 등 개별 일지 전환 탭) */}
        {petList.length > 1 && (
          <div className="walk-history-pet-nav" role="tablist" aria-label="반려견 일지 선택">
            {petList.map(p => {
              const isSelected = (p.id || p.name) === (currentDog.id || currentDog.name);
              const isWalking = activeSession && isDogInActiveSession(activeSession, p);
              const petName = localizeDogName(p.name, language);
              return (
                <button
                  key={p.id || p.name}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  className={`walk-history-pet-tab-btn ${isSelected ? 'active' : ''}`}
                  onClick={() => setCurrentDog(p)}
                >
                  <img
                    src={p.avatar || getDefaultDogAvatar()}
                    alt={petName}
                    className="pet-tab-avatar"
                  />
                  <span className="pet-tab-name">
                    {i18n.logOf(petName)}
                  </span>
                  {isWalking && (
                    <span className="pet-tab-walking-badge">
                      <span className="walking-pulse-dot" />
                      {i18n.walkingBadge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Tab Switcher */}
        <div className="walk-history-tab-nav">
          <button
            type="button"
            className={`walk-history-tab-btn ${activeTab === 'distance' ? 'active distance' : ''}`}
            onClick={() => setActiveTab('distance')}
          >
            <MapPin size={16} />
            <span>{i18n.tabDistance}</span>
          </button>
          <button
            type="button"
            className={`walk-history-tab-btn ${activeTab === 'time' ? 'active time' : ''}`}
            onClick={() => setActiveTab('time')}
          >
            <Clock size={16} />
            <span>{i18n.tabTime}</span>
          </button>
        </div>

        {/* Body */}
        <div className="walk-history-body">
          {/* Live Walk Tracker Card or Start Walk Hero Card */}
          {activeSession && isDogInActiveSession(activeSession, currentDog) ? (
            <div className={`walk-live-card ${activeSession.isPaused ? 'is-paused' : ''}`}>
              <div className="walk-live-card-header">
                <div className="walk-live-card-badge-row">
                  <span className={`walk-live-pulse-dot ${activeSession.isPaused ? 'paused' : ''}`} />
                  <span className="walk-live-status-text">
                    {activeSession.isPaused
                      ? i18n.livePaused(activeSession.dogName)
                      : i18n.liveWalking(activeSession.dogName)}
                  </span>
                </div>
                <button
                  type="button"
                  className="walk-sim-btn"
                  onClick={() => addSimulatedWalkDistance(0.1)}
                  title={i18n.testBtnTitle}
                >
                  +100m ({i18n.testBtnLabel})
                </button>
              </div>

              <div className="walk-live-metrics-grid">
                <div className="walk-live-metric-item">
                  <div className="metric-head">
                    <Clock size={13} className="metric-icon" />
                    <span>{i18n.elapsedTime}</span>
                  </div>
                  <div className="metric-value">
                    {formatTimer(activeSession.elapsedSeconds)}
                  </div>
                </div>

                <div className="walk-live-metric-item highlight">
                  <div className="metric-head">
                    <MapPin size={13} className="metric-icon" />
                    <span>{i18n.liveDistance}</span>
                  </div>
                  <div className="metric-value">
                    {activeSession.distanceKm.toFixed(2)} <span className="metric-unit">km</span>
                  </div>
                </div>

                <div className="walk-live-metric-item">
                  <div className="metric-head">
                    <Flame size={13} className="metric-icon" />
                    <span>{i18n.liveCalories}</span>
                  </div>
                  <div className="metric-value">
                    {activeSession.caloriesKcal} <span className="metric-unit">kcal</span>
                  </div>
                </div>
              </div>

              <div className="walk-live-btn-actions">
                {activeSession.isPaused ? (
                  <button
                    type="button"
                    className="walk-live-btn resume"
                    onClick={() => resumeWalk()}
                  >
                    <Play size={14} fill="currentColor" />
                    <span>{i18n.resume}</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    className="walk-live-btn pause"
                    onClick={() => pauseWalk()}
                  >
                    <Pause size={14} fill="currentColor" />
                    <span>{i18n.pause}</span>
                  </button>
                )}

                <button
                  type="button"
                  className="walk-live-btn stop"
                  onClick={() => {
                    setActiveSession(null);
                    stopWalk();
                  }}
                >
                  <Square size={14} fill="currentColor" />
                  <span>{i18n.finish}</span>
                </button>
              </div>
            </div>
          ) : activeSession ? (
            <div className="walk-other-session-card">
              <span className="walk-other-icon"></span>
              <div className="walk-other-info">
                {i18n.otherWalking(activeSession.dogName)}
              </div>
              <button
                type="button"
                className="walk-other-stop-btn"
                onClick={() => {
                  setActiveSession(null);
                  stopWalk();
                }}
              >
                {i18n.endBtn}
              </button>
            </div>
          ) : null}

          {/* ================= 탭 1: 거리 & 코스 분석 ================= */}
          {activeTab === 'distance' && (
            <>
              {/* Summary Card (Distance Theme) */}
              <div className="walk-summary-card distance-theme">
                <div className="walk-summary-top">
                  <div className="walk-summary-badge">
                    <MapPin size={14} />
                    <span>{i18n.distanceStatsBadge}</span>
                  </div>
                  <span className="walk-summary-today-tag">
                    {i18n.todayDistanceTag(todayRecord?.distanceKm || 0)}
                  </span>
                </div>

                <div className="walk-summary-grid">
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{i18n.totalDist}</span>
                    <span className="walk-summary-item-value">{totalDistance.toFixed(1)} <small style={{ fontSize: '0.68rem' }}>km</small></span>
                  </div>
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{i18n.longestDist}</span>
                    <span className="walk-summary-item-value">{maxDistanceRecord.toFixed(1)} <small style={{ fontSize: '0.68rem' }}>km</small></span>
                  </div>
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{i18n.walksCount}</span>
                    <span className="walk-summary-item-value">{totalWalks} <small style={{ fontSize: '0.68rem' }}>{i18n.timesUnit}</small></span>
                  </div>
                </div>
              </div>

              {/* Distance Milestone Insight Card */}
              <div className="walk-insight-card">
                <div className="walk-insight-header">
                  <span className="walk-insight-title">
                    <Compass size={16} color="#FF9E58" />
                    <span>
                      {i18n.todayDistanceGoalTitle(dailyDistanceGoal.toFixed(1))}
                    </span>
                    {!isEditingDistanceGoal && (
                      <button
                        type="button"
                        className="walk-goal-edit-btn"
                        onClick={() => {
                          setTempDistanceGoal(String(dailyDistanceGoal));
                          setIsEditingDistanceGoal(true);
                        }}
                        title={i18n.editGoal}
                      >
                        <Edit2 size={14} />
                      </button>
                    )}
                  </span>
                  <span className="walk-insight-percent distance">{todayDistanceRate}%</span>
                </div>

                {isEditingDistanceGoal && (
                  <div className="walk-goal-inline-edit">
                    <span className="walk-goal-inline-label">
                      {i18n.targetDistanceLabel}
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      max="30"
                      value={tempDistanceGoal}
                      onChange={(e) => setTempDistanceGoal(e.target.value)}
                      className="walk-goal-inline-input"
                      autoFocus
                    />
                    <span className="walk-goal-inline-unit">km</span>
                    <button
                      type="button"
                      className="walk-goal-inline-save distance"
                      onClick={handleSaveDistanceGoal}
                    >
                      <Check size={13} />
                    </button>
                    {/* <button
                      type="button"
                      className="walk-goal-inline-cancel"
                      onClick={() => setIsEditingDistanceGoal(false)}
                    >
                      <ChevronUp size={13} />
                    </button> */}
                  </div>
                )}
                <div className="walk-progress-bar-bg">
                  <div className="walk-progress-bar-fill distance" style={{ width: `${todayDistanceRate}%` }} />
                </div>
                <p className="walk-insight-footer">
                  {(todayRecord?.distanceKm || 0) >= dailyDistanceGoal
                    ? i18n.goalAchieved
                    : i18n.goalRemaining((dailyDistanceGoal - (todayRecord?.distanceKm || 0)).toFixed(1))}
                </p>
              </div>
            </>
          )}

          {/* ================= 탭 2: 시간 & 활동량 분석 ================= */}
          {activeTab === 'time' && (
            <>
              {/* Summary Card (Time Theme) */}
              <div className="walk-summary-card time-theme">
                <div className="walk-summary-top">
                  <div className="walk-summary-badge">
                    <Clock size={14} />
                    <span>{i18n.timeStatsBadge}</span>
                  </div>
                  <span className="walk-summary-today-tag">
                    {i18n.todayTimeTag(todayRecord?.durationMinutes || 0)}
                  </span>
                </div>

                <div className="walk-summary-grid">
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{i18n.totalTime}</span>
                    <span className="walk-summary-item-value">{totalMinutes} <small style={{ fontSize: '0.68rem' }}>{i18n.minUnit}</small></span>
                  </div>
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{i18n.avgPace}</span>
                    <span className="walk-summary-item-value">{avgPace} <small style={{ fontSize: '0.68rem' }}>km/h</small></span>
                  </div>
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{i18n.caloriesBurned}</span>
                    <span className="walk-summary-item-value">{totalCalories} <small style={{ fontSize: '0.68rem' }}>kcal</small></span>
                  </div>
                </div>
              </div>

              {/* Time & Activity Pattern Card */}
              <div className="walk-insight-card">
                <div className="walk-insight-header">
                  <span className="walk-insight-title">
                    <Zap size={16} color="#0D9488" />
                    <span>
                      {i18n.dailyTimeGoalTitle(dailyTimeGoal)}
                    </span>
                    {!isEditingTimeGoal && (
                      <button
                        type="button"
                        className="walk-goal-edit-btn"
                        onClick={() => {
                          setTempTimeGoal(String(dailyTimeGoal));
                          setIsEditingTimeGoal(true);
                        }}
                        title={i18n.editGoal}
                      >
                        <Edit2 size={12} />
                      </button>
                    )}
                  </span>
                  <span className="walk-insight-percent time">{todayTimeRate}%</span>
                </div>

                {isEditingTimeGoal && (
                  <div className="walk-goal-inline-edit">
                    <span className="walk-goal-inline-label">
                      {i18n.targetTimeLabel}
                    </span>
                    <input
                      type="number"
                      step="5"
                      min="5"
                      max="300"
                      value={tempTimeGoal}
                      onChange={(e) => setTempTimeGoal(e.target.value)}
                      className="walk-goal-inline-input"
                      autoFocus
                    />
                    <span className="walk-goal-inline-unit">{i18n.minUnit}</span>
                    <button
                      type="button"
                      className="walk-goal-inline-save time"
                      onClick={handleSaveTimeGoal}
                    >
                      <Check size={13} />
                    </button>
                    <button
                      type="button"
                      className="walk-goal-inline-cancel"
                      onClick={() => setIsEditingTimeGoal(false)}
                    >
                      <X size={13} />
                    </button>
                  </div>
                )}
                <div className="walk-progress-bar-bg">
                  <div className="walk-progress-bar-fill time" style={{ width: `${todayTimeRate}%` }} />
                </div>

                <div className="walk-time-pattern-grid">
                  <div className="walk-pattern-chip">
                    <div className="walk-pattern-icon morning">
                      <Sun size={18} />
                    </div>
                    <div className="walk-pattern-text">
                      <span className="walk-pattern-label">{i18n.morningWalk}</span>
                      <span className="walk-pattern-val">{morningRatio}%</span>
                    </div>
                  </div>
                  <div className="walk-pattern-chip">
                    <div className="walk-pattern-icon evening">
                      <Moon size={18} />
                    </div>
                    <div className="walk-pattern-text">
                      <span className="walk-pattern-label">{i18n.eveningWalk}</span>
                      <span className="walk-pattern-val">{eveningRatio}%</span>
                    </div>
                  </div>
                </div>

                <p className="walk-insight-footer">
                  <strong>{i18n.todayBurnedLabel}:</strong>{' '}
                  {i18n.todayBurnedDesc(todayRecord?.caloriesKcal || 95)}
                </p>
              </div>
            </>
          )}

          {/* List Header + Add Button */}
          <div className="walk-list-header">
            <h4 className="walk-list-title">
              <Calendar size={17} color="#64748B" />
              <span>
                {activeTab === 'distance' ? i18n.listDistanceTitle : i18n.listTimeTitle}
              </span>
            </h4>
            <button
              type="button"
              className="walk-add-btn"
              onClick={() => setShowAddForm(!showAddForm)}
              aria-label={showAddForm ? i18n.addWalkFormCollapse : i18n.addWalkFormOpen}
              title={showAddForm ? i18n.addWalkFormCollapse : i18n.addWalkFormOpen}
            >
              {showAddForm ? <ChevronUp size={18} /> : <Plus size={18} />}
            </button>
          </div>

          {/* Add Walk Form (Collapsible) */}
          {showAddForm && (
            <form className="walk-add-form" onSubmit={handleAddWalk}>
              <div className="walk-add-form-row">
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  placeholder={i18n.phDistance}
                  value={newDistance}
                  onChange={e => setNewDistance(e.target.value)}
                  className="walk-add-input"
                  required
                />
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder={i18n.phDuration}
                  value={newMinutes}
                  onChange={e => setNewMinutes(e.target.value)}
                  className="walk-add-input"
                  required
                />
              </div>
              <div className="walk-add-form-row">
                <input
                  type="text"
                  placeholder={i18n.phLocation}
                  value={newLocation}
                  onChange={e => setNewLocation(e.target.value)}
                  className="walk-add-input"
                />
                <select
                  value={newTimeOfDay}
                  onChange={e => setNewTimeOfDay(e.target.value as any)}
                  className="walk-add-input"
                  style={{ flex: '0 0 100px' }}
                >
                  <option value="morning">{i18n.optMorning}</option>
                  <option value="afternoon">{i18n.optAfternoon}</option>
                  <option value="evening">{i18n.optEvening}</option>
                  <option value="night">{i18n.optNight}</option>
                </select>
              </div>
              <button type="submit" className="walk-add-submit-btn">
                <Check size={16} />
                <span>{i18n.saveWalkBtn}</span>
              </button>
            </form>
          )}

          {/* Walk Records List (Differentiated Content per Tab) */}
          <div className="walk-records-list">
            {records.map(record => {
              const formatted = formatDisplayDate(record.date);
              return (
                <div key={record.id} className="walk-record-card">
                  <div className="walk-record-left">
                    <div className="walk-record-date-row">
                      <span className="walk-record-date">{formatted.text}</span>
                      {formatted.label && (
                        <span className="walk-record-today-badge">{formatted.label}</span>
                      )}
                    </div>
                    <div className="walk-record-meta">
                      <span><MapPin size={11} /> {localizeLocationName(record.locationName, language)}</span>
                      <span>·</span>
                      <span>
                        {record.timeOfDay === 'morning'
                          ? i18n.optMorning
                          : record.timeOfDay === 'afternoon'
                            ? i18n.optAfternoon
                            : record.timeOfDay === 'evening'
                              ? i18n.optEvening
                              : i18n.optNight}
                      </span>
                    </div>
                  </div>

                  <div className="walk-record-right">
                    {activeTab === 'distance' ? (
                      <>
                        <span className="walk-record-primary-val distance">
                          {record.distanceKm.toFixed(1)} km
                        </span>
                        <span className="walk-record-secondary-val distance">
                          {i18n.durationMinsTaken(record.durationMinutes)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="walk-record-primary-val time">
                          {i18n.durationMins(record.durationMinutes)}
                        </span>
                        <span className="walk-record-secondary-val time">
                          {record.caloriesKcal} kcal
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
  );
};
