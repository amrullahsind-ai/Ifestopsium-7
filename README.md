# 📋 IFESTOPSIUM #7 — Monitoring Timeline (PWA)

Aplikasi web (PWA — bisa di-**install di HP** & dipakai **offline**) untuk memantau progres tugas
panitia IFESTOPSIUM #7. Data tetap tersimpan di **Google Spreadsheet** Anda yang sekarang.

- **Panitia** login pakai password divisi → lihat & update tugas **divisinya sendiri**
  (ubah status, catatan, link progres, PIC), plus **tambah/hapus** tugas.
- **Admin** login pakai password admin → **dashboard lengkap**: progres semua divisi,
  grafik, KPI, peringatan tugas yang lewat deadline, dan bisa drill-down + edit tiap divisi.

---

## 🧩 Cara kerjanya (gambaran)

```
   HP Panitia / Admin
   ┌─────────────────┐        HTTPS         ┌────────────────────────┐        ┌──────────────────┐
   │   Aplikasi PWA  │  ───────────────▶    │  Google Apps Script    │  ───▶  │  Google Spreadsheet│
   │ (React, di web) │  ◀───────────────    │  (Web App / API)       │  ◀───  │  (6 sheet divisi)  │
   └─────────────────┘      JSON            └────────────────────────┘        └──────────────────┘
```

Ada **2 bagian** yang harus disiapkan:
1. **Backend** — skrip yang ditempel ke Spreadsheet. Panduan: [`google-apps-script/SETUP.md`](google-apps-script/SETUP.md)
2. **Frontend** — aplikasi ini, dijalankan lokal atau di-deploy gratis.

---

## 🚀 Setup cepat

### A. Siapkan backend (5 menit)
Ikuti [`google-apps-script/SETUP.md`](google-apps-script/SETUP.md). Hasil akhirnya: sebuah **URL Web App**
(`https://script.google.com/macros/s/…/exec`) dan sheet **Auth** berisi password tiap divisi.

### B. Jalankan frontend

Butuh **Node.js 18+** (Anda sudah pakai Node 23 ✔).

```powershell
# 1. Masuk ke folder
cd "$env:USERPROFILE\Downloads\ifestopsium-app"

# 2. Install dependency (sekali saja)
npm install

# 3. Jalankan mode development
npm run dev
```

Buka alamat yang muncul (biasanya `http://localhost:5173`).
Saat pertama dibuka, aplikasi minta **URL Web App** → tempel URL dari langkah A → **Simpan**.
Lalu login sebagai panitia (pilih divisi + password) atau admin.

> URL server tersimpan otomatis di browser. Opsional: isi juga di file `.env`
> (salin dari `.env.example`) supaya sudah terisi untuk semua pengguna.

---

## 🌐 Deploy online (supaya bisa diakses semua panitia dari HP)

PWA butuh HTTPS agar bisa di-install. Pilihan **gratis** paling mudah:

### Opsi 1 — Netlify Drop (paling gampang, tanpa akun teknis)
```powershell
cd "$env:USERPROFILE\Downloads\ifestopsium-app"
npm run build      # menghasilkan folder "dist"
```
1. Buka <https://app.netlify.com/drop>
2. **Seret folder `dist`** ke halaman itu.
3. Dapat URL publik (mis. `https://ifestopsium.netlify.app`) → bagikan ke panitia.
4. Buka di HP → menu browser → **Add to Home Screen / Install app**.

### Opsi 2 — Vercel
```powershell
npm i -g vercel
vercel        # ikuti prompt, framework: Vite
```

### Opsi 3 — GitHub Pages
Push folder ini ke repo GitHub, aktifkan Pages, deploy folder `dist`.
(`base: './'` sudah diatur di `vite.config.ts`, jadi aman di subfolder.)

> **Update kode?** Cukup `npm run build` lagi lalu seret ulang `dist` ke Netlify (atau `vercel --prod`).

---

## 🔑 Password & peran

Semua password ada di sheet **Auth** di dalam Spreadsheet (bisa diubah kapan saja):

| Peran | Login | Bisa apa |
|-------|-------|----------|
| Panitia | pilih **divisi** + password divisi | lihat/edit/tambah/hapus tugas divisinya |
| Admin | tombol **Admin** + password admin | lihat semua divisi + grafik + edit semua |

Default password dibuat otomatis (mis. `sieacara123`, admin `admin123`) — **ganti sebelum dibagikan!**

---

## 📱 Fitur

- ✅ Update status: Selesai · Sedang Berjalan · Tertunda · Belum Dimulai
- ✅ Tambah & hapus tugas
- ✅ Catatan, link progres, PIC per tugas
- ✅ Notifikasi deadline (badge "telat X hari", "deadline hari ini", "X hari lagi")
- ✅ Dashboard admin: KPI, progress ring, pie status, bar chart per divisi
- ✅ Filter per status + pencarian
- ✅ PWA: installable, ikon home screen, cache offline (data terakhir tetap terlihat tanpa internet)
- ✅ Tampilan mobile-first, siap dipakai dari HP

---

## 🗂️ Struktur folder

```
ifestopsium-app/
├─ google-apps-script/
│  ├─ Code.gs            ← tempel ke Apps Script (backend/API)
│  └─ SETUP.md           ← panduan pasang backend
├─ src/
│  ├─ components/        ← Login, Header, DivisionView, AdminDashboard, TaskModal, …
│  ├─ utils/             ← dateParser (deadline), status, progress
│  ├─ api.ts             ← komunikasi ke Apps Script
│  ├─ auth.ts            ← sesi login (localStorage)
│  ├─ config.ts          ← penyimpanan URL server
│  ├─ types.ts
│  └─ App.tsx            ← logika utama & routing tampilan
├─ .env.example
├─ README.md
└─ (package.json, vite.config.ts, tailwind.config.js, …)
```

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---------|--------|
| Aplikasi minta URL terus | Pastikan URL berakhiran `/exec` dan sudah di-deploy "Anyone". |
| "Gagal terhubung ke server" | Cek koneksi; buka URL `…/exec?action=ping` di browser harus muncul `{"ok":true}`. |
| Login gagal | Cek password di sheet **Auth** (hati-hati spasi). |
| Data tidak muncul / divisi kurang | Jalankan `testRead` di Apps Script (lihat SETUP.md). |
| Sudah edit tapi belum berubah | Klik tombol ↻ (refresh) di kanan atas. |
| Ubah `Code.gs` tak berefek | Deploy versi baru (SETUP.md bagian "Kalau mengubah Code.gs"). |

---

Dibuat untuk kepanitiaan **IFESTOPSIUM #7 · IFoP**. Selamat bertugas! 🎉
