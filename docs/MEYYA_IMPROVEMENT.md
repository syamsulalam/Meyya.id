# MEYYA.ID Improvement Notes

Audit terakhir: 2026-05-04.

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
- `/api/regions/*` sekarang memakai endpoint api.co.id regional yang benar (`/regional/indonesia/*`) dan menyimpan response ke D1 `region_cache`.
- Data provinsi/kabupaten/kecamatan/desa dipanggil ke api.co.id hanya saat cache belum ada; kalkulasi ongkir tetap real-time ke API ekspedisi.
- Browser native `alert`, `confirm`, dan `prompt` sudah dihapus dari source app dan diganti toast/confirm modal styling MEYYA.
- Spesifikasi kategori sekarang menerima opsi dengan spasi serta input comma/newline/semicolon-separated, lalu disanitasi sebelum disimpan.
- Spesifikasi kategori/produk kosong difilter di UI dan API agar tidak tampil sebagai spesifikasi tambahan.
- Nomor WhatsApp di profil dan checkout diformat per 4 digit saat data dimuat dan saat diketik.
- Backlog fitur toko online batch 2026-05-04 sudah diterapkan dalam bentuk MVP production-ready:
  upload bukti transfer, payment expiry + auto-cancel, inventory reservation, admin fulfillment/resi/status, template pesan,
  low stock alert, stock movement log, audit log, SEO produk, review produk, related products fallback, bundle API/UI sederhana,
  coupon personal/segment, return/exchange request, dashboard margin, CSV export orders/products, dan soft delete produk/kategori.
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

### 7. Regional cache belum punya invalidation UI

Kondisi saat ini:

- `region_cache` membuat form alamat tidak terus memukul api.co.id.
- Cache akan terisi per endpoint saat user/admin memilih wilayah.
- Belum ada tombol admin untuk clear/refetch cache jika api.co.id memperbarui data wilayah.

Saran:

- Tambah endpoint admin `DELETE /api/admin/region-cache`.
- Tambah tombol "Refresh Cache Wilayah" di admin shipping settings.
- Opsional: tambah TTL otomatis 30 hari jika data wilayah dianggap cukup stabil.

### 8. Debug JSON produksi masih aktif

Kondisi saat ini:

- Debug JSON sangat membantu saat stabilisasi auth/D1.
- Response debug menampilkan stack dan schema info, dengan secret/token di-redact.

Saran:

- Setelah produksi stabil, batasi debug detail hanya untuk admin atau environment development.
- Untuk public/customer error, gunakan pesan pendek dan simpan detail di log internal.

## Audit Kecil 2026-05-04

Temuan yang sudah dibereskan:

- Tidak ada lagi pemanggilan `alert(...)`, `confirm(...)`, atau `prompt(...)` di `src`/`functions`/`docs`.
- Input spesifikasi kategori tidak lagi menyimpan row kosong.
- Product attributes kosong difilter saat create/update dan saat response GET.
- `ProfileAccount` tidak lagi menampilkan nomor lama tanpa grouping 4 digit.
- Proxy region tidak lagi memakai base path lama `https://use.api.co.id/regions`.

Temuan lanjutan yang masih layak dikerjakan:

- `region_cache` sebaiknya punya admin refresh manual.
- Debug JSON produksi perlu dipersempit setelah deploy stabil.
- `schema.sql` masih bercampur schema dan seed demo; migration production sebaiknya dipisah.
- `shipping_settings.active_couriers` seed lama masih memakai variasi nama kurir campuran (`JNE`, `JT`, `paxel`); normalisasi kode kurir perlu disamakan dengan response api.co.id.

## Backlog Fitur Toko Online

Status 2026-05-04:

- Upload bukti transfer manual transfer: implemented di order page dan `POST /api/orders/:id/payment-proof`.
- Payment expiry dan auto-cancel `PENDING`: implemented via `payment_expires_at`, `expirePendingOrders`, dan release reservation.
- Admin fulfillment: implemented di tab admin "Operasional Toko" dengan status `PROCESSING`, `SHIPPED`, `COMPLETED`, `CANCELLED`, kurir, dan resi.
- Email/WhatsApp template berdasarkan status order: implemented sebagai `message_templates` dan editor template di admin.
- Low stock alert dan restock history: low stock tampil di dashboard; perubahan stok masuk `stock_movements`.
- `stock_movements` untuk audit stok: implemented untuk initial stock, manual adjustment, reservation, dan reservation release.
- Audit log admin: implemented `audit_logs` dan viewer di admin Operasional Toko.
- Product SEO fields: implemented di admin product form dan product detail meta title/description.
- Review/rating produk: implemented di product detail dan `POST /api/reviews`.
- Related products/manual upsell mapping: schema `product_related` tersedia; product detail fallback ke produk kategori sama jika mapping manual belum diisi.
- Bundle/paket produk: implemented dengan `product_bundles`, public `GET /api/bundles`, admin `GET/POST /api/admin/bundles`, dan creator sederhana di admin.
- Coupon per user atau segment: implemented lewat `target_clerk_id` dan `target_segment` di voucher.
- Return/exchange workflow: implemented untuk customer order completed dan admin return queue.
- Inventory reservation: implemented saat checkout membuat order; stok dikurangi saat `PENDING`, lalu reservation consumed saat paid/completed atau released saat cancel/expired.
- Dashboard margin per produk dan kategori: product margin tampil di dashboard metrics; API juga mengirim `categoryMargins`.
- CSV export orders/products: implemented di admin Operasional Toko dan admin Produk.
- Soft delete produk/kategori: delete produk/kategori sekarang arsip (`deleted_at`) agar histori order tetap aman.

Catatan lanjutan:

- Bundle creator admin saat ini MVP satu produk utama per create; endpoint sudah mendukung banyak item jika UI diperluas.
- Related product manual mapping sudah punya schema dan fallback UI, tetapi belum ada editor mapping khusus.
- Template pesan belum otomatis mengirim WhatsApp/email; saat ini dikelola sebagai template operasional untuk disalin/dipakai admin.

## Urutan Fix Disarankan Berikutnya

1. Apply/verify D1 remote schema dengan `CLOUDFLARE_API_TOKEN`.
2. Tambah UI/code `product_images` untuk multi-image product.
3. Implement D1-backed wishlist customer.
4. Tambah product variants dan stok per size/color.
5. Tambah admin refresh untuk `region_cache`.
6. Tambah editor manual related product mapping.
7. Perluas bundle editor untuk multi item dalam satu submit.
8. Hubungkan template pesan ke provider WhatsApp/email setelah provider dipilih.
9. Tambah audit log admin untuk perubahan payment/shipping settings.
10. Batasi debug JSON produksi setelah stabil.
