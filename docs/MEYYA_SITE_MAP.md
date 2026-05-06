# MEYYA.ID Site Map, Component Map, and Runtime Notes

Tanggal update: 2026-05-06.

Dokumen ini adalah peta kerja cepat untuk memahami bagaimana Meyya.id berjalan secara keseluruhan: tech stack, routing, komponen UI, API Functions, integrasi eksternal, dan edge case yang perlu diperhatikan saat mengubah kode.

## Tech Stack

- Frontend: React 19, Vite 6, TypeScript, Tailwind CSS 4 utility classes, lucide-react icons, SWR untuk data fetching, Zustand persist untuk state lokal cart/wishlist/profile helper.
- Auth: Clerk React di frontend, Clerk Backend di Cloudflare Pages Functions middleware untuk route protected.
- Backend runtime: Cloudflare Pages Functions di folder `functions/api`.
- Database: Cloudflare D1 via binding `MEYYA_DB`; local development memakai SQLite file dan `server.ts`.
- Storage/file: Cloudflare R2 direncanakan/dibaca di free-tier panel; upload API menyimpan file operasional.
- Commerce: order manual transfer, payment proof upload, inventory reservation, voucher, return/exchange, CRM event analytics.
- External APIs: API.CO.ID untuk region dan ongkir, GOWA untuk webhook verifikasi WhatsApp, Clerk webhooks untuk user sync.
- Build scripts: `npm run lint` menjalankan `tsc --noEmit`; `npm run build` menjalankan Vite production build.

## Frontend Routes

- `/`: `src/pages/Home.tsx`. Homepage katalog, hero, kategori, dan product card dengan add-to-cart.
- `/produk/:slug`: `src/pages/ProductDetail.tsx`. Detail produk, varian, stok efektif, wishlist, recently viewed, review, related products.
- `/cart`: `src/pages/Cart.tsx`. Keranjang persisted lokal, grouping produk/varian, validasi stok terbaru sebelum checkout.
- `/checkout`: `src/pages/Checkout.tsx`. Alamat multi-step/saved address, ongkir, voucher, payment method, order summary, stock guard final sebelum create order.
- `/order/:id`: `src/pages/Order.tsx`. Detail pesanan, status, payment proof, tracking, return/exchange.
- `/admin`: `src/pages/AdminDashboard.tsx`. Shell admin tabbed panel untuk dashboard, CRM, marketing, produk, voucher, review produk, order, settings, finance, free-tier.
- `/wishlist`: `src/pages/Wishlist.tsx`. Produk favorit user.
- `/profil`: `src/pages/Profile.tsx`. Akun, alamat, order history, vouchers, recently viewed, recommendations, phone verification.
- `/login`: `src/pages/Auth.tsx`. Clerk auth form.
- `/sso-callback`: Clerk redirect callback.
- `/search`: `src/pages/SearchPage.tsx`. Search katalog dan product cards.
- `/faq`: `src/pages/FaqPage.tsx`. FAQ statis.
- `/contact`: `src/pages/Contact.tsx`. Halaman kontak publik yang membaca nomor WhatsApp resmi dari app settings D1.
- `/tentang-kami`, `/shipping`: `StaticPage` content dari `App.tsx`.
- `/terms-of-service`: `TermsOfService`.
- `/privacy-policy`: `PrivacyPolicy`.
- `*`: fallback ke Home.

## Core Components

- `Header`: navigasi utama, auth entry, cart preview, wishlist count.
- `CartPreviewDropdown`: hover dropdown keranjang, quantity controls, validasi stok sebelum checkout.
- `CatalogProductCard`: card katalog dengan wishlist, quick add, variant hover, sold-out UI.
- `CategorySlider`: kategori horizontal di homepage/search.
- `Hero`: hero homepage.
- `Footer`: footer situs.
- `ScrollToTop`: scroll reset pada route navigation utama.
- `Tooltip` dan `term-tooltips`: tooltip reusable dan istilah bisnis/teknis.
- `ToastContainer`: notifikasi global dari Zustand.
- `ConfirmDialog`: dialog konfirmasi global dari Zustand.
- `ErrorBoundary` dan `ErrorBoundaryPage`: fallback error UI.

## Profile Components

