# MEYYA.ID Default Coupon and Reward System Strategy

Tanggal: 2026-05-06.

Dokumen ini adalah brainstorm untuk sistem kupon/voucher default Meyya.id: daftar campaign yang sebaiknya selalu tersedia, cara admin mengatur ketentuannya, guard anti-abuse, dan rencana wheel of fortune untuk hadiah review. Ini belum menjadi implementasi kode.

Update implementasi awal 2026-05-06:

- Layer `coupon_campaigns`, `coupon_entitlements`, `wheel_prizes`, `review_spin_entitlements`, dan `wheel_spins` sudah ditambahkan di runtime schema dan migration.
- Semua apply kupon/voucher sekarang wajib nomor WhatsApp terverifikasi.
- Default campaign utama yang sudah diseed: `MEYYAWELCOME`, `BDAYGIFT`, `MEYYABDAY`, `REVIEWSPIN`.
- Review valid dari order selesai membuat kesempatan spin; spin diproses server-side dan menerbitkan voucher entitlement jika menang.
- Checkout menampilkan `Kupon Saya`, sementara input kode manual tetap divalidasi ulang di backend.
- Guard fingerprint/device lintas akun belum diimplementasikan; fase ini baru memakai login, order history, entitlement, dan WhatsApp verified.

Update implementasi lanjutan 2026-05-06:

- Guard `MEYYAWELCOME` sekarang memakai browser/device fingerprint hash dari frontend, phone hash, address hash, IP prefix hash, risk score, dan block threshold.
- Hasil allow/block welcome claim dicatat di `coupon_claim_risk_logs`; sinyal claim yang berhasil dicatat di `coupon_claim_signals`.
- Admin voucher sekarang punya editor default campaign untuk aktif/nonaktif, nilai diskon, minimum belanja, max discount, expiry, limit per user, risk threshold, dan tanggal/window ulang tahun Meyya.
- Admin voucher juga punya editor `wheel_prizes` untuk label, voucher code, tipe/nilai hadiah, expiry, formula transaksi terakhir, dan bobot first/repeat spin.

Update implementasi free product 2026-05-06:

- Prize `FREE_PRODUCT_10_LAST_ORDER` bisa memakai product pool dari admin.
- Saat spin, server memilih produk aktif, non-preorder, stok tersedia, dan harga maksimal 10% transaksi terakhir.
- Jika product pool kosong atau stok/harga tidak eligible, server fallback ke hadiah ongkir kecil.
- Entitlement hadiah menyimpan `gift_product` dan `applicable_product_ids`, sehingga voucher hanya memberi diskon untuk produk hadiah tersebut.
- Checkout `Kupon Saya` bisa menambahkan produk hadiah ke cart sebelum apply voucher.
- Admin voucher menampilkan blocked welcome risk log dari `coupon_claim_risk_logs`.

Update implementasi override admin 2026-05-06:

- Viewer risk log sekarang menampilkan entitlement welcome aktif jika ada.
- Admin bisa issue manual `MEYYAWELCOME` entitlement untuk kasus false positive atau customer service exception.
- Admin bisa revoke entitlement yang masih available langsung dari risk log.
- Semua override/revoke masuk audit log dan menyimpan alasan di metadata entitlement.

## Kesimpulan Awal

Secara produk, istilah yang paling rapi:

- `Coupon campaign`: aturan promo default yang selalu ada sebagai template/skenario, misalnya `BDAYGIFT`, `MEYYAWELCOME`, `MEYYABDAY`, dan `REVIEWSPIN`.
- `Voucher entitlement`: hak promo yang diberikan ke user tertentu karena memenuhi skenario, misalnya user A mendapat 1 kesempatan pakai `BDAYGIFT` tahun 2026.
- `Voucher code`: kode yang dimasukkan atau dipilih di checkout, misalnya `BDAYGIFT` atau kode unik hasil spin.

Supaya tidak overhaul, tabel dan UI `vouchers` yang sudah ada tetap dipakai sebagai redemption layer. Yang ditambahkan adalah layer campaign default dan entitlement/claim di atasnya.

Dengan cara ini:

- Admin tetap melihat dan mengatur promo di tab Voucher/Kupon.
- Checkout tetap memakai `voucher_code`.
- Validasi order tetap memakai helper voucher yang sudah ada.
- Fitur baru seperti welcome, birthday Meyya, review spin, dan anti-abuse bisa masuk bertahap.

## Status Sistem Sekarang

Sudah ada:

