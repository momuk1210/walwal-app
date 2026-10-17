import React from 'react';
import { Camera, MapPin, Bell } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import '../styles/AppPermissionModal.css';

interface AppPermissionModalProps {
  onClose: () => void;
}

export const AppPermissionModal: React.FC<AppPermissionModalProps> = ({ onClose }) => {
  const { language } = useTranslation();

  const handleConfirm = () => {
    try {
      localStorage.setItem('WALWAL_APP_PERMISSIONS_CONSENT', 'true');
      localStorage.setItem('WALWAL_PERM_CAMERA', 'true');
      localStorage.setItem('WALWAL_PERM_MIC', 'true');
      localStorage.setItem('WALWAL_PERM_LOCATION', 'true');
    } catch (e) {
      console.warn('Failed to save permission consent:', e);
    }

    onClose();
  };

  const texts = {
    ko: {
      title: '앱 접근 권한 안내해 드려요',
      mandatoryTitle: '필수적 접근 권한',
      mandatoryDesc: '사용하지 않음',
      optionalTitle: '선택적 접근 권한',
      cameraTitle: '사진/카메라/마이크/저장공간',
      cameraDesc: '반려견 AR 통역 및 소리 분석, 스냅스 촬영 및 프로필 등록',
      locationTitle: '위치',
      locationDesc: '실시간 산책 트래킹, 내 주변 반려견 탐색',
      alarmTitle: '알림',
      alarmDesc: '서비스 알림에 대한 수신설정',
      note1: '선택적 접근 권한은 해당 기능 이용 시 동의를 받고 있으며, 비허용시에도 해당 기능 외 서비스 이용 가능합니다',
      note2: '디바이스 설정>왈왈에서도 설정 변경 가능합니다',
      confirm: '확인'
    },
    en: {
      title: 'App Access Permissions',
      mandatoryTitle: 'Required Permissions',
      mandatoryDesc: 'None',
      optionalTitle: 'Optional Permissions',
      cameraTitle: 'Photos / Camera / Storage',
      cameraDesc: 'Dog AR translation, Snaps capture & profile upload',
      locationTitle: 'Location',
      locationDesc: 'Real-time walk tracking & nearby dog discovery',
      alarmTitle: 'Notifications',
      alarmDesc: 'Walk reminders, alerts & community updates',
      note1: 'Optional permissions are requested when using the feature. You can still use the service without granting them.',
      note2: 'You can also change settings anytime in Device Settings > WalWal',
      confirm: 'Confirm'
    },
    ja: {
      title: 'アプリのアクセス権限のご案内',
      mandatoryTitle: '必須アクセス権限',
      mandatoryDesc: '使用なし',
      optionalTitle: '選択的アクセス権限',
      cameraTitle: '写真 / カメラ / ストレージ',
      cameraDesc: '愛犬AR通訳、スナップス撮影およびプロフィール登録',
      locationTitle: '位置情報',
      locationDesc: 'リアルタイム散歩追跡、周辺の愛犬探索',
      alarmTitle: '通知',
      alarmDesc: '散歩通知、コミュニティの返信およびお知らせ',
      note1: '選択的アクセス権限は機能使用時に同意を受け、許可しなくてもその他の機能を利用できます',
      note2: 'デバイス設定 > WalWal からも設定変更が可能です',
      confirm: '確認'
    },
    es: {
      title: 'Guía de permisos de la app',
      mandatoryTitle: 'Permisos obligatorios',
      mandatoryDesc: 'Ninguno',
      optionalTitle: 'Permisos opcionales',
      cameraTitle: 'Fotos / Cámara / Almacenamiento',
      cameraDesc: 'Traductor AR, fotos Snaps y fotos de perfil',
      locationTitle: 'Ubicación',
      locationDesc: 'Rastreo de paseos en tiempo real y perros cercanos',
      alarmTitle: 'Notificaciones',
      alarmDesc: 'Alertas de paseos, comentarios y novedades',
      note1: 'Los permisos opcionales se solicitan al usar cada función. Puedes usar el servicio sin otorgarlos.',
      note2: 'Puedes cambiar los permisos en Ajustes del dispositivo > WalWal',
      confirm: 'Aceptar'
    },
    zh: {
      title: '应用访问权限说明',
      mandatoryTitle: '必要访问权限',
      mandatoryDesc: '无',
      optionalTitle: '可选访问权限',
      cameraTitle: '照片 / 相机 / 存储空间',
      cameraDesc: '狗狗AR翻译、Snaps拍照及个人主页设置',
      locationTitle: '位置',
      locationDesc: '实时散步追踪与附近狗狗发现',
      alarmTitle: '通知',
      alarmDesc: '接收散步提醒与社区动态通知',
      note1: '可选访问权限在使用相关功能时征得同意，即使不同意也可使用其他服务',
      note2: '也可在 设备设置 > WalWal 中修改权限设置',
      confirm: '确认'
    },
    fr: {
      title: 'Autorisations de l’application',
      mandatoryTitle: 'Autorisations obligatoires',
      mandatoryDesc: 'Aucune',
      optionalTitle: 'Autorisations optionnelles',
      cameraTitle: 'Photos / Caméra / Stockage',
      cameraDesc: 'Traducteur AR, capture Snaps et photo de profil',
      locationTitle: 'Localisation',
      locationDesc: 'Suivi de promenade en direct et chiens à proximité',
      alarmTitle: 'Notifications',
      alarmDesc: 'Rappels de promenade et alertes de la communauté',
      note1: 'Les autorisations optionnelles sont demandées lors de l’utilisation du service.',
      note2: 'Vous pouvez modifier les autorisations dans Paramètres de l’appareil > WalWal',
      confirm: 'Confirmer'
    }
  };

  const cur = texts[language as keyof typeof texts] || texts.ko;

  return (
    <div className="app-perm-overlay" role="dialog" aria-modal="true">
      <div className="app-perm-card animate-scale-up">
        <div className="app-perm-content">
          <h2 className="app-perm-title">{cur.title}</h2>
          <div className="app-perm-divider" />

          {/* 필수적 접근 권한 */}
          <div className="app-perm-section">
            <h3 className="app-perm-section-title">{cur.mandatoryTitle}</h3>
            <p className="app-perm-bullet-item">· {cur.mandatoryDesc}</p>
          </div>

          {/* 선택적 접근 권한 */}
          <div className="app-perm-section optional-section">
            <h3 className="app-perm-section-title">{cur.optionalTitle}</h3>

            <div className="app-perm-item-list">
              {/* 사진/카메라 */}
              <div className="app-perm-item">
                <div className="app-perm-icon-wrapper">
                  <Camera size={22} strokeWidth={1.8} />
                </div>
                <div className="app-perm-text-group">
                  <div className="app-perm-item-name">{cur.cameraTitle}</div>
                  <div className="app-perm-item-desc">{cur.cameraDesc}</div>
                </div>
              </div>

              {/* 위치 */}
              <div className="app-perm-item">
                <div className="app-perm-icon-wrapper">
                  <MapPin size={22} strokeWidth={1.8} />
                </div>
                <div className="app-perm-text-group">
                  <div className="app-perm-item-name">{cur.locationTitle}</div>
                  <div className="app-perm-item-desc">{cur.locationDesc}</div>
                </div>
              </div>

              {/* 알림 */}
              <div className="app-perm-item">
                <div className="app-perm-icon-wrapper">
                  <Bell size={22} strokeWidth={1.8} />
                </div>
                <div className="app-perm-text-group">
                  <div className="app-perm-item-name">{cur.alarmTitle}</div>
                  <div className="app-perm-item-desc">{cur.alarmDesc}</div>
                </div>
              </div>
            </div>
          </div>

          {/* 하단 안내 문구 */}
          <div className="app-perm-notes">
            <p className="app-perm-note-item">· {cur.note1}</p>
            <p className="app-perm-note-item">· {cur.note2}</p>
          </div>
        </div>

        {/* 확인 버튼 */}
        <button
          type="button"
          className="app-perm-confirm-btn"
          onClick={handleConfirm}
        >
          {cur.confirm}
        </button>
      </div>
    </div>
  );
};
