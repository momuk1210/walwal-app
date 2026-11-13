import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, LocateFixed, MapPin, Send, Heart, Sparkles } from 'lucide-react';
import { DogProfile, getMockDogs, isSameDogName, getDefaultDogAvatar, normalizeDogProfile, sanitizePetList, localizeBreed, localizePersonalityTags } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { OwnerNoteModal } from './OwnerNoteModal';
import { DogProfileModal } from './DogProfileModal';
import { db, COLLECTIONS } from '../firebase';
import { collection, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import '../styles/NearbyView.css';

const readStoredMyPets = (): DogProfile[] => {
  try {
    const saved = localStorage.getItem('WALWAL_PETS');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) { }
  return [];
};

const computeNearbyOffset = (baseLat: number, baseLng: number, meterDist: number, angleDeg: number) => {
  const latOffset = (meterDist * Math.cos((angleDeg * Math.PI) / 180)) / 111000;
  const lngOffset = (meterDist * Math.sin((angleDeg * Math.PI) / 180)) / (111000 * Math.cos((baseLat * Math.PI) / 180));
  return { lat: baseLat + latOffset, lng: baseLng + lngOffset };
};

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
  const [rawMyPets, setRawMyPets] = useState<DogProfile[]>(() => readStoredMyPets());

  // Firestore에서 실시간으로 불러온 실제 가입 반려견 목록
  const [firestoreDogs, setFirestoreDogs] = useState<DogProfile[]>([]);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const dogMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);

  // 1. 내 반려견 프로필 조회 (로컬 스토리지에 등록된 내 반려견들 - 등록된 반려견이 없으면 빈 배열)
  const myPets = useMemo<DogProfile[]>(() => {
    if (rawMyPets.length === 0) return [];
    return sanitizePetList(rawMyPets, language);
  }, [rawMyPets, language]);

  const primaryPet = myPets[0] || null;

  // 선택된 핀 (기본값: null - 지도에서 강아지 사진/핀 클릭 시에만 모달 표시)
  const [selectedPin, setSelectedPin] = useState<DogProfile | null>(null);
  const activeSelectedPin = (myPets.length === 0 && (selectedPin as any)?.isMyPet) ? null : selectedPin;

  // 2. Firestore dogs 컬렉션에서 실제 가입된 모든 강아지 실시간 동기화 (가짜 데이터 없음)
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, COLLECTIONS.DOGS), (snapshot) => {
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
        try {
          if (dogsList.length > 0) {
            localStorage.setItem('WALWAL_ALL_DOGS', JSON.stringify(dogsList));
          }
        } catch (e) { }
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
        const petPos = idx === 0 ? userCoords : computeNearbyOffset(userCoords.lat, userCoords.lng, 18 * idx, 60 * idx);
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
  }, [myPets, userCoords]);

  // 4. 지도에 표시할 반려견 목록: 내 반려견들 + 실제 가입된 다른 사용자 반려견들
  const displayDogs = useMemo<Array<DogProfile & { isMyPet: boolean; distanceMeters: number }>>(() => {
    const list: Array<DogProfile & { isMyPet: boolean; distanceMeters: number }> = [];
    const maxRadius = nearbyZoom === '300m' ? 300 : nearbyZoom === '500m' ? 500 : 1000;

    // A. 내 반려견들 등록 (내 현재 위치 및 함께 산책하는 위치 - 중복 제거)
    const cleanMyPets = sanitizePetList(myPets, language);
    cleanMyPets.forEach((pet, idx) => {
      const pos = idx === 0 ? userCoords : computeNearbyOffset(userCoords.lat, userCoords.lng, 18 * idx, 60 * idx);
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
        const adjustedPos = computeNearbyOffset(userCoords.lat, userCoords.lng, 120, angleDeg);
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

  const detectLocationRef = useRef(detectUserRealLocation);
  useEffect(() => {
    detectLocationRef.current = detectUserRealLocation;
  });
  const initialMapConfigRef = useRef({
    zoom: nearbyZoom,
    lat: userCoords.lat,
    lng: userCoords.lng,
    theme: mapTheme
  });

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

    const { zoom, lat, lng, theme } = initialMapConfigRef.current;
    const zoomLevel = zoom === '300m' ? 17 : zoom === '500m' ? 16 : 15;
    const map = L.map(mapContainerRef.current, {
      center: [lat, lng],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false
    });

    // Clean OpenStreetMap Tile
    const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: theme === 'dark' ? 'radar-dark-map-tiles' : ''
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
    detectLocationRef.current(false);

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Sync pets update events from local storage
  useEffect(() => {
    const handlePetsUpdated = () => {
      setRawMyPets(readStoredMyPets());
    };
    window.addEventListener('walwal_pets_updated', handlePetsUpdated);
    window.addEventListener('storage', handlePetsUpdated);

    // 설정(SettingsView)에서 위치 권한 토글 시 실시간 연동
    const handlePermUpdate = (e: any) => {
      if (e?.detail?.type === 'location' || !e?.detail) {
        const isAllowed = localStorage.getItem('WALWAL_PERM_LOCATION') !== 'false';
        if (isAllowed) {
          detectLocationRef.current(false);
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
            <div class="my-loc-marker-wrap">
              <div class="my-loc-marker-dot">
                <div class="my-loc-marker-pulse"></div>
              </div>
              <div class="my-loc-marker-badge">
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

        const isSelected = activeSelectedPin ? (activeSelectedPin.id === dog.id || isSameDogName(activeSelectedPin.name, dog.name)) : false;
        const isMyPet = dog.isMyPet;

        const markerClasses = ['dog-marker-icon'];
        if (isSelected) markerClasses.push('is-selected');
        if (isMyPet) markerClasses.push('is-my-pet');

        const avatarClasses = ['dog-marker-avatar'];
        if (isMyPet) avatarClasses.push('is-my-pet');
        if (isSelected) avatarClasses.push('is-selected');

        const badgeClasses = ['dog-marker-badge'];
        if (isMyPet) badgeClasses.push('is-my-pet');
        if (isSelected) badgeClasses.push('is-selected');

        const dogIcon = L.divIcon({
          className: markerClasses.join(' '),
          html: `
            <div class="dog-marker-wrap">
              <div class="${avatarClasses.join(' ')}">
                ${isMyPet ? '<div class="dog-marker-pulse"></div>' : ''}
                <img src="${dog.avatar}" class="dog-marker-img" alt="${dog.name}" />
              </div>
              <div class="${badgeClasses.join(' ')}">
                <span class="dog-marker-name">${dog.name}</span>
                ${isMyPet ? `<span class="dog-marker-tag-me">${language === 'ko' ? '나' : language === 'zh' ? '我' : language === 'ja' ? '私' : language === 'fr' ? 'Moi' : language === 'es' ? 'Yo' : 'Me'}</span>` : `<span class="dog-marker-tag-dist">${dog.distance}</span>`}
              </div>
            </div>
          `,
          iconSize: [60, 60],
          iconAnchor: [30, 30]
        });

        // 선택된 강아지는 무조건 최상위(3000 이상)로 배치하여 다른 마커나 내 반려견에 가려지지 않음
        const zIndex = isSelected ? 3000 : (isMyPet ? 1000 : 100);

        const marker = L.marker([dog.lat, dog.lng], {
          icon: dogIcon,
          zIndexOffset: zIndex
        });

        marker.on('click', () => {
          marker.setZIndexOffset(3500);
          setSelectedPin(dog);
        });

        marker.addTo(dogMarkersGroupRef.current!);
      });
    }
  }, [userCoords, nearbyZoom, activeSelectedPin, displayDogs, mapTheme, language, myPets.length]);

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

      {/* Selected Dog Profile Modal */}
      <DogProfileModal
        dog={activeSelectedPin}
        onClose={() => setSelectedPin(null)}
        onSendNote={(dog) => setOwnerNoteTarget(dog)}
      />

      {/* 안내 배너 */}
      <div className="card text-center nearby-guide-banner">
        <div className="nearby-guide-icon">🐾</div>
        <div className="nearby-guide-title">
          {language === 'ko' ? `지도에서 반려견 핀을 터치해보세요` : `Tap a dog pin on the map`}
        </div>
        <div className="nearby-guide-desc">
          {language === 'ko'
            ? '다른 반려견 보호자가 가입하고 산책을 시작하면 지도에 실시간으로 표시됩니다.'
            : 'When other pet owners join and start walking, they will appear here in real time.'}
        </div>
      </div>

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
