# AI OPPORTUNITY MATCHER

AI-powered opportunity matching platform that explains why students match, identifies their skill gaps, and creates a personalized action plan. Designed and developed as a production-grade base project for hackathons and Smart India Hackathon (SIH) style showcases.

---

## 👥 Team Structure & Responsibilities

| Role | Branch | Assigned Scope | Key Directory / Files |
| :--- | :--- | :--- | :--- |
| **Member 1 – Frontend & UI (Lead)** | `member1-frontend` | Complete UI, pages, responsive layouts, components, design system, client routing | `src/pages/`, `src/components/`, `src/hooks/` |
| **Member 2 – AI & Matching** | `member2-ai-matching` | AI matching system, match scoring, explainable signals, skill gaps & action plan generation | `src/services/matchingService.ts`, `src/types/` |
| **Member 3 – Opportunities & Data** | `member3-opportunities-data` | Opportunity dataset curation, schema modeling, realistic test fixtures, data service | `src/data/mockOpportunities.ts`, `src/services/opportunityService.ts` |
| **Member 4 – Integration, Testing & PPT** | `member4-integration-testing` | Cross-branch integration, E2E testing, polish, demo flow validation, presentation & Q&A | `tests/`, documentation, bug fixes, final merge |

---

## 🌟 Demo Flow

The complete application journey works from end-to-end:

$$\text{Home} \longrightarrow \text{Student Profile} \longrightarrow \text{Find Opportunities} \longrightarrow \text{Opportunity Details} \longrightarrow \text{Analyze My Match} \longrightarrow \text{AI Analysis Screen} \longrightarrow \text{Match Result} \longrightarrow \text{Why You Match} \longrightarrow \text{Missing Skills} \longrightarrow \text{Eligibility} \longrightarrow \text{Personalized Action Plan}$$

1. **Home (`/`)**: Landing page with hero banner, live AI match preview card (AI/ML Intern, 92%), 4-step "How It Works", 4 core value pillars, and instant CTA.
2. **Student Profile (`/profile`)**: Form with Personal Information, Academic Background (Branches, Years, CGPA), interactive Skills tag manager, Interests, and Mode preference. Includes 1-click **Reset Demo Data** for rapid testing.
3. **Explore Opportunities (`/opportunities`)**: Real-time discovery dashboard with search, category pills, multi-criteria filters (Branch, Year, Mode, Skills, Eligibility toggle), and sort controls.
4. **Opportunity Details (`/opportunities/:id`)**: Comprehensive specifications, organization details, required skills, eligibility requirements, and a prominent **Analyze My Match** button.
5. **AI Loading Analysis Screen**: Sequential animated loading state with step-by-step progress checkmarks:
   - `✓ Checking your skills`
   - `✓ Comparing interests`
   - `✓ Checking eligibility`
   - `✓ Identifying skill gaps`
   - `✓ Creating personalized recommendations`
6. **Match Result (`/matches/:id` or `/match-result`)**:
   - Circular SVG gauge with match score and grade badge (e.g., `92% Excellent Match`).
   - Progress bar breakdown (Skills Match 95%, Interest Match 90%, Eligibility 100%, Overall 92%).
   - **Why You Match**: Transparent, positive explainable AI signal cards.
   - **Skills Matched**: Verified skill badges.
   - **Missing Skills**: Identified skill gaps with actionable advice.
   - **Academic Eligibility**: Verified branch, year, and GPA status checks.
7. **Personalized Action Plan (`/action-plan`)**:
   - 4-step roadmap (*Learn Skill*, *Build Project*, *Improve Resume*, *Apply Now*).
   - Live progress indicator (`2 of 4 tasks completed`) and readiness score.
   - Interactive **Start Learning** modal with curated docs, videos, and repo starters.
   - **Mark as Completed** task toggle.
   - **Apply Now** direct application link.
8. **My Matches (`/matches` or `/my-matches`)**:
   - Analyzed matches dashboard with summary metrics (*Total Analyzed*, *Average Score*, *Top Skill Gaps*).
   - Filter tabs: *All*, *Excellent Match*, *Good Match*, *Needs Improvement*.

---

## 🛠️ Technology Stack

- **Frontend Framework**: React 19 + TypeScript
- **Build Tool**: Vite 8
- **Styling**: Tailwind CSS v4 + Glassmorphic Design System
- **Routing**: React Router v7 (`react-router-dom`)
- **Icons**: Lucide React (`lucide-react`)
- **Fonts**: Google Fonts (`Plus Jakarta Sans` & `Outfit`)

---

## 📁 Project Structure

