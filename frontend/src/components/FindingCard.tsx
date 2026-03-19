import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface TranscriptEntry {
  role: string;
  content: string;
}

interface Finding {
  severity: string;
  title: string;
  category: string;
  transcript?: TranscriptEntry[];
  remediation?: string;
  description?: string;
}

interface FindingCardProps {
  finding: Finding;
}

const FindingCard: React.FC<FindingCardProps> = ({ finding }) => {
  const [expanded, setExpanded] = useState(false);
  const severity = finding.severity?.toLowerCase() || 'low';
  
  let borderColor = 'var(--green)';
  let badgeColor = 'var(--green)';
  
  if (severity === 'critical') {
    borderColor = 'var(--red)';
    badgeColor = 'var(--red)';
  } else if (severity === 'high') {
    borderColor = 'var(--amber)';
    badgeColor = 'var(--amber)';
  } else if (severity === 'medium') {
    borderColor = 'var(--blue)';
    badgeColor = 'var(--blue)';
  }

  const isBadResponse = (text: string) => {
    const upp = text.toUpperCase();
    return upp.includes('PWNED') || upp.includes('COMPROMISED');
  };

  return (
    <div style={{
      backgroundColor: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      borderLeft: `4px solid ${borderColor}`,
      borderRadius: '4px',
      marginBottom: '12px',
      overflow: 'hidden'
    }}>
      <div 
        onClick={() => setExpanded(!expanded)}
        style={{
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          gap: '12px'
        }}
      >
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: '11px', fontWeight: 'bold',
          padding: '2px 6px', borderRadius: '4px', backgroundColor: 'var(--bg-raised)',
          color: badgeColor, border: `1px solid var(--border)`
        }}>
          {finding.severity?.toUpperCase() || 'LOW'}
        </span>
        <strong style={{ flex: 1, color: 'var(--text-primary)' }}>{finding.title || 'Untitled Finding'}</strong>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          {finding.category || 'UNCATEGORIZED'}
        </span>
        {expanded ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </div>

      {expanded && (
        <div style={{ padding: '0 16px 16px', borderTop: '1px solid var(--border)', marginTop: '4px', paddingTop: '16px' }}>
          {finding.description && (
            <div style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>
              {finding.description}
            </div>
          )}
          
          {finding.transcript && finding.transcript.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>PLAYBACK TRANSCRIPT</div>
              {finding.transcript.map((msg, idx) => {
                const isUser = msg.role?.toLowerCase() === 'user';
                let contentColor = 'var(--text-primary)';
                if (!isUser) {
                  contentColor = isBadResponse(msg.content) ? 'var(--red)' : 'var(--green)';
                }

                return (
                  <div key={idx} style={{
                    backgroundColor: 'var(--bg-raised)',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    padding: '12px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '12px',
                    wordBreak: 'break-word',
                    whiteSpace: 'pre-wrap'
                  }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '10px', marginBottom: '6px' }}>
                      [{msg.role?.toUpperCase() || 'UNKNOWN'}]
                    </div>
                    <div style={{ color: contentColor }}>
                      {msg.content}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {finding.remediation && (
            <div style={{ backgroundColor: 'var(--bg-raised)', padding: '12px', borderRadius: '4px', border: '1px solid var(--border)' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>REMEDIATION</div>
              <div style={{ color: 'var(--text-secondary)' }}>{finding.remediation}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default FindingCard;
