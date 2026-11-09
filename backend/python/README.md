# SIGAB data pipeline

Pipeline ini mengambil prakiraan cuaca publik BMKG, menormalisasikannya menjadi
record yang cocok dengan tabel `rainfall_records`, lalu menghitung estimasi
risiko yang dapat dijelaskan sesuai PRD.

BMKG menyediakan prakiraan cuaca, bukan pengukuran hujan historis. Karena itu
record dari endpoint ini diberi `quality_status = forecast` dan tidak boleh
ditampilkan sebagai observasi aktual.

## Menjalankan

```powershell
cd backend\python
python -m sigab_data.cli --adm4 35.15.01.2001 --output ..\storage\app\private\bmkg-output.json
```

`adm4` adalah kode administrasi desa/kelurahan BMKG. Kode dapat diberikan
berulang untuk mengambil beberapa wilayah.

Tanpa `--adm4`, CLI membaca `SIGAB_BMKG_ADM4` (format comma-separated). Jalankan
CLI dari folder `backend\python` agar package dapat ditemukan Python.
Endpoint dapat diganti untuk pengujian dengan `SIGAB_BMKG_BASE_URL`.

## Output

Output JSON memiliki:

- `rainfall_records`: record normalisasi untuk penyimpanan backend;
- `predictions`: skor risiko dan komponen yang tersedia;
- `metadata`: sumber, waktu pengambilan, serta status pipeline.

Setiap prediksi juga membawa `explanation.sources`, `completeness`, dan
`caveat`. Curah hujan bersumber dari BMKG. Faktor lingkungan menggunakan
elevasi dari Open-Meteo sebagai proxy transparan (bukan pengganti analisis
drainase, kedekatan sungai, tutupan lahan, atau pemodelan hidrologi). Metadata
lingkungan menyimpan koordinat input, koordinat respons, kecocokan koordinat,
nilai elevasi, URL provider, waktu pengambilan, dan status.

Confidence mempertimbangkan jumlah komponen, kualitas sumber, cakupan, dan
kesegaran data. Riwayat banjir DIBI BNPB ditandai `not_imported` sampai data
kejadian individual berhasil divalidasi dan dipetakan ke wilayah. Jika
komponen belum tersedia, model menormalisasi bobot hanya pada komponen yang
ada; bobot efektifnya dicatat pada `weights_used`, sementara confidence tetap
diturunkan dan caveat ditampilkan. Nilai yang tidak tersedia tidak diisi
dengan angka buatan. Pipeline ini adalah baseline rule-based yang dapat
dijelaskan, bukan machine learning tervalidasi.

### Histori lokasi detail Surabaya

File `backend/storage/app/private/bpbd-banjir-2020-2025.csv` berisi dataset
publik riset `partadox/history_flood_sby`, yang mengekstrak berita banjir
Surabaya dan melakukan geocoding lokasi. Dataset ini bukan data BPBD resmi dan
sebagian baris hanya memiliki nama jalan atau titik lokasi. Import hanya
memetakan baris yang secara eksplisit memuat nama kelurahan yang cocok dengan
master `areas`; baris lain tidak dipaksakan ke kelurahan.

Import dengan:

```powershell
cd backend
php artisan history:import-detailed storage\app\private\bpbd-banjir-2020-2025.csv
```

Histori terpetakan dihitung berdasarkan jumlah kejadian 12 bulan terakhir
dan digunakan saat prediction diimpor ke Laravel. Satu kejadian dikategorikan
jarang, 2--5 kejadian terkadang, dan lebih dari 5 kejadian sering. Jika tidak
ada kejadian atau data, komponen histori tidak dimasukkan ke skor. Karena sumbernya sekunder
dan cakupannya tidak lengkap, skor histori adalah indikator pendukung, bukan
catatan resmi kejadian per kelurahan.

Skor kualitas drainase menggunakan skala 0–100: semakin tinggi semakin baik.
Dalam perhitungan risiko, pipeline menggunakan risiko drainase
`100 - drainage_score`, sehingga kualitas 100 menurunkan risiko banjir.

