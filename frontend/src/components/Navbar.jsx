import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { logout, getUser } from '../services/auth';
import LogoutModal from './LogoutModal';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HistoryIcon from '@mui/icons-material/History';
import PersonIcon from '@mui/icons-material/Person';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
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
            {isMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>

          <ul className={`navbar-menu ${isMenuOpen ? 'active' : ''}`}>
            <li>
              <Link to="/" onClick={() => setIsMenuOpen(false)}>
                <HomeIcon sx={{ fontSize: 18, marginRight: '6px', verticalAlign: 'middle' }} />
                Home
              </Link>
            </li>
            <li>
              <Link to="/about" onClick={() => setIsMenuOpen(false)}>
                <InfoIcon sx={{ fontSize: 18, marginRight: '6px', verticalAlign: 'middle' }} />
                About Us
              </Link>
            </li>
            <li>
              <Link to="/tips" onClick={() => setIsMenuOpen(false)}>
                <LightbulbIcon sx={{ fontSize: 18, marginRight: '6px', verticalAlign: 'middle' }} />
                Tips
              </Link>
            </li>
            {isAuthenticated && (
              <>
                <li>
                  <Link to="/dashboard" onClick={() => setIsMenuOpen(false)}>
                    <DashboardIcon sx={{ fontSize: 18, marginRight: '6px', verticalAlign: 'middle' }} />
                    Dashboard
                  </Link>
                </li>
                <li>
                  <Link to="/history" onClick={() => setIsMenuOpen(false)}>
                    <HistoryIcon sx={{ fontSize: 18, marginRight: '6px', verticalAlign: 'middle' }} />
                    History
                  </Link>
                </li>
                <li>
                  <Link to="/profile" onClick={() => setIsMenuOpen(false)}>
                    <PersonIcon sx={{ fontSize: 18, marginRight: '6px', verticalAlign: 'middle' }} />
                    Profile
                  </Link>
                </li>
              </>
            )}
          </ul>

          {isAuthenticated ? (
            <div className="navbar-cta navbar-user-section">
              <Link to="/profile" className="navbar-profile-link" onClick={() => setIsMenuOpen(false)}>
                <PersonIcon sx={{ fontSize: 20, marginRight: '8px', verticalAlign: 'middle' }} />
                <span className="navbar-username">{userName}</span>
              </Link>
              <button
                className="navbar-logout-btn"
                onClick={handleLogout}
                aria-label="Logout"
                title="Logout"
              >
                <LogoutIcon sx={{ fontSize: 20 }} />
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