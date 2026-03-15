import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

const RATE_LIMIT_HOURLY = 5;
const RATE_LIMIT_DAILY = 20;
const PRO_ROLES = ['premium', 'editor', 'admin', 'superadmin'];

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}

function stripTags(text: string): string {
  return text.replace(/<[^>]*>/g, '').trim();
}

interface QuizQuestion {
  question_text: string;
  answer_text: string;
  answer_explanation: string;
  category: string;
  points: number;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  // Authenticate user via JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return jsonResponse({ error: 'Missing authorization header' }, 401);
  }

  const supabaseAdmin = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);
  const supabaseUser = createClient(SUPABASE_URL!, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  });

  const { data: { user }, error: authError } = await supabaseUser.auth.getUser();
  if (authError || !user) {
    return jsonResponse({ error: 'Unauthorized' }, 401);
  }

  // Check Pro role
  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile || !PRO_ROLES.includes(profile.role)) {
    return jsonResponse({ error: 'Pro subscription required' }, 403);
  }

  // Parse and validate request body
  let topic: string;
  let questionCount: number;
  let difficulty: string;

  try {
    const body = await req.json();
    topic = String(body.topic || '').trim();
    questionCount = Number(body.questionCount) || 10;
    difficulty = String(body.difficulty || 'medium').toLowerCase();

    if (!topic || topic.length > 200) {
      return jsonResponse({ error: 'Topic is required (max 200 characters)' }, 400);
    }
    if (questionCount < 5 || questionCount > 20) {
      return jsonResponse({ error: 'Question count must be between 5 and 20' }, 400);
    }
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      return jsonResponse({ error: 'Difficulty must be easy, medium, or hard' }, 400);
    }
  } catch {
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }

  // Rate limiting (admin bypasses)
  if (!['admin', 'superadmin'].includes(profile.role)) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    const { count: hourlyCount } = await supabaseAdmin
      .from('ai_generation_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneHourAgo);

    if ((hourlyCount ?? 0) >= RATE_LIMIT_HOURLY) {
      return jsonResponse({
        error: 'Rate limit exceeded',
        detail: `Maximum ${RATE_LIMIT_HOURLY} generations per hour`,
      }, 429);
    }

    const { count: dailyCount } = await supabaseAdmin
      .from('ai_generation_log')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', oneDayAgo);

    if ((dailyCount ?? 0) >= RATE_LIMIT_DAILY) {
      return jsonResponse({
        error: 'Rate limit exceeded',
        detail: `Maximum ${RATE_LIMIT_DAILY} generations per day`,
      }, 429);
    }
  }

  // Call Claude API
  if (!ANTHROPIC_API_KEY) {
    return jsonResponse({ error: 'AI service not configured' }, 500);
  }

  const difficultyGuide = {
    easy: 'Simple, straightforward questions suitable for beginners or casual players. Use common knowledge.',
    medium: 'Moderately challenging questions that require some knowledge. Mix of common and specific facts.',
    hard: 'Challenging questions that test deep knowledge. Include specific details, dates, lesser-known facts.',
  };

  const prompt = `Generate exactly ${questionCount} quiz questions about "${topic}".

Difficulty: ${difficulty} — ${difficultyGuide[difficulty as keyof typeof difficultyGuide]}

Requirements:
- Each question must have a clear, unambiguous answer
- Vary the categories/subtopics within the main topic
- Questions should be factual and verifiable
- Include a brief explanation for each answer (1-2 sentences)
- Assign point values: easy=10, medium=20, hard=30 based on individual question difficulty
- Categories should be specific subtopics of "${topic}" (e.g., if topic is "Space", categories might be "Planets", "Space Exploration", "Stars")

Return ONLY a JSON array with this exact structure, no other text:
[
  {
    "question_text": "What is...?",
    "answer_text": "The answer",
    "answer_explanation": "Brief explanation of why this is correct",
    "category": "Subtopic Category",
    "points": 10
  }
]`;

  try {
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!claudeResponse.ok) {
      const errBody = await claudeResponse.text();
      console.error('Claude API error:', errBody);
      return jsonResponse({ error: 'AI generation failed' }, 502);
    }

    const claudeData = await claudeResponse.json();
    const content = claudeData.content?.[0]?.text || '';

    // Extract JSON from response (handle possible markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      console.error('No JSON array found in response:', content.substring(0, 200));
      return jsonResponse({ error: 'AI returned invalid format' }, 502);
    }

    const questions: QuizQuestion[] = JSON.parse(jsonMatch[0]);

    // Validate response shape
    if (!Array.isArray(questions) || questions.length === 0) {
      return jsonResponse({ error: 'AI returned empty result' }, 502);
    }

    const validated = questions.map((q) => ({
      question_text: stripTags(String(q.question_text || '')),
      answer_text: stripTags(String(q.answer_text || '')),
      answer_explanation: stripTags(String(q.answer_explanation || '')),
      category: stripTags(String(q.category || 'General')),
      points: [10, 20, 30].includes(q.points) ? q.points : 10,
    }));

    // Log generation
    await supabaseAdmin.from('ai_generation_log').insert({
      user_id: user.id,
      topic,
      question_count: validated.length,
      difficulty,
    });

    return jsonResponse({ questions: validated });
  } catch (err) {
    console.error('Generation error:', err);
    return jsonResponse({ error: 'Failed to generate quiz' }, 500);
  }
});
