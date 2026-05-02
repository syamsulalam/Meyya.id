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
