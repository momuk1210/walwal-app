import React, { useState } from 'react';
import { AlertTriangle, X, Check, ShieldAlert } from 'lucide-react';
import { reportContent } from '../services/moderationService';
import '../styles/ReportModal.css';

export interface ReportModalTarget {
  type: 'post' | 'meetup' | 'comment' | 'chat';
  id: string;
  author: string;
  content: string;
}

interface ReportModalProps {
  target: ReportModalTarget | null;
  onClose: () => void;
  onSuccess?: () => void;
}

const REPORT_REASONS: Array<{ key: 'spam' | 'abuse' | 'inappropriate' | 'harassment' | 'other'; label: string; desc: string }> = [
  { key: 'abuse', label: '욕설, 비하 및 혐오 발언', desc: '타인 또는 반려견에 대한 공격적 언어' },
  { key: 'spam', label: '스팸, 광고 및 도배', desc: '상업적 홍보, 무의미한 반복 게시물' },
  { key: 'inappropriate', label: '음란물 또는 부적절한 콘텐츠', desc: '선정적이거나 폭력적인 사진/텍스트' },
  { key: 'harassment', label: '괴롭힘 또는 사생활 침해', desc: '개인정보 노출, 지속적 괴롭힘' },
  { key: 'other', label: '기타 사유', desc: '기타 커뮤니티 가이드라인 위반' }
];

export const ReportModal: React.FC<ReportModalProps> = ({ target, onClose, onSuccess }) => {
  const [selectedReason, setSelectedReason] = useState<'spam' | 'abuse' | 'inappropriate' | 'harassment' | 'other'>('abuse');
  const [customDetail, setCustomDetail] = useState('');
  const [blockAuthor, setBlockAuthor] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  if (!target) return null;

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);

    try {
      const reasonObj = REPORT_REASONS.find(r => r.key === selectedReason);
      await reportContent({
        targetType: target.type,
        targetId: target.id,
        targetAuthor: target.author,
        targetContent: target.content,
        reason: selectedReason,
        reasonText: customDetail.trim() ? `${reasonObj?.label}: ${customDetail.trim()}` : (reasonObj?.label || '신고'),
        blockAuthorAlso: blockAuthor
      });

      alert(blockAuthor
        ? `'${target.author}' 사용자가 차단되었으며 신고가 정상 접수되었습니다. 해당 사용자의 콘텐츠는 더 이상 표시되지 않습니다.`
        : '신고가 정상 접수되었습니다. 검토 후 24시간 이내에 조치됩니다.'
      );

      if (onSuccess) onSuccess();
      onClose();
    } catch (e) {
      console.error('Failed to report:', e);
      alert('신고 접수 중 오류가 발생했습니다. 다시 시도해 주세요.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div className="report-modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="report-modal-header">
          <div className="report-modal-title">
            <ShieldAlert size={22} color="#EF4444" />
            <span>콘텐츠 및 사용자 신고</span>
          </div>
          <button className="btn-ghost" onClick={onClose} aria-label="닫기">
            <X size={20} color="#64748B" />
          </button>
        </div>

        <div className="report-target-summary">
          <div style={{ fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
            작성자: {target.author || '알 수 없음'}
          </div>
          <div style={{ color: '#64748b', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            내용: "{target.content.slice(0, 60)}{target.content.length > 60 ? '...' : ''}"
          </div>
        </div>

        <div className="report-reasons-grid">
          <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#334155' }}>신고 사유를 선택해주세요</label>
          {REPORT_REASONS.map(r => (
            <button
              key={r.key}
              type="button"
              className={`report-reason-btn ${selectedReason === r.key ? 'selected' : ''}`}
              onClick={() => setSelectedReason(r.key)}
            >
              <div>
                <div>{r.label}</div>
                <div style={{ fontSize: '0.75rem', color: selectedReason === r.key ? '#ef4444' : '#94a3b8', fontWeight: 400 }}>{r.desc}</div>
              </div>
              {selectedReason === r.key && <Check size={18} color="#ef4444" />}
            </button>
          ))}
        </div>

        {selectedReason === 'other' && (
          <input
            type="text"
            className="form-input"
            placeholder="상세 사유를 입력해주세요 (선택)"
            value={customDetail}
            onChange={(e) => setCustomDetail(e.target.value)}
            style={{ fontSize: '0.85rem' }}
          />
        )}

        <label className="report-block-option">
          <input
            type="checkbox"
            checked={blockAuthor}
            onChange={(e) => setBlockAuthor(e.target.checked)}
          />
          <div>
            <strong>'{target.author}' 사용자 즉시 차단하기</strong>
            <div style={{ fontSize: '0.75rem', opacity: 0.85 }}>이 사용자의 모든 게시물, 모임, 댓글 및 채팅이 숨겨집니다.</div>
          </div>
        </label>

        <div className="report-modal-actions">
          <button type="button" className="report-btn-cancel" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="report-btn-submit"
            onClick={handleSubmit}
            disabled={submitting}
          >
            {submitting ? '접수 중...' : '신고 제출하기'}
          </button>
        </div>
      </div>
    </div>
  );
};
