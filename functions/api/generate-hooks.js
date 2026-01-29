// Cloudflare Pages Function: Generate Hooks

export async function onRequestPost(context) {
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    try {
        const { topic, hookType, duration } = await context.request.json();
        const apiKey = context.env.GROQ_API_KEY;

        if (!apiKey) {
            return new Response(JSON.stringify({ error: 'API key not configured' }), {
                status: 500, headers: corsHeaders
            });
        }

        const hookGuides = {
            question: 'Provocative questions they MUST know the answer to',
            statistic: 'Shocking statistics or numbers',
            story: 'Start mid-story: "So there I was..."',
            controversy: 'Challenge beliefs: "Everyone thinks X but..."',
            promise: 'Bold promises: "By the end of this..."',
            pov: 'POV format: "POV: You just discovered..."'
        };

        const durationGuides = {
            short: '1-2 sentences, under 3 seconds',
            medium: '2-3 sentences, 5 seconds',
            long: '3-4 sentences, 10 seconds'
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
                        content: `Generate 5 scroll-stopping hooks. Style: ${hookGuides[hookType] || hookGuides.question}. Length: ${durationGuides[duration] || durationGuides.short}. Return only hooks, one per line, no numbering.`
                    },
                    { role: 'user', content: `Topic: "${topic}"` }
                ],
                temperature: 0.9,
                max_tokens: 600
            })
        });

        const data = await response.json();
        const content = data.choices[0]?.message?.content || '';
        const hooks = content.split('\n')
            .map(l => l.trim().replace(/^[-•*\d.)\s]+/, '').replace(/^["']|["']$/g, ''))
            .filter(l => l.length > 10)
            .slice(0, 5);

        return new Response(JSON.stringify({ hooks }), { headers: corsHeaders });

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
