import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface ProfileRow {
  id: string;
  name: string;
  branch: string;
  year: number;
  interests: string[];
  career_path: string | null;
  exploring_branches: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface SkillRow {
  id: string;
  name: string;
  description: string;
  order_index: number;
  career_path: string;
  prerequisites: string[];
}

export interface UserSkillRow {
  id: string;
  user_id: string;
  skill_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface LearningResourceRow {
  id: string;
  skill_id: string;
  type: 'video' | 'documentation' | 'course';
  title: string;
  url: string;
  platform: string;
  rating: number | null;
}

export interface ProjectRow {
  id: string;
  title: string;
  description: string;
  required_skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: string;
  department: string;
  career_path: string;
}

export interface UserProjectRow {
  id: string;
  user_id: string;
  project_id: string;
  completed: boolean;
  completed_at: string | null;
}

export interface InternshipRow {
  id: string;
  company: string;
  role: string;
  location: string;
  type: 'remote' | 'onsite' | 'hybrid';
  required_skills: string[];
  trust_score: number;
  duration: string;
  stipend: string | null;
  department: string;
  career_path: string;
  apply_url: string;
}

export interface InterviewSessionRow {
  id: string;
  user_id: string;
  career_path: string;
  score: number;
  total_questions: number;
  questions: string[];
  answers: string[];
  feedback: string[];
  summary: string | null;
  created_at: string;
}

export interface CertificationRow {
  id: string;
  user_id: string;
  name: string;
  issuer: string;
  issue_date: string;
  url: string | null;
  created_at: string;
}

export interface AptitudeQuestionRow {
  id: string;
  category: 'logical' | 'quantitative' | 'verbal' | 'analytical';
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

export interface TechnicalQuestionRow {
  id: string;
  department: string;
  career_path: string;
  category: string;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
  difficulty: 'easy' | 'medium' | 'hard';
  created_at: string;
  updated_at: string;
}

export interface JobRow {
  id: string;
  title: string;
  company: string;
  location: string;
  type: 'remote' | 'onsite' | 'hybrid';
  experience_level: 'entry' | 'mid' | 'senior';
  required_skills: string[];
  salary_min: number | null;
  salary_max: number | null;
  salary_currency: string;
  description: string | null;
  department: string;
  career_path: string;
  posted_date: string;
  apply_url: string;
  company_size: string | null;
  benefits: string[] | null;
  created_at: string;
}

export interface JobApplicationRow {
  id: string;
  user_id: string;
  job_id: string;
  status: 'applied' | 'interviewing' | 'offer' | 'rejected';
  applied_date: string;
  updated_date: string | null;
  notes: string | null;
  created_at: string;
}

// ── Competition Row Types ──────────────────────────────────

export interface CompetitionRow {
  id: string;
  week_number: number;
  title: string;
  description: string;
  status: 'upcoming' | 'live' | 'ended';
  start_time: string;
  end_time: string;
  created_at: string;
}

export interface CompetitionProblemRow {
  id: string;
  competition_id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  time_limit: number;
  memory_limit: number;
  test_cases: Array<{ input: string; expected_output: string }>;
  accepted_count: number;
  created_at: string;
}

export interface SubmissionRow {
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
  created_at: string;
}

export interface CompetitionScoreRow {
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