- Tabel `vouchers`.
- Tabel `voucher_usages`.
- `target_user_role`, `target_clerk_id`, `target_segment`.
- `birthday_claim_window_days`.
- Guard birthday 1x per tahun lewat unique index `voucher_usages(clerk_id, claim_year)` untuk `usage_type = 'BIRTHDAY'`.
- Applicable product IDs.
- Validasi voucher di `/api/vouchers/validate`.
- Validasi ulang saat create order di `/api/orders`.
- Profil menampilkan voucher aktif.
- Admin bisa CRUD voucher.

Belum ada:

- Konsep default coupon campaign yang selalu ada.
- Entitlement per user: user punya hak kupon tertentu walaupun kode campaign global sama.
- Guard lintas akun berbasis device/browser/phone/address untuk welcome abuse.
- Wheel of fortune.
- Review reward yang mengeluarkan kesempatan spin.
- Kupon free product.
- Kupon shipping yang punya cap dan minimum purchase lebih fleksibel.
- Admin setting ulang tahun Meyya.
- Seed default voucher/coupon yang bisa aktif/nonaktif.
- Claim list di checkout yang hanya menampilkan kupon milik user.

## Prinsip Desain

1. Jangan mengganti sistem `vouchers` sekarang. Tambahkan layer campaign/entitlement.
2. Semua hadiah harus ditentukan server-side. Frontend wheel hanya animasi.
3. Semua claim dan spin harus idempotent. Refresh/retry tidak boleh memberi hadiah dua kali.
4. Promo default boleh punya kode publik, tetapi hanya valid jika user punya entitlement.
5. Browser fingerprint dipakai sebagai risk signal, bukan satu-satunya sumber kebenaran.
6. Semua voucher hadiah harus punya expiry, minimum purchase, usage limit, dan non-stackable default.
7. Voucher tidak boleh dihitung sebagai diskon sebelum divalidasi ulang di order API.

## Default Coupon Campaign Yang Disarankan

### 1. `MEYYAWELCOME`

Tujuan:

- Mendorong user baru checkout pertama.

Trigger:

- User baru daftar atau mulai checkout pertama.

Benefit awal yang masuk akal:

- Diskon 5-10%.
- Max discount kecil, misalnya Rp20.000-Rp35.000.
- Minimum purchase, misalnya Rp150.000-Rp250.000.
- Expire 7-14 hari.

Guard:

- Hanya akun yang belum pernah punya order non-cancelled.
- Wajib login.
- Idealnya wajib WhatsApp verified sebelum bisa dipakai.
- Satu kali per `clerk_id`.
- Satu kali per normalized phone.
- Satu kali per browser/device fingerprint dalam window tertentu, misalnya 90 hari.
- Satu kali per shipping address hash dalam window tertentu jika data tersedia.
- Jika risk tinggi, jangan tampilkan otomatis; minta admin review atau hanya beri diskon kecil.

Catatan fingerprint:

- Browser fingerprint bisa berubah dan bisa salah menandai keluarga/perangkat bersama.
- Fingerprint sebaiknya tidak memblokir sendirian. Gunakan risk score gabungan: device hash, IP hash kasar, user agent, timezone, phone, alamat, dan payment/order pattern.

### 2. `BDAYGIFT`

Tujuan:

- Hadiah ulang tahun customer.

Trigger:

- Tanggal lahir user berada dalam window klaim.

Benefit awal:

- Diskon 10-15%.
- Max discount Rp30.000-Rp75.000.
- Minimum purchase disesuaikan AOV.
- Expire sesuai birthday window, misalnya 7 hari setelah ulang tahun.

Guard:

- Birth date hanya bisa disimpan sekali. Ini sudah ada di profil.
- Satu kali per user per tahun. Fondasi guard sudah ada.
- Wajib login.
- Disarankan wajib WhatsApp verified.
- Jangan izinkan klaim jika birth date baru diisi setelah tanggal ulang tahun dan akun terlalu baru, kecuali admin mengizinkan.
- Untuk akun baru yang langsung birthday, boleh diberi benefit kecil atau pending risk check.

### 3. `MEYYABDAY`

Tujuan:

- Campaign saat ulang tahun Meyya.

Trigger:

- Periode ulang tahun Meyya yang diset admin, misalnya tanggal lahir brand/toko.

Admin setting:

- Tanggal ulang tahun Meyya.
- Window campaign, misalnya H-3 sampai H+7.
- Diskon.
- Max discount.
- Minimum purchase.
- Global quota.
- Per-user quota.
- Applicable products/categories.

