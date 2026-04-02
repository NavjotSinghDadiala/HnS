import React, { useState, useEffect } from 'react';
import { FaUserCircle, FaRegUserCircle, FaShoppingCart, FaBars, FaTimes } from 'react-icons/fa';
import { MdTravelExplore, MdHome, MdBusiness, MdArticle } from 'react-icons/md';
import { Link } from 'react-router-dom';
import { SignedIn, SignedOut, UserButton, useUser } from '@clerk/clerk-react';
import "../../home_page_css/FooterNavBar.css";

const FooterNavBar = ({ sticky = false }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  const { user } = useUser();

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = windowWidth <= 768;

  // Updated actionCards with Cart
  const actionCards = [
    { label: 'Builders', icon: <MdBusiness size={38} color="#A21CAF" style={{ filter: 'drop-shadow(0 0 6px #A21CAF99)' }} />, to: '/builders-page', desc: 'Explore trusted builders' },
    { label: 'Projects', icon: <MdHome size={38} color="#22C55E" style={{ filter: 'drop-shadow(0 0 6px #22C55E99)' }} />, to: '/properties', desc: 'View all projects' },
    { label: 'Cart', icon: <FaShoppingCart size={38} color="#F97316" style={{ filter: 'drop-shadow(0 0 6px #F9731699)' }} />, to: '/cart', desc: 'View saved properties' }, // ← NEW
    { label: 'Blogs', icon: <MdArticle size={38} color="#F59E42" style={{ filter: 'drop-shadow(0 0 6px #F59E4299)' }} />, to: '/blogs', desc: 'Read property news & tips' },
    { label: 'About Us', icon: <MdTravelExplore size={38} color="#3B82F6" style={{ filter: 'drop-shadow(0 0 6px #3B82F6AA)' }} />, to: '/about', desc: 'Learn about us' },
  ];

  return (
    <>
      <div
        className={`footer-navbar ${isMobile ? 'footer-navbar-mobile' : 'footer-navbar-desktop'}`}
        style={
          sticky
            ? {
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                zIndex: 1000,
              }
            : undefined
        }
      >
        {/* Logo */}
        <Link to="/" className="footer-logo-link">
          <img 
            src="/HouseNSeek.png" 
            alt="HouseNSeek Logo" 
            className={`footer-logo ${isMobile ? 'footer-logo-mobile' : ''}`}
          />
        </Link>

        {/* Desktop Navigation - Now includes Cart */}
        {!isMobile && (
          <nav className="footer-nav">
            <Link to="/builders-page" className="footer-nav-link">Builders</Link>
            <Link to="/properties" className="footer-nav-link">Projects</Link>
            <Link to="/cart" className="footer-nav-link flex items-center gap-2">
              <FaShoppingCart size={18} />
              Cart
            </Link>
            <Link to="/blogs" className="footer-nav-link">Blogs</Link>
            <Link to="/about" className="footer-nav-link">About Us</Link>
            <SignedOut>
              <Link 
                to="/login" 
                className="footer-nav-link" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <FaRegUserCircle size={22} />
              </Link>
            </SignedOut>
            <SignedIn>
              <div style={{ display: 'flex', alignItems: 'center', marginLeft: '8px' }}>
                <UserButton 
                  afterSignOutUrl="/" 
                  appearance={{
                    elements: {
                      userButtonPopoverFooter: "hidden", 
                      footer: "hidden"
                    }
                  }}
                />
              </div>
            </SignedIn>
          </nav>
        )}

        {/* Mobile Hamburger */}
        {isMobile && (
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="hamburger-button"
          >
            {showMenu ? <FaTimes /> : <FaBars />}
          </button>
        )}
      </div>

      {sticky && (
        <div style={{ height: isMobile ? 64 : 72 }} />
      )}

      {/* Mobile Menu Overlay - Now includes Cart */}
      {isMobile && showMenu && (
        <div className="mobile-menu-overlay">
          {/* Welcome card */}
          <div className="welcome-card">
            <button
              onClick={() => setShowMenu(false)}
              aria-label="Close menu"
              className="close-menu-button"
            >
              &times;
            </button>
            <div className="user-info-container">
              <SignedIn>
                <div style={{ background: 'rgba(255,255,255,0.12)', borderRadius: '50%', padding: '2px', display: 'flex' }}>
                   <UserButton 
                     afterSignOutUrl="/" 
                     appearance={{
                       elements: {
                         userButtonPopoverFooter: "hidden", 
                         footer: "hidden"
                       }
                     }}
                   />
                </div>
              </SignedIn>
              <SignedOut>
                <FaUserCircle size={36} color="#fff" className="user-icon" />
              </SignedOut>
              <div>
                <div className="user-name">
                  {user ? `Hi, ${user.firstName || user.username || 'User'}` : 'Welcome Guest'}
                </div>
                <div className="user-status">
                  {user ? (
                    <span>Profile &bull; <span className="profile-link">Manage Profile</span></span>
                  ) : (
                    'Guest Profile'
                  )}
                </div>
              </div>
            </div>
            <SignedOut>
              <Link 
                to="/login" 
                className="login-button" 
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                onClick={() => setShowMenu(false)}
              >
                <FaRegUserCircle size={24} style={{ marginRight: '8px' }} /> Login / Signup
              </Link>
            </SignedOut>
          </div>

          {/* Action cards - Now includes Cart */}
          <div className="action-cards-container">
            {actionCards.map((card) => (
              <Link
                key={card.label}
                to={card.to}
                className="action-card"
                onClick={() => setShowMenu(false)}
              >
                <div>
                  <div className="action-card-title">{card.label}</div>
                  <div className="action-card-desc">{card.desc}</div>
                </div>
                <span className="action-card-icon">{card.icon}</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default FooterNavBar;