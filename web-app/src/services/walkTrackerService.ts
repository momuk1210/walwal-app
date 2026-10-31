import { DogProfile, isSameDogName } from '../data/mockDogs';

export const normalizePetProperName = (name: string): string => {
  if (!name) return name;
  if (isSameDogName(name, '딸기')) return '딸기';
  if (isSameDogName(name, '보리')) return '보리';
  return name;
};

export interface TargetWalkDog {
  id: string;
  name: string;
  avatar?: string;
}

export interface ActiveWalkSession {
  dogId: string;
  dogName: string;
  dogAvatar?: string;
  targetDogs: TargetWalkDog[];
  startTime: number; // timestamp in ms
  elapsedSeconds: number;
  distanceKm: number;
  caloriesKcal: number;
  isPaused: boolean;
  lastPosition?: { lat: number; lng: number; timestamp: number };
}

const STORAGE_KEY = 'WALWAL_ACTIVE_WALK_SESSION';

let timerInterval: any = null;
let geoWatchId: number | null = null;
let currentSession: ActiveWalkSession | null = null;

// Aggressively kill ALL intervals across window to exterminate any lingering HMR timers
function killAllZombieIntervals() {
  if (typeof window !== 'undefined') {
    try {
      const maxId = window.setInterval(() => { }, 9999);
      for (let i = 1; i <= maxId; i++) {
        window.clearInterval(i);
      }
    } catch (e) { }
  }
}

killAllZombieIntervals();

// Haversine formula to compute distance between two lat/lng points in km
function calculateHaversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getTimeOfDayFromHour(hour: number): 'morning' | 'afternoon' | 'evening' | 'night' {
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 18) return 'afternoon';
  if (hour >= 18 && hour < 22) return 'evening';
  return 'night';
}

function notifyUpdate() {
  if (currentSession) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSession));
    } catch (e) { }
    window.dispatchEvent(new CustomEvent('walwal_walk_tracker_update', { detail: currentSession }));
  } else {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) { }
    window.dispatchEvent(new CustomEvent('walwal_walk_tracker_stopped', { detail: null }));
  }
}

function stopTimer() {
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
  if (typeof window !== 'undefined' && (window as any).__WALWAL_WALK_INTERVAL__) {
    clearInterval((window as any).__WALWAL_WALK_INTERVAL__);
    (window as any).__WALWAL_WALK_INTERVAL__ = null;
  }
  killAllZombieIntervals();
}

function stopGeolocationWatch() {
  if (geoWatchId !== null && typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.clearWatch(geoWatchId);
    geoWatchId = null;
  }
  if (typeof window !== 'undefined' && (window as any).__WALWAL_GEO_WATCH__) {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.clearWatch((window as any).__WALWAL_GEO_WATCH__);
    }
    (window as any).__WALWAL_GEO_WATCH__ = null;
  }
}

function startTimer() {
  stopTimer();
  if (!currentSession || currentSession.isPaused) return;

  const id = setInterval(() => {
    if (currentSession && !currentSession.isPaused) {
      currentSession.elapsedSeconds += 1;
      currentSession.caloriesKcal = Math.max(
        1,
        Math.round(currentSession.distanceKm * 52) || Math.round((currentSession.elapsedSeconds / 60) * 3.5)
      );
      notifyUpdate();
    } else {
      stopTimer();
    }
  }, 1000);

  timerInterval = id;
  if (typeof window !== 'undefined') {
    (window as any).__WALWAL_WALK_INTERVAL__ = id;
  }
}