Benefit awal:

- Diskon 8-12% dengan max cap.
- Bisa dibuat lebih terasa dengan copy campaign, bukan diskon besar.

Guard:

- Satu kali per user per campaign year.
- Global usage limit.
- Tidak stack dengan voucher lain.
- Bisa exclude produk margin rendah.
- Bisa exclude user yang sudah memakai welcome/birthday dalam X hari jika ingin menjaga margin.

### 4. `REVIEWSPIN`

Tujuan:

- Reward guaranteed untuk reviewer tanpa memberi voucher langsung.
- Membuat proses review terasa menyenangkan dan perceived value tinggi.

Trigger:

- Customer mengirim review valid untuk order item yang eligible.

Benefit:

- Customer mendapat 1 kesempatan spin wheel.
- First ever review spin user harus menang minimal hadiah kecil.
- Spin berikutnya boleh punya zonk/coba lagi.

Guard:

- Satu spin per review valid atau per order item.
- Review harus dari order completed.
- Review duplicate tidak eligible.
- Review yang di-hide karena spam/PII/abuse bisa membatalkan entitlement spin.
- Hadiah ditentukan server-side sebelum animasi wheel.
- Simpan `spin_id`, `review_id`, `order_id`, `clerk_id`, `prize_code`, `result`, dan timestamp.
- Retry endpoint dengan `spin_id` yang sama harus mengembalikan hadiah yang sama.

### 5. `FREESHIP_SMALL`

Tujuan:

- Hadiah kecil yang terasa berguna dan murah.

Benefit:

- Diskon ongkir up to Rp5.000.
- Tanpa minimum belanja.
- Expire pendek, misalnya 7 hari.

Guard:

- Satu kali pakai.
- Tidak stack.
- Hanya berlaku jika order punya ongkir.

### 6. `FREESHIP_MIN`

Tujuan:

- Hadiah ongkir yang mendorong cart lebih besar.

Benefit:

- Diskon ongkir Rp10.000.
- Minimum purchase, misalnya Rp250.000-Rp350.000.
- Expire 14 hari.

Guard:

- Satu kali pakai.
- Tidak stack.
- Tidak berlaku untuk order dengan free shipping lain.

### 7. `REPEATGIFT`

Tujuan:

- Mendorong repeat order setelah pembelian pertama atau kedua.

Trigger:

- Order completed.

Benefit:

- Diskon 5-8% untuk next order.
- Minimum purchase mengikuti AOV atau transaksi terakhir.
- Expire 14-30 hari.

Guard:

- Satu entitlement per completed order.
- Jangan beri jika order dibatalkan/refund.
- Bisa pause jika customer punya return abuse.

### 8. `WINBACK`

Tujuan:

- Mengaktifkan customer lama yang sudah tidak belanja.

Trigger:

- Tidak ada order dalam 60/90/120 hari.

Benefit:

- Diskon fixed kecil atau free shipping.
- Copy dibuat personal, bukan diskon besar.

Guard:

- Satu kali per window.
- Tidak untuk customer yang punya open dispute/return.
- Global quota opsional.

### 9. `VIPTHANKS`

Tujuan:

- Reward customer high LTV tanpa diskon besar publik.

Trigger:

- LTV atau order count melewati threshold.

Benefit:

- Free shipping, early access, voucher personal, atau spin khusus.

Guard:

- Targeted entitlement.
- Tidak bisa ditebak lewat kode umum.

### 10. `CLEARANCE_PICK`

Tujuan:

- Menggerakkan stok lama tanpa menurunkan harga semua produk.

Trigger:

- Produk/category tertentu yang dipilih admin.

Benefit:

- Diskon produk tertentu.

Guard:

- Applicable products/category.
- Exclude produk baru/margin rendah.
- Stok dan margin dicek sebelum promo aktif.

## Wheel of Fortune Untuk Review

### Ide Dasar

Setiap review valid memberi satu kesempatan spin. Hadiah tidak langsung voucher pasti, tetapi spin pertama user dibuat selalu menang minimal hadiah kecil. Wheel tetap bisa menampilkan slice `Coba Lagi` agar sistem terasa seperti game, tetapi first spin server memilih prize non-zonk.

Prinsip penting:

- Server menentukan hadiah.
- Wheel di frontend hanya membaca hasil dan memainkan animasi.
- Jika browser refresh saat spin, hadiah tidak berubah.
- Peluang menang bisa diatur admin.
- Admin bisa aktif/nonaktifkan prize tertentu.

