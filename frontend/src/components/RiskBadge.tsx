import React from 'react';

interface RiskBadgeProps {
  score?: number;
}

const RiskBadge: React.FC<RiskBadgeProps> = ({ score }) => {
  if (score === undefined || score === null) {
    return (
      <span style={{
        fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '2px 8px',
        borderRadius: '4px', border: '1px solid var(--border)', color: 'var(--text-muted)'
      }}>
        —
      </span>
    );
  }

  let color = 'var(--text-primary)';
  let borderColor = 'var(--border)';
  if (score >= 0 && score <= 30) {
    color = 'var(--green)';
    borderColor = 'var(--green)';
  } else if (score > 30 && score <= 60) {
    color = 'var(--amber)';
    borderColor = 'var(--amber)';
  } else if (score > 60) {
    color = 'var(--red)';
    borderColor = 'var(--red)';
  }

  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '12px', padding: '2px 8px',
      borderRadius: '4px', border: `1px solid ${borderColor}`, color: color
    }}>
      {score}
    </span>
  );
};

export default RiskBadge;