```
skillgap-ai-opportunity-matcher/
├── .env.example                 # Environment configuration template (committed)
├── .gitignore                   # Ignores node_modules, dist, and local .env files
├── index.html                   # HTML template with Google Fonts and metadata
├── package.json                 # Dependencies and npm scripts
├── package-lock.json            # Deterministic lockfile
├── README.md                    # Project documentation & team workflows
├── tsconfig.json                # TypeScript root configuration
├── tsconfig.app.json            # TypeScript frontend app rules
├── tsconfig.node.json           # TypeScript build tooling rules
├── vite.config.ts               # Vite configuration with Tailwind CSS v4 plugin
│
└── src/
    ├── components/              # Reusable, modular UI components
    │   ├── ActionPlanItem.tsx   # Roadmap step with completion toggle & modal trigger
    │   ├── Badge.tsx            # Opportunity type & match status pills
    │   ├── Button.tsx           # Button variants (primary, secondary, gradient, outline)
    │   ├── Card.tsx             # Glassmorphic container with glow borders
    │   ├── EmptyState.tsx       # No results fallback component
    │   ├── Footer.tsx           # SIH / hackathon branded footer
    │   ├── Input.tsx            # Form input with validation error states
    │   ├── LearningResourceModal.tsx # Fast-track learning resource accelerator modal
    │   ├── LoadingAnalysis.tsx  # Sequential multi-step AI loading screen
    │   ├── MatchScore.tsx       # Circular SVG gauge with glowing tier badge
    │   ├── Navbar.tsx           # Responsive header with mobile hamburger drawer
    │   ├── OpportunityCard.tsx  # Rich discovery card with badges & metadata
    │   ├── OpportunityModal.tsx # Full opportunity specification modal
    │   ├── ProgressBar.tsx      # Multi-colored animated progress bar
    │   ├── Select.tsx           # Custom styled dropdown
    │   └── SkillTag.tsx         # Matched, missing, and selectable skill tags
    │
    ├── pages/                   # Application route views
    │   ├── ActionPlan.tsx       # Personalized action plan & roadmap
    │   ├── Home.tsx             # Landing hero, preview card, and how it works
    │   ├── MatchResult.tsx      # Full AI match analysis & explainable signals
    │   ├── MyMatches.tsx        # Analyzed opportunities dashboard
    │   ├── Opportunities.tsx    # Opportunity discovery & multi-filter search
    │   ├── OpportunityDetails.tsx# Dedicated single opportunity page
    │   └── StudentProfile.tsx   # Complete student profile form with validation
    │
    ├── data/                    # Data layer (Member 3 domain)
    │   └── mockOpportunities.ts # 12+ realistic sample opportunities dataset
    │
    ├── services/                # Integration layer (Member 2 & 3 domain)
    │   ├── matchingService.ts   # AI match analysis function placeholder
    │   └── opportunityService.ts# Opportunity retrieval & filtering service
    │
    ├── types/                   # Shared TypeScript interfaces
    │   └── index.ts             # StudentProfile, Opportunity, MatchResult, ActionPlan
    │
    ├── hooks/                   # Custom React hooks
    │   └── useStudentProfile.ts # Profile state, validation, and tags management
    │
    ├── context/
    │   └── StudentContext.tsx   # Global state for profile, matches, and tasks
    │
    ├── App.tsx                  # Main router setup and layout
    ├── index.css                # Global stylesheet & Tailwind CSS import
    └── main.tsx                 # React DOM mount entry
```

---

## ⚙️ Environment Configuration

1. Copy `.env.example` to create a local `.env` file:
   ```bash
   cp .env.example .env
   ```

2. `.env` contains:
   ```env
   VITE_API_BASE_URL=http://localhost:5000
   VITE_APP_NAME=AI Opportunity Matcher
   ```

> **Security Note:** Never commit `.env` or real API keys to Git. Frontend code communicates with backend APIs using `import.meta.env.VITE_API_BASE_URL`.

---

## 🚀 Installation & Local Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Verify Production Build & TypeScript Types
```bash
npm run build
```

---

## 🌿 Git Branch Workflow

The project is structured so all 4 team members can work simultaneously on separate Git branches without merge conflicts or breaking the application.

### Branch Structure

- `main`: The stable, production-ready base project created by Member 1.
- `member1-frontend`: Member 1 (Frontend & UI enhancements, animations, styles).
- `member2-ai-matching`: Member 2 (AI matching engine, scoring algorithm, API integration).
- `member3-opportunities-data`: Member 3 (Opportunity dataset expansion, filtering criteria).
- `member4-integration-testing`: Member 4 (E2E testing, bug fixes, final merge verification).

---

### Step-by-Step Instructions for Each Member

#### 💻 For Member 1 (Frontend & UI):
```bash
git checkout -b member1-frontend
# Work inside src/components/, src/pages/, src/hooks/
git add .
git commit -m "feat(ui): enhance responsive layout and animations"
git push origin member1-frontend
```

#### 🤖 For Member 2 (AI & Matching):
Work primarily inside [`src/services/matchingService.ts`](file:///c:/Users/User/OneDrive/Desktop/skillgap-ai-opportunity-matcher/src/services/matchingService.ts):
```bash
git checkout main
git checkout -b member2-ai-matching
```
Replace the mock function `analyzeOpportunityMatch(profile, opportunity)` with your real AI/ML API call:
```typescript
export async function analyzeOpportunityMatch(
  profile: StudentProfile,
  opportunity: Opportunity
): Promise<MatchResult> {
  const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/match`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile, opportunity })
  });
  return await response.json();
}
```

#### 📊 For Member 3 (Opportunities & Data):
Work primarily inside [`src/data/mockOpportunities.ts`](file:///c:/Users/User/OneDrive/Desktop/skillgap-ai-opportunity-matcher/src/data/mockOpportunities.ts) and [`src/services/opportunityService.ts`](file:///c:/Users/User/OneDrive/Desktop/skillgap-ai-opportunity-matcher/src/services/opportunityService.ts):
```bash
git checkout main
git checkout -b member3-opportunities-data
```
Replace or extend `mockOpportunities` with your final curated dataset. Every item conforms to the `Opportunity` interface defined in [`src/types/index.ts`](file:///c:/Users/User/OneDrive/Desktop/skillgap-ai-opportunity-matcher/src/types/index.ts).

#### 🧪 For Member 4 (Integration, Testing & PPT):
```bash
git checkout main
git checkout -b member4-integration-testing
```
- Test each route: `/`, `/profile`, `/opportunities`, `/opportunities/:id`, `/matches`, `/matches/:id`, `/action-plan`.
- Verify form validation and reactive calculations.
- Merge verified branches into `main` after code review.
