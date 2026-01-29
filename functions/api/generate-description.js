// Cloudflare Pages Function: Generate Description

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { title, topic, platform, includeTimestamps, includeCTA } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500, headers: corsHeaders
            });
        }

        let instructions = `Write SEO video description for ${platform}.
Title: ${title}
${topic ? `Topic: ${topic}` : ''}`;

        if (includeTimestamps) instructions += '\nInclude 5-7 realistic timestamps.';
        if (includeCTA) instructions += '\nInclude subscribe, like, comment CTAs.';

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
                        content: 'Write engaging, SEO-optimized video descriptions. Start with compelling hook. Use keywords naturally. Add hashtags at end.'
                    },
                    { role: 'user', content: instructions }
                ],
                temperature: 0.8,
                max_tokens: 800
            })
        });

        const data = await response.json();
        const description = data.choices[0]?.message?.content || '';

        return new Response(JSON.stringify({ description }), { headers: corsHeaders });

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
