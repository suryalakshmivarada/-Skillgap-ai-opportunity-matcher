import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { useTheme } from '../context/ThemeContext';
import {
  Sparkles,
  Menu,
  X,
  Compass,
  User,
  CheckCircle2,
  ListTodo,
  Home as HomeIcon,
  Search,
  Sun,
  Moon,
  LogIn,
  LogOut
} from 'lucide-react';
import { Button } from './Button';
import { AuthModal } from './AuthModal';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { savedMatches, backendOnline, isAuthenticated, profile, logout } = useStudent();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const matchCount = Object.keys(savedMatches).length;

  const navLinks = [
    { name: 'Home', path: '/', icon: HomeIcon },
    { name: 'Student Profile', path: '/profile', icon: User },
    { name: 'Opportunities', path: '/opportunities', icon: Compass },
    {
      name: 'My Matches',
      path: '/my-matches',
      icon: CheckCircle2,
      badge: matchCount > 0 ? matchCount : undefined
    },
    { name: 'Action Plan', path: '/action-plan', icon: ListTodo }
  ];

  const closeMenu = () => setMobileMenuOpen(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-white/85 dark:bg-slate-950/80 border-b border-slate-200/90 dark:border-slate-800/80 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link
          to="/"
          onClick={closeMenu}
          className="flex items-center gap-2.5 group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 group-hover:shadow-indigo-500/50 transition-all duration-300">
            <Sparkles className="w-5 h-5 animate-pulse-subtle" />
          </div>
          <div>
            <div className="font-heading font-extrabold text-base tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5 transition-colors">
              <span>AI Opportunity</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                Matcher
              </span>
            </div>
            <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
              Explainable AI Matcher
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.path}
                to={link.path}
                className={({ isActive }) =>
                  `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-indigo-600/15 border border-indigo-200 dark:border-indigo-500/30 shadow-sm font-semibold'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                <span>{link.name}</span>
                {link.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-600 dark:bg-indigo-500 text-white leading-tight">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Right CTA & Theme Toggle */}
        <div className="hidden md:flex items-center gap-2.5">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#00FFFF] hover:border-indigo-300 dark:hover:border-cyan-500/40 transition-all duration-200 cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-200 rotate-0 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600 transition-transform duration-200 -rotate-12 hover:rotate-0" />
            )}
          </button>

          {/* Authentication Button / User Profile */}
          {isAuthenticated ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => navigate('/profile')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/80 dark:bg-indigo-950/40 text-xs font-semibold text-indigo-700 dark:text-cyan-300 hover:border-indigo-400 dark:hover:border-cyan-400 transition-all cursor-pointer shadow-xs"
                title={`Signed in as ${profile.fullName} (${profile.email})`}
              >
                <User className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
                <span className="max-w-[90px] truncate">{profile.fullName.split(' ')[0]}</span>
              </button>
              <button
                type="button"
                onClick={logout}
                className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-slate-500 hover:text-rose-500 hover:border-rose-300 dark:hover:border-rose-500/40 transition-colors cursor-pointer"
                title="Sign Out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:border-indigo-300 dark:hover:border-cyan-500/40 transition-all cursor-pointer shadow-xs"
            >
              <LogIn className="w-3.5 h-3.5 text-indigo-600 dark:text-cyan-400" />
              <span>Sign In</span>
            </button>
          )}

          {/* Backend Status Pill */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium border ${
              backendOnline
                ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/30'
            }`}
            title={backendOnline ? 'Connected to Backend (Port 5000)' : 'Running with local resilience'}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                backendOnline ? 'bg-emerald-500 dark:bg-emerald-400 animate-pulse' : 'bg-amber-500 dark:bg-amber-400'
              }`}
            />
            <span>{backendOnline ? 'API Connected' : 'Local Mode'}</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/opportunities')}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Find Opportunities
          </Button>
        </div>

        {/* Mobile Header Actions (Theme Toggle + Hamburger) */}
        <div className="flex md:hidden items-center gap-2">
          {/* Mobile Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/80 text-slate-700 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-[#00FFFF] transition-all cursor-pointer shadow-sm active:scale-95 flex items-center justify-center"
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-indigo-600" />
            )}
          </button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-slate-200 dark:border-slate-800 px-4 pt-3 pb-6 animate-in slide-in-from-top-4 duration-200">
          <nav className="flex flex-col gap-1.5 mb-5">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <NavLink
                  key={link.path}
                  to={link.path}
                  onClick={closeMenu}
                  className={({ isActive }) =>
                    `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      isActive
                        ? 'text-indigo-600 dark:text-white bg-indigo-50 dark:bg-indigo-600/20 border border-indigo-200 dark:border-indigo-500/40 font-semibold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-600 dark:bg-indigo-500 text-white">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Theme Toggle Pill Row */}
          <div className="flex items-center justify-between p-3 mb-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>Theme</span>
            </span>
            <button
              type="button"
              onClick={toggleTheme}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200 shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
            </button>
          </div>

          {/* Mobile Auth Row */}
          <div className="flex items-center justify-between p-3 mb-4 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs">
            <span className="font-medium text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-500 dark:text-cyan-400" />
              <span>{isAuthenticated ? profile.fullName : 'Account'}</span>
            </span>
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => {
                  logout();
                  closeMenu();
                }}
                className="px-3 py-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400 font-semibold cursor-pointer"
              >
                Sign Out
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  closeMenu();
                  setIsAuthModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-semibold cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>

          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              closeMenu();
              navigate('/opportunities');
            }}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Find Opportunities
          </Button>
        </div>
      )}

      {/* Authentication Modal */}
      <AuthModal isOpen={isAuthModalOpen} onClose={() => setIsAuthModalOpen(false)} />
    </header>
  );
};
