# 002 — Overlay masuk dan keluar dengan transisi, bukan toggle `display`

- **Status**: TODO
- **Commit**: tanpa commit (repo belum di-init saat plan ditulis; lihat `plans/001-verification-baseline.md`)
- **Severity**: HIGH
- **Category**: Purpose & frequency / Cohesion
- **Estimated scope**: 1 berkas (`index.html`), ~20 baris CSS

## Problem

Dua overlay utama situs ini muncul dan hilang secara instan, padahal elemen
saudaranya (panel pesanan) sudah dianimasikan. Hasilnya terasa seperti dua
aplikasi berbeda: panel pesanan halus, modal pembayaran "mletik".

1. **Modal bayar** — kontainer `.pay` di-toggle lewat `display`, dan `.pay-box`
   tidak punya transform sama sekali, jadi tidak ada fase masuk atau keluar:

```css
/* index.html:214-219 — sekarang */
.pay{position:fixed;inset:0;z-index:70;display:none}
.pay[data-open=true]{display:flex;align-items:flex-end;justify-content:center}
.pay-veil{position:absolute;inset:0;background:rgba(18,20,15,.52)}
.pay-box{
  position:relative;background:#fff;width:min(470px,100%);max-height:94vh;overflow-y:auto;overscroll-behavior:contain;
  border-radius:16px 16px 0 0;padding:0 18px 22px;display:grid;gap:12px;align-content:start;
}
```

2. **Veil panel pesanan** — sama, `display:block` tanpa fade, jadi latar gelap
   seluruh halaman berkedip saat panel dibuka atau ditutup:

```css
/* index.html:179-180 — sekarang */
.veil{position:fixed;inset:0;background:rgba(18,20,15,.42);z-index:60;display:none}
.veil[data-open=true]{display:block}
```

Kenapa ini penting: modal bayar adalah langkah terakhir sebelum orang membayar.
Muncul tanpa gerak, ia terbaca sebagai halaman baru yang menggantung, bukan
lembar yang datang dari bawah. `display` juga membunuh animasi keluar: apa pun
yang ditambahkan nanti tidak akan pernah terlihat saat menutup.

## Target

Ganti `display` dengan `opacity` + `visibility` supaya ada fase masuk **dan**
keluar. Kurva dan durasi diambil persis dari katalog audit.

```css
/* target — token, di dalam :root */
--ease-out: cubic-bezier(0.23, 1, 0.32, 1);
--ease-drawer: cubic-bezier(0.32, 0.72, 0, 1);
```

```css
/* target — veil panel pesanan */
.veil{
  position:fixed;inset:0;background:rgba(18,20,15,.42);z-index:60;
  opacity:0;visibility:hidden;
  transition:opacity 200ms var(--ease-out),visibility 0s linear 200ms;
}
.veil[data-open=true]{
  opacity:1;visibility:visible;
  transition:opacity 200ms var(--ease-out),visibility 0s;
}
```

```css
/* target — modal bayar */
.pay{
  position:fixed;inset:0;z-index:70;display:flex;align-items:flex-end;justify-content:center;
  opacity:0;visibility:hidden;
  transition:opacity 200ms var(--ease-out),visibility 0s linear 200ms;
}
.pay[data-open=true]{
  opacity:1;visibility:visible;
  transition:opacity 200ms var(--ease-out),visibility 0s;
}
.pay-veil{position:absolute;inset:0;background:rgba(18,20,15,.52)}

.pay-box{
  position:relative;background:#fff;width:min(470px,100%);max-height:94vh;overflow-y:auto;overscroll-behavior:contain;
  border-radius:16px 16px 0 0;padding:0 18px 22px;display:grid;gap:12px;align-content:start;
  transform:translateY(12px) scale(.98);opacity:0;
  transition:transform 260ms var(--ease-drawer),opacity 260ms var(--ease-out);
}
.pay[data-open=true] .pay-box{transform:none;opacity:1}
```

```css
/* target — media query desktop, ganti selector jadi tanpa data-open */
@media (min-width:640px){
  .pay{align-items:center;padding:20px}
  .pay-box{border-radius:16px;max-height:88vh}
}
```

Nilai yang dipakai, tanpa kira-kira: `200ms` untuk veil (modal standar),
`260ms` + `cubic-bezier(0.32, 0.72, 0, 1)` untuk lembar yang datang dari bawah,
`translateY(12px)` + `scale(.98)` sebagai awal (bukan `scale(0)`), `opacity`
sebagai pendamping. Tidak ada bounce.

## Repo conventions to follow

- Kurva ditulis sebagai token di `:root` bersama token lain (`--paper`, `--ink`,
  `--radius`, `--shadow-border`), lihat `index.html:12-30`. Jangan menaruh
  cubic-bezier mentah di aturan komponen.
- Animasi berbasis transisi CSS sudah jadi pola di berkas ini, contoh yang benar:
  `.panel{transform:translateX(100%);transition:transform .26s cubic-bezier(.22,.7,.24,1)}`
  di `index.html:184` dan `.panel[data-open=true]{transform:none}` di `:187`.
  Pola itu (state default + `[data-open=true]`) yang harus ditiru, bukan diubah.
- State overlay dikendalikan JavaScript lewat `payEl.dataset.open` dan
  `veil.dataset.open` (fungsi `bukaPay`/`tutupPay`, `bukaPanel`/`tutupPanel`).
  Jangan menyentuh JS: perubahan ini murni CSS.
