import { checkRateLimit, rateLimitResponse, errorResponse, getResponseHeaders, sanitizeInput } from './_utils.js';

export async function onRequestPost(context) {
    const { request, env } = context;

    // CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: getResponseHeaders() });
    }

    // Rate limiting (30 requests per minute per IP)
    const ip = request.headers.get('cf-connecting-ip') || 'unknown';
    const rateResult = checkRateLimit(ip, 30, 60000);

    if (!rateResult.allowed) {
        return rateLimitResponse(rateResult);
    }

    try {
        const { messages, context: chatContext } = await request.json();

        if (!messages || !Array.isArray(messages)) {
            return errorResponse('Messages array is required', 400, rateResult);
        }

        // Sanitize messages
        const sanitizedMessages = messages.map(m => ({
            role: m.role === 'user' ? 'user' : m.role === 'assistant' ? 'assistant' : 'system',
            content: sanitizeInput(m.content, 4000)
        }));

        const groqApiKey = env.GROQ_API_KEY;
        if (!groqApiKey) {
            return errorResponse('AI service not configured', 500, rateResult);
        }

        // Build system prompt based on context
        // Supercharged "Claude + Gemini" System Prompt
        let systemPrompt = `You are an elite YouTube Strategist AI (v2026 Pro). You combine the analytical depth of a data scientist with the creative genius of a top-tier scriptwriter.
Your goal: Help the user dominate their niche.
Style: Concise, high-energy, no fluff. Use capital letters for emphasis instead of bolding. DO NOT use asterisks (*).
Knowledge Base: retention editing, CTR psychology, pacing, pattern interrupts, and community building.`;

        // Context-specific advanced prompts
        if (chatContext === 'script') {
            systemPrompt = `You are a World-Class Viral Scriptwriter. Do not write generic scripts. Write scripts that HOOK viewers instantly.

RULES FOR SCRIPTS:
1. THE HOOK (0-5s): MUST be visually describing a "Pattern Interrupt" or a bold claim. No "Hey guys welcome back".
2. PACING: Change the visual/angle every 3-5 seconds. Mark this with [VISUAL CUE].
3. RETENTION: build "Open Loops" (questions not answered until the end).
4. TONE: Conversational, punchy, high energy. Short sentences.
5. STRUCTURE:
   - HOOK: deeply primal/emotional or shocking.
   - THE PROMISE: What they will get (quickly).
   - CONTENT: High value, fast moving.
   - CTA: Natural, not beggy.

FORMAT:
Use [BRACKETS] for visual instructions.
Write the spoken words in clear text.
DO NOT use asterisks or markdown symbols.`;

        } else if (chatContext === 'competitor') {
            systemPrompt = `You are a Competitive Intelligence Agent. Your job is to dissect competitors and find their WEAKNESSES.
            
ANALYSIS FRAMEWORK:
1. Content Gaps: What are they NOT converting? (Read between the lines).
2. Audience Sentiment: What are people complaining about in their comments?
3. Packaging: Why did their best video go viral? (Thumbnail + Title psych).
4. Strategy: How can the user "Steal Like an Artist" - take the concept but make it 10x better?

OUTPUT STYLE:
- KILLER FEATURE: The one thing they do best.
- ACHILLES HEEL: Their biggest weakness.
- ATTACK PLAN: 3 steps to beat them.
DO NOT use asterisks.`;

        } else if (chatContext === 'video') {
            systemPrompt = `You are a Master Video Analyst. You don't just watch videos; you deconstruct the psychology behind them.

DECONSTRUCTION PROTOCOL:
1. The 3-Second Rule: Analyze exactly why the first 3 seconds worked.
2. Retention Spikes: Identify moments of high engagement (visual changes, sound effects, story twists).
3. Psychological Triggers: Curiosity gaps, FOMO, relatable humor, controversy.
4. Recreation Blueprint: precise steps to make a BETTER version.

Provide a "Recreation Difficulty" rating (1-10) and an "Estimated Budget".
DO NOT use asterisks.`;
        }

        // Ensure system message is first
        if (sanitizedMessages[0]?.role !== 'system') {
            sanitizedMessages.unshift({ role: 'system', content: systemPrompt });
        }

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: sanitizedMessages,
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            const errorData = await response.text();
            console.error('Groq API error:', errorData);
            return errorResponse('AI service temporarily unavailable', 503, rateResult);
        }

        const data = await response.json();
        let aiMessage = data.choices?.[0]?.message?.content || 'I could not generate a response.';

        // Post-processing to remove any stray asterisks
        aiMessage = aiMessage.replace(/\*/g, '');

        return new Response(JSON.stringify({
            message: aiMessage,
            reply: aiMessage  // For backward compatibility
        }), {
            headers: getResponseHeaders(rateResult)
        });

    } catch (error) {
        console.error('AI chat error:', error);
        return errorResponse('Failed to process request', 500);
    }
}

export async function onRequestOptions() {
    return new Response(null, { headers: getResponseHeaders() });
}
