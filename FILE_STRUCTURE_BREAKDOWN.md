
# 📂 ZaynahsPOS - Complete Codebase Anatomy

This document provides a deep technical breakdown of every file in the project. Use this to understand how the application is wired together.

---

## 1. ⚙️ Root Configuration & Entry Points

### `index.html`
*   **Role:** The HTML shell.
*   **Key Scripts:** 
    *   Imports `tailwindcss` (CDN) for styling.
    *   Imports `Google Fonts` (Inter for UI, Libre Barcode for labels).
    *   `tailwind.config`: Defines brand colors (Emerald/Slate) and dark mode logic.
    *   Registers the `serviceWorker` (`sw.js`) to enable PWA (Installable App) capabilities.

### `index.tsx`
*   **Role:** React Entry Point.
*   **Logic:** Finds the `<div id="root">` in `index.html` and renders the `<App />` component inside `React.StrictMode`.

### `App.tsx`
*   **Role:** The Main Router & Layout Orchestrator.
*   **Logic:**
    1.  **Session Check:** Runs `checkSession()` on mount to restore user login from Supabase.
    2.  **Routing:** Uses `react-router-dom` to define paths:
        *   Public: `/`, `/login`, `/signup`.
        *   Protected: `/app/*` (Wrapped in `ProtectedRoute`).
    3.  **Layout:** Renders the `Sidebar`, `TopBar`, and `NotificationsPanel` for dashboard pages.
    4.  **Global Search:** The `TopBar` contains the search logic that filters products/orders/customers across the app.

### `types.ts`
*   **Role:** The TypeScript Dictionary.
*   **Content:** Defines the shape of every data object (User, Product, Order, CartItem).
*   **Why it matters:** Ensures type safety. If you try to access `product.price` but it's undefined, TS throws an error here.

### `config.ts`
*   **Role:** App Constants.
*   **Content:** Hardcoded values like App Name, Contact Email, Payment Account Numbers (JazzCash/EasyPaisa), and Cloudinary Logo URLs.

### `.env`
*   **Role:** Environment Variables (Secrets).
*   **Content:** API Keys for Supabase (Auth/DB) and Cloudinary (Images). *Never commit this file to public repos.*

### `vite.config.ts`
*   **Role:** Build Tool Config.
*   **Logic:** Configures the React plugin and sets the local dev server port to `3000`.

---

## 2. 🧠 State Management (The Brain)

### `store/useStore.ts`
*   **Role:** The Global Database Store (Zustand).
*   **Responsibility:** This is the most important file. It acts as the bridge between UI, Supabase (Cloud), and Dexie (Offline DB).
*   **Key Functions:**
    *   `loadInitialData()`: Fetches all data (Products, Orders, Settings) from Supabase/Dexie on load.
    *   `addOrder()`: Saves a sale locally instantly, updates stock levels, and logs the transaction.
    *   `checkSession()`: Keeps the user logged in upon refresh.
    *   **CRUD Actions:** `addProduct`, `updateUser`, `deleteCustomer` etc.

### `store/cartStore.ts`
*   **Role:** The POS Cart Logic.
*   **Responsibility:** Manages the temporary state of the "Current Sale".
*   **Key Features:**
    *   **3-Slot System:** Keeps 3 separate cart arrays (`sessions`) so cashiers can switch between customers without losing data.
    *   **Calculations:** `subtotal()`, `tax()`, `total()`, `discountAmount()` are computed dynamically here.
    *   **Reactivity:** Updates immediately when quantity changes.

---

## 3. 🔌 Services (The Logic Layer)

### `services/authService.ts`
*   **Role:** Authentication Handler.
*   **Logic:** Wraps Supabase Auth methods (`signInWithPassword`, `signUp`, `signOut`).
*   **Special Logic:** On `login`, it fetches *both* the `User` (Profile) and `Tenant` (Company) data to ensure the session is valid.

### `services/db.ts` (Dexie.js)
*   **Role:** The Offline Database (IndexedDB).
*   **Logic:**
    *   Defines tables (`products`, `orders`) that live inside the user's browser.
    *   `processOfflineOrder()`: An atomic transaction that saves an order and deducts stock locally even if wifi is off.
    *   `cacheAllData()`: Dumps Supabase data into Dexie for speed.

