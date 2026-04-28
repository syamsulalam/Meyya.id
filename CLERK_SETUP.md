# Clerk Production Setup, DNS, and SSO

Ketika Anda siap merilis aplikasi ke domain publik (misal `meyya.id`), proyek Clerk **wajib** dipindahkan dari mode **Development** ke **Production**. Jika aplikasi berjalan di domain produksi namun Clerk masih menggunakan **Test Keys** (di mode Development), autentikasi SSO (seperti Google Login) akan gagal, atau terblokir akibat masalah cross-domain third-party cookie.

Berikut panduan langkah demi langkah untuk mengonfigurasi proyek Clerk ke mode **Production**:

## 1. Upgrade Clerk ke Production

1. Buka [Dashboard Clerk](https://dashboard.clerk.com/).
2. Pilih proyek Anda yang saat ini masih dalam status *Development*.
3. Pada halaman Overview proyek, perhatikan tombol atau banner di bagian atas yang bertuliskan **Deploy to Production** atau masuk ke menu **Settings -> Environments** dan ganti/aktifkan **Production**. (Jika Anda menggunakan paket free tier, pastikan Anda memenuhi syarat yang ditetapkan Clerk).
4. Setelah menjadi *Production Mode*, Clerk akan memberikan sepasang kunci baru khusus produksi: `Publishable Key` dan `Secret Key`. Catat `Publishable Key` yang baru, berawalan `pk_live_` (bukan `pk_test_`).
5. Perbarui variabel lingkungan di hosting/deployment Anda (misal Vercel, Cloudflare Pages, dsb):
   `VITE_CLERK_PUBLISHABLE_KEY=pk_live_xxxxxxxxx` (Ganti dengan kunci produksi Anda).

## 2. Setup DNS Domain Anda

Kunci produksi Clerk mensyaratkan DNS dikonfigurasi agar Clerk dapat menaruh cookie first-party dengan aman di bawah subdomain Anda (misalnya `accounts.meyya.id` jika domain utama Anda `meyya.id`).

1. Buka halaman **Configure -> Domains** di Dashboard Clerk.
2. Tambahkan domain produksi utama Anda, misal `meyya.id`. Clerk akan secara otomatis membuat subdomain khusus untuk proses auth, biasanya `accounts.meyya.id` atau `clerk.meyya.id`.
3. Clerk akan menampilkan sejumlah **DNS Records** (biasanya berupa CNAME records).
4. Buka pengelola DNS domain Anda (Cloudflare, Niagahoster, Route53, dsb).
5. Tambahkan semua record CNAME dan TXT yang diberikan Clerk ke pengaturan DNS Anda.
   *(Contoh: buat CNAME record dari `accounts.meyya.id` ke nilai endpoint yang ditugaskan Clerk)*.
6. Kembali ke Dashboard Clerk dan klik tombol **Verify DNS** (bisa butuh waktu perambatan DNS beberapa menit hingga struktur hijau terverifikasi).
7. Jika DNS sudah berstatus *Verified*, Clerk kini menggunakan first-party cookie untuk login, bebas dari blokiran *third-party cookie* seperti incognito/Adblock.

## 3. Setup Koneksi SSO (Google Login Terverifikasi)

Dalam mode *Development*, Clerk menggunakan aplikasi Google OAuth internal milik Clerk sendiri untuk memudahkan tes. Namun, di mode *Production*, Google memblokir hal tersebut. Anda **wajib** membawa kredensial OAuth Anda sendiri.

1. Buat project baru di **[Google Cloud Console](https://console.cloud.google.com/)**.
2. Masuk ke menu **APIs & Services -> OAuth consent screen**. Konfigurasikan aplikasi sebagai *External* dengan mengisi data aplikasi (Logo, App domain, Privacy Policy URL).
3. Masuk ke **APIs & Services -> Credentials**.
4. Klik **Create Credentials -> OAuth client ID**.
5. Pilih **Web application**.
6. Atur *Authorized JavaScript origins* dengan:
   - `https://meyya.id`
   - `https://accounts.meyya.id` (Sesuaikan dengan subdomain Clerk Anda)
7. Atur *Authorized redirect URIs* dengan menempelkan URL callback spesifik yang didapat dari Dashboard Clerk. (Temukan URL ini di Dashboard Clerk -> Configure -> Social Connections -> Google -> Production).
8. Simpan dan dapatkan **Client ID** serta **Client Secret** dari Google.
9. Kembali ke **Dashboard Clerk -> Configure -> Social Connections**, pilih **Google**, lalu klik tab **Production**.
10. Konfigurasikan opsi **"Use custom credentials"** lalu masukkan **Client ID** dan **Client Secret** yang didapat dari Google Cloud Console.
11. Klik **Apply / Save**.

Dengan penyelesaian _DNS records_ dan penyediaan kredensial OAuth asli, Google Login kini akan berjalan secara natif pada domain `meyya.id` tanpa ada warning blokir cookie!

## 4. Setup Path Configuration (Routing)

Meski fitur konfigurasi path di Dashboard akan dipensiunkan (deprecated) dan idealnya diatur langsung dari kode aplikasi via environment variables (`CLERK_SIGN_IN_URL`, dll.), Anda saat ini tetap perlu memastikan path redirect sesuai:

1. Buka **Dashboard Clerk -> Configure -> Routing / Paths**.
2. Pastikan path untuk Sign In (`/auth`), Sign Up (`/auth`), dan After Sign In (`/dashboard` atau `/`) diatur dengan benar agar selaras dengan routing di `App.tsx` Anda.
3. Konfigurasi ini menjamin jika ada _redirect_ bawaan Clerk yang belum tertangkap oleh kode (terutama pada OAuth callbacks), user tidak akan nyasar ke path default Clerk.

## 5. Setup Koneksi SSO (Apple ID)

Untuk menambahkan Apple ID SSO, Anda membutuhkan akun **Apple Developer Program** (berbayar sekitar $99/tahun). Proses konfigurasinya hampir mirip dengan Google di mana Anda memasukkan kustom kredensial di mode Production, namun langkah pembuatannya di portal Apple cukup spesifik.

1. Buka **Dashboard Clerk -> Configure -> Social Connections** lalu aktifkan **Apple**. Aktifkan **"Use custom credentials"** di tab Production. Simpan URL *Email Source for Apple Private Email Relay* dan *Return URL* yang diberikan Clerk. Biarkan tab tetap terbuka.
2. Buka **[Apple Developer Portal](https://developer.apple.com/account)**.
3. Buka **Certificates, IDs & Profiles -> Identifiers**. Buat **App ID** (centang kapabilitas Sign In with Apple). Prefix-nya akan menajadi **Apple Team ID**.
4. Di halaman Identifiers yang sama, ganti filter daftar menjadi **Services IDs**. Buat Service ID, lalu aktifkan Sign in with Apple. Klik Configure, pilih App ID dari langkah 3, dan masukkan web domain Anda (misal `meyya.id` tanpa https) serta *Return URL* yang diberikan Clerk. Identifier Name-nya menjadi **Apple Services ID** Anda.
5. Masuk ke tab **Keys**, buat key baru (centang Sign In with Apple, pilih App ID dari langkah 3). Simpan key-nya. Dapatkan **Key ID** dan unduh file private key (`.p8`). File ini adalah **Apple Private Key** Anda.
6. (*Penting*) Buka tab **Services** di menu kiri portal, atur *Sign in with Apple for Email Communication*, tambahkan *Email Source for Apple Private Email Relay* dari Clerk ke sana.
7. Kembali ke Dashboard Clerk, di bagian kredensial Production Apple, masukkan:
   - **Apple Team ID**
   - **Apple Services ID**
   - **Apple Key ID**
   - Isi file **Apple Private Key** (termasuk baris `-----BEGIN PRIVATE KEY-----`).
8. Simpan. Apple Sign In sekarang bisa digunakan di aplikasi `meyya.id`.

> 💡 **Info Penting & Dokumentasi Tambahan:** Untuk dokumentasi lengkap tentang SSO dan integrasi lanjutan lainnya ke ekosistem Clerk yang disediakan oleh panduan original mereka, Anda dapat membaca file dokumentasi pendamping yang telah kami siapkan di **`CLERK_DOCS.md`**.
