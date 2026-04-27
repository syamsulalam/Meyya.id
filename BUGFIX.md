# Bug Fix Report: Clerk Auth Integration

Berikut adalah analisis bug, potensi masalah, dan perbaikan berdasarkan panduan terbaru pada `CLERK_SETUP.md`. Tombol daftar dan Google Login tidak berfungsi karena aplikasi kehilangan `ClerkProvider` yang wajib ada untuk menjalankan fungsi dari hook autentikasi Clerk.

| Bug | Alasan Potensi Bug / Dampak | Fix / Solusi yang Diterapkan |
| --- | --- | --- |
| **`ClerkProvider` absen dari Root Layout / `main.tsx`** | Ini adalah penyebab utama (root cause) mengapa tombol Daftar dan Google Login tidak berfungsi. Hook seperti `useSignIn` dan `useSignUp` membutuhkan context internal dari `<ClerkProvider>`. Jika tidak ada, proses auth tidak tereksekusi secara fatal. | Membungkus komponen `<App />` di dalam `src/main.tsx` dengan `<ClerkProvider afterSignOutUrl="/">`. |
| **Error Timeout Telemetry (`clerk-telemetry.com`)** | Beberapa browser (seperti Brave dengan Shields) atau ekstensi Ad-Blocker / Tracker-Blocker seringkali memblokir endpoint tracking telemetry dari Clerk yang menyebabkan _Failed to load resource: net::ERR_CONNECTION_TIMED_OUT_. Hal ini umumnya tidak mengganggu inti login/register, namun dapat menyebabkan beberapa log error di console. | Menambahkan handling interaktif di UI (jika *isLoaded* false akibat terblokir) serta efek scroll otomatis agar developer dan pengguna segera mengetahui bahwa ada proses yang terhambat akibat blocker. |
| **Error Message tidak terlihat karena form Registration panjang** | Ketika proses submit gagal atau ada error pada kredensial, pengguna tidak menyadarinya karena pesan error muncul di atas form sementara pengguna ada di bawah page. | Menambahkan `useRef` dan `scrollIntoView` pada box error message di `Auth.tsx`. Form akan otomatis bergeser (scroll) ke letak log / warning agar terlihat jelas oleh user. |

