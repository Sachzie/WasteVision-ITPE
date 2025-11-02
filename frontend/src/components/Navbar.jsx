import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../services/auth';
import LogoutModal from './LogoutModal';
import '../assets/css/navbar.css';

const Navbar = ({ isAuthenticated, setIsAuthenticated }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const navigate = useNavigate();
  const user = getUser();
  const userName = user?.name || 'User';

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    setIsLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    setIsAuthenticated(false);
    setIsLogoutModalOpen(false);
    navigate('/login', { replace: true });
  };

  const cancelLogout = () => {
    setIsLogoutModalOpen(false);
  };

  const handleLoginClick = () => {
    setIsMenuOpen(false);
    navigate('/login');
  };

  return (
    <>
      <nav className="navbar">
        <div className="navbar-container">
          <Link to="/" className="navbar-logo">
            <span className="logo-eco">Waste</span>
            <span className="logo-bin">Vision</span>
            <div className="logo-squares">
              <span className="square orange"></span>
              <span className="square green"></span>
              <span className="square blue"></span>
            </div>
          </Link>

          <button 
            className={`menu-toggle ${isMenuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>

          <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <li><Link to="/" onClick={() => setIsMenuOpen(false)}>Home</Link></li>
            <li><Link to="/about" onClick={() => setIsMenuOpen(false)}>About Us</Link></li>
            <li><Link to="/tips" onClick={() => setIsMenuOpen(false)}>Tips</Link></li>
            {isAuthenticated && (
              <>
              <li><Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>Dashboard</Link></li>
              <li><Link to="/history" onClick={() => setIsMenuOpen(false)}>History</Link></li>
              <li><Link to="/profile" onClick={() => setIsMenuOpen(false)}>Profile</Link></li>
              </>
            )}
          </ul>

          {isAuthenticated ? (
            <div className="navbar-cta navbar-user-section">
              <Link to="/profile" className="navbar-profile-link" onClick={() => setIsMenuOpen(false)}>
                <span className="navbar-username">{userName}</span>
              </Link>
              <button
                className="navbar-logout-btn"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
              >
                <i className="fas fa-sign-out-alt"></i>
              </button>
            </div>
          ) : (
            <button className="navbar-cta" onClick={handleLoginClick}>
              Log In
            </button>
          )}
        </div>
      </nav>

      <LogoutModal 
        isOpen={isLogoutModalOpen}
        onClose={cancelLogout}
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </>
  );
};

export default Navbar;