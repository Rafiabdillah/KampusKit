import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { 
  Trash2, Plus, GraduationCap, Award, Calculator, Download, 
  RefreshCw, BookOpen, Check, Target, ChevronRight, FileText,
  Globe, Printer, X
} from 'lucide-react';
import { StorageService } from '../services/storage';
import { Course, AcademicGradingScale } from '../types';
import { useStore } from '../store/useStore';
import { TRANSLATIONS } from '../utils/translations';
import { GRADING_SYSTEMS, getAcademicHonors } from '../utils/intl';

export interface GradeItem {
  id: number;
  course: string;
  courseId?: string;
  credits: number;
  grade: number; // point value
  letterGrade: string; // 'A', 'A-', 'B+', etc.
  semester: number; // 1..8
  updatedAt?: number;
}

export const GradeCalc: React.FC<{ courses?: Course[] }> = ({ courses = [] }) => {
  const language = useStore(state => state.language);
  const userProfile = useStore(state => state.userProfile);
  const setUserProfile = useStore(state => state.setUserProfile);
  const t = TRANSLATIONS[language] || TRANSLATIONS.id;

  const [grades, setGrades] = useState<GradeItem[]>([]);
  const [activeSemester, setActiveSemester] = useState<number>(1);
  const [viewAllSemesters, setViewAllSemesters] = useState<boolean>(false);
  
  // Selected Academic Scale
  const [gradingScale, setGradingScale] = useState<AcademicGradingScale>(() => {
    return userProfile.gradingScale || StorageService.getItem<AcademicGradingScale>('academic_grading_scale', 'US_4_0');
  });

  // New course input state
  const [newCourse, setNewCourse] = useState('');
  const [newCourseId, setNewCourseId] = useState<string>('');
  const [newCredits, setNewCredits] = useState<number>(3);
  const [selectedGradeValue, setSelectedGradeValue] = useState<number>(4.00);
  
  // Target GPA simulator state
  const [targetGPA, setTargetGPA] = useState<number>(3.80);
  const [targetTotalCredits, setTargetTotalCredits] = useState<number>(140);
  const [copiedTranscript, setCopiedTranscript] = useState<boolean>(false);
  const [showTranscriptModal, setShowTranscriptModal] = useState<boolean>(false);

  const currentSystem = GRADING_SYSTEMS[gradingScale] || GRADING_SYSTEMS.US_4_0;

  useEffect(() => {
    const saved = StorageService.getItem<any[]>('grade_data_v2', []);
    if (saved && saved.length > 0) {
      const normalized: GradeItem[] = saved.map(g => ({
        id: g.id || Date.now() + Math.random(),
        course: g.course || 'Course',
        courseId: g.courseId || undefined,
        credits: Number(g.credits) || 3,
        grade: Number(g.grade) || 4.0,
        letterGrade: g.letterGrade || 'A',
        semester: Number(g.semester) || 1,
        updatedAt: g.updatedAt || Date.now()
      }));
      setGrades(normalized);
      return;
    }

    // Default sample data showcasing international-standard courses
    const defaultData: GradeItem[] = [
      { id: 1, course: 'Algorithms & Data Structures', credits: 4, grade: 4.00, letterGrade: 'A', semester: 1 },
      { id: 2, course: 'Discrete Mathematics', credits: 3, grade: 3.70, letterGrade: 'A-', semester: 1 },
      { id: 3, course: 'Computer Systems & Architecture', credits: 4, grade: 4.00, letterGrade: 'A', semester: 1 },
      { id: 4, course: 'Academic Research & Technical Writing', credits: 2, grade: 3.30, letterGrade: 'B+', semester: 1 },
      { id: 5, course: 'Database Management Systems', credits: 4, grade: 3.70, letterGrade: 'A-', semester: 2 },
      { id: 6, course: 'Linear Algebra & Probability', credits: 3, grade: 4.00, letterGrade: 'A', semester: 2 },
      { id: 7, course: 'Software Engineering Principles', credits: 3, grade: 3.70, letterGrade: 'A-', semester: 2 },
    ];
    setGrades(defaultData);
    StorageService.setItem('grade_data_v2', defaultData);
  }, []);

  const saveGrades = (updated: GradeItem[]) => {
    setGrades(updated);
    StorageService.setItem('grade_data_v2', updated);
  };

  const handleScaleChange = (scale: AcademicGradingScale) => {
    setGradingScale(scale);
    StorageService.setItem('academic_grading_scale', scale);
    setUserProfile({ ...userProfile, gradingScale: scale });
    
    // Update default selected grade value to match new scale's highest
    const sys = GRADING_SYSTEMS[scale];
    if (sys && sys.options.length > 0) {
      setSelectedGradeValue(sys.options[0].value);
    }
  };

  const handleAddGrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCourse.trim()) return;

    const matched = currentSystem.options.find(opt => opt.value === selectedGradeValue) || currentSystem.options[0];
    const newItem: GradeItem = {
      id: Date.now(),
      course: newCourse.trim(),
      courseId: newCourseId || undefined,
      credits: Number(newCredits) || 3,
      grade: matched.value,
      letterGrade: matched.label,
      semester: activeSemester,
      updatedAt: Date.now()
    };

    saveGrades([...grades, newItem]);
    setNewCourse('');
    setNewCourseId('');
    setNewCredits(3);
  };

  const handleRemoveGrade = (id: number) => {
    saveGrades(grades.filter(g => g.id !== id));
  };

  const handleImportFromSchedule = () => {
    const scheduleCourses = courses.length > 0 
      ? courses 
      : StorageService.getItem<Course[]>('courses', []) || [];
    
    if (scheduleCourses.length === 0) {
      alert(language === 'en' 
        ? 'No courses found in Class Schedule. Add courses in the Schedule module first.' 
        : 'Tidak ada mata kuliah di Jadwal Kuliah untuk diimpor. Silakan tambahkan jadwal kuliah terlebih dahulu.');
      return;
    }

    const currentSemesterCourses = grades.filter(g => g.semester === activeSemester);
    const existingNames = new Set(currentSemesterCourses.map(g => g.course.trim().toLowerCase()));

    const newItems: GradeItem[] = [];
    scheduleCourses.forEach(c => {
      const norm = c.name.trim().toLowerCase();
      if (!existingNames.has(norm)) {
        existingNames.add(norm);
        newItems.push({
          id: Date.now() + Math.random(),
          course: c.name.trim(),
          credits: c.credits || 3,
          grade: currentSystem.options[0].value,
          letterGrade: currentSystem.options[0].label,
          semester: activeSemester
        });
      }
    });

    if (newItems.length === 0) {
      alert(language === 'en'
        ? `All courses from schedule already exist in Semester ${activeSemester}.`
        : `Semua mata kuliah dari jadwal sudah ada di Semester ${activeSemester}.`);
      return;
    }

    saveGrades([...grades, ...newItems]);
  };

  // Calculations
  const currentSemesterGrades = grades.filter(g => g.semester === activeSemester);
  const activeList = viewAllSemesters ? grades : currentSemesterGrades;

  const calcGPA = (items: GradeItem[]) => {
    if (items.length === 0) return 0;
    const points = items.reduce((acc, curr) => acc + (curr.credits * curr.grade), 0);
    const credits = items.reduce((acc, curr) => acc + curr.credits, 0);
    return credits === 0 ? 0 : Number((points / credits).toFixed(2));
  };

  const semesterGPA = calcGPA(currentSemesterGrades);
  const cumulativeGPA = calcGPA(grades);

  const totalCreditsCumulative = grades.reduce((acc, curr) => acc + curr.credits, 0);
  const totalCreditsSemester = currentSemesterGrades.reduce((acc, curr) => acc + curr.credits, 0);
  const totalPointsCumulative = grades.reduce((acc, curr) => acc + (curr.credits * curr.grade), 0);

  // Honors calculation based on international scale
  const academicHonors = getAcademicHonors(cumulativeGPA, gradingScale, language);

  // Target Simulation
  const remainingCredits = Math.max(0, targetTotalCredits - totalCreditsCumulative);
  const neededPoints = (targetGPA * targetTotalCredits) - totalPointsCumulative;
  const requiredAverageGPA = remainingCredits > 0 
    ? Number((neededPoints / remainingCredits).toFixed(2)) 
    : 0;

  // Chart Data: Grade Distribution according to active scale options
  const chartData = currentSystem.options.map(opt => ({
    name: opt.label,
    count: grades.filter(g => g.letterGrade === opt.label).length,
    fill: opt.color
  }));

  const copyTranscriptText = () => {
    let tStr = `========================================================\n`;
    tStr += `           OFFICIAL ACADEMIC TRANSCRIPT RECORD          \n`;
    tStr += `========================================================\n\n`;
    tStr += `Student Name : ${userProfile?.name || 'Undergraduate Scholar'}\n`;
    tStr += `University   : ${userProfile?.university || 'University System'}\n`;
    tStr += `Major/Degree : ${userProfile?.major || 'Academic Program'}\n`;
    tStr += `Grading Scale: ${currentSystem.name}\n`;
    tStr += `Issue Date   : ${new Date().toLocaleDateString(language === 'en' ? 'en-US' : 'id-ID', { dateStyle: 'full' })}\n\n`;
    tStr += `--------------------------------------------------------\n`;
    tStr += `Cumulative GPA (CGPA) : ${cumulativeGPA.toFixed(2)} / ${currentSystem.maxGpa.toFixed(2)}\n`;
    tStr += `Total Earned Credits  : ${totalCreditsCumulative} Credit Units\n`;
    tStr += `Academic Honors Standing: ${academicHonors.title}\n`;
    tStr += `--------------------------------------------------------\n\n`;

    for (let sem = 1; sem <= 8; sem++) {
      const semItems = grades.filter(g => g.semester === sem);
      if (semItems.length === 0) continue;
      const sgpa = calcGPA(semItems);
      const sks = semItems.reduce((a, b) => a + b.credits, 0);
      tStr += `[SEMESTER ${sem}]  Term GPA: ${sgpa.toFixed(2)} | Total Units: ${sks}\n`;
      semItems.forEach((item, idx) => {
        tStr += `  (${idx + 1}) ${item.course.padEnd(36)} [${item.credits} Units] -> Grade: ${item.letterGrade} (${item.grade.toFixed(2)})\n`;
      });
      tStr += `\n`;
    }

    tStr += `========================================================\n`;
    tStr += `Verified by KampusKit Academic Executive OS\n`;

    navigator.clipboard.writeText(tStr);
    setCopiedTranscript(true);
    setTimeout(() => setCopiedTranscript(false), 2500);
  };

  return (
    <div className="min-h-full w-full flex flex-col animate-fade-in max-w-6xl mx-auto pb-16">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[10px] font-mono tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-bold">
              {t.internationalReadyBadge}
            </span>
            <span className="text-xs text-zinc-400 font-mono">
              {currentSystem.name}
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white flex items-center gap-3">
            <GraduationCap className="text-primary" size={32} />
            <span>{t.grades}</span>
          </h2>
          <p className="text-zinc-400 mt-1 text-xs sm:text-sm max-w-2xl">
            {language === 'en'
              ? 'International GPA calculator, degree classification projections, target simulations, and official bilingual transcript export.'
              : 'Kalkulator IPK standar internasional, proyeksi predikat kelulusan kehormatan, simulasi target nilai, dan ekspor transkrip resmi.'}
          </p>
        </div>

        {/* Action Controls: Academic Scale Switcher & Transcript Modal */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Scale Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-zinc-900 border border-white/10 rounded-xl p-1 text-xs">
            <Globe size={14} className="text-primary ml-2 hidden sm:block" />
            <select
              value={gradingScale}
              onChange={(e) => handleScaleChange(e.target.value as AcademicGradingScale)}
              aria-label={t.gradingScaleLabel}
              className="bg-transparent text-white font-medium text-xs py-1.5 px-2 focus:outline-none cursor-pointer"
            >
              <option value="US_4_0" className="bg-zinc-900 text-white">US Standard 4.0 (A-F)</option>
              <option value="ID_4_0" className="bg-zinc-900 text-white">Indonesia 4.0 Scale</option>
              <option value="UK_HONOURS" className="bg-zinc-900 text-white">UK Honours (1st, 2:1)</option>
              <option value="ECTS" className="bg-zinc-900 text-white">European ECTS (A-F)</option>
            </select>
          </div>

          {/* Transcript Button */}
          <button
            onClick={() => setShowTranscriptModal(true)}
            className="px-3.5 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            title={t.exportTranscript}
          >
            <FileText size={14} />
            <span>{language === 'en' ? 'Transcript' : 'Transkrip'}</span>
          </button>
        </div>
      </div>

      {/* Primary KPI & Honors Projection Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Cumulative GPA Card */}
        <div className="glass-card bg-zinc-900/70 border-white/10 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>{t.cumulativeGpa}</span>
            <Calculator size={16} className="text-primary" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono tracking-tight">
                {cumulativeGPA.toFixed(2)}
              </span>
              <span className="text-xs text-zinc-400 font-mono">/ {currentSystem.maxGpa.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-2">
              <span>{totalCreditsCumulative} {t.gradeItemCredits}</span>
              <span>•</span>
              <span>{grades.length} {language === 'en' ? 'courses total' : 'mata kuliah'}</span>
            </p>
          </div>
        </div>

        {/* Current Semester Card */}
        <div className="glass-card bg-zinc-900/70 border-white/10 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-2">
            <span>{t.semesterGpa} (Sem {activeSemester})</span>
            <BookOpen size={16} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black text-white font-mono tracking-tight">
                {semesterGPA.toFixed(2)}
              </span>
              <span className="text-xs text-zinc-400 font-mono">/ {currentSystem.maxGpa.toFixed(2)}</span>
            </div>
            <p className="text-[11px] text-zinc-400 mt-2 flex items-center gap-2">
              <span>{totalCreditsSemester} {t.gradeItemCredits}</span>
              <span>•</span>
              <span>{currentSemesterGrades.length} {language === 'en' ? 'this semester' : 'semester ini'}</span>
            </p>
          </div>
        </div>

        {/* Degree Honors & Academic Standing */}
        <div className="glass-card bg-zinc-900/70 border-white/10 p-5 rounded-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between text-zinc-400 text-xs font-semibold mb-1">
            <span>{t.predictedHonors}</span>
            <Award size={16} className="text-amber-400" />
          </div>
          <div>
            <div className={`px-2.5 py-1 rounded-xl text-xs font-bold border inline-block mb-1.5 ${academicHonors.badgeColor}`}>
              {academicHonors.title}
            </div>
            <p className="text-[11px] text-zinc-400 leading-tight">
              {academicHonors.subtitle}
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid: Add Course Form + Course Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8">
        {/* Left Column: Semester Switcher & Add Form */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Semester Selector Bar */}
          <div className="glass-card p-4 rounded-2xl border-white/10">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                {language === 'en' ? 'Select Semester' : 'Pilih Semester'}
              </span>
              <button
                onClick={() => setViewAllSemesters(!viewAllSemesters)}
                className={`text-[11px] px-2 py-0.5 rounded-lg border font-medium transition-all ${
                  viewAllSemesters 
                    ? 'bg-primary/20 text-primary border-primary/40 font-bold' 
                    : 'text-zinc-400 border-white/10 hover:text-zinc-200'
                }`}
              >
                {viewAllSemesters ? (language === 'en' ? 'Viewing All' : 'Semua Semester') : (language === 'en' ? 'View All' : 'Lihat Semua')}
              </button>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                <button
                  key={sem}
                  onClick={() => { setActiveSemester(sem); setViewAllSemesters(false); }}
                  className={`py-2 rounded-xl text-xs font-bold transition-all ${
                    activeSemester === sem && !viewAllSemesters
                      ? 'bg-primary text-white shadow-md shadow-primary/25 scale-105'
                      : 'bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-zinc-200'
                  }`}
                >
                  {sem}
                </button>
              ))}
            </div>
          </div>

          {/* Add Course Form */}
          <form onSubmit={handleAddGrade} className="glass-card p-5 rounded-2xl border-white/10 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus size={16} className="text-primary" />
                <span>{t.addCourse}</span>
              </h3>
              <button
                type="button"
                onClick={handleImportFromSchedule}
                className="text-[11px] text-zinc-400 hover:text-primary transition-colors flex items-center gap-1 font-medium"
                title="Import courses from schedule"
              >
                <RefreshCw size={12} />
                <span>{language === 'en' ? 'Import Schedule' : 'Impor Jadwal'}</span>
              </button>
            </div>

            {courses.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  {language === 'en' ? 'Select from Schedule (Optional)' : 'Pilih dari Jadwal Kuliah (Opsional)'}
                </label>
                <select
                  value={newCourseId}
                  onChange={(e) => {
                    const cid = e.target.value;
                    setNewCourseId(cid);
                    if (cid) {
                      const c = courses.find(item => item.id === cid);
                      if (c) {
                        setNewCourse(c.name);
                        setNewCredits(c.credits || 3);
                      }
                    }
                  }}
                  className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary transition-all cursor-pointer mb-2"
                >
                  <option value="">Ketik Manual...</option>
                  {courses.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.credits} SKS)</option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                {language === 'en' ? 'Course Title' : 'Nama Mata Kuliah'}
              </label>
              <input
                type="text"
                value={newCourse}
                onChange={(e) => setNewCourse(e.target.value)}
                placeholder={t.courseNamePlaceholder}
                className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-primary transition-all"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  {t.gradeItemCredits}
                </label>
                <input
                  type="number"
                  min="1"
                  max="12"
                  value={newCredits}
                  onChange={(e) => setNewCredits(Number(e.target.value))}
                  className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-1.5">
                  {t.gradeLetter}
                </label>
                <select
                  value={selectedGradeValue}
                  onChange={(e) => setSelectedGradeValue(Number(e.target.value))}
                  aria-label={t.gradeLetter}
                  className="w-full bg-zinc-950/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-primary font-mono cursor-pointer"
                >
                  {currentSystem.options.map(opt => (
                    <option key={opt.label} value={opt.value} className="bg-zinc-900 text-white">
                      {opt.label} ({opt.value.toFixed(2)}) - {opt.description}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick Grade Selector Pills */}
            <div>
              <span className="text-[10px] font-mono text-zinc-400 block mb-1.5">
                {language === 'en' ? 'Quick Grade Select:' : 'Pilih Nilai Cepat:'}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {currentSystem.options.map(opt => {
                  const isSelected = selectedGradeValue === opt.value;
                  return (
                    <button
                      type="button"
                      key={opt.label}
                      onClick={() => setSelectedGradeValue(opt.value)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all border ${
                        isSelected
                          ? 'bg-primary text-white border-primary shadow-sm'
                          : 'bg-white/5 text-zinc-400 hover:text-zinc-200 border-white/10'
                      }`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              type="submit"
              disabled={!newCourse.trim()}
              className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20 disabled:opacity-40 active:scale-95"
            >
              <Plus size={14} />
              <span>{t.addCourse} (Sem {activeSemester})</span>
            </button>
          </form>
        </div>

        {/* Right Column: Course Table & Performance Distribution */}
        <div className="lg:col-span-7 flex flex-col gap-5">
          {/* Active Course Ledger */}
          <div className="glass-card p-5 rounded-2xl border-white/10 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BookOpen size={16} className="text-primary" />
                  <span>
                    {viewAllSemesters 
                      ? (language === 'en' ? 'All Completed Courses' : 'Daftar Semua Mata Kuliah') 
                      : `${language === 'en' ? 'Courses Semester' : 'Mata Kuliah Semester'} ${activeSemester}`}
                  </span>
                </h3>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  {activeList.length} {language === 'en' ? 'courses recorded' : 'mata kuliah terdaftar'}
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono font-bold text-white">
                  {activeList.reduce((acc, c) => acc + c.credits, 0)} {t.gradeItemCredits}
                </span>
              </div>
            </div>

            <div className="space-y-2 overflow-y-auto max-h-[380px] custom-scrollbar pr-1">
              {activeList.length === 0 ? (
                <div className="py-12 text-center text-zinc-500">
                  <BookOpen size={32} className="mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-semibold text-zinc-400">
                    {language === 'en' ? 'No courses in this semester' : 'Belum ada mata kuliah di semester ini'}
                  </p>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    {language === 'en' ? 'Add a course or import from your schedule.' : 'Tambahkan mata kuliah baru atau impor dari jadwal.'}
                  </p>
                </div>
              ) : (
                activeList.map(item => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between p-3 rounded-xl bg-zinc-950/40 border border-white/5 hover:border-white/10 transition-all group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-mono font-bold text-xs text-primary shrink-0">
                        {item.letterGrade}
                      </span>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.course}</p>
                        <p className="text-[10px] text-zinc-400 flex items-center gap-1.5 font-mono">
                          <span>{item.credits} {t.gradeItemCredits}</span>
                          <span>•</span>
                          <span>Grade Point: {item.grade.toFixed(2)}</span>
                          {viewAllSemesters && <span>• Sem {item.semester}</span>}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveGrade(item.id)}
                      className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Grade Distribution Visualizer */}
          <div className="glass-card p-5 rounded-2xl border-white/10">
            <h4 className="text-xs font-bold text-zinc-300 uppercase tracking-wider mb-3">
              {language === 'en' ? 'Academic Distribution Pattern' : 'Distribusi Nilai Akademik'}
            </h4>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={10} tickLine={false} />
                  <YAxis stroke="#71717a" fontSize={10} allowDecimals={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '0.75rem', fontSize: '11px' }}
                    labelStyle={{ color: '#fff', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Target GPA Goal Simulator */}
      <div className="glass-card p-6 rounded-2xl border-white/10 bg-gradient-to-r from-zinc-900/90 via-zinc-900/50 to-zinc-900/90">
        <div className="flex items-center gap-2 mb-4">
          <Target className="text-primary" size={20} />
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            {t.targetGpaTitle}
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
          <div>
            <label className="text-xs text-zinc-400 block mb-1 font-semibold">
              {language === 'en' ? 'Target Graduation GPA' : 'Target IPK Kelulusan'}
            </label>
            <input
              type="number"
              step="0.01"
              max={currentSystem.maxGpa}
              min="2.00"
              value={targetGPA}
              onChange={(e) => setTargetGPA(Number(e.target.value))}
              className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 block mb-1 font-semibold">
              {language === 'en' ? 'Total Degree Credits Target' : 'Target Total SKS Kelulusan'}
            </label>
            <input
              type="number"
              value={targetTotalCredits}
              onChange={(e) => setTargetTotalCredits(Number(e.target.value))}
              className="w-full bg-zinc-950/70 border border-white/10 rounded-xl px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-primary"
            />
          </div>

          <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
            <span className="text-[10px] text-zinc-400 font-mono uppercase tracking-wider block">
              {language === 'en' ? 'Required Future Average GPA' : 'IPS Minimal yang Dibutuhkan'}
            </span>
            <span className={`text-2xl font-black font-mono mt-1 inline-block ${
              requiredAverageGPA > currentSystem.maxGpa ? 'text-red-400' : 'text-emerald-400'
            }`}>
              {requiredAverageGPA > 0 ? requiredAverageGPA.toFixed(2) : '-'}
            </span>
            <p className="text-[10px] text-zinc-400 mt-1">
              {remainingCredits} {language === 'en' ? 'credits remaining to complete' : 'SKS tersisa untuk diambil'}
            </p>
          </div>
        </div>
      </div>

      {/* Official Academic Transcript Modal */}
      {showTranscriptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="bg-zinc-900 border border-white/15 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-white/10 flex items-center justify-between bg-zinc-950/50">
              <div className="flex items-center gap-2.5">
                <FileText className="text-primary" size={20} />
                <h3 className="text-base font-bold text-white">{t.transcriptTitle}</h3>
              </div>
              <button
                onClick={() => setShowTranscriptModal(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body / Official Layout */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-zinc-300 font-mono custom-scrollbar">
              <div className="border-b border-zinc-700 pb-4 text-center">
                <h4 className="text-base font-bold text-white uppercase tracking-wider">
                  {userProfile?.university || 'KAMPUSKIT ACADEMIC CONSORTIUM'}
                </h4>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  OFFICIAL RECORD OF ACADEMIC ACHIEVEMENT • STANDAR INTERNASIONAL
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 bg-zinc-950/60 p-4 rounded-xl border border-white/5">
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Candidate / Scholar</span>
                  <span className="font-bold text-white text-sm">{userProfile?.name || 'Mahasiswa'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Degree / Major</span>
                  <span className="font-bold text-white text-sm">{userProfile?.major || 'Undergraduate'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Grading Standard</span>
                  <span className="text-primary font-bold">{currentSystem.name}</span>
                </div>
                <div>
                  <span className="text-[10px] text-zinc-500 uppercase block">Standing / Classification</span>
                  <span className="text-emerald-400 font-bold">{academicHonors.title}</span>
                </div>
              </div>

              <div className="space-y-4">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => {
                  const sGrades = grades.filter(g => g.semester === sem);
                  if (sGrades.length === 0) return null;
                  const sGpa = calcGPA(sGrades);
                  const sCredits = sGrades.reduce((a, b) => a + b.credits, 0);

                  return (
                    <div key={sem} className="border border-white/5 rounded-xl p-3 bg-zinc-950/40">
                      <div className="flex justify-between font-bold text-zinc-200 border-b border-white/5 pb-1 mb-2">
                        <span>SEMESTER {sem}</span>
                        <span className="text-primary font-mono">GPA: {sGpa.toFixed(2)} | {sCredits} Units</span>
                      </div>
                      <div className="space-y-1">
                        {sGrades.map((g, idx) => (
                          <div key={idx} className="flex justify-between text-[11px] text-zinc-400">
                            <span className="truncate pr-2">{idx + 1}. {g.course}</span>
                            <span className="font-mono text-zinc-300 shrink-0">
                              {g.credits} Units • Grade: {g.letterGrade} ({g.grade.toFixed(2)})
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex justify-between items-center text-sm font-bold">
                <span className="text-white">CUMULATIVE GPA (CGPA)</span>
                <span className="text-emerald-400 font-mono text-base">
                  {cumulativeGPA.toFixed(2)} / {currentSystem.maxGpa.toFixed(2)} ({totalCreditsCumulative} Units)
                </span>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-white/10 flex justify-end gap-3 bg-zinc-950/50">
              <button
                onClick={copyTranscriptText}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition-all flex items-center gap-1.5"
              >
                {copiedTranscript ? <Check size={14} className="text-emerald-400" /> : <Download size={14} />}
                <span>{copiedTranscript ? (language === 'en' ? 'Copied to Clipboard!' : 'Tersalin!') : (language === 'en' ? 'Copy Text Record' : 'Salin Teks Transkrip')}</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-4 py-2 rounded-xl bg-primary hover:bg-primary/90 text-white font-bold text-xs transition-all flex items-center gap-1.5 shadow-md"
              >
                <Printer size={14} />
                <span>{language === 'en' ? 'Print / Save PDF' : 'Cetak / Simpan PDF'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
