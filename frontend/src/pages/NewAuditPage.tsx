import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auditsApi } from '../api/audits';
import client from '../api/client';

type ApiType = 'openai' | 'custom' | 'auto';
type ConnectionStatus = 'idle' | 'testing' | 'success' | 'failed';

const LABEL: React.CSSProperties = {
  display: 'block',
  fontFamily: 'var(--font-mono)',
  fontSize: '12px',
  color: 'var(--text-muted)',
  marginBottom: '8px',
};

const INPUT: React.CSSProperties = {
  width: '100%',
  padding: '12px 16px',
  backgroundColor: 'var(--bg-surface)',
  border: '1px solid var(--border)',
  borderRadius: '4px',
  color: 'var(--text-primary)',
  fontFamily: 'var(--font-ui)',
  fontSize: '15px',
  outline: 'none',
};

const HELPER: React.CSSProperties = {
  marginTop: '6px',
  fontFamily: 'var(--font-mono)',
  fontSize: '11px',
  color: 'var(--text-muted)',
};

const NewAuditPage = () => {
  const [targetName, setTargetName] = useState('');
  const [targetUrl, setTargetUrl] = useState('');
  const [apiType, setApiType] = useState<ApiType>('auto');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [messageField, setMessageField] = useState('message');
  const [responseField, setResponseField] = useState('response');
  const [categories, setCategories] = useState<string[]>([
    'prompt_injection',
    'jailbreak',
    'data_leakage',
  ]);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const toggleCategory = (cat: string) => {
    setCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const inferModelFromUrl = (url: string): string => {
    const lowered = url.toLowerCase();
    if (lowered.includes('openrouter.ai')) return 'openrouter/auto';
    if (lowered.includes('groq.com')) return 'llama3-8b-8192';
    if (lowered.includes('openai.com')) return 'gpt-3.5-turbo';
    if (lowered.includes('aimlapi.com')) return 'gpt-4o';
    return '';
  };

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setConnectionMessage('');
    try {
      const body: any = { targetUrl, apiType };
      if (apiType === 'openai') {
        body.apiKey = apiKey;
        body.model = model || inferModelFromUrl(targetUrl);
      }
      if (apiType === 'custom') {
        body.messageField = messageField;
        body.responseField = responseField;
      }
      const res = await client.post('/audits/test-connection', body);
      setConnectionStatus('success');
      setConnectionMessage(res.data.preview || 'Connection OK');
    } catch (err: any) {
      setConnectionStatus('failed');
      setConnectionMessage(
        err.response?.data?.error || err.message || 'Connection failed'
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!targetUrl.startsWith('http')) {
      return setError('Target URL must start with http:// or https://');
    }
    if (categories.length === 0) {
      return setError('Select at least one attack module');
    }

    let authHeaders: Record<string, string> = {};
    let requestTemplate: string | null = null;
    let responsePath = '';

    if (apiType === 'openai') {
      authHeaders = { Authorization: `Bearer ${apiKey}` };
      responsePath = 'choices.0.message.content';
    } else if (apiType === 'custom') {
      requestTemplate = JSON.stringify({ [messageField]: '{{message}}' });
      responsePath = responseField;
    }
    // auto: authHeaders={}, requestTemplate=null, responsePath=""

    setIsSubmitting(true);
    try {
      const res = await auditsApi.createAudit({
        targetName,
        targetUrl,
        authHeaders,
        categories,
        requestTemplate,
        responsePath,
        model: apiType === 'openai' ? model || inferModelFromUrl(targetUrl) : undefined,
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
      setIsSubmitting(false);
    }
  };

  const apiCards: { value: ApiType; title: string; subtitle: string }[] = [
    {
      value: 'openai',
      title: 'OpenAI / OpenRouter Compatible',
      subtitle: 'Built with OpenAI SDK, LangChain, or any OpenAI-format wrapper',
    },
    {
      value: 'custom',
      title: 'Custom REST API',
      subtitle: 'Your chatbot has its own request/response format',
    },
    {
      value: 'auto',
      title: 'Auto-Detect',
      subtitle: 'Let RedForge figure out the format automatically',
    },
  ];

  const moduleOptions = [
    { value: 'prompt_injection', label: 'Prompt Injection Analysis' },
    { value: 'jailbreak', label: 'Jailbreak Attempt Simulations' },
    { value: 'data_leakage', label: 'Data Leakage Scanners' },
  ];

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ width: '100%', maxWidth: '640px' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', fontWeight: 600, color: 'var(--text-primary)' }}>
            New Audit Operation
          </h1>
          <span
            style={{
              fontSize: '11px',
              fontFamily: 'var(--font-mono)',
              padding: '4px 8px',
              backgroundColor: 'rgba(22, 163, 74, 0.15)',
              border: '1px solid var(--green)',
              borderRadius: '4px',
              color: 'var(--green)',
              fontWeight: 'bold',
            }}
          >
            STATUS: READY
          </span>
        </div>

        <div
          style={{
            backgroundColor: 'var(--bg-raised)',
            border: '1px solid var(--border)',
            borderRadius: '8px',
            padding: '32px',
          }}
        >
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
            {/* SECTION 1 — TARGET INFO */}
            <div>
              <label style={LABEL}>TARGET NAME</label>
              <input
                type="text"
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                required
                style={INPUT}
              />
            </div>

            <div>
              <label style={LABEL}>TARGET URL</label>
              <input
                type="url"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                onBlur={() => {
                  if (apiType === 'openai' && !model) {
                    setModel(inferModelFromUrl(targetUrl));
                  }
                }}
                placeholder="https://your-ai-api.com/chat"
                required
                style={INPUT}
              />
            </div>

            {/* SECTION 2 — API TYPE */}
            <div>
              <label style={{ ...LABEL, marginBottom: '12px' }}>HOW IS YOUR CHATBOT BUILT?</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {apiCards.map((card) => {
                  const selected = apiType === card.value;
                  return (
                    <div
                      key={card.value}
                      onClick={() => setApiType(card.value)}
                      style={{
                        border: `1px solid ${selected ? 'var(--red)' : 'var(--border)'}`,
                        backgroundColor: selected ? 'var(--red-glow)' : 'var(--bg-raised)',
                        padding: '14px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'border-color 0.15s, background-color 0.15s',
                      }}
                    >
                      <div
                        style={{
                          fontFamily: 'var(--font-ui)',
                          fontSize: '15px',
                          fontWeight: 600,
                          color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
                        }}
                      >
                        {card.title}
                      </div>
                      <div
                        style={{
                          fontFamily: 'var(--font-mono)',
                          fontSize: '12px',
                          color: 'var(--text-muted)',
                          marginTop: '4px',
                        }}
                      >
                        {card.subtitle}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Conditional fields for openai */}
              {apiType === 'openai' && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={LABEL}>API KEY</label>
                    <input
                      type="password"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      placeholder="sk-... or sk-or-v1-..."
                      style={{ ...INPUT, fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                    />
                    <div style={HELPER}>Your key is never stored permanently</div>
                  </div>
                  <div>
                    <label style={LABEL}>MODEL</label>
                    <input
                      type="text"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      placeholder="e.g. openrouter/auto, gpt-4o, llama3-8b-8192"
                      style={{ ...INPUT, fontFamily: 'var(--font-mono)', fontSize: '13px' }}
                    />
                    <div style={HELPER}>
                      Auto-filled based on your URL. Change if needed.
                    </div>
                  </div>
                </div>
              )}

              {/* Conditional fields for custom */}
              {apiType === 'custom' && (
                <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div>
                    <label style={LABEL}>MESSAGE FIELD</label>
                    <input
                      type="text"
                      value={messageField}
                      onChange={(e) => setMessageField(e.target.value)}
                      placeholder="message"
                      style={INPUT}
                    />
                    <div style={HELPER}>The JSON field name that contains the user's message</div>
                  </div>
                  <div>
                    <label style={LABEL}>RESPONSE FIELD</label>
                    <input
                      type="text"
                      value={responseField}
                      onChange={(e) => setResponseField(e.target.value)}
                      placeholder="response"
                      style={INPUT}
                    />
                    <div style={HELPER}>The JSON field name that contains the AI's reply</div>
                  </div>
                </div>
              )}
            </div>

            {/* SECTION 3 — ATTACK MODULES */}
            <div>
              <label style={{ ...LABEL, marginBottom: '12px' }}>ATTACK MODULES</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {moduleOptions.map((mod) => (
                  <label
                    key={mod.value}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--text-secondary)',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={categories.includes(mod.value)}
                      onChange={() => toggleCategory(mod.value)}
                      style={{ accentColor: 'var(--red)' }}
                    />
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>

            {/* SECTION 4 — TEST CONNECTION */}
            <div>
              <button
                type="button"
                onClick={handleTestConnection}
                disabled={connectionStatus === 'testing' || !targetUrl}
                style={{
                  width: '100%',
                  padding: '12px',
                  backgroundColor: 'transparent',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  color: 'var(--text-secondary)',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '13px',
                  fontWeight: 'bold',
                  cursor:
                    connectionStatus === 'testing' || !targetUrl ? 'not-allowed' : 'pointer',
                  opacity: connectionStatus === 'testing' ? 0.6 : 1,
                  transition: 'opacity 0.15s',
                }}
              >
                {connectionStatus === 'testing' ? 'TESTING...' : 'TEST CONNECTION'}
              </button>

              {connectionStatus === 'success' && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'rgba(22, 163, 74, 0.1)',
                    border: '1px solid var(--green)',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--green)',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>✓ CONNECTION SUCCESSFUL</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {connectionMessage}
                  </div>
                </div>
              )}

              {connectionStatus === 'failed' && (
                <div
                  style={{
                    marginTop: '12px',
                    padding: '12px',
                    backgroundColor: 'var(--red-glow)',
                    border: '1px solid var(--red-dim)',
                    borderRadius: '4px',
                    fontSize: '13px',
                    fontFamily: 'var(--font-mono)',
                    color: 'var(--red)',
                  }}
                >
                  <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>✗ CONNECTION FAILED</div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '12px' }}>
                    {connectionMessage}
                  </div>
                </div>
              )}
            </div>

            {/* Error */}
            {error && (
              <div
                style={{
                  backgroundColor: 'var(--red-glow)',
                  border: '1px solid var(--red-dim)',
                  color: 'var(--red)',
                  padding: '12px',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              >
                {error}
              </div>
            )}

            {/* SECTION 5 — LAUNCH */}
            <div style={{ marginTop: '4px' }}>
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  width: '100%',
                  padding: '14px',
                  backgroundColor: 'var(--red)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                }}
              >
                {isSubmitting ? 'LAUNCHING...' : 'LAUNCH AUDIT →'}
              </button>

              {connectionStatus === 'idle' && (
                <div
                  style={{
                    textAlign: 'center',
                    marginTop: '10px',
                    fontFamily: 'var(--font-mono)',
                    fontSize: '11px',
                    color: 'var(--text-muted)',
                  }}
                >
                  Tip: Test connection first to avoid failed audits
                </div>
              )}
            </div>
          </form>
        </div>

        <div
          style={{
            textAlign: 'center',
            marginTop: '40px',
            fontFamily: 'var(--font-mono)',
            fontSize: '11px',
            color: 'var(--text-muted)',
          }}
        >
          RF-SYSTEM-V2.0.4
        </div>
      </div>
    </div>
  );
};

export default NewAuditPage;
