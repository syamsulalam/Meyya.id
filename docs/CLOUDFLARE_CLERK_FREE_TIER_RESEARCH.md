# Cloudflare D1, R2, dan Clerk Free Tier

Tanggal riset: 2026-05-05 03:05:40 +07:00

Dokumen ini merangkum batas free tier yang relevan untuk Meyya.id dan bagaimana batas tersebut sebaiknya ditampilkan di dashboard admin.

## Ringkasan Limit

| Layanan | Free tier utama | Catatan operasional untuk Meyya.id |
| --- | ---: | --- |
| Clerk Hobby | 50.000 monthly active/requesting users per app | Dashboard Meyya.id bisa menampilkan jumlah user yang sudah tersinkron ke D1 sebagai proxy. Angka billing resmi tetap ada di Clerk dashboard. |
| Cloudflare D1 storage akun | 5 GB total per account | Untuk monitoring internal, hitung ukuran database aktif dari `PRAGMA page_count * page_size`. |
| Cloudflare D1 ukuran database | 500 MB per database di Workers Free | Database `meyya-id` perlu dijaga jauh di bawah 500 MB agar tetap bisa insert/alter. |
| Cloudflare D1 read/write | 5 juta rows read per hari, 100.000 rows written per hari | App tidak bisa menghitung limit harian Cloudflare secara sempurna tanpa Analytics API, tetapi bisa mengurangi query boros dan prune tabel event/cache. |
| Cloudflare R2 storage | 10 GB-month per bulan untuk Standard storage | Admin bisa menjumlahkan object size lewat R2 binding sebagai perkiraan storage saat ini. |
| Cloudflare R2 Class A | 1 juta operasi per bulan | Upload gambar produk/bukti pembayaran/bukti retur memakai kuota ini. |
| Cloudflare R2 Class B | 10 juta operasi per bulan | View/download gambar memakai kuota ini. Egress langsung dari R2 gratis. |

## Sumber Resmi

- Cloudflare D1 Pricing: https://developers.cloudflare.com/d1/platform/pricing/
- Cloudflare D1 Limits: https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare R2 Pricing: https://developers.cloudflare.com/r2/pricing/
- Clerk Pricing: https://clerk.com/pricing

## Tampilan Dashboard yang Dibuat

Dashboard admin menampilkan kartu free tier seperti:

- Clerk users: `2 / 50.000`.
- D1 database size: `20 MB / 500 MB`.
- D1 account storage: `20 MB / 5 GB`.
- R2 storage: `120 MB / 10 GB`, jika binding R2 aktif.

Catatan akurasi:

- Clerk count di dashboard Meyya.id memakai jumlah user D1, bukan angka billing Clerk resmi.
- R2 storage dihitung dari listing object bucket via binding `MEYYA_R2`; jika binding tidak tersedia atau listing gagal, UI menampilkan status belum tersedia.
- D1 row read/write harian paling akurat tetap dari Cloudflare dashboard atau GraphQL Analytics API.

## Strategi Maksimalkan Free Tier

1. Simpan hanya data operasional yang masih berguna untuk keputusan bisnis.
2. Pisahkan data event mentah dari agregat penting; event mentah bisa dipangkas berkala.
3. Jangan simpan payload cache wilayah terlalu lama jika endpoint sudah bisa di-refresh.
4. Kompres gambar sebelum upload ke R2 ketika fitur kompresi sudah dibuat.
5. Hindari query admin yang membaca seluruh tabel besar tanpa limit.

## Pruning Aman

Pruning yang aman untuk dashboard:

- Hapus `user_events` lama yang sudah lewat masa analisis.
- Hapus `user_cart_snapshots` lama dengan status `CONVERTED`.
- Hapus `user_cart_snapshots` lama yang `ACTIVE` tetapi sudah sangat lama dan tidak relevan.
- Hapus `region_cache` lama karena bisa dibangun ulang dari API wilayah.
- Hapus `audit_logs` lama hanya jika benar-benar diperlukan; default sebaiknya disimpan lebih lama.

Pruning tidak boleh menghapus:

- `orders`, `order_items`, `users`, `user_addresses`, `voucher_usages`, `stock_movements`, dan data retur, karena dibutuhkan untuk audit bisnis.

