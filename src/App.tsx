import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import AdminDashboard from './pages/AdminDashboard';
import Wishlist from './pages/Wishlist';
import StaticPage from './pages/StaticPage';
import FaqPage from './pages/FaqPage';
import ScrollToTop from './components/ScrollToTop';
import Profile from './pages/Profile';
import Auth from './pages/Auth';
import SearchPage from './pages/SearchPage';

const Layout = () => (
  <div className="min-h-screen flex flex-col">
    <ScrollToTop />
    <Header />
    <main className="flex-1 flex flex-col pt-8">
      <Outlet />
    </main>
    <Footer />
  </div>
);

const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/produk/:slug", element: <ProductDetail /> },
      { path: "/cart", element: <Cart /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/admin", element: <AdminDashboard /> },
      { path: "/wishlist", element: <Wishlist /> },
      { path: "/profil", element: <Profile /> },
      { path: "/login", element: <Auth /> },
      { path: "/search", element: <SearchPage /> },
      { path: "/faq", element: <FaqPage /> },
      { path: "/tentang-kami", element: (
        <StaticPage title="Tentang Kami">
          <h3>Visi Kami</h3>
          <p>MEYYA.ID lahir dari keinginan untuk menghubungkan keanggunan gaya kesopanan (<i>modest fashion</i>) dengan sentuhan desain editorial yang kontemporer. Kami berdiri dengan pijakan keahlian penjahit kelas menengah atas, menjamin kenyamanan pakaian tanpa menyita keindahan potongannya.</p>
          <h3>Material Pilihan</h3>
          <p>Kami sangat bersemangat dalam menggali material-material berkualitas, dari kelembutan <i>silk</i> murni, hingga sentuhan halus kain <i>voile</i> yang memudahkan Anda bergerak sepanjang hari. </p>
        </StaticPage>
      )},
      { path: "/shipping", element: (
        <StaticPage title="Pengiriman & Retur">
          <h3>Pengiriman</h3>
          <p>Kami menawarkan pengiriman standar gratis, <i>complimentary shipping</i>, untuk seluruh pesanan di atas Rp 500.000. Setiap pesanan biasanya akan diproses dalam waktu 24-48 jam. Opsi pengiriman ekspres (<i>express delivery</i>) tersedia di halaman <i>checkout</i>.</p>
          <h3>Retur (<i>Returns</i>)</h3>
          <p>Kami menerima retur untuk pakaian yang belum dikenakan dan <i>tag</i> harga aslinya belum dilepas dalam kurun waktu 7 hari sejak produk tiba. Produk <i>sale items</i> berstatus sebagai final dan tidak dapat diretur.</p>
        </StaticPage>
      )},
      { path: "/terms", element: (
        <StaticPage title="Syarat & Ketentuan">
          <p>Dengan mengakses <i>website</i> kami dan melakukan pesanan, Anda secara otomatis menyetujui persyaratan layanan (<i>terms of service</i>) yang berlaku.</p>
          <p>Semua konten yang dimuat di sini, termasuk foto produk dan pengaturan tipografi, sepenuhnya merupakan milik dari MEYYA.ID.</p>
        </StaticPage>
      )},
      { path: "/privacy", element: (
        <StaticPage title="Kebijakan Privasi">
          <p>Kerahasiaan data Anda sangat penting bagi kami. Kami hanya mengumpulkan informasi seperlunya (<i>necessary information</i>) untuk memproses pesanan Anda secara aman dan tertutup.</p>
          <p>Kami tidak akan pernah menjual atau membagikan (<i>share</i>) data profil Anda kepada pihak ketiga (<i>third-party marketers</i>) tanpa izin persetujuan Anda.</p>
        </StaticPage>
      )},
      { path: "/contact", element: (
        <StaticPage title="Hubungi Kami">
          <p>Kami sangat antusias untuk mendengar pengalaman berbelanja Anda.</p>
          <p><strong>Email:</strong> help@meyya.id</p>
          <p><strong>WhatsApp:</strong> +62 812 3456 7890</p>
          <p>Tim dukungan pelanggan (<i>customer care</i>) kami akan siap melayani Anda mulai Hari Senin-Jumat, pukul 9 pagi hingga 5 sore WIB.</p>
        </StaticPage>
      )},
      { path: "*", element: <Home /> }
    ]
  }
]);

export default function App() {
  return <RouterProvider router={router} />;
}
