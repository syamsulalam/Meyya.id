# Rancangan Fitur Finansial Meyya.id

Tanggal brainstorm: 2026-05-05 03:05:40 +07:00

Tujuan fitur finansial adalah memberi gambaran sederhana tapi disiplin tentang kesehatan usaha: uang masuk, uang keluar, profit, arus kas, dan kewajiban operasional. Fitur ini sebaiknya dibuat bertahap agar tidak berubah menjadi software akuntansi berat terlalu cepat.

## Tahap 1: Statement Sederhana

Fitur awal:

- Laporan laba rugi sederhana per periode.
- Omset kotor dari order paid/completed.
- Diskon voucher.
- Ongkos kirim yang ditagihkan ke customer.
- Biaya transaksi/admin fee.
- HPP dari `order_items.hpp_at_purchase`.
- Estimasi profit kotor dan profit bersih operasional sederhana.

Output yang admin lihat:

- Omset.
- HPP.
- Gross profit.
- Biaya operasional manual.
- Net profit.
- Margin.

## Tahap 2: Debit Kredit Manual

Tambahkan buku kas sederhana:

- Tanggal transaksi.
- Jenis: pemasukan, pengeluaran, transfer internal, penyesuaian.
- Kategori: bahan baku, packaging, ongkir subsidi, ads, fee marketplace/payment, gaji, retur/refund, lain-lain.
- Nominal debit/kredit.
- Catatan.
- Lampiran bukti.

Aturan sederhana:

- Debit menaikkan aset/kas atau biaya.
- Kredit menurunkan kas atau mencatat pendapatan, tergantung kategori.
- UI tidak perlu memakai istilah akuntansi berat di awal; cukup tampilkan "Uang Masuk" dan "Uang Keluar", lalu mapping internal ke debit/kredit.

## Tahap 3: Rekonsiliasi Order

Hubungkan order dengan kas:

- Order `PAID` membuat piutang/pendapatan sementara.
- Pembayaran terkonfirmasi membuat kas masuk.
- Refund membuat kas keluar.
- Return/exchange bisa membuat adjustment stok dan biaya.
- Selisih transfer unik masuk sebagai rekonsiliasi pembayaran, bukan profit utama.

## Tahap 4: Dashboard Keputusan

Metrik yang berguna:

- Produk paling profitable.
- Kategori dengan margin paling sehat.
- Voucher yang paling banyak menggerus margin.
- Biaya packaging per order.
- Return/refund rate terhadap omset.
- Cash runway sederhana: saldo kas dibagi rata-rata biaya harian.

## Tahap 5: Guardrail Bisnis

Fitur penguatan:

- Alert jika margin order terlalu tipis.
- Alert jika voucher membuat order rugi.
- Alert jika biaya retur naik melewati ambang.
- Export CSV untuk laporan bulanan.
- Lock periode setelah laporan bulanan ditutup agar data historis tidak berubah sembarangan.

## Data Baru yang Kelak Dibutuhkan

Tabel yang disarankan:

- `finance_accounts`: daftar kas/bank/e-wallet.
- `finance_categories`: kategori pemasukan/pengeluaran.
- `finance_transactions`: transaksi debit/kredit manual dan otomatis.
- `finance_attachments`: bukti nota/transfer.
- `finance_period_closings`: penutupan periode bulanan.

Prioritas implementasi pertama:

1. Buat tab admin "Keuangan".
2. Buat input transaksi uang masuk/keluar manual.
3. Buat laporan laba rugi sederhana dari order + transaksi manual.
4. Tambah export CSV.
5. Baru setelah itu pikirkan jurnal debit/kredit yang lebih formal.