- `ProfileAccount`: data akun, phone WA, birthday, request verification WhatsApp.
- `ProfileAddresses`: CRUD alamat customer.
- `ProfileHistory`: riwayat order user.
- `ProfileVouchers`: voucher user.
- `ProfileRecentlyViewed`: produk terakhir dilihat.
- `ProfileRecommendations`: rekomendasi customer.
- `ProfileStatus`: status akun/customer summary.
- `ProfileHelp`: bantuan customer.
- `AutoSuggest`: helper autocomplete wilayah/alamat.

## Admin Components

- `AdminMetricsPanel`: helicopter view admin, revenue/profit/low-stock/customer/order metrics.
- `AdminCRMManager`: daftar customer, detail CRM, order history, signal birthday/abandoned cart, manual WhatsApp verification.
- `AdminMarketingPanel`: WhatsApp Marketing CRM, campaign target, analytics chart, nomor global verifikasi Meyya.
- `AdminProductForm`: CRUD produk, kategori, warna, ukuran, attributes, variants, SEO, HPP/profit.
- `AdminCategoryManager`: CRUD kategori dan taxonomy flags.
- `AdminVoucherManager`: CRUD voucher, birthday voucher, target segment/user.
- `AdminReviewManager`: review produk, moderation status, featured review, dan balasan public admin.
- `AdminPaymentSettings`: fee transfer/QRIS, bank accounts, expiry.
- `AdminShippingSettings`: origin toko, couriers, region cache.
- `AdminOrderManager`: order ops, payment confirmation, fulfillment, returns, templates.
- `AdminFinancePanel`: finance statement, manual transaction, closing period.
- `AdminDevelopmentRoadmap`: roadmap/status panel dari `src/data/developmentRoadmap.ts`.
- `AdminFreeTierPanel`: Clerk/D1/R2 usage, table stats, safe pruning.

## State and Hooks

- `src/store.ts`: Zustand persisted cart, wishlist, recently viewed, local user, colors, saved addresses, toasts, confirm dialog.
- `src/hooks/useAuthFetch.ts`: authenticated fetch/fetcher using Clerk bearer token.
- `src/hooks/useTrackEvent.ts`: analytics event sender and cart snapshot builder.
- `src/hooks/useProductCategories.ts`: category fetching.
- `src/hooks/useCartStockValidation.ts`: public cart stock validation hook used by cart preview, cart, and checkout.

## API Functions Overview

Shared helpers:

- `_middleware.ts`: Clerk auth and admin gate for protected routes.
- `_commerce.ts`: schema ensure, audit log, inventory reservation release, pending order expiry.
- `_users.ts`: users schema and Clerk/user sync helpers.
- `_vouchers.ts`: voucher schema and cart validation rules.
- `deviceFingerprint.ts`: frontend fingerprint hash helper used as one risk signal for welcome coupon abuse guard.
- `_analytics.ts`: event summaries and aggregate helpers.
- `_message_templates.ts`: operational message templates.
- `_cartValidation.ts`: shared server-side cart stock validation.
- `_appSettings.ts`: key-value app settings, support WhatsApp lookup, phone normalization.
- `_externalApiUsage.ts`: tracking free-tier external API usage dan cache quote ongkir.
- `_debug.ts`: JSON/debug error responses.

Public/customer API:

- `products.ts`, `products/[slug].ts`: product list/detail and admin mutation.
- `categories.ts`, `categories/[id].ts`: category list and admin mutation.
- `cart/validate.ts`: public cart stock validation.
- `orders/index.ts`: create/list customer orders, validates stock, vouchers, shipping, creates reservations.
- `orders/[id].ts`, `orders/[id]/payment-proof.ts`, `orders/[id]/tracking.ts`: order detail, proof upload, tracking.
- `shipping/calculate.ts`: API.CO.ID shipping quote.
- `regions/[[path]].ts`: region data proxy/cache.
- `vouchers/index.ts`, `vouchers/validate.ts`: voucher list/validate.
- `bundles.ts`, `reviews.ts`, `review-spins.ts`, `returns.ts`, `events.ts`, `upload.ts`: bundle, reviews, review reward spin, return request, analytics events, file upload.
- `payment/options.ts`: customer payment options.
- `settings/public.ts`: setting publik aman seperti nomor WhatsApp kontak resmi.

User API:

