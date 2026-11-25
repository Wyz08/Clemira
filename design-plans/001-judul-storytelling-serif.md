# Judul storytelling memakai serif, konsisten dengan judul lain di surface

Written against: tidak tersedia (repo belum di-init sebagai git; hash `index.html` saat audit: `2075182e1aae33c2`)

## Evidence chain

- Surface: `index.html` — halaman tunggal Clemira Aren (hero → katalog → profil → pesan), jalur checkout UMKM.
- Problem: tiga judul besar — hero `h1` (`.lead h1`, `index.html:78`), judul tile produk (`.tile h2`, `:95`), dan judul bagian pesan (`.lead h2` di `:413`, memakai `style="font-size:clamp(1.6rem,3vw,2.3rem)"` inline) — dirender dengan sans-serif, sementara setiap judul lain di surface yang sama memakai serif.
- Design evidence:
  - Brief identitas yang disetujui pemilik: "Kombinasi font Serif yang hangat untuk judul storytelling ... dan Sans-Serif yang bersih untuk harga, deskripsi katalog, serta formulir".
  - Kontradiksi di presentation yang sama (satu surface, satu lembar CSS): `.brand b` (`index.html:60`), `.card .head h3` (`:115`), `.profil h2` (`:153`), `.foot h2` (`:172`) semuanya `font-family:var(--serif)`.
- Owner: satu lembar `<style>` di `index.html`; token `--serif` (`:25`) dan `--sans` (`:24`) didefinisikan di `:root` (`:12-30`).
- Scope and affected surfaces: hanya tiga selector judul di `index.html`. Tidak ada konsumen lain: tidak ada komponen eksternal, tidak ada stylesheet terpisah.
- Uncertainty: tidak ada untuk pemilihan keluarga font. Yang perlu dinilai mata hanya ukuran/pelacakan huruf serif pada ukuran besar (Fraunces pada 4.9rem dengan `letter-spacing:-.03em`); lihat Validation.

Akar masalahnya satu: aturan `h1,h2,h3` (`index.html:46`) tidak menetapkan `font-family`, sehingga setiap judul yang tidak menyebut serif mewarisi `--sans` dari `body` (`:33`).

## Design decision

Jadikan serif sebagai keluarga untuk judul storytelling, memakai token yang sudah ada, tanpa nilai baru:

```css
/* index.html:46 — sekarang */
h1,h2,h3{margin:0;font-weight:700;letter-spacing:-.03em;line-height:1.03}
```

```css
/* target — judul storytelling */
.lead h1{font-family:var(--serif);font-weight:600;font-size:clamp(2.4rem,6.6vw,4.9rem);max-width:19ch;margin-inline:auto;text-wrap:balance}
.tile h2{font-family:var(--serif);font-weight:600;font-size:clamp(1.7rem,3.4vw,2.6rem);max-width:26ch}
#pesan h2{font-family:var(--serif);font-weight:600}
```

`font-weight:600` dipakai karena Fraunces di lembar ini selalu dipasang pada 600 (lihat `.profil h2:153`, `.card .head h3:115`); memakai 700 membuat serif terlalu berat dan berbeda dari judul serif lain.

Ini menyelesaikan akar masalahnya: setelah perubahan, setiap judul storytelling memakai serif secara eksplisit, dan aturan `h1,h2,h3` tetap boleh mewarisi sans untuk elemen non-judul.

## Reuse

- Token: `--serif:Fraunces,Georgia,serif` (`index.html:25`), sudah dimuat lewat `fonts.googleapis.com` (`:10`, `Fraunces:opsz,wght@9..144,600`).
- Token: `--sans` (`:24`) tetap jadi default judul yang bukan storytelling (mis. `#panelTitle`, `.pay-head h2`).
- Exemplar pola penulisan: `.profil h2{font-family:var(--serif);font-weight:600;font-size:clamp(2rem,4.4vw,3.3rem);line-height:.99;letter-spacing:-.02em;max-width:22ch}` (`index.html:153`).
- Tidak ada primitif baru. Sistem yang ada (token + selector) sudah bisa menyatakan keputusan ini.

## Changes

1. `index.html` — `.lead h1` (`:78`)
   - Change: tambah `font-family:var(--serif);font-weight:600;` di awal deklarasi, sebelum `font-size`.
   - Preserve: ukuran `clamp(2.4rem,6.6vw,4.9rem)`, `max-width:19ch`, `text-wrap:balance`, aturan `.lead h1 em{color:var(--green)}` (`:79`) yang mewarnai "healthy life".
   - Verify: judul hero dirender Fraunces 600; kata "healthy life" tetap hijau dan tetap italic/normal sesuai `em` yang ada.

