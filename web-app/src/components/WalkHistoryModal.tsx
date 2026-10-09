import React, { useState } from 'react';
import { X, MapPin, Clock, Calendar, Flame, Footprints, Award, Plus, Check, TrendingUp, Sun, Moon, Zap, Compass } from 'lucide-react';
import { DogProfile, getDefaultDogAvatar } from '../data/mockDogs';
import { useTranslation } from '../i18n/LanguageContext';
import '../styles/WalkHistoryModal.css';

export interface WalkRecord {
  id: string;
  date: string; // YYYY-MM-DD
  distanceKm: number;
  durationMinutes: number;
  caloriesKcal: number;
  locationName: string;
  timeOfDay?: 'morning' | 'evening';
}

interface WalkHistoryModalProps {
  dog: DogProfile;
  initialTab?: 'distance' | 'time';
  onClose: () => void;
  onUpdateStats?: (totalDistance: number, totalMinutes: number) => void;
}

export const WalkHistoryModal: React.FC<WalkHistoryModalProps> = ({ dog, initialTab = 'distance', onClose, onUpdateStats }) => {
  const { language } = useTranslation();
  const [activeTab, setActiveTab] = useState<'distance' | 'time'>(initialTab);
  const storageKey = `WALWAL_WALK_LOGS_${dog.id || dog.name}`;

  // 초기 산책 기록 생성기 (기존 프로필 데이터와 자연스럽게 연동)
  const generateInitialRecords = (): WalkRecord[] => {
    const today = new Date();
    const todayDistance = dog.todayWalkDistance !== undefined ? dog.todayWalkDistance : 1.8;
    const todayMinutes = dog.todayWalkMinutes !== undefined ? dog.todayWalkMinutes : 45;

    const baseRecords: WalkRecord[] = [
      {
        id: 'walk-1',
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
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dist = pastDistances[i - 1];
      const mins = pastMinutes[i - 1];
      baseRecords.push({
        id: `walk-${i + 1}`,
        date: d.toISOString().split('T')[0],
        distanceKm: dist,
        durationMinutes: mins,
        caloriesKcal: Math.round(dist * 50),
        locationName: pastMemosKo[(i - 1) % pastMemosKo.length],
        timeOfDay: i % 3 === 0 ? 'morning' : 'evening'
      });
    }

    return baseRecords;
  };

  const [records, setRecords] = useState<WalkRecord[]>(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    const initial = generateInitialRecords();
    localStorage.setItem(storageKey, JSON.stringify(initial));
    return initial;
  });

  const [showAddForm, setShowAddForm] = useState(false);
  const [newDistance, setNewDistance] = useState('');
  const [newMinutes, setNewMinutes] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newTimeOfDay, setNewTimeOfDay] = useState<'morning' | 'evening'>('evening');

  // 통계 계산
  const totalDistance = records.reduce((acc, r) => acc + (Number(r.distanceKm) || 0), 0);
  const totalMinutes = records.reduce((acc, r) => acc + (Number(r.durationMinutes) || 0), 0);
  const totalCalories = records.reduce((acc, r) => acc + (Number(r.caloriesKcal) || 0), 0);
  const totalWalks = records.length;
  const todayRecord = records.find(r => r.date === new Date().toISOString().split('T')[0]) || records[0];

  // 거리 관련 통계 (거리 중심)
  const dailyDistanceGoal = 2.0; // 일일 목표 2.0km
  const todayDistanceRate = Math.min(100, Math.round(((todayRecord?.distanceKm || 0) / dailyDistanceGoal) * 100));
  const maxDistanceRecord = Math.max(...records.map(r => r.distanceKm || 0));

  // 시간 관련 통계 (시간 중심)
  const dailyTimeGoal = 50; // 일일 목표 50분
  const todayTimeRate = Math.min(100, Math.round(((todayRecord?.durationMinutes || 0) / dailyTimeGoal) * 100));
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
      locationName: newLocation.trim() || (language === 'ko' ? '즐거운 산책' : 'Joyful Walk'),
      timeOfDay: newTimeOfDay
    };

    const updated = [newRecord, ...records];
    setRecords(updated);
    localStorage.setItem(storageKey, JSON.stringify(updated));

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

  const formatDisplayDate = (dateStr: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const d = new Date(dateStr);
    const m = d.getMonth() + 1;
    const day = d.getDate();

    if (dateStr === todayStr) {
      return { text: `${m}월 ${day}일`, isToday: true, label: language === 'ko' ? '오늘' : 'Today' };
    }
    if (dateStr === yesterdayStr) {
      return { text: `${m}월 ${day}일`, isToday: false, label: language === 'ko' ? '어제' : 'Yesterday' };
    }
    return { text: `${m}월 ${day}일`, isToday: false, label: '' };
  };

  return (
    <div className="walk-history-overlay" onClick={onClose}>
      <div className="walk-history-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="walk-history-header">
          <div className="walk-history-title-group">
            <img
              src={dog.avatar || getDefaultDogAvatar()}
              alt={dog.name}
              className="walk-history-avatar"
            />
            <div>
              <h3 className="walk-history-title">
                {dog.name}{language === 'ko' ? '의 산책 일지' : language === 'ja' ? 'のお散歩記録' : "'s Walk Log"}
              </h3>
              <p className="walk-history-subtitle">
                {activeTab === 'distance'
                  ? (language === 'ko' ? '코스별 이동 거리와 마일스톤' : 'Distance & Course Milestones')
                  : (language === 'ko' ? '산책 시간과 활동량·칼로리 분석' : 'Time & Activity Analysis')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="walk-history-close-btn"
            onClick={onClose}
            title={language === 'ko' ? '닫기' : 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="walk-history-tab-nav">
          <button
            type="button"
            className={`walk-history-tab-btn ${activeTab === 'distance' ? 'active distance' : ''}`}
            onClick={() => setActiveTab('distance')}
          >
            <MapPin size={16} />
            <span>{language === 'ko' ? '거리 & 코스 분석' : 'Distance & Course'}</span>
          </button>
          <button
            type="button"
            className={`walk-history-tab-btn ${activeTab === 'time' ? 'active time' : ''}`}
            onClick={() => setActiveTab('time')}
          >
            <Clock size={16} />
            <span>{language === 'ko' ? '시간 & 활동 분석' : 'Time & Activity'}</span>
          </button>
        </div>

        {/* Body */}
        <div className="walk-history-body">
          {/* ================= 탭 1: 거리 & 코스 분석 ================= */}
          {activeTab === 'distance' && (
            <>
              {/* Summary Card (Distance Theme) */}
              <div className="walk-summary-card distance-theme">
                <div className="walk-summary-top">
                  <div className="walk-summary-badge">
                    <MapPin size={14} />
                    <span>{language === 'ko' ? '누적 거리 집계' : 'Distance Stats'}</span>
                  </div>
                  <span className="walk-summary-today-tag">
                    {language === 'ko' ? `오늘 ${todayRecord?.distanceKm || 0} km` : `Today ${todayRecord?.distanceKm || 0} km`}
                  </span>
                </div>

                <div className="walk-summary-grid">
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{language === 'ko' ? '총 누적 거리' : 'Total Dist'}</span>
                    <span className="walk-summary-item-value">{totalDistance.toFixed(1)} <small style={{ fontSize: '0.68rem' }}>km</small></span>
                  </div>
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{language === 'ko' ? '최장 산책 거리' : 'Longest'}</span>
                    <span className="walk-summary-item-value">{maxDistanceRecord.toFixed(1)} <small style={{ fontSize: '0.68rem' }}>km</small></span>
                  </div>
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{language === 'ko' ? '총 산책 횟수' : 'Walks'}</span>
                    <span className="walk-summary-item-value">{totalWalks} <small style={{ fontSize: '0.68rem' }}>{language === 'ko' ? '회' : 'times'}</small></span>
                  </div>
                </div>
              </div>

              {/* Distance Milestone Insight Card */}
              <div className="walk-insight-card">
                <div className="walk-insight-header">
                  <span className="walk-insight-title">
                    <Compass size={16} color="#FFB320" />
                    <span>{language === 'ko' ? '오늘 산책 목표 (2.0 km)' : 'Today Distance Goal'}</span>
                  </span>
                  <span className="walk-insight-percent distance">{todayDistanceRate}%</span>
                </div>
                <div className="walk-progress-bar-bg">
                  <div className="walk-progress-bar-fill distance" style={{ width: `${todayDistanceRate}%` }} />
                </div>
                <p className="walk-insight-footer">
                  <strong>{language === 'ko' ? '거리 뱃지' : 'Milestone'}:</strong>{' '}
                  {language === 'ko'
                    ? `지금까지 서울역에서 수원역(약 35km)까지 걸어간 거리입니다! 다음 목표 천안까지 45km 남았어요.`
                    : `You walked from Seoul to Suwon (~35km)! Next stop: Cheonan.`}
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
                    <span>{language === 'ko' ? '활동량 & 시간 분석' : 'Time & Activity'}</span>
                  </div>
                  <span className="walk-summary-today-tag">
                    {language === 'ko' ? `오늘 ${todayRecord?.durationMinutes || 0}분 활동` : `Today ${todayRecord?.durationMinutes || 0}m`}
                  </span>
                </div>

                <div className="walk-summary-grid">
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{language === 'ko' ? '총 누적 시간' : 'Total Time'}</span>
                    <span className="walk-summary-item-value">{totalMinutes} <small style={{ fontSize: '0.68rem' }}>{language === 'ko' ? '분' : 'min'}</small></span>
                  </div>
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{language === 'ko' ? '평균 보행 속도' : 'Avg Pace'}</span>
                    <span className="walk-summary-item-value">{avgPace} <small style={{ fontSize: '0.68rem' }}>km/h</small></span>
                  </div>
                  <div className="walk-summary-item">
                    <span className="walk-summary-item-label">{language === 'ko' ? '누적 소모 열량' : 'Calories'}</span>
                    <span className="walk-summary-item-value">{totalCalories} <small style={{ fontSize: '0.68rem' }}>kcal</small></span>
                  </div>
                </div>
              </div>

              {/* Time & Activity Pattern Card */}
              <div className="walk-insight-card">
                <div className="walk-insight-header">
                  <span className="walk-insight-title">
                    <Zap size={16} color="#0D9488" />
                    <span>{language === 'ko' ? '일일 권장 운동 시간 (50분)' : 'Daily Target Time'}</span>
                  </span>
                  <span className="walk-insight-percent time">{todayTimeRate}%</span>
                </div>
                <div className="walk-progress-bar-bg">
                  <div className="walk-progress-bar-fill time" style={{ width: `${todayTimeRate}%` }} />
                </div>

                <div className="walk-time-pattern-grid">
                  <div className="walk-pattern-chip">
                    <div className="walk-pattern-icon morning">
                      <Sun size={18} />
                    </div>
                    <div className="walk-pattern-text">
                      <span className="walk-pattern-label">{language === 'ko' ? '아침/낮 산책' : 'Morning'}</span>
                      <span className="walk-pattern-val">{morningRatio}%</span>
                    </div>
                  </div>
                  <div className="walk-pattern-chip">
                    <div className="walk-pattern-icon evening">
                      <Moon size={18} />
                    </div>
                    <div className="walk-pattern-text">
                      <span className="walk-pattern-label">{language === 'ko' ? '저녁/밤 산책' : 'Evening'}</span>
                      <span className="walk-pattern-val">{eveningRatio}%</span>
                    </div>
                  </div>
                </div>

                <p className="walk-insight-footer">
                  <strong>{language === 'ko' ? '오늘 칼로리' : 'Today Burned'}:</strong>{' '}
                  {language === 'ko'
                    ? `오늘 약 ${todayRecord?.caloriesKcal || 95} kcal 소모 (맛있는 닭가슴살 큐브 1개 분량)! 저녁 산책을 주로 즐기는 댕댕이입니다.`
                    : `Burned ~${todayRecord?.caloriesKcal || 95} kcal! Mostly enjoys evening walks.`}
                </p>
              </div>
            </>
          )}

          {/* List Header + Add Button */}
          <div className="walk-list-header">
            <h4 className="walk-list-title">
              <Calendar size={17} color="#64748B" />
              <span>
                {activeTab === 'distance'
                  ? (language === 'ko' ? '코스 및 거리 기록 목록' : 'Course & Distance Logs')
                  : (language === 'ko' ? '산책 시간 및 칼로리 기록 목록' : 'Time & Calorie Logs')}
              </span>
            </h4>
            <button
              type="button"
              className="walk-add-btn"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <Plus size={14} />
              <span>{showAddForm ? (language === 'ko' ? '취소' : 'Cancel') : (language === 'ko' ? '기록 추가' : 'Add Walk')}</span>
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
                  placeholder={language === 'ko' ? '거리 (예: 2.5 km)' : 'Distance (km)'}
                  value={newDistance}
                  onChange={e => setNewDistance(e.target.value)}
                  className="walk-add-input"
                  required
                />
                <input
                  type="number"
                  step="1"
                  min="1"
                  placeholder={language === 'ko' ? '시간 (예: 40 분)' : 'Duration (min)'}
                  value={newMinutes}
                  onChange={e => setNewMinutes(e.target.value)}
                  className="walk-add-input"
                  required
                />
              </div>
              <div className="walk-add-form-row">
                <input
                  type="text"
                  placeholder={language === 'ko' ? '산책 장소 또는 코스명 (예: 한강공원)' : 'Course / Location'}
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
                  <option value="evening">{language === 'ko' ? '저녁/밤' : 'Evening'}</option>
                  <option value="morning">{language === 'ko' ? '아침/낮' : 'Morning'}</option>
                </select>
              </div>
              <button type="submit" className="walk-add-submit-btn">
                <Check size={16} />
                <span>{language === 'ko' ? '산책 기록 저장' : 'Save Walk'}</span>
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
                      <span><MapPin size={11} /> {record.locationName}</span>
                      <span>·</span>
                      {record.timeOfDay === 'morning' ? (
                        <span><Sun size={11} color="#FFB320" /> {language === 'ko' ? '아침' : 'Morning'}</span>
                      ) : (
                        <span><Moon size={11} color="#4F46E5" /> {language === 'ko' ? '저녁' : 'Evening'}</span>
                      )}
                    </div>
                  </div>

                  <div className="walk-record-right">
                    {activeTab === 'distance' ? (
                      <>
                        <span className="walk-record-primary-val distance">
                          {record.distanceKm.toFixed(1)} km
                        </span>
                        <span className="walk-record-secondary-val distance">
                          {record.durationMinutes} {language === 'ko' ? '분 소요' : 'mins'}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="walk-record-primary-val time">
                          {record.durationMinutes} {language === 'ko' ? '분' : 'mins'}
                        </span>
                        <span className="walk-record-secondary-val time">
                          <Flame size={12} style={{ display: 'inline', verticalAlign: 'text-bottom' }} /> {record.caloriesKcal} kcal
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
    </div>
  );
};
