# ⚡ ForgeFlow Frontend — Manufacturing Operations SaaS Console

ForgeFlow Frontend is an enterprise-grade shopfloor console engineered for fabrication facilities, steel mills, and heavy manufacturing workshops. Built with React 19, TypeScript, Vite, and Tailwind CSS.

---

## 🤖 ForgeAI Intelligence Layer

ForgeFlow integrates **ForgeAI**, a production-grade industrial AI intelligence layer that bridges real-time shopfloor telemetry with Google Gemini's advanced reasoning models, reinforced by an intelligent deterministic heuristic fallback engine.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        ForgeFlow React Console                         │
│   Zustand Store (Telemetry, Operators, Active Work Orders, SKUs, RMAs) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Live Context Injection
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                       ForgeAI Service Layer                            │
│                    (src/api/forgeAiService.ts)                         │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
      [Key Valid & Online (<6s)]       [Missing Key, Offline, Timeout >6s]
                    ▼                                ▼
┌──────────────────────────────────────┐  ┌──────────────────────────────┐
│       Google Gemini Cloud AI         │  │   Deterministic Heuristic    │
│    gemini-2.5-flash / gemini-flash   │  │       Fallback Engine        │
│  (Deep metallurgical & MES insights) │  │  (Zero-downtime viva demos)  │
└──────────────────────────────────────┘  └──────────────────────────────┘
```

### 1. Live Store Context Injection
Instead of relying on isolated or static prompts, ForgeAI directly queries the live Zustand state (`useForgeflowStore`) and synchronized backend APIs (`forgeflowApi`). Every query injects:
- **Active Operator Persona**: Name, badge ID, department, and clearance level (e.g., Vikram Singhania - Plant Manager or Pooja Mehta - Quality Inspector).
- **Floor Sequencing Metrics**: Work orders in queue, staged batches, critical expedites, and completion percentages.
- **Inventory Buffer Reserves**: Real-time stock counts against safety alert thresholds (`min_threshold_alert`).
- **Active Quarantine RMAs**: Open discrepancy reports, metallurgical failure codes, and credit claims.

### 2. Core Industrial AI Modules

| Module | Location | Description |
|---|---|---|
| **Shopfloor Copilot Drawer** | `src/components/ai/ForgeAiCopilotDrawer.tsx` | Frosted-glass slide-over assistant with role-aware greetings, 4 clickable quick-prompt chips (*Safety buffers*, *Open RMAs*, *Shift handover*, *Bottlenecks*), markdown rendering, and 1-click operational routing. |
| **Quality Root-Cause & CAPA Analyzer** | `src/pages/returns/QualityRmaView.tsx` | Metallurgical and dimensional discrepancy engine that returns probable mechanical/chemical root causes, severity ratings (`LOW` to `CRITICAL`), confidence scores, and a 1-click **"Apply to RMA Form"** CAPA directive button. |
| **Predictive Shift Insights Widget** | `src/pages/dashboard/OperationsTelemetryView.tsx` | Proactive dashboard card generating 3 prioritized operational warnings on mount (*Inventory Buffer Risk*, *Quality Quarantine Alert*, *Throughput Optimization Tip*). |

### 3. Dual-Mode Execution & Air-Gapped Zero-Downtime Fallback
- **Mode 1: `LIVE_AI` (Google Gemini REST API)**: Calls `gemini-2.5-flash` or `gemini-flash-latest` via lightweight `fetch` with strict 6-second `AbortController` timeouts.
- **Mode 2: `OFFLINE_HEURISTIC_FALLBACK` (Deterministic Rule Engine)**: If `VITE_GEMINI_API_KEY` is omitted, invalid, or experiencing network latency/quota limits, the service seamlessly falls back to a deterministic rule-based analyzer without throwing errors or breaking the UI. A visual indicator pill (`Gemini Live` or `Demo Heuristic Mode`) displays the active execution mode.

---

## 🎨 Design System & Ergonomics

- **Dual-Mode High-Contrast Industrial Themes**:
  - **Obsidian Control Room (Dark Mode)**: Tailored for low-light operator cabins and control rooms with deep contrast and vibrant accent indicators.
  - **Titanium Clean Industrial (Light Mode)**: Crisp, high-clarity daylight shopfloor theme adhering to WCAG AA accessibility standards.
- **Translucent Frosted Backdrop Blur**: Modal dialogs and slide-over drawers use a delicate Gaussian backdrop blur (`bg-slate-950/25 dark:bg-black/40 backdrop-blur-md`), keeping the ambient dashboard softly visible.
- **Zero-Overlap Responsive Layout**:
  - **Desktop (`lg` >= 1024px)**: Permanent sticky flex sidebar with smooth collapse/expand (`w-64` ↔ `w-16`). The main content column is a true flex sibling that automatically adapts without hardcoded padding hacks.
  - **Tablet & Mobile (`sm` & `md` < 1024px)**: Slide-over navigation drawer with frosted backdrop dismiss, mobile header close button, and dedicated search trigger.
- **Mobile Table-to-Card Views (`hidden md:block` / `block md:hidden`)**:
  - Wide 8–10 column tables automatically transform into touch-friendly, high-density cards on screens below `768px`.
  - Single-tap actions for calling (`tel:`), messaging (WhatsApp), staging work orders, and committing stock movements.

---

## 🔐 1-Click Role Switcher & Pre-Configured Personas

ForgeFlow includes **6 pre-configured operator accounts** available via the 1-Click Role Switcher on the login screen and the navbar profile menu.

All accounts share the default development password: `password123`.

| Operator Name | Email (Login ID) | Password | Assigned Role | Department | Badge ID | Authorized Modules |
|:---|:---|:---|:---|:---|:---|:---|
| **Vikram Singhania** | `admin@forgeflow.io` | `password123` | `PLANT_MANAGER` | Plant Operations | `FF-MGR-001` | **All 8 Modules** |
| **Aarav Sharma** | `lead@forgeflow.io` | `password123` | `OPERATIONS_LEAD` | Fabrication Shop 2 | `FF-OPS-042` | `dashboard`, `work-orders`, `inventory`, `movements`, `quality-returns` |
| **Pooja Mehta** | `qc@forgeflow.io` | `password123` | `QUALITY_INSPECTOR` | QA & Metallurgical Lab | `FF-QC-018` | `dashboard`, `work-orders`, `quality-returns` |
| **Karan Patel** | `dispatch@forgeflow.io` | `password123` | `DISPATCH_CONTROLLER` | Logistics & Yards | `FF-LOG-009` | `dashboard`, `work-orders`, `inventory`, `movements`, `counterparties` |
| **Sneha Kulkarni** | `finance@forgeflow.io` | `password123` | `ACCOUNTS_EXECUTIVE` | Finance & Commercials | `FF-FIN-005` | `dashboard`, `settlements`, `counterparties` |
| **Rajesh Kumar** | `store@forgeflow.io` | `password123` | `STORE_MANAGER` | Raw Materials & Warehouse | `FF-STR-012` | `dashboard`, `inventory`, `movements`, `counterparties` |

---

## 🛠️ Technology Stack

- **Core**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS, CSS Custom Properties, Vanilla Design Tokens
- **Icons**: Lucide React
- **AI Intelligence**: Google Gemini REST API (`gemini-2.5-flash`), Deterministic Metallurgical Heuristics
- **State Management**: Zustand (Global session, telemetry, modal states)
- **Routing**: React Router DOM v6 with route-level `RoleGuard`
- **Notifications**: Sonner (Toast notifications)
- **HTTP Client**: Axios with automatic bearer token authorization headers

---

## 📦 Setup & Local Development

### Prerequisites
- Node.js >= 18.0
- npm >= 9.0

### Installation Steps

1. **Enter the frontend directory**:
   ```bash
   cd frontend
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure environment file**:
   ```bash
   cp .env.example .env
   ```
   Add your Google Gemini API key:
   ```env
   VITE_API_URL=http://localhost:8000/api
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   ```

