# MEYYA.ID Improvement Notes

Audit terakhir: 2026-05-05.

Dokumen ini hanya berisi temuan yang masih relevan setelah rangkaian fix auth, checkout, payment, CRM, dan debug produksi terakhir. Item yang sudah fixed tidak lagi dimasukkan sebagai prioritas aktif.

## Next Actions Paling Atas

Yang paling masuk akal dikerjakan berikutnya:

1. Buat Cloudflare Worker maintenance untuk auto pruning bulanan data operasional yang lebih lama dari 3 tahun, dengan dry-run, R2 archive, dan audit log.
2. Rancang integrasi Duitku sandbox: migration payment gateway fields, create transaction, callback signature, check transaction, dan idempotency.
3. Inventory server Oracle GOWA yang sudah pernah disetup: base URL, versi, auth, device id, session login, test endpoint `/devices`, `/send/message`, dan format payload webhook message asli.
4. Set env production `MEYYA_SUPPORT_WHATSAPP` dan `GOWA_WEBHOOK_SECRET`, lalu arahkan GOWA webhook ke `/api/webhooks/gowa?secret=...`.
5. Rancang sinkron Google Contacts untuk nomor WA terverifikasi jika nanti kontak harus tersimpan juga di phonebook bersama, bukan hanya D1.
6. Tambah messaging outbox untuk WhatsApp/email agar integrasi GOWA dan Sendy bisa dry-run, retry, dan diaudit sebelum auto-send.

Catatan fungsi messaging outbox:

- Template pesan sekarang sudah rapi dan tervalidasi, tetapi masih dipakai manual untuk disalin/dibuka ke WhatsApp Web.
- Menghubungkan ke provider resmi WhatsApp/email akan membuat pesan operasional bisa dikirim otomatis atau semi-otomatis, misalnya reminder pembayaran, order shipped, completed, birthday, dan abandoned cart.
- Manfaat utamanya: delivery tercatat, status terkirim/gagal bisa diaudit, pengiriman bisa dijadwalkan, dan admin tidak perlu copy-paste pesan satu per satu.

## Batch Entitlement Override dan Analytics Maintenance 2026-05-06

Checklist:

- [x] Admin bisa issue manual entitlement dari risk log false positive atau customer service exception.
- [x] Admin bisa revoke entitlement welcome aktif langsung dari viewer risk log.
- [x] Action override/revoke memakai endpoint admin terpisah dan masuk audit log.
- [x] Endpoint `/api/admin/analytics-backfill` ditambahkan untuk backfill aggregate chart per window tanggal dari raw `user_events`.
- [x] Tab Free Tier punya kontrol backfill analytics dengan mode dry-run dan replace window agar chart tidak dobel.
- [x] Endpoint `/api/admin/analytics-archive` ditambahkan untuk export raw `user_events` lama ke R2 sebagai JSONL.
- [x] Archive raw event punya dry-run, batas maksimal 10.000 row per window, optional delete-after-archive, audit log, dan manifest `analytics_event_archives`.
- [x] Free Tier menampilkan tabel `analytics_event_archives` agar histori archive bisa ikut dipantau di ukuran D1.

Catatan strategi:

- Backfill hanya menulis `analytics_daily_metrics` dan `analytics_daily_metric_users`; `user_event_summaries` sengaja tidak di-backfill agar count customer summary tidak berisiko dobel saat window dijalankan ulang.
- Workflow aman untuk raw event lama: jalankan backfill chart dulu, archive ke R2 dengan dry-run, archive real tanpa delete untuk verifikasi object, lalu jalankan archive dengan delete-after-archive untuk window kecil yang sudah aman.
- Pruning manual lama masih ada, tetapi untuk raw analytics event sebaiknya gunakan archive R2 lebih dulu supaya D1 tidak menyimpan histori mentah terlalu panjang.

## Batch Review Journey dan Review Growth Brainstorm 2026-05-06

Dokumen detail: `docs/MEYYA_REVIEW_JOURNEY_STRATEGY.md`.

Status fitur saat ini:

- [x] Tabel `product_reviews` sudah ada.
- [x] `POST /api/reviews` sudah auth-gated dan mengecek user punya order selesai berisi produk tersebut.
- [x] Product detail sudah menampilkan review published dan form rating/textarea.
- [x] Template pesan `order_completed` sudah mengajak customer memberi review.
- [x] Draft review product detail tersimpan lokal agar tidak hilang saat refresh.
- [x] Review punya tab admin `/admin` Reviews untuk list, filter status, publish/hide, featured, dan balasan public.
- [x] Admin bisa membalas review customer dan balasan tampil di product detail.
- [x] App-level guard duplicate review per order/product/customer ditambahkan di `POST /api/reviews`.
- [x] CTA `Tulis Review` ditambahkan di order selesai dan profile order history.
- [x] Review valid membuat kesempatan spin hadiah review.
- [x] Rating average/count product detail dihitung dari aggregate semua review published, bukan hanya 20 review yang di-fetch.
- [ ] Belum ada strategi offload review lama ke R2/static JSON.
- [ ] Belum ada metadata review size/fit/foto/consent marketing.
- [ ] Belum ada review summary table materialized; aggregate saat ini masih query langsung ke `product_reviews`.

Rencana pengadaan:

- [x] Tambah tab `/admin` Reviews/Ulasan untuk list, filter, publish/hide, admin reply, featured review, dan konteks order/customer.
- [x] Tambah endpoint admin review list/update dengan audit log untuk action moderation.
- [x] Tambah public admin reply field agar customer bisa melihat balasan Meyya di product page.
- [x] Tambah app-level guard untuk mencegah duplicate review pada kombinasi order, product, dan customer.
- [x] Tambah CTA `Tulis Review` di `/order/:id` saat order selesai dan di `/profil` riwayat order per item.
- [ ] Tambah metadata review ringan untuk fashion: size dibeli, fit kecil/pas/besar, quality rating, dan consent marketing.
- [ ] Tambah badge `Verified Buyer` dan histogram rating di product detail.
- [x] Tambah incentive workflow awal: review teks valid mendapat entitlement spin wheel.
- [ ] Tambah panel admin untuk review incentive: eligible, rewarded, voucher code, raffle period, dan export pemenang.
- [ ] Tambah `product_review_summaries` agar rating/count/histogram tidak menghitung raw review setiap product request.
- [ ] Tambah R2/static JSON archive untuk review published lama, sementara D1 menyimpan review terbaru, featured, pending, dan aggregate.

Catatan strategi:

- Undian voucher bulanan adalah opsi paling murah dengan perceived value tinggi karena biaya fix dan tidak semua reviewer mendapat reward.
- Micro-voucher cocok jika ingin review lebih konsisten, tetapi harus pakai minimum spend, expiry pendek, dan non-stackable agar biaya terkendali.
- Review negatif jangan otomatis disembunyikan. Balasan admin yang rapi bisa meningkatkan trust lebih baik daripada hanya menampilkan review positif.
- Archive review lama harus melalui dry-run dan audit log; jangan hapus raw D1 sebelum export, summary, dan public rendering terverifikasi.

## Batch Default Coupon, Voucher Entitlement, dan Review Spin Brainstorm 2026-05-06

Dokumen detail: `docs/MEYYA_DEFAULT_COUPON_SYSTEM_STRATEGY.md`.

Status fitur saat ini:

- [x] Tabel `vouchers` dan `voucher_usages` sudah ada.
- [x] Voucher bisa divalidasi di checkout dan divalidasi ulang saat order dibuat.
- [x] Voucher birthday sudah punya window klaim dan guard 1x per tahun.
- [x] Admin sudah punya CRUD voucher dasar.
- [x] Profil customer sudah bisa menampilkan voucher aktif.
- [x] Default coupon campaign seed ditambahkan untuk `MEYYAWELCOME`, `BDAYGIFT`, `MEYYABDAY`, dan `REVIEWSPIN`.
- [x] Entitlement per user ditambahkan agar kode default/review reward hanya valid untuk user yang punya hak klaim.
- [x] Guard welcome coupon lintas akun ditambahkan dengan browser/device fingerprint hash, phone hash, address hash, IP prefix hash, risk score, dan risk log.
- [x] Review spin wheel server-side ditambahkan; first spin non-zonk lewat seed probability.
- [x] Prize pool awal ditambahkan di `wheel_prizes`.
- [x] Free product reward sudah bisa memakai product pool admin, auto-pick produk hadiah saat spin, entitlement personal per produk, dan fallback ke hadiah ongkir jika stok/pool tidak eligible.
- [x] Checkout punya bagian `Kupon Saya` yang menampilkan kupon milik user.
- [x] Semua apply kupon/voucher mewajibkan WhatsApp verified di server-side validation.

Rencana pengadaan:

- [x] Pertahankan tabel/endpoint `vouchers` sebagai redemption layer agar tidak overhaul checkout/order.
- [x] Tambah layer `coupon_campaigns` untuk default campaign utama.
- [x] Tambah `coupon_entitlements` agar voucher default hanya bisa dipakai oleh user yang punya hak klaim.
- [x] Admin voucher menampilkan panel default campaign dan bisa aktif/nonaktifkan campaign.
- [x] Tambah setting admin tanggal ulang tahun Meyya untuk campaign `MEYYABDAY`.
- [x] Tambah guard welcome: login, no prior valid order, WA verified, plus risk score dari phone hash, device fingerprint hash, address hash, dan IP prefix hash.
- [x] Tambah review spin entitlement setelah review valid dari order completed.
- [x] Buat wheel server-side: first ever spin user guaranteed non-zonk, spin berikutnya bisa zonk sesuai probability.
- [x] Tambah prize awal: ongkir Rp5rb tanpa minimum, ongkir Rp10rb dengan minimum, fixed small voucher, free product dari pool sampai 10% transaksi terakhir, dan max voucher 20% transaksi terakhir dengan minimum purchase sebesar transaksi terakhir.
- [x] Checkout menampilkan `Kupon Saya`, tetapi tetap memakai validasi voucher existing dan validasi ulang di order API.
- [x] Tambah audit log untuk spin result dan update campaign/review moderation.
- [x] Tambah risk log untuk allow/block welcome claim di `coupon_claim_risk_logs`.
- [x] Tambah admin viewer untuk blocked welcome claim dari `coupon_claim_risk_logs`.
- [x] Tambah action manual override/revoke entitlement dari risk log dan customer service.

Catatan strategi:

- Istilah produk yang paling rapi adalah `coupon campaign` untuk skenario default, `voucher entitlement` untuk hak user, dan `voucher code` untuk kode yang dipakai di checkout.
- Browser fingerprint jangan jadi satu-satunya blocker karena bisa berubah dan bisa salah untuk perangkat bersama; gunakan sebagai risk signal bersama phone, alamat, IP prefix, WA verified, dan order history.
- Hadiah wheel harus selalu ditentukan server-side. Frontend wheel hanya animasi agar refresh/retry tidak mengubah hadiah.
- First spin boleh dibuat guaranteed win, tetapi hadiah besar tetap perlu risk rendah dan sebaiknya wajib WA verified.

## Batch Admin WhatsApp Verification, Admin UX, dan Site Map 2026-05-06 02:18:00 +07:00

Checklist:

- [x] Admin CRM detail user sekarang punya panel Verifikasi WhatsApp untuk simpan nomor, verifikasi manual, dan hapus status verified.
- [x] `PATCH /api/admin/users` ditambahkan untuk update nomor WA user, manual verify, dan clear verification dengan audit log.
- [x] Nomor WhatsApp tujuan verifikasi Meyya bisa diubah dari tab WhatsApp Marketing CRM.
- [x] `GET/PUT /api/admin/verification-settings` dan helper `app_settings` ditambahkan agar setting nomor verifikasi tersimpan di D1 dengan fallback env `MEYYA_SUPPORT_WHATSAPP`.
- [x] `POST /api/user/phone-verification` sekarang membaca nomor support dari setting D1 sebelum membuat link WhatsApp.
- [x] Migration production `migrations/2026-05-06_app_settings_support_whatsapp.sql` dan `schema.sql` ditambahkan untuk tabel `app_settings`.
- [x] Pindah tab di `/admin` sekarang melakukan scroll-to-top pada window dan content container.
- [x] Tooltip tambahan dipasang di tab Free Tier dan istilah verifikasi WhatsApp/support number.
- [x] Dokumentasi peta situs lengkap dibuat di `docs/MEYYA_SITE_MAP.md`.
- [x] `AGENTS.md` menambahkan index dokumentasi repo agar sesi berikutnya cepat menemukan konteks.

Edge case / follow-up yang ditemukan:

- [x] Static page `/contact` tidak lagi hardcoded; nomor kontak resmi dibaca dari setting publik dan bisa diatur dari admin.
- [x] WhatsApp Marketing tetap boleh kirim ke nomor belum verified, tetapi setiap target diberi label `WA verified` atau `WA unverified` agar keputusan tetap di admin.
- [x] Update nomor WA D1 dari admin mencoba sync best-effort ke Clerk metadata (`unsafeMetadata`) agar dashboard Clerk tetap punya cermin data Meyya.
- [x] Setting `app_settings.support_whatsapp` disiapkan dengan migration D1 remote; patch remote perlu dijalankan saat deploy/maintenance.

## Batch Contact WA, API.CO.ID Free Tier, dan Clerk Sync 2026-05-06 03:05:00 +07:00

Checklist:

