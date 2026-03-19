import React from 'react';

interface StatusChipProps {
  status: string;
}

const StatusChip: React.FC<StatusChipProps> = ({ status }) => {
  const s = status?.toLowerCase() || '';
  let bgColor = 'var(--bg-surface)';
  let color = 'var(--text-primary)';
  let borderColor = 'var(--border)';
  let label = s.toUpperCase();

  switch (s) {
    case 'queued':
      bgColor = 'rgba(96, 96, 160, 0.15)';
      borderColor = '#6060A0';
      color = '#8A8AD0';
      label = 'QUEUED';
      break;
    case 'running':
      bgColor = 'rgba(217, 119, 6, 0.15)';
      borderColor = 'var(--amber)';
      color = 'var(--amber)';
      label = 'RUNNING';
      break;
    case 'complete':
      bgColor = 'rgba(22, 163, 74, 0.15)';
      borderColor = 'var(--green)';
      color = 'var(--green)';
      label = 'COMPLETE';
      break;
    case 'failed':
      bgColor = 'rgba(220, 38, 38, 0.15)';
      borderColor = 'var(--red)';
      color = 'var(--red)';
      label = 'FAILED';
      break;
    default:
      label = status ? status.toUpperCase() : 'UNKNOWN';
  }

  return (
    <span style={{
      fontFamily: 'var(--font-mono)', fontSize: '11px', padding: '2px 6px',
      borderRadius: '4px', border: `1px solid ${borderColor}`,
      backgroundColor: bgColor, color: color, fontWeight: 'bold'
    }}>
      {label}
    </span>
  );
};

export default StatusChip;
