# Analisis Komparasi Desain Autentikasi Meyya

Dokumen ini membandingkan halaman `/profil` versi logged-in dengan halaman `/login` yang memakai komponen Clerk (`<SignIn />` dan `<SignUp />`). Tujuannya bukan mengubah kode sekarang, tetapi memberi spesifikasi visual dan solusi styling agar Clerk terasa sama persis dengan form native Meyya.id, terutama form profil dan auth native lama.

Referensi kode utama:

| Area | File | Fungsi Desain |
| --- | --- | --- |
| `/login` | `src/pages/Auth.tsx` | Shell auth, tab Masuk/Daftar, Clerk `appearance` saat ini. |
| `/profil` logged-in | `src/pages/Profile.tsx` | Layout panel profil, sidebar ikon, content card. |
| Form native profil | `src/components/profile/ProfileAccount.tsx` | Sumber paling akurat untuk input capsule, label, ikon Lucide, fokus border. |
| Autosuggest native | `src/components/profile/AutoSuggest.tsx` | Sumber input capsule tanpa ikon dan dropdown native. |
| Global style | `src/index.css` | Glass panel, warna `ink`, override global Clerk yang sudah ada. |

---

## Kesimpulan Utama

`/profil` logged-in sudah punya bahasa visual Meyya yang jelas: glassmorphism hangat, white translucent cards, form capsule, border abu-abu tipis, fokus menjadi hitam, label uppercase kecil dengan tracking lebar, ikon Lucide tipis di kiri input, dan tombol capsule hitam dengan teks uppercase letter-spaced.

`/login` sudah cukup dekat karena wrapper-nya memakai `glass-panel` dan beberapa Clerk `appearance.elements`, tetapi Clerk masih membawa struktur SaaS bawaan: label dan spacing internal berbeda, input tidak selalu punya ikon Lucide di kiri, beberapa wrapper internal punya padding/shadow sendiri, social button punya detail seperti badge, dan state fokus/error/OTP/password field belum sepenuhnya mengikuti native Meyya.

Target terbaik: jangan membuat `/login` terlihat seperti widget Clerk. Buat Clerk menjadi isi form di dalam panel Meyya, dengan semua elemen visual mengikuti ukuran native dari `/profil`.

---

## DNA Visual `/profil` Logged-In

### Page Shell

| Properti | Nilai Native `/profil` | Catatan Replikasi Untuk `/login` |
| --- | --- | --- |
| Lebar halaman | `max-w-6xl` | `/profil` luas karena dashboard. `/login` tetap boleh `max-w-[560px]`, tetapi rasa panel harus sama. |
| Padding horizontal | `px-4` | Sama dengan `/login`; pertahankan untuk mobile. |
| Padding vertikal | `py-12 md:py-20` | `/login` sekarang `py-16`; bisa disamakan ke `py-12 md:py-20` jika ingin ritme sama. |
| Heading | `text-3xl font-light font-heading mb-12 text-center text-ink` | Auth heading Clerk disembunyikan, tetapi tab/header custom harus mempertahankan font ringan dan tracking Meyya. |
| Background global | `linear-gradient(135deg, #fdfcfb 0%, #e2d1c3 100%)` | Sudah global di `index.css`; jangan beri background putih solid pada Clerk card. |

### Panel Dan Card

| Elemen | `/profil` Logged-In | Rekomendasi `/login` Clerk |
| --- | --- | --- |
| Outer glass panel | `glass-panel p-2 md:p-4 rounded-[32px] md:rounded-[48px] shadow-xl border border-white/40` | `/login` sekarang `glass-panel p-6 sm:p-10 md:p-12 rounded-[40px]`. Ini cocok untuk single form, tetapi pastikan Clerk card tetap transparent. |
| Inner content card | `bg-white/60 rounded-[24px] md:rounded-[36px] p-6 lg:p-12 border border-black/5 min-h-[500px]` | Clerk card tidak boleh membuat card putih baru. Jika perlu, bungkus Clerk dengan inner card custom `bg-white/60 rounded-[24px] md:rounded-[36px] p-6 sm:p-10 border border-black/5`. |
| Sidebar/menu card | `bg-white/40 rounded-[24px] md:rounded-[36px] p-4 md:p-6 border border-black/5` | Untuk auth, tab Masuk/Daftar adalah padanan sidebar. Tab harus terasa seperti elemen native, bukan navbar Clerk. |
| Shadow | `shadow-xl` pada outer profile panel, glass-panel shadow global `0 25px 50px -12px rgba(0,0,0,.08)` | Clerk `.cl-card` dan `.cl-cardBox` harus `box-shadow: none`; shadow cukup dari Meyya panel. |

