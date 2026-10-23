# Capsula Back-Office: API Integration Audit

Date: 2026-10-23 · API: `https://capsula.prognil.com/api` · Scope: SuperAdmin and Pharmacist dashboards (from `frontendintegration.md` and Swagger `v1`)

**Rule followed:** the design stays exactly as in the last commit (`95a80e60`). API data goes only into elements that already exist. No buttons, dialogs, dropdowns, charts or layout were added.

## Headline numbers

| Measure | Result |
|---|---|
| Dashboard endpoints in Swagger with a typed client function (`src/api/*`) | **84 / 84 (100%)**. Paths, verbs, params and bodies match Swagger |
| Endpoints that a screen actually calls | **25 / 84 (30%)** |
| Existing data screens that read live data | **14 / 15 (93%)**. Only `/pharmacy/settings` is still local-only |

The 30% figure is limited by the design, not by the code. Most remaining endpoints need a control the current design does not have (an approve button, an edit form, a toggle, a chart). Each one is listed below. All of them can be wired as soon as the design includes the control.

## How it is connected

- **Base URL**: `VITE_API_BASE_URL="https://capsula.prognil.com/api"` in `.env`. CORS already allows `http://localhost:5000`.
- **Client** (`src/api/client.ts`): adds the Bearer token, unwraps the `ApiResponse<T>` envelope, and raises `ApiError` with the Arabic messages. An HTTP 401 on an authenticated call ends the session and goes to `/login`.
- **Fix**: wrong-password login returns HTTP 401 with its own message. That message is now shown instead of "session expired".
- **Session**: a client-side guard sends logged-out users to `/login`, pharmacists to `/pharmacy/*` and admins to the admin pages. Logout clears the token in both sidebars.
- **Errors** on screens without an error area are shown as toasts (the existing `sonner` toaster).

## Screen by screen

### SuperAdmin

| Screen | Connected (existing elements) | Cannot connect without a design change |
|---|---|---|
| Login / forgot / reset | `Auth/Login`, `Auth/ForgotPassword`, `Auth/ResetPassword` | `Auth/ChangePassword` (no screen) |
| Dashboard | 3 card values and the activities table from `superadmin/dashboard`; rejected-requests card from `inventory-requests?status=Rejected`; pagination counter and arrows | — |
| Inventory requests | Table rows (pharmacy, date, product count, check result, type, status), search box, pagination, row click opens the detail page | "النتائج" / "الحالات" filters: the pills are plain buttons with no menu |
| Request detail | Request summary in the existing status box (pharmacy, file, date, counts, result, status) | **Approve / reject** (`review`), rows table, row notes, file / error-report download: none of these exist in the design |
| Allowed products | Table rows, search, pagination, upload button (`allowed-products/upload`, result shown as a toast) | Edit / delete: the actions column is empty in the design; status filter pill |
| Pharmacies | Table rows (name, phone, status, last activity), search, pagination | Suspend / activate / details / create / edit: the actions column is empty; status filter pill |
| Reports | 3 stat cards and the activities table from `Reports/overview`; range tabs change the period | Performance chart: the design shows a placeholder, no chart. Export: no button |
| Settings | The 6 validation toggles read and save `superadmin/Settings` | Business rules such as delivery fee, offer timers and radius (no fields); the "3MB" title is fixed text in the design |

### Pharmacist

| Screen | Connected | Cannot connect without a design change |
|---|---|---|
| Sidebar | Logout clears the session | Accepting-orders toggle (`pharmacy/accepting-orders`): the design shows a fixed grey "غير متاحة حالياً" box; pharmacy name (`pharmacy/me`) |
| Home | Order counts and the recent orders list from `bids` + `orders` (already in the committed version) | `bids/stats`, `dashboard/summary`: no cards for them |
| Orders | `bids`, `bids/{id}`, `orders`, `orders/{id}`, `orders/{id}/status`, `bids/{id}/decline`, withdraw offer, suggest alternatives; refreshes every 20 s | — |
| Submit offer | `bids/{id}/offer` POST, edit (PUT), withdraw (DELETE) | Auto-offer template: no screen |
| Inventory | Table, search and category (filtered on the server), pagination arrows, file upload (`inventory/bulk-update`) | Low-stock alerts, manual stock edit / adjust: no controls |
| Settings | — | The screen shows system rules that a pharmacist cannot change (the API returns 403) |

### No screen in this frontend
Products (5), Brands (5), Banners (4), Customers (2), Users (4), Support tickets (3), revenue and top-products analytics, and a SuperAdmin orders page. The orders page is needed to cancel orders stuck in `WaitingForOffers`, which the backend never cancels automatically.

## What changed visually (compared with the last commit)

- The empty tables on **Inventory requests**, **Allowed products** and **Pharmacies** now show data rows. They use the same row and cell style as the other tables in the app, and the empty message still appears when there is no data.
- Values replace "—" / "0 من 0" / "صيدلية" placeholders. Dates are shown as `HH:mm dd/MM/yyyy`.
- Nothing else: no new buttons, menus, dialogs, charts, colours or text. Placeholder notes such as "تظهر بعد ربط واجهة API الحقيقية" were left as they are.

## Verification

| Check | Result |
|---|---|
| `tsc --noEmit` | Pass |
| Class and element comparison of every changed screen against the last commit | Only the data rows and one hidden file input were added |
| Live API: public endpoints, 401 on protected endpoints, CORS for `localhost:5000`, login error envelope | Pass |
| Browser, with sample payloads from the guide: every connected screen renders data | Pass |
| Real logged-in session against production | **Not done.** No credentials were used |

## Open points

1. The upload success alert says "تم تحديث المخزون بنجاح", but the stock only changes after SuperAdmin approval.
2. The "طلبات تحديث مرفوضة" card is labelled "هذا اليوم" but shows the all-time count.
3. The pharmacy "التقارير" link goes to `/pharmacy/reports`, which does not exist.
4. The inventory "الكود" column shows `productId`, because the API has no product code in inventory rows.
5. Without an approve / reject control, a SuperAdmin cannot finish an inventory review in this UI, so pharmacy stock can never be updated from the dashboard.

## Offer flow (pharmacist)

Tested end to end in the browser using the guide's sample bid. List → details panel → "قدم عرضك" → choose alternative → `POST /admin/bids/{id}/offer` → success dialog → submitted-offer dialog → "تعديل العرض" (`PUT /admin/bids/offers/{id}`) → "سحب العرض" (`DELETE`) → "رفض الطلب" (`POST /decline`). Every request body matches the guide. The offer screens look exactly as in the last commit.

Fixed with logic only (no visual change):
- **Unit**: quantities show "علبة" when the API unit is `Box`, and "شريط" otherwise.
- **Preparation time**: new offers use `preparationMinutes` from the pharmacy's auto-offer template; 15 is used only if the template has none.
- **Alternative prices** in a submitted offer are read from the pharmacy's inventory instead of showing 0.00.

Still open, because each needs a design change:
- The form requires an alternative for every out-of-stock item (the screen says so), although the API allows none.
- Prescription orders have no field for the prescription price. The app sends the total of the in-stock items.
