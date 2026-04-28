# Panduan Integrasi Clerk & Database D1 (Cloudflare)

Karena sekarang MEYYA.ID sudah menggunakan sistem autentikasi Clerk, semua data utama kredensial pengguna disimpan di server Clerk. Namun, untuk keperluan relasional aplikasi seperti riwayat pesanan (Orders), keranjang (Cart), dan Wishlist, kita tetap perlu menyimpan referensi / cerminan data pengguna ini di database MEYYA.ID (yaitu Cloudflare D1).

Berikut instruksi tentang **bagaimana membedakan user biasa dan admin**, serta **bagaimana mengimplementasikan Webhook Clerk ke D1**.

---

## 1. Membedakan User Biasa dan Admin

Keuntungan menggunakan Clerk adalah kita tidak perlu membuat tabel terpisah atau logika rumit untuk mengecek admin. Kita bisa menggunakan fitur **Public Metadata**.

**Cara kerja:**
1. Masuk ke [Clerk Dashboard](https://dashboard.clerk.com/).
2. Pergi ke menu **Users**.
3. Temukan nama/email Anda (yang akan dijadikan Admin), lalu klik nama pengguna tersebut.
4. Di bagian **User metadata**, pada kolom **Public**, tambahkan JSON berikut:
   ```json
   {
     "role": "admin"
   }
   ```
5. Simpan (Save).

Nantinya, di kode Frontend (React), kita bisa mengecek apakah user yang sedang login adalah admin:
```tsx
import { useUser } from '@clerk/react';

function Header() {
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.role === 'admin';

  return isAdmin ? <AdminPanel /> : <UserPanel />;
}
```

Sistem di atas jauh lebih aman, karena data `publicMetadata` bersifat *Read-Only* dari sisi frontend. Hanya backend/Dashboard Clerk yang bisa menulis atau mengubahnya, sehingga sangat sulit untuk di-*hack* orang biasa.

---

## 2. Sinkronisasi Clerk ke Database D1 via Webhook

Ya, **kita butuh Webhook**. Saat pengguna mendaftar (Sign Up) di Clerk, database kita (D1) belum otomatis tahu. Clerk harus mengirim ping (Webhook) ke backend MEYYA.ID.

### Langkah-langkah Pembuatan:

**1. Set up tabel Users di Cloudflare D1:**
Pastikan tabel `users` dibuat di D1 dengan kolom setidaknya:
- `clerk_id` (TEXT, Primary Key) - Menyimpan ID unik bawaan dari Clerk (misalnya `user_2...`).
- `email` (TEXT)
- `first_name` (TEXT)
- `last_name` (TEXT)
- `role` (TEXT) - *(Opsional, kita bisa simpan dari metadata saat webhook ditembak).*

**2. Instal library Svix di backend Cloudflare Worker:**
Clerk menggunakan Svix untuk tanda tangan pengamanan (Security Signing) webhook.
```bash
npm install svix
```

**3. Buat endpoint Webhook di Hono (Cloudflare Worker):**
Buat *route* khusus, misalnya `POST /api/webhooks/clerk`, untuk menangkap kiriman Clerk.

```typescript
// Contoh di Hono API Backend
import { Hono } from 'hono'
import { Webhook } from 'svix'

const app = new Hono()

app.post('/api/webhooks/clerk', async (c) => {
  // 1. Ambil secret dari environment variables Cloudflare
  const WEBHOOK_SECRET = c.env.CLERK_WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) {
    return c.json({ error: 'Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to env' }, 500)
  }

  // 2. Ambil headers
  const svix_id = c.req.header("svix-id")
  const svix_timestamp = c.req.header("svix-timestamp")
  const svix_signature = c.req.header("svix-signature")

  // Jika header tidak lengkap
  if (!svix_id || !svix_timestamp || !svix_signature) {
    return c.json({ error: 'Error occured -- no svix headers' }, 400)
  }

  // 3. Ambil body payload (HARUS dalam bentuk raw string)
  const payload = await c.req.text()
  const wh = new Webhook(WEBHOOK_SECRET)

  let evt: any
  try {
    // 4. Verifikasi signature keamanan
    evt = wh.verify(payload, {
      "svix-id": svix_id,
      "svix-timestamp": svix_timestamp,
      "svix-signature": svix_signature,
    })
  } catch (err: any) {
    console.error('Error verifying webhook:', err.message)
    return c.json({ error: 'Error occured' }, 400)
  }

  // 5. Desturcturing dan identifikasi aktivitas (event) Clerk
  const { id } = evt.data
  const eventType = evt.type

  if (eventType === 'user.created' || eventType === 'user.updated') {
    const email = evt.data.email_addresses[0]?.email_address
    const firstName = evt.data.first_name
    const lastName = evt.data.last_name
    const role = evt.data.public_metadata?.role || 'user'
    
    // -> GUNAKAN D1 UNTUK INSERT / UPDATE:
    // await c.env.DB.prepare(`
    //   INSERT INTO users (clerk_id, email, first_name, last_name, role) 
    //   VALUES (?, ?, ?, ?, ?)
    //   ON CONFLICT(clerk_id) DO UPDATE SET 
    //   email=excluded.email, first_name=excluded.first_name, 
    //   last_name=excluded.last_name, role=excluded.role
    // `).bind(id, email, firstName, lastName, role).run();
    
    console.log(`User ${id} berhasil di-sinkronisasi ke D1.`)
  }

  if (eventType === 'user.deleted') {
    // -> GUNAKAN D1 UNTUK DELETE / NON-AKTIF:
    // await c.env.DB.prepare('DELETE FROM users WHERE clerk_id = ?').bind(id).run();
  }

  return c.json({ success: true, message: 'Webhook received' }, 200)
})
```

**4. Konfigurasi Webhook di Dashboard Clerk:**
1. Di [Clerk Dashboard](https://dashboard.clerk.com), buka menu **Webhooks**.
2. Klik **Add Endpoint**.
3. Masukkan Endpoint URL dari Worker Anda, misal: `https://api.meyya.id/api/webhooks/clerk`.
4. Di bagian **Message Filtering**, centang event yang diperlukan:
   - `user.created`
   - `user.updated`
   - `user.deleted`
5. Tambahkan Endpoint.
6. Anda akan mendapatkan **Signing Secret** (dimulai dengan `whsec_...`).
7. Copy secret tersebut ke environment variable Cloudflare Worker Anda (melalui file `wrangler.toml` (development) atau Cloudflare Dashboard (Production) dengan nama `CLERK_WEBHOOK_SECRET`).

---

## Ringkasan Alur Sistem

- **Autentikasi (Tugas Clerk)**: Menyimpan kata sandi, 2FA, Social Login, Reset Password, Role (di `publicMetadata`).
- **Data Transaksi (Tugas D1)**: Menyimpan riwayat order `user_2x...`, wishlist di `user_2x...`, alamat pengiriman.
- **Webhook (Jembatan)**: Clerk menembak backend tiap ada pendaftaran baru ➝ Backend mencatat `user_2x...` ke D1 agar siap dikaitkan (JOIN) dengan tabel Order / Wishlist / Keranjang. 

Saat Webhook belum ada, kita tetap bisa menggunakan `clerk_id` secara mandiri. Misalnya, jika API menerima permintaan "Tambahkan ke keranjang", backend hanya perlu mencatat `{ clerk_id, item_id, qty }` di D1 tanpa secara absolut membutuhkan tabel `users` referensial untuk sekedar jalan dasar. Tapi untuk kelengkapan administrasi dan relasi, implementasi sinkronisasi Webhook ini sangat disarankan.
