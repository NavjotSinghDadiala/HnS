import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// --- GUEST ID LOGIC (Vanilla JS implementation to avoid extra dependencies) ---
export const getOrCreateGuestId = () => {
  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(';').shift();
  };

  const setCookie = (name, value, minutes) => {
    const date = new Date();
    date.setTime(date.getTime() + (minutes * 60 * 1000)); // 15 mins
    const expires = `; expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value || ""}${expires}; path=/; SameSite=Lax`;
  };

  let guestId = getCookie('hns_guest_id');
  if (!guestId) {
    guestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
  }

  // Always set/refresh the cookie to give them 15 more minutes
  setCookie('hns_guest_id', guestId, 15);

  return guestId;
};

const api = axios.create({
  baseURL: API_URL,
});

// Request Interceptor: Attach Local Auth or Clerk Token
api.interceptors.request.use(async (config) => {
  try {
    // Check for local auth credentials (email:password base64 encoded)
    const localAuth = localStorage.getItem('local_auth');
    if (localAuth) {
      // localAuth should be in format "email:password"
      const encoded = btoa(localAuth);
      config.headers.Authorization = `Bearer ${encoded}`;
    } else {
      // Check if Clerk is initialized and session is available on window
      const clerk = window.Clerk;
      if (clerk?.session) {
        const token = await clerk.session.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }

    // Always include Guest ID for merge & tracking
    config.headers['X-Guest-ID'] = getOrCreateGuestId();

    return config;
  } catch (error) {
    return Promise.reject(error);
  }
});

// Response Interceptor: Centralized error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn('Unauthorized - possibly expired token');
    }
    return Promise.reject(error);
  }
);

export default api;
