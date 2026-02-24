export type Role =
  | "frontend-dev"
  | "backend-dev"
  | "fullstack-dev"
  | "ml-engineer"
  | "data-scientist"
  | "devops"
  | "core-electronics"
  | "product-manager"
  | "mobile-dev"
  | "qa-engineer";

export type ExperienceLevel = "fresher" | "1-3" | "3-5" | "5+";
export type InterviewType = "hr" | "technical" | "mixed" | "coding";
export type Difficulty = "easy" | "medium" | "hard";
export type CompanyMode = "google" | "amazon" | "tcs" | "generic";

export interface InterviewConfig {
  role: Role;
  experienceLevel: ExperienceLevel;
  interviewType: InterviewType;
  difficulty: Difficulty;
  companyMode: CompanyMode;
  resumeText?: string;
  resumeSkills?: string[];
  resumeProjects?: string[];
}

export interface InterviewQuestion {
  id: string;
  question: string;
  type: InterviewType;
  difficulty: Difficulty;
  category: string;
  isResumeSpecific?: boolean;
  codeTemplate?: string;
  codingLanguage?: string;
  testCases?: TestCase[];
  constraints?: string;
  examples?: string;
}

export interface TestCase {
  input: string;
  expectedOutput: string;
  description: string;
}

export interface QuestionScore {
  technical: number;
  communication: number;
  confidence: number;
  problemSolving: number;
  overall: number;
}

export interface QuestionFeedback {
  questionId: string;
  question: string;
  answer: string;
  scores: QuestionScore;
  strengths: string[];
  improvements: string[];
  idealAnswer: string;
}

export interface InterviewSession {
  id: string;
  config: InterviewConfig;
  questions: InterviewQuestion[];
  responses: QuestionFeedback[];
  currentQuestionIndex: number;
  startTime: number;
  endTime?: number;
  overallScores?: QuestionScore;
  behavioralObservations?: string[];
  resumeInsights?: string[];
}

export interface SessionHistoryEntry {
  id: string;
  date: string;
  config: InterviewConfig;
  overallScores: QuestionScore;
  totalQuestions: number;
}

export const ROLE_LABELS: Record<Role, string> = {
  "frontend-dev": "Frontend Developer",
  "backend-dev": "Backend Developer",
  "fullstack-dev": "Full-Stack Developer",
  "ml-engineer": "ML Engineer",
  "data-scientist": "Data Scientist",
  "devops": "DevOps Engineer",
  "core-electronics": "Core Electronics",
  "product-manager": "Product Manager",
  "mobile-dev": "Mobile Developer",
  "qa-engineer": "QA Engineer",
};

export const EXPERIENCE_LABELS: Record<ExperienceLevel, string> = {
  fresher: "Fresher (0-1 yr)",
  "1-3": "1-3 Years",
  "3-5": "3-5 Years",
  "5+": "5+ Years",
};

export const INTERVIEW_TYPE_LABELS: Record<InterviewType, string> = {
  hr: "HR Round",
  technical: "Technical",
  mixed: "Mixed",
  coding: "Coding",
};

export const DIFFICULTY_LABELS: Record<Difficulty, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
};

export const COMPANY_MODE_LABELS: Record<CompanyMode, string> = {
  google: "Google-style (DSA Heavy)",
  amazon: "Amazon-style (Leadership Principles)",
  tcs: "TCS-style (HR Heavy)",
  generic: "Generic",
};
