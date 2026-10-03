# RECYCLINK — From Informal Collection to Formal Recycling

**Smart India Hackathon 2026 | Problem Statement: SIH26229**  
*“Kabadiwala Connect – Bringing the Informal Collector into the Formal Recycling Chain”*

---

## 🌿 Executive Summary

In India, over **90% of electronic waste** is handled by the informal sector (kabadiwalas and grassroots collectors). Despite providing essential collection labor, informal collectors suffer from:
1. **Zero Price Transparency**: No knowledge of precious metal yields (gold, copper, silver) inside circuit boards, leading to heavy exploitation by intermediaries.
2. **Poor Recycler Discovery**: Inability to directly connect with authorized, licensed formal recycling facilities.
3. **Hazardous Backyard Processing**: Burning PVC cables and crude acid leaching of motherboards, poisoning local ground water and releasing carcinogenic dioxins.
4. **No Digital Provenance**: Transactions remain cash-based and undocumented, leaving governments with zero visibility into national e-waste flows.

**RECYCLINK** is an intelligent informal-to-formal e-waste platform. It pairs a **mobile-first, voice-friendly, trilingual PWA** for collectors with an **AI Material Scanner**, a **Fair Price Intelligence Engine**, a **Smart Recycler Matcher**, and a **Circular Trace ID (QR) system** that creates a tamper-evident audit ledger from collection to smelter.

---

## 🚀 Key Features

- **📱 Mobile-First Collector PWA**: Designed for kabadiwalas with large touch targets, pictorial cards, voice-friendly visual cues, and trilingual support (**English, Hindi, Marathi**).
- **🔬 AI Material Scanner**: Modular Computer Vision classifier that instantly identifies components (PCB, insulated cables, Li-ion batteries, CRT monitors, motors, mixed plastics), estimating weight, hazard rating, and recoverable precious metals.
- **⚖️ Fair Price Intelligence**: Open commodity benchmark engine referencing CPCB guidelines to compute fair market pricing and tag recycler bids as *GOOD OFFER*, *FAIR*, or *BELOW FAIR*.
- **🏢 Verified Recycler Matching**: Ranks authorized recyclers based on proximity (km), offered rate (₹/kg), material compatibility, and reliability scores, marked with a visible `✓ CPCB AUTHORIZED RECYCLER` badge.
- **🔗 Circular Trace ID (QR)**: Every lot receives a unique Trace ID (e.g. `RC-2026-000184`) and dynamic QR code encoding a 7-stage verifiable provenance journey.
- **🛡️ AI Transaction Guardian**: Anomaly detection engine that flags predatory underbidding (>40% below benchmark) and scale weight discrepancies (>25%) to protect vulnerable collectors.
- **📴 Offline-First Field Architecture**: IndexedDB queue allows collectors to record intakes in low-connectivity areas with automatic background synchronization upon network recovery.
- **📊 Government / CPCB Analytics Dashboard**: Real-time national GIS map of collection hubs and smelters, avoided toxic emissions metrics, and strategic metal recovery indicators.
- **⚡ 90-Second Hackathon Judge Demo Mode**: Built-in interactive presentation tour that steps through the end-to-end lifecycle seamlessly.

---

## 🛠️ Technology Stack

| Tier | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Tailwind CSS, Lucide Icons, Recharts, Leaflet, Canvas Confetti |
| **Backend** | Python 3.11, FastAPI, Pydantic v2, SQLAlchemy 2.0, Uvicorn |
| **Database** | SQLite (Zero-config local hackathon fallback) / PostgreSQL |
| **AI / Intelligence** | Modular Python CV Inference Engine, Benchmark Regression Estimator, Anomaly Guardian |
| **Security** | JWT Authentication, Passlib bcrypt, Role-Based Access Control (RBAC) |
| **Traceability** | Dynamic QR Generation (PNG / SVG Data URLs), 7-Stage Chronological Audit Ledger |

---

## 📂 Repository Monorepo Structure

