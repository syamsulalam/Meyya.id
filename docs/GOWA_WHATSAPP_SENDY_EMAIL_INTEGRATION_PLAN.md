# GOWA WhatsApp dan Sendy Email Integration Plan

Tanggal riset: 2026-05-06 00:18:00 +07:00

Dokumen ini merangkum rencana integrasi pesan otomatis dan semi otomatis untuk Meyya.id:

- WhatsApp operasional memakai GOWA, yaitu provider WhatsApp tidak resmi berbasis WhatsApp Web.
- Email memakai Sendy yang terhubung ke Amazon SES.
- Belum ada implementasi runtime di dokumen ini. Ini hanya rencana eksekusi agar integrasi berikutnya tidak asal tempel API.

## Ringkasan Keputusan

GOWA feasible untuk MVP jika dipakai sebagai kanal operasional ber-volume rendah dan tetap self-hosted di server Oracle/VPS yang sudah ada. GOWA tidak cocok dijalankan di Cloudflare Pages karena butuh proses long-running, sesi WhatsApp, QR/pairing, dan storage persisten. Cloudflare Pages Functions cukup menjadi orchestrator yang memanggil endpoint HTTPS GOWA.

Sendy + Amazon SES feasible untuk email marketing dan newsletter yang murah. Untuk email transactional satu-per-satu seperti order status, Sendy bisa dipakai jika API campaign/list cocok dengan kebutuhan, tetapi direct Amazon SES tetap perlu dipertimbangkan sebagai opsi masa depan karena lebih natural untuk transactional email.

## Sumber Riset

- GOWA repository: https://github.com/aldinokemal/go-whatsapp-web-multidevice
- GOWA OpenAPI: https://raw.githubusercontent.com/aldinokemal/go-whatsapp-web-multidevice/main/docs/openapi.yaml
- Sendy API: https://sendy.co/api
- Sendy product page: https://sendy.co/

## Fakta Teknis GOWA

GOWA yang relevan adalah `aldinokemal/go-whatsapp-web-multidevice`. Repository menyebutkan dukungan REST API, UI, multi account, webhooks, Chatwoot, dan MCP. Mode REST pada versi baru dijalankan sebagai proses service, misalnya binary dengan mode `rest` atau Docker.

Catatan penting dari dokumentasi:

- Project ini unofficial dan tidak berafiliasi dengan WhatsApp.
- REST API mode tersedia dan dokumentasi detail ada di OpenAPI.
- Versi v8 sudah multi-device.
- Device-scoped REST call perlu `X-Device-Id` header atau `device_id` query parameter jika lebih dari satu device.
- Endpoint penting:
  - `GET /devices` untuk daftar device.
  - `POST /devices` untuk membuat slot device.
  - `GET /devices/{device_id}/login` untuk login QR.
  - `POST /devices/{device_id}/login/code` untuk pairing code.
  - `GET /devices/{device_id}/status` untuk cek status koneksi.
  - `POST /send/message` untuk kirim teks.
  - `POST /send/image`, `/send/file`, `/send/video` untuk media jika nanti dibutuhkan.

Payload teks GOWA memakai pola:

```json
{
  "phone": "628123456789@s.whatsapp.net",
  "message": "Pesan operasional Meyya",
  "is_forwarded": false
}
```

Header yang perlu disiapkan:

```http
X-Device-Id: 628xxxxxxxxx@s.whatsapp.net
Authorization: Basic ...
```

Skema auth aktual harus dicocokkan dengan konfigurasi GOWA di server Oracle, karena repo memakai basic auth dan konfigurasi deploy bisa berbeda antar instalasi.

## Feasibility Dengan Stack Meyya.id

Stack Meyya.id saat ini cocok dengan arsitektur berikut:

1. Meyya.id tetap berjalan di Cloudflare Pages Functions + D1 + R2.
2. GOWA berjalan terpisah di Oracle/VPS sebagai service long-running.
3. Sendy berjalan terpisah di hosting/VPS yang terhubung ke Amazon SES.
4. Meyya.id membuat outbox pesan di D1.
5. Admin bisa mengirim semi otomatis dari dashboard.
6. Cron/maintenance worker nanti memproses outbox untuk pesan otomatis.

Yang tidak disarankan:

- Menjalankan GOWA di Cloudflare Pages Functions.
- Mengirim WhatsApp langsung dari checkout critical path tanpa outbox.
- Memakai GOWA untuk broadcast marketing besar.
- Menjadikan GOWA sebagai satu-satunya bukti status order/pembayaran.

## Risiko GOWA

Karena GOWA memakai jalur tidak resmi, risiko utamanya:

- Sesi WhatsApp bisa logout dan butuh scan QR atau pairing ulang.
- Nomor bisa terkena limit atau ban jika pola kirim dianggap spam.
- Endpoint bisa berubah saat versi GOWA di-upgrade.
- Delivery status tidak sekuat provider resmi WhatsApp Business API.
- Secara terms, jalur unofficial lebih berisiko dibanding provider resmi.

Mitigasi yang wajib:

- Pakai hanya untuk pesan operasional, bukan blast besar.
- Tambahkan `GOWA_DRY_RUN` sebelum live.
- Rate limit konservatif, misalnya 1 pesan per 5-15 detik per device.
- Batasi daily cap per nomor/device.
- Simpan outbox dan attempt log agar pesan gagal bisa di-retry manual.
- Tampilkan status session/device di admin.
- Sediakan tombol retry, mark skipped, dan copy pesan manual.
- Jangan kirim OTP atau keputusan pembayaran kritis hanya melalui GOWA.

## Environment Variables

Untuk Cloudflare Pages production:

```env
GOWA_ENABLED=false
GOWA_DRY_RUN=true
GOWA_BASE_URL=https://wa-api.meyya.id
GOWA_DEVICE_ID=628xxxxxxxxx@s.whatsapp.net
GOWA_BASIC_AUTH_USERNAME=
GOWA_BASIC_AUTH_PASSWORD=
GOWA_API_TIMEOUT_MS=8000
GOWA_RATE_LIMIT_SECONDS=10

SENDY_ENABLED=false
SENDY_DRY_RUN=true
SENDY_BASE_URL=https://email.meyya.id
SENDY_API_KEY=
SENDY_BRAND_ID=
SENDY_CUSTOMER_LIST_ID=
SENDY_FROM_NAME=Meyya
SENDY_FROM_EMAIL=
SENDY_REPLY_TO=
```

Jika GOWA diakses via Cloudflare Tunnel, pastikan endpoint tetap bisa dipanggil oleh Cloudflare Pages Functions. Pages Functions outbound harus menuju hostname HTTPS yang dapat dijangkau publik atau dilindungi auth yang bisa dipakai server-side.

## Rencana Database

Tahap pertama cukup satu tabel outbox dan satu tabel attempt log.

```sql
CREATE TABLE IF NOT EXISTS message_outbox (
  id TEXT PRIMARY KEY,
  channel TEXT NOT NULL CHECK (channel IN ('WHATSAPP', 'EMAIL')),
  provider TEXT NOT NULL CHECK (provider IN ('GOWA', 'SENDY', 'MANUAL')),
  recipient TEXT NOT NULL,
  recipient_name TEXT,
  template_key TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  payload_json TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'SKIPPED')),
  priority INTEGER NOT NULL DEFAULT 100,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  next_attempt_at TEXT,
  provider_message_id TEXT,
  last_error TEXT,
  source_type TEXT,
  source_id TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sent_at TEXT,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS message_delivery_logs (
  id TEXT PRIMARY KEY,
  outbox_id TEXT NOT NULL REFERENCES message_outbox(id),
  status TEXT NOT NULL,
  provider_response_json TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

Index yang disarankan:

```sql
CREATE INDEX IF NOT EXISTS idx_message_outbox_status_next_attempt
ON message_outbox(status, next_attempt_at, priority, created_at);