### Form Rhythm

| Properti | Native `/profil` | Makna Visual |
| --- | --- | --- |
| Form vertical groups | `space-y-12` | Section besar terasa airy dan premium. |
| Section spacing | `space-y-6` | Jarak antar field group sekitar 24px. |
| Grid field gap | `grid grid-cols-1 md:grid-cols-2 gap-6` | Gap 24px antar kolom/field. |
| Address inner panel | `glass-panel p-6 rounded-3xl bg-white/40 space-y-4` | Field bertahap dikelompokkan dalam panel translucent. |
| Save area | `pt-8 text-center border-t border-black/10` | Button akhir diberi jarak 32px dan separator 10% black. |

Untuk `/login`, form Clerk sebaiknya memakai ritme lebih compact dari profil karena hanya login/register, tetapi tetap memakai skala native: `form: flex flex-col gap-5 w-full` sudah mendekati `space-y-5`. Jika ingin meniru `/profil` lebih ketat, pakai `gap-6` untuk area field dan `mt-8` sebelum submit/social section.

---

## Spesifikasi Field Native Meyya

### Label

Label native di `/profil`:

```tsx
<label className="block text-xs uppercase tracking-widest opacity-60 mb-2">
  Nama Lengkap
</label>
```

Spesifikasi label:

| Properti | Nilai | Detail |
| --- | --- | --- |
| Display | `block` | Label berada di atas input. |
| Font size | `text-xs` | 12px Tailwind. |
| Case | `uppercase` | Semua label kapital. |
| Letter spacing | `tracking-widest` | Meyya terasa editorial/premium. |
| Opacity | `opacity-60` | Hitam tidak terlalu dominan. |
| Margin bottom | `mb-2` | 8px jarak label ke capsule. |

Catatan penting: dokumen lama sempat menyebut native auth tanpa label. Untuk meniru `/profil` logged-in, label jangan disembunyikan. Current `/login` sudah benar membuka label dengan `formFieldLabelRow: "flex mb-2"` dan `formFieldLabel: "text-[10px] font-medium text-black/60 uppercase tracking-widest ml-1 block"`. Agar lebih identik dengan `/profil`, naikkan `text-[10px]` menjadi `text-xs`, hilangkan `ml-1` kecuali dibutuhkan untuk alignment, dan gunakan opacity/color `text-black/60`.

### Input Capsule Dengan Ikon

Field native berikon di `/profil`:

```tsx
<div className="relative">
  <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 opacity-50" />
  <input className="w-full bg-white/50 border border-black/10 rounded-full py-3 pl-12 pr-4 focus:outline-none focus:border-black/50 transition-colors text-sm" />
</div>
```

Spesifikasi capsule berikon:

