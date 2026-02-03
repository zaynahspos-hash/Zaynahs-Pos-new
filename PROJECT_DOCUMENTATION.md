
# 📘 ZaynahsPOS - Project Master Documentation

**Version:** 2.0.0  
**Type:** SaaS Point of Sale & Inventory Management System (PWA)  
**Tech Stack:** React, TypeScript, Vite, Tailwind CSS, Zustand, Supabase, Dexie.js

---

## 1. 🏗️ Architecture & Data Flow

ZaynahsPOS utilizes a **Hybrid Offline-First Architecture**. It is designed to work seamlessly without an internet connection and sync when online.

### The "Twin Database" Strategy
1.  **Local Database (Dexie.js / IndexedDB):**
    *   Every piece of data (Products, Orders, Settings) is stored inside the user's browser.
    *   **Read Operations:** The UI *always* reads from this local store. This ensures zero latency and offline availability.
    *   **Write Operations:** Actions (like "Add Order") are written to Dexie immediately.

2.  **Cloud Database (Supabase / PostgreSQL):**
    *   Acts as the source of truth for synchronization.
    *   **Sync Logic:** When the app loads or detects network recovery (`window.ononline`), the `useStore.ts` fetches fresh data from Supabase and updates Dexie.
    *   **Auth:** Handled entirely by Supabase Auth (JWT).

### State Management (Zustand)
*   **`useStore.ts`:** Handles global data (User, Tenant, Products, Orders). It bridges the gap between the UI, Supabase, and Dexie.
*   **`cartStore.ts`:** Handles the temporary state of the POS Cart (3-slot system, calculations).

---

## 2. 🎨 UI/UX Design System

This project does **not** use a component library (like MUI or AntD). It uses a **Custom Design System** built on **Tailwind CSS**.

### Color Palette
*   **Primary Brand:** Emerald Green (`bg-emerald-600`, `text-emerald-700`). Used for primary actions, success states, and branding.
*   **Backgrounds:** Slate Grays (`bg-slate-50`, `bg-slate-900` for Dark Mode).
*   **Alerts:**
    *   Red (`bg-red-50`): Errors, Deletions, Negative Trends.
    *   Amber/Yellow (`bg-yellow-50`): Warnings, Pending Status.
    *   Blue (`bg-indigo-50`): Information, Neutral Stats.

### Typography
*   **Font Family:** `Inter` (Google Fonts). Clean, modern, highly readable.
*   **Receipt Font:** `Libre Barcode 39` & `128` for generating scan-able barcodes.

### Dark Mode Strategy
*   Implemented via the `dark` class on the HTML tag.
*   Every component uses `dark:` modifiers (e.g., `bg-white dark:bg-slate-800`).
*   **Rule:** Input fields in dark mode must have `bg-slate-700` or darker to prevent eye strain.

---

## 3. 💻 Coding Standards & Guidelines

### File Structure
```
src/
├── components/    # Reusable UI (Modals, Tables, Cards)
├── pages/         # Route Views (POS, Dashboard, Settings)
├── services/      # Logic Layers (Auth, DB, Storage)
├── store/         # State Management (Zustand)
└── types.ts       # TypeScript Interfaces (Strict Typing)
```

### Rules for Developers
1.  **Strict Typing:** Never use `any`. Define interfaces in `types.ts`.
    *   *Example:* `User`, `Product`, `Order`.
2.  **Snake_case vs CamelCase:**
    *   **Database (Supabase):** Uses `snake_case` (e.g., `tenant_id`, `created_at`).
    *   **Frontend (React):** Uses `camelCase` (e.g., `tenantId`, `createdAt`).
    *   *Bridge:* The `useStore` contains helper functions `mapKeys` (DB -> App) and `toSnakeCase` (App -> DB) to handle conversion automatically.
3.  **Modals:** Do not use `window.alert` or `window.confirm` for critical actions. Use custom React Modals (e.g., `ProductFormModal`, `PinPadModal`).
4.  **Icons:** Use `lucide-react` exclusively.

---

## 4. 📄 Detailed Page Functionality Guide

### A. Public Pages
1.  **Landing Page (`/`)**
    *   **Role:** Marketing front.
    *   **Features:** Features grid, Pricing tables, Testimonials.
    *   **Modals:** "About Us", "Contact", "Privacy" open in popups to keep the user engaged.
    *   **Logic:** Checks `isAuthenticated`. If true, "Get Started" becomes "Go to Dashboard".

