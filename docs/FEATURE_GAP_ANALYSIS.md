# Analisis Kesenjangan Fitur (Feature Gap Analysis) MEYYA.ID

Dokumen ini membandingkan fitur-fitur yang sudah kita buat (berupa mockup & rancangan arsitektur) dengan fitur yang diharapkan pada platform toko online komersial yang matang, serta membaginya ke dalam fase-fase pengembangan MVP untuk membantu tim teknis fokus pada prioritas yang tepat.

## Peta Fitur Saat Ini (Mockup Selesai / Tahap Perancangan)

✅ **Toko (Storefront)**
- Desain beranda yang responsif (Hero banner, kategori, carousel).
- Halaman Detail Produk dengan variasi warna/size dan gambar terkait.
- *Shopping Cart* dropdown yang rapi dengan preview.
- Kalkulasi otomatis total harga dan subtotal.

✅ **Sistem Checkout & Pengiriman**
- Sinkronisasi API wilayah untuk cek ongkos kirim.
- Memori banyak alamat (Saved addresses dengan icon dan label).
- Opsi ekspedisi yang dinamis.
- Pemilihan metode pembayaran (Manual, VA, QRIS, CC) dengan penyesuaian biaya transaksi.
- Potongan voucher diskon inline.
- Upselling produk silang saat checkout (Order bump produk spesifik bukan sekadar tickbox).
- Halaman success/pending order (Order ID, kode pembayaran unik).

✅ **Manajemen Profil & Customer**
- Login menggunakan OTP (Clerk Mock).
- Halaman Profil dengan tab Akun (Multi-Address), Status Pesanan, Riwayat.
- Keamanan routing (Blocker untuk unsaved changes).

✅ **Admin Panel (CRM & Manajemen Katalog)**
- Dashboard untuk memantau revenue (Mockup).
- Manajemen Produk (Variasi, Stock, Harga, Foto).
- Manajemen Kategori dengan thumbnail.
- Manajemen Pengguna dan CRM.
- Manajemen Voucher Diskon Dinamis (Persen, Fixed).

---

## Gap Analysis (Fitur yang Perlu Ada Untuk Skala Penuh)

Untuk menjadi platform *e-commerce* tingkat lanjut, Meyya.id membutuhkan beberapa fitur pendamping:

1. **Integrasi Payment Gateway Asli**: Memecah status *Mock* ke API asli (Midtrans / Xendit). Membaca status callback dari Webhook untuk update ke DB D1.
2. **Review & Rating System**: Memungkinkan pelanggan yang sudah menerima pesanan untuk memberikan bintang dan komentar foto.
3. **Wishlist Persistensi Server**: Saat ini wishlist baru di sisi *client/store*. Perlu sinkronisasi ke tabel `wishlists` di database.
4. **Faktur Digital & PDF**: Pembuatan *Invoice* otomatis yang dikirim ke email atau dapat diunduh di dashboard.
5. **Real-Time Inventory Tracking**: Memotong stok pada saat pembayaran berhasil atau mem-*booking* stok selama 30 menit (lock inventory) untuk transfer manual.
6. **Program Loyalti / Poin**: Mengubah nominal order menjadi *points* untuk pemotongan belanja berikutnya.
7. **Tracking Pengiriman Integrasi**: Memanggil resi JNE/J&T dsb untuk *live tracking web* agar pelanggan tidak perlu keluar web Meyya.

---

## Petaan Fase Pengembangan (MVP Phases)

### Fase 1: MVP Transaksional Inti (Siap Jualan)
*Fokus: Menerima uang riil dan melihat transaksi secara jelas.*

- [x] Selesaikan semua antarmuka UI/UX.
- [ ] Terapkan schema D1 Cloudflare sepenuhnya ke Cloudflare Pages Functions.
- [ ] Buat Integrasi API.co.id (API Ongkir) ke backend Functions.
- [ ] Integrasi Webhook Clerk ke D1 untuk membuat `user` secara otomatis.
- [ ] Simpan Order ke Database (dengan status `PENDING`).
- [ ] Admin panel membaca data dari Database riil.
- **Goal:** Anda bisa memproses penjualan dengan metode `TRANSFER BANK` secara manual (admin ubah status ke `PAID`).

### Fase 2: Otomatisasi & Pemasaran
*Fokus: Mengurangi kerja manual admin dan meningkatkan retensi klien.*

- [ ] Integrasi Xendit / Midtrans (VA & QRIS).
- [ ] WhatsApp API / Marketing Embed di Admin Dashboard (konek web.whatsapp.com untuk *blast* & *reminder* manual atau semi-otomatis).
- [ ] Sistem Resi (Tarik data pengiriman, ubah status otomatis ke `SHIPPED` via expedisi update).
- [ ] Implementasi Diskon & Voucher riil (kuota validasi di backend server).
- **Goal:** Tidak perlu memverifikasi bukti transfer dan mengirim pesan marketing menjadi lebih rapi dari satu pintu.

### Fase 3: Peningkatan Customer Experience (C-Sat & LTV)
*Fokus: Membuat pelanggan lama berbelanja kembali tanpa iklan baru.*

- [ ] Email otomatis / WhatsApp Otomatis (Abandoned Cart).
- [ ] Review dan Balasan Admin pada produk.
- [ ] Loyalty Points.
- [ ] Data analytics di dashboard (grafik LTV riil, Cohort Analysis).
- **Goal:** Ekosistem belanja siklik yang hidup sendiri.

---
Dengan ini, fokus berikutnya dari secara teknikal adalah implementasi **Fase 1**, yaitu migrasi logic Cloudflare D1.