### Prize Pool Awal

1. `REVIEW_MAX20_LAST_ORDER`

Hadiah:

- Voucher diskon sampai 20% dari transaksi terakhir.
- Max discount = 20% dari transaksi terakhir user.
- Minimum purchase = nilai transaksi terakhir user.

Contoh:

- Transaksi terakhir Rp1.000.000.
- Max discount = Rp200.000.
- Minimum purchase voucher berikutnya = Rp1.000.000.

Catatan:

- Ini perceived value tinggi, tetapi menjaga margin karena customer harus belanja minimal sebesar transaksi terakhir.
- Sebaiknya exclude produk margin rendah.
- Expire 14-30 hari.

2. `SHIP5_NO_MIN`

Hadiah:

- Diskon ongkir up to Rp5.000.
- Tanpa minimum belanja.

Catatan:

- Cocok sebagai guaranteed minimum hadiah first spin.
- Biaya kecil dan mudah dipahami.

3. `SHIP10_MIN`

Hadiah:

- Diskon ongkir up to Rp10.000.
- Minimum purchase, misalnya Rp250.000.

4. `FREE_PRODUCT_10_LAST_ORDER`

Hadiah:

- Free produk bernilai sampai 10% transaksi terakhir.
- Sistem otomatis memilih produk eligible.

Cara pilih produk:

- Admin menentukan product pool hadiah.
- Sistem pilih produk dengan harga jual <= 10% transaksi terakhir.
- Prioritaskan stok lama, margin aman, dan stok cukup.
- Jika tidak ada produk eligible, fallback ke voucher ongkir.

Guard:

- Minimum purchase bisa diset sama dengan transaksi terakhir atau threshold admin.
- Free product hanya ditambahkan jika stok masih ada saat checkout.
- Jika stok habis, voucher harus fallback atau invalid dengan pesan jelas.

5. `SMALL_FIXED`

Hadiah:

- Diskon fixed kecil, misalnya Rp10.000.
- Minimum purchase Rp200.000.

6. `TRY_AGAIN`

Hadiah:

- Tidak mendapat voucher.

Catatan:

- Untuk first ever spin user, slice ini tetap boleh tampil di wheel, tetapi server tidak memilih `TRY_AGAIN`.
- Untuk spin berikutnya, `TRY_AGAIN` boleh dipilih sesuai probability.

### Probability Awal

Untuk first ever spin:

- `SHIP5_NO_MIN`: 45%
- `SMALL_FIXED`: 25%
- `SHIP10_MIN`: 20%
- `FREE_PRODUCT_10_LAST_ORDER`: 8%
- `REVIEW_MAX20_LAST_ORDER`: 2%
- `TRY_AGAIN`: 0%

Untuk spin berikutnya:

- `TRY_AGAIN`: 35%
- `SHIP5_NO_MIN`: 30%
- `SMALL_FIXED`: 18%
- `SHIP10_MIN`: 12%
- `FREE_PRODUCT_10_LAST_ORDER`: 4%
- `REVIEW_MAX20_LAST_ORDER`: 1%

Angka ini sebaiknya admin-configurable.

### Guard Review Spin

- Review harus valid dan terkait order selesai.
- Satu review hanya satu spin.
- Satu order item hanya satu reward review.
- Customer tidak boleh mendapat spin dari review yang dibuat berulang-ulang untuk produk/order sama.
- Jika review dihapus karena abuse sebelum spin, spin entitlement dibatalkan.
- Jika review sudah spin lalu kemudian di-hide karena PII ringan, voucher tidak harus otomatis dicabut kecuali abuse.
- Hadiah besar hanya untuk akun dengan WA verified dan order history valid.
- Akun risk tinggi tetap boleh mendapat hadiah kecil, tetapi tidak hadiah besar.

## Admin Experience

Tab existing `Voucher` sebaiknya berkembang menjadi `Kupon & Voucher`.

Subtab yang disarankan:

- `Default Campaigns`: daftar skenario default.
- `Voucher Codes`: CRUD voucher manual yang sudah ada.
- `Entitlements`: voucher/kesempatan spin milik user.
- `Wheel Prizes`: konfigurasi hadiah wheel.
- `Abuse Guard`: setting risk threshold dan fingerprint guard.

Untuk setiap default campaign, admin bisa:

- Aktif/nonaktifkan.
- Set nama dan copy.
- Set discount type/value.
- Set max discount.
- Set minimum purchase.
- Set expiry.
- Set usage per user.
- Set global quota.
- Set applicable product/category.
- Set required WA verified.
- Set risk threshold.

Default campaign seed awal:

- `MEYYAWELCOME`
- `BDAYGIFT`
- `MEYYABDAY`
- `REVIEWSPIN`
- `FREESHIP_SMALL`
- `FREESHIP_MIN`
- `REPEATGIFT`
- `WINBACK`
- `VIPTHANKS`
- `CLEARANCE_PICK`

## Checkout Experience

Checkout sebaiknya punya dua cara memakai promo:

1. Customer memilih voucher/kupon yang memang dia punya.
2. Customer memasukkan kode manual.

Aturan:

- Jika customer tidak punya entitlement untuk kode tertentu, kode ditolak walaupun kode campaign valid.
- Jika guest belum login, tampilkan pesan login diperlukan untuk kupon personal.
- Jika voucher perlu WA verified, arahkan customer ke verifikasi WA.
- Jika voucher tidak memenuhi minimum purchase, tampilkan jumlah kekurangan belanja.
- Jika voucher berlaku untuk produk tertentu, tampilkan produk yang eligible.

Untuk menghindari overhaul:

- Input kode voucher di checkout tetap dipakai.
- Tambah area `Kupon Saya` yang fetch dari endpoint user vouchers/entitlements.
- Saat user klik voucher, field voucher code terisi dan validasi existing tetap berjalan.
- Order API tetap melakukan validasi ulang.

## Data Model Yang Disarankan

Tambahan ringan di atas schema sekarang:

### `coupon_campaigns`

Menyimpan default campaign dan setting admin.

Field contoh:

- `key` seperti `MEYYAWELCOME`, `BDAYGIFT`, `REVIEWSPIN`.
- `enabled`.
- `title`.
- `description`.
- `trigger_type`.
- `discount_type`.
- `discount_value`.
- `max_discount`.
- `min_purchase`.
- `expires_in_days`.
- `usage_limit_global`.
- `usage_limit_per_user`.
- `requires_login`.
- `requires_verified_wa`.
- `risk_threshold`.
- `applicable_product_ids`.
- `applicable_category_ids`.
- `metadata_json`.

### `coupon_entitlements`

Menyimpan hak user atas campaign tertentu.

Field contoh:

- `id`.
- `campaign_key`.
- `voucher_code`.
- `clerk_id`.
- `phone_hash`.
- `address_hash`.
- `device_fingerprint_hash`.
- `status`: `AVAILABLE`, `USED`, `EXPIRED`, `REVOKED`.
- `source_type`: `WELCOME`, `BIRTHDAY`, `REVIEW`, `SPIN`, `ADMIN`.
- `source_id`: review id/order id/spin id.
- `valid_from`.
- `valid_until`.
- `used_order_id`.
- `created_at`.
- `used_at`.

### `device_claims`

Menyimpan sinyal anti-abuse berbasis device/browser.

Field contoh:

- `fingerprint_hash`.
- `clerk_id`.
- `phone_hash`.
- `ip_prefix_hash`.
- `user_agent_hash`.
- `first_seen_at`.
- `last_seen_at`.
- `claim_type`.
- `claim_count`.

Catatan:

- Jangan simpan raw fingerprint/IP/UA kalau tidak perlu. Simpan hash.
- Retention harus dibatasi, misalnya 90-180 hari untuk anti-abuse welcome.

### `review_spin_entitlements`

Menyimpan hak spin dari review.

Field contoh:

- `id`.
- `review_id`.
- `order_id`.
- `order_item_id`.
- `clerk_id`.
- `status`: `AVAILABLE`, `SPUN`, `EXPIRED`, `REVOKED`.
- `created_at`.
- `spun_at`.

### `wheel_spins`

Menyimpan hasil spin.

Field contoh:

- `id`.
- `spin_entitlement_id`.
- `clerk_id`.
- `review_id`.
- `prize_key`.
- `voucher_entitlement_id`.
- `is_first_spin`.
- `random_seed_hash`.
- `created_at`.

### `wheel_prizes`

Menyimpan konfigurasi hadiah.

Field contoh:

- `key`.
- `enabled`.
- `label`.
- `weight_first_spin`.
- `weight_repeat_spin`.
- `discount_type`.
- `discount_value`.
- `max_discount_formula`.
- `min_purchase_formula`.
- `expires_in_days`.
- `metadata_json`.

