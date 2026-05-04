# MEYYA.ID Improvement Notes

Audit terakhir: 2026-05-04.

Dokumen ini hanya berisi temuan yang masih relevan setelah rangkaian fix auth, checkout, payment, CRM, dan debug produksi terakhir. Item yang sudah fixed tidak lagi dimasukkan sebagai prioritas aktif.

## Batch Improvement 2026-05-04

Checklist permintaan terbaru:

- [x] Filter kategori homepage, menu navbar, dan footer mengikuti kategori yang punya produk.
- [x] Produk out of stock ditampilkan greyed out.
- [x] Laman `/search` memakai data produk nyata, bukan mockup.
- [x] Voucher bisa dibuat tanpa tanggal mulai dan/atau tanggal kadaluarsa untuk promo first-order yang selalu berlaku.
- [x] Tombol tambah produk dikembalikan dekat posisi semula; tombol export dipindah ke kanan atas tabel produk.
- [x] Border persegi hitam bawaan pada filter "Semua Waktu" dashboard Helicopter View dihapus.

Verifikasi:

- `npm run lint` berhasil.
- `npm run build` berhasil, masih dengan warning chunk size Vite.

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
- Batch lanjutan 2026-05-04 sudah diterapkan:
  product multi-image/gallery, D1-backed wishlist customer, stok varian size/color, admin refresh `region_cache`, editor manual related product,
  bundle multi-item, audit log payment/shipping settings, TTL regional cache 30 hari, dan debug JSON produksi dipersempit.
- Stok varian sekarang berbasis kombinasi opsi lengkap: warna + ukuran + spesifikasi custom kategori disimpan sebagai `option_signature`/`option_label`.
- Admin product form bisa generate matrix varian dari opsi kategori, lalu stok/SKU diisi per kombinasi.
- Cart, checkout, dan order create membawa `variant_id` serta `variant_options`; checkout menampilkan swatch warna terpilih, bukan hanya nama warna.
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
- D1 schema tambahan yang sekarang dibutuhkan untuk varian lengkap:
  `product_variants.option_signature`, `product_variants.option_label`, dan `order_items.variant_options`.
  `ensureCommerceSchema` sudah melakukan self-heal, tetapi remote tetap sebaiknya diverifikasi.

### 2. Pisahkan migration production dari seed demo

Kondisi saat ini:

- `schema.sql` masih bercampur definisi tabel dan seed/demo data.
- Applying full `schema.sql` ke production berisiko membawa data contoh atau menimpa asumsi seed.

Saran:

- Buat file migration schema-only untuk D1 production.
- Simpan seed demo sebagai file terpisah untuk local/dev.

## Prioritas Menengah

### 3. CRM sudah lebih nyata, tetapi belum lengkap

Kondisi saat ini:

- List customer, LTV, AOV, total order, pending payment, last activity, ukuran dominan, hari checkout favorit, voucher count, wishlist count, search, dan export sudah dari D1.
- Detail order sudah dari D1.
- Journey timeline sudah dari join date dan order D1.
- Return/exchange belum ada, sehingga `returnRate` belum bisa dihitung.
- Return/exchange sudah ada; `returnRate` belum ditampilkan sebagai metrik CRM.
- Voucher personal/segment sudah didukung di voucher form/API.

Saran:

- Hitung return rate setelah return/exchange workflow ada.
- Tambah event tracking untuk cart, view product, dan campaign touch.

### 4. Marketing panel sudah tidak memakai scenario palsu, tetapi datanya masih terbatas

Kondisi saat ini:

- Target berbasis data nyata: pending payment, VIP retention, customer baru.
- Birthday dan abandoned cart disembunyikan karena belum ada data dasar.

Saran:

- Birthday hanya jika field tanggal lahir tersedia.
- Abandoned cart butuh persistent cart/event tracking.
- Tambah template campaign dari status order dan segment.

### 5. Debug JSON produksi masih aktif

Kondisi saat ini:

- Debug JSON detail sudah dipersempit. `debugErrorResponse` default hanya mengirim pesan error pendek dan `request_id`.
- Stack/context detail tetap dicatat ke `console.error`.

Saran:

- Jika butuh debug sementara, aktifkan flag khusus internal dan pastikan tidak dibuka ke public.

## Audit Kecil 2026-05-04

Temuan yang sudah dibereskan:

- Tidak ada lagi pemanggilan `alert(...)`, `confirm(...)`, atau `prompt(...)` di `src`/`functions`/`docs`.
- Input spesifikasi kategori tidak lagi menyimpan row kosong.
- Product attributes kosong difilter saat create/update dan saat response GET.
- `ProfileAccount` tidak lagi menampilkan nomor lama tanpa grouping 4 digit.
- Proxy region tidak lagi memakai base path lama `https://use.api.co.id/regions`.

Temuan lanjutan yang masih layak dikerjakan:

- `schema.sql` masih bercampur schema dan seed demo; migration production sebaiknya dipisah.
- `shipping_settings.active_couriers` seed lama masih memakai variasi nama kurir campuran (`JNE`, `JT`, `paxel`); normalisasi kode kurir perlu disamakan dengan response api.co.id.
- Return rate CRM belum dihitung dari tabel `return_requests`.
- Event tracking untuk cart/view product/campaign touch belum tersedia.

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
- Full variant stock matrix: implemented dengan `product_variants.option_signature`, admin generator kombinasi warna/ukuran/spek custom, `variant_options` di order item, dan swatch warna di checkout.

Catatan lanjutan:

- Bundle creator admin sudah mendukung multi-item dalam satu submit.
- Related product manual mapping sudah punya editor di admin product form.
- Template pesan belum otomatis mengirim WhatsApp/email; saat ini dikelola sebagai template operasional untuk disalin/dipakai admin.

## Urutan Fix Disarankan Berikutnya

1. Apply/verify D1 remote schema dengan `CLOUDFLARE_API_TOKEN`.
2. Pisahkan `schema.sql` menjadi migration schema-only dan seed demo agar apply production lebih aman.
3. Hitung dan tampilkan return rate CRM dari `return_requests`.
4. Tambah event tracking untuk cart/view product/campaign touch.
5. Hubungkan template pesan ke provider WhatsApp/email setelah provider dipilih.
6. Tambah drag-and-drop reorder untuk product gallery.
7. Normalisasi stok global agar otomatis dihitung dari total `product_variants`, bukan diinput manual.
