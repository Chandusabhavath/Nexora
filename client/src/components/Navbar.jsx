import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { 
  MapPin, 
  Search, 
  Sparkles, 
  User, 
  LogOut, 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  ChevronDown,
  Menu,
  X
} from 'lucide-react';

export const Navbar = ({ onOpenAIModal }) => {
  const { user, logout, currentLocality, setCurrentLocality, isAuthenticated, isAdmin, isProvider } = useAuth();
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const localities = [
    'Bandra, Mumbai',
    'Khar, Mumbai',
    'Juhu, Mumbai',
    'Andheri West, Mumbai',
    'Santacruz, Mumbai',
    'Mahim, Mumbai',
    'Dadar, Mumbai',
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-surface-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Brand */}
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-forest-800 flex items-center justify-center text-white font-black text-xl shadow-md group-hover:bg-forest-900 transition-colors">
                N
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-2xl tracking-tight text-forest-900 font-sans">
                  NEXORA
                </span>
                <span className="text-[10px] tracking-wider uppercase font-semibold text-forest-600 -mt-1">
                  Hyperlocal Marketplace
                </span>
              </div>
            </Link>

            {/* Location Selector */}
            <div className="relative hidden md:block">
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center space-x-2 text-xs font-medium text-gray-700 bg-surface-100 hover:bg-surface-200 px-3.5 py-2 rounded-full transition-colors border border-surface-200"
              >
                <MapPin className="w-3.5 h-3.5 text-forest-700" />
                <span>{currentLocality}</span>
                <ChevronDown className="w-3 h-3 text-gray-400" />
              </button>

              {showLocationDropdown && (
                <div className="absolute left-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-surface-200 py-2 z-50 animate-fadeIn">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Service Area Locality
                  </div>
                  {localities.map((loc) => (
                    <button
                      key={loc}
                      onClick={() => {
                        setCurrentLocality(loc);
                        setShowLocationDropdown(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 text-xs hover:bg-surface-100 transition-colors ${
                        currentLocality === loc ? 'text-forest-800 font-semibold bg-forest-50' : 'text-gray-700'
                      }`}
                    >
                      {loc}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Center Search / AI Match Prompt Bar */}
          <div className="hidden lg:flex items-center flex-1 max-w-md mx-8">
            <button
              onClick={onOpenAIModal}
              className="w-full flex items-center justify-between bg-surface-100 hover:bg-surface-200/80 text-gray-500 px-4 py-2.5 rounded-xl border border-surface-200 transition-all group shadow-sm"
            >
              <div className="flex items-center space-x-2.5">
                <Sparkles className="w-4 h-4 text-forest-600 group-hover:rotate-12 transition-transform" />
                <span className="text-xs text-gray-600 font-normal">
                  Describe task... "Electrician tomorrow morning"
                </span>
              </div>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-forest-800 text-white">
                AI Match
              </span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link
              to="/search"
              className="text-sm font-medium text-gray-700 hover:text-forest-800 transition-colors flex items-center space-x-1.5"
            >
              <Search className="w-4 h-4 text-gray-400" />
              <span>Explore Services</span>
            </Link>

            {/* Provider Onboarding Entry */}
            {!isProvider && !isAdmin && (
              <Link
                to="/register?role=provider"
                className="text-xs font-semibold text-forest-800 bg-forest-50 hover:bg-forest-100 px-3.5 py-2 rounded-lg border border-forest-200 transition-colors flex items-center space-x-1.5"
              >
                <Briefcase className="w-3.5 h-3.5 text-forest-700" />
                <span>Become a Provider</span>
              </Link>
            )}

            {/* Auth Dropdown / Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center space-x-3 p-1.5 rounded-full hover:bg-surface-100 transition-colors"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/initials/svg?seed=${user.name}&backgroundColor=0F382C`}
                    alt={user.name}
                    className="w-9 h-9 rounded-full object-cover border-2 border-forest-800 shadow-sm"
                  />
                  <div className="hidden xl:flex flex-col text-left">
                    <span className="text-xs font-semibold text-gray-900 leading-tight">{user.name}</span>
                    <span className="text-[10px] text-gray-500 capitalize">{user.role}</span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-surface-200 py-2 z-50 animate-fadeIn">
                    <div className="px-4 py-2.5 border-b border-surface-200">
                      <p className="text-xs font-semibold text-gray-900">{user.name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      <span className="inline-block mt-1.5 text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                        {user.role}
                      </span>
                    </div>

                    {user.role === 'customer' && (
                      <Link
                        to="/dashboard"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-surface-100 transition-colors"
                      >
                        <Calendar className="w-4 h-4 text-forest-700" />
                        <span>My Bookings & History</span>
                      </Link>
                    )}

                    {user.role === 'provider' && (
                      <Link
                        to="/provider/dashboard"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-surface-100 transition-colors"
                      >
                        <Briefcase className="w-4 h-4 text-forest-700" />
                        <span>Provider Dashboard</span>
                      </Link>
                    )}

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setShowUserDropdown(false)}
                        className="flex items-center space-x-2.5 px-4 py-2.5 text-xs text-gray-700 hover:bg-surface-100 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-forest-700" />
                        <span>Admin Oversight Portal</span>
                      </Link>
                    )}

                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2.5 px-4 py-2.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors border-t border-surface-200 mt-1"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="text-xs font-semibold text-gray-700 hover:text-forest-800 px-3.5 py-2 rounded-lg transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/register"
                  className="text-xs font-semibold text-white bg-forest-800 hover:bg-forest-900 px-4 py-2.5 rounded-lg shadow-sm transition-all hover:shadow"
                >
                  Join NEXORA
                </Link>
              </div>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={onOpenAIModal}
              className="p-2 rounded-lg bg-forest-50 text-forest-800"
              title="AI Task Search"
            >
              <Sparkles className="w-5 h-5" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-surface-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-200 bg-white px-4 pt-3 pb-6 space-y-3">
          <button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenAIModal();
            }}
            className="w-full flex items-center justify-center space-x-2 bg-forest-800 text-white py-3 rounded-xl font-medium text-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>AI Smart Task Matching</span>
          </button>
          <Link
            to="/search"
            onClick={() => setMobileMenuOpen(false)}
            className="block py-2.5 text-sm font-medium text-gray-800"
          >
            Explore Services
          </Link>
          {isAuthenticated ? (
            <>
              {user.role === 'customer' && (
                <Link
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-sm font-medium text-gray-800"
                >
                  Customer Dashboard
                </Link>
              )}
              {user.role === 'provider' && (
                <Link
                  to="/provider/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-sm font-medium text-gray-800"
                >
                  Provider Dashboard
                </Link>
              )}
              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-2.5 text-sm font-medium text-gray-800"
                >
                  Admin Portal
                </Link>
              )}
              <button
                onClick={handleLogout}
                className="w-full text-left py-2.5 text-sm font-medium text-rose-600 border-t border-gray-100"
              >
                Sign Out
              </button>
            </>
          ) : (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg border border-gray-300 text-sm font-semibold text-gray-700"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-lg bg-forest-800 text-white text-sm font-semibold"
              >
                Join
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
};
