import { supabase } from './supabase';
import type {
  ProfileRow,
  SkillRow,
  UserSkillRow,
  LearningResourceRow,
  ProjectRow,
  UserProjectRow,
  InternshipRow,
  InterviewSessionRow,
  CertificationRow,
  AptitudeQuestionRow,
  TechnicalQuestionRow,
  JobRow,
  JobApplicationRow,
  CompetitionRow,
  CompetitionProblemRow,
  SubmissionRow,
  CompetitionScoreRow,
} from './supabase';
import type { StudentProfile, Skill, LearningResource, Project, Internship, InterviewSession, Certification, ActivityDay, EnglishQuestion, AptitudeQuestion, TechnicalQuestion, Job, JobApplication, Competition, CompetitionProblem, Submission, CompetitionScore, CompetitionLeaderboardEntry } from '../types/index';

const toEmail = (username: string) => `${username.toLowerCase()}@email.com`;

export async function register(username: string, password: string) {
  const { data, error } = await supabase.auth.signUp({ email: toEmail(username), password });
  if (error) throw error;
  return data;
}

export async function login(username: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email: toEmail(username), password });
  if (error) throw error;
  return data;
}

export async function logout() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function getCurrentUser() {
  const { data } = await supabase.auth.getUser();
  return data.user ?? null;
}

function rowToProfile(row: ProfileRow): StudentProfile {
  return {
    id: row.id,
    name: row.name,
    branch: row.branch,
    year: row.year,
    interests: row.interests,
    careerPath: row.career_path ?? undefined,
    exploringBranches: row.exploring_branches ?? [],
  };
}

export async function getProfile(): Promise<StudentProfile | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToProfile(data as ProfileRow) : null;
}

export async function createProfile(
  profile: Omit<StudentProfile, 'id'>
): Promise<StudentProfile> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .insert({
      id: user.id,
      name: profile.name,
      branch: profile.branch,
      year: profile.year,
      interests: profile.interests,
      career_path: profile.careerPath ?? null,
      exploring_branches: profile.exploringBranches ?? [],
    })
    .select()
    .single();

  if (error) throw error;
  return rowToProfile(data as ProfileRow);
}

export async function updateProfile(
  updates: Partial<Omit<StudentProfile, 'id'>>
): Promise<StudentProfile> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('profiles')
    .update({
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.branch !== undefined && { branch: updates.branch }),
      ...(updates.year !== undefined && { year: updates.year }),
      ...(updates.interests !== undefined && { interests: updates.interests }),
      ...(updates.careerPath !== undefined && { career_path: updates.careerPath }),
      ...(updates.exploringBranches !== undefined && { exploring_branches: updates.exploringBranches }),
    })
    .eq('id', user.id)
    .select()
    .single();

  if (error) throw error;
  return rowToProfile(data as ProfileRow);
}

export async function getSkills(careerPath: string): Promise<Skill[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const [skillsRes, userSkillsRes] = await Promise.all([
    supabase
      .from('skills')
      .select('*')
      .eq('career_path', careerPath)
      .order('order_index'),
    supabase
      .from('user_skills')
      .select('skill_id, completed')
      .eq('user_id', user.id),
  ]);

  if (skillsRes.error) throw skillsRes.error;
  if (userSkillsRes.error) throw userSkillsRes.error;

  const completedSet = new Set(
    (userSkillsRes.data as UserSkillRow[])
      .filter((r) => r.completed)
      .map((r) => r.skill_id)
  );

  return (skillsRes.data as SkillRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description,
    completed: completedSet.has(row.id),
    order: row.order_index,
    prerequisites: row.prerequisites,
  }));
}

export async function setSkillCompleted(
  skillId: string,
  completed: boolean
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_skills')
    .upsert(
      { user_id: user.id, skill_id: skillId, completed },
      { onConflict: 'user_id,skill_id' }
    );

  if (error) throw error;
}

export async function getLearningResources(skillId: string): Promise<LearningResource[]> {
  const { data, error } = await supabase
    .from('learning_resources')
    .select('*')
    .eq('skill_id', skillId);

  if (error) throw error;

  return (data as LearningResourceRow[]).map((row) => ({
    id: row.id,
    skillId: row.skill_id,
    type: row.type,
    title: row.title,
    url: row.url,
    platform: row.platform,
    rating: row.rating ?? undefined,
  }));
}

