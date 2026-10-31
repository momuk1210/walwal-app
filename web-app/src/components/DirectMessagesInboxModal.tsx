import React, { useState, useEffect } from 'react';
import { X, MessageSquare, Trash2 } from 'lucide-react';
import { useTranslation } from '../i18n/LanguageContext';
import { formatChatTime } from '../utils/timeUtils';
import {
  getAllConversationsList,
  deleteConversation,
  DirectConversation
} from '../services/directMessageService';
import { getDefaultDogAvatar } from '../data/mockDogs';
import '../styles/DirectMessagesInboxModal.css';

interface DirectMessagesInboxModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (targetDog: any) => void;
}

export const DirectMessagesInboxModal: React.FC<DirectMessagesInboxModalProps> = ({
  isOpen,
  onClose,
  onOpenChat
}) => {
  const { language } = useTranslation();
  const [conversations, setConversations] = useState<DirectConversation[]>([]);

  // Load and subscribe to message updates
  useEffect(() => {
    if (!isOpen) return;

    const loadConversations = () => {
      setConversations(getAllConversationsList());
    };

    loadConversations();

    const handleUpdate = () => {
      loadConversations();
    };

    window.addEventListener('walwal_messages_updated', handleUpdate);
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('walwal_messages_updated', handleUpdate);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (e: React.MouseEvent, conv: DirectConversation) => {
    e.stopPropagation();
    const dogName = conv.targetDog?.name || '반려견';
    const confirmText =
      language === 'ko'
        ? `${dogName} 보호자님과의 대화 내역을 삭제하시겠습니까?`
        : language === 'ja'
          ? `${dogName}の保護者とのメッセージを削除しますか？`
          : `Delete conversation with ${dogName}'s owner?`;

    if (window.confirm(confirmText)) {
      deleteConversation(conv.conversationId);
    }
  };

  return (
    <div
      className="dm-inbox-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="dm-inbox-container" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="dm-inbox-header">
          <div className="dm-inbox-header-title-box">
            <MessageSquare size={22} color="#FF9E58" />
            <h3 className="dm-inbox-header-title">
              {language === 'ko'
                ? '메세지함'
                : language === 'ja'
                  ? 'メッセージ一覧'
                  : 'Messages'}
            </h3>
          </div>
          <button
            type="button"
            className="dm-inbox-close-btn"
            onClick={onClose}
            aria-label="닫기"
          >
            <X size={22} />
          </button>
        </div>

        {/* Conversation List */}
        <div className="dm-inbox-list">
          {conversations.length === 0 ? (
            <div className="dm-inbox-empty">
              <div className="dm-inbox-empty-icon">
                <MessageSquare size={36} color="#CBD5E1" />
              </div>
              <h4>
                {language === 'ko'
                  ? '주고받은 메세지가 없습니다'
                  : language === 'ja'
                    ? 'メッセージ履歴がありません'
                    : 'No messages yet'}
              </h4>
              <p>
                {language === 'ko'
                  ? '피드나 이웃 강아지 프로필에서\n첫 메세지를 보내보세요!'
                  : language === 'ja'
                    ? 'フィードや近所のワンちゃんのプロフィールから\nメッセージを送ってみましょう！'
                    : 'Send a note from the feed or dog profile!'}
              </p>
            </div>
          ) : (
            conversations.map((conv) => {
              const dog = conv.targetDog;
              const avatar =
                dog.avatar ||
                getDefaultDogAvatar(dog.name || 'Dog');

              return (
                <div
                  key={conv.conversationId}
                  className="dm-inbox-item"
                  onClick={() => {
                    onOpenChat(dog);
                    onClose();
                  }}
                >
                  <img
                    src={avatar}
                    alt={dog.name}
                    className="dm-inbox-avatar"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        getDefaultDogAvatar(dog.name || 'Dog');
                    }}
                  />
                  <div className="dm-inbox-content">
                    <div className="dm-inbox-row-top">
                      <span className="dm-inbox-name">
                        {(dog.name || '').replace(/\s*(엄마|아빠|보호자|집사|맘|Mom|Dad|ママ|パパ)\s*$/gi, '').trim() || dog.name}
                      </span>
                      <span className="dm-inbox-time">
                        {formatChatTime(conv.lastUpdated, language)}
                      </span>
                    </div>
                    <div className="dm-inbox-snippet">
                      {conv.lastMessage || '...'}
                    </div>
                  </div>
                  <button
                    type="button"
                    className="dm-inbox-delete-btn"
                    title={language === 'ko' ? '대화 삭제' : 'Delete'}
                    onClick={(e) => handleDelete(e, conv)}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