- [x] `/contact` sekarang memakai halaman React `Contact` yang mengambil nomor WhatsApp publik dari `/api/settings/public`.
- [x] Setting admin WhatsApp dipisah menjadi nomor verifikasi Meyya dan nomor kontak resmi, dengan checkbox untuk memakai nomor yang sama.
- [x] Endpoint `GET/PUT /api/admin/verification-settings` menyimpan `support_whatsapp`, `contact_whatsapp`, dan `contact_uses_support_whatsapp`.
- [x] `GET /api/settings/public` ditambahkan untuk expose nomor kontak/verifikasi yang aman dibaca publik.
- [x] Target WhatsApp Marketing menampilkan label `WA verified` atau `WA unverified`, tetapi tidak memblokir pengiriman ke nomor unverified.
- [x] Manual update/verifikasi nomor WA dari admin melakukan best-effort sync ke Clerk `unsafeMetadata`.
- [x] Update profil customer juga melakukan best-effort sync nama dan nomor WA ke Clerk agar data lintas platform lebih konsisten.
- [x] API.CO.ID free tier diriset: Regional API dan Expedition Shipping Cost sama-sama free 3.000 hits/bulan, 20 rps, 0 points/hit.
- [x] Miss ke API.CO.ID dicatat di `external_api_usage_monthly`; regional cache hit tidak dihitung sebagai external hit.
- [x] Quote ongkir API.CO.ID di-cache di `shipping_quote_cache` selama 6 jam per origin/destination/weight/kurir aktif.
- [x] Tab Free Tier menampilkan pemakaian API.CO.ID regional dan ongkir bulan berjalan beserta sisa kuota.
- [x] Migration `migrations/2026-05-06_app_settings_support_whatsapp.sql` diperluas untuk `app_settings`, `external_api_usage_monthly`, dan `shipping_quote_cache`.

Catatan sumber API.CO.ID:

- Product page API.CO.ID menyebut Regional API gratis 3.000 hits/bulan dan 0 points/hit.
- Product page API.CO.ID juga menyebut Expedition Shipping Cost API gratis 3.000 hits/bulan dan 0 points/hit.
- Reverse Geocoding page API.CO.ID menjelaskan pola Standard free 3.000 hits/bulan dan 20 req/sec; angka rps ini dipakai sebagai acuan guard panel untuk produk gratis API.CO.ID yang dipakai Meyya.

## Batch Guard Checkout Stok Keranjang 2026-05-06 01:32:00 +07:00

Checklist:

- [x] Validator stok keranjang server-side ditambahkan agar cart guest/local dan order checkout memakai aturan stok yang sama.
- [x] Endpoint publik `POST /api/cart/validate` memeriksa produk aktif, stok global produk, stok varian aktif, dan total quantity agregat per produk/varian.
- [x] Cart preview mengecek stok saat refresh/focus dan sebelum tombol checkout mengarahkan ke halaman checkout.
- [x] Halaman cart mengecek stok saat refresh/focus dan men-disable tombol checkout jika ada item habis atau quantity melebihi stok.
- [x] Halaman checkout mengecek stok saat refresh/focus dan sekali lagi saat tombol buat pesanan diklik.
- [x] `POST /api/orders` memakai validator yang sama sebelum order, voucher usage, dan reservasi stok dibuat.

Catatan:

- Pre-order tetap dikecualikan dari blokir stok seperti behavior produk existing.
- Jika stok berubah setelah produk masuk keranjang, UI menampilkan item bermasalah dan meminta customer mengurangi/menghapus item sebelum checkout.
- Guard final tetap berada di backend order API, jadi direct request ke `/api/orders` juga tidak bisa membuat pesanan out of stock.

## Batch Riset GOWA WhatsApp dan Sendy Email 2026-05-06 00:18:00 +07:00

Checklist:

- [x] Dokumentasi rencana integrasi GOWA WhatsApp dan Sendy email dibuat di `docs/GOWA_WHATSAPP_SENDY_EMAIL_INTEGRATION_PLAN.md`.
- [x] Feasibility GOWA dipetakan: layak untuk operasional/semi otomatis volume rendah, tetapi tetap unofficial dan berisiko logout/limit/ban.
- [x] Arsitektur disarankan: GOWA tetap self-hosted di Oracle/VPS, Meyya.id di Cloudflare Pages hanya memanggil API HTTPS.
- [x] Sendy + Amazon SES dipetakan sebagai kanal email murah untuk newsletter/list management, dengan catatan direct SES mungkin lebih cocok untuk transactional email ketat.
- [x] Rencana `message_outbox` dan `message_delivery_logs` dicatat agar WhatsApp/email bisa dry-run, retry, dan diaudit.
- [x] Belum ada perubahan runtime aplikasi, sesuai permintaan dokumentasi dulu.

Catatan:

- GOWA v8 memakai multi-device; call REST yang device-scoped perlu `X-Device-Id` header atau `device_id` query.
- Endpoint GOWA yang paling relevan untuk MVP adalah `/devices`, `/devices/{device_id}/status`, dan `/send/message`.
- Integrasi berikutnya sebaiknya dimulai dari dry-run dan tombol test admin sebelum pesan otomatis dinyalakan.

## Batch Verifikasi Nomor WhatsApp Profil 2026-05-06 00:44:07 +07:00

Checklist:

- [x] `/profil` menampilkan status nomor WhatsApp terverifikasi/belum terverifikasi.
- [x] Tombol `Verifikasi Nomor` membuat kode `MEYYA-WA-xxxxxx` dan membuka `web.whatsapp.com` ke nomor Meyya dengan pesan berisi kode, nama, email, dan nomor akun.
- [x] API `POST /api/user/phone-verification` menyiapkan kode verifikasi 30 menit dari nomor WhatsApp yang sudah disimpan user.
- [x] Webhook `POST /api/webhooks/gowa` menerima pesan masuk GOWA, membaca kode, mencocokkan nomor pengirim dengan `users.phone_wa`, lalu mengisi `users.phone_wa_verified_at`.
- [x] Jika user mengganti nomor WhatsApp di profil, status verified dan kode lama otomatis dihapus.
- [x] Migration helper `migrations/2026-05-06_whatsapp_phone_verification.sql` ditambahkan jika ingin patch remote secara manual.
- [x] `.env.example` menambahkan `MEYYA_SUPPORT_WHATSAPP` dan `GOWA_WEBHOOK_SECRET`.

Catatan:

- Ini menyimpan status trusted di database Meyya. Menyimpan kontak ke Google Contacts/phonebook bersama belum diimplementasi karena butuh integrasi OAuth Google Contacts terpisah.
- GOWA akan otomatis punya chat incoming dari user karena user yang mengirim duluan, tetapi itu berbeda dari menyimpan nomor permanen ke phonebook.
- Webhook dibuat cukup fleksibel untuk beberapa bentuk payload GOWA, tetapi payload asli dari server Oracle tetap perlu diverifikasi saat setup.

