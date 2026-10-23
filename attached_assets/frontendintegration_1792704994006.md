# Capsula Back-Office — Frontend Integration Guide

**Audience:** frontend developers building the **SuperAdmin dashboard** and the **Pharmacist (pharmacy) dashboard**.
**Scope:** every API those two roles use, in the order the business cycle runs. The customer mobile app is covered in `MOBILE_API_GUIDE.md`.

| | |
|---|---|
| Production base URL | `https://capsula.prognil.com` |
| Swagger | `https://capsula.prognil.com/swagger` |
| Roles covered | `SuperAdmin`, `Pharmacist` (plus `Admin`, which behaves like a SuperAdmin on shared endpoints) |

---

## Table of contents

1. [Conventions every call follows](#1-conventions-every-call-follows)
2. [Authentication (both roles)](#2-authentication-both-roles)
3. [The business cycle at a glance](#3-the-business-cycle-at-a-glance)
4. [SuperAdmin integration, step by step](#4-superadmin-integration-step-by-step)
5. [Pharmacist integration, step by step](#5-pharmacist-integration-step-by-step)
6. [Reference: enums, errors, types](#6-reference-enums-errors-types)
7. [Screen → endpoint cheat sheet](#7-screen--endpoint-cheat-sheet)

---

## 1. Conventions every call follows

### 1.1 Authorization header

After login, send the JWT on every request (except the public ones, which are called out):

```
Authorization: Bearer <token>
Content-Type: application/json          (multipart/form-data for uploads — let the browser set it)
```

The token lives **1 day**. There is no refresh endpoint: when any call returns `401`, clear the session and send the user back to the login screen.

### 1.2 Response envelope

**Every** endpoint, success or failure, returns this shape:

```ts
interface ApiResponse<T> {
  value: T | null;
  status: number;            // HTTP-like status: 200, 400, 404 ...
  isSuccess: boolean;
  successMessage: string;    // Arabic message on some successes, else ""
  correlationId: string;
  errors: string[];          // non-field errors (not found, conflict, business rules)
  validationErrors: {        // field-level errors (HTTP 400)
    identifier: string;      // field name
    errorMessage: string;    // Arabic message, ready to display
    errorCode: string;
    severity: number;
  }[];
}
```

**Rule:** always check `isSuccess` first.
- `true` → read `value`.
- `false` → show `errors` (toast / banner) and map `validationErrors[].identifier` to form fields.

Deletes and "no content" actions return HTTP `200` with `value: null`, not `204`. Do not rely on the HTTP code alone.

Error messages are Arabic and already user-facing. Error *codes* such as `Offer.WindowClosed` are listed in [§6.2](#62-business-error-codes-you-will-meet).

### 1.3 HTTP status codes

| Code | Meaning | What the UI should do |
|---|---|---|
| 200 | Success | Read `isSuccess` |
| 400 | Validation or business-rule failure | Show `validationErrors` / `errors` |
| 401 | Missing, invalid or expired token | Log out, go to login |
| 403 | Valid token, wrong role | Hide the screen/route for that role |
| 404 | Not found (or, for `/api/admin/pharmacy/*`, the account has no pharmacy) | Show empty/not-found state |
| 409 | Conflict (duplicate) | Show message |
| 429 | Rate-limited (OTP / reset endpoints) | Show "try again later" |
| 500 | Server error | Generic error + retry |

### 1.4 Enums are strings

Enums are sent and returned **by name** (`"PendingConfirmation"`, `"Box"`), and query parameters accept the name too (`?status=Open`). All values are in [§6.1](#61-enums).

### 1.5 Dates

All timestamps are **UTC ISO-8601** without a zone suffix (`"2026-10-20T14:57:23.579"`). Treat them as UTC (append `Z`) and convert to local time (Africa/Cairo) for display. This matters for the offer-deadline countdowns.

### 1.6 Pagination — two shapes

Most paginated endpoints return:

```json
{ "items": [ ... ], "page": 1, "pageSize": 20, "totalCount": 57, "totalPages": 3 }
```

Some endpoints return a **plain array and ignore `page`/`pageSize`** — currently `GET /api/admin/orders` and `GET /api/admin/bids`. Filter/search them with the query params documented below and paginate client-side.

### 1.7 Files

- **Uploads** use `multipart/form-data`. Do not set `Content-Type` manually; let `FormData` add the boundary.
- **Downloads** (`/file`, `/error-report`, `/export`) return a binary file, **not** the JSON envelope on success. Fetch with the auth header, read the response as a `Blob`, then trigger a download. On failure they return the normal JSON envelope.

### 1.8 Minimal API client (TypeScript)

```ts
const BASE = "https://capsula.prognil.com";

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem("token");
  const isForm = init.body instanceof FormData;
  const res = await fetch(BASE + path, {
    ...init,
    headers: {
      ...(isForm ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init.headers,
    },
  });

  if (res.status === 401) {
    localStorage.removeItem("token");
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  const body = (await res.json()) as ApiResponse<T>;
  if (!body.isSuccess) throw body;       // let the caller show body.errors / body.validationErrors
  return body.value as T;
}
```

### 1.9 CORS

Only whitelisted origins can call the API from a browser. The SuperAdmin dashboard origin `https://superadmincapsula.prognil.com` and `http://localhost:3000` / `http://localhost:5000` (dev) are already allowed. A new frontend origin must be added to the server's `Cors__AllowedOrigins__N` environment variables.

---

## 2. Authentication (both roles)

Dashboard roles log in with email + password and get the token **immediately** (no OTP — OTP is only for customers).

### 2.1 Login

`POST /api/Auth/Login` — public

```json
{ "email": "y.abbghagh@gmail.com", "password": "Aa12345@" }
```

```json
{
  "value": {
    "userId": "ed857b82-...",
    "userName": "y.abbghagh@gmail.com",
    "firstName": "",
    "lastName": "",
    "fullName": "د. أحمد العزبي",
    "email": "y.abbghagh@gmail.com",
    "roles": ["Pharmacist"],
    "token": "eyJhbGciOi..."
  },
  "status": 200, "isSuccess": true, "successMessage": "تم تسجيل الدخول بنجاح",
  "errors": [], "validationErrors": []
}
```

**What to do:**
1. Store `token` (and `roles`).
2. Route by role: `roles` contains `SuperAdmin` → SuperAdmin app; `Pharmacist` → pharmacy app.
3. Wrong credentials → `isSuccess: false`, `errors` has the Arabic message. Repeated failures **lock the account** for a while; show the message as-is.
4. Deactivated accounts (deactivated by a SuperAdmin) are rejected with a lock-out message.

> `SendOtp` and `VerifyOtp` are **customer-only**. Do not use them in the dashboards.

### 2.2 Current user

`GET /api/Auth/GetCurrentUser` — any logged-in user. Use it on app start to restore the session/profile.

```json
{ "value": { "id": "...", "userName": "...", "email": "...", "fullName": "...", "phoneNumber": "...", "gender": 1, "age": 35, "role": "Pharmacist" } }
```

### 2.3 Forgot / reset password (code-based)

The reset flow uses a **6-digit code emailed to the user**, not a link.

| Step | Call | Notes |
|---|---|---|
| 1 | `POST /api/Auth/ForgotPassword` `{ "email": "..." }` | Always answers success, even for unknown emails (no account enumeration). Rate-limited: 3 requests / 10 min per IP; at most one code per 60 s per email. |
| 2 | User types the code from the email | Code is valid **5 minutes**, dies after **5 wrong attempts**. |
| 3 | `POST /api/Auth/ResetPassword` | Body below. Rate-limited: 5 requests / minute per IP. |

```json
{ "email": "user@example.com", "otpCode": "123456", "newPassword": "NewPassword@2026" }
```

- `newPassword` must be **at least 12 characters** and include upper, lower, digit and a special character.
- A weak password returns `400` but **keeps the code valid**, so the user can retry without requesting a new one.
- Wrong/expired code → `Otp.InvalidOrExpired`; too many attempts → `Otp.TooManyAttempts` (ask the user to request a new code).

UI: screen 1 = email → "send code"; screen 2 = code + new password (+ a "resend" button with a 60 s cooldown).

### 2.4 Change password (logged in)

`PUT /api/Auth/ChangePassword`

```json
{ "currentPassword": "...", "newPassword": "..." }
```

---

## 3. The business cycle at a glance

```
 SuperAdmin                                   Pharmacist                       Customer (mobile)
 ───────────                                  ──────────                       ─────────────────
 A. Configure system settings
 B. Build the catalog (products,
    brands, banners, allowed list)
 C. Onboard pharmacy ──────────────► (account linked to pharmacy)
                                     D. Set up pharmacy profile
                                     E. Upload inventory file ──┐
 F. Review inventory request  ◄─────────────────────────────────┘
    approve → stock goes live
                                                                      G. Customer places an order
                                                                         (status WaitingForOffers)
                                     H. See the bid (nearby, < 5 min),
                                        submit an offer  (or auto-offer)
                                                                      I. Customer picks an offer
                                                                         (PendingConfirmation)
                                     J. Confirm → prepare → route
                                        → deliver (status updates)
 K. Monitor orders, customers, users, support tickets, reports
```

### Order status machine

| From | Allowed next statuses |
|---|---|
| `WaitingForOffers` | `Cancelled` (leaves otherwise only when the **customer** picks an offer) |
| `PendingConfirmation` | `Confirmed`, `OnHold`, `Cancelled` |
| `Confirmed` | `InPreparation`, `OnHold`, `Cancelled` |
| `OnHold` | `Confirmed`, `Cancelled` |
| `InPreparation` | `InRoute`, `Cancelled` |
| `InRoute` | `Delivered`, `Cancelled` |
| `Delivered`, `Cancelled` | — (final) |

Use this table to enable/disable the action buttons on the order screen. Any other transition returns `Order.InvalidStatusTransition`. Cancelling an order gives its stock back to the pharmacy and closes any pending offers.

---

## 4. SuperAdmin integration, step by step

All `/api/superadmin/*` endpoints need the `SuperAdmin` role (`403` otherwise).

### Step A — System settings (first thing after deployment)

Business rules the whole system reads: delivery fee, offer timers, stock thresholds, upload/validation rules.

| Call | Purpose |
|---|---|
| `GET /api/superadmin/Settings` | Load the settings form |
| `PUT /api/superadmin/Settings` | Save (send the **full** object) |

```json
{
  "maxFileSizeInMB": 5,
  "fileUploadEnabled": true,
  "lowStockThreshold": 10,
  "mediumStockThreshold": 25,
  "estimatedDeliveryDays": 2,
  "deliveryFee": 30,
  "confirmationSlaMinutes": 45,
  "maxOfferDiscountPercentage": 25,
  "offerRadiusKm": 5,
  "offerWindowMinutes": 5,
  "offerValidityMinutes": 30,
  "blockMissingColumns": true,
  "preventDuplicateCodes": true,
  "detectProductConflicts": true,
  "allowPartialImport": true,
  "generateErrorReport": true,
  "approvalProtection": true
}
```

| Group | Field | Effect |
|---|---|---|
| File rules | `maxFileSizeInMB`, `fileUploadEnabled` | Limits pharmacy inventory uploads and the allowed-products upload |
| Stock buckets | `lowStockThreshold`, `mediumStockThreshold` | Drive the inventory `status`: `0 → OutOfStock`, `≤ low → Low`, `≤ medium → Medium`, else `Available` |
| Orders | `deliveryFee` | Snapshot copied onto each new order |
| Orders | `confirmationSlaMinutes` | `confirmationDeadline` for the pharmacy to confirm a chosen offer |
| Orders | `estimatedDeliveryDays` | Delivery estimate shown to customers |
| Bidding | `offerRadiusKm` | Pharmacies within this distance of the delivery address receive the order |
| Bidding | `offerWindowMinutes` | How long pharmacies may bid after the order is placed |
| Bidding | `offerValidityMinutes` | How long the customer can still pick an offer after the bidding window |
| Bidding | `maxOfferDiscountPercentage` | Maximum discount a pharmacy may offer |
| Validation | `blockMissingColumns` | Reject files missing required columns |
| Validation | `preventDuplicateCodes` | Reject files that repeat a code+unit |
| Validation | `detectProductConflicts` | Warn when a row's name differs from the catalog |
| Validation | `allowPartialImport` | Approving imports the matched rows and skips the rest |
| Validation | `generateErrorReport` | Enables the error-report download |
| Validation | `approvalProtection` | Rows with errors are never applied; without partial import, a request with errors can't be approved |

### Step B — Build the catalog

The catalog is the master product list pharmacies' inventory files are checked against.

**B1. Allowed products** ("قائمة المنتجات المسموح بها") — `/api/superadmin/allowed-products`

| Call | Purpose |
|---|---|
| `GET /api/superadmin/allowed-products?search=&isActive=&categoryId=&page=1&pageSize=10` | Paginated list. `search` = name or code; `isActive=true` = "مفعل", `false` = "موقوف" |
| `PUT /api/superadmin/allowed-products/{productId}` | Edit: `{ "name", "code", "categoryId", "isActive" }` |
| `DELETE /api/superadmin/allowed-products/{productId}` | Delete the catalog product |
| `POST /api/superadmin/allowed-products/upload` | Bulk import (`multipart`, field **`file`**, `.xlsx` or `.csv`) |

List row: `{ productId, name, code, categoryId, categoryName, isActive, imageUrl }`.

Upload columns: `الكود` (required, matches existing products by code), `اسم المنتج` (required), `التصنيف` (required, an existing category name); optional `سعر العلبة` (required to *add* a new product), `سعر الشريط`, `عدد الشرائط في العلبة`, `الحالة` (`مفعل`/`موقوف`). Existing codes are updated, new ones created. Response:

```json
{ "totalRows": 120, "createdCount": 80, "updatedCount": 38, "failedCount": 2,
  "failedRows": [ { "rowNumber": 14, "code": "MED-014", "reason": "..." } ] }
```

Show a summary dialog and a table of `failedRows`.

**B2. Full product management** — `/api/dashboard/Products`

| Call | Auth | Purpose |
|---|---|---|
| `GET /api/dashboard/Products?pageNumber=1&pageSize=10` | Public | List |
| `GET /api/dashboard/Products/{id}` | Public | Details |
| `POST /api/dashboard/Products` | Admin/SuperAdmin | Create (`multipart`) |
| `PUT /api/dashboard/Products/{id}` | Admin/SuperAdmin | Update (`multipart`) |
| `DELETE /api/dashboard/Products/{id}` | Admin/SuperAdmin | Delete |

Form fields: `Name`, `Code` (unique SKU), `IsActive`, `Description`, `Price`, `StripPrice`, `OldPrice`, `StripQuantityInBox`, `ImageFile`, `BrandId`, `CategoryId`. Stock is **not** a product field: catalog stock is computed from the pharmacies' inventories. A duplicate code returns `Product.CodeAlreadyExists`.

**B3. Brands** — `/api/dashboard/Brands` (`GET` list, `GET {id}`, `POST`, `PUT {id}`, `DELETE {id}`; `multipart` fields `Name`, `Slug`, `ImageFile`).

**B4. Banners** (home-screen banners in the customer app) — `/api/dashboard/Banners` (`GET`, `POST`, `PUT {id}`, `DELETE {id}`; `multipart` fields `Title`, `Subtitle`, `ButtonText`, `ImageFile`, `CategoryId`, `BrandId`, `DisplayOrder`, `IsActive`).

Banner response: `{ id, title, subtitle, buttonText, imageUrl, categoryId, brandId, displayOrder, isActive }`.

> Categories for dropdowns: use the public `GET /api/mobile/Categories`.
> Image fields return absolute URLs; show them directly.

### Step C — Onboard a pharmacy

`/api/superadmin/Pharmacies`

| Call | Purpose |
|---|---|
| `GET /api/superadmin/Pharmacies?search=&isActive=&page=1&pageSize=10` | "قائمة الصيدليات". `search` = name or phone |
| `GET /api/superadmin/Pharmacies/{id}` | Details |
| `POST /api/superadmin/Pharmacies` | Create |
| `PUT /api/superadmin/Pharmacies/{id}` | Update |
| `PUT /api/superadmin/Pharmacies/{id}/suspend` | "تعليق": stops receiving orders; its stock leaves the catalog totals |
| `PUT /api/superadmin/Pharmacies/{id}/activate` | "إعادة تفعيل" |
| `DELETE /api/superadmin/Pharmacies/{id}` | Delete |

Create/update body:

```json
{
  "name": "صيدلية العزبي",
  "address": "12 شارع التحرير، الدقي، الجيزة",
  "phone": "0233371234",
  "licenseNumber": "PH-GIZA-2026-014",
  "isActive": true,
  "adminUserId": "ed857b82-a10a-4f58-9533-ecbbc5eea690",
  "returnPolicy": "يمكن إرجاع الأدوية وفقًا للوائح المعمول بها.",
  "latitude": 30.0385,
  "longitude": 31.2106
}
```

Response / list row: `{ id, name, address, phone, licenseNumber, isActive, isAcceptingOrders, adminUserId, allowedProductCount, returnPolicy, latitude, longitude, withdrawnOffersCount, lastActivityAt }`.

Important:
- **`latitude` / `longitude` are needed for bidding.** Pharmacies are matched to orders by distance (`offerRadiusKm`). Provide a map picker; a pharmacy without coordinates receives every order.
- **`adminUserId` must be an existing user with the `Pharmacist` role.** It links the account to the pharmacy and is what makes `GET /api/admin/pharmacy/me` and all pharmacy scoping work. **There is currently no API to create the Pharmacist user itself** — the account must be provisioned by the backend team before this call. Validate that the id exists via `GET /api/superadmin/Users`.

Per-pharmacy product list (what the pharmacy carries — with its own quantities and prices):

| Call | Purpose |
|---|---|
| `GET /api/superadmin/Pharmacies/{id}/allowed-products` | The pharmacy's inventory |
| `POST /api/superadmin/Pharmacies/{id}/allowed-products/{productId}` | Add a product (no stock) |
| `DELETE /api/superadmin/Pharmacies/{id}/allowed-products/{productId}` | Remove a product |

### Step D — Review inventory update requests

Pharmacies upload an inventory file (Step 5.2). **Stock only changes after the SuperAdmin approves.** `/api/admin/inventory-requests` is shared with pharmacists; a SuperAdmin sees **all** pharmacies' requests.

| Call | Purpose |
|---|---|
| `GET /api/admin/inventory-requests?search=&status=&result=&page=1&pageSize=10` | "قائمة الطلبات". `search` = pharmacy name; `status` = `Pending` \| `Approved` \| `Rejected`; `result` = `AllAllowed` \| `HasNotAllowed` |
| `GET /api/admin/inventory-requests/{id}?isMatched=&page=1&pageSize=10` | Details + a page of the validation table. `isMatched=false` shows only problem rows |
| `GET /api/admin/inventory-requests/{id}/file` | Download the uploaded file |
| `GET /api/admin/inventory-requests/{id}/error-report` | Download an `.xlsx` of unmatched rows and warnings (needs `generateErrorReport`) |
| `PUT /api/admin/inventory-requests/{id}/rows/{rowId}/note` | Internal note on a row: `{ "note": "..." }` |
| `PUT /api/admin/inventory-requests/{id}/review` | Approve or reject |

Details response:

```json
{
  "id": 12, "pharmacyId": 4, "pharmacyName": "صيدلية النهضه",
  "fileName": "Inventory_nahda_jan2024.xlsx", "createdDate": "2025-01-15T03:33:00Z",
  "totalRows": 256, "matchedRows": 240, "notAllowedRows": 16, "conflictRows": 3,
  "validationResult": "HasNotAllowed", "status": "Pending",
  "reviewNote": null, "reviewedAt": null, "canApprove": true,
  "rows": { "items": [
    { "id": 901, "rowNumber": 2, "productName": "باندول اكسترا", "code": "MED-001",
      "categoryName": "مسكنات", "quantity": 40, "unit": "Box", "unitPrice": 45.5,
      "productId": 17, "catalogProductName": "Panadol Extra",
      "isMatched": true, "reason": null, "warning": null, "internalNote": null } ],
    "page": 1, "pageSize": 10, "totalCount": 256, "totalPages": 26 }
}
```

UI rules:
- Row badge: `isMatched` → "مطابق", otherwise "غير مطابق" with `reason`. Show `warning` as a yellow hint.
- Disable the **approve** button when `canApprove` is `false`.
- Review body: `{ "decision": "Approved" | "Rejected", "reviewNote": "..." }`.
- Approving applies **only matched rows** (quantity + the pharmacy's price for the unit) and refreshes catalog stock. Rejecting changes nothing.
- A request can be reviewed **once** (`InventoryRequest.AlreadyReviewed`). Refresh the list after reviewing.

### Step E — Dashboard & reports

| Call | Purpose |
|---|---|
| `GET /api/superadmin/dashboard?page=1&pageSize=10` | "لوحة التحكم": `pendingInventoryRequests`, `rejectedOrders` (cancelled today), `activeOrders`, and `recentActivities` (paginated) |
| `GET /api/superadmin/Reports/overview?period=Week&from=&to=&page=1&pageSize=10` | Same shape for a period: `period` = `Day` \| `Week` \| `Month` \| `Year`, or an explicit `from`/`to` range |
| `GET /api/superadmin/Reports/pharmacy-performance?year=2026&top=6` | "اداء الصيدليات": per pharmacy `monthlyOrders[12]` and `monthlySales[12]` (index 0 = January) plus totals, best sales first |
| `GET /api/superadmin/Reports/pharmacy-performance/export?year=2026` | `.xlsx` download of the year |

`recentActivities` item: `{ requestId, pharmacyId, pharmacyName, activityType: "InventoryUpdate", status, date }`.

Saved text reports (optional feature): `GET /api/superadmin/Reports`, `GET /api/superadmin/Reports/{id}`, `POST /api/superadmin/Reports` (`{ "title", "content" }`), `DELETE /api/superadmin/Reports/{id}`.

Shared admin analytics (SuperAdmin/Admin only):
- `GET /api/admin/dashboard/summary` — new orders today, delivered today, sales today, `ordersByStatus[]`.
- `GET /api/admin/dashboard/revenue?from=&to=` — revenue over a date range.
- `GET /api/admin/dashboard/top-products?count=10` — best sellers.

### Step F — Orders oversight

A SuperAdmin uses the **same** order endpoints as pharmacists, but sees **all** orders (no pharmacy filter). See [§5.4](#54-fulfil-the-order) for the exact calls and response shapes.

- `GET /api/admin/orders?status=&search=` — all orders.
- `GET /api/admin/orders/{id}` — full detail.
- `PUT /api/admin/orders/{id}/status` — e.g. cancel a stuck order (`WaitingForOffers → Cancelled`). **Orders left in `WaitingForOffers` are never cancelled automatically**, so provide a "cancel" action for stale ones.

### Step G — People and support

| Area | Calls |
|---|---|
| Customers | `GET /api/superadmin/Customers`, `GET /api/superadmin/Customers/{id}` — row `{ id, fullName, email, phoneNumber, emailConfirmed }` |
| Users (all roles) | `GET /api/superadmin/Users`, `GET /api/superadmin/Users/{id}`, `PUT /api/superadmin/Users/{id}/activate`, `PUT /api/superadmin/Users/{id}/deactivate` — row `{ id, fullName, email, phoneNumber, isActive, roles[] }`. A deactivated user cannot log in |
| Support tickets | `GET /api/superadmin/Supports`, `GET /api/superadmin/Supports/{id}`, `PUT /api/superadmin/Supports/{id}/status` with `{ "status": "Pending" \| "Contacted" \| "Solved" }` — ticket `{ id, fullName, phoneNumber, email, description, status }` |

---

## 5. Pharmacist integration, step by step

All pharmacist data is **automatically scoped to the logged-in pharmacy**; the frontend never sends a pharmacy id. An account not linked to a pharmacy gets `404 Pharmacy.NoPharmacyAssigned` — show an "account not linked to a pharmacy, contact support" screen.

### 5.1 First load: pharmacy profile and availability

| Call | Purpose |
|---|---|
| `GET /api/admin/pharmacy/me` | Profile for the header/sidebar |
| `PUT /api/admin/pharmacy/accepting-orders` | The "available / not available for orders" toggle: `{ "isAcceptingOrders": false }` |
| `PUT /api/admin/pharmacy/return-policy` | `{ "returnPolicy": "..." }` — shown to customers on the pharmacy's offers |

`GET /me`:

```json
{ "value": { "id": 6, "name": "صيدلية العزبي", "address": "...", "phone": "...", "licenseNumber": "...",
  "isActive": true, "isAcceptingOrders": true, "adminUserId": "...", "allowedProductCount": 0,
  "returnPolicy": "..." } }
```

When `isAcceptingOrders` is `false` the pharmacy stops receiving new bids. A SuperAdmin-suspended pharmacy (`isActive: false`) also receives nothing — show a banner.

### 5.2 Set up inventory

**A pharmacy can only bid on items it has in stock.** Do this before expecting bids.

Read:

| Call | Purpose |
|---|---|
| `GET /api/admin/inventory?categoryId=&search=&status=&page=1&pageSize=20` | Paginated stock list. `status` = `OutOfStock` \| `Low` \| `Medium` \| `Available` |
| `GET /api/admin/inventory/alerts` | Products at or below their reorder level (same row shape) |

Row:

```json
{ "productId": 1, "productName": "ABILIFY 10 MG 10 TAB", "quantity": 55, "stripQuantity": 2,
  "reorderLevel": 10, "price": 209.47, "stripPrice": 21.00, "categoryId": 29,
  "categoryName": "Atypical Antipsychotics", "lastUpdated": "2026-07-05T14:42:23.87", "status": "Available" }
```

`price` / `stripPrice` are **the pharmacy's own prices** (offers are priced from them).

Edit one product — applies immediately:

| Call | Body |
|---|---|
| `PUT /api/admin/inventory/{productId}` | Set absolute values: `{ "newQuantity": 100, "newStripQuantity": 20, "price": 120.00, "stripPrice": 12.50 }` (omit a field to keep it) |
| `PUT /api/admin/inventory/{productId}/adjust` | Add/remove by a delta with an audit reason: `{ "adjustment": -5, "reason": "Damaged items removed" }` |

Writing stock for a catalog product the pharmacy doesn't carry yet **adds** it.

Bulk update by file — goes through approval:

1. `POST /api/admin/inventory/bulk-update` — `multipart`, field **`file`** (`.xlsx` / `.csv`).
2. Required columns (Arabic or English headers, any order): product name, code/SKU, quantity, unit (`علبة`/`Box`, `شريط`/`Strip`), unit price. Optional: category.
3. The response is the created **inventory request** with `status: "Pending"`. **Stock does not change yet.** Show "تم رفع الملف وجاري مراجعته", not "تم تحديث المخزون".
4. Track it: `GET /api/admin/inventory-requests` (own requests only), open details with `GET /api/admin/inventory-requests/{id}`, download `/file` or `/error-report`.
5. The SuperAdmin approves/rejects (SuperAdmin Step D). When `Approved`, refresh the inventory list.

Upload errors to show: `Product.FileUploadDisabled`, `Product.UnsupportedFileFormat`, `Product.FileTooLarge`, `InventoryRequest.MissingColumns`, `InventoryRequest.DuplicateCodes`, `InventoryRequest.EmptyFile`.

### 5.3 Bid on customer orders

When a customer places an order it is `WaitingForOffers`. Eligible pharmacies (active, accepting orders, within `offerRadiusKm` of the delivery address) see it in their **bids inbox** for the bidding window (default **5 minutes**), then the customer has a further window (default 30 min) to pick an offer.

**Poll the inbox** (there are no websockets): call `GET /api/admin/bids?status=Open` every 10–30 seconds on the bids screen, and use `offersDeadline` for the countdown.

| Call | Purpose |
|---|---|
| `GET /api/admin/bids?status=` | Inbox. `status` = `Open` \| `Submitted` \| `Won` \| `Lost` \| `Closed`; omit for all |
| `GET /api/admin/bids/stats` | Header cards |
| `GET /api/admin/bids/{orderId}` | Order details + my offer |
| `POST /api/admin/bids/{orderId}/offer` | Submit an offer |
| `PUT /api/admin/bids/offers/{offerId}` | Edit a pending offer |
| `DELETE /api/admin/bids/offers/{offerId}` | Withdraw a pending offer |
| `POST /api/admin/bids/{orderId}/decline` | "رفض استقبال الطلب": remove it from my inbox |
| `GET /api/admin/bids/auto-offer-template` / `PUT ...` | Default offer applied automatically to new orders |

**Bid statuses**

| `bidStatus` | Meaning | Where it appears |
|---|---|---|
| `Open` | Bidding window open, I haven't offered | Inbox, action: submit / decline |
| `Submitted` | I offered; waiting for the customer | Inbox, action: edit / withdraw |
| `Won` | The customer chose my offer | Also appears in `GET /api/admin/orders` (§5.4) |
| `Lost` | The customer chose another pharmacy | Read-only |
| `Closed` | Window over, no offer from me | Read-only |

Inbox row:

```json
{ "orderId": 27, "createdDate": "2026-10-18T21:47:59.53636", "customerName": "KareemEzzat",
  "customerPhone": "+2001004092979", "paymentMethod": "Cash", "region": "Giza, Cairo",
  "itemCount": 1, "estimatedSubTotal": 456.0, "isPrescriptionOrder": false, "distanceKm": 0,
  "offersDeadline": "2026-10-20T14:57:23", "offersExpireAt": "2026-10-20T15:27:23",
  "bidStatus": "Open", "myOffer": null }
```

`GET /api/admin/bids/{orderId}` adds `notes`, `maxDiscountPercentage`, `deliveryAddress` (with coordinates for "view on map"), `items[]` and `prescription` (images + voice notes). Each item carries what **this pharmacy** has:

```json
{ "id": 18, "productId": 2, "productName": "ABILIFY 15 MG 10 TAB", "quantity": 1, "unit": "Box",
  "price": 313.98, "subTotal": 313.98,
  "availableQuantity": 12, "isInStock": true, "pharmacyUnitPrice": 305.00 }
```

Use `isInStock` to pre-select which items go into `unavailableItems`.

**Submit an offer**

`POST /api/admin/bids/{orderId}/offer`

```json
{
  "discountPercentage": 10,
  "preparationMinutes": 15,
  "deliveryMinutes": 45,
  "deliveryFee": 20,
  "notes": "Free consultation with pickup",
  "prescriptionAmount": null,
  "unavailableItems": [
    { "orderItemId": 18, "alternativeProductIds": [41, 52] }
  ]
}
```

Rules to enforce in the form (the server re-checks them):
- `discountPercentage` ≤ `maxDiscountPercentage` (else `Offer.DiscountTooHigh`).
- `deliveryFee = 0` means free delivery.
- `prescriptionAmount` is **required** when `isPrescriptionOrder` is `true` (`Offer.PrescriptionAmountRequired`).
- Every item **not** listed in `unavailableItems` must be in stock in the full ordered quantity (`Offer.ItemNotInStock`).
- `unavailableItems[].alternativeProductIds`: up to **5** products from the pharmacy's own inventory per item (can be empty).
- At least one item must be available (`Offer.EmptyOffer`).
- One offer per order; submit again → `Offer.AlreadySubmitted` (use `PUT` instead).
- Edit/withdraw is only possible while the offer is pending and the window is open (`Offer.NotPending`, `Offer.WindowClosed`).

The offer total covers the **available items only**, priced from the pharmacy's inventory prices at submission time.

Response is the offer:

```json
{ "id": 5, "orderId": 27, "status": "Pending", "discountPercentage": 10, "preparationMinutes": 15,
  "deliveryMinutes": 45, "deliveryFee": 20, "isFreeDelivery": false, "notes": "...",
  "prescriptionAmount": null, "subTotal": 456.0, "discountAmount": 45.6, "total": 430.4,
  "isAutomatic": false, "submittedAt": "2026-10-20T13:10:00",
  "unavailableItems": [ { "orderItemId": 18, "alternatives": [ { "productId": 41, "productName": "..." } ] } ] }
```

**Auto-offer template** — lets the pharmacy bid automatically on every new order.

`GET`/`PUT /api/admin/bids/auto-offer-template`

```json
{ "isEnabled": true, "discountPercentage": 5, "preparationMinutes": 10, "deliveryMinutes": 45,
  "isFreeDelivery": false, "maxOrderTotal": 500, "maxAllowedDiscountPercentage": 25 }
```

`maxAllowedDiscountPercentage` is read-only (use it as the slider max). `maxOrderTotal: null` applies to every order. Auto-offers mark items the pharmacy lacks as unavailable and are skipped when it has none of them.

**Stats** — `GET /api/admin/bids/stats`:
`{ incomingBids, incomingToday, submittedOffers, submittedThisWeek, winRate, averageDiscount, marketAverageDiscount }`.

### 5.4 Fulfil the order

Once the customer picks the pharmacy's offer, stock is deducted from the pharmacy's inventory and the order becomes **`PendingConfirmation`**. It now appears in the pharmacy's order list, with a `confirmationDeadline` (`confirmationSlaMinutes` after `pendingConfirmationAt`) by which the pharmacy must act.

> `GET /api/admin/orders` shows **only orders linked to this pharmacy**, so it is empty until a customer chooses one of its offers. Orders still waiting for offers live in `/api/admin/bids`.

| Call | Purpose |
|---|---|
| `GET /api/admin/orders?status=&search=` | Order list (array, not paginated). `search` matches order id, customer name or phone |
| `GET /api/admin/orders/{id}` | Full detail |
| `PUT /api/admin/orders/{id}/status` | Move the order forward / cancel |
| `GET /api/admin/orders/{orderId}/alternatives` | Alternatives suggested for the order's items |
| `POST /api/admin/orders/items/{itemId}/alternatives` | Suggest a replacement for an item |

List row:

```json
{ "id": 16, "createdDate": "2026-07-14T03:00:16.81", "customerId": "...", "customerName": "Test Customer",
  "customerPhone": "01114531437", "deliveryAddress": { ... }, "status": "PendingConfirmation",
  "paymentMethod": "Card", "isPrescriptionOrder": true, "isPricePending": false,
  "totalAmount": 343.98, "itemCount": 1,
  "confirmationDeadline": "2026-07-14T03:45:16.81", "pendingConfirmationAt": "2026-07-14T03:00:16.81" }
```

Detail adds: `subTotal`, `deliveryFee`, `offerDiscount`, `estimatedDeliveryMinutes`, `initialTotal`, `notes`, `deliveryAddress` (`region`, `buildingName`, `apartmentNumber`, `floorNumber`, `elevatorCode`, `phoneNumber`, `deliveryInstructions`, `latitude`, `longitude`), `prescription`, `chosenOffer` (the winning offer: discount, delivery fee, preparation/delivery minutes), `statusHistory[]` (`fromStatus`, `toStatus`, `changedAt`, `note`) and `items[]` (`productId`, `productName`, `productImageUrl`, `quantity`, `price`, `subTotal`, `unit`).
`totalAmount = subTotal − offerDiscount + deliveryFee`.

**Change status**

```json
PUT /api/admin/orders/16/status
{ "newStatus": "Confirmed", "note": "تم التأكيد من الصيدلية" }
```

Typical pharmacy flow, one button per step:

| Step | Button | `newStatus` |
|---|---|---|
| 1 | "تأكيد الطلب" | `Confirmed` |
| 1b | "رفض استقبال الطلب" | `Cancelled` (stock returns to the pharmacy) |
| 2 | "بدء التحضير" | `InPreparation` |
| 3 | "خرج للتوصيل" | `InRoute` |
| 4 | "تم التسليم" | `Delivered` |
| any | "تعليق" / "إلغاء" | `OnHold` (from `PendingConfirmation`/`Confirmed`) / `Cancelled` |

Every change is written to `statusHistory`, which powers the customer's tracking timeline. Use the allowed-transition table in [§3](#order-status-machine) to show only valid buttons. The call returns the updated order row.

**Suggest alternatives for an item** (`POST /api/admin/orders/items/{itemId}/alternatives`, `multipart`) — provide **exactly one** of:

- *Catalog product:* `SuggestedProductId`, `Quantity`, `AdminNote`.
- *Custom product:* `CustomProductName`, `CustomPrice`, `CustomUnit` (`Box` | `Strip`), optional `CustomImage` (file), `Quantity`, `AdminNote`.

Sending both or neither returns `Alternative.AmbiguousProductInfo` / `Alternative.MissingProductInfo`. Call repeatedly to suggest several. The customer can currently accept only **catalog** alternatives; a custom one returns `Alternative.CustomProductNotAcceptable` on accept.

### 5.5 Pharmacy dashboard

`GET /api/admin/dashboard/summary` (scoped to the pharmacy):

```json
{ "newOrdersToday": 2, "deliveredOrdersToday": 0, "salesToday": 523.45,
  "ordersByStatus": [ { "status": "PendingConfirmation", "count": 12 } ] }
```

Combine with `GET /api/admin/bids/stats` and `GET /api/admin/inventory/alerts` for the home screen (new bids, low-stock warnings, orders awaiting confirmation).
`revenue` and `top-products` are **not** available to pharmacists (`403`).

---

## 6. Reference: enums, errors, types

### 6.1 Enums

| Enum | Values |
|---|---|
| `OrderStatus` | `PendingConfirmation`, `Confirmed`, `OnHold`, `InPreparation`, `InRoute`, `Delivered`, `Cancelled`, `WaitingForOffers` |
| `PaymentMethod` | `Cash`, `Card`, `CardOnDelivery` |
| `ProductUnitType` | `Box`, `Strip` |
| `BidStatus` | `Open`, `Submitted`, `Won`, `Lost`, `Closed` |
| `PharmacyOfferStatus` | `Pending`, `Accepted`, `Rejected`, `Withdrawn`, `Declined` |
| `StockStatus` | `OutOfStock`, `Low`, `Medium`, `Available` |
| `InventoryRequestStatus` | `Pending`, `Approved`, `Rejected` |
| `InventoryValidationResult` | `AllAllowed`, `HasNotAllowed` |
| `SupportStatus` | `Pending`, `Contacted`, `Solved` |
| `ReportPeriod` | `Day`, `Week`, `Month`, `Year` |
| `AlternativeStatus` | `Suggested`, `Accepted`, `Rejected` |

### 6.2 Business error codes you will meet

Messages come back in Arabic in `errors[]`; use the code (when present) for logic.

| Area | Codes |
|---|---|
| Auth / OTP | `Otp.InvalidOrExpired`, `Otp.TooManyAttempts`, `Otp.ResendTooSoon`, `Otp.CouldNotSend`, `Auth.PasswordResetEmailCouldNotBeSent` |
| Orders | `Order.NotFound`, `Order.InvalidStatusTransition`, `Order.CouldNotUpdateStatus` |
| Alternatives | `Alternative.MissingProductInfo`, `Alternative.AmbiguousProductInfo`, `Alternative.InvalidQuantity`, `Alternative.NotFound` |
| Offers | `Offer.PharmacyNotFound`, `Offer.WindowClosed`, `Offer.OrderNotOpen`, `Offer.PharmacyNotEligible`, `Offer.AlreadySubmitted`, `Offer.NotPending`, `Offer.NotOwner`, `Offer.DiscountTooHigh`, `Offer.PrescriptionAmountRequired`, `Offer.InvalidOrderItem`, `Offer.TooManyAlternatives`, `Offer.AlternativeProductNotFound`, `Offer.AlternativeNotInStock`, `Offer.ItemNotInStock`, `Offer.EmptyOffer` |
| Pharmacy | `Pharmacy.NotFound`, `Pharmacy.NoPharmacyAssigned`, `Pharmacy.PharmacyRequired`, `Pharmacy.ProductAlreadyAllowed`, `Pharmacy.AllowedProductNotFound` |
| Inventory requests | `InventoryRequest.NotFound`, `.MissingColumns`, `.DuplicateCodes`, `.EmptyFile`, `.HasNotAllowedRows`, `.ErrorReportDisabled`, `.RowNotFound`, `.AlreadyReviewed` |
| Files | `Product.FileUploadDisabled`, `Product.UnsupportedFileFormat`, `Product.FileTooLarge` |
| Catalog | `Product.CodeAlreadyExists` |

### 6.3 Shared TypeScript types

```ts
type OrderStatus =
  | "PendingConfirmation" | "Confirmed" | "OnHold" | "InPreparation"
  | "InRoute" | "Delivered" | "Cancelled" | "WaitingForOffers";

type BidStatus = "Open" | "Submitted" | "Won" | "Lost" | "Closed";
type Unit = "Box" | "Strip";

interface Paged<T> { items: T[]; page: number; pageSize: number; totalCount: number; totalPages: number; }

interface LoginResult {
  userId: string; userName: string; fullName: string; email: string;
  roles: ("SuperAdmin" | "Admin" | "Pharmacist")[]; token: string;
}

interface SubmitOfferRequest {
  discountPercentage: number; preparationMinutes: number; deliveryMinutes: number;
  deliveryFee: number; notes?: string | null; prescriptionAmount?: number | null;
  unavailableItems: { orderItemId: number; alternativeProductIds: number[] }[];
}
```

### 6.4 Roles and what they can reach

| Area | SuperAdmin | Admin | Pharmacist |
|---|:-:|:-:|:-:|
| `/api/superadmin/*` | ✔ | | |
| `/api/dashboard/Products\|Brands\|Banners` (write) | ✔ | ✔ | |
| `/api/admin/dashboard/summary` | ✔ (all) | ✔ (all) | ✔ (own) |
| `/api/admin/dashboard/revenue`, `top-products` | ✔ | ✔ | |
| `/api/admin/orders*` | ✔ (all) | ✔ (all) | ✔ (own) |
| `/api/admin/inventory*` | ✔ (needs `?pharmacyId=` to write) | ✔ | ✔ (own) |
| `/api/admin/inventory-requests*` | ✔ (all, review) | | ✔ (own, read) |
| `/api/admin/bids*`, `/api/admin/pharmacy/*` | | | ✔ |

A SuperAdmin calling inventory endpoints can pass `?pharmacyId=` to act on a specific pharmacy; without it, reads return catalog totals and writes fail with `Pharmacy.PharmacyRequired`.

---

## 7. Screen → endpoint cheat sheet

### SuperAdmin app

| Screen | Endpoints |
|---|---|
| Login / forgot password | `POST /api/Auth/Login`, `POST /api/Auth/ForgotPassword`, `POST /api/Auth/ResetPassword` |
| Dashboard | `GET /api/superadmin/dashboard`, `GET /api/admin/dashboard/summary` |
| Inventory requests (list + details) | `GET /api/admin/inventory-requests`, `GET .../{id}`, `PUT .../{id}/review`, `PUT .../{id}/rows/{rowId}/note`, `GET .../{id}/file`, `GET .../{id}/error-report` |
| Allowed products | `GET/PUT/DELETE /api/superadmin/allowed-products`, `POST .../upload` |
| Products / brands / banners | `/api/dashboard/Products`, `/api/dashboard/Brands`, `/api/dashboard/Banners` |
| Pharmacies | `/api/superadmin/Pharmacies` (+ `/suspend`, `/activate`, `/allowed-products`) |
| Orders | `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `PUT /api/admin/orders/{id}/status` |
| Customers / users | `/api/superadmin/Customers`, `/api/superadmin/Users` |
| Support | `/api/superadmin/Supports` |
| Reports | `GET /api/superadmin/Reports/overview`, `.../pharmacy-performance`, `.../pharmacy-performance/export` |
| Settings | `GET/PUT /api/superadmin/Settings` |

### Pharmacist app

| Screen | Endpoints |
|---|---|
| Login / forgot password | `POST /api/Auth/Login`, `POST /api/Auth/ForgotPassword`, `POST /api/Auth/ResetPassword` |
| Home / sidebar | `GET /api/admin/pharmacy/me`, `PUT /api/admin/pharmacy/accepting-orders`, `GET /api/admin/dashboard/summary`, `GET /api/admin/bids/stats` |
| Bids inbox | `GET /api/admin/bids?status=`, `GET /api/admin/bids/{orderId}`, `POST /api/admin/bids/{orderId}/offer`, `PUT/DELETE /api/admin/bids/offers/{offerId}`, `POST /api/admin/bids/{orderId}/decline` |
| Auto-offer settings | `GET/PUT /api/admin/bids/auto-offer-template`, `PUT /api/admin/pharmacy/return-policy` |
| Orders | `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `PUT /api/admin/orders/{id}/status` |
| Suggest alternatives | `GET /api/admin/orders/{orderId}/alternatives`, `POST /api/admin/orders/items/{itemId}/alternatives` |
| Inventory | `GET /api/admin/inventory`, `GET /api/admin/inventory/alerts`, `PUT /api/admin/inventory/{productId}`, `PUT .../adjust` |
| Inventory upload & my requests | `POST /api/admin/inventory/bulk-update`, `GET /api/admin/inventory-requests`, `GET .../{id}`, `GET .../{id}/file`, `GET .../{id}/error-report` |
