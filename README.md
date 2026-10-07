# ⚡ ForgeFlow Frontend — Manufacturing Operations SaaS Console

ForgeFlow Frontend is an enterprise-grade shopfloor console engineered for fabrication facilities, steel mills, and heavy manufacturing workshops. Built with React 19, TypeScript, Vite, and Tailwind CSS.

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
   Default `.env`:
   ```env
   VITE_API_URL=http://localhost:8000/api
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
│   │   └── forgeflowApi.ts         # Centralized API service & typed Axios client
│   ├── auth/
│   │   └── permissions.ts          # RBAC matrix, personas, module access policies
│   ├── components/
│   │   ├── auth/
│   │   │   └── RoleGuard.tsx       # Route guard with module clearance validation
│   │   ├── layout/
│   │   │   ├── ForgeFlowLayout.tsx # Responsive flex layout shell
│   │   │   ├── ForgeFlowNavbar.tsx # Top bar with telemetry & role switcher
│   │   │   ├── ForgeFlowSidebar.tsx# Desktop sticky sidebar + mobile drawer
│   │   │   └── ForgeFlowCommandPalette.tsx # Global Ctrl+K command palette
│   │   └── providers/
│   │       └── ThemeProvider.tsx   # Dual-mode theme context engine
│   ├── pages/
│   │   ├── auth/LoginPage.tsx      # Sign-in console with 1-click personas
│   │   ├── dashboard/OperationsTelemetryView.tsx # Real-time plant telemetry
│   │   ├── orders/WorkOrdersView.tsx             # Work orders & BOM line items
│   │   ├── stock/InventorySkuView.tsx            # SKU catalog & buffer tracking
│   │   ├── stock/MovementLedgerView.tsx          # Immutable material movement log
│   │   ├── masters/CounterpartiesView.tsx        # Commercial client/mill directory
│   │   ├── payments/SettlementVouchersView.tsx   # Financial UTR cash flow ledger
│   │   ├── returns/QualityRmaView.tsx            # Discrepancy RMAs & test reports
│   │   └── diagnostics/EngineDiagnosticsView.tsx # API contract route suite
│   ├── store/
│   │   └── useForgeflowStore.ts    # Zustand store (session, telemetry, modals)
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
