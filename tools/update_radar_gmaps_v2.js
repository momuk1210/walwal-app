const fs = require('fs');
const path = 'e:/workspace/walwal-app/web-app/src/components/RadarView.tsx';

const code = `import React, { useState, useEffect, useRef } from 'react';
import { Compass, Navigation, MessageCircle, Sparkles, X, Key } from 'lucide-react';
import { DogProfile, MOCK_DOGS } from '../data/mockDogs';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useTranslation } from '../i18n/LanguageContext';

interface RadarViewProps {
  onStartVirtualChat: (dog1: DogProfile, dog2: DogProfile) => void;
}

// Google Maps Night Dark Style
const NIGHT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#171c26' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#171c26' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8ec3b9' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#ff7e36' }] },
  { featureType: 'poi', elementType: 'labels.text.fill', stylers: [{ color: '#6d7f9e' }] },
  { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#1a2b27' }] },
  { featureType: 'poi.park', elementType: 'labels.text.fill', stylers: [{ color: '#44a382' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#272f3d' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#1d232e' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#39465c' }] },
  { featureType: 'transit', elementType: 'geometry', stylers: [{ color: '#212a38' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0d131a' }] },
  { featureType: 'water', elementType: 'labels.text.fill', stylers: [{ color: '#3d6175' }] }
];

export const RadarView: React.FC<RadarViewProps> = ({ onStartVirtualChat }) => {
  const { t } = useTranslation();
  const [selectedPin, setSelectedPin] = useState<DogProfile | null>(MOCK_DOGS[0]);
  const [radarZoom, setRadarZoom] = useState<'300m' | '500m' | '1km'>('500m');
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('WALWAL_GMAP_KEY') || '');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>('');

  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstance = useRef<any>(null);
  const circleInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);

  const defaultCenter = { lat: 37.5445, lng: 127.0560 };

  useEffect(() => {
    if (!apiKey) {
      setGoogleMapsLoaded(false);
      return;
    }

    setOptions({
      apiKey: apiKey,
      version: 'weekly'
    });

    importLibrary('maps')
      .then((mapsLib: any) => {
        if (!mapRef.current) return;

        const MapClass = mapsLib.Map;
        const CircleClass = mapsLib.Circle;

        const map = new MapClass(mapRef.current, {
          center: defaultCenter,
          zoom: radarZoom === '300m' ? 17 : radarZoom === '500m' ? 16 : 15,
          styles: NIGHT_MAP_STYLE as any,
          disableDefaultUI: true,
          zoomControl: false
        });
        googleMapInstance.current = map;

        const radiusMeters = radarZoom === '300m' ? 300 : radarZoom === '500m' ? 500 : 1000;
        const circle = new CircleClass({
          strokeColor: '#2EC4B6',
          strokeOpacity: 0.8,
          strokeWeight: 2,
          fillColor: '#2EC4B6',
          fillOpacity: 0.12,
          map: map,
          center: defaultCenter,
          radius: radiusMeters
        });
        circleInstance.current = circle;

        // Import Marker library
        importLibrary('marker').then((markerLib: any) => {
          const MarkerClass = markerLib.Marker;

          // My Location Pin
          new MarkerClass({
            position: defaultCenter,
            map: map,
            title: '�� ��ġ'
          });

          // Dogs markers
          MOCK_DOGS.forEach((dog) => {
            const m = new MarkerClass({
              position: { lat: dog.lat, lng: dog.lng },
              map: map,
              title: dog.name + ' (' + dog.breed + ')'
            });

            m.addListener('click', () => {
              setSelectedPin(dog);
              map.panTo({ lat: dog.lat, lng: dog.lng });
            });

            markersRef.current.push(m);
          });
        });

        setGoogleMapsLoaded(true);
      })
      .catch((err: any) => {
        console.warn('Google Maps Load Error:', err);
        setGoogleMapsLoaded(false);
      });
  }, [apiKey]);

  useEffect(() => {
    if (googleMapInstance.current && circleInstance.current) {
      const radiusMeters = radarZoom === '300m' ? 300 : radarZoom === '500m' ? 500 : 1000;
      circleInstance.current.setRadius(radiusMeters);
      const zoomLevel = radarZoom === '300m' ? 17 : radarZoom === '500m' ? 16 : 15;
      googleMapInstance.current.setZoom(zoomLevel);
    }
  }, [radarZoom]);

  const saveApiKey = () => {
    localStorage.setItem('WALWAL_GMAP_KEY', tempKey.trim());
    setApiKey(tempKey.trim());
    setShowKeyModal(false);
  };

  const getPinStyle = (index: number) => {
    const coords = [
      { top: '35%', left: '60%' },
      { top: '65%', left: '75%' },
      { top: '28%', left: '30%' },
      { top: '72%', left: '25%' }
    ];
    return coords[index % coords.length];
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0D1117' }}>
      {/* Top Header */}
      <div style={{ padding: '16px 16px 10px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={20} color="#FF9E58" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{t.radar.title}</h2>
          </div>
          <p style={{ fontSize: '0.72rem', color: '#c8c8c8', marginTop: '2px' }}>
            {t.radar.dogsNearby} ({radarZoom})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          {/* API Key Config Button */}
          <button
            onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}
            className="glass-pill"
            style={{
              padding: '6px 10px',
              color: apiKey ? '#2EC4B6' : '#FFBF00',
              border: apiKey ? '1px solid #2EC4B6' : '1px solid #FFBF00',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.68rem',
              fontWeight: 700
            }}
          >
            <Key size={12} />
            {apiKey ? 'Google Maps ON' : 'APIŰ ���'}
          </button>

          {/* Range Selector */}
          <div className="glass-panel" style={{ display: 'flex', padding: '3px', gap: '3px', borderRadius: '10px' }}>
            {(['300m', '500m', '1km'] as const).map(range => (
              <button
                key={range}
                onClick={() => setRadarZoom(range)}
                style={{
                  background: radarZoom === range ? '#FF9E58' : 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '4px 7px',
                  borderRadius: '6px',
                  cursor: 'pointer'
                }}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Map Viewport */}
      <div style={{ position: 'relative', flex: 1, margin: '0 14px 14px 14px', borderRadius: '26px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', background: '#171E2B' }}>
        {/* Real Google Maps Container */}
        <div
          ref={mapRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: googleMapsLoaded ? 'block' : 'none'
          }}
        />

        {/* Fallback Simulation Map */}
        {!googleMapsLoaded && (
          <div style={{ position: 'relative', width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, #171E2B 0%, #0A0D13 100%)' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
              <div style={{ width: '85%', height: '85%', border: '1px solid rgba(46, 196, 182, 0.15)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', width: '60%', height: '60%', border: '1px solid rgba(46, 196, 182, 0.25)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', width: '35%', height: '35%', border: '1px solid rgba(46, 196, 182, 0.35)', borderRadius: '50%' }} />
              <div style={{ position: 'absolute', width: '100%', height: '1px', background: 'rgba(255,255,255,0.06)' }} />
              <div style={{ position: 'absolute', height: '100%', width: '1px', background: 'rgba(255,255,255,0.06)' }} />
            </div>

            {/* Sweep Animation */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '45%',
              height: '45%',
              transformOrigin: 'top left',
              background: 'conic-gradient(from 0deg, rgba(46, 196, 182, 0.3) 0deg, transparent 60deg)',
              animation: 'radarSweep 4s linear infinite',
              pointerEvents: 'none'
            }} />

            {/* Center My Location */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: '#FF9E58',
                border: '3px solid #fff',
                boxShadow: '0 0 15px #FF9E58',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
                <Navigation size={12} color="#fff" style={{ transform: 'rotate(45deg)' }} />
              </div>
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#FF9E58', background: 'rgba(0,0,0,0.7)', padding: '1px 6px', borderRadius: '6px', marginTop: '2px' }}>
                �� ��ġ (������)
              </span>
            </div>

            {/* Simulated Pins */}
            {MOCK_DOGS.map((dog, idx) => {
              const pos = getPinStyle(idx);
              const isSelected = selectedPin?.id === dog.id;
              return (
                <div
                  key={dog.id}
                  onClick={() => setSelectedPin(dog)}
                  style={{
                    position: 'absolute',
                    top: pos.top,
                    left: pos.left,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSelected ? 20 : 12,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                >
                  <div style={{
                    width: isSelected ? '52px' : '42px',
                    height: isSelected ? '52px' : '42px',
                    borderRadius: '50%',
                    border: isSelected ? '3px solid #FF9E58' : '2px solid rgba(255,255,255,0.7)',
                    overflow: 'hidden',
                    boxShadow: isSelected ? '0 0 20px #FF9E58' : '0 4px 10px rgba(0,0,0,0.5)',
                    transition: 'all 0.2s ease'
                  }}>
                    <img src={dog.avatar} alt={dog.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{
                    marginTop: '3px',
                    background: isSelected ? '#FF9E58' : 'rgba(26, 31, 41, 0.85)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    padding: '1px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px'
                  }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#fff' }}>{dog.name}</span>
                    <span style={{ fontSize: '0.58rem', color: isSelected ? '#FFF0E6' : '#2EC4B6', fontWeight: 600 }}>{dog.distance}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Dog Bottom Sheet */}
      {selectedPin && (
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          background: 'linear-gradient(180deg, rgba(26, 31, 41, 0.96) 0%, rgba(15, 18, 22, 0.98) 100%)',
          backdropFilter: 'blur(20px)',
          borderTop: '2px solid rgba(255, 126, 54, 0.5)',
          borderRadius: '26px 26px 0 0',
          padding: '18px 18px 24px 18px',
          zIndex: 35,
          boxShadow: '0 -10px 40px rgba(0, 0, 0, 0.8)'
        }}>
          <button
            onClick={() => setSelectedPin(null)}
            style={{ position: 'absolute', top: '14px', right: '14px', background: 'none', border: 'none', color: '#c8c8c8', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>

          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <img
              src={selectedPin.avatar}
              alt={selectedPin.name}
              style={{ width: '58px', height: '58px', borderRadius: '18px', objectFit: 'cover', border: '2px solid #FF9E58' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff' }}>{selectedPin.name}</h3>
                <span style={{ fontSize: '0.68rem', color: '#FF9E58', background: 'rgba(255,126,54,0.15)', padding: '2px 8px', borderRadius: '8px', fontWeight: 700 }}>
                  {selectedPin.distance} �α�
                </span>
              </div>
              <p style={{ fontSize: '0.72rem', color: '#c8c8c8', marginTop: '2px' }}>
                {selectedPin.breed} �� {selectedPin.age} �� ����: {selectedPin.ownerName}
              </p>
            </div>
          </div>

          <div style={{
            marginTop: '12px',
            background: 'rgba(0,0,0,0.3)',
            borderRadius: '14px',
            padding: '10px 12px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ fontSize: '0.68rem', color: '#2EC4B6', fontWeight: 700, marginBottom: '3px' }}>
              ?? Google Maps GPS ���� �Ӹ���
            </div>
            <div style={{ fontSize: '0.85rem', color: '#F1F5F9', fontWeight: 500, lineHeight: 1.4 }}>
              "{selectedPin.recentThought}"
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button
              onClick={() => onStartVirtualChat(MOCK_DOGS[0], selectedPin)}
              className="glow-btn"
              style={{
                flex: 1,
                background: 'linear-gradient(135deg, #FF9E58, #FFBF00)',
                border: 'none',
                borderRadius: '14px',
                padding: '12px',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 800,
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Sparkles size={15} />
              {t.radar.startVirtualChat}
            </button>

            <button
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: '14px',
                padding: '12px 14px',
                color: '#fff',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <MessageCircle size={15} />
              {t.radar.sendNote}
            </button>
          </div>
        </div>
      )}

      {/* Google Maps API Key Modal */}
      {showKeyModal && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(16px)',
          zIndex: 60,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: '20px'
        }}>
          <div style={{
            background: '#1A1F29',
            border: '2px solid #2EC4B6',
            borderRadius: '24px',
            padding: '24px',
            width: '100%',
            maxWidth: '380px'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', marginBottom: '8px' }}>
              ?? Google Maps JavaScript API Ű ����
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#c8c8c8', marginBottom: '14px', lineHeight: 1.4 }}>
              Google Cloud Console���� �߱޹��� ���� API Ű�� �Է��Ͻø� ���� ���ػ� ����/�ε�� Ÿ���� ��� Ȱ��ȭ�˴ϴ�.
            </p>

            <input
              type="text"
              value={tempKey}
              onChange={(e) => setTempKey(e.target.value)}
              placeholder="AIzaSy..."
              style={{
                width: '100%',
                background: 'rgba(0,0,0,0.5)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '12px',
                padding: '12px',
                color: '#fff',
                fontSize: '0.85rem',
                marginBottom: '16px'
              }}
            />

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setShowKeyModal(false)}
                style={{ flex: 1, padding: '10px', background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '12px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ���
              </button>
              <button
                onClick={saveApiKey}
                style={{ flex: 1, padding: '10px', background: '#2EC4B6', border: 'none', borderRadius: '12px', color: '#fff', fontWeight: 800, cursor: 'pointer', fontSize: '0.8rem' }}
              >
                ���� �� ���� �ε�
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{\`
        @keyframes radarSweep {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      \`}</style>
    </div>
  );
};
`;

fs.writeFileSync(path, code, 'utf8');
console.log('RADAR_VIEW_FUNCTIONAL_GMAPS_SUCCESS');
