import API_BASE_URL from '../config';
import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user'));
  const [geoLocation, setGeoLocation] = useState({ district: '', full_address: '', latitude: '', longitude: '' });

  useEffect(() => {
    fetchGeoLocation();
    const interval = setInterval(fetchGeoLocation, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchGeoLocation = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/admin/latest-geolocation`);
      if (res.ok) {
        const data = await res.json();
        setGeoLocation(data);
      }
    } catch (e) {
      // ignore
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  const links = [
    { name: 'Dashboard', path: '/dashboard/admin', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/></svg>
    ) },
    { name: 'Add Builder', path: '/dashboard/add-builder', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
    ) },
    { name: 'Add Project', path: '/dashboard/add-project', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/></svg>
    ) },
    { name: 'View Listings', path: '/dashboard/properties', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
    ) },
    { name: 'All Projects', path: '/dashboard/projects', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/></svg>
    ) },
    { name: 'Blogs', path: '/dashboard/blogs', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
    ) },
    { name: 'Create Blog', path: '/dashboard/create-blog', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/><path d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"/></svg>
    ) },
    { name: 'Geo Location', path: '/dashboard/geo-location', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4"/></svg>
    ) },
    { name: 'Knowledge Graph', path: '/dashboard/graph', icon: (
      <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 12h10M12 7v10M6.5 10.5l4-4M17.5 10.5l-4-4M6.5 13.5l4 4M17.5 13.5l-4 4"/></svg>
    ) },
  ];

  return (
    <div style={{
      minWidth: 220,
      background: '#fff',
      borderRight: '1px solid #e5e7eb',
      padding: '32px 0',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'stretch',
      boxShadow: '0 1px 3px 0 rgba(0,0,0,0.1)',
    }}>
      <div style={{ padding: '0 24px', marginBottom: '32px' }}>
        <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#111827' }}>Admin Panel</h2>
        <p style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>{user?.email}</p>
      </div>

      <nav style={{ flex: 1 }}>
        {links.map((link) => (
          <NavLink
            key={link.path}
            to={link.path}
            style={({ isActive }) => ({
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: isActive ? '#2563eb' : '#4b5563',
              background: isActive ? '#eff6ff' : 'transparent',
              borderRight: isActive ? '3px solid #2563eb' : 'none',
              textDecoration: 'none',
              transition: 'all 0.2s',
            })}
          >
            <span style={{ marginRight: '12px', display: 'flex', alignItems: 'center' }}>
              {link.icon}
            </span>
            {link.name}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '24px', borderTop: '1px solid #e5e7eb' }}>
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '8px 16px',
            background: '#ef4444',
            color: '#fff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            transition: 'background-color 0.2s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#dc2626'}
          onMouseOut={(e) => e.currentTarget.style.background = '#ef4444'}
        >
          <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar; 