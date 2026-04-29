# Panduan Desain Checkout (Flawless & Painless Checkout)

Dokumen ini menjabarkan arsitektur, user experience, dan fitur dari halaman checkout untuk memastikan pengalaman belanja yang mulus, cepat, dan konversi tinggi.

## 1. Integrasi Destinasi Pengiriman Terpadu (One-Click Address)
- **Collapse Mode**: Formulir alamat pengiriman secara otomatis ter-collapse (disembunyikan ringkas) jika pengguna sudah memiliki alamat tersimpan yang terdeteksi. Hal ini membuat halaman checkout terasa jauh lebih ringkas.
- **Alamat Tersimpan (Saved Addresses)**: Pengguna (`/profil?tab=akun`) dapat menyimpan beberapa alamat dan menamainya (misal: "Rumah", "Kantor", "Apartemen") lengkap dengan pilihan *icon*. Di halaman checkout, pengguna dapat langsung memilih alamat-alamat ini sebagai destinasi tanpa perlu mengetik ulang.
- **Custom / Alamat Baru**: Opsi "Kirim ke alamat lain" (menampilkan form manual), dan tanya pengguna apakah ingin menyimpannya ke profil.
- **Anonymous Checkout (Guest)**: Jika user belum login, form alamat tampil default dan tidak ter-collapse.

## 2. Pilihan Ekspedisi Dinamis
- **Auto-Calculate**: Setelah alamat terpilih, sistem otomatis memuat jalur API kalkulasi ongkos kirim.
- **Categorized Options**: Tampilkan nama ekspedisi, estimasi hari, dan harga ongkos kirim. Sistem menyorot kurir yang dipilih dengan gaya clean (border bold).

## 3. Sistem Pembayaran Lancar (Seamless Payment)
- **Integrasi Payment Gateway**: Mendukung berbagai metode (CC, VA, QRIS).
- **Kode Unik (3 Digit Terakhir)**: Jika transfer manual, sertakan 3 nomor unik untuk kemudahan mutasi otomatis bank.

## 4. Kalkulasi Biaya Transparan (Breakdown Total)
Rincian biaya harus sangat jelas sebelum user menekan tombol bayar:
- **Subtotal Produk**
- **Ongkos Kirim**
- **Voucher Promo / Diskon**
- **Biaya Layanan / Transaction Fee**
- **Potongan/Tambahan Kode Unik** (Untuk transfer manual)
- **TOTAL BAYAR** (Angka besar dan tebal)

## 5. Fitur Tambahan Cerdas (The "Aha" Moments)
- **Voucher / Promo Dinamis**: Input voucher dan (akan datang) laci klik-langsung.
- **Produk Upsell Lintas Kategori**: Alih-alih hanya sebuah tickbox (Order Bump statis), checkout kini menampilkan deretan Produk Asli (misalnya produk lain yang serupa/sesuai atau rekomendasi "Produk lain yang mungkin Anda suka"). Terdapat tombol "Tambahkan" langsung agar AOV (Average Order Value) naik tanpa navigasi ulang.
- **Leave a Note**: Pesan tambahan opsional untuk penjual atau kurir.

## 6. Skenario Alur Pasca Checkout
1. Dialihkan ke `/order/{id}` untuk instruksi pembayaran akhir (jika Manual Transfer) atau ke Gateway link jika VA/CC.
2. Status langsung dapat dipantau di akun pengguna.

## 7. Administrasi (Backend / CRM)
- Pembayaran, order, dan ongkos kirim tercatat di backend dan dimonitor via Admin Panel.
