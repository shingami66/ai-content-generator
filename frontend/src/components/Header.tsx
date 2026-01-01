import React, { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext"; // Import the context
import AuthService from "../api/authService";
import "../AI.css";

const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setIsAuthenticated, user, setUser } = useAppContext(); // Get auth state from context
  const [isDropdownOpen, setIsDropdownOpen] = useState(false); // State for dropdown visibility

  // Check if we're on the landing page
  const isLandingPage = location.pathname === "/";

  const handleLogout = () => {
    // Clear authentication state
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    // Navigate to login page
    navigate("/login");
    // Close dropdown
    setIsDropdownOpen(false);
  };

  const handleLogin = () => {
    // Navigate to login page
    navigate("/login");
    // Close dropdown
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  return (
    <header className="header">
      <div className="logo" onClick={() => navigate("/")}>
        <span className="logo-icon">⚡</span>
        <span className="logo-text">AICreate Studio</span>
      </div>

      {/* Navigation links - hide on landing page */}
      {!isLandingPage && (
        <nav className="nav">
          {isAuthenticated && (
            <NavLink to="/dashboard" className="nav-link">
              Dashboard
            </NavLink>
          )}
          <NavLink to="/gallery" className="nav-link">
            Gallery
          </NavLink>
        </nav>
      )}

      {/* User menu - hide on landing page */}
      {!isLandingPage && (
        <div className="user-menu">
          {isAuthenticated ? (
            <>
              <span className="nav-link" style={{ cursor: 'default' }}>🔔</span>
              <span className="nav-link" style={{ cursor: 'default' }}>👤</span>
              <button className="nav-link" onClick={toggleDropdown}>
                {user?.username || 'User'} ▼
              </button>
              {isDropdownOpen && (
                <div className="dropdown">
                  <button onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }}>
                    Profile
                  </button>
                  <button onClick={() => { navigate("/subscription"); setIsDropdownOpen(false); }}>
                    Subscription
                  </button>
                  <button onClick={() => { navigate("/feedback"); setIsDropdownOpen(false); }}>
                    Feedback
                  </button>
                  <button onClick={handleLogout}>
                    Logout
                  </button>
                </div>
              )}
            </>
          ) : (
            <button className="nav-link" onClick={handleLogin}>
              Login
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;