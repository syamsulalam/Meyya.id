# MEYYA.ID Review Journey and Review Growth Strategy

Tanggal: 2026-05-06.

Dokumen ini menjelaskan user journey dari beli produk sampai meninggalkan review, status fitur review yang sudah ada di Meyya.id, strategi agar customer lebih rajin review dengan biaya rendah tetapi perceived value tinggi, rencana admin review center, dan strategi offload review lama agar tetap tampil tanpa membebani D1.

Update implementasi awal 2026-05-06:

- CTA review sudah ditambahkan di halaman order selesai dan profile order history.
- Review duplicate per order/product/customer diblokir di `POST /api/reviews`.
- Review valid membuat kesempatan spin hadiah review.
- Tab admin `Reviews` sudah tersedia untuk list review, publish/hide, featured review, dan balasan public.
- Balasan admin tampil di product detail untuk review published.
- Offload review lama, media review, size/fit metadata, dan summary table materialized masih menjadi fase berikutnya.

## Ringkasan

Review adalah social proof yang langsung mempengaruhi conversion. Untuk Meyya, review sebaiknya tidak hanya menjadi teks bintang di halaman produk, tetapi menjadi workflow operasional:

- Customer menerima produk.
- Customer diminta review pada momen yang tepat.
- Review diverifikasi sebagai pembeli asli.
- Admin bisa moderasi dan membalas.
- Review bagus dipakai ulang untuk product page, CRM, WhatsApp, dan campaign.
- Review lama tetap bisa muncul tanpa membuat query D1 semakin berat.

Target MVP yang paling efisien:

1. Pertahankan aturan verified buyer: hanya order selesai yang boleh review.
2. Tambah CTA review di order selesai dan profil order history.
3. Tambah tab admin `Reviews` untuk melihat, moderasi, membalas, dan menandai review untuk reward.
4. Tambah incentive ringan: voucher kecil atau undian bulanan.
5. Tambah summary table dan cache agar product page tidak menghitung review dari raw table besar.
6. Arsip review lama ke R2/static JSON, sementara D1 menyimpan review terbaru, review featured, dan aggregate.

## User Journey Dari Beli Produk Sampai Review

### 1. Discovery produk

Customer menemukan produk dari homepage, kategori, search, product card, wishlist, recently viewed, atau link campaign WhatsApp.

Yang perlu didorong:

- Product card menampilkan rating average dan jumlah review jika sudah ada.
- Product detail menampilkan review paling relevan, bukan hanya terbaru.
- Produk baru yang belum punya review bisa menampilkan trust signal lain: jumlah terjual, kebijakan retur, atau foto detail produk.

Status sekarang:

- Product detail sudah punya area review.
- Product list/product card belum jelas memakai rating sebagai sinyal utama.

### 2. Add to cart dan checkout

Customer memilih varian, masuk keranjang, checkout, pilih alamat, pilih kurir, voucher, payment method, lalu membuat order.

Yang perlu dijaga:

- Review belum diminta pada tahap ini karena customer belum menerima barang.
- Jika ada voucher review, komunikasi voucher harus jelas: voucher diberikan setelah review valid, bukan saat checkout pertama.

Status sekarang:

- Checkout dan order flow sudah ada.
- Guard stok sudah ada agar customer tidak checkout out-of-stock item.

### 3. Payment dan fulfillment

Customer upload bukti pembayaran, admin confirm, order diproses, dikirim, lalu selesai.

Momen review ideal:

- Jangan minta review saat order baru dikirim.
- Minta review setelah status order selesai atau beberapa hari setelah paket diterima.
- Untuk fashion/apparel, review paling berguna muncul setelah customer sempat mencoba produk. Delay 2-4 hari setelah completed lebih masuk akal daripada langsung saat status berubah.

Status sekarang:

- Template pesan `order_completed` sudah mengajak customer memberi review.
- Belum ada sistem otomatis/semi otomatis untuk review request terjadwal.

### 4. Review prompt

Channel prompt yang disarankan:

- Halaman order selesai: tombol `Tulis Review`.
- Profil > Riwayat Pesanan: badge `Belum direview` dan tombol review per item.
- WhatsApp operational message setelah order completed.
- Email follow-up jika Sendy/SES nanti aktif.
- Product detail: form review tetap ada sebagai fallback.

Copy yang disarankan:

- Fokus ke bantu customer lain, bukan memaksa rating tinggi.
- Jelaskan benefit kecil jika ada: voucher/undian.
- Hindari wording yang mengarahkan customer hanya memberi review positif.

Contoh arah copy:

> Bantu customer lain pilih size dan bahan yang tepat. Review jujur dari Kakak bisa dapat voucher atau masuk undian bulanan.

Status sekarang:

- Product detail punya form review.
- Order page/profil belum menjadi review entry utama.
- Review request message ada sebagai template, tetapi belum ada outbox otomatis.

### 5. Review form

Form review ideal untuk Meyya:

- Rating 1-5.
- Teks pengalaman.
- Foto/video opsional.
- Size yang dibeli.
- Fit: kecil / pas / besar.
- Kualitas bahan: 1-5 atau singkat.
- Tinggi/berat opsional untuk membantu sizing, dengan catatan privasi.
- Checkbox consent untuk menampilkan foto/nama depan jika review dipakai di situs atau campaign.

Prinsip UX:

- Jangan terlalu panjang di awal.
- Tampilkan pertanyaan ringkas dulu, lalu pertanyaan detail sebagai optional.
- Autosave draft tetap berguna agar review panjang tidak hilang saat refresh.

Status sekarang:

- Product detail sudah punya rating dan textarea.
- Draft review sudah bisa tersimpan lokal.
- Belum ada foto, size/fit metadata, consent, atau review per order item.

### 6. Submit dan validasi

Aturan yang disarankan:

- Hanya user login yang bisa submit.
- User hanya bisa review produk yang pernah dibeli pada order status selesai.
- Satu review per order item/product/order/customer.
- Jika customer membeli produk yang sama lagi, boleh review lagi untuk order berbeda, tetapi admin harus bisa melihat konteks ordernya.
- Review baru masuk `PENDING` jika ada media atau kata sensitif; review teks normal bisa auto-publish tergantung risk appetite.

Status sekarang:

- `POST /api/reviews` sudah auth-gated.
- API sudah mengecek order selesai dengan product tersebut.
- Belum ada unique guard, jadi potensi duplicate review masih ada.
- Default status schema adalah `PUBLISHED`, jadi belum ada review queue/moderation workflow.

### 7. Admin moderation dan reply

Admin sebaiknya punya tab khusus di `/admin`: `Reviews` atau `Ulasan`.

Fungsi minimal:

- Daftar review terbaru.
- Filter status: pending, published, hidden, replied.
- Filter product, rating, has photo, verified buyer, incentive status.
- Detail review: customer, order, produk, varian, tanggal order selesai.
- Action: publish, hide, reply, pin/feature, mark as rewarded.
- Public reply dari Meyya.
- Internal note yang tidak tampil ke customer.
- Link cepat ke order dan profil customer.

Fungsi lanjutan:

- Bulk publish/hide.
- Saved replies untuk admin.
- Sentiment tag manual: sizing issue, packaging, bahan, warna, kurir, repeat buyer.
- Export CSV review untuk campaign.
- Review analytics: review rate dari completed orders, average rating per product, product tanpa review, rating rendah yang belum dibalas.

Status sekarang:

- Belum ada admin review center.
- Belum ada admin reply atau moderation action.

### 8. Public display dan reuse

Display yang disarankan:

- Product detail menampilkan rating summary dari semua published review, bukan hanya 20 review terakhir.
- Tampilkan histogram bintang.
- Tampilkan badge `Verified Buyer`.
- Tampilkan admin reply di bawah review.
- Tampilkan filter sederhana: terbaru, rating tertinggi, rating terendah, dengan foto.
- Untuk mobile, tampilkan 3-5 review dulu dan tombol `Lihat Semua`.

Reuse marketing:

- Review dengan izin customer bisa dipakai untuk product card, homepage, campaign WhatsApp, email, dan social proof di checkout.
- Admin bisa menandai `featured` agar review terbaik muncul di posisi strategis.

Status sekarang:

- Product detail mengambil maksimal 20 published review.
- Product detail hanya menampilkan 3 review pertama.
- `review_count` dan `rating_average` dihitung dari review yang sedang di-fetch, bukan aggregate semua review.

## Strategi Agar User Rajin Review

### Strategi 1: Undian voucher bulanan

Ini paling murah untuk perceived value tinggi karena tidak semua reviewer menerima reward.

Format:

- Setiap review valid mendapat 1 tiket undian.
- Review dengan foto mendapat 2 tiket.
- Review detail size/fit mendapat tambahan 1 tiket.
- Pemenang dipilih bulanan.
- Hadiah bisa voucher Rp50.000-Rp150.000, free shipping, atau store credit.

Kelebihan:

- Biaya terkendali.
- Perceived value tinggi.
- Bisa dijadikan konten bulanan.

Guard:

- Jangan mensyaratkan rating positif.
- Satu order item hanya satu entry utama.
- Review fake/duplikat tidak eligible.
- Publish syarat dan periode dengan jelas.

### Strategi 2: Guaranteed micro-voucher

Format:

