import React, { useState, useRef, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import LanguageSwitcher from '../components/common/LanguageSwitcher';

function MainLayout() {
  const { t } = useTranslation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setMobileOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  const roleLinks = () => {
    switch (user?.role) {
      case 'traveler':
        return (
          <>
            <Link className={`navbar-link ${isActive('/search') ? 'active' : ''}`} to="/search">{t('nav.search') || 'Search'}</Link>
            <Link className={`navbar-link ${isActive('/bookings') ? 'active' : ''}`} to="/bookings">{t('nav.bookings')}</Link>
            <Link className={`navbar-link ${isActive('/events') ? 'active' : ''}`} to="/events">{t('nav.events') || 'Events'}</Link>
          </>
        );
      case 'driver':
        return (
          <>
            <Link className={`navbar-link ${isActive('/driver/dashboard') ? 'active' : ''}`} to="/driver/dashboard">{t('nav.dashboard')}</Link>
            <Link className={`navbar-link ${isActive('/driver/routes') ? 'active' : ''}`} to="/driver/routes">{t('nav.routes') || 'Routes'}</Link>
            <Link className={`navbar-link ${isActive('/driver/requests') ? 'active' : ''}`} to="/driver/requests">{t('nav.requests') || 'Requests'}</Link>
          </>
        );
      case 'agency_admin':
        return (
          <>
            <Link className={`navbar-link ${isActive('/agency/dashboard') ? 'active' : ''}`} to="/agency/dashboard">{t('nav.dashboard')}</Link>
            <Link className={`navbar-link ${isActive('/agency/drivers') ? 'active' : ''}`} to="/agency/drivers">{t('nav.drivers') || 'Drivers'}</Link>
            <Link className={`navbar-link ${isActive('/agency/requests') ? 'active' : ''}`} to="/agency/requests">{t('agency.driverRequests', 'Driver Requests')}</Link>
            <Link className={`navbar-link ${isActive('/agency/bookings') ? 'active' : ''}`} to="/agency/bookings">{t('nav.bookings')}</Link>
            <Link className={`navbar-link ${isActive('/analytics') ? 'active' : ''}`} to="/analytics">{t('nav.analytics')}</Link>
          </>
        );
      case 'admin':
        return (
          <>
            <Link className={`navbar-link ${isActive('/admin/dashboard') ? 'active' : ''}`} to="/admin/dashboard">{t('nav.dashboard')}</Link>
            <Link className={`navbar-link ${isActive('/admin/users') ? 'active' : ''}`} to="/admin/users">{t('nav.users') || 'Users'}</Link>
            <Link className={`navbar-link ${isActive('/admin/agencies') ? 'active' : ''}`} to="/admin/agencies">{t('nav.agencies') || 'Agencies'}</Link>
            <Link className={`navbar-link ${isActive('/admin/bookings') ? 'active' : ''}`} to="/admin/bookings">{t('nav.bookings')}</Link>
            <Link className={`navbar-link ${isActive('/analytics') ? 'active' : ''}`} to="/analytics">{t('nav.analytics')}</Link>
          </>
        );
      default:
        return null;
    }
  };

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div>
      <nav className="navbar" role="navigation" aria-label="Main navigation">
        <div className="navbar-inner">
          <Link className="navbar-logo" to="/search">
            <span className="navbar-logo-icon">TP</span>
            <span>{t('footer.travelPro', 'TravelPro')}</span>
          </Link>

          <div className={`navbar-links ${mobileOpen ? 'mobile-open' : ''}`}>
            {roleLinks()}
          </div>

          <div className="navbar-right">
            <LanguageSwitcher />
            <div className="navbar-user-menu" ref={dropdownRef}>
              <button
                className="navbar-avatar"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                aria-haspopup="true"
                aria-expanded={dropdownOpen}
                aria-label="User menu"
                title={user?.name || user?.email}
              >
                {initials}
              </button>
              <div className={`navbar-dropdown ${dropdownOpen ? 'open' : ''}`}>
                <div className="navbar-dropdown-header">
                  <div className="navbar-dropdown-header-name">{user?.name || 'User'}</div>
                  <div className="navbar-dropdown-header-role">{user?.role}</div>
                </div>
                <button className="navbar-dropdown-item danger" onClick={handleLogout}>
                  {t('nav.logout')}
                </button>
              </div>
            </div>

            <button
              className={`navbar-hamburger ${mobileOpen ? 'open' : ''}`}
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileOpen}
            >
              <span />
              <span />
              <span />
            </button>
          </div>
        </div>
      </nav>

      {mobileOpen && (
        <div className="navbar-mobile-overlay open" onClick={() => setMobileOpen(false)} />
      )}

      <main className="page-wrapper">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <span className="footer-logo-icon">TP</span>
                <span>{t('footer.travelPro')}</span>
              </div>
              <p className="footer-description">
                {t('footer.description')}
              </p>
            </div>
            <div>
              <h4 className="footer-heading">{t('footer.platform', 'Platform')}</h4>
              <div className="footer-links">
                <Link className="footer-link" to="/search">{t('footer.searchRoutes', 'Search Routes')}</Link>
                <Link className="footer-link" to="/bookings">{t('footer.myBookings', 'My Bookings')}</Link>
                <Link className="footer-link" to="/events">{t('footer.events', 'Events')}</Link>
              </div>
            </div>
            <div>
              <h4 className="footer-heading">{t('footer.support', 'Support')}</h4>
              <div className="footer-links">
                <a className="footer-link" href="#help">{t('footer.helpCenter', 'Help Center')}</a>
                <a className="footer-link" href="#contact">{t('footer.contactUs', 'Contact Us')}</a>
                <a className="footer-link" href="#privacy">{t('footer.privacyPolicy', 'Privacy Policy')}</a>
                <a className="footer-link" href="#terms">{t('footer.termsOfService', 'Terms of Service')}</a>
              </div>
            </div>
            <div>
              <h4 className="footer-heading">{t('footer.company', 'Company')}</h4>
              <div className="footer-links">
                <a className="footer-link" href="#about">{t('footer.aboutUs', 'About Us')}</a>
                <a className="footer-link" href="#careers">{t('footer.careers', 'Careers')}</a>
                <a className="footer-link" href="#partners">{t('footer.partners', 'Partners')}</a>
                <a className="footer-link" href="#blog">{t('footer.blog', 'Blog')}</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p className="footer-copyright">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
            <div className="footer-social">
              <a className="footer-social-link" href="#twitter" aria-label="Twitter">𝕏</a>
              <a className="footer-social-link" href="#linkedin" aria-label="LinkedIn">in</a>
              <a className="footer-social-link" href="#instagram" aria-label="Instagram">◻</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default MainLayout;
