import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, LocateFixed, MapPin, Send, Heart, Sparkles, Menu } from 'lucide-react';
import { DogProfile, getMockDogs, isSameDogName, getDefaultDogAvatar, normalizeDogProfile, sanitizePetList, localizeBreed, localizePersonalityTags } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { OwnerNoteModal } from './OwnerNoteModal';
import { db } from '../firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface NearbyViewProps {
  onStartVirtualChat: (dog1: DogProfile, dog2: DogProfile) => void;
}

export type RadarViewProps = NearbyViewProps;

// 두 좌표 간 실제 미터(m) 거리 계산 (Haversine 공식)
const getDistanceMeters = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

const formatDistance = (meters: number): string => {
  if (meters === 0) return '내 위치';
  if (meters < 1000) return `${meters}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const NearbyView: React.FC<NearbyViewProps> = ({ onStartVirtualChat }) => {
  const { t, language } = useTranslation();
  const [nearbyZoom, setNearbyZoom] = useState<'300m' | '500m' | '1km'>('500m');
  const [ownerNoteTarget, setOwnerNoteTarget] = useState<DogProfile | null>(null);
  const [mapTheme] = useState<'dark' | 'light'>(() => {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const isNight = (hour === 18 && minute >= 30) || hour > 18 || hour < 6;
    return isNight ? 'dark' : 'light';
  });

  // Dynamic User Real Location State (Detected GPS or IP Fallback)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 37.4200, lng: 127.1267 });
  const [locationLabel, setLocationLabel] = useState<string>('내 현재 위치 탐색 중...');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [petsUpdateKey, setPetsUpdateKey] = useState<number>(0);

  // Firestore에서 실시간으로 불러온 실제 가입 반려견 목록
  const [firestoreDogs, setFirestoreDogs] = useState<DogProfile[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const dogMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);

  // 1. 내 반려견 프로필 조회 (로컬 스토리지에 등록된 내 반려견들 - 등록된 반려견이 없으면 빈 배열)
  const myPets = useMemo<DogProfile[]>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return sanitizePetList(parsed, language);
        }
      }
    } catch (e) { }
    return [];
  }, [language, petsUpdateKey]);

  const primaryPet = myPets[0] || null;

  // 선택된 핀 (기본값: 내 대표 반려견이 있는 경우에만 선택)
  const [selectedPin, setSelectedPin] = useState<DogProfile | null>(() => primaryPet);

  useEffect(() => {
    if (!selectedPin && primaryPet) {
      setSelectedPin(primaryPet);
    } else if (myPets.length === 0 && (selectedPin as any)?.isMyPet) {
      setSelectedPin(null);
    }
  }, [primaryPet, myPets.length]);

  // Calculate meter distance to lat/lng offsets around actual user coordinates
  const getNearbyOffset = (meterDist: number, angleDeg: number) => {
    const latOffset = (meterDist * Math.cos((angleDeg * Math.PI) / 180)) / 111000;
    const lngOffset = (meterDist * Math.sin((angleDeg * Math.PI) / 180)) / (111000 * Math.cos((userCoords.lat * Math.PI) / 180));
    return { lat: userCoords.lat + latOffset, lng: userCoords.lng + lngOffset };
  };

  // 2. Firestore 'dogs' 컬렉션에서 실제 가입된 모든 강아지 실시간 동기화 (가짜 데이터 없음)
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, 'dogs'), (snapshot) => {
        const dogsList: DogProfile[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.name) {
            dogsList.push({
              id: docSnap.id,
              name: data.name,
              breed: data.breed || '반려견',
              age: data.age ? String(data.age) : '1',
              gender: data.gender || 'male',
              ownerName: data.ownerName || `${data.name} 보호자`,
              avatar: data.avatar || getDefaultDogAvatar(data.name || data.breed),
              personality: Array.isArray(data.personality) ? data.personality : ['#댕댕이'],
              greeting: data.greeting || '',
              adoptionDate: data.adoptionDate || '',
              distance: '0m',
              lat: typeof data.lat === 'number' ? data.lat : 0,
              lng: typeof data.lng === 'number' ? data.lng : 0,
              walkDistance: data.walkDistance || 0,
              walkMinutes: data.walkMinutes || 0,
              recentThought: data.recentThought || '산책 친구 구해요!',
              detectedEmotion: 'happy',
              soundPattern: '멍멍!',
              posePattern: '꼬리 살랑',
              conversationLog: []
            });
          }
        });
        setFirestoreDogs(dogsList);
      }, (err) => {
        console.warn('Firestore dogs snapshot error:', err);
      });

      return () => unsub();
    } catch (err) {
      console.warn('Firestore subscription failed:', err);
    }
  }, []);

  // 3. 내 반려견들의 현재 위치를 Firestore 'dogs'에 실시간 동기화
  useEffect(() => {
    if (myPets.length > 0 && userCoords.lat && userCoords.lng) {
      myPets.forEach((pet, idx) => {
        if (!pet.id) return;
        const petPos = idx === 0 ? userCoords : getNearbyOffset(18 * idx, 60 * idx);
        try {
          setDoc(doc(db, 'dogs', pet.id), {
            id: pet.id,
            name: pet.name,
            breed: pet.breed,
            age: pet.age ? String(pet.age) : '1',
            gender: pet.gender || 'male',
            ownerName: pet.ownerName || `${pet.name} 보호자`,
            avatar: pet.avatar || getDefaultDogAvatar(pet.name),
            personality: pet.personality || [],
            greeting: pet.greeting || '',
            lat: petPos.lat,
            lng: petPos.lng,
            updatedAt: serverTimestamp()
          }, { merge: true }).catch(err => {
            console.warn('Failed to update pet coords to Firestore:', err);
          });
        } catch (e) { }
      });
    }
  }, [myPets, userCoords.lat, userCoords.lng]);

  // 4. 지도에 표시할 반려견 목록: 내 반려견들 + 실제 가입된 다른 사용자 반려견들
  const displayDogs = useMemo<Array<DogProfile & { isMyPet: boolean; distanceMeters: number }>>(() => {
    const list: Array<DogProfile & { isMyPet: boolean; distanceMeters: number }> = [];
    const maxRadius = nearbyZoom === '300m' ? 300 : nearbyZoom === '500m' ? 500 : 1000;

    // A. 내 반려견들 등록 (내 현재 위치 및 함께 산책하는 위치 - 중복 제거)
    const cleanMyPets = sanitizePetList(myPets, language);
    cleanMyPets.forEach((pet, idx) => {
      const pos = idx === 0 ? userCoords : getNearbyOffset(18 * idx, 60 * idx);
      const alreadyInList = list.some(d => isSameDogName(d.name, pet.name) || (pet.id && d.id === pet.id));
      if (!alreadyInList) {
        list.push({
          ...normalizeDogProfile(pet, language),
          lat: pos.lat,
          lng: pos.lng,
          distance: language === 'ko' ? '내 위치' : 'My Location',
          distanceMeters: 0,
          isMyPet: true
        });
      }
    });

    // B. Firestore에 실제 등록된 다른 사용자의 반려견들 (반경 내 필터링 및 중복 제외)
    firestoreDogs.forEach(dog => {
      // 내 반려견이거나 이미 등록된 강아지 중복 제외
      if (cleanMyPets.some(mp => mp.id === dog.id || isSameDogName(mp.name, dog.name))) {
        return;
      }
      if (list.some(d => d.id === dog.id || isSameDogName(d.name, dog.name))) {
        return;
      }
      // 좌표가 없거나 0인 경우 제외
      if (!dog.lat || !dog.lng) {
        return;
      }

      let meters = getDistanceMeters(userCoords.lat, userCoords.lng, dog.lat, dog.lng);
      let dogLat = dog.lat;
      let dogLng = dog.lng;

      // 핀 겹침 방지 (Anti-Collision): 내 위치 핀과 90m 이내로 겹치는 경우 최소 120m 이격 분리
      if (meters < 90) {
        const charSeed = (dog.id || dog.name || 'dog').split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
        const angleDeg = (charSeed * 53 + 45) % 360;
        const adjustedPos = getNearbyOffset(120, angleDeg);
        dogLat = adjustedPos.lat;
        dogLng = adjustedPos.lng;
        meters = 120;
      }

      if (meters <= maxRadius) {
        list.push({
          ...normalizeDogProfile(dog, language),
          lat: dogLat,
          lng: dogLng,
          distance: formatDistance(meters),
          distanceMeters: meters,
          isMyPet: false
        });
      }
    });

    return list;
  }, [myPets, firestoreDogs, userCoords, nearbyZoom, language]);

  // 다른 가입자 강아지 수 카운트
  const otherUsersDogCount = useMemo(() => {
    return displayDogs.filter(d => !d.isMyPet).length;
  }, [displayDogs]);

  // Real-time Dual Geolocation (GPS + IP Fallback)
  const detectUserRealLocation = async (forceGPS = false) => {
    setIsLocating(true);
    setLocationLabel(t.common?.gpsReceiving || 'GPS 신호 수신 중...');

    const applyCoords = async (latitude: number, longitude: number) => {
      setUserCoords({ lat: latitude, lng: longitude });
      setIsLocating(false);
      try {
        localStorage.setItem('WALWAL_LAST_COORDS', JSON.stringify({ lat: latitude, lng: longitude }));
      } catch (e) {}

      if (leafletMapRef.current) {
        const targetZoom = nearbyZoom === '300m' ? 17 : nearbyZoom === '500m' ? 16 : 15;
        leafletMapRef.current.setView([latitude, longitude], targetZoom);
      }

      // Reverse geocoding in Korean
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=15&addressdetails=1`,
          { headers: { 'Accept-Language': 'ko' } }
        );
        const data = await res.json();
        const addr = data.address;
        const city = addr?.city || addr?.county || '';
        const dong = addr?.suburb || addr?.neighbourhood || addr?.borough || addr?.city_district || addr?.town || '';

        const fullDong = dong ? `${city ? city + ' ' : ''}${dong}` : (city || (language === 'ko' ? '현재 위치' : 'Current Location'));
        setLocationLabel(`${language === 'ko' ? '내 위치' : 'My Location'} (${fullDong})`);
      } catch (e) {
        setLocationLabel(`${language === 'ko' ? '내 위치' : 'My Location'} (${latitude.toFixed(3)}°, ${longitude.toFixed(3)}°)`);
      }
    };

    const doIpFallback = async () => {
      try {
        const ipRes = await fetch('https://ipapi.co/json/');
        const ipData = await ipRes.json();
        if (ipData && ipData.latitude && ipData.longitude) {
          const cityName = ipData.city === 'Seongnam-si' ? (language === 'ko' ? '성남시' : 'Seongnam') : (ipData.city || (language === 'ko' ? '내 현재 위치' : 'My Current Location'));
          setUserCoords({ lat: ipData.latitude, lng: ipData.longitude });
          setIsLocating(false);
          setLocationLabel(`${language === 'ko' ? '내 위치' : 'My Location'} (${cityName})`);
          if (leafletMapRef.current) {
            leafletMapRef.current.setView([ipData.latitude, ipData.longitude], 16);
          }
          return;
        }
      } catch (ipErr) {
        console.warn('IP fallback error:', ipErr);
      }
      setIsLocating(false);
      setLocationLabel(language === 'ko' ? '내 위치' : 'My Location');
    };

    // 동네친구 탭 진입 시: 브라우저 위치 동의 알림 팝업 차단
    // 사용자가 우측 하단 GPS 버튼을 직접 누른 경우(forceGPS === true)에만 브라우저 권한 팝업을 요청
    // 그 외(동네친구 탭 진입 등)에는 위치 동의된 것으로 간주하여 브라우저 팝업 없이 IP/동네 위치로 즉시 표시
    if (!forceGPS) {
      if (typeof navigator !== 'undefined' && (navigator as any).permissions) {
        try {
          const perm = await (navigator as any).permissions.query({ name: 'geolocation' });
          if (perm.state === 'granted') {
            // 이미 이전에 브라우저 권한을 허용한 상태라면 알림 팝업 없이 GPS 수신 가능
            navigator.geolocation.getCurrentPosition(
              (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude),
              () => doIpFallback(),
              { enableHighAccuracy: true, timeout: 5000, maximumAge: 60000 }
            );
            return;
          }
        } catch {
          // permissions API 미지원 시 바로 IP fallback
        }
      }
      // 아직 권한을 묻지 않았거나 알림 팝업을 방지하기 위해 팝업 없이 바로 IP 위치로 동의 처리
      doIpFallback();
      return;
    }

    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => applyCoords(pos.coords.latitude, pos.coords.longitude),
        (err) => {
          console.warn('GPS signal unavailable, using IP fallback:', err);
          doIpFallback();
        },
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
      );
    } else {
      doIpFallback();
    }
  };

  // 범위 선택 버튼 클릭 시 지도 이동 및 줌 연동
  const handleSelectRange = (range: '300m' | '500m' | '1km') => {
    setNearbyZoom(range);
    const targetZoom = range === '300m' ? 17 : range === '500m' ? 16 : 15;
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([userCoords.lat, userCoords.lng], targetZoom, { animate: true });
    }
  };

  // Initialize Real Leaflet Interactive Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    const zoomLevel = nearbyZoom === '300m' ? 17 : nearbyZoom === '500m' ? 16 : 15;
    const map = L.map(mapContainerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false
    });

    // Clean OpenStreetMap Tile
    const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: mapTheme === 'dark' ? 'radar-dark-map-tiles' : ''
    }).addTo(map);
    tileLayerRef.current = tile;

    const dogGroup = L.layerGroup().addTo(map);
    dogMarkersGroupRef.current = dogGroup;
    leafletMapRef.current = map;

    // 사용자가 손가락으로 줌인/줌아웃 할 때 범위 버튼 및 이웃 핀 개수 자동 연동
    map.on('zoomend', () => {
      const z = map.getZoom();
      if (z <= 15) {
        setNearbyZoom('1km');
      } else if (z === 16) {
        setNearbyZoom('500m');
      } else {
        setNearbyZoom('300m');
      }
    });

    // 동네친구 탭 진입 시: 브라우저 위치 권한 팝업 없이 부드럽게 IP/동네 위치로 표시
    detectUserRealLocation(false);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Sync pets update events from local storage
  useEffect(() => {
    const handlePetsUpdated = () => {
      setPetsUpdateKey(prev => prev + 1);
    };
    window.addEventListener('walwal_pets_updated', handlePetsUpdated);
    window.addEventListener('storage', handlePetsUpdated);

    // 설정(SettingsView)에서 위치 권한 토글 시 실시간 연동
    const handlePermUpdate = (e: any) => {
      if (e?.detail?.type === 'location' || !e?.detail) {
        const isAllowed = localStorage.getItem('WALWAL_PERM_LOCATION') !== 'false';
        if (isAllowed) {
          detectUserRealLocation(false);
        }
      }
    };
    window.addEventListener('walwal_permissions_updated', handlePermUpdate);

    return () => {
      window.removeEventListener('walwal_pets_updated', handlePetsUpdated);
      window.removeEventListener('storage', handlePetsUpdated);
      window.removeEventListener('walwal_permissions_updated', handlePermUpdate);
    };
  }, []);

  // Update radius circle and all dog pins (내 반려견 + 다른 가입자 반려견)
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const radiusMeters = nearbyZoom === '300m' ? 300 : nearbyZoom === '500m' ? 500 : 1000;

    // 1. 탐색 반경 원 (Radar Range Circle)
    if (radarCircleRef.current) {
      radarCircleRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      radarCircleRef.current.setRadius(radiusMeters);
    } else {
      radarCircleRef.current = L.circle([userCoords.lat, userCoords.lng], {
        radius: radiusMeters,
        color: '#FF9E58',
        weight: 1.5,
        dashArray: '5, 8',
        fillColor: '#FF9E58',
        fillOpacity: 0.06
      }).addTo(map);
    }

    // 2. 지도 핀 렌더링: 내 반려견 + 실제 가입된 다른 사용자 반려견
    if (dogMarkersGroupRef.current) {
      dogMarkersGroupRef.current.clearLayers();

      // 반려견이 등록되지 않은 사용자의 경우 지도 중앙 내 현재 위치 표시
      if (myPets.length === 0 && userCoords.lat && userCoords.lng) {
        const myLocationIcon = L.divIcon({
          className: 'user-my-loc-marker',
          html: `
            <div style="display:flex;flex-direction:column;align-items:center;cursor:default;">
              <div style="position:relative;width:20px;height:20px;background:#2EC4B6;border:3px solid #FFFFFF;border-radius:50%;box-shadow:0 0 12px rgba(46,196,182,0.8);">
                <div style="position:absolute;inset:0;background:rgba(46,196,182,0.4);border-radius:50%;animation:pulse 2s infinite;"></div>
              </div>
              <div style="background:#2EC4B6;color:#FFFFFF;font-size:10px;font-weight:800;padding:2px 6px;border-radius:8px;margin-top:3px;box-shadow:0 2px 6px rgba(0,0,0,0.2);white-space:nowrap;">
                ${language === 'ko' ? '내 위치' : 'My Location'}
              </div>
            </div>
          `,
          iconSize: [44, 44],
          iconAnchor: [22, 22]
        });
        L.marker([userCoords.lat, userCoords.lng], {
          icon: myLocationIcon,
          zIndexOffset: 1000
        }).addTo(dogMarkersGroupRef.current);
      }

      displayDogs.forEach((dog) => {
        if (!dog.lat || !dog.lng) return;

        const isSelected = selectedPin ? (selectedPin.id === dog.id || isSameDogName(selectedPin.name, dog.name)) : dog.isMyPet;
        const isMyPet = dog.isMyPet;

        const dogIcon = L.divIcon({
          className: 'dog-marker-icon',
          html: `
            <div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;">
              <div style="position:relative;width:${isSelected ? 52 : 44}px;height:${isSelected ? 52 : 44}px;border-radius:50%;border:${isMyPet ? '3px solid #FF9E58' : (isSelected ? '3px solid #2EC4B6' : '2px solid #FFFFFF')};box-shadow:${isSelected ? (isMyPet ? '0 0 20px rgba(255, 126, 54, 0.6)' : '0 0 20px rgba(46, 196, 182, 0.6)') : '0 4px 12px rgba(0,0,0,0.15)'};overflow:hidden;background:#FFFFFF;transition:all 0.2s;">
                ${isMyPet ? '<div style="position:absolute;inset:0;background:rgba(255,126,54,0.2);animation:pulse 2s infinite;border-radius:50%;"></div>' : ''}
                <img src="${dog.avatar}" style="width:100%;height:100%;object-fit:cover;" />
              </div>
              <div style="background:${isMyPet ? '#FF9E58' : (isSelected ? '#2EC4B6' : '#FFFFFF')};border:1px solid rgba(0,0,0,0.08);padding:2px 8px;border-radius:10px;font-size:11px;font-weight:800;color:${(isMyPet || isSelected) ? '#FFFFFF' : '#333'};margin-top:3px;white-space:nowrap;box-shadow:0 3px 8px rgba(0,0,0,0.15);display:flex;align-items:center;gap:3px;">
                ${dog.name} ${isMyPet ? `<span style="font-size:10px;background:rgba(255,255,255,0.25);padding:1px 4px;border-radius:6px;">${language === 'ko' ? '나' : language === 'zh' ? '我' : language === 'ja' ? '私' : language === 'fr' ? 'Moi' : language === 'es' ? 'Yo' : 'Me'}</span>` : `<span style="font-size:10px;opacity:0.85;">${dog.distance}</span>`}
              </div>
            </div>
          `,
          iconSize: [60, 60],
          iconAnchor: [30, 30]
        });

        const marker = L.marker([dog.lat, dog.lng], {
          icon: dogIcon,
          zIndexOffset: isMyPet ? 1000 : (isSelected ? 500 : 100)
        });
        marker.on('click', () => setSelectedPin(dog));
        marker.addTo(dogMarkersGroupRef.current!);
      });
    }
  }, [userCoords, nearbyZoom, selectedPin, displayDogs, mapTheme, language]);

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header  row-between">
        <div>
          <div className="row gap-6">
            <h2 className="title-lg">{language === 'ko' ? '동네친구' : ((t.nearby || t.radar)?.title || 'Nearby Friends')}</h2>
          </div>
          {/* <p className="text-sub">
            {language === 'ko'
              ? (otherUsersDogCount > 0
                ? `내 반려견 ${myPets.length}마리 · 주변 ${nearbyZoom} 내 가입 친구 ${otherUsersDogCount}마리`
                : `내 반려견 ${myPets.length}마리 (반경 ${nearbyZoom} 내 가입 친구 탐색 중)`)
              : `My Pets ${myPets.length} · Neighbors within ${nearbyZoom}: ${otherUsersDogCount}`}
          </p> */}
        </div>

        <div className="row gap-6" style={{ alignItems: 'center' }}>
          {/* Range Selector Buttons */}
          <div className="radarZoom-wrap">
            {(['300m', '500m', '1km'] as const).map(range => (
              <button
                className={`radarZoom-btn ${nearbyZoom === range ? 'active' : ''}`}
                key={range}
                onClick={() => handleSelectRange(range)}
                style={{
                  background: nearbyZoom === range ? '#FF9E58' : 'transparent',
                  color: nearbyZoom === range ? '#fff' : '#000',
                }}
              >
                {range}
              </button>
            ))}
          </div>

          <button
            className="all-services-header-btn"
            onClick={() => window.dispatchEvent(new CustomEvent('walwal_open_all_services'))}
            aria-label="전체서비스"
            title="전체서비스"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Main Real Map Viewport */}
      <div className='section-gap'>
        {/* Real Leaflet Map Container */}
        <div className="card" ref={mapContainerRef} />

        {/* Floating Real-time Location Indicator */}
        <div className="location-indicator-wrap">
          <MapPin size={15} />
          <span>{locationLabel}</span>
        </div>

        {/* Quick GPS Recenter Button */}
        <div className="quick-recenter-wrap">
          <button
            className="quick-recenter-btn"
            onClick={() => detectUserRealLocation(true)}
            style={{
              color: isLocating ? '#2EC4B6' : '#FF9E58',
            }}
            title={language === 'ko' ? '현재 내 위치로 이동' : 'Go to Current Location'}
          >
            <LocateFixed size={18} className={isLocating ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Selected Dog Bottom Sheet */}
      {selectedPin ? (
        <div className="selected-dog-modal">
          <button
            onClick={() => setSelectedPin(null)}
            className="btn-ghost"
            style={{ position: 'absolute', top: '16px', right: '16px', color: '#c8c8c8' }}
          >
            <X size={20} strokeWidth={3} />
          </button>

          <div className="row gap-14">
            <img
              className="avatar"
              src={selectedPin.avatar}
              alt={selectedPin.name}
            />
            <div style={{ flex: 1 }}>
              <div className="row gap-8 flex align-items-center">
                <h3 className="title-lg">{selectedPin.name}</h3>
                {myPets.some(mp => mp.id === selectedPin.id || isSameDogName(mp.name, selectedPin.name)) && (
                  <span className="badge-sm">
                    {language === 'ko' ? '내 반려견' : language === 'zh' ? '我的狗狗' : language === 'ja' ? '愛犬' : language === 'fr' ? 'Mon Chien' : language === 'es' ? 'Mi Perro' : 'My Dog'}
                  </span>
                )}
              </div>
              <div className="text-sub mt-4">
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {localizePersonalityTags(selectedPin.personality, language)?.map((trait, idx) => (
                    <span key={idx} className="badge-hashtag">{trait}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-box">
            "{selectedPin.greeting || (t.nearby || t.radar)?.greetingEmpty || (language === 'ko' ? '안녕하세요! 함께 신나게 산책해요' : 'Hello! Nice to meet you!')}"
          </div>

          <div className="row gap-12 mt-20 btn-box">
            {myPets.some(mp => mp.id === selectedPin.id || isSameDogName(mp.name, selectedPin.name)) ? (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', padding: '10px 14px', background: '#FFF3E0', borderRadius: '12px', fontSize: '13px', gap: '6px' }}>
                <span>{language === 'ko' ? '현재 나와 함께 산책 중인 반려견입니다' : 'Walking with you right now'}</span>
              </div>
            ) : (
              <button
                className="btn"
                onClick={() => setOwnerNoteTarget(selectedPin)}
              >
                <Send size={20} />
                {(t.nearby || t.radar)?.sendNote || (language === 'ko' ? '산책 쪽지 보내기' : 'Send Note')}
              </button>
            )}
          </div>
        </div>
      ) : (
        /* 주변에 가입된 다른 강아지가 아직 없을 때 표시하는 안내 배너 */
        <div className="card text-center" style={{ padding: '22px 16px', marginTop: '16px', borderRadius: '16px', background: '#FFFFFF', boxShadow: '0 4px 16px rgba(0,0,0,0.04)' }}>
          <div style={{ fontSize: '28px', opacity: '.5' }}>🐾</div>
          <div style={{ fontSize: '16px', fontWeight: 700, margin: '10px 0' }}>
            {language === 'ko' ? `지도에서 반려견 핀을 터치해보세요` : `Tap a dog pin on the map`}
          </div>
          <div style={{ fontSize: '12px', color: '#121212' }}>
            {language === 'ko'
              ? '다른 반려견 보호자가 가입하고 산책을 시작하면 지도에 실시간으로 표시됩니다.'
              : 'When other pet owners join and start walking, they will appear here in real time.'}
          </div>
        </div>
      )}

      {/* Owner Note Modal */}
      <OwnerNoteModal
        isOpen={!!ownerNoteTarget}
        targetDog={ownerNoteTarget}
        onClose={() => setOwnerNoteTarget(null)}
        onStartVirtualChat={(dog) => {
          if (primaryPet) {
            onStartVirtualChat(primaryPet, dog);
          }
        }}
      />

      <style>{`
        @keyframes pulse {
          0% { transform: scale(0.8); opacity: 0.9; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        .radar-dark-map-tiles {
          filter: invert(100%) hue-rotate(180deg) brightness(88%) contrast(92%) saturate(80%);
        }
      `}</style>
    </div>
  );
};

export const RadarView = NearbyView;
export default NearbyView;
