import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  Plus,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  X,
  Check,
  Trash2,
  Send,
  CornerDownRight,
  MessageSquare
} from 'lucide-react';
import { useTranslation, Language } from '../i18n/LanguageContext';
import { db, auth } from '../firebase';
import {
  collection,
  onSnapshot,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy
} from 'firebase/firestore';
import '../styles/ServiceFeedbackModal.css';

interface ServiceFeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FeedbackItem {
  id: string;
  content: string;
  photoUrl?: string;
  authorName: string;
  status: 'pending' | 'answered';
  adminReply?: string;
  adminReplyAt?: any;
  dateStr: string;
  createdAt?: any;
}

const INITIAL_MOCK_FEEDBACKS: FeedbackItem[] = [
  {
    id: 'fb-1',
    content: '반려견 프로필 등록 시 사진 크롭 기능과 회전 기능이 지원되면 좋겠어요!',
    authorName: '딸기맘',
    status: 'answered',
    adminReply: '안녕하세요 보호자님! 소중한 의견 감사드립니다. 현재 프로필 사진 등록 시 자동으로 원형 크롭 및 중앙 맞춤 기능이 적용되어 있으며, 추후 수동 회전 및 자유 크롭 도구도 업데이트 예정입니다.',
    dateStr: '2026.10.05'
  },
  {
    id: 'fb-2',
    content: '동네 산책 모임 개설할 때 모임 최대 인원수 설정 기능이 있으면 좋겠습니다.',
    authorName: '보리누나',
    status: 'answered',
    adminReply: '모임 정원 설정 기능이 최신 버전에 추가되었습니다! 모임 만들기 시 최대 인원을 설정하실 수 있습니다.',
    dateStr: '2026.10.04'
  },
  {
    id: 'fb-3',
    content: '야간 산책 시 어두운 곳에서도 안전하게 산책할 수 있도록 야간 모드 산책로 추천 기능이 있으면 좋겠어요.',
    authorName: '초코아빠',
    status: 'pending',
    dateStr: '2026.10.03'
  }
];