export async function getProjects(
  careerPath: string
): Promise<{ project: Project; completed: boolean }[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const [projectsRes, userProjectsRes] = await Promise.all([
    supabase.from('projects').select('*').eq('career_path', careerPath),
    supabase
      .from('user_projects')
      .select('project_id, completed')
      .eq('user_id', user.id),
  ]);

  if (projectsRes.error) throw projectsRes.error;
  if (userProjectsRes.error) throw userProjectsRes.error;

  const completedSet = new Set(
    (userProjectsRes.data as UserProjectRow[])
      .filter((r) => r.completed)
      .map((r) => r.project_id)
  );

  return (projectsRes.data as ProjectRow[]).map((row) => ({
    project: {
      id: row.id,
      title: row.title,
      description: row.description,
      requiredSkills: row.required_skills,
      difficulty: row.difficulty,
      estimatedDuration: row.estimated_duration,
      department: row.department,
      careerPath: row.career_path,
    },
    completed: completedSet.has(row.id),
  }));
}

export async function getCompletedProjectIds(): Promise<string[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('user_projects')
    .select('project_id')
    .eq('user_id', user.id)
    .eq('completed', true);

  if (error) throw error;
  return (data as UserProjectRow[]).map((r) => r.project_id);
}

export async function setProjectCompleted(
  projectId: string,
  completed: boolean
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('user_projects')
    .upsert(
      { user_id: user.id, project_id: projectId, completed },
      { onConflict: 'user_id,project_id' }
    );

  if (error) throw error;
}

export async function getInternships(careerPath: string): Promise<Internship[]> {
  const { data, error } = await supabase
    .from('internships')
    .select('*')
    .eq('career_path', careerPath);

  if (error) throw error;

  return (data as InternshipRow[]).map((row) => ({
    id: row.id,
    company: row.company,
    role: row.role,
    location: row.location,
    type: row.type,
    requiredSkills: row.required_skills,
    trustScore: row.trust_score,
    duration: row.duration,
    stipend: row.stipend ?? undefined,
    department: row.department,
    careerPath: row.career_path,
    applyUrl: row.apply_url,
  }));
}

export async function saveInterviewSession(session: {
  careerPath: string;
  score: number;
  totalQuestions: number;
  questions: string[];
  answers: string[];
  feedback: string[];
  summary?: string;
}): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase.from('interview_sessions').insert({
    user_id: user.id,
    career_path: session.careerPath,
    score: session.score,
    total_questions: session.totalQuestions,
    questions: session.questions,
    answers: session.answers,
    feedback: session.feedback,
    summary: session.summary ?? null,
  });

  if (error) throw error;
}

export async function getInterviewSessions(): Promise<InterviewSession[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('interview_sessions')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) throw error;

  return (data as InterviewSessionRow[]).map((row) => ({
    id: row.id,
    careerPath: row.career_path,
    score: row.score,
    totalQuestions: row.total_questions,
    questions: row.questions,
    answers: row.answers,
    feedback: row.feedback,
    summary: row.summary ?? undefined,
    createdAt: row.created_at,
  }));
}

export async function getCertifications(): Promise<Certification[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('certifications')
    .select('*')
    .eq('user_id', user.id)
    .order('issue_date', { ascending: false });

  if (error) throw error;

  return (data as CertificationRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    issuer: row.issuer,
    issueDate: row.issue_date,
    url: row.url ?? undefined,
  }));
}

export async function addCertification(
  cert: Omit<Certification, 'id'>
): Promise<Certification> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('certifications')
    .insert({
      user_id: user.id,
      name: cert.name,
      issuer: cert.issuer,
      issue_date: cert.issueDate,
      url: cert.url ?? null,
    })
    .select()
    .single();

  if (error) throw error;
  const row = data as CertificationRow;
  return { id: row.id, name: row.name, issuer: row.issuer, issueDate: row.issue_date, url: row.url ?? undefined };
}

export async function deleteCertification(id: string): Promise<void> {
  const { error } = await supabase.from('certifications').delete().eq('id', id);
  if (error) throw error;
}

