export type RoadmapStatus = 'done' | 'in_progress' | 'planned';

export type RoadmapItem = {
  title: string;
  status: RoadmapStatus;
  area: 'Customer' | 'Admin' | 'Data' | 'Marketing' | 'Operations';
  note: string;
};

export const developmentRoadmap: RoadmapItem[] = [
  { title: 'Homepage filter kategori dinamis', status: 'done', area: 'Customer', note: 'Kategori publik mengikuti kategori yang punya produk aktif.' },
  { title: 'Produk out of stock greyed out', status: 'done', area: 'Customer', note: 'Produk habis tetap terlihat tetapi tidak mendorong checkout.' },
  { title: 'Search produk real', status: 'done', area: 'Customer', note: '/search sudah mengambil data dari API produk.' },
  { title: 'Checkout ongkir real-time', status: 'done', area: 'Customer', note: 'Ongkir dihitung ulang server-side dari origin toko dan alamat pelanggan.' },
  { title: 'Upload bukti transfer', status: 'done', area: 'Customer', note: 'Pelanggan bisa mengunggah bukti pembayaran dari halaman order.' },
  { title: 'Retur dan exchange pelanggan', status: 'done', area: 'Customer', note: 'Pesanan completed dapat mengajukan retur atau tukar barang.' },
  { title: 'Wishlist D1', status: 'done', area: 'Customer', note: 'Wishlist login tersimpan ke database, bukan hanya browser.' },
  { title: 'Profil tanggal lahir', status: 'done', area: 'Customer', note: 'Tanggal lahir menjadi dasar campaign birthday.' },
  { title: 'Dashboard helicopter view', status: 'done', area: 'Admin', note: 'Admin melihat omset, profit, stok rendah, pelanggan, dan order terbaru.' },
  { title: 'CRM pelanggan', status: 'done', area: 'Admin', note: 'LTV, AOV, return rate, wishlist, birthday, abandoned cart, dan export CSV tersedia.' },
  { title: 'WhatsApp marketing CRM', status: 'done', area: 'Marketing', note: 'Target pending payment, abandoned cart, birthday, VIP retention, dan user baru.' },
  { title: 'Voucher fleksibel', status: 'done', area: 'Marketing', note: 'Voucher bisa tanpa tanggal mulai/kedaluwarsa dan bisa ditargetkan ke user/segment.' },
  { title: 'Admin payment settings', status: 'done', area: 'Admin', note: 'Rekening, instruksi transfer, expiry, fee transfer, dan QRIS dapat diatur.' },
  { title: 'Admin shipping settings', status: 'done', area: 'Admin', note: 'Origin toko, kurir aktif, dan refresh cache wilayah tersedia.' },
  { title: 'Operasional order', status: 'done', area: 'Operations', note: 'Fulfillment, resi, status order, template pesan, audit log, dan bundle tersedia.' },
  { title: 'Varian stok lengkap', status: 'done', area: 'Operations', note: 'Stok bisa diatur per kombinasi warna, ukuran, dan atribut kategori.' },
  { title: 'Remote D1 schema verified', status: 'done', area: 'Data', note: 'Schema production meyya-id sudah dipatch dan diexport ulang.' },
  { title: 'Tooltip istilah teknis', status: 'done', area: 'Admin', note: 'Istilah admin, profil, checkout, dan customer flow diberi penjelasan kecil.' },
  { title: 'Roadmap admin sortable', status: 'done', area: 'Admin', note: 'Daftar fitur bisa diurutkan dari akan ada, sudah ada, atau area fitur.' },
  { title: 'Bind warna galeri produk', status: 'done', area: 'Admin', note: 'Foto galeri produk di-bind ke warna produk lewat pilihan warna, bukan input teks bebas.' },
  { title: 'Voucher birthday otomatis', status: 'done', area: 'Marketing', note: 'Voucher birthday tampil otomatis di profil saat pelanggan berada dalam window klaim ulang tahun.' },
  { title: 'Voucher birthday 1x per tahun', status: 'done', area: 'Marketing', note: 'Klaim birthday dikunci per pelanggan per tahun lewat voucher usage dan claim year.' },
  { title: 'Snapshot abandoned cart', status: 'done', area: 'Marketing', note: 'Keranjang terakhir disimpan sebagai snapshot agregat untuk CRM dan WhatsApp Marketing.' },
  { title: 'Normalisasi stok global dari varian', status: 'done', area: 'Operations', note: 'Stok produk utama dihitung dari total stok varian aktif saat produk dibuat atau diubah.' },
  { title: 'Validasi variable template pesan', status: 'done', area: 'Operations', note: 'Template pesan punya daftar variable, preview, dan guard agar placeholder salah tidak tersimpan.' },
  { title: 'Tracking resi live', status: 'done', area: 'Customer', note: 'Halaman order mengambil status live resi dari endpoint tracking kurir server-side.' },
  { title: 'Return/exchange SLA dan bukti foto', status: 'done', area: 'Operations', note: 'Request retur punya SLA 7 hari, bukti foto, catatan penerimaan, dan opsi restock.' },
  { title: 'Indikator umur region cache', status: 'done', area: 'Admin', note: 'Admin pengiriman melihat umur cache wilayah per endpoint serta status fresh/stale.' },
  { title: 'Drag-and-drop gallery produk', status: 'done', area: 'Admin', note: 'Urutan gambar produk bisa disusun ulang langsung di form produk.' },
  { title: 'Template abandoned cart dari snapshot', status: 'done', area: 'Marketing', note: 'Pesan abandoned cart menyebut produk utama dari snapshot keranjang terakhir.' },
  { title: 'Return QC per item', status: 'done', area: 'Operations', note: 'Admin bisa mencatat bukti gudang, keputusan, dan quality control per item retur.' },
  { title: 'Pisahkan schema dan seed demo', status: 'planned', area: 'Data', note: 'schema.sql masih bercampur definisi tabel dan data contoh.' },
  { title: 'Provider WhatsApp/email', status: 'planned', area: 'Marketing', note: 'Template pesan belum terkirim otomatis dari provider resmi.' },
  { title: 'Analytics event lebih detail', status: 'planned', area: 'Marketing', note: 'Metadata event belum memuat device/source campaign secara rapi.' },
];
