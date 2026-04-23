# Arsitektur Database MEYYA.ID (Cloudflare D1) & Integrasi API Pengiriman

Dokumen ini merangkum rancangan arsitektur Cloudflare D1 untuk aplikasi MEYYA.ID, persiapan migrasi dari Express (SQLite lokal) ke Cloudflare Pages Functions (`/functions`), serta strategi integrasi API wilayah & ongkir dari `api.co.id`.

## 1. Skema Database D1 (Update & Penambahan)

Untuk mengakomodasi fitur ekspedisi, berat produk, dan integrasi keranjang, kita perlu menambahkan beberapa kolom dan tabel baru pada skema database yang sudah ada.

### Tabel `products` (Update)
Perlu penambahan kolom `weight` (berat satuan dalam gram atau kilogram).
```sql
ALTER TABLE products ADD COLUMN weight INTEGER DEFAULT 250; -- Default 250 gram
```

### Tabel `user_addresses` (Update/Standarisasi)
Harus divalidasi dengan kode dari API Wilayah agar perhitungan ongkir akurat.
```sql
CREATE TABLE IF NOT EXISTS user_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  province_code TEXT,      -- Dari API
  province_name TEXT,
  regency_code TEXT,       -- Dari API
  regency_name TEXT,
  district_code TEXT,      -- Dari API
  district_name TEXT,
  village_code TEXT,       -- Dari API (10 digit, sangat penting untuk cek ongkir)
  village_name TEXT,
  postal_code TEXT,
  street_address TEXT,
  is_default INTEGER DEFAULT 0
);
```

### Tabel `shipping_settings` (Baru)
Untuk menyimpan konfigurasi admin (ekspedisi apa saja yang diaktifkan, misalnya JNE, Sicepat, dll) dan alamat asal (Origin) untuk penghitungan ongkir.
```sql
CREATE TABLE IF NOT EXISTS shipping_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  origin_village_code TEXT, -- Kode kelurahan toko/gudang (10 digit)
  origin_village_name TEXT,
  active_couriers TEXT      -- Format JSON array: '["JNE", "SiCepat", "SAP"]'
);
```

## 2. Migrasi ke Cloudflare Pages Functions (`/functions`)

Saat ini, MEYYA.ID menggunakan `server.ts` (Express) untuk mode *development*. Untuk men-deploy secara *serverless* menggunakan Cloudflare D1, kita akan membuat direktori `/functions/api/`.

Strukturnya akan menjadi seperti ini:
- `/functions/api/products/index.ts` -> Mengambil list produk
- `/functions/api/products/[slug].ts` -> Mengambil detail produk
- `/functions/api/shipping/cost.ts` -> Menghitung ongkir ke `api.co.id`
- `/functions/api/orders/index.ts` -> Membuat order

Di dalam environment Cloudflare, variabel D1 dibinding dengan nama `MEYYA_DB` (diakses via `env.MEYYA_DB` pada *handler* functions), dan API key menggunakan `env.API_CO_ID_KEY`.

## 3. Strategi Integrasi API.CO.ID (Wilayah & Ongkir)

Karena pemanggilan API `api.co.id` memiliki *rate limit* & kuota berbayar, kita harus menghemat panggilannya, terutama untuk data hierarki wilayah yang sifatnya **statis / jarang sekali berubah**.

### Solusi Penyimpanan Data Wilayah (Provinsi s/d Kelurahan)
Ada dua opsi ideal tanpa membebani API aslinya:
1. **JSON Statis di Codebase (`/public/data/regions/...`)**
   Kita membuat script NodeJS satu kali jalan (misal `scripts/fetch-regions.js`) yang mengunduh secara rekursif daftar Provinsi -> Kota -> Kecamatan -> Kelurahan dari API, men-sweeping data keseluruhannya, lalu menyimpannya dalam bentuk file-file JSON statis di direktori `/public`. Front-end akan langsung me-request file JSON lokal (sangat cepat, CDN cache Cloudflare gratis).
2. **Menyimpan ke Tabel D1**
   Mengemas `regencies`, `districts`, dan `villages` menjadi baris-baris ke dalam D1. Ini elegan, tapi memakan *storage/row limit* D1 secara drastis karena jumlah desa/kelurahan di Indonesia berkisar **89.000 row**.

**Rekomendasi:** Menggunakan pendekatan **Hybrid / JSON Statis** untuk UI pemilih wilayah (karena gratis, dilayani via CDN, tanpa hit ke backend), lalu *hanya* menembak `api.co.id/expedition/shipping-cost` secara langsung di *backend* untuk kalkulasi harga asli (karena harga ongkir dinamis).

### Alur Endpoint Cek Ongkir: `POST /api/shipping/calculate`
*Frontend mengirim:* `destination_village_code`, `total_weight`
*Backend Cloudflare Function:*
1. Mengambil `origin_village_code` dari setting D1 toko.
2. Memanggil `GET https://use.api.co.id/expedition/shipping-cost?origin_village_code=X&destination_village_code=Y&weight=Z` dengan header `x-api-co-id`.
3. Mem-filter response (Hapus kurir yang harganya 0, hapus ekspedisi yang tidak diaktifkan oleh admin).
4. Mengembalikan list kurir & harga final ke frontend.

---
Dalam penerapan berikutnya saya akan melakukan update untuk UI/UX terlebih dahulu (Cart Preview bertotal harga, halaman Cart yang sejenis, Form Checkout multi-step komperhensif), dan menambahkan script migrasi ke *backend* Anda!
