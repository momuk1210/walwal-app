import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Camera,
  MapPin,
  Image,
  Users,
  Settings,
  Shield,
  Heart,
  Calendar,
  ChevronRight,
  HelpCircle,
  FileText,
  Award,
  MessageSquare
} from 'lucide-react';
import { useTranslation, Language } from '../i18n/LanguageContext';
import { getMockDogs, sanitizePetList } from '../data/mockDogs';
import '../styles/AllServicesModal.css';

interface AllServicesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (tabId: string) => void;
}

interface ServiceItem {
  id: string;
  title: string;
  desc?: string;
  icon: React.ReactNode;
  badge?: string;
  action: () => void;
}

interface ServiceCategory {
  id: string;
  title?: string;
  items: ServiceItem[];
}

const UNIFIED_ICON_COLOR = '#334155';
const ICON_SIZE = 24;

// Multilingual translations for All Services Menu (ko, en, ja, es)
const ALL_SERVICES_I18N = {
  ko: {
    headerTitle: '전체 서비스',
    searchPlaceholder: '서비스 검색...',
    noResults: '검색 결과가 없습니다.',
    greetingFallback: '오늘도 즐거운 산책하자 멍!',
    petFallback: '반려견',
    categories: {
      ai_ar: {
        title: 'AI & 카메라',
        arTitle: 'AR 마음 읽기',
        arDesc: '실시간 감정 번역 & 생각 말풍선'
      },
      walk_map: {
        title: '산책 & 모임',
        nearbyTitle: '동네친구 찾기',
        nearbyDesc: '주변 반려견 탐색 & 지도 보기',
        communityTitle: '산책 모임',
        communityDesc: '함께 산책하는 모임 개설 및 참여'
      },
      feed_snaps: {
        title: '소통 & 피드',
        snapsTitle: '피드',
        snapsDesc: '댕댕이 일상 사진/영상 공유',
        chatTitle: '모임 실시간 채팅',
        chatDesc: '산책 모임 전용 대화방'
      },
      my_pet: {
        title: '내 활동 & 반려견',
        profileTitle: '내 반려견 관리',
        profileDesc: '프로필, 성격 태그, 입양일 D-day',
        walkHistoryTitle: '산책 히스토리',
        walkHistoryDesc: '주간/월간 산책 누적 거리 & 뱃지'
      },
      settings_system: {
        title: '설정 & 지원',
        settingsTitle: '환경 설정',
        settingsDesc: '언어 설정, 알림, 캐시 관리',
        adminTitle: '관리자 모드',
        adminDesc: '반려견, 피드, 모임, 공지사항 관리',
        faqTitle: '자주 묻는 질문',
        faqDesc: '이용 안내 및 자주 묻는 질문',
        feedbackTitle: '서비스 개선',
        feedbackDesc: '소중한 의견 및 개선 요청',
        termsTitle: '이용약관',
        termsDesc: '서비스 이용약관 및 운영 정책',
        privacyTitle: '개인정보 처리방침',
        privacyDesc: '개인정보 수집 및 위치정보 보호 방침'
      }
    }
  },
  en: {
    headerTitle: 'All Services',
    searchPlaceholder: 'Search services...',
    noResults: 'No results found.',
    greetingFallback: 'Ready for a fun walk today!',
    petFallback: 'Dog',
    categories: {
      ai_ar: {
        title: 'AI & Camera',
        arTitle: 'AR Emotion Reader',
        arDesc: 'Real-time dog emotion AI & speech bubbles'
      },
      walk_map: {
        title: 'Walk & Meetups',
        nearbyTitle: 'Find Nearby Friends',
        nearbyDesc: 'Discover nearby dogs & view map',
        communityTitle: 'Walk Meetups',
        communityDesc: 'Join or host dog walk meetups'
      },
      feed_snaps: {
        title: 'Feed & Community',
        snapsTitle: 'Snaps',
        snapsDesc: 'Daily dog photos and videos',
        chatTitle: 'Meetup Live Chat',
        chatDesc: 'Chat room for meetup participants'
      },
      my_pet: {
        title: 'My Pet & History',
        profileTitle: 'Dog Profile Manager',
        profileDesc: 'Profiles, personality tags & D-day',
        walkHistoryTitle: 'Walk History',
        walkHistoryDesc: 'Weekly/monthly walk stats & badges'
      },
      settings_system: {
        title: 'Settings & Support',
        settingsTitle: 'Settings',
        settingsDesc: 'Language, notifications, cache',
        adminTitle: 'Admin Dashboard',
        adminDesc: 'Manage dogs, posts, meetups & notices',
        faqTitle: 'FAQ',
        faqDesc: 'How to use WalWal & guides',
        feedbackTitle: 'Service Feedback',
        feedbackDesc: 'Send feedback and suggestions',
        termsTitle: 'Terms of Service',
        termsDesc: 'Service terms and operational policy',
        privacyTitle: 'Privacy Policy',
        privacyDesc: 'Personal data and location privacy policy'
      }
    }
  },
  ja: {
    headerTitle: '全サービス',
    searchPlaceholder: 'サービスを検索...',
    noResults: '検索結果がありません。',
    greetingFallback: '今日も楽しいお散歩に行こうワン！',
    petFallback: '愛犬',
    categories: {
      ai_ar: {
        title: 'AI＆カメラ',
        arTitle: 'AR 気持ち翻訳',
        arDesc: 'リアルタイム感情AI＆吹き出し'
      },
      walk_map: {
        title: 'お散歩＆オフ会',
        nearbyTitle: 'ご近所友だち探し',
        nearbyDesc: '近所のワンちゃん探索＆マップ',
        communityTitle: 'お散歩オフ会',
        communityDesc: '一緒にお散歩するオフ会の作成・参加'
      },
      feed_snaps: {
        title: 'コミュニティ＆スナップ',
        snapsTitle: 'スナップ',
        snapsDesc: '愛犬の日常写真・動画シェア',
        chatTitle: 'オフ会リアルタイムチャット',
        chatDesc: 'お散歩メンバー専用トークルーム'
      },
      my_pet: {
        title: 'マイペット＆記録',
        profileTitle: '愛犬プロフィール管理',
        profileDesc: 'プロフィール・性格タグ・D-day',
        walkHistoryTitle: 'お散歩履歴',
        walkHistoryDesc: '週間・月間の累積距離＆バッジ'
      },
      settings_system: {
        title: '設定＆サポート',
        settingsTitle: '環境設定',
        settingsDesc: '言語設定・通知・キャッシュ管理',
        adminTitle: '管理者モード',
        adminDesc: '愛犬・投稿・オフ会・お知らせ管理',
        faqTitle: 'よくある質問',
        faqDesc: 'ご利用案内・よくあるご質問',
        feedbackTitle: 'サービス改善',
        feedbackDesc: 'ご意見・改善リクエスト',
        termsTitle: '利用規約',
        termsDesc: 'サービス利用規約および運営ポリシー',
        privacyTitle: 'プライバシーポリシー',
        privacyDesc: '個人情報収集および位置情報保護方針'
      }
    }
  },
  es: {
    headerTitle: 'Todos los servicios',
    searchPlaceholder: 'Buscar servicios...',
    noResults: 'No se encontraron resultados.',
    greetingFallback: '¡Listos para un paseo divertido!',
    petFallback: 'Perro',
    categories: {
      ai_ar: {
        title: 'IA y Cámara',
        arTitle: 'Lector de emociones AR',
        arDesc: 'IA de emociones caninas y burbujas'
      },
      walk_map: {
        title: 'Paseos y Encuentros',
        nearbyTitle: 'Buscar amigos cercanos',
        nearbyDesc: 'Descubre perros cercanos y mapa',
        communityTitle: 'Grupos de paseo',
        communityDesc: 'Únete o crea grupos de paseo canino'
      },
      feed_snaps: {
        title: 'Comunidad y Snaps',
        snapsTitle: 'Snaps',
        snapsDesc: 'Comparte fotos y vídeos diarios',
        chatTitle: 'Chat en vivo del grupo',
        chatDesc: 'Sala de chat para participantes'
      },
      my_pet: {
        title: 'Mi Mascota y Actividad',
        profileTitle: 'Gestión de perfil',
        profileDesc: 'Perfiles, personalidad y D-day',
        walkHistoryTitle: 'Historial de paseos',
        walkHistoryDesc: 'Estadísticas de paseo y medallas'
      },
      settings_system: {
        title: 'Ajustes y Soporte',
        settingsTitle: 'Ajustes',
        settingsDesc: 'Idioma, notificaciones y caché',
        adminTitle: 'Modo Administrador',
        adminDesc: 'Gestión de perros, posts y grupos',
        faqTitle: 'Preguntas Frecuentes',
        faqDesc: 'Guía de uso y dudas habituales',
        feedbackTitle: 'Mejora del servicio',
        feedbackDesc: 'Sugerencias y comentarios',
        termsTitle: 'Términos de servicio',
        termsDesc: 'Términos de uso y políticas del servicio',
        privacyTitle: 'Política de privacidad',
        privacyDesc: 'Protección de datos y política de ubicación'
      }
    }
  },
  fr: {
    headerTitle: 'Tous les services',
    searchPlaceholder: 'Rechercher un service...',
    noResults: 'Aucun résultat trouvé.',
    greetingFallback: 'Prêt pour une belle balade aujourd\'hui !',
    petFallback: 'Chien',
    categories: {
      ai_ar: {
        title: 'IA & Caméra',
        arTitle: 'Traducteur AR',
        arDesc: 'Traduction IA des émotions canines en temps réel'
      },
      walk_map: {
        title: 'Balade & Rencontres',
        nearbyTitle: 'Trouver des amis',
        nearbyDesc: 'Découvrez les chiens aux alentours sur la carte',
        communityTitle: 'Balades collectives',
        communityDesc: 'Rejoignez ou organisez des sorties'
      },
      feed_snaps: {
        title: 'Fil & Communauté',
        snapsTitle: 'Snaps',
        snapsDesc: 'Photos et vidéos quotidiennes des chiens',
        chatTitle: 'Chat en direct',
        chatDesc: 'Discussion entre participants de la balade'
      },
      my_pet: {
        title: 'Mon Chien & Historique',
        profileTitle: 'Gestion du profil',
        profileDesc: 'Profil, badges de caractère et dates clés',
        walkHistoryTitle: 'Historique de balade',
        walkHistoryDesc: 'Statistiques et médailles de promenade'
      },
      settings_system: {
        title: 'Paramètres & Support',
        settingsTitle: 'Paramètres',
        settingsDesc: 'Langue, notifications et cache',
        adminTitle: 'Mode Administrateur',
        adminDesc: 'Gestion des chiens, posts et groupes',
        faqTitle: 'FAQ',
        faqDesc: 'Guide d\'utilisation et questions fréquentes',
        feedbackTitle: 'Amélioration du service',
        feedbackDesc: 'Vos suggestions et retours',
        termsTitle: 'Conditions d\'utilisation',
        termsDesc: 'Conditions et règles de la plateforme',
        privacyTitle: 'Politique de confidentialité',
        privacyDesc: 'Protection des données et localisation'
      }
    }
  },
  zh: {
    headerTitle: '全部服务',
    searchPlaceholder: '搜索服务...',
    noResults: '未找到相关服务。',
    greetingFallback: '准备好今天快乐遛狗了吗！',
    petFallback: '狗狗',
    categories: {
      ai_ar: {
        title: 'AI与相机',
        arTitle: 'AR情绪翻译官',
        arDesc: '实时AI情绪识别与萌趣对话气泡'
      },
      walk_map: {
        title: '散步与约行',
        nearbyTitle: '发现附近狗友',
        nearbyDesc: '雷达探索附近散步狗狗与地图'
        , communityTitle: '约行活动',
        communityDesc: '参与或发起附近遛狗聚会'
      },
      feed_snaps: {
        title: '动态与社区',
        snapsTitle: '精彩动态',
        snapsDesc: '分享狗狗日常萌照与精彩瞬间',
        chatTitle: '约行实时聊天',
        chatDesc: '约行参与者专属互动聊天室'
      },
      my_pet: {
        title: '我的爱犬与记录',
        profileTitle: '爱犬档案管理',
        profileDesc: '档案信息、性格标签与专属纪念日',
        walkHistoryTitle: '遛狗足迹历史',
        walkHistoryDesc: '周/月运动统计与成就勋章'
      },
      settings_system: {
        title: '设置与客户支持',
        settingsTitle: '应用设置',
        settingsDesc: '语言、消息通知与缓存管理',
        adminTitle: '管理中心',
        adminDesc: '管理狗狗档案、帖子与约行活动',
        faqTitle: '常见问题',
        faqDesc: '使用指南与答疑解惑',
        feedbackTitle: '意见反馈',
        feedbackDesc: '提出宝贵意见与改进建议',
        termsTitle: '服务条款',
        termsDesc: '服务使用协议与运营规范',
        privacyTitle: '隐私政策',
        privacyDesc: '个人信息与位置信息保护规范'
      }
    }
  }
};