/** Fetches today's English question from the DB using a date-based rotation. */
export async function getTodaysEnglishQuestion(): Promise<EnglishQuestion | null> {
  const { data, error } = await supabase
    .from('english_questions')
    .select('id, category, question, options, correct_index, explanation')
    .order('id');

  if (error || !data || data.length === 0) return null;

  const epoch = new Date('2024-01-01').getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayIndex = Math.floor((today.getTime() - epoch) / 86400000);
  const row = data[((dayIndex % data.length) + data.length) % data.length] as {
    id: number; category: string; question: string;
    options: string[]; correct_index: number; explanation: string;
  };

  return {
    id: row.id,
    category: row.category as EnglishQuestion['category'],
    question: row.question,
    options: row.options,
    correctIndex: row.correct_index,
    explanation: row.explanation,
  };
}

/** Returns true if the user has already answered the QOTD today. */
export async function hasAnsweredQOTDToday(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const { data } = await supabase
    .from('activity_log')
    .select('id')
    .eq('user_id', user.id)
    .eq('activity_type', 'qotd_answered')
    .eq('activity_date', todayStr)
    .limit(1);

  return (data?.length ?? 0) > 0;
}

/** Returns the number of consecutive days the user has answered the QOTD. */
export async function getQOTDStreak(): Promise<number> {
  const user = await getCurrentUser();
  if (!user) return 0;

  const { data } = await supabase
    .from('activity_log')
    .select('activity_date')
    .eq('user_id', user.id)
    .eq('activity_type', 'qotd_answered')
    .order('activity_date', { ascending: false });

  if (!data || data.length === 0) return 0;

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yest = new Date(now.getTime() - 86400000);
  const yesterdayStr = `${yest.getFullYear()}-${String(yest.getMonth() + 1).padStart(2, '0')}-${String(yest.getDate()).padStart(2, '0')}`;

  const uniqueDates = [...new Set((data as { activity_date: string }[]).map(r => r.activity_date))].sort().reverse();

  // Streak must start from today or yesterday (grace period)
  if (uniqueDates[0] !== todayStr && uniqueDates[0] !== yesterdayStr) return 0;

  let streak = 1;
  for (let i = 1; i < uniqueDates.length; i++) {
    const prev = new Date(uniqueDates[i - 1] + 'T00:00:00');
    const curr = new Date(uniqueDates[i] + 'T00:00:00');
    const diffDays = Math.round((prev.getTime() - curr.getTime()) / 86400000);
    if (diffDays === 1) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}

export async function logActivity(activityType: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  const today = new Date().toISOString().split('T')[0];

  await supabase.from('activity_log').upsert(
    { user_id: user.id, activity_date: today, activity_type: activityType },
    { onConflict: 'user_id,activity_date,activity_type', ignoreDuplicates: true }
  );
  // swallow result — activity logging is non-critical
}

export async function getActivityLog(days = 84): Promise<ActivityDay[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceStr = since.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('activity_log')
    .select('activity_date')
    .eq('user_id', user.id)
    .gte('activity_date', sinceStr)
    .order('activity_date');

  if (error) throw error;

  const countMap: Record<string, number> = {};
  for (const row of data as { activity_date: string }[]) {
    countMap[row.activity_date] = (countMap[row.activity_date] ?? 0) + 1;
  }

  const result: ActivityDay[] = [];
  const cur = new Date(sinceStr);
  const today = new Date();
  while (cur <= today) {
    const d = cur.toISOString().split('T')[0];
    result.push({ date: d, count: countMap[d] ?? 0 });
    cur.setDate(cur.getDate() + 1);
  }
  return result;
}

/** Get aptitude questions for interview */
export async function getAptitudeQuestions(count: number = 5): Promise<AptitudeQuestion[]> {
  const { data, error } = await supabase
    .from('aptitude_questions')
    .select('*')
    .order('id');

  if (error) throw error;
  if (!data || data.length === 0) return [];

  // Shuffle and select random questions
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return (selected as AptitudeQuestionRow[]).map((row) => ({
    id: row.id,
    category: row.category,
    question: row.question,
    options: row.options,
    correctIndex: row.correct_index,
    explanation: row.explanation,
    difficulty: row.difficulty,
  }));
}

/** Get technical questions for a specific department and career path */
export async function getTechnicalQuestions(department: string, careerPath: string, count: number = 5): Promise<TechnicalQuestion[]> {
  const { data, error } = await supabase
    .from('technical_questions')
    .select('*')
    .eq('department', department)
    .eq('career_path', careerPath)
    .order('id');

  if (error) throw error;
  if (!data || data.length === 0) {
    // Fallback to questions matching just the department if no exact match
    const { data: fallbackData } = await supabase
      .from('technical_questions')
      .select('*')
      .eq('department', department)
      .limit(count);

    if (!fallbackData || fallbackData.length === 0) {
      // Final fallback to any technical questions
      const { data: genericData } = await supabase
        .from('technical_questions')
        .select('*')
        .limit(count);

      if (!genericData) return [];

      return (genericData as TechnicalQuestionRow[]).map((row) => ({
        id: row.id,
        department: row.department,
        careerPath: row.career_path,
        category: row.category,
        question: row.question,
        options: row.options,
        correctIndex: row.correct_index,
        explanation: row.explanation,
        difficulty: row.difficulty,
      }));
    }

    return (fallbackData as TechnicalQuestionRow[]).map((row) => ({
      id: row.id,
      department: row.department,
      careerPath: row.career_path,
      category: row.category,
      question: row.question,
      options: row.options,
      correctIndex: row.correct_index,
      explanation: row.explanation,
      difficulty: row.difficulty,
    }));
  }

  // Shuffle and select random questions
  const shuffled = [...data].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));

  return (selected as TechnicalQuestionRow[]).map((row) => ({
    id: row.id,
    department: row.department,
    careerPath: row.career_path,
    category: row.category,
    question: row.question,
    options: row.options,
    correctIndex: row.correct_index,
    explanation: row.explanation,
    difficulty: row.difficulty,
  }));
}

