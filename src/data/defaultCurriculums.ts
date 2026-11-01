import { Curriculum } from '../types/curriculum';

export const DEFAULT_CURRICULUMS: Curriculum[] = [
  // ==================== PILAR 1: AKADEMIK ====================
  {
    id: 'curriculum-skripsi-riset',
    title: 'Metodologi Riset & Penulisan Skripsi Ilmiah',
    domain: 'AKADEMIK',
    category: 'Riset & Metodologi',
    difficulty: 'MENENGAH',
    targetDuration: '4 Minggu',
    description: 'Panduan komprehensif mulai dari menemukan research gap, formulasi rumusan masalah, literature review sistematis, pemilihan metodologi, hingga simulasi sidang skripsi.',
    learningOutcomes: [
      'Mampu mengidentifikasi research gap dari jurnal internasional bereputasi',
      'Menyusun kerangka berpikir (conceptual framework) yang kohesif',
      'Menguasai metodologi penelitian kualitatif/kuantitatif sesuai kaidah',
      'Menulis naskah skripsi bebas plagiarisme dan siap menghadapi sidang pendadaran'
    ],
    prerequisites: ['Dasar metode penulisan', 'Akses basis data jurnal kampus'],
    progress: 0,
    isCompleted: false,
    createdAt: 1727760000000,
    updatedAt: 1727760000000,
    lastStudiedChapterIndex: 0,
    totalStudyMinutes: 0,
    source: 'DEFAULT',
    chapters: [
      {
        id: 'c1-research-gap',
        chapterNumber: 1,
        title: 'Anatomi Research Gap & Perumusan Masalah yang Tajam',
        summary: 'Menemukan celah penelitian yang orisinal dan bernilai akademis tanpa tersesat dalam ribuan jurnal.',
        estimatedMinutes: 25,
        mentalModel: 'The Missing Puzzle Piece: Penelitian bukanlah menemukan benua baru, melainkan mengisi kepingan puzzle yang belum terjawab oleh peneliti terdahulu.',
        studyMethod: 'First-Principles Thinking & Critical Reading',
        studyContent: `### Menemukan Celah Penelitian (Research Gap)
Banyak mahasiswa kesulitan memulai skripsi karena mencari topik yang "terlalu luas" atau sekadar mengulang penelitian orang lain tanpa novelty (kebaruan).

#### 4 Jenis Research Gap yang Umum:
1. **Contradictory Evidence Gap**: Penelitian A menyimpulkan X berdampak positif pada Y, sedangkan penelitian B menyatakan tidak berdampak. Anda masuk untuk menguji dengan variabel mediator atau konteks baru.
2. **Methodological Gap**: Peneliti sebelumnya hanya menggunakan metode survei cross-sectional; Anda melengkapinya dengan pendekatan eksperimen atau mixed-methods.
3. **Contextual / Population Gap**: Teori telah teruji di negara maju, namun belum pernah dievaluasi pada ekosistem lokal atau populasi mahasiswa pasca-pandemi.
4. **Knowledge Void Gap**: Fenomena baru yang belum memiliki literatur empiris cukup (contoh: dampak Generative AI pada integritas akademik mahasiswa tingkat pertama).

#### Rumusan Masalah yang Kokoh:
Rumusan masalah harus:
- Spesifik (tidak ambigu)
- Dapat diuji secara empiris (testable)
- Memiliki implikasi teoritis dan praktis yang jelas.`,
        actionTask: {
          text: 'Unduh 3 artikel jurnal rujukan utama (Q1/Q2 atau Sinta 1/2) dan tuliskan 1 kalimat research gap yang Anda temukan.',
          completed: false
        },
        reflectionPrompt: 'Apakah topik yang Anda pilih benar-benar membangkitkan rasa ingin tahu intelektual Anda, atau hanya sekadar yang tercepat selesai?',
        userNote: '',
        quiz: [
          {
            id: 'q1-1',
            question: 'Apa karakteristik utama dari "Contradictory Evidence Gap" dalam literatur ilmiah?',
            options: [
              'Peneliti sebelumnya tidak menggunakan sampel data sama sekali',
              'Adanya pertentangan atau perbedaan hasil temuan antara peneliti terdahulu mengenai suatu relasi',
              'Penelitian dilakukan tanpa kerangka teori yang jelas',
              'Topik penelitian sama sekali belum pernah diteliti sebelumnya oleh siapa pun'
            ],
            correctAnswerIndex: 1,
            explanation: 'Contradictory evidence gap muncul ketika dua atau lebih studi bereputasi menghasilkan temuan yang saling bertolak belakang, sehingga memerlukan investigasi lanjutan.'
          },
          {
            id: 'q1-2',
            question: 'Mengapa rumusan masalah penelitian harus bersifat "testable"?',
            options: [
              'Agar dosen pembimbing tidak banyak bertanya',
              'Agar skripsi dapat ditulis tebal lebih dari 100 halaman',
              'Agar variabel dan relasinya dapat diukur atau dibuktikan melalui pengumpulan data empiris',
              'Agar metodologi penelitian selalu berjenis kuantitatif murni'
            ],
            correctAnswerIndex: 2,
            explanation: 'Sifat testable memastikan bahwa hipotesis atau pertanyaan penelitian dapat dijawab dan dibuktikan kebenarannya secara objektif melalui data riil.'
          }
        ],
        isCompleted: false
      },
      {
        id: 'c1-lit-review',
        chapterNumber: 2,
        title: 'Literature Review Sistematis & Matrix Sintesis',
        summary: 'Mengubah kumpulan jurnal menjadi narasi akademis yang koheren menggunakan matriks sintesis.',
        estimatedMinutes: 30,
        mentalModel: 'The Dinner Party Conversation: Jangan hanya mengabsen nama peneliti satu per satu; buatlah seolah para peneliti tersebut sedang berdialog dan berdebat di sebuah meja makan.',
        studyMethod: 'Synthesis Matrix & Cornell Mapping',
        studyContent: `### Menghindari "Laundry List" dalam Tinjauan Pustaka
Kesalahan paling fatal dalam Bab 2 skripsi adalah membuat ringkasan per paragraf (Si A berkata ini... Si B berkata itu...). Literature review yang baik adalah **sintesis konseptual**.

#### Membuat Matriks Sintesis:
Buat tabel dengan kolom:
- Nama Peneliti & Tahun
- Variabel / Konsep Kunci
- Metodologi & Sampel
- Temuan Utama
- Keterbatasan (Limitations)

#### Mengorganisasi Tema:
Kelompokkan jurnal berdasarkan tema ide, bukan kronologi tahun saja. Contoh: "Sebagian besar literatur sepakat bahwa efikasi diri meningkatkan prestasi, namun aspek motivasi intrinsik sering diabaikan dalam konteks pembelajaran daring."`,
        actionTask: {
          text: 'Buat matriks sintesis sederhana yang membandingkan minimal 5 jurnal rujukan penelitian Anda.',
          completed: false
        },
        reflectionPrompt: 'Bagaimana kontribusi penelitian Anda akan melengkapi percakapan akademis yang sudah berlangsung dalam literatur tersebut?',
        userNote: '',
        quiz: [
          {
            id: 'q1-3',
            question: 'Apa bahaya utama dari metode penulisan "laundry list" pada tinjauan pustaka?',
            options: [
              'Mengakibatkan plagiarisme verbatim secara otomatis',
              'Hanya merangkum kutipan per penulis secara terpisah tanpa memperlihatkan dialog kritis dan benang merah antar teori',
              'Membuat naskah skripsi terlalu singkat',
              'Menyebabkan format referensi APA menjadi rusak'
            ],
            correctAnswerIndex: 1,
            explanation: 'Laundry list membuat tinjauan pustaka terasa kering dan tidak analitis karena gagal menghubungkan keterkaitan, konsensus, dan inkonsistensi antar penelitian terdahulu.'
          }
        ],
        isCompleted: false
      },
      {
        id: 'c1-methodology',
        chapterNumber: 3,
        title: 'Desain Metodologi, Uji Validitas & Reliabilitas',
        summary: 'Menentukan populasi, sampel, instrumen penelitian, dan keabsahan data ilmiah.',
        estimatedMinutes: 35,
        mentalModel: 'The Bridge of Trust: Metodologi adalah jembatan yang menghubungkan pertanyaan penelitian dengan kesimpulan. Jika jembatan ini rapuh, seluruh bangunan skripsi akan runtuh.',
        studyMethod: 'Deliberate Practice & Protocol Checklist',
        studyContent: `### Memilih Pendekatan yang Tepat
Apakah pertanyaan penelitian Anda menuntut generalisasi statistik (kuantitatif) atau pendalaman makna kontekstual (kualitatif)?

#### Standar Validitas & Reliabilitas:
- **Kuantitatif**: Uji validitas butir instrumen (pearson product moment / CFA), uji reliabilitas (Cronbach Alpha > 0.70), dan pemenuhan asumsi klasik (normalitas, multikolinearitas, heteroskedastisitas).
- **Kualitatif**: Triangulasi (sumber, metode, waktu), member checking, audit trail, dan transferabilitas temuan.

#### Etika Penelitian:
Persetujuan terinformasi (informed consent), kerahasiaan data responden (anonymity), dan bebas manipulasi data (p-hacking).`,
        actionTask: {
          text: 'Tuliskan rancangan operasionalisasi variabel atau panduan wawancara mendalam untuk instrumen penelitian Anda.',
          completed: false
        },
        reflectionPrompt: 'Apakah instrumen pengumpulan data Anda sudah cukup adil dan objektif untuk mengukur apa yang sebenarnya ingin Anda ukur?',
        userNote: '',
        quiz: [
          {
            id: 'q1-4',
            question: 'Apa fungsi utama dari uji Cronbach’s Alpha dalam instrumen kuesioner kuantitatif?',
            options: [
              'Mengukur tingkat konsistensi internal butir-butir pertanyaan dalam merefleksikan konstruk yang sama',
              'Menentukan jumlah minimum responden penelitian',
              'Menghitung korelasi kausalitas antar variabel',
              'Menguji apakah data berdistribusi normal secara kurva lonceng'
            ],
            correctAnswerIndex: 0,
            explanation: 'Cronbach Alpha menguji reliabilitas konsistensi internal kuesioner; nilai di atas 0.7 menunjukkan instrumen handal dan konsisten.'
          }
        ],
        isCompleted: false
      },
      {
        id: 'c1-defense',
        chapterNumber: 4,
        title: 'Strategi Menghadapi Sidang Skripsi (Defense Mastery)',
        summary: 'Menguasai seni presentasi sidang, antisipasi pertanyaan jebakan dosen penguji, dan defensibilitas argumen.',
        estimatedMinutes: 25,
        mentalModel: 'Master of Your Territory: Di ruang sidang, Andalah orang yang paling mendalami data penelitian Anda sendiri. Penguji menguji integritas berpikir, bukan menghukum.',
        studyMethod: 'Feynman Technique & Stress Inoculation Simulation',
        studyContent: `### 15 Menit Presentasi yang Memikat Penguji
1. **Slide 1-3**: Fenomena riil, urgensi masalah, dan research gap (mengapa riset ini krusial).
2. **Slide 4-5**: Landasan teori dan hipotesis / kerangka pikir.
3. **Slide 6-8**: Metodologi, populasi sampel, dan teknik analisis data.
4. **Slide 9-12**: Temuan utama (tampilkan grafik/tabel ringkas), bukan teks panjang!
5. **Slide 13-15**: Pembahasan (interpretasi mengapa hasil demikian), implikasi, dan keterbatasan.

#### Menangani Pertanyaan Sulit:
- Berhenti sejenak 2 detik sebelum menjawab.
- Akui keterbatasan penelitian dengan elegan: *"Pertanyaan yang sangat bagus, Prof. Penelitian ini memang dibatasi pada ruang lingkup X, namun saran tersebut menjadi rekomendasi penting bagi penelitian selanjutnya."*
- Jangan pernah berbohong atau mengarang data saat disidang!`,
        actionTask: {
          text: 'Lakukan simulasi presentasi 10 menit menggunakan timer, rekam suara Anda, dan evaluasi kelancaran penjelasan Anda.',
          completed: false
        },
        reflectionPrompt: 'Apa pertanyaan paling sulit yang mungkin diajukan penguji pada skripsi Anda, dan bagaimana jawaban ilmiah terbaik Anda?',
        userNote: '',
        quiz: [
          {
            id: 'q1-5',
            question: 'Ketika dosen penguji menanyakan aspek yang di luar batas lingkup penelitian yang telah ditetapkan, respons terbaik adalah:',
            options: [
              'Menyalahkan dosen pembimbing karena tidak memberi tahu sebelumnya',
              'Menjawab spekulatif tanpa dasar data agar terlihat tahu segalanya',
              'Mengakui batasan penelitian secara elegan dan menjadikannya poin rekomendasi riset masa depan',
              'Mendebat penguji dengan nada emosional'
            ],
            correctAnswerIndex: 2,
            explanation: 'Sikap ilmiah yang matang mengakui deliniasi ruang lingkup (limitations) secara objektif dan mengarahkan wawasan tersebut sebagai rekomendasi masa depan.'
          }
        ],
        isCompleted: false
      }
    ]
  },

  {
    id: 'curriculum-algoritma-problem-solving',
    title: 'Algoritma, Struktur Data & Logika Komputasional',
    domain: 'AKADEMIK',
    category: 'Ilmu Komputer & Rekayasa',
    difficulty: 'MENENGAH',
    targetDuration: '4 Minggu',
    description: 'Menguasai seni pemecahan masalah komputasi dari dasar Big-O notation, rekursi, divide & conquer, linked list, graph traversal, hingga dynamic programming.',
    learningOutcomes: [
      'Menganalisis kompleksitas waktu dan memori (Big-O) dengan presisi',
      'Mengimplementasikan struktur data esensial (Tree, Graph, Hash Table, Stack/Queue)',
      'Memecahkan persoalan komputasi kompleks dengan pola Algoritma Greedy dan DP',
      'Siap menghadapi coding interview dan ujian algoritma perguruan tinggi'
    ],
    prerequisites: ['Dasar satu bahasa pemrograman (C++, Java, Python, atau JS)'],
    progress: 0,
    isCompleted: false,
    createdAt: 1727760000000,
    updatedAt: 1727760000000,
    lastStudiedChapterIndex: 0,
    totalStudyMinutes: 0,
    source: 'DEFAULT',
    chapters: [
      {
        id: 'c2-big-o',
        chapterNumber: 1,
        title: 'Kompleksitas Asimptotik (Big-O, Big-Omega, Big-Theta)',
        summary: 'Memahami efisiensi algoritma saat volume input (N) bertumbuh menuju tak hingga.',
        estimatedMinutes: 25,
        mentalModel: 'Scalability Lens: Jangan ukur kecepatan algoritma dengan stopwatch, ukur dengan seberapa banyak langkah komputasi bertambah ketika data berlipat ganda.',
        studyMethod: 'First-Principles & Mathematical Derivation',
        studyContent: `### Mengapa Stopwatch Tidak Cukup?
Mengukur waktu eksekusi dengan millisecond sangat bias terhadap spesifikasi CPU, background tasks, dan bahasa pemrograman. Analisis Big-O mengukur **pertumbuhan jumlah operasi matematis terhadap ukuran input N**.

#### Spektrum Kompleksitas Utama:
- **O(1)**: Waktu konstan (e.g., akses indeks array, operasi hash map ideal).
- **O(log N)**: Pembagian ruang pencarian separuh setiap langkah (e.g., Binary Search).
- **O(N)**: Satu iterasi linier (e.g., mencari elemen di unindexed array).
- **O(N log N)**: Algoritma sorting optimal berbasis komparasi (Merge Sort, Quick Sort rata-rata).
- **O(N^2)**: Nested loop ganda (Bubble Sort, Selection Sort). Bahaya saat N > 10.000!
- **O(2^N)**: Pertumbuhan eksponensial (Rekursi Fibonacci naif). Sangat tidak skalabel.`,
        actionTask: {
          text: 'Ambil satu fungsi perulangan dalam kode Anda dan hitung kompleksitas waktu Big-O serta alokasi memorinya.',
          completed: false
        },
        reflectionPrompt: 'Kapan optimasi kode menjadi esensial, dan kapan justru jatuh pada perangkap premature optimization?',
        userNote: '',
        quiz: [
          {
            id: 'q2-1',
            question: 'Jika ukuran data N berlipat ganda dari 1.000 menjadi 2.000, dan algoritma berjalan dengan O(log N), berapa pertambahan langkah komputasinya?',
            options: [
              'Bertambah dua kali lipat menjadi 2.000 langkah',
              'Bertambah hanya sekitar 1 langkah tambahan (konstan kecil)',
              'Bertambah menjadi 4 kali lipat',
              'Tetap nol tanpa ada langkah baru'
            ],
            correctAnswerIndex: 1,
            explanation: 'Karena log2(2N) = log2(N) + 1, melipatgandakan data pada algoritma logaritmik (seperti Binary Search) hanya menambah 1 kali pembagian/langkah saja.'
          }
        ],
        isCompleted: false
      },
      {
        id: 'c2-trees-graphs',
        chapterNumber: 2,
        title: 'Pohon & Graf: Representasi, BFS & DFS',
        summary: 'Mengeksplorasi hubungan data non-linier melalui algoritma penelusuran graf dan shortest path.',
        estimatedMinutes: 30,
        mentalModel: 'The Maze Runner: BFS menjelajah ruangan lapis demi lapis (seperti riak air), sedangkan DFS menjelajah satu lorong sampai ujung buntu sebelum berbalik.',
        studyMethod: 'Visual Simulation & Code Pattern Practice',
        studyContent: `### Struktur Data Non-Linier
Hampir seluruh sistem modern (jejaring sosial, rute GPS Maps, sistem rekomendasi, DOM tree browser) dimodelkan sebagai Graph $G = (V, E)$.

#### Penelusuran Graf (Graph Traversal):
- **BFS (Breadth-First Search)**: Menggunakan struktur data **Queue (FIFO)**. Sangat ideal untuk mencari jalur terpendek (shortest path) pada graf tanpa bobot.
- **DFS (Depth-First Search)**: Menggunakan struktur data **Stack (LIFO)** atau **Call Stack Rekursi**. Sangat efektif untuk deteksi siklus, topological sorting, dan backtracking.`,
        actionTask: {
          text: 'Tuliskan pseudocode atau fungsi rekursif sederhana untuk melakukan DFS transversal pada binary tree.',
          completed: false
        },
        reflectionPrompt: 'Dalam masalah nyata apa di sekitar kampus Anda yang bisa dimodelkan secara elegan menggunakan graf?',
        userNote: '',
        quiz: [
          {
            id: 'q2-2',
            question: 'Struktur data pendukung apa yang secara alami digunakan untuk implementasi Breadth-First Search (BFS)?',
            options: [
              'Stack (LIFO)',
              'Queue (FIFO)',
              'Priority Heap murni',
              'Binary Search Tree'
            ],
            correctAnswerIndex: 1,
            explanation: 'BFS memproses node lapis demi lapis berdasarkan urutan kedatangan, sehingga memerlukan struktur data antrean Queue (First In, First Out).'
          }
        ],
        isCompleted: false
      }
    ]
  },

  {
    id: 'curriculum-statistika-penelitian',
    title: 'Statistika Terapan & Analisis Data Penelitian',
    domain: 'AKADEMIK',
    category: 'Sains & Data',
    difficulty: 'PEMULA',
    targetDuration: '3 Minggu',
    description: 'Fondasi statistika praktis untuk mahasiswa: distribusi probabilitas, uji t, ANOVA, regresi linier, hingga interpretasi p-value tanpa salah kaprah.',
    learningOutcomes: [
      'Membedakan statistik parametrik vs non-parametrik secara tepat',
      'Membaca dan menginterpretasikan nilai p-value dan selang kepercayaan (CI)',
      'Menjalankan uji hipotesis dan korelasi data penelitian',
      'Mendeteksi dan menghindari kesalahan manipulasi data statistik'
    ],
    prerequisites: ['Matematika dasar SMA / Semester 1'],
    progress: 0,
    isCompleted: false,
    createdAt: 1727760000000,
    updatedAt: 1727760000000,
    lastStudiedChapterIndex: 0,
    totalStudyMinutes: 0,
    source: 'DEFAULT',
    chapters: [
      {
        id: 'c3-hypothesis',
        chapterNumber: 1,
        title: 'Filosofi Uji Hipotesis & Memahami Hakikat P-Value',
        summary: 'Mengapa p < 0.05 bukan berarti hipotesis Anda 95% benar, dan cara membaca signifikansi ilmiah yang jujur.',
        estimatedMinutes: 25,
        mentalModel: 'The Presumption of Innocence: Hipotesis nol (H0) dianggap benar sampai data memberikan bukti yang cukup kuat untuk menolaknya, persis asas praduga tak bersalah di pengadilan.',
        studyMethod: 'Conceptual Deconstruction & Socratic Questioning',
        studyContent: `### Memahami P-Value Tanpa Miskonsepsi
P-value adalah salah satu konsep paling sering disalahpahami dalam dunia akademik.

**P-value BUKAN**:
- Probabilitas bahwa hipotesis alternatif (H1) Anda benar.
- Ukuran besaran dampak praktis (effect size).

**P-value ADALAH**:
Probabilitas mendapatkan data yang seekstrem atau lebih ekstrem dari data sampel yang Anda amati, **dengan asumsi bahwa Hipotesis Nol (H0) adalah benar**.

Jika p-value < 0.05, artinya sangat kecil kemungkinan data ini muncul semata-mata karena kebetulan acak jika memang tidak ada pengaruh nyata. Maka kita memutuskan untuk menolak H0.`,
        actionTask: {
          text: 'Tuliskan Hipotesis Nol (H0) dan Hipotesis Alternatif (H1) dari salah satu studi kasus di perkuliahan Anda.',
          completed: false
        },
        reflectionPrompt: 'Mengapa signifikansi statistik berbeda dengan signifikansi praktis di dunia nyata?',
        userNote: '',
        quiz: [
          {
            id: 'q3-1',
            question: 'Apa arti sebenarnya ketika uji statistik menghasilkan p-value sebesar 0.02 (dengan alpha 0.05)?',
            options: [
              'Ada 2% kemungkinan hipotesis alternatif kita salah',
              'Peluang memperoleh data seekstrem ini jika H0 benar adalah 2%, sehingga kita menolak H0',
              'Hipotesis kita memiliki probabilitas 98% terbukti secara mutlak',
              'Penelitian harus diulang karena nilai p-value terlalu kecil'
            ],
            correctAnswerIndex: 1,
            explanation: 'P-value mengukur probabilitas bukti data di bawah asumsi H0 benar; karena 0.02 < 0.05, peluang kebetulan acak sangat kecil sehingga kita menolak H0.'
          }
        ],
        isCompleted: false
      }
    ]
  },

  // ==================== PILAR 2: PRIBADI (PERSONAL GROWTH) ====================
  {
    id: 'curriculum-stoikisme-mahasiswa',
    title: 'Stoikisme Modern & Regulasi Emosi Mahasiswa',
    domain: 'PRIBADI',
    category: 'Mental Health & Karakter',
    difficulty: 'PEMULA',
    targetDuration: '3 Minggu',
    description: 'Menerapkan filosofi Stoa kuno (Marcus Aurelius, Epictetus, Seneca) untuk mengelola kecemasan akademik, tekanan IPK, perbandingan sosial, dan burnout perkuliahan.',
    learningOutcomes: [
      'Menguasai Dikotomi Kendali (Dichotomy of Control) dalam realitas kampus',
      'Menghentikan kebiasaan overthinking dan imposter syndrome mahasiswa',
      'Menerapkan Amor Fati saat menghadapi kegagalan ujian atau penolakan magang',
      'Membangun ketangguhan mental (resilience) yang tenang dan berwibawa'
    ],
    prerequisites: ['Kesiapan refleksi diri yang jujur'],
    progress: 0,
    isCompleted: false,
    createdAt: 1727760000000,
    updatedAt: 1727760000000,
    lastStudiedChapterIndex: 0,
    totalStudyMinutes: 0,
    source: 'DEFAULT',
    chapters: [
      {
        id: 'c4-dichotomy-control',
        chapterNumber: 1,
        title: 'Dikotomi Kendali: Memisahkan Badai dari Kemudi',
        summary: 'Pondasi utama stoikisme: membedakan apa yang 100% berada dalam kendali Anda dan apa yang di luar kendali.',
        estimatedMinutes: 20,
        mentalModel: 'The Archer’s Arrow: Pemanah bisa mengendalikan tarikan busur, fokus mata, dan saat pelepasan anak panah. Namun begitu anak panah melesat, hembusan angin dan target sepenuhnya di luar kendalinya.',
        studyMethod: 'Stoic Cognitive Reframing & Journaling',
        studyContent: `### Kebijaksanaan Epictetus
*"Ada hal-hal yang berada di bawah kendali kita (up to us), dan ada hal-hal yang tidak berada di bawah kendali kita (not up to us)."*

#### Dalam Kehidupan Mahasiswa:
**Di Luar Kendali Anda**:
- Dosen penguji yang kaku atau mood-nya buruk saat mengoreksi
- Teman sekelompok yang lambat merespons pesan tugas
- Kebijakan kurikulum kampus yang berubah mendadak
- Keputusan HRD apakah Anda diterima magang atau tidak

**100% Dalam Kendali Anda**:
- Waktu persiapan belajar dan riset materi yang Anda luangkan
- Sikap dan adab Anda saat berkomunikasi dengan dosen atau teman
- Reaksi emosional Anda ketika menerima kritik tajam
- Komitmen untuk tetap bangun pagi dan menyelesaikan kewajiban.

Menghabiskan energi mental untuk mencemaskan hal di luar kendali adalah akar utama kecemasan dan stres mahasiswa.`,
        actionTask: {
          text: 'Tuliskan 1 masalah kampus yang sedang membuat Anda cemas hari ini, lalu bagi menjadi 2 kolom: "Hal yang Bisa Saya Kontrol" dan "Hal yang Harus Saya Ikhlaskan".',
          completed: false
        },
        reflectionPrompt: 'Berapa banyak energi Anda selama ini yang terbuang sia-sia untuk memikirkan opini orang lain tentang diri Anda?',
        userNote: '',
        quiz: [
          {
            id: 'q4-1',
            question: 'Menurut dikotomi kendali Stoik, manakah dari hal berikut yang sepenuhnya berada di bawah kendali seorang mahasiswa?',
            options: [
              'Nilai huruf A yang diberikan oleh dosen pada lembar transkrip',
              'Upaya sungguh-sungguh, persiapan belajar, dan kejujuran saat mengerjakan ujian',
              'Tingkat kesulitan soal ujian yang dirancang oleh fakultas',
              'Apakah teman sekelas menyukai presentasi kita atau tidak'
            ],
            correctAnswerIndex: 1,
            explanation: 'Hasil akhir (nilai, respons orang lain) selalu dipengaruhi faktor luar. Hanya niat, ikhtiar, fokus, dan reaksi kita sendirilah yang 100% berada dalam kendali diri.'
          }
        ],
        isCompleted: false
      },
      {
        id: 'c4-amor-fati',
        chapterNumber: 2,
        title: 'Amor Fati & Memento Mori: Mencintai Setiap Ujian Hidup',
        summary: 'Mengubah hambatan menjadi jalan (The Obstacle is the Way) dan memandang kegagalan sebagai bahan bakar pertumbuhan mental.',
        estimatedMinutes: 25,
        mentalModel: 'The Fire of Transformation: Api yang membara tidak padam ketika dilemparkan kayu atau puing; ia menelan puing tersebut dan menjadikannya bahan bakar untuk menyala lebih terang.',
        studyMethod: 'Premeditatio Malorum (Negative Visualization)',
        studyContent: `### Amor Fati: Mencintai Takdir
Bukan sekadar *pasrah menahan derita* (resignation), tetapi secara aktif *menyambut apa pun yang terjadi* sebagai kesempatan melatih kebajikan (virtue).

- Dosen meminta revisi total Bab 3? Sambut sebagai kesempatan melatih ketelitian metodologis dan kesabaran.
- Proposal lomba ditolak? Sambut sebagai evaluasi kritis sebelum menghadapi penolakan di dunia profesional sesungguhnya.

*"Hambatan dalam tindakan memajukan tindakan. Apa yang menghalangi jalan justru menjadi jalan."* — Marcus Aurelius`,
        actionTask: {
          text: 'Pilihlah satu kekecewaan akademis terbaru Anda, dan tuliskan 3 hikmah atau ketangguhan baru yang Anda peroleh dari peristiwa tersebut.',
          completed: false
        },
        reflectionPrompt: 'Jika Anda tahu hidup perkuliahan Anda berharga dan singkat, apakah Anda masih ingin menghabiskannya dengan mengeluh?',
        userNote: '',
        quiz: [
          {
            id: 'q4-2',
            question: 'Apa esensi dari prinsip Stoik "The Obstacle is the Way" yang dirumuskan Marcus Aurelius?',
            options: [
              'Kita harus sengaja mencari masalah rumit agar hidup terlihat heroik',
              'Hambatan atau rintangan yang kita hadapi menyediakan kesempatan untuk melatih karakter, kesabaran, dan kebajikan',
              'Menghindari rintangan adalah jalan terbaik menuju kedamaian batin',
              'Menyalahkan takdir ketika rencana tidak berjalan sesuai harapan'
            ],
            correctAnswerIndex: 1,
            explanation: 'Prinsip ini menegaskan bahwa rintangan bukanlah penghenti langkah, melainkan sarana terbaik untuk mengasah karakter, resiliensi, dan kebijaksanaan hidup.'
          }
        ],
        isCompleted: false
      }
    ]
  },

  {
    id: 'curriculum-deep-work-manajemen-waktu',
    title: 'Deep Work & Manajemen Waktu Anti-Burnout',
    domain: 'PRIBADI',
    category: 'Produktivitas & Fokus',
    difficulty: 'PEMULA',
    targetDuration: '2 Minggu',
    description: 'Metodologi fokus tingkat tinggi (Cal Newport): time blocking, eliminasi distraksi algoritma media sosial, ritme sirkadian energi, dan seni menolak komitmen yang menguras tenaga.',
    learningOutcomes: [
      'Membangun kemampuan fokus tanpa distraksi selama 90 menit tanpa terputus',
      'Merancang sistem Time-Blocking harian yang fleksibel dan realistis',
      'Mengurangi screen time ponsel hingga 40% tanpa kehilangan info penting kampus',
      'Mencapai nilai akademik optimal dengan jam belajar yang lebih efisien'
    ],
    prerequisites: ['Keinginan berhenti menunda-nunda tugas (prokrastinasi)'],
    progress: 0,
    isCompleted: false,
    createdAt: 1727760000000,
    updatedAt: 1727760000000,
    lastStudiedChapterIndex: 0,
    totalStudyMinutes: 0,
    source: 'DEFAULT',
    chapters: [
      {
        id: 'c5-shallow-vs-deep',
        chapterNumber: 1,
        title: 'Shallow Work vs Deep Work: Jebakan Sibuk Tanpa Hasil',
        summary: 'Membedakan aktivitas yang sekadar tampak sibuk dengan aktivitas berkonsentrasi tinggi yang menghasilkan karya bernilai langka.',
        estimatedMinutes: 20,
        mentalModel: 'Attention Residue: Setiap kali Anda melirik notifikasi ponsel saat belajar, sebagian kapasitas kognitif otak Anda tertinggal di ponsel tersebut hingga 15-20 menit kemudian.',
        studyMethod: 'Attention Shielding & Strict Time-Box',
        studyContent: `### Ilusi Multitasking Mahasiswa
Banyak mahasiswa belajar di depan laptop selama 6 jam, namun sambil membalas chat WhatsApp, scroll feed media sosial, dan mendengarkan podcast bertema berat. Ini disebut **Shallow Work**.

Hasilnya:
- Otak lelah parah (cognitive fatigue)
- Pemahaman materi dangkal
- Merasa "sudah belajar seharian" tapi tugas tak kunjung beres.

**Deep Work**:
Aktivitas profesional atau akademis yang dilakukan dalam konsentrasi penuh tanpa gangguan, yang mendorong kapasitas kognitif Anda hingga ke batas optimal. Dua jam Deep Work murni menghasilkan output melebihi 8 jam belajar yang terdistraksi!`,
        actionTask: {
          text: 'Lakukan sesi Deep Work 45 menit pertama Anda hari ini: matikan notifikasi ponsel, letakkan di ruangan lain, dan fokus selesaikan 1 tugas prioritas.',
          completed: false
        },
        reflectionPrompt: 'Berapa jam dalam sehari Anda benar-benar fokus secara mendalam tanpa distraksi gadget sama sekali?',
        userNote: '',
        quiz: [
          {
            id: 'q5-1',
            question: 'Apa yang dimaksud dengan "Attention Residue" dalam riset kognitif Sophie Leroy & Cal Newport?',
            options: [
              'Penurunan daya baterai ponsel saat menyalakan banyak aplikasi',
              'Sisa fokus kognitif yang masih tertahan pada tugas sebelumnya saat berpindah tugas dengan cepat, sehingga merusak konsentrasi tugas baru',
              'Kemampuan manusia untuk mengingat 10 hal sekaligus tanpa batas waktu',
              'Kondisi tidur nyenyak setelah berolahraga berat'
            ],
            correctAnswerIndex: 1,
            explanation: 'Attention residue membuktikan bahwa saat kita berpindah cepat antar tugas (seperti melirik pesan ponsel saat belajar), sisa perhatian tertinggal pada pesan tersebut dan menurunkan kualitas daya nalar kognitif.'
          }
        ],
        isCompleted: false
      }
    ]
  },

  {
    id: 'curriculum-public-speaking-retorika',
    title: 'Seni Public Speaking & Retorika Presentasi Sidang',
    domain: 'PRIBADI',
    category: 'Komunikasi & Karakter',
    difficulty: 'MENENGAH',
    targetDuration: '3 Minggu',
    description: 'Transformasi rasa takut berbicara di depan umum menjadi wibawa komunikasi. Meliputi struktur persuasi Aristoteles (Ethos, Pathos, Logos), intonasi vokal, dan bahasa tubuh.',
    learningOutcomes: [
      'Mengatasi demam panggung dan tremor suara dengan teknik pernapasan diafragma',
      'Menyusun kerangka presentasi persuasif dengan hook pembuka yang memukau',
      'Menguasai kontak mata dan bahasa tubuh yang percaya diri di depan audiens',
      'Menjawab sanggahan atau pertanyaan mendadak dengan tenang dan sistematis'
    ],
    prerequisites: ['Kesiapan mempraktikkan latihan vokal secara mandiri'],
    progress: 0,
    isCompleted: false,
    createdAt: 1727760000000,
    updatedAt: 1727760000000,
    lastStudiedChapterIndex: 0,
    totalStudyMinutes: 0,
    source: 'DEFAULT',
    chapters: [
      {
        id: 'c6-trio-retorika',
        chapterNumber: 1,
        title: 'Trio Retorika Aristoteles: Ethos, Pathos, dan Logos',
        summary: 'Tiga pilar komunikasi klasik yang membuat audiens percaya, tergerak, dan teryakinkan oleh ucapan Anda.',
        estimatedMinutes: 20,
        mentalModel: 'The Three-Legged Stool: Jika presentasi Anda hanya berisi logika kaku (Logos) tanpa kredibilitas (Ethos) dan empati manusiawi (Pathos), pesan Anda akan jatuh di telinga yang tertutup.',
        studyMethod: 'Vocal Projection & Aristotle Framing',
        studyContent: `### Membedah Tiga Elemen Persuasi
1. **Ethos (Kredibilitas & Karakter)**:
   Mengapa audiens harus mendengarkan Anda? Ditunjukkan melalui kerapian penampilan, adab bicara, penguasaan latar belakang topik, dan kerendahan hati ilmiah.
2. **Logos (Logika & Struktur Argumen)**:
   Apakah alur penjelasan masuk akal? Data empiris, hubungan sebab-akibat, dan kejelasan alur berpikir dari premis hingga kesimpulan.
3. **Pathos (Resonansi Emosional)**:
   Menyentuh nilai kemanusiaan, cerita riil, analogi yang relevan dengan kehidupan audiens, serta variasi intonasi vokal yang hidup.`,
        actionTask: {
          text: 'Pilih satu topik perkuliahan dan buat naskah pembuka (hook) 60 detik yang memadukan cerita singkat (Pathos) dan fakta mengejutkan (Logos).',
          completed: false
        },
        reflectionPrompt: 'Apakah selama ini presentasi Anda hanya sekadar membacakan poin slide PowerPoint, atau benar-benar menyampaikan gagasan hidup kepada manusia?',
        userNote: '',
        quiz: [
          {
            id: 'q6-1',
            question: 'Dalam retorika klasik Aristoteles, unsur yang berfokus pada daya tarik bukti rasional, data objektif, dan silogisme argumen disebut:',
            options: [
              'Pathos',
              'Logos',
              'Ethos',
              'Kronos'
            ],
            correctAnswerIndex: 1,
            explanation: 'Logos adalah pemanfaatan logika penalaran, bukti data, dan struktur argumen deduktif/induktif untuk meyakinkan pikiran audiens.'
          }
        ],
        isCompleted: false
      }
    ]
  },

  {
    id: 'curriculum-keuangan-mahasiswa',
    title: 'Kecerdasan Finansial & Penganggaran Mahasiswa Mandiri',
    domain: 'PRIBADI',
    category: 'Finansial & Kemandirian',
    difficulty: 'PEMULA',
    targetDuration: '2 Minggu',
    description: 'Panduan bertahan hidup dan membangun fondasi kekayaan sejak bangku kuliah: sistem pos uang 50/30/20 anak kos, dana darurat, investasi instrumen aman, dan benteng dari jeratan pinjol.',
    learningOutcomes: [
      'Mengalokasikan kiriman bulanan atau uang saku dengan rumus budgeting realistis',
      'Membangun pos dana darurat minimal 3 bulan biaya hidup kosan',
      'Mengenal instrumen investasi pemula (Reksadana Pasar Uang & Emas Digital)',
      'Membedakan keinginan impulsif (fomo) vs kebutuhan esensial masa depan'
    ],
    prerequisites: ['Pencatatan pengeluaran harian minimal 1 minggu'],
    progress: 0,
    isCompleted: false,
    createdAt: 1727760000000,
    updatedAt: 1727760000000,
    lastStudiedChapterIndex: 0,
    totalStudyMinutes: 0,
    source: 'DEFAULT',
    chapters: [
      {
        id: 'c7-budgeting-kos',
        chapterNumber: 1,
        title: 'Formula Cashflow Anak Kos: 50-30-20 yang Disesuaikan',
        summary: 'Mengendalikan arus kas sejak hari pertama kiriman tiba agar tidak mengalami krisis tanggal tua.',
        estimatedMinutes: 20,
        mentalModel: 'Pay Yourself First: Jangan menabung dari uang yang tersisa di akhir bulan; sisihkan tabungan di hari pertama uang masuk, lalu habiskan sisanya sesuai pos yang direncanakan.',
        studyMethod: 'Envelope System & Behavioral Accounting',
        studyContent: `### Mengapa Mahasiswa Sering Kehabisan Uang Sebelum Waktunya?
Bukan karena uang saku selalu kurang, melainkan karena **tidak ada batasan pos pengeluaran** sejak awal bulan.

#### Modifikasi 50/30/20 Mahasiswa:
- **50% Kebutuhan Pokok (Needs)**: Uang makan pokok, sewa kos/kontrakan, kuota internet kuliah, bensin/transportasi.
- **30% Keinginan & Kehidupan Sosial (Wants)**: Nongkrong di cafe, langganan streaming film, hobi. (Jika kondisi mendesak, pos ini yang pertama kali dipangkas).
- **20% Masa Depan & Cadangan (Savings)**: Disimpan di rekening terpisah sebagai dana darurat dan modal belajar/buku/sertifikasi.

Aturan Emas: *Jika ingin membeli sesuatu yang bukan kebutuhan pokok seharga di atas Rp 200.000, tunggu 72 jam. Jika setelah 3 hari Anda masih membutuhkannya, barulah pertimbangkan membelinya.*`,
        actionTask: {
          text: 'Buka modul Keuangan di Kampus Kit dan masukkan pos anggaran bulanan Anda berdasarkan pembagian Needs, Wants, dan Savings.',
          completed: false
        },
        reflectionPrompt: 'Pengeluaran apa dalam sebulan terakhir yang paling Anda sesali karena hanya didorong oleh rasa gengsi atau FOMO sesaat?',
        userNote: '',
        quiz: [
          {
            id: 'q7-1',
            question: 'Apa langkah paling efektif dari prinsip "Pay Yourself First" saat mahasiswa menerima kiriman uang bulanan?',
            options: [
              'Mentraktir teman-teman sekelas di hari pertama',
              'Segera menyisihkan alokasi tabungan/dana darurat ke rekening terpisah di hari pertama sebelum mulai belanja',
              'Membelanjakan semua untuk kebutuhan hiburan sampai habis',
              'Menunggu tanggal 28 untuk melihat apakah ada sisa uang'
            ],
            correctAnswerIndex: 1,
            explanation: 'Pay Yourself First menjamin tabungan masa depan terbentuk dengan cara menyisihkan dana di awal, bukan bergantung pada sisa uang yang hampir pasti habis jika dibiarkan di rekening belanja.'
          }
        ],
        isCompleted: false
      }
    ]
  }
];