```
SIH 2K26/
├── backend/
│   ├── app/
│   │   ├── ai/              # Modular AI Material Classifier & Anomaly Detector
│   │   ├── auth/            # JWT security, password hashing, and RBAC
│   │   ├── database/        # SQLAlchemy engine and session factory
│   │   ├── matching/        # Smart Recycler proximity and scoring algorithm
│   │   ├── models/          # Domain entity models
│   │   ├── pricing/         # Fair price intelligence and commodity benchmarks
│   │   ├── routers/         # REST API endpoints (Auth, Collector, AI, Recycler, Admin, Trace)
│   │   ├── schemas/         # Pydantic v2 validation models
│   │   ├── traceability/    # Dynamic QR code generation
│   │   ├── config.py        # Settings configuration
│   │   └── main.py          # FastAPI application entrypoint
│   ├── tests/
│   │   └── test_api.py      # Automated Pytest suite
│   ├── requirements.txt     # Python backend dependencies
│   ├── .env.example         # Environment template
│   └── recyclink.db         # Seeded SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/      # Navbar, LandingHero, DemoTourModal
│   │   ├── context/         # AuthContext, I18nContext
│   │   ├── locales/         # en.json, hi.json, mr.json
│   │   ├── pages/           # CollectorPortal, RecyclerPortal, TraceExplorer, AdminDashboard
│   │   ├── services/        # api.js, offlineSync.js
│   │   ├── App.jsx          # Master layout and router
│   │   ├── index.css        # Tailwind & glassmorphism design system
│   │   └── main.jsx         # React root
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── docs/
│   ├── architecture.md      # Detailed system blueprints and data flows
│   ├── api.md               # OpenAPI REST endpoint specifications
│   ├── database.md          # ER diagrams and table dictionaries
│   └── demo-script.md       # 90-second judge pitch walkthrough
└── scripts/
    └── seed_demo_data.py    # Realistic Indian dataset generator
```

---

## ⚡ Quickstart & Setup Guide

### 1. Backend Setup & Startup
```powershell
# Navigate to workspace root
cd "c:\Users\HP\SIH 2K26"

# Activate environment and set PYTHONPATH
$env:Path = "C:\Users\HP\AppData\Local\Programs\Python\Python311;C:\Users\HP\AppData\Local\Programs\Python\Python311\Scripts;" + $env:Path
$env:PYTHONPATH = "backend"

# Seed rich demo dataset (31 users, 20 collectors, 10 recyclers, 15 materials, 155 trace events)
python scripts/seed_demo_data.py

# Run backend API server
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`.

### 2. Frontend Setup & Startup
In a separate terminal:
```powershell
cd "c:\Users\HP\SIH 2K26\frontend"

# Add node to PATH if needed
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Start Vite dev server
npm.cmd run dev
```
Open `http://localhost:5173` in your browser!

---

## 🔑 Demo Personas & Credentials

| Role | Email | Phone | Password | Access Area |
|---|---|---|---|---|
| **Collector** | `collector@recyclink.in` | `9876543210` | `collector123` | Mobile Collector PWA, AI Scanner, QR Generator |
| **Recycler** | `recycler@recyclink.in` | `9876500001` | `recycler123` | Operations Portal, Logistics, Digital Handover |
| **CPCB Admin** | `admin@recyclink.in` | `9876599999` | `admin123` | National GIS Map, KPIs, Anomaly Guardian Log |

*(Judges can also switch personas in 1-click using the **"Switch Role"** dropdown on the top navbar).*

---

## 🧪 Automated Testing

Run the full backend test suite:
```powershell
$env:PYTHONPATH = "backend"
python -m pytest backend/tests/test_api.py backend/tests/test_phase8_admin.py -v
```
**Results:** `29 passed` (100% passing).

---

## 🏛️ Phase 8 — Admin / Government Impact Intelligence & Command Center

The **E-Waste Circular Economy Command Center** provides statutory regulators (CPCB, MoEFCC, SPCB) with enterprise visibility into national informal-to-formal flows:
- **Executive Command Center (`/admin/dashboard`)**: 8 live database-driven KPI cards (Weight, Lots, Completed Txns, Collector Value, Handovers, Recyclers, Collectors, Anomalies) with trend percentages vs prior period.
- **Informal → Formal Transition Funnel**: 8-stage conversion pipeline measuring retention and drop-off from collection to smelter receipt.
- **Deep Sector Analytics (`/admin/analytics`)**: Collector economic impact, CPCB price fairness index, prototype AI confidence distributions (0-60%, 60-75%, 75-90%, 90-100%), and hazardous fraction diversion metrics.
- **AI Transaction Guardian Anomaly Center (`/admin/anomalies`)**: Algorithmic detection of predatory pricing and scale mismatches with one-click administrative review, status transitions, and audit trails.
- **Regulatory Reporting & CSV Exports (`/admin/reports`)**: 9 statutory audit templates with configurable filters, print views, and dynamic CSV streaming.
- **Privacy Architecture**: Full masking of collector telephone numbers, domestic residential addresses, and payment details in administrative views.

---

## 🏆 Hackathon Judge Verification Checklist

