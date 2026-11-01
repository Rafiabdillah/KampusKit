export interface MotivationItem {
  id: string;
  text: string;
  source: string;
  type: 'SCIENCE' | 'AHLULBAYT' | 'BUSINESS' | 'PSYCHOLOGY' | 'STOICISM' | 'TOUGH_LOVE';
  context: string;
  scientificPrinciple: string;
  actionStep: string;
  timeOfDay: 'MORNING' | 'MIDDAY' | 'EVENING' | 'NIGHT' | 'ANY';
  tags: string[];
}

export const MOTIVATION_DATABASE: MotivationItem[] = [
  // =========================================================================
  // 1. NEUROSCIENCE & BRAIN BIOLOGY (Ilmu Saraf, Dopamin, Sirkadian & Kognitif)
  // =========================================================================
  {
    id: 'ns1',
    text: "Neurons that fire together, wire together. Otakmu merombak sirkuit fisiknya sesuai apa yang sering kamu lakukan.",
    source: "Donald Hebb (Hebb's Law of Neuroplasticity)",
    type: 'SCIENCE',
    context: "Setiap kali kamu memaksakan diri belajar 15 menit saat malas, kamu sedang menebalkan selubung mielin jalur disiplin di otak.",
    scientificPrinciple: "Neuroplastisitas & Mielinisasi",
    actionStep: "Lakukan 1 review materi selama 3 menit sekarang untuk memperkuat sinapsis memori.",
    timeOfDay: 'ANY',
    tags: ['Neuroplastisitas', 'Fokus', 'Pembelajaran']
  },
  {
    id: 'ns2',
    text: "Dopamin bukan molekul kenikmatan, melainkan molekul dorongan dan antisipasi pencapaian.",
    source: "Dr. Andrew Huberman (Neurobiologist, Stanford)",
    type: 'SCIENCE',
    context: "Jangan tunggu motivasi datang. Begitu kamu memulai langkah pertama sekecil apapun, dopamin akan melonjak dan memicu momentum lanjutan.",
    scientificPrinciple: "Dopamine-Driven Action Loop",
    actionStep: "Pecah tugasmu jadi mikro-langkah berdurasi 2 menit agar otak tidak menolak.",
    timeOfDay: 'MORNING',
    tags: ['Dopamin', 'Memulai', 'Prokrastinasi']
  },
  {
    id: 'ns3',
    text: "Tidur malam yang cukup adalah proses pembersihan racun adenosin dan konsolidasi memori jangka panjang ke Neocortex.",
    source: "Matthew Walker, Ph.D. (Why We Sleep)",
    type: 'SCIENCE',
    context: "Belajar 4 jam + tidur 7 jam mengalahkan belajar 11 jam tanpa tidur. Otak menyusun pemahaman saat fase Deep Sleep & REM.",
    scientificPrinciple: "Sistem Glimfatik & Konsolidasi Memori",
    actionStep: "Jadwalkan tidur minimal 7 jam malam ini dan matikan layar biru 30 menit sebelum tidur.",
    timeOfDay: 'NIGHT',
    tags: ['Tidur', 'Kesehatan Otak', 'Memori']
  },
  {
    id: 'ns4',
    text: "Otak manusia tidak bisa multitasking kognitif. Multitasking hanyalah 'Task-Switching' cepat yang menguras cadangan glukosa Prefrontal Cortex.",
    source: "Dr. Earl Miller (Neuroscientist, MIT)",
    type: 'SCIENCE',
    context: "Buka tab kuliah sambil scrolling media sosial membuat efisiensi belajar anjlok hingga 50% dan meningkatkan kelelahan mental.",
    scientificPrinciple: "Attention Residue & Cognitive Load Theory",
    actionStep: "Tutup semua tab kecuali 1 dokumen utama yang harus kamu kerjakan sekarang.",
    timeOfDay: 'MIDDAY',
    tags: ['Single-Tasking', 'Deep Work', 'Fokus']
  },
  {
    id: 'ns5',
    text: "Latihan fisik memicu pelepasan BDNF (Brain-Derived Neurotrophic Factor), 'pupuk' pembentuk neuron baru di Hippocampus.",
    source: "Dr. John Ratey (Harvard Medical School)",
    type: 'SCIENCE',
    context: "Merasa buntu atau otak nge-lag? Jalan kaki cepat 10-15 menit atau regangkan tubuh untuk membanjiri otak dengan oksigen dan BDNF segar.",
    scientificPrinciple: "BDNF & Neurogenesis Hippocampus",
    actionStep: "Berdiri, lakukan peregangan atau jalan kaki 5 menit untuk menyegarkan aliran darah ke otak.",
    timeOfDay: 'MIDDAY',
    tags: ['Olahraga', 'BDNF', 'Kebugaran Otak']
  },
  {
    id: 'ns6',
    text: "Siklus Ultradian membatasi fokus puncak manusia maksimal 90 menit sebelum gelombang otak membutuhkan pemulihan.",
    source: "Chronobiology Research",
    type: 'SCIENCE',
    context: "Bekerja non-stop tanpa jeda menghasilkan titik jenuh (diminishing return). Belajarlah 60-90 menit, lalu istirahat berkualitas 10 menit.",
    scientificPrinciple: "Ultradian Rhythm & Brain Waves",
    actionStep: "Gunakan timer Pomodoro atau 90 menit deep work lalu berikan jeda santai.",
    timeOfDay: 'MIDDAY',
    tags: ['Sirkadian', 'Manajemen Energi', 'Fokus']
  },
  {
    id: 'ns7',
    text: "Paparan sinar matahari pagi (Lux tinggi) dalam 30-60 menit setelah bangun mengatur ritme sirkadian dan memicu pelepasan hormon kortisol sehat.",
    source: "Circadian Neurobiology",
    type: 'SCIENCE',
    context: "Sinar matahari pagi membakar kantuk, meningkatkan mood, dan menyiapkan produksi melatonin alami untuk tidur nyenyak nanti malam.",
    scientificPrinciple: "Suprachiasmatic Nucleus (SCN) Activation",
    actionStep: "Keluar ruangan selama 5-10 menit, tatap langit pagi (tanpa menatap matahari langsung).",
    timeOfDay: 'MORNING',
    tags: ['Sinar Matahari', 'Ritme Sirkadian', 'Energi Pagi']
  },
  {
    id: 'ns8',
    text: "Active Recall dan Spaced Repetition merangsang jalur sinapsis lebih kuat 300% dibanding membaca pasif berkali-kali.",
    source: "Karpicke & Roediger Cognitive Studies",
    type: 'SCIENCE',
    context: "Tutup bukumu dan jelaskan kembali konsep materi dengan katamu sendiri (Teknik Feynman). Kesulitan mengingat justru pertanda otak sedang belajar.",
    scientificPrinciple: "Retrieval Practice & Synaptic Strengthening",
    actionStep: "Tutup catatan dan tuliskan 3 poin utama yang baru saja kamu pelajari dari ingatan.",
    timeOfDay: 'EVENING',
    tags: ['Active Recall', 'Teknik Belajar', 'Retensi']
  },

  // =========================================================================
  // 2. SPIRITUAL & ISLAMIC / AHLULBAYT WISDOM (Hikmah, Keikhlasan & Spiritualitas)
  // =========================================================================
  {
    id: 'ab1',
    text: "Hilang sudah kesempatan itu bagaikan hilangnya awan yang berlalu. Maka manfaatkanlah kesempatan-kesempatan baik selagi ada.",
    source: "Imam Ali bin Abi Thalib (as) — Nahjul Balaghah",
    type: 'AHLULBAYT',
    context: "Masa kuliah dan masa muda adalah masa emas yang tak akan pernah terulang. Gunakan setiap hari untuk memperkaya ilmu dan keahlian.",
    scientificPrinciple: "Hukum Kelangkaan Waktu & Opportunity Cost",
    actionStep: "Identifikasi 1 peluang berharga hari ini yang belum kamu ambil, lalu eksekusi sekarang.",
    timeOfDay: 'MORNING',
    tags: ['Waktu', 'Peluang', 'Disiplin']
  },
  {
    id: 'ab2',
    text: "Ilmu adalah kunci, dan pembukanya adalah bertanya dengan kerendahan hati dan ketajaman akal.",
    source: "Imam Ja'far Ash-Shadiq (as)",
    type: 'AHLULBAYT',
    context: "Jangan malu bertanya di kelas atau kepada teman ahli. Rasa malu bertanya adalah penghalang terbesar dalam menuntut ilmu.",
    scientificPrinciple: "Inquiry-Based Learning & Epistemic Humility",
    actionStep: "Catat 1 pertanyaan kritis tentang materi kuliah hari ini untuk ditanyakan ke dosen atau teman.",
    timeOfDay: 'MIDDAY',
    tags: ['Ilmu', 'Kritis', 'Tanya']
  },
  {
    id: 'ab3',
    text: "Nilai dan derajat seseorang berbanding lurus dengan kadar tekad (himmah) dan cita-citanya.",
    source: "Imam Ali bin Abi Thalib (as)",
    type: 'AHLULBAYT',
    context: "Bukan bakat bawaan semata yang menentukan masa depanmu, melainkan seberapa tinggi tekadmu untuk terus bangkit saat terjatuh.",
    scientificPrinciple: "Grit, Self-Efficacy & Growth Drive",
    actionStep: "Tuliskan kembali visi besarmu 3 tahun ke depan untuk menguatkan tekad hari ini.",
    timeOfDay: 'MORNING',
    tags: ['Tekad', 'Visi', 'Himmah']
  },
  {
    id: 'ab4',
    text: "Ikatlah ilmu pengetahuan dengan menuliskannya.",
    source: "Imam Ali bin Abi Thalib (as) / Hadits Nabawi",
    type: 'AHLULBAYT',
    context: "Pikiran manusia mudah lupa. Menuliskan catatan, riset, atau ide adalah cara terbaik melestarikan pemahaman dan melatih kejelasan berpikir.",
    scientificPrinciple: "External Memory Encoding & Haptic Retention",
    actionStep: "Buka tab Notes di KampusKit dan rangkum 1 insight penting hari ini.",
    timeOfDay: 'EVENING',
    tags: ['Menulis', 'Mencatat', 'Ilmu']
  },
  {
    id: 'ab5',
    text: "Kesabaran bagi keimanan dan keberhasilan laksana kepala bagi tubuh. Tiada tubuh tanpa kepala, tiada keberhasilan tanpa kesabaran.",
    source: "Imam Ali bin Abi Thalib (as)",
    type: 'AHLULBAYT',
    context: "Menyelesaikan skripsi, menguasai keahlian coding/desain, dan membangun karir butuh kesabaran maraton. Bersabarlah dalam proses.",
    scientificPrinciple: "Delayed Gratification & Emotional Regulation",
    actionStep: "Tenangkan diri saat proses terasa lambat. Konsistensi kecil hari ini bernilai besar.",
    timeOfDay: 'EVENING',
    tags: ['Sabar', 'Ketekunan', 'Karakter']
  },
  {
    id: 'ab6',
    text: "Tidak ada kekayaan yang melebihi akal sehat, dan tidak ada kemiskinan yang menyamai kebodohan.",
    source: "Imam Ali bin Abi Thalib (as)",
    type: 'AHLULBAYT',
    context: "Investasi pada buku, keterampilan, dan ilmu adalah aset tak ternilai yang tidak bisa dicuri orang dan akan melindungimu seumur hidup.",
    scientificPrinciple: "Human Capital Compounding",
    actionStep: "Alokasikan 20 menit membaca buku berkualitas atau materi pengayaan hari ini.",
    timeOfDay: 'NIGHT',
    tags: ['Investasi Leher ke Atas', 'Akal', 'Literasi']
  },
  {
    id: 'ab7',
    text: "Barangsiapa yang harinya sama dengan kemarin maka ia merugi, barangsiapa yang harinya lebih buruk maka ia celaka.",
    source: "Hikmah Islami / Hadits",
    type: 'AHLULBAYT',
    context: "Pastikan hari ini kamu 1% lebih paham, 1% lebih rajin, atau 1% lebih bijak dibanding kemarin. Compounding kebaikan setiap hari.",
    scientificPrinciple: "Continuous Incremental Improvement (Kaizen)",
    actionStep: "Selesaikan setidaknya 1 tugas atau hal positif hari ini sebelum tidur.",
    timeOfDay: 'NIGHT',
    tags: ['Peningkatan Diri', 'Evaluasi', 'Syukur']
  },
  {
    id: 'ab8',
    text: "Ketenangan hati dan pikiran adalah separuh dari keberhasilan.",
    source: "Imam Ja'far Ash-Shadiq (as)",
    type: 'AHLULBAYT',
    context: "Ketika panik menghadapi ujian atau deadline, otak limbik memblokir prefrontal cortex. Ambil wudhu/tarik napas dalam, tenanglah.",
    scientificPrinciple: "Parasympathetic Nervous System Activation",
    actionStep: "Lakukan pernapasan tenang 1 menit dan serahkan hasil akhir kepada Yang Maha Kuasa.",
    timeOfDay: 'MIDDAY',
    tags: ['Ketenangan', 'Tawakkal', 'Anti-Panik']
  },

  // =========================================================================
  // 3. BUSINESS, STRATEGY & HIGH PERFORMANCE (Bisnis, Karir & Eksekusi)
  // =========================================================================
  {
    id: 'biz1',
    text: "Prinsip Pareto (80/20): 80% dari hasilmu ditentukan oleh 20% tindakan kunci yang paling bernilai tinggi.",
    source: "Vilfredo Pareto & Richard Koch",
    type: 'BUSINESS',
    context: "Jangan sibuk dengan 80% hal remeh (memilih font, merapikan meja berkali-kali). Identifikasi 20% tugas inti yang berdampak besar.",
    scientificPrinciple: "Power Law Distribution & High-Leverage Activities",
    actionStep: "Pilih 1 tugas paling penting (The ONE Thing) hari ini dan tuntaskan terlebih dahulu.",
    timeOfDay: 'MORNING',
    tags: ['Pareto 80/20', 'Prioritas', 'Efisiensi']
  },
  {
    id: 'biz2',
    text: "Selesai jauh lebih berharga daripada sempurna yang tak pernah dirilis (Done is better than perfect).",
    source: "Sheryl Sandberg / Reid Hoffman",
    type: 'BUSINESS',
    context: "Perfeksionisme seringkali hanyalah kedok ketakutan akan kritik. Buat draft kasarmu, luncurkan, lalu iterasi berdasarkan umpan balik.",
    scientificPrinciple: "Iterative Feedback Loop & Minimum Viable Output",
    actionStep: "Tuliskan draft pertama tugasmu tanpa mengedit atau menghakimi sendiri.",
    timeOfDay: 'MIDDAY',
    tags: ['Perfeksionisme', 'Eksekusi', 'Rilis']
  },
  {
    id: 'biz3',
    text: "Jika kamu tidak merancang rencana hidupmu sendiri, kemungkinan besar kamu akan jatuh ke dalam rencana orang lain.",
    source: "Jim Rohn",
    type: 'BUSINESS',
    context: "Mahasiswa unggul tidak sekadar mengikuti arus jadwal kampus. Mereka membangun portofolio, jejaring, dan keahlian spesifik sejak dini.",
    scientificPrinciple: "Strategic Intent & Proactive Career Design",
    actionStep: "Buka tab Proyek & Portofolio dan rencanakan 1 proyek nyata yang bisa dipajang di CV.",
    timeOfDay: 'EVENING',
    tags: ['Karir', 'Portofolio', 'Visi']
  },
  {
    id: 'biz4',
    text: "Kunci keberhasilan compounding bukan pada besarnya angka awal, melainkan pada ketahanan untuk tidak menghentikan prosesnya.",
    source: "Charlie Munger & Warren Buffett",
    type: 'BUSINESS',
    context: "Konsisten belajar 45 menit setiap hari selama 3 tahun menghasilkan keahlian level ahli dunia (10.000 jam compound). Jangan putus momentum.",
    scientificPrinciple: "Compounding Growth Curve & Long-Term Horizon",
    actionStep: "Pertahankan streak belajarmu hari ini walau hanya 20 menit.",
    timeOfDay: 'EVENING',
    tags: ['Compounding', 'Konsistensi', 'Disiplin']
  },
  {
    id: 'biz5',
    text: "Carilah keahlian spesifik (Specific Knowledge) yang tidak bisa diajarkan dalam sekolah standar dan tidak mudah digantikan orang lain.",
    source: "Naval Ravikant (Silicon Valley Thinker)",
    type: 'BUSINESS',
    context: "Kombinasikan jurusan kuliahmu dengan keahlian unik (mis: Teknik Mesin + AI Prompting + Kemampuan Public Speaking). Unik = Bernilai Tinggi.",
    scientificPrinciple: "Talent Stacking & Competitive Moat",
    actionStep: "Eksplorasi 1 teknologi atau skill baru di luar kurikulum wajibmu.",
    timeOfDay: 'ANY',
    tags: ['Specific Knowledge', 'Diferensiasi', 'Karir']
  },
  {
    id: 'biz6',
    text: "Reputasi dan integritas membutuhkan waktu bertahun-tahun untuk dibangun, namun dapat hancur hanya dalam lima menit kecerobohan.",
    source: "Warren Buffett",
    type: 'BUSINESS',
    context: "Jadilah mahasiswa yang tepat waktu, menepati janji tugas kelompok, dan jujur secara akademik. Integritas adalah aset terbesar karirmu.",
    scientificPrinciple: "Social Capital & Game Theory (Tit-for-Tat Trust)",
    actionStep: "Kirim tugasmu sebelum deadline dan tepati komitmen timmu.",
    timeOfDay: 'MIDDAY',
    tags: ['Integritas', 'Reputasi', 'Profesional']
  },

  // =========================================================================
  // 4. STOICISM & ANCIENT PHILOSOPHY (Ketahanan Mental & Dikotomi Kendali)
  // =========================================================================
  {
    id: 'st1',
    text: "Kita menderita lebih sering dalam imajinasi dan kekhawatiran kita daripada dalam kenyataan yang sesungguhnya.",
    source: "Seneca (Letters from a Stoic)",
    type: 'STOICISM',
    context: "Ketakutanmu akan sidang, nilai ujian, atau penolakan magang biasanya 10x lipat lebih mengerikan di kepalamu daripada aslinya.",
    scientificPrinciple: "Catastrophizing Bias & Cognitive Reappraisal",
    actionStep: "Tanyakan pada diri: 'Apa skenario terburuk yang realistis, dan bagaimana aku mengatasinya?'",
    timeOfDay: 'MORNING',
    tags: ['Overthinking', 'Kecemasan', 'Stoikisme']
  },
  {
    id: 'st2',
    text: "Sebagian hal berada dalam kendali kita (pikiran, usaha, respon), dan sebagian besar lainnya di luar kendali kita (hasil, perilaku orang lain, cuaca).",
    source: "Epictetus (Enchiridion)",
    type: 'STOICISM',
    context: "Kamu tidak bisa mengendalikan soal ujian yang dibuat dosen, tapi kamu memegang kendali 100% atas persiapan belajarmu hari ini.",
    scientificPrinciple: "Locus of Control & Stress Resilience",
    actionStep: "Lepaskan beban memikirkan apa yang di luar kendalimu. Fokuskan energimu pada aksi saat ini.",
    timeOfDay: 'MIDDAY',
    tags: ['Dikotomi Kendali', 'Fokus', 'Bebas Stres']
  },
  {
    id: 'st3',
    text: "Rintangan yang menghadang di depan jalan justru menjadi jalan itu sendiri (The Obstacle is The Way).",
    source: "Marcus Aurelius (Meditations)",
    type: 'STOICISM',
    context: "Dosen yang banyak memberi revisi adalah jalan untuk membuat skripsimu berbobot. Materi yang sulit adalah jalan untuk menaikkan kapasitas otakmu.",
    scientificPrinciple: "Antifragility & Post-Traumatic Growth",
    actionStep: "Ubah mindset: 'Ini bukan masalah yang merugikanku, ini latihan mental untuk memperkuat diriku.'",
    timeOfDay: 'EVENING',
    tags: ['Antifragile', 'Tantangan', 'Mental Baja']
  },
  {
    id: 'st4',
    text: "Amor Fati: Jangan hanya sekadar menoleransi kenyataan, cintailah setiap takdir dan kejadian yang menimpamu.",
    source: "Stoic Philosophy & Nietzsche",
    type: 'STOICISM',
    context: "Laptop bermasalah atau listrik padam? Cintai tantangannya, cari solusi alternatif, dan jangan buang energi dengan meratap.",
    scientificPrinciple: "Radical Acceptance & Emotional Equanimity",
    actionStep: "Tersenyumlah pada rintangan kecil hari ini dan cari solusi praktisnya.",
    timeOfDay: 'ANY',
    tags: ['Amor Fati', 'Penerimaan', 'Kekuatan']
  },
  {
    id: 'st5',
    text: "Memento Mori: Ingatlah bahwa waktumu di bumi ini terbatas dan berharga.",
    source: "Marcus Aurelius",
    type: 'STOICISM',
    context: "Hidup ini terlalu singkat untuk dihabiskan dengan rasa malas, scrolling medsos tanpa tujuan, atau memperdebatkan hal-hal sepele.",
    scientificPrinciple: "Mortality Salience & Purpose Alignment",
    actionStep: "Matikan distraction selama 45 menit dan kerjakan hal yang benar-benar bermakna.",
    timeOfDay: 'MORNING',
    tags: ['Memento Mori', 'Urgensi', 'Makna Hidup']
  },

  // =========================================================================
  // 5. PSYCHOLOGY & MINDSET (Psikologi Kognitif, Grit & Flow State)
  // =========================================================================
  {
    id: 'psy1',
    text: "Growth Mindset: Kata 'Belum Bisa' jauh lebih kuat dan ilmiah daripada kata 'Tidak Bisa'.",
    source: "Dr. Carol Dweck (Stanford University)",
    type: 'PSYCHOLOGY',
    context: "Kecerdasan bukanlah bakat mati yang kaku. Otakmu berkembang setiap kali kamu berjuang memecahkan soal matematika atau konsep rumit.",
    scientificPrinciple: "Growth Mindset & Incremental Intelligence Theory",
    actionStep: "Ganti kalimat 'Aku gak bakat di matkul ini' menjadi 'Aku belum menemukan cara belajar yang tepat untuk topik ini.'",
    timeOfDay: 'MORNING',
    tags: ['Growth Mindset', 'Percaya Diri', 'Potensi']
  },
  {
    id: 'psy2',
    text: "Grit (Ketabahan dan ketekunan jangka panjang) adalah prediktor kesuksesan yang jauh lebih akurat dibanding skor IQ bawaan.",
    source: "Dr. Angela Duckworth (University of Pennsylvania)",
    type: 'PSYCHOLOGY',
    context: "Banyak orang cerdas gagal karena mudah menyerah saat bosan. Mahasiswa yang konsisten menyelesaikan apa yang dimulai akan selalu menang.",
    scientificPrinciple: "Grit Scale & Long-Term Goal Persistence",
    actionStep: "Tetap duduk dan selesaikan 1 sesi fokus walaupun rasa bosan mulai menyerang.",
    timeOfDay: 'MIDDAY',
    tags: ['Grit', 'Ketekunan', 'Juara']
  },
  {
    id: 'psy3',
    text: "Flow State terjadi ketika tingkat tantangan (Challenge) berada sedikit di atas tingkat keterampilanmu (Skill).",
    source: "Mihaly Csikszentmihalyi",
    type: 'PSYCHOLOGY',
    context: "Jika kamu merasa bosan, naikkan target kecepatan belajarmu. Jika kamu merasa cemas, pecah materi jadi bagian yang lebih mudah dipahami.",
    scientificPrinciple: "Flow Channel & Optimal Arousal Zone",
    actionStep: "Sesuaikan tingkat kesulitan tugasmu agar otak masuk ke zona hanyut belajar (Flow).",
    timeOfDay: 'MIDDAY',
    tags: ['Flow State', 'Konsentrasi', 'Produktivitas']
  },
  {
    id: 'psy4',
    text: "Efek Zeigarnik: Otak manusia secara alami akan terus gelisah dan mengingat tugas yang sudah DIMULAI namun belum selesai.",
    source: "Bluma Zeigarnik (Cognitive Psychologist)",
    type: 'PSYCHOLOGY',
    context: "Kunci mengalahkan prokrastinasi adalah 'Aturan 5 Menit'. Cukup paksa diri mulai 5 menit pertama, otakmu akan termotivasi menyelesaikannya.",
    scientificPrinciple: "Zeigarnik Tension & Task Completion Bias",
    actionStep: "Buka file tugasmu dan ketik 1 paragraf selama 5 menit sekarang juga.",
    timeOfDay: 'ANY',
    tags: ['Zeigarnik Effect', 'Aturan 5 Menit', 'Mulai']
  },
  {
    id: 'psy5',
    text: "Seseorang yang memiliki 'Alasan Kenapa' yang kuat untuk hidup, akan mampu menanggung hampir segala 'Bagaimana'.",
    source: "Viktor Frankl (Man's Search for Meaning)",
    type: 'PSYCHOLOGY',
    context: "Ingat kembali untuk siapa kamu berjuang: orang tuamu, masa depan keluargamu, atau impian luhurmu. Niat yang dalam mengalahkan rasa lelah.",
    scientificPrinciple: "Logotherapy & Existential Drive",
    actionStep: "Tatap foto orang tercinta atau tuliskan alasan terbesarmu berkuliah.",
    timeOfDay: 'NIGHT',
    tags: ['Tujuan Hidup', 'Niat', 'Ketahanan']
  },

  // =========================================================================
  // 6. TOUGH LOVE & REALITY SLAP (Disiplin Keras, Anti-Alasan & Realita)
  // =========================================================================
  {
    id: 'tl1',
    text: "Dunia nyata tidak peduli dengan seberapa keras usahamu di kamar tidur; dunia hanya menilai dari hasil eksekusi nyata yang kamu hadirkan.",
    source: "Harsh Reality & Accountability",
    type: 'TOUGH_LOVE',
    context: "Berhenti membela diri dengan alasan lelah. Evaluasi sistem kerjamu. Jika cara belajarmu belum membuahkan nilai, perbaiki strateginya.",
    scientificPrinciple: "Outcome Accountability & Feedback Reality",
    actionStep: "Hentikan keluhan, buka buku materi, dan catat poin yang belum kamu kuasai.",
    timeOfDay: 'MIDDAY',
    tags: ['Realita', 'Tanggung Jawab', 'Evaluasi']
  },
  {
    id: 'tl2',
    text: "Rasa sakit akibat disiplin beratnya hanya beberapa gram, tetapi rasa sakit akibat penyesalan di masa depan beratnya berton-ton.",
    source: "Jim Rohn",
    type: 'TOUGH_LOVE',
    context: "Pusing belajar 2 jam malam ini jauh lebih ringan dibanding rasa malu dan biaya mengulang mata kuliah di semester berikutnya.",
    scientificPrinciple: "Temporal Discounting & Regret Minimization",
    actionStep: "Pilih disiplin malam ini agar kamu tidak menyesal saat ujian tiba.",
    timeOfDay: 'NIGHT',
    tags: ['Disiplin', 'Penyesalan', 'Pilihan']
  },
  {
    id: 'tl3',
    text: "Jangan pernah mengandalkan 'Mood' atau 'Motivasi'. Motivasi adalah perasaan sementara, Disiplin adalah sistem permanen.",
    source: "Jocko Willink (Discipline Equals Freedom)",
    type: 'TOUGH_LOVE',
    context: "Para profesional bekerja bahkan ketika mereka tidak berminat. Amatir hanya bekerja ketika mood-nya sedang bagus.",
    scientificPrinciple: "Behavioral Autonomy & Identity Conditioning",
    actionStep: "Duduk tegak, minum segelas air putih, dan mulai tugas tanpa menunggu mood.",
    timeOfDay: 'MORNING',
    tags: ['Disiplin', 'Profesional', 'Anti-Mood']
  },
  {
    id: 'tl4',
    text: "Kamu tidak kekurangan waktu, kamu hanya terlalu banyak menghabiskan waktu untuk hal-hal yang tidak membangun masa depanmu.",
    source: "Harsh Reality",
    type: 'TOUGH_LOVE',
    context: "Cek screen time ponselmu. Jika media sosialmu 4 jam sehari, kamu punya waktu sangat melimpah untuk belajar dan berkarya.",
    scientificPrinciple: "Time Audit & Opportunity Reallocation",
    actionStep: "Aktifkan Focus Mode atau letakkan ponsel di luar jangkauan tangan selama 1 jam.",
    timeOfDay: 'EVENING',
    tags: ['Waktu', 'Screen Time', 'Distraksi']
  },
  {
    id: 'tl5',
    text: "Tidak ada orang yang akan datang untuk menyelamatkanmu. Sukses atau gagalnya masa depanmu adalah tanggung jawab pribadimu 100%.",
    source: "David Goggins (Can't Hurt Me)",
    type: 'TOUGH_LOVE',
    context: "Berhenti menyalahkan dosen killer, sistem kampus, atau keadaan. Ambil kendali penuh atas nasibmu dan buktikan dengan kerja nyata.",
    scientificPrinciple: "Extreme Ownership & Internal Attribution",
    actionStep: "Tuliskan 1 hal yang akan kamu tuntaskan hari ini atas tanggung jawab pribadimu.",
    timeOfDay: 'MORNING',
    tags: ['Extreme Ownership', 'Mental Baja', 'Bangkit']
  }
];

