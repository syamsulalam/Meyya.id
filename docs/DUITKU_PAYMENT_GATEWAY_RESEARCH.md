# Duitku Payment Gateway Research

Tanggal riset: 2026-05-05 23:57:12 +07:00

Status: riset saja, belum integrasi.

## Ringkasan

Duitku cocok untuk tahap payment gateway MEYYA karena mendukung payment request berbasis API, redirect/checkout URL, callback, dan check transaction. Integrasi sebaiknya dibuat server-side lewat Cloudflare Pages Functions agar merchant key/signature tidak pernah masuk frontend.

## Komponen Kredensial

Biasanya dibutuhkan:

- `merchantCode`
- `apiKey` atau merchant key
- environment sandbox/production endpoint

Environment variable yang nanti dibutuhkan:

- `DUITKU_MERCHANT_CODE`
- `DUITKU_API_KEY`
- `DUITKU_ENV=sandbox|production`
- `DUITKU_CALLBACK_SECRET` opsional internal jika kita ingin guard tambahan

## Flow Pembayaran Yang Disarankan

1. Customer checkout di MEYYA.
2. Server membuat order lokal dengan status `PENDING`.
3. Server memanggil Duitku Create Transaction/Payment Request.
4. Server menyimpan reference dari Duitku ke order lokal.
5. Customer diarahkan ke checkout/payment URL Duitku atau memilih payment method yang disediakan.
6. Duitku memanggil callback server MEYYA saat status berubah.
7. Server memverifikasi signature callback.
8. Server update order menjadi paid/failed/expired sesuai status.
9. Jika webhook/callback terlambat, admin atau job bisa menjalankan check transaction ke Duitku.

## Endpoint Internal Yang Nanti Dibuat

Belum dibuat sekarang, hanya rancangan:

- `POST /api/payments/duitku/create`
  Membuat transaction request ke Duitku dari order/cart.

- `POST /api/payments/duitku/callback`
  Menerima callback Duitku, verifikasi signature, update order.

- `GET /api/payments/duitku/check/:orderId`
  Admin/internal check status transaksi ke Duitku.

## Mapping Status Awal

Mapping final harus mengikuti dokumentasi status Duitku saat implementasi.

Draft mapping MEYYA:

- Success/settlement/paid dari Duitku -> `PROCESSING` atau `PAID`.
- Pending dari Duitku -> `PENDING`.
- Expired/failed/cancel -> `CANCELLED` dan release inventory reservation jika belum paid.

Catatan: order MEYYA saat ini punya inventory reservation dan expiry manual. Integrasi Duitku harus tetap memanggil logic release reservation saat transaksi expired/failed.

## Signature dan Security

Hal yang harus dijaga:

- Semua request ke Duitku dibuat server-side.
- API key tidak pernah masuk frontend.
- Callback harus verifikasi signature dari Duitku sebelum update order.
- Callback harus idempotent: callback dobel tidak boleh menggandakan stock movement, audit log penting, atau voucher usage.
- Simpan raw callback payload terbatas untuk audit, tetapi jangan menyimpan data sensitif berlebihan.
- Gunakan order id unik MEYYA sebagai `merchantOrderId`.

## Database Field Yang Mungkin Dibutuhkan

Tambahan kolom/tabel yang mungkin diperlukan nanti:

- `orders.payment_gateway`
- `orders.payment_reference`
- `orders.payment_url`
- `orders.payment_channel`
- `orders.payment_gateway_status`
- `orders.paid_at`
- `payment_events`
  - `id`
  - `order_id`
  - `gateway`
  - `event_type`
  - `reference`
  - `amount`
  - `status`
  - `signature_valid`
  - `payload`
  - `created_at`

## Risiko Integrasi

- Signature salah karena format string/hash tidak persis.
- Callback masuk lebih dari sekali.
- Customer membayar setelah order lokal expired.
- Amount mismatch karena voucher, admin fee, shipping, atau kode unik.
- Status order berubah manual oleh admin sebelum callback datang.
- Duitku sandbox dan production bisa punya base URL/key berbeda.

## Strategi Implementasi Nanti

1. Tambah payment abstraction kecil, jangan hardcode Duitku di checkout UI terlalu dalam.
2. Tambah Duitku payment method di admin payment settings.
3. Buat migration payment gateway fields.
4. Implement create transaction server-side.
5. Implement callback dengan signature verification dan idempotency.
6. Implement check transaction untuk admin/order page.
7. Test sandbox end-to-end sebelum production.

## Referensi Resmi

- Duitku API Documentation: https://docs.duitku.com/api/en/
- Duitku Create Transaction / Payment Request: https://docs.duitku.com/api/en/#create-transaction
- Duitku Callback: https://docs.duitku.com/api/en/#callback
- Duitku Check Transaction: https://docs.duitku.com/api/en/#check-transaction
- Duitku Payment Method: https://docs.duitku.com/api/en/#payment-method