export const AllServicesModal: React.FC<AllServicesModalProps> = ({
  isOpen,
  onClose,
  onNavigate
}) => {
  const { language } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  // Selected language translation bundle (fallback to en if undefined)
  const currentLang = (language as Language) in ALL_SERVICES_I18N ? (language as Language) : 'en';
  const tr = ALL_SERVICES_I18N[currentLang];

  // Active dog info
  const activeDog = useMemo(() => {
    try {
      const savedPets = localStorage.getItem('WALWAL_PETS');
      if (savedPets) {
        const parsed = JSON.parse(savedPets);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const list = sanitizePetList(parsed, language);
          return list[0] || getMockDogs(language)[0];
        }
      }
    } catch (e) { }
    return getMockDogs(language)[0];
  }, [language, isOpen]);

  // Categories with unified icon styling and 4-language support
  const categories: ServiceCategory[] = useMemo(() => {
    const c = tr.categories;

    return [
      {
        id: 'ai_ar',
        items: [
          {
            id: 'ar',
            title: c.ai_ar.arTitle,
            desc: c.ai_ar.arDesc,
            icon: <Camera size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            badge: 'AI',
            action: () => {
              onNavigate('ar');
              onClose();
            }
          }
        ]
      },
      {
        id: 'walk_map',
        items: [
          {
            id: 'nearby',
            title: c.walk_map.nearbyTitle,
            desc: c.walk_map.nearbyDesc,
            icon: <MapPin size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onNavigate('nearby');
              onClose();
            }
          },
          {
            id: 'community',
            title: c.walk_map.communityTitle,
            desc: c.walk_map.communityDesc,
            icon: <Calendar size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onNavigate('community');
              onClose();
            }
          }
        ]
      },
      {
        id: 'feed_snaps',
        items: [
          {
            id: 'snaps',
            title: c.feed_snaps.snapsTitle,
            desc: c.feed_snaps.snapsDesc,
            icon: <Image size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onNavigate('snaps');
              onClose();
            }
          },
          {
            id: 'chat',
            title: c.feed_snaps.chatTitle,
            desc: c.feed_snaps.chatDesc,
            icon: <Users size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onNavigate('community');
              onClose();
            }
          }
        ]
      },
      {
        id: 'my_pet',
        items: [
          {
            id: 'profile',
            title: c.my_pet.profileTitle,
            desc: c.my_pet.profileDesc,
            icon: <Heart size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onNavigate('profile');
              onClose();
            }
          },
          {
            id: 'walk_history',
            title: c.my_pet.walkHistoryTitle,
            desc: c.my_pet.walkHistoryDesc,
            icon: <Award size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onNavigate('profile');
              onClose();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('walwal_open_walk_history'));
              }, 60);
            }
          }
        ]
      },
      {
        id: 'settings_system',
        items: [
          {
            id: 'settings',
            title: c.settings_system.settingsTitle,
            desc: c.settings_system.settingsDesc,
            icon: <Settings size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onNavigate('profile');
              onClose();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('walwal_open_settings'));
              }, 60);
            }
          },
          {
            id: 'admin',
            title: c.settings_system.adminTitle,
            desc: c.settings_system.adminDesc,
            icon: <Shield size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            badge: 'ADMIN',
            action: () => {
              onNavigate('admin');
              onClose();
            }
          },
          {
            id: 'faq',
            title: c.settings_system.faqTitle,
            desc: c.settings_system.faqDesc,
            icon: <HelpCircle size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onClose();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('walwal_open_legal', { detail: 'faq' }));
              }, 60);
            }
          },
          {
            id: 'feedback',
            title: c.settings_system.feedbackTitle,
            desc: c.settings_system.feedbackDesc,
            icon: <MessageSquare size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onClose();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('walwal_open_feedback'));
              }, 60);
            }
          },
          {
            id: 'terms',
            title: c.settings_system.termsTitle,
            desc: c.settings_system.termsDesc,
            icon: <FileText size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onClose();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('walwal_open_legal', { detail: 'terms' }));
              }, 60);
            }
          },
          {
            id: 'privacy',
            title: c.settings_system.privacyTitle,
            desc: c.settings_system.privacyDesc,
            icon: <Shield size={ICON_SIZE} color={UNIFIED_ICON_COLOR} />,
            action: () => {
              onClose();
              setTimeout(() => {
                window.dispatchEvent(new CustomEvent('walwal_open_legal', { detail: 'privacy' }));
              }, 60);
            }
          }
        ]
      }
    ];
  }, [tr, onNavigate, onClose]);

  // Search filter
  const filteredCategories = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return categories;

    return categories
      .map(cat => ({
        ...cat,
        items: cat.items.filter(
          item =>
            item.title.toLowerCase().includes(q) ||
            (item.desc && item.desc.toLowerCase().includes(q))
        )
      }))
      .filter(cat => cat.items.length > 0);
  }, [categories, searchQuery]);

  if (!isOpen) return null;

  return (
    <div className="all-services-overlay" onClick={onClose}>
      <div className="all-services-drawer" onClick={e => e.stopPropagation()}>
        {/* Drawer Header */}
        <div className="all-services-header">
          <div className="all-services-header-title">
            <h3>{tr.headerTitle}</h3>
          </div>
          <button className="all-services-close-btn" onClick={onClose} aria-label="닫기">
            <X size={24} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="all-services-search-wrap">
          <div className="all-services-search-box">
            <Search size={24} color="#c8c8c8" />
            <input
              type="text"
              placeholder={tr.searchPlaceholder}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
              >
                <X size={20} color="#c8c8c8" />
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="all-services-body">
          {/* Pet Info Banner */}
          {activeDog && (
            <div
              className="all-services-dog-banner"
              onClick={() => {
                onNavigate('profile');
                onClose();
              }}
            >
              <div className="all-services-dog-left">
                <img
                  src={activeDog.avatar}
                  alt={activeDog.name}
                  className="all-services-dog-avatar"
                />
                <div className="all-services-dog-info">
                  <h4>
                    {activeDog.name}
                    <span>({activeDog.breed || tr.petFallback})</span>
                  </h4>
                  <p>{activeDog.greeting || tr.greetingFallback}</p>
                </div>
              </div>
              <ChevronRight size={20} color="#CBD5E1" />
            </div>
          )}

          {/* Simple Categorized List */}
          {filteredCategories.length === 0 ? (
            <div className="all-services-empty">
              <p>{tr.noResults}</p>
            </div>
          ) : (
            filteredCategories.map(cat => (
              <div key={cat.id} className="all-services-category">


                <div className="all-services-list">
                  {cat.items.map(item => (
                    <div
                      key={item.id}
                      className="all-services-row-item"
                      onClick={item.action}
                    >
                      <div className="all-services-row-left">
                        <div className="all-services-icon-clean">
                          {item.icon}
                        </div>
                        <div className="all-services-row-text">
                          <div className="all-services-row-title">
                            <span>{item.title}</span>
                            {item.badge && (
                              <span className="all-services-item-badge">
                                {item.badge}
                              </span>
                            )}
                          </div>
                          {item.desc && (
                            <div className="all-services-row-desc">{item.desc}</div>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={20} color="#CBD5E1" />
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Minimal Footer */}
        <div className="all-services-footer">
          <div className="all-services-footer-ver">WalWal v1.3.0</div>
        </div>
      </div>
    </div>
  );
};
