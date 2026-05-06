import { HelpCircle } from 'lucide-react';
import type { ReactNode } from 'react';
import Tooltip from './Tooltip';

type TermTooltipProps = {
  position?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
};

function TermHint({ content, position = 'top', className = '' }: TermTooltipProps & { content: string }) {
  return (
    <Tooltip content={content} position={position} className={className}>
      <span
        role="note"
        tabIndex={0}
        aria-label="Lihat penjelasan"
        className="inline-flex h-4 w-4 items-center justify-center rounded-full text-black/35 hover:text-ink focus:outline-none focus:ring-2 focus:ring-black/10"
      >
        <HelpCircle size={13} />
      </span>
    </Tooltip>
  );
}

export function ExplainedLabel({ children, tooltip, className = '' }: { children: ReactNode; tooltip: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 ${className}`}>
      {children}
      {tooltip}
    </span>
  );
}

export const HelicopterViewTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Ringkasan cepat seluruh bisnis: penjualan, profit, stok, pelanggan, dan pesanan penting dalam satu layar." />
);

export const TimelineFilterTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Mengubah periode angka dashboard. Semua Waktu menghitung data sejak toko mulai mencatat pesanan." />
);

export const NetProfitTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Estimasi laba dari item terjual: harga jual dikurangi HPP/modal produk. Belum memasukkan biaya operasional lain seperti iklan atau gaji." />
);

export const RevenueTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Total nilai pesanan valid sebelum dikurangi modal barang dan biaya operasional eksternal." />
);

export const LowStockTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Produk yang stoknya sama atau di bawah batas minimum. Batasnya bisa diatur di form produk." />
);

export const ProductMarginTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Produk dengan kontribusi profit terbesar berdasarkan histori order dan HPP yang tersimpan." />
);

export const CrmTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="CRM adalah pusat data pelanggan: riwayat belanja, nilai belanja, kebiasaan, dan sinyal untuk follow-up marketing." />
);

export const LtvTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Lifetime Value: total nilai belanja pelanggan yang sudah masuk status valid seperti paid, processing, shipped, atau completed." />
);

export const AovTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Average Order Value: rata-rata nilai satu pesanan pelanggan. Rumusnya LTV dibagi total order valid." />
);

export const ReturnRateTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Persentase request retur/exchange dibanding total order pelanggan. Membantu melihat risiko kepuasan atau sizing." />
);

export const AbandonedCartTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Sinyal pelanggan pernah update keranjang tetapi belum checkout/order setelah beberapa jam. Cocok untuk reminder personal." />
);

export const BirthdayTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Sinyal dari tanggal lahir pelanggan. Bisa dipakai untuk campaign atau voucher ulang tahun." />
);

export const CampaignTouchTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Jumlah follow-up marketing yang dicatat sistem, misalnya saat admin membuka WhatsApp dari panel marketing." />
);

export const D1Tooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Cloudflare D1 adalah database produksi situs. Data admin, order, pelanggan, voucher, dan konfigurasi disimpan di sini." />
);

export const DebugDataTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Menampilkan data mentah untuk debugging admin. Jangan dibagikan karena bisa berisi data pelanggan." />
);

export const SegmentTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Label kelompok pelanggan, misalnya VIP, NEW_USER, atau RETENTION. Dipakai untuk targeting promo dan campaign." />
);

export const ClerkIdTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="ID unik user dari Clerk. Dipakai jika voucher hanya boleh berlaku untuk satu akun tertentu." />
);

export const QrisTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="QRIS adalah pembayaran lewat scan QR. Di sistem ini bisa diaktifkan setelah gambar QRIS dan fee disiapkan." />
);

export const PaymentExpiryTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Batas waktu pembayaran manual. Jika lewat, pesanan pending bisa dibatalkan dan stok reservasi dilepas." />
);

export const AdminFeeTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Biaya tambahan yang ikut dihitung ke total bayar untuk metode pembayaran tertentu." />
);

export const OriginStoreTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Alamat asal toko/gudang. Kode desa origin dipakai API ongkir untuk menghitung biaya kirim dari lokasi toko ke pelanggan." />
);

export const RegionCacheTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Cache wilayah menyimpan daftar provinsi/kota/kecamatan/desa agar dropdown alamat lebih cepat dan tidak terlalu sering memanggil API." />
);

export const ActiveCourierTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Kurir yang dicentang akan ditawarkan ke pelanggan jika API ongkir mengembalikan layanan tersebut." />
);

export const TaxonomyTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Taxonomy adalah struktur kategori dan atribut produk. Ini menentukan filter, menu, dan opsi varian pada form produk." />
);

export const VariantTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Varian adalah kombinasi opsi produk seperti warna, ukuran, dan bahan. Setiap kombinasi bisa punya stok dan SKU sendiri." />
);

export const AttributeTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Atribut adalah spesifikasi tambahan kategori, misalnya bahan, motif, atau cutting. Opsi ini bisa ikut membentuk varian produk." />
);

export const HppTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="HPP adalah Harga Pokok Produksi/modal per produk. Dipakai untuk menghitung estimasi profit." />
);

export const YieldTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Yield adalah jumlah produk yang bisa dibuat dari satu roll bahan. Dipakai untuk membagi biaya kain dan borongan." />
);

export const SeoTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="SEO membantu halaman produk lebih jelas untuk mesin pencari dan preview link." />
);

export const CanonicalSlugTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Slug utama yang dianggap versi resmi halaman produk. Berguna jika ada URL lama atau variasi URL." />
);

export const OpenGraphTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Gambar preview saat link produk dibagikan ke WhatsApp, Facebook, atau platform lain." />
);

export const SkuTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="SKU adalah kode internal varian untuk memudahkan stok, gudang, dan pencatatan produk." />
);

export const FulfillmentTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Alur operasional setelah order masuk: konfirmasi pembayaran, packing, kirim, input resi, sampai selesai." />
);

export const TrackingNumberTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Nomor resi pengiriman dari kurir. Pelanggan memakai ini untuk melacak paket." />
);

export const ReturnExchangeTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Retur berarti pengembalian barang. Exchange berarti tukar barang, misalnya ukuran atau warna." />
);

export const AuditLogTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Catatan aktivitas admin penting seperti update pembayaran, pengiriman, stok, dan template." />
);

export const BundleTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Bundle adalah paket beberapa produk yang dijual dengan satu harga khusus." />
);

export const MessageTemplateTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Template pesan adalah draft WhatsApp/email untuk status order atau follow-up, supaya admin tidak mengetik dari nol." />
);

export const VoucherTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Kode promo yang memberi diskon nominal, persen, atau gratis ongkir sesuai aturan minimal belanja, kuota, dan target pelanggan." />
);

export const DefaultCouponCampaignTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Campaign promo bawaan yang bisa menerbitkan voucher otomatis, misalnya welcome coupon, birthday gift, atau review reward." />
);

export const ReviewSpinWheelTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Hadiah acak setelah customer memberi review. Bobot first/repeat spin menentukan peluang hadiah untuk spin pertama dan berikutnya." />
);

export const CouponRiskLogTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Catatan klaim welcome coupon yang diblokir guard anti-abuse karena sinyal risiko seperti akun, perangkat, atau nomor yang mencurigakan." />
);

export const ManualEntitlementTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Pemberian atau pencabutan hak voucher secara manual untuk kasus customer service, misalnya false positive dari risk guard." />
);

export const RiskScoreTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Skor risiko klaim promo. Jika mencapai threshold block, sistem menahan entitlement sampai admin melakukan override manual." />
);

export const UniqueCodeTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Kode unik transfer ditambahkan saat order dibuat agar nominal transfer lebih mudah dicocokkan dengan pesanan." />
);

export const OrderBumpTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Rekomendasi produk tambahan di checkout untuk menaikkan nilai pesanan tanpa mengganggu alur bayar." />
);

export const ApiCoIdTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="API pihak ketiga untuk data wilayah Indonesia dan kalkulasi ongkir ekspedisi." />
);

export const WishlistTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Daftar produk yang disimpan pelanggan untuk dilihat atau dibeli nanti." />
);

export const FinanceStatementTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Laporan ringkas laba rugi dari order valid, HPP, voucher, fee transaksi, packaging, ads, dan transaksi manual." />
);

export const ManualTransactionTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Catatan uang masuk atau keluar di luar order otomatis, misalnya beli packaging, biaya ads, refund manual, atau modal masuk." />
);

export const ClosingPeriodTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Tutup buku mengunci snapshot periode bulanan agar angka laporan bulan itu bisa disimpan sebagai arsip." />
);

export const CashFlowTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Arus kas sederhana memperlihatkan perkiraan uang masuk dan keluar pada periode yang dipilih." />
);

export const PackagingCostTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Biaya packaging dari transaksi manual kategori Packaging. Dipakai untuk menajamkan estimasi profit bersih." />
);

export const AdsCostTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Biaya iklan dari transaksi manual kategori Ads. Dipakai untuk melihat profit setelah biaya akuisisi pelanggan." />
);

export const WhatsAppVerificationTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Status nomor WhatsApp dipercaya untuk akun pelanggan. Admin bisa verifikasi manual jika webhook GOWA sedang bermasalah." />
);

export const SupportWhatsAppTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Nomor WhatsApp Meyya yang menjadi tujuan pesan verifikasi pelanggan. Disimpan di D1 agar bisa diganti tanpa ubah environment." />
);

export const FreeTierGuardTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Panel pemantauan batas layanan gratis seperti Clerk, Cloudflare D1, dan R2 agar operasional tidak melewati limit." />
);

export const ClerkUsersTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Estimasi jumlah akun customer/admin yang tersinkron dari Clerk ke database D1." />
);

export const D1StorageTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Perkiraan ukuran database Cloudflare D1. Panel memakai Cloudflare API jika tersedia, lalu fallback ke PRAGMA runtime." />
);

export const R2StorageTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Perkiraan pemakaian object storage Cloudflare R2 untuk file upload seperti bukti pembayaran atau gambar." />
);

export const SafePruningTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Penghapusan data operasional lama yang tidak kritikal. Data order, user, stok, voucher usage, dan retur tidak ikut dihapus." />
);

export const ApiCoIdFreeTierTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="API.CO.ID memberi free tier 3.000 hit/bulan per produk yang dipakai Meyya: regional dan ongkir. Panel ini menghitung request yang benar-benar keluar dari server Meyya ke API.CO.ID." />
);

export const ReviewModerationTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Panel untuk publish, hide, membalas, dan memilih review customer yang layak tampil di halaman produk." />
);

export const FeaturedReviewTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Review pilihan yang diberi prioritas tampil sebagai social proof di halaman produk." />
);

export const AdminReplyTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Balasan resmi Meyya yang tampil publik bersama review customer di halaman produk." />
);

export const AnalyticsBackfillTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Menghitung ulang aggregate analytics harian dari raw user_events agar chart admin punya histori yang lengkap." />
);

export const AnalyticsArchiveTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Memindahkan raw user_events lama ke R2 sebagai arsip JSONL sebelum D1 dipangkas, sementara aggregate chart tetap disimpan." />
);

export const DryRunTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Simulasi operasi tanpa menulis, upload, atau menghapus data. Pakai ini untuk cek dampak sebelum menjalankan aksi final." />
);

export const ReplaceWindowTooltip = (props: TermTooltipProps) => (
  <TermHint {...props} content="Menghapus aggregate pada rentang tanggal yang dipilih sebelum backfill ulang supaya angka chart tidak dobel." />
);