function startGeolocationWatch() {
  stopGeolocationWatch();
  if (typeof navigator === 'undefined' || !navigator.geolocation) return;
  if (!currentSession || currentSession.isPaused) return;

  try {
    const wid = navigator.geolocation.watchPosition(
      (pos) => {
        if (!currentSession || currentSession.isPaused) {
          stopGeolocationWatch();
          return;
        }
        const { latitude, longitude, accuracy } = pos.coords;

        // Ignore readings with poor accuracy (> 45 meters) to avoid drift spikes
        if (accuracy && accuracy > 45) return;

        const now = Date.now();
        if (currentSession.lastPosition) {
          const distKm = calculateHaversineKm(
            currentSession.lastPosition.lat,
            currentSession.lastPosition.lng,
            latitude,
            longitude
          );

          // Threshold: Ignore tiny micro-jitter (< 4 meters)
          // Speed check: Ignore impossible jumps (> 40 km/h)
          const timeDiffHours = (now - currentSession.lastPosition.timestamp) / 3600000;
          const speedKmH = timeDiffHours > 0 ? distKm / timeDiffHours : 0;

          if (distKm >= 0.004 && speedKmH <= 40) {
            currentSession.distanceKm = Math.round((currentSession.distanceKm + distKm) * 1000) / 1000;
            currentSession.caloriesKcal = Math.max(
              1,
              Math.round(currentSession.distanceKm * 52)
            );
            currentSession.lastPosition = { lat: latitude, lng: longitude, timestamp: now };
            notifyUpdate();
          }
        } else {
          currentSession.lastPosition = { lat: latitude, lng: longitude, timestamp: now };
          notifyUpdate();
        }
      },
      (err) => {
        console.warn('Geolocation watch notice:', err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000
      }
    );
    geoWatchId = wid;
    if (typeof window !== 'undefined') {
      (window as any).__WALWAL_GEO_WATCH__ = wid;
    }
  } catch (e) {
    console.error('Failed to initiate geolocation watch:', e);
  }
}

export function getActiveWalkSession(): ActiveWalkSession | null {
  if (currentSession) {
    if (currentSession.targetDogs) {
      currentSession.targetDogs = currentSession.targetDogs.map(d => ({
        ...d,
        name: normalizePetProperName(d.name)
      }));
      currentSession.dogName = currentSession.targetDogs.map(d => d.name).join(' & ');
    } else if (currentSession.dogName) {
      currentSession.dogName = normalizePetProperName(currentSession.dogName);
    }
    if (!currentSession.isPaused && !timerInterval) {
      startTimer();
      startGeolocationWatch();
    }
    return currentSession;
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      currentSession = JSON.parse(saved);
      if (currentSession) {
        if (currentSession.targetDogs) {
          currentSession.targetDogs = currentSession.targetDogs.map((d: TargetWalkDog) => ({
            ...d,
            name: normalizePetProperName(d.name)
          }));
          currentSession.dogName = currentSession.targetDogs.map((d: TargetWalkDog) => d.name).join(' & ');
        } else if (currentSession.dogName) {
          currentSession.dogName = normalizePetProperName(currentSession.dogName);
        }
      }
      // ONLY resume ticker if session was active AND NOT paused!
      if (currentSession && !currentSession.isPaused && !timerInterval) {
        startTimer();
        startGeolocationWatch();
      }
      return currentSession;
    }
  } catch (e) { }
  return null;
}

export function isDogInActiveSession(session: ActiveWalkSession | null, dog: DogProfile): boolean {
  if (!session) return false;
  const dId = dog.id || dog.name;
  if (session.targetDogs && session.targetDogs.length > 0) {
    return session.targetDogs.some(td => td.id === dId || td.name === dog.name || isSameDogName(td.name, dog.name));
  }
  return session.dogId.includes(dId) || session.dogName.includes(dog.name) || isSameDogName(session.dogName, dog.name);
}

export function startWalk(dogs: DogProfile | DogProfile[]): ActiveWalkSession {
  // If another session was active, stop it first
  if (currentSession) {
    stopWalk();
  }

  const dogList = Array.isArray(dogs) ? dogs : [dogs];
  const targetDogs: TargetWalkDog[] = dogList.map(d => ({
    id: d.id || d.name,
    name: normalizePetProperName(d.name),
    avatar: d.avatar
  }));

  const combinedName = targetDogs.map(d => d.name).join(' & ');
  const combinedId = targetDogs.map(d => d.id).join(',');

  currentSession = {
    dogId: combinedId,
    dogName: combinedName,
    dogAvatar: targetDogs[0]?.avatar,
    targetDogs,
    startTime: Date.now(),
    elapsedSeconds: 0,
    distanceKm: 0,
    caloriesKcal: 0,
    isPaused: false
  };

  localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSession));
  startTimer();
  startGeolocationWatch();
  notifyUpdate();
  window.dispatchEvent(new CustomEvent('walwal_walk_tracker_started', { detail: currentSession }));

  // Haptic feedback & Toast notification
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate([80, 40, 80]);
    }
  } catch (e) { }

  window.dispatchEvent(new CustomEvent('walwal_push_notification', {
    detail: {
      title: '🐾 산책 트래킹 시작!',
      body: `${combinedName}와(과)의 GPS 실시간 산책 측정을 시작했습니다.`,
      time: '지금'
    }
  }));

  return currentSession;
}

export function pauseWalk() {
  if (currentSession) {
    currentSession.isPaused = true;
    stopTimer();
    stopGeolocationWatch();
    notifyUpdate();
  }
}

export function resumeWalk() {
  if (currentSession) {
    currentSession.isPaused = false;
    startTimer();
    startGeolocationWatch();
    notifyUpdate();
  }
}

// Helper to manually add distance (useful for indoor testing or simulation)
export function addSimulatedWalkDistance(amountKm: number = 0.05) {
  if (currentSession && !currentSession.isPaused) {
    currentSession.distanceKm = Math.round((currentSession.distanceKm + amountKm) * 1000) / 1000;
    currentSession.caloriesKcal = Math.max(1, Math.round(currentSession.distanceKm * 52));
    notifyUpdate();
  }
}

export interface StopWalkResult {
  dogId: string;
  dogName: string;
  distanceKm: number;
  durationMinutes: number;
  caloriesKcal: number;
  date: string;
}

