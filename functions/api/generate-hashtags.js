// Cloudflare Pages Function: Generate Hashtags

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { topic, platform } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500, headers: corsHeaders
            });
        }

        const counts = { youtube: 15, tiktok: 8, instagram: 20, twitter: 5 };
        const count = counts[platform] || 15;

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
                        content: `Generate ${count} hashtags for ${platform}. Return JSON array: [{"tag": "#hashtag", "popularity": "high/medium/low"}]. Mix popularity levels. Only return JSON.`
                    },
                    { role: 'user', content: `Topic: "${topic}"` }
                ],
                temperature: 0.7,
                max_tokens: 500
            })
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';

        let hashtags;
        try {
            const jsonMatch = content.match(/\[[\s\S]*\]/);
            hashtags = jsonMatch ? JSON.parse(jsonMatch[0]) : [];
        } catch (e) {
            hashtags = content.split('\n')
                .filter(l => l.includes('#'))
                .map(l => ({ tag: l.match(/#[\w]+/)?.[0] || l.trim(), popularity: 'medium' }));
        }

        return new Response(JSON.stringify({ hashtags }), { headers: corsHeaders });

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
