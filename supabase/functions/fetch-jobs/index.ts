// Supabase Edge Function to fetch real Indian jobs
// This runs on the server, avoiding CORS issues

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const ADZUNA_APP_ID = Deno.env.get('ADZUNA_APP_ID') || 'test';
const ADZUNA_API_KEY = Deno.env.get('ADZUNA_API_KEY') || 'test';

interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  type: string;
  salary_min?: number;
  salary_max?: number;
  description: string;
  url: string;
  posted_date: string;
}

serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const careerPath = url.searchParams.get('careerPath') || 'developer';

    // Map career paths to search keywords
    const keywords: Record<string, string> = {
      'Frontend Developer': 'frontend developer',
      'Backend Developer': 'backend developer',
      'Full Stack Developer': 'full stack developer',
      'Data Scientist': 'data scientist',
      'Mobile App Developer': 'mobile developer',
      'DevOps Engineer': 'devops engineer',
      'UI/UX Designer': 'ui ux designer',
      'Cybersecurity Analyst': 'security analyst',
      'Cloud Architect': 'cloud architect',
      'AI/ML Engineer': 'machine learning engineer',
    };

    const searchTerm = keywords[careerPath] || careerPath;

    // Fetch from Adzuna API (free tier: 1000 calls/month)
    const adzunaUrl = `https://api.adzuna.com/v1/api/jobs/in/search/1?app_id=${ADZUNA_APP_ID}&app_key=${ADZUNA_API_KEY}&what=${encodeURIComponent(searchTerm)}&results_per_page=50&sort_by=date`;

    const response = await fetch(adzunaUrl);

    if (!response.ok) {
      throw new Error(`Adzuna API error: ${response.status}`);
    }

    const data = await response.json();
    const jobs: Job[] = (data.results || []).map((job: any) => ({
      id: `adzuna-${job.id}`,
      title: job.title,
      company: job.company.display_name || 'Company',
      location: job.location.display_name || 'India',
      type: job.contract_time === 'full_time' ? 'remote' : 'onsite',
      salary_min: job.salary_min ? Math.round(job.salary_min) : undefined,
      salary_max: job.salary_max ? Math.round(job.salary_max) : undefined,
      description: job.description || '',
      url: job.redirect_url,
      posted_date: job.created,
    }));

    // Filter for Indian locations
    const indianJobs = jobs.filter(job =>
      job.location.toLowerCase().includes('india') ||
      job.location.toLowerCase().includes('bangalore') ||
      job.location.toLowerCase().includes('mumbai') ||
      job.location.toLowerCase().includes('delhi') ||
      job.location.toLowerCase().includes('hyderabad') ||
      job.location.toLowerCase().includes('pune') ||
      job.location.toLowerCase().includes('chennai')
    );

    return new Response(
      JSON.stringify({ jobs: indianJobs }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
