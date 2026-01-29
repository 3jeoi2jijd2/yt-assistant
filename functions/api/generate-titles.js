// Cloudflare Pages Function: Generate Titles

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { topic, platform, style } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500, headers: corsHeaders
            });
        }

        const styleGuides = {
            curiosity: 'Use curiosity gaps: "What happens when...", "The truth about..."',
            listicle: 'Use numbers: "7 Ways to...", "10 Mistakes That..."',
            howto: 'Educational: "How to...", "The Ultimate Guide to..."',
            controversial: 'Bold takes: "Why everyone is wrong about..."',
            emotional: 'Emotional words: "heartbreaking", "life-changing"',
            urgency: 'Time-sensitive: "Before it\'s too late", "You need to know NOW"'
        };

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
                        content: `Generate 8 viral titles. Style: ${styleGuides[style] || styleGuides.curiosity}. Platform: ${platform}. Return only titles, one per line, no numbering.`
                    },
                    { role: 'user', content: `Topic: "${topic}"` }
                ],
                temperature: 0.9,
                max_tokens: 500
            })
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        const titles = content.split('\n')
            .map(l => l.trim().replace(/^[-•*\d.)\s]+/, '').replace(/^["']|["']$/g, ''))
            .filter(l => l.length > 5)
            .slice(0, 8);

        return new Response(JSON.stringify({ titles }), { headers: corsHeaders });

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