export const ServiceFeedbackModal: React.FC<ServiceFeedbackModalProps> = ({
  isOpen,
  onClose
}) => {
  const { language } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Admin Check
  const currentUser = auth.currentUser;
  const isDaisynara = useMemo(() => {
    const email = (currentUser?.email || localStorage.getItem('WALWAL_USER_EMAIL') || '').toLowerCase().trim();
    return email === 'daisynara@gmail.com' || email.includes('daisynara') || localStorage.getItem('WALWAL_ADMIN_AUTH') === 'true';
  }, [currentUser]);

  // Feedbacks State
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>(() => {
    try {
      const saved = localStorage.getItem('WALWAL_FEEDBACKS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) { }
    return INITIAL_MOCK_FEEDBACKS;
  });

  // UI States
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newContent, setNewContent] = useState('');
  const [newPhoto, setNewPhoto] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Admin Reply Inputs map
  const [adminReplyTexts, setAdminReplyTexts] = useState<Record<string, string>>({});

  // Realtime Firestore Subscription
  useEffect(() => {
    if (!isOpen) return;

    try {
      const q = query(collection(db, 'feedback'), orderBy('createdAt', 'desc'));
      const unsub = onSnapshot(q, (snapshot) => {
        if (!snapshot.empty) {
          const list: FeedbackItem[] = [];
          snapshot.forEach(docSnap => {
            const data = docSnap.data();
            list.push({
              id: docSnap.id,
              content: data.content || '',
              photoUrl: data.photoUrl || undefined,
              authorName: data.authorName || '익명 보호자',
              status: data.status || (data.adminReply ? 'answered' : 'pending'),
              adminReply: data.adminReply || undefined,
              adminReplyAt: data.adminReplyAt || undefined,
              dateStr: data.dateStr || (data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0].replace(/-/g, '.') : '2026.10.05'),
              createdAt: data.createdAt
            });
          });
          setFeedbacks(list);
          localStorage.setItem('WALWAL_FEEDBACKS', JSON.stringify(list));
        }
      }, (err) => {
        console.warn('Firestore feedback listener error:', err);
      });

      return () => unsub();
    } catch (e) {
      console.warn('Firestore subscription failed, using local:', e);
    }
  }, [isOpen]);

  // Handle Photo Select
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setNewPhoto(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Feedback
  const handleSubmitFeedback = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim() || isSubmitting) return;

    setIsSubmitting(true);
    const today = new Date();
    const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

    // Get current author name from active pet or user email
    let authorName = '댕댕이 보호자';
    try {
      const savedPets = localStorage.getItem('WALWAL_PETS');
      if (savedPets) {
        const parsed = JSON.parse(savedPets);
        if (Array.isArray(parsed) && parsed[0]?.name) {
          authorName = `${parsed[0].name} 보호자`;
        }
      }
    } catch (e) { }

    const newItem: FeedbackItem = {
      id: 'fb-' + Date.now(),
      content: newContent.trim(),
      photoUrl: newPhoto || undefined,
      authorName,
      status: 'pending',
      dateStr
    };

    // Optimistic local update
    const updated = [newItem, ...feedbacks];
    setFeedbacks(updated);
    localStorage.setItem('WALWAL_FEEDBACKS', JSON.stringify(updated));

    // Save to Firestore
    try {
      await addDoc(collection(db, 'feedback'), {
        content: newItem.content,
        photoUrl: newItem.photoUrl || null,
        authorName: newItem.authorName,
        status: 'pending',
        dateStr,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Failed to save feedback to Firestore:', err);
    }

    setNewContent('');
    setNewPhoto(null);
    setShowCreateForm(false);
    setIsSubmitting(false);
    alert(language === 'ko' ? '소중한 의견이 등록되었습니다. 감사합니다!' : 'Your feedback has been submitted. Thank you!');
  };

  // Admin Reply Save
  const handleSaveAdminReply = async (item: FeedbackItem) => {
    const replyText = adminReplyTexts[item.id]?.trim();
    if (!replyText) return;

    const updated = feedbacks.map(f => {
      if (f.id === item.id) {
        return {
          ...f,
          adminReply: replyText,
          status: 'answered' as const,
          adminReplyAt: '방금 전'
        };
      }
      return f;
    });

    setFeedbacks(updated);
    localStorage.setItem('WALWAL_FEEDBACKS', JSON.stringify(updated));

    try {
      await updateDoc(doc(db, 'feedback', item.id), {
        adminReply: replyText,
        status: 'answered',
        adminReplyAt: serverTimestamp()
      });
    } catch (err) {
      console.warn('Failed to update admin reply:', err);
    }

    setAdminReplyTexts(prev => ({ ...prev, [item.id]: '' }));
    alert(language === 'ko' ? '답변이 등록되었습니다.' : 'Reply saved successfully.');
  };

  // Delete Feedback
  const handleDeleteFeedback = async (item: FeedbackItem) => {
    if (!window.confirm(language === 'ko' ? '이 개선 요청을 삭제하시겠습니까?' : 'Delete this feedback?')) return;

    const filtered = feedbacks.filter(f => f.id !== item.id);
    setFeedbacks(filtered);
    localStorage.setItem('WALWAL_FEEDBACKS', JSON.stringify(filtered));

    try {
      await deleteDoc(doc(db, 'feedback', item.id));
    } catch (err) {
      console.warn('Failed to delete feedback:', err);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="feedback-modal-overlay" onClick={onClose}>
      <div className="feedback-modal-container" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="feedback-header">
          <div className="feedback-header-left">
            <button className="feedback-back-btn" onClick={onClose} aria-label="뒤로가기">
              <ArrowLeft size={22} />
            </button>
            <h2 className="feedback-title">
              {language === 'ko' ? '서비스 개선' : language === 'ja' ? 'サービス改善' : language === 'es' ? 'Mejora del servicio' : language === 'zh' ? '意见反馈' : language === 'fr' ? 'Amélioration du service' : 'Service Feedback'}
            </h2>
          </div>
        </div>

        {/* Content Area */}
        <div className="feedback-content">
          {/* Subtitle */}
          <p className="feedback-subtitle">
            {language === 'ko'
              ? '왈왈을 위한 소중한 의견을 들려주세요!'
              : language === 'zh'
                ? '请留下您对WalWal的宝贵意见与建议！'
                : language === 'ja'
                  ? 'WalWal向上のためのご意見をお聞かせください！'
                  : language === 'es'
                    ? '¡Comparte tus valiosas sugerencias para WalWal!'
                    : language === 'fr'
                      ? 'Partagez vos précieuses idées pour améliorer WalWal !'
                      : 'Share your valuable ideas to improve WalWal!'}
          </p>

          {/* Primary Action Button: + 개선 요청하기 */}
          {!showCreateForm && (
            <button
              className="feedback-open-btn"
              onClick={() => setShowCreateForm(true)}
            >
              <Plus size={18} />
              <span>
                {language === 'ko'
                  ? '개선 요청하기'
                  : language === 'zh'
                    ? '提交反馈建议'
                    : language === 'ja'
                      ? '改善をリクエスト'
                      : language === 'es'
                        ? 'Solicitar mejora'
                        : language === 'fr'
                          ? 'Proposer une amélioration'
                          : 'Submit Feedback'}
              </span>
            </button>
          )}

          {/* Collapsible Write Form */}
          {showCreateForm && (
            <form className="feedback-form-card" onSubmit={handleSubmitFeedback}>
              <textarea
                className="feedback-textarea"
                placeholder={
                  language === 'ko'
                    ? '개선 요청 사항을 입력해주세요.'
                    : language === 'zh'
                      ? '请输入您的改进建议或功能需求...'
                      : language === 'ja'
                        ? '改善のご要望を入力してください。'
                        : language === 'es'
                          ? 'Ingresa tus sugerencias o mejoras...'
                          : language === 'fr'
                            ? "Entrez vos suggestions d'amélioration..."
                            : 'Enter your feedback or feature request...'
                }
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                autoFocus
                required
              />

              {/* Photo Preview if attached */}
              {newPhoto && (
                <div className="feedback-preview-wrap">
                  <img src={newPhoto} alt="Attachment" className="feedback-preview-img" />
                  <button
                    type="button"
                    className="feedback-preview-remove"
                    onClick={() => setNewPhoto(null)}
                    title="사진 제거"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}

              {/* Hidden File Input */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                style={{ display: 'none' }}
                onChange={handlePhotoSelect}
              />

              {/* Attach Photo Button */}
              <button
                type="button"
                className="feedback-attach-btn"
                onClick={() => fileInputRef.current?.click()}
              >
                <ImageIcon size={18} color="#64748B" />
                <span>
                  {newPhoto
                    ? (language === 'ko' ? '사진 변경' : language === 'zh' ? '更换照片' : language === 'ja' ? '写真を変更' : language === 'fr' ? 'Changer la photo' : language === 'es' ? 'Cambiar foto' : 'Change Photo')
                    : (language === 'ko' ? '사진 첨부' : language === 'zh' ? '添加照片' : language === 'ja' ? '写真を添付' : language === 'fr' ? 'Joindre une photo' : language === 'es' ? 'Adjuntar foto' : 'Attach Photo')}
                </span>
              </button>

              {/* Action Buttons: 취소 & 등록하기 */}
              <div className="feedback-form-actions">
                <button
                  type="button"
                  className="feedback-cancel-btn"
                  onClick={() => {
                    setShowCreateForm(false);
                    setNewContent('');
                    setNewPhoto(null);
                  }}
                >
                  {language === 'ko' ? '취소' : language === 'zh' ? '取消' : language === 'ja' ? 'キャンセル' : language === 'es' ? 'Cancelar' : language === 'fr' ? 'Annuler' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="feedback-submit-btn"
                  disabled={!newContent.trim() || isSubmitting}
                >
                  {language === 'ko' ? '등록하기' : language === 'zh' ? '提交' : language === 'ja' ? '送信' : language === 'es' ? 'Enviar' : language === 'fr' ? 'Envoyer' : 'Submit'}
                </button>
              </div>
            </form>
          )}

          {/* Feedback Accordion List */}
          <div className="feedback-list">
            {feedbacks.map(item => {
              const isExpanded = expandedId === item.id;
              const isAnswered = item.status === 'answered' || Boolean(item.adminReply);

              return (
                <div key={item.id} className="feedback-card">
                  <div
                    className="feedback-card-header"
                    onClick={() => setExpandedId(isExpanded ? null : item.id)}
                  >
                    <div className="feedback-card-left">
                      {/* Status Badge */}
                      <span className={`feedback-badge ${isAnswered ? 'answered' : 'pending'}`}>
                        {isAnswered
                          ? (language === 'ko' ? '답변완료' : language === 'zh' ? '已回复' : language === 'ja' ? '回答済み' : language === 'es' ? 'Respondido' : language === 'fr' ? 'Répondu' : 'Answered')
                          : (language === 'ko' ? '접수됨' : language === 'zh' ? '已受理' : language === 'ja' ? '受付済み' : language === 'es' ? 'Recibido' : language === 'fr' ? 'Reçu' : 'Received')}
                      </span>

                      {/* Snippet / Title */}
                      <div className="feedback-item-title-box">
                        <h4 className="feedback-item-title">
                          {item.content.split('\n')[0]}
                        </h4>
                        <div className="feedback-item-meta">
                          <span>{item.authorName}</span>
                          <span>·</span>
                          <span>{item.dateStr}</span>
                        </div>
                      </div>
                    </div>

                    {isExpanded ? (
                      <ChevronUp size={18} color="#94A3B8" />
                    ) : (
                      <ChevronDown size={18} color="#94A3B8" />
                    )}
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="feedback-card-body">
                      <div className="feedback-card-text">
                        {item.content}
                      </div>

                      {item.photoUrl && (
                        <img
                          src={item.photoUrl}
                          alt="Attached"
                          className="feedback-card-attached-img"
                        />
                      )}

                      {/* Admin Reply Box if present */}
                      {item.adminReply && (
                        <div className="feedback-reply-box">
                          <div className="feedback-reply-header">
                            <span className="feedback-reply-badge">
                              {language === 'ko' ? '관리자 답변' : language === 'zh' ? '管理员回复' : language === 'ja' ? '管理者からの回答' : language === 'es' ? 'Respuesta del administrador' : language === 'fr' ? 'Réponse administrateur' : 'Admin Reply'}
                            </span>
                            <span className="feedback-reply-time">
                              {item.adminReplyAt?.toDate ? item.adminReplyAt.toDate().toISOString().split('T')[0].replace(/-/g, '.') : '2026.10.05'}
                            </span>
                          </div>
                          <div className="feedback-reply-text">
                            {item.adminReply}
                          </div>
                        </div>
                      )}

                      {/* Admin Inline Reply Tool (for Daisynara / Admin) */}
                      {isDaisynara && (
                        <div className="feedback-admin-write-box">
                          <div className="feedback-admin-write-title">
                            관리자 답변 작성 / 수정
                          </div>
                          <textarea
                            className="feedback-admin-textarea"
                            placeholder="사용자에게 전달할 답변을 입력하세요..."
                            value={adminReplyTexts[item.id] !== undefined ? adminReplyTexts[item.id] : (item.adminReply || '')}
                            onChange={e => setAdminReplyTexts({ ...adminReplyTexts, [item.id]: e.target.value })}
                          />
                          <div className="feedback-admin-actions">
                            <button
                              type="button"
                              className="feedback-delete-btn"
                              onClick={() => handleDeleteFeedback(item)}
                            >
                              <Trash2 size={18} /> 삭제
                            </button>
                            <button
                              type="button"
                              className="feedback-admin-btn"
                              onClick={() => handleSaveAdminReply(item)}
                            >
                              답변 저장
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
