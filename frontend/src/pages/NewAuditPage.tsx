import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditsApi } from '../api/audits';

const NewAuditPage = () => {
  const [targetName, setTargetName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [modules, setModules] = useState({
    prompt_injection: true,
    jailbreak: true,
    data_leakage: true
  });
  const [authHeaders, setAuthHeaders] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!targetUrl.startsWith('http')) {
      return setError('Target URL must start with http:// or https://');
    }
    
    if (!modules.prompt_injection && !modules.jailbreak && !modules.data_leakage) {
      return setError('Select at least one attack module');
    }

    let parsedHeaders = {};
    if (authHeaders.trim()) {
      try {
        parsedHeaders = JSON.parse(authHeaders);
      } catch (err) {
        return setError('Auth Headers must be valid JSON');
      }
    }

    const selectedCategories = Object.entries(modules)
      .filter(([_, checked]) => checked)
      .map(([key]) => key);

    setLoading(true);
    try {
      const res = await auditsApi.createAudit({
        targetName,
        targetUrl,
        categories: selectedCategories,
        authHeaders: parsedHeaders
      });
      const newId = res.audit?._id || res.audit?.id || res._id || res.id;
      if (newId) {
        navigate(`/audits/${newId}`);
      } else {
        navigate('/audits');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to launch audit');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '600px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>New Audit Operation</h1>
          <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', padding: '4px 8px', backgroundColor: 'rgba(22, 163, 74, 0.15)', border: '1px solid var(--green)', borderRadius: '4px', color: 'var(--green)', fontWeight: 'bold' }}>
            STATUS: READY
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-raised)', border: '1px solid var(--border)', borderRadius: '8px', padding: '32px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                TARGET NAME
              </label>
              <input
                type="text"
                value={targetName}
                onChange={e => setTargetName(e.target.value)}
                required
                style={{ width: '100%', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: '15px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                TARGET URL
              </label>
              <input
                type="url"
                value={targetUrl}
                onChange={e => setTargetUrl(e.target.value)}
                placeholder="https://your-ai-api.com/chat"
                required
                style={{ width: '100%', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: '15px', outline: 'none' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '12px' }}>
                ATTACK MODULES
              </label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={modules.prompt_injection} onChange={e => setModules({...modules, prompt_injection: e.target.checked})} style={{ accentColor: 'var(--red)' }} />
                  Prompt Injection Analysis
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={modules.jailbreak} onChange={e => setModules({...modules, jailbreak: e.target.checked})} style={{ accentColor: 'var(--red)' }} />
                  Jailbreak Attempt Simulations
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  <input type="checkbox" checked={modules.data_leakage} onChange={e => setModules({...modules, data_leakage: e.target.checked})} style={{ accentColor: 'var(--red)' }} />
                  Data Leakage Scanners
                </label>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                AUTH HEADERS (JSON)
              </label>
              <textarea
                value={authHeaders}
                onChange={e => setAuthHeaders(e.target.value)}
                placeholder='{ "Authorization": "Bearer sk-..." }'
                rows={4}
                style={{ width: '100%', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)', fontSize: '13px', outline: 'none', resize: 'vertical' }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: 'var(--red-glow)', border: '1px solid var(--red-dim)', color: 'var(--red)', padding: '12px', borderRadius: '4px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: '8px' }}>
              <button
                type="submit"
                disabled={loading}
                style={{ width: '100%', padding: '14px', backgroundColor: 'var(--red)', color: '#fff', border: 'none', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 'bold', cursor: loading ? 'not-allowed' : 'pointer' }}
              >
                {loading ? 'LAUNCHING...' : 'LAUNCH AUDIT →'}
              </button>
              <div style={{ textAlign: 'center', marginTop: '12px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
                SYSTEM LOGS WILL INITIALIZE UPON EXECUTION
              </div>
            </div>

          </form>
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)' }}>
          RF-SYSTEM-V2.0.4
        </div>
      </div>
    </div>
  );
};

export default NewAuditPage;