- [x] **Frontend starts & builds cleanly** (`npm run build` passed with 0 errors).
- [x] **Backend starts successfully** (FastAPI with CORS & Pydantic v2).
- [x] **Database connects & seeds** (31 users, 20 collectors, 10 recyclers, 155 trace events across Hyderabad, Vijayawada, Guntur, Bapatla, Bengaluru, Mumbai, Pune, Delhi).
- [x] **Authentication & RBAC** (Collector, Recycler, Admin with JWT tokens).
- [x] **AI Material Scanner** (Detects PCB, Cables, Batteries, CRT, LCD, Motors with confidence & precious metals).
- [x] **Fair Price Intelligence** (Benchmarks CPCB commodity index & classifies offers).
- [x] **Recycler Recommendation** (Distance, scrap rate, and CPCB license verification).
- [x] **Trace ID & QR Generation** (`RC-2026-XXXXXX` generated dynamically).
- [x] **Digital Handover Verification** (Scale reconciliation & instant UPI payout).
- [x] **Circular Trace ID Explorer** (7-stage chronological interactive timeline).
- [x] **Admin / Government Analytics** (GIS hotspots, material distribution, avoided toxic fractions).
- [x] **AI Transaction Guardian** (Flags predatory underpricing >40% below benchmark).
- [x] **Offline-First Support** (IndexedDB queue + auto-sync when online).
- [x] **Trilingual Support** (English, Hindi, Marathi).
- [x] **90-Second Demo Mode** (Guided presentation flow with celebration confetti).
- [x] **Phase 8: Government Console Sidebar & Navigation Drawer** (Overview, Operations, Intelligence, Reports, System).
- [x] **Phase 8: Executive 8 KPI Cards with database aggregations & period trends**.
- [x] **Phase 8: 8-Stage Informal → Formal Recycling Transition Funnel**.
- [x] **Phase 8: Time-Series Collection Trend with Weight / Lot Count / Payout toggles**.
- [x] **Phase 8: Anomaly Command Center with review, resolution, and audit logging**.
- [x] **Phase 8: CPCB Recycler Performance & informal collector directories with privacy masking**.
- [x] **Phase 8: Statutory Report Generation & Dynamic CSV Data Streaming**.
- [x] **Phase 8: Comprehensive Metric Definitions Documentation (`docs/phase8_metrics.md`)**.
- [x] **Phase 8: 14 Automated Pytest Suite Tests (100% passing)**.
- [x] **Phase 10: Grand Finale National Intelligence & Digital Material Passport**.
- [x] **Phase 11: Autonomous Circular Economy Intelligence & Network Optimization**.
- [x] **Phase 12: Circular Economy Network Orchestration & Trust Hub**.
  - **Circular Network Graph**: Ground-truth relationship topology mapping Collectors → Lots → Materials → Pickups → Recyclers → Certified Processing Stages (zero fake blockchains).
  - **Network Health Score (0-100)**: Transparent weighted formulation (`Traceability * 0.25 + Pickups * 0.20 + Capacity * 0.15 + Handover * 0.15 + Anomaly * 0.10 + Action * 0.10 + DataQuality * 0.05`) with interactive "Why this score?" factor explainability.
  - **Participant Trust Profiles**: Strictly non-discriminatory, dynamic trust governance calculated exclusively from completed handovers, digital passport traceability, and cancellation/dispute rates. Zero demographic or protected characteristics.
  - **Dispute Center**: Evidence packages with tare weighbridge scales, collection weight delta, objective AI evidence summarization (non-judgmental), and human-in-the-loop administrative resolution.
  - **Incentive Intelligence & Anti-Gaming**: Configurable points, badges, recognition, trigger events, and anti-gaming audit preventing artificial splitting and duplicate rewards.
  - **Institutional Onboarding**: Municipalities (GHMC), Universities, Corporates, and NGOs with lifecycle tracking (`APPLICATION` → `ACTIVE`) and organization-scoped views.
  - **Multi-Scenario Policy Simulator**: What-if comparisons (Baseline vs Policy A vs Policy B) with explainable formulas, assumptions, and explicit `SIMULATION_NOT_POLICY_ADVICE` disclaimers.
  - **Material Flow Analytics & Traceability Gap Detection**: 7-stage circular journey tracking with drop-off percentages and detection of downstream unaccounted records flagged as Traceability Gaps.
  - **Data Quality Center**: Multi-factor scoring (completeness, consistency, validity, timeliness) and actionable remediation tasks with assigned owners.
  - **Policy Center & Immutable Versioning**: Configurable operational thresholds with full audit history and single-click safe rollback.
  - **Operational Incidents & Response Playbooks**: Capacity crises and logistics backlogs with guided human action checklists and post-incident learning reviews.
  - **Institutional Report Generator**: Formal audit-ready CPCB circular economy reports clearly distinguishing `ACTUAL`, `ESTIMATE`, `SIMULATION`, and `DEMO`.
- [x] **Phase 12: 13 Automated Pytest Suite Tests (100% passing; 128 total backend tests passing)**.

