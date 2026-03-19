import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { auditsApi } from '../api/audits';
import StatusChip from '../components/StatusChip';
import FindingCard from '../components/FindingCard';

const AuditDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const [audit, setAudit] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  const fetchAudit = async () => {
    try {
      const data = await auditsApi.getAudit(id!);
      setAudit(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load audit details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAudit();
    
    let interval: NodeJS.Timeout;
    if (audit?.status && ['queued', 'running'].includes(audit.status.toLowerCase())) {
      interval = setInterval(fetchAudit, 4000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [id, audit?.status]);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await auditsApi.downloadReport(id!);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Audit_Report_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed', err);
      alert('Failed to download report');
    } finally {
      setDownloading(false);
    }
  };

  if (loading && !audit) {
    return <div style={{ padding: '32px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>LOADING AUDIT RECORD...</div>;
  }

  if (error || !audit) {
    return <div style={{ padding: '32px', color: 'var(--red)' }}>{error || 'Audit not found'}</div>;
  }

  const isComplete = audit.status?.toLowerCase() === 'complete';
  const isActive = ['queued', 'running'].includes(audit.status?.toLowerCase());

  const findingsByCategory = (audit.findings || []).reduce((acc: any, f: any) => {
    const cat = f.category || 'Uncategorized';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(f);
    return acc;
  }, {});

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', minHeight: '100%' }}>
      <div style={{ marginBottom: '24px' }}>
        <Link to="/audits" style={{ color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
          ← All Audits
        </Link>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>{audit.targetName}</h1>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '13px', color: 'var(--text-muted)' }}>{audit.targetUrl}</div>
        </div>
        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
          <StatusChip status={audit.status} />
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', padding: '8px 16px' }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '10px', color: 'var(--text-muted)', marginBottom: '4px' }}>RISK SCORE</span>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 'bold', color: (audit.riskScore > 60 ? 'var(--red)' : audit.riskScore > 30 ? 'var(--amber)' : 'var(--green)') }}>
              {audit.riskScore ?? '—'}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
        {[
          { label: 'TOTAL FINDINGS', value: audit.findings?.length || 0, color: 'var(--text-primary)' },
          { label: 'CRITICAL', value: audit.findings?.filter((f: any) => f.severity === 'critical').length || 0, color: 'var(--red)' },
          { label: 'HIGH', value: audit.findings?.filter((f: any) => f.severity === 'high').length || 0, color: 'var(--amber)' },
          { label: 'CATEGORIES TESTED', value: audit.categories?.length || 0, color: 'var(--text-primary)' }
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '6px', padding: '16px' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>{stat.label}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '24px', fontWeight: 'bold', color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {isActive && (
        <div style={{ backgroundColor: 'rgba(217, 119, 6, 0.15)', border: '1px solid var(--amber)', borderRadius: '6px', padding: '16px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ animation: 'pulse 2s infinite' }}>⚡</span> AUDIT IN PROGRESS — Scanning target AI system...
          </div>
          <div style={{ color: 'var(--amber)', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            REAL-TIME ANALYSIS ACTIVE
          </div>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600, color: 'var(--text-primary)' }}>Audit Findings</h2>
        {isComplete && (
          <button 
            onClick={handleDownload}
            disabled={downloading}
            style={{ backgroundColor: 'transparent', color: 'var(--red)', border: '1px solid var(--red)', padding: '8px 16px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '12px', cursor: downloading ? 'not-allowed' : 'pointer' }}
          >
            {downloading ? 'GENERATING PDF...' : '↓ DOWNLOAD PDF REPORT'}
          </button>
        )}
      </div>

      <div style={{ flex: 1 }}>
        {isActive ? (
          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '64px', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-muted)' }}>Waiting for results...</div>
          </div>
        ) : audit.findings?.length === 0 ? (
          <div style={{ border: '1px solid var(--border)', borderRadius: '6px', padding: '64px', textAlign: 'center', backgroundColor: 'var(--bg-surface)' }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--green)' }}>NO VULNERABILITIES DETECTED</div>
          </div>
        ) : (
          Object.entries(findingsByCategory).map(([category, findings]: [string, any]) => (
            <div key={category} style={{ marginBottom: '32px' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px', letterSpacing: '1px' }}>
                {category.toUpperCase()} — {findings.length} FINDING{findings.length !== 1 ? 'S' : ''}
              </div>
              <div>
                {findings.map((f: any, idx: number) => (
                  <FindingCard key={idx} finding={f} />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ textAlign: 'center', marginTop: '48px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
        GENERATED BY REDFORGE AI ENGINE • SECURE ENVIRONMENT
      </div>
    </div>
  );
};

export default AuditDetailPage;
