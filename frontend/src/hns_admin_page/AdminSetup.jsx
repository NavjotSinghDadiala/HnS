import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import api from '../services/apiInstance';

const AdminSetup = () => {
  const { isLoaded, isSignedIn } = useAuth();
  const navigate = useNavigate();
  const [setupKey, setSetupKey] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (!isLoaded) return;

    const localUser = localStorage.getItem('user');
    if (localUser) {
      try {
        setProfile(JSON.parse(localUser));
      } catch (e) {
        setProfile(null);
      }
      return;
    }

    if (!isSignedIn) return;
    api.get('/auth/me')
      .then((res) => setProfile(res.data))
      .catch(() => setProfile(null));
  }, [isLoaded, isSignedIn]);

  const submit = async (e) => {
    e.preventDefault();
    // Setup key is no longer required; promotion is gated by admin email + password.
    if (!email || !password) {
      setStatus({ type: 'error', message: 'All fields are required.' });
      return;
    }
    setStatus({ type: 'loading', message: 'Verifying admin access…' });
    
    try {
      // Store local auth credentials
      localStorage.setItem('local_auth', `${email}:${password}`);
      
      // Try to get user profile with local auth
      const me = await api.get('/auth/me');
      setProfile(me.data);
      localStorage.setItem('user', JSON.stringify(me.data));
      
      setStatus({ type: 'success', message: 'Admin login successful!' });
      setSetupKey('');
      setPassword('');
      navigate('/dashboard/admin');
    } catch (err) {
      // Dev fallback: allow local admin login when backend auth is unavailable.
      if (email.trim().toLowerCase() === 'admin@gmail.com' && password === 'admin') {
        const localAdmin = { email: 'admin@gmail.com', role: 'admin', username: 'admin' };
        localStorage.setItem('user', JSON.stringify(localAdmin));
        setProfile(localAdmin);
        setStatus({ type: 'success', message: 'Admin login successful (local mode)!' });
        setSetupKey('');
        setPassword('');
        navigate('/dashboard/admin');
        return;
      }

      // Clear invalid credentials
      localStorage.removeItem('local_auth');
      const msg = err?.response?.data?.error || 'Login failed.';
      setStatus({ type: 'error', message: msg });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg border border-gray-200 rounded-xl p-6">
        <div className="text-center mb-6">
          <img src="/HouseNSeek.png" alt="HouseNSeek Logo" />
          <h1 className="text-2xl font-bold text-gray-800 mt-3">Admin Setup</h1>
          <p className="text-gray-500 text-sm mt-1">
            Use the one-time setup key to promote your account.
          </p>
        </div>

        {!isLoaded && (
          <p className="text-gray-600">Loading…</p>
        )}

        {isLoaded && (
          <>
            {profile && (
              <div className="mb-4 text-sm text-gray-700">
                <div>Signed in as: <strong>{profile.email}</strong></div>
                <div>Current role: <strong>{profile.role}</strong></div>
              </div>
            )}

            {profile?.role === 'admin' ? (
              <div className="p-3 rounded-lg bg-green-50 text-green-700 text-sm">
                You are already an admin.
              </div>
            ) : (
              <form onSubmit={submit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Admin Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="admin@gmail.com"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Admin Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter admin password"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Setup Key</label>
                  <input
                    type="password"
                    value={setupKey}
                    onChange={(e) => setSetupKey(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Enter .env setup key"
                  />
                </div>

                <button
                  type="submit"
                  className="bg-blue-600 text-white font-semibold py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm mt-2"
                  disabled={status.type === 'loading'}
                >
                  Verify Admin Access
                </button>
                {status.type !== 'idle' && (
                  <div
                    className={`text-sm p-2 rounded ${
                      status.type === 'success' ? 'bg-green-50 text-green-700' :
                      status.type === 'error' ? 'bg-red-50 text-red-600' :
                      'text-gray-600'
                    }`}
                  >
                    {status.message}
                  </div>
                )}
              </form>
            )}
          </>
        )}

        <div className="mt-6 text-sm text-gray-600">
          <Link to="/login" className="text-blue-600 hover:text-blue-700 underline">
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
