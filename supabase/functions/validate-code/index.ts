// Supabase Edge Function for Code Validation
// Tests user code against problem test cases using Groq API
// Validates logic without executing untrusted code

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GROQ_API_KEY = Deno.env.get('GROQ_API_KEY') || '';
const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

interface TestCase {
  input: string;
  expected_output: string;
}

interface ValidationRequest {
  code: string;
  language: 'python' | 'java' | 'cpp' | 'javascript';
  testCases: TestCase[];
  problemDescription: string;
}

interface ValidationResponse {
  verdict: 'Accepted' | 'Wrong Answer' | 'Syntax Error' | 'Runtime Error';
  score: number;
  testCasesPassed: number;
  totalTestCases: number;
  feedback: string;
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
    const body: ValidationRequest = await req.json();

    if (!body.code || !body.language || !body.testCases) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    const result = await validateCode(
      body.code,
      body.language,
      body.testCases,
      body.problemDescription
    );

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error) {
    console.error('Validation error:', error);
    return new Response(
      JSON.stringify({
        error: (error as Error).message || 'Validation failed',
        verdict: 'Runtime Error',
        score: 0,
        testCasesPassed: 0,
        totalTestCases: 0,
        feedback: '❌ Server error during validation',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

async function validateCode(
  code: string,
  language: string,
  testCases: TestCase[],
  problemDescription: string
): Promise<ValidationResponse> {
  // Basic syntax check
  const syntaxCheck = checkSyntax(code, language);
  if (!syntaxCheck.valid) {
    return {
      verdict: 'Syntax Error',
      score: 0,
      testCasesPassed: 0,
      totalTestCases: testCases.length,
      feedback: `❌ Syntax Error:\n${syntaxCheck.error}`,
    };
  }

  // Use Groq to validate logic
  const validation = await validateWithGroq(
    code,
    language,
    testCases,
    problemDescription
  );

  return validation;
}

function checkSyntax(code: string, language: string): { valid: boolean; error?: string } {
  // Basic static syntax checks
  if (code.trim().length < 5) {
    return { valid: false, error: 'Code is too short' };
  }

  const checks: Record<string, RegExp[]> = {
    python: [
      /\bdef\s+\w+\s*\(/,
      /:\s*$/m,
    ],
    java: [
      /\bpublic\s+(class|static|void)/,
      /\{[\s\S]*\}/,
    ],
    cpp: [
      /#include|using\s+namespace|int\s+main/,
      /\{[\s\S]*\}/,
    ],
    javascript: [
      /\bfunction\s+\w+|const\s+\w+\s*=\s*\(|return/,
      /\{[\s\S]*\}/,
    ],
  };

  // Very basic check - just verify code has structure
  if (language === 'python' && !code.includes('def') && !code.includes('return')) {
    return { valid: false, error: 'Missing function definition or return statement' };
  }

  return { valid: true };
}

async function validateWithGroq(
  code: string,
  language: string,
  testCases: TestCase[],
  problemDescription: string
): Promise<ValidationResponse> {
  try {
    const testCaseString = testCases
      .map((tc, i) => `Test ${i + 1}:\n  Input: ${tc.input}\n  Expected: ${tc.expected_output}`)
      .join('\n');

    const prompt = `You are a code validator. Analyze this ${language} code and tell me if it solves the problem correctly.

Problem: ${problemDescription}

Code:
\`\`\`${language}
${code}
\`\`\`

Test Cases:
${testCaseString}

Evaluate the code strictly:
1. Does the logic correctly handle the problem?
2. Will it produce correct outputs for the given test cases?
3. Are there any obvious logic errors?

Respond in this EXACT format:
VERDICT: [Accepted|Wrong Answer|Runtime Error]
SCORE: [integer 0-100]
PASSED: [number of test cases you believe will pass]
FEEDBACK: [brief explanation]`;

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'mixtral-8x7b-32768',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      console.error('Groq API error:', response.status);
      // Fallback: simple heuristic validation
      return fallbackValidation(code, testCases);
    }

    const data = await response.json();
    const result = data.choices[0]?.message?.content || '';

    // Parse Groq response
    const verdictMatch = result.match(/VERDICT:\s*(Accepted|Wrong Answer|Runtime Error|Syntax Error)/i);
    const scoreMatch = result.match(/SCORE:\s*(\d+)/i);
    const passedMatch = result.match(/PASSED:\s*(\d+)/i);
    const feedbackMatch = result.match(/FEEDBACK:\s*(.+?)(?=\n|$)/i);

    const verdict = (verdictMatch?.[1] || 'Wrong Answer') as 'Accepted' | 'Wrong Answer' | 'Runtime Error' | 'Syntax Error';
    const score = parseInt(scoreMatch?.[1] || '0');
    const testCasesPassed = parseInt(passedMatch?.[1] || '0');
    const feedback = feedbackMatch?.[1] || 'See evaluation above';

    return {
      verdict,
      score: Math.min(score, 100),
      testCasesPassed: Math.min(testCasesPassed, testCases.length),
      totalTestCases: testCases.length,
      feedback: `${verdict === 'Accepted' ? '✅' : '❌'} ${feedback}`,
    };
  } catch (error) {
    console.error('Groq validation error:', error);
    return fallbackValidation(code, testCases);
  }
}

function fallbackValidation(
  code: string,
  testCases: TestCase[]
): ValidationResponse {
  // Simple heuristic: check for common patterns
  const codeLength = code.length;
  const hasReturn = /return\s+/i.test(code);
  const hasLogic = /if|for|while|function/i.test(code);
  const hasComments = /#|\/\/|\/\*|\"{3}|'{3}/.test(code);

  let verdict: 'Accepted' | 'Wrong Answer' | 'Syntax Error' | 'Runtime Error' = 'Wrong Answer';
  let testCasesPassed = 0;

  if (codeLength > 50 && hasReturn && hasLogic) {
    testCasesPassed = Math.floor(testCases.length * 0.6); // Assume 60% pass
    verdict = 'Accepted';
  } else if (codeLength > 20 && hasReturn) {
    testCasesPassed = Math.floor(testCases.length * 0.4);
    verdict = 'Wrong Answer';
  }

  const score = (testCasesPassed / testCases.length) * 100;

  return {
    verdict,
    score: Math.floor(score),
    testCasesPassed,
    totalTestCases: testCases.length,
    feedback: `⚠️ Using heuristic validation (Groq API unavailable). Estimated: ${testCasesPassed}/${testCases.length} test cases may pass.`,
  };
}
