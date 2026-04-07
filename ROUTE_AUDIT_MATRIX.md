# Route Audit Matrix

Last updated: 2026-04-07

## Scope

This matrix audits the multi-tenant storefront and dashboard routing coverage in `matgary`, including:

- App routes (storefront + dashboard)
- API routes (storefront + dashboard)
- Auth guard behavior (customer JWT vs dashboard Clerk)
- Tenant isolation checks and owner notification flow

Status values:

- `Complete`: route exists and is wired to a working page/handler
- `Alias`: route intentionally redirects to canonical route
- `Guarded`: route requires auth through middleware and/or endpoint checks

---

## Storefront App Routes (`/[locale]/store/[storeSlug]/*`)

| Route | Status | Type | Implementation |
| --- | --- | --- | --- |
| `/[locale]/store/[storeSlug]` | Complete | Page | `src/app/[locale]/store/[storeSlug]/page.tsx` |
| `/[locale]/store/[storeSlug]/shop` | Complete | Page | `src/app/[locale]/store/[storeSlug]/shop/page.tsx` |
| `/[locale]/store/[storeSlug]/categories` | Alias | Redirect -> shop | `src/app/[locale]/store/[storeSlug]/categories/page.tsx` |
| `/[locale]/store/[storeSlug]/category/[slug]` | Alias | Redirect -> shop filter | `src/app/[locale]/store/[storeSlug]/category/[slug]/page.tsx` |
| `/[locale]/store/[storeSlug]/product/[id]` | Complete | Page | `src/app/[locale]/store/[storeSlug]/product/[id]/page.tsx` |
| `/[locale]/store/[storeSlug]/cart` | Complete | Page | `src/app/[locale]/store/[storeSlug]/cart/page.tsx` |
| `/[locale]/store/[storeSlug]/checkout` | Complete + Guarded | Page | `src/app/[locale]/store/[storeSlug]/checkout/page.tsx` |
| `/[locale]/store/[storeSlug]/order/success` | Complete + Guarded | Page | `src/app/[locale]/store/[storeSlug]/order/success/page.tsx` |
| `/[locale]/store/[storeSlug]/orders` | Complete + Guarded | Page | `src/app/[locale]/store/[storeSlug]/orders/page.tsx` |
| `/[locale]/store/[storeSlug]/orders/[id]` | Complete + Guarded | Page | `src/app/[locale]/store/[storeSlug]/orders/[id]/page.tsx` |
| `/[locale]/store/[storeSlug]/orders/[id]/tracking` | Complete + Guarded | Page | `src/app/[locale]/store/[storeSlug]/orders/[id]/tracking/page.tsx` |
| `/[locale]/store/[storeSlug]/account` | Complete + Guarded | Page | `src/app/[locale]/store/[storeSlug]/account/page.tsx` |
| `/[locale]/store/[storeSlug]/profile` | Alias + Guarded | Redirect -> account | `src/app/[locale]/store/[storeSlug]/profile/page.tsx` |
| `/[locale]/store/[storeSlug]/profile/addresses` | Complete + Guarded | Page | `src/app/[locale]/store/[storeSlug]/profile/addresses/page.tsx` |
| `/[locale]/store/[storeSlug]/favorites` | Complete | Page | `src/app/[locale]/store/[storeSlug]/favorites/page.tsx` |
| `/[locale]/store/[storeSlug]/wishlist` | Alias + Guarded | Redirect -> favorites | `src/app/[locale]/store/[storeSlug]/wishlist/page.tsx` |
| `/[locale]/store/[storeSlug]/about` | Complete | Page | `src/app/[locale]/store/[storeSlug]/about/page.tsx` |
| `/[locale]/store/[storeSlug]/contact` | Complete | Page | `src/app/[locale]/store/[storeSlug]/contact/page.tsx` |
| `/[locale]/store/[storeSlug]/faq` | Complete | Page | `src/app/[locale]/store/[storeSlug]/faq/page.tsx` |
| `/[locale]/store/[storeSlug]/blog` | Complete | Page | `src/app/[locale]/store/[storeSlug]/blog/page.tsx` |
| `/[locale]/store/[storeSlug]/blog/[slug]` | Complete | Page | `src/app/[locale]/store/[storeSlug]/blog/[slug]/page.tsx` |
| `/[locale]/store/[storeSlug]/search` | Alias | Redirect -> shop query | `src/app/[locale]/store/[storeSlug]/search/page.tsx` |
| `/[locale]/store/[storeSlug]/auth/login` | Complete | Page | `src/app/[locale]/store/[storeSlug]/auth/login/page.tsx` |
| `/[locale]/store/[storeSlug]/auth/signup` | Complete | Page | `src/app/[locale]/store/[storeSlug]/auth/signup/page.tsx` |
| `/[locale]/store/[storeSlug]/auth/forgot-password` | Complete | Page | `src/app/[locale]/store/[storeSlug]/auth/forgot-password/page.tsx` |
| `/[locale]/store/[storeSlug]/login` | Alias | Redirect -> auth/login | `src/app/[locale]/store/[storeSlug]/login/page.tsx` |
| `/[locale]/store/[storeSlug]/register` | Alias | Redirect -> auth/signup | `src/app/[locale]/store/[storeSlug]/register/page.tsx` |