export const getSmartMotivationByTime = (preferredCategories?: string[]): MotivationItem => {
  const hour = new Date().getHours();
  let timeTag: 'MORNING' | 'MIDDAY' | 'EVENING' | 'NIGHT' = 'MORNING';

  if (hour >= 4 && hour < 11) {
    timeTag = 'MORNING';
  } else if (hour >= 11 && hour < 16) {
    timeTag = 'MIDDAY';
  } else if (hour >= 16 && hour < 20) {
    timeTag = 'EVENING';
  } else {
    timeTag = 'NIGHT';
  }

  let candidates = MOTIVATION_DATABASE.filter(item => item.timeOfDay === timeTag || item.timeOfDay === 'ANY');
  
  if (preferredCategories && preferredCategories.length > 0) {
    const filtered = candidates.filter(item => preferredCategories.includes(item.type));
    if (filtered.length > 0) {
      candidates = filtered;
    }
  }

  const randomIndex = Math.floor(Math.random() * candidates.length);
  return candidates[randomIndex] || MOTIVATION_DATABASE[0];
};

export const getEmergencyMotivation = (): MotivationItem => {
  const toughAndNeuro = MOTIVATION_DATABASE.filter(i => i.type === 'SCIENCE' || i.type === 'TOUGH_LOVE' || i.type === 'STOICISM');
  const randomIndex = Math.floor(Math.random() * toughAndNeuro.length);
  return toughAndNeuro[randomIndex] || MOTIVATION_DATABASE[0];
};

export const QUOTES_DB = MOTIVATION_DATABASE;

