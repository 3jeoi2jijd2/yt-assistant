// Cloudflare Pages Function - AI Chat
// POST /api/ai-chat

export async function onRequest(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (context.request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (context.request.method !== 'POST') {
        return new Response(JSON.stringify({ error: 'Method not allowed' }), {
            status: 405,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

    try {
        const groqKey = context.env.GROQ_API_KEY;
        if (!groqKey) {
            throw new Error('Missing Groq API key');
        }

        const { messages, context: chatContext } = await context.request.json();

        if (!messages || !Array.isArray(messages)) {
            return new Response(JSON.stringify({ error: 'Messages required' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        // Build system prompt based on context
        let systemPrompt = 'You are a helpful AI assistant for YouTube and TikTok content creators.';

        if (chatContext?.mode === 'script_generation') {
            systemPrompt = `You are a viral video script expert for YouTube and TikTok (January 2026).
            
Your job is to help creators write VIRAL scripts that:
1. Hook viewers in the first 3 seconds
2. Use proven viral formulas (curiosity gaps, pattern interrupts, emotional triggers)
3. Include specific timestamps and visual cues
4. Are optimized for watch time and engagement

When the user gives you a topic, ask clarifying questions about:
- Their niche and target audience
- Video length (short-form or long-form)
- Tone (educational, entertaining, controversial)
- Platform (YouTube vs TikTok)

When generating scripts, format them with:
🎬 TITLE OPTIONS (3 viral title options)
🎯 HOOK (first 3-5 seconds - CRITICAL for retention)
📜 FULL SCRIPT (with timestamps like [0:00], [0:30], [1:00])
🔥 VIRAL ELEMENTS (what makes this script likely to go viral)
💡 FILMING TIPS (how to shoot this for maximum impact)

Be specific, creative, and focus on what's currently trending in 2026.`;
        }

        // Add system message if not present
        const allMessages = messages[0]?.role === 'system'
            ? messages
            : [{ role: 'system', content: systemPrompt }, ...messages];

        // Call Groq AI
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${groqKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: allMessages.map(m => ({
                    role: m.role === 'system' ? 'system' : m.role === 'user' ? 'user' : 'assistant',
                    content: m.content
                })),
                temperature: 0.8,
                max_tokens: 1500
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('Groq error:', errText);
            throw new Error('AI service error');
        }

        const data = await response.json();
        const aiMessage = data.choices?.[0]?.message?.content || 'I could not generate a response.';

        // Return both 'message' and 'reply' for compatibility
        return new Response(JSON.stringify({
            message: aiMessage,
            reply: aiMessage  // For Script Generator compatibility
        }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });

    } catch (error) {
        console.error('AI Chat error:', error);
        return new Response(JSON.stringify({ error: error.message || 'Failed to chat' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }
}
