# Panduan Desain Checkout (Flawless & Painless Checkout)

Dokumen ini menjabarkan arsitektur, user experience, dan fitur dari halaman checkout untuk memastikan pengalaman belanja yang mulus, cepat, dan konversi tinggi.

## 1. Integrasi Destinasi Pengiriman Terpadu (One-Click Address)
- **Default Profile Address**: Saat user masuk ke halaman checkout, sistem langsung menarik alamat utama dari profil mereka (`/profil?tab=akun`).
- **Alamat Tersimpan (Saved Addresses)**: Jika user memiliki lebih dari satu alamat (misal: "Rumah", "Kantor"), sediakan carousel kecil atau dropdown elegan untuk switch dengan cepat.
- **Custom / Alamat Baru**: Opsi "Kirim ke alamat lain" (menampilkan modal/popup inline) yang form-nya simpel (auto-detect kelurahan/kecamatan via kodepos jika memungkinkan), dan tanya user apakah ingin menyimpannya ke profil.
- **Anonymous Checkout (Guest)**: Jika user belum login, form alamat tampil default, namun di akhir form ada checkbox opsional: "Buat akun untuk melacak pesanan".

## 2. Pilihan Ekspedisi Dinamis
- **Auto-Calculate**: Setelah alamat terpilih, sistem (melalui API RajaOngkir / Biteship / sejenisnya) langsung mengkalkulasi opsi pengiriman.
- **Categorized Options**: Jangan tampilkan 20 opsi ekspedisi yang membingungkan. Kelompokkan menjadi:
  - *Reguler* (2-3 hari) - Contoh: JNE Reg, SiCepat Halu, dll. Diurutkan dari yang termurah.
  - *Next Day / Express* (1 hari) - Contoh: JNE YES, SiCepat BEST.
  - *Instan / Same Day* (Tersedia jika dalam satu cakupan kota).
- **Tampilan UI**: Tampilkan nama ekspedisi, estimasi hari, dan harga ongkos kirim. Pengguna dapat memilih tipe, lalu sistem merekomendasikan layanan terbaik/termurah di kategori tersebut.

## 3. Sistem Pembayaran Lancar (Seamless Payment)
- **Integrasi Payment Gateway**: Terhubung langsung dengan Midtrans atau Xendit.
- **Metode Pembayaran Inline**:
  - **QRIS**: Tampilkan langsung kode QR di halaman konfirmasi/pembayaran (tanpa redirect jauh).
  - **Virtual Account (VA)**: BCA, Mandiri, BNI, BRI.
  - **Credit Card**: Inline form (embedded iframe dari payment gateway agar aman tanpa meninggalkan situs).
  - **E-Wallets**: GoPay, ShopeePay (auto-redirect ke app).
- **Kode Unik (3 Digit Terakhir)**: Jika menggunakan metode Transfer Bank manual, total harga dikurangi (atau ditambah) 3 digit terakhir ID pesanan sebagai kode unik verifikasi otomatis. Contoh: Total Rp 250.000 menjadi Rp 250.123 (jika ditambah) atau Rp 249.877 (jika dikurangi).

## 4. Kalkulasi Biaya Transparan (Breakdown Total)
Rincian biaya harus sangat jelas sebelum user menekan tombol bayar:
- **Subtotal Produk**: `Rp XXX.XXX`
- **Biaya Kemasan (Gift Box)**: `+ Rp XX.XXX` (Jika opsi ini dipilih pada salah satu produk)
- **Ongkos Kirim**: `+ Rp XX.XXX` (Otomatis berdasarkan berat & alamat)
- **Voucher Promo / Diskon**: `- Rp XX.XXX` (Ditampilkan jika kode voucher valid diaplikasikan)
- **Biaya Layanan / Transaction Fee**: `<Tooltip>` (Tergantung metode bayar, misalnya Kartu Kredit 2.9%, QRIS 0.7%, ini opsional dibebankan ke user atau ditanggung merchant, disarankan ditutup dalam harga jual atau flat fee wajar `+ Rp 2.500`-`5.000` via payment gateway).
- **Potongan Kode Unik**: `- Rp 123` (Untuk transfer manual)
- **TOTAL BAYAR**: `Rp YYY.YYY` (Angka besar dan tebal)

## 5. Fitur Tambahan Cerdas (The "Aha" Moments)
- **Voucher / Promo Dinamis**: 
  - Tampilkan list voucher "Yang Bisa Anda Pakai" langsung di checkout.
  - User tidak perlu menebak kode. Voucher dapat di-click/apply.
  - Diskon ulang tahun, diskon member baru, diskon ongkir min. belanja, dll.
- **Order Bump (Upsell Checkbox)**: "Tambahkan Scrunchie Premium hanya Rp 15.000!" Tampilkan satu atau dua item pelengkap kecil tepat di atas total harga. (Meningkatkan AOV - Average Order Value).
- **Leave a Note (Pesan Tambahan)**: Input text untuk notes ke kurir/admin.

## 6. Skenario Alur Pasca Checkout
1. **Sukses**: User dialihkan ke halaman `/profil?tab=status` (atau `/order/success/{id}`) dengan animasi perayaan (confetti ringan), detail status ("Menunggu Pembayaran", atau "Diproses" jika bayar lunas otomatis seperti CC/E-Wallet).
2. **Gagal/Dibatalkan**: User dikembalikan ke halaman checkout dengan error message jelas, cart tidak terhapus.
3. **Pending (Transfer VA/Manual)**: Halaman menampilkan instruksi pembayaran, batas waktu bayar (countdown), dan tombol "Saya Sudah Transfer" (jika manual) atau "Cek Status Pembayaran" (jika gateway otomatis).

## 7. Administrasi (Backend / CRM)
- Admin membutuhkan dashboard khusus untuk manajemen Voucher (Create, Delete, Limit Usage, Bind to specific Email/Role).
- Ini sudah direncanakan dalam mock-up UI Admin Voucher Manager terbaru.