## Batch Chart Analytics dan Funnel 2026-05-06 00:10:35 +07:00

Checklist:

- [x] Endpoint `/api/admin/analytics?days=14` mengirim `sourceTrend`, `campaignTrend`, dan `conversionFunnel` dari aggregate harian.
- [x] Panel WhatsApp Marketing CRM menampilkan chart tren source 14 hari.
- [x] Panel WhatsApp Marketing CRM menampilkan chart tren campaign dari UTM/campaign tag yang terekam.
- [x] Panel WhatsApp Marketing CRM menampilkan conversion funnel sederhana: lihat produk, masuk keranjang, mulai checkout, order dibuat.
- [x] Chart dibuat tanpa dependency baru agar bundle tetap ringan.
- [x] Roadmap admin menandai chart tren source/campaign dan funnel sebagai done.

Catatan:

- Funnel memakai event count aggregate, bukan unique customer absolut. Ini cukup untuk indikasi awal, tetapi funnel cohort presisi nanti butuh aggregate khusus per session/user.
- Chart hanya akan ramai setelah event baru terkumpul pasca deploy aggregate.

## Batch Riset Maintenance, PDF, dan Duitku 2026-05-05 23:57:12 +07:00

Checklist:

- [x] Riset auto pruning 3 tahun ditulis di `docs/AUTO_PRUNING_AND_PDF_COMPRESSION_RESEARCH.md`.
- [x] Riset PDF compression Cloudinary ditulis di `docs/AUTO_PRUNING_AND_PDF_COMPRESSION_RESEARCH.md`.
- [x] Riset awal Duitku Payment Gateway ditulis di `docs/DUITKU_PAYMENT_GATEWAY_RESEARCH.md`.
- [x] Belum ada integrasi kode Duitku/Cloudinary/cron baru, sesuai instruksi.

Catatan:

- Auto pruning paling rapi memakai Cloudflare Worker Cron Trigger terpisah dengan binding D1/R2 yang sama.
- External cron gratis seperti cron-job.org atau GitHub Actions hanya fallback jika tidak ingin Worker terpisah.
- Cloudinary bisa dipertimbangkan untuk PDF nanti, tetapi PDF optimization tidak diasumsikan gratis/tersedia penuh untuk free tier.
- Duitku harus diintegrasikan server-side; callback wajib signature verification dan idempotency.

## Batch Agregasi Analytics Harian 2026-05-05 23:23:18 +07:00

Checklist:

- [x] Tabel `analytics_daily_metrics` ditambahkan untuk menyimpan event count dan unique users per hari, event type, source, medium, campaign, device, dan page path.
- [x] Tabel `analytics_daily_metric_users` ditambahkan sebagai dedupe unique user harian per dimensi aggregate.
- [x] Tabel `user_event_summaries` ditambahkan agar `/api/admin/users` membaca ringkasan event per pelanggan, bukan scan/group raw `user_events`.
- [x] Insert event publik dan admin campaign touch sekarang otomatis mengupdate daily aggregate dan user summary.
- [x] Endpoint admin baru `/api/admin/analytics?days=14` membaca data dari `analytics_daily_metrics`.
- [x] Panel WhatsApp Marketing CRM menampilkan ringkasan 14 hari: total event, user aktif harian, source teratas, dan event teratas.
- [x] Free-tier pruning ikut bisa memangkas dedupe key `analytics_daily_metric_users` lama agar aggregate tidak membengkak.
- [x] Migration helper `migrations/2026-05-05_daily_analytics_aggregates.sql` ditambahkan sebagai opsi manual; deploy biasa juga aman karena `ensureCommerceSchema` self-heal.
- [x] Roadmap admin menandai `Agregasi analytics harian` sebagai done.

Catatan:

- Aggregate mulai terisi dari event baru setelah deploy. Raw `user_events` lama tetap ada, tetapi tidak otomatis di-backfill ke aggregate agar dashboard tidak melakukan scan besar diam-diam.
- Jika nanti ingin melihat histori lama di aggregate, lakukan backfill manual terkontrol dari raw event pada window tanggal tertentu.

## Batch Free Tier Cache Guard 2026-05-05 23:30:49 +07:00

Checklist:

- [x] Panel `Limit Free Tier` tidak lagi auto revalidate saat browser focus/reconnect.
- [x] SWR free-tier memakai dedupe interval 15 menit agar dashboard dan tab detail tidak memanggil endpoint berulang dalam waktu dekat.
- [x] Endpoint `/api/admin/free-tier` punya cache in-memory 15 menit di Cloudflare Function isolate.
- [x] Tombol `Refresh` di tab detail tetap bisa bypass cache lewat `?refresh=1`.
- [x] Setelah pruning, cache free-tier di-clear agar angka berikutnya bisa diperbarui.

Catatan biaya:

- Endpoint free-tier hanya dipanggil oleh admin UI, bukan visitor public.
- Saat cache miss, endpoint membaca D1 count/PRAGMA, list R2 object, dan maksimal dua call Cloudflare D1 API untuk database detail serta list database.
- Dengan cache 15 menit dan auto revalidate dimatikan, angka free-tier cukup untuk monitoring tanpa membebani API/billing.

## Batch Analytics Event Detail 2026-05-05 08:54:26 +07:00

Checklist:

- [x] `user_events` diperluas dengan field terstruktur: `source`, `medium`, `campaign`, `device_type`, `page_path`, `referrer`, `session_id`, dan `anonymous_id`.
- [x] `ensureCommerceSchema` melakukan self-heal kolom analytics baru dan membuat index event penting.
- [x] Migration helper `migrations/2026-05-05_detailed_analytics_events.sql` ditambahkan sebagai opsi one-time manual jika ingin patch schema sebelum traffic masuk.
- [x] `useTrackEvent` otomatis menambahkan UTM/click id/referrer, device type, viewport, language, timezone, session id, anonymous id, page path, dan page title ke metadata analytics.
- [x] Event checkout diperinci: voucher applied/failed, shipping options loaded, shipping selected, payment method selected, dan order created dengan shipping/admin fee/discount/total/courier/product ids.
- [x] Event katalog diperinci: category filter click, search performed, search suggestion clicked, wishlist updated, product view detail, dan cart update dengan varian.
- [x] Admin CRM menampilkan source/device/campaign/event terakhir serta jumlah search dan voucher applied per pelanggan.
- [x] Roadmap admin menandai `Analytics event lebih detail` sebagai done.

Catatan:

- Event masih hanya dicatat untuk user yang sudah login karena `/api/events` dilindungi Clerk. Ini sengaja aman untuk MVP dan menghindari anonymous event spam.
- Raw event sekarang lebih kaya, tetapi untuk volume traffic besar sebaiknya tahap berikutnya membuat tabel agregat harian per source/campaign/event agar D1 read tetap hemat.

