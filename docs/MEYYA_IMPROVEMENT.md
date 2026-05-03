# MEYYA.ID Improvement Notes

Audit terakhir: 2026-05-03.

Dokumen ini hanya berisi temuan yang masih relevan setelah koreksi terakhir. Item yang sudah fixed dihapus atau dipindahkan ke ringkasan status.

## Ringkasan Status Terbaru

Perbaikan yang sudah terlihat:

- Middleware API sudah memakai `verifyToken` dari `@clerk/backend`, bukan decode JWT manual.
- `@clerk/backend` sudah di-install ulang agar local lint bisa resolve package.
- Endpoint `/api/user/profile/:id`, `/api/user/addresses/:clerk_id`, `/api/user/orders/:clerk_id`, dan `/api/orders/:id` sudah mulai mengecek owner dari `context.data.clerkId`.
- `POST /api/orders` sudah derive `clerk_id` dari token, bukan body.
- `unique_code` sudah digenerate server-side.
- Voucher invalid/not found di `POST /api/orders` sudah return 400.
- Voucher sudah cek `valid_from`.
- Checkout saved address sudah pakai `React.useMemo`.
- Rekomendasi checkout sudah menormalisasi `size_name`.
- `functions/api/upload.ts` sudah tidak lagi fallback ke placeholder `MEYYA_R2_PUBLIC_URL`.
- `schema.sql` lokal sudah punya `payment_bank_accounts` dan `payment_settings`.
- `functions/api/payment/options.ts` sudah tersedia untuk membaca rekening/payment settings.
- Halaman order sudah membaca `/api/payment/options` untuk rekening dan instruksi transfer.
- `npm run lint` berhasil setelah install `@clerk/backend`.
- `npm run build` berhasil, masih dengan warning chunk size Vite.

Verifikasi D1 remote:

- Saya mencoba export schema remote dengan:

```powershell
npx wrangler d1 export meyya_db --remote --no-data --output .context/d1-remote-schema.sql --skip-confirmation
```

- Export gagal karena environment ini tidak punya `CLOUDFLARE_API_TOKEN`:

```text
In a non-interactive environment, it's necessary to set a CLOUDFLARE_API_TOKEN environment variable for wrangler to work.
```

- Artinya tabel baru belum bisa saya verifikasi langsung di D1 Cloudflare remote.
- Yang sudah terverifikasi hanya `schema.sql` lokal: `payment_bank_accounts` dan `payment_settings` ada; `product_images` belum ada.

## Prioritas Tinggi

### 1. Client belum mengirim `Authorization` ke endpoint user/order yang sekarang protected

File terkait:

- `src/components/profile/ProfileAccount.tsx`
- `src/components/profile/ProfileHistory.tsx`
- `src/components/profile/ProfileStatus.tsx`
- `src/pages/Checkout.tsx`
- `src/pages/Order.tsx`
- `src/components/Header.tsx`
- `src/hooks/useAuthFetch.ts`
- `functions/api/_middleware.ts`

Kondisi saat ini:

- Middleware sekarang melindungi `/api/user/*` dan `/api/orders*`.
- Namun komponen profile, checkout, order detail, dan header sync masih memakai `fetch`/SWR fetcher biasa tanpa bearer token.
- Admin sudah punya `useAuthFetch`/`useAuthFetcher`, tetapi customer-facing area belum memakainya.

Risiko:

- `/profil` gagal load/update profile dan alamat dengan 401.
- Riwayat/status order gagal load.
- Checkout gagal membuat order karena `POST /api/orders` butuh token.
- Halaman `/order/:id` gagal load detail order.
- Header `/api/user/sync` gagal jalan.

Saran:

