import React, { useState } from 'react';
import { X, Sparkles, Share2, Users } from 'lucide-react';
import { DogProfile } from '../data/mockDogs';
import confetti from 'canvas-confetti';

interface VirtualChatModalProps {
  dog1: DogProfile;
  dog2: DogProfile;
  onClose: () => void;
  onExportToStudio: (dog: DogProfile, thought: string) => void;
}

export const VirtualChatModal: React.FC<VirtualChatModalProps> = ({
  dog1,
  dog2,
  onClose,
  onExportToStudio
}) => {
  const [messages, setMessages] = useState<Array<{ sender: DogProfile; text: string; time: string }>>([
    {
      sender: dog1,
      text: `어이 ${dog2.name}! 너 방금 저기 잔디밭에서 영역 표시한 거 봤다. 냄새 꽤 센데?`,
      time: '방금'
    },
    {
      sender: dog2,
      text: `흥, 당연하지! ${dog2.breed}의 프라이드다. 너나 발밑 조심해라, 내가 어제 뼈다귀 묻어둔 곳이니까.`,
      time: '방금'
    }
  ]);

  const [simulating, setSimulating] = useState<boolean>(false);

  const generateNextTurn = () => {
    setSimulating(true);
    setTimeout(() => {
      const turns = [
        {
          dog: dog1,
          text: `근데 너 집사 가방에 닭가슴살 냄새나는 거 나 다 안다. 나눠먹을 생각 없냐?`
        },
        {
          dog: dog2,
          text: `꿈 깨시바! 우리 집사가 나 약 먹일 때만 주는 귀한 거다 멍멍!`
        },
        {
          dog: dog1,
          text: `칫... 그럼 이따가 서울숲 분수대 앞 벤치에서 정모 산책이나 하자! 우리 집사 끌고 갈게.`
        }
      ];

      const nextItem = turns[messages.length % turns.length];
      setMessages(prev => [
        ...prev,
        {
          sender: nextItem.dog,
          text: nextItem.text,
          time: '방금'
        }
      ]);
      setSimulating(false);

      confetti({
        particleCount: 20,
        spread: 40,
        origin: { y: 0.5 }
      });
    }, 800);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: '#F8F9FB',
      zIndex: 3000,
      display: 'flex',
      flexDirection: 'column',
      padding: '20px 16px 24px 16px',
      overflow: 'hidden',
      boxSizing: 'border-box'
    }}>
      {/* Modal Header */}
      <div className="row-between mb-16">
        <div className="row gap-8">
          <Sparkles size={20} color="#FF9E58" />
          <div>
            <h3 className="title-md">{dog1.name} & {dog2.name} 가상 티키타카</h3>
            <p className="text-sub">AI가 두 반려견의 성향을 분석해 시뮬레이션한 대화입니다</p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="btn-ghost"
          style={{ background: 'rgba(255,255,255,0.1)', borderRadius: '50%', width: '32px', height: '32px', justifyContent: 'center', color: '#333' }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Dog Duel Header Bar */}
      <div className="card row-between mb-16" style={{ padding: '12px 16px' }}>
        <div className="row gap-8">
          <img src={dog1.avatar} alt={dog1.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #FF9E58' }} />
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#FF9E58' }}>{dog1.name}</div>
            <div className="text-sub">{dog1.personality[0]}</div>
          </div>
        </div>

        <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#FFBF00', background: 'rgba(255,191,0,0.15)', padding: '3px 10px', borderRadius: '12px' }}>
          VS
        </div>

        <div className="row gap-8" style={{ flexDirection: 'row-reverse' }}>
          <img src={dog2.avatar} alt={dog2.name} style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #2EC4B6' }} />
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#2EC4B6' }}>{dog2.name}</div>
            <div className="text-sub">{dog2.personality[0]}</div>
          </div>
        </div>
      </div>

      {/* Chat Dialogue Stream */}
      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px', paddingRight: '4px' }}>
        {messages.map((msg, i) => {
          const isDog1 = msg.sender.id === dog1.id;
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                justifyContent: isDog1 ? 'flex-start' : 'flex-end',
                gap: '8px',
                alignItems: 'flex-start'
              }}
            >
              {isDog1 && (
                <img src={dog1.avatar} alt={dog1.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
              <div style={{
                maxWidth: '78%',
                background: isDog1 ? 'rgba(255, 126, 54, 0.15)' : 'rgba(46, 196, 182, 0.15)',
                border: isDog1 ? '1px solid rgba(255, 126, 54, 0.4)' : '1px solid rgba(46, 196, 182, 0.4)',
                borderRadius: isDog1 ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
                padding: '12px 14px'
              }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 800, color: isDog1 ? '#FF9E58' : '#2EC4B6', marginBottom: '3px' }}>
                  {msg.sender.name}
                </div>
                <div style={{ fontSize: '0.88rem', color: '#333', lineHeight: 1.4 }}>
                  {msg.text}
                </div>
              </div>
              {!isDog1 && (
                <img src={dog2.avatar} alt={dog2.name} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
              )}
            </div>
          );
        })}
      </div>

      {/* Action Footer */}
      <div className="col mt-16 gap-8">
        <button
          onClick={generateNextTurn}
          disabled={simulating}
          className="glow-btn"
          style={{
            background: 'linear-gradient(135deg, #FF9E58, #FFBF00)',
            border: 'none',
            borderRadius: '16px',
            padding: '12px',
            color: '#333',
            fontSize: '0.85rem',
            fontWeight: 800,
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            fontFamily: 'inherit'
          }}
        >
          <Sparkles size={16} />
          {simulating ? '티키타카 대사 생성 중...' : '다음 대화 턴 이어가기'}
        </button>

        <div className="row gap-8">
          <button
            onClick={() => {
              const lastMsg = messages[messages.length - 1];
              onExportToStudio(lastMsg.sender, lastMsg.text);
              onClose();
            }}
            className="card"
            style={{
              flex: 1,
              padding: '10px',
              color: '#2EC4B6',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              fontFamily: 'inherit'
            }}
          >
            <Share2 size={14} />
            웹툰 카드로 박제하기
          </button>

          <button
            onClick={() => {
              alert(`${dog2.ownerName} 엄마/아빠님께 산책 모임 제안 알림을 보냈습니다!`);
            }}
            className="card"
            style={{
              flex: 1,
              padding: '10px',
              color: '#FFBF00',
              fontSize: '0.75rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              gap: '6px',
              border: 'none',
              fontFamily: 'inherit'
            }}
          >
            <Users size={14} />
            엄마/아빠 산책 매칭하기
          </button>
        </div>
      </div>
    </div>
  );
};