## Batch Agent Policy, D1 API, Tooltip, dan Admin Icon 2026-05-05 07:22:58 +07:00

Checklist:

- [x] `AGENTS.md` dibuat sebagai panduan delegation/cost policy untuk session Codex berikutnya.
- [x] Folder `.agents/subagents/` dibuat dengan job description per subagent pada 2026-05-05 07:37:15 +07:00.
- [x] `AGENTS.md` membedakan pekerjaan yang harus tetap di primary frontier model dan pekerjaan aman untuk subagent lebih murah.
- [x] Catatan model dibuat eksplisit: `gpt-5.4 nano` belum tersedia di model override workspace ini, jadi belum bisa dipakai.
- [x] Endpoint `/api/admin/free-tier` sekarang mencoba membaca ukuran D1 database dari Cloudflare D1 API jika env Cloudflare tersedia.
- [x] D1 account usage sekarang punya field `accountStorageBytes` dan mencoba menjumlahkan `file_size` semua D1 database dari Cloudflare API.
- [x] UI `Limit Free Tier` membedakan sumber angka: Cloudflare API, runtime D1 PRAGMA, atau belum tersedia.
- [x] `.env.example` menambahkan placeholder env Cloudflare dan Clerk secret tanpa memasukkan secret asli.
- [x] Tooltip base component dipindah ke portal `document.body` dengan `z-[9999]`, `fixed`, `normal-case`, dan `tracking-normal` agar tidak ketutup parent serta tidak ikut uppercase parent.
- [x] Tab Keuangan mendapat tooltip untuk laporan keuangan, transaksi manual, arus kas, tutup buku, packaging cost, dan ads cost.
- [x] Icon tab Dashboard admin diganti dari `Settings` menjadi `LayoutDashboard` agar lebih representatif.

Catatan setup D1 free-tier:

- Cloudflare D1 API resmi menyediakan endpoint `GET /accounts/{account_id}/d1/database/{database_id}` dan mengembalikan `file_size`.
- Cloudflare D1 API list database memakai `GET /accounts/{account_id}/d1/database`; aplikasi menjumlahkan `file_size` hasil list sebagai estimasi pemakaian D1 account.
- Permission token minimal untuk pembacaan ini: `Account: D1: Read` pada account yang berisi database production.
- Set env di Cloudflare Pages production, bukan hanya terminal lokal:
  `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_D1_DATABASE_ID`.
- Dari hasil `wrangler d1 list --json` sebelumnya, database production Meyya bernama `meyya-id` dengan database id `c668dd3a-b342-4f89-94fb-22dd4b74d489`.
- Jika env belum diset di Pages production, UI tetap fallback ke `PRAGMA page_count * page_size`; jika runtime tidak memberi angka, UI menampilkan `Belum tersedia`, bukan `0 B`.

Referensi Cloudflare:

- Get D1 Database: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/get/
- List D1 Databases: https://developers.cloudflare.com/api/resources/d1/subresources/database/methods/list/

## Batch Free Tier Accuracy dan Admin Nav Scroll 2026-05-05 04:16:43 +07:00

Checklist:

- [x] Panel `Limit Free Tier` sekarang menunggu sesi Clerk/admin siap sebelum memanggil `/api/admin/free-tier`.
- [x] UI free-tier tidak lagi jatuh ke angka 0 palsu saat API belum mengembalikan data atau saat request gagal.
- [x] Error dari endpoint free-tier sekarang ditampilkan di UI agar mudah terlihat di production.
- [x] Backend free-tier dibuat lebih defensif saat membaca `COUNT(*)` dan `PRAGMA page_count/page_size` dari D1.
- [x] Jika ukuran D1 tidak tersedia dari runtime, UI menampilkan `Belum tersedia`, bukan `0 B`.
- [x] Sidebar tab `/admin` menjadi scroll container sendiri di desktop, dengan `overscroll-contain`, sehingga wheel di atas ikon tab menggulir daftar tab, bukan konten utama.

Catatan:

- Angka users di free-tier tetap memakai proxy dari tabel D1 `users`, bukan angka billing resmi Clerk.
- Angka D1 database size sekarang memprioritaskan Cloudflare D1 API jika env production tersedia, lalu fallback ke runtime D1 `PRAGMA page_count/page_size`.

## Batch Finance Tahap 2 dan Biaya Per Order 2026-05-05

Checklist:

- [x] Finance transaksi manual punya preset kategori: Packaging, Ads, Bahan Baku, Ongkir Subsidi, Refund, Operasional, Gaji, Penjualan Manual, Modal Masuk, dan lain-lain.
- [x] Finance transaksi manual bisa upload bukti transaksi gambar/PDF.
- [x] Bukti transaksi gambar tetap lewat kompresi WebP sebelum upload; PDF sementara diupload apa adanya.
- [x] `/api/upload` menerima PDF untuk bukti transaksi manual.
- [x] Tutup buku bulanan tersedia dari tab Keuangan dan menyimpan snapshot ke `finance_period_closings`.
- [x] Periode yang sudah ditutup buku dikunci dari penambahan/penghapusan transaksi manual.
- [x] Laporan Keuangan menampilkan total Packaging, total Ads, Packaging per order, dan Ads per order.
- [x] Kompresi PDF browser-side diimplementasikan dengan rasterisasi halaman PDF menjadi PDF baru yang lebih kecil jika hasilnya hemat.
- [x] PDF upload dibatasi 8 MB dan 10 halaman sebelum kompresi agar browser tidak berat.
- [x] Kompresi PDF browser-side dipakai untuk bukti transaksi finance dan bukti transfer customer.
- [x] Finance tahap 3: bukti transaksi diupload ke folder R2 `finance/`, closing period bisa export CSV, dan dashboard arus kas sederhana ditambahkan.

Catatan kompresi PDF:

- Ada library/alat untuk optimasi PDF, tetapi pendekatannya berbeda dari kompresi gambar.
- `pdf-lib` bisa dipakai di browser/JavaScript untuk membuat dan memodifikasi PDF; di Meyya dipakai untuk membuat ulang PDF dari halaman hasil render.
- `pdfjs-dist` dipakai untuk render halaman PDF di browser.
- `qpdf` punya opsi optimasi ukuran seperti compress streams, recompress flate, dan optimize images, tetapi itu tool native CLI.
- Ghostscript `pdfwrite` bisa menghasilkan ulang PDF dan sering dipakai untuk mengecilkan PDF, tetapi juga tool native.
- Karena Cloudflare Pages Functions tidak bisa menjalankan binary native seperti Ghostscript/qpdf, opsi paling realistis nanti:
  1. Browser-side raster compression seperti yang sekarang sudah dibuat.
  2. API provider pihak ketiga jika butuh kompresi PDF agresif tanpa server sendiri.
  3. Service terpisah/worker container untuk Ghostscript/qpdf jika butuh kontrol penuh.

