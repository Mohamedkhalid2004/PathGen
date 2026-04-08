// Real job data fetching service for Indian jobs
import type { Job } from '../types';

// Map career paths to job search keywords
const careerPathKeywords: Record<string, string[]> = {
  'Frontend Developer': ['frontend', 'react', 'vue', 'angular', 'javascript', 'web developer'],
  'Backend Developer': ['backend', 'node', 'python', 'java', 'api developer', 'server'],
  'Full Stack Developer': ['full stack', 'fullstack', 'mern', 'mean'],
  'Data Scientist': ['data scientist', 'machine learning', 'data analyst', 'ml engineer'],
  'Mobile App Developer': ['android', 'ios', 'react native', 'flutter', 'mobile developer'],
  'DevOps Engineer': ['devops', 'cloud engineer', 'kubernetes', 'docker', 'aws'],
  'UI/UX Designer': ['ui designer', 'ux designer', 'product designer', 'graphic designer'],
  'Cybersecurity Analyst': ['security analyst', 'cybersecurity', 'infosec', 'penetration tester'],
  'Cloud Architect': ['cloud architect', 'solutions architect', 'aws architect', 'azure'],
  'AI/ML Engineer': ['ai engineer', 'ml engineer', 'artificial intelligence', 'deep learning'],
};

// Common skill keywords that might appear in job descriptions
// This is used to extract potential skills from job posts
const commonSkillKeywords = [
  'react', 'reactjs', 'react.js', 'vue', 'vuejs', 'angular',
  'javascript', 'js', 'typescript', 'ts',
  'node', 'nodejs', 'node.js', 'express', 'nestjs',
  'python', 'django', 'flask', 'fastapi',
  'java', 'spring', 'spring boot', 'j2ee',
  'c++', 'c#', '.net', 'asp.net',
  'sql', 'mysql', 'postgresql', 'mongodb', 'database',
  'html', 'css', 'sass', 'tailwind',
  'aws', 'amazon web services', 'azure', 'gcp', 'google cloud',
  'docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd',
  'git', 'github', 'gitlab', 'version control',
  'rest', 'api', 'graphql', 'microservices',
  'machine learning', 'ml', 'ai', 'deep learning', 'tensorflow', 'pytorch',
  'data analysis', 'pandas', 'numpy', 'scikit-learn',
  'android', 'ios', 'swift', 'kotlin', 'react native', 'flutter',
  'testing', 'jest', 'pytest', 'junit', 'selenium',
  'agile', 'scrum', 'jira', 'communication'
];

//  Fetch jobs using CORS proxy (to avoid CORS issues)
async function fetchFromAdzunaWithProxy(keywords: string[]): Promise<any[]> {
  try {
    // Using Adzuna India API with CORS proxy
    // Try the first keyword (most specific)
    const searchTerm = keywords[0] || 'developer';
    // Free CORS proxy - you can replace with your own backend
    const proxyUrl = 'https://corsproxy.io/?';
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=test&app_key=test&what=${encodeURIComponent(searchTerm)}&results_per_page=30&sort_by=relevance`;

    const response = await fetch(proxyUrl + encodeURIComponent(adzunaUrl));

    if (!response.ok) return [];

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('Adzuna API error:', error);
    return [];
  }
}

// Fetch jobs from The Muse API (CORS-friendly)
async function fetchFromTheMuse(keywords: string[]): Promise<any[]> {
  try {
    const searchTerm = keywords[0] || 'developer';
    const response = await fetch(
      `https://www.themuse.com/api/public/jobs?category=${encodeURIComponent(searchTerm)}&location=India&page=0&descending=true&page_size=20`
    );

    if (!response.ok) return [];

    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error('The Muse API error:', error);
    return [];
  }
}


