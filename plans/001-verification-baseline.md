# Plan 001: Repo punya baseline verifikasi satu perintah

> **Executor instructions**: Ikuti langkah demi langkah. Jalankan setiap perintah
> verifikasi dan cocokkan hasil yang diharapkan sebelum lanjut. Kalau salah satu
> kondisi di "STOP conditions" terjadi, berhenti dan laporkan, jangan mengarang.
> Selesai: perbarui baris status plan ini di `plans/README.md`.

> **Drift check (jalankan dulu)**: belum ada VCS di repo ini, jadi pakai hash berkas:
> `sha256sum index.html apps-script-upload.gs`
> Nilai yang diharapkan: `index.html` = `2075182e1aae33c2…`,
> `apps-script-upload.gs` = `2b608c871d2e9bf4…` (16 karakter pertama).
> Kalau berbeda, baca ulang bagian "Current state" dan sesuaikan sebelum lanjut;
> perbedaan besar = STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: dx
- **Planned at**: tanpa commit (repo belum di-init), 2026-11-26
- **Issue**: —

## Why this matters

Repo ini satu halaman statis tanpa git, tanpa tes, tanpa build. Satu-satunya cara
tahu situs masih benar adalah membukanya manual di browser dan mengklik semuanya.
Akibatnya setiap perubahan berikutnya (harga, endpoint upload, animasi) tidak bisa
dibuktikan selesai tanpa mata manusia, dan tidak ada cara kembali ke versi yang
diketahui baik. Setelah plan ini: `node tools/check.mjs` menjawab "situs masih
utuh atau tidak" dalam satu perintah, dan `git` menyimpan riwayat yang bisa
dibandingkan.

## Current state

- `index.html` — seluruh situs: CSS di `<style>`, markup, dan satu `<script>` inline
  berisi `DATA`, keranjang (`chosen`), panel pesanan, modal bayar, GSAP/Lenis.
- `apps-script-upload.gs` — backend Google Apps Script (tidak dijalankan lokal).
- `assets/` — 5 PNG produk + logo (2.7 MB). Tidak ada `package.json`, tidak ada
  folder tes, tidak ada `.git`, tidak ada README.
- Konfigurasi runtime ada di `<script>` inline: `WA_NUMBER` (`index.html:568`),
  `DRIVE_ENDPOINT` (`:573`), `GOPAY` (`:576`), lalu `DATA` (array 4 varian).
- Invarian yang gampang rusak tanpa disadari dan harus dijaga skrip:
  id `#panel`, `#pay`, `#bukti`, `#rows`, `#lines`, `#preview` ada; tiap
  `src="./assets/..."` benar-benar ada di disk; tidak ada lagi rujukan `.jpg`
  ke aset produk (semua sudah `.png`).

## Commands you will need

| Purpose | Command | Expected on success |
|---|---|---|
| Cek sintaks skrip inline + invarian | `node tools/check.mjs` | exit 0, tiap baris `PASS` |
| Cek sintaks satu berkas JS | `node --check <file.js>` | exit 0 |
| Lihat status repo | `git status --short` | hanya berkas dalam Scope yang muncul |

Node sudah terpasang (`node -v` → `v26.13.0`). Tidak perlu install apa pun.

## Scope

**In scope** (hanya berkas ini yang boleh dibuat/diubah):
- `.gitignore` (buat)
- `package.json` (buat)
- `tools/check.mjs` (buat)
- `plans/README.md` (perbarui baris status)

**Out of scope** (jangan disentuh walau terlihat terkait):
- `index.html`, `apps-script-upload.gs` — plan ini tidak mengubah kode situs.
- `index-v1.html`, `index-v2-backup.html`, `index-v3-backup.html`, `index-print.html`
  — salinan mati, penghapusannya plan lain.
- `assets/` — jangan kompres atau ganti nama apa pun.
- `.agents/` dan `skills-lock.json` — artefak pemasangan skill, bukan bagian situs.

## Git workflow

Repo belum punya konvensi karena belum di-init. Pakai yang di bawah ini:

- `git init -b main`
- Satu commit per langkah logis, pesan bergaya conventional commit, contoh:
  `chore: add one-command verification baseline`
- Jangan push, jangan buka PR.

## Steps

### Step 1: Inisialisasi repo dan ignore

```bash
git init -b main
```

Buat `.gitignore`:

```
node_modules/
.agents/
*.log
```

**Verify**: `git status --short` → menampilkan `.gitignore`, `apps-script-upload.gs`,
`assets/`, `index*.html`, `plans/`, `skills-lock.json` sebagai untracked.

### Step 2: Buat `tools/check.mjs`

Skrip ini dipakai semua plan berikutnya, jadi isinya harus persis seperti di bawah.
Ia mengurai `index.html`, mengecek sintaks setiap `<script>` inline lewat
`node --check`, lalu menegaskan invarian yang tercantum di "Current state".

