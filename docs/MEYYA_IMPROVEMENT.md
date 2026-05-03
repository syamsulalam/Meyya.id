# MEYYA.ID Improvement Notes

Audit terakhir: 2026-05-03.

Dokumen ini hanya berisi temuan yang masih relevan setelah rangkaian fix auth, checkout, payment, CRM, dan debug produksi terakhir. Item yang sudah fixed tidak lagi dimasukkan sebagai prioritas aktif.

## Ringkasan Status Terbaru

Perbaikan yang sudah diterapkan:

- Middleware API memakai Clerk backend `authenticateRequest`, bukan decode JWT manual.
- Middleware menerima role admin dari D1 atau metadata Clerk server-side, bukan dari body client.
- Middleware sudah menangani runtime Cloudflare Pages yang tidak punya `process.env`.
- Middleware memakai pasangan `CLERK_SECRET_KEY` dan `VITE_CLERK_PUBLISHABLE_KEY`/`CLERK_PUBLISHABLE_KEY`.
- Debug JSON terstruktur sudah ditambahkan untuk error middleware, `/api/user/sync`, dan `/api/admin/users`; secret/token di-redact.
- CSP Cloudflare Pages `_headers` sudah mengizinkan app bundle, Clerk custom domain, Google Fonts, Cloudflare Insights, dan challenge iframe.
- Customer-facing protected fetch sudah memakai bearer token: profile, alamat, order history/status, checkout create order, order detail, dan user sync.
- `useAuthFetch`/`useAuthFetcher` tidak lagi mengirim request protected sebelum sesi Clerk siap.
- `/api/user/sync` derive `clerk_id` dari token dan tidak menerima `role` dari client.
- Self-sync user melakukan upsert tanpa menaikkan role dan melakukan self-heal schema `users` jika remote D1 tertinggal.
- Profile update memakai auth fetch, update nama Clerk, reload user, dan menampilkan warning jika sync Clerk gagal.
- Endpoint `POST /api/user/profile/sync-clerk` tersedia untuk repair nama D1 -> Clerk via backend SDK.
- `POST /api/orders` derive `clerk_id` dan `unique_code` server-side.
- `POST /api/orders` tidak lagi percaya `shipping_cost`, `admin_fee`, `total_paid`, atau `unique_code` dari client.
- `POST /api/orders` validasi ulang ongkir dari API shipping, mengambil transfer admin fee dari `payment_settings`, dan hanya menerima `TRANSFER`.
- Voucher invalid/not found/expired di `POST /api/orders` return 400.
- Confirm payment sudah guard status `PENDING`, decrement stok dengan guard stok cukup, dan rollback kompensasi jika decrement sebagian gagal.
- Order page membaca `/api/payment/options` dan tidak fallback ke rekening hardcoded jika tidak ada bank aktif.
- `schema.sql` lokal sudah punya `payment_bank_accounts`, `payment_settings`, dan `product_images`.
- Admin CRM list sudah membaca data D1, termasuk LTV, AOV, pending payment, ukuran dominan, hari checkout favorit, voucher count, wishlist count, search, dan CSV export.
- Endpoint `GET /api/admin/users/:clerk_id/orders` sudah tersedia untuk riwayat order pelanggan.
- Admin CRM detail order dan journey timeline sudah memakai order D1, bukan `MOCK_ORDERS`/`MOCK_JOURNEY`.
- Marketing panel tidak lagi membuat scenario palsu dari index array; target sekarang hanya dari data nyata: pending payment, VIP retention, atau customer baru.
- Admin payment settings sudah tersedia: tab "Pembayaran", `GET/PUT /api/admin/payment-settings`, dan `GET/POST/PUT/DELETE /api/admin/payment-bank-accounts`.
- Admin payment settings bisa mengubah instruksi transfer, expiry, admin fee, QRIS, status QRIS, dan rekening bank aktif.
- Public `/api/payment/options` melakukan self-heal tabel payment agar customer page tidak gagal jika schema remote tertinggal.
- Admin shipping settings sudah tersedia: tab "Pengiriman" dan `GET/PUT /api/admin/shipping-settings`.
- Admin shipping settings bisa memilih origin desa/kelurahan dari region API dan mengatur kurir aktif.
- `/api/shipping/calculate` memberi pesan jelas jika `API_CO_ID_KEY` belum tersedia.
- `npm run lint` berhasil.
- `npm run build` berhasil, masih dengan warning chunk size Vite.

Catatan produksi:

- Error `jwk-kid-mismatch` pernah terjadi karena `VITE_CLERK_PUBLISHABLE_KEY` dan `CLERK_SECRET_KEY` berasal dari instance Clerk berbeda. Solusinya adalah mengambil keduanya dari instance Clerk yang sama.
- Jika browser masih memuat bundle lama, lakukan redeploy production dan purge cache Cloudflare.
- Error `webpage_content_reporter.js` berasal dari browser extension, bukan aplikasi.

## Prioritas Tinggi

### 1. D1 remote schema belum bisa diverifikasi dari agent

Kondisi saat ini:

- Agent belum punya `CLOUDFLARE_API_TOKEN`, sehingga tidak bisa export schema remote.
- Beberapa endpoint sudah punya self-heal ringan untuk tabel `users`.
- Remote D1 masih bisa tertinggal untuk tabel lain seperti payment, product images, wishlist, atau shipping.

Saran:

Jalankan dari terminal yang punya token:

```powershell
$env:CLOUDFLARE_API_TOKEN="TOKEN_ANDA"
npx wrangler d1 export meyya_db --remote --no-data --output .context/d1-remote-schema.sql --skip-confirmation
git diff --no-index schema.sql .context/d1-remote-schema.sql
```

Jika remote belum punya tabel baru, apply migration/schema:

```powershell
npx wrangler d1 execute meyya_db --remote --file schema.sql
```

Catatan:

- `schema.sql` masih berisi seed demo. Untuk production, lebih aman pisahkan migration schema-only dari seed.
- Jangan commit full dump karena bisa berisi PII customer/order.

### 2. Product multi-image baru sebatas schema

File terkait:

- `schema.sql`
- `src/components/admin/AdminProductForm.tsx`
- `src/pages/ProductDetail.tsx`
- `functions/api/products.ts`
- `functions/api/products/[slug].ts`

Kondisi saat ini:

- `schema.sql` lokal sudah punya `product_images`.
- Produk masih memakai satu `products.image_url`.
- Belum ada CRUD gallery di admin product form.
- Product detail belum punya carousel/thumbnails.

Saran:

- Admin product form punya gallery uploader dan reorder.
- Product detail punya carousel/thumbnails.
- Product card tetap pakai primary image.
- Opsional: bind image ke `color_name`.

### 3. Wishlist masih local/semi-local

File terkait:

- `src/store.ts`
- `src/pages/Wishlist.tsx`
- `src/components/CatalogProductCard.tsx`
- `src/pages/ProductDetail.tsx`
- `schema.sql`

Kondisi saat ini:

- Tabel `wishlists` ada.
- Admin CRM sudah bisa menghitung `wishlistCount` dari D1 jika data tersedia.
- UI wishlist customer masih memakai Zustand/local state.
- Belum ada endpoint D1-backed wishlist.

Saran:

- Tambah `GET/POST/DELETE /api/user/wishlist`.
- Saat login, sync wishlist lokal ke D1.
- Product card/detail membaca status wishlist dari D1 untuk user login.

### 4. Varian produk belum punya stok per size/color

Kondisi saat ini:

- Produk punya stok global.
- Warna dan ukuran disimpan sebagai opsi terpisah.
- Order item menyimpan `color_name` dan `size_name`, tetapi belum ada `variant_id`.

Risiko:

- Oversell bisa terjadi untuk size/color tertentu walaupun stok global masih tersedia.

Saran:

- Tambah tabel `product_variants` dengan `product_id`, `color_name`, `size_name`, `sku`, `stock`, dan `is_active`.
- Cart/order simpan `variant_id`.
- Decrement stok berdasarkan variant, bukan hanya product.

## Prioritas Menengah

### 5. CRM sudah lebih nyata, tetapi belum lengkap

Kondisi saat ini:

- List customer, LTV, AOV, total order, pending payment, last activity, ukuran dominan, hari checkout favorit, voucher count, wishlist count, search, dan export sudah dari D1.
- Detail order sudah dari D1.
- Journey timeline sudah dari join date dan order D1.
- Return/exchange belum ada, sehingga `returnRate` belum bisa dihitung.
- Tombol "Buat Kupon" masih placeholder menuju kebutuhan voucher personal/segment.

Saran:

- Tambah voucher personal/per-segment.
- Tambah event tracking untuk cart, view product, dan campaign touch.
- Hitung return rate setelah return/exchange workflow ada.

### 6. Marketing panel sudah tidak memakai scenario palsu, tetapi datanya masih terbatas

Kondisi saat ini:

- Target berbasis data nyata: pending payment, VIP retention, customer baru.
- Birthday dan abandoned cart disembunyikan karena belum ada data dasar.

Saran:

- Birthday hanya jika field tanggal lahir tersedia.
- Abandoned cart butuh persistent cart/event tracking.
- Tambah template campaign dari status order dan segment.

### 7. Debug JSON produksi masih aktif

Kondisi saat ini:

- Debug JSON sangat membantu saat stabilisasi auth/D1.
- Response debug menampilkan stack dan schema info, dengan secret/token di-redact.

Saran:

- Setelah produksi stabil, batasi debug detail hanya untuk admin atau environment development.
- Untuk public/customer error, gunakan pesan pendek dan simpan detail di log internal.

## Backlog Fitur Toko Online

- Upload bukti transfer untuk manual transfer.
- Payment expiry dan auto-cancel order `PENDING`.
- Admin fulfillment: nomor resi, kurir aktual, status `SHIPPED`, `COMPLETED`, `CANCELLED`.
- Email/WhatsApp template berdasarkan status order.
- Low stock alert dan restock history.
- `stock_movements` untuk audit stok.
- Audit log admin untuk produk, voucher, order confirm, upload, role update, dan payment settings.
- Product SEO fields: meta title, meta description, canonical slug, Open Graph image.
- Review/rating produk setelah order completed.
- Related products/manual upsell mapping.
- Bundle/paket produk.
- Coupon per user atau segment.
- Return/exchange workflow.
- Inventory reservation jika traffic naik.
- Dashboard margin per produk dan kategori.
- CSV export orders/products.
- Soft delete produk/kategori agar histori order tetap aman.

## Urutan Fix Disarankan Berikutnya

1. Apply/verify D1 remote schema dengan `CLOUDFLARE_API_TOKEN`.
2. Tambah UI/code `product_images` untuk multi-image product.
3. Implement D1-backed wishlist customer.
4. Tambah product variants dan stok per size/color.
5. Tambah audit log admin untuk perubahan payment/shipping settings.
6. Batasi debug JSON produksi setelah stabil.