Jika file manual belum tersedia, pipeline dapat memakai proxy jaringan drainase
yang benar-benar terpetakan di OpenStreetMap (`waterway=drain|ditch|canal`).
Proxy ini menghitung jarak centroid ke saluran terdekat: semakin jauh jaringan
yang terpetakan, semakin tinggi risiko drainase. Ini bukan penilaian kerusakan,
kapasitas, atau sumbatan fisik. Nonaktifkan dengan
`SIGAB_ENVIRONMENT_DRAINAGE_ENABLED=0`.

### Skor drainase manual

BMKG tidak menyediakan kondisi fisik drainase. Agar kondisi saluran dapat
memengaruhi prediksi tanpa membuat data, isi file
`backend/storage/app/private/drainage-scores.csv` berdasarkan survei atau data
BPBD/PU. Salin format dari `drainage-scores.csv.example`:

```csv
area_code,physical_condition_score,capacity_score,coverage_score,maintenance_score,obstruction_score,source,observed_at
35.15.01.2001,70,60,80,65,55,BPBD Kabupaten Sidoarjo,2026-11-06T00:00:00+07:00
```

Semua skor komponen adalah risiko 0–100: semakin tinggi, kondisi drainase
semakin berisiko. Bobotnya adalah kondisi fisik 30%, kapasitas 25%, cakupan
15%, pemeliharaan 15%, dan sumbatan 15%. Wilayah tanpa data manual tidak
diberi nilai default dan komponen tersebut dikeluarkan dari perhitungan.

## Faktor lingkungan geospasial

Pipeline dapat mengambil jarak centroid wilayah ke geometri sungai/saluran
yang diberi tag `waterway=river|stream|canal` dari OpenStreetMap melalui
Overpass. Query dibuat satu kali untuk bounding box seluruh batch, kemudian
jarak terdekat ke setiap segmen geometri dihitung di pipeline. Nilai ini
disimpan sebagai `river_distance_m` dan digabungkan dengan proxy elevasi hanya
untuk membentuk indikator lingkungan sementara. Jarak sungai bukan bukti
kejadian banjir.

Aktif/nonaktifkan pengambilan tersebut dengan:

```powershell
$env:SIGAB_ENVIRONMENT_RIVER_ENABLED="1"
```

Default-nya aktif, tetapi worker sebaiknya tidak dijalankan bersamaan dan
interval sinkronisasi lingkungan jangan dipersingkat karena Overpass adalah
layanan publik. Sumber OSM bersifat komunitas dan cakupannya dapat tidak
lengkap.

Tutupan lahan ESA WorldCover, kondisi drainase, kapasitas saluran, dan data
hidrologi belum diisi otomatis. Tutupan lahan membutuhkan raster dan batas
wilayah untuk perhitungan zonal; drainase/kapasitas membutuhkan inventaris
teknis PU atau pemerintah daerah; hidrologi membutuhkan stasiun muka air/debit.
Ketiganya tetap `NULL` sampai sumber dan cakupan tervalidasi, bukan diisi nol.

## FastAPI

Install dependency API:

```powershell
cd backend
python -m pip install -r python\requirements-api.txt
uvicorn --app-dir python sigab_data.api:app --reload --port 8001
```

Health check:

```powershell
Invoke-RestMethod http://127.0.0.1:8001/health
```

Request prediksi:

```powershell
$body = @{ adm4 = @("35.15.01.2001") } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://127.0.0.1:8001/v1/predictions `
  -ContentType "application/json" -Body $body
