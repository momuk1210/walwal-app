import React, { useState, useEffect } from 'react';
import { Square, Footprints, Play, Pause } from 'lucide-react';
import {
  ActiveWalkSession,
  getActiveWalkSession,
  pauseWalk,
  resumeWalk,
  stopWalk
} from '../services/walkTrackerService';
import { useTranslation } from '../i18n/LanguageContext';
import '../styles/GlobalWalkFloatingBar.css';

interface GlobalWalkFloatingBarProps {
  onOpenWalkModal: () => void;
}

export const GlobalWalkFloatingBar: React.FC<GlobalWalkFloatingBarProps> = ({ onOpenWalkModal }) => {
  const { language } = useTranslation();
  const [session, setSession] = useState<ActiveWalkSession | null>(() => getActiveWalkSession());

  useEffect(() => {
    const handleUpdate = (e: any) => {
      setSession(e.detail ? { ...e.detail } : getActiveWalkSession());
    };
    const handleStarted = (e: any) => {
      setSession(e.detail ? { ...e.detail } : getActiveWalkSession());
    };
    const handleStopped = () => {
      setSession(null);
    };

    window.addEventListener('walwal_walk_tracker_update', handleUpdate);
    window.addEventListener('walwal_walk_tracker_started', handleStarted);
    window.addEventListener('walwal_walk_tracker_stopped', handleStopped);

    return () => {
      window.removeEventListener('walwal_walk_tracker_update', handleUpdate);
      window.removeEventListener('walwal_walk_tracker_started', handleStarted);
      window.removeEventListener('walwal_walk_tracker_stopped', handleStopped);
    };
  }, []);

  if (!session) return null;

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    if (hrs > 0) {
      return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleTogglePause = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.isPaused) {
      resumeWalk();
    } else {
      pauseWalk();
    }
  };

  const handleFinish = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSession(null);
    stopWalk();
  };

  return (
    <div className="global-walk-bar-container">
      <div className="global-walk-bar" onClick={onOpenWalkModal}>
        <div className="global-walk-left">
          <div className="global-walk-avatar-wrapper">
            {session.dogAvatar ? (
              <img src={session.dogAvatar} alt={session.dogName} className="global-walk-avatar" />
            ) : (
              <div className="global-walk-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#FF9E58', color: '#fff' }}>
                <Footprints size={18} />
              </div>
            )}
            <div className={`global-walk-live-ping ${session.isPaused ? 'paused' : ''}`} />
          </div>

          <div className="global-walk-info">
            <div className="global-walk-title-row">
              <span className="global-walk-title">
                {language === 'ko' ? (
                  <>
                    <strong className="global-walk-dog-name">{session.dogName}</strong>와(과) 산책 중
                  </>
                ) : language === 'ja' ? (
                  <>
                    <strong className="global-walk-dog-name">{session.dogName}</strong>とお散歩中
                  </>
                ) : language === 'es' ? (
                  <>
                    Paseando con <strong className="global-walk-dog-name">{session.dogName}</strong>
                  </>
                ) : language === 'zh' ? (
                  <>
                    与<strong className="global-walk-dog-name">{session.dogName}</strong>散步中
                  </>
                ) : language === 'fr' ? (
                  <>
                    En promenade avec <strong className="global-walk-dog-name">{session.dogName}</strong>
                  </>
                ) : (
                  <>
                    Walking with <strong className="global-walk-dog-name">{session.dogName}</strong>
                  </>
                )}
              </span>
              <span className="global-walk-status-tag">
                {session.isPaused
                  ? (language === 'ko' ? '일시정지' : language === 'ja' ? '一時停止' : language === 'es' ? 'EN PAUSA' : language === 'zh' ? '暂停' : language === 'fr' ? 'PAUSE' : 'PAUSED')
                  : 'LIVE'}
              </span>
            </div>

            <div className="global-walk-stats">
              <div> <strong>{formatTimer(session.elapsedSeconds)}</strong></div>
              <span>·</span>
              <div> <strong>{session.distanceKm.toFixed(2)}</strong> km</div>
              <span>·</span>
              <div>  <strong>{session.caloriesKcal}</strong> kcal</div>
            </div>
          </div>
        </div>

        <div className="global-walk-actions">
          <button
            type="button"
            className={`global-walk-pause-btn ${session.isPaused ? 'is-paused' : ''}`}
            onClick={handleTogglePause}
            title={
              session.isPaused
                ? (language === 'ko' ? '산책 재개' : language === 'ja' ? '散歩再開' : language === 'es' ? 'Reanudar paseo' : language === 'zh' ? '恢复散步' : language === 'fr' ? 'Reprendre la promenade' : 'Resume walk')
                : (language === 'ko' ? '산책 일시정지' : language === 'ja' ? '散歩一時停止' : language === 'es' ? 'Pausar paseo' : language === 'zh' ? '暂停散步' : language === 'fr' ? 'Mettre en pause' : 'Pause walk')
            }
          >
            {session.isPaused ? (
              <>
                <Play size={11} fill="currentColor" />
              </>
            ) : (
              <>
                <Pause size={11} fill="currentColor" />
              </>
            )}
          </button>

          <button
            type="button"
            className="global-walk-finish-btn"
            onClick={handleFinish}
            title={language === 'ko' ? '산책 종료' : language === 'ja' ? '散歩終了' : language === 'es' ? 'Finalizar paseo' : language === 'zh' ? '结束散步' : language === 'fr' ? 'Terminer la promenade' : 'Finish Walk'}
          >
            <Square size={11} fill="#DDD" />
          </button>
        </div>
      </div>
    </div>
  );
};
