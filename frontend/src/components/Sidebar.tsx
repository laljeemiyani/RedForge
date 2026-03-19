import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Shield, List, PlusCircle, FileText, LogOut, Disc } from 'lucide-react';

const Sidebar = () => {
  const { user, logout } = useAuth();

  const navItems = [
    { to: '/audits', label: 'Audits', icon: <List size={16} />, end: true },
    { to: '/audits/new', label: 'New Audit', icon: <PlusCircle size={16} /> },
    { to: '/reports', label: 'Reports', icon: <FileText size={16} /> }
  ];

  return (
    <div style={{
      width: '220px',
      flexShrink: 0,
      backgroundColor: 'var(--bg-surface)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)', fontFamily: 'var(--font-mono)', fontSize: '16px', fontWeight: 'bold' }}>
          <Disc size={18} fill="var(--red)" /> REDFORGE AI
        </div>
        <div style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', letterSpacing: '0.5px' }}>
          AI RED TEAM PLATFORM
        </div>
      </div>

      <nav style={{ flex: 1, padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: '6px',
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              backgroundColor: isActive ? 'var(--bg-raised)' : 'transparent',
              fontWeight: isActive ? 500 : 400,
              transition: 'all 0.2s',
              textDecoration: 'none'
            })}
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '20px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {user?.email || 'operator@redforge.ai'}
        </div>
        <button 
          onClick={logout}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent',
            border: 'none', color: 'var(--text-secondary)', cursor: 'pointer', padding: '6px 0',
            fontFamily: 'var(--font-ui)', fontSize: '14px'
          }}
        >
          <LogOut size={16} /> LOGOUT
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
