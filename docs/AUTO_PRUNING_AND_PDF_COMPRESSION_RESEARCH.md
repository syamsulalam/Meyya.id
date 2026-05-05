# Auto Pruning dan PDF Compression Research

Tanggal riset: 2026-05-05 23:57:12 +07:00

## Ringkasan Keputusan

Auto pruning sangat mungkin dengan stack sekarang. Opsi paling rapi adalah membuat Cloudflare Worker kecil dengan Cron Trigger yang memakai binding D1/R2 yang sama, lalu menjalankan pruning aman berkala. External cron belum perlu.

Untuk PDF compression, Cloudinary bisa mengelola dan mengoptimasi PDF, tetapi PDF optimization tampaknya bukan fitur yang bisa diasumsikan tersedia penuh di free tier. Browser-side compression yang sudah ada tetap opsi paling gratis dan paling aman untuk sekarang.

## Auto Pruning 3 Tahun

Yang aman dipangkas otomatis setelah 3 tahun:

- `user_events` raw.
- `analytics_daily_metric_users` dedupe key.
- `user_cart_snapshots` yang `CONVERTED`, `EMPTY`, atau stale.
- `region_cache` lama.
- `audit_logs` lama jika policy internal mengizinkan.

Yang sebaiknya tidak dipangkas otomatis tanpa policy legal/akuntansi:

- `orders`.
- `order_items`.
- `voucher_usages`.
- `finance_transactions`.
- `payment_*`.
- `return_requests`.
- `users` yang masih punya order.

Alasan: data order, pembayaran, retur, dan keuangan lebih dekat ke audit bisnis, rekonsiliasi, dan pembukuan. Untuk data ini lebih aman pakai archive/anonymize policy, bukan delete otomatis.

## Opsi Cron

### 1. Cloudflare Workers Cron Trigger

Rekomendasi utama.

Cara kerja:

- Buat Worker terpisah, misalnya `meyya-maintenance-worker`.
- Binding ke D1 production `meyya-id`.
- Binding ke R2 jika nanti perlu maintenance object.
- Tambahkan Cron Trigger, misalnya tiap minggu atau tiap bulan.
- Worker menjalankan query pruning dengan batas aman.

Kelebihan:

- Masih dalam ekosistem Cloudflare.
- Tidak perlu third-party cron.
- Tidak perlu expose endpoint pruning public.
- Bisa langsung memakai binding D1/R2.

Kekurangan:

- Perlu satu Worker tambahan.
- Tetap masuk hitungan request/CPU Cloudflare, tetapi untuk cron bulanan/mingguan sangat kecil.

### 2. Endpoint Admin + External Cron

Opsi fallback jika tidak mau Worker terpisah.

Cara kerja:

- Buat endpoint khusus seperti `/api/admin/maintenance/prune`.
- Lindungi dengan secret header, misalnya `X-MEYYA-MAINTENANCE-KEY`.
- Jadwalkan external cron untuk memanggil endpoint itu.

External cron gratis yang layak:

- `cron-job.org`: simple HTTP cron scheduler gratis.
- GitHub Actions scheduled workflow: gratis dalam batas GitHub Actions, cocok jika repo/action sudah dipakai.

Kelemahan:

- Endpoint maintenance menjadi reachable dari internet.
- Perlu secret management lebih hati-hati.
- External service bisa terlambat/skip tergantung platform.

## Cadangan Implementasi Pruning

Contoh policy awal:

- Raw events: hapus lebih lama dari 1095 hari.
- Analytics dedupe users: hapus lebih lama dari 180 hari karena aggregate `unique_users` sudah tersimpan.
- Converted cart snapshots: hapus lebih lama dari 1095 hari.
- Empty/stale cart snapshots: hapus lebih lama dari 180-365 hari.
- Region cache: hapus lebih lama dari 30-90 hari.
- Audit log: default jangan ikut kecuali diputuskan.

Pruning sebaiknya batched, misalnya `LIMIT 5000` per tabel per run jika volume sudah besar, agar D1 tidak terkunci lama.

## Cloudinary Untuk PDF

Cloudinary bisa upload dan deliver file PDF. Dokumentasi Cloudinary juga menyebut PDF dapat diperlakukan sebagai asset image untuk konversi/transformasi halaman, dan ada opsi optimization.

Catatan penting:

- PDF delivery bisa dibatasi pada free account sampai setting delivery PDF/ZIP diaktifkan.
- PDF optimization tidak bisa diasumsikan tersedia untuk semua akun/free tier; dokumentasi menyebut fitur ini tersedia untuk customer tertentu dan bisa perlu kontak support.
- Transformasi Cloudinary memakai credit/quota. Kalau PDF banyak, biaya/credit tetap perlu dipantau.
- Cloudinary cocok untuk roadmap nanti jika kita ingin offload transformasi media, tetapi jangan jadikan dependency utama untuk kompresi PDF gratis sekarang.

Keputusan sementara:

- Tetap pakai browser-side PDF compression yang sudah ada.
- Batasi ukuran upload PDF dari awal.
- Evaluasi Cloudinary lagi nanti jika akun MEYYA sudah dipakai untuk image CDN atau sudah jelas fitur PDF optimization tersedia di plan yang dipakai.

## Next Action

1. Buat Worker maintenance terpisah untuk auto pruning bulanan 3 tahun.
2. Tambahkan dry-run mode: hitung jumlah row yang akan dihapus sebelum delete.
3. Simpan log pruning ke `audit_logs`.
4. Jangan hapus data order/finance otomatis sebelum ada retention policy bisnis.

## Referensi

- Cloudflare Workers Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- Cloudflare scheduled handler: https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/
- GitHub Actions scheduled events: https://docs.github.com/en/actions/reference/events-that-trigger-workflows#schedule
- cron-job.org: https://cron-job.org/en/
- Cloudinary PDF and ZIP files delivery: https://cloudinary.com/documentation/paged_and_layered_media#deliver_non_image_files_as_images
- Cloudinary PDF optimization: https://cloudinary.com/documentation/paged_and_layered_media#optimize_pdf_files
- Cloudinary free plan: https://cloudinary.com/pricing
