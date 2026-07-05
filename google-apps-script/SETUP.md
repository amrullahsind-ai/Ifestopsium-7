# Pasang Backend (Google Apps Script)

Backend ini membuat "jembatan" agar aplikasi PWA bisa membaca & menulis ke Spreadsheet Anda,
sekaligus mengecek password tiap divisi. **Semua gratis, tanpa server tambahan.**

## Langkah

### 1. Buka editor Apps Script
- Buka Spreadsheet IFESTOPSIUM #7 Anda.
- Menu **Extensions → Apps Script**.

### 2. Tempel kode
- Hapus isi file `Code.gs` bawaan.
- Salin **seluruh** isi file `Code.gs` (di folder ini) ke sana.
- Klik ikon **Simpan** (💾).

### 3. Buat sheet Auth + password (jalankan sekali)
- Di bagian atas editor, pilih fungsi **`setupAuthSheet`** dari dropdown.
- Klik **Run** (▶). Pertama kali akan minta izin → **Review permissions → pilih akun → Allow**.
- Setelah selesai, cek Spreadsheet: muncul sheet baru bernama **Auth** berisi:

  | Divisi | Password | Role |
  |--------|----------|------|
  | ADMIN | admin123 | admin |
  | Sie Acara | sieacara123 | panitia |
  | Sie Humas | siehumas123 | panitia |
  | … | … | … |

- **Ganti password** di kolom Password sesuai keinginan (langsung ketik di sheet).
  Password inilah yang dibagikan ke tiap divisi. Password ADMIN hanya untuk Anda.

> Ingin cek data kebaca dengan benar? Pilih fungsi **`testRead`** → Run → menu **View → Logs**.
> Harus muncul daftar 6 divisi beserta jumlah tugasnya.

### 4. Deploy sebagai Web App
- Klik **Deploy → New deployment**.
- Ikon gerigi ⚙ di kiri → pilih **Web app**.
- Isi:
  - **Description**: `IFESTOPSIUM API`
  - **Execute as**: **Me** (email Anda)
  - **Who has access**: **Anyone**  ← penting, supaya aplikasi bisa akses
- Klik **Deploy** → **Authorize access** bila diminta.
- **Salin "Web app URL"** (bentuknya `https://script.google.com/macros/s/AKfyc…/exec`).

### 5. Hubungkan ke aplikasi
- Buka aplikasi PWA → di layar awal tempel URL tadi → **Simpan & Lanjut**.
  (URL tersimpan di HP/browser, tak perlu diisi ulang.)

---

## Kalau nanti mengubah `Code.gs`
Setiap kali edit kode, **Deploy → Manage deployments → Edit (pensil) → Version: New version → Deploy**.
URL tetap sama, jadi tidak perlu ganti di aplikasi.

## Keamanan (penting dipahami)
- Ini pengamanan tingkat "acara mahasiswa": password per divisi, cukup untuk mencegah salah-edit antar divisi.
- Jangan taruh data sangat rahasia di sini. Siapa pun yang tahu password divisi bisa edit divisi itu.
- Admin (password ADMIN) bisa melihat & mengedit **semua** divisi.

## Masalah umum
| Gejala | Solusi |
|--------|--------|
| "Sheet Auth belum dibuat" | Jalankan `setupAuthSheet` (langkah 3). |
| Login selalu gagal | Cek ejaan/spasi password di sheet Auth. |
| "Struktur sheet tidak dikenali" | Pastikan sheet divisi punya baris header berisi kolom **Jobdesc/Kegiatan** dan **Progres**. |
| Perubahan kode tak berefek | Deploy versi baru (lihat atas). |
| Divisi tidak muncul | Nama sheet mengandung "dashboard" atau ada di daftar IGNORED → diabaikan. |