2. `index.html` — `.tile h2` (`:95`)
   - Change: tambah `font-family:var(--serif);font-weight:600;`.
   - Preserve: `font-size:clamp(1.7rem,3.4vw,2.6rem)` dan `max-width:26ch`; jangan ubah `.tile p` (`:96`).
   - Verify: judul "Tuang, aduk, selesai." dan "Dua kali penyaringan, satu rasa yang tinggal." dirender Fraunces 600.

3. `index.html` — judul bagian pesan
   - Change: judul ini sekarang memakai atribut inline `style="font-size:clamp(1.6rem,3vw,2.3rem)"` di markup (`:413`) dan tidak punya aturan CSS sendiri. Tambahkan satu aturan CSS baru setelah blok `.profil`, lalu hapus atribut `style` dari markup:
     ```css
     #pesan h2{font-family:var(--serif);font-weight:600;font-size:clamp(1.6rem,3vw,2.3rem);letter-spacing:-.02em}
     ```
   - Preserve: ukuran efektif tetap sama (`clamp(1.6rem,3vw,2.3rem)`), teks dan struktur tidak berubah.
   - Verify: "Pesan tanpa mengetik ulang." dirender Fraunces 600 pada ukuran yang sama seperti sebelumnya.

## Scope

- Inherit: hanya tiga elemen judul di atas. Tidak ada konsumen lain di surface ini.
- Verify: teks di sekitar judul tetap sans — `.lead p`, `.tile p`, `.links`, `.card .desc`, `.spek dd`, field form panel. Setelah perubahan, periksa bahwa `#pesan h2` tidak lagi mewarisi ukuran dari atribut inline (sudah dipindah ke CSS) dan tidak ada pergeseran layout yang menutupi tombol.
- Exclude: harga (`.card .foot b:121`, `.total-row b:127`) tetap serif — temuan terpisah, belum dipilih. Badge varian (`:116`), palet, dan animasi tidak disentuh. `apps-script-upload.gs`, `assets/`, `index-v1.html`, `index-v2-backup.html`, `index-v3-backup.html`, `index-print.html`, dan `plans/` tidak disentuh.

## Validation

- Product: pengunjung membaca hierarki judul yang utuh dari hero sampai bagian pesan; judul terasa satu keluarga.
- Interface: periksa pada 360px, 390px, 768px, dan 1280px. Yang harus benar:
  - hero `h1` tidak pecah menjadi lebih dari dua baris di 360px (Fraunces lebih lebar dari sans pada ukuran sama);
  - `.lead h1 em` ("healthy life") tetap hijau `var(--green)`;
  - judul tile dan judul pesan tidak melampaui wadah (tidak ada scroll horizontal: `document.documentElement.scrollWidth === document.documentElement.clientWidth`);
  - animasi kata GSAP tetap berjalan (selector `pecahKata` memecah per kata, tidak terpengaruh `font-family`), dan `prefers-reduced-motion` tetap melewatinya.
- System: pastikan tidak ada `font-family` baru yang ditulis sebagai literal (mis. `"Fraunces"`) — semua lewat `var(--serif)`.
- Repository: `node tools/check.mjs` (bila `plans/001-verification-baseline.md` sudah dieksekusi) → `Semua pemeriksaan PASS`. Bila belum ada, catat "tidak ada baseline" dan verifikasi manual di browser.

## Stop conditions

- Stop if `.lead h1`, `.tile h2`, atau `#pesan h2` tidak lagi cocok dengan potongan kode di bagian Changes (kode sudah bergeser sejak audit), atau bila `#pesan h2` ternyata sudah punya aturan CSS sendiri.
- Stop if menambahkan serif membuat judul melewati wadah di 360px, dan perbaikannya menuntut perubahan ukuran font — itu keputusan desain baru, bukan bagian plan ini; laporkan sebagai temuan terpisah.
- Stop if ada konsumen lain (halaman atau berkas baru) yang memakai tiga selector ini.

## Design documentation

- Setelah diterima dan tervalidasi: catat satu baris di brief identitas pemilik (bagian "Tipografi") bahwa judul storytelling memakai Fraunces 600 dan harga menyusul di plan terpisah — atau, bila `DESIGN.md` dibuat kelak, jadikan baris pertama bagian tipografi: "Judul storytelling: `var(--serif)` (Fraunces 600). Teks, deskripsi, form: `var(--sans)`."
