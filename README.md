# SIGAB


## Identitas Tim

**Nama tim:** Awikwok

**Anggota:**

1. Aryanto Tri Nashrullah
2. Zelina Irene Chrisani
3. Alodia Kinnard Putri Kurnianto
4. Darma Sugiansyah Mustofa

## Informasi Aplikasi

- **Kategori:** Web
- **Nama aplikasi:** SIGAB (Sistem Informasi Geografis Antisipasi Banjir)
- **Deskripsi:** SIGAB menyajikan informasi geografis untuk membantu pemantauan
  cuaca, curah hujan, histori banjir, kondisi lingkungan, dan estimasi risiko
  banjir hingga tingkat kelurahan/desa.
- **Masalah yang diangkat:** Informasi risiko banjir berasal dari berbagai
  sumber dan belum tersaji dalam satu tampilan yang mudah dipahami pada tingkat
  wilayah yang terperinci.
- **Target pengguna:** Masyarakat, relawan, pengelola data, serta instansi
  yang memerlukan informasi pendukung untuk kesiapsiagaan banjir.

## Fitur Utama

- Peta risiko banjir interaktif berdasarkan wilayah.
- Estimasi skor dan kategori risiko banjir.
- Prakiraan cuaca dan curah hujan dari BMKG.
- Informasi cuaca terkini dari Open-Meteo.
- Histori banjir berdasarkan dataset dan tahun yang tersedia.
- Grafik curah hujan harian serta pola hujan per jam.
- Ringkasan risiko berdasarkan kabupaten/kota dan kecamatan.
- Informasi sumber data dan kelengkapan komponen risiko.
- Pencarian kandidat sumber data lingkungan dengan Gemini.
- Sinkronisasi data otomatis melalui worker Python.
- Autentikasi pengguna dan autentikasi admin.
- Peringatan wilayah dan notifikasi push otomatis untuk hujan, prakiraan hujan,
  serta risiko banjir tinggi pada daerah pantauan.

## Teknologi yang Digunakan

### Frontend

- Next.js 16
- React 19
- TypeScript
- Tailwind CSS
- Framer Motion
- Leaflet dan OpenStreetMap

### Backend

- PHP 8.3 atau lebih baru
- Laravel 13
- MySQL
- Laravel API, queue, cache, dan scheduler

### Layanan dan sumber data pihak ketiga

- BMKG untuk prakiraan cuaca dan peringatan cuaca.
- Open-Meteo untuk cuaca terkini dan data lingkungan tertentu.
- OpenStreetMap/Overpass untuk data geospasial pendukung.
- wilayah.id untuk katalog kode wilayah.
- DIBI BNPB sebagai referensi data kebencanaan.
- Dataset `partadox/history_flood_sby` untuk histori banjir terperinci.
- Gemini API untuk menemukan kandidat sumber data lingkungan.

## Arsitektur Sistem dan Alur Data

```mermaid
flowchart LR
    U[Pengguna] --> F[Next.js Frontend]
    F --> L[Laravel API]
    L --> DB[(MySQL)]
    L --> BMKG[BMKG API]
    L --> OM[Open-Meteo]
    L --> G[Gemini API]
    W[Python Sync Worker] --> B[FastAPI Prediction API]
    B --> BMKG
    B --> ENV[OpenStreetMap / Open-Meteo Environment]
    W -->|Import prediksi dan rekaman| L
    CSV[CSV histori banjir] -->|Import| DB
```

Alur data utama:

1. Worker Python menemukan wilayah yang dipantau dan mengambil data prakiraan
   BMKG.
2. FastAPI menormalisasi data dan menghitung estimasi risiko berdasarkan
   komponen yang tersedia.
3. Worker mengirim prediksi dan rekaman curah hujan ke Laravel.
4. Laravel menyimpan data ke MySQL dan menyediakan endpoint API.
5. Frontend Next.js mengambil data API untuk menampilkan peta, grafik, histori,
   dan peringatan.
6. Gemini membantu menemukan kandidat sumber data lingkungan. Hasilnya tidak
   langsung digunakan sebagai angka prediksi tanpa verifikasi.

## Struktur Direktori

```text
.
├── backend/
│   ├── app/                  # Controller, service, model, dan command Laravel
│   ├── database/             # Migration, seeder, dan database MySQL
│   ├── python/               # FastAPI, model risiko, dan worker sinkronisasi
│   ├── routes/               # Route API dan web Laravel
│   └── storage/app/private/  # Dataset dan hasil pipeline privat
├── frontend/
│   ├── app/                  # Halaman dan komponen Next.js
│   ├── lib/                  # Client API dan tipe data
│   └── public/               # Asset frontend
└── README.md
```

