# Laporan Bug & Analisis: Data Produk Tidak Muncul di Situs Live (meyya.id)

## Deskripsi Bug
Pada tahap deployment sebelumnya, ditemukan masalah di mana produk tidak muncul di katalog homepage (menampilkan pesan fallback "Koleksi Sedang Disiapkan") dan list produk di admin panel kosong untuk versi live di `https://meyya.id`, meskipun di *preview environment* semuanya berjalan normal.

Melalui tangkapan log dan `Debug Info` yang dikirim, diketahui pesannya adalah `"message": "Response is not an array"` dengan respons data API yang berbentuk sebuah *object JSON* berisi key `"products"`, bukan sekadar Array biasa (sebagaimana diharapkan dan dites di backend Express lokal). 

Ini berarti API respons berbentuk:
```json
{
  "products": [ { "id": 1, "name": "..." }, ... ]
}
```
Sedangkan komponen `Home.tsx` dan `AdminProductForm.tsx` berekspektasi bahwa struktur datanya adalah root array asli:
```json
[ { "id": 1, "name": "..." }, ... ]
```

## Penyebab Utama
1. **Konflik File Routing Cloudflare Pages:** Pada struktur folder `functions` untuk Cloudflare Pages, terdapat file `functions/api/products.ts` dan juga tersisa file lawas `functions/api/products/index.ts`. Konflik routing ini bisa terjadi ketika platform mendeploy URL path `/api/products` dan secara tidak sengaja memanggil file `index.ts` versi lama yang mengirimkan *wrapped object* `{ products: results }`.
2. **Kerapuhan di sisi Frontend (Unresilient Fetching):** Frontend (React) mem-parsing output JSON dari HTTP call secara kaku. Ketika array di-wrap di dalam key `data.products` atau `data.categories`, `Array.isArray(data)` me-return `false` dan langsung melempar fallback (kosong, lalu me-trigger "Sedang Menyiapkan Koleksi").

## Solusi yang Diterapkan
1. **Pembersihan Routing API:** Memastikan struktur *serverless function* (Backend API) konsisten dengan standarisasi format Array. Menghapus file duplikat `/functions/api/products/index.ts` agar `/api/products` mengarah murni ke file `functions/api/products.ts` terbaru.
2. **Robustness di Frontend (Data Normalization):**
   - Mengubah logic pengambilan data (`useEffect` di `Home.tsx` dan global `fetcher` SWR di `AdminProductForm.tsx` & `AdminCategoryManager.tsx`).
   - Apabila response API berbentuk `Array` secara native, proses seperti biasa.
   - Apabila response adalah Object yang memuat root key spesifik (seperti `data.products` atau `data.categories` dan mereka adalah Array), maka secara implisit ekstrak array tersebut (Fallback Normalize Data).
   - Dengan sistem *fallback* yang fleksibel ini, UI Frontend tidak akan rentan patah / crash meskipun Backend mengubah *envelope* format JSON-nya di kemudian hari.

Bug telah ditutup dan sistem telah diperbarui untuk mendukung format *Array / Object Object-Wrapped Arrays*. Silakan di-deploy (push) ke repository agar ter-apply ke versi produksi.

---

## Tambahan: Laporan Error Database D1 (2 Mei)
Berdasarkan log terbaru, terdapat *Secondary Bug* untuk live site `meyya.id`:
```
API return error: 500 - {"error":"D1_ERROR: no such table: product_attributes: SQLITE_ERROR"}
```
**Penyebab Utama:** Sering terjadi dalam Cloudflare D1 bahwa tabel-tabel baru / alter tabel yang dibuat di sistem pengembangan lokal (Dev Environment) belum termigrasi / ter-*apply* ke database produksi D1 (`meyya-db` / database langsung di remote). Beberapa tabel yang dibutuhkan aplikasi saat ini namun menghilang di produksi adalah: `category_attributes`, `product_attributes`, `product_colors`, and `product_sizes`.

Selain itu, Bug "Failed to execute 'text' pada 'Response': body stream already read" terjadi ketika Frontend mencoba me-render JSON error menggunakan fallback `.text()` untuk logging, namun *stream body HTTP* sudah dibaca dari function `.json()`. Ini sudah kita perbaiki pada codebase saat ini (`AdminProductForm.tsx` dkk).

### Langkah Tindakan yang Perlu Dilakukan Untuk Admin:
Karena perbaikan schema (Tabel Ekstra) berada di sisi **database produksi** (D1) Cloudflare (yang tidak otomatis terupdate setiap kali frontend dideploy), silakan jalankan query migrasi ini melalui Dashboard Cloudflare Anda (Worker & Pages > D1 > Pilih Database > Console):

```sql
-- Jalankan berturut-turut di Console Database D1 via Cloudflare Dashboard
CREATE TABLE IF NOT EXISTS product_colors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  color_name TEXT NOT NULL,
  hex_code TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_sizes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  size_name TEXT NOT NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS category_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category_id INTEGER,
  name TEXT NOT NULL,
  options TEXT,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS product_attributes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  attribute_name TEXT NOT NULL,
  attribute_value TEXT,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Pastikan tabel categories dan products memiliki metadata varian (abaikan kalau error already exist)
ALTER TABLE categories ADD COLUMN has_colors BOOLEAN DEFAULT 0;
ALTER TABLE categories ADD COLUMN has_sizes BOOLEAN DEFAULT 0;
ALTER TABLE products ADD COLUMN is_preorder BOOLEAN DEFAULT 0;
```

Setelah Schema ter-update di dashboard D1, error 500 `product_attributes` akan hilang.
