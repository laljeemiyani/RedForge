import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Disc, ChevronRight } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) {
      return setError('Passwords do not match');
    }
    setLoading(true);
    try {
      const { token } = await authApi.register(email, password);
      await login(token);
      navigate('/audits');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-base)' }}>
      {/* Left Panel */}
      <div style={{
        width: '420px', backgroundColor: 'var(--bg-surface)', borderRight: '1px solid var(--border)',
        padding: '40px', display: 'flex', flexDirection: 'column', position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '20px', fontWeight: 'bold', marginBottom: '60px' }}>
          <Disc size={24} fill="var(--red)" /> REDFORGE AI
        </div>
        
        <h1 style={{ fontSize: '32px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', lineHeight: 1.2 }}>
          Secure Your AI Operations
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '16px', marginBottom: '40px', lineHeight: 1.6 }}>
          Register for RedForge AI to get access to enterprise-grade red teaming tools.
        </p>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', marginTop: 'auto' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: 'var(--green)' }}></div>
          SYSTEM STATUS: ACTIVE
        </div>
      </div>

      {/* Right Panel */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px' }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '32px', textAlign: 'center', letterSpacing: '2px' }}>
            OPERATOR REGISTRATION
          </div>

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                EMAIL_ADDRESS
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: '15px', outline: 'none'
                }}
              />
            </div>
            
            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                ACCESS_CREDENTIAL
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: '15px', outline: 'none'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                CONFIRM_CREDENTIAL
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                required
                style={{
                  width: '100%', padding: '12px 16px', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)',
                  borderRadius: '4px', color: 'var(--text-primary)', fontFamily: 'var(--font-ui)', fontSize: '15px', outline: 'none'
                }}
              />
            </div>

            {error && (
              <div style={{ backgroundColor: 'var(--red-glow)', border: '1px solid var(--red-dim)', color: 'var(--red)', padding: '12px', borderRadius: '4px', fontSize: '14px' }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px', backgroundColor: 'var(--red)', color: '#fff', border: 'none',
                borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '14px', fontWeight: 'bold',
                cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
                marginTop: '8px'
              }}
            >
              {loading ? 'REGISTERING...' : 'REGISTER'} {!loading && <ChevronRight size={18} />}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center' }}>
            <Link to="/login" style={{ color: 'var(--text-muted)', fontSize: '14px', textDecoration: 'underline' }}>
              Already registered? Return to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