4. **Start the local development server with HMR**:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:5173`.

5. **Build for production**:
   ```bash
   npm run build
   ```

6. **Preview the production bundle locally**:
   ```bash
   npm run preview
   ```

---

## 📁 Source Code Structure

```
frontend/
├── src/
│   ├── api/
│   │   ├── forgeflowApi.ts         # Centralized API service & typed Axios client
│   │   └── forgeAiService.ts       # ForgeAI multi-model & heuristic intelligence service
│   ├── auth/
│   │   └── permissions.ts          # RBAC matrix, personas, module access policies
│   ├── components/
│   │   ├── ai/
│   │   │   └── ForgeAiCopilotDrawer.tsx # Slide-over Shopfloor Copilot drawer
│   │   ├── auth/
│   │   │   └── RoleGuard.tsx       # Route guard with module clearance validation
│   │   ├── layout/
│   │   │   ├── ForgeFlowLayout.tsx # Responsive flex layout shell
│   │   │   ├── ForgeFlowNavbar.tsx # Top bar with Ask ForgeAI trigger & telemetry
│   │   │   ├── ForgeFlowSidebar.tsx# Desktop sticky sidebar + mobile drawer
│   │   │   └── ForgeFlowCommandPalette.tsx # Global Ctrl+K command palette with ForgeAI
│   │   └── providers/
│   │       └── ThemeProvider.tsx   # Dual-mode theme context engine
│   ├── pages/
│   │   ├── auth/LoginPage.tsx      # Sign-in console with 1-click personas
│   │   ├── dashboard/OperationsTelemetryView.tsx # Real-time telemetry + ForgeAI Shift Insights
│   │   ├── orders/WorkOrdersView.tsx             # Work orders & BOM line items
│   │   ├── stock/InventorySkuView.tsx            # SKU catalog & buffer tracking
│   │   ├── stock/MovementLedgerView.tsx          # Immutable material movement log
│   │   ├── masters/CounterpartiesView.tsx        # Commercial client/mill directory
│   │   ├── payments/SettlementVouchersView.tsx   # Financial UTR cash flow ledger
│   │   ├── returns/QualityRmaView.tsx            # Discrepancy RMAs & ForgeAI Root-Cause CAPA
│   │   └── diagnostics/EngineDiagnosticsView.tsx # API contract route suite
│   ├── store/
│   │   └── useForgeflowStore.ts    # Zustand store (session, telemetry, AI drawer, modals)
│   ├── styles/
│   │   └── globals.css             # Industrial theme tokens & modal utilities
│   ├── types/
│   │   └── forgeflow.types.ts      # TypeScript interfaces matching backend models
│   ├── App.tsx                     # Route hierarchy with RoleGuard wrappers
│   └── main.tsx                    # React application entry point
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

---

## 📄 License

Proprietary Software — ForgeFlow Industrial Operations Management.