### `services/storage.ts`
*   **Role:** File Uploader.
*   **Logic:** Takes a file -> Uploads to Supabase Storage Buckets (`products`, `logos`, `proofs`) -> Returns the Public URL.

### `services/imageCompression.ts`
*   **Role:** Performance Optimizer.
*   **Logic:** Before uploading an image, this script resizes it to max 800px and converts it to `WebP` format. Reduces file size from ~5MB to ~30KB.

---

## 4. 🧱 Components (The UI Blocks)

### `components/Sidebar.tsx`
*   **Role:** Main Navigation.
*   **Logic:** Checks `user.role` and `permissions` to hide/show links (e.g., Cashiers don't see "Settings").

### `components/ProtectedRoute.tsx`
*   **Role:** Security Gatekeeper.
*   **Logic:** If `!isAuthenticated`, kicks user to Login. If user lacks `requiredPermission`, kicks them to Dashboard.

### `components/pos/Receipt.tsx`
*   **Role:** Thermal Printer Generator.
*   **Technique:** Creates an invisible `<iframe>`, writes raw HTML/CSS (styled for 58mm/80mm paper) into it, and calls `window.print()`.

### `components/pos/BarcodeScanner.tsx`
*   **Role:** Camera Interface.
*   **Library:** Uses `html5-qrcode` to access the webcam, detect 1D/2D barcodes, and return the SKU string to the POS.

### `components/ProductFormModal.tsx`
*   **Role:** Add/Edit Product UI.
*   **Features:** Handles Text Inputs, Category selection, Attributes (Variants), and Image Upload logic.

### `components/PinPadModal.tsx`
*   **Role:** Security UI.
*   **Usage:** Pops up when a Cashier tries to do a sensitive action (like a Return). Requires a 4-digit PIN.

---

## 5. 📄 Pages (The Views)

### `pages/POSPage.tsx`
*   **Complexity:** High.
*   **Structure:**
    *   **Left Col:** Product Grid + Search + Category Chips + Slot Tabs.
    *   **Right Col:** Cart Items + Customer Select + Checkout Totals.
    *   **Modals:** Checkout (Payment Input), Scanner.

### `pages/OrdersPage.tsx`
*   **Role:** Sales History.
*   **Features:** Data Table with status badges. Date Range filters.
*   **Return Logic:** Opens `PinPadModal` -> then `ReturnReasonModal` -> Updates Order Status -> Restocks Inventory.

### `pages/ProductList.tsx` (Products)
*   **Role:** Inventory Management.
*   **Tabs:** Products, Categories, Stock History (Logs).
*   **Features:** Barcode Generation (opens `BarcodePrintModal`).

### `pages/SettingsPage.tsx`
*   **Role:** App Configuration.
*   **Live Preview:** As you edit Receipt settings (Header/Footer), a visual preview component updates in real-time.

### `pages/UsersPage.tsx`
*   **Role:** Staff Management.
*   **Features:** Invite Users, Assign Roles (RBAC), Set PINs.

### `pages/FinancialReportsPage.tsx`
*   **Role:** Analytics.
*   **Charts:** Uses `recharts` for Sales Trends, Pie Charts for Staff Performance.
*   **Calculations:** Computes Gross Profit, Net Margin, and COGS on the fly from the `orders` array.

### `pages/admin/*` (Super Admin)
*   **TenantManagement:** Table of all shops. Buttons to Suspend/Active.
*   **PaymentApprovals:** View manual bank transfer screenshots uploaded by users.
*   **SubscriptionPlans:** Edit the pricing tiers.

---

## 6. 🗄️ Database Schema (`supabase/complete_schema.sql`)

### Key Tables:
1.  **`tenants`**: Represents a Company/Shop.
2.  **`profiles`**: Represents a User. Links to `auth.users` and `tenants`.
3.  **`products`**: Inventory items.
4.  **`orders`**: Sales transactions (JSONB stores the items array).
5.  **`stock_logs`**: Ledger of every inventory movement (IN/OUT).

### Security (RLS):
*   **Policy:** `tenant_id = auth.uid()`.
*   **Effect:** A user from "Shop A" can physically **never** see data from "Shop B", even if they try to hack the API. The database enforces isolation.
