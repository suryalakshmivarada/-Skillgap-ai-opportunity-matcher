import React, { useState } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import {
  Sparkles,
  Menu,
  X,
  Compass,
  User,
  CheckCircle2,
  ListTodo,
  Home as HomeIcon,
  Search
} from 'lucide-react';
import { Button } from './Button';

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { savedMatches } = useStudent();
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
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all">
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
            <div className="font-heading font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              <span>AI Opportunity</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
                Matcher
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-medium tracking-wider uppercase -mt-0.5">
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
                      ? 'text-white bg-indigo-600/15 border border-indigo-500/30 shadow-sm'
                      : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                  }`
                }
              >
                <Icon className="w-4 h-4 text-slate-400" />
                <span>{link.name}</span>
                {link.badge !== undefined && (
                  <span className="ml-1 px-1.5 py-0.2 text-[10px] font-bold rounded-full bg-indigo-500 text-white leading-tight">
                    {link.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Desktop Right CTA */}
        <div className="hidden md:flex items-center gap-3">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/opportunities')}
            leftIcon={<Search className="w-4 h-4" />}
          >
            Find Opportunities
          </Button>
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex md:hidden items-center gap-2">
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
        <div className="md:hidden glass-panel border-b border-slate-800 px-4 pt-3 pb-6 animate-in slide-in-from-top-4 duration-200">
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
                        ? 'text-white bg-indigo-600/20 border border-indigo-500/40 font-semibold'
                        : 'text-slate-300 hover:bg-slate-900'
                    }`
                  }
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span>{link.name}</span>
                  </div>
                  {link.badge !== undefined && (
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-indigo-500 text-white">
                      {link.badge}
                    </span>
                  )}
                </NavLink>
              );
            })}
          </nav>
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
    </header>
  );
};
