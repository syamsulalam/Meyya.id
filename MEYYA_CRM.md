# MEYYA.ID - Customer Relationship Management (CRM) Blueprint

Dokumen ini mendeskripsikan secara mendetail rancangan sistem CRM (*Customer Relationship Management*) yang akan diintegrasikan langsung ke dalam Admin Dashboard MEYYA.ID. Tujuan pengembangan ini adalah memberikan wawasan (*insights*) berbasis data untuk meningkatkan retensi pelanggan, personalisasi pemasaran, dan profitabilitas.

---

## 1. Visi CRM MEYYA.ID

Dibandingkan menggunakan aplikasi CRM pihak ketiga yang mahal dan terpisah, MEYYA.ID akan memiliki CRM *native* ringan yang berfokus pada data *E-Commerce* yang relevan langsung dari *Cloudflare D1*. Sistem ini mengandalkan "Single Source of Truth", yakni tabel `users` yang selalu *up-to-date* karena dihubungkan dengan Clerk melalui Webhook, dipadukan dengan riwayat transaksi dari tabel `orders`.

## 2. Metrik Pelanggan Inti (The "CRM Profile")

Setiap ID Pengguna akan dikemas menjadi sebuah halaman **Profil Pelanggan** di Admin Dashboard. Profil ini akan memuat intelijen bisnis berikut:

### a. Finansial & Nilai (Value Analytics)
*   **LTV (Life Time Value):** Total Rupiah (Gross/Nett) yang pernah dibelanjakan oleh pelanggan (_Total Revenue_ pelanggan).
*   **AOV (Average Order Value):** Rata-rata nominal yang dihabiskan dalam sekali *checkout*. (LTV dibagi total order).
*   **Profit Score / Tiering:** Pengelompokan pelanggan menjadi `VIP` (Misal: LTV > Rp 5.000.000), `Regular`, atau `Bargain Hunter` (Pemburu Diskon).

### b. Kebiasaan Belanja (Shopping Habits)
*   **Hari Belanja Favorit:** Hari dalam seminggu di mana pelanggan paling sering melakukan *checkout* (berfungsi untuk menargetkan kapan *email blast* atau notifikasi promosi dikirimkan).
*   **Recency (Keterbaruan):** Kapan tanggal terakhir kali pengguna berbelanja atau *login* ke website.
*   **Cart Abandonment Rate:** Rasio antara seberapa sering ia memasukkan barang ke keranjang vs seberapa sering ia benar-benar membayar.

### c. Preferensi & Afinitas Produk (Product Affinity)
*   **Top Bought Items:** Model baju, kategori, atau warna yang paling sering dibeli oleh pengguna.
*   **Ukuran Dominan (Sizing Profile):** Ukuran (S/M/L) yang selalu konsisten dibeli, sehingga admin / CS tahu jika suatu hari ukuran tersebut rilis, email promosi bisa dilayangkan secara tertarget kepada mereka.
*   **Wishlist Correlation:** Barang apa saja yang sudah diincar (tapi belum dibeli).

### d. Sensitivitas Promosi (Discount Sensitivity)
*   **Voucher Usage Rate:** Berapa persentase transaksi pengguna ini yang *harus* menggunakan voucher.
*   **Voucher History:** Daftar spesifik kode voucher apa saja yang pernah sukses mereka klaim (contoh: "WELCOME10", "PAYDAY50").

---

## 3. Arsitektur Antarmuka (Admin UI Blueprint)

Di rute `/admin/customers`, kita akan mengembangkan dua antarmuka utama:

### A. Tabel Daftar Pelanggan (Customer Data Table)
Tabel berkinerja tinggi (lengkap dengan Filter dan *Sorting*):
| Nama Lengkap | Email | Status | Total Orders | LTV (Total Belanja) | Belanja Terakhir |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Jane Doe | jane@... | VIP ⭐️ | 12 | Rp 4.500.000 | 2 hari yang lalu |
| John Smith | john@... | Regular | 2 | Rp 550.000 | 2 bulan yang lalu |
| Anna Lee | anna@... | At Risk ⚠️ | 1 | Rp 200.000 | 8 bulan yang lalu |

### B. Detail Pelanggan (Single Customer View)
Saat tabel di-klik, admin akan masuk ke dasbor mini khusus pengguna *(The CRM Timeline)*:
1.  **Header:** Foto Profil (dari Clerk), Badge VIP/Regular.
2.  **Key Statistics (4 Kotak Angka):** Menampilkan *LTV*, *AOV*, jumlah pesanan, dan persentase pengembalian (*return rate*).
3.  **The Journey Timeline:** Umpan log aktivitas (Misalnya: "10 Mei: Mendaftar", "11 Mei: Membeli Baju X", "12 Juni: Menggunakan voucher PAYDAY").
4.  **Tabel Riwayat Pesanan Pribadi:** Detail setiap order ID millik pengguna ini.

---

## 4. Pelaksanaan Tindakan (Actionable CRM)

Melihat data saja tidak cukup. CRM ini harus bisa menghasilkan keuntungan.
Berikut adalah fitur operasionalnya:

*   **Pembuatan Segmen (User Segmentation):**
    Kita akan menyediakan fitur agar admin bisa "Export Email" untuk pelanggan-pelanggan spesifik.
    *Contoh query: Cari semua email pengguna yang Size dominannya 'M' untuk kita promosikan koleksi baju 'M' terbaru yang sedang diskon cuci gudang.*
*   **Voucher Tertarget (Targeted / Personal Vouchers):**
    Membuat kupon eksklusif yang hanya bisa dipakai (`clerk_id constraint`) oleh user tertentu. *Contoh: Membuat kupon ulang tahun `BDAY_JANE`.*
*   **Win-Back Campaigns (Menarik Kembali Pembali Lama):**
    Menyaring pengguna yang LTV-nya bagus tapi `Recency`-nya terdiam selama lebih dari 6 bulan untuk disasar menggunakan penawaran re-aktivasi.

---

## 5. Peta Jalan Pengembangan (Roadmap)

Pengembangan CRM akan dilakukan secara bertahap sejalan dengan migrasi Cloudflare:

1.  **Fase 1: Koleksi Data Dasar (Database & Sinkronisasi)** *[Sedang Berjalan]*
    *   Mengamankan Webhook Svix dari Clerk ke Cloudflare Functions.
    *   Memastikan `users`, `orders`, `order_items`, `vouchers` terkait dengan kuat melalui relasi Foreign Key berdasarkan `clerk_id`.
2.  **Fase 2: The Read-Only CRM (Dasbor Analitik Pelanggan)**
    *   Membangun UI/UX pada rute `/admin/customers` dan merancang Query Data yang rumit (Aggregate SQL) pada backend D1.
    *   Menampilkan data metrik dasar (LTV, AOV).
3.  **Fase 3: The Actionable CRM (Eksekusi Pemasaran)**
    *   Pembuatan modul pengelolaan `Vouchers` di admin.
    *   Fitur penargetan Voucher ke `clerk_id` spesifik.
    *   Integrasi Export Segmentasi ke platform *newsletter* (misalnya: Mailchimp/Brevo).

Dokumen ini akan menjadi panduan (bintang utara) kita saat menyusun logika SQL, form kueri admin, dan komponen dashboard analitik di MEYYA.ID.
