export interface StudentProfile {
  id: string;
  name: string;
  branch: string;
  year: number;
  interests: string[];
  careerPath?: string;
  exploringBranches?: string[];
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  completed: boolean;
  order: number;
  prerequisites: string[];
}

export interface LearningResource {
  id: string;
  skillId: string;
  type: 'video' | 'documentation' | 'course';
  title: string;
  url: string;
  platform: string;
  rating?: number;
}

export interface WeeklyTask {
  week: number;
  skill: string;
  skillId: string;
  description: string;
  estimatedHours: number;
}

export interface Project {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: string;
  department: string;
  careerPath: string;
}

export interface Internship {
  id: string;
  company: string;
  role: string;
  location: string;
  type: 'remote' | 'onsite' | 'hybrid';
  requiredSkills: string[];
  trustScore: number;
  duration: string;
  stipend?: string;
  department: string;
  careerPath: string;
  applyUrl: string;
}

export interface Progress {
  totalSkills: number;
  completedSkills: number;
  completedProjects: number;
  currentWeek: number;
  percentageComplete: number;
}

export interface ReadinessStatus {
  isReady: boolean;
  missingSkills: string[];
  missingProjects: number;
  message: string;
}

export interface InterviewSession {
  id: string;
  careerPath: string;
  score: number;
  totalQuestions: number;
  questions: string[];
  answers: string[];
  feedback: string[];
  summary?: string;
  createdAt: string;
  rounds?: InterviewRound[];
  aptitudeScore?: number;
  technicalScore?: number;
  aiScore?: number;
}

export interface Certification {
  id: string;
  name: string;
  issuer: string;
  issueDate: string;
  url?: string;
}

export interface ActivityDay {
  date: string;
  count: number;
}

export interface EnglishQuestion {
  id: number;
  category: 'vocabulary' | 'grammar' | 'synonym' | 'antonym' | 'idiom' | 'spelling';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AptitudeQuestion {
  id: string;
  category: 'logical' | 'quantitative' | 'verbal' | 'analytical';
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface TechnicalQuestion {
  id: string;
  department: string;
  careerPath: string;
  category: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface InterviewRound {
  roundType: 'aptitude' | 'technical' | 'ai';
  score: number;
  totalQuestions: number;
  questions: string[];
  answers: (string | number)[];
  feedback?: string[];
  completedAt: string;
}

export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'remote' | 'onsite' | 'hybrid';
  experienceLevel: 'entry' | 'mid' | 'senior';
  requiredSkills: string[];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency: string;
  description?: string;
  department: string;
  careerPath: string;
  postedDate: string;
  applyUrl: string;
  companySize?: string;
  benefits?: string[];
}

export interface JobApplication {
  id: string;
  jobId: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected';
  appliedDate: string;
  updatedDate?: string;
  notes?: string;
}

export interface JobWithMatch {
  job: Job;
  matchPercentage: number;
  matchedSkillsCount: number;
  totalSkillsCount: number;
  missingSkills: Skill[];
  matchCategory: 'ready' | 'almost' | 'future';
  application?: JobApplication;
}

// ── Competition Types ──────────────────────────────────────

export interface TestCase {
  input: string;
  expected_output: string;
}

export interface Competition {
  id: string;
  week_number: number;
  title: string;
  description: string;
  status: 'upcoming' | 'live' | 'ended';
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface CompetitionProblem {
  id: string;
  competition_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit: number;
  memory_limit: number;
  test_cases: TestCase[];
  accepted_count: number;
  user_solved?: boolean; // Whether current user has solved this problem
}

export interface Submission {
  id: string;
  user_id: string;
  problem_id: string;
  competition_id: string;
  code: string;
  language: 'python' | 'java' | 'cpp' | 'javascript';
  verdict: 'Accepted' | 'Wrong Answer' | 'Syntax Error' | 'Runtime Error' | 'Pending';
  score: number;
  execution_time_ms: number;
  memory_used: number;
  submitted_at: string;
  test_cases_passed: number;
  feedback: string;
}

export interface CompetitionScore {
  id: string;
  user_id: string;
  competition_id: string;
  total_score: number;
  problems_solved: number;
  rank: number;
  participation_status: 'participated' | 'not_participated';
  submission_count: number;
  created_at: string;
  updated_at: string;
}

export interface CompetitionLeaderboardEntry {
  rank: number;
  name: string;
  branch: string;
  total_score: number;
  problems_solved: number;
  avg_time: number;
  user_id: string;
}

