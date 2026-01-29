// Cloudflare Pages Function: Generate Calendar

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { niche } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500, headers: corsHeaders
            });
        }

        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const types = ['📺 Long-form', '⚡ Short', '🎵 TikTok', '📸 Reel'];

        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    {
                        role: 'system',
                        content: `Generate week of content for ${niche} niche. Return JSON array:
[{"id": "unique-id", "day": "Monday", "title": "Video idea", "type": "📺 Long-form", "status": "idea"}]
Use days: ${days.join(', ')}. Types: ${types.join(', ')}. Generate 7-10 ideas spread across week. Only return JSON.`
                    },
                    { role: 'user', content: `Niche: ${niche}` }
                ],
                temperature: 0.9,
                max_tokens: 800
            })
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        let ideas;
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            ideas = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
            ideas = ideas.map((idea, i) => ({
                ...idea,
                id: idea.id || `idea-${Date.now()}-${i}`,
                status: 'idea'
            }));
        } catch (e) {
            ideas = days.map((day, i) => ({
                id: `idea-${Date.now()}-${i}`,
                day,
                title: `${niche} content for ${day}`,
                type: types[i % types.length],
                status: 'idea'
            }));
        }

        return new Response(JSON.stringify({ ideas }), { headers: corsHeaders });

    } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500, headers: corsHeaders
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
