import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Heart, ShieldCheck, Cpu } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-auto border-t border-slate-900 bg-slate-950/90 text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Brand Column */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-md">
                <Sparkles className="w-4 h-4" />
              </div>
              <span className="font-heading font-bold text-lg text-white">
                AI Opportunity Matcher
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm mb-4 leading-relaxed">
              Empowering students to bridge skill gaps and land best-fit internships, hackathons, scholarships, and certifications with transparent, explainable AI matching.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> Explainable AI
              </span>
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" /> Eligibility Engine
              </span>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Platform
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/profile" className="hover:text-white transition-colors">
                  Student Profile
                </Link>
              </li>
              <li>
                <Link to="/opportunities" className="hover:text-white transition-colors">
                  Explore Opportunities
                </Link>
              </li>
              <li>
                <Link to="/my-matches" className="hover:text-white transition-colors">
                  My Analyzed Matches
                </Link>
              </li>
              <li>
                <Link to="/action-plan" className="hover:text-white transition-colors">
                  Personalized Action Plan
                </Link>
              </li>
            </ul>
          </div>

          {/* Team / Architecture notes */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider mb-3">
              Integration Architecture
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p>
                <strong className="text-slate-300">Member 1:</strong> Frontend & UI (Modular React + Tailwind)
              </p>
              <p>
                <strong className="text-slate-300">Member 2:</strong> Explainable AI & Scoring Model
              </p>
              <p>
                <strong className="text-slate-300">Member 3:</strong> Opportunity Aggregator & Dataset
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>© 2026 AI Opportunity Matcher. Built for College Hackathon & SIH Showcases.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for ambitious students
          </p>
        </div>
      </div>
    </footer>
  );
};