```

Untuk memantau banyak desa/kelurahan, pipeline sekarang dapat menemukan kode
administrasi otomatis dari katalog wilayah. BMKG tidak menyediakan seluruh
wilayah hanya dari satu request; pipeline tetap melakukan request per desa/
kelurahan, tetapi Anda tidak perlu mengetik setiap kode:

```powershell
$env:SIGAB_AREA_SCOPE="sidoarjo-surabaya"
```

Pilihan cakupan:

```text
sidoarjo-surabaya = seluruh Kabupaten Sidoarjo dan Kota Surabaya
regency:35.15  = Kabupaten Sidoarjo
province:35     = seluruh Jawa Timur
indonesia       = seluruh provinsi di Indonesia
```

Jika `SIGAB_BMKG_ADM4` diisi, daftar manual tersebut tetap dipakai sebagai
override. Jika kosong, pipeline memakai `SIGAB_AREA_SCOPE`.

Request dapat dikirim tanpa field `adm4`:

```powershell
$body = @{ history_score = 40; environment_score = 50 } | ConvertTo-Json
```

### Sinkronisasi otomatis ke Laravel

Dengan Laravel dan FastAPI berjalan, terminal ketiga dapat menjalankan worker:

```powershell
cd backend\python
$env:SIGAB_AREA_SCOPE="sidoarjo-surabaya"
$env:SIGAB_SYNC_INTERVAL_SECONDS="300"
$env:SIGAB_SYNC_BATCH_SIZE="25"
$env:SIGAB_AREA_SAMPLE_PER_DISTRICT="0"
python -m sigab_data.sync
```

Jalankan dari `backend\python`.
Worker ini menemukan semua desa/kelurahan pada cakupan, mengambil ulang BMKG
setiap 5 menit, membuat/memperbarui area, dan menyimpan rainfall serta
prediction ke Laravel. Untuk seluruh Indonesia, gunakan
`SIGAB_AREA_SCOPE=indonesia`, tetapi prosesnya dapat sangat lama dan harus
mematuhi rate limit serta kebijakan layanan BMKG.

Worker hanya memuat katalog `wilayah.id` pada siklus pertama. Siklus berikutnya
memakai daftar kode yang tersimpan di memori proses, sehingga Anda tidak perlu
menjalankan discovery atau batch manual lagi. Data BMKG tetap diambil ulang
otomatis pada setiap siklus dan prediction baru disimpan ke Laravel.

Interval berarti waktu tunggu setelah satu siklus selesai. Dengan 499 wilayah
dan jeda BMKG 3 detik, request cuaca saja membutuhkan minimal sekitar 25 menit
per siklus, belum termasuk retry, pemrosesan, dan request Overpass. Karena itu
interval 20 menit tidak menjamin semua 499 wilayah selesai diperbarui setiap 20
menit. Untuk pembaruan 20 menit yang realistis, gunakan cakupan lebih kecil,
atau turunkan jeda hanya setelah memastikan BMKG tidak mengembalikan 429.
Jangan menjalankan beberapa worker bersamaan.

Worker memproses wilayah dalam batch. `SIGAB_SYNC_BATCH_SIZE` dapat diatur
antara 1 dan 100, dengan nilai bawaan 25. Batch kecil membuat hasil pertama
lebih cepat tersimpan ke database dan mengurangi beban request.
Sebelum batch pertama, worker memuat katalog wilayah dari `wilayah.id`; tahap
ini dapat membutuhkan waktu karena katalog diambil bertingkat.
Pengambilan katalog kecamatan dan desa dilakukan paralel secara terbatas.
`SIGAB_REGION_WORKERS` mengatur jumlah worker katalog, dengan nilai bawaan 8
dan rentang 1-32. Katalog tetap dapat memerlukan beberapa menit untuk cakupan
provinsi besar.
Untuk mencakup seluruh Sidoarjo dan Surabaya, gunakan
`SIGAB_AREA_SAMPLE_PER_DISTRICT=0` (bawaan). Nilai ini mengambil semua
desa/kelurahan. Nilai lebih besar dari 0 hanya digunakan jika ingin membatasi
jumlah titik per kecamatan.

Frontend mengelompokkan titik pantau pada zona radius 1.000 meter tanpa batas
jumlah zona. Daftar dan filter tetap memuat semua area individual.

Skor kualitas drainase `0` atau data drainase yang tidak tersedia diperlakukan
sebagai tidak terpetakan dan tidak dimasukkan ke perhitungan risiko. Skor
positif tetap dihitung; untuk proxy OpenStreetMap, skor `0` hanya berarti tidak
ada jaringan drainase yang terpetakan dekat, bukan bukti kondisi fisik yang
rusak.

BMKG dapat mengembalikan HTTP 429 jika request terlalu cepat. Worker memberi
jeda bawaan 1 detik antar-request dan mencoba ulang error 429 dengan backoff.
Atur `SIGAB_BMKG_REQUEST_DELAY_SECONDS` dan `SIGAB_BMKG_MAX_RETRIES` jika
diperlukan. Jika tetap terkena rate limit, hentikan worker dan tunggu beberapa
menit sebelum menjalankan ulang.

Setelah satu siklus selesai, worker menunggu `SIGAB_SYNC_INTERVAL_SECONDS` lalu
mengambil ulang data BMKG secara otomatis. Tidak perlu menjalankan batch manual
setiap ada perubahan cuaca. Karena fokus mencakup 499 desa/kelurahan, satu
siklus dapat lebih lama dari 5 menit; interval berikutnya dimulai setelah
siklus sebelumnya selesai. Data yang sudah masuk ke Laravel tetap dapat dibaca
frontend selama siklus berikutnya berjalan.

Perintah tersebut memang berjalan terus-menerus sehingga prompt PowerShell
tidak kembali. Itu normal: worker menjalankan sinkronisasi lalu menunggu
interval berikutnya. Status akan ditampilkan di terminal; gunakan terminal
PowerShell lain untuk Laravel, FastAPI, atau frontend. Tekan `Ctrl+C` jika
ingin menghentikan worker.

Katalog wilayah yang digunakan adalah `wilayah.id` (metadata pembaruan
disediakan oleh katalog tersebut). Data cuaca tetap bersumber dari BMKG.
Setiap kode akan dibuat otomatis sebagai area oleh Laravel saat hasil
di-import.

Referensi katalog wilayah: `https://wilayah.id/api`. Untuk skala nasional,
jalankan sinkronisasi bertahap dan perhatikan batas layanan BMKG; jangan
menganggap satu siklus polling dapat selesai seketika untuk seluruh Indonesia.

