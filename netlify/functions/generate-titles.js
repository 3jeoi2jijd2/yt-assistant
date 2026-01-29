// Generate viral titles using Groq AI

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
        const { topic, platform, style } = JSON.parse(event.body || '{}');
        const apiKey = process.env.GROQ_API_KEY;

        if (!apiKey) {
            throw new Error('API key not configured');
        }

        const styleGuides = {
            curiosity: 'Create titles with curiosity gaps that make viewers NEED to click. Use phrases like "What happens when...", "The truth about...", "Nobody is talking about..."',
            listicle: 'Create numbered list titles like "7 Ways to...", "10 Mistakes That...", "5 Secrets to..."',
            howto: 'Create educational titles like "How to...", "The Ultimate Guide to...", "Learn to..."',
            controversial: 'Create bold, provocative titles that challenge common beliefs. Use phrases like "Why everyone is wrong about...", "The lie about..."',
            emotional: 'Create emotionally charged titles that connect with feelings. Use words like "heartbreaking", "life-changing", "incredible"',
            urgency: 'Create time-sensitive titles with urgency. Use phrases like "Before it\'s too late", "You need to know this NOW", "Stop doing this immediately"'
        };

        const platformGuides = {
            youtube: 'Optimize for YouTube search. Keep under 60 characters. Front-load keywords.',
            tiktok: 'Make it punchy and scroll-stopping. Gen Z style. Use caps strategically.',
            instagram: 'Keep it clean and aspirational. Works well with emojis.',
            shorts: 'Ultra short and punchy. Maximum impact in minimum words.'
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
                        content: `You are an expert viral title writer for social media. Generate EXACTLY 8 unique, click-worthy titles.

STYLE GUIDE: ${styleGuides[style] || styleGuides.curiosity}
PLATFORM: ${platformGuides[platform] || platformGuides.youtube}

Rules:
- Each title must be unique and different angle
- Make them scroll-stopping and click-worthy
- Use power words and emotional triggers
- DO NOT number them or add explanations
- Return ONLY the titles, one per line`
                    },
                    {
                        role: 'user',
                        content: `Generate 8 viral ${style} titles for: "${topic}"`
                    }
                ],
                temperature: 0.9,
                max_tokens: 500
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error?.message || 'Failed to generate titles');
        }

        const content = data.choices[0]?.message?.content || '';
        const titles = content.split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/))
            .map(line => line.replace(/^[-•*]\s*/, '').replace(/^["']|["']$/g, ''))
            .slice(0, 8);

        return {
            statusCode: 200,
            headers,
            body: JSON.stringify({ titles })
        };

    } catch (error) {
        console.error('Generate titles error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: error.message || 'Failed to generate titles' })
        };
    }
}