// Extract skill keywords from job description
// Returns array of potential skill keywords found in the description
function extractSkillKeywords(description: string, tags: string[] = []): string[] {
  const foundKeywords: string[] = [];
  const searchText = `${description} ${tags.join(' ')}`.toLowerCase();

  for (const keyword of commonSkillKeywords) {
    // Use word boundary matching to avoid partial matches
    const regex = new RegExp(`\\b${keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(searchText)) {
      foundKeywords.push(keyword);
    }
  }

  return foundKeywords;
}

// Normalize job data to our Job interface
function normalizeJob(rawJob: any, source: string, careerPath: string, department: string): Job {
  const now = new Date();

  // Generate consistent ID
  const id = `${source}-${rawJob.id || rawJob.slug || Math.random().toString(36).substr(2, 9)}`;

  // Extract location info
  let location = 'India';
  let type: 'remote' | 'onsite' | 'hybrid' = 'remote';

  if (source === 'adzuna') {
    location = rawJob.location?.display_name || 'India';
    type = rawJob.contract_time === 'full_time' ? 'remote' : 'onsite';
  } else if (source === 'themuse') {
    location = rawJob.locations?.[0]?.name || 'India';
    type = 'onsite';
  }

  // Extract salary (convert to INR if needed)
  let salaryMin: number | undefined;
  let salaryMax: number | undefined;

  if (source === 'adzuna') {
    // Adzuna already returns INR for India
    salaryMin = rawJob.salary_min ? Math.round(rawJob.salary_min) : undefined;
    salaryMax = rawJob.salary_max ? Math.round(rawJob.salary_max) : undefined;
  } else if (source === 'themuse') {
    // The Muse typically doesn't provide salary
    salaryMin = undefined;
    salaryMax = undefined;
  }

  // Estimate salary range if not provided (based on experience level)
  if (!salaryMin && !salaryMax) {
    salaryMin = 300000; // 3 LPA
    salaryMax = 1200000; // 12 LPA
  }

  // Extract skill keywords (not IDs yet - will be mapped later)
  const tags = rawJob.tags || rawJob.levels || [];
  const requiredSkills = extractSkillKeywords(rawJob.description || '', tags);

  // Determine experience level
  let experienceLevel: 'entry' | 'mid' | 'senior' = 'entry';
  const titleLower = (rawJob.title || '').toLowerCase();
  if (titleLower.includes('senior') || titleLower.includes('lead')) {
    experienceLevel = 'senior';
  } else if (titleLower.includes('mid') || titleLower.includes('intermediate')) {
    experienceLevel = 'mid';
  }

  // Posted date
  const postedDate = rawJob.created || rawJob.publication_date || now.toISOString();

  // Extract company info
  let company = 'Tech Company';
  let companySize: string | undefined;

  if (source === 'adzuna') {
    company = rawJob.company?.display_name || 'Tech Company';
  } else if (source === 'themuse') {
    company = rawJob.company?.name || 'Tech Company';
    companySize = rawJob.company?.size || undefined;
  }

  return {
    id,
    title: rawJob.title || 'Developer Position',
    company,
    location,
    type,
    experienceLevel,
    requiredSkills,
    salaryMin,
    salaryMax,
    salaryCurrency: 'INR',
    description: (rawJob.description || rawJob.contents || '').slice(0, 500) || 'Join our team and work on exciting projects.',
    department,
    careerPath,
    postedDate,
    applyUrl: rawJob.redirect_url || rawJob.refs?.landing_page || '#',
    companySize,
    benefits: ['Flexible Hours', 'Remote Work', 'Health Insurance'],
  };
}

/**
 * Fetch real Indian jobs for a given career path
 */
export async function fetchRealJobs(careerPath: string, department: string = 'Computer Science'): Promise<Job[]> {
  const keywords = careerPathKeywords[careerPath] || [careerPath];

  console.log(`Fetching jobs for career path: ${careerPath}`, keywords);

  try {
    // Fetch from multiple sources in parallel
    const [adzunaJobs, museJobs] = await Promise.all([
      fetchFromAdzunaWithProxy(keywords),
      fetchFromTheMuse(keywords),
    ]);

    console.log(`Fetched ${adzunaJobs.length} jobs from Adzuna, ${museJobs.length} from The Muse`);

    // Normalize all jobs
    const allJobs: Job[] = [
      ...adzunaJobs.map(job => normalizeJob(job, 'adzuna', careerPath, department)),
      ...museJobs.map(job => normalizeJob(job, 'themuse', careerPath, department)),
    ];

    // Remove duplicates based on title and company
    const uniqueJobs = allJobs.filter((job, index, self) =>
      index === self.findIndex(j =>
        j.title.toLowerCase() === job.title.toLowerCase() &&
        j.company.toLowerCase() === job.company.toLowerCase()
      )
    );

    console.log(`After deduplication: ${uniqueJobs.length} unique jobs`);

    // Sort by posted date (newest first)
    uniqueJobs.sort((a, b) =>
      new Date(b.postedDate).getTime() - new Date(a.postedDate).getTime()
    );

    return uniqueJobs.slice(0, 50); // Limit to 50 jobs
  } catch (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }
}

export function mapJobSkillsToSkillIds(jobs: Job[], availableSkills: Array<{id: string, name: string}>): Job[] {
  const validJobs: Job[] = [];

  for (const job of jobs) {
    // Map skill keywords to actual skill IDs
    const mappedSkills: string[] = [];

    for (const skillKeyword of job.requiredSkills) {
      // Try exact match first (case-insensitive)
      let skill = availableSkills.find(s =>
        s.name.toLowerCase() === skillKeyword.toLowerCase()
      );

      // If no exact match, try partial match (either way)
      if (!skill) {
        skill = availableSkills.find(s =>
          s.name.toLowerCase().includes(skillKeyword.toLowerCase()) ||
          skillKeyword.toLowerCase().includes(s.name.toLowerCase())
        );
      }

      // If found, add the skill ID (avoid duplicates)
      if (skill && !mappedSkills.includes(skill.id)) {
        mappedSkills.push(skill.id);
      }
    }

    // Only include jobs that have at least 1 mapped skill
    // This filters out irrelevant jobs with no skill matches
    if (mappedSkills.length > 0) {
      validJobs.push({ ...job, requiredSkills: mappedSkills });
    } else {
      // Log jobs that were filtered out for debugging
      console.debug(`Filtered out job "${job.title}" - no skill matches found`);
    }
  }

  return validJobs;
}
