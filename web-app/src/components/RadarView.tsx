import React, { useState, useEffect, useRef } from 'react';
import { Navigation, Sparkles, X, LocateFixed, MapPin, Send, ScanFace } from 'lucide-react';
import { DogProfile, MOCK_DOGS, getMockDogs, isSameDogName, getDefaultDogAvatar } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import { OwnerNoteModal } from './OwnerNoteModal';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface RadarViewProps {
  onStartVirtualChat: (dog1: DogProfile, dog2: DogProfile) => void;
  targetLocation?: { lat: number; lng: number; name: string } | null;
}

export const RadarView: React.FC<RadarViewProps> = ({ onStartVirtualChat, targetLocation }) => {
  const { t, language } = useTranslation();
  const [selectedPin, setSelectedPin] = useState<DogProfile | null>(() => {
    // WALWAL_PETS에서 첫 번째 강아지 로드 (사용자가 저장한 아바타 포함)
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const pets = JSON.parse(saved);
        if (Array.isArray(pets) && pets.length > 0) {
          const p = pets[0];
          const mockList = getMockDogs('ko');
          const mock = mockList.find(m => m.id === p.id || isSameDogName(m.name, p.name));
          return {
            ...(mock || mockList[0]),
            ...p,
            avatar: p.avatar || mock?.avatar || getDefaultDogAvatar(p.name || p.breed),
            age: p.age ? String(p.age).replace(/[^0-9]/g, '') : (mock?.age || '2'),
            gender: p.gender || mock?.gender || 'male',
          } as DogProfile;
        }
      }
    } catch (e) { }
    return getMockDogs('ko')[0];
  });
  const [radarZoom, setRadarZoom] = useState<'300m' | '500m' | '1km'>('500m');
  const [ownerNoteTarget, setOwnerNoteTarget] = useState<DogProfile | null>(null);
  const [mapTheme, setMapTheme] = useState<'dark' | 'light'>(() => {
    const hour = new Date().getHours();
    const minute = new Date().getMinutes();
    const isNight = (hour === 18 && minute >= 30) || hour > 18 || hour < 6;
    return isNight ? 'dark' : 'light';
  });

  // Dynamic User Real Location State (Detected in Seongnam-si / real user location)
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number }>({ lat: 37.4200, lng: 127.1267 });
  const [locationLabel, setLocationLabel] = useState<string>('내 현재 위치 탐색 중...');
  const [isLocating, setIsLocating] = useState<boolean>(false);

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const leafletMapRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const dogMarkersGroupRef = useRef<L.LayerGroup | null>(null);
  const radarCircleRef = useRef<L.Circle | null>(null);

  // Calculate meter distance to lat/lng offsets around actual user coordinates
  const getNearbyOffset = (meterDist: number, angleDeg: number) => {
    const latOffset = (meterDist * Math.cos((angleDeg * Math.PI) / 180)) / 111000;
    const lngOffset = (meterDist * Math.sin((angleDeg * Math.PI) / 180)) / (111000 * Math.cos((userCoords.lat * Math.PI) / 180));
    return { lat: userCoords.lat + latOffset, lng: userCoords.lng + lngOffset };
  };

  // Real-time Dual Geolocation (GPS + IP Fallback) with Korean District Name
  const detectUserRealLocation = () => {
    setIsLocating(true);
    setLocationLabel(t.common?.gpsReceiving || '🛰️ Receiving GPS signal...');

    const applyCoords = async (latitude: number, longitude: number) => {
      setUserCoords({ lat: latitude, lng: longitude });
      setIsLocating(false);

      if (leafletMapRef.current) {
        leafletMapRef.current.setView([latitude, longitude], radarZoom === '300m' ? 17 : radarZoom === '500m' ? 16 : 15);
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

    // 1. Try Browser GPS
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          applyCoords(pos.coords.latitude, pos.coords.longitude);
        },
        async (err) => {
          console.warn('GPS prompt waiting, checking fast IP geolocation...', err);
          // 2. Fast IP Geolocation fallback
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
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    }
  };

  // Initialize Real Leaflet Interactive Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (leafletMapRef.current) return;

    const zoomLevel = radarZoom === '300m' ? 17 : radarZoom === '500m' ? 16 : 15;
    const map = L.map(mapContainerRef.current, {
      center: [userCoords.lat, userCoords.lng],
      zoom: zoomLevel,
      zoomControl: false,
      attributionControl: false
    });

    // Clean OpenStreetMap Tile without watermarks
    const tile = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      className: mapTheme === 'dark' ? 'radar-dark-map-tiles' : ''
    }).addTo(map);
    tileLayerRef.current = tile;

    const dogGroup = L.layerGroup().addTo(map);
    dogMarkersGroupRef.current = dogGroup;
    leafletMapRef.current = map;

    if (targetLocation) {
      setUserCoords({ lat: targetLocation.lat, lng: targetLocation.lng });
      setLocationLabel(`모임 장소 (${targetLocation.name})`);
      map.setView([targetLocation.lat, targetLocation.lng], 16);
    } else {
      detectUserRealLocation();
    }

    return () => {
      map.remove();
      leafletMapRef.current = null;
    };
  }, []);

  // Update theme class
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const container = tileLayerRef.current.getContainer();
    if (container) {
      if (mapTheme === 'dark') {
        container.classList.add('radar-dark-map-tiles');
      } else {
        container.classList.remove('radar-dark-map-tiles');
      }
    }
  }, [mapTheme]);

  // Update map center & layers when userCoords or zoom changes
  useEffect(() => {
    if (targetLocation && leafletMapRef.current) {
      setUserCoords({ lat: targetLocation.lat, lng: targetLocation.lng });
      setLocationLabel(`${t.radar.meetupLocation} (${targetLocation.name})`);
      leafletMapRef.current.setView([targetLocation.lat, targetLocation.lng], 16, { animate: true });
    }
  }, [targetLocation, t.radar.meetupLocation]);

  const [petsUpdateKey, setPetsUpdateKey] = useState<number>(0);

  // Sync when pets are saved/updated
  useEffect(() => {
    const handlePetsUpdated = () => {
      setPetsUpdateKey(prev => prev + 1);
    };
    window.addEventListener('walwal_pets_updated', handlePetsUpdated);
    window.addEventListener('storage', handlePetsUpdated);
    return () => {
      window.removeEventListener('walwal_pets_updated', handlePetsUpdated);
      window.removeEventListener('storage', handlePetsUpdated);
    };
  }, []);

  // Center User Marker and Range Circle, then Place Dog Pins around user
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    const zoomLevel = radarZoom === '300m' ? 17 : radarZoom === '500m' ? 16 : 15;
    const radiusMeters = radarZoom === '300m' ? 300 : radarZoom === '500m' ? 500 : 1000;

    map.setView([userCoords.lat, userCoords.lng], zoomLevel, { animate: true });

    // Center User Marker
    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userCoords.lat, userCoords.lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-pin-icon',
        html: `
          <div style="position:relative;display:flex;justify-content:center;align-items:center;width:44px;height:44px;">
            <div style="position:absolute;inset:0;background:rgba(255,126,54,0.4);border-radius:50%;animation:pulse 2s infinite;"></div>
            <div style="width:26px;height:26px;background:#FF7E36;border:3px solid #fff;border-radius:50%;box-shadow:0 0 16px #FF7E36;display:flex;justify-content:center;align-items:center;">
              <div style="width:8px;height:8px;background:#fff;border-radius:50%;"></div>
            </div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 22]
      });
      userMarkerRef.current = L.marker([userCoords.lat, userCoords.lng], { icon: userIcon, zIndexOffset: 1000 }).addTo(map);
    }

    // Range Radar Circle
    if (radarCircleRef.current) {
      radarCircleRef.current.setLatLng([userCoords.lat, userCoords.lng]);
      radarCircleRef.current.setRadius(radiusMeters);
    } else {
      radarCircleRef.current = L.circle([userCoords.lat, userCoords.lng], {
        radius: radiusMeters,
        color: '#2EC4B6',
        weight: 1.5,
        dashArray: '5, 8',
        fillColor: '#2EC4B6',
        fillOpacity: 0.08
      }).addTo(map);
    }

    // Place Dog Pins: DB 내 반려견(WALWAL_PETS) + 주변 이웃 친구들 동적 매칭
    if (dogMarkersGroupRef.current) {
      dogMarkersGroupRef.current.clearLayers();

      const angles = [40, 130, 220, 310];
      const distances = [85, 140, 210, 320];

      // 1. 내 반려견 목록 (localStorage 'WALWAL_PETS')
      let myPets: any[] = [];
      try {
        const saved = localStorage.getItem('WALWAL_PETS');
        if (saved) myPets = JSON.parse(saved);
      } catch (e) { }

      const mockList = getMockDogs(language);
      const pinDogs: DogProfile[] = [];

      // 내 반려견들 먼저 등록 (보리, 딸기 등 DB 저장 아바타 및 견종 정보 최우선 매칭)
      if (Array.isArray(myPets) && myPets.length > 0) {
        myPets.forEach((p, idx) => {
          const mock = mockList.find(m => isSameDogName(m.name, p.name));
          const avatar = p.avatar || mock?.avatar || getDefaultDogAvatar(p.name || p.breed);
          pinDogs.push({
            id: p.id || `my-pet-${idx}`,
            name: p.name,
            breed: p.breed,
            age: p.age ? String(p.age).replace(/[^0-9]/g, '') : (mock?.age || '2'),
            gender: p.gender || mock?.gender || 'male',
            ownerName: p.ownerName || (language === 'ko' ? `${p.name} 맘` : `${p.name} Mom`),
            avatar,
            personality: p.personality || p.tags || mock?.personality || ['#댕댕이'],
            distance: `${distances[idx % distances.length]}m`,
            lat: userCoords.lat,
            lng: userCoords.lng,
            recentThought: p.recentThought || mock?.recentThought || (language === 'ko' ? '오늘 산책 너무 신나!' : 'Walking is so fun!'),
            detectedEmotion: p.detectedEmotion || mock?.detectedEmotion || 'happy',
            soundPattern: p.soundPattern || mock?.soundPattern || '멍멍!',
            posePattern: p.posePattern || mock?.posePattern || '꼬리 살랑',
            conversationLog: p.conversationLog || mock?.conversationLog || []
          });
        });
      }

      // 주변 이웃 강아지 추가 (내 반려견과 중복 제외, 정확한 실제 견종 아바타 보장)
      mockList.forEach(m => {
        if (!pinDogs.some(pd => isSameDogName(pd.name, m.name))) {
          pinDogs.push({
            ...m,
            avatar: m.avatar || getDefaultDogAvatar(m.name || m.breed),
            distance: `${distances[pinDogs.length % distances.length]}m`
          });
        }
      });

      pinDogs.forEach((dog, idx) => {
        const targetDist = distances[idx % distances.length];
        const targetAngle = angles[idx % angles.length];
        const dogPos = getNearbyOffset(targetDist, targetAngle);

        const isSelected = selectedPin ? isSameDogName(selectedPin.name, dog.name) : idx === 0;
        const dogIcon = L.divIcon({
          className: 'dog-marker-icon',
          html: `
            <div style="cursor:pointer;display:flex;flex-direction:column;align-items:center;transform:translate(-50%, -50%);">
              <div style="width:${isSelected ? 50 : 42}px;height:${isSelected ? 50 : 42}px;border-radius:50%;border:${isSelected ? '3px solid #FFB320' : '2px solid #fff'};box-shadow:${isSelected ? '0 0 20px rgba(255, 179, 32, 0.4)' : '0 4px 12px rgba(0,0,0,0.1)'};overflow:hidden;background:#FFFFFF;transition:all 0.2s;">
                <img src="${dog.avatar}" style="width:100%;height:100%;object-fit:cover;" />
              </div>
              <div style="background:${isSelected ? '#FFB320' : '#FFFFFF'};border:1px solid rgba(0,0,0,0.05);padding:2px 7px;border-radius:7px;font-size:11px;font-weight:800;color:${isSelected ? '#fff' : '#2D3748'};margin-top:3px;white-space:nowrap;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
                ${dog.name} <span style="color:${isSelected ? '#fff' : '#FFB320'};font-size:10px;">${dog.distance}</span>
              </div>
            </div>
          `,
          iconSize: [60, 60],
          iconAnchor: [30, 30]
        });

        const marker = L.marker([dogPos.lat, dogPos.lng], { icon: dogIcon });
        marker.on('click', () => setSelectedPin(dog));
        marker.addTo(dogMarkersGroupRef.current!);
      });
    }
  }, [userCoords, radarZoom, selectedPin, mapTheme, language, petsUpdateKey]);


  useEffect(() => {
    if (!selectedPin) return;
    // WALWAL_PETS에서 현재 selectedPin에 해당하는 최신 데이터로 갱신
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const pets = JSON.parse(saved);
        const found = pets.find((p: any) => p.id === selectedPin.id || isSameDogName(p.name, selectedPin.name));
        if (found) {
          const mockList = getMockDogs(language);
          const mock = mockList.find(m => m.id === found.id || isSameDogName(m.name, found.name));
          setSelectedPin(prev => prev ? {
            ...(mock || prev),
            ...found,
            avatar: found.avatar || mock?.avatar || getDefaultDogAvatar(found.name || found.breed),
            age: found.age ? String(found.age).replace(/[^0-9]/g, '') : (mock?.age || prev.age),
            gender: found.gender || mock?.gender || prev.gender || 'male',
          } : null);
          return;
        }
      }
    } catch (e) { }
    // WALWAL_PETS에 없으면 mock에서
    const updated = getMockDogs(language).find(d => d.id === selectedPin.id);
    if (updated) setSelectedPin(updated);
  }, [language, petsUpdateKey]);

  const nearbySuffix = t.radar.nearby;

  const ownerLabel = t.community.hostMom;

  return (
    <div className="page-root">
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '0px' }}>
        <div>
          <div className="row gap-6">
            {/* <Compass size={22} color="#FFB320" /> */}
            <h2 className="title-lg">{t.radar.title}</h2>
          </div>
          <p className="text-sub">
            {t.radar.dogsNearby} ({radarZoom})
          </p>
        </div>

        <div className="row gap-6">
          {/* Range Selector */}
          <div className="radarZoom-wrap">
            {(['300m', '500m', '1km'] as const).map(range => (
              <button className='radarZoom-btn'
                key={range}
                onClick={() => setRadarZoom(range)}
                style={{
                  background: radarZoom === range ? '#FFB320' : 'transparent',
                  color: radarZoom === range ? '#fff' : '#000',
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
          <MapPin size={15} color="#FF7E36" />
          <span>
            {locationLabel}
          </span>
        </div>

        {/* Quick GPS Recenter Button */}
        <div className="quick-recenter-wrap">
          <button className="quick-recenter-btn"
            onClick={detectUserRealLocation}
            style={{
              color: isLocating ? '#2EC4B6' : '#FF7E36',
            }}
            title={language === 'ko' ? '현재 내 위치로 이동' : 'Go to Current Location'}
          >
            <LocateFixed size={18} className={isLocating ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Selected Dog Bottom Sheet */}
      {selectedPin && (
        <div className="selected-dog-modal">
          <button
            onClick={() => setSelectedPin(null)}
            className="btn-ghost"
            style={{ position: 'absolute', top: '16px', right: '16px', color: '#3b4a5d' }}
          >
            <X size={20} strokeWidth={3} />
          </button>

          <div className="row gap-14">
            <img className="avatar"
              src={selectedPin.avatar}
              alt={selectedPin.name}
            />
            <div style={{ flex: 1 }}>
              <div className="row gap-8 flex align-items-center" >
                <h3 className="title-lg" style={{ fontSize: '1.2rem' }}>{selectedPin.name}</h3>
                <span className="badge" style={{ padding: '4px 10px', fontSize: '.6rem', marginTop: '2px' }}>
                  {selectedPin.distance} {nearbySuffix}
                </span>
              </div>
              <div className="text-sub mt-4" style={{ fontSize: '0.8rem' }}>
                {selectedPin.breed} &middot; {selectedPin.age} {t.profile.dogAgeSuffix || t.profile.dogAgeSuffix} &middot;
                {selectedPin.gender === 'female' ? t.common?.genderShortFemale : selectedPin.gender === 'male' ? t.common?.genderShortMale : ''}
                <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '6px' }}>
                  {selectedPin.personality?.map((trait, idx) => (
                    <span key={idx} className="badge-hashtag">{trait}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="text-box">
            "{selectedPin.greeting || t.radar?.greetingEmpty || '안녕하세요! 반가워요 😊'}"
          </div>

          <div className="row gap-12 mt-20 btn-box">

            <button className="btn"
              onClick={() => setOwnerNoteTarget(selectedPin)}
            >
              <Send size={20} />
              {t.radar.sendNote}
            </button>
          </div>
        </div>
      )}

      <OwnerNoteModal
        isOpen={!!ownerNoteTarget}
        targetDog={ownerNoteTarget}
        onClose={() => setOwnerNoteTarget(null)}
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
