/* eslint-disable no-unused-vars */
import React, { createContext, useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { SignedIn, SignedOut, RedirectToSignIn, useAuth } from '@clerk/clerk-react';
import { CartProvider } from './hns_cart_page/js/CartContent'; // Import CartProvider
import Navbar from './hns_admin_page/Navbar';
import Login from './hns_admin_page/Login';
import Signup from './hns_admin_page/Signup';
import AdminSetup from './hns_admin_page/AdminSetup';
import AdminDashboard from './hns_admin_page/AdminDashboard';
import BuilderDashboard from './hns_admin_page/BuilderDashboard';
import './App.css';
import api, { getOrCreateGuestId } from './services/apiInstance';

import AddBuilder from './Builder.jsx/addBuilder';
import BlogManagement from './hns_admin_page/BlogManagement';
import AdminBlog from './hns_admin_page/AdminBlog';
import ManagePropertyInBuilderProfile from './Builder.jsx/ManagePropertyInBuilderProfile';
import PropertiesManagement from './hns_admin_page/PropertiesManagement';
import ProjectAdd from './hns_admin_page/ProjectAdd';
import DashboardLayout from './hns_admin_page/DashboardLayout';
import LandingPage from './hns_home_page/app/LandingPage';
import BlogLanding from './hns_blog_page/app/BlogLanding';
import BlogDetail from './hns_blog_page/app/BlogDetail';
import FooterNavBar from './hns_home_page/components/layout/FooterNavBar';
import ProjectList from './hns_admin_page/ProjectList';
import AdminGraph from './hns_admin_page/AdminGraph';
import PropertyListing from './hns_propertyListing_page/app/PropertyListing';
import GeoLocation from './Builder.jsx/geoLocation';
import BuilderInfoIndex from './BuilderInfo/pages/Index';
import PropertyListingPage from './property_page/app/page';
import CartPage from './hns_cart_page/app/CartPage';
import ChatBot from './components/ui/ChatBot';
import AboutUs from './hns_home_page/components/ui/AboutUs';
import BuildersListing from './hns_home_page/components/ui/BuildersListing';

// Chatbot Context
export const ChatbotContext = createContext();

const getLocalUser = () => {
  try {
    const raw = localStorage.getItem('user');
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
};

const ProtectedRoute = ({ children }) => {
  const localUser = getLocalUser();
  if (localUser) {
    return children;
  }
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        <RedirectToSignIn />
      </SignedOut>
    </>
  );
};

const AdminRoute = ({ children }) => {
  const localUser = getLocalUser();
  if (localUser?.role === 'admin') {
    return children;
  }

  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [adminStatus, setAdminStatus] = useState(null); // null=loading, true=admin, false=not

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      setAdminStatus(false);
      return;
    }
    // Ask the backend to confirm admin role — backend checks DB role, not just email
    const checkAdmin = async () => {
      try {
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        const res = await api.get('/auth/me', { headers });
        setAdminStatus(res.data?.role === 'admin');
      } catch (err) {
        setAdminStatus(false);
      }
    };
    checkAdmin();
  }, [isLoaded, isSignedIn, getToken]);

  if (!isLoaded || adminStatus === null) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: 12 }}>
        <div style={{ width: 36, height: 36, border: '4px solid #23487c', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#23487c', fontWeight: 600 }}>Verifying admin access…</p>
      </div>
    );
  }

  if (!isSignedIn || !adminStatus) {
    return <Navigate to="/" replace />;
  }

  return children;
};


const UserSync = () => {
  const { isSignedIn, isLoaded, getToken } = useAuth();
  
  useEffect(() => {
    const syncGuest = async () => {
      if (isLoaded && isSignedIn) {
        const guestId = getOrCreateGuestId();
        const token = await getToken();
        const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
        try {
          // Ensure local user row exists
          await api.get('/auth/me', { headers });
        } catch (err) {
          console.error('Error syncing user profile:', err);
        }

        if (guestId) {
          try {
            await api.post('/auth/merge-guest', { guest_id: guestId }, { headers });
            console.log('Successfully merged guest data');
          } catch (err) {
            console.error('Error merging guest data:', err);
          }
        }
      }
    };
    syncGuest();
  }, [isLoaded, isSignedIn, getToken]);
  
  return null;
};

function App() {
  const [isChatbotOpen, setIsChatbotOpen] = useState(false);

  return (
    <CartProvider>
      <UserSync />
      <ChatbotContext.Provider value={{ isChatbotOpen, setIsChatbotOpen }}>
        <Routes>
          <Route path="/login/*" element={<Login />} />
          <Route path="/signup/*" element={<Signup />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route
            path="/builder-dashboard"
            element={
              <ProtectedRoute>
                <BuilderDashboard />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route
              path="admin"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />
            <Route
              path="add-builder"
              element={
                <AdminRoute>
                  <AddBuilder />
                </AdminRoute>
              }
            />
            <Route
              path="blogs"
              element={
                <AdminRoute>
                  <BlogManagement />
                </AdminRoute>
              }
            />
            <Route
              path="create-blog"
              element={
                <AdminRoute>
                  <AdminBlog />
                </AdminRoute>
              }
            />
            <Route
              path="builders"
              element={
                <AdminRoute>
                  <ManagePropertyInBuilderProfile />
                </AdminRoute>
              }
            />
            <Route
              path="properties"
              element={
                <AdminRoute>
                  <PropertiesManagement />
                </AdminRoute>
              }
            />
            <Route
              path="add-project"
              element={
                <AdminRoute>
                  <ProjectAdd />
                </AdminRoute>
              }
            />
            <Route
              path="projects"
              element={
                <AdminRoute>
                  <ProjectList />
                </AdminRoute>
              }
            />
            <Route
              path="geo-location"
              element={
                <ProtectedRoute>
                  <GeoLocation />
                </ProtectedRoute>
              }
            />
            <Route
              path="graph"
              element={
                <AdminRoute>
                  <AdminGraph />
                </AdminRoute>
              }
            />
          </Route>

          {/* Public Routes */}
          <Route path="/" element={<LandingPage />} />
          <Route path="/properties" element={<PropertyListing />} />
          <Route path="/property/:id" element={<PropertyListingPage />} />
          <Route path="/builder" element={<BuilderInfoIndex />} />
          <Route path="/builder-info" element={<BuilderInfoIndex />} />
          <Route path="/builder/:builderName" element={<BuilderInfoIndex />} />
          <Route path="/blogs" element={<BlogLanding />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/about" element={<AboutUs />} />
          <Route path="/builders-page" element={<BuildersListing />} />
        </Routes>

        {/* ChatBot rendered outside Routes but inside Context Provider */}
        <ChatBot />
      </ChatbotContext.Provider>
    </CartProvider>
  );
}

export default App;
