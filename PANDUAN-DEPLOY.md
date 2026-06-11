# 📱 Panduan Deploy Aplikasi Roster Tambang
## Dari Kode → Web App → Bisa Diinstall di HP

---

## 🗂️ STRUKTUR FILE YANG DIBUTUHKAN

Sebelum mulai, pastikan folder project Anda berisi:

```
roster-app/
├── public/
│   ├── index.html
│   ├── manifest.json
│   └── service-worker.js
├── src/
│   ├── index.js
│   └── App.js
└── package.json
```

---

## BAGIAN 1 — PERSIAPAN DI KOMPUTER
### (Hanya dilakukan sekali)

### Langkah 1 — Install Node.js

1. Buka browser, pergi ke **https://nodejs.org**
2. Klik tombol **"LTS"** (versi stabil) → download
3. Buka file installer yang didownload → klik Next terus → Finish
4. Untuk cek berhasil: buka **Command Prompt** (Windows) atau **Terminal** (Mac)
   - Windows: tekan `Windows + R`, ketik `cmd`, Enter
   - Ketik: `node --version` → harusnya muncul angka seperti `v20.x.x`

### Langkah 2 — Buat akun GitHub (gratis)

1. Buka **https://github.com**
2. Klik **Sign up** → isi email, password, username
3. Verifikasi email

### Langkah 3 — Install Git

1. Buka **https://git-scm.com/downloads**
2. Download untuk Windows/Mac → install (Next terus, tidak perlu ubah setting)
3. Cek berhasil: di Command Prompt ketik `git --version`

---

## BAGIAN 2 — SIMPAN KODE KE GITHUB

### Langkah 4 — Buat repository di GitHub

1. Login ke GitHub
2. Klik tombol **"+"** di pojok kanan atas → **"New repository"**
3. Isi nama repository: `roster-tambang`
4. Pilih **Public**
5. Klik **"Create repository"**

### Langkah 5 — Upload kode ke GitHub

Buka Command Prompt, ketik satu per satu (Enter setelah setiap baris):

```
cd Desktop
mkdir roster-tambang
cd roster-tambang
```

Lalu copy semua file dari folder project ke dalam folder `roster-tambang` di Desktop.

Kemudian di Command Prompt:

```
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/USERNAME/roster-tambang.git
git push -u origin main
```

> ⚠️ Ganti `USERNAME` dengan username GitHub Anda

---

## BAGIAN 3 — DEPLOY KE VERCEL (Web App Online)

### Langkah 6 — Buat akun Vercel

1. Buka **https://vercel.com**
2. Klik **"Sign Up"**
3. Pilih **"Continue with GitHub"** → login dengan akun GitHub tadi
4. Izinkan Vercel akses ke GitHub

### Langkah 7 — Deploy project

1. Di halaman Vercel, klik **"Add New Project"**
2. Cari repository `roster-tambang` → klik **"Import"**
3. Di bagian **Framework Preset**, pilih **"Create React App"**
4. Klik **"Deploy"**
5. Tunggu 1–2 menit → selesai! ✅

Anda akan mendapat link seperti:
**`https://roster-tambang.vercel.app`**

🎉 **Aplikasi sudah online! Bisa dibuka siapa saja dari link ini.**

---

## BAGIAN 4 — INSTALL KE HP (PWA)

Tidak perlu App Store atau Play Store!

### Di Android (Chrome):

1. Buka link aplikasi di **Chrome**
2. Tunggu beberapa detik
3. Akan muncul banner di bawah: **"Tambahkan ke layar utama"** → tap
4. Atau: tap menu **⋮** (titik tiga) di pojok kanan atas → **"Tambahkan ke layar utama"**
5. Klik **"Tambah"**
6. Ikon aplikasi muncul di homescreen HP ✅

### Di iPhone/iPad (Safari):

1. Buka link aplikasi di **Safari** (harus Safari, bukan Chrome)
2. Tap tombol **Share** (kotak dengan panah ke atas) di bagian bawah
3. Scroll ke bawah → tap **"Add to Home Screen"**
4. Beri nama → tap **"Add"**
5. Ikon aplikasi muncul di homescreen ✅

---

## BAGIAN 5 — UPDATE APLIKASI (jika ada perubahan)

Jika ada perubahan kode, cukup:

```
git add .
git commit -m "update aplikasi"
git push
```

Vercel otomatis update dalam 1–2 menit. Semua pengguna langsung dapat versi terbaru.

---

## 📋 RINGKASAN BIAYA

| Layanan | Biaya |
|---------|-------|
| Node.js | Gratis |
| GitHub | Gratis |
| Vercel (hosting) | **Gratis** (untuk project personal) |
| PWA (install ke HP) | **Gratis** |
| **Total** | **Rp 0** |

---

## ❓ TROUBLESHOOTING

**Error saat `git push`:** Pastikan username GitHub di URL sudah benar

**Aplikasi tidak muncul di Vercel:** Pastikan framework preset = "Create React App"

**Tidak bisa install PWA di iPhone:** Harus pakai browser Safari, bukan Chrome/Firefox

**Link tidak bisa dibuka orang lain:** Pastikan repository GitHub di-set Public

---

## 💡 TIPS

- Bagikan link Vercel ke rekan kerja → mereka langsung bisa pakai tanpa install apapun
- Setelah install PWA, aplikasi bisa dipakai **offline** (tanpa internet)
- Data yang diinput tersimpan selama sesi, tidak hilang saat scroll atau pindah bulan
