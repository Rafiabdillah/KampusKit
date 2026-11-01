// Database Pengetahuan Akademik & Keterampilan Mahasiswa Offline
// Dirancang untuk berfungsi 100% tanpa internet dengan respons instan

export interface KnowledgeItem {
  id: string;
  category: 'SKRIPSI' | 'STATISTIKA' | 'INFORMATIKA' | 'EKONOMI' | 'METODE_BELAJAR' | 'ISTILAH_KAMPUS' | 'TEMPLATE_DOSEN' | 'TIPS_MAHASISWA' | 'HUKUM' | 'KESEHATAN' | 'SAINS_TEKNIK' | 'PSIKOLOGI' | 'BAHASA' | 'KARIR' | 'MATEMATIKA';
  title: string;
  keywords: string[];
  response: string;
  copyableText?: string;
  relatedTips?: string[];
}

export const OFFLINE_KNOWLEDGE_BASE: KnowledgeItem[] = [
  // ==========================================
  // 1. TEMPLATE KOMUNIKASI & CHAT DOSEN
  // ==========================================
  {
    id: 'template-chat-bimbingan',
    category: 'TEMPLATE_DOSEN',
    title: 'Template Chat Dosen Pembimbing (Bimbingan Skripsi)',
    keywords: ['chat dospem', 'chat dosen bimbingan', 'template bimbingan', 'minta bimbingan', 'wa dosen pembimbing', 'chat bimbingan skripsi'],
    response: `Berikut template pesan WhatsApp untuk meminta jadwal bimbingan skripsi kepada dosen pembimbing:\n\n---\n*Selamat pagi/siang, Bapak/Ibu [Nama Dosen Beserta Gelar].*\n\n*Mohon maaf mengganggu waktunya. Saya [Nama Lengkap], mahasiswa [Program Studi] angkatan [Tahun], NIM [NIM Anda]. Saya adalah mahasiswa bimbingan tugas akhir/skripsi Bapak/Ibu dengan judul "[Tuliskan Judul Skripsi Secara Singkat]".*\n\n*Berdasarkan progres draft BAB [Nomor Bab] yang telah saya susun, apabila Bapak/Ibu berkenan, saya memohon izin untuk berkonsultasi secara tatap muka atau daring pada waktu luang Bapak/Ibu minggu ini.*\n\n*Terima kasih banyak atas waktu dan arahan Bapak/Ibu.* 🙏\n---\n\n💡 **Tips Etika:**\n- Kirim pesan di jam kerja (08.00 - 16.00).\n- Hindari mengirim di akhir pekan kecuali dosen meminta.\n- Jangan gunakan singkatan ("sy", "tdk", "dgn").`,
    copyableText: `Selamat pagi/siang Bapak/Ibu [Nama Dosen, Gelar]. Mohon maaf mengganggu waktunya. Saya [Nama Lengkap], NIM [NIM], mahasiswa bimbingan skripsi Bapak/Ibu. Izin bertanya, apakah ada waktu luang minggu ini untuk konsultasi perkembangan draft Bab [Nomor Bab] saya? Terima kasih banyak atas waktu dan arahannya.`
  },
  {
    id: 'template-chat-izin-sakit',
    category: 'TEMPLATE_DOSEN',
    title: 'Template Chat Izin Tidak Masuk Kuliah (Sakit/Keperluan)',
    keywords: ['izin sakit', 'izin tidak masuk kuliah', 'chat dosen izin', 'surat izin kuliah', 'izin absen kuliah', 'template izin'],
    response: `Berikut template izin tidak masuk kuliah yang sopan:\n\n---\n*Selamat pagi/siang, Bapak/Ibu [Nama Dosen Pengampu, Gelar].*\n\n*Mohon maaf mengganggu waktunya. Saya [Nama Lengkap], NIM [NIM], dari kelas [Nama Mata Kuliah] ([Hari/Jam Perkuliahan]).*\n\n*Melalui pesan ini, saya memohon izin tidak dapat menghadiri perkuliahan pada hari ini dikarenakan kondisi kesehatan yang kurang baik/sedang sakit. Surat keterangan dokter telah saya lampirkan pada pesan ini.*\n\n*Saya akan tetap mempelajari materi perkuliahan hari ini melalui teman sekelas. Terima kasih banyak atas pengertian Bapak/Ibu.* 🙏\n---\n\n💡 **Tips:** Selalu lampirkan foto surat dokter yang jelas atau surat izin tertulis resmi.`,
    copyableText: `Selamat pagi/siang Bapak/Ibu [Nama Dosen, Gelar]. Mohon maaf mengganggu waktu Bapak/Ibu. Saya [Nama Lengkap], NIM [NIM], mahasiswa kelas [Mata Kuliah - Ruang/Hari]. Memohon izin tidak dapat mengikuti perkuliahan hari ini dikarenakan sedang sakit. Surat keterangan dokter terlampir. Terima kasih atas pengertian Bapak/Ibu.`
  },
  {
    id: 'template-chat-tanya-nilai',
    category: 'TEMPLATE_DOSEN',
    title: 'Template Klarifikasi Nilai / Tugas ke Dosen',
    keywords: ['tanya nilai', 'komplain nilai', 'klarifikasi nilai', 'nilai belum keluar', 'remedial dosen', 'chat nilai'],
    response: `Cara sopan menanyakan klarifikasi nilai tanpa terkesan menuntut:\n\n---\n*Selamat pagi/siang, Bapak/Ibu [Nama Dosen, Gelar].*\n\n*Mohon maaf mengganggu waktunya. Saya [Nama Lengkap], NIM [NIM], mahasiswa kelas [Nama Mata Kuliah - Kelas/Ruang].*\n\n*Terkait pengumuman nilai akhir [Mata Kuliah], mohon izin untuk bertanya dan berkonsultasi perihal evaluasi tugas/ujian saya. Apakah kiranya saya diperkenankan menemui Bapak/Ibu di kampus untuk meminta masukan agar saya dapat memperbaiki kekurangan pemahaman saya pada materi tersebut?*\n\n*Terima kasih banyak atas waktu dan kebaikan Bapak/Ibu.* 🙏\n---`,
    copyableText: `Selamat pagi/siang Bapak/Ibu [Nama Dosen, Gelar]. Mohon maaf mengganggu waktunya. Saya [Nama Lengkap], NIM [NIM], dari kelas [Mata Kuliah]. Mohon izin bertanya perihal evaluasi nilai saya pada tugas/ujian akhir kemarin. Apabila diperkenankan, saya ingin meminta arahan perbaikan pemahaman saya. Terima kasih banyak.`
  },
  {
    id: 'template-rekomendasi-beasiswa',
    category: 'TEMPLATE_DOSEN',
    title: 'Template Permohonan Surat Rekomendasi Beasiswa/Magang',
    keywords: ['rekomendasi beasiswa', 'surat rekomendasi', 'minta surat rekomendasi dosen', 'rekomendasi magang'],
    response: `Format meminta surat rekomendasi dari dosen:\n\n---\n*Selamat pagi/siang, Bapak/Ibu [Nama Dosen, Gelar].*\n\n*Mohon maaf mengganggu waktunya. Saya [Nama Lengkap], NIM [NIM], mahasiswa bimbingan/mata kuliah [Nama Matkul yang pernah diajar].*\n\n*Saat ini saya berencana mengajukan pendaftaran [Nama Beasiswa / Program Magang / Studi Independen]. Salah satu persyaratannya adalah surat rekomendasi dari dosen akademisi.*\n\n*Mengingat bimbingan dan pengalaman belajar saya di bawah arahan Bapak/Ibu, apakah kiranya Bapak/Ibu berkenan memberikan surat rekomendasi untuk mendukung proses aplikasi saya? Sebagai referensi, saya telah melampirkan CV, transkrip nilai, dan ringkasan motivasi saya.*\n\n*Terima kasih banyak atas kesempatan dan dukungannya.* 🙏\n---`,
    copyableText: `Selamat pagi/siang Bapak/Ibu [Nama Dosen, Gelar]. Mohon maaf mengganggu waktunya. Saya [Nama Lengkap], NIM [NIM]. Saat ini saya berencana mendaftar [Nama Program/Beasiswa] yang membutuhkan surat rekomendasi. Mengingat bimbingan Bapak/Ibu selama ini, apakah kiranya Bapak/Ibu berkenan memberikan rekomendasi? Bersama pesan ini saya lampirkan CV dan draft motivasi. Terima kasih banyak.`
  },
  {
    id: 'template-linkedin-outreach',
    category: 'KARIR',
    title: 'Template Cold Message LinkedIn ke HRD / Recruiter',
    keywords: ['template linkedin', 'chat recruiter', 'chat hrd', 'cold message magang', 'connect linkedin'],
    response: `💼 **Template Pesan LinkedIn Connection / InMail ke Recruiter:**\n\n*Halo [Nama HRD/Recruiter], salam kenal.*\n\n*Saya [Nama Anda], mahasiswa tingkat akhir [Jurusan] di [Universitas]. Saya telah mengikuti perkembangan inovasi [Nama Perusahaan], terutama pada inisiatif [sebutkan proyek atau produk perusahaan].*\n\n*Dengan antusiasme dan keahlian saya di bidang [Sebutkan 1-2 Hard Skill utama], saya sangat tertarik untuk berkontribusi pada posisi [Nama Posisi / Internship].*\n\n*Bolehkah saya terhubung untuk memperluas jejaring profesional dan berdiskusi mengenai peluang karir di [Nama Perusahaan]? Terima kasih atas waktu Anda.*`,
    copyableText: `Halo [Nama Recruiter], salam kenal. Saya [Nama Anda], mahasiswa [Jurusan] di [Universitas]. Saya sangat mengagumi inovasi [Nama Perusahaan] dan memiliki minat mendalam di bidang [Bidang Keahlian]. Saya ingin terhubung untuk memperluas jejaring dan menyimak peluang internship/karir di tim Anda. Terima kasih!`
  },

  // ==========================================
  // 2. METODOLOGI PENELITIAN & SKRIPSI
  // ==========================================
  {
    id: 'rumus-slovin',
    category: 'SKRIPSI',
    title: 'Rumus Slovin (Menentukan Ukuran Sampel Penelitian)',
    keywords: ['slovin', 'rumus slovin', 'hitung sampel slovin', 'ukuran sampel penelitian', 'sample size', 'penentuan sampel'],
    response: `📐 **Rumus Slovin untuk Menentukan Jumlah Sampel:**\n\n$$\\mathbf{n = \\frac{N}{1 + N(e^2)}}$$\n\nKeterangan:\n- **n** = Jumlah sampel yang dibutuhkan\n- **N** = Jumlah total populasi yang diketahui\n- **e** = Batas toleransi kesalahan / margin of error (biasanya 5% atau 0.05, bisa juga 1% atau 10%)\n\n📌 **Contoh Perhitungan:**\nJika populasi mahasiswa ($N$) = 1.000 orang dengan margin kesalahan 5% ($e = 0.05$):\n1. $e^2 = 0.05 \\times 0.05 = 0.0025$\n2. $N \\times e^2 = 1.000 \\times 0.0025 = 2.5$\n3. Penyebut = $1 + 2.5 = 3.5$\n4. $n = 1.000 / 3.5 \\approx$ **286 responden**.\n\n*(Tips: Di KampusKit Anda bisa mengetik 'Hitung slovin populasi 1000 margin 5%' untuk kalkulasi instan!)*`
  },
  {
    id: 'struktur-skripsi',
    category: 'SKRIPSI',
    title: 'Struktur Standar Bab 1 s.d. Bab 5 Skripsi / Tugas Akhir',
    keywords: ['struktur skripsi', 'bab 1 skripsi', 'bab skripsi', 'kerangka skripsi', 'tahapan skripsi', 'outline skripsi', 'bab 1 sampai 5'],
    response: `📑 **Kerangka Baku Bab 1 s.d. Bab 5 Skripsi (S1):**\n\n1. **BAB I: Pendahuluan**\n   - Latar Belakang Masalah (Fenomena riil $\\to$ data empiris $\\to$ Research Gap $\\to$ urgensi penelitian).\n   - Identifikasi & Batasan Masalah.\n   - Rumusan Masalah (Pertanyaan penelitian).\n   - Tujuan & Manfaat Penelitian (Teoretis & Praktis).\n\n2. **BAB II: Tinjauan Pustaka & Landasan Teori**\n   - Kajian Teori Utama (*Grand Theory*, *Middle Theory*, *Applied Theory*).\n   - Penelitian Terdahulu yang Relevan (Minimal 5-10 jurnal bereputasi).\n   - Kerangka Berpikir / Kerangka Konseptual.\n   - Hipotesis Penelitian (Jika kuantitatif).\n\n3. **BAB III: Metodologi Penelitian**\n   - Desain Penelitian (Kuantitatif, Kualitatif, R&D, Mix Method).\n   - Populasi, Sampel, dan Teknik Sampling (Random/Purposive).\n   - Variabel Penelitian & Definisi Operasional.\n   - Teknik Pengumpulan Data & Uji Instrumen (Validitas & Reliabilitas).\n   - Teknik Analisis Data (Regresi, SEM-PLS, Tematik, dll.).\n\n4. **BAB IV: Hasil dan Pembahasan**\n   - Gambaran Umum Objek Penelitian.\n   - Deskripsi Data & Uji Asumsi Klasik.\n   - Pengujian Hipotesis & Analisis Temuan.\n   - Pembahasan Mendalam (Menghubungkan temuan dengan teori & studi terdahulu).\n\n5. **BAB V: Penutup**\n   - Kesimpulan (Menjawab langsung rumusan masalah).\n   - Implikasi Penelitian.\n   - Saran & Rekomendasi (Untuk akademisi dan praktisi/objek studi).`
  },
  {
    id: 'uji-validitas-reliabilitas',
    category: 'STATISTIKA',
    title: 'Uji Validitas & Reliabilitas Kuesioner',
    keywords: ['uji validitas', 'uji reliabilitas', 'cronbach alpha', 'r hitung r tabel', 'uji kuesioner'],
    response: `📊 **Uji Validitas dan Reliabilitas Instrumen Penelitian:**\n\n1. **Uji Validitas (Ketepatan Alat Ukur):**\n   - Menguji apakah item kuesioner benar-benar mengukur variabel yang dimaksud.\n   - **Metode:** *Pearson Product Moment* (Korelasi Bivariate).\n   - **Kriteria Keputusan:**\n     - Jika $r_{\\text{hitung}} > r_{\\text{tabel}}$ pada signifikansi 5% (0.05) $\\to$ **VALID**.\n     - Jika $r_{\\text{hitung}} < r_{\\text{tabel}}$ $\\to$ **TIDAK VALID** (Item harus dihapus atau diperbaiki kalimatnya).\n\n2. **Uji Reliabilitas (Konsistensi Alat Ukur):**\n   - Menguji konsistensi jawaban responden jika kuesioner diuji berulang kali.\n   - **Metode:** *Cronbach's Alpha* ($\\alpha$).\n   - **Kriteria Keputusan:**\n     - Jika nilai Cronbach's Alpha $> 0.60$ (atau $> 0.70$ pada standar ketat Nunnally) $\\to$ **RELIABEL**.\n     - Jika $< 0.60$ $\\to$ Tidak reliabel.`
  },
  {
    id: 'format-apa-7',
    category: 'SKRIPSI',
    title: 'Panduan Sitasi & Daftar Pustaka APA 7th Edition',
    keywords: ['apa 7', 'format sitasi', 'daftar pustaka apa', 'cara nulis daftar pustaka', 'citation apa style', 'apa 7th'],
    response: `📖 **Format Sitasi & Daftar Pustaka APA Style (Edisi ke-7):**\n\n1. **Buku:**\n   Nama Belakang, Inisial. (Tahun). *Judul buku dicetak miring* (Edisi jika ada). Penerbit.\n   *Contoh:* Sugiyono. (2021). *Metode penelitian kuantitatif, kualitatif, dan R&D*. Alfabeta.\n\n2. **Artikel Jurnal Ilmiah:**\n   Nama Belakang, Inisial. (Tahun). Judul artikel. *Nama Jurnal Dicetak Miring*, *Volume*(Nomor Isu), Halaman. https://doi.org/xxxx\n   *Contoh:* Smith, J. A., & Raharjo, B. (2023). Digital learning transformation. *Journal of Higher Education*, *15*(2), 145–158. https://doi.org/10.1016/j.jhe.2023.01.002\n\n3. **Website / Artikel Online:**\n   Nama Penulis atau Organisasi. (Tahun, Tanggal Bulan). *Judul halaman web*. Nama Situs. URL\n   *Contoh:* Kemendikbudristek. (2024, 15 Januari). *Transformasi pendidikan tinggi era AI*. Kemendikbud. https://kemdikbud.go.id/artikel\n\n💡 **Aturan Sitasi dalam Teks:**\n- 1 Penulis: (Pratama, 2023) atau Pratama (2023)\n- 2 Penulis: (Pratama & Nugroho, 2023)\n- 3 Penulis atau lebih: (Pratama et al., 2023)`
  },

  // ==========================================
  // 3. HUKUM & TATA NEGARA INDONESIA
  // ==========================================
  {
    id: 'hierarki-peraturan-hukum',
    category: 'HUKUM',
    title: 'Hierarki Peraturan Perundang-undangan di Indonesia',
    keywords: ['hierarki peraturan', 'tata urutan uu', 'uu no 12 tahun 2011', 'sumber hukum indonesia', 'uud 1945', 'hukum tata negara'],
    response: `⚖️ **Tata Urutan Peraturan Perundang-undangan (Pasal 7 UU No. 12 Tahun 2011 jo UU No. 13 Tahun 2022):**\n\n1. **UUD Negara Republik Indonesia Tahun 1945** (Hukum Dasar Tertinggi).\n2. **Ketetapan Majelis Permusyawaratan Rakyat (TAP MPR)**.\n3. **Undang-Undang (UU) / Peraturan Pemerintah Pengganti Undang-Undang (Perppu)**.\n4. **Peraturan Pemerintah (PP)**.\n5. **Peraturan Presiden (Perpres)**.\n6. **Peraturan Daerah Provinsi (Perda Provinsi)**.\n7. **Peraturan Daerah Kabupaten/Kota (Perda Kab/Kota)**.\n\n📌 **Prinsip Utama:** Peraturan yang lebih rendah tingkatannya tidak boleh bertentangan dengan peraturan yang lebih tinggi (*Stufenbautheorie* oleh Hans Kelsen).`
  },
  {
    id: 'asas-asas-hukum',
    category: 'HUKUM',
    title: 'Asas-Asas Pokok Hukum Indonesia (Asas Lex)',
    keywords: ['asas hukum', 'lex superior', 'lex specialis', 'lex posterior', 'asas asas hukum', 'prinsip hukum'],
    response: `🏛️ **Asas-Asas Pokok Pertentangan Hukum (*Conflict of Laws*):**\n\n1. **Lex Superior Derogat Legi Inferiori:**\n   Hukum yang lebih tinggi tingkatannya mengesampingkan hukum yang lebih rendah kedudukannya.\n\n2. **Lex Specialis Derogat Legi Generali:**\n   Hukum yang bersifat khusus mengesampingkan hukum yang bersifat umum (misal: UU ITE mengesampingkan KUHP untuk kasus tindak pidana siber tertentu).\n\n3. **Lex Posterior Derogat Legi Priori:**\n   Hukum yang baru disahkan mengesampingkan hukum lama yang mengatur substansi yang sama.\n\n4. **Asas Legalitas (*Nullum delictum nulla poena sine praevia lege poenali*):**\n   Tiada suatu perbuatan dapat dihukum tanpa adanya aturan undang-undang pidana yang telah ada terlebih dahulu sebelum perbuatan dilakukan.`
  },

  // ==========================================
  // 4. KESEHATAN, BIOLOGI & FARMASI
  // ==========================================
  {
    id: 'kalkulator-bmi-standar',
    category: 'KESEHATAN',
    title: 'Indeks Massa Tubuh (BMI) Klasifikasi Asia-Pasifik',
    keywords: ['bmi', 'body mass index', 'berat badan ideal', 'hitung bmi', 'klasifikasi bmi'],
    response: `🩺 **Indeks Massa Tubuh (BMI / IMT) Standar WHO Asia-Pasifik:**\n\n$$\\mathbf{BMI = \\frac{\\text{Berat Badan (kg)}}{(\\text{Tinggi Badan (m)})^2}}$$\n\n📊 **Kategori Klasifikasi:**\n- **< 18.5:** Berat Badan Kurang (*Underweight*)\n- **18.5 – 22.9:** Normal / Ideal (*Healthy Weight*)\n- **23.0 – 24.9:** Kelebihan Berat Badan / Berisiko (*Overweight*)\n- **25.0 – 29.9:** Obesitas Tingkat I\n- **$\\ge 30.0$:** Obesitas Tingkat II (Morbid)\n\n*(Ketik 'Hitung BMI TB 170 BB 65' di chat untuk kalkulasi instan!)*`
  },
  {
    id: 'mitosis-vs-meiosis',
    category: 'KESEHATAN',
    title: 'Perbedaan Mitosis vs Meiosis (Biologi Sel)',
    keywords: ['mitosis', 'meiosis', 'pembelahan sel', 'tahapan mitosis', 'profase metafase'],
    response: `🔬 **Perbandingan Pembelahan Sel: Mitosis vs Meiosis:**\n\n| Parameter | Mitosis | Meiosis |\n| :--- | :--- | :--- |\n| **Tempat Terjadi** | Sel Tubuh (Somatik) | Sel Kelamin (Gamet: sperma/ovum) |\n| **Jumlah Pembelahan** | 1 Kali | 2 Kali (Meiosis I & II) |\n| **Jumlah Sel Anak** | 2 Sel Anak | 4 Sel Anak |\n| **Jumlah Kromosom** | Diploid (2n) $\\to$ Sama | Haploid (n) $\\to$ Setengah induk |\n| **Tujuan** | Pertumbuhan & Regenerasi jaringan | Membentuk sel kelamin (reproduksi) |\n| **Pindah Silang** | Tidak ada | Ada (*Crossing Over* pada Profase I) |\n\nTahapan umum: **P-M-A-T** (Profase, Metafase, Anafase, Telofase).`
  },

  // ==========================================
  // 5. SAINS & TEKNIK DASAR
  // ==========================================
  {
    id: 'hukum-newton',
    category: 'SAINS_TEKNIK',
    title: 'Hukum Newton I, II, dan III tentang Gerak (Fisika)',
    keywords: ['hukum newton', 'newton 1 2 3', 'rumus newton', 'fisika gerak', 'gaya dan massa'],
    response: `🚀 **3 Hukum Pokok Newton tentang Gerak:**\n\n1. **Hukum I Newton (Inersia / Kelembaman):**\n   $$\\sum F = 0$$\n   Benda yang diam akan tetap diam, dan benda yang bergerak lurus beraturan akan tetap bergerak dengan kecepatan konstan selama tidak ada resultan gaya luar yang mempengaruhinya.\n\n2. **Hukum II Newton (Percepatan):**\n   $$F = m \\times a$$\n   Percepatan ($a$) berbanding lurus dengan gaya total ($F$) dan berbanding terbalik dengan massa ($m$).\n\n3. **Hukum III Newton (Aksi - Reaksi):**\n   $$F_{\\text{aksi}} = -F_{\\text{reaksi}}$$\n   Setiap aksi selalu menimbulkan reaksi yang sama besar tetapi berlawanan arah.`
  },
  {
    id: 'hukum-ohm-listrik',
    category: 'SAINS_TEKNIK',
    title: 'Hukum Ohm & Rumus Daya Listrik Dasar',
    keywords: ['hukum ohm', 'rumus listrik', 'tegangan arus hambatan', 'daya listrik', 'v ir'],
    response: `⚡ **Hukum Ohm dan Daya Listrik:**\n\n1. **Hukum Ohm:**\n   $$V = I \\times R$$\n   - **V** = Tegangan listrik (*Voltage*, Volt)\n   - **I** = Kuat arus listrik (*Current*, Ampere)\n   - **R** = Hambatan listrik (*Resistance*, Ohm $\\Omega$)\n\n2. **Daya Listrik (Power):**\n   $$P = V \\times I = I^2 \\times R = \\frac{V^2}{R}$$\n   - **P** = Daya listrik (Watt).`
  },

  // ==========================================
  // 6. BAHASA INDONESIA BAKU (EYD V / PUEBI)
  // ==========================================
  {
    id: 'kata-baku-skripsi',
    category: 'BAHASA',
    title: 'Daftar Kata Baku vs Tidak Baku Sering Keliru di Skripsi',
    keywords: ['kata baku', 'puebi', 'eyd v', 'ejaan yang disempurnakan', 'kosakata baku skripsi', 'penulisan yang benar'],
    response: `✍️ **Kata Baku vs Tidak Baku (Sesuai KBBI & EYD Edisi V):**\n\n- ✅ **Silakan** | ❌ Silahkan\n- ✅ **Praktik** | ❌ Praktek\n- ✅ **Antre** | ❌ Antri\n- ✅ **Analisis** | ❌ Analisa\n- ✅ **Kualitas** | ❌ Kwalitas\n- ✅ **Objek** | ❌ Obyek\n- ✅ **Subjek** | ❌ Subyek\n- ✅ **Hierarki** | ❌ Hirarki\n- ✅ **Sekadar** | ❌ Sekedar\n- ✅ **Risiko** | ❌ Resiko\n- ✅ **Efektif** | ❌ Efektip\n- ✅ **Konkret** | ❌ Konkrit\n- ✅ **Napas** | ❌ Nafas\n- ✅ **Izin** | ❌ Ijin\n- ✅ **Zaman** | ❌ Jaman`
  },
  {
    id: 'penulisan-gelar-akademik',
    category: 'BAHASA',
    title: 'Pedoman Penulisan Gelar Akademik Indonesia',
    keywords: ['penulisan gelar', 'gelar sarjana', 'gelar magister', 'gelar doktor', 'tanda koma gelar'],
    response: `🎓 **Pedoman Penulisan Gelar Akademik Sesuai EYD:**\n\n1. Selalu gunakan tanda koma (,) setelah nama lengkap sebelum mencantumkan gelar.\n2. Tiap unsur singkatan gelar diakhiri tanda titik (.).\n\n📌 **Contoh Penulisan yang Benar:**\n- Sarjana Komputer: **Rafi Abdillah, S.Kom.**\n- Sarjana Teknik: **Budi Santoso, S.T.**\n- Sarjana Ekonomi: **Siti Aminah, S.E.**\n- Magister Manajemen: **Ahmad Zaki, S.Kom., M.M.**\n- Magister Teknik: **Ir. Hendra Gunawan, M.T.**\n- Gelar Luar Negeri: **Dr. John Doe, Ph.D.**\n- Profesor & Doktor: **Prof. Dr. Ir. Soepomo, M.Sc.**`
  },

  // ==========================================
  // 7. PSIKOLOGI & METODE BELAJAR
  // ==========================================
  {
    id: 'teori-hierarki-maslow',
    category: 'PSIKOLOGI',
    title: 'Hierarki Kebutuhan Manusia (Abraham Maslow)',
    keywords: ['maslow', 'hierarki maslow', 'kebutuhan maslow', 'teori motivasi maslow'],
    response: `🧠 **Piramida Hierarki Kebutuhan Maslow (Tingkat 1 - 5):**\n\n1. **Kebutuhan Fisiologis (Dasar):** Makanan, minuman, tidur, tempat bernaung.\n2. **Kebutuhan Rasa Aman (*Safety*):** Keamanan fisik, stabilitas keuangan, kepastian kesehatan.\n3. **Kebutuhan Sosial / Rasa Memiliki (*Love & Belonging*):** Persahabatan, keluarga, kelompok komunitas.\n4. **Kebutuhan Penghargaan (*Esteem*):** Kepercayaan diri, pengakuan, prestasi, rasa dihargai.\n5. **Aktualisasi Diri (*Self-Actualization*):** Mengembangkan potensi maksimal, kreativitas, pemenuhan makna hidup.`
  },
  {
    id: 'cognitive-bias-mahasiswa',
    category: 'PSIKOLOGI',
    title: 'Bias Kognitif yang Sering Menjebak Mahasiswa',
    keywords: ['bias kognitif', 'dunning kruger', 'sunk cost fallacy', 'confirmation bias', 'jebakan psikologi'],
    response: `🔍 **3 Bias Kognitif Terbesar di Kalangan Mahasiswa:**\n\n1. **Dunning-Kruger Effect:**\n   Kecenderungan merasa sudah sangat paham suatu materi padahal baru membaca sedikit, sehingga malas mendalami lebih lanjut menjelang ujian.\n\n2. **Sunk Cost Fallacy:**\n   Mempertahankan judul skripsi/metode yang sudah jelas buntu hanya karena sudah membuang waktu 3 bulan mengerjakannya.\n\n3. **Confirmation Bias:**\n   Hanya mencari jurnal atau sumber data yang mendukung opini pribadi kita dalam argumen skripsi, dan mengabaikan fakta kontradiktif.`
  },
  {
    id: 'teknik-feynman',
    category: 'METODE_BELAJAR',
    title: 'Teknik Feynman (Kuasai Konsep Tersulit Dalam 4 Langkah)',
    keywords: ['feynman', 'teknik feynman', 'cara cepat paham materi', 'metode belajar feynman', 'belajar cepat'],
    response: `💡 **Teknik Belajar Feynman (oleh Fisikawan Richard Feynman):**\n\n1. **Pilih Konsep:** Tulis nama topik atau teori di bagian atas selembar kertas kosong.\n2. **Jelaskan Seperti Mengajari Anak 12 Tahun:** Tulis penjelasan dengan bahasa sesederhana mungkin tanpa istilah teknis (*jargon*).\n3. **Identifikasi Titik Lemah (Celah Pemahaman):** Di bagian mana Anda mulai bingung atau kembali menggunakan istilah rumit? Buka kembali buku/catatan dan perdalam bagian tersebut.\n4. **Sederhanakan & Gunakan Analogi:** Rangkai kembali kalimat menggunakan analogi dunia nyata yang intuitif.`
  },
  {
    id: 'spaced-repetition',
    category: 'METODE_BELAJAR',
    title: 'Spaced Repetition & Kurva Lupa Ebbinghaus',
    keywords: ['spaced repetition', 'kurva lupa', 'ebbinghaus', 'cara mengingat materi', 'pengulangan berkala'],
    response: `🧠 **Spaced Repetition (Pengulangan Berjarak):**\n\nMenurut penelitian Hermann Ebbinghaus, manusia melupakan **70% materi baru hanya dalam waktu 24 jam** jika tidak diulang.\n\n📅 **Jadwal Pengulangan Optimal:**\n- **Hari ke-0:** Pelajari materi pertama kali.\n- **Hari ke-1 (24 jam kemudian):** Review kilat 10 menit (Active Recall).\n- **Hari ke-3:** Uji diri sendiri dengan Flashcard.\n- **Hari ke-7 (1 minggu):** Selesaikan 3 latihan soal.\n- **Hari ke-14 & ke-30:** Review komprehensif.\n\n*(Tips: Fitur Flashcard di KampusKit otomatis menggunakan algoritma cerdas SM-2 yang berbasis spaced repetition!)*`
  },

  // ==========================================
  // 8. KARIR & KEUANGAN MAHASISWA
  // ==========================================
  {
    id: 'metode-star-wawancara',
    category: 'KARIR',
    title: 'Metode STAR untuk Menjawab Wawancara Kerja / Magang',
    keywords: ['metode star', 'interview kerja', 'pertanyaan wawancara', 'star interview', 'tips interview'],
    response: `🎯 **Metode STAR (Standar Jawaban Wawancara Perusahaan Multinasional):**\n\n- **S - Situation:** Ceritakan latar belakang konteks situasi atau tantangan spesifik yang Anda hadapi.\n- **T - Task:** Jelaskan peran dan tanggung jawab utama Anda dalam menangani situasi tersebut.\n- **A - Action:** Uraikan langkah taktis konkret dan keputusan yang Anda ambil secara pribadi (Gunakan kata "Saya", bukan "Kami").\n- **R - Result:** Tunjukkan hasil capaian nyata yang terukur (kuantitatif) dan pelajaran berharga yang Anda peroleh.`
  },
  {
    id: 'aturan-budget-50-30-20',
    category: 'EKONOMI',
    title: 'Prinsip Budgeting 50/30/20 untuk Anak Kost & Mahasiswa',
    keywords: ['budgeting 50 30 20', 'kelola uang bulanan', 'hemat anak kost', 'atur uang saku', 'keuangan mahasiswa'],
    response: `💰 **Formula Alokasi Uang Saku Mahasiswa (50/30/20):**\n\n- **50% Kebutuhan Pokok (*Needs*):** Makan sehari-hari, biaya sewa kos, kuota internet, bensin/ongkos transportasi, perlengkapan mandi.\n- **30% Keinginan (*Wants*):** Nongkrong di cafe, langganan streaming (Spotify/Netflix), hobi, beli outfit baru.\n- **20% Tabungan & Investasi (*Savings/Emergency*):** Tabungan darurat (minimal Rp 500rb - Rp 1jt), reksadana pasar uang, dana darurat tugas akhir/fotokopi.`
  },
  {
    id: 'analisis-swot',
    category: 'EKONOMI',
    title: 'Kerangka Kerja Analisis SWOT',
    keywords: ['swot', 'analisis swot', 'strengths weaknesses', 'kerangka swot'],
    response: `🎯 **Analisis SWOT untuk Bisnis & Organisasi Kampus:**\n\n- **S - Strengths (Kekuatan):** Keunggulan internal yang dapat dikendalikan (Contoh: Tim kompeten, teknologi eksklusif, reputasi baik).\n- **W - Weaknesses (Kelemahan):** Keterbatasan internal yang perlu diperbaiki (Contoh: Anggaran terbatas, sistem belum otomatis, kurang pengalaman).\n- **O - Opportunities (Peluang):** Faktor eksternal yang menguntungkan (Contoh: Tren pasar naik, kebijakan pemerintah mendukung, kompetitor melemah).\n- **T - Threats (Ancaman):** Hambatan eksternal di luar kendali langsung (Contoh: Perubahan regulasi, inflasi, kemunculan substitusi baru).`
  },

  // ==========================================
  // 9. INFORMATIKA & TEKNOLOGI
  // ==========================================
  {
    id: '4-pilar-oop',
    category: 'INFORMATIKA',
    title: '4 Pilar Pemrograman Berorientasi Objek (OOP)',
    keywords: ['oop', 'pilar oop', 'enkapsulasi', 'inheritance', 'polimorfisme', 'abstraksi', 'object oriented'],
    response: `💻 **4 Pilar Utama Object-Oriented Programming (OOP):**\n\n1. **Encapsulation (Pembungkusan):** Mengemas data dan fungsi ke dalam class serta menyembunyikan detail internal melalui access modifier (\`private\`, \`protected\`, \`public\`).\n2. **Inheritance (Pewarisan):** Mekanisme di mana class anak mewarisi properti dan method dari class induk (\`extends\`) untuk mencegah duplikasi kode.\n3. **Polymorphism (Banyak Bentuk):** Kemampuan objek untuk merespons method yang sama dengan cara berbeda, melalui *Method Overriding* atau *Method Overloading*.\n4. **Abstraction (Abstraksi):** Menyembunyikan kompleksitas implementasi dan hanya menampilkan fungsionalitas inti kepada pengguna melalui \`abstract class\` atau \`interface\`.\`\``
  },
  {
    id: 'git-commands-cheat-sheet',
    category: 'INFORMATIKA',
    title: 'Daftar Perintah Penting Git (Version Control)',
    keywords: ['perintah git', 'git command', 'git cheat sheet', 'git commit', 'git push', 'git branch'],
    response: `🐙 **Perintah Pokok Git yang Wajib Dikuasai Mahasiswa:**\n\n- \`git init\`: Memulai repositori git lokal baru.\n- \`git clone <url>\`: Mengunduh repositori dari GitHub/GitLab.\n- \`git status\`: Mengecek status perubahan file.\n- \`git add .\`: Menandai semua file yang berubah untuk di-commit.\n- \`git commit -m "pesan"\`: Menyimpan snapshot perubahan dengan pesan jelas.\n- \`git push origin <branch>\`: Mengunggah commit ke server remote.\n- \`git pull origin <branch>\`: Mengambil dan menggabungkan pembaruan dari remote.\n- \`git checkout -b <nama-branch>\`: Membuat dan berpindah ke cabang fitur baru.\n- \`git stash\`: Menyimpan sementara perubahan yang belum siap di-commit.`
  },
  {
    id: 'big-o-notation',
    category: 'INFORMATIKA',
    title: 'Notasi Big-O (Kompleksitas Waktu Algoritma)',
    keywords: ['big o', 'kompleksitas waktu', 'time complexity', 'algoritma kompleksitas'],
    response: `⚡ **Peringkat Kompleksitas Waktu Algoritma (Notasi Big-O):**\n\n1. **O(1) - Constant Time:** Sangat cepat! Waktu eksekusi tidak tergantung ukuran data (Contoh: Akses index array \`arr[0]\`, hash table lookup).\n2. **O(log n) - Logarithmic:** Sangat efisien (Contoh: Binary Search pada array terurut).\n3. **O(n) - Linear Time:** Waktu bertambah sebanding jumlah data (Contoh: Linear search, for loop biasa).\n4. **O(n log n) - Linearithmic:** Standar algoritma sorting efisien (Contoh: Merge Sort, Quick Sort).\n5. **O(n²) - Quadratic:** Kurang efisien untuk data besar (Contoh: Nested loop, Bubble Sort).\n6. **O(2^n) - Exponential:** Sangat lambat (Contoh: Rekursi Fibonacci naif).`
  },

  // ==========================================
  // 10. GLOSARIUM KAMPUS & ISTILAH MAHASISWA
  // ==========================================
  {
    id: 'istilah-kampus-glosarium',
    category: 'ISTILAH_KAMPUS',
    title: 'Kamus Singkatan & Istilah Perkuliahan',
    keywords: ['istilah kuliah', 'apa itu sks', 'apa itu krs', 'apa itu ipk', 'apa itu yudisium', 'apa itu sempro', 'arti cumlaude'],
    response: `🎓 **Kamus Singkatan Dunia Perkuliahan:**\n\n- **SKS (Satuan Kredit Semester):** Bobot beban studi suatu mata kuliah (biasanya 2–4 SKS per matkul, standar total lulus S1 adalah 144 SKS).\n- **KRS (Kartu Rencana Studi):** Formulir pemilihan mata kuliah yang akan diambil pada semester berjalan.\n- **KHS (Kartu Hasil Studi):** Rapor semester yang memuat nilai dan IP.\n- **IP vs IPK:** IP = Indeks Prestasi per semester berjalan. IPK = Indeks Prestasi Kumulatif dari semester pertama hingga sekarang.\n- **Sempro (Seminar Proposal):** Ujian pemaparan proposal penelitian skripsi (Bab 1–3) di hadapan dosen penguji.\n- **Sidang Munaqasyah / Kompre:** Sidang skripsi akhir mempertahankan seluruh isi penelitian (Bab 1–5).\n- **Yudisium:** Pengumuman resmi kelulusan dan penentuan predikat/gelar akademik sebelum upacara wisuda.\n- **Cumlaude:** Predikat kelulusan dengan pujian (umumnya IPK $\\ge 3.51$ dan selesai tepat waktu maksimal 4 tahun tanpa nilai D/E).`
  },
  {
    id: 'mengatasi-prokrastinasi',
    category: 'TIPS_MAHASISWA',
    title: 'Aturan 5 Menit Mengatasi Kebiasaan Menunda (Prokrastinasi)',
    keywords: ['menunda tugas', 'prokrastinasi', 'malas ngerjain tugas', 'tips malas', 'aturan 5 menit'],
    response: `⏳ **Aturan 5 Menit (*The 5-Minute Rule*) Mengatasi Rasa Malas:**\n\nOtak kita menunda tugas bukan karena tugasnya sulit, melainkan karena **gesekan untuk memulai (*activation energy*)** terasa terlalu berat.\n\n**Caranya:**\n1. Berjanjilah pada diri sendiri: *"Saya hanya akan membuka laptop dan mengetik skripsi/tugas ini selama 5 MENIT saja. Setelah itu, kalau masih malas, saya bebas berhenti."*\n2. Mulai timer 5 menit.\n3. Menurut psikologi kognitif (*Zeigarnik Effect*), setelah otak melewati ambang pintu memulai, lebih dari 80% orang akan memilih terus lanjut hingga selesai!`
  }
];