## Prasyarat

- Git
- Node.js dan npm
- PHP 8.3 atau lebih baru
- Composer
- Python 3.11 atau lebih baru
- Akses internet untuk mengambil data dari layanan eksternal

## Instalasi dan Konfigurasi (UNTUK JALANKAN WEBSITE DI LOKAL)

## Tutorial Menjalankan Website di Lokal

[Tonton tutorial menjalankan SIGAB di YouTube](https://youtu.be/j95hjLN4hB0?si=Rdl6zQsmpTTMQI5)

[![Tutorial menjalankan SIGAB di lokal](https://img.youtube.com/vi/j95hjLN4hB0/maxresdefault.jpg)](https://youtu.be/j95hjLN4hB0?si=Rdl6zQsmpTTMQI5)

Klik gambar video untuk membukanya di YouTube. GitHub tidak menjalankan video
YouTube secara langsung di dalam README, sehingga gambar tersebut digunakan
sebagai thumbnail yang dapat diklik.

### 1. Clone repository

```powershell
git clone https://github.com/Ryan-Task/SIGAB.git
cd SIGAB
```

### 2. Instalasi frontend

```powershell
cd frontend
npm install
```

### 3. Instalasi backend Laravel

Buka terminal baru, kemudian jalankan:

```powershell
cd "D:\LombaUnesa2\SIGAB\backend"
composer install
Copy-Item .env.example .env
php artisan migrate --seed
```

Perintah `migrate --seed` membuat atau memperbarui struktur database dan
menjalankan seeder aplikasi. Seeder saat ini membuat akun administrator demo.
Jika database sudah pernah digunakan, tinjau migrasi sebelum menjalankan
perintah yang mengubah data.

### 4. Konfigurasi environment

Sesuaikan `backend/.env` dengan lingkungan lokal. Jangan membagikan atau
meng-commit file `.env` karena dapat berisi kredensial dan secret.

Variabel yang perlu disiapkan:

```dotenv
DB_CONNECTION=mysql
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SCHEME=null
MAIL_USERNAME=
MAIL_PASSWORD=
MAIL_TIMEOUT=15
MAIL_FROM_ADDRESS=
MAIL_FROM_NAME="SIGAB"

GEMINI_API_KEY=
GEMINI_MODEL=gemini-3.1-flash-lite
GEMINI_GOOGLE_SEARCH=false

FRONTEND_URL=http://127.0.0.1:3000
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://127.0.0.1:8000/api/auth/google/callback

VAPID_SUBJECT=mailto:admin@sigab.local
VAPID_PUBLIC_KEY=
```

Lengkapi variabel email jika fitur kode login atau pemulihan akun digunakan.
Lengkapi kredensial Google jika autentikasi Google digunakan. `GEMINI_API_KEY`
diperlukan untuk fitur discovery sumber data lingkungan. Konfigurasi VAPID
diperlukan untuk notifikasi push.

Frontend secara default mengakses Laravel melalui
`http://127.0.0.1:8000`. Jika backend menggunakan alamat berbeda, sesuaikan
`API_ORIGIN` pada konfigurasi frontend atau konfigurasi proxy Next.js yang
relevan.

## Cara Menjalankan Aplikasi

Jalankan aplikasi menggunakan empat terminal terpisah.

### Terminal 1 — Frontend Next.js

```powershell
cd "D:\LombaUnesa2\SIGAB\frontend"
npm run dev
```

Frontend tersedia pada `http://127.0.0.1:3000`.

### Terminal 2 — Backend Laravel

```powershell
cd "D:\LombaUnesa2\SIGAB\backend"
php artisan serve
```

Laravel API tersedia pada `http://127.0.0.1:8000`.

### Terminal 3 — FastAPI

```powershell
cd "D:\LombaUnesa2\SIGAB\backend"
uvicorn --app-dir python sigab_data.api:app --reload --port 8001
```

FastAPI tersedia pada `http://127.0.0.1:8001`.

### Terminal 4 — Worker sinkronisasi Python

```powershell
cd "D:\LombaUnesa2\SIGAB\backend\python"
python -m sigab_data.sync
```

Worker berjalan secara berkelanjutan, mengambil data sesuai cakupan dan
interval sinkronisasi, lalu mengirimkan hasilnya ke Laravel. Tekan `Ctrl+C`
untuk menghentikannya.

> **Penting pada instalasi pertama:** tunggu sampai worker menampilkan pesan
> bahwa sinkronisasi selesai sebelum menguji halaman peringatan, peta risiko,
> grafik, atau detail wilayah. Batch yang belum berhasil akan dicoba kembali
> pada interval berikutnya.

## Import Histori Banjir

Dataset histori banjir aktif dibaca dari:

```text
backend/storage/app/private/bpbd-banjir-histori.csv
```

File harus memiliki kolom `event_id`, `event_date`, `location`, dan
`source_url`. Import manual dapat dijalankan dengan:

```powershell
cd "D:\LombaUnesa2\SIGAB\backend"
php artisan history:import-detailed
```

Hanya kejadian yang dapat dipetakan secara aman ke wilayah kelurahan/desa yang
dimasukkan ke area detail. Dataset histori sekunder bukan pengganti catatan
resmi kejadian dari instansi berwenang.

## Endpoint Utama

- `GET /api/v1/areas`
- `GET /api/v1/areas/{slug}`
- `GET /api/v1/areas/{slug}/risk`
- `GET /api/v1/areas/{slug}/rainfall`
- `GET /api/v1/areas/{slug}/current-weather`
- `GET /api/v1/areas/{slug}/environment-discovery`
- `GET /api/v1/predictions/latest`
- `GET /api/v1/flood-events`
- `GET /api/v1/flood-events/years`
- `GET /api/v1/history/summary`
- `GET /health` pada FastAPI

## Akun Demonstrasi

Seeder menyediakan akun administrator berikut untuk pengujian lokal:

- **Email:** `admin123@gmail.com`
- **Password:** `admin123`

Kredensial tersebut hanya ditujukan untuk lingkungan pengembangan. Ganti atau
hapus akun ini sebelum aplikasi digunakan pada lingkungan produksi.

## Dokumentasi Penggunaan AI

SIGAB menggunakan Gemini API pada backend Laravel untuk fitur **environment
data discovery**. Fitur ini membantu pengguna menemukan kandidat sumber data
yang relevan dengan wilayah tertentu, terutama untuk:

- jaringan drainase;
- sungai dan saluran air;
- tutupan lahan;
- elevasi; dan
- histori banjir.

Gemini menerima konteks wilayah dan diminta mengembalikan kandidat dataset
dalam format terstruktur. Backend kemudian memeriksa format URL dan mencoba
memastikan apakah sumber tersebut dapat diakses. Hasilnya ditampilkan sebagai
referensi yang perlu ditinjau, bukan sebagai data final.

Gemini **tidak**:

- menghitung skor risiko banjir secara langsung;
- menggantikan model risiko berbasis data pada FastAPI;
- mengisi data lingkungan yang kosong dengan nilai buatan; atau
- memasukkan kandidat dataset ke database dan model prediksi secara otomatis.

Aktifkan fitur dengan mengisi `GEMINI_API_KEY` pada `backend/.env`. Model dapat
diatur melalui `GEMINI_MODEL`. Google Search grounding bersifat opsional dan
dapat diaktifkan dengan `GEMINI_GOOGLE_SEARCH=true` apabila kuota dan akses
layanan tersedia. Jika grounding tidak digunakan, setiap URL dan informasi
hasil discovery harus diverifikasi secara manual.

Endpoint discovery:

```text
GET /api/v1/areas/{slug}/environment-discovery
```

Hasil discovery menggunakan cache sementara dan memiliki pembatasan request.
Jika Gemini tidak tersedia, backend dapat mengembalikan kandidat fallback yang
tetap harus diverifikasi. Informasi AI tidak boleh dianggap sebagai peringatan
resmi atau kepastian terjadinya banjir.

## Atribusi

- Framework dan library mengikuti lisensi masing-masing: Next.js, React,
  TypeScript, Laravel, FastAPI, Pydantic, Framer Motion, Leaflet, dan Tailwind
  CSS.
- Peta menggunakan Leaflet dan tile OpenStreetMap sesuai kebijakan OpenStreetMap.
- Data prakiraan cuaca bersumber dari BMKG.
- Data cuaca terkini dan sebagian data lingkungan menggunakan Open-Meteo.
- Data histori banjir terperinci menggunakan dataset
  `partadox/history_flood_sby`.
- Dataset dan kode pihak ketiga mengikuti lisensi serta ketentuan penggunaan
  dari sumber masing-masing.

## Catatan

Informasi SIGAB bersifat pendukung dan bukan pengganti arahan resmi BPBD, BMKG,
atau instansi berwenang. Ketersediaan dan ketepatan data bergantung pada
sumber eksternal serta cakupan wilayah yang berhasil disinkronkan.
