import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { auditsApi } from '../api/audits';
import StatusChip from '../components/StatusChip';
import RiskBadge from '../components/RiskBadge';

const AuditListPage = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [filter, setFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchAudits = async () => {
    try {
      const data = await auditsApi.listAudits();
      setAudits(data || []);
    } catch (error) {
      console.error('Failed to fetch audits:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudits();
    
    const interval = setInterval(() => {
      setAudits(current => {
        const needsPolling = current.some(a => ['queued', 'running'].includes(a.status?.toLowerCase()));
        if (needsPolling) fetchAudits();
        return current;
      });
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const filteredAudits = filter === 'ALL' 
    ? audits 
    : audits.filter(a => a.status?.toUpperCase() === filter);

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>Audit Operations</h1>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '4px 8px', backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)' }}>
            ◉ REDFORGE AI
          </span>
        </div>
        <button 
          onClick={() => navigate('/audits/new')}
          style={{ backgroundColor: 'var(--red)', color: '#fff', border: 'none', padding: '10px 16px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + NEW AUDIT
        </button>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', borderBottom: '1px solid var(--border)', paddingBottom: '12px' }}>
        {['ALL', 'QUEUED', 'RUNNING', 'COMPLETE', 'FAILED'].map(t => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            style={{
              background: 'transparent',
              border: 'none',
              padding: '6px 12px',
              fontFamily: 'var(--font-mono)',
              fontSize: '12px',
              color: filter === t ? 'var(--text-primary)' : 'var(--text-muted)',
              borderBottom: filter === t ? '2px solid var(--red)' : '2px solid transparent',
              cursor: 'pointer'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>LOADING...</div>
      ) : filteredAudits.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ border: '1px dashed var(--border)', padding: '48px', borderRadius: '8px', textAlign: 'center', maxWidth: '400px' }}>
            <Target size={32} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', marginBottom: '16px' }}>NO ADDITIONAL AUDITS ACTIVE</div>
            <button 
              onClick={() => navigate('/audits/new')}
              style={{ background: 'transparent', border: 'none', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '13px', cursor: 'pointer', textDecoration: 'underline' }}
            >
              RUN YOUR FIRST AUDIT →
            </button>
          </div>
        </div>
      ) : (
        <div style={{ flex: 1, overflow: 'auto', border: '1px solid var(--border)', borderRadius: '6px', backgroundColor: 'var(--bg-surface)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-raised)' }}>
                {['TARGET', 'URL / ENDPOINT', 'CATEGORIES', 'STATUS', 'RISK SCORE'].map(h => (
                  <th key={h} style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', fontWeight: 'normal' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredAudits.map((a, i) => (
                <tr 
                  key={a._id || a.id} 
                  onClick={() => navigate(`/audits/${a._id || a.id}`)}
                  style={{ 
                    borderBottom: '1px solid var(--border)', 
                    backgroundColor: i % 2 === 0 ? 'var(--bg-base)' : 'var(--bg-surface)',
                    cursor: 'pointer'
                  }}
                >
                  <td style={{ padding: '16px', fontWeight: 500, color: 'var(--text-primary)' }}>{a.targetName}</td>
                  <td style={{ padding: '16px', fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-secondary)' }}>{a.targetUrl}</td>
                  <td style={{ padding: '16px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {a.categories?.map((c: string) => (
                        <span key={c} style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', padding: '2px 6px', backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-secondary)' }}>
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ padding: '16px' }}><StatusChip status={a.status} /></td>
                  <td style={{ padding: '16px' }}><RiskBadge score={a.riskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: 'var(--green)' }}></div>
          SYSTEM HEALTH: OPTIMAL
        </div>
        <div>LAST SCAN: 2m AGO</div>
      </div>
    </div>
  );
};

export default AuditListPage;
