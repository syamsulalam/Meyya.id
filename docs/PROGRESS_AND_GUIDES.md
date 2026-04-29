# PROGRESS REPORT & INTEGRATION GUIDES

## 1. Status Proyek Saat Ini (Progress Report)

### ✅ Fitur yang Selesai & Terintegrasi
- **UI/UX Global**: Antarmuka modern dengan gaya *Glassmorphism*, typography elegan yang diatur secara konsisten, responsif, dan error-boundary global untuk kenyamanan (*Better UX* saat error). Scrollbar disembunyikan menggunakan CSS agar terlihat mulus.
- **State Management (Zustand)**: File `/src/store.ts` menangani data keranjang belanja (cart), wishlist, autentikasi user saat ini, dan fungsi logout.
- **Halaman Katalog & Beranda**: Pagination, filter kategori produk, efek add to wishlist, display harga produk (*mock* data).
- **Halaman Profil User**: Sistem multi-step form cerdas dengan auto-suggest untuk Provinsi, Kota, Kecamatan, dan Kelurahan menggunakan data konkrit. Disertai peringatan (*useBlocker*) jika mencoba berpindah halaman tanpa menyimpan data form.
- **Dashboard Admin**: Layout *unified* dengan metrik statis, manajemen produk lengkap dengan kalkulator HPP & Laba Bersih otomatis, serta pengaturan Kategori produk.
- **Autentikasi Produksi (Clerk)**: **[BARU!]** Proyek telah sepenuhnya mengadopsi `@clerk/react` secara *headless*. Logika pendaftaran email, validasi SSO Google, nomor Whatsapp, dan pengiriman kode verifikasi Email OTP bawaan Clerk bekerja menggunakan UI Kustom (*Glassmorphism*) asli rancangan kita!

### ⏳ Fitur yang Belum Selesai (Membutuhkan Backend/Pihak Ketiga)
Saat ini proyek masih berbentuk *Static Front-End* sebagian.
- **Database Inventori & Profil Real**: Rekaman *Cart*, *Order*, *Produk Baru*, *Kategori* dan *Alamat Form* belum disimpan permanen ke server.
- **Payment Gateway Midtrans/Stripe**: Sistem check-out pembayaran masih belum tersambung ke rekening aslinya.

---

## 2. Environment Variables & Rahasia (Secrets)

Di **Cloudflare Pages**, seluruh variabel rahasia wajib diunggah pada dashboard **Settings > Environment Variables**.
*Penting: Setiap kali Anda menambahkan/mengubah nilai Environment Variable di Cloudflare, proyek WAJIB DI-*REDEPLOY* agar mesin *build* Vite dapat menyuntikkannya ke dalam kode Frontend.*

- `VITE_CLERK_PUBLISHABLE_KEY`: Key publik Clerk (awalan `pk_test_...` atau `pk_live_...`). Ini variabel paling krusial di Frontend.
- `CLERK_SECRET_KEY`: Variabel ini **jaga kerahasiaannya**. Hanya diperlukan kelak saat merakit server / *Cloudflare Workers* / *Backend API*.

---

## 3. Panduan Autentikasi dengan Clerk SDK (*Headless* & Kustom)

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

## 4. Panduan Pemula Integrasi Cloudflare D1 (Database SQL Serverless)

Cloudflare D1 adalah *Database SQL* serverless berkinerja tinggi yang berada satu atap dengan Cloudflare Pages Anda.

**Langkah 1: Membuat Database D1**
1. Buka dashboard Cloudflare, buka menu **Workers & Pages > D1 SQL Database**.
2. Klik *Create*, beri nama (misal: `meyya_db`).

**Langkah 2: Mengikat ke Cloudflare Pages Anda**
1. Pada proyek Cloudflare Pages Anda > masuk ke **Settings > Functions**.
2. Gulir ke bagian **D1 database bindings**.
3. *Variable name*: MEYYA_DB
4. *D1 Database*: (Pilih nama DB `meyya_db`).

**Langkah 3: Membuat Tabel (Schema)**
Di dashboard Cloudflare (atau terminal lokal via wrangler), Anda bisa mengeksekusi kode SQL pembuatan tabel:
```sql
CREATE TABLE categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL
);
```

**Langkah 4: Menangkap Data Melalui Pages Functions (Backend Minimalis)**
Uraikan batas *fontend* Anda dengan membakar API sederhana dalam map bernamakan `/functions` (harus di area *root*, sejajar dengan `package.json` Anda). Misalnya `functions/api/categories.ts`:

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
