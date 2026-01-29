// Cloudflare Pages Function: AI Chat
// Path: /api/ai-chat

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { messages, context: chatContext } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500,
                headers: corsHeaders
            });
        }

        const systemPrompt = `You are a viral content strategist and scriptwriter for YouTube and TikTok in January 2026.

You help creators develop viral video ideas and scripts. You are:
- Knowledgeable about current 2026 trends, algorithms, and what's working NOW
- Conversational and fun to talk to
- An expert at hooks, storytelling, and engagement
- Great at understanding what makes content shareable

When helping with scripts:
1. Ask about their niche, target audience, and goals first
2. Suggest unique angles and hooks
3. When they're ready, write complete scripts with:
   - 🎬 TITLE OPTIONS (3 click-worthy titles)
   - 🎯 THE HOOK (scroll-stopping opener)
   - 📜 FULL SCRIPT (conversational, with visual cues)
   - ✨ PRO TIPS (platform-specific advice)

Be helpful, creative, and always think about virality!`;

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...messages
                ],
                temperature: 0.8,
                max_tokens: 2000
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'API request failed');
        }

        return new Response(JSON.stringify({
            reply: data.choices[0]?.message?.content || 'Sorry, I could not generate a response.'
        }), { headers: corsHeaders });

    } catch (error) {
        console.error('AI Chat error:', error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions() {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Allow-Methods': 'POST, OPTIONS'
        }
    });
}