| Properti | Nilai Native | Detail |
| --- | --- | --- |
| Wrapper | `relative` | Diperlukan untuk posisi ikon absolut. |
| Icon library | `lucide-react` | Contoh: `User`, `Mail`, `Phone`, `MapPin`. |
| Icon size | `16` | Ikon kecil, bukan hero icon besar. |
| Icon position | `absolute left-4 top-1/2 -translate-y-1/2` | 16px dari kiri, center vertical. |
| Icon opacity | `opacity-50` | Ikon subtle, tidak mendominasi. |
| Input width | `w-full` | Selalu penuh mengikuti parent. |
| Background | `bg-white/50` | Capsule translucent. Untuk autosuggest `bg-white/80`, tetapi field profil utama pakai `/50`. |
| Border idle | `border border-black/10` | Grey border sangat tipis, bukan border gelap. |
| Border focus | `focus:border-black/50` | Saat fokus border menjadi black 50%, bukan blue ring. |
| Radius | `rounded-full` | Bentuk capsule/pill penuh. |
| Padding vertical | `py-3` | 12px atas dan bawah. |
| Padding left berikon | `pl-12` | 48px agar teks tidak tabrakan ikon. |
| Padding right | `pr-4` | 16px kanan. |
| Font size | `text-sm` | 14px; current `/login` `text-base` terasa lebih Clerk/SaaS. |
| Focus outline | `focus:outline-none` | Tidak ada outline browser default. |
| Transition | `transition-colors` | Fokus terasa halus. |

Field native tanpa ikon di autosuggest:

```tsx
className="w-full bg-white/80 border border-black/10 rounded-full py-3 px-4 outline-none focus:border-black/50 transition-colors text-sm"
```

Spesifikasi tanpa ikon: `py-3 px-4`, `text-sm`, `rounded-full`, `bg-white/80`, `border-black/10`, `focus:border-black/50`.

### Disabled Input

Email disabled di `/profil`:

```tsx
className="w-full bg-black/5 border border-transparent rounded-full py-3 pl-12 pr-4 opacity-70 cursor-not-allowed text-sm"
```

Clerk identity preview, readonly identifier, atau disabled step harus mengikuti ini: background `bg-black/5`, border transparent, opacity 70%, cursor not allowed jika memang disabled.

### Select Dan Phone Split Field

Native phone memakai dua capsule berdekatan:

| Elemen | Class Native | Detail |
| --- | --- | --- |
| Group | `flex gap-2` | Jarak antar capsule 8px. |
| Country select capsule | `relative w-32 border border-black/10 bg-white/50 rounded-full overflow-hidden focus-within:border-black/50 transition-colors` | Lebar 128px. |
| Select input | `w-full bg-transparent py-3 pl-4 pr-2 appearance-none outline-none text-sm font-medium z-10 relative cursor-pointer` | Tidak punya border sendiri. |
| Phone input capsule | `relative flex-1 border border-black/10 bg-white/50 rounded-full focus-within:border-black/50 transition-colors` | Border di wrapper, bukan input. |
| Phone icon | `Phone size={16}` dengan `left-4`, center vertical, opacity 50% | Sama seperti field lain. |
| Phone input | `w-full bg-transparent border-none outline-none py-3 pl-12 pr-4 text-sm` | Input transparan di dalam wrapper. |

Jika Clerk memakai phone number field, style idealnya harus diperlakukan sebagai split capsule: wrapper luar yang punya border/radius, input internal transparent, dan selector country tidak boleh punya border kotak sendiri.

### Textarea

Native textarea address:

```tsx
className="w-full bg-white/80 border border-black/10 rounded-2xl py-3 px-4 outline-none focus:border-black/50 resize-none text-sm"
```

Jika Clerk menampilkan field tambahan yang multiline, jangan pakai capsule penuh. Gunakan `rounded-2xl`, `py-3 px-4`, `bg-white/80`, border idle/focus sama.

---

## Spesifikasi Button Native Meyya

### Primary Button

Button profil:

```tsx
className="px-8 py-3 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs hover:bg-black/80 transition-colors w-full md:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
```

Button guest `/profil` menuju login:

```tsx
className="flex items-center gap-3 bg-ink text-white px-8 py-4 rounded-full font-medium tracking-wide uppercase text-sm hover:bg-black/80 transition-colors shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 duration-200"
```

Target Clerk submit button:

| Properti | Target |
| --- | --- |
| Background | `bg-ink` / `#121212` |
| Text | `text-white uppercase tracking-[0.2em] text-xs font-medium` |
| Shape | `rounded-full` |
| Padding | `px-8 py-3` untuk profil-identik, atau `px-6 py-4` untuk auth yang lebih chunky |
| Width | `w-full` pada auth, `md:w-auto` hanya jika tombol di luar form dashboard |
| Hover | `hover:bg-black/80` |
| Disabled | `disabled:opacity-50 disabled:cursor-not-allowed` |
| Shadow | Minimal; jangan pakai shadow Clerk bawaan. |
| Focus | Jika perlu ring, gunakan subtle `focus:ring-2 focus:ring-ink/20`, bukan blue browser ring. |

Current `/login` memakai `formButtonPrimary: "px-6 py-4 ... w-full mt-4"`. Secara rasa sudah Meyya, tetapi kalau ingin copy native `/profil` exact, ubah ukuran ke `px-8 py-3 text-xs`; kalau ingin mempertahankan auth CTA yang lebih empuk, `py-4` masih acceptable selama radius, uppercase, tracking, dan warna sama.

### Secondary Button / Cancel

Native modal secondary:

```tsx
className="flex-1 py-3 items-center justify-center rounded-full border border-black/20 text-gray-700 text-xs font-semibold uppercase tracking-widest hover:bg-black/5 transition-colors"
```

Clerk secondary action link/button, resend code, edit identifier, atau alternative actions harus memakai: `rounded-full`, border `black/10` atau `black/20`, hover `bg-black/5`, text uppercase kecil jika berupa button. Link biasa boleh `text-ink font-medium hover:underline text-sm` seperti current `/login`.

### Social Button

Current `/login`:

```tsx
socialButtonsBlockButton: "w-full flex items-center justify-center gap-3 bg-gradient-to-b from-white to-gray-50/80 border border-black/10 hover:border-black/20 py-4 px-6 rounded-full hover:bg-black/5 transition-all duration-300 text-sm font-medium text-ink shadow-sm hover:shadow-md relative overflow-hidden group"
```

Untuk meniru `/profil`, social button harus lebih minimal dan lebih native:

| Properti | Target |
| --- | --- |
| Background | `bg-white/50` atau `bg-white/60`, bukan gradient kuat. |
| Border idle | `border border-black/10`. |
| Border hover | `hover:border-black/20`. |
| Radius | `rounded-full`. |
| Padding | `py-3 px-4` jika mengikuti field profil, atau `py-4 px-6` jika auth CTA harus lebih besar. |
| Gap | `gap-3`, sama dengan guest login button. |
| Shadow | `shadow-none`; shadow kecil boleh hanya hover jika tidak mengganggu. |
| Text | `text-sm font-medium text-ink`, jangan font besar. |
| Badge | Badge Clerk seperti `Last used` harus dibuat capsule kecil atau disembunyikan agar tidak merusak pill. |

---

## `/login` Saat Ini Dibanding `/profil`