2.  **Authentication (`/login`, `/signup`, `/forgot-password`)**
    *   **Login:** Supports Email/Password. Includes "Demo Login" buttons for quick testing.
    *   **Signup:** Creates **two** DB records atomically: A `Tenant` (Company) and a `Profile` (Admin User).
    *   **Reset Password:** Integrated with Supabase Auth SMTP.

### B. Core Application (`/app`)

#### 1. Dashboard (`/app`)
*   **Visuals:** 4 Key Stat Cards (Revenue, Orders, Customers, Alerts).
*   **Chart:** Area Chart showing 7-day revenue trend (`recharts`).
*   **Logic:** Calculations are done on the client-side using the `orders` array for instant feedback.

#### 2. Point of Sale (`/app/pos`)
*   **The Heart of the App.**
*   **3-Slot Cart:** Allows a cashier to "Hold" a cart (Slot 1) and serve another customer (Slot 2) without losing data.
*   **Barcode Scanner:** Uses camera (`html5-qrcode`) to detect barcodes and auto-add items to the active cart.
*   **Checkout:** Calculates Tax, Discounts (Fixed/%), and Change Due.
*   **Post-Process:** Auto-prints receipt via iframe and updates Inventory Stock immediately.

#### 3. Sales History (`/app/sales`)
*   **Table:** Lists all orders with status badges (Completed, Pending, Returned).
*   **Filters:** Date Range, Status, Customer Name search.
*   **Returns:**
    *   Clicking "Return" opens the **PIN Pad Modal**.
    *   Requires a Manager/Admin PIN to authorize the refund.
    *   Restocks the items automatically in the database.

#### 4. Products & Inventory (`/app/products`)
*   **Tabs:** Products, Categories, Stock History.
*   **Add/Edit Product:**
    *   **Image Compression:** Uploaded images are auto-compressed to WebP (~30kb) before going to Supabase Storage.
    *   **Variants:** Supports adding Size/Color attributes.
*   **Barcode Printing:** Select items -> Generates a printable sheet (A4 or Thermal Roll) with barcodes.

#### 5. User Management (`/app/users`)
*   **RBAC (Role Based Access):**
    *   Assign roles: Cashier, Manager, Admin.
    *   **Granular Permissions:** Checkboxes for specific rights (e.g., "Can View Reports", "Can Edit Stock").
*   **Security:** Admin can set/reset 4-digit PINs for staff members here.

#### 6. Settings (`/app/settings`)
*   **Live Receipt Preview:** As you edit the Header/Footer/Logo settings, a visual preview updates in real-time.
*   **Hardware Config:** Toggle "Auto-Print", set Paper Width (58mm/80mm).
*   **Branding:** Upload Store Logo (stored in Supabase Bucket `logos`).

#### 7. Financial Reports (`/app/reports`)
*   **Visuals:** Bar Charts (Profit vs Cost), Pie Charts (Sales by Staff).
*   **Export:** Generate CSV or PDF reports of sales data.
*   **KPIs:** Automatically calculates Gross Profit, COGS, and Net Margin.

#### 8. Suppliers & Purchasing (`/app/suppliers`, `/app/purchase-orders`)
*   **Workflow:**
    1.  Create Supplier.
    2.  Create PO -> Status "Ordered".
    3.  When truck arrives -> Click "Receive".
    4.  **Result:** Product Stock increases automatically based on PO quantity.

### C. Super Admin Dashboard (`/app/admin/*`)
*   **Restricted Access:** Only accessible if `role === 'SUPER_ADMIN'`.
*   **Tenant Management:** View all registered shops. Suspend/Ban shops.
*   **Payment Approvals:**
    *   Tenants upload screenshots of bank transfers for subscription.
    *   Super Admin views image -> Clicks "Approve".
    *   Tenant subscription is extended automatically.
*   **Retention Policy:** A tool to "Run Cleanup" which deletes data of tenants inactive for >6 months.

---

## 5. Deployment Guide

1.  **Environment Variables (`.env`):**
    ```env
    VITE_SUPABASE_URL=...
    VITE_SUPABASE_ANON_KEY=...
    VITE_CLOUDINARY_... (Optional for backup media)
    ```
2.  **Build Command:** `npm run build` (Output: `dist/`).
3.  **Routing:** Because it's an SPA (Single Page App), configure the server (Vercel/Netlify) to rewrite all routes to `index.html`.