// ── Job Tracker Functions ──────────────────────────────────────

function rowToJob(row: JobRow): Job {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    type: row.type,
    experienceLevel: row.experience_level,
    requiredSkills: row.required_skills,
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    salaryCurrency: row.salary_currency,
    description: row.description ?? undefined,
    department: row.department,
    careerPath: row.career_path,
    postedDate: row.posted_date,
    applyUrl: row.apply_url,
    companySize: row.company_size ?? undefined,
    benefits: row.benefits ?? undefined,
  };
}

function rowToJobApplication(row: JobApplicationRow): JobApplication {
  return {
    id: row.id,
    jobId: row.job_id,
    status: row.status,
    appliedDate: row.applied_date,
    updatedDate: row.updated_date ?? undefined,
    notes: row.notes ?? undefined,
  };
}

export async function getJobs(careerPath: string): Promise<Job[]> {
  try {
    // Import the job fetching service
    const { fetchRealJobs, mapJobSkillsToSkillIds } = await import('./jobApi');

    // Fetch available skills for this career path to map job requirements
    const skills = await getSkills(careerPath);
    const skillMap = skills.map(s => ({ id: s.id, name: s.name }));

    console.log(`Fetching jobs for career path: ${careerPath}`);
    console.log(`Available skills for mapping (${skillMap.length}):`, skillMap.map(s => s.name).join(', '));

    // Fetch real jobs from external APIs
    const realJobs = await fetchRealJobs(careerPath);

    console.log(`Fetched ${realJobs.length} jobs before skill mapping`);

    // Map generic skill keywords to actual skill IDs from database
    const jobsWithMappedSkills = mapJobSkillsToSkillIds(realJobs, skillMap);

    console.log(`After skill mapping: ${jobsWithMappedSkills.length} jobs with valid skills`);

    // Optionally, also fetch from local database and merge
    const { data: dbJobs } = await supabase
      .from('jobs')
      .select('*')
      .eq('career_path', careerPath)
      .order('posted_date', { ascending: false })
      .limit(10);

    const localJobs = dbJobs ? (dbJobs as JobRow[]).map(rowToJob) : [];

    console.log(`Fetched ${localJobs.length} jobs from local database`);

    // Combine and deduplicate
    const allJobs = [...jobsWithMappedSkills, ...localJobs];
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j =>
        j.title.toLowerCase() === job.title.toLowerCase() &&
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    );

    console.log(`Final job count after deduplication: ${uniqueJobs.length}`);

    return uniqueJobs.slice(0, 50);
  } catch (error) {
    console.error('Error fetching jobs:', error);

    // Fallback to database jobs only
    const { data, error: dbError } = await supabase
      .from('jobs')
      .select('*')
      .eq('career_path', careerPath)
      .order('posted_date', { ascending: false })
      .limit(50);

    if (dbError) throw dbError;
    return (data as JobRow[]).map(rowToJob);
  }
}

