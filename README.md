# TECHNICAL SUKARAMAI TRADE CENTER XXI – Aplikasi Internal
Tanpa SQL dan tanpa Supabase. **Google Sheets = database**, **Google Drive = penyimpanan foto**, **Apps Script = server (login, hak akses, perhitungan)**. Frontend: HTML5 + CSS3 + Vanilla JS, tanpa library.

## Setup (sekali saja)
1. Buat Google Sheet kosong. Salin ID dari URL (`/d/ID/edit`).
2. Di Sheet: **Ekstensi > Apps Script**. Hapus isi lama, tempel seluruh `apps-script/Code.gs`, Simpan.
3. **Project Settings > Script Properties**, tambah `SPREADSHEET_ID` = ID dari langkah 1.
4. Pilih fungsi **`setup`** lalu **Run**, setujui izin. Akun bawaan di `Code.gs` (konstanta `AKUN`): `admin` / `master2121` dan `user` / `2121`; password tersimpan ter-hash di tab Users. Ganti lewat *Pengaturan Akun*. Lupa password: jalankan `resetAkun`. Jangan unggah folder `apps-script` ke GitHub karena berisi password awal.
5. **Deploy > New deployment > Web app**: Execute as **Me**, Who has access **Anyone**. Salin URL `/exec` ke `js/config.js` (`SCRIPT_URL`). Setiap mengubah `Code.gs`, deploy ulang lewat **Manage deployments > Edit > New version**.
6. Jalankan web: `python3 -m http.server 8080` lalu buka http://localhost:8080, atau deploy ke GitHub Pages.

Login: username `Admin` atau `user` (huruf besar/kecil bebas). Tab spreadsheet: Pengumuman, Tiket ATS, Laporan Pekerjaan, Pembelian Barang, Meteran (air & listrik, kolom `kind`), Foto, Riwayat Aktivitas, Users. Foto tersimpan di folder Drive `XXI_Foto`. **Jangan edit tab langsung** (terutama Users); ubah data lewat aplikasi.

## GitHub & Pages
```
git init && git add . && git commit -m "init" && git branch -M main
git remote add origin https://github.com/USER/REPO.git && git push -u origin main
```
Settings > Pages > Branch `main` / root. `config.js` hanya berisi URL web app (bukan kunci rahasia).

## Keamanan & batasan
- Hak akses diperiksa di server (Apps Script), bukan hanya di menu: user hanya bisa membaca/ubah data miliknya; pengumuman & tiket hanya admin; total pembelian dan pemakaian meter dihitung server; status pembelian hanya bisa diubah admin.
- Siapa pun yang tahu URL `/exec` bisa memanggilnya, tetapi tanpa login/token semua ditolak; login dibatasi 8 percobaan gagal per 10 menit.
- Spreadsheet tidak untuk traffic besar: tiap permintaan membaca tab; wajar untuk puluhan pengguna dan ribuan baris, lambat bila jauh lebih besar. Penulisan serentak diantre (lock).
- Ekspor: CSV dan PDF (Cetak browser). XLSX belum ada (spreadsheet Anda sendiri bisa diunduh sebagai XLSX). Tab rekap bulanan `Pekerjaan_YYYY_MM` tidak dibuat; gunakan filter di tab atau Laporan Bulanan di aplikasi.
- Foto dikompres ke JPEG maks. 1600px, hanya JPG/PNG/WEBP, dan dimuat sebagai data inline (bukan link publik).
