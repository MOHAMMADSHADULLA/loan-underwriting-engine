# YottaFlex.ai — Loan Underwriting & Decisioning Dashboard

A modern, production-grade React + TypeScript frontend dashboard for the **Loan Underwriting & Decisioning Engine** developed for the YottaFlex.ai Associate AI Forward Deployed Engineer challenge.

The user interface follows the provided fintech design language: a high-contrast lime-and-forest aesthetic, generous rounded card containers (`rounded-[28px]` / `rounded-[32px]`), intuitive navigation pills, and interactive data visualization.

---

## 1. Architecture & Design System

- **Design System:** Adapted from the official YottaFlex fintech UI reference:
  - **Primary Lime Accent:** `#A3E635` / `#B4F04D`
  - **Dark Forest Obsidian:** `#0F291E`
  - **Neutral Canvas:** `#ECEEEB`
  - **Surface Cards:** `#FFFFFF` with soft shadows (`shadow-card`, `shadow-hero`)
- **Technology Stack:**
  - **React 18** + **TypeScript**
  - **Vite 5** (Fast HMR & Optimized Production Bundler)
  - **Tailwind CSS 3** (Custom design tokens & responsive utilities)
  - **Recharts** (Donut gauges, linear trend lines, risk-bracket bar distributions)
  - **Lucide React** (Consistent modern icon set)
  - **React Router 6** (Client-side routing & deep-linking)
  - **Vitest** + **Testing Library** (Unit & integration tests)

---

## 2. Application Modules & Pages

1. **Dashboard Overview (`/` or `/overview`):**
   - High-impact KPI hero cards matching the reference design (`Total Requested Capital`, `Approved & Disbursed Capital`, `Average DTI`, `Average Credit Score`).
   - Decision outcome donut ring gauge with central metric callout.
   - Product allocation horizontal progress bars.
   - Recent underwriting queue list with status checkmark pill badges.
   - Quick anomaly health monitoring banner.

2. **Applications Management (`/applications`):**
   - Searchable, filterable, sortable table of all loan applications.
   - Filters: Decision outcome (Approved / Rejected / Manual Review), Loan Product (`PROD-001` to `PROD-004`), Lifecycle status.
   - Sorting by requested principal, term, DTI, credit score, submission timestamp.
   - Configurable pagination (10, 25, 50 rows per page).

3. **Application Dossier & Details (`/applications/:id`):**
   - Comprehensive multi-card dossier for each loan application.
   - Applicant profile & verified employment details.
   - Affordability cash-flow stress test breakdown (verified income, debt obligations, living expenses, proposed loan payment, DTI, NDI).
   - Full French amortization repayment schedule table with penny-accurate reconciliation.
   - Chronological audit ledger event timeline.
   - Evidentiary document checklist with verification status.
   - Fair lending guardrail callout confirming isolation of protected demographic characteristics.

4. **Loan Products Catalog (`/products`):**
   - Full specifications for all 4 credit products:
     - `PROD-001` (Prime Personal): $5k–$40k, 12–60 mo, 5.75% APR, Max 40% DTI, Min 680 Credit Score
     - `PROD-002` (Near-Prime Personal): $2k–$25k, 12–48 mo, 8.50% APR, Max 45% DTI, Min 600 Credit Score
     - `PROD-003` (Micro Business): $1k–$15k, 6–36 mo, 10.50% APR, Max 50% DTI, Min 580 Credit Score
     - `PROD-004` (SME Expansion): $20k–$100k, 12–84 mo, 6.25% APR, Max 38% DTI, Min 700 Credit Score
   - Dynamic portfolio application volume and approval rates per product.

5. **Underwriting Analytics (`/analytics`):**
   - Recharts visual analytics:
     - Approval vs rejection distribution
     - Monthly application volume trend across CY 2026
     - Requested loan amount distribution by borrowing tranche
     - Application volume by product
     - Debt-to-income (DTI) risk bracket spread
     - Requested loan terms breakdown
     - Affordability check outcomes

6. **Validation Center (`/validation`):**
   - Interactive inspection of the 5 injected synthetic anomaly categories:
     1. Loan term outside product limits
     2. Repayment schedule reconciliation mismatch
     3. Decision precedes affordability checks
     4. Conflicting income sources (> 40% discrepancy)
     5. Duplicate application disbursement
   - Ground truth 5/5 parity reconciliation table.
   - Relational integrity verification (Primary Key Uniqueness: PASSED; Foreign Key Integrity: PASSED).

7. **Data Explorer (`/explorer`):**
   - Browse raw records across all 12 relational dataset tables.
   - Search across all fields, table switching, and responsive pagination.
   - Strict ground-truth isolation callout.