// ==========================================
// 11. BANK SOAL KUIS OFFLINE INTERAKTIF LENGKAP
// ==========================================
export interface OfflineQuizQuestion {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const BUILT_IN_OFFLINE_QUIZZES: OfflineQuizQuestion[] = [
  {
    id: 'q1',
    category: 'Metodologi Penelitian',
    question: 'Rumus yang digunakan untuk menentukan ukuran sampel minimal dari populasi yang telah diketahui jumlahnya adalah?',
    options: ['Rumus Slovin', 'Rumus Bayes', 'Uji Kolmogorov-Smirnov', 'Regresi Linear'],
    correctIndex: 0,
    explanation: 'Rumus Slovin (n = N / (1 + N * e^2)) digunakan untuk menghitung ukuran sampel ketika ukuran populasi diketahui.'
  },
  {
    id: 'q2',
    category: 'Statistika',
    question: 'Jika suatu penelitian menghasilkan nilai p-value = 0.02 dengan tingkat signifikansi alpha = 0.05, apa keputusannya?',
    options: ['Gagal menolak H0', 'Tolak H0 (Ada pengaruh signifikan)', 'Data harus dibuang', 'Sampel kurang banyak'],
    correctIndex: 1,
    explanation: 'Karena p-value (0.02) < alpha (0.05), maka H0 ditolak, yang berarti terdapat hubungan/pengaruh yang signifikan secara statistik.'
  },
  {
    id: 'q3',
    category: 'Informatika & Logika',
    question: 'Algoritma pencarian Binary Search hanya dapat bekerja optimal jika data dalam array berstatus:',
    options: ['Acak', 'Terurut (Sorted)', 'Tipe datanya string', 'Berukuran ganjil'],
    correctIndex: 1,
    explanation: 'Binary Search membagi dua ruang pencarian pada setiap langkah, sehingga array WAJIB dalam kondisi terurut (sorted).'
  },
  {
    id: 'q4',
    category: 'Bahasa Indonesia (EYD V)',
    question: 'Manakah penulisan kata baku berikut ini yang sesuai dengan KBBI dan EYD V?',
    options: ['Silahkan dan praktek', 'Silakan dan praktik', 'Silakan dan praktek', 'Silahkan dan praktik'],
    correctIndex: 1,
    explanation: 'Bentuk baku yang benar adalah "silakan" (tanpa h) dan "praktik" (menggunakan i, bukan e).'
  },
  {
    id: 'q5',
    category: 'Hukum Tata Negara',
    question: 'Berdasarkan UU No. 12 Tahun 2011, peraturan perundang-undangan yang kedudukannya tepat berada di bawah UUD 1945 adalah:',
    options: ['Undang-Undang (UU)', 'Ketetapan MPR (TAP MPR)', 'Peraturan Pemerintah (PP)', 'Peraturan Presiden'],
    correctIndex: 1,
    explanation: 'Sesuai Pasal 7 UU No. 12/2011, urutan kedua setelah UUD 1945 adalah Ketetapan Majelis Permusyawaratan Rakyat (TAP MPR).'
  },
  {
    id: 'q6',
    category: 'Kesehatan & Gizi',
    question: 'Berdasarkan klasifikasi WHO untuk wilayah Asia-Pasifik, seseorang dengan BMI 23.8 tergolong dalam kategori:',
    options: ['Berat badan kurang (Underweight)', 'Berat badan ideal (Normal)', 'Kelebihan berat badan (Overweight)', 'Obesitas Tingkat II'],
    correctIndex: 2,
    explanation: 'Pada standar Asia-Pasifik, rentang 23.0 - 24.9 diklasifikasikan sebagai Overweight (berisiko), sedangkan normal berada di 18.5 - 22.9.'
  },
  {
    id: 'q7',
    category: 'Fisika Dasar',
    question: 'Sebuah balok bermassa 5 kg ditarik dengan gaya 20 N pada permukaan licin. Berapakah percepatan balok tersebut?',
    options: ['2 m/s²', '4 m/s²', '10 m/s²', '100 m/s²'],
    correctIndex: 1,
    explanation: 'Berdasarkan Hukum II Newton: F = m * a, maka a = F / m = 20 N / 5 kg = 4 m/s².'
  },
  {
    id: 'q8',
    category: 'Psikologi',
    question: 'Kecenderungan seseorang yang memiliki pengetahuan minim untuk melebih-lebihkan tingkat keahliannya disebut efek:',
    options: ['Halo Effect', 'Dunning-Kruger Effect', 'Placebo Effect', 'Hawthorne Effect'],
    correctIndex: 1,
    explanation: 'Dunning-Kruger Effect adalah bias kognitif di mana orang dengan kemampuan rendah merasa memiliki kompetensi jauh lebih tinggi dari kenyataannya.'
  },
  {
    id: 'q9',
    category: 'Bahasa Inggris (TOEFL)',
    question: 'Choose the grammatically correct sentence:',
    options: ['Neither of the students were ready.', 'Neither of the students was ready.', 'Neither of the student are ready.', 'Neither students is ready.'],
    correctIndex: 1,
    explanation: 'Kata "Neither" mengambil subjek tunggal (singular pronoun), sehingga kata kerja yang tepat adalah "was", bukan "were".'
  },
  {
    id: 'q10',
    category: 'Ekonomi & Keuangan',
    question: 'Investasi modal awal Rp 1.000.000 dengan bunga majemuk tahunan 10% akan bernilai berapa setelah 2 tahun?',
    options: ['Rp 1.200.000', 'Rp 1.210.000', 'Rp 1.100.000', 'Rp 1.331.000'],
    correctIndex: 1,
    explanation: 'Tahun ke-1: 1.000.000 + 10% = 1.100.000. Tahun ke-2: 1.100.000 + 10% = Rp 1.210.000 (A = P * (1 + r)^t).'
  }
];