Provider API PDF compression yang layak dievaluasi nanti:

- CloudConvert Compress PDF API: punya optimization profiles dan storage integration.
- iLoveAPI Compress PDF: punya level kompresi termasuk `extreme`.
- PDF.co PDF Compress API: endpoint `/v2/pdf/compress` dengan konfigurasi kompresi.
- Whipdoc PDF Compression API: REST API khusus kompresi PDF dengan klaim 50 free compressions/bulan.

Referensi:

- `pdf-lib`: https://pdf-lib.js.org/
- `pdfjs-dist`: https://mozilla.github.io/pdf.js/
- `qpdf` optimizing file size: https://qpdf.readthedocs.io/en/12.0/cli.html#optimizing-file-size
- Ghostscript pdfwrite: https://ghostscript.readthedocs.io/en/gs10.02.1/VectorDevices.html
- CloudConvert Compress PDF API: https://cloudconvert.com/apis/compress-pdf
- iLoveAPI Compress PDF: https://www.iloveapi.com/docs/pdf-guides/compress-pdf-api
- PDF.co Compress PDF: https://developer.pdf.co/api-reference/pdf-compress

## Batch Schema Split, Finance Tahap 1, dan Kompresi Upload 2026-05-05 03:28:56 +07:00

Checklist:

- [x] `schema.sql` dipisahkan menjadi schema-only; data contoh tidak lagi bercampur dengan definisi tabel.
- [x] Demo seed dipindahkan ke `seed.demo.sql` untuk local/staging saja.
- [x] Tabel `finance_transactions` dan `finance_period_closings` ditambahkan ke schema dan self-heal backend.
- [x] Migration production disiapkan di `migrations/2026-05-05_finance_transactions.sql`.
- [x] Endpoint admin `/api/admin/finance` dibuat untuk laporan laba rugi sederhana dan transaksi manual.
- [x] Tab admin baru `Keuangan` dibuat.
- [x] Laporan Keuangan tahap 1 menampilkan omset produk bersih, HPP, voucher, fee transaksi, ongkir ditagihkan, uang masuk/keluar manual, margin, dan profit bersih sederhana.
- [x] Admin bisa menambah, menghapus, dan export CSV transaksi manual.
- [x] Util kompresi gambar frontend ditambahkan di `src/lib/imageCompression.ts`.
- [x] Upload gambar ke R2 dikompresi menjadi WebP jika hasilnya lebih hemat: produk, galeri, kategori, QRIS, bukti retur, bukti gudang, dan bukti transfer image.
- [x] PDF bukti transfer tetap diupload apa adanya.

Catatan apply D1:

```powershell
npx wrangler d1 execute meyya-id --remote --file migrations/2026-05-05_finance_transactions.sql
```

Jika kode sudah deploy duluan, endpoint finance punya self-heal `CREATE TABLE IF NOT EXISTS`, jadi migration ini aman dijalankan karena tidak memakai `ALTER TABLE ADD COLUMN`.

## Batch Free Tier, Profil Alamat, Checkout Stepper, dan Finance Brainstorm 2026-05-05 03:05:40 +07:00

Checklist:

- [x] Research free tier Cloudflare D1, R2, dan Clerk dibuat di `docs/CLOUDFLARE_CLERK_FREE_TIER_RESEARCH.md`.
- [x] Brainstorm fitur finansial usaha sederhana dibuat di `docs/MEYYA_FINANCE_FEATURES.md`.
- [x] Endpoint admin `/api/admin/free-tier` dibuat untuk membaca pemakaian D1, R2, dan proxy user Clerk dari D1.
- [x] Dashboard admin menampilkan kartu ringkas Free Tier Guard: Clerk users, D1 database, dan R2 storage.
- [x] Tab admin baru `Limit Free Tier` dibuat untuk melihat detail limit, tabel terbesar, dan menjalankan pruning aman.
- [x] Pruning aman hanya menghapus event lama, snapshot cart lama yang sudah converted, snapshot cart kosong stale, cache wilayah lama, dan audit log lama hanya jika dicentang.
- [x] Alamat dipisahkan dari tab akun `/profil` ke tab baru `Alamat`.
- [x] Tab alamat punya CTA jelas ketika user belum punya alamat agar tahu alamat dibutuhkan untuk belanja.
- [x] Checkout alamat baru dibuat multi-step: provinsi dulu, lalu kota/kabupaten, kecamatan, kelurahan/desa, lalu penerima dan detail alamat.
- [x] User tetap bisa balik merevisi field sebelumnya karena step yang sudah terbuka tetap terlihat.

Catatan akurasi free tier:

- Clerk di dashboard memakai jumlah user yang tersinkron ke D1 sebagai proxy, bukan angka billing resmi dari Clerk.
- D1 database size memakai `PRAGMA page_count * page_size`.
- R2 storage dihitung dari object listing binding `MEYYA_R2`; jika binding tidak ada, UI menampilkan status belum tersedia.
- Row read/write harian Cloudflare D1 paling akurat tetap dicek dari Cloudflare dashboard atau Analytics API.

## Batch Gallery Reorder, Abandoned Template, dan Return QC 2026-05-05 02:12:01 +07:00

Checklist:

- [x] Galeri produk di form tambah/edit produk sekarang bisa diurutkan dengan drag-and-drop.
- [x] Foto pertama setelah reorder otomatis menjadi primary image agar urutan galeri dan preview produk konsisten.
- [x] Template pesan abandoned cart di WhatsApp Marketing sekarang mengambil nama produk utama dari snapshot cart.
- [x] Produk utama abandoned cart dipilih dari item dengan nilai cart terbesar (`price * quantity`).
- [x] Return admin punya bukti penerimaan gudang berupa upload foto internal.
- [x] Return admin punya field keputusan refund/exchange/reject/repair/store credit.
- [x] Return admin punya log quality control per item order: kondisi item dan catatan QC.
- [x] API admin return menyimpan `warehouse_evidence_urls`, `decision`, `decision_note`, dan `qc_log`.
- [x] Migration production disiapkan di `migrations/2026-05-05_return_ops_qc_gallery_reorder.sql`.

Catatan apply D1:

```powershell
npx wrangler d1 execute meyya-id --remote --file migrations/2026-05-05_return_ops_qc_gallery_reorder.sql
```

Jika endpoint return sudah self-heal kolom baru setelah deploy, cek schema dulu sebelum menjalankan migration ini.

## Batch Return/Exchange SLA dan Region Cache Age 2026-05-05 02:02:33 +07:00

Checklist:

- [x] Return/exchange customer sekarang bisa melampirkan bukti foto sampai 6 file.
- [x] Return/exchange otomatis punya SLA due date 7 hari dari waktu request dibuat.
- [x] Admin return queue menampilkan status SLA: aman, segera expire, atau lewat.
- [x] Admin bisa menulis catatan admin dan catatan penerimaan barang.
- [x] Admin bisa menandai barang diterima (`RECEIVED`) dan memilih opsi mengembalikan stok item order ke stok produk/varian.
- [x] Restock return hanya dilakukan sekali lewat `stock_restored_at` agar stok tidak dobel.
- [x] Stock movement `RETURN_RECEIVED` dicatat saat barang retur diterima dan stok dikembalikan.
- [x] Region cache admin sekarang menampilkan umur cache per endpoint, status fresh/expiring/stale, waktu cached, dan perkiraan expire.
- [x] Endpoint `/api/admin/region-cache` sekarang mengembalikan daftar endpoint cache, bukan hanya total global.
- [x] Migration production disiapkan di `migrations/2026-05-05_return_sla_evidence_restock.sql`.

Catatan apply D1:

```powershell
npx wrangler d1 execute meyya-id --remote --file migrations/2026-05-05_return_sla_evidence_restock.sql
```

Jika endpoint return sudah sempat self-heal kolom baru setelah deploy, jangan jalankan migration ini begitu saja karena `ALTER TABLE ADD COLUMN` akan gagal pada kolom yang sudah ada. Cek schema/export dulu.

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

- `schema.sql` sudah schema-only; data demo dipisah ke `seed.demo.sql`.
- Voucher birthday sudah otomatis tampil untuk pelanggan yang eligible dan dibatasi 1x klaim per pelanggan per tahun.
- Abandoned cart sudah punya snapshot agregat aktif berisi jumlah item, subtotal, product ids, dan item summary.
- WhatsApp marketing masih membuka WhatsApp Web/manual; provider resmi belum terhubung untuk pengiriman otomatis dan audit delivery.
- Template pesan sudah memakai variable preview/validation dan endpoint admin menolak placeholder tidak dikenal.
- Tracking resi live sudah tersedia di halaman order melalui endpoint server-side yang memanggil provider tracking kurir.
- Return/exchange sudah punya SLA 7 hari, bukti foto customer, catatan penerimaan, dan opsi restock barang kembali.
- Region cache sudah bisa di-refresh dan punya indikator umur cache per endpoint di UI admin pengiriman.
- Admin roadmap sekarang statis dari file frontend; jika ingin jadi sumber kebenaran tim, pindahkan ke D1 agar bisa diedit dari admin.

## Batch Birthday Voucher dan Voucher Rules 2026-05-04

Brainstorm promo birthday:

- Pilihan paling sehat untuk margin: produk/gift dengan perceived value tinggi tetapi HPP rendah, misalnya gift box premium, pouch satin, kartu ucapan eksklusif, mini inner, scrunchie, pin hijab, atau sample care kit.
- Mekanisme ideal: buat produk khusus seperti "Birthday Gift Box" dengan harga publik rendah/khusus, lalu voucher birthday hanya berlaku untuk produk itu dan membutuhkan minimal belanja tertentu.
- Skema Rp 1.000 bisa dipakai sebagai psychological gift, tetapi tetap lebih aman diberi syarat minimal belanja dan dibatasi 1x per pelanggan per tahun agar tidak menjadi celah abuse.
- Alternatif lebih fleksibel: voucher birthday diskon nominal kecil untuk produk terpilih yang margin-nya kuat, misalnya aksesori/produk add-on.
- Hindari diskon persen besar untuk semua produk, karena produk best seller bermargin rendah bisa ikut terdiskon dan menekan profit.

Aturan implementasi yang dikerjakan:

- [x] Tanggal lahir pelanggan hanya bisa diisi sekali, dengan konfirmasi dialog sebelum disimpan.
- [x] API profil menolak perubahan `birth_date` jika tanggal lahir sudah pernah tersimpan.
- [x] Voucher birthday punya `birthday_claim_window_days`, yaitu jumlah hari setelah tanggal ulang tahun pelanggan saat voucher masih bisa diklaim.
- [x] Voucher birthday ditolak jika pelanggan belum mengisi tanggal lahir atau hari ini di luar window klaim.
- [x] Voucher bisa dibatasi hanya untuk produk tertentu lewat `applicable_product_ids`.
- [x] Validasi voucher product-specific dilakukan di `/api/vouchers/validate` dan dikonfirmasi ulang di `POST /api/orders`.
- [x] Form voucher admin bisa memilih produk yang menjadi target voucher.
- [x] Input opsi atribut kategori diperbaiki agar opsi dengan spasi dan koma bisa tetap dimasukkan secara jelas.
- [x] Migration production disiapkan di `migrations/2026-05-04_birthday_voucher_rules.sql`.

Catatan apply D1:

```powershell
npx wrangler d1 execute meyya-id --remote --file migrations/2026-05-04_birthday_voucher_rules.sql
```

Endpoint admin voucher/order/validate juga punya self-heal untuk kolom baru, tetapi migration tetap disimpan agar histori schema production jelas.

## Batch Produk, Voucher Otomatis, dan Roadmap 2026-05-04 21:00:08 +07:00

Checklist:

- [x] Bind warna foto galeri di form tambah/edit produk diubah dari text input menjadi dropdown dari warna produk yang sudah dipilih.
- [x] Tombol edit di daftar produk dibuat icon-only dengan `title` dan `aria-label`.
- [x] Stok global di form produk otomatis menampilkan total stok varian aktif saat produk punya varian.
- [x] API create/update produk menormalisasi `products.stock` dari total `product_variants.stock` aktif, sehingga backend tetap konsisten walau request tidak lewat UI.
- [x] Migration data `migrations/2026-05-04_normalize_variant_stock.sql` dibuat untuk menyamakan stok global produk lama dari total varian aktif.
- [x] Voucher birthday tampil otomatis di `/profil` saat pelanggan berada dalam window klaim ulang tahun.
- [x] Window klaim birthday dihitung dengan tanggal Asia/Jakarta agar tidak bergeser dari hari pelanggan Indonesia.
- [x] Tampilan voucher profil diperbaiki untuk voucher tanpa tanggal kedaluwarsa agar tidak menampilkan tanggal 1970.
- [x] Roadmap admin bisa diurutkan dari "Akan Ada di Atas", "Sudah Ada di Atas", atau berdasarkan area fitur.
- [x] Data roadmap diperbarui: voucher birthday otomatis, normalisasi stok global, bind warna galeri, dan sort roadmap ditandai selesai.

Catatan apply data production:

```powershell
npx wrangler d1 execute meyya-id --remote --file migrations/2026-05-04_normalize_variant_stock.sql
```