## Anti-Abuse Strategy

### Risk Signals

Sinyal yang bisa dipakai:

- `clerk_id`.
- Email hash.
- Normalized phone hash.
- WhatsApp verified status.
- Browser/device fingerprint hash.
- IP prefix hash, bukan raw IP.
- User agent hash.
- Timezone/language.
- Shipping recipient phone hash.
- Shipping address normalized hash.
- Payment proof/order pattern.
- Order count dan status history.
- Return/refund/dispute pattern.

### Risk Score

Contoh scoring:

- Akun baru kurang dari 24 jam: +10.
- Belum WA verified: +20.
- Device pernah klaim welcome dalam 90 hari: +40.
- Phone pernah dipakai akun lain: +50.
- Address hash pernah klaim welcome lebih dari 1x dalam 90 hari: +30.
- IP prefix terlalu sering klaim dalam 24 jam: +20.
- Order completed valid sebelumnya: -20.
- WA verified: -20.

Action:

- Risk rendah: voucher normal.
- Risk sedang: voucher kecil saja atau butuh WA verified.
- Risk tinggi: blokir welcome reward, tetapi tetap boleh belanja normal.

### Guard Per Campaign

`MEYYAWELCOME`:

- Guard paling ketat karena paling rentan abuse.
- Wajib login dan sebaiknya wajib WA verified.
- Cek no prior non-cancelled order.
- Cek clerk/phone/device/address.

`BDAYGIFT`:

- Birth date immutable.
- Satu kali per tahun.
- Wajib login.
- WA verified untuk benefit besar.

`MEYYABDAY`:

- One per user per campaign year.
- Global quota.
- Risk guard sedang.

`REVIEWSPIN`:

- Eligible hanya dari review valid order completed.
- Satu review/order item satu spin.
- First spin guaranteed win, tapi hadiah besar butuh risk rendah.

## Cara Masuk Tanpa Overhaul

### Phase 1: Rapikan istilah dan entitlement ringan

- Rename UI tab/label menjadi `Kupon & Voucher`, tetapi endpoint/tabel `vouchers` tetap dipakai.
- Tambah dokumen konsep di admin agar admin paham bedanya campaign dan voucher.
- Tambah entitlement table minimal untuk user-specific claim.
- Checkout menampilkan `Kupon Saya` dari entitlement.

### Phase 2: Default campaigns

- Seed campaign default: `MEYYAWELCOME`, `BDAYGIFT`, `MEYYABDAY`.
- Admin bisa aktif/nonaktifkan dan atur nilai.
- Validation existing diperluas agar kode default hanya valid kalau user punya entitlement atau memenuhi trigger.

### Phase 3: Review spin

- Review valid membuat `review_spin_entitlements`.
- Tambah wheel page/modal.
- Server memilih prize dan membuat voucher entitlement.
- Frontend hanya animasi berdasarkan prize server.

### Phase 4: Anti-abuse guard

- Tambah device/browser fingerprint hash.
- Tambah risk score.
- Terapkan dulu ke welcome dan hadiah besar wheel.
- Simpan audit log untuk blocked/limited claim.

### Phase 5: Advanced reward

- Tambah free product voucher.
- Tambah automatic product selection dari product pool.
- Tambah admin analytics: claim rate, redemption rate, cost, abuse blocks, margin impact.

## Edge Case Yang Harus Dijaga

- User klaim voucher lalu logout dan checkout sebagai guest: voucher personal harus invalid.
- User ganti email/phone: entitlement tetap terikat Clerk ID dan phone hash saat claim.
- User punya dua voucher: MVP sebaiknya hanya satu voucher per order.
- Voucher dipakai lalu order gagal dibuat: usage harus rollback. Flow order sekarang sudah melakukan rollback untuk voucher usage pada error, ini perlu dipertahankan.
- Voucher dipakai di order yang kemudian cancelled: tentukan policy, apakah entitlement dikembalikan atau hangus.
- Free product stock habis saat checkout: fallback atau invalid dengan pesan jelas.
- Wheel spin gagal karena refresh: hasil harus bisa dilanjutkan dari `wheel_spins`.
- Admin mematikan campaign: entitlement yang sudah issued harus punya policy, tetap valid sampai expiry atau ikut revoked.
- Birthday user 29 Februari: helper birthday sekarang sudah memperlakukan leap day ke 28 Februari saat non-leap year; behavior ini perlu dipertahankan.