| Elemen | `/profil` Logged-In Native | `/login` Clerk Saat Ini | Gap Yang Harus Ditutup |
| --- | --- | --- | --- |
| Shell width | `max-w-6xl` dashboard; content card luas | `max-w-[560px]` auth card | Width auth sudah tepat. Fokus bukan width, tetapi isi Clerk. |
| Outer panel | `glass-panel`, rounded `32/48`, `p-2 md:p-4`, inner card jelas | `glass-panel p-6 sm:p-10 md:p-12 rounded-[40px]` | Auth tidak punya inner `bg-white/60` card. Ini boleh, tetapi semua Clerk card harus transparan. |
| Form label | `text-xs uppercase tracking-widest opacity-60 mb-2` | `text-[10px] uppercase tracking-widest ml-1` | Naikkan ke `text-xs`, hilangkan offset jika ingin exact. |
| Input bg | `bg-white/50` field utama, `bg-white/80` autosuggest | `bg-white/70` | Pakai `bg-white/50` untuk copy profil utama. |
| Input border | `border-black/10`, focus `black/50` | `border-black/10`, focus `black/50` | Sudah benar. Pastikan tidak ada ring/outline Clerk lain. |
| Input radius | `rounded-full` | `rounded-full` | Sudah benar. |
| Input padding | `py-3 pl-12 pr-4` dengan ikon, `py-3 px-4` tanpa ikon | `py-4 px-6`, tidak ada slot ikon native | Ukuran current lebih besar dan tanpa ikon. Perlu CSS/DOM strategy untuk ikon. |
| Input font | `text-sm` | `text-base` | Ubah ke `text-sm` agar match profil. |
| Icons | Lucide `size={16}`, `left-4`, opacity 50 | Clerk provider/input icons tidak sama; email/password field tidak punya Lucide | Perlu pseudo-element/icon overlay atau custom flow. |
| Button | `px-8 py-3`, `rounded-full`, uppercase, tracking `0.2em`, `text-xs` | `px-6 py-4`, uppercase, tracking `0.2em`, `text-xs` | Rasa sudah dekat; `py-4` lebih chunky dari profil. |
| Divider | Native separators `border-black/10` | `dividerLine bg-black/10`, text uppercase | Sudah dekat. |
| Footer | Profile tidak punya Clerk footer | `/login` hides `footer` | Jika footer needed, style as Meyya link, jangan pakai default card footer. |
| Error text | Native tidak banyak error UI; text kecil | `text-xs text-red-600 mt-1 pl-4` | Sudah selaras dengan capsule padding. |
| Internal wrapper | Native tidak punya extra wrapper visual | Clerk punya `.cl-card`, `.cl-cardBox`, hashed internal wrappers | Harus transparent, shadow-none, border-none, no forced width pada flex internals. |

---

## Target Class Map Untuk Clerk `appearance.elements`

Ini adalah solusi yang direkomendasikan tanpa mengimplementasikannya sekarang. Gunakan sebagai blueprint saat mengubah `Auth.tsx`.

```ts
const meyyaClerkAppearance = {
  variables: {
    fontFamily: 'inherit',
    colorPrimary: '#121212',
    colorText: '#121212',
    colorTextSecondary: 'rgba(0,0,0,0.6)',
    colorBackground: 'transparent',
    borderRadius: '9999px',
  },
  elements: {
    rootBox: 'w-full mx-auto flex flex-col items-center',
    cardBox: 'w-full m-0 p-0 bg-transparent shadow-none border-none rounded-none',
    card: 'w-full m-0 p-0 bg-transparent shadow-none border-none rounded-none',

    header: 'hidden',
    headerTitle: 'hidden',
    headerSubtitle: 'hidden',

    form: 'flex flex-col gap-6 w-full',
    formField: 'w-full',
    formFieldRow: 'w-full',
    formFieldLabelRow: 'flex mb-2',
    formFieldLabel: 'block text-xs uppercase tracking-widest text-black/60 font-medium',

    formFieldInput: 'w-full bg-white/50 border border-black/10 rounded-full py-3 px-4 focus:outline-none focus:border-black/50 focus:ring-0 transition-colors font-sans text-ink text-sm placeholder:font-light placeholder:text-black/40 shadow-none',
    formFieldInputShowPasswordButton: 'text-black/50 hover:text-ink transition-colors mr-3',
    formFieldSuccessText: 'text-xs text-green-600 mt-1 pl-4',
    formFieldErrorText: 'text-xs text-red-600 mt-1 pl-4',
    formFieldWarningText: 'text-xs text-orange-600 mt-1 pl-4',

    formButtonPrimary: 'w-full px-8 py-3 bg-ink text-white rounded-full uppercase tracking-[0.2em] text-xs font-medium hover:bg-black/80 transition-colors shadow-none border-none outline-none focus:ring-2 focus:ring-ink/20 disabled:opacity-50 disabled:cursor-not-allowed',

    socialButtons: 'flex flex-col gap-3 w-full',
    socialButtonsBlockButton: 'w-full flex items-center justify-center gap-3 bg-white/50 border border-black/10 hover:border-black/20 py-3 px-4 rounded-full hover:bg-black/5 transition-colors text-sm font-medium text-ink shadow-none',
    socialButtonsBlockButtonText: 'text-sm font-medium text-ink',
    socialButtonsProviderIcon: 'w-4 h-4',

    dividerLine: 'bg-black/10',
    dividerText: 'text-black/50 font-light text-xs px-4 bg-transparent uppercase tracking-widest',

    footer: 'bg-transparent border-none shadow-none p-0 mt-6',
    footerActionText: 'text-gray-500 font-light text-sm text-center',
    footerActionLink: 'text-ink font-medium hover:underline text-sm',

    identityPreview: 'bg-black/5 border border-transparent rounded-full py-3 px-4 text-sm shadow-none',
    identityPreviewText: 'text-sm text-ink',
    identityPreviewEditButton: 'text-ink hover:underline text-xs uppercase tracking-widest',

    alert: 'mb-6 p-4 rounded-xl bg-red-50 border border-red-100 shadow-none',
    alertText: 'text-xs text-red-600',
  },
};
```

