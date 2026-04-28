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

## 2. Skema Database D1 (Fitur CRM & Analitik)

Untuk mendukung fitur **Customer Relationship Management (CRM)** di Dashboard Admin MEYYA.ID, kita membutuhkan tabel yang tersinkronisasi via Webhook Clerk, agar admin bisa menganalisis siklus hidup pelanggan (LTV), preferensi belanja, hingga penggunaan diskon.

### Tabel `users` (Sinkronisasi Webhook Clerk)
Menyimpan identitas dasar, wajib diisi saat user mendaftar.
```sql
CREATE TABLE IF NOT EXISTS users (
  clerk_id TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login_at DATETIME -- Opsional, diupdate via webhook session.created jika ada
);
```

### Tabel `orders` (Diperluas untuk CRM)
Tabel Orders yang sudah ada perlu memastikan kolom-kolom kalkulasi tersedia untuk dianalisis oleh CRM.
```sql
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  clerk_id TEXT, -- Relasi ke users.clerk_id
  status TEXT, -- 'PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELED'
  subtotal numeric,
  shipping_cost numeric,
  discount_amount numeric DEFAULT 0,
  total_amount numeric,
  voucher_id TEXT, -- Relasi ke tabel vouchers
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (clerk_id) REFERENCES users(clerk_id)
);
```

### Tabel `vouchers` & `voucher_usages` 
Melacak kupon yang dibuat admin dan penggunaannya.
```sql
CREATE TABLE IF NOT EXISTS vouchers (
  code TEXT PRIMARY KEY, -- misal: 'WELCOME20', 'SALE50'
  discount_type TEXT, -- 'PERCENTAGE' atau 'FIXED'
  discount_value numeric,
  min_purchase numeric DEFAULT 0,
  max_discount numeric,
  valid_from DATETIME,
  valid_until DATETIME,
  usage_limit INTEGER -- Kuota total (misal 100x pakai)
);

CREATE TABLE IF NOT EXISTS voucher_usages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  voucher_code TEXT,
  clerk_id TEXT,
  order_id TEXT,
  used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (voucher_code) REFERENCES vouchers(code),
  FOREIGN KEY (clerk_id) REFERENCES users(clerk_id)
);
```

## 3. Strategi Analitik CRM (Dashboard Admin LTV & Preferensi)

Dengan skema database di atas, backend Admin Dashboard Anda bisa menjalankan SQL untuk melihat perilaku belanja (`Habits`) dan metrik bisnis (`LTV`) per user.

1. **LTV (Life Time Value) dan Estimasi Income:**
   Didapatkan dengan menjumlahkan seluruh `orders.total_amount` dari seorang `clerk_id`  dengan status `DELIVERED` atau `PAID`.
   ```sql
   SELECT clerk_id, COUNT(id) as total_orders, SUM(total_amount) as LTV 
   FROM orders WHERE status = 'DELIVERED' GROUP BY clerk_id;
   ```

2. **Kebiasaan Belanja (Hari Favorit & Waktu Transit):**
   Menganalisa kebiasaan hari dengan menggunakan fungsi tanggal SQLite:
   ```sql
   -- Mencari hari terbanyak user berbelanja (0=Minggu, 1=Senin, dst)
   SELECT strftime('%w', created_at) as day_of_week, COUNT(*) as counts 
   FROM orders WHERE clerk_id = 'user_abc' GROUP BY day_of_week ORDER BY counts DESC LIMIT 1;
   ```

3. **Produk Favorit (Most Bought Items):**
   Dengan menggabungkan (`JOIN`) tabel `orders`, `order_items`, dan `products`.
   ```sql
   SELECT p.name, COUNT(oi.product_id) as freq 
   FROM order_items oi
   JOIN orders o ON oi.order_id = o.id
   JOIN products p ON oi.product_id = p.id
   WHERE o.clerk_id = 'user_abc' AND o.status = 'DELIVERED'
   GROUP BY oi.product_id ORDER BY freq DESC LIMIT 5;
   ```

Melalui desain D1 ini, dashboard admin Meyya.id tidak perlu melakukan ribuan permintaan ke Clerk API; Anda cukup menarik semuanya dari Database MEYYA secara relasional dan instan.

## 4. Migrasi ke Cloudflare Pages Functions (`/functions`)

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
