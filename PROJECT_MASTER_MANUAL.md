
# 📘 ZaynahsPOS - Ultimate Project Master Manual

**Date Generated:** October 2024
**Version:** 2.0 (Production Ready)
**Tech Stack:** React, Vite, Tailwind CSS, Supabase, Dexie.js (Offline DB)

---

## 1. 🏢 App Configuration & Contact Details
Yeh woh details hain jo `config.ts` file mein hardcoded hain aur poori app mein use hoti hain (Footer, Invoices, Contact Modals mein).

| Key | Value | Location in Code |
| :--- | :--- | :--- |
| **App Name** | ZaynahsPOS | `config.ts` -> `APP_CONFIG.name` |
| **Developer** | Shoaibzaynah | `config.ts` -> `APP_CONFIG.developer` |
| **Official Email** | zaynahspos@gmail.com | `config.ts` -> `APP_CONFIG.email` |
| **WhatsApp / Phone** | **03027245937** | `config.ts` -> `APP_CONFIG.whatsapp` |
| **Complete Address** | **G77 Makki Complex Lahore** | `config.ts` -> `APP_CONFIG.address` |
| **Payment Account** | 03284114551 (Muhammad Shoaib) | `config.ts` -> `APP_CONFIG.payment` |

---

## 2. 👑 Super Admin & User Roles
System mein 6 tarah ke users (Roles) defined hain.

### A. Super Admin (Platform Owner)
*   **Access:** Full Access to `/app/admin`.
*   **Capabilities:**
    *   Saare Shops (Tenants) dekh sakta hai.
    *   Shops ko **Suspend** ya **Ban** kar sakta hai.
    *   Subscription Payments (Screenshots) ko **Approve/Reject** kar sakta hai.
    *   Pricing Plans edit kar sakta hai.
*   **Kaise Banayein?**
    *   Database mein manually `profiles` table mein `role` column ko `'SUPER_ADMIN'` set karein.

### B. Admin (Shop Owner)
*   Signup karte waqt jo user banta hai, wo by default `ADMIN` hota hai.
*   Apni shop ki har cheez manage kar sakta hai (Settings, Staff, Inventory).

### C. Staff Roles
*   **Manager:** Reports, Inventory, aur Staff manage kar sakta hai.
*   **Cashier:** Sirf POS (Sale) aur Orders dekh sakta hai.
*   **Salesman:** Limited POS access.

---

## 3. 🎨 UI/UX Design System Details

Is project mein koi external UI Library (MUI/AntD) use nahi hui. Yeh **100% Custom Tailwind CSS** design hai.