Catatan: class di atas membuat input tanpa ikon karena Clerk `appearance` tidak menyediakan slot React Lucide per input. Untuk ikon Lucide seperti `/profil`, perlu strategi tambahan di bawah.

---

## Strategi Ikon Lucide Pada Clerk Field

Native `/profil` memakai ikon Lucide di dalam capsule. Clerk prebuilt tidak memberi API resmi untuk memasukkan komponen React `Mail`, `Lock`, atau `User` ke setiap field input. Ada tiga solusi, dari yang paling aman sampai yang paling exact.

### Solusi A: CSS Pseudo-Element Berdasarkan Field Identifier

Gunakan global CSS yang menargetkan wrapper field Clerk berdasarkan atribut stabil, lalu menambahkan icon sebagai background image atau pseudo-element.

Konsep:

```css
.cl-formField:has(input[name="identifier"]),
.cl-formField:has(input[name="emailAddress"]) {
  position: relative;
}

.cl-formField:has(input[name="identifier"])::before,
.cl-formField:has(input[name="emailAddress"])::before {
  content: "";
  position: absolute;
  left: 16px;
  top: calc(50% + 12px);
  width: 16px;
  height: 16px;
  opacity: .5;
  pointer-events: none;
  background: currentColor;
  mask: url('/icons/mail.svg') center / contain no-repeat;
}

.cl-formField:has(input[name="identifier"]) .cl-formFieldInput,
.cl-formField:has(input[name="emailAddress"]) .cl-formFieldInput {
  padding-left: 48px !important;
  padding-right: 16px !important;
}
```

Kelebihan: tetap memakai Clerk prebuilt, bisa terlihat sangat mirip native. Kekurangan: perlu memastikan selector `input[name="..."]` stabil pada versi Clerk yang dipakai, dan pseudo-element bukan benar-benar `lucide-react` melainkan SVG mask yang meniru Lucide.

### Solusi B: CSS Background SVG Pada Input

Tambahkan `background-image` SVG Lucide langsung pada input tertentu, lalu set `background-position: 16px center`, `background-size: 16px`, `padding-left: 48px`.

Kelebihan: lebih sederhana dari pseudo-element. Kekurangan: sulit mengubah opacity/stroke secara presisi, dan background input bisa bentrok dengan `bg-white/50` jika tidak disusun dengan benar.

### Solusi C: Custom Clerk Flow Dengan Hooks

Bangun form sendiri memakai `useSignIn()` dan `useSignUp()`, lalu render input native Meyya secara penuh seperti `ProfileAccount.tsx`.

Kelebihan: hasil paling exact karena bisa langsung memakai `<Mail size={16} />`, `<Lock size={16} />`, `<User size={16} />`, wrapper `relative`, `pl-12`, dan semua class native. Kekurangan: lebih banyak logic auth yang harus dijaga sendiri, termasuk error, verification, MFA, reset, dan OAuth.

Rekomendasi praktis: mulai dari Solusi A bila ingin tetap prebuilt Clerk. Pilih Solusi C hanya jika brand fidelity lebih penting daripada maintenance simplicity.

---

## CSS Override Global Yang Disarankan

