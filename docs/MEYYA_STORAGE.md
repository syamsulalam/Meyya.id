# Cloudflare R2 & Cloudinary Storage Strategy for MEYYA

## Overview
Dalam operasional toko online, penyimpanan gambar produk dan aset visual lainnya sangat penting. Untuk menekan biaya, kita memanfaatkan **Cloudflare R2** (yang memiliki free tier sangat besar dan egress gratis) sebagai penyimpanan utama. 

## R2 Free Tier
- **Storage:** 10 GB per bulan
- **Class A Operations (Mutasi/Upload/Delete):** 1 juta request / bulan
- **Class B Operations (Read/Download):** 10 juta request / bulan

## Strategi Penggunaan R2
1. **Fase Awal (Fokus saat ini):** Semua upload gambar dari admin akan dikirimkan ke endpoint `POST /api/upload` yang secara langsung akan mengunggah gambar tersebut ke bucket Cloudflare R2. URL public dari R2 akan disimpan di database D1.
2. **Kompabilitas Lokal:** Selama development (menggunakan Express Server lokal), endpoint upload akan menggunakan `multer` untuk menyimpan file visual secara lokal ke dalam direktori `public/uploads`.
3. **Fase Lanjutan:** Cloudflare R2 tidak otomatis melakukan kompresi gambar (seperti WebP/AVIF). Di masa depan, kita bisa mengaktifkan _Cloudflare Image Resizing_ atau menghubungkan R2 bucket sebagai source di _Cloudinary_ untuk otomatisasi kompresi secara gratis.

## Implementasi API Upload (Cloudflare Pages Function + R2)
### Step by Step Koneksi R2 dengan meyya.id / Public Domain

Agar public URL dari gambar yang diupload ke R2 bisa dinamis dan terhubung dengan domain yang kamu mau tanpa perlu edit code di `upload.ts` secara manual, ikuti langkah berikut di Dashboard Cloudflare:

1. **Buat Bucket R2:**
   - Masuk ke Cloudflare Dashboard > R2.
   - Buat bucket, misal bernama `meyya-assets`.
2. **Setup Public Access (Custom Domain):**
   - Masuk ke pengaturan bucket `meyya-assets`.
   - Pilih menu **Settings** > **Public Access** > **Custom Domains**.
   - Klik **Connect Domain** dan masukkan nama domain / subdomain kamu, contoh: `assets.meyya.id`. (Pastikan domain meyya.id sudah dikelola DNS nya di Cloudflare).
   - Tunggu proses sertifikat SSL dan DNS selesai. Sekarang kamu punya URL public seperti `https://assets.meyya.id`.
   - _(Opsi lain jika belum punya domain custom)_: Aktifkan "R2.dev subdomain" untuk mendapatkan URL acak tapi gratis seperti `https://pub-xxxxxx.r2.dev`.
3. **Binding R2 ke Cloudflare Pages:**
   - Masuk ke aplikasi Cloudflare Pages (atau Cloudflare Workers) kamu.
   - Pergi ke menu **Settings** > **Functions** > **R2 bucket bindings**.
   - Tambahkan binding:
     - **Variable name:** `MEYYA_R2`
     - **R2 bucket:** `meyya-assets` (nama bucket yang dibuat di langkah 1)
4. **Setup Environment Variable untuk URL:**
   - Di menu yang sama pada Cloudflare Pages, buka **Settings** > **Environment variables**.
   - Tambahkan variable baru untuk environment *Production*:
     - **Variable name:** `MEYYA_R2_PUBLIC_URL`
     - **Value:** `https://assets.meyya.id` (URL public dari langkah 2, tanpa trailing slash di akhir).

Dengan konfigurasi di atas, script `/functions/api/upload.ts` akan otomatis membaca URL base tersebut, memproses gambar, dan menyimpannya langsung ke database dengan kombinasi domain yang valid.

### Kompabilitas Lokal (Local Development):
Selama development di AI Studio (menggunakan Express Server lokal `server.ts`), endpoint upload akan menggunakan `multer` untuk menyimpan file visual secara lokal ke dalam direktori `/public/uploads`.
Maka dari itu script di dalam `server.ts` meng-emulasi endpoint upload yang sama dengan membalikkan local route url.

## Placeholder Gambar
Bagi produk atau kategori yang belum memiliki gambar, komponen frontend akan me-render frame placeholder sederhana (berbasis CSS) dengan icon/monogram, alih-alih me-render tag `img` yang rusak (broken link).
