import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStudent } from '../context/StudentContext';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { SkillTag } from '../components/SkillTag';
import {
  Sparkles,
  ArrowRight,
  UserCheck,
  Search,
  BrainCircuit,
  ListOrdered,
  Target,
  TrendingUp,
  Compass,
  CheckCircle2,
  Building2,
  Layers
} from 'lucide-react';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { setActiveMatch, savedMatches } = useStudent();


  const handleViewExampleAnalysis = () => {
    // If already generated or saved, load it, otherwise navigate to analyze flow
    if (savedMatches['opp-1']) {
      setActiveMatch(savedMatches['opp-1']);
      navigate('/match-result');
    } else {
      navigate('/opportunities?analyze=opp-1');
    }
  };

  const steps = [
    {
      step: '01',
      title: 'Create Your Profile',
      desc: 'Input your degree, current year, CGPA, technical skills, and career interests in minutes.',
      icon: UserCheck
    },
    {
      step: '02',
      title: 'Discover Opportunities',
      desc: 'Explore curated internships, national hackathons, scholarships, and verified industry certifications.',
      icon: Search
    },
    {
      step: '03',
      title: 'Get AI Match Analysis',
      desc: 'Our explainable AI breaks down your match score, highlighting matched skills and specific skill gaps.',
      icon: BrainCircuit
    },
    {
      step: '04',
      title: 'Follow Your Action Plan',
      desc: 'Execute a custom step-by-step roadmap with learning resources to turn missing skills into strengths.',
      icon: ListOrdered
    }
  ];

  const whyChooseUs = [
    {
      title: 'Personalized Matching',
      desc: 'Algorithms benchmark your unique course branch, year, CGPA, and coding stack to find optimal fit.',
      icon: Target,
      color: 'from-blue-500/20 to-indigo-500/20 border-indigo-500/30 text-indigo-400'
    },
    {
      title: 'Explainable AI',
      desc: 'No vague black boxes. View explicit positive reasons why you match and clear eligibility verification.',
      icon: BrainCircuit,
      color: 'from-purple-500/20 to-pink-500/20 border-purple-500/30 text-purple-400'
    },
    {
      title: 'Skill Gap Detection',
      desc: 'Identify prerequisites and missing technologies upfront before spending hours submitting applications.',
      icon: Layers,
      color: 'from-amber-500/20 to-orange-500/20 border-amber-500/30 text-amber-400'
    },
    {
      title: 'Personalized Action Plan',
      desc: 'Turn rejection risk into qualification with concrete 4-step learning paths, projects, and resume tweaks.',
      icon: TrendingUp,
      color: 'from-emerald-500/20 to-teal-500/20 border-emerald-500/30 text-emerald-400'
    }
  ];

  return (
    <div className="relative overflow-hidden">
      {/* Background ambient lighting effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none opacity-40">
        <div className="absolute top-12 left-1/4 w-96 h-96 bg-indigo-600/30 rounded-full blur-[120px]" />
        <div className="absolute top-24 right-1/4 w-96 h-96 bg-purple-600/25 rounded-full blur-[140px]" />
      </div>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto mb-16">
          {/* Pill Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 mb-6 shadow-sm shadow-indigo-500/10">
            <Sparkles className="w-4 h-4 text-indigo-400 animate-pulse" />
            <span>Next-Gen Smart India Student Opportunity Platform</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white tracking-tight mb-6 leading-[1.15]">
            Find the Right Opportunities for{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400">
              Your Skills
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg md:text-xl text-slate-300 max-w-2xl mx-auto leading-relaxed mb-10">
            AI-powered opportunity matching that explains why you match, identifies your skill gaps, and creates a personalized action plan.
          </p>

          {/* Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="gradient"
              size="lg"
              onClick={() => navigate('/profile')}
              leftIcon={<UserCheck className="w-5 h-5" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto shadow-xl shadow-indigo-600/30"
            >
              Build My Profile
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={() => navigate('/opportunities')}
              leftIcon={<Compass className="w-5 h-5" />}
              className="w-full sm:w-auto"
            >
              Explore Opportunities
            </Button>
          </div>
        </div>

        {/* Example AI Match Interactive Preview Card */}
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-3">
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold">
              Live AI Match Intelligence Preview
            </span>
          </div>

          <div className="glass-panel glass-card-glow rounded-3xl p-6 sm:p-8 border border-indigo-500/40 shadow-2xl relative">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-lg shadow-lg">
                  TI
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Badge typeBadge="Internship" size="sm" />
                    <span className="text-xs text-slate-400 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5" />
                      Tech Innovations
                    </span>
                  </div>
                  <h3 className="text-xl font-bold text-white mt-1">
                    AI/ML Intern
                  </h3>
                </div>
              </div>

              {/* Match Score Display */}
              <div className="flex items-center gap-3 bg-indigo-950/60 border border-indigo-500/40 px-4 py-2 rounded-2xl w-fit">
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-indigo-300 tracking-wider">
                    Match Score
                  </div>
                  <div className="text-2xl font-black text-white">92%</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
              </div>
            </div>

            {/* Matched vs Missing Skills */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 my-6">
              {/* Skills Matched */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2.5">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Skills Matched</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <SkillTag skill="Python" status="matched" size="sm" />
                  <SkillTag skill="Machine Learning" status="matched" size="sm" />
                  <SkillTag skill="SQL" status="matched" size="sm" />
                </div>
              </div>

              {/* Missing Skills */}
              <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-400 mb-2.5">
                  <Layers className="w-4 h-4" />
                  <span>Missing Skill</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  <SkillTag skill="TensorFlow" status="missing" size="sm" />
                </div>
              </div>
            </div>

            {/* CTA to view analysis */}
            <Button
              variant="gradient"
              size="md"
              onClick={handleViewExampleAnalysis}
              leftIcon={<BrainCircuit className="w-4 h-4" />}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full text-sm font-semibold"
            >
              View AI Analysis
            </Button>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-slate-950/70 border-y border-slate-900 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold block mb-2">
              Step-by-Step Flow
            </span>
            <h2 className="text-3xl font-extrabold text-white mb-4">
              How It Works
            </h2>
            <p className="text-slate-400 text-sm md:text-base">
              From discovering opportunities to turning skill gaps into actionable learning milestones.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((item, index) => {
              const Icon = item.icon;
              return (
                <div
                  key={index}
                  className="glass-panel p-6 rounded-2xl border border-slate-800/80 relative flex flex-col justify-between hover:border-indigo-500/40 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className="font-heading font-black text-2xl text-slate-700">
                        {item.step}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mb-2">
                      {item.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Use AI Opportunity Matcher? Section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs uppercase tracking-widest text-indigo-400 font-bold block mb-2">
            Engineered For Student Success
          </span>
          <h2 className="text-3xl font-extrabold text-white mb-4">
            Why Use AI Opportunity Matcher?
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            Engineered to overcome common blind spots in college applications with transparent, actionable intelligence.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {whyChooseUs.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div
                key={idx}
                className="glass-panel p-7 rounded-2xl border border-slate-800/80 hover:border-slate-700 transition-all flex items-start gap-4"
              >
                <div
                  className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${card.color} border flex items-center justify-center shrink-0 shadow-md`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white mb-1.5">
                    {card.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="glass-panel glass-card-glow rounded-3xl p-8 sm:p-12 text-center border border-indigo-500/40 relative overflow-hidden shadow-2xl">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
              Ready to discover your opportunities?
            </h2>
            <p className="text-slate-300 text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Match your profile with hundreds of internships, hackathons, and certifications. Spot your missing skills and bridge them today.
            </p>
            <Button
              variant="gradient"
              size="lg"
              onClick={() => navigate('/profile')}
              leftIcon={<Sparkles className="w-5 h-5" />}
              rightIcon={<ArrowRight className="w-5 h-5" />}
              className="shadow-xl shadow-indigo-600/30"
            >
              Start Matching
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};