Ini blueprint CSS, bukan implementasi saat ini. Tempat paling tepat adalah `src/index.css` di layer components, karena Clerk menghasilkan DOM internal di luar kontrol langsung React.

```css
@layer components {
  .cl-rootBox,
  .cl-cardBox,
  .cl-card {
    width: 100% !important;
  }

  .cl-cardBox,
  .cl-card,
  .cl-footer {
    background: transparent !important;
    border: 0 !important;
    box-shadow: none !important;
  }

  .cl-card {
    padding: 0 !important;
  }

  .cl-formFieldInput {
    min-height: 46px !important;
    background-color: rgba(255, 255, 255, .5) !important;
    border: 1px solid rgba(0, 0, 0, .1) !important;
    border-radius: 9999px !important;
    padding: 12px 16px !important;
    color: #121212 !important;
    font-size: 14px !important;
    line-height: 20px !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .cl-formFieldInput:focus,
  .cl-formFieldInput:focus-visible,
  .cl-formFieldInput:focus-within {
    border-color: rgba(0, 0, 0, .5) !important;
    box-shadow: none !important;
    outline: none !important;
  }

  .cl-formFieldInput::placeholder {
    color: rgba(0, 0, 0, .4) !important;
    font-weight: 300 !important;
  }

  .cl-formFieldLabel {
    display: block !important;
    margin-bottom: 8px !important;
    color: rgba(0, 0, 0, .6) !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: .1em !important;
    text-transform: uppercase !important;
  }

  .cl-formButtonPrimary {
    min-height: 44px !important;
    border-radius: 9999px !important;
    background: #121212 !important;
    color: #fff !important;
    padding: 12px 32px !important;
    font-size: 12px !important;
    font-weight: 500 !important;
    letter-spacing: .2em !important;
    text-transform: uppercase !important;
    box-shadow: none !important;
  }

  .cl-formButtonPrimary:hover {
    background: rgba(0, 0, 0, .8) !important;
  }

  .cl-socialButtonsBlockButton {
    min-height: 46px !important;
    border-radius: 9999px !important;
    border: 1px solid rgba(0, 0, 0, .1) !important;
    background: rgba(255, 255, 255, .5) !important;
    padding: 12px 16px !important;
    box-shadow: none !important;
  }

  .cl-socialButtonsBlockButton:hover {
    border-color: rgba(0, 0, 0, .2) !important;
    background: rgba(0, 0, 0, .05) !important;
  }
}
```

Penting: hindari override berbasis class hashed seperti `.cl-internal-1h6fgzy` kecuali benar-benar terpaksa. Class internal Clerk bisa berubah saat package update. Lebih aman target class publik Clerk seperti `.cl-card`, `.cl-cardBox`, `.cl-formFieldInput`, `.cl-formButtonPrimary`, `.cl-socialButtonsBlockButton`, dan selector berbasis atribut input.

---

## Solusi Untuk Cut-Off Dan Overflow Clerk

Masalah sisi tombol atau badge Clerk yang terpotong biasanya terjadi karena wrapper internal dipaksa `width: 100% !important` di dalam flex/grid container yang sudah punya `gap`. Hasilnya total lebar menjadi 100% plus gap/padding, lalu overflow ke kanan/kiri.

Prinsip solusi:

| Level DOM | Boleh Dipaksa Width? | Alasan |
| --- | --- | --- |
| `.cl-rootBox` | Ya, `width: 100%` | Level luar harus mengikuti panel Meyya. |
| `.cl-cardBox` | Ya, `width: 100%` | Level card harus penuh. |
| `.cl-card` | Ya, `width: 100%` | Isi utama harus penuh. |
| `.cl-form` | Ya, `width: 100%` | Form harus memenuhi card. |
| `.cl-formField` | Hati-hati, boleh jika tidak berada di row flex dengan gap | Aman untuk single column. |
| `.cl-formFieldRow` | Jangan paksa global `width: 100%` jika row punya flex/gap | Ini sumber umum cut-off. |
| `.cl-internal-*` | Jangan paksa global | Hashed dan layout-nya tidak stabil. |

