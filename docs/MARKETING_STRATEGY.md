# Strategi Pemasaran & Integrasi CRM (Marketing Strategy)

Aplikasi *e-commerce* seperti MEYYA.ID tidak hanya butuh sistem yang stabil untuk berjualan, tapi ekosistem retensi agar CPA *(Cost Per Acquisition)* semakin turun dan LTV *(Lifetime Value)* pelanggan naik.

Dokumen ini mendeskripsikan kerangka pemasaran di platform ini, terutama pemanfaatan **WhatsApp** secara native dari dalam ekosistem Admin, serta beberapa teknik *e-commerce growth*.

## 1. Integrasi Web WhatsApp Desktop di Admin Dashboard (The Game Changer)

Sebagian besar pelanggan lokal Indonesia sangat menyukai sentuhan personal. Dibandingkan mengirim *email blast* yang masuk folder *Promotions*, WhatsApp menawarkan *Open Rate* hingga 98%.

**Konsep Antarmuka Admin:**
1. Kita akan menanamkan sebuah tab `Marketing & Chat` di halaman `/admin`.
2. Halaman ini akan memuat elemen HTML `<iframe>` yang membuka `https://web.whatsapp.com/` di separuh layar, dan di separuh layar lainnya menampilkan **Daftar User Meyya** beserta konteks mereka (misal: "Memiliki keranjang tertinggal Rp 250k", atau "Belum melakukan pembayaran", "Berulang tahun besok").
3. **One-Click Message**: Di sebelah nama *User* di dashboard kita, terdapat tombol `Kirim Reminder`. Saat diketik, tombol ini bisa melempar URL format ke iframe (menggunakan skema `https://wa.me/62.../?text=Halo...`) yang otomatis mengisi kolom pesan WhatsApp admin dengan pesan yang di-*compose* otomatis oleh sistem.

### Use Cases (Skenario Pemasaran via WhatsApp Admin):

- **Recovery Cart Abandonment**: "Halo Kak [Nama], keranjang belanjanya di Meyya.id masih menunggu nih. Aku kasih diskon tambahan 5% ya pakai kode `MEYYABALI`, berlaku hari ini aja!"
- **Payment Reminder (Manual Transfer)**: "Hai Kak, pesanan #12345 sudah kami terima transaksinya. Boleh difotokan bukti transfernya kesini biar kita bisa lgsg packing siang ini? 😊"
- **VIP Treatment & Upsell**: "Halo Kakak VIP! Kita baru launching koleksi *Summer Silk* yang sepertinya cocok sama ukuran Kakak. Cek kesini ya kak..."
- **Review Request**: "Gimana Kak sepatunya? Kalau pas dan suka, boleh banget fotoin dan review di link ini, nanti dapat voucher 20rb!"

## 2. Dynamic Voucher & Segmentasi Pengguna (LTV Approach)

Alih-alih menyebar diskon promo di banner depan untuk *semua orang* (yang akan membunuh margin profit Anda), Anda akan menggunakan fitur Voucher Dinamis yang dikombinasikan dengan WhatsApp CRM.

- Vouchers akan diset `target_user_role` = `new_user` atau `vip`.
- Melalui tabel LTV (Life-Time Value) di CRM, Anda dapat mem-filter siapa yang berbelanja > Rp 2.000.000 dalam 3 bulan, ambil nomor mereka, lalu kirimkan Private Code `MEYYAVIP`.
- Hal ini mempertahankan loyalitas tanpa menurunkan *brand perceived value*.

## 3. Strategi Optimasi Checkout (Order Bump & AOV)

Meyya.id sudah mengadopsi mekanisme **Cross-Selling langsung (Pre-Checkout)**:
- Tepat sebelum bayar (di mana dompet pelanggan sudah "terbuka"), kita menampilkan 2-3 produk di kategori yang serupa atau pelengkap (Misal: beli Gaun, upsell Cardigan/Scrunchie). 
- Tombol **"Tambah"** langsung memasukkan barang ke *cart array* tanpa merusak aliran pembayaran pengguna. Ini meningkatkan metrik AOV *(Average Order Value)* secara drastis dengan usaha 0 dari pihak operasional.

## 4. Retargeting Eksternal & Akuisisi

Setelah pondasi kuat, konversinya dapat ditingkatkan melalui:
- **Meta Pixel & TikTok Pixel**: Pasang library pelacakan (*firing event* pada laman success) untuk melatih AI Meta agar mencari orang-orang dengan ciri khas mirip dengan VIP customer MEYYA.ID.
- **Influencer Gifting Trackable**: Daripada endorsement putus, berikan nama model ke kode voucher, misalnya `DISCOVERAYESHA`. Track dari tabel `voucher_usages` siapa *KOL / Influencer* yang memberi ROI positif tertinggi.