### Visual Style
*   **Primary Color:** `Emerald-600` (#059669) - Used for buttons, active states, branding.
*   **Background:** `Slate-50` (Light Mode) / `Slate-950` (Dark Mode).
*   **Font Family:**
    *   UI Text: `Inter` (Google Fonts).
    *   Receipts/Barcodes: `Libre Barcode 39` & `128`.

### Key UI Components
*   **Icons:** `lucide-react` library use hui hai (lightweight SVG icons).
*   **Charts:** `recharts` library use hui hai (Dashboard aur Reports ke liye).
*   **Modals:** Custom built modals (dekhein `components/ProductFormModal.tsx`).
*   **Toasts/Notifications:** Custom notification panel (`components/NotificationsPanel.tsx`).

---

## 4. 📂 Deep File Structure Breakdown (Files Ka Intro)

Niche har file aur folder ka detailed maqsad likha hai taake aap code ko aasani se samajh sakein.

### 🔹 Root Directory (Sabse Bahar)

1.  **`index.html`**
    *   **Kaam:** App ka main entry point. Yahan Google Fonts aur Tailwind CDN (backup ke liye) link hain.
    *   **Theme Script:** Ismein `tailwind.config` ka inline script hai jo colors define karta hai.

2.  **`vite.config.ts`**
    *   **Kaam:** Build tool configuration. Yeh batata hai ke server port `3000` par chalega aur build `dist` folder mein banegi.

3.  **`package.json`**
    *   **Kaam:** Project ki dependencies ki list.
    *   **Key Packages:** `zustand` (State), `dexie` (Offline DB), `supabase-js` (Backend), `html5-qrcode` (Scanner).

4.  **`config.ts`**
    *   **Kaam:** Global constants. App ka naam, phone number, payment details yahan change karein.

5.  **`types.ts`**
    *   **Kaam:** TypeScript Interfaces. Yahan define hai ke `User`, `Product`, `Order` dikhne mein kaise honge. Coding karte waqt errors se bachaata hai.

---

### 🔹 `src/store/` (State Management - The Brain)

6.  **`useStore.ts`**
    *   **Role:** Global Store (Zustand).
    *   **Kaam:** Yeh puri app ka "Dimagh" hai.
    *   **Data:** Current User, Current Tenant, Products List, Orders List yahan memory mein rehte hain.
    *   **Actions:** `loadInitialData` (DB se data lana), `addOrder` (Order save karna), `login`, `logout` functions yahan likhe hain.

7.  **`cartStore.ts`**
    *   **Role:** POS Cart Logic.
    *   **Kaam:** POS Screen par jo cart chalti hai uska hisaab kitab.
    *   **Feature:** **3-Slot System**. Ismein 3 alag alag carts (`sessions`) array mein store hoti hain taake cashier customers ko hold kar sake.
    *   **Calculations:** `subtotal()`, `tax()`, `total()` yahan calculate hote hain.

---

### 🔹 `src/services/` (Backend & Logic Helpers)

8.  **`authService.ts`**
    *   **Kaam:** Supabase Auth ke wrapper functions. `login`, `signup`, `logout`.
    *   **Logic:** Jab user login karta hai, yeh service `profiles` table aur `tenants` table dono se data fetch kar ke wapis karti hai.

9.  **`db.ts` (Dexie.js)**
    *   **Kaam:** **Offline Database**.
    *   **Detail:** Yeh browser ke `IndexedDB` mein data save karta hai. Agar internet chala jaye, to `processOfflineOrder` function yahan order save kar leta hai.

10. **`storage.ts`**
    *   **Kaam:** File Uploading.
    *   **Logic:** Product images aur logo ko Supabase Storage buckets mein upload karta hai aur URL return karta hai.

11. **`imageCompression.ts`**
    *   **Kaam:** Image Optimization.
    *   **Logic:** Koi bhi image upload hone se pehle yahan aati hai. Yeh usse `WebP` format mein convert karta hai aur size reduce karta hai (e.g. 5MB -> 30KB) taake app fast chale.

---

### 🔹 `src/components/` (Reusable Building Blocks)

12. **`Sidebar.tsx`**
    *   **Kaam:** Left side navigation menu.
    *   **Logic:** User ke role ke hisaab se links chupata/dikhata hai (e.g. Cashier ko Settings nahi dikhegi).

13. **`ProtectedRoute.tsx`**
    *   **Kaam:** Security Guard.
    *   **Logic:** Agar user login nahi hai to Login page par bhejta hai. Agar permission nahi hai to rok deta hai.

14. **`ProductFormModal.tsx`**
    *   **Kaam:** Product Add/Edit karne ka popup form. Image upload aur variants (Size/Color) yahan manage hote hain.

15. **`PinPadModal.tsx`**
    *   **Kaam:** Security PIN input.
    *   **Use:** Jab koi Return karta hai ya sensitive kaam karta hai, yeh popup khulta hai.

16. **`NotificationsPanel.tsx`**
    *   **Kaam:** Right side slider jo Low Stock alerts aur system messages dikhata hai.

---

### 🔹 `src/components/pos/` (POS Specific Components)

17. **`Receipt.tsx`**
    *   **Kaam:** Thermal Printer Receipt Generator.
    *   **Tech:** Yeh ek invisible `<iframe>` banata hai, usmein HTML receipt likhta hai, aur browser ki `window.print()` command chalata hai.

18. **`BarcodeScanner.tsx`**
    *   **Kaam:** Camera Scanner.
    *   **Tech:** `html5-qrcode` library use kar ke webcam se barcode padhta hai aur SKU return karta hai.

---

### 🔹 `src/pages/` (Main Screens)

19. **`LandingPage.tsx`** (`/`)
    *   **Kaam:** Website ka main page jahan "Features", "Pricing", aur "Login" buttons hain.

20. **`LoginPage.tsx`** & **`SignupPage.tsx`**
    *   **Kaam:** User entry forms.
    *   **Feature:** Login page par "Demo Login" buttons bhi hain testing ke liye.

21. **`DashboardStats.tsx`** (Dashboard)
    *   **Kaam:** Home screen. Revenue chart aur quick stats dikhata hai.

22. **`POSPage.tsx`** (`/app/pos`)
    *   **Complexity:** High.
    *   **Structure:**
        *   **Left:** Product Grid, Search, Category Tabs.
        *   **Right:** Cart Items, Customer Select, Checkout Button.
        *   **Top:** Slot Switcher (Cart 1, Cart 2).
    *   **Logic:** Yeh page `cartStore` se connect hota hai.

23. **`OrdersPage.tsx`** (`/app/sales`)
    *   **Kaam:** Purani sales ki history.
    *   **Features:** Reprint Receipt, Return Order (with PIN logic).

24. **`ProductList.tsx`** (`/app/products`)
    *   **Kaam:** Inventory Management.
    *   **Tabs:** Products, Categories, Stock History.
    *   **Feature:** Barcode Printing ka button yahan hai.

25. **`CustomersPage.tsx`** (`/app/customers`)
    *   **Kaam:** Customer CRM. Purchase history aur contact details manage karta hai.

26. **`SuppliersPage.tsx`** & **`PurchaseOrdersPage.tsx`**
    *   **Kaam:** Procurement System.
    *   **Flow:** Supplier add karein -> PO banayein -> Stock receive karein.

27. **`FinancialReportsPage.tsx`** (`/app/reports`)
    *   **Kaam:** Analytics.
    *   **Charts:** Profit vs Cost (Bar Chart), Staff Performance (Pie Chart).
    *   **Export:** CSV/PDF download buttons.

28. **`SettingsPage.tsx`** (`/app/settings`)
    *   **Kaam:** Shop Configuration.
    *   **Features:**
        *   Receipt Header/Footer edit.
        *   Logo Upload.
        *   Tax Rate setting.
        *   **Live Preview:** Receipt editing karte waqt real-time preview dikhta hai.

29. **`UsersPage.tsx`** (`/app/users`)
    *   **Kaam:** Staff Management.
    *   **Features:** Naye users invite karna, Roles (Manager/Cashier) assign karna, aur PIN set karna.

---

### 🔹 `src/pages/admin/` (Super Admin Pages)

30. **`TenantManagement.tsx`**
    *   **Kaam:** Saari Shops ki list.
    *   **Action:** Kisi bhi shop ko "Suspend" karne ka button. Subscription extend karne ka manual option.

31. **`PaymentApprovals.tsx`**
    *   **Kaam:** Manual Bank Transfer verification.
    *   **Logic:** Users screenshot upload karte hain, Super Admin yahan dekh kar "Approve" click karta hai.

32. **`SubscriptionPlans.tsx`**
    *   **Kaam:** Pricing Plans (Monthly/Yearly) ki settings.

---

### 🔹 `supabase/` (Database Backend)

33. **`complete_schema.sql`**
    *   **Kaam:** Database ka Naqsha (Map).
    *   **Content:**
        *   Tables: `tenants`, `profiles`, `products`, `orders` etc.
        *   **RLS Policies:** Security rules jo ensure karte hain ke Shop A ka data Shop B ko kabhi na dikhe.
        *   **Triggers:** Jaise hi user signup kare, automatic `profile` create ho jaye.

---

## 5. Summary of Flow (Kaam Kaise Hota Hai)

1.  **Frontend Load:** `index.html` -> `index.tsx` -> `App.tsx` load hota hai.
2.  **Session Check:** `App.tsx` mein `checkSession()` chalta hai jo dekhta hai user logged in hai ya nahi.
3.  **Data Sync:** Agar user logged in hai aur internet on hai, `useStore.ts` -> `loadInitialData` chalta hai jo Supabase se data lata hai aur `Dexie` (Local DB) mein save karta hai.
4.  **Offline Mode:** Agar internet band ho jaye, to `useStore` data seedha `Dexie` se uthata hai, isliye app chalti rehti hai.
5.  **Transaction:** Jab Sale hoti hai (`POSPage`), order pehle Local DB mein save hota hai, phir background mein Cloud par sync hota hai.

