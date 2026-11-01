export type CurriculumDomain = 'AKADEMIK' | 'PRIBADI' | 'HYBRID';
export type CurriculumDifficulty = 'PEMULA' | 'MENENGAH' | 'MAHIR';

export interface ChapterQuiz {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
  explanation: string;
}

export interface CurriculumChapter {
  id: string;
  chapterNumber: number;
  title: string;
  summary: string;
  estimatedMinutes: number;
  mentalModel: string;
  studyContent: string;
  studyMethod: string;
  actionTask: {
    text: string;
    completed: boolean;
  };
  reflectionPrompt: string;
  userNote?: string;
  quiz: ChapterQuiz[];
  quizScore?: number;
  isCompleted: boolean;
  completedAt?: number;
}

export interface Curriculum {
  id: string;
  title: string;
  domain: CurriculumDomain;
  category: string;
  difficulty: CurriculumDifficulty;
  targetDuration: string;
  description: string;
  learningOutcomes: string[];
  prerequisites?: string[];
  chapters: CurriculumChapter[];
  progress: number;
  isCompleted: boolean;
  createdAt: number;
  updatedAt: number;
  lastStudiedChapterIndex?: number;
  totalStudyMinutes?: number;
  source?: 'DEFAULT' | 'CUSTOM_AI' | 'USER';
}

export interface GenerateCurriculumParams {
  topic: string;
  domain: CurriculumDomain;
  difficulty: CurriculumDifficulty;
  targetWeeks: number;
  focusGoal?: string;
  background?: string;
}