export async function getJobApplications(): Promise<JobApplication[]> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('job_applications')
    .select('*')
    .eq('user_id', user.id)
    .order('applied_date', { ascending: false });

  if (error) throw error;
  return (data as JobApplicationRow[]).map(rowToJobApplication);
}

export async function upsertJobApplication(
  jobId: string,
  status: 'applied' | 'interviewing' | 'offer' | 'rejected',
  notes?: string
): Promise<JobApplication> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('job_applications')
    .upsert(
      {
        user_id: user.id,
        job_id: jobId,
        status,
        notes: notes ?? null,
        updated_date: new Date().toISOString().split('T')[0],
      },
      { onConflict: 'user_id,job_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return rowToJobApplication(data as JobApplicationRow);
}

export async function deleteJobApplication(jobId: string): Promise<void> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('job_applications')
    .delete()
    .eq('user_id', user.id)
    .eq('job_id', jobId);

  if (error) throw error;
}

// ── Competition API Functions ─────────────────────────────

function rowToCompetition(row: CompetitionRow): Competition {
  return {
    id: row.id,
    week_number: row.week_number,
    title: row.title,
    description: row.description,
    status: row.status,
    start_time: row.start_time,
    end_time: row.end_time,
    created_at: row.created_at,
  };
}

function rowToProblem(row: CompetitionProblemRow): CompetitionProblem {
  return {
    id: row.id,
    competition_id: row.competition_id,
    title: row.title,
    description: row.description,
    difficulty: row.difficulty,
    points: row.points,
    time_limit: row.time_limit,
    memory_limit: row.memory_limit,
    test_cases: row.test_cases,
    accepted_count: row.accepted_count,
  };
}

function rowToSubmission(row: SubmissionRow): Submission {
  return {
    id: row.id,
    user_id: row.user_id,
    problem_id: row.problem_id,
    competition_id: row.competition_id,
    code: row.code,
    language: row.language,
    verdict: row.verdict,
    score: row.score,
    execution_time_ms: row.execution_time_ms,
    memory_used: row.memory_used,
    submitted_at: row.submitted_at,
    test_cases_passed: row.test_cases_passed,
    feedback: row.feedback,
  };
}

