# Dokumentasi Integrasi api.co.id

Dokumen ini adalah ringkasan API yang akan digunakan oleh MEYYA.ID untuk menghitung ongkos kirim dan mengambil daftar wilayah administratif Indonesia.

Base URL Endpoint:
- **Expedition / Shipping** : `https://use.api.co.id/expedition`
- **Wilayah** : `https://use.api.co.id/regional/indonesia`

Autentikasi:
Semua limit dan akses diidentifikasi lewat Header: `x-api-co-id: <API_KEY>`

---

## 1. Regional API (Data Wilayah)

Berfungsi untuk mengambil data berjenjang (dari Provinsi hingga Kelurahan/Desa) untuk mendapatkan `10-digit village_code`. Kode kelurahan ini **wajib** ada saat kita melakukan pencarian ongkir nanti. 

*Catatan Arsitektur: Kita lebih baik men-cache (fetch one-time) seluruh ID ini menjadi data `.json` statis ke dalam project React untuk menghemat panggilan API (mencegah limit).*

### Endpoints (GET)
- **`/provinces`**
  Mendapatkan daftar provinsi.
- **`/provinces/:code/regencies`**
  Mendapatkan daftar kota/kabupaten di dalam sebuah provinsi (berdasarkan 2 digit kode provinsi).
- **`/regencies/:code/districts`**
  Mendapatkan daftar kecamatan di sebuah kota/kabupaten (berdasarkan 4 digit kode kabupaten).
- **`/districts/:code/villages`**
  Mendapatkan daftar desa/kelurahan di sebuah kecamatan (berdasarkan 6 digit kode kecamatan). Mengembalikan data kelurahan yang berisi **10 digit code**.

Contoh Respon Village:
```json
{
  "code": "1101010001",
  "name": "LATIUNG",
  "district_code": "110101",
  "postal_codes": ["23891"]
}
```

---

## 2. Expedition API (Cek Ongkos Kirim)

Befungsi membandingkan harga berbagai jasa ekspedisi.

- **Endpoint:** `GET /expedition/shipping-cost`
- **Query Parameters:**
  - `origin_village_code` *(required)*: 10-digit kode kelurahan AWAL (Alamat Toko MEYYA.ID).
  - `destination_village_code` *(required)*: 10-digit kode kelurahan TUJUAN (Alamat Pelanggan).
  - `weight` *(required)*: Berat paket dalam hitungan **Kilogram** (Float diperbolehkan, misal 0.5 untuk 500 gram, minimal harus > 0).

**Contoh Request:**
```
GET https://use.api.co.id/expedition/shipping-cost?origin_village_code=3172051003&destination_village_code=3204282004&weight=1
```

**Contoh Response:**
```json
{
  "status": "success",
  "result": [
    {
      "courier_code": "JNE",
      "courier_name": "JNE Express",
      "price": 12000,
      "weight": 1,
      "estimation": "1 - 2 days"
    },
    {
      "courier_code": "SiCepat",
      "courier_name": "SiCepat Express",
      "price": 11000,
      "weight": 1,
      "estimation": "2 - 3 Days"
    }
  ]
}
```

**Perlakuan di Cloudflare Function Backend:**
1. Menerima request dari frontend (`destination_village_code`, `total_weight`).
2. Tarik parameter `origin_village_code` toko dari database tabel `shipping_settings`.
3. Tembak `api.co.id`.
4. Saring (filter) hanya kurir yang didukung MEYYA (ada di dalam `shipping_settings.active_couriers`), dan buang yang harganya = 0.
5. Lempar kembali `result` ke web client.
