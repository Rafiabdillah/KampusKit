
import React, { useState, useMemo, useEffect } from 'react';
import { ShieldAlert, Zap, AlertTriangle, CheckCircle2, Map, ChevronDown, ChevronUp, Info, Heart, Briefcase, DollarSign, Home, Smile, BookOpen, Star, Sparkles, Pin, Search, Filter } from 'lucide-react';
import { StorageService } from '../services/storage';

type Category = 'MUST' | 'NEED' | 'TOLERATE' | 'AVOID';
type Domain = 'AKADEMIK' | 'SPIRITUAL' | 'KARIR_BISNIS' | 'CINTA_SOSIAL' | 'KEUANGAN' | 'KELUARGA' | 'KESEHATAN';

interface Principle {
  id: string;
  title: string;
  desc: string;
  reason: string;
  action: string;
  category: Category;
  domain: Domain;
}

const PRINCIPLES_DB: Principle[] = [
  // ==========================================
  // 1. SPIRITUAL & AGAMA (Foundation)
  // ==========================================
  {
    id: 's1', title: 'Ibadah Wajib Tepat Waktu', category: 'MUST', domain: 'SPIRITUAL',
    desc: 'Shalat/Ibadah adalah prioritas utama di atas kuliah.',
    reason: 'Disiplin waktu ibadah melatih "Time Blocking" alami. Secara spiritual, ini menarik keberkahan waktu.',
    action: 'Pasang alarm adzan. Izin ke dosen dengan sopan jika waktu kelas menabrak waktu ibadah.'
  },
  {
    id: 's2', title: 'Adab Sebelum Ilmu', category: 'MUST', domain: 'SPIRITUAL',
    desc: 'Menghormati guru/dosen dan sumber ilmu.',
    reason: 'Ilmu itu cahaya, dan cahaya tidak masuk ke hati yang sombong. Keberkahan ilmu ada pada ridho guru.',
    action: 'Cium tangan orang tua/guru, ucapkan terima kasih, jangan memotong pembicaraan.'
  },
  {
    id: 's3', title: 'Sedekah Subuh / Harian', category: 'NEED', domain: 'SPIRITUAL',
    desc: 'Memberi sebelum meminta rezeki hari itu.',
    reason: 'Melatih "Abundance Mindset" (mental kaya). Mengurangi kecemasan akan kekurangan uang.',
    action: 'Siapkan celengan khusus atau transfer nominal kecil tiap pagi.'
  },
  {
    id: 's4', title: 'Menjaga Pandangan (Ghadul Bashar)', category: 'MUST', domain: 'SPIRITUAL',
    desc: 'Menghindari konten pornografi atau zina mata.',
    reason: 'Pornografi merusak Grey Matter di otak (Prefrontal Cortex), menurunkan motivasi dan fokus jangka panjang.',
    action: 'Pasang filter konten dewasa. Hindari akun "pemersatu bangsa" di sosmed.'
  },
  {
    id: 's5', title: 'Dzikir & Meditasi', category: 'NEED', domain: 'SPIRITUAL',
    desc: 'Menenangkan pikiran di sela kesibukan.',
    reason: 'Menurunkan gelombang otak dari Beta (Stres) ke Alpha (Tenang). Meningkatkan kejernihan berpikir.',
    action: 'Lakukan 5 menit setelah ibadah atau saat jeda kuliah.'
  },
  {
    id: 's6', title: 'Puasa Sunnah (Senin-Kamis)', category: 'NEED', domain: 'SPIRITUAL',
    desc: 'Melatih kontrol hawa nafsu dan detoks tubuh.',
    reason: 'Meningkatkan BDNF (Brain-Derived Neurotrophic Factor) dan disiplin diri.',
    action: 'Mulai dari puasa sebulan sekali, lalu tingkatkan.'
  },
  {
    id: 's7', title: 'Qanaah (Merasa Cukup)', category: 'MUST', domain: 'SPIRITUAL',
    desc: 'Tidak iri dengan pencapaian atau gaya hidup teman.',
    reason: 'Iri hati menghabiskan energi mental yang seharusnya dipakai untuk berkembang.',
    action: 'Ucapkan "MasyaAllah/Keren" saat teman sukses, lalu fokus ke jalurmu sendiri.'
  },
  {
    id: 's8', title: 'Mengingat Mati (Memento Mori)', category: 'NEED', domain: 'SPIRITUAL',
    desc: 'Menyadari hidup ini sementara.',
    reason: 'Obat paling ampuh untuk kemalasan dan kesombongan. Memberikan urgensi pada waktu.',
    action: 'Ziarah kubur sesekali atau renungkan: "Jika besok aku tiada, apa warisanku?"'
  },
  {
    id: 's9', title: 'Jujur (Siddiq)', category: 'MUST', domain: 'SPIRITUAL',
    desc: 'Kesesuaian antara hati, ucapan, dan perbuatan.',
    reason: 'Kebohongan butuh energi kognitif besar untuk dipertahankan. Kejujuran membebaskan otak.',
    action: 'Katakan kebenaran walau pahit. Jangan bohong soal alasan telat.'
  },
  {
    id: 's10', title: 'Tawakkal Setelah Ikhtiar', category: 'MUST', domain: 'SPIRITUAL',
    desc: 'Berserah diri setelah berusaha maksimal.',
    reason: 'Menghilangkan kecemasan akan hasil (Result Anxiety). Tugasmu berusaha, hasil urusan Tuhan.',
    action: 'Belajar mati-matian, lalu doa: "Ya Tuhan, aku serahkan hasilnya pada-Mu".'
  },
  {
    id: 's11', title: 'Niat Lillah', category: 'MUST', domain: 'SPIRITUAL',
    desc: 'Kuliah bukan cuma cari ijazah, tapi ibadah.',
    reason: 'Mengubah aktivitas duniawi menjadi pahala ukhrawi. Membuat lelah menjadi lillah.',
    action: 'Setiap berangkat kuliah, ucapkan Bismillah dan niat menuntut ilmu.'
  },
  {
    id: 's12', title: 'Menjaga Wudhu', category: 'NEED', domain: 'SPIRITUAL',
    desc: 'Selalu dalam keadaan suci.',
    reason: 'Secara psikologis menjaga kesadaran diri (self-awareness) dan menahan diri dari perbuatan buruk.',
    action: 'Ambil wudhu setiap kali batal atau sebelum belajar.'
  },

  // ==========================================
  // 2. KELUARGA (Roots)
  // ==========================================
  {
    id: 'f1', title: 'Birrul Walidain (Berbakti)', category: 'MUST', domain: 'KELUARGA',
    desc: 'Memprioritaskan orang tua di atas ego.',
    reason: 'Doa ibu menembus langit. Hubungan buruk dengan orang tua seringkali menjadi blokade rezeki/ilmu.',
    action: 'Angkat telepon orang tua segera. Jangan membentak.'
  },
  {
    id: 'f2', title: 'Transparansi Finansial', category: 'MUST', domain: 'KELUARGA',
    desc: 'Jujur soal penggunaan uang saku/UKT.',
    reason: 'Uang yang didapat dengan menipu orang tua tidak akan membawa berkah dan ketenangan.',
    action: 'Kirim foto bukti transfer/kuitansi tanpa diminta.'
  },
  {
    id: 'f3', title: 'Quality Time Tanpa Gadget', category: 'NEED', domain: 'KELUARGA',
    desc: 'Saat pulang kampung, taruh HP.',
    reason: 'Orang tua rindu interaksi mata dan suara, bukan fisik yang sibuk main HP.',
    action: 'Simpan HP di kamar saat makan bersama atau ngobrol di ruang tamu.'
  },
  {
    id: 'f4', title: 'Menjadi Pendengar Baik', category: 'NEED', domain: 'KELUARGA',
    desc: 'Mendengarkan keluh kesah orang tua/saudara.',
    reason: 'Validasi emosi memperkuat ikatan batin (Bonding). Keluarga adalah support system utamamu.',
    action: 'Tanya: "Gimana kabar rumah?" dan dengarkan tanpa memotong.'
  },
  {
    id: 'f5', title: 'Membantu Pekerjaan Rumah', category: 'NEED', domain: 'KELUARGA',
    desc: 'Jangan jadi tamu di rumah sendiri.',
    reason: 'Melatih tanggung jawab dan empati terhadap lelahnya orang tua.',
    action: 'Cuci piring bekas makan sendiri. Sapu halaman.'
  },
  {
    id: 'f6', title: 'Menjaga Nama Baik Keluarga', category: 'MUST', domain: 'KELUARGA',
    desc: 'Tidak melakukan kriminalitas atau asusila.',
    reason: 'Aibmu adalah aib mereka. Kehormatan keluarga sulit dipulihkan.',
    action: 'Pikirkan wajah ibumu sebelum berbuat nakal.'
  },
  {
    id: 'f7', title: 'Minta Doa Restu', category: 'NEED', domain: 'KELUARGA',
    desc: 'Minta didoakan saat mau ujian atau ada hajat.',
    reason: 'Efek psikologis merasa didukung (Social Support) dan kekuatan spiritual doa.',
    action: 'Chat/Telpon: "Bu/Yah, besok ujian, mohon doanya ya."'
  },
  {
    id: 'f8', title: 'Sabar Menghadapi Gap Generasi', category: 'TOLERATE', domain: 'KELUARGA',
    desc: 'Memaklumi pola pikir orang tua yang "kuno".',
    reason: 'Debat kusir dengan orang tua hanya membuang energi dan menyakiti hati.',
    action: 'Iya-kan saja nasihat mereka, ambil baiknya, buang yang tidak relevan dengan sopan.'
  },
  {
    id: 'f9', title: 'Batasan Sehat (Healthy Boundaries)', category: 'TOLERATE', domain: 'KELUARGA',
    desc: 'Menjaga jarak emosional jika keluarga toxic/abusif.',
    reason: 'Kesehatan mentalmu tetap nomor satu. Memisahkan diri sejenak terkadang adalah bentuk perlindungan.',
    action: 'Berani bilang "tidak" pada tuntutan yang tidak masuk akal tanpa harus marah-marah.'
  },
  {
    id: 'f10', title: 'Sabar Mengajari Teknologi', category: 'NEED', domain: 'KELUARGA',
    desc: 'Bantu orang tua saat kesulitan dengan smartphone/internet.',
    reason: 'Dulu mereka mengajarimu berjalan dengan sabar. Ingat dunia digital sangat asing bagi generasi mereka.',
    action: 'Ajari cara video call, belanja online, atau waspada penipuan WhatsApp dengan nada lembut.'
  },
  {
    id: 'f11', title: 'Kemandirian & Pisah Rumah', category: 'NEED', domain: 'KELUARGA',
    desc: 'Mencoba hidup mandiri jauh dari orang tua (ngekos).',
    reason: 'Keluar dari sarang melatih problem-solving akut, survival skill, dan apresiasi terhadap rumah.',
    action: 'Jika ada masalah kos, usahakan cari solusinya sendiri dulu sebelum mengeluh ke orang tua.'
  },

  // ==========================================
  // 3. CINTA & SOSIAL (Pacar/Teman)
  // ==========================================
  {
    id: 'l1', title: 'Hubungan Halal/Sehat', category: 'MUST', domain: 'CINTA_SOSIAL',
    desc: 'Menjaga batasan agama dan norma.',
    reason: 'Hubungan yang melanggar norma membawa rasa bersalah (Guilt) bawah sadar yang mengganggu fokus.',
    action: 'Hindari khalwat (berduaan). Prioritaskan akad atau komitmen serius.'
  },
  {
    id: 'l2', title: 'Pacaran Produktif (Study Date)', category: 'TOLERATE', domain: 'CINTA_SOSIAL',
    desc: 'Saling menyemangati untuk akademik.',
    reason: 'Pasangan harus jadi aset, bukan liabilitas. Jika nilai turun karena pacaran, itu tanda toxic.',
    action: 'Date di perpustakaan/seminar. Lomba siapa yang IPK-nya lebih tinggi.'
  },
  {
    id: 'l3', title: 'Anti Toxic Relationship', category: 'AVOID', domain: 'CINTA_SOSIAL',
    desc: 'Kekerasan fisik, verbal, posesif berlebih, manipulasi.',
    reason: 'Merusak kesehatan mental (PTSD/Depresi). Tidak ada cinta dalam ketakutan.',
    action: 'Putuskan kontak. Block. Minta bantuan teman/konselor.'
  },
  {
    id: 'l4', title: 'Circle Pertemanan (The Big 5)', category: 'NEED', domain: 'CINTA_SOSIAL',
    desc: 'Kamu adalah rata-rata dari 5 teman terdekatmu.',
    reason: 'Social Contagion: Malas itu menular, rajin juga menular.',
    action: 'Cari teman yang lebih pintar/rajin dari kamu. Masuk circle ambis.'
  },
  {
    id: 'l5', title: 'Consent & Boundaries', category: 'MUST', domain: 'CINTA_SOSIAL',
    desc: 'Berani bilang "Tidak" pada ajakan negatif.',
    reason: 'People pleaser akan dimanfaatkan. Integritas diri lebih mahal dari validasi teman.',
    action: 'Tolak ajakan bolos/nongkrong jika ada tugas. "Sorry, gue mau nugas dulu."'
  },
  {
    id: 'l6', title: 'Hindari Drama/Ghibah', category: 'AVOID', domain: 'CINTA_SOSIAL',
    desc: 'Membicarakan keburukan orang lain.',
    reason: 'Ghibah mengeraskan hati dan membuang kapasitas otak untuk hal tidak berguna.',
    action: 'Alihkan topik atau pamit pergi saat teman mulai ghibah.'
  },
  {
    id: 'l7', title: 'Networking Lintas Jurusan', category: 'NEED', domain: 'CINTA_SOSIAL',
    desc: 'Berteman dengan anak teknik, ekonomi, seni, dll.',
    reason: 'Inovasi lahir dari persilangan ide (Interdisciplinary). Koneksi masa depan.',
    action: 'Ikut UKM tingkat universitas. Sapa orang baru di kantin.'
  },
  {
    id: 'l8', title: 'Menjaga Rahasia Teman', category: 'MUST', domain: 'CINTA_SOSIAL',
    desc: 'Tidak menjadi "ember bocor".',
    reason: 'Kepercayaan adalah mata uang sosial termahal. Sekali rusak, sulit kembali.',
    action: 'Jika dicurhati, simpan sendiri. Jangan jadikan bahan gosip.'
  },
  {
    id: 'l9', title: 'Traktir Teman (Sesekali)', category: 'TOLERATE', domain: 'CINTA_SOSIAL',
    desc: 'Berbagi rezeki saat ada kelebihan.',
    reason: 'Mempererat persaudaraan dan melatih sifat dermawan.',
    action: 'Bayarin gorengan atau kopi teman saat kamu habis gajian/dapat kiriman.'
  },
  {
    id: 'l10', title: 'Memaafkan & Move On', category: 'NEED', domain: 'CINTA_SOSIAL',
    desc: 'Tidak mendendam pada mantan atau teman yang menyakiti.',
    reason: 'Dendam itu seperti minum racun tapi berharap orang lain yang mati.',
    action: 'Unfollow jika perlu demi ketenangan, tapi maafkan dalam hati.'
  },
  {
    id: 'l11', title: 'JOMO (Joy of Missing Out)', category: 'NEED', domain: 'CINTA_SOSIAL',
    desc: 'Tidak perlu ikut semua tren atau nongkrong.',
    reason: 'FOMO (Fear of Missing Out) bikin cemas dan boros. Nikmati waktu sendiri.',
    action: 'Berani skip ajakan nongkrong kalau lagi capek atau bokek.'
  },
  {
    id: 'l12', title: 'Komunikasi Asertif', category: 'MUST', domain: 'CINTA_SOSIAL',
    desc: 'Menyampaikan keinginan atau ketidaknyamanan tanpa kode-kodean.',
    reason: 'Pasangan/teman bukan pembaca pikiran. Kode hanya memicu salah paham dan drama tidak perlu.',
    action: 'Gunakan I-Statements: "Aku merasa [emosi] saat kamu [tindakan] karena [alasan]."'
  },
  {
    id: 'l13', title: 'Menerima Berubahnya Teman (Outgrowing)', category: 'TOLERATE', domain: 'CINTA_SOSIAL',
    desc: 'Melepaskan pertemanan lama yang sudah tidak satu frekuensi.',
    reason: 'Manusia tumbuh. Memaksa nyambung dengan teman lama karena sekadar masa lalu akan menguras energi.',
    action: 'Tetap sapa jika bertemu, tapi tak usah memaksa harus nongkrong rutin bareng.'
  },
  {
    id: 'l14', title: 'Kenali Attachment Styles', category: 'NEED', domain: 'CINTA_SOSIAL',
    desc: 'Pahami apakah kamu Anxious, Avoidant, atau Secure.',
    reason: 'Ini menghindarkanmu dari menyabotase hubungan lewat sifat posesif ekstrem atau tiba-tiba ghosting.',
    action: 'Latih kesadaran emosional. Pelan-pelan berlatih menjadi lebih tipe "Secure".'
  },
  {
    id: 'l15', title: 'Cinta Bukan Terapi', category: 'AVOID', domain: 'CINTA_SOSIAL',
    desc: 'Mencari pasangan untuk menutupi rasa sepi atau trauma(Codependency).',
    reason: 'Pasangan bukanlah psikologmu. Harapan akan adanya "penyelamat" ujungnya sangat menguras mental berdua.',
    action: 'Fokus berdamai dengan masalah (inner child) sendiri sebelum menjalin komitmen serius.'
  },
  {
    id: 'l16', title: 'Active Listening', category: 'NEED', domain: 'CINTA_SOSIAL',
    desc: 'Mendengar untuk memahami, bukan sekadar antre giliran bicara.',
    reason: 'Terkadang orang curhat tidak butuh solusi darimu, tapi butuh validasi atas emosinya.',
    action: 'Tatap mata mereka, simpan HP, lalu konfirmasi: "Jadi tadi kamu merasa..."'
  },

  // ==========================================
  // 4. KARIR & BISNIS (The Hustle)
  // ==========================================
  {
    id: 'b1', title: 'Skill > Ijazah', category: 'MUST', domain: 'KARIR_BISNIS',
    desc: 'Fokus pada kompetensi nyata, bukan cuma nilai kertas.',
    reason: 'Dunia kerja membayar apa yang bisa kamu lakukan, bukan apa yang kamu hafal.',
    action: 'Pelajari skill High-Income (Coding, Sales, Copywriting, Design).'
  },
  {
    id: 'b2', title: 'Personal Branding', category: 'NEED', domain: 'KARIR_BISNIS',
    desc: 'Membangun reputasi profesional di digital.',
    reason: 'Jejak digital adalah CV abad 21. HRD meng-Google namamu.',
    action: 'Rapikan LinkedIn. Posting tugas/karya kuliah di medsos.'
  },
  {
    id: 'b3', title: 'Magang Sebelum Lulus', category: 'MUST', domain: 'KARIR_BISNIS',
    desc: 'Cari pengalaman kerja riil.',
    reason: 'Validasi skill dan adaptasi budaya kerja. Fresh grad berpengalaman lebih laku.',
    action: 'Cari magang saat libur semester, walau tak dibayar mahal.'
  },
  {
    id: 'b4', title: 'Bisnis Modal Nekat', category: 'AVOID', domain: 'KARIR_BISNIS',
    desc: 'Buka bisnis besar tanpa ilmu/riset (FOMO).',
    reason: 'Resiko kebangkrutan tinggi bisa mengganggu kuliah. Belajar manajemen risiko.',
    action: 'Mulai bisnis kecil-kecilan (reseller/dropship) untuk belajar jualan dulu.'
  },
  {
    id: 'b5', title: 'Etika Profesional (Email/Chat)', category: 'MUST', domain: 'KARIR_BISNIS',
    desc: 'Komunikasi formal yang sopan.',
    reason: 'Attitude adalah pintu gerbang karir. Orang pintar tapi tidak sopan tidak akan dipakai.',
    action: 'Gunakan salam, perkenalan, dan bahasa baku saat hubungi dosen/klien.'
  },
  {
    id: 'b6', title: 'Side Hustle', category: 'TOLERATE', domain: 'KARIR_BISNIS',
    desc: 'Pekerjaan sampingan untuk uang tambahan.',
    reason: 'Melatih kemandirian finansial, TAPI jangan sampai kuliah keteteran.',
    action: 'Freelance, ngajar les, atau jualan pulsa. Prioritas tetap lulus.'
  },
  {
    id: 'b7', title: 'Investasi Leher ke Atas', category: 'NEED', domain: 'KARIR_BISNIS',
    desc: 'Beli buku, kursus, seminar.',
    reason: 'ROI (Return on Investment) terbesar di usia muda adalah otak sendiri.',
    action: 'Budgetkan uang jajan untuk beli e-book atau course Udemy.'
  },
  {
    id: 'b8', title: 'Networking dengan Alumni', category: 'NEED', domain: 'KARIR_BISNIS',
    desc: 'Menjaga hubungan dengan senior yang sudah kerja.',
    reason: 'Informasi lowongan kerja seringkali lewat "Orang Dalam" (rekomendasi).',
    action: 'Sapa senior di LinkedIn. Tanya kabar dan tips karir.'
  },
  {
    id: 'b9', title: 'Leadership Experience', category: 'NEED', domain: 'KARIR_BISNIS',
    desc: 'Jadi pengurus organisasi atau ketua panitia.',
    reason: 'Melatih soft-skill: manajemen manusia, konflik, dan waktu.',
    action: 'Aktif di BEM/Hima, tapi pilih posisi strategis.'
  },
  {
    id: 'b10', title: 'Mentalitas "Problem Solver"', category: 'MUST', domain: 'KARIR_BISNIS',
    desc: 'Jangan cuma lapor masalah, bawa solusi.',
    reason: 'Ini yang membedakan staf biasa dengan calon manajer/pengusaha.',
    action: 'Saat lapor ke dosen/bos: "Ada masalah X, saya usul solusi Y atau Z. Bagaimana menurut Bapak?"'
  },
  {
    id: 'b11', title: 'Jauhi Skema Cepat Kaya (Ponzi)', category: 'AVOID', domain: 'KARIR_BISNIS',
    desc: 'Investasi bodong, judi slot, money game.',
    reason: 'Tidak ada makan siang gratis. Itu akan menghancurkan masa depanmu.',
    action: 'Jika dijanjikan profit besar tanpa kerja/resiko, LARI.'
  },
  {
    id: 'b12', title: 'Negosiasi', category: 'NEED', domain: 'KARIR_BISNIS',
    desc: 'Belajar seni tawar-menawar.',
    reason: 'Berguna untuk gaji, proyek, atau bahkan deadline tugas.',
    action: 'Latihan tawar barang di pasar, atau tawar job freelance.'
  },
  {
    id: 'b13', title: 'Pivot Karir itu Terbuka Lebar', category: 'TOLERATE', domain: 'KARIR_BISNIS',
    desc: 'Kuliah di jurusan A, bekerja di profesi B.',
    reason: 'Dunia berubah cepat. Lulusan sejarah bisa jadi analis data, teknik jadi digital marketer. Ijazah bukan segalanya.',
    action: 'Coba satu atau dua hard skill (Koding / Desain / Riset) di luar mata kuliah wajibmu.'
  },
  {
    id: 'b14', title: 'LinkedIn adalah Portofolio Riil', category: 'NEED', domain: 'KARIR_BISNIS',
    desc: 'Sosial media bukan sekadar mainan.',
    reason: 'Rekruter saat ini memeriksa profil online, bukan sekedar CV PDF usang. Bangun jejak digital profesional.',
    action: 'Posting jurnal proyekmu, kegiatan relawan, dan pencapaian kecil dari mata kuliah terbaikmu.'
  },

  // ==========================================
  // 5. KEUANGAN (Financial Literacy)
  // ==========================================
  {
    id: 'm1', title: 'Dana Darurat', category: 'MUST', domain: 'KEUANGAN',
    desc: 'Uang cadangan untuk musibah.',
    reason: 'Mencegah berhutang saat laptop rusak atau sakit.',
    action: 'Simpan Rp 500rb - 1 Juta di rekening terpisah.'
  },
  {
    id: 'm2', title: 'Catat Pengeluaran (Tracking)', category: 'NEED', domain: 'KEUANGAN',
    desc: 'Tahu kemana setiap rupiah pergi.',
    reason: 'Kesadaran (Awareness) adalah langkah pertama kontrol diri.',
    action: 'Pakai fitur Budget di app ini tiap kali beli sesuatu.'
  },
  {
    id: 'm3', title: 'Hindari Paylater / Pinjol', category: 'AVOID', domain: 'KEUANGAN',
    desc: 'Berhutang untuk konsumtif.',
    reason: 'Bunga berbunga membunuhmu. Merusak skor kredit (SLIK OJK) untuk masa depan.',
    action: 'Uninstall aplikasi pinjol. Beli cash atau menabung dulu.'
  },
  {
    id: 'm4', title: 'Bedakan Butuh vs Ingin', category: 'MUST', domain: 'KEUANGAN',
    desc: 'Frugal Living (Hidup Hemat).',
    reason: 'Gaya hidup mahasiswa harus sesuai kantong mahasiswa. Jangan halu.',
    action: 'Tunda beli barang keinginan selama 7 hari (30-Day Rule).'
  },
  {
    id: 'm5', title: 'Latte Factor', category: 'TOLERATE', domain: 'KEUANGAN',
    desc: 'Jajan kopi/boba mahal.',
    reason: 'Pengeluaran kecil rutin yang jika diakumulasi jadi jutaan.',
    action: 'Kurangi frekuensi. Bawa bekal air minum dari kos.'
  },
  {
    id: 'm6', title: 'Cari Diskon Mahasiswa', category: 'NEED', domain: 'KEUANGAN',
    desc: 'Memanfaatkan status mahasiswa.',
    reason: 'Hemat pangkal kaya. Banyak software/layanan kasih diskon pelajar.',
    action: 'Gunakan email .ac.id untuk lisensi software, Spotify, dll.'
  },
  {
    id: 'm7', title: 'Menabung di Awal', category: 'NEED', domain: 'KEUANGAN',
    desc: 'Sisihkan uang begitu terima kiriman, bukan sisanya.',
    reason: 'Hukum Parkinson: Pengeluaran akan membengkak mengikuti pendapatan.',
    action: 'Auto-debet ke rekening tabungan begitu terima uang.'
  },
  {
    id: 'm8', title: 'Inflasi Gaya Hidup', category: 'AVOID', domain: 'KEUANGAN',
    desc: 'Menaikkan pengeluaran saat pendapatan naik.',
    reason: 'Membuatmu tidak pernah kaya meski penghasilan bertambah.',
    action: 'Jika dapat beasiswa/gaji, tetap hidup sederhana.'
  },
  {
    id: 'm9', title: 'Investasi Bibit (Reksadana)', category: 'TOLERATE', domain: 'KEUANGAN',
    desc: 'Belajar investasi instrumen aman.',
    reason: 'Memahami compound interest sejak dini. Uang bekerja untukmu.',
    action: 'Mulai dari 100rb di Reksadana Pasar Uang.'
  },
  {
    id: 'm10', title: 'Budgeting Rule 50/30/20', category: 'NEED', domain: 'KEUANGAN',
    desc: 'Alokasi bulanan: 50% Kebutuhan, 30% Keinginan, 20% Tabungan/Investasi.',
    reason: 'Mencegah krisis "akhir bulan makan promag" akibat manajemen uang yang buruk.',
    action: 'Pisahkan uang begitu diterima, masukkan ke e-wallet berbeda sesuai porsinya.'
  },
  {
    id: 'm11', title: 'Investasi Leher ke Atas', category: 'MUST', domain: 'KEUANGAN',
    desc: 'Investasi terbaik bukan saham, tapi otak.',
    reason: 'Return of Investment (ROI) dari ikut bootcamp atau beli buku jauh melebihi reksadana mana pun saat usia 20an.',
    action: 'Sisihkan uang untuk beli buku, kelas online bermutu, atau tiket seminar relevan.'
  },

  // ==========================================
  // 6. KESEHATAN (Physical & Mental)
  // ==========================================
  {
    id: 'h1', title: 'Tidur 7-8 Jam', category: 'MUST', domain: 'KESEHATAN',
    desc: 'Tidur berkualitas malam hari.',
    reason: 'Kurang tidur merusak memori, emosi, dan imun. Begadang bikin bodoh.',
    action: 'Set jadwal tidur tetap. Matikan lampu.'
  },
  {
    id: 'h2', title: 'Sarapan Bernutrisi', category: 'NEED', domain: 'KESEHATAN',
    desc: 'Jangan kuliah perut kosong.',
    reason: 'Otak butuh glukosa stabil untuk fokus. Lapar bikin emosi dan lemot.',
    action: 'Minimal makan roti, telur, atau buah. Hindari karbo berlebih (ngantuk).'
  },
  {
    id: 'h3', title: 'Olahraga Rutin', category: 'NEED', domain: 'KESEHATAN',
    desc: 'Gerak badan 3x seminggu.',
    reason: 'Memicu endorfin (anti-stres) dan BDNF (pertumbuhan sel otak).',
    action: 'Jogging, futsal, gym, atau workout kamar.'
  },
  {
    id: 'h4', title: 'Hindari Narkoba & Miras', category: 'AVOID', domain: 'KESEHATAN',
    desc: 'Zat adiktif perusak saraf.',
    reason: 'Kerusakan permanen pada otak dan masa depan. No compromise.',
    action: 'Tolak tegas. Tinggalkan lingkungan pemakai.'
  },
  {
    id: 'h5', title: 'Kebersihan Diri & Kamar', category: 'NEED', domain: 'KESEHATAN',
    desc: 'Mandi teratur, kamar rapi.',
    reason: 'Lingkungan berantakan = Pikiran berantakan. Kebersihan sebagian dari iman.',
    action: 'Rapikan tempat tidur setiap bangun. Mandi 2x sehari.'
  },
  {
    id: 'h6', title: 'Digital Detox', category: 'NEED', domain: 'KESEHATAN',
    desc: 'Puasa layar HP.',
    reason: 'Mengistirahatkan mata dan reseptor dopamin otak.',
    action: 'Jangan pegang HP 1 jam sebelum tidur dan 1 jam setelah bangun.'
  },
  {
    id: 'h7', title: 'Minum Air Putih (2L)', category: 'MUST', domain: 'KESEHATAN',
    desc: 'Hidrasi tubuh.',
    reason: 'Dehidrasi ringan menurunkan fungsi kognitif dan bikin sakit kepala.',
    action: 'Selalu bawa tumbler ke kampus.'
  },
  {
    id: 'h8', title: 'Self-Talk Positif', category: 'NEED', domain: 'KESEHATAN',
    desc: 'Jangan menghina diri sendiri.',
    reason: 'Otak mempercayai apa yang sering kamu katakan. Stop bilang "Aku bodoh".',
    action: 'Ganti "Aku gagal" dengan "Aku sedang belajar".'
  },
  {
    id: 'h9', title: 'Cari Bantuan Profesional', category: 'NEED', domain: 'KESEHATAN',
    desc: 'Ke psikolog jika mental terganggu.',
    reason: 'Sakit mental sama seperti sakit fisik, butuh dokter. Jangan self-diagnose.',
    action: 'Manfaatkan layanan konseling kampus (biasanya gratis).'
  },
  {
    id: 'h10', title: 'Postur Tubuh Tegak', category: 'NEED', domain: 'KESEHATAN',
    desc: 'Jangan bungkuk saat belajar/jalan.',
    reason: 'Postur mempengaruhi hormon (testosteron/kortisol) dan rasa percaya diri.',
    action: 'Tegakkan punggung sekarang.'
  },
  {
    id: 'h11', title: 'Berjemur Sinar Pagi', category: 'NEED', domain: 'KESEHATAN',
    desc: 'Sumber vitamin D alami dan gratis.',
    reason: 'Mahasiswa rentan defisiensi Vitamin D yang bikin cepat lelah dan depresi karena sering di depan layar.',
    action: 'Mandi matahari 15 menit saja jam 7-8 pagi setiap hari.'
  },
  {
    id: 'h12', title: 'Kurangi Gula Cair', category: 'AVOID', domain: 'KESEHATAN',
    desc: 'Es kopi susu gula aren, thai tea, minuman kemasan.',
    reason: 'Lonjakan gula darah drastis bikin tubuh gampang capek (sugar crash) dan resisten insulin (diabetes) di usia muda.',
    action: 'Pilih kopi hitam/less sugar atau yang terbaik: banyakin air putih.'
  },

  // ==========================================
  // 7. AKADEMIK (The Core)
  // ==========================================
  {
    id: 'a1', title: 'Anti Plagiarisme', category: 'MUST', domain: 'AKADEMIK',
    desc: 'Karya asli, bukan copy-paste.',
    reason: 'Integritas akademik adalah harga mati. Ketahuan plagiat = DO/Nilai E.',
    action: 'Selalu cantumkan sumber/sitasi. Paraphrase dengan kalimat sendiri.'
  },
  {
    id: 'a2', title: 'Duduk di Depan', category: 'NEED', domain: 'AKADEMIK',
    desc: 'Posisi duduk menentukan prestasi.',
    reason: 'Lebih fokus, lebih mudah didengar dosen, minim gangguan teman ngobrol.',
    action: 'Datang lebih awal untuk amankan kursi depan.'
  },
  {
    id: 'a3', title: 'Bertanya di Kelas', category: 'NEED', domain: 'AKADEMIK',
    desc: 'Aktif diskusi.',
    reason: 'Meningkatkan pemahaman dan dikenal dosen (nilai plus partisipasi).',
    action: 'Siapkan 1 pertanyaan dari materi yang dibaca semalam.'
  },
  {
    id: 'a4', title: 'Sistem Kebut Semalam (SKS)', category: 'AVOID', domain: 'AKADEMIK',
    desc: 'Belajar H-1 ujian.',
    reason: 'Hanya masuk Short-term memory. Tidak efektif untuk pemahaman jangka panjang.',
    action: 'Cicil belajar (Spaced Repetition) tiap minggu.'
  },
  {
    id: 'a5', title: 'Titip Absen (TA)', category: 'AVOID', domain: 'AKADEMIK',
    desc: 'Memalsukan kehadiran.',
    reason: 'Benih korupsi. Melatih mental tidak bertanggung jawab.',
    action: 'Hadir atau izin jujur jika berhalangan.'
  },
  {
    id: 'a6', title: 'Mencatat Tulis Tangan', category: 'NEED', domain: 'AKADEMIK',
    desc: 'Notetaking manual.',
    reason: 'Menulis tangan mengaktifkan pemrosesan kognitif lebih dalam dibanding mengetik.',
    action: 'Gunakan metode Cornell saat mencatat.'
  },
  {
    id: 'a7', title: 'Kerja Kelompok yang Adil', category: 'MUST', domain: 'AKADEMIK',
    desc: 'Berkontribusi, bukan penumpang gelap (Free Rider).',
    reason: 'Melatih teamwork. Menjadi beban kelompok akan merusak reputasi sosialmu.',
    action: 'Ambil inisiatif bagian tugas. Tepat waktu kumpul.'
  },
  {
    id: 'a8', title: 'Baca Jurnal/Buku Teks', category: 'NEED', domain: 'AKADEMIK',
    desc: 'Jangan cuma andalkan PPT dosen.',
    reason: 'PPT hanya ringkasan. Pemahaman mendalam ada di buku sumber.',
    action: 'Download e-book referensi dan baca 1 bab per minggu.'
  },
  {
    id: 'a9', title: 'Manajemen File Rapih', category: 'NEED', domain: 'AKADEMIK',
    desc: 'Folder struktur di laptop.',
    reason: 'Menghemat waktu mencari tugas lama atau bahan skripsi.',
    action: 'Buat folder per semester -> per matkul. Backup ke Cloud (GDrive).'
  },
  {
    id: 'a10', title: 'Skripsi Dicicil', category: 'MUST', domain: 'AKADEMIK',
    desc: 'Jangan nunggu semester akhir.',
    reason: 'Skripsi yang baik adalah skripsi yang selesai.',
    action: 'Cari topik sejak semester 5. Simpan artikel relevan.'
  },
  {
    id: 'a11', title: 'Bahasa Inggris (TOEFL/IELTS)', category: 'MUST', domain: 'AKADEMIK',
    desc: 'Kuasai bahasa global.',
    reason: 'Kunci akses beasiswa S2 dan literatur internasional.',
    action: 'Latihan Duolingo tiap hari. Nonton film tanpa subtitle Indo.'
  },
  {
    id: 'a12', title: 'Ikut Lomba/Kompetisi', category: 'NEED', domain: 'AKADEMIK',
    desc: 'PKM, Debat, Essay, Hackathon.',
    reason: 'Menambah portofolio dan SKPI (Surat Keterangan Pendamping Ijazah).',
    action: 'Targetkan ikut minimal 1 lomba per tahun.'
  },
  {
    id: 'a13', title: 'Konsultasi Dosen Wali', category: 'NEED', domain: 'AKADEMIK',
    desc: 'Diskusi rencana studi (KRS).',
    reason: 'Dosen wali bisa memberi roadmap yang kamu tidak tahu.',
    action: 'Temui dosen wali minimal sekali per semester.'
  },
  {
    id: 'a14', title: 'Growth Mindset', category: 'MUST', domain: 'AKADEMIK',
    desc: 'Percaya kecerdasan bisa berkembang.',
    reason: 'Otak itu plastis. Nilai jelek bukan karena "bego", tapi strategi salah.',
    action: 'Ubah "Aku gak bisa" jadi "Aku belum bisa".'
  },
  {
    id: 'a15', title: 'Manajemen Skripsi (Selesai > Sempurna)', category: 'MUST', domain: 'AKADEMIK',
    desc: 'Jangan mengejar kesempurnaan teori sampai lupa tenggat waktu.',
    reason: 'Banyak mahasiswa tingkat akhir gagal sarjana karena mengejar validasi pembimbing dengan perfeksionisme berlebih.',
    action: 'Kerjakan bab demi bab, biarkan jelek dulu baru direvisi. Draf pertama selalu sampah, the magic is in revision.'
  },
  {
    id: 'a16', title: 'Hargai Pustakawan', category: 'TOLERATE', domain: 'AKADEMIK',
    desc: 'Perpustakaan adalah tempat dengan ROI tinggi.',
    reason: 'Lingkungan fokus tinggi yang memaksimalkan productivity, gratis ber-AC, dan minimize distraksi.',
    action: 'Bila suntuk/susah fokus di kosan, langsung bergerak ke perpustakaan kampus minimal 2 jam.'
  }
];

