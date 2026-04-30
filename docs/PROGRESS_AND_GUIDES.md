# PROGRESS REPORT & INTEGRATION GUIDES

## 1. Status Proyek Saat Ini (Progress Report)

### ✅ Fitur yang Selesai & Terintegrasi
- **UI/UX Global**: Antarmuka modern dengan gaya *Glassmorphism*, typography elegan yang diatur secara konsisten, responsif, dan error-boundary global untuk kenyamanan (*Better UX* saat error). Scrollbar disembunyikan menggunakan CSS agar terlihat mulus.
- **State Management (Zustand)**: File `/src/store.ts` menangani data keranjang belanja (cart), wishlist, autentikasi user saat ini, dan fungsi logout.
- **Halaman Katalog & Beranda**: Pagination, filter kategori produk, efek add to wishlist, display harga produk.
- **Halaman Profil User**: Sistem multi-step form cerdas dengan auto-suggest untuk Provinsi, Kota, Kecamatan, dan Kelurahan menggunakan data konkrit. Disertai peringatan (*useBlocker*) jika mencoba berpindah halaman tanpa menyimpan data form.
- **Dashboard Admin**: Layout *unified* dengan metrik statis, manajemen produk lengkap dengan kalkulator HPP & Laba Bersih otomatis, serta pengaturan Kategori produk.
- **Autentikasi Produksi (Clerk)**: Proyek telah sepenuhnya mengadopsi `@clerk/react` secara *headless*. Logika pendaftaran email, validasi SSO Google, nomor Whatsapp, dan pengiriman kode verifikasi Email OTP bawaan Clerk bekerja menggunakan UI Kustom (*Glassmorphism*) asli rancangan kita!
- **Database Skema (D1)**: Struktur tabel dan `schema.sql` telah disiapkan dan berhasil di-_dump_ ke Cloudflare D1. Sistem siap menerima beban produksi.
- **File Storage (Cloudflare R2)**: Endpoint upload siap menghubungkan _blob_ gambar ke bucket R2 yang di set-up menggunakan custom domain.
- **Webhooks (Clerk to D1)**: Webhook telah berhasil dikonfigurasi untuk menangkap proses pembuatan user di Clerk dan mereplikasinya ke D1.
- **Deployment GitHub & Cloudflare Pages**: Sinkronisasi _Continuous Deployment_ (CD) telah sepenuhnya terikat; setiap _commit_ otomatis meluncurkan build terbaru ke production.
- **Migrasi `server.ts` ke Cloudflare Functions**: File `server.ts` saat ini hanya digunakan untuk mode Native Development Server lokal. Semua Business Logic API untuk Production (Cloudflare Pages) telah berhasil direplikasi secara utuh ke dalam map `/functions/api/...`. 

### ⏳ Fitur yang Belum Selesai (Next Steps)
Saat ini proyek siap memasuki fase _Testing_ dan _Polishing_:
- **Payment Gateway Midtrans/Stripe**: Sistem check-out pembayaran masih belum tersambung ke rekening aslinya.
- **Testing D1 Endpoints**: Lakukan Quality Assurance pada Cloudflare URL Production untuk melihat apakah semua fungsi read, write, create berjalan seperti pada environment _development_ dan atasi bug yang mungkin muncul karena perbedaan sqlite memory vs infrastruktur D1 Cloudflare Pages.

---

## 2. Penjelasan Fungsi `server.ts` vs `functions/`

**Q: `server.ts` itu gimana sih cara pakainya? Kenapa saya harus execute SQL manual di D1?**

Jawaban yang sebenarnya adalah: **Anda tidak perlu memakai `server.ts` untuk memutasi D1 Production!**

- **`server.ts` (Express Server)**: Ini adalah _Local Development Server_. File ini menggunakan `better-sqlite3` untuk menstimulasikan database SQLITE secara lokal di dalam komputer / AI Studio bernama file `meyya.db`. Ini semata-mata ada supaya lingkungan React bisa berjalan dan di test secara lokal tanpa perlu terhubung terus-menerus dengan koneksi Internet ke Cloudflare.
- **Cloudflare D1 Production Dashboard**: Database riil (`meyya_db`) yang _live_ di publik tidak memiliki interaksi apa pun dengan `server.ts`. 
- **Cara Yang Benar**: Cloudflare Pages menyajikan _Backend Serverless_ bawaan melalui map root proyek bernama `/functions`. Folder ini akan di-_compile_ oleh mesin Cloudflare menjadi _Worker Service_ yang berjalan di _edge_. Kode di dalam folder ini lah yang akan secara sah dan aman "berbicara" langsung ke D1 Anda melalui variable bawaan Cloudflare Pages rahasia bernama `env.MEYYA_DB`. 

**Kesimpulan:** Saat Anda sedang _test_ kode di AI Studio ini, Anda melihat app berinteraksi dengan **SQLite Lokal** (via `server.ts`). Saat kode di dorong (push) ke GitHub dan di Hosting ke Cloudflare Pages, `server.ts` ini **akan diabaikan sepenuhnya** oleh Cloudflare, dan Cloudflare Pages hanya mengeksekusi script yang menempati wadah folder `/functions` untuk mengeksekusi perintah SQL secara langsung ke D1.