Current `index.css` sudah mencatat bahwa `width: 100%` pada internal flex items pernah dihapus untuk menghindari overflow. Pertahankan prinsip itu.

---

## Tab Masuk/Daftar

Current `/login` tab:

```tsx
<div className="flex mb-8 relative border-b border-black/10">
  <button className="flex-1 py-4 text-sm tracking-widest uppercase transition-colors hover:bg-black/5 ...">
  <div className="absolute bottom-0 left-0 h-[2px] bg-ink transition-transform duration-300 w-1/2" />
</div>
```

Ini sudah sesuai DNA Meyya: uppercase, tracking lebar, border hitam 10%, active indicator hitam. Untuk lebih match `/profil`, pastikan inactive state memakai `opacity-50 font-light`, active state `opacity-100 font-medium`, dan hover hanya `bg-black/5`.

Jangan pakai tab Clerk bawaan jika ada. Clerk header, footer navigation, atau title bawaan sebaiknya disembunyikan atau dipetakan ke tab custom ini.

---

## Checklist Exact Match `/profil` Untuk `/login`

| Checklist | Target |
| --- | --- |
| Clerk card transparent | `.cl-cardBox` dan `.cl-card`: `background transparent`, `shadow none`, `border none`, `padding 0`. |
| Form capsule | Semua input: `rounded-full`, `bg-white/50`, `border-black/10`, `focus:border-black/50`, no blue ring. |
| Padding input | Tanpa ikon: `py-3 px-4`. Dengan ikon: `py-3 pl-12 pr-4`. |
| Font input | `text-sm`, `font-sans`, `text-ink`. |
| Placeholder | `font-light`, `text-black/40`. |
| Label | `text-xs uppercase tracking-widest text-black/60 mb-2`. |
| Icon | Lucide-style 16px, `left: 16px`, vertical center, opacity 50%. |
| Button primary | `bg-ink`, `rounded-full`, `px-8 py-3`, uppercase, `tracking-[0.2em]`, `text-xs`. |
| Social button | `bg-white/50`, `border-black/10`, `rounded-full`, `py-3 px-4`, no Clerk shadow. |
| Divider | Line `black/10`, text `text-xs uppercase tracking-widest text-black/50`. |
| Error text | `text-xs text-red-600 mt-1 pl-4`. |
| Disabled/identity | `bg-black/5`, `border-transparent`, `opacity-70`. |
| Layout spacing | Form `gap-6` or `gap-5`, tab margin bottom `mb-8`, outer panel padding `p-6 sm:p-10 md:p-12`. |
| Overflow | Only top-level Clerk containers forced width; avoid global width on `.cl-formFieldRow` and `.cl-internal-*`. |

---

## Recommended Implementation Path Later

1. First, refine `commonAppearance` in `Auth.tsx` to match the class map above: input `text-sm`, `py-3`, `bg-white/50`, label `text-xs`, primary button `px-8 py-3` if exact `/profil` copy is desired.
2. Add stable global CSS in `index.css` for Clerk public class names only, because some Clerk states ignore Tailwind classes from `appearance`.
3. Add icon treatment with CSS pseudo-elements or SVG background for email, password, name, and phone fields. Use `padding-left: 48px` only on fields that receive icons.
4. Keep Clerk header hidden and continue using the existing Meyya tab navigation.
5. Test login, register, OAuth, password reveal, OTP/email verification, error states, loading states, mobile width, and the `Last used` social badge.
6. If prebuilt Clerk still cannot match native field DOM closely enough, switch `/login` to a custom Clerk flow using `useSignIn()` and `useSignUp()` so the form can reuse native Meyya markup exactly.

---

## Final Design Target

The successful `/login` page should feel like a smaller auth version of `/profil`: a translucent Meyya glass panel on the warm gradient background, with quiet uppercase labels, capsule inputs, grey hairline borders, black focus borders, 16px low-opacity Lucide icons, and pill buttons. Users should not visually notice that the form is Clerk-powered.