---

## Dashboard App Routes (`/[locale]/dashboard/*`)

| Route | Status | Type | Implementation |
| --- | --- | --- | --- |
| `/[locale]/dashboard` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/page.tsx` |
| `/[locale]/dashboard/analytics` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/analytics/page.tsx` |
| `/[locale]/dashboard/products` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/products/page.tsx` |
| `/[locale]/dashboard/products/new` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/products/new/page.tsx` |
| `/[locale]/dashboard/products/[id]/edit` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/products/[id]/edit/page.tsx` |
| `/[locale]/dashboard/orders` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/orders/page.tsx` |
| `/[locale]/dashboard/orders/[id]` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/orders/[id]/page.tsx` |
| `/[locale]/dashboard/customers` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/customers/page.tsx` |
| `/[locale]/dashboard/customers/[id]` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/customers/[id]/page.tsx` |
| `/[locale]/dashboard/coupons` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/coupons/page.tsx` |
| `/[locale]/dashboard/notifications` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/notifications/page.tsx` |
| `/[locale]/dashboard/settings` | Complete | Page | `src/app/[locale]/(dashboard)/dashboard/settings/page.tsx` |

Dashboard nav wiring and active-state handling are implemented in:

- `src/app/[locale]/(dashboard)/layout.tsx`
- `src/messages/en.json`
- `src/messages/ar.json`

---

## Storefront API Routes (`/api/store/[storeSlug]/*`)

| Route | Status | Auth | Tenant Scope | Implementation |
| --- | --- | --- | --- | --- |
| `/api/store/[storeSlug]` | Complete | Public | Store slug | `src/app/api/store/[storeSlug]/route.ts` |
| `/api/store/[storeSlug]/auth/login` | Complete | Public | Store slug | `src/app/api/store/[storeSlug]/auth/login/route.ts` |
| `/api/store/[storeSlug]/auth/register` | Complete | Public | Store slug | `src/app/api/store/[storeSlug]/auth/register/route.ts` |
| `/api/store/[storeSlug]/auth/me` | Complete | Customer JWT | Store slug + customer | `src/app/api/store/[storeSlug]/auth/me/route.ts` |
| `/api/store/[storeSlug]/products` | Complete | Public | `storeId` filter | `src/app/api/store/[storeSlug]/products/route.ts` |
| `/api/store/[storeSlug]/product/[id]` | Complete | Public | `storeId` filter | `src/app/api/store/[storeSlug]/product/[id]/route.ts` |
| `/api/store/[storeSlug]/reviews` | Complete | GET public, POST customer | `storeId` + product/customer | `src/app/api/store/[storeSlug]/reviews/route.ts` |
| `/api/store/[storeSlug]/coupons/validate` | Complete | Public | `storeId` coupon lookup | `src/app/api/store/[storeSlug]/coupons/validate/route.ts` |
| `/api/store/[storeSlug]/checkout` | Complete | Customer JWT | `storeId` + customer + stock checks | `src/app/api/store/[storeSlug]/checkout/route.ts` |
| `/api/store/[storeSlug]/orders` | Complete | Customer JWT | `storeId` + `customerId` | `src/app/api/store/[storeSlug]/orders/route.ts` |
| `/api/store/[storeSlug]/orders/[id]` | Complete | Customer JWT | `storeId` + `customerId` + orderId | `src/app/api/store/[storeSlug]/orders/[id]/route.ts` |
| `/api/store/[storeSlug]/orders/[id]/tracking` | Complete | Customer JWT | `storeId` + `customerId` + orderId | `src/app/api/store/[storeSlug]/orders/[id]/tracking/route.ts` |
| `/api/store/[storeSlug]/customer/cart` | Complete | Customer JWT | `storeId` + `customerId` | `src/app/api/store/[storeSlug]/customer/cart/route.ts` |
| `/api/store/[storeSlug]/customer/favorites` | Complete | Customer JWT | `storeId` + `customerId` | `src/app/api/store/[storeSlug]/customer/favorites/route.ts` |
| `/api/store/[storeSlug]/customer/addresses` | Complete | Customer JWT | `storeId` + `customerId` | `src/app/api/store/[storeSlug]/customer/addresses/route.ts` |

---

## Dashboard API Routes (`/api/dashboard/*`)

| Route | Status | Auth | Tenant Scope | Implementation |
| --- | --- | --- | --- | --- |
| `/api/dashboard/analytics` | Complete | Clerk owner | owner -> store via `getDashboardStore()` | `src/app/api/dashboard/analytics/route.ts` |
| `/api/dashboard/orders` | Complete | Clerk owner | `storeId` filter | `src/app/api/dashboard/orders/route.ts` |
| `/api/dashboard/orders/[id]` | Complete | Clerk owner | `storeId` + orderId | `src/app/api/dashboard/orders/[id]/route.ts` |
| `/api/dashboard/customers` | Complete | Clerk owner | `storeId` filter | `src/app/api/dashboard/customers/route.ts` |
| `/api/dashboard/customers/[id]` | Complete | Clerk owner | `storeId` + customerId | `src/app/api/dashboard/customers/[id]/route.ts` |
| `/api/dashboard/coupons` | Complete | Clerk owner | `storeId` filter | `src/app/api/dashboard/coupons/route.ts` |
| `/api/dashboard/notifications` | Complete | Clerk owner | `storeId` filter | `src/app/api/dashboard/notifications/route.ts` |

Store ownership resolver:

- `src/lib/dashboard-store.ts`

---

## Auth and Guard Matrix

| Concern | Status | Enforcement |
| --- | --- | --- |
| Dashboard auth (Clerk) | Guarded | `clerkMiddleware` + `auth.protect()` in `src/middleware.ts` |
| Storefront protected areas | Guarded | `isCustomerProtectedRoute` in `src/middleware.ts` |
| Storefront auth route aliases | Guarded | `isCustomerAuthRoute` includes canonical and aliases in `src/middleware.ts` |
| API protection split | Guarded | Public storefront catalog APIs + authenticated customer/order APIs + authenticated dashboard APIs |

Protected storefront patterns in middleware include:

- account/profile
- orders
- wishlist
- checkout
- order success

---

## Tenant Isolation and Notification Notes

| Area | Status | Evidence |
| --- | --- | --- |
| Storefront data isolation | Complete | APIs resolve store by slug and scope queries by `storeId` |
| Customer ownership checks | Complete | Order/address APIs require matching `customerId` + `storeId` |
| Dashboard owner isolation | Complete | Dashboard APIs resolve owner store via `getDashboardStore()` |
| Owner-only order notifications | Complete | Checkout creates `Notification` for store and pushes to subscriptions filtered by `store.userId` |

Implementation points:

- `src/app/api/store/[storeSlug]/checkout/route.ts`
- `src/lib/storefront-auth.ts`
- `src/lib/dashboard-store.ts`
- `src/app/api/dashboard/notifications/route.ts`

---

## Validation Snapshot

- Prisma client generation: successful (`npx prisma generate`)
- Production build: successful (`npm run build`)
- Remaining warnings: non-blocking lint warnings in pre-existing unrelated files

---

## Conclusion

Route/API coverage required for the multi-tenant storefront + dashboard is implemented and reachable.

Any remaining follow-up work is cleanup-oriented (warning reduction or UX refinements), not missing-route blocking work.
