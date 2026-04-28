# Analisis Komparasi Desain Autentikasi (Meyya Native vs Clerk)

Berdasarkan form autentikasi `Auth.tsx` MEYYA.ID asli sebelum menggunakan Clerk, berikut adalah analisis perbandingan detail yang memandu perombakan `appearance` komponen Clerk agar kembali ke *Brand Identity* Meyya.

| Elemen UI | MEYYA.ID Native (Lama) | Clerk (Bawaan) | Target Override (Meyya Custom Clerk) |
| --- | --- | --- | --- |
| **Kontainer Form / Latar** | Menyatu dengan `.glass-panel` bawaan aplikasi. Tidak ada kardus putih tambahan. | Di dalam `.cl-card` putih polos yang memiliki *box-shadow*. | Membuat class `.cl-cardBox` dan `.cl-card` menjadi `background: transparent; box-shadow: none; border: none;`. |
| **Input Text & Password** | `bg-white/50`, `border-black/10`, `rounded-full`, `py-3 px-6`, dengan placeholder `font-light`. | Sudut membulat kecil (`border-radius` standar), border pekat. | Menggunakan CSS API di `[elements]` untuk `formFieldInput` dengan class persis milik Meyya Lama. |
| **Label Form** | **Tidak ada.** Hanya mengandalkan *placeholder* instruktif untuk form. | Label berada di atas form text `First Name`, `Last Name`, dll. | Menyembunyikan elemen `.cl-formFieldLabelRow` secara keseluruhan via `hidden`. |
| **Primary Button (Submit)** | Gemuk/Montok: `py-3 px-6`, `rounded-full`, font `uppercase tracking-[0.2em] text-xs`, `bg-ink`. | Tombol proporsi standar *SaaS*, *Capitalized Case*. | Mengembalikan `formButtonPrimary` Clerk menjadi desain proporsi gemuk MEYYA dan tracking teks jarak jauh. |
| **Social / Login Google** | Gemuk & minimalis: `bg-white border-black/10 py-3 rounded-full text-ink`. | Menggunakan badge *Last Used* dan logo standar Clerk. | Menyesuaikan class elemen `socialButtonsBlockButton` supaya serupa dengan tombol *Social* lama. |
| **Pemisah (Divider "or")** | Garis batas tipis transparan `black/10` dengan teks *uppercase* tipis di tengah. | Garis divider abu-abu solid dengan teks normal. | Menambahkan `uppercase tracking-widest` pada `dividerText` Clerk. |

---

## Solusi Bug Sisi Kanan/Kiri Terpotong (Cut-off)

Masalah sisi tombol atau elemen internal form (seperti `Last used` badge) yang terpotong terjadi akibat deklarasi CSS ini pada *commit* sebelumnya:

```css
.cl-formFieldRow, .cl-internal-ji79b9, .cl-internal-... {
  width: 100% !important;
  max-width: 100% !important;
}
```

**Analisis:**
Sebagian besar *wrapper* internal Clerk menggunakan tata letak `display: flex` / `grid` dengan `gap` (jarak antar elemen). Jika elemen-elemen *flex item* di dalam *flex container* (yang memiliki `gap`) kita paksa menjadi `width: 100%`, maka total lebar elemen tersebut akan melebihi induknya (100% ditambah *margin/gap*), sehingga elemen meluap (*overflow* / kepotong) ke sisi kanan/kiri.

**Penyelesaian:**
Kita hanya perlu menaruh batasan lebar 100% di level atas (`cl-cardBox`, `cl-rootBox`), sementara komponen *inner* / internal biarkan menyesuaikan diri secara otomatis terhadap *parent container*-nya (*flex-stretch*), tanpa ditekankan `width: 100% !important`. Ini akan mengembalikan keseimbangan margin asli tanpa overflow.