- Pakai `useAuthFetcher()` untuk semua SWR ke `/api/user/*` dan `/api/orders*`.
- Pakai `useAuthFetch()` untuk `PUT /api/user/profile/:id`, `POST/DELETE /api/user/addresses/*`, `POST /api/orders`, dan `POST /api/user/sync`.
- Untuk `Order.tsx`, karena `useParams` + `useSWR` butuh token, buat fetcher auth khusus dari `useAuthFetcher`.
- Jangan protect public endpoint yang memang tidak butuh login, misalnya `/api/payment/options`, `/api/products`, `/api/categories`, `/api/vouchers`, `/api/regions`.

### 2. `/api/user/sync` masih berisiko privilege escalation

File terkait:

- `functions/api/user/sync.ts`
- `src/components/Header.tsx`
- `functions/api/_middleware.ts`

Kondisi saat ini:

- Route `/api/user/sync` sekarang ikut protected oleh middleware.
- Tetapi handler masih membaca `clerk_id` dan `role` dari request body.
- Tidak ada pengecekan bahwa `body.clerk_id === context.data.clerkId`.
- `role` dari body bisa masuk ke D1.
- Middleware admin berikutnya menentukan admin berdasarkan `users.role` di D1.

Risiko:

- User authenticated bisa mengirim request manual ke `/api/user/sync` dengan `role: "admin"` untuk dirinya sendiri.
- Setelah role tersimpan di D1, request admin berikutnya berpotensi lolos.

Saran:

- Derive `clerk_id` dari `context.data.clerkId`, bukan body.
- Jangan pernah menerima `role` dari client.
- Untuk self-sync, set role default hanya saat insert: `customer`.
- Jika user sudah ada, jangan update role dari self-sync.
- Role admin harus diubah hanya lewat proses admin/server terpercaya, bukan dari Header client.
- Jika ingin sync role dari Clerk, ambil dari server-side Clerk API/private metadata memakai `CLERK_SECRET_KEY`, bukan body client.

### 3. Profile/order client update ke Clerk belum konsisten

File terkait:

- `src/components/profile/ProfileAccount.tsx`
- `functions/api/user/profile/[id].ts`
- `src/components/Header.tsx`

Kondisi saat ini:

- `ProfileAccount` memang memanggil `clerkUser.update({ firstName, lastName })` setelah D1 profile update sukses.
- Namun D1 profile update sekarang akan gagal 401 jika request tidak memakai bearer token.
- Jika D1 sudah punya `first_name`/`last_name` tetapi Clerk masih kosong, tidak ada flow auto-repair dari D1 ke Clerk kecuali user tekan simpan dan request berhasil.
- Header masih sync arah Clerk ke D1, bukan D1 ke Clerk.

Risiko:

- Nama di D1 bisa benar, tetapi Clerk user tetap kosong.
- Header/avatar Clerk tetap kosong walaupun `/profil` menampilkan nama dari D1.
- Perubahan profile bisa tersimpan di salah satu source saja jika salah satu update gagal.

Saran implementasi:

- Untuk aksi simpan profile, gunakan `useAuthFetch` ke `/api/user/profile/:id`.
- Setelah API D1 sukses, panggil `await clerkUser.update({ firstName, lastName })`.
- Setelah `clerkUser.update`, panggil `await clerkUser.reload()` agar UI Clerk langsung refresh.
- Jika `clerkUser.update` gagal, tampilkan warning spesifik: "D1 tersimpan, Clerk gagal sinkron".
- Saat load profile, jika D1 punya nama tetapi `clerkUser.firstName/lastName` kosong, tampilkan CTA "Sinkronkan nama ke akun login".

Opsi yang lebih kuat:

- Buat endpoint server-side `POST /api/user/profile/sync-clerk`.
- Endpoint wajib auth dan owner-check.
- Endpoint baca `first_name/last_name` dari D1, lalu update Clerk via backend SDK dengan `CLERK_SECRET_KEY`.
- Ini membuat D1 -> Clerk repair bisa dilakukan tanpa mengandalkan browser state.

Pseudo-flow server:

```ts
// POST /api/user/profile/sync-clerk
// 1. clerkId dari context.data.clerkId
// 2. SELECT first_name, last_name FROM users WHERE clerk_id = ?
// 3. update Clerk user firstName/lastName dengan CLERK_SECRET_KEY
// 4. return success
```

### 4. `CLERK_SECRET_KEY` wajib ada di Cloudflare Pages env

File terkait:

- `functions/api/_middleware.ts`
- `package.json`

Kondisi saat ini:

- `verifyToken(token, { secretKey: env.CLERK_SECRET_KEY })` dipakai di middleware.

Risiko:

- Jika `CLERK_SECRET_KEY` belum diset di Cloudflare Pages, semua endpoint protected akan return 401.

Saran:

- Tambahkan `CLERK_SECRET_KEY` di Cloudflare Pages environment variables.
- Pastikan key production memakai secret dari instance Clerk production.
- Tambah error log internal yang jelas saat secret kosong, tanpa membocorkan secret ke client.

### 5. `POST /api/orders` masih percaya ongkir, admin fee, dan payment method dari client

File terkait:

- `src/pages/Checkout.tsx`
- `functions/api/orders/index.ts`
- `functions/api/payment/options.ts`
- `schema.sql`

Kondisi saat ini:

- `clerk_id` dan `unique_code` sudah benar: server-side.
- Subtotal/HPP/voucher sebagian sudah server-side.
- Tetapi `shipping_cost`, `admin_fee`, dan `payment_method` masih diterima dari client.
- Checkout belum membaca `/api/payment/options`; admin fee masih hardcoded di client.

Risiko:

- Request manual bisa membuat ongkir 0 atau admin fee negatif/sembarang.
- Payment method yang tidak aktif bisa dikirim manual.
- Payment settings D1 belum menjadi source of truth saat order dibuat.

Saran:

- Client kirim `courier_code/service_code` dan destination, bukan nominal ongkir.
- Server validasi ulang ongkir dari API shipping atau dari signed shipping quote.
- Server ambil admin fee dari `payment_settings`.
- Server whitelist payment method aktif dari `payment_settings`.
- Saat ini, sebelum gateway aktif, server sebaiknya hanya terima `TRANSFER`.

### 6. Confirm payment masih bisa race dan stok negatif

File terkait:

- `functions/api/admin/orders/[id]/confirm.ts`

Kondisi saat ini:

- Status order dicek `PENDING`.
- Update order memakai `WHERE status = 'PENDING'`.
- Stok produk tetap didecrement tanpa guard `stock >= quantity`.
- Hasil update status tidak dicek sebelum/bersamaan dengan decrement.

Risiko:

- Dua request confirm paralel masih berpotensi sama-sama membaca `PENDING`.
- Stok bisa negatif jika stok berubah setelah order dibuat.
- Jika update status gagal tetapi decrement sudah berjalan, data stok tidak konsisten.

Saran:

- Update status dulu dengan guard `PENDING`, cek affected rows.
- Decrement stok dengan guard `WHERE id = ? AND (is_preorder = 1 OR stock >= ?)`.
- Jika salah satu stock update gagal, jangan lanjut status paid/processing.
- Tambah `stock_movements` untuk audit.

### 7. Payment settings belum punya admin UI/API untuk edit

File terkait:

- `schema.sql`
- `functions/api/payment/options.ts`
- `src/pages/Order.tsx`

Kondisi saat ini:

- Tabel payment lokal sudah ada.
- Public read endpoint sudah ada.
- Halaman order sudah membaca endpoint.
- Belum terlihat endpoint admin untuk CRUD rekening/QRIS/instruction.
- Belum terlihat tab admin payment.

Saran:

- Tambah `GET/PUT /api/admin/payment-settings`.
- Tambah `GET/POST/PUT/DELETE /api/admin/payment-bank-accounts`.
- Tambah upload QRIS via endpoint upload yang sudah divalidasi.
- Tambah tab admin "Pembayaran".
- Checkout harus membaca payment settings juga, bukan hardcode metode.

