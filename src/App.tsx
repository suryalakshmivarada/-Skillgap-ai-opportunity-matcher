import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { StudentProvider } from './context/StudentContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { Home } from './pages/Home';
import { StudentProfile } from './pages/StudentProfile';
import { Opportunities } from './pages/Opportunities';
import { OpportunityDetails } from './pages/OpportunityDetails';
import { MatchResult } from './pages/MatchResult';
import { ActionPlan } from './pages/ActionPlan';
import { MyMatches } from './pages/MyMatches';

// Scroll to top on route change helper
const ScrollToTop: React.FC = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

export const App: React.FC = () => {
  return (
    <StudentProvider>
      <BrowserRouter>
        <ScrollToTop />
        <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 selection:bg-indigo-500 selection:text-white">
          <Navbar />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<StudentProfile />} />
              <Route path="/opportunities" element={<Opportunities />} />
              <Route path="/opportunities/:id" element={<OpportunityDetails />} />
              <Route path="/match-result" element={<MatchResult />} />
              <Route path="/matches/:id" element={<MatchResult />} />
              <Route path="/matches" element={<MyMatches />} />
              <Route path="/my-matches" element={<MyMatches />} />
              <Route path="/action-plan" element={<ActionPlan />} />
              {/* Fallback to Home */}
              <Route path="*" element={<Home />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </StudentProvider>
  );
};

export default App;
