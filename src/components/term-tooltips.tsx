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
