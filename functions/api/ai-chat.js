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
        let systemPrompt = `You are a helpful YouTube content strategist AI assistant (Jan 2026). 
You help creators make viral videos, write scripts, analyze content, and grow their channels.
Be specific, actionable, and encouraging. Use emojis occasionally but not excessively.`;

        // Context-specific prompts
        if (chatContext === 'script') {
            systemPrompt = `You are a viral video script writer AI (Jan 2026). When asked to write scripts:
1. Always start with a pattern interrupt hook
2. Use conversational, punchy language
3. Include timestamps and visual cues
4. Add call-to-actions
5. Format with clear sections: HOOK, CONTENT, CTA
Be creative and make scripts that would perform well on YouTube.`;
        } else if (chatContext === 'competitor') {
            systemPrompt = `You are a YouTube competitive analysis expert (Jan 2026). Help users:
1. Identify competitor weaknesses
2. Find content gaps to exploit
3. Suggest differentiation strategies
4. Analyze what makes competitors successful
Be strategic and specific with actionable advice.`;
        } else if (chatContext === 'video') {
            systemPrompt = `You are a video analysis expert (Jan 2026). Help users understand:
1. Why videos go viral
2. How to recreate successful content
3. Technical aspects (editing, equipment, etc.)
4. Content structure and pacing
Provide specific, practical advice.`;
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
        const aiMessage = data.choices?.[0]?.message?.content || 'I could not generate a response.';

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
