const fs = require('fs');
const path = 'e:/workspace/walwal-app/web-app/src/components/RadarView.tsx';

const code = `import React, { useState, useEffect, useRef } from 'react';
import { Compass, Navigation, MessageCircle, Sparkles, X, Key, MapPin, Layers, ZoomIn, ZoomOut, Plus, Minus } from 'lucide-react';
import { DogProfile, MOCK_DOGS } from '../data/mockDogs';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { useTranslation } from '../i18n/LanguageContext';

interface RadarViewProps {
  onStartVirtualChat: (dog1: DogProfile, dog2: DogProfile) => void;
}

export const RadarView: React.FC<RadarViewProps> = ({ onStartVirtualChat }) => {
  const { t } = useTranslation();
  const [selectedPin, setSelectedPin] = useState<DogProfile | null>(MOCK_DOGS[0]);
  const [radarZoom, setRadarZoom] = useState<'300m' | '500m' | '1km'>('500m');
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState<boolean>(false);
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('WALWAL_GMAP_KEY') || '');
  const [showKeyModal, setShowKeyModal] = useState<boolean>(false);
  const [tempKey, setTempKey] = useState<string>('');
  const [mapType, setMapType] = useState<'dark' | 'satellite'>('dark');

  // Interactive Map State (Pan & Zoom)
  const [mapOffset, setMapOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const mapRef = useRef<HTMLDivElement | null>(null);
  const googleMapInstance = useRef<any>(null);

  const defaultCenter = { lat: 37.5445, lng: 127.0560 };

  // Google Maps SDK Loader
  useEffect(() => {
    if (!apiKey) {
      setGoogleMapsLoaded(false);
      return;
    }

    setOptions({ key: apiKey } as any);
    importLibrary('maps')
      .then((mapsLib: any) => {
        if (!mapRef.current) return;
        const MapClass = mapsLib.Map;
        const map = new MapClass(mapRef.current, {
          center: defaultCenter,
          zoom: radarZoom === '300m' ? 17 : radarZoom === '500m' ? 16 : 15,
          mapTypeId: mapType === 'satellite' ? 'hybrid' : 'roadmap',
          disableDefaultUI: true,
          zoomControl: false
        });
        googleMapInstance.current = map;
        setGoogleMapsLoaded(true);
      })
      .catch(() => setGoogleMapsLoaded(false));
  }, [apiKey, mapType]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - mapOffset.x, y: e.clientY - mapOffset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setMapOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };
  const handleMouseUp = () => setIsDragging(false);

  const saveApiKey = () => {
    localStorage.setItem('WALWAL_GMAP_KEY', tempKey.trim());
    setApiKey(tempKey.trim());
    setShowKeyModal(false);
  };

  const getZoomScale = () => {
    if (radarZoom === '300m') return 1.35;
    if (radarZoom === '1km') return 0.75;
    return 1.0;
  };

  const scale = getZoomScale();

  // Pin offsets relative to Seoul Forest center
  const dogPins = [
    { dog: MOCK_DOGS[0], dx: 60, dy: -70 },   // Bori (85m)
    { dog: MOCK_DOGS[1], dx: 110, dy: 85 },  // Ttang-kong (140m)
    { dog: MOCK_DOGS[2], dx: -100, dy: -120 },// Gureum (210m)
    { dog: MOCK_DOGS[3], dx: -120, dy: 130 }  // Mocchi (320m)
  ];

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0D1117' }}>
      {/* Top Header */}
      <div style={{ padding: '14px 16px 8px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Compass size={20} color="#FF9E58" />
            <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff' }}>{t.radar.title}</h2>
          </div>
          <p style={{ fontSize: '0.7rem', color: '#c8c8c8', marginTop: '2px' }}>
            {t.radar.dogsNearby} ({radarZoom})
          </p>
        </div>

        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <button
            onClick={() => setMapType(mapType === 'dark' ? 'satellite' : 'dark')}
            className="glass-pill"
            style={{ padding: '5px 8px', color: '#CBD5E1', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.65rem', fontWeight: 700 }}
          >
            <Layers size={11} /> {mapType === 'dark' ? '��������' : '�ε��'}
          </button>

          <button
            onClick={() => { setTempKey(apiKey); setShowKeyModal(true); }}
            className="glass-pill"
            style={{
              padding: '5px 9px',
              color: apiKey ? '#2EC4B6' : '#FFBF00',
              border: apiKey ? '1px solid #2EC4B6' : '1px solid #FFBF00',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              fontSize: '0.65rem',
              fontWeight: 700
            }}
          >
            <Key size={11} />
            {apiKey ? 'Google Maps ON' : 'APIŰ ���'}
          </button>

          <div className="glass-panel" style={{ display: 'flex', padding: '2px', gap: '2px', borderRadius: '8px' }}>
            {(['300m', '500m', '1km'] as const).map(range => (
              <button
                key={range}
                onClick={() => setRadarZoom(range)}
                style={{
                  background: radarZoom === range ? '#FF9E58' : 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                  padding: '4px 6px',
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

      {/* Main Map Canvas Viewport */}
      <div
        style={{
          position: 'relative',
          flex: 1,
          margin: '0 14px 14px 14px',
          borderRadius: '24px',
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
          background: '#131823',
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Google Maps Container (When API key active) */}
        <div ref={mapRef} style={{ position: 'absolute', inset: 0, display: googleMapsLoaded ? 'block' : 'none' }} />

        {/* REALISTIC HIGH-RES VECTOR MAP TILES LAYER (Seoul Forest Area) */}
        {!googleMapsLoaded && (
          <div style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}>
            {/* SVG Real Map Geometry (Roads, Forest, River) */}
            <svg
              style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                transform: \`translate(\${mapOffset.x}px, \${mapOffset.y}px) scale(\${scale})\`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.3s ease'
              }}
              viewBox="0 0 500 700"
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                </pattern>
              </defs>

              {/* Base Land */}
              <rect width="500" height="700" fill={mapType === 'dark' ? '#141824' : '#1A2218'} />
              <rect width="500" height="700" fill="url(#grid)" />

              {/* Han River (�Ѱ�) */}
              <path
                d="M -50 560 C 120 530, 280 590, 550 540 L 550 750 L -50 750 Z"
                fill={mapType === 'dark' ? '#0E1D2D' : '#0B2B3D'}
                stroke="#1B3A57"
                strokeWidth="2"
              />
              <text x="320" y="630" fill="#3D6A8E" fontSize="13" fontWeight="bold">�Ѱ� (Han River)</text>

              {/* Jungnang Stream (�߶�õ) */}
              <path
                d="M 120 -50 C 140 180, 160 320, 100 550"
                fill="none"
                stroke={mapType === 'dark' ? '#0E1D2D' : '#0B2B3D'}
                strokeWidth="28"
                strokeLinecap="round"
              />
              <text x="50" y="240" fill="#3D6A8E" fontSize="11" fontWeight="bold" transform="rotate(-70 50 240)">�߶�õ ��å��</text>

              {/* Seoul Forest Green Zone (���｣ ����) */}
              <path
                d="M 170 180 C 260 160, 420 180, 430 350 C 440 450, 360 490, 240 480 C 160 470, 150 320, 170 180 Z"
                fill={mapType === 'dark' ? '#162C24' : '#1F4228'}
                stroke="#2A5C43"
                strokeWidth="2"
              />
              <text x="240" y="320" fill="#3AA876" fontSize="15" fontWeight="bold" textAnchor="middle">?? ���｣ (Seoul Forest)</text>
              <text x="240" y="340" fill="#2E7E58" fontSize="10" textAnchor="middle">�ݷ��� ���� ��å��</text>

              {/* Major Roads & Bridges (�����Ϸ�, �����뱳, �Ҽ���) */}
              <path d="M -50 515 L 550 505" stroke="#2C3545" strokeWidth="12" fill="none" />
              <text x="380" y="500" fill="#64748B" fontSize="9">�����Ϸ�</text>

              <path d="M 160 520 L 140 700" stroke="#374151" strokeWidth="14" fill="none" />
              <text x="175" y="600" fill="#c8c8c8" fontSize="9">�����뱳</text>

              <path d="M -20 160 C 200 170, 350 150, 520 170" stroke="#252D3D" strokeWidth="8" fill="none" />
              <text x="30" y="150" fill="#64748B" fontSize="9">�Ҽ��� ��å��</text>

              {/* Subway Stations (���｣��, �Ҽ���) */}
              <g transform="translate(360, 165)">
                <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#FFB703" />
                <text x="14" y="4" fill="#FFB703" fontSize="10" fontWeight="bold">���｣�� (���κд缱)</text>
              </g>
              <g transform="translate(320, 70)">
                <rect x="-8" y="-8" width="16" height="16" rx="4" fill="#2EC4B6" />
                <text x="14" y="4" fill="#2EC4B6" fontSize="10" fontWeight="bold">�Ҽ��� (2ȣ��)</text>
              </g>
            </svg>

            {/* RADAR SWEEP CONE & CONCENTRIC CIRCLES */}
            <div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
              <div style={{
                width: 280 * scale + 'px',
                height: 280 * scale + 'px',
                border: '2px solid rgba(46, 196, 182, 0.35)',
                borderRadius: '50%',
                background: 'rgba(46, 196, 182, 0.05)',
                transition: 'all 0.3s ease'
              }} />
              <div style={{
                position: 'absolute',
                width: 440 * scale + 'px',
                height: 440 * scale + 'px',
                border: '1px dashed rgba(46, 196, 182, 0.25)',
                borderRadius: '50%',
                transition: 'all 0.3s ease'
              }} />
              {/* Range Badge */}
              <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: \`translate(\${135 * scale}px, -12px)\`,
                background: 'rgba(15, 23, 42, 0.85)',
                border: '1px solid #2EC4B6',
                color: '#2EC4B6',
                padding: '1px 6px',
                borderRadius: '8px',
                fontSize: '0.62rem',
                fontWeight: 700
              }}>
                {radarZoom}
              </div>
            </div>

            {/* Rotating Radar Sweep Beam */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: 140 * scale + 'px',
              height: 140 * scale + 'px',
              transformOrigin: 'top left',
              background: 'conic-gradient(from 0deg, rgba(46, 196, 182, 0.3) 0deg, transparent 60deg)',
              animation: 'radarSweep 4s linear infinite',
              pointerEvents: 'none'
            }} />

            {/* MY LOCATION PIN (Center) */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              pointerEvents: 'none'
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
              <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#FF9E58', background: 'rgba(0,0,0,0.85)', padding: '2px 6px', borderRadius: '6px', marginTop: '3px', whiteSpace: 'nowrap' }}>
                {t.radar.myLocation}
              </span>
            </div>

            {/* DOG PINS (Anchored on Map) */}
            {dogPins.map(({ dog, dx, dy }) => {
              const isSelected = selectedPin?.id === dog.id;
              const posX = \`calc(50% + \${(dx * scale) + mapOffset.x}px)\`;
              const posY = \`calc(50% + \${(dy * scale) + mapOffset.y}px)\`;

              return (
                <div
                  key={dog.id}
                  onClick={(e) => { e.stopPropagation(); setSelectedPin(dog); }}
                  style={{
                    position: 'absolute',
                    top: posY,
                    left: posX,
                    transform: 'translate(-50%, -50%)',
                    zIndex: isSelected ? 25 : 18,
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    transition: 'transform 0.2s ease'
                  }}
                >
                  <div style={{
                    width: isSelected ? '54px' : '44px',
                    height: isSelected ? '54px' : '44px',
                    borderRadius: '50%',
                    border: isSelected ? '3px solid #FF9E58' : '2px solid rgba(255,255,255,0.8)',
                    overflow: 'hidden',
                    boxShadow: isSelected ? '0 0 22px #FF9E58' : '0 4px 12px rgba(0,0,0,0.6)',
                    background: '#1F2937',
                    transition: 'all 0.2s ease'
                  }}>
                    <img src={dog.avatar} alt={dog.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <div style={{
                    marginTop: '3px',
                    background: isSelected ? '#FF9E58' : 'rgba(26, 31, 41, 0.9)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    borderRadius: '6px',
                    padding: '2px 6px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    whiteSpace: 'nowrap'
                  }}>
                    <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#fff' }}>{dog.name}</span>
                    <span style={{ fontSize: '0.58rem', color: isSelected ? '#FFF0E6' : '#2EC4B6', fontWeight: 600 }}>{dog.distance}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Reset Center / Zoom Controls Overlay */}
        <div style={{ position: 'absolute', right: '12px', top: '12px', zIndex: 20, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <button
            onClick={() => { setMapOffset({ x: 0, y: 0 }); }}
            className="glass-panel"
            style={{ width: '32px', height: '32px', borderRadius: '10px', display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#FF9E58', cursor: 'pointer' }}
            title="�� ��ġ�� �߽� �̵�"
          >
            <Navigation size={15} />
          </button>
        </div>
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
          padding: '16px 18px 22px 18px',
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
              style={{ width: '56px', height: '56px', borderRadius: '18px', objectFit: 'cover', border: '2px solid #FF9E58' }}
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
              ?? {t.radar.apiKeyModalTitle}
            </h3>
            <p style={{ fontSize: '0.75rem', color: '#c8c8c8', marginBottom: '14px', lineHeight: 1.4 }}>
              {t.radar.apiKeyModalDesc}
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
console.log('RADAR_VIEW_HIGH_RES_MAP_WRITTEN');