## Menyimpan hasil ke Laravel

Jalankan Laravel di terminal lain:

```powershell
cd .. 
php artisan serve --port 8000
```

Jika `SIGAB_PIPELINE_KEY` diisi pada `.env`, gunakan nilai yang sama pada header
`X-Pipeline-Key`. Ambil prediksi dari FastAPI lalu kirim payload yang sama ke
Laravel:

```powershell
$prediction = Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8001/v1/predictions" `
  -ContentType "application/json" -Body $body

$json = $prediction | ConvertTo-Json -Depth 20
Invoke-RestMethod -Method Post `
  -Uri "http://127.0.0.1:8000/api/v1/predictions/import" `
  -ContentType "application/json" -Body $json
```

Laravel menerima metadata `areas` dari BMKG dan otomatis membuat atau
memperbarui area berdasarkan `areas.code`. Record yang berhasil disimpan
dikembalikan pada response. Area level desa/kelurahan dibuat dari metadata
`adm4`; hierarki kecamatan/kabupaten dapat ditambahkan kemudian dari sumber
master wilayah resmi.

Jika hujan atau komponen penting tidak tersedia, statusnya
`insufficient_data`; pipeline tidak mengubah data yang hilang menjadi nol.

## Model

`RuleBasedRiskModel` adalah baseline PRD dengan bobot `0.45 / 0.35 / 0.20`
dan ambang `33 / 66`. Modul `ml_training.py` menyediakan training
Random Forest hanya untuk dataset historis yang memiliki label kejadian.
Model terlatih tidak boleh dipakai sebelum divalidasi terhadap data lokal.