CREATE INDEX IF NOT EXISTS idx_message_outbox_source
ON message_outbox(source_type, source_id);
```

## Rencana Internal API Meyya.id

Endpoint admin/semi otomatis:

- `GET /api/admin/messaging/providers/status`
  - Cek GOWA enabled, dry-run, device status, Sendy enabled.
- `POST /api/admin/messaging/whatsapp/test`
  - Kirim pesan test ke nomor admin.
- `POST /api/admin/messaging/email/test`
  - Kirim email test atau buat campaign test.
- `POST /api/admin/messaging/outbox`
  - Buat outbox manual dari template yang sudah tervalidasi.
- `POST /api/admin/messaging/outbox/:id/send`
  - Kirim satu outbox secara semi otomatis.
- `POST /api/admin/messaging/outbox/:id/retry`
  - Reset status gagal menjadi pending.
- `POST /api/admin/messaging/outbox/:id/skip`
  - Tandai tidak dikirim.

Endpoint internal/cron:

- `POST /api/internal/messaging/process-outbox`
  - Dipanggil Cloudflare Cron Worker atau maintenance worker.
  - Ambil batch kecil, misalnya 10 pesan.
  - Lock status menjadi `PROCESSING`.
  - Kirim ke provider.
  - Update `SENT`, `FAILED`, atau jadwalkan retry.

Endpoint verifikasi nomor WhatsApp:

- `POST /api/user/phone-verification`
  - Membuat kode `MEYYA-WA-xxxxxx` untuk user login.
  - Membuka `web.whatsapp.com` ke nomor WhatsApp Meyya dengan pesan yang berisi kode, nama, email, dan nomor akun.
  - Kode berlaku 30 menit.
- `POST /api/webhooks/gowa?secret=...`
  - Menerima webhook message incoming dari GOWA.
  - Membaca kode verifikasi dari pesan.
  - Mencocokkan nomor pengirim dengan `users.phone_wa`.
  - Mengisi `users.phone_wa_verified_at` jika cocok.

Catatan verifikasi:

- Alur ini sengaja membuat customer mengirim pesan duluan ke nomor Meyya, sehingga relasi chat lebih natural dan nomor Meyya tidak memulai kontak dingin.
- Status trusted utama tetap disimpan di D1. GOWA akan memiliki chat incoming, tetapi menyimpan nomor ke Google Contacts/phonebook bersama perlu integrasi Google Contacts API terpisah.
- Env yang perlu disiapkan: `MEYYA_SUPPORT_WHATSAPP` dan `GOWA_WEBHOOK_SECRET`.

## Mapping Event Ke Template

Prioritas awal WhatsApp:

| Event | Channel | Mode awal | Catatan |
| --- | --- | --- | --- |
| Order dibuat, belum bayar | WhatsApp | Semi otomatis | Admin klik kirim reminder |
| Payment reminder | WhatsApp | Otomatis setelah stabil | Jangan terlalu sering |
| Order diproses | WhatsApp | Semi otomatis | Aman untuk operasional |
| Resi dikirim | WhatsApp | Semi otomatis/otomatis | Cocok setelah tracking resi stabil |
| Order selesai | WhatsApp + Email | Otomatis | Bisa ajak review |
| Birthday voucher | WhatsApp + Email | Otomatis | Wajib cek aturan 1x per tahun |
| Abandoned cart | WhatsApp | Semi otomatis dulu | Riskan dianggap spam jika terlalu agresif |
| Return/exchange update | WhatsApp + Email | Semi otomatis | Bagus karena sifatnya operasional |

Prioritas awal email:

| Event | Provider | Catatan |
| --- | --- | --- |
| Newsletter/promo | Sendy | Use case utama Sendy |
| Customer list sync | Sendy | Subscribe/update list dan custom fields |
| Order status email | Sendy atau SES langsung | Perlu validasi API Sendy cocok untuk transactional |
| Birthday email | Sendy autoresponder/campaign | Bisa memakai custom field tanggal lahir |

## Template Dan Variable Validation

Integrasi wajib memakai sistem template yang sudah punya preview dan validation. Jangan biarkan admin memasukkan placeholder bebas yang tidak dikenali.

Aturan:

- Setiap template punya `template_key`.
- Setiap template punya daftar variable valid.
- Preview harus dilakukan sebelum outbox dibuat.
- Jika variable wajib kosong, outbox tidak boleh dibuat.
- Simpan `payload_json` agar pesan bisa diaudit walau data order berubah.

Contoh variable untuk `order_shipped`:

```json
{
  "customer_name": "Ayu",
  "order_number": "MY-20260506-001",
  "courier": "JNE",
  "tracking_number": "ABC123",
  "tracking_url": "https://meyya.id/profil?tab=orders"
}
```

## Phone Normalization

Sebelum dikirim ke GOWA:

- Hapus spasi, tanda hubung, kurung, dan plus.
- Ubah awalan `08` menjadi `628`.
- Ubah awalan `8` menjadi `628`.
- Validasi minimal panjang nomor Indonesia.
- Untuk GOWA individual chat, format akhir: `628xxxxxxxxx@s.whatsapp.net`.
- Simpan nomor asli dan nomor normalized untuk audit jika perlu.

## Strategi Pengiriman GOWA

Tahap 1, dry-run:

- UI admin membuat outbox.
- Provider adapter tidak memanggil GOWA.
- Log response palsu `DRY_RUN`.
- Admin bisa melihat body final dan copy manual.

Tahap 2, semi otomatis:

- Admin klik tombol kirim.
- Server cek `GOWA_ENABLED=true`, `GOWA_DRY_RUN=false`.
- Server cek status device.
- Server call `POST {GOWA_BASE_URL}/send/message`.
- Header `X-Device-Id` dikirim.
- Basic auth dikirim jika dikonfigurasi.
- Response dicatat ke `message_delivery_logs`.

Tahap 3, otomatis terbatas:

- Event penting membuat outbox `PENDING`.
- Cloudflare Cron Worker memproses batch kecil.
- Ada retry backoff, misalnya 5 menit, 30 menit, 2 jam.
- Jika gagal 3x, status menjadi `FAILED` dan muncul di admin.

## Strategi Sendy + Amazon SES

Sendy paling kuat untuk:

- Menyimpan list subscriber.
- Menyinkronkan customer ke list/segment.
- Mengirim campaign dan newsletter murah via Amazon SES.
- Melihat opens, clicks, bounce, complaint, dan unsubscribe dari dashboard Sendy.

Sendy API yang relevan:

- `POST /subscribe` untuk subscribe/update subscriber.
- `POST /unsubscribe` untuk unsubscribe.
- `POST /api/lists/get-lists.php` untuk daftar list.
- `POST /api/brands/get-brands.php` untuk daftar brand.
- `POST /api/campaigns/create.php` untuk create/send/schedule campaign.

Catatan penting:

- Create/send campaign via API butuh cron Sendy aktif.
- Untuk transactional email satu penerima, Sendy bisa terasa kurang pas karena API campaign memang berorientasi list/segment.
- Jika transactional email butuh delivery guarantee dan personalisasi kuat, opsi masa depan: direct Amazon SES API dari Worker, atau service email transactional lain.

## Email Consent

Pisahkan consent:

- Operational email: order status, retur, pembayaran, resi. Ini bisa dikirim karena terkait transaksi.
- Marketing email: promo, campaign, newsletter. Ini wajib menghormati unsubscribe dan consent.

Meyya perlu field data:

- `email_marketing_opt_in`
- `whatsapp_marketing_opt_in`
- `operational_messages_enabled`
- `unsubscribed_at`

## Security

GOWA:

- Wajib HTTPS.
- Wajib auth, minimal basic auth kuat.
- Jangan expose UI login GOWA tanpa proteksi.
- Batasi origin bila memungkinkan.
- Jangan simpan credential di repo.
- Jangan log full auth header.

Sendy:

- Simpan API key hanya di env Cloudflare.
- Pastikan Sendy admin dilindungi password kuat.
- Domain email harus punya SPF, DKIM, dan DMARC.
- Pantau bounce dan complaint di Sendy/SES.

## Monitoring Admin

Tambahkan panel admin nanti:

- Status GOWA: enabled, dry-run, connected, logged in, device id.
- Tombol test WhatsApp.
- Status Sendy: enabled, dry-run, base URL reachable.
- Tombol test email.
- Outbox pending/gagal.
- Delivery log per pesan.
- Retry dan skip.
- Last provider error.

## Rencana Eksekusi Bertahap

1. Inventory server Oracle yang sudah punya GOWA:
   - URL internal/public.
   - Versi GOWA.
   - Mode deploy: binary, Docker, docker compose, atau systemd.
   - Auth yang aktif.
   - Device id yang login.
   - Apakah endpoint `/devices` dan `/send/message` bisa dipanggil.
2. Tambah env provider di Cloudflare Pages production dengan `GOWA_ENABLED=false` dan `GOWA_DRY_RUN=true`.
3. Tambah tabel `message_outbox` dan `message_delivery_logs`.
4. Buat provider adapter `gowa` dan `sendy` dengan dry-run default.
5. Tambah admin panel status provider dan test send.
6. Hubungkan template message existing ke outbox.
7. Aktifkan semi otomatis untuk order status dan payment reminder.
8. Aktifkan automatic cron batch kecil setelah log stabil.
9. Tambah Sendy subscriber sync dari customer profile dan checkout.
10. Evaluasi direct Amazon SES untuk transactional email jika Sendy tidak ideal untuk pesan satu-per-satu.

## Open Questions Untuk Eksekusi Nanti

- GOWA server Oracle saat ini expose di hostname apa?
- Auth GOWA yang aktif basic auth atau reverse proxy token?
- Device id WhatsApp yang dipakai untuk toko apa?
- Apakah nomor toko aman dipakai untuk pesan operasional volume rendah?
- Apakah Sendy sudah terinstall atau baru rencana?
- Brand/list Sendy apa yang akan dipakai untuk customer Meyya?
- Apakah email domain Meyya sudah verified di Amazon SES?

## Verdict

GOWA layak dipakai untuk operasional semi otomatis dan otomatis ringan selama ada outbox, dry-run, rate limit, dan fallback manual. Untuk broadcast marketing besar, tetap lebih aman memakai kanal resmi atau email.

Sendy + Amazon SES layak untuk email murah, terutama newsletter dan list management. Untuk transactional email kritis, rancang adapter agar nanti bisa diganti ke direct SES tanpa mengubah template dan outbox.