---

## 3. Environment Variables & Rahasia (Secrets)

Di **Cloudflare Pages**, seluruh variabel rahasia wajib diunggah pada dashboard **Settings > Environment Variables**.
*Penting: Setiap kali Anda menambahkan/mengubah nilai Environment Variable di Cloudflare, proyek WAJIB DI-*REDEPLOY* agar mesin *build* Vite dapat menyuntikkannya ke dalam kode Frontend.*

- `VITE_CLERK_PUBLISHABLE_KEY`: Key publik Clerk (awalan `pk_test_...` atau `pk_live_...`). Ini variabel paling krusial di Frontend.
- `CLERK_SECRET_KEY`: Kunci ini krusial. Akan kita gunakan nanti di dalam folder `/functions/api/webhooks/clerk.ts` untuk memvalidasi *header* webhook dari Clerk.
- `MEYYA_R2_PUBLIC_URL`: URL public custom domain bucket. (*Production* Only).

---

## 4. Panduan Autentikasi dengan Clerk SDK (*Headless* & Kustom)

Aplikasi kita menolak memakai kotak *widget* bawaan Clerk UI yang dapat mencederai desain, sehingga kita memakai arsitektur **Clerk Headless React Hooks**!

Semua pengaturan terkait Clerk terletak di file `src/main.tsx` dan antarmuka interaksinya di `src/pages/Auth.tsx`.

### 1. Fitur OTP Email (Kata Sandi Sekali Pakai)
Kita mengimplementasikan fitur OTP langsung melalui metode email. 
- Saat pelanggan `Daftar`, sistem menyerap Nama, Email, Password, dan no WA.
- Sistem menggunakan fungsi lanjutan `signUp.prepareEmailAddressVerification` untuk memaksa OTP ke email pelanggan.
- Jendela Form login berubah manis menampilkan Kotak **"Kode OTP"** tanpa memuat halaman baru.
- Sistem menggunakan `signUp.attemptEmailAddressVerification` dan pengguna akan divalidasi dengan aman.

### 2. Format *Country Code* (+62) WhatsApp ke dalam Unsafe-Metadata
Untuk menyimpan **No WhatsApp**, clerk bawaan hanya mengenal mekanisme SMS standar. Karena kita hanya sebatas butuh mengumpulkan nomor WA sebagai perantara *customer service*, form merapikan masukan dari pelanggan (menghilangkan awalan `0` atau `62`), menyisipkan `+62` sebagai *country_code*, lalu menyetorkannya ke Clerk *Cloud* menggunakan fitur `unsafeMetadata`:
```typescript
unsafeMetadata: { whatsapp: "+6281234567890" }
```
Data ini akan tersimpan permanen di riwayat rekam tiap pengguna pada Dashboard Clerk Anda.

### 3. SSO Cepat (Google)
Kolom masuk juga dibumbui oleh klik tunggal via fungsi `signIn.authenticateWithRedirect({ strategy: "oauth_google" })`.

### ⚠️ PERBAIKAN UMUM YANG SERING DITANYAKAN:
* "Kok Klik Tombol tidak terjadi apa-apa?" -> Kunci rahasia publik belum termuat. Anda harus menyetel Variabel Cloudflare (`VITE_CLERK_PUBLISHABLE_KEY`) lalu melakukan *Retry Deployment*.

---

## 5. Panduan Pemula Integrasi Cloudflare D1 (Database SQL Serverless)

Cloudflare D1 adalah *Database SQL* serverless berkinerja tinggi yang berada satu atap dengan Cloudflare Pages Anda.

**Langkah 1: Membuat Database D1**
1. Buka dashboard Cloudflare, buka menu **Workers & Pages > D1 SQL Database**.
2. Klik *Create*, beri nama (misal: `meyya_db`).

**Langkah 2: Mengikat ke Cloudflare Pages Anda**
1. Pada proyek Cloudflare Pages Anda > masuk ke **Settings > Functions**.
2. Gulir ke bagian **D1 database bindings**.
3. *Variable name*: MEYYA_DB
4. *D1 Database*: (Pilih nama DB `meyya_db`).

**Langkah 3: Mendapatkan dan Mengatur Skema Tabel (Schema)**
Jika Anda menggunakan D1 Cloudflare Console di Website, cukup _copy-paste_ semua struktur mentah yang ada di `/schema.sql`.

**Langkah 4: Menangkap Data Melalui Pages Functions (Backend Minimalis)**
Uraikan batas *fontend* Anda dengan membakar API sederhana dalam map bernamakan `/functions` (harus di area *root*, sejajar dengan `package.json` Anda). Misalnya `functions/api/categories.js` (ini yang akan menjadi Next Step kita di sistem!).

```typescript
export async function onRequestGet(context) {
  // `context.env.MEYYA_DB` mengambil data table berdasarkan binding di Langkah 2.
  const { results } = await context.env.MEYYA_DB.prepare(
    "SELECT * FROM categories"
  ).all();
  
  return Response.json(results);
}
```
Lalu dari komponen React Admin Anda, ganti status penampungan *mock data* dengan proses ambil (*fetch*):
```typescript
fetch('/api/categories').then(res => res.json()).then(data => setCategories(data));
```