- `@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}`
  di `index.html:284-285` sudah mematikan transisi. Pastikan setelah perubahan,
  dalam mode itu overlay tetap muncul dan hilang (langsung, tanpa animasi) —
  jangan pernah meninggalkannya dalam keadaan `visibility:hidden`.

## Steps

1. Tambahkan dua token di dalam `:root` (`index.html:12-30`), setelah
   `--radius:18px`:

   ```css
   --ease-out:cubic-bezier(0.23,1,0.32,1);
   --ease-drawer:cubic-bezier(0.32,0.72,0,1);
   ```

2. Ganti blok `.veil` + `.veil[data-open=true]` (`index.html:179-180`) dengan
   versi target di atas.

3. Ganti blok `.pay` + `.pay[data-open=true]` (`index.html:214-215`) dengan
   versi target. Jangan ubah `.pay-veil` selain memastikan tetap
   `position:absolute;inset:0` (fade-nya ikut kontainer).

4. Di `.pay-box` (`index.html:217-220`) tambahkan dua baris:

   ```css
   transform:translateY(12px) scale(.98);opacity:0;
   transition:transform 260ms var(--ease-drawer),opacity 260ms var(--ease-out);
   ```

   lalu tambahkan aturan baru tepat setelahnya:

   ```css
   .pay[data-open=true] .pay-box{transform:none;opacity:1}
   ```

5. Perbarui media query `@media (min-width:640px)` (`index.html:242-245`):
   `.pay[data-open=true]{align-items:center;padding:20px}` menjadi
   `.pay{align-items:center;padding:20px}`, sisanya tetap.

6. Cari sisa `display:none`/`display:block` yang masih mengatur `.veil` atau
   `.pay` di berkas ini; tidak boleh ada lagi.

## Boundaries

- Jangan menyentuh JavaScript (`bukaPay`, `tutupPay`, `bukaPanel`, `tutupPanel`,
  focus trap) — semua state sudah benar, hanya CSS yang berubah.
- Jangan mengubah `.panel` dan `.panel[data-open=true]` (sudah benar).
- Jangan mengubah markup HTML, teks, atau atribut `aria-*`.
- Jangan menyentuh berkas lain: `apps-script-upload.gs`, `assets/`,
  `index-v1.html`, `index-v2-backup.html`, `index-v3-backup.html`,
  `index-print.html`, `plans/001-*`.
- Jangan menambah dependensi atau pustaka animasi baru.
- Jangan menyentuh animasi GSAP (judul, kartu, hover) — itu plan lain.
- Kalau potongan CSS di "Problem" tidak lagi cocok dengan berkas (kode sudah
  berubah sejak plan ditulis), STOP dan laporkan.

## Verification

- **Mechanical**:
  - `node tools/check.mjs` → `Semua pemeriksaan PASS` (kalau `plans/001` sudah
    dijalankan). Kalau skrip itu belum ada, lewati dan catat "tidak ada baseline".
  - `grep -n "display:none" index.html` → tidak ada hasil yang cocok dengan
    `.veil` atau `.pay`.
  - `grep -n "ease-drawer\|ease-out" index.html` → token terdefinisi di `:root`
    dan dipakai di `.veil`, `.pay`, `.pay-box`.
- **Feel check** (buka `index.html` di browser, lebar 390px dan 1280px):
  - Klik "Bayar via QRIS atau GoPay": veil menggelap dengan fade, lembar putih
    naik 12px sambil memudar masuk selama ~260ms. Tidak ada lompatan.
  - Tutup dengan tombol X, klik veil, dan tombol Escape: ketiganya memudar
    keluar, bukan hilang seketika.
  - Buka panel pesanan (tombol "Pesan"): veil memudar, bukan berkedip.
  - Klik buka-tutup cepat 5 kali berturut-turut: animasi melanjutkan dari posisi
    terakhir, tidak pernah mengunci overlay dalam keadaan tak terlihat.
  - DevTools → Animations panel, playback 10%: perhatikan lembar bergerak dari
    `translateY(12px)` ke `0` dan skalanya dari `0.98` ke `1`.
  - DevTools → Rendering → `prefers-reduced-motion: reduce`: overlay tetap
    muncul/hilang seketika (tanpa gerak) dan tetap bisa ditutup.
  - Fokus keyboard: setelah modal tertutup, fokus kembali ke tombol "Pesan" di
    header; saat tertutup, Tab tidak masuk ke elemen modal.
- **Done when**: kedua overlay beranimasi masuk dan keluar di desktop dan HP,
  tidak ada `display` yang mengatur `.veil`/`.pay`, dan semua pemeriksaan
  `tools/check.mjs` (bila ada) tetap PASS.

## Maintenance notes

- Kalau nanti ada overlay baru (misal dialog konfirmasi), ikuti pola yang sama:
  `opacity` + `visibility` dengan `transition-delay` untuk `visibility`, jangan
  `display`.
- Fase keluar bergantung pada `visibility 0s linear <durasi>`; kalau durasi salah
  satu komponen diubah, ubah juga angka di baris itu, atau elemen akan tetap
  terlihat sesaat setelah transisi selesai.
- Reviewer cukup memeriksa: tidak ada perubahan JS, tidak ada perubahan markup,
  dan `prefers-reduced-motion` tidak meninggalkan overlay dalam keadaan
  `visibility:hidden` setelah ditutup.