- Review teks valid: voucher kecil, misalnya Rp10.000 dengan minimum pembelian.
- Review foto: voucher lebih besar, misalnya Rp15.000-Rp20.000 atau free shipping.
- Voucher expire 7-14 hari agar mendorong repeat purchase.
- Voucher tidak bisa stack dan ada minimum spend.

Kelebihan:

- Mendorong review lebih konsisten.
- Sekaligus mendorong repeat order.

Risiko:

- Biaya bisa naik jika volume order besar.
- Perlu guard agar tidak memberi voucher berkali-kali untuk produk/order yang sama.

### Strategi 3: Featured customer review

Format:

- Review terpilih tampil di homepage/product page atau repost IG story.
- Customer mendapat voucher kecil atau badge.

Kelebihan:

- Biaya hampir nol.
- Perceived value tinggi untuk customer yang suka tampil.
- Review berkualitas lebih mungkin muncul karena ada peluang dipilih.

Guard:

- Perlu consent sebelum memakai foto/nama customer untuk marketing.

### Strategi 4: Review membantu sizing

Untuk fashion, customer sering butuh jawaban tentang size dan bahan. Ubah review menjadi kontribusi yang terasa berguna.

Pertanyaan ringan:

- Size yang dibeli.
- Fit: kecil / pas / besar.
- Tinggi badan opsional.
- Bahan: ringan / tebal / flowy / stretch.

Kelebihan:

- Review jadi lebih berguna daripada hanya "bagus".
- Mengurangi chat tanya size.
- Mengurangi retur karena ekspektasi lebih jelas.

### Strategi 5: Timing reminder

Cadence yang disarankan:

- H+2 atau H+3 setelah order completed: pesan pertama.
- H+10: satu reminder ringan jika belum review.
- Setelah itu berhenti untuk order tersebut.

Guard:

- Jangan spam.
- Jangan kirim reminder jika customer sudah review semua item order.
- Admin bisa pause review request untuk customer tertentu.

## Apakah Fitur Ini Sudah Ada?

Sudah ada:

- Tabel `product_reviews` di schema.
- Endpoint `POST /api/reviews`.
- Validasi server-side bahwa review hanya bisa dibuat oleh user yang memiliki order selesai berisi produk tersebut.
- Product detail menampilkan review published terbaru.
- Product detail memiliki form rating dan textarea.
- Template pesan order completed sudah mengajak review.
- Draft review di product detail bisa tersimpan lokal agar tidak hilang saat refresh.

Belum ada:

- Admin review center di `/admin`.
- Admin reply public.
- Moderation queue yang benar-benar dipakai.
- Unique guard anti duplicate review.
- Review per order item/variant.
- Review foto/video.
- Metadata size/fit.
- Incentive/voucher/raffle review.
- Review request CTA di order selesai/profil.
- Review request outbox terjadwal.
- Aggregate rating table.
- Archive/offload review lama.
- Public page `lihat semua review`.

## Rencana Fitur Admin Reviews

Tab baru yang disarankan di `/admin`: `Reviews`.

Layout:

- Header metric kecil: total pending, average rating 30 hari, review rate, unreplied low rating.
- Filter bar: status, rating, produk, tanggal, has media, incentive.
- Table/list review.
- Detail drawer.

Fields di table:

- Rating.
- Review excerpt.
- Product.
- Customer.
- Order ID.
- Verified buyer.
- Status.
- Has media.
- Incentive status.
- Admin reply status.
- Created date.

Actions:

- Publish.
- Hide.
- Reply.
- Mark as featured.
- Mark incentive eligible/not eligible.
- Issue voucher.
- Add internal note.
- Open order.
- Open customer CRM.

Admin reply:

- Satu public reply per review untuk MVP.
- Edit reply masih boleh, tetapi simpan audit log.
- Untuk review negatif, reply harus sopan, singkat, dan menawarkan follow-up via support WA jika perlu data pribadi.

Incentive admin:

- Admin bisa melihat review yang eligible.
- Admin bisa issue voucher manual dulu.
- Nanti bisa otomatis setelah moderation publish.
- Raffle entries bisa diexport monthly.

## Rencana Data Model

Perubahan yang mungkin dibutuhkan:

- `product_reviews.status`: gunakan `PENDING`, `PUBLISHED`, `HIDDEN`, `ARCHIVED`.
- `product_reviews.admin_reply`.
- `product_reviews.admin_replied_at`.
- `product_reviews.admin_replied_by`.
- `product_reviews.moderation_note`.
- `product_reviews.is_featured`.
- `product_reviews.helpful_count`.
- `product_reviews.fit_rating`.
- `product_reviews.quality_rating`.
- `product_reviews.size_purchased`.
- `product_reviews.media_urls` sebagai JSON string atau tabel terpisah.
- `product_reviews.consent_marketing`.
- `product_reviews.incentive_status`.
- `product_reviews.incentive_voucher_code`.
- `product_reviews.archived_at`.