Jalankan migration ini setelah deploy kode jika ingin stok produk lama langsung sama dengan total varian aktif. Produk yang dibuat/diubah setelah deploy akan otomatis dinormalisasi oleh API.

## Batch Birthday Strict dan Abandoned Cart Snapshot 2026-05-04 21:13:17 +07:00

Checklist:

- [x] Voucher birthday sekarang divalidasi strict hanya 1x klaim per pelanggan per tahun.
- [x] `voucher_usages` ditambah `usage_type` dan `claim_year`, plus unique index partial untuk klaim birthday per tahun.
- [x] Validasi `/api/vouchers/validate`, `/api/orders`, dan `/api/user/vouchers` menolak voucher birthday jika pelanggan sudah klaim di tahun berjalan.
- [x] Jika race condition membuat klaim birthday dobel saat order dibuat, order baru dibatalkan sebelum stok direservasi dan user mendapat pesan klaim 1x per tahun.
- [x] Snapshot cart agregat ditambahkan lewat tabel `user_cart_snapshots`.
- [x] Event `CART_UPDATED` sekarang menyimpan snapshot ringkas: item count, subtotal, product ids, dan item summary.
- [x] `POST /api/orders` menandai snapshot cart sebagai `CONVERTED` saat checkout berhasil membuat order.
- [x] CRM dan WhatsApp Marketing membaca abandoned cart dari snapshot aktif, bukan hanya timestamp event mentah.
- [x] Marketing abandoned cart sekarang menampilkan jumlah item dan subtotal keranjang terakhir.
- [x] Migration production disiapkan di `migrations/2026-05-04_birthday_once_and_cart_snapshots.sql`.

Catatan apply D1:

```powershell
npx wrangler d1 execute meyya-id --remote --file migrations/2026-05-04_birthday_once_and_cart_snapshots.sql
```

Jika kode sudah ter-deploy duluan, endpoint voucher/order/events punya self-heal untuk schema baru. Jangan jalankan migration ini setelah self-heal menambahkan kolom `voucher_usages.usage_type` atau `voucher_usages.claim_year`, karena `ALTER TABLE ADD COLUMN` akan gagal jika kolom sudah ada. Dalam kondisi itu cukup export schema dan cek kolomnya.

## Batch Template Pesan dan Tracking Resi 2026-05-04 21:22:00 +07:00

Checklist:

- [x] Template pesan admin punya daftar variable yang boleh dipakai per template.
- [x] Template editor menampilkan preview title/body dengan data contoh sebelum disimpan.
- [x] Placeholder template divalidasi di UI agar typo seperti `{{tracking_numer}}` langsung terlihat.
- [x] Endpoint `PUT /api/admin/message-templates` menolak placeholder tidak dikenal, sehingga guard tetap aman walau request tidak lewat UI.
- [x] Endpoint tracking customer ditambahkan di `/api/orders/:id/tracking` dan hanya bisa dibaca pemilik order.
- [x] Halaman order menampilkan status live, asal/tujuan, penerima, layanan, dan timeline tracking jika provider mengembalikan data.
- [x] Tracking resi punya fallback pesan aman jika API key belum dikonfigurasi, resi belum tersedia, atau kurir belum punya update.
- [x] Data roadmap admin diperbarui: validasi variable template pesan dan tracking resi live ditandai selesai.

Catatan konfigurasi tracking:

- Endpoint tracking server-side membaca API key dari `RAJAONGKIR_API_KEY`, lalu fallback ke `KOMERCE_API_KEY`, lalu `API_CO_ID_KEY`.
- Endpoint provider yang dipakai: `POST https://rajaongkir.komerce.id/api/v1/track/waybill?awb=...&courier=...` dengan header `key`.
- Jika provider yang dipakai production berbeda dari RajaOngkir/Komerce, cukup sesuaikan fungsi `functions/api/orders/[id]/tracking.ts` tanpa mengubah UI customer.

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
- `schema.sql` sekarang schema-only; jangan apply `seed.demo.sql` ke production kecuali memang ingin data contoh.
- `ALTER TABLE ... ADD COLUMN` di D1/SQLite tidak menerima default non-konstan seperti `CURRENT_TIMESTAMP`; karena itu `wishlists.created_at` ditambah nullable dan insert aplikasi mengisi timestamp secara eksplisit.
- File migration ini one-time dan sudah applied. Jangan jalankan ulang kecuali schema remote sudah dicek dan memang perlu.
- Jangan commit full dump karena bisa berisi PII customer/order.
- D1 schema tambahan yang sekarang dibutuhkan untuk varian lengkap:
  `product_variants.option_signature`, `product_variants.option_label`, dan `order_items.variant_options`.
  `ensureCommerceSchema` sudah melakukan self-heal, tetapi remote tetap sebaiknya diverifikasi.

### 2. Pisahkan migration production dari seed demo

Status:

- Selesai pada batch 2026-05-05 03:28:56 +07:00.
- `schema.sql` berisi definisi tabel saja.
- Data contoh dipindahkan ke `seed.demo.sql` untuk local/staging.

Catatan:

- Production tetap sebaiknya memakai file migration kecil per batch, bukan full seed demo.

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
- Abandoned cart sudah aktif dari snapshot `user_cart_snapshots` yang belum menjadi order setelah minimal 4 jam.

Saran:

- Tambah variasi template abandoned cart berdasarkan isi snapshot cart, misalnya produk utama, nominal cart, atau kategori dominan.
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
- Return/exchange workflow: implemented untuk customer order completed, bukti foto, SLA 7 hari, admin return queue, penerimaan barang, dan opsi restock.
- Inventory reservation: implemented saat checkout membuat order; stok dikurangi saat `PENDING`, lalu reservation consumed saat paid/completed atau released saat cancel/expired.
- Dashboard margin per produk dan kategori: product margin tampil di dashboard metrics; API juga mengirim `categoryMargins`.
- CSV export orders/products: implemented di admin Operasional Toko dan admin Produk.
- Soft delete produk/kategori: delete produk/kategori sekarang arsip (`deleted_at`) agar histori order tetap aman.
- Full variant stock matrix: implemented dengan `product_variants.option_signature`, admin generator kombinasi warna/ukuran/spek custom, stok global otomatis dari varian aktif, `variant_options` di order item, dan swatch warna di checkout.

Catatan lanjutan:

- Bundle creator admin sudah mendukung multi-item dalam satu submit.
- Related product manual mapping sudah punya editor di admin product form.
- Template pesan belum otomatis mengirim WhatsApp/email; saat ini dikelola sebagai template operasional untuk disalin/dipakai admin.

## Urutan Fix Disarankan Berikutnya

1. Tambah finance tahap 2: kategori preset, upload bukti transaksi manual, dan tutup buku bulanan.
2. Hubungkan template pesan ke provider WhatsApp/email setelah provider dipilih.