export function stopWalk(): StopWalkResult | null {
  stopTimer();
  stopGeolocationWatch();
  killAllZombieIntervals();

  if (!currentSession) {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) currentSession = JSON.parse(saved);
    } catch (e) { }
  }

  // Always purge storage first
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { }

  if (!currentSession) {
    killAllZombieIntervals();
    window.dispatchEvent(new CustomEvent('walwal_walk_tracker_stopped', { detail: null }));
    return null;
  }

  const finalSeconds = currentSession.elapsedSeconds || 0;
  const durationMinutes = Math.max(1, Math.round(finalSeconds / 60));
  const finalDistanceKm = Math.max(0.05, Math.round((currentSession.distanceKm || 0) * 100) / 100);
  const caloriesKcal = currentSession.caloriesKcal || Math.max(5, Math.round(finalDistanceKm * 52));
  const todayStr = new Date().toISOString().split('T')[0];
  const timeOfDay = getTimeOfDayFromHour(new Date().getHours());

  const result: StopWalkResult = {
    dogId: currentSession.dogId || '',
    dogName: currentSession.dogName || '',
    distanceKm: finalDistanceKm,
    durationMinutes,
    caloriesKcal,
    date: todayStr
  };

  const sessionCopy = currentSession;
  currentSession = null;

  // 1. Append to Pet's Walk Logs for EACH participating dog
  const participatingDogs = (sessionCopy.targetDogs && sessionCopy.targetDogs.length > 0)
    ? sessionCopy.targetDogs
    : [{ id: sessionCopy.dogId, name: sessionCopy.dogName, avatar: sessionCopy.dogAvatar }];

  participatingDogs.forEach(targetDog => {
    try {
      const keys = new Set<string>();
      if (targetDog.id) keys.add(`WALWAL_WALK_LOGS_${targetDog.id}`);
      if (targetDog.name) keys.add(`WALWAL_WALK_LOGS_${targetDog.name}`);

      const isMulti = participatingDogs.length > 1;
      const otherNames = participatingDogs.filter(d => (d.id !== targetDog.id && d.name !== targetDog.name)).map(d => d.name).join(', ');
      const newLogRecord = {
        id: `walk-${Date.now()}-${targetDog.id || targetDog.name}`,
        date: todayStr,
        distanceKm: finalDistanceKm,
        durationMinutes,
        caloriesKcal,
        locationName: isMulti ? `동반 산책 (${otherNames}와 함께)` : '실시간 산책 코스',
        timeOfDay
      };

      keys.forEach(storageKey => {
        const savedLogsStr = localStorage.getItem(storageKey);
        const savedLogs = savedLogsStr ? JSON.parse(savedLogsStr) : [];
        localStorage.setItem(storageKey, JSON.stringify([newLogRecord, ...savedLogs]));
      });
    } catch (e) {
      console.error('Failed to append walk log record:', e);
    }
  });

  // 2. Update Pet Profile Accumulation in WALWAL_PETS for ALL participating dogs
  try {
    const savedPetsStr = localStorage.getItem('WALWAL_PETS');
    if (savedPetsStr) {
      const pets = JSON.parse(savedPetsStr);
      if (Array.isArray(pets)) {
        const participatingIds = new Set(participatingDogs.map(d => d.id));
        const participatingNames = new Set(participatingDogs.map(d => d.name));

        const updated = pets.map((p: any) => {
          if (participatingIds.has(p.id) || participatingNames.has(p.name)) {
            return {
              ...p,
              todayWalkDistance: Math.round(((Number(p.todayWalkDistance) || 0) + finalDistanceKm) * 10) / 10,
              todayWalkMinutes: (Number(p.todayWalkMinutes) || 0) + durationMinutes,
              walkDistance: Math.round(((Number(p.walkDistance) || 0) + finalDistanceKm) * 10) / 10,
              walkMinutes: (Number(p.walkMinutes) || 0) + durationMinutes
            };
          }
          return p;
        });
        localStorage.setItem('WALWAL_PETS', JSON.stringify(updated));
      }
    }
  } catch (e) {
    console.error('Failed to update WALWAL_PETS stats:', e);
  }

  // 3. Clear session and all storage
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { }

  // 4. Kill all timers once more
  killAllZombieIntervals();
  stopTimer();
  stopGeolocationWatch();

  // 5. Notify app
  window.dispatchEvent(new CustomEvent('walwal_pets_updated'));
  window.dispatchEvent(new CustomEvent('walwal_walk_completed', { detail: result }));
  window.dispatchEvent(new CustomEvent('walwal_walk_tracker_stopped', { detail: sessionCopy }));

  // Haptic & Toast notification
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(120);
    }
  } catch (e) { }

  window.dispatchEvent(new CustomEvent('walwal_push_notification', {
    detail: {
      title: '산책 완료 및 기록 저장!',
      body: `${result.distanceKm}km (${result.durationMinutes}분) 산책 일지에 자동 합산되었습니다.`,
      time: '방금 전'
    }
  }));

  return result;
}
