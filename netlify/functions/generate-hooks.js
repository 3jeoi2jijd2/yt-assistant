// Generate scroll-stopping hooks using Groq AI

export async function handler(event) {
    const headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    if (event.httpMethod === 'OPTIONS') {
        return { statusCode: 200, headers, body: '' };
    }

    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };
    }

    try {
        const { topic, hookType, duration } = JSON.parse(event.body || '{}');
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const hookGuides = {
            question: 'Start with a provocative question that the viewer MUST know the answer to. Make them feel like they\'re missing out if they scroll away.',
            statistic: 'Open with a shocking statistic or number that seems unbelievable. Make it specific and memorable.',
            story: 'Start mid-story with immediate intrigue. "So there I was..." or "Last week something crazy happened..."',
            controversy: 'Challenge a widely-held belief. "Everyone thinks X but they\'re wrong because..."',
            promise: 'Make a bold promise about what the viewer will learn or gain. "By the end of this video, you\'ll..."',
            pov: 'Use POV format to put the viewer in a relatable situation. "POV: You just discovered..."'
        };

        const durationGuides = {
            short: '1-2 sentences, under 3 seconds to say',
            medium: '2-3 sentences, about 5 seconds to say',
            long: '3-4 sentences, about 10 seconds to say'
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
                        content: `You are an expert at writing viral video hooks that stop the scroll. Generate EXACTLY 5 unique hooks.

HOOK STYLE: ${hookGuides[hookType] || hookGuides.question}
LENGTH: ${durationGuides[duration] || durationGuides.short}

Rules:
- Each hook must grab attention IMMEDIATELY
- Use pattern interrupts and curiosity gaps
- Make the viewer feel they MUST keep watching
- Sound natural and conversational, not salesy
- DO NOT number them or add explanations
- Return ONLY the hooks, one per line
- Use CAPS or emphasis naturally for impact`
                    },
                    {
                        role: 'user',
                        content: `Generate 5 scroll-stopping ${hookType} hooks for a video about: "${topic}"`
                    }
                ],
                temperature: 0.9,
                max_tokens: 600
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to generate hooks');
        }

        const content = data.choices[0]?.message?.content || '';
        const hooks = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 10 && !line.match(/^\d+[\.\)]/))
            .map(line => line.replace(/^[-•*]\s*/, '').replace(/^["']|["']$/g, ''))
            .slice(0, 5);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ hooks })
        };

    } catch (error) {
        console.error('Generate hooks error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to generate hooks' })
        };
    }
}
