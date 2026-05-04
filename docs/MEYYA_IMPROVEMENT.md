# MEYYA.ID Improvement Notes

Audit terakhir: 2026-05-04.

Dokumen ini hanya berisi temuan yang masih relevan setelah rangkaian fix auth, checkout, payment, CRM, dan debug produksi terakhir. Item yang sudah fixed tidak lagi dimasukkan sebagai prioritas aktif.

## Batch Improvement 2026-05-04

Checklist permintaan terbaru:

- [x] Filter kategori homepage, menu navbar, dan footer mengikuti kategori yang punya produk.
- [x] Produk out of stock ditampilkan greyed out.
- [x] Laman `/search` memakai data produk nyata, bukan mockup.
- [x] Voucher bisa dibuat tanpa tanggal mulai dan/atau tanggal kedaluwarsa untuk promo first-order yang selalu berlaku.
- [x] Tombol tambah produk dikembalikan dekat posisi semula; tombol export dipindah ke kanan atas tabel produk.
- [x] Border persegi hitam bawaan pada filter "Semua Waktu" dashboard Helicopter View dihapus.

Verifikasi:

- `npm run lint` berhasil.
- `npm run build` berhasil, masih dengan warning chunk size Vite.

## Batch Prioritas Menengah 2026-05-04

Checklist:

- [x] `CLOUDFLARE_API_TOKEN` diperjelas: token yang dipakai agent/wrangler adalah Cloudflare API token dengan akses Account/D1, bukan token account-owned khusus untuk otomasi internal Cloudflare.
- [x] Profil pelanggan punya field tanggal lahir dengan copy insentif voucher birthday.
- [x] Schema self-heal menambahkan `users.birth_date` dan tabel `user_events`.
- [x] Event tracking dasar tersedia untuk product view, cart update, checkout started, order created, dan campaign touch.
- [x] CRM menghitung return rate dari `return_requests` dan menampilkan signal birthday/abandoned cart.
- [x] Marketing panel memakai signal birthday dan abandoned cart sebagai target nyata.
- [x] Remote D1 schema sudah diexport dari database `meyya-id` dan dibandingkan dengan `schema.sql`.
- [x] Migration production kecil sudah dibuat di `migrations/2026-05-04_remote_schema_patch.sql`.
- [x] Migration disesuaikan dengan batasan D1: `wishlists.created_at` ditambah tanpa default `CURRENT_TIMESTAMP`, lalu existing row diisi lewat `UPDATE`.
- [x] Migration production `migrations/2026-05-04_remote_schema_patch.sql` sudah berhasil di-apply ke D1 remote `meyya-id`.
- [x] Export ulang remote schema setelah migration sudah terverifikasi: kolom `users.birth_date`, `wishlists.created_at`, `payment_settings.transfer_admin_fee`, dan `payment_settings.qris_admin_fee` sudah ada.

## Batch Tooltip, Typo, Roadmap, dan Audit 2026-05-04 19:20:51 +07:00

Checklist:

- [x] Pemetaan tooltip teknis selesai untuk area admin, profil, checkout, order, dan product detail.
- [x] Komponen tooltip istilah dibuat di `src/components/term-tooltips.tsx` dengan komponen penjelasan terpisah per istilah.
- [x] Komponen `Tooltip` diperkuat agar menerima konten lebih panjang, bisa muncul saat focus, dan tidak memaksa satu baris.
- [x] Tooltip dipasang untuk istilah: Helicopter View, CRM, LTV, AOV, return rate, abandoned cart, birthday signal, campaign touch, D1, debug data, segment, Clerk ID, QRIS, payment expiry, admin fee, origin toko, cache wilayah, kurir aktif, taxonomy, varian, atribut, HPP, yield, SEO, canonical slug, Open Graph, SKU, fulfillment, resi, retur/exchange, audit log, bundle, template pesan, voucher, kode unik transfer, dan order bump.
- [x] Salah ketik `Total Profit Bebersih` diperbaiki menjadi `Total Profit Bersih`.
- [x] Copy minor disisir dan diperbaiki: `diupload/mengupload` menjadi `diunggah/mengunggah`, `kadaluarsa` menjadi `kedaluwarsa`, `Export/Orders/Stock/Action/Cancel/Approve/Reject/Gallery` pada area admin yang terlihat diganti ke istilah Indonesia yang lebih rapi.
- [x] Tab admin baru `Roadmap Pengembangan` ditambahkan untuk melacak fitur yang sudah ada dan yang akan ada.
- [x] Data roadmap UI dibuat di `src/data/developmentRoadmap.ts`.

Pemetaan tooltip yang dipasang:

- Dashboard admin: Helicopter View, filter waktu, total omset, total profit bersih, low stock alert, margin produk.
- CRM admin: CRM, LTV, AOV, return rate, keranjang terakhir/abandoned cart, campaign touch, D1, birthday signal.
- Marketing admin: WhatsApp Marketing CRM, debug D1 data, prioritas hari ini, abandoned cart, birthday, VIP/LTV.
- Voucher admin: voucher publik, target pengguna/segment, Clerk ID, segment label.
- Pembayaran admin: fee, expiry menit, fee transfer, fee QRIS, QRIS aktif.
- Pengiriman admin: API_CO_ID_KEY, origin toko, kurir aktif, refresh cache wilayah.
- Kategori admin: taxonomy, varian, atribut spesifikasi khusus.
- Produk admin: D1 status, low stock alert, stok varian, SKU, SEO, canonical slug, Open Graph image, HPP, yield, kalkulator profit.
- Operasional admin: fulfillment, resi, retur/exchange, template pesan, bundle, audit log.
- Customer flow: tanggal lahir birthday di profil, voucher/order bump/biaya transaksi/kode unik transfer di checkout, kode unik/resi/retur-exchange di order, pengiriman/retur di product detail.