```js
#!/usr/bin/env node
// Cek baseline situs Clemira: sintaks skrip inline + invarian markup.
// Jalankan: node tools/check.mjs
import { readFileSync, writeFileSync, mkdtempSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const htmlPath = join(root, "index.html");
const html = readFileSync(htmlPath, "utf8");

let gagal = 0;
function cek(nama, ok, detail = "") {
  console.log(`${ok ? "PASS" : "FAIL"}  ${nama}${detail ? " — " + detail : ""}`);
  if (!ok) gagal++;
}

// 1. Sintaks setiap blok <script> tanpa atribut src.
const blok = [...html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
const tmp = mkdtempSync(join(tmpdir(), "clemira-"));
let sintaksOk = true;
blok.forEach((isi, i) => {
  const f = join(tmp, `inline-${i}.mjs`);
  writeFileSync(f, isi);
  try {
    execFileSync(process.execPath, ["--check", f], { stdio: "pipe" });
  } catch (err) {
    sintaksOk = false;
    console.log(err.stdout?.toString() || err.message);
  }
});
cek(`sintaks ${blok.length} blok script inline`, sintaksOk && blok.length > 0);

// 2. Id yang dipakai JavaScript harus ada di markup.
const wajib = ["panel", "pay", "bukti", "rows", "lines", "preview", "openPanel", "closePanel"];
const hilang = wajib.filter(id => !new RegExp(`id="${id}"`).test(html));
cek("id wajib ada di markup", hilang.length === 0, hilang.join(", "));

// 3. Variabel konfigurasi runtime tetap ada di skrip inline.
const variabel = ["WA_NUMBER", "DRIVE_ENDPOINT", "GOPAY", "DATA"];
const tanpaVar = variabel.filter(v => !new RegExp(`var ${v}\\b`).test(html));
cek("variabel konfigurasi ada", tanpaVar.length === 0, tanpaVar.join(", "));

// 4. Setiap aset yang dirujuk benar-benar ada.
const aset = [...html.matchAll(/src="\.\/assets\/([^"]+)"/g)].map(m => m[1]);
const asetHilang = aset.filter(a => !existsSync(join(root, "assets", a)));
cek(`${aset.length} rujukan aset ada di disk`, asetHilang.length === 0, asetHilang.join(", "));

// 5. Tidak ada lagi rujukan .jpg (semua foto sudah PNG).
const jpg = html.match(/\.jpg/gi) || [];
cek("tidak ada rujukan .jpg", jpg.length === 0, `${jpg.length} ditemukan`);

// 6. Struktur dasar dokumen.
cek("ada <html lang>", /<html lang="id"/.test(html));
cek("ada <title>", /<title>[^<]+<\/title>/.test(html));
cek("viewport tanpa user-scalable=no", !/user-scalable=no|maximum-scale=1/.test(html));

if (gagal) {
  console.log(`\n${gagal} pemeriksaan GAGAL`);
  process.exit(1);
}
console.log("\nSemua pemeriksaan PASS");
```

**Verify**: `node tools/check.mjs` → tiap baris `PASS` dan diakhiri
`Semua pemeriksaan PASS`, exit code 0 (`echo $?` → `0`).

### Step 3: Bungkus jadi satu perintah

Buat `package.json`:

```json
{
  "name": "clemira-website",
  "private": true,
  "type": "module",
  "scripts": {
    "check": "node tools/check.mjs"
  }
}
```

**Verify**: `npm run check` → keluaran sama seperti Step 2, exit 0.

### Step 4: Commit baseline

```bash
git add -A
git commit -m "chore: add one-command verification baseline"
```

**Verify**: `git log --oneline -1` → satu commit dengan pesan tersebut;
`git status --short` → kosong.

## Test plan

Tidak ada framework tes di repo ini, dan plan ini tidak menambahkan satu pun.
Skrip `tools/check.mjs` adalah baseline-nya. Kasus negatif yang wajib dicoba
sekali secara manual (lalu kembalikan berkasnya seperti semula):

1. Ganti sementara satu `src="./assets/..."` menjadi nama berkas yang tidak ada →
   `node tools/check.mjs` harus `FAIL` dengan nama berkas tersebut dan exit 1.
2. Hapus sementara satu `id="panel"` → harus `FAIL` pada pemeriksaan id.
3. Rusak sengaja satu tanda kurung di skrip inline → harus `FAIL` pada pemeriksaan
   sintaks, dan `node --check` menunjuk baris yang salah.

**Verify**: `node tools/check.mjs` → `Semua pemeriksaan PASS` setelah ketiga
gangguan dikembalikan, dan `git status --short` kosong.

## Done criteria

Semua harus benar:

- [ ] `node tools/check.mjs` exit 0 dan mencetak `Semua pemeriksaan PASS`
- [ ] `npm run check` exit 0
- [ ] `git log --oneline -1` menampilkan commit baseline
- [ ] `git status --short` kosong
- [ ] `sha256sum index.html apps-script-upload.gs` masih sama dengan nilai di
      Drift check (plan ini tidak boleh mengubah kode situs)
- [ ] `plans/README.md` baris 001 diperbarui jadi `DONE`

## STOP conditions

Hentikan dan laporkan kalau:

- `index.html` di repo tidak lagi cocok dengan hash di Drift check.
- `node tools/check.mjs` gagal pada invarian yang bukan disebabkan kesalahan skrip
  itu sendiri (misal memang ada `.jpg` atau id hilang di kode) — itu temuan baru,
  bukan tugas plan ini untuk memperbaiki `index.html`.
- Muncul kebutuhan mengubah `index.html` supaya pemeriksaan lolos.
- `git init` gagal karena direktori induk sudah berupa repo git lain.

## Maintenance notes

- Skrip ini sengaja tanpa dependensi (Node bawaan saja). Kalau nanti ada bundler
  atau framework, tambahkan langkah `build` dan `test` di `npm run check`, bukan
  mengganti skrip ini.
- Kalau id atau variabel konfigurasi baru ditambahkan ke `index.html`, tambahkan
  juga ke daftar `wajib`/`variabel` di `tools/check.mjs` pada commit yang sama,
  supaya invariannya ikut terjaga.
- Reviewer cukup memeriksa: tidak ada berkas di luar Scope yang tersentuh, dan
  hash `index.html` tidak berubah.
