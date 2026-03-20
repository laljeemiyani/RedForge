import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { auditsApi } from '../api/audits';
import RiskBadge from '../components/RiskBadge';

const ReportsPage = () => {
  const [audits, setAudits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const data = await auditsApi.listAudits();
        const completed = (data || []).filter((a: any) => a.status?.toLowerCase() === 'complete');
        setAudits(completed);
      } catch (error) {
        console.error('Failed to fetch reports:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAudits();
  }, []);

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>Security Reports</h1>
        <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '4px 8px', backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-muted)' }}>
          COMPLETED AUDITS
        </span>
      </div>

      {loading ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>LOADING REPORTS...</div>
      ) : audits.length === 0 ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ border: '1px dashed var(--border)', padding: '48px', borderRadius: '8px', textAlign: 'center', maxWidth: '400px' }}>
            <FileText size={32} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
            <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>NO REPORTS AVAILABLE</div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {audits.map((a) => (
            <div key={a._id || a.id} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '24px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{a.targetName}</h3>
                <RiskBadge score={a.riskScore} />
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '24px', wordBreak: 'break-all' }}>
                {a.targetUrl}
              </div>
              <button 
                onClick={() => navigate(`/app/audits/${a._id || a.id}`)}
                style={{ marginTop: 'auto', backgroundColor: 'transparent', border: '1px solid var(--red)', color: 'var(--red)', padding: '8px 16px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px', cursor: 'pointer', textAlign: 'center' }}
              >
                VIEW REPORT →
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReportsPage;