- `user/sync.ts`: self-sync user.
- `user/profile/[id].ts`, `user/profile/sync-clerk.ts`: profile read/update and Clerk sync.
- `user/addresses/[clerk_id].ts`, `user/addresses/[clerk_id]/[address_id].ts`: address CRUD.
- `user/orders/[clerk_id].ts`: user order history.
- `user/wishlist.ts`: wishlist API.
- `user/vouchers.ts`: available user vouchers.
- `user/phone-verification.ts`: creates WhatsApp verification code and link to configured support number.

Admin API:

- `admin/users.ts`: CRM customer list and manual phone WA verification/update.
- `admin/users/[clerk_id]/orders.ts`: selected customer order history.
- `admin/metrics.ts`: dashboard metrics.
- `admin/analytics.ts`: analytics trend/funnel.
- `admin/events.ts`: admin-created campaign touch.
- `admin/orders/index.ts`, `admin/orders/[id]/status.ts`, `admin/orders/[id]/confirm.ts`: order ops.
- `admin/returns.ts`: return queue and restock.
- `admin/vouchers.ts`, `admin/vouchers/[code].ts`: voucher CRUD.
- `admin/coupon-campaigns.ts`: default coupon campaign settings and seed status.
- `admin/wheel-prizes.ts`: review wheel prize editor API.
- `admin/reviews.ts`: review moderation, publish/hide, featured review, and admin public reply.
- `admin/payment-settings.ts`, `admin/payment-bank-accounts.ts`, `admin/payment-bank-accounts/[id].ts`: payment config.
- `admin/shipping-settings.ts`, `admin/region-cache.ts`: shipping config/cache.
- `admin/finance.ts`: finance reports and manual transactions.
- `admin/free-tier.ts`: resource usage and pruning.
- `admin/message-templates.ts`: message template CRUD.
- `admin/bundles.ts`: bundle management.
- `admin/audit-logs.ts`: audit trail.
- `admin/verification-settings.ts`: global WhatsApp verification/contact number settings.

Webhooks:

- `webhooks/clerk.ts`: Clerk user sync.
- `webhooks/gowa.ts`: incoming WhatsApp verification code handling.

## Data and Schema Notes

- Main schema reference: `schema.sql`.
- Production migrations live in `migrations/`.
- Review journey, admin review center plan, incentive ideas, and review archive/offload strategy are documented in `docs/MEYYA_REVIEW_JOURNEY_STRATEGY.md`.
- Default coupon campaigns, voucher entitlements, review spin wheel, and anti-abuse guard strategy are documented in `docs/MEYYA_DEFAULT_COUPON_SYSTEM_STRATEGY.md`.
- `ensureCommerceSchema`, `ensureUsersSchema`, and app setting helpers defensively create/patch tables at runtime, but production changes should still get explicit migration files.
- Stock model: product global stock mirrors sum of active variants when variants exist; preorder bypasses stock block.
- Order creation reserves stock at `PENDING`, consumes or releases later via status/expiry flows.
- Cart is local persisted state; stock freshness must be checked against server before checkout.
- Analytics are event-based; CRM abandoned cart uses `user_cart_snapshots`.

## Important Operational Edge Cases

- Never rely only on frontend stock UI; `/api/orders` is the final guard.
- If admin changes product variants, old cart lines may reference unavailable `variant_id`; cart validation should catch this.
- If GOWA is down, admin can manually verify WhatsApp from CRM, but this only changes D1 user data.
- `MEYYA_SUPPORT_WHATSAPP` remains a fallback; admin setting `support_whatsapp` in D1 is the active override for verification links.
- `contact_whatsapp` is separate from `support_whatsapp`, but admin can choose to reuse the verification number for the public contact page.
- `/contact` reads public app settings, so admin contact-number changes do not require editing `App.tsx`.
- Marketing WhatsApp targets can include unverified numbers if a phone exists in D1; the UI labels verified/unverified and leaves the send decision to admin.
- API.CO.ID free tier for Regional and Expedition Cost is tracked by external miss counts; cache hits should not be counted as external usage.
- Free-tier pruning must stay conservative: never delete orders, users, addresses, inventory, voucher usage, finance, or returns.
- Admin route access depends on Clerk public metadata role or D1 role sync; missing Clerk secret/publishable key breaks protected APIs.