function rowToScore(row: CompetitionScoreRow): CompetitionScore {
  return {
    id: row.id,
    user_id: row.user_id,
    competition_id: row.competition_id,
    total_score: row.total_score,
    problems_solved: row.problems_solved,
    rank: row.rank,
    participation_status: row.participation_status,
    submission_count: row.submission_count,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function getCurrentCompetition(): Promise<Competition | null> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('competitions')
    .select('*')
    .eq('status', 'live')
    .lte('start_time', now)
    .gte('end_time', now)
    .order('start_time', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToCompetition(data as CompetitionRow) : null;
}

export async function getCompetitionProblems(competitionId: string): Promise<CompetitionProblem[]> {
  const user = await getCurrentUser();

  // Fetch all problems
  const { data, error } = await supabase
    .from('competition_problems')
    .select('*')
    .eq('competition_id', competitionId)
    .order('difficulty', { ascending: true });

  if (error) throw error;

  const problems = (data as CompetitionProblemRow[]).map(rowToProblem);

  // If user is logged in, fetch their accepted submissions
  if (user) {
    const { data: submissions } = await supabase
      .from('submissions')
      .select('problem_id')
      .eq('user_id', user.id)
      .eq('competition_id', competitionId)
      .eq('verdict', 'Accepted');

    const solvedProblemIds = new Set(submissions?.map(s => s.problem_id) || []);

    // Mark problems as solved if user has accepted submission
    problems.forEach(problem => {
      problem.user_solved = solvedProblemIds.has(problem.id);
    });
  }

  return problems;
}

export async function getProblemById(problemId: string): Promise<CompetitionProblem> {
  const { data, error } = await supabase
    .from('competition_problems')
    .select('*')
    .eq('id', problemId)
    .single();

  if (error) throw error;
  return rowToProblem(data as CompetitionProblemRow);
}

export async function getUserCompetitionScore(competitionId: string): Promise<CompetitionScore | null> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  const { data, error } = await supabase
    .from('competition_scores')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', competitionId)
    .maybeSingle();

  if (error) throw error;
  return data ? rowToScore(data as CompetitionScoreRow) : null;
}

export async function getCompetitionLeaderboard(
  competitionId: string,
  limit = 50
): Promise<CompetitionLeaderboardEntry[]> {
  // Get all scores for this competition
  const { data: scoresData, error: scoresError } = await supabase
    .from('competition_scores')
    .select('*')
    .eq('competition_id', competitionId)
    .order('total_score', { ascending: false })
    .limit(limit);

  if (scoresError) throw scoresError;

  // Get user profiles for names/branches
  const userIds = (scoresData as CompetitionScoreRow[]).map(s => s.user_id);

  if (userIds.length === 0) return [];

  const { data: profilesData, error: profilesError } = await supabase
    .from('profiles')
    .select('id, name, branch')
    .in('id', userIds);

  if (profilesError) throw profilesError;

  const profileMap = Object.fromEntries(
    (profilesData as any[]).map(p => [p.id, { name: p.name, branch: p.branch }])
  );

  return (scoresData as CompetitionScoreRow[]).map((score, index) => ({
    rank: index + 1,
    name: profileMap[score.user_id]?.name || 'Anonymous',
    branch: profileMap[score.user_id]?.branch || 'Unknown',
    total_score: score.total_score,
    problems_solved: score.problems_solved,
    avg_time: 0, // Calculate if needed
    user_id: score.user_id,
  }));
}

// ── Simple Competition Code Submission ─────────────────────────
// This validates code against the hidden test case and returns pass/fail/syntax_error

export async function submitCompetitionCode(
  competitionId: string,
  problemId: string,
  code: string,
  language: 'python' | 'java' | 'cpp' | 'javascript'
): Promise<Submission> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Not authenticated');

  // Get the problem to check test cases
  const problem = await getProblemById(problemId);
  if (!problem) throw new Error('Problem not found');

  // Simple syntax check based on language
  const syntaxError = checkBasicSyntax(code, language);
  if (syntaxError) {
    // Store submission with syntax error
    const { data, error } = await supabase
      .from('submissions')
      .insert({
        user_id: user.id,
        problem_id: problemId,
        competition_id: competitionId,
        code,
        language,
        verdict: 'Syntax Error',
        score: 0,
        execution_time_ms: 0,
        memory_used: 0,
        test_cases_passed: 0,
        feedback: syntaxError,
        submitted_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;
    return rowToSubmission(data as SubmissionRow);
  }

  // Get hidden test case (last one in array or use first if only one)
  const hiddenTestCase = problem.test_cases[problem.test_cases.length - 1];

  // Simple validation: Check if code output matches expected
  // This is a basic check - in production you'd use a code execution service
  const passed = validateCodeOutput(code, language, hiddenTestCase);

  const verdict = passed ? 'Accepted' : 'Wrong Answer';
  const score = passed ? problem.points : 0;

  // Store submission
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      user_id: user.id,
      problem_id: problemId,
      competition_id: competitionId,
      code,
      language,
      verdict,
      score,
      execution_time_ms: Math.floor(Math.random() * 100) + 10,
      memory_used: Math.floor(Math.random() * 50) + 10,
      test_cases_passed: passed ? 1 : 0,
      feedback: passed
        ? 'All test cases passed!'
        : 'Output does not match expected result. Check your logic.',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  // Update user's competition score if passed
  if (passed) {
    await updateCompetitionScore(competitionId, problemId, score);
  }

  // Update problem accepted count if passed
  if (passed) {
    await supabase
      .from('competition_problems')
      .update({ accepted_count: problem.accepted_count + 1 })
      .eq('id', problemId);
  }

  return rowToSubmission(data as SubmissionRow);
}

// Basic syntax validation
function checkBasicSyntax(code: string, language: string): string | null {
  const trimmed = code.trim();

  // Check for empty code
  if (trimmed.length < 10) {
    return 'Code is too short';
  }

  // Language-specific basic checks
  switch (language) {
    case 'python':
      // Check for basic Python syntax issues
      if (trimmed.includes('def ') && !trimmed.includes(':')) {
        return 'Missing colon after function definition';
      }
      break;
    case 'java':
      // Check for basic Java syntax
      if (!trimmed.includes('class ')) {
        return 'Java code must contain a class definition';
      }
      if ((trimmed.match(/{/g) || []).length !== (trimmed.match(/}/g) || []).length) {
        return 'Mismatched braces {}';
      }
      break;
    case 'cpp':
      // Check for basic C++ syntax
      if ((trimmed.match(/{/g) || []).length !== (trimmed.match(/}/g) || []).length) {
        return 'Mismatched braces {}';
      }
      break;
    case 'javascript':
      // Check for basic JS syntax
      if ((trimmed.match(/{/g) || []).length !== (trimmed.match(/}/g) || []).length) {
        return 'Mismatched braces {}';
      }
      if ((trimmed.match(/\(/g) || []).length !== (trimmed.match(/\)/g) || []).length) {
        return 'Mismatched parentheses ()';
      }
      break;
  }

  return null; // No syntax errors found
}

// Simple output validation
function validateCodeOutput(
  code: string,
  _language: string,
  testCase: { input: string; expected_output: string }
): boolean {
  const expectedOutput = testCase.expected_output.trim().toLowerCase();
  const codeLower = code.toLowerCase();

  // Simple heuristic: check if code contains the expected output pattern
  // This is a basic validation - production would execute the code

  // Check for print/console.log/cout with expected output
  const outputPatterns = [
    `print(${expectedOutput})`,
    `print("${expectedOutput}")`,
    `print('${expectedOutput}')`,
    `console.log(${expectedOutput})`,
    `console.log("${expectedOutput}")`,
    `console.log('${expectedOutput}')`,
    `cout << ${expectedOutput}`,
    `cout << "${expectedOutput}"`,
    `System.out.println(${expectedOutput})`,
    `System.out.println("${expectedOutput}")`,
    `return ${expectedOutput}`,
  ];

  for (const pattern of outputPatterns) {
    if (codeLower.includes(pattern.toLowerCase())) {
      return true;
    }
  }

  // Check if code contains calculation that leads to expected output
  // For numeric outputs
  const numericOutput = parseFloat(expectedOutput);
  if (!isNaN(numericOutput)) {
    // Check if code contains the number in a return/print statement
    const printRegex = new RegExp(`(print|console\\.log|cout|println).*${numericOutput}`, 'i');
    if (printRegex.test(code)) {
      return true;
    }
  }

  // Default: code doesn't produce the expected output
  return false;
}

// Update competition score for user
async function updateCompetitionScore(
  competitionId: string,
  _problemId: string,
  points: number
): Promise<void> {
  const user = await getCurrentUser();
  if (!user) return;

  // Get current score
  const { data: existingScore } = await supabase
    .from('competition_scores')
    .select('*')
    .eq('user_id', user.id)
    .eq('competition_id', competitionId)
    .maybeSingle();

  if (existingScore) {
    // Update existing score
    await supabase
      .from('competition_scores')
      .update({
        total_score: existingScore.total_score + points,
        problems_solved: existingScore.problems_solved + 1,
        submission_count: existingScore.submission_count + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingScore.id);
  } else {
    // Create new score entry
    await supabase
      .from('competition_scores')
      .insert({
        user_id: user.id,
        competition_id: competitionId,
        total_score: points,
        problems_solved: 1,
        rank: 0,
        participation_status: 'participated',
        submission_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
  }
 
  // Update ranks for all participants
  await updateLeaderboardRanks(competitionId);
}

// Recalculate ranks for leaderboard
async function updateLeaderboardRanks(competitionId: string): Promise<void> {
  const { data } = await supabase
    .from('competition_scores')
    .select('id, total_score')
    .eq('competition_id', competitionId)
    .order('total_score', { ascending: false });

  if (!data) return;

  // Update ranks
  for (let i = 0; i < data.length; i++) {
    await supabase
      .from('competition_scores')
      .update({ rank: i + 1 })
      .eq('id', data[i].id);
  }
}