### 8. `product_images` belum ada di schema lokal maupun code

File terkait:

- `schema.sql`
- `src/components/admin/AdminProductForm.tsx`
- `src/pages/ProductDetail.tsx`
- `functions/api/products.ts`
- `functions/api/products/[slug].ts`

Kondisi saat ini:

- `schema.sql` lokal belum punya `product_images`.
- Produk masih memakai satu `products.image_url`.

Risiko:

- Multi image product belum bisa diverifikasi di D1.
- Detail produk fashion masih terbatas satu foto.

Saran schema:

```sql
CREATE TABLE IF NOT EXISTS product_images (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  alt_text TEXT,
  sort_order INTEGER DEFAULT 0,
  is_primary INTEGER DEFAULT 0,
  color_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

Saran implementasi:

- Admin product form punya gallery uploader dan reorder.
- Product detail punya carousel/thumbnails.
- Product card tetap pakai primary image.
- Opsional: bind image ke `color_name`.

## Prioritas Menengah

### 9. D1 remote schema belum bisa diverifikasi dari agent

Kondisi saat ini:

- Export remote gagal karena `CLOUDFLARE_API_TOKEN` tidak tersedia.
- `schema.sql` lokal sudah punya tabel payment baru.
- Remote D1 bisa saja belum sama dengan local schema.

Saran:

- Jalankan dari terminal yang punya token:

```powershell
$env:CLOUDFLARE_API_TOKEN="TOKEN_ANDA"
npx wrangler d1 export meyya_db --remote --no-data --output .context/d1-remote-schema.sql --skip-confirmation
git diff --no-index schema.sql .context/d1-remote-schema.sql
```

- Jika remote belum punya tabel baru, apply migration/schema:

```powershell
npx wrangler d1 execute meyya_db --remote --file schema.sql
```

Catatan:

- `schema.sql` masih berisi seed demo. Untuk production, lebih aman pisahkan migration schema-only dari seed.
- Jangan commit full dump karena bisa berisi PII customer/order.

### 10. Public order/payment UX masih fallback ke hardcoded bank jika D1 kosong

File terkait:

- `src/pages/Order.tsx`

Kondisi saat ini:

- Order page membaca `/api/payment/options`.
- Jika tidak ada bank aktif, UI fallback ke BCA hardcoded.

Risiko:

- Jika admin belum mengisi bank di D1, user tetap melihat rekening default yang mungkin tidak valid.

Saran:

- Jika tidak ada bank aktif, tampilkan state "rekening belum dikonfigurasi, hubungi admin/CS".
- Jangan fallback ke rekening production palsu/default.

### 11. CRM masih semi-mock

File terkait:

- `src/components/admin/AdminCRMManager.tsx`
- `functions/api/admin/users.ts`

Kondisi saat ini:

- List customer, LTV, AOV, total order, dan last activity sudah dari D1.
- Detail order masih memakai `MOCK_ORDERS`.
- Journey timeline masih memakai `MOCK_JOURNEY`.
- `returnRate`, `favoriteDay`, `size`, voucher count, dan wishlist count masih default/mock.
- Search input belum memfilter data.
- Tombol "Buat Kupon", "Kirim Email", dan "Export" belum punya action.

Saran:

- Tambah `/api/admin/users/:clerk_id/orders`.
- Tambah `/api/admin/users/:clerk_id/events`.
- Hitung favorite day dari `orders.created_at`.
- Hitung ukuran dominan dari `order_items.size_name`.
- Implement search/filter.
- Buat action nyata untuk voucher personal/export.

### 12. Marketing panel masih memakai scenario buatan

File terkait:

- `src/components/admin/AdminMarketingPanel.tsx`

Kondisi saat ini:

- Nomor WhatsApp palsu sudah tidak dibuat.
- Context campaign masih dibuat dari index array: abandoned cart, pending payment, birthday, VIP retention, engaged.

Risiko:

- Admin bisa mengirim pesan dengan konteks yang tidak benar.

Saran:

- Pending payment dari `orders.status = 'PENDING'`.
- VIP retention dari LTV dan `last_order_date`.
- Birthday hanya jika ada field tanggal lahir.
- Abandoned cart butuh persistent cart/event tracking.
- Sembunyikan target yang tidak punya dasar data nyata.

### 13. Wishlist masih local/semi-local

File terkait:

- `src/store.ts`
- `src/pages/Wishlist.tsx`
- `schema.sql`

Kondisi saat ini:

- Tabel `wishlists` ada.
- UI wishlist masih memakai Zustand/local state.
- Belum terlihat endpoint D1-backed wishlist.

Saran:

- Tambah `GET/POST/DELETE /api/user/wishlist`.
- Saat login, sync wishlist lokal ke D1.
- Product card/detail membaca status wishlist dari D1 untuk user login.

### 14. Shipping settings belum punya UI admin

File terkait:

- `functions/api/shipping/calculate.ts`
- `schema.sql`

Kondisi saat ini:

- `shipping_settings` sudah ada di D1.
- Origin dan active couriers dibaca dari DB.
- Belum ada UI admin untuk mengubah origin/courier.

Saran:

- Tambah tab admin "Pengiriman".
- Admin bisa memilih origin desa/kelurahan via region API.
- Admin bisa aktif/nonaktif courier.
- Tambah fallback pesan jelas jika `API_CO_ID_KEY` kosong atau origin belum dikonfigurasi.

### 15. Varian produk belum punya stok per size/color

Kondisi saat ini:

- Produk punya stok global.
- Warna dan ukuran disimpan sebagai opsi terpisah.

Risiko:

- Oversell bisa terjadi untuk size/color tertentu walaupun stok global masih tersedia.

Saran:

- Tambah tabel `product_variants` dengan `product_id`, `color_name`, `size_name`, `sku`, `stock`, dan `is_active`.
- Cart/order simpan `variant_id`.
- Decrement stok berdasarkan variant, bukan hanya product.

## Backlog Fitur Toko Online

- Upload bukti transfer untuk manual transfer.
- Payment expiry dan auto-cancel order `PENDING`.
- Admin fulfillment: nomor resi, kurir aktual, status `SHIPPED`, `COMPLETED`, `CANCELLED`.
- Email/WhatsApp template berdasarkan status order.
- Low stock alert dan restock history.
- Audit log admin untuk produk, voucher, order confirm, upload, role update, dan payment settings.
- Product SEO fields: meta title, meta description, canonical slug, Open Graph image.
- Review/rating produk setelah order completed.
- Related products/manual upsell mapping.
- Bundle/paket produk.
- Coupon per user atau segment.
- Return/exchange workflow.
- Inventory reservation jika traffic naik.
- Dashboard margin per produk dan kategori.
- CSV export orders, customers, products.
- Soft delete produk/kategori agar histori order tetap aman.

## Urutan Fix Disarankan

1. Update semua fetch customer-facing protected endpoint agar memakai bearer token.
2. Kunci `/api/user/sync`: derive `clerk_id` dari token dan jangan accept `role` dari body.
3. Tambah flow sync D1 -> Clerk untuk first/last name, minimal lewat CTA di profile atau endpoint server-side.
4. Pastikan `CLERK_SECRET_KEY` tersedia di Cloudflare Pages env.
5. Pindahkan validasi ongkir/admin fee/payment method ke server.
6. Buat confirm payment aman dari race dan stok negatif.
7. Tambah admin payment settings UI/API.
8. Apply/verify D1 remote schema dengan `CLOUDFLARE_API_TOKEN`.
9. Tambah `product_images` untuk multi image product.
10. Selesaikan CRM/Marketing/Wishlist/Variant stock.