Index/constraint:

- Unique review untuk kombinasi `order_id`, `product_id`, `clerk_id`.
- Index `product_id, status, created_at`.
- Index `status, created_at` untuk admin queue.
- Index `rating, status` untuk filter admin.

Tabel tambahan yang mungkin berguna:

- `product_review_summaries`: aggregate per product.
- `review_incentives`: voucher/reward yang diberikan karena review.
- `review_draw_entries`: tiket undian review bulanan.
- `review_media`: jika media perlu query/filter terpisah dari review text.

## Strategi Offload Review Lama

Masalah yang ingin dihindari:

- Product page melakukan scan raw review besar.
- Rating average dihitung ulang dari banyak baris.
- D1 membengkak karena review lama dan media metadata.
- Public page `lihat semua review` membuat query berat.

Strategi yang disarankan:

1. D1 tetap menjadi source of truth untuk review aktif terbaru, featured, dan review yang butuh admin action.
2. Buat `product_review_summaries` di D1 berisi count, average, histogram bintang, latest review date, dan jumlah review dengan foto.
3. Product page membaca summary table untuk rating average/count.
4. Product page membaca review terbaru/featured secukupnya dari D1, misalnya 20-50 item.
5. Review published lama dipindahkan berkala ke R2 sebagai JSON per product dan periode, misalnya `reviews/product-123/2026-01.json`.
6. Media review disimpan di R2, D1 hanya menyimpan URL/metadata kecil.
7. Halaman `lihat semua review` melakukan lazy-load arsip dari R2/static endpoint jika customer ingin membaca lebih banyak.
8. CDN cache response review public dengan `Cache-Control` agar hit produk populer tidak langsung menekan D1.
9. Review yang diarsipkan tetap dihitung dalam summary, jadi rating/count tetap benar.

Kriteria archive awal:

- Review status `PUBLISHED`.
- Umur lebih dari 12-18 bulan.
- Bukan `featured`.
- Tidak sedang punya admin action terbuka.
- Sudah masuk summary aggregate.

Pilihan storage:

- R2: cocok untuk JSON archive dan media review, murah untuk object storage.
- Cloudflare Pages static asset: cocok untuk snapshot yang jarang berubah, tetapi build/deploy perlu diatur.
- KV: bisa untuk cache kecil, tetapi R2 lebih natural untuk arsip panjang berbentuk file.

Catatan penting:

- Jangan menghapus raw D1 sebelum ada export valid dan summary terverifikasi.
- Archive job harus punya dry-run dan audit log.
- Jika review lama diedit/di-hide, perlu rehydrate atau tandai tombstone di D1 agar public archive tidak menampilkan item yang seharusnya disembunyikan.

## Urutan Implementasi Yang Disarankan

### Phase 1: Review foundation

- Tambah unique guard anti duplicate review.
- Ubah default status review baru menjadi `PENDING` atau tetap `PUBLISHED` dengan rule jelas.
- Tambah rating aggregate yang benar dari semua published review.
- Tampilkan badge verified buyer.
- Tambah CTA review di order/profil.

### Phase 2: Admin review center

- Tambah endpoint admin review list/detail/update.
- Tambah tab `/admin` Reviews.
- Tambah publish/hide/reply/feature/internal note.
- Tambah audit log untuk moderation action.

### Phase 3: Review growth

- Tambah micro-voucher atau raffle entry.
- Tambah review request template/outbox.
- Tambah admin analytics review rate dan products missing reviews.
- Tambah media review jika storage R2 sudah siap.

### Phase 4: Scale dan archive

- Tambah `product_review_summaries`.
- Tambah cache public review.
- Tambah R2 review archive job.
- Tambah `lihat semua review` yang lazy-load archive.

## Edge Case Yang Perlu Dijaga

- Customer refund/return setelah review: review tetap boleh ada, tetapi admin harus bisa hide atau beri note.
- Produk dihapus/nonaktif: review tetap tersimpan untuk audit, tetapi public display mengikuti status produk.
- Produk dengan varian: review harus jelas size/warna/variant yang dibeli.
- Order berisi produk sama lebih dari sekali: gunakan order item jika tersedia, bukan hanya product id.
- Customer ganti akun/email: D1 tetap pakai clerk_id saat review dibuat.
- Review negatif: jangan otomatis disembunyikan kecuali melanggar policy; balasan admin justru bisa meningkatkan trust.
- Incentive abuse: satu order item satu reward eligibility.
- PII di review: admin harus bisa edit/hide atau meminta customer revisi sebelum publish.
