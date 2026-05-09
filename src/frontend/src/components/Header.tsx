import React, { useState, useRef, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import AuthService from "../api/authService";


const Header: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, setIsAuthenticated, user, setUser } = useAppContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isLandingPage = location.pathname === "/";

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    AuthService.logout();
    setIsAuthenticated(false);
    setUser(null);
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const handleLogin = () => {
    navigate("/login");
    setIsDropdownOpen(false);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  // Helper to get initials if no photo
  const getInitials = (name: string) => {
    return name
      ? name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
      : "U";
  };

  return (
    <header className={`${isLandingPage ? "absolute bg-transparent border-transparent" : "fixed bg-[#14141e]/85 border-white/10"} top-0 left-0 w-full h-20 px-8 flex justify-between items-center z-50 backdrop-blur-xl border-b shadow-lg`}>
      <div className="flex items-center gap-2 text-2xl font-bold cursor-pointer text-white" onClick={() => navigate("/")}>
        <span className="text-2xl">⚡</span>
        <span className="font-semibold">AICreate Studio</span>
      </div>

      {!isLandingPage && (
        <nav className="flex gap-8">
          {isAuthenticated && (
            <NavLink to="/dashboard" className={({ isActive }) => `px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
              Dashboard
            </NavLink>
          )}
          <NavLink to="/gallery" className={({ isActive }) => `px-4 py-2 rounded-lg transition-colors ${isActive ? 'bg-white/20 text-white' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}>
            Gallery
          </NavLink>
        </nav>
      )}

      {!isLandingPage && (
        <div className="flex items-center gap-4 relative" ref={dropdownRef}>
          {isAuthenticated ? (
            <>
              {/* Credit Balance Display */}
              <div className="hidden md:flex flex-col items-end mr-2">
                <div className={`flex items-center gap-1 text-xs font-medium ${user?.subscriptionType === 'premium' ? 'text-amber-400 drop-shadow-[0_0_3px_rgba(251,191,36,0.5)]'
                  : user?.subscriptionType === 'pro' ? 'text-purple-400 drop-shadow-[0_0_3px_rgba(192,132,252,0.5)]'
                    : 'text-gray-400'
                  }`}>
                  <span>⚡</span>
                  <span>{user?.subscriptionType === 'premium' ? 'Unlimited' : (user?.generationsRemaining ?? 0)}</span>
                </div>
              </div>

              {/* Upgrade Button for Free Users */}
              {user?.subscriptionType !== 'premium' ? (
                <button
                  className="bg-gradient-to-r from-pink-500 to-purple-600 text-white px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider hover:-translate-y-0.5 hover:shadow-lg transition-all"
                  onClick={() => navigate("/subscription")}
                >
                  Upgrade
                </button>
              ) : (
                <div className="bg-gradient-to-r from-yellow-400 to-amber-600 text-white px-3 py-1 rounded-full text-xs font-bold uppercase shadow-md">PRO</div>
              )}

              {/* User Profile Button */}
              {/* User Profile Button */}
              <button className="flex items-center gap-3 cursor-pointer p-1 rounded-full hover:bg-white/10 transition-colors group" onClick={toggleDropdown}>
                <span className="text-white font-medium text-sm group-hover:text-white/90">
                  {user?.username}
                </span>

                {user?.photoUrl ? (
                  <img src={user.photoUrl} alt="User" className="w-9 h-9 rounded-full object-cover border-2 border-white/20 transition-transform group-hover:scale-105 group-hover:border-white/50" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FFE66D] flex items-center justify-center font-bold text-white border-2 border-white/20 transition-transform group-hover:scale-105 group-hover:border-white/50">
                    {getInitials(user?.username || "User")}
                  </div>
                )}
              </button>

              {/* Modern Dropdown */}
              {isDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 min-w-[280px] bg-[#1e1e28]/95 backdrop-blur-3xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 z-50">
                  <div className="p-6 bg-white/5 border-b border-white/5 flex items-center gap-4">
                    {user?.photoUrl ? (
                      <img src={user.photoUrl} alt="User" className="w-12 h-12 rounded-full object-cover border-2 border-white/10" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#FF6B6B] to-[#FFE66D] flex items-center justify-center font-bold text-xl text-white border-2 border-white/10">
                        {getInitials(user?.username || "User")}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="font-semibold text-white text-base">{user?.username}</span>
                      <span className="text-xs text-white/50">{user?.email}</span>
                    </div>
                  </div>

                  <div className="p-2 flex flex-col gap-1">
                    <button className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-all w-full text-left rounded-lg group" onClick={() => { navigate("/profile"); setIsDropdownOpen(false); }}>
                      <span className="w-5 text-center text-lg group-hover:scale-110 transition-transform">👤</span> Profile
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-all w-full text-left rounded-lg group" onClick={() => { navigate("/gallery?filter=my-generations"); setIsDropdownOpen(false); }}>
                      <span className="w-5 text-center text-lg group-hover:scale-110 transition-transform">⚡</span> My Generations
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-all w-full text-left rounded-lg group" onClick={() => { navigate("/subscription"); setIsDropdownOpen(false); }}>
                      <span className="w-5 text-center text-lg group-hover:scale-110 transition-transform">👑</span> Subscription
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-all w-full text-left rounded-lg group" onClick={() => { navigate("/billing"); setIsDropdownOpen(false); }}>
                      <span className="w-5 text-center text-lg group-hover:scale-110 transition-transform">💳</span> Billing
                    </button>
                    <button className="flex items-center gap-3 px-4 py-3 text-white/80 hover:bg-white/10 hover:text-white transition-all w-full text-left rounded-lg group" onClick={() => { navigate("/settings"); setIsDropdownOpen(false); }}>
                      <span className="w-5 text-center text-lg group-hover:scale-110 transition-transform">⚙️</span> Settings
                    </button>

                    <div className="h-px bg-white/10 my-2"></div>

                    <button className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all w-full text-left rounded-lg group" onClick={handleLogout}>
                      <span className="w-5 text-center text-lg group-hover:scale-110 transition-transform">🚪</span> Logout
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <button className="text-white hover:bg-white/20 px-4 py-2 rounded-lg transition-colors" onClick={handleLogin}>
              Login
            </button>
          )}
        </div>
      )}
    </header>
  );
};

export default Header;