Audit edge case lanjutan:

- `schema.sql` masih bercampur schema dan seed demo; migration berikutnya sebaiknya berasal dari file schema-only.
- Stok produk utama masih bisa berbeda dari total stok varian; idealnya stok global dihitung otomatis dari varian aktif.
- Voucher birthday otomatis belum dibuat; perlu aturan nominal, periode klaim, minimal belanja, dan guard agar tidak bisa dipakai berulang dengan mengubah tanggal lahir.
- Abandoned cart berbasis event, belum menyimpan snapshot cart agregat yang mudah dibaca admin.
- WhatsApp marketing masih membuka WhatsApp Web/manual; provider resmi belum terhubung untuk pengiriman otomatis dan audit delivery.
- Template pesan belum memakai variable preview/validation, sehingga placeholder yang salah bisa lolos.
- Tracking resi live belum terhubung ke API kurir; saat ini resi hanya disimpan dan ditampilkan.
- Return/exchange belum punya SLA, bukti foto, dan stok penerimaan barang kembali.
- Region cache sudah bisa di-refresh, tetapi belum ada indikator umur cache per endpoint di UI.
- Admin roadmap sekarang statis dari file frontend; jika ingin jadi sumber kebenaran tim, pindahkan ke D1 agar bisa diedit dari admin.

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

### 1. D1 remote schema sudah verified setelah patch

Kondisi saat ini:

- Export schema remote terbaru sudah berhasil dibuat di `.context/d1-remote-schema.sql`.
- Nama database D1 remote yang benar dari `wrangler d1 list --json` adalah `meyya-id`, bukan `meyya_id` atau `meyya_db`.
- Remote sudah punya tabel baru besar seperti `user_events`, `product_variants`, dan `region_cache`.
- Gap remote yang sebelumnya terdeteksi:
  `users.birth_date`,
  `wishlists.created_at`,
  `payment_settings.transfer_admin_fee`,
  `payment_settings.qris_admin_fee`.
- Patch production sudah dibuat, berhasil dijalankan ke remote D1 `meyya-id`, lalu terverifikasi lewat export ulang.

Saran:

- Tidak ada migration D1 tambahan yang perlu dijalankan untuk batch ini.
- Simpan file migration sebagai histori perubahan schema, tetapi jangan jalankan ulang tanpa cek schema dulu.

Catatan:

- Token yang diperlukan untuk perintah `wrangler d1 export/execute` adalah `CLOUDFLARE_API_TOKEN` dari Cloudflare API Tokens. Gunakan user API token custom dengan permission minimal `Account: D1: Edit` pada account yang berisi database `meyya-id`. Untuk `wrangler whoami`/account discovery, permission `User: Memberships: Read` membantu menghindari error `/memberships`; `User: User Details: Read` hanya untuk menampilkan email dan tidak wajib untuk D1.
- Jangan apply full `schema.sql` ke production karena file itu masih berisi seed demo.
- `ALTER TABLE ... ADD COLUMN` di D1/SQLite tidak menerima default non-konstan seperti `CURRENT_TIMESTAMP`; karena itu `wishlists.created_at` ditambah nullable dan insert aplikasi mengisi timestamp secara eksplisit.
- File migration ini one-time dan sudah applied. Jangan jalankan ulang kecuali schema remote sudah dicek dan memang perlu.
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
- Return/exchange sudah ada; `returnRate` sekarang dihitung dari `return_requests` per pelanggan dan tampil di CRM.
- Voucher personal/segment sudah didukung di voucher form/API.
- Event tracking dasar untuk cart, view product, checkout started, order created, dan campaign touch sudah tersedia di `user_events`.

Saran:

- Tambahkan event analytics lebih detail jika ingin cohort dashboard, misalnya source campaign, device, dan nilai cart terakhir.

### 4. Marketing panel sudah tidak memakai scenario palsu, tetapi datanya masih terbatas

Kondisi saat ini:

- Target berbasis data nyata: pending payment, VIP retention, customer baru.
- Birthday sudah aktif jika pelanggan mengisi tanggal lahir di profil.
- Abandoned cart sudah aktif dari event `CART_UPDATED` yang belum diikuti order setelah minimal 4 jam.

Saran:

- Tambah voucher birthday otomatis per user/segment jika aturan nominal diskonnya sudah ditentukan.
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

- `schema.sql` masih bercampur schema dan seed demo; patch production kecil sudah dibuat, tetapi pemisahan permanen schema/seed masih sebaiknya dilakukan.
- `shipping_settings.active_couriers` seed lama masih memakai variasi nama kurir campuran (`JNE`, `JT`, `paxel`); normalisasi kode kurir perlu disamakan dengan response api.co.id.
- Event analytics masih sederhana; metadata cart terakhir belum dipecah menjadi tabel agregat khusus.

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

1. Pisahkan `schema.sql` menjadi schema-only dan seed demo agar migration production berikutnya lebih aman.
2. Normalisasi stok global agar otomatis dihitung dari total `product_variants`, bukan diinput manual.
3. Tambah voucher birthday otomatis setelah aturan promo ditentukan.
4. Hubungkan template pesan ke provider WhatsApp/email setelah provider dipilih.
5. Tambah tracking resi live dari API kurir.
6. Tambah drag-and-drop reorder untuk galeri produk.
