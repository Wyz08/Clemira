# Implementation Plans

Dibuat oleh skill `improve` pada 2026-11-26. Repo belum punya VCS saat audit, jadi
"Planned at" memakai hash berkas, bukan commit.

## Execution order & status

| Plan | Judul | Priority | Effort | Depends on | Status |
|------|-------|----------|--------|------------|--------|
| 001  | Repo punya baseline verifikasi satu perintah | P1 | S | — | TODO |
| 002  | Overlay masuk dan keluar dengan transisi, bukan toggle `display` | P1 | S | — | TODO |

Status: TODO | IN PROGRESS | DONE | BLOCKED (alasan satu baris) | REJECTED (alasan satu baris)

## Dependency notes

- Plan 003 dan seterusnya (belum ditulis) bergantung pada 001: tanpa `npm run check`,
  tidak ada cara membuktikan perubahan situs masih utuh.
- 002 tidak bergantung pada plan lain. Kalau 001 sudah selesai, jalankan
  `npm run check` setelah 002 dan pastikan tetap PASS.

## Findings considered and rejected

Belum ada yang ditolak. Temuan audit `improve` yang belum dipilih user, tetap terbuka:

- Endpoint Apps Script tanpa autentikasi, berkas bukti bayar dijadikan publik
  (`apps-script-upload.gs:13`, `:31`) — belum dijadikan plan.
- Tiga skrip CDN tanpa SRI, tanpa CSP (`index.html:11-13`).
- PNG produk tidak diperkecil (236–328 KB per foto, `assets/Panduan Merek CLEMIRA Organik.png` 1.66 MB tak terpakai).
- Empat salinan HTML mati di root (`index-v1.html`, `index-v2-backup.html`, `index-v3-backup.html`, `index-print.html`).
- Jalur WhatsApp mati selama `WA_NUMBER` kosong (`index.html:568`).
- Kode pesanan dibuat sekali per sesi, tidak ikut berubah saat keranjang berubah (`index.html:862`).
- Tidak ada README/AGENTS.md untuk variabel konfigurasi dan pemasangan Apps Script.

Temuan audit `improve-animations` yang belum dipilih user, tetap terbuka:

- Tidak ada press feedback `:active` di tombol/kontrol mana pun (MEDIUM).
- Hover foto produk `.5s` di `index.html:110`, lewat budget UI <300ms (MEDIUM).
- `*{transition:none!important}` di `index.html:284-285` mematikan semua feedback,
  termasuk warna/opasitas yang justru membantu pemahaman (MEDIUM).
- Swap state `payBody`↔`payThanks` dan daftar kosong→isi tidak dianimasikan (MEDIUM).
- Token motion belum ada; empat kurva/durasi ditulis tangan, Lenis `duration:1.05`
  tanpa kurva bersama (LOW).
- Peluang aditif: pop angka qty stepper saat +/−, reaksi badge "Pesan" di header,
  stagger 30ms untuk baris panel saat pertama dibuka.