export const LifeCompass: React.FC = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeDomain, setActiveDomain] = useState<Domain | 'ALL' | 'FOCUS'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  useEffect(() => {
    const savedPins = StorageService.getItem<string[]>('life_compass_pins', []);
    setPinnedIds(savedPins);
  }, []);

  const togglePin = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let newPins;
    if (pinnedIds.includes(id)) {
      newPins = pinnedIds.filter(p => p !== id);
    } else {
      newPins = [...pinnedIds, id];
    }
    setPinnedIds(newPins);
    StorageService.setItem('life_compass_pins', newPins);
  };

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const getDomainIcon = (domain: Domain) => {
    switch(domain) {
      case 'AKADEMIK': return <BookOpen size={16} />;
      case 'SPIRITUAL': return <Zap size={16} />;
      case 'KARIR_BISNIS': return <Briefcase size={16} />;
      case 'CINTA_SOSIAL': return <Heart size={16} />;
      case 'KEUANGAN': return <DollarSign size={16} />;
      case 'KELUARGA': return <Home size={16} />;
      case 'KESEHATAN': return <Smile size={16} />;
      default: return <Map size={16} />;
    }
  };

  // Filter Logic
  const filteredPrinciples = useMemo(() => {
    return PRINCIPLES_DB.filter(p => {
      if (activeDomain === 'FOCUS') {
        return pinnedIds.includes(p.id);
      }
      const matchesDomain = activeDomain === 'ALL' || p.domain === activeDomain;
      const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            p.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.action.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDomain && matchesSearch;
    });
  }, [activeDomain, searchTerm, pinnedIds]);

  const renderSection = (title: string, category: Category, icon: React.ReactNode, colorClass: string, bgClass: string, badgeColor: string) => {
    const items = filteredPrinciples.filter(p => p.category === category);

    if (items.length === 0) return null;

    return (
      <div className={`rounded-2xl border overflow-hidden ${colorClass} ${bgClass} mb-6 transition-all duration-300`}>
        <div className={`p-4 border-b ${colorClass} bg-opacity-20 flex items-center gap-3`}>
          {icon}
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <span className="ml-auto text-xs font-bold opacity-70 bg-black/20 px-2 py-1 rounded-full">{items.length} Item</span>
        </div>
        <div className="p-4 grid gap-4">
          {items.map(item => {
            const isPinned = pinnedIds.includes(item.id);
            return (
              <div 
                key={item.id} 
                onClick={() => toggleExpand(item.id)}
                className={`bg-slate-900/40 border border-white/10 rounded-xl p-4 cursor-pointer hover:bg-slate-900/60 transition-all group relative ${isPinned ? 'ring-1 ring-yellow-500/50 bg-yellow-900/10' : ''}`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${badgeColor} bg-opacity-10 border border-white/5`}>
                        {getDomainIcon(item.domain)}
                        {item.domain.replace('_', ' ')}
                      </span>
                      {isPinned && <span className="text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"><Pin size={10} fill="currentColor"/> Fokus</span>}
                    </div>
                    <h4 className="font-bold text-slate-100 text-lg mb-1 group-hover:text-primary transition-colors">{item.title}</h4>
                    <p className="text-sm text-slate-400 leading-snug pr-8">{item.desc}</p>
                  </div>
                  <div className="flex flex-col gap-2 items-center">
                     <button 
                       onClick={(e) => togglePin(item.id, e)} 
                       className={`p-1.5 rounded-full transition-all ${isPinned ? 'text-yellow-400 hover:bg-yellow-500/20' : 'text-slate-600 hover:text-slate-300 hover:bg-slate-800'}`}
                       title={isPinned ? "Lepas Pin" : "Pin ke Fokus"}
                     >
                        <Pin size={16} fill={isPinned ? "currentColor" : "none"} />
                     </button>
                     {expandedId === item.id ? <ChevronUp size={20} className="text-slate-500"/> : <ChevronDown size={20} className="text-slate-500"/>}
                  </div>
                </div>

                {expandedId === item.id && (
                  <div className="mt-4 pt-4 border-t border-white/10 animate-slide-in">
                    <div className="flex gap-3 mb-3">
                      <Info size={18} className="text-blue-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-1">Why (Alasan Logis/Sains):</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{item.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <CheckCircle2 size={18} className="text-green-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1">Action (Bimbingan):</p>
                        <p className="text-slate-300 text-sm leading-relaxed">{item.action}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const domains: {id: Domain | 'ALL' | 'FOCUS', label: string, icon?: any}[] = [
    {id: 'FOCUS', label: 'Fokus Saya', icon: <Pin size={12}/>},
    {id: 'ALL', label: 'Semua'},
    {id: 'SPIRITUAL', label: 'Agama & Spiritual'},
    {id: 'KELUARGA', label: 'Keluarga'},
    {id: 'AKADEMIK', label: 'Akademik'},
    {id: 'KARIR_BISNIS', label: 'Karir & Bisnis'},
    {id: 'CINTA_SOSIAL', label: 'Cinta & Sosial'},
    {id: 'KEUANGAN', label: 'Keuangan'},
    {id: 'KESEHATAN', label: 'Kesehatan'},
  ];

  return (
    <div className="animate-fade-in max-w-5xl mx-auto pb-10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold text-white flex items-center justify-center gap-3 mb-2">
          <Map className="text-primary" size={32} /> 
          Kompas Hidup 360°
        </h2>
        <p className="text-slate-400 max-w-2xl mx-auto">
          Pedoman nilai komprehensif untuk navigasi kehidupan mahasiswa: dari akademik, cinta, bisnis, hingga spiritual.
        </p>
        
        {/* Search Bar */}
        <div className="max-w-md mx-auto mt-6 relative">
           <input 
             type="text" 
             placeholder="Cari pedoman (misal: pacar, uang, shalat)..." 
             className="w-full bg-slate-800 border border-slate-700 text-white rounded-full px-5 py-3 pl-12 focus:outline-none focus:border-primary transition-all"
             value={searchTerm}
             onChange={(e) => setSearchTerm(e.target.value)}
           />
           <Star className="absolute left-4 top-3.5 text-slate-500" size={18} />
        </div>
      </div>

      {/* Domain Filters */}
      <div className="flex flex-wrap justify-center gap-2 mb-8 sticky top-0 bg-dark/95 py-4 z-20 -mx-4 px-4 md:mx-0 md:px-0">
        {domains.map(dom => (
          <button
            key={dom.id}
            onClick={() => setActiveDomain(dom.id)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-2 ${
              activeDomain === dom.id
              ? dom.id === 'FOCUS' ? 'bg-yellow-500 text-black border-yellow-500' : 'bg-primary text-white border-primary shadow-lg shadow-primary/30'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-white'
            }`}
          >
            {dom.icon} {dom.label}
          </button>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {renderSection(
          "HARUS DILAKUKAN (Wajib/Non-Negotiable)", 
          'MUST', 
          <ShieldAlert size={24} className="text-blue-400" />,
          "border-blue-500/30",
          "bg-blue-500/5",
          "text-blue-400"
        )}

        {renderSection(
          "ZONA BAHAYA (Tinggalkan!)", 
          'AVOID', 
          <AlertTriangle size={24} className="text-red-400" />,
          "border-red-500/30",
          "bg-red-500/5",
          "text-red-400"
        )}

        {renderSection(
          "PERLU UNTUK TUMBUH (Growth)", 
          'NEED', 
          <Zap size={24} className="text-green-400" />,
          "border-green-500/30",
          "bg-green-500/5",
          "text-green-400"
        )}

        {renderSection(
          "BATAS TOLERANSI (Grey Area)", 
          'TOLERATE', 
          <CheckCircle2 size={24} className="text-yellow-400" />,
          "border-yellow-500/30",
          "bg-yellow-500/5",
          "text-yellow-400"
        )}
      </div>

      {filteredPrinciples.length === 0 && (
         <div className="text-center py-20 text-slate-500 border-2 border-dashed border-slate-800 rounded-2xl">
           <Sparkles className="mx-auto mb-4 opacity-50" size={48} />
           <p className="text-lg">Tidak ada pedoman yang ditampilkan.</p>
           {activeDomain === 'FOCUS' ? (
             <p className="text-sm mt-2">Tekan ikon <Pin size={12} className="inline"/> pada prinsip di tab lain untuk menambahkannya ke sini.</p>
           ) : (
             <p className="text-sm mt-2">Coba kata kunci pencarian lain.</p>
           )}
         </div>
      )}
    </div>
  );
};
