# Catatan Keputusan Sistem SMART BRMP SDLAHAN

Dokumen ini merangkum keputusan-keputusan penting soal cara kerja sistem,
ditulis dengan bahasa sederhana supaya mudah dipahami oleh semua pihak
(admin, PJ, maupun pimpinan instansi) — bukan hanya tim pengembang.

---

## 1. Satu kegiatan bisa berjalan bertahun-tahun

Kegiatan **tidak dibuat ulang** setiap kali tahun anggaran berganti. Kalau
suatu kegiatan sudah ada dari tahun 2026 dan masih berjalan di 2027, itu
tetap **kegiatan yang sama** di sistem — bukan kegiatan baru.

**Konsekuensinya:** total pagu dan total realisasi yang tercatat di sistem
adalah akumulasi **sejak kegiatan itu mulai**, bukan cuma tahun berjalan.

## 2. Pagu bersifat total keseluruhan, bukan per tahun

Nilai "Pagu" yang diinput admin dianggap sebagai **jatah total** kegiatan
tersebut sepanjang umurnya — bukan jatah yang di-reset tiap tahun anggaran
baru turun.

**Contoh:** Kegiatan A pagu-nya Rp 1 miliar. Kalau tahun 2026 sudah
terealisasi Rp 1 miliar penuh, maka di tahun 2027 kegiatan itu **tidak bisa
lapor realisasi baru lagi** — karena sistem menganggap jatahnya sudah habis.

> ⚠️ **Perlu didiskusikan ke depan:** kalau ternyata di praktiknya setiap
> tahun anggaran memang dapat alokasi dana baru (bukan jatah sekali habis),
> keputusan ini perlu ditinjau ulang. Untuk sekarang, sistem berjalan
> dengan asumsi pagu = total sepanjang umur kegiatan.

## 3. "Wajib" itu bukan syarat untuk isi laporan

Status **Wajib** yang admin centang di suatu kegiatan **bukan berarti**
kegiatan lain (yang tidak dicentang) boleh tidak lapor. **Semua PJ tetap
harus mengisi laporan setiap bulan**, apa pun status kegiatannya.

Centang "Wajib" itu dipakai untuk **statistik kepatuhan** — semacam
penanda kegiatan mana yang masuk hitungan laporan resmi tertentu. Detail
pastinya masih perlu dikonfirmasi ke pihak terkait.

## 4. Kegiatan diblokir? PJ tetap wajib lapor

Kalau admin menandai suatu kegiatan sebagai **Diblokir** (misalnya sedang
proses revisi anggaran), PJ **tetap wajib mengisi laporan bulanan** —
tapi dengan batasan:

- **Realisasi keuangan** dikunci ke Rp 0 (karena memang tidak ada
  pencairan dana selama diblokir)
- **Realisasi fisik** dikunci ke angka bulan sebelumnya (tidak bisa naik)
- **Uraian kegiatan** tetap bisa diisi bebas — untuk mencatat
  perkembangan/kendala di lapangan

## 5. Laporan tersimpan per bulan, bukan menimpa data lama

Setiap kali PJ submit laporan, sistem menyimpan **riwayat lengkap per
bulan** — bukan menimpa angka bulan sebelumnya. Jadi kalau suatu saat
perlu melihat "bulan Juni kemarin PJ lapor apa", datanya tetap ada, tidak
hilang tertimpa laporan bulan berikutnya.

## 6. Laporan Cetak Resmi — mencakup semua kegiatan yang pernah ada

Dokumen laporan cetak (untuk ditandatangani/diarsipkan) menampilkan
**semua kegiatan** yang ada di sistem — termasuk kegiatan dari tahun-tahun
sebelumnya kalau masih tercatat aktif. Untuk tiap kegiatan, angka
"realisasi periode lalu" dihitung dari **seluruh riwayat sebelum periode
yang dipilih**, tanpa terputus oleh pergantian tahun.

**Contoh:** Cetak laporan Januari 2027 — realisasi "periode lalu" akan
mengambil seluruh akumulasi laporan sejak kegiatan itu mulai sampai
Desember 2026, bukan mulai dari nol lagi.

---

_Dokumen ini akan diperbarui setiap ada keputusan baru yang memengaruhi
cara kerja sistem. Kalau ada bagian yang kurang jelas atau ternyata
berbeda dari kebijakan instansi yang sebenarnya, mohon segera
diinformasikan agar sistem bisa disesuaikan._