8. **Settings (`/settings`):**
   - Switch between **Starter Scale** (60 applications) and **Full Scale** (6,000 applications).
   - View fixed reproducibility seed (`20261022`) and engine parameters.
   - Design system palette tokens inspection.

---

## 3. Data Integration & Architecture

- **Clean Decoupled Data Layer:** The frontend accesses exported datasets located in `frontend/public/data/starter/` (and `/full/`).
- **No Backend Modifications:** The Python backend, CLI, generator, and tests remain 100% untouched and protected.
- **Client-Side Normalization:** `dataService.ts` normalizes dates, joins relational foreign keys, filters, sorts, and paginates data in memory without altering source files.
- **Ground Truth Isolation:** Ground truth labels are strictly isolated from normal underwriting decision views and are only surfaced within the explicit Validation Center / evaluation context.

---

## 4. Clean-Clone Setup & Deployment Instructions

### Prerequisites
- **Node.js** >= 18.0.0 (npm >= 9.0.0)
- **Python** >= 3.10 (with `pip`)

---

### Step-by-Step Clean Setup Sequence

#### Step 1: Install Python Backend Dependencies
From the repository root:
```bash
pip install -r requirements.txt
```
*(Installs `pydantic>=2.0.0` and `pytest>=8.0.0`)*

#### Step 2: Install Frontend Dependencies
```bash
cd frontend
npm install
```

#### Step 3: Generate Full Scale Dataset (Python CLI)
From the repository root, run the verified deterministic generator command with fixed seed `20261022`:
```bash
python -m src.cli generate --scale full --seed 20261022 --format all
```
This procedurally creates:
- 10,000 applicants & 6,000 loan applications
- 92,232 amortized repayment schedules
- All 12 entity tables in `output/json/` (and `output/csv/`, `output/sql/`)
- Audit reports: `output/validation_report.json` and `output/VALIDATION_SUMMARY.md`

#### Step 4: Prepare Frontend Data Assets
From `frontend/` (or from the project root):
```bash
npm run prepare-data
```
> **Important Distinction:** `prepare-data` does **not** generate data. It is a validation and ingestion utility that:
> 1. Verifies that all 12 required JSON entity files (`applicants.json`, `employments.json`, `income_records.json`, `credit_facilities.json`, `loan_products.json`, `loan_applications.json`, `documents.json`, `affordability_checks.json`, `decisions.json`, `repayment_schedules.json`, `application_events.json`, `ground_truth.json`) are present in `output/json/`.
> 2. Verifies that `validation_report.json` is present in `output/validation_report.json`.
> 3. Copies the 12 entity files and validation report into `frontend/public/data/full/` (~75.20 MB total) and validates target directory completeness.
> 4. Guarantees that Full Scale generated files remain strictly ignored by Git via `frontend/.gitignore`.

*(Note: Starter Scale data for 60 applications is already pre-bundled in `frontend/public/data/starter/` and works immediately without Step 3 or 4).*

#### Step 5: Run Automated Tests
```bash
# In frontend/ directory:
npm test

# In repository root:
python -m pytest -v
```

#### Step 6: Production Build & Local Preview
```bash
# In frontend/ directory:
npm run build
npm run preview
```
Compiles TypeScript, bundles assets with Vite, and outputs production static distribution files to `frontend/dist/`.

#### Development Server
To run with live HMR:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 5. Deployment Considerations & Known Limitations

1. **Deployment Platform Capabilities (Static vs Full-Stack):**
   - **Static Edge Platforms (Vercel, Netlify, GitHub Pages, Cloudflare Pages):** Standard static frontend deployment environments run Node.js bundlers (`npm run build`) and do **not** provide a Python runtime during build.
     - **Starter Scale Deployment:** The pre-bundled Starter Scale portfolio (`frontend/public/data/starter/`) deploys **immediately and fully functional out of the box** without requiring any Python build step.
     - **Full Scale Deployment:** To deploy Full Scale to a static platform, the 12 JSON files must be generated and prepared into `frontend/public/data/full/` prior to triggering the static build step, or built via a multi-stage Docker container / GitHub Actions workflow that provisions both Python and Node.js.
2. **Client-Side Memory Footprint in Full Scale:**
   - In Starter Scale (60 loans, 100 applicants), data loads in milliseconds.
   - In Full Scale (6,000 loans, 10,000 applicants, 92,232 repayment schedule entries), client-side in-memory JSON parsing requires ~75 MB over the wire and ~300–400 MB of heap memory in the browser. For enterprise-scale production workloads, a backend pagination API (e.g. FastAPI / GraphQL) or SQLite-WASM driver is recommended over direct browser JSON loading.
3. **Deterministic Read-Only Mode:**
   - The dashboard operates as a portfolio surveillance and underwriting audit console. Loan approvals cannot be modified from the UI to preserve the deterministic ground-truth reproducibility of seed `20261022`.
