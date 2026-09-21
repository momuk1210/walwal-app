import React, { useState, useRef, useEffect } from 'react';
import { X, Send, MapPin, Users } from 'lucide-react';
import { WalkMeetup } from './CommunityView';
import { getMockDogs } from '../data/mockDogs';
import '../styles/OwnerNoteModal.css';

interface MeetupChatModalProps {
  meetup: WalkMeetup;
  onClose: () => void;
}

const MOCK_CHAT_HISTORY: Record<string, any[]> = {};

export const MeetupChatModal: React.FC<MeetupChatModalProps> = ({ meetup, onClose }) => {
  const [myDog] = useState(() => {
    try {
      const saved = localStorage.getItem('WALWAL_PETS');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.length > 0) return parsed[0];
      }
    } catch (e) { }
    return getMockDogs("ko")[0];
  });

  const [inputText, setInputText] = useState('');

  // Create some initial dummy messages based on participants
  const [messages, setMessages] = useState<Array<{ id: string; sender: any; text: string; time: string }>>(() => {
    if (MOCK_CHAT_HISTORY[meetup.id]) {
      return MOCK_CHAT_HISTORY[meetup.id];
    }

    const participants = meetup.participants || [];
    const dummyMessages = [];

    if (participants.length > 0) {
      dummyMessages.push({
        id: 'msg1',
        sender: participants[0],
        text: `안녕하세요! 다들 ${meetup.time}에 뵐 수 있는거죠? 🐶`,
        time: '오후 1:00'
      });
    }

    if (participants.length > 1) {
      dummyMessages.push({
        id: 'msg2',
        sender: participants[1],
        text: `네네! 저희 애가 너무 기대하고 있어요ㅎㅎ 장소는 ${meetup.location} 맞죠?`,
        time: '오후 1:05'
      });
    }

    if (participants.length > 0) {
      dummyMessages.push({
        id: 'msg3',
        sender: participants[0],
        text: `맞습니다! 도착하시면 톡방에 말씀해주세요~`,
        time: '오후 1:10'
      });
    }

    MOCK_CHAT_HISTORY[meetup.id] = dummyMessages;
    return dummyMessages;
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const newMessage = {
      id: `msg_${Date.now()}`,
      sender: myDog,
      text: inputText.trim(),
      time: '방금'
    };

    setMessages(prev => {
      const next = [...prev, newMessage];
      MOCK_CHAT_HISTORY[meetup.id] = next;
      return next;
    });
    setInputText('');
  };

  return (
    <div className="own-message-modal-overlay">
      <div className="own-message-modal-container">

        {/* Header */}
        <div className="own-message-modal-header row-between">
          <div className="row gap-10">
            <div className="own-message-modal-avatar-container">
              <img
                src={meetup.avatar}
                alt={meetup.title}
                className="own-message-modal-avatar"
              />
              <div className="own-message-modal-status-dot" />
            </div>
            <div>
              <div className="row gap-6">
                <span className="own-message-modal-owner-name">{meetup.title}</span>
                <span className="own-message-modal-distance" style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>

                  {meetup.participantsCount}명 참여 중
                </span>
              </div>
              <div className="own-message-modal-dog-info" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                <MapPin size={14} /> {meetup.location}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost own-message-modal-close-btn"
          >
            <X size={24} />
          </button>
        </div>

        {/* Message Stream */}
        <div className="own-message-modal-body">
          {messages.map((msg) => {
            const isMe = msg.sender.name === myDog.name && msg.sender.ownerName === myDog.ownerName;
            return (
              <div key={msg.id} className={`own-message-row ${isMe ? 'is-me' : 'is-target'}`}>
                {!isMe && (
                  <img src={msg.sender.avatar} alt="avatar" className="own-message-avatar" />
                )}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: isMe ? 'flex-end' : 'flex-start', maxWidth: '75%' }}>
                  {!isMe && (
                    <span style={{ fontSize: '0.75rem', color: '#718096', marginBottom: '4px', marginLeft: '4px', fontWeight: 600 }}>
                      {msg.sender.name} <span style={{ opacity: 0.7, fontWeight: 400 }}>{msg.sender.ownerName.replace(msg.sender.name, '').trim()}</span>
                    </span>
                  )}
                  <div className={`own-message-bubble ${isMe ? 'is-me' : 'is-target'}`} style={{ maxWidth: '100%' }}>
                    {msg.text && (
                      <div className={`own-message-text ${isMe ? 'is-me' : 'is-target'}`}>
                        {msg.text}
                      </div>
                    )}
                    <div className={`own-message-time ${isMe ? 'is-me' : 'is-target'}`}>
                      {msg.time}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="own-message-input-wrapper" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSend(); }}
            placeholder="메시지를 입력하세요..."
            className="own-message-input"
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputText.trim()}
            className="own-message-send-btn"
          >
            <Send size={16} />
          </button>
        </div>

      </div>
    </div>
  );
};
